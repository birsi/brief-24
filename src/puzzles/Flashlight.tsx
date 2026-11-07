import { useRef, useState, type PointerEvent } from 'react';
import { mediaPath } from '../components/ui';

// Four letters on the walls of room 24, only visible in the light cone.
const LETTERS = [
  { b: 'W', x: 16, y: 30, r: -8 },
  { b: 'E', x: 70, y: 18, r: 6 },
  { b: 'I', x: 38, y: 72, r: -3 },
  { b: 'N', x: 86, y: 62, r: 10 },
];

export default function Flashlight({ num }: { num: number }) {
  const box = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const [bgOk, setBgOk] = useState(true);

  const move = (e: PointerEvent<HTMLDivElement>) => {
    const r = box.current?.getBoundingClientRect();
    if (!r) return;
    setPos({ x: e.clientX - r.left, y: e.clientY - r.top });
  };

  const mask = pos
    ? `radial-gradient(circle 80px at ${pos.x}px ${pos.y}px, rgba(4,8,14,0) 0, rgba(4,8,14,0) 45px, rgb(4,8,14) 80px)`
    : 'rgb(4,8,14)';
  const lightMask = pos ? `radial-gradient(circle 80px at ${pos.x}px ${pos.y}px, #000 0, #000 45px, transparent 80px)` : 'linear-gradient(transparent, transparent)';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <p className="small" style={{ margin: 0 }}>Der Strom ist weg. Fahr mit dem Finger über das Zimmer, um mit der Lampe zu leuchten.</p>
      <div
        ref={box}
        onPointerDown={move}
        onPointerMove={move}
        onPointerLeave={() => setPos(null)}
        role="img"
        aria-label="Dunkles, durchwühltes Zimmer 24"
        style={{ position: 'relative', aspectRatio: '3 / 2', overflow: 'hidden', touchAction: 'none', background: '#1B2433', userSelect: 'none' }}
      >
        {bgOk ? (
          <img src={mediaPath(num, 'narration.jpg')} alt="" onError={() => setBgOk(false)} draggable={false} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <svg viewBox="0 0 300 200" preserveAspectRatio="none" aria-hidden="true" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
            <rect width="300" height="200" fill="#2B3446" />
            {Array.from({ length: 12 }).map((_, i) => (
              <line key={i} x1={i * 25} y1="0" x2={i * 25} y2="140" stroke="#344058" strokeWidth="6" />
            ))}
            <rect y="140" width="300" height="60" fill="#3A2C22" />
            <rect x="150" y="105" width="120" height="50" fill="#D9D2C4" transform="rotate(-4 210 130)" />
            <rect x="30" y="120" width="50" height="40" fill="#5A4433" />
            <rect x="34" y="112" width="50" height="10" fill="#6B5240" transform="rotate(14 60 117)" />
            {[[100, 170], [120, 180], [200, 175], [240, 185]].map(([x, y]) => (
              <rect key={x} x={x} y={y} width="24" height="16" fill="#E8E1D2" transform={`rotate(${x % 30 - 15} ${x} ${y})`} />
            ))}
          </svg>
        )}
        <div aria-hidden="true" style={{ position: 'absolute', inset: 0, background: mask, pointerEvents: 'none' }} />
        <div aria-hidden="true" style={{ position: 'absolute', inset: 0, pointerEvents: 'none', maskImage: lightMask, WebkitMaskImage: lightMask }}>
        {LETTERS.map((l) => (
          <span key={l.b} aria-hidden="true" style={{ position: 'absolute', left: `${l.x}%`, top: `${l.y}%`, transform: `translate(-50%, -50%) rotate(${l.r}deg)`, fontFamily: 'var(--sans)', fontWeight: 600, fontSize: 44, color: '#C9A7FF', textShadow: '0 0 10px #9B6BFF, 0 0 22px #7C4DFF' }}>
            {l.b}
          </span>
        ))}
        </div>
        {pos ? null : (
          <div aria-hidden="true" style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)', fontFamily: 'var(--sans)', fontSize: 12, letterSpacing: '0.14em', pointerEvents: 'none' }}>
            HIER LEUCHTEN
          </div>
        )}
      </div>
      <p className="small" style={{ margin: 0 }}>Vier Buchstaben an der Wand. Der Rest liegt in deiner Hand.</p>
    </div>
  );
}
