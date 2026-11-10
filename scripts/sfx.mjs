// Mixes sound effects into the narration and continuation recordings.
//
//   npm run sfx                              everything listed in content/sfx-cues.json
//   npm run sfx -- --file day-10/continuation   one file
//   npm run sfx -- --check                 only check that every cue's phrase is in the text (free)
//   npm run sfx -- --fetch-only              only generate sounds and timings (needs ELEVENLABS_API_KEY)
//   npm run sfx -- --mix-only                only mix from what is already there (needs ffmpeg)
//
// Three steps per file, each skipped when its result is already up to date:
//   1. Sounds: every sound in "sounds" is generated once with ElevenLabs Sound Effects into
//      content/sfx/gen/<name>.mp3. A sound with "file" instead of "prompt" is your own recording
//      (e.g. the real Fanny) and is used as it is.
//   2. Timings: ElevenLabs Forced Alignment returns the time of every word in the existing recording
//      (content/sfx/alignment/). The recording itself is not regenerated.
//   3. Mix: ffmpeg lays each cue at the phrase it is anchored to ("at") and writes the result to
//      content/sfx/preview/. The recordings in public/media are never changed by this script.
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseTexts } from './parse-texts.mjs';
import { speakable } from './speech.mjs';

const args = process.argv.slice(2);
const flag = (n) => args.includes(`--${n}`);
const opt = (n) => { const i = args.indexOf(`--${n}`); return i >= 0 ? args[i + 1] : undefined; };
const P = (rel) => fileURLToPath(new URL(`../${rel}`, import.meta.url));
const readJson = (rel) => JSON.parse(readFileSync(P(rel), 'utf8'));
const writeJson = (rel, v) => { mkdirSync(dirname(P(rel)), { recursive: true }); writeFileSync(P(rel), JSON.stringify(v, null, 2) + '\n'); };
const sha = (v) => createHash('sha256').update(v).digest('hex').slice(0, 16);

const VOICE_DIR = 'public/media'; // the recordings without effects
const OUT_DIR = 'content/sfx/preview';
const GEN_MANIFEST = 'content/sfx/gen/manifest.json';

const cues = readJson('content/sfx-cues.json');
const tts = readJson('content/tts-settings.json');
const KEY = process.env.ELEVENLABS_API_KEY;
const canFetch = !flag('mix-only') && !!KEY;
const wantMix = !flag('fetch-only');
const onlyFile = opt('file');
const hasFfmpeg = spawnSync('ffmpeg', ['-version'], { stdio: 'ignore' }).status === 0;
const genManifest = existsSync(P(GEN_MANIFEST)) ? readJson(GEN_MANIFEST) : {};

