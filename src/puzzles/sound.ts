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

function tick(at: number, len: number) {
  const c = ac();
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = 'square';
  o.frequency.value = len > 0.2 ? 520 : 880;
  g.gain.setValueAtTime(0, at);
  g.gain.linearRampToValueAtTime(0.12, at + 0.005);
  g.gain.setValueAtTime(0.12, at + len);
  g.gain.exponentialRampToValueAtTime(0.0001, at + len + 0.05);
  o.connect(g).connect(c.destination);
  o.start(at);
  o.stop(at + len + 0.1);
}

/** Morse pattern like "...- .. . .-." as clockwork ticking, repeated several times. */
export function playMorse(pattern: string, repeat = 3) {
  const c = ac();
  const short = 0.12;
  const long = 0.42;
  const symbolGap = 0.28;
  const letterGap = 1.0;
  const wordGap = 2.4;
  let t = c.currentTime + 0.2;
  for (let r = 0; r < repeat; r++) {
    for (const ch of pattern) {
      if (ch === '.') {
        tick(t, short);
        t += short + symbolGap;
      } else if (ch === '-') {
        tick(t, long);
        t += long + symbolGap;
      } else if (ch === ' ') {
        t += letterGap - symbolGap;
      }
    }
    t += wordGap;
  }
  return t - c.currentTime;
}

export function stopAll() {
  if (ctx) {
    void ctx.close();
    ctx = null;
  }
}
