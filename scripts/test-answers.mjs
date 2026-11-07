// Checks that every answer in content/solutions.json decrypts its day,
// wrong answers fail, and the dev-mode key works.
import { readFileSync } from 'node:fs';
import { webcrypto as crypto } from 'node:crypto';
import { normalize } from './normalize.mjs';

const data = JSON.parse(readFileSync(new URL('../src/generated/days.json', import.meta.url), 'utf8'));
const loes = JSON.parse(readFileSync(new URL('../content/solutions.json', import.meta.url), 'utf8')).days;
const enc = new TextEncoder();
const dec = new TextDecoder();
const b = (s) => Uint8Array.from(Buffer.from(s, 'base64'));
const dev = process.env.DEV_SECRET || 'dev';

async function unwrap(secret, w) {
  try {
    const base = await crypto.subtle.importKey('raw', enc.encode(secret), 'PBKDF2', false, ['deriveKey']);
    const k = await crypto.subtle.deriveKey({ name: 'PBKDF2', salt: b(w.salt), iterations: data.iterations, hash: 'SHA-256' }, base, { name: 'AES-GCM', length: 256 }, false, ['decrypt']);
    return new Uint8Array(await crypto.subtle.decrypt({ name: 'AES-GCM', iv: b(w.iv) }, k, b(w.ct)));
  } catch { return null; }
}
async function open(day, raw) {
  const k = await crypto.subtle.importKey('raw', raw, 'AES-GCM', false, ['decrypt']);
  return JSON.parse(dec.decode(await crypto.subtle.decrypt({ name: 'AES-GCM', iv: b(day.sealed.iv) }, k, b(day.sealed.ct))));
}
async function attempt(day, input) {
  const n = normalize(input);
  for (const w of day.sealed.wraps) {
    const raw = await unwrap(`day${day.num}:${n}`, w);
    if (raw) return open(day, raw);
  }
  return null;
}

let fail = 0;
for (const day of data.days) {
  const l = loes[day.num];
  const variants = [...l.answers, l.answers[0].toLowerCase(), ` ${l.answers[0]} `];
  for (const a of variants) {
    const p = await attempt(day, a);
    if (!p || p.continuation.length === 0) { console.error(`✗ Day ${day.num}: "${a}" does not open`); fail++; }
  }
  if (await attempt(day, 'WRONGANSWER')) { console.error(`✗ Day ${day.num}: wrong answer opens`); fail++; }
  const devRaw = await unwrap(`day${day.num}:dev:${dev}`, day.sealed.devWrap);
  if (!devRaw) { console.error(`✗ Day ${day.num}: dev-mode key does not match`); fail++; }
  for (const k of Object.keys(l.special || {})) {
    const h = Buffer.from(await crypto.subtle.digest('SHA-256', enc.encode(`day${day.num}:${normalize(k)}`))).toString('base64');
    if (!day.special[h]) { console.error(`✗ Day ${day.num}: special answer ${k} missing`); fail++; }
  }
  console.log(`✓ Day ${String(day.num).padStart(2)} ${day.title.padEnd(28)} ${l.answers.join(' / ')}`);
}
// Umlaut variants
for (const [num, a] of [[16, 'Schlüssel'], [17, 'zurück'], [24, 'Larissa Birsak']]) {
  if (!(await attempt(data.days[num - 1], a))) { console.error(`✗ Day ${num}: "${a}" does not open`); fail++; }
}
if (fail) { console.error(`\n${fail} errors`); process.exit(1); }
console.log('\nAll 24 days open with their answers.');
