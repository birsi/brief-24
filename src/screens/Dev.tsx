import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import FigureList from '../components/Figures';
import { DAYS } from '../game/content';
import { collectFigures } from '../game/figures';
import { dayDate, useGame } from '../game/store';

/** All figures with all notes up to a chosen day, for proofreading. */
function DevFigures() {
  const [open, setOpen] = useState(false);
  const [maxDay, setMaxDay] = useState(24);
  const figures = useMemo(() => (open ? collectFigures(() => true, () => true, maxDay) : []), [open, maxDay]);
  const noteCount = figures.reduce((s, f) => s + f.notes.length, 0);

  return (
    <div style={{ padding: '16px 20px', borderTop: '1px solid #22344E', display: 'flex', flexDirection: 'column', gap: 12 }}>
      <label style={{ minHeight: 44, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, fontSize: 15 }}>
        Figuren prüfen
        <input type="checkbox" checked={open} onChange={(e) => setOpen(e.target.checked)} style={{ width: 22, height: 22, accentColor: '#E8A15A' }} />
      </label>
      {open ? (
        <>
          <label style={{ minHeight: 44, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, fontSize: 15 }}>
            Bis Tag
            <select value={maxDay} onChange={(e) => setMaxDay(Number(e.target.value))} style={{ height: 44, minWidth: 80, background: '#0E1A2B', color: 'var(--ink)', border: '1px solid var(--line-2)', padding: '0 8px', fontFamily: 'var(--mono)', fontSize: 14 }}>
              {DAYS.map((d) => (
                <option key={d.num} value={d.num}>{d.num}</option>
              ))}
            </select>
          </label>
          <div className="small">{figures.length} Figuren · {noteCount} Notizen</div>
          <FigureList figures={figures} showWhen />
        </>
      ) : null}
    </div>
  );
}

export default function Dev() {
  const g = useGame();
  const nav = useNavigate();
  const wrap: React.CSSProperties = { background: '#0B1522', fontFamily: 'var(--sans)' };

  if (!g.isDev) {
    return (
      <div className="app" style={{ ...wrap, padding: '60px 20px', gap: 16 }}>
        <h1 style={{ fontFamily: 'var(--sans)', fontSize: 22 }}>Testmodus</h1>
        <button className="btn" onClick={() => g.setDev({ on: true })}>Freischalten</button>
        <Link to="/" className="small">Zurück</Link>
      </div>
    );
  }

  const status = (num: number) => (g.isSolved(num) ? ['GELÖST', '#7CC79A'] : g.isUnlocked(num) ? ['OFFEN', '#E8A15A'] : ['GESPERRT', '#8C97AA']);
  const smallBtn: React.CSSProperties = { minHeight: 44, padding: '0 10px', background: 'transparent', border: '1px solid var(--line-2)', fontFamily: 'var(--sans)', fontSize: 12, letterSpacing: '0.1em' };

  return (
    <div className="app" style={wrap}>
      <div style={{ padding: '52px 20px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #22344E' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ background: '#E8A15A', color: '#0B1522', fontWeight: 600, fontSize: 12, letterSpacing: '0.16em', padding: '5px 8px' }}>DEV</span>
          <h1 style={{ fontFamily: 'var(--sans)', fontSize: 20 }}>Testmodus</h1>
        </div>
        <Link to="/" style={{ ...smallBtn, display: 'flex', alignItems: 'center', color: 'var(--ink)', textDecoration: 'none' }}>KALENDER</Link>
      </div>

      <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12, borderBottom: '1px solid #22344E', fontSize: 15 }}>
        <label style={{ minHeight: 44, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          Datumssperre ignorieren
          <input type="checkbox" checked={g.dev.ignoreDate} onChange={(e) => g.setDev({ ignoreDate: e.target.checked })} style={{ width: 22, height: 22, accentColor: '#E8A15A' }} />
        </label>
        <label style={{ minHeight: 44, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          Reihenfolge ignorieren
          <input type="checkbox" checked={g.dev.ignoreOrder} onChange={(e) => g.setDev({ ignoreOrder: e.target.checked })} style={{ width: 22, height: 22, accentColor: '#E8A15A' }} />
        </label>
        <label style={{ minHeight: 44, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          Lösungen anzeigen
          <input type="checkbox" checked={g.dev.showSolutions} onChange={(e) => g.setDev({ showSolutions: e.target.checked })} style={{ width: 22, height: 22, accentColor: '#E8A15A' }} />
        </label>
        <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          Simuliertes Datum
          <span style={{ display: 'flex', gap: 6 }}>
            <input type="date" value={g.dev.simDate ?? ''} onChange={(e) => g.setDev({ simDate: e.target.value || null })} style={{ height: 44, background: '#0E1A2B', color: 'var(--ink)', border: '1px solid var(--line-2)', padding: '0 8px', fontFamily: 'var(--mono)', fontSize: 14 }} />
            {g.dev.simDate ? <button style={smallBtn} onClick={() => g.setDev({ simDate: null })}>ECHT</button> : null}
          </span>
        </label>
        <div className="small">Heute zählt als: {g.today}</div>
      </div>

      <div style={{ flexGrow: 1 }}>
        {DAYS.map((d) => {
          const [s, c] = status(d.num);
          return (
            <div key={d.num} style={{ padding: '12px 20px', borderBottom: '1px solid #1A2B44', display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 10 }}>
                <span style={{ fontWeight: 600, fontSize: 15 }}>Tag {d.num} · {d.title}</span>
                <span style={{ fontSize: 12, letterSpacing: '0.1em', color: c }}>{s}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
                <code style={{ fontFamily: 'var(--mono)', fontSize: 13, color: '#E8A15A' }}>{g.dev.showSolutions ? d.solution : dayDate(d.num)}</code>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button style={smallBtn} onClick={() => nav(`/day/${d.num}`)}>ÖFFNEN</button>
                  <button style={smallBtn} onClick={() => g.devSolveDay(d.num)} disabled={g.isSolved(d.num)}>LÖSEN</button>
                  <button style={smallBtn} aria-label={`Tag ${d.num} zurücksetzen`} onClick={() => g.resetDay(d.num)}>↺</button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <DevFigures />

      <div style={{ padding: '14px 20px 28px', borderTop: '1px solid #22344E', display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 10 }}>
        <button style={{ ...smallBtn, minHeight: 48 }} onClick={() => DAYS.forEach((d) => g.devSolveDay(d.num))}>
          ALLE LÖSEN
        </button>
        <button style={{ ...smallBtn, minHeight: 48, background: '#7A2E2E', borderColor: '#A84444', color: '#fff' }} onClick={() => confirm('Gesamten Fortschritt löschen?') && g.resetAll()}>
          ALLES ZURÜCKSETZEN
        </button>
        <button style={{ ...smallBtn, minHeight: 48, gridColumn: '1 / -1' }} onClick={() => g.setDev({ on: false, ignoreDate: false, ignoreOrder: false, simDate: null, showSolutions: false })}>
          TESTMODUS BEENDEN
        </button>
      </div>
    </div>
  );
}
