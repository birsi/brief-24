import { useMemo } from 'react';

const rnd = (i: number, k: number) => {
  const x = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453;
  return x - Math.floor(x);
};

/** Falling snow over the parent element (needs position: relative). */
export function Snow({ count = 45, speed = 1, opacity = 1, local = false }: { count?: number; speed?: number; opacity?: number; local?: boolean }) {
  const flakes = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        left: rnd(i, 1) * 100,
        size: 1.5 + rnd(i, 2) * 3.5,
        op: (0.3 + rnd(i, 3) * 0.55) * opacity,
        dur: (local ? 5 + rnd(i, 4) * 6 : 9 + rnd(i, 4) * 11) / speed,
        delay: rnd(i, 5) * (local ? 10 : 20),
      })),
    [count, speed, opacity, local],
  );
  return (
    <div className={local ? 'snow snow-local' : 'snow snow-fixed'} aria-hidden="true">
      {flakes.map((f, i) => (
        <span
          key={i}
          className="flake"
          style={{ left: `${f.left}%`, width: f.size, height: f.size, opacity: f.op, animationDuration: `${f.dur}s`, animationDelay: `-${f.delay}s` }}
        />
      ))}
    </div>
  );
}

/** Fir garland with twinkling lights along the top edge. */
export function Garland() {
  const width = 480;
  const { d, d2 } = useMemo(() => {
    let a = `M0 0 H${width} V14`;
    let b = `M0 0 H${width} V8`;
    for (let x = width; x > 0; x -= 30) {
      a += ` Q ${x - 15} 34 ${x - 30} 14`;
      b += ` Q ${x - 15} 24 ${x - 30} 8`;
    }
    return { d: a + ' Z', d2: b + ' Z' };
  }, []);
  const lights = Array.from({ length: 16 }, (_, i) => ({ x: 12 + i * 30, y: 24 + (i % 2) * 3, warm: i % 3 === 1, delay: rnd(i, 7) * 2.4 }));
  return (
    // Sticky at the top of the screen; the negative margin keeps it from taking space in the layout.
    // In home-screen mode the status bar area above it is filled with the fir color.
    <div aria-hidden="true" style={{ position: 'sticky', top: 0, flexShrink: 0, height: 'calc(44px + env(safe-area-inset-top))', marginBottom: 'calc(-44px - env(safe-area-inset-top))', paddingTop: 'env(safe-area-inset-top)', background: 'linear-gradient(var(--fir-2), var(--fir-2)) top / 100% env(safe-area-inset-top) no-repeat', pointerEvents: 'none', zIndex: 25, overflow: 'hidden' }}>
      <div style={{ position: 'relative', height: 44 }}>
      <svg width={width} height={44} viewBox={`0 0 ${width} 44`} preserveAspectRatio="xMinYMin slice" style={{ width: '100%', display: 'block' }}>
        <path d={d} fill="var(--fir-2)" />
        <path d={d2} fill="var(--fir)" />
      </svg>
      {lights.map((l, i) => (
        <span
          key={i}
          className="light"
          style={{ left: `${(l.x / width) * 100}%`, top: l.y, background: l.warm ? '#FFF4D6' : 'var(--gold)', boxShadow: `0 0 8px ${l.warm ? '#FFF4D6' : 'var(--gold)'}`, animationDelay: `${l.delay}s` }}
        />
      ))}
      </div>
    </div>
  );
}

export function StarIcon({ size = 30, className }: { size?: number; className?: string }) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 34 34" aria-hidden="true">
      <path d="M17 1 L19.6 14.4 L33 17 L19.6 19.6 L17 33 L14.4 19.6 L1 17 L14.4 14.4 Z" fill="none" stroke="var(--gold)" strokeWidth="1.4" />
      <path d="M17 8 L18.3 15.7 L26 17 L18.3 18.3 L17 26 L15.7 18.3 L8 17 L15.7 15.7 Z" fill="var(--gold)" />
    </svg>
  );
}

export function Ornament({ width = 160 }: { width?: number }) {
  return (
    <svg width={width} height={12} viewBox="0 0 200 12" aria-hidden="true">
      <line x1="0" y1="6" x2="86" y2="6" stroke="var(--gold)" strokeWidth="1" />
      <path d="M100 0 L102 4 L106 6 L102 8 L100 12 L98 8 L94 6 L98 4 Z" fill="var(--gold)" />
      <line x1="114" y1="6" x2="200" y2="6" stroke="var(--gold)" strokeWidth="1" />
    </svg>
  );
}

/** Snowy hills on top of the bottom nav; sits just above its parent (the sticky nav), so it moves with it. */
export function SnowBank() {
  return (
    <div aria-hidden="true" style={{ position: 'absolute', left: 0, right: 0, bottom: 'calc(100% - 1px)', height: 34, pointerEvents: 'none' }}>
      <svg viewBox="0 0 390 34" preserveAspectRatio="none" style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: 34 }}>
        <path d="M0 18 Q 40 4 92 14 T 196 12 T 300 16 T 390 6 V34 H0 Z" fill="#DCE5EF" opacity="0.92" />
        <path d="M0 24 Q 60 14 130 22 T 260 20 T 390 18 V34 H0 Z" fill="var(--snow)" />
      </svg>
    </div>
  );
}

/** Small string of fairy lights above a box. */
export function FairyLights() {
  const xs = [5, 18, 31, 44, 56, 69, 82, 95];
  return (
    <div aria-hidden="true" style={{ position: 'absolute', left: 0, right: 0, top: -9, height: 18, pointerEvents: 'none' }}>
      <svg viewBox="0 0 358 18" preserveAspectRatio="none" style={{ width: '100%', height: 18 }}>
        <path d="M0 2 Q 45 18 90 4 Q 135 18 179 4 Q 224 18 268 4 Q 313 18 358 2" fill="none" stroke="var(--fir)" strokeWidth="5" strokeLinecap="round" />
      </svg>
      {xs.map((x, i) => (
        <span key={i} className="light" style={{ width: 5, height: 5, left: `${x}%`, top: i % 2 ? 9 : 6, background: i % 3 === 1 ? '#FFF4D6' : 'var(--gold)', boxShadow: '0 0 7px var(--gold)', animationDelay: `${rnd(i, 7) * 2.4}s` }} />
      ))}
    </div>
  );
}

/** Golden sparks bursting from the middle of the parent element. */
export function Sparks({ n = 14, delay = 0.55 }: { n?: number; delay?: number }) {
  return (
    <div aria-hidden="true" style={{ position: 'absolute', left: '50%', top: '50%', width: 0, height: 0 }}>
      {Array.from({ length: n }, (_, i) => {
        const a = (i / n) * Math.PI * 2;
        const r = 95 + rnd(i, 6) * 45;
        const c = i % 3 === 0 ? '#FFF4D6' : 'var(--gold)';
        return (
          <span
            key={i}
            className="spark"
            style={{ ['--dx' as string]: `${Math.cos(a) * r}px`, ['--dy' as string]: `${Math.sin(a) * r}px`, background: c, boxShadow: `0 0 8px ${c}`, borderRadius: i % 2 ? '50%' : 1, animationDelay: `${delay + rnd(i, 8) * 0.25}s` }}
          />
        );
      })}
    </div>
  );
}
