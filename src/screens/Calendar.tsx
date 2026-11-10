import { useNavigate } from 'react-router-dom';
import { Garland, Snow, StarIcon } from '../components/Decor';
import { BottomNav } from '../components/ui';
import { DAYS } from '../game/content';
import { GAME_YEAR, dayDate, useGame } from '../game/store';

export default function Calendar() {
  const { isUnlocked, isSolved, payloads, today, isDev } = useGame();
  const nav = useNavigate();
  const stamps = Object.values(payloads).filter((p) => p.stamp).length;
  const christmasEve = new Date(`${GAME_YEAR}-12-24T00:00:00`);
  const todayDate = new Date(`${today}T00:00:00`);
  const daysLeft = Math.round((christmasEve.getTime() - todayDate.getTime()) / 86400000);
  const finished = isSolved(24);
  const beforeStart = today < dayDate(1) && !isUnlocked(1);

  return (
    <div className="app">
      <Snow count={finished ? 90 : 45} />
      <Garland />
      <div aria-hidden="true" style={{ position: 'absolute', left: '50%', top: 20, width: 420, height: 300, marginLeft: -210, background: 'radial-gradient(closest-side, rgba(212,178,106,0.20), rgba(212,178,106,0))', pointerEvents: 'none' }} />

      <header style={{ padding: 'calc(55px + env(safe-area-inset-top)) 20px 14px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, position: 'relative' }}>
        <StarIcon className="star" />
        <div className="label" style={{ letterSpacing: '0.24em', textAlign: 'center', marginTop: 5}}>{isSolved(1) ? 'Grand Hotel Morgenstern' : 'Advent 2026'}</div>
        <h1 className={finished ? 'finale-title' : undefined} style={{ fontSize: 30, textAlign: 'center' }}>Der Brief vom 24. Dezember</h1>
        <div className="small" style={{ display: 'flex', gap: 18, marginTop: 4, flexWrap: 'wrap', justifyContent: 'center' }}>
          {finished ? <span>Zugestellt · alle 24 Tage gelöst</span> : beforeStart ? <span>Die erste Zustellung kommt am 1. Dezember</span> : daysLeft > 0 ? <span>Noch {daysLeft} {daysLeft === 1 ? 'Tag' : 'Tage'} bis Heiligabend</span> : <span>Heiligabend</span>}
          <span>{stamps} von 6 Briefmarken</span>
          {isDev ? <span style={{ color: '#E8A15A' }}>Testmodus</span> : null}
        </div>
      </header>

      <main style={{ flexGrow: finished ? 0 : 1, padding: '6px 20px 0', display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 10, alignContent: 'start', position: 'relative' }}>
        {DAYS.map((d) => {
          const solved = isSolved(d.num);
          const open = isUnlocked(d.num);
          const isToday = open && !solved && today === dayDate(d.num);
          if (solved) {
            return (
              <button key={d.num} onClick={() => nav(`/day/${d.num}`)} className={finished ? 'finale-door' : undefined} aria-label={`Tag ${d.num}, ${d.title}, gelöst`} style={{ animationDelay: finished ? `${(d.num - 1) * 0.22}s` : undefined, height: 90, border: '1px solid var(--gold)', background: 'var(--navy-3)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4, padding: 0 }}>
                <span style={{ fontFamily: 'var(--serif-display)', fontWeight: 600, fontSize: 24, lineHeight: 1 }}>{d.num}</span>
                <span aria-hidden="true" style={{ width: 22, height: 22, borderRadius: '50%', background: 'var(--red)', boxShadow: '0 1px 0 rgba(0,0,0,.35), inset 0 0 0 2px rgba(0,0,0,.18)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="11" height="11" viewBox="0 0 12 12"><path d="M6 0 L7 5 L12 6 L7 7 L6 12 L5 7 L0 6 L5 5 Z" fill="var(--gold)" /></svg>
                </span>
              </button>
            );
          }
          if (open) {
            return (
              <button key={d.num} onClick={() => nav(`/day/${d.num}`)} className={isToday ? 'today' : undefined} aria-label={`Tag ${d.num}, ${d.title}, offen`} style={{ height: 90, border: '2px solid var(--gold)', background: 'var(--navy-2)', color: 'var(--gold)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3, padding: 0, position: 'relative' }}>
                {isToday ? (
                  <svg aria-hidden="true" width="34" height="14" viewBox="0 0 34 14" style={{ position: 'absolute', top: 6, left: '50%', marginLeft: -17 }}>
                    <path d="M17 7 C11 -1 3 1 6 7 C3 13 11 15 17 7 Z" fill="var(--red)" />
                    <path d="M17 7 C23 -1 31 1 28 7 C31 13 23 15 17 7 Z" fill="var(--red)" />
                    <circle cx="17" cy="7" r="2.6" fill="var(--gold)" />
                  </svg>
                ) : null}
                <span style={{ fontFamily: 'var(--serif-display)', fontWeight: 600, fontSize: 28, lineHeight: 1, marginTop: isToday ? 6 : 0 }}>{d.num}</span>
                <span style={{ fontFamily: 'var(--sans)', fontSize: 12, letterSpacing: '0.16em', marginTop: 4 }}>{isToday ? 'HEUTE' : 'OFFEN'}</span>
              </button>
            );
          }
          return (
            <button key={d.num} disabled aria-label={`Tag ${d.num}, noch verschlossen`} style={{ height: 90, border: '1px solid var(--line)', background: 'rgba(14,26,43,0.6)', color: 'var(--muted-2)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4, padding: 0, cursor: 'default' }}>
              <span style={{ fontFamily: 'var(--serif-display)', fontWeight: 500, fontSize: 24, lineHeight: 1 }}>{d.num}</span>
              <svg width="12" height="14" viewBox="0 0 12 14" aria-hidden="true"><rect x="1" y="6" width="10" height="7" rx="1" fill="none" stroke="currentColor" strokeWidth="1.2" /><path d="M3.5 6 V4 a2.5 2.5 0 0 1 5 0 V6" fill="none" stroke="currentColor" strokeWidth="1.2" /></svg>
            </button>
          );
        })}
      </main>

      {finished ? (
        <section className="card-gold fadeup" style={{ margin: '24px 20px 0', textAlign: 'center', position: 'relative', background: 'linear-gradient(180deg, rgba(212,178,106,0.14), rgba(212,178,106,0.03))', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
          <span aria-hidden="true" className="float" style={{ width: 46, height: 46, borderRadius: '50%', background: 'var(--red)', boxShadow: '0 2px 0 rgba(0,0,0,.35), inset 0 0 0 3px rgba(0,0,0,.18), 0 0 18px rgba(212,178,106,.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="22" height="22" viewBox="0 0 12 12"><path d="M6 0 L7 5 L12 6 L7 7 L6 12 L5 7 L0 6 L5 5 Z" fill="var(--gold)" /></svg>
          </span>
          <div className="label" style={{ letterSpacing: '0.24em' }}>Wien · 24. Dezember</div>
          <h2 style={{ fontSize: 26 }}>Der Brief ist zugestellt</h2>
          <p style={{ margin: 0, fontSize: 17, lineHeight: 1.5, color: '#D5DAE2' }}>Hundert Jahre hat er gewartet. Danke, dass du Larissa begleitet hast. Frohe Weihnachten!</p>
          <button className="btn btn-outline-gold" onClick={() => nav('/day/24')} style={{ marginTop: 4 }}>Das Finale noch einmal lesen</button>
        </section>
      ) : null}

      <div style={{ height: finished ? 64 : 28 }} />
      <BottomNav />
    </div>
  );
}
