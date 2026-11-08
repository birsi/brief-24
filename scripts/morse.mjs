// Builds public/media/day-22/morse.mp3: the clockwork ticking of day 22 in morse code.
//
//   npm run tts:morse                    build if missing or changed
//   npm run tts:morse -- --force         rebuild
//   npm run tts:morse -- --new-takes     generate fresh sound takes (replaces content/sfx/morse-*.wav)
//
// Sounds: with "sources" in content/morse-settings.json, one sound is cut from each real recording (any WAV:
// mono/stereo, 16/24/32 bit, any sample rate) – a clock tick for dots, a spring wind-up for dashes. Without
// "sources", ElevenLabs Sound Effects takes are generated once into content/sfx/morse-tick-1.wav … (needs
// ELEVENLABS_API_KEY). The sounds are cut to the lengths in the settings, laid out as the morse pattern from
// src/game/config.ts (day 22), given a small echo and written as mp3.
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { CONFIG } from '../src/game/config.ts';
import { encodeMp3 } from './mp3.mjs';

const SR = 44100;
const args = process.argv.slice(2);
const force = args.includes('--force');
const newTakes = args.includes('--new-takes');
const settings = JSON.parse(readFileSync(new URL('../content/morse-settings.json', import.meta.url), 'utf8'));
const { timing: T, samples: S, echo: E } = settings;
const widget = CONFIG[22].widget;
if (widget?.type !== 'morse') throw new Error('Day 22 has no morse widget in src/game/config.ts');
const pattern = widget.pattern;

const sfxUrl = (kind, take) => new URL(`../content/sfx/morse-${kind}-${take}.wav`, import.meta.url);

function writeWav(url, samples) {
  const data = Buffer.alloc(samples.length * 2);
  samples.forEach((v, i) => data.writeInt16LE(Math.max(-32768, Math.min(32767, Math.round(v * 32767))), i * 2));
  const h = Buffer.alloc(44);
  h.write('RIFF', 0); h.writeUInt32LE(36 + data.length, 4); h.write('WAVEfmt ', 8); h.writeUInt32LE(16, 16);
  h.writeUInt16LE(1, 20); h.writeUInt16LE(1, 22); h.writeUInt32LE(SR, 24); h.writeUInt32LE(SR * 2, 28);
  h.writeUInt16LE(2, 32); h.writeUInt16LE(16, 34); h.write('data', 36); h.writeUInt32LE(data.length, 40);
  writeFileSync(url, Buffer.concat([h, data]));
}
/** Reads any PCM/float WAV, mixes it to mono and resamples it to SR. */
function readWav(url) {
  const b = readFileSync(url);
  let p = 12, fmt, data;
  while (p < b.length - 8) {
    const id = b.toString('ascii', p, p + 4), size = b.readUInt32LE(p + 4);
    if (id === 'fmt ') fmt = { format: b.readUInt16LE(p + 8), ch: b.readUInt16LE(p + 10), sr: b.readUInt32LE(p + 12), bits: b.readUInt16LE(p + 22) };
    if (id === 'data') data = b.subarray(p + 8, p + 8 + size);
    p += 8 + size + (size & 1);
  }
  if (!fmt || !data) throw new Error(`${url.pathname}: not a WAV file`);
  const float = fmt.format === 3 || (fmt.format === 0xfffe && fmt.bits === 32);
  const bps = fmt.bits / 8, frames = Math.floor(data.length / (bps * fmt.ch));
  const mono = new Float32Array(frames);
  for (let i = 0; i < frames; i++) {
    let sum = 0;
    for (let c = 0; c < fmt.ch; c++) {
      const o = (i * fmt.ch + c) * bps;
      sum += float ? data.readFloatLE(o) : fmt.bits === 16 ? data.readInt16LE(o) / 32768 : fmt.bits === 24 ? data.readIntLE(o, 3) / 8388608 : fmt.bits === 32 ? data.readInt32LE(o) / 2147483648 : (data[o] - 128) / 128;
    }
    mono[i] = sum / fmt.ch;
  }
  if (fmt.sr === SR) return mono;
  const ratio = fmt.sr / SR, out = new Float32Array(Math.floor(frames / ratio));
  for (let i = 0; i < out.length; i++) {
    const x = i * ratio, k = Math.floor(x), f = x - k;
    out[i] = mono[k] * (1 - f) + (mono[Math.min(k + 1, frames - 1)] ?? 0) * f;
  }
  return out;
}

// 1. Raw sound takes (only the missing ones, or all with --new-takes)
mkdirSync(new URL('../content/sfx/', import.meta.url), { recursive: true });
const missing = [];
if (!settings.sources) for (const kind of ['tick', 'long']) for (let take = 1; take <= S.takes; take++) if (newTakes || !existsSync(sfxUrl(kind, take))) missing.push({ kind, take });
if (missing.length) {
  if (!process.env.ELEVENLABS_API_KEY) { console.error('Set ELEVENLABS_API_KEY in .env.'); process.exit(1); }
  for (const { kind, take } of missing) {
    const res = await fetch(`https://api.elevenlabs.io/v1/sound-generation?output_format=pcm_${SR}`, {
      method: 'POST',
      headers: { 'xi-api-key': process.env.ELEVENLABS_API_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: S[kind], duration_seconds: 1, prompt_influence: 0.7 }),
    });
    if (!res.ok) throw new Error(`Sound generation ${res.status}: ${(await res.text()).slice(0, 300)}`);
    const pcm = Buffer.from(await res.arrayBuffer());
    writeWav(sfxUrl(kind, take), Float32Array.from({ length: pcm.length >> 1 }, (_, i) => pcm.readInt16LE(i * 2) / 32768));
    console.log(`✓ content/sfx/morse-${kind}-${take}.wav`);
  }
}

