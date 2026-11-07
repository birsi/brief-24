import { FIGURES } from './crypto';
import type { Payload } from './types';

export type VisibleNote = { key: string; day: number; i: number; text: string; solve: boolean };
export type VisibleFigure = { id: string; name: string; role: string; notes: VisibleNote[] };

/**
 * Collects the figures and notes that are visible:
 * 'open' notes of days for which `isOpen(day)` is true, 'solve' notes from the decrypted payloads.
 * A figure only appears once at least one note is visible. Order: figures as in
 * content/figures.json, notes by day (and file order within a day).
 */
export function collectFigures(isOpen: (day: number) => boolean, payloads: Record<number, Payload>, maxDay = 24): VisibleFigure[] {
  const byId = new Map<string, VisibleFigure & { pos: number }>();
  const get = (id: string, pos: number, name: string, role: string) => {
    let f = byId.get(id);
    if (!f) byId.set(id, (f = { id, pos, name, role, notes: [] }));
    return f;
  };
  for (const f of FIGURES) {
    for (const n of f.notes) {
      if (n.day > maxDay || !isOpen(n.day)) continue;
      get(f.id, f.pos, f.name, f.role).notes.push({ key: `${f.id}:${n.day}:${n.i}`, day: n.day, i: n.i, text: n.text, solve: false });
    }
  }
  for (const [day, p] of Object.entries(payloads)) {
    if (Number(day) > maxDay) continue;
    for (const n of p.figureNotes ?? []) {
      get(n.figure, n.pos, n.name, n.role).notes.push({ key: `${n.figure}:${n.day}:${n.i}`, day: n.day, i: n.i, text: n.text, solve: true });
    }
  }
  return [...byId.values()]
    .sort((a, b) => a.pos - b.pos)
    .map(({ id, name, role, notes }) => ({ id, name, role, notes: notes.sort((a, b) => a.day - b.day || a.i - b.i) }));
}
