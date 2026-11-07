import content from '../generated/days.json';
import type { GeneratedContent, Payload, Wrap } from './types';
import { normalize } from './normalize';

const data = content as GeneratedContent;
const enc = new TextEncoder();
const dec = new TextDecoder();

const fromB64 = (s: string) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
export const toB64 = (buf: ArrayBuffer | Uint8Array) => {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  let s = '';
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s);
};

async function deriveKey(secret: string, salt: Uint8Array) {
  const base = await crypto.subtle.importKey('raw', enc.encode(secret), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: salt as BufferSource, iterations: data.iterations, hash: 'SHA-256' },
    base,
    { name: 'AES-GCM', length: 256 },
    false,
    ['decrypt'],
  );
}

async function unwrap(secret: string, w: Wrap): Promise<Uint8Array | null> {
  try {
    const key = await deriveKey(secret, fromB64(w.salt));
    const raw = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: fromB64(w.iv) as BufferSource }, key, fromB64(w.ct) as BufferSource);
    return new Uint8Array(raw);
  } catch {
    return null;
  }
}

/** Decrypts the content of a day with the (base64) content key. */
export async function openPayload(num: number, rawKeyB64: string): Promise<Payload | null> {
  const day = data.days[num - 1];
  try {
    const key = await crypto.subtle.importKey('raw', fromB64(rawKeyB64) as BufferSource, 'AES-GCM', false, ['decrypt']);
    const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: fromB64(day.sealed.iv) as BufferSource }, key, fromB64(day.sealed.ct) as BufferSource);
    return JSON.parse(dec.decode(pt)) as Payload;
  } catch {
    return null;
  }
}

export type TryResult =
  | { ok: true; key: string; payload: Payload }
  | { ok: false; special?: string };

/** Checks an input. On success the content key is returned. */
export async function tryAnswer(num: number, input: string): Promise<TryResult> {
  const day = data.days[num - 1];
  const n = normalize(input);
  if (!n) return { ok: false };
  for (const w of day.sealed.wraps) {
    const raw = await unwrap(`day${num}:${n}`, w);
    if (raw) {
      const key = toB64(raw);
      const payload = await openPayload(num, key);
      if (payload) return { ok: true, key, payload };
    }
  }
  const hash = toB64(await crypto.subtle.digest('SHA-256', enc.encode(`day${num}:${n}`)));
  return { ok: false, special: day.special[hash] };
}

/** Dev mode: decrypt a day with the dev secret. */
export async function devSolve(num: number, secret: string): Promise<TryResult> {
  const day = data.days[num - 1];
  const raw = await unwrap(`day${num}:dev:${secret}`, day.sealed.devWrap);
  if (!raw) return { ok: false };
  const key = toB64(raw);
  const payload = await openPayload(num, key);
  return payload ? { ok: true, key, payload } : { ok: false };
}

export async function checkDevSecret(secret: string): Promise<boolean> {
  const raw = await unwrap(`devcheck:${secret}`, data.devCheck);
  return !!raw && dec.decode(raw) === 'ok';
}

export function decodeHint3(s: string | null): string | null {
  if (!s) return null;
  const txt = dec.decode(fromB64(s));
  return [...txt].reverse().join('');
}

export const DAYS = data.days;
export const FIGURES = data.figures;
