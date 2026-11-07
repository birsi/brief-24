import { useState, type MouseEvent } from 'react';

// Six differences between the photo of the real globe (left) and Hartl's globe (right).
// The letters are ordered by their x position: F A L S C H.
const DIFFS = [
  { id: 'tree', x: 46, y: 132, letter: 'F' },
  { id: 'window', x: 72, y: 104, letter: 'A' },
  { id: 'door', x: 100, y: 150, letter: 'L' },
  { id: 'flag', x: 124, y: 40, letter: 'S' },
  { id: 'star', x: 152, y: 62, letter: 'C' },
  { id: 'base', x: 166, y: 204, letter: 'H' },
];
const R = 17;

function Globe({ fake, found, onPick, label }: { fake: boolean; found: Set<string>; onPick: (x: number, y: number) => void; label: string }) {
  const click = (e: MouseEvent<SVGSVGElement>) => {
    const svg = e.currentTarget;
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const m = svg.getScreenCTM();
    if (!m) return;
    const p = pt.matrixTransform(m.inverse());
    onPick(p.x, p.y);
  };
  const has = (id: string) => !(fake && ['tree', 'flag', 'star'].includes(id));
  return (
    <svg viewBox="0 0 200 240" role="img" aria-label={label} onClick={click} style={{ width: '100%', cursor: 'crosshair', display: 'block' }}>
      <defs>
        <radialGradient id={`glass-${fake}`} cx="40%" cy="35%" r="70%">
          <stop offset="0" stopColor="#3B5677" />
          <stop offset="1" stopColor="#13223A" />
        </radialGradient>
      </defs>
      {/* Glass */}
      <circle cx="100" cy="100" r="88" fill={`url(#glass-${fake})`} stroke="#9FB3C8" strokeWidth="2" />
      {/* Ground with snow */}
      <path d="M22 140 Q 100 120 178 140 L 170 170 Q 100 185 30 170 Z" fill="#E8EEF5" />
      {/* Tree on the left */}
      {has('tree') ? <path d="M46 108 L 58 140 L 34 140 Z M46 120 L 60 150 L 32 150 Z" fill="#1F4A38" /> : null}
      {/* Hotel */}
      <rect x="58" y="70" width="84" height="80" fill="#D8C9A8" stroke="#8A6A2F" strokeWidth="1" />
      <path d="M54 72 L 100 50 L 146 72 Z" fill="#7A5A3A" />
      {/* Tower with flag */}
      <rect x="114" y="38" width="16" height="34" fill="#C9B994" stroke="#8A6A2F" strokeWidth="1" />
      <path d="M112 40 L 122 28 L 132 40 Z" fill="#7A5A3A" />
      {has('flag') ? (
        <g>
          <line x1="122" y1="28" x2="122" y2="14" stroke="#555" strokeWidth="1.2" />
          <path d="M122 14 L 134 18 L 122 22 Z" fill="#9E2B32" />
        </g>
      ) : null}
      {/* Windows: 3 rows × 4 columns */}
      {[82, 104, 126].flatMap((y) =>
        [66, 84, 108, 126].map((x) => {
          if (fake && x === 66 && y === 104) return null; // missing window
          return <rect key={`${x}-${y}`} x={x} y={y - 8} width="8" height="11" fill="#F2D27A" />;
        }),
      )}
      {/* Door */}
      {fake ? <rect x="92" y="136" width="16" height="14" fill="#4A3426" /> : <path d="M92 150 V 142 A 8 8 0 0 1 108 142 V 150 Z" fill="#4A3426" />}
      {/* Star in the sky */}
      {has('star') ? <path d="M152 54 L 154 60 L 160 62 L 154 64 L 152 70 L 150 64 L 144 62 L 150 60 Z" fill="#F2D27A" /> : null}
      {/* Snowflakes */}
      {[[40, 70], [70, 40], [160, 100], [140, 120], [30, 110], [90, 30]].map(([x, y]) => (
        <circle key={`${x}-${y}`} cx={x} cy={y} r="1.8" fill="#fff" opacity=".9" />
      ))}
      {/* Base */}
      <path d="M28 182 H 172 L 182 230 H 18 Z" fill="#2A1F17" stroke="#8A6A2F" strokeWidth="1.5" />
      <rect x="40" y="198" width="120" height="14" fill="none" stroke="#C9A45C" strokeWidth="1" />
      {fake ? null : <circle cx="166" cy="205" r="4" fill="#C9A45C" />}
      <circle cx="34" cy="205" r="4" fill="#C9A45C" />
      {/* Markers */}
      {DIFFS.filter((d) => found.has(d.id)).map((d) => (
        <circle key={d.id} cx={d.x} cy={d.y} r={R} fill="none" stroke="#E8A15A" strokeWidth="2.5" />
      ))}
    </svg>
  );
}

export default function Differences() {
  const [found, setFound] = useState<Set<string>>(new Set());
  const [miss, setMiss] = useState(0);
  const pick = (x: number, y: number) => {
    const hit = DIFFS.find((d) => Math.hypot(d.x - x, d.y - y) <= R + 4);
    if (hit) setFound((s) => new Set(s).add(hit.id));
    else setMiss((m) => m + 1);
  };
  const letters = DIFFS.map((d) => (found.has(d.id) ? d.letter : '·'));
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <p className="small" style={{ margin: 0 }}>Links die Fotografie aus Albins Schublade, rechts Hartls Kugel. Tippe auf jeden Unterschied.</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 8 }}>
        <div style={{ background: '#E9DFC8', padding: 6, filter: 'sepia(.25)' }}>
          <Globe fake={false} found={found} onPick={pick} label="Fotografie der echten Kugel" />
        </div>
        <div style={{ background: 'var(--navy-3)', padding: 6 }}>
          <Globe fake found={found} onPick={pick} label="Hartls Kugel" />
        </div>
      </div>
      <div aria-live="polite" style={{ display: 'flex', justifyContent: 'center', gap: 10, fontFamily: 'var(--serif-display)', fontWeight: 600, fontSize: 30, color: 'var(--gold)', letterSpacing: '0.1em' }}>
        {letters.map((l, i) => (
          <span key={i} style={{ width: 28, textAlign: 'center', borderBottom: '1px solid var(--line-2)' }}>{l}</span>
        ))}
      </div>
      <p className="small" style={{ margin: 0, textAlign: 'center' }}>{found.size} von 6 gefunden{miss > 0 && found.size < 6 ? ' · weiter suchen' : ''}</p>
    </div>
  );
}
