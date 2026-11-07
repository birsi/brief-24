// Checks that every answer in content/solutions.json decrypts its day,
// wrong answers fail, and the dev-mode key works. Also checks the notebook figures:
// solve notes decrypt with the day's answer and never appear in plain text in
// src/generated or dist (dist is only checked if it exists, so run it after npm run build).
import { existsSync, readdirSync, readFileSync } from 'node:fs';
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

// ---------- Figures ----------
const figures = JSON.parse(readFileSync(new URL('../content/figures.json', import.meta.url), 'utf8')).figures;
const solveNotes = figures.flatMap((f) => f.notes.filter((n) => n.when === 'solve').map((n) => ({ ...n, figure: f })));
const openNotes = figures.flatMap((f) => f.notes.filter((n) => n.when === 'open').map((n) => ({ ...n, figure: f })));

// Every solve note decrypts with the correct answer of its day.
for (const n of solveNotes) {
  const p = await attempt(data.days[n.day - 1], loes[n.day].answers[0]);
  const hit = p?.figureNotes?.find((x) => x.figure === n.figure.id && x.text === n.text);
  if (!hit || hit.name !== n.figure.name || hit.role !== n.figure.role) { console.error(`✗ Figure ${n.figure.id}, day ${n.day}: solve note does not decrypt`); fail++; }
}
// Every open note is in days.json, exactly once.
for (const n of openNotes) {
  const pub = data.figures.find((f) => f.id === n.figure.id);
  if (pub?.notes.filter((x) => x.day === n.day && x.text === n.text).length !== 1) { console.error(`✗ Figure ${n.figure.id}, day ${n.day}: open note missing in days.json`); fail++; }
}
// Figures without open notes must not be named in days.json.
for (const f of figures) {
  if (!f.notes.some((n) => n.when === 'open') && data.figures.some((x) => x.id === f.id)) { console.error(`✗ Figure ${f.id} has only solve notes but is public in days.json`); fail++; }
}

// No solve text in plain text in src/generated or dist (also checked as JSON-escaped string).
const TEXT = /\.(js|mjs|json|html|css|map|txt|svg)$/;
const files = (dir) => {
  const u = new URL(`../${dir}/`, import.meta.url);
  if (!existsSync(u)) return null;
  return readdirSync(u, { recursive: true }).filter((f) => TEXT.test(f)).map((f) => [`${dir}/${f}`, readFileSync(new URL(f, u), 'utf8')]);
};
const scanned = [];
for (const dir of ['src/generated', 'dist']) {
  const list = files(dir);
  if (!list) { console.warn(`! ${dir}/ does not exist, not checked (run npm run build first)`); continue; }
  scanned.push(dir);
  for (const [name, content] of list) {
    for (const n of solveNotes) {
      const forms = [n.text, JSON.stringify(n.text).slice(1, -1), JSON.stringify(n.text).slice(1, -1).replace(/[^\x00-\x7f]/g, (c) => `\\u${c.charCodeAt(0).toString(16).padStart(4, '0')}`)];
      if (forms.some((t) => content.includes(t))) { console.error(`✗ ${name}: solve note of ${n.figure.id} (day ${n.day}) in plain text`); fail++; }
    }
  }
}

if (fail) { console.error(`\n${fail} errors`); process.exit(1); }
console.log(`\nAll 24 days open with their answers.`);
console.log(`${solveNotes.length} solve notes decrypt, ${openNotes.length} open notes public, no solve text in plain text in ${scanned.join(' and ')}.`);
