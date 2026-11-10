// Reads content/texts.md (export of the text document), content/solutions.json and
// content/figures.json and generates src/generated/days.json. Everything is plain JSON:
// answers are stored normalized and compared in the browser.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { normalize } from './normalize.mjs';
import { parseTexts } from './parse-texts.mjs';

const solutions = JSON.parse(readFileSync(new URL('../content/solutions.json', import.meta.url), 'utf8')).days;
const days = parseTexts();

// ---------- Figures (notebook) ----------
// 'open' notes appear once their day is opened, 'solve' notes once it is solved.
const figuresSrc = JSON.parse(readFileSync(new URL('../content/figures.json', import.meta.url), 'utf8')).figures;
const figureIds = new Set();
const figures = figuresSrc.map((f, pos) => {
  if (!f.id || !f.name || !f.role || !Array.isArray(f.notes)) throw new Error(`figures.json: figure ${pos + 1} needs id, name, role and notes`);
  if (figureIds.has(f.id)) throw new Error(`figures.json: duplicate id ${f.id}`);
  figureIds.add(f.id);
  const notes = f.notes.map((n, i) => {
    if (!Number.isInteger(n.day) || n.day < 1 || n.day > 24) throw new Error(`figures.json: ${f.id} note ${i + 1} has invalid day ${n.day}`);
    if (n.when !== 'open' && n.when !== 'solve') throw new Error(`figures.json: ${f.id} note ${i + 1} has invalid when "${n.when}"`);
    if (!n.text) throw new Error(`figures.json: ${f.id} note ${i + 1} has no text`);
    return { day: n.day, i, when: n.when, text: n.text };
  });
  return { id: f.id, pos, name: f.name, role: f.role, notes };
});

const out = { days: [], figures };
for (let num = 1; num <= 24; num++) {
  const d = days[num];
  const l = solutions[String(num)];
  if (!d) throw new Error(`Day ${num} missing in texts.md`);
  if (!l) throw new Error(`Day ${num} missing in solutions.json`);
  if (d.narration.length === 0) console.warn(`[content] Day ${num}: no narration found`);
  if (d.continuation.length === 0) console.warn(`[content] Day ${num}: no continuation found`);

  const special = {};
  for (const [k, msg] of Object.entries(l.special || {})) special[normalize(k)] = msg;

  out.days.push({
    num,
    title: d.title,
    meta: d.meta,
    card: d.card,
    narration: d.narration,
    hints: d.hints.slice(0, 3),
    video: !!l.video,
    answers: [...new Set(l.answers.map(normalize))],
    special,
    continuation: d.continuation,
    solution: l.answers[0],
    stamp: l.stamp || null,
    record: l.record || null,
    epilogue: l.epilogue || null,
    cue: d.cue || null,
  });
}

mkdirSync(new URL('../src/generated/', import.meta.url), { recursive: true });
writeFileSync(new URL('../src/generated/days.json', import.meta.url), JSON.stringify(out));

// Image prompts as a list for media production
const prompts = Object.values(days).map((d) => `Day ${d.num} – ${d.title}\n  Narration: ${d.imageNarration}\n  Resolution: ${d.imageResolution}`).join('\n\n');
writeFileSync(new URL('../content/image-prompts.txt', import.meta.url), prompts + '\n');
console.log(`[content] 24 days generated (${out.days.reduce((s, d) => s + d.narration.length, 0)} narration paragraphs).`);
