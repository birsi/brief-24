// Sounds generated directly in the browser – no audio files needed.

let ctx: AudioContext | null = null;
function ac() {
  ctx ??= new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

/** A deep bell strike of a grandfather clock. */
function bell(at: number) {
  const c = ac();
  const partials = [
    [1, 0.5, 4.5],
    [2.0, 0.22, 3.2],
    [2.76, 0.16, 2.4],
    [5.4, 0.08, 1.4],
  ];
  const base = 196;
  for (const [mult, gain, dur] of partials) {
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = 'sine';
    o.frequency.value = base * mult;
    g.gain.setValueAtTime(0, at);
    g.gain.linearRampToValueAtTime(gain, at + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
    o.connect(g).connect(c.destination);
    o.start(at);
    o.stop(at + dur + 0.1);
  }
}

/** Plays n bell strikes. Returns the total duration in seconds. */
export function playBells(n: number, gap = 1.7) {
  const c = ac();
  const t0 = c.currentTime + 0.1;
  for (let i = 0; i < n; i++) bell(t0 + i * gap);
  return n * gap + 3;
}

// ---- Morse as clockwork -------------------------------------------------------------------------
// A dot is one dry clockwork tick; a dash is the same tick that sets a little brass bell ringing for about
// half a second. No steady tones, so nothing beeps. A small echo gives it a room.
// The ticks are computed once as plain audio buffers and then only played back (no oscillators, filters or
// scheduled ramps), which is the most reliable thing on iOS Safari.

const TICK_VARIANTS = 4;
const tickCache = new WeakMap<AudioContext, AudioBuffer[]>();

/** One tick: a short resonant click (pawl), a small metal ping and a dull knock of the case. */
function makeTick(c: AudioContext, variant: number) {
  const sr = c.sampleRate;
  const len = Math.floor(sr * 0.1);
  const buf = c.createBuffer(1, len, sr);
  const d = buf.getChannelData(0);
  const f = 1 + (variant - 1.5) * 0.06; // each variant is slightly different
  // noise through a resonator around 3 kHz = the click
  const w = (2 * Math.PI * 3000 * f) / sr;
  const r = 0.93;
  let y1 = 0;
  let y2 = 0;
  for (let i = 0; i < len; i++) {
    const t = i / sr;
    const y = (Math.random() * 2 - 1) * (1 - r) + 2 * r * Math.cos(w) * y1 - r * r * y2;
    y2 = y1;
    y1 = y;
    const click = y * 9 * Math.exp(-t / 0.004);
    const ping = 0.22 * Math.sin(2 * Math.PI * 1900 * f * t) * Math.exp(-t / 0.012);
    const knock = 0.3 * Math.sin(2 * Math.PI * 220 * f * t) * Math.exp(-t / 0.02);
    d[i] = click + ping + knock;
  }
  let peak = 0;
  for (let i = 0; i < len; i++) peak = Math.max(peak, Math.abs(d[i]));
  for (let i = 0; i < len; i++) d[i] = (d[i] / peak) * 0.7;
  d[len - 1] = 0;
  return buf;
}

function ticks(c: AudioContext) {
  let t = tickCache.get(c);
  if (!t) {
    t = Array.from({ length: TICK_VARIANTS }, (_, v) => makeTick(c, v));
    tickCache.set(c, t);
  }
  return t;
}

function tick(c: AudioContext, bus: AudioNode, at: number, level: number) {
  const src = c.createBufferSource();
  src.buffer = ticks(c)[Math.floor(Math.random() * TICK_VARIANTS)];
  const g = c.createGain();
  g.gain.value = level * (0.9 + Math.random() * 0.2);
  src.connect(g).connect(bus);
  src.start(at);
}

/** Output bus with a small stone-room echo: a darkening feedback delay, plain and reliable on every browser. */
function makeBus(c: AudioContext) {
  const input = c.createGain();
  const dry = c.createGain();
  dry.gain.value = 1;
  const delay = c.createDelay(0.5);
  delay.delayTime.value = 0.13;
  const tone = c.createBiquadFilter();
  tone.type = 'lowpass';
  tone.frequency.value = 2600;
  const feedback = c.createGain();
  feedback.gain.value = 0.25;
  const wet = c.createGain();
  wet.gain.value = 0.22;
  input.connect(dry).connect(c.destination);
  input.connect(delay);
  delay.connect(tone).connect(feedback).connect(delay);
  delay.connect(wet).connect(c.destination);
  return input;
}

/**
 * A struck brass bell that rings for about half a second: several inharmonic partials, each fading away
 * on its own, like the little bell of a clock. This is what makes a dash long without being a steady tone.
 */
function ringBell(c: AudioContext, bus: AudioNode, at: number, len: number) {
  const base = 820;
  // [frequency ratio, level, decay in seconds]
  const partials: [number, number, number][] = [
    [1, 0.2, len * 1.3],
    [2.0, 0.1, len * 0.9],
    [2.76, 0.09, len * 0.7],
    [4.07, 0.05, len * 0.45],
    [5.4, 0.03, len * 0.3],
  ];
  for (const [ratio, gain, decay] of partials) {
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = 'sine';
    o.frequency.value = base * ratio;
    g.gain.setValueAtTime(0, at);
    g.gain.linearRampToValueAtTime(gain, at + 0.002);
    g.gain.exponentialRampToValueAtTime(0.0001, at + decay);
    o.connect(g).connect(bus);
    o.start(at);
    o.stop(at + decay + 0.05);
  }
}

/** One morse signal. A dot is a single dry clockwork tick; a dash is the tick that sets a little bell ringing. */
function clockTick(c: AudioContext, bus: AudioNode, at: number, len: number) {
  tick(c, bus, at, len >= 0.2 ? 0.8 : 1);
  if (len >= 0.2) ringBell(c, bus, at, len);
}

/** Morse pattern like "...- .. . .-." as clockwork ticking. */
export function playMorse(pattern: string, repeat = 1) {
  const c = ac();
  const bus = makeBus(c);
  const short = 0.12;
  const long = 0.42;
  const symbolGap = 0.28;
  const letterGap = 1.0;
  const wordGap = 2.4;
  let t = c.currentTime + 0.2;
  for (let r = 0; r < repeat; r++) {
    for (const ch of pattern) {
      if (ch === '.') {
        clockTick(c, bus, t, short);
        t += short + symbolGap;
      } else if (ch === '-') {
        clockTick(c, bus, t, long);
        t += long + symbolGap;
      } else if (ch === ' ') {
        t += letterGap - symbolGap;
      }
    }
    t += wordGap;
  }
  return t - c.currentTime - wordGap + 0.3; // no need to wait out the pause after the last letter
}

export function stopAll() {
  if (ctx) {
    void ctx.close();
    ctx = null;
  }
}
