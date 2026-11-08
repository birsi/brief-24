export type Stamp = {
  num: number;
  letter: string;
  motif: string;
  postmark: string;
  year: number;
};

/** What a day reveals once it is solved. */
export type Payload = {
  continuation: string[];
  solution: string;
  stamp: Stamp | null;
  record: string | null;
  epilogue: string[] | null;
};

export type DayData = Payload & {
  num: number;
  title: string;
  meta: string;
  card: string[];
  narration: string[];
  hints: string[];
  video: boolean;
  /** Accepted answers, normalized. */
  answers: string[];
  /** Normalized wrong answer → special reply. */
  special: Record<string, string>;
};

/** A note in the notebook's figures section. `i` is its position in content/figures.json. */
export type FigureNote = { day: number; i: number; when: 'open' | 'solve'; text: string };
/** Position in content/figures.json (`pos`) keeps the file's order. */
export type Figure = { id: string; pos: number; name: string; role: string; notes: FigureNote[] };

export type GeneratedContent = {
  days: DayData[];
  figures: Figure[];
};

export type NotebookEntry = 'room' | 'morse' | 'fraktur';

export type Widget =
  | { type: 'keyboard'; hooks: number[]; nameplates: string[]; sentences: string[] }
  | { type: 'bell'; strikes: number; label: string; src?: string }
  | { type: 'voices'; statements: { name: string; text: string }[] }
  | { type: 'safe'; wheels: number }
  | { type: 'album'; photos: string[]; backsides: string[]; match: number }
  | { type: 'footprints' }
  | { type: 'differences' }
  | { type: 'orderbook' }
  | { type: 'statements'; speaker: string; character?: string; sentences: string[]; correct: number; question: string }
  | { type: 'flashlight' }
  | { type: 'morse'; pattern: string; src?: string }
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