// 2. Cut: start right at the hit (the first one after `from` seconds), fixed length, soft fade-out, level-matched
function cut(samples, seconds, fadeOut, from = 0) {
  const s0 = Math.round(from * SR);
  const region = samples.subarray(s0, s0 + Math.round(0.3 * SR));
  const peak = region.reduce((m, v) => Math.max(m, Math.abs(v)), 0) || 1;
  let start = s0 + region.findIndex((v) => Math.abs(v) > peak * 0.3);
  start = Math.max(0, start - Math.round(0.003 * SR));
  const len = Math.round(seconds * SR);
  const out = new Float32Array(len);
  for (let i = 0; i < len && start + i < samples.length; i++) out[i] = samples[start + i];
  const fi = Math.round(0.002 * SR), fo = Math.round(fadeOut * SR);
  for (let i = 0; i < fi; i++) out[i] *= i / fi;
  for (let i = 0; i < fo; i++) out[len - 1 - i] *= i / fo;
  const p = out.reduce((m, v) => Math.max(m, Math.abs(v)), 0) || 1;
  return out.map((v) => (v / p) * 0.8);
}
const src = settings.sources;
const fileUrl = (f) => new URL(`../${f}`, import.meta.url);
const ticks = src ? [cut(readWav(fileUrl(src.tick.file)), T.dot, 0.04, src.tick.at ?? 0)] : settings.use.tick.map((t) => cut(readWav(sfxUrl('tick', t)), T.dot, 0.04));
const longs = src ? [cut(readWav(fileUrl(src.long.file)), T.dash, 0.08, src.long.at ?? 0)] : settings.use.long.map((t) => cut(readWav(sfxUrl('long', t)), T.dash, 0.12));

// 3. Lay out the pattern
const events = [];
let t = T.leadIn;
let nDot = 0, nDash = 0;
for (let r = 0; r < T.repeat; r++) {
  for (const ch of pattern) {
    if (ch === '.') { events.push({ at: t, s: ticks[nDot++ % ticks.length] }); t += T.dot + T.symbolGap; }
    else if (ch === '-') { events.push({ at: t, s: longs[nDash++ % longs.length] }); t += T.dash + T.symbolGap; }
    else if (ch === ' ') t += T.letterGap - T.symbolGap;
  }
  t += T.letterGap;
}
const total = Math.round((t + T.tail) * SR);
const dry = new Float32Array(total);
for (const e of events) { const at = Math.round(e.at * SR); e.s.forEach((v, i) => { if (at + i < total) dry[at + i] += v; }); }

// 4. Small echo: a feedback delay that gets darker with each repeat
const d = Math.round(E.delay * SR);
const echo = new Float32Array(total);
let lp = 0;
for (let i = d; i < total; i++) {
  const fed = dry[i - d] + E.feedback * echo[i - d];
  lp += 0.45 * (fed - lp); // one-pole lowpass in the loop
  echo[i] = lp;
}
const mix = Float32Array.from(dry, (v, i) => v + E.wet * echo[i]);
const peak = mix.reduce((m, v) => Math.max(m, Math.abs(v)), 0);
const out = mix.map((v) => (v / peak) * 0.89);

// 5. Write (unless nothing changed)
const key = 'day-22/morse';
const file = new URL('../public/media/day-22/morse.mp3', import.meta.url);
const manifestUrl = new URL('../content/audio-manifest.json', import.meta.url);
const manifest = existsSync(manifestUrl) ? JSON.parse(readFileSync(manifestUrl, 'utf8')) : {};
const usedFiles = src ? [src.tick.file, src.long.file].map(fileUrl) : [...settings.use.tick.map((x) => sfxUrl('tick', x)), ...settings.use.long.map((x) => sfxUrl('long', x))];
const sampleDigest = usedFiles.map((u) => createHash('sha256').update(readFileSync(u)).digest('hex').slice(0, 8));
const hash = createHash('sha256').update(JSON.stringify([SR, pattern, T, E, src ?? settings.use, sampleDigest])).digest('hex').slice(0, 16);
if (!force && !newTakes && existsSync(file) && manifest[key]?.hash === hash) { console.log('morse.mp3 is up to date'); process.exit(0); }
mkdirSync(new URL('.', file), { recursive: true });
const mp3 = encodeMp3(out, SR, 128);
const tmp = new URL(file.href + '.tmp');
writeFileSync(tmp, mp3);
renameSync(tmp, file);
manifest[key] = { hash, pattern, timing: T, echo: E, sounds: src ? { tick: src.tick, long: src.long } : settings.use, generated: new Date().toISOString() };
writeFileSync(manifestUrl, JSON.stringify(manifest, null, 2) + '\n');
console.log(`✓ ${key}.mp3  ${(total / SR).toFixed(1)} s, ${events.length} signals, ${(mp3.length / 1024).toFixed(0)} KB`);
