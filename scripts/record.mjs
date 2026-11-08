// Generates public/media/day-19/record.mp3: the gramophone record of 1926 ("Aufnahme 1224").
// The line is spoken with ElevenLabs (Larissa's voice) and then made to sound like a shellac record:
// band-limited horn sound, light saturation, surface hiss, crackle, pops and the soft tick of the
// groove once per revolution, plus a needle drop at the start and the run-out groove at the end.
//
//   npm run tts:record               generate if missing or changed
//   npm run tts:record -- --force    regenerate
//
// Settings (voice, text, effect levels): content/record-effect.json. Needs ELEVENLABS_API_KEY in .env.
// The voice is requested as raw PCM (output_format pcm_24000), processed here in plain JavaScript and
// encoded to mp3 with lamejs, so no ffmpeg is needed.
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { speakable } from './speech.mjs';

import { encodeMp3 } from './mp3.mjs';
const force = process.argv.includes('--force');
const SR = 24000; // plenty for a band-limited gramophone sound, and available on every ElevenLabs plan (pcm_44100 is Pro only)
const read = (p) => JSON.parse(readFileSync(new URL(p, import.meta.url), 'utf8'));
const fx = read('../content/record-effect.json');
const tts = read('../content/tts-settings.json');
const voice = read('../content/character-voices.json').characters[fx.character];
if (!voice) throw new Error(`content/character-voices.json: no voice for "${fx.character}"`);
const MODEL = process.env.ELEVENLABS_MODEL || tts.model;
const voiceSettings = { ...tts.voiceSettings, ...voice.voiceSettings, ...fx.voiceSettings };

const key = 'day-19/record';
const file = new URL('../public/media/day-19/record.mp3', import.meta.url);
const manifestUrl = new URL('../content/audio-manifest.json', import.meta.url);
const manifest = existsSync(manifestUrl) ? JSON.parse(readFileSync(manifestUrl, 'utf8')) : {};
const text = speakable(fx.text, tts.pronunciations);
const hash = createHash('sha256').update(JSON.stringify([text, voice.voiceId, MODEL, voiceSettings, tts.seed, fx])).digest('hex').slice(0, 16);
if (!force && existsSync(file) && manifest[key]?.hash === hash) { console.log('record.mp3 is up to date'); process.exit(0); }
if (!process.env.ELEVENLABS_API_KEY) { console.error('Set ELEVENLABS_API_KEY in .env.'); process.exit(1); }

