export type Wrap = { salt: string; iv: string; ct: string };

export type Stamp = {
  num: number;
  letter: string;
  motif: string;
  postmark: string;
  year: number;
};

export type DayData = {
  num: number;
  title: string;
  meta: string;
  card: string[];
  narration: string[];
  hints: string[];
  hint3: string | null;
  video: boolean;
  sealed: { iv: string; ct: string; wraps: Wrap[]; devWrap: Wrap };
  special: Record<string, string>;
};

export type GeneratedContent = {
  iterations: number;
  devCheck: Wrap;
  days: DayData[];
};

/** What is decrypted after the correct solution. */
export type Payload = {
  continuation: string[];
  solution: string;
  stamp: Stamp | null;
  record: string | null;
  epilogue: string[] | null;
};

export type NotebookEntry = 'room' | 'morse' | 'fraktur';

export type Widget =
  | { type: 'keyboard'; hooks: number[]; nameplates: string[]; sentences: string[] }
  | { type: 'bell'; strikes: number; label: string }
  | { type: 'voices'; statements: { name: string; text: string }[] }
  | { type: 'safe'; wheels: number }
  | { type: 'album'; photos: string[]; match: number; backside: string }
  | { type: 'footprints' }
  | { type: 'differences' }
  | { type: 'orderbook' }
  | { type: 'statements'; speaker: string; sentences: string[]; correct: number; question: string }
  | { type: 'flashlight' }
  | { type: 'morse'; pattern: string }
  | { type: 'scene' }
  | { type: 'lock' }
  | { type: 'hint'; text: string };

export type DayConfig = {
  question: string;
  placeholder?: string;
  widget?: Widget;
  /** Notebook entries unlocked when the day is opened. */
  unlocksOnOpen?: NotebookEntry[];
  /** Notebook entries unlocked after solving. */
  unlocksOnSolve?: NotebookEntry[];
};
