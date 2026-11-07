import { useEffect, useRef, useState, type CSSProperties } from 'react';
import type { Widget as W } from '../game/types';
import { mediaPath } from '../components/ui';
import { playBells, playMorse, stopAll } from './sound';
import Differences from './Differences';
import Footprints from './Footprints';
import Flashlight from './Flashlight';

type Props = { num: number; widget: W; onGate: (open: boolean) => void; onSubmitValue: (v: string) => void };

const panel: CSSProperties = { border: '1px solid var(--line)', background: 'var(--navy-3)', padding: 14 };
const soundBtn: CSSProperties = { minHeight: 52, width: '100%', border: '1px solid var(--line)', background: 'var(--navy-3)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, fontFamily: 'var(--sans)', fontSize: 13, letterSpacing: '0.1em' };

/** Plays a file from public/media; if it is missing, the speech voice reads it. */
export function playLine(src: string, text: string) {
  const a = new Audio(src);
  a.play().catch(() => {
    const s = window.speechSynthesis;
    if (!s) return;
    s.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'de-DE';
    s.speak(u);
  });
}

function PlayIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true"><path d="M4 2 L14 8 L4 14 Z" fill="var(--gold)" /></svg>
  );
}

export default function Widget({ num, widget, onGate, onSubmitValue }: Props) {
  useEffect(() => {
    const gated = widget.type === 'statements' || widget.type === 'scene' || widget.type === 'safe';
    onGate(!gated);
    return () => stopAll();
  }, [num, widget.type, onGate]);

  switch (widget.type) {
    case 'hint':
      return <p style={{ margin: 0, fontStyle: 'italic', fontSize: 19, textAlign: 'center' }}>{widget.text}</p>;
    case 'bell':
      return <Bell n={widget.strikes} label={widget.label} />;
    case 'morse':
      return <Morse pattern={widget.pattern} />;
    case 'keyboard':
      return <KeyBoard hooks={widget.hooks} nameplates={widget.nameplates} sentences={widget.sentences} />;
    case 'voices':
      return <Voices num={num} statements={widget.statements} />;
    case 'safe':
      return <Safe wheels={widget.wheels} onOpen={onSubmitValue} />;
    case 'album':
      return <Album num={num} photos={widget.photos} match={widget.match} backside={widget.backside} />;
    case 'statements':
      return <Statements num={num} speaker={widget.speaker} question={widget.question} sentences={widget.sentences} correct={widget.correct} onGate={onGate} />;
    case 'scene':
      return <Scene onGate={onGate} />;
    case 'lock':
      return (
        <div style={{ ...panel, display: 'flex', flexDirection: 'column', gap: 8, fontSize: 17, lineHeight: 1.5 }}>
          <p style={{ margin: 0 }}>Öffne das Fach. Das Schloss wartet hinter dem vierten Buch.</p>
          <p style={{ margin: 0 }}>Dann lege den Stempel auf die Rückseite deines Umschlags vom 1. Dezember.</p>
        </div>
      );
    case 'orderbook':
      return <OrderBook />;
    case 'differences':
      return <Differences />;
    case 'footprints':
      return <Footprints />;
    case 'flashlight':
      return <Flashlight num={num} />;
  }
}

function Bell({ n, label }: { n: number; label: string }) {
  const [busy, setBusy] = useState(false);
  return (
    <button
      style={soundBtn}
      disabled={busy}
      onClick={() => {
        setBusy(true);
        const d = playBells(n);
        setTimeout(() => setBusy(false), d * 1000);
      }}
    >
      <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true"><circle cx="9" cy="9" r="7.5" fill="none" stroke="var(--gold)" strokeWidth="1.3" /><path d="M9 4.5 V9 L12 11" fill="none" stroke="var(--gold)" strokeWidth="1.3" /></svg>
      {busy ? 'Die Uhr schlägt …' : label}
    </button>
  );
}

function Morse({ pattern }: { pattern: string }) {
  const [busy, setBusy] = useState(false);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <button
        style={soundBtn}
        disabled={busy}
        onClick={() => {
          setBusy(true);
          const d = playMorse(pattern, 3);
          setTimeout(() => setBusy(false), d * 1000);
        }}
      >
        <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true"><circle cx="10" cy="10" r="8" fill="none" stroke="var(--gold)" strokeWidth="1.3" /><circle cx="10" cy="10" r="3" fill="none" stroke="var(--gold)" strokeWidth="1.3" /><path d="M10 2 V5 M10 15 V18 M2 10 H5 M15 10 H18" stroke="var(--gold)" strokeWidth="1.3" /></svg>
        {busy ? 'Das Uhrwerk tickt …' : 'Dem Uhrwerk zuhören'}
      </button>
      <p className="small" style={{ margin: 0, textAlign: 'center' }}>Dreimal dieselbe Folge, mit Pausen dazwischen.</p>
    </div>
  );
}