// 1. The voice as 16-bit PCM
const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voice.voiceId}?output_format=pcm_${SR}`, {
  method: 'POST',
  headers: { 'xi-api-key': process.env.ELEVENLABS_API_KEY, 'Content-Type': 'application/json' },
  body: JSON.stringify({ text, model_id: MODEL, voice_settings: voiceSettings, seed: tts.seed }),
});
if (!res.ok) throw new Error(`ElevenLabs ${res.status}: ${(await res.text()).slice(0, 300)}`);
const pcm = Buffer.from(await res.arrayBuffer());
let voiceSamples = Float32Array.from({ length: Math.floor(pcm.length / 2) }, (_, i) => pcm.readInt16LE(i * 2) / 32768);

// 2. Helpers: deterministic random numbers and RBJ biquad filters
function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = rng(fx.seed);
function biquad(type, f0, q, x) {
  const w = (2 * Math.PI * f0) / SR, cos = Math.cos(w), alpha = Math.sin(w) / (2 * q);
  let b0, b1, b2;
  if (type === 'lp') { b0 = (1 - cos) / 2; b1 = 1 - cos; b2 = b0; }
  else if (type === 'hp') { b0 = (1 + cos) / 2; b1 = -(1 + cos); b2 = b0; }
  else { b0 = alpha; b1 = 0; b2 = -alpha; } // bandpass
  const a0 = 1 + alpha, a1 = -2 * cos, a2 = 1 - alpha;
  const out = new Float32Array(x.length);
  let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
  for (let i = 0; i < x.length; i++) {
    const y = (b0 * x[i] + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2) / a0;
    x2 = x1; x1 = x[i]; y2 = y1; y1 = y;
    out[i] = y;
  }
  return out;
}

// 3. Gramophone sound: narrow band like an acoustic horn, a touch of warm saturation
const g = fx.gramophone;
voiceSamples = biquad('hp', g.highpassHz, 0.7, voiceSamples);
voiceSamples = biquad('lp', g.lowpassHz, 0.8, biquad('lp', g.lowpassHz, 0.8, voiceSamples));
const norm = Math.tanh(g.drive);
voiceSamples = voiceSamples.map((v) => Math.tanh(v * g.drive) / norm);

// 4. Surface noise over lead-in + voice + tail
const lead = Math.round(fx.leadInSeconds * SR), tail = Math.round(fx.tailSeconds * SR);
const N = lead + voiceSamples.length + tail;
const n = fx.noise;
const noise = new Float32Array(N);

// hiss: band-limited noise that breathes slowly
const white = Float32Array.from({ length: N }, () => rand() * 2 - 1);
const hiss = biquad('hp', 600, 0.7, biquad('lp', 5500, 0.7, white));
for (let i = 0; i < N; i++) noise[i] += hiss[i] * n.hiss * (1 + 0.35 * Math.sin((2 * Math.PI * i) / (SR * 3.1)));

// a click: a short burst of decaying noise
function click(at, amp, tauSamples, lowpass = false) {
  const len = Math.min(Math.round(tauSamples * 5), N - at);
  let burst = Float32Array.from({ length: len }, (_, k) => (rand() * 2 - 1) * Math.exp(-k / tauSamples));
  if (lowpass) burst = biquad('lp', 1800, 0.7, burst);
  for (let k = 0; k < len; k++) noise[at + k] += burst[k] * amp * (rand() < 0.5 ? -1 : 1);
}
// crackle (many small ticks, a few louder) and pops
for (let i = 0; i < N; i++) {
  if (rand() < n.crackleRate / SR) click(i, n.crackleLevel * rand() ** 3 * 1.6 + 0.01, 6 + rand() * 30);
  if (rand() < n.popRate / SR) click(i, n.popLevel * (0.4 + rand() * 0.6), 60 + rand() * 120, true);
}
// once per revolution the needle passes the same tiny scratch: a soft regular tick
const revSamples = Math.round((60 / n.rpm) * SR);
for (let i = Math.round(revSamples * 0.35); i < N; i += revSamples) click(i, n.revolutionTick, 120, true);
// needle drop at the very start
click(Math.round(0.35 * SR), 0.3, 450, true);
click(Math.round(0.37 * SR), 0.12, 20);

// 5. Mix, short fade-out, normalise, encode
const mix = new Float32Array(N);
for (let i = 0; i < N; i++) mix[i] = noise[i] + (i >= lead && i < lead + voiceSamples.length ? voiceSamples[i - lead] : 0);
const fade = Math.round(0.4 * SR);
for (let i = 0; i < fade; i++) mix[N - 1 - i] *= i / fade;
const peak = mix.reduce((m, v) => Math.max(m, Math.abs(v)), 0);
const out = Float32Array.from(mix, (v) => (v / peak) * 0.89);
const mp3 = encodeMp3(out, SR, 96);

mkdirSync(new URL('.', file), { recursive: true });
const tmp = new URL(file.href + '.tmp');
writeFileSync(tmp, mp3);
renameSync(tmp, file);
manifest[key] = { hash, voice: voice.voiceId, voiceName: voice.voice, model: MODEL, seed: tts.seed, voiceSettings, effect: fx, chars: text.length, generated: new Date().toISOString() };
writeFileSync(manifestUrl, JSON.stringify(manifest, null, 2) + '\n');
console.log(`✓ ${key}.mp3  ${(N / SR).toFixed(1)} s, voice ${(voiceSamples.length / SR).toFixed(1)} s, ${(mp3.length / 1024).toFixed(0)} KB`);
