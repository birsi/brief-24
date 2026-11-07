// Reads content/texts.md (export of the text document) and content/solutions.json
// and generates src/generated/days.json. Continuations, stamps and everything
// that gives away the solution are encrypted with the answer (AES-GCM, key
// derived via PBKDF2 from the normalized answer). In addition, each day has a
// DEV_SECRET encryption for dev mode.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { webcrypto as crypto } from 'node:crypto';
import { normalize } from './normalize.mjs';
import { parseTexts } from './parse-texts.mjs';

const ITER = 120000;
const enc = new TextEncoder();
const b64 = (buf) => Buffer.from(buf).toString('base64');

const devSecret = process.env.DEV_SECRET || 'dev';
if (!process.env.DEV_SECRET) {
  console.warn('[content] DEV_SECRET is not set – dev-mode key is "dev". Please set it on Vercel.');
}

const solutions = JSON.parse(readFileSync(new URL('../content/solutions.json', import.meta.url), 'utf8')).days;
const days = parseTexts();

// ---------- Encryption ----------
async function deriveKey(secret, salt) {
  const base = await crypto.subtle.importKey('raw', enc.encode(secret), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey({ name: 'PBKDF2', salt, iterations: ITER, hash: 'SHA-256' }, base, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
}
async function wrap(secret, rawKey) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const k = await deriveKey(secret, salt);
  const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, k, rawKey);
  return { salt: b64(salt), iv: b64(iv), ct: b64(ct) };
}
async function sha(s) { return b64(await crypto.subtle.digest('SHA-256', enc.encode(s))); }

async function deriveContentKey(num) {
  const k = await crypto.subtle.importKey('raw', enc.encode(devSecret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return new Uint8Array(await crypto.subtle.sign('HMAC', k, enc.encode(`content-key:${num}`)));
}

const out = { iterations: ITER, devCheck: null, days: [] };
for (let num = 1; num <= 24; num++) {
  const d = days[num];
  const l = solutions[String(num)];
  if (!d) throw new Error(`Day ${num} missing in texts.md`);
  if (!l) throw new Error(`Day ${num} missing in solutions.json`);
  if (d.narration.length === 0) console.warn(`[content] Day ${num}: no narration found`);
  if (d.continuation.length === 0) console.warn(`[content] Day ${num}: no continuation found`);

  const payload = {
    continuation: d.continuation,
    solution: l.answers[0],
    stamp: l.stamp || null,
    record: l.record || null,
    epilogue: l.epilogue || null,
  };
  // Deterministic per day (HMAC of DEV_SECRET), so progress saved on a device survives rebuilds.
  const rawKey = await deriveContentKey(num);
  const contentKey = await crypto.subtle.importKey('raw', rawKey, 'AES-GCM', false, ['encrypt']);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, contentKey, enc.encode(JSON.stringify(payload)));

  const variants = [...new Set(l.answers.map(normalize))];
  const wraps = [];
  for (const v of variants) wraps.push(await wrap(`day${num}:${v}`, rawKey));
  const devWrap = await wrap(`day${num}:dev:${devSecret}`, rawKey);

  const special = {};
  for (const [k, msg] of Object.entries(l.special || {})) special[await sha(`day${num}:${normalize(k)}`)] = msg;

  out.days.push({
    num,
    title: d.title,
    meta: d.meta,
    card: d.card,
    narration: d.narration,
    hints: d.hints.slice(0, 2),
    // Hint 3 is the solution: only lightly obfuscated so it does not stand out when skimming.
    hint3: d.hints[2] ? Buffer.from([...d.hints[2]].reverse().join(''), 'utf8').toString('base64') : null,
    video: !!l.video,
    sealed: { iv: b64(iv), ct: b64(ct), wraps, devWrap },
    special,
  });
}
out.devCheck = await wrap(`devcheck:${devSecret}`, enc.encode('ok'));

mkdirSync(new URL('../src/generated/', import.meta.url), { recursive: true });
writeFileSync(new URL('../src/generated/days.json', import.meta.url), JSON.stringify(out));

// Image prompts as a list for media production
const prompts = Object.values(days).map((d) => `Day ${d.num} – ${d.title}\n  Narration: ${d.imageNarration}\n  Resolution: ${d.imageResolution}`).join('\n\n');
writeFileSync(new URL('../content/image-prompts.txt', import.meta.url), prompts + '\n');
console.log(`[content] 24 days generated (${out.days.reduce((s, d) => s + d.narration.length, 0)} narration paragraphs).`);