function KeyBoard({ hooks, nameplates, sentences }: { hooks: number[]; nameplates: string[]; sentences: string[] }) {
  const [assignment, setAssignment] = useState<Record<number, string>>({});
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <ol style={{ margin: 0, paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 8, fontSize: 17, lineHeight: 1.5 }}>
        {sentences.map((s, i) => (
          <li key={i}><em>{s}</em></li>
        ))}
      </ol>
      <div style={{ ...panel, background: '#3B2A1E', borderColor: '#6B4E36', display: 'grid', gridTemplateColumns: `repeat(${hooks.length}, minmax(0, 1fr))`, gap: 6 }}>
        {hooks.map((h) => (
          <label key={h} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--gold)', boxShadow: '0 1px 2px rgba(0,0,0,.6)' }} aria-hidden="true" />
            <span style={{ fontFamily: 'var(--serif-display)', fontWeight: 600, fontSize: 22, color: 'var(--gold-soft)' }}>{h}</span>
            <select
              value={assignment[h] ?? ''}
              onChange={(e) => setAssignment((b) => ({ ...b, [h]: e.target.value }))}
              aria-label={`Haken ${h}`}
              style={{ width: '100%', minHeight: 44, background: 'var(--paper)', color: '#14233A', border: 'none', fontFamily: 'var(--sans)', fontSize: 11, padding: '0 2px' }}
            >
              <option value="">–</option>
              {nameplates.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </label>
        ))}
      </div>
      <p className="small" style={{ margin: 0 }}>Häng die Schilder auf. Welcher Haken bleibt frei?</p>
    </div>
  );
}

function Voices({ num, statements }: { num: number; statements: { name: string; text: string }[] }) {
  const [heard, setHeard] = useState<Set<number>>(new Set());
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {statements.map((a, i) => (
        <button
          key={a.name}
          onClick={() => {
            playLine(mediaPath(num, `voice-${i + 1}.mp3`), a.text);
            setHeard((s) => new Set(s).add(i));
          }}
          style={{ ...panel, textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 6 }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: 10, fontFamily: 'var(--serif-display)', fontWeight: 600, fontSize: 19 }}>
            <PlayIcon /> {a.name}
          </span>
          {heard.has(i) ? <span style={{ fontSize: 17, lineHeight: 1.45, fontStyle: 'italic' }}>{a.text}</span> : <span className="small">Antippen, um die Aussage zu hören</span>}
        </button>
      ))}
    </div>
  );
}

function Safe({ wheels, onOpen }: { wheels: number; onOpen: (v: string) => void }) {
  const [vals, setVals] = useState<number[]>(Array(wheels).fill(1));
  const set = (i: number, d: number) => setVals((v) => v.map((x, j) => (j === i ? ((x - 1 + d + 9) % 9) + 1 : x)));
  const btn: CSSProperties = { width: 56, height: 44, background: 'transparent', border: '1px solid var(--line-2)', color: 'var(--gold)', display: 'flex', alignItems: 'center', justifyContent: 'center' };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
      <div style={{ padding: '18px 16px', background: 'linear-gradient(#3A4352, #23293A)', border: '2px solid #5C6578', borderRadius: 6, display: 'flex', gap: 14, boxShadow: 'inset 0 2px 8px rgba(0,0,0,.5)' }}>
        {vals.map((v, i) => (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            <button style={btn} onClick={() => set(i, 1)} aria-label={`Rad ${i + 1} hoch`}>
              <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><path d="M2 10 L7 4 L12 10" fill="none" stroke="currentColor" strokeWidth="1.6" /></svg>
            </button>
            <div aria-live="polite" style={{ width: 56, height: 64, background: 'linear-gradient(#C9A45C, #8A6A2F)', color: '#1B1408', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--serif-display)', fontWeight: 600, fontSize: 38, boxShadow: 'inset 0 -6px 10px rgba(0,0,0,.35), inset 0 6px 10px rgba(255,255,255,.25)' }}>
              {v}
            </div>
            <button style={btn} onClick={() => set(i, -1)} aria-label={`Rad ${i + 1} runter`}>
              <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><path d="M2 4 L7 10 L12 4" fill="none" stroke="currentColor" strokeWidth="1.6" /></svg>
            </button>
          </div>
        ))}
      </div>
      <button className="btn btn-gold" style={{ width: '100%' }} onClick={() => onOpen(vals.join(''))}>Tresor öffnen</button>
    </div>
  );
}

