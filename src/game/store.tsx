import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { checkAnswer, DAYS, type TryResult } from './content';
import { notebookState, type NotebookState, type NotebookTab } from './notebook';
import type { NotebookEntry, Payload } from './types';

export const GAME_YEAR = 2026;
/** Minutes after first opening a day until hints 1, 2 and 3 become available. */
export const HINT_MINUTES = [3, 8, 15];

const KEY = 'brief24:v1';
const DEV_KEY = 'brief24:dev';
/** Notebook items the player has already looked at (stamps, figure notes, tabs). */
const SEEN_KEY = 'brief24:notebook-seen';

function loadSeen(): Set<string> {
  try {
    return new Set(JSON.parse(localStorage.getItem(SEEN_KEY) ?? '[]') as string[]);
  } catch {
    return new Set();
  }
}

type Progress = {
  /** Day → time it was solved. */
  solved: Record<number, number>;
  opened: Record<number, number>;
  hints: Record<number, number>;
};

type DevState = { on: boolean; ignoreDate: boolean; ignoreOrder: boolean; simDate: string | null; showSolutions: boolean };

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? { ...fallback, ...JSON.parse(raw) } : fallback;
  } catch {
    return fallback;
  }
}
function save(key: string, v: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(v));
  } catch {
    /* storage unavailable */
  }
}

/** Today's date in Vienna as YYYY-MM-DD. */
export function viennaToday(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Vienna', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
}
export function dayDate(num: number) {
  return `${GAME_YEAR}-12-${String(num).padStart(2, '0')}`;
}

type Ctx = {
  progress: Progress;
  payloads: Record<number, Payload>;
  dev: DevState;
  today: string;
  isDev: boolean;
  isUnlocked: (num: number) => boolean;
  isSolved: (num: number) => boolean;
  submit: (num: number, input: string) => TryResult;
  markOpened: (num: number) => void;
  revealHint: (num: number) => void;
  notebook: Set<NotebookEntry>;
  /** Figures, tabs and items of the notebook. */
  book: NotebookState;
  /** Unseen notebook items per tab, and all of them. */
  unseen: Record<NotebookTab, string[]> & { all: string[] };
  markSeen: (keys: string[]) => void;
  // Dev mode
  setDev: (patch: Partial<DevState>) => void;
  devSolveDay: (num: number) => void;
  resetDay: (num: number) => void;
  resetAll: () => void;
};

const GameCtx = createContext<Ctx | null>(null);

export function GameProvider({ children }: { children: ReactNode }) {
  const [progress, setProgress] = useState<Progress>(() => load(KEY, { solved: {}, opened: {}, hints: {} }));
  const [dev, setDevState] = useState<DevState>(() => load(DEV_KEY, { on: false, ignoreDate: false, ignoreOrder: false, simDate: null, showSolutions: false }));
  const [seen, setSeen] = useState<Set<string>>(loadSeen);
  const [now, setNow] = useState(viennaToday());

  useEffect(() => {
    save(SEEN_KEY, [...seen]);
  }, [seen]);

  useEffect(() => {
    save(KEY, progress);
  }, [progress]);
  useEffect(() => {
    save(DEV_KEY, dev);
  }, [dev]);

  // Check the date regularly so the next day unlocks at midnight.
  useEffect(() => {
    const t = setInterval(() => setNow(viennaToday()), 30_000);
    return () => clearInterval(t);
  }, []);

  // ?dev in the URL turns on dev mode.
  useEffect(() => {
    const url = new URL(window.location.href);
    if (!url.searchParams.has('dev')) return;
    setDevState((d) => ({ ...d, on: true }));
    url.searchParams.delete('dev');
    window.history.replaceState(null, '', url.toString());
  }, []);

  const isDev = dev.on;
  const today = isDev && dev.simDate ? dev.simDate : now;

  // A day opens once its date has come and the previous day is solved.
  const isUnlocked = useCallback(
    (num: number) => {
      if (progress.solved[num]) return true;
      const dateOk = (isDev && dev.ignoreDate) || today >= dayDate(num);
      const orderOk = (isDev && dev.ignoreOrder) || num === 1 || !!progress.solved[num - 1];
      return dateOk && orderOk;
    },
    [isDev, dev.ignoreDate, dev.ignoreOrder, today, progress.solved],
  );
  const isSolved = useCallback((num: number) => !!progress.solved[num], [progress.solved]);

  const submit = useCallback((num: number, input: string) => {
    const res = checkAnswer(num, input);
    if (res.ok) setProgress((p) => ({ ...p, solved: { ...p.solved, [num]: Date.now() } }));
    return res;
  }, []);

  const markOpened = useCallback((num: number) => {
    setProgress((p) => (p.opened[num] ? p : { ...p, opened: { ...p.opened, [num]: Date.now() } }));
  }, []);

  const revealHint = useCallback((num: number) => {
    setProgress((p) => ({ ...p, hints: { ...p.hints, [num]: Math.min(3, (p.hints[num] ?? 0) + 1) } }));
  }, []);

  // The revealed content of solved days.
  const payloads = useMemo(() => {
    const out: Record<number, Payload> = {};
    for (const num of Object.keys(progress.solved)) if (DAYS[Number(num) - 1]) out[Number(num)] = DAYS[Number(num) - 1];
    return out;
  }, [progress.solved]);

  const book = useMemo(() => notebookState(progress, payloads), [progress, payloads]);
  const notebook = book.entries;
  const unseen = useMemo(() => {
    const per = {} as Record<NotebookTab, string[]>;
    for (const [tab, keys] of Object.entries(book.items) as [NotebookTab, string[]][]) per[tab] = keys.filter((k) => !seen.has(k));
    return { ...per, all: Object.values(per).flat() };
  }, [book, seen]);
  const markSeen = useCallback((keys: string[]) => {
    if (!keys.length) return;
    setSeen((s) => (keys.every((k) => s.has(k)) ? s : new Set([...s, ...keys])));
  }, []);

  const setDev = useCallback((patch: Partial<DevState>) => setDevState((d) => ({ ...d, ...patch })), []);

  const devSolveDay = useCallback((num: number) => {
    setProgress((p) => (p.solved[num] ? p : { ...p, solved: { ...p.solved, [num]: Date.now() }, opened: { ...p.opened, [num]: p.opened[num] ?? Date.now() } }));
  }, []);

  const resetDay = useCallback((num: number) => {
    setProgress((p) => {
      const solved = { ...p.solved };
      const opened = { ...p.opened };
      const hints = { ...p.hints };
      delete solved[num];
      delete opened[num];
      delete hints[num];
      return { solved, opened, hints };
    });
  }, []);
  const resetAll = useCallback(() => {
    setProgress({ solved: {}, opened: {}, hints: {} });
    setSeen(new Set());
  }, []);

  const value: Ctx = {
    progress,
    payloads,
    dev,
    today,
    isDev,
    isUnlocked,
    isSolved,
    submit,
    markOpened,
    revealHint,
    notebook,
    book,
    unseen,
    markSeen,
    setDev,
    devSolveDay,
    resetDay,
    resetAll,
  };
  return <GameCtx.Provider value={value}>{children}</GameCtx.Provider>;
}

export function useGame() {
  const c = useContext(GameCtx);
  if (!c) throw new Error('useGame outside of GameProvider');
  return c;
}
