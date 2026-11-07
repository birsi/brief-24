import { FIGURES } from './content';

export type VisibleNote = { key: string; day: number; i: number; text: string; solve: boolean };
export type VisibleFigure = { id: string; name: string; role: string; notes: VisibleNote[] };

/**
 * Collects the figures and notes that are visible:
 * 'open' notes of days for which `isOpen(day)` is true, 'solve' notes of days for which `isSolved(day)` is true.
 * A figure only appears once at least one note is visible. Order: figures as in
 * content/figures.json, notes by day (and file order within a day).
 */
export function collectFigures(isOpen: (day: number) => boolean, isSolved: (day: number) => boolean, maxDay = 24): VisibleFigure[] {
  const out: VisibleFigure[] = [];
  for (const f of FIGURES) {
    const notes = f.notes
      .filter((n) => n.day <= maxDay && (n.when === 'open' ? isOpen(n.day) : isSolved(n.day)))
      .map((n) => ({ key: `${f.id}:${n.day}:${n.i}`, day: n.day, i: n.i, text: n.text, solve: n.when === 'solve' }))
      .sort((a, b) => a.day - b.day || a.i - b.i);
    if (notes.length) out.push({ id: f.id, name: f.name, role: f.role, notes });
  }
  return out;
}
