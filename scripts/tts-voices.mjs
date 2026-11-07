// Generates the spoken statements of 'voices' widgets (e.g. day 5) with one ElevenLabs
// voice per character: public/media/day-NN/voice-1.mp3, voice-2.mp3, … in the order of
// the statements in src/game/config.ts. Voices: content/character-voices.json.
//
//   npm run tts:voices                 missing or changed files
//   npm run tts:voices -- --dry-run    only list what would be generated
//   npm run tts:voices -- --force      regenerate everything
//
// Shares content/tts-settings.json (model, seed, format, voice settings) and
// content/audio-manifest.json with scripts/tts.mjs.
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { CONFIG } from '../src/game/config.ts';
import { speakable } from './speech.mjs';

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const force = args.includes('--force');

const API_KEY = process.env.ELEVENLABS_API_KEY;
if (!dryRun && !API_KEY) {
  console.error('Set ELEVENLABS_API_KEY in .env.');
  process.exit(1);
}
const read = (p) => JSON.parse(readFileSync(new URL(p, import.meta.url), 'utf8'));
const settings = read('../content/tts-settings.json');
const MODEL = process.env.ELEVENLABS_MODEL || settings.model;
const { characters } = read('../content/character-voices.json');

const manifestUrl = new URL('../content/audio-manifest.json', import.meta.url);
const manifest = existsSync(manifestUrl) ? JSON.parse(readFileSync(manifestUrl, 'utf8')) : {};
const saveManifest = () => writeFileSync(manifestUrl, JSON.stringify(manifest, null, 2) + '\n');

const jobs = [];
for (const [num, cfg] of Object.entries(CONFIG)) {
  if (cfg.widget?.type !== 'voices') continue;
  cfg.widget.statements.forEach((s, i) => {
    const c = characters[s.name];
    if (!c) throw new Error(`content/character-voices.json: no voice for "${s.name}"`);
    const voiceSettings = { ...settings.voiceSettings, ...c.voiceSettings };
    const key = `day-${String(num).padStart(2, '0')}/voice-${i + 1}`;
    const file = new URL(`../public/media/${key}.mp3`, import.meta.url);
    const text = speakable(s.text, settings.pronunciations);
    const hash = createHash('sha256').update(JSON.stringify([text, c.voiceId, MODEL, voiceSettings, settings.seed, settings.outputFormat])).digest('hex').slice(0, 16);
    if (!force && existsSync(file) && manifest[key]?.hash === hash) return;
    jobs.push({ key, file, text, name: s.name, voice: c, voiceSettings, hash });
  });
}

console.log(`Model ${MODEL}, seed ${settings.seed}`);
console.log(`${jobs.length} file(s), ${jobs.reduce((n, j) => n + j.text.length, 0)} characters`);
for (const j of jobs) console.log(`  ${j.key}.mp3  ${j.name} → ${j.voice.voice}`);
if (dryRun || !jobs.length) process.exit(0);

async function synthesize(j) {
  const url = `https://api.elevenlabs.io/v1/text-to-speech/${j.voice.voiceId}?output_format=${settings.outputFormat}`;
  for (let attempt = 1; ; attempt++) {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'xi-api-key': API_KEY, 'Content-Type': 'application/json', Accept: 'audio/mpeg' },
      body: JSON.stringify({ text: j.text, model_id: MODEL, voice_settings: j.voiceSettings, seed: settings.seed }),
    });
    if (res.ok) return Buffer.from(await res.arrayBuffer());
    if ((res.status === 429 || res.status >= 500) && attempt < 4) {
      await new Promise((r) => setTimeout(r, attempt * 3000));
      continue;
    }
    throw new Error(`${j.key}: HTTP ${res.status} ${(await res.text()).slice(0, 300)}`);
  }
}

for (const j of jobs) {
  const audio = await synthesize(j);
  mkdirSync(new URL('.', j.file), { recursive: true });
  const tmp = new URL(j.file.href + '.tmp');
  writeFileSync(tmp, audio);
  renameSync(tmp, j.file);
  manifest[j.key] = { hash: j.hash, voice: j.voice.voiceId, voiceName: j.voice.voice, model: MODEL, seed: settings.seed, voiceSettings: j.voiceSettings, chars: j.text.length, generated: new Date().toISOString() };
  saveManifest();
  console.log(`✓ ${j.key}.mp3 (${Math.round(audio.length / 1024)} KB)`);
}
