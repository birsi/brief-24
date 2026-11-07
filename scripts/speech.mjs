// Turns display text into the text sent to ElevenLabs, using "pronunciations" from
// content/tts-settings.json (e.g. Fanny → Fanni, 1926 → neunzehnhundertsechsundzwanzig).
export function speakable(text, pronunciations = {}) {
  const pairs = Object.entries(pronunciations)
    .filter(([from]) => !from.startsWith('_'))
    .sort((a, b) => b[0].length - a[0].length);
  if (!pairs.length) return text;
  const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  // One pass, so a replacement is never replaced again; digits only match whole numbers.
  const re = new RegExp(pairs.map(([from]) => (/^\d+$/.test(from) ? `(?<!\\d)${esc(from)}(?!\\d)` : esc(from))).join('|'), 'g');
  const map = new Map(pairs);
  // A replacement at the start of a sentence starts with a capital letter.
  return text.replace(re, (m, offset) => {
    const to = map.get(m);
    return /(^|[.!?…]\s+)$/.test(text.slice(0, offset)) ? to[0].toUpperCase() + to.slice(1) : to;
  });
}