async function ensureSound(name) {
  const def = cues.sounds[name];
  if (!def) throw new Error(`sfx-cues.json: unknown sound "${name}"`);
  if (def.file) {
    if (!existsSync(P(def.file))) throw new Error(`sfx-cues.json: ${def.file} (sound "${name}") does not exist`);
    return P(def.file);
  }
  const rel = `content/sfx/gen/${name}.mp3`;
  const body = { text: def.prompt, duration_seconds: def.seconds, prompt_influence: def.influence ?? 0.5, loop: !!def.loop };
  const hash = sha(JSON.stringify(body));
  if (existsSync(P(rel)) && genManifest[name]?.hash === hash) return P(rel);
  if (!canFetch) return null;
  const res = await fetch('https://api.elevenlabs.io/v1/sound-generation?output_format=mp3_44100_128', {
    method: 'POST',
    headers: { 'xi-api-key': KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`ElevenLabs sound-generation ${res.status} for "${name}": ${(await res.text()).slice(0, 300)}`);
  mkdirSync(dirname(P(rel)), { recursive: true });
  writeFileSync(P(rel), Buffer.from(await res.arrayBuffer()));
  genManifest[name] = { hash, ...body, generated: new Date().toISOString() };
  writeJson(GEN_MANIFEST, genManifest);
  console.log(`  sound "${name}" generated`);
  return P(rel);
}

async function ensureAlignment(key, text) {
  const audio = readFileSync(P(`${VOICE_DIR}/${key}.mp3`));
  const hash = sha(Buffer.concat([audio, Buffer.from(text)]));
  const rel = `content/sfx/alignment/${key.replace('/', '-')}.json`;
  if (existsSync(P(rel))) {
    const saved = readJson(rel);
    if (saved.hash === hash) return saved.words;
  }
  if (!canFetch) return null;
  const form = new FormData();
  form.append('file', new Blob([audio], { type: 'audio/mpeg' }), 'audio.mp3');
  form.append('text', text);
  const res = await fetch('https://api.elevenlabs.io/v1/forced-alignment', { method: 'POST', headers: { 'xi-api-key': KEY }, body: form });
  if (!res.ok) throw new Error(`ElevenLabs forced-alignment ${res.status} for ${key}: ${(await res.text()).slice(0, 300)}`);
  const json = await res.json();
  const words = json.words.map((w) => ({ text: w.text, start: w.start, end: w.end }));
  writeJson(rel, { hash, loss: json.loss, words });
  console.log(`  timings for ${key} fetched (${words.length} words)`);
  return words;
}

const norm = (s) => s.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '');
/** Start and end time of a phrase in the recording. */
function locate(words, phrase, key) {
  if (phrase === 'start') return { start: 0, end: 0 };
  const tokens = words.map((w) => ({ ...w, n: norm(w.text) })).filter((w) => w.n);
  const want = speakable(phrase, tts.pronunciations).split(/\s+/).map(norm).filter(Boolean);
  for (let i = 0; i + want.length <= tokens.length; i++) {
    if (want.every((w, k) => tokens[i + k].n === w)) return { start: tokens[i].start, end: tokens[i + want.length - 1].end };
  }
  throw new Error(`${key}: phrase not found in the recording's text: "${phrase}"`);
}

function duration(file) {
  const r = spawnSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', file], { encoding: 'utf8' });
  const d = Number(r.stdout?.trim());
  if (!Number.isFinite(d)) throw new Error(`ffprobe could not read ${file}`);
  return d;
}

const levels = new Map();
/** Average level (dB) of a file's audible part, so quiet and loud sounds can be matched to the voice. */
function level(file) {
  if (levels.has(file)) return levels.get(file);
  const trim = 'silenceremove=start_periods=1:start_threshold=-50dB:stop_periods=-1:stop_threshold=-50dB:stop_duration=0.2';
  const r = spawnSync('ffmpeg', ['-hide_banner', '-i', file, '-af', `${trim},volumedetect`, '-f', 'null', '-'], { encoding: 'utf8' });
  const m = r.stderr.match(/mean_volume: (-?[\d.]+) dB/);
  if (!m) throw new Error(`ffmpeg could not measure the level of ${file}`);
  levels.set(file, Number(m[1]));
  return Number(m[1]);
}

function mix(key, words, soundFiles) {
  const voice = P(`${VOICE_DIR}/${key}.mp3`);
  const voiceDur = duration(voice);
  const voiceLevel = level(voice);
  const parts = [];
  for (const c of cues.files[key]) {
    const file = soundFiles[c.sound];
    // "gain" is relative to the voice: the sound is first brought to the voice's average level
    const match = voiceLevel - level(file);
    const anchor = locate(words, c.at, key);
    const t = (c.edge === 'end' ? anchor.end : anchor.start) + (c.offset ?? 0);
    const gain = c.gain ?? -12;
    if (c.to) {
      // a bed: looped from "at" to "to" (a phrase, or "end" for the end of the recording)
      const end = c.to === 'end' ? voiceDur : locate(words, c.to, key).end;
      parts.push({ file, at: t, gain, match, loop: true, len: end - t, fadeIn: c.fadeIn ?? 1, fadeOut: c.fadeOut ?? 1.5 });
      continue;
    }
    const n = c.repeat?.count ?? 1;
    const every = c.repeat?.every ?? 0;
    const first = c.repeat?.anchor === 'last' ? t - (n - 1) * every : t;
    const len = c.trim ?? duration(file);
    for (let k = 0; k < n; k++) {
      const g = n > 1 && c.repeat.gainFrom != null ? c.repeat.gainFrom + ((gain - c.repeat.gainFrom) * k) / (n - 1) : gain;
      parts.push({ file, at: Math.max(0, first + k * every), gain: g, match, loop: false, len, fadeIn: 0.01, fadeOut: c.trim ? 0.4 : 0.05 });
    }
  }
  const total = Math.max(voiceDur, ...parts.map((p) => p.at + p.len)) + 0.2;
  const fmt = 'aformat=sample_fmts=fltp:sample_rates=44100:channel_layouts=mono';
  const ff = ['-hide_banner', '-loglevel', 'error', '-y', '-i', voice];
  const filters = [`[0:a]${fmt},apad=whole_dur=${total.toFixed(3)}[v]`];
  parts.forEach((p, i) => {
    if (p.loop) ff.push('-stream_loop', '-1');
    ff.push('-i', p.file);
    const fi = Math.min(p.fadeIn, p.len / 2);
    const fo = Math.min(p.fadeOut, p.len / 2);
    filters.push(
      `[${i + 1}:a]${fmt},atrim=0:${p.len.toFixed(3)},afade=t=in:d=${fi.toFixed(3)},afade=t=out:st=${(p.len - fo).toFixed(3)}:d=${fo.toFixed(3)},` +
      `volume=${(p.gain + p.match).toFixed(1)}dB,adelay=${Math.round(p.at * 1000)}:all=1[s${i}]`,
    );
  });
  filters.push(`[v]${parts.map((_, i) => `[s${i}]`).join('')}amix=inputs=${parts.length + 1}:duration=first:normalize=0,alimiter=limit=0.95[out]`);
  const out = P(`${OUT_DIR}/${key.replace('/', '-')}.mp3`);
  mkdirSync(dirname(out), { recursive: true });
  ff.push('-filter_complex', filters.join(';'), '-map', '[out]', '-ac', '1', '-ar', '44100', '-b:a', '128k', out);
  const r = spawnSync('ffmpeg', ff, { encoding: 'utf8' });
  if (r.status !== 0) throw new Error(`ffmpeg failed for ${key}: ${r.stderr}`);
  console.log(`✓ ${OUT_DIR}/${key.replace('/', '-')}.mp3  ${total.toFixed(1)} s (voice ${voiceDur.toFixed(1)} s), ${parts.length} sound(s)`);
  for (const p of parts.slice().sort((a, b) => a.at - b.at)) console.log(`    ${p.at.toFixed(1).padStart(6)} s  ${p.file.split('/').pop().replace('.mp3', '').padEnd(14)} ${p.gain.toFixed(0)} dB to the voice${p.loop ? `  (bed, ${p.len.toFixed(1)} s)` : ''}`);
}

const days = parseTexts();
const textOf = (key) => {
  const m = key.match(/^day-(\d+)\/(narration|continuation)$/);
  if (!m) throw new Error(`sfx-cues.json: "${key}" must look like day-10/continuation`);
  return speakable(days[Number(m[1])][m[2]].join('\n\n'), tts.pronunciations);
};
// Before anything is generated: every phrase must be in its text and every sound defined.
const problems = [];
for (const key of Object.keys(cues.files)) {
  const asWords = textOf(key).split(/\s+/).map((w) => ({ text: w, start: 0, end: 0 }));
  for (const c of cues.files[key]) {
    if (!cues.sounds[c.sound]) problems.push(`${key}: unknown sound "${c.sound}"`);
    for (const phrase of [c.at, c.to].filter((x) => x && x !== 'end')) {
      try { locate(asWords, phrase, key); } catch (e) { problems.push(e.message); }
    }
  }
}
if (problems.length) { console.error(problems.join('\n')); process.exit(1); }
if (flag('check')) { console.log(`All phrases found: ${Object.keys(cues.files).length} recordings, ${Object.values(cues.files).flat().length} cues, ${Object.keys(cues.sounds).length} sounds.`); process.exit(0); }
let waiting = 0;
for (const key of Object.keys(cues.files)) {
  if (onlyFile && key !== onlyFile) continue;
  const text = textOf(key);
  const soundFiles = {};
  const missing = [];
  for (const name of new Set(cues.files[key].map((c) => c.sound))) {
    const f = await ensureSound(name);
    if (f) soundFiles[name] = f; else missing.push(name);
  }
  const words = await ensureAlignment(key, text);
  if (missing.length || !words) {
    waiting++;
    console.log(`… ${key}: still needs ${[...missing.map((s) => `sound "${s}"`), ...(words ? [] : ['timings'])].join(', ')}`);
    continue;
  }
  if (!wantMix) continue;
  if (!hasFfmpeg) { waiting++; console.log(`… ${key}: sounds and timings are ready, but ffmpeg is not installed here, so nothing was mixed`); continue; }
  mix(key, words, soundFiles);
}
if (waiting && !KEY && !flag('mix-only')) console.log('\nELEVENLABS_API_KEY is not set (.env), so nothing could be generated.');
