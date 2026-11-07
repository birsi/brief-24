import { CONFIG } from './config';
import { collectFigures, type VisibleFigure } from './figures';
import type { NotebookEntry, Payload } from './types';

export type NotebookTab = 'stamps' | 'figures' | 'morse' | 'fraktur' | 'finds';

export const STAMP_DAYS = [3, 6, 9, 12, 15, 18];

export const TAB_LABELS: Record<NotebookTab, string> = {
  stamps: 'Briefmarken',
  figures: 'Figuren',
  morse: 'Morse',
  fraktur: 'Fraktur',
  finds: 'Funde',
};

type Progress = { opened: Record<number, number>; solved: Record<number, string> };

export type NotebookState = {
  /** Unlocked notebook entries (room, morse, fraktur). */
  entries: Set<NotebookEntry>;
  figures: VisibleFigure[];
  /** Tabs in display order and whether they are visible. */
  tabs: { id: NotebookTab; on: boolean }[];
  /** Everything in the notebook that can be "new", as keys per tab. */
  items: Record<NotebookTab, string[]>;
};

const dayIsOpen = (p: Progress) => (d: number) => !!(p.opened[d] || p.solved[d]);

export function notebookState(progress: Progress, payloads: Record<number, Payload>): NotebookState {
  const entries = new Set<NotebookEntry>();
  for (let num = 1; num <= 24; num++) {
    const c = CONFIG[num];
    if (progress.opened[num] || progress.solved[num]) c.unlocksOnOpen?.forEach((e) => entries.add(e));
    if (progress.solved[num]) c.unlocksOnSolve?.forEach((e) => entries.add(e));
  }
  // 'open' notes: same rule as unlocksOnOpen (day opened or solved).
  const figures = collectFigures(dayIsOpen(progress), payloads);
  const stamps = STAMP_DAYS.filter((d) => payloads[d]?.stamp).map((d) => `stamp:${d}`);
  const anyOpened = Object.keys(progress.opened).length > 0 || Object.keys(progress.solved).length > 0;

  const items: Record<NotebookTab, string[]> = {
    stamps,
    figures: figures.flatMap((f) => f.notes.map((n) => `note:${n.key}`)),
    morse: entries.has('morse') ? ['tab:morse'] : [],
    fraktur: entries.has('fraktur') ? ['tab:fraktur'] : [],
    finds: entries.has('room') ? ['tab:finds'] : [],
  };
  const tabs: NotebookState['tabs'] = [
    { id: 'stamps', on: stamps.length > 0 },
    { id: 'figures', on: anyOpened },
    { id: 'morse', on: items.morse.length > 0 },
    { id: 'fraktur', on: items.fraktur.length > 0 },
    { id: 'finds', on: items.finds.length > 0 },
  ];
  return { entries, figures, tabs, items };
}

/** Short German description of what is new, e.g. "2 Notizen zu Fanny und Mira · Morse-Tafel". */
export function describeNews(keys: string[], figures: VisibleFigure[]): string[] {
  const out: string[] = [];
  const notes = keys.filter((k) => k.startsWith('note:')).map((k) => k.slice(5));
  if (notes.length) {
    const names = figures.filter((f) => f.notes.some((n) => notes.includes(n.key))).map((f) => f.name);
    const who = names.length <= 2 ? names.join(' und ') : `${names.slice(0, -1).join(', ')} und ${names[names.length - 1]}`;
    out.push(`${notes.length === 1 ? 'Eine neue Notiz' : `${notes.length} neue Notizen`} zu ${who}`);
  }
  const stamps = keys.filter((k) => k.startsWith('stamp:')).length;
  if (stamps) out.push(stamps === 1 ? 'Eine Briefmarke' : `${stamps} Briefmarken`);
  if (keys.includes('tab:morse')) out.push('Die Morse-Tafel');
  if (keys.includes('tab:fraktur')) out.push('Die Fraktur-Tafel');
  if (keys.includes('tab:finds')) out.push('Die Zimmerbelegung');
  return out;
}
