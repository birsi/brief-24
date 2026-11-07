// Checks that every answer in content/solutions.json opens its day (also lower case,
// with spaces and umlauts), wrong answers don't, special replies exist, and every
// note from content/figures.json is in days.json exactly once.
import { readFileSync } from 'node:fs';
import { normalize } from './normalize.mjs';

const data = JSON.parse(readFileSync(new URL('../src/generated/days.json', import.meta.url), 'utf8'));
const solutions = JSON.parse(readFileSync(new URL('../content/solutions.json', import.meta.url), 'utf8')).days;

// Same logic as checkAnswer in src/game/content.ts.
const opens = (day, input) => {
  const n = normalize(input);
  return !!n && day.answers.includes(n);
};

let fail = 0;
for (const day of data.days) {
  const l = solutions[day.num];
  const variants = [...l.answers, l.answers[0].toLowerCase(), ` ${l.answers[0]} `];
  for (const a of variants) {
    if (!opens(day, a)) { console.error(`✗ Day ${day.num}: "${a}" does not open`); fail++; }
  }
  if (opens(day, 'WRONGANSWER') || opens(day, '')) { console.error(`✗ Day ${day.num}: wrong answer opens`); fail++; }
  if (day.continuation.length === 0) { console.error(`✗ Day ${day.num}: no continuation`); fail++; }
  for (const k of Object.keys(l.special || {})) {
    if (!day.special[normalize(k)]) { console.error(`✗ Day ${day.num}: special answer ${k} missing`); fail++; }
  }
  console.log(`✓ Day ${String(day.num).padStart(2)} ${day.title.padEnd(28)} ${l.answers.join(' / ')}`);
}
// Umlaut variants
for (const [num, a] of [[16, 'Schlüssel'], [17, 'zurück'], [24, 'Larissa Birsak']]) {
  if (!opens(data.days[num - 1], a)) { console.error(`✗ Day ${num}: "${a}" does not open`); fail++; }
}

// ---------- Figures ----------
const figures = JSON.parse(readFileSync(new URL('../content/figures.json', import.meta.url), 'utf8')).figures;
let notes = 0;
for (const f of figures) {
  const pub = data.figures.find((x) => x.id === f.id);
  if (!pub || pub.name !== f.name || pub.role !== f.role) { console.error(`✗ Figure ${f.id} missing or different in days.json`); fail++; continue; }
  for (const n of f.notes) {
    notes++;
    if (pub.notes.filter((x) => x.day === n.day && x.when === n.when && x.text === n.text).length !== 1) { console.error(`✗ Figure ${f.id}, day ${n.day}: note missing in days.json`); fail++; }
  }
}

if (fail) { console.error(`\n${fail} errors`); process.exit(1); }
console.log(`\nAll 24 days open with their answers. ${figures.length} figures with ${notes} notes in days.json.`);
