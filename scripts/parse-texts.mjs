// Parses content/texts.md (export of the text document) into one object per day.
// Shared by build-content.mjs and tts.mjs so the app text and the audio always match.
import { readFileSync } from 'node:fs';

export function parseTexts(md = readFileSync(new URL('../content/texts.md', import.meta.url), 'utf8')) {
  const days = {};
  let cur = null;
  let section = null;
  for (const raw of md.split('\n')) {
    const line = raw.trimEnd();
    const dayMatch = line.match(/^## Tag (\d+) – (.+)$/);
    if (dayMatch) {
      cur = { num: Number(dayMatch[1]), title: dayMatch[2].trim(), meta: '', card: [], narration: [], continuation: [], hints: [], imageNarration: '', imageResolution: '', cue: '' };
      days[cur.num] = cur;
      section = 'meta';
      continue;
    }
    if (/^## /.test(line)) { cur = null; section = null; continue; }
    if (!cur) continue;
    const h3 = line.match(/^### (.+)$/);
    if (h3) {
      const t = h3[1];
      if (t.startsWith('Karte – Story')) section = 'card';
      else if (t.startsWith('App – Erzählung')) section = 'narration';
      else if (t.startsWith('App – Fortsetzung')) section = 'continuation';
      else if (t.startsWith('Hinweise')) section = 'hints';
      else section = 'other';
      continue;
    }
    if (!line.trim()) continue;
    if (section === 'meta' && !cur.meta) { cur.meta = line.trim(); continue; }
    if (section === 'card') { cur.card.push(line.trim()); continue; }
    if (section === 'narration' || section === 'continuation') {
      const image = line.match(/^\*\*(Bild|Video) (Erzählung|Auflösung)\*\*(?: \([^)]*\))?:\s*(.+)$/);
      if (image) {
        if (image[2] === 'Erzählung') cur.imageNarration = image[3];
        else cur.imageResolution = image[3];
        continue;
      }
      // "Hinweis in der App": shown on screen after the continuation, not read aloud.
      const cue = line.match(/^\*\*Hinweis in der App\*\*:\s*„(.+)“$/);
      if (cue && section === 'continuation') { cur.cue = cue[1]; continue; }
      // Only keep plain narration paragraphs: no labels, lists or quotes.
      if (line.includes('**') || /^[-*>]\s|^\d+\.\s|^\|/.test(line.trim())) {
        if (section === 'narration') cur._stopNarration = true; // the narration ends at the first label
        continue;
      }
      if (section === 'narration' && cur._stopNarration) continue;
      cur[section].push(line.trim());
      continue;
    }
    if (section === 'hints') {
      const m = line.match(/^\d+\.\s+(.+)$/);
      if (m) cur.hints.push(m[1].trim());
    }
  }
  return days;
}