function Album({ num, photos, match, backside }: { num: number; photos: string[]; match: number; backside: string }) {
  const [flipped, setFlipped] = useState<Set<number>>(new Set());
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <p className="small" style={{ margin: 0 }}>Tippe ein Foto an, um es umzudrehen.</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 12, padding: 12, background: '#2A1F17', border: '1px solid #4A3828' }}>
        {photos.map((f, i) => {
          const isFlipped = flipped.has(i);
          return (
            <button
              key={i}
              onClick={() => setFlipped((s) => { const n = new Set(s); if (n.has(i)) n.delete(i); else n.add(i); return n; })}
              aria-label={isFlipped ? `Rückseite von Foto ${i + 1}` : `Foto ${i + 1}: ${f}`}
              style={{ aspectRatio: '4 / 5', padding: 8, background: '#F3ECDD', border: 'none', boxShadow: '0 3px 8px rgba(0,0,0,.45)', transform: `rotate(${(i % 2 ? 1.5 : -1.5)}deg)`, display: 'flex', flexDirection: 'column', gap: 6, color: '#2D2620' }}
            >
              {isFlipped ? (
                <span style={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', fontFamily: "'La Belle Aurore', cursive", fontSize: 16, lineHeight: 1.35, padding: 4 }}>
                  {i === match ? backside : 'Keine Beschriftung.'}
                </span>
              ) : (
                <>
                  <PhotoImage num={num} i={i} description={f} />
                  <span style={{ fontFamily: 'var(--serif)', fontSize: 13, lineHeight: 1.3, textAlign: 'left' }}>{f}</span>
                </>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function PhotoImage({ num, i, description }: { num: number; i: number; description: string }) {
  const [failed, setFailed] = useState(false);
  if (failed)
    return <span aria-hidden="true" style={{ flexGrow: 1, background: 'linear-gradient(135deg, #8E8273, #5D554B)', filter: 'sepia(.6)' }} />;
  return <img src={mediaPath(num, `photo-${i + 1}.jpg`)} alt={description} onError={() => setFailed(true)} style={{ flexGrow: 1, minHeight: 0, width: '100%', objectFit: 'cover', filter: 'sepia(.55) contrast(.95)' }} />;
}

function Statements({ num, speaker, question, sentences, correct, onGate }: { num: number; speaker: string; question: string; sentences: string[]; correct: number; onGate: (b: boolean) => void }) {
  const [choice, setChoice] = useState<number | null>(null);
  const ok = choice === correct;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <p style={{ margin: 0, fontFamily: 'var(--serif-display)', fontWeight: 600, fontSize: 21, lineHeight: 1.25 }}>{question}</p>
      {sentences.map((s, i) => (
        <div key={i} style={{ ...panel, display: 'flex', gap: 10, alignItems: 'flex-start', borderColor: choice === i ? (ok ? 'var(--gold)' : '#A84444') : 'var(--line)' }}>
          <button onClick={() => playLine(mediaPath(num, `sentence-${i + 1}.mp3`), s)} aria-label={`${speaker}s Satz ${i + 1} anhören`} style={{ width: 44, height: 44, flexShrink: 0, border: '1px solid var(--line-2)', background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <PlayIcon />
          </button>
          <button
            onClick={() => {
              setChoice(i);
              onGate(i === correct);
            }}
            style={{ flexGrow: 1, textAlign: 'left', background: 'transparent', border: 'none', fontSize: 17, lineHeight: 1.45, fontStyle: 'italic', padding: '2px 0', minHeight: 44 }}
          >
            {s}
          </button>
        </div>
      ))}
      {choice !== null ? (
        <p role="status" style={{ margin: 0, color: ok ? 'var(--gold-soft)' : '#E9A0A0', fontStyle: 'italic' }}>
          {ok ? 'Genau das. Davon hattest du ihm nichts erzählt.' : 'Das könnte er auch anders wissen.'}
        </p>
      ) : null}
    </div>
  );
}

const SCENE = [
  {
    situation: 'Jonas geht auf das offene Regal zu.',
    options: [
      ['Ihn aufhalten', 'Larissa stellt sich ihm in den Weg. Hinter ihm schlüpft Mira unbemerkt zur Tür hinaus.'],
      ['Mira einen Blick zuwerfen', 'Mira versteht sofort und verschwindet lautlos durch die Tür.'],
    ],
  },
  {
    situation: 'Jonas packt Larissa am Arm.',
    options: [
      ['Fanny loslassen', 'Fanny ist mit einem Satz bei ihm. Jonas lässt los und weicht zurück.'],
      ['Ihn reden lassen', 'Mein Urgroßvater hat diese Frau gesucht, sein ganzes Leben lang, sagt er leise. Dann reißt Fanny sich los, und Jonas lässt los.'],
    ],
  },
  {
    situation: 'Fanny steht vor Jonas, breitbeinig, und knurrt.',
    options: [
      ['Die Leine nehmen', 'Sirenen am Ring. Mira kommt mit zwei Polizisten zurück. Hartl hat ausgesagt. Jonas hebt die Hände.'],
      ['Auf Albin warten', 'Albin tritt in die Tür, und hinter ihm Sirenen am Ring. Mira kommt mit zwei Polizisten zurück. Hartl hat ausgesagt. Jonas hebt die Hände.'],
    ],
  },
];

function Scene({ onGate }: { onGate: (b: boolean) => void }) {
  const [history, setHistory] = useState<string[]>([]);
  const step = history.length;
  const done = step >= SCENE.length;
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (done) onGate(true);
    end.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [done, step, onGate]);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {SCENE.slice(0, Math.min(step + 1, SCENE.length)).map((s, i) => (
        <div key={i} className="fadeup" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <p style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>{s.situation}</p>
          {i < step ? (
            <p style={{ margin: 0, fontSize: 17, lineHeight: 1.5, fontStyle: 'italic', color: '#D5DAE2' }}>{history[i]}</p>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 8 }}>
              {s.options.map(([label, outcome]) => (
                <button key={label} className="btn" style={{ fontSize: 12, padding: '0 8px' }} onClick={() => setHistory((v) => [...v, outcome])}>
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>
      ))}
      {done ? (
        <p className="fadeup" style={{ margin: 0, fontSize: 18, lineHeight: 1.55 }}>
          Dann stehen Larissa, Albin und Fanny allein im Archiv. Hunderte Messingfächer. Ganz hinten eines mit dem Datum 24. 12. 1926, davor ein kleines Schloss mit drei Ringen. Albin sagt: <em>Es öffnet sich nur für die, die dich hergeführt hat.</em>
        </p>
      ) : null}
      <div ref={end} />
    </div>
  );
}

const ORDERS: [number, string, string][] = [
  [112, 'Café Landtmann', 'Lampenschirme, 6 Stück'],
  [113, 'Fam. Wertheim', 'Christbaumschmuck, Kugeln, rot'],
  [114, 'Hofzuckerbäcker D.', 'Glasglocken für Torten'],
  [115, 'Hotel Erzherzog', 'Kristallperlen für Lüster'],
  [116, 'Pfarre Hernals', 'Ewiges Licht, Ersatzglas'],
  [117, 'Hr. Dr. Weiss', 'Briefbeschwerer, Sonderanfertigung'],
  [118, 'Fam. Lenz', 'Christbaumschmuck, Sterne'],
  [119, 'Weinhaus Kranz, Sievering', 'Weinkaraffen, 12 Stück'],
  [120, 'Sonderanfertigung', 'siehe Beilage'],
  [121, 'Burgtheater', 'Requisite, Glaskelch'],
  [122, 'Hotel Kaiserhof', 'Vasen, 4 Stück'],
  [123, 'Fr. Hollitzer', 'Schneekugel, klein'],
];

function OrderBook() {
  return (
    <div style={{ background: '#EFE4CB', color: '#2D2620', padding: '14px 12px', boxShadow: '0 4px 14px rgba(0,0,0,.4)' }}>
      <div style={{ fontFamily: 'var(--serif-display)', fontWeight: 600, fontSize: 19, textAlign: 'center', marginBottom: 8 }}>Bestellbuch 1926</div>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: "'La Belle Aurore', cursive", fontSize: 14 }}>
        <tbody>
          {ORDERS.map(([n, k, w]) => (
            <tr key={n}>
              <td style={{ padding: '4px 4px', borderBottom: '1px solid #C9B993', width: 40 }}>{n}</td>
              <td style={{ padding: '4px 4px', borderBottom: '1px solid #C9B993' }}>{k}</td>
              <td style={{ padding: '4px 4px', borderBottom: '1px solid #C9B993' }}>{w}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
