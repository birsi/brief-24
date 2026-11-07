import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { CONFIG } from './config';
import { checkDevSecret, devSolve, openPayload, tryAnswer, type TryResult } from './crypto';
import type { NotebookEntry, Payload } from './types';

export const GAME_YEAR = 2026;
/** Minutes after first opening a day until hints 1, 2 and 3 become available. */
export const HINT_MINUTES = [3, 8, 15];

const KEY = 'brief24:v1';
const DEV_KEY = 'brief24:dev';

type Progress = {
  solved: Record<number, string>;
  opened: Record<number, number>;
  hints: Record<number, number>;
};

type DevState = { secret: string | null; ignoreDate: boolean; ignoreOrder: boolean; simDate: string | null; showSolutions: boolean };

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
  submit: (num: number, input: string) => Promise<TryResult>;
  markOpened: (num: number) => void;
  revealHint: (num: number) => void;
  notebook: Set<NotebookEntry>;
  // Dev mode
  enableDev: (secret: string) => Promise<boolean>;
  setDev: (patch: Partial<DevState>) => void;
  devSolveDay: (num: number) => Promise<boolean>;
  resetDay: (num: number) => void;
  resetAll: () => void;
};

const GameCtx = createContext<Ctx | null>(null);

export function GameProvider({ children }: { children: ReactNode }) {
  const [progress, setProgress] = useState<Progress>(() => load(KEY, { solved: {}, opened: {}, hints: {} }));
  const [dev, setDevState] = useState<DevState>(() => load(DEV_KEY, { secret: null, ignoreDate: false, ignoreOrder: false, simDate: null, showSolutions: false }));
  const [payloads, setPayloads] = useState<Record<number, Payload>>({});
  const [now, setNow] = useState(viennaToday());

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

  // Decrypt the content of already solved days.
  useEffect(() => {
    let alive = true;
    (async () => {
      const next: Record<number, Payload> = {};
      for (const [num, key] of Object.entries(progress.solved)) {
        const p = await openPayload(Number(num), key);
        if (p) next[Number(num)] = p;
      }
      if (!alive) return;
      setPayloads(next);
      // Drop saved solutions that no longer decrypt (e.g. progress from an older build).
      const stale = Object.keys(progress.solved).filter((nr) => !next[Number(nr)]);
      if (stale.length) {
        setProgress((p) => {
          const solved = { ...p.solved };
          for (const nr of stale) delete solved[Number(nr)];
          return { ...p, solved };
        });
      }
    })();
    return () => {
      alive = false;
    };
  }, [progress.solved]);

  // ?dev=secret in the URL unlocks dev mode.
  useEffect(() => {
    const p = new URLSearchParams(window.location.search).get('dev');
    if (!p) return;
    checkDevSecret(p).then((ok) => {
      if (ok) setDevState((d) => ({ ...d, secret: p }));
      const url = new URL(window.location.href);
      url.searchParams.delete('dev');
      window.history.replaceState(null, '', url.toString());
    });
  }, []);

  const isDev = !!dev.secret;
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

  const submit = useCallback(async (num: number, input: string) => {
    const res = await tryAnswer(num, input);
    if (res.ok) {
      setPayloads((p) => ({ ...p, [num]: res.payload }));
      setProgress((p) => ({ ...p, solved: { ...p.solved, [num]: res.key } }));
    }
    return res;
  }, []);

  const markOpened = useCallback((num: number) => {
    setProgress((p) => (p.opened[num] ? p : { ...p, opened: { ...p.opened, [num]: Date.now() } }));
  }, []);

  const revealHint = useCallback((num: number) => {
    setProgress((p) => ({ ...p, hints: { ...p.hints, [num]: Math.min(3, (p.hints[num] ?? 0) + 1) } }));
  }, []);

  const notebook = useMemo(() => {
    const s = new Set<NotebookEntry>();
    for (let num = 1; num <= 24; num++) {
      const c = CONFIG[num];
      if (progress.opened[num]) c.unlocksOnOpen?.forEach((e) => s.add(e));
      if (progress.solved[num]) {
        c.unlocksOnOpen?.forEach((e) => s.add(e));
        c.unlocksOnSolve?.forEach((e) => s.add(e));
      }
    }
    return s;
  }, [progress.opened, progress.solved]);

  const enableDev = useCallback(async (secret: string) => {
    const ok = await checkDevSecret(secret);
    if (ok) setDevState((d) => ({ ...d, secret }));
    return ok;
  }, []);
  const setDev = useCallback((patch: Partial<DevState>) => setDevState((d) => ({ ...d, ...patch })), []);

  const devSolveDay = useCallback(
    async (num: number) => {
      if (!dev.secret) return false;
      const res = await devSolve(num, dev.secret);
      if (res.ok) {
        setPayloads((p) => ({ ...p, [num]: res.payload }));
        setProgress((p) => ({ ...p, solved: { ...p.solved, [num]: res.key }, opened: { ...p.opened, [num]: p.opened[num] ?? Date.now() } }));
      }
      return res.ok;
    },
    [dev.secret],
  );

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
  const resetAll = useCallback(() => setProgress({ solved: {}, opened: {}, hints: {} }), []);

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
    enableDev,
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
