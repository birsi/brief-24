import content from '../generated/days.json';
import { normalize } from './normalize';
import type { GeneratedContent } from './types';

const data = content as GeneratedContent;

export const DAYS = data.days;
export const FIGURES = data.figures;

export type TryResult = { ok: true } | { ok: false; special?: string };

/** Checks an input against the day's answers (case, umlauts and spaces don't matter). */
export function checkAnswer(num: number, input: string): TryResult {
  const day = DAYS[num - 1];
  const n = normalize(input);
  if (!n) return { ok: false };
  if (day.answers.includes(n)) return { ok: true };
  return { ok: false, special: day.special[n] };
}
