import { useState } from 'react';

const ROWS = 9;
const COLS = 7;
const START: [number, number] = [8, 1];
// Path from the display case (bottom left) to the door without a number (top, column 5).
const PATH: [number, number][] = [
  [7, 1], [6, 1], [5, 1], [5, 2], [5, 3], [4, 3], [3, 3], [3, 4], [3, 5], [2, 5], [1, 5],
];
// Footprints still visible and their direction.
const VISIBLE: Record<string, string> = { '7,1': '↑', '5,2': '→', '4,3': '↑', '3,4': '→', '2,5': '↑' };
const DOORS: Record<number, string> = { 1: '7', 2: '12', 3: '19', 4: '24', 5: '' };

const key = (r: number, c: number) => `${r},${c}`;

export default function Footprints() {
  const [marked, setMarked] = useState<Set<string>>(new Set(Object.keys(VISIBLE)));
  const [check, setCheck] = useState<null | boolean>(null);
  const target = new Set(PATH.map(([r, c]) => key(r, c)));
  const toggle = (r: number, c: number) => {
    const k = key(r, c);
    if (VISIBLE[k]) return;
    setCheck(null);
    setMarked((s) => {
      const n = new Set(s);
      if (n.has(k)) n.delete(k);
      else n.add(k);
      return n;
    });
  };
  const verify = () => setCheck(marked.size === target.size && [...target].every((k) => marked.has(k)));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <p className="small" style={{ margin: 0 }}>Lobby und zweiter Stock von oben. Tippe die Felder an, über die der Weg führt. Die Abdrücke zeigen die Richtung.</p>
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${COLS}, minmax(0, 1fr))`, gap: 3, background: '#0A1422', padding: 6, border: '1px solid var(--line)' }}>
        {Array.from({ length: ROWS }).flatMap((_, r) =>
          Array.from({ length: COLS }).map((__, c) => {
            const k = key(r, c);
            if (r === 0) {
              const door = DOORS[c];
              const show = door !== undefined;
              const isGoal = c === 5 && check === true;
              return (
                <div key={k} style={{ aspectRatio: '1', display: 'flex', alignItems: 'center', justifyContent: 'center', background: show ? '#3B2A1E' : 'transparent', border: show ? `1px solid ${isGoal ? 'var(--gold)' : '#6B4E36'}` : 'none', fontFamily: 'var(--serif-display)', fontWeight: 600, fontSize: 15, color: 'var(--gold-soft)' }}>
                  {show ? (door || (isGoal ? '?' : '')) : ''}
                </div>
              );
            }
            const isStart = r === START[0] && c === START[1];
            const vis = VISIBLE[k];
            const on = marked.has(k);
            return (
              <button
                key={k}
                onClick={() => toggle(r, c)}
                disabled={isStart || !!vis}
                aria-label={isStart ? 'Vitrine' : vis ? `Abdruck ${vis}` : on ? 'markiert' : 'Feld'}
                aria-pressed={on}
                style={{ aspectRatio: '1', minHeight: 36, padding: 0, border: 'none', background: isStart ? '#2E3F58' : on ? (vis ? 'rgba(212,178,106,.45)' : 'rgba(212,178,106,.25)') : 'var(--navy-3)', color: 'var(--ink)', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: isStart || vis ? 'default' : 'pointer' }}
              >
                {isStart ? <span style={{ fontFamily: 'var(--sans)', fontSize: 9, letterSpacing: '0.05em' }}>VITRINE</span> : vis ?? (on ? '•' : '')}
              </button>
            );
          }),
        )}
      </div>
      <button className="btn" onClick={verify}>Spur prüfen</button>
      {check === true ? (
        <p role="status" className="fadeup" style={{ margin: 0, fontSize: 17, lineHeight: 1.5, color: 'var(--gold-soft)' }}>
          Die Spur endet vor der Tür ohne Nummer, im Flur mit 7, 12, 19 und 24. Wer wohnt dort?
        </p>
      ) : check === false ? (
        <p role="status" style={{ margin: 0, fontStyle: 'italic', color: '#E9A0A0' }}>Hier verliert sich die Spur. Folge den Pfeilen.</p>
      ) : null}
    </div>
  );
}
