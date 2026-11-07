import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { AudioPlayer, Media, mediaPath, StoryText, TopBar } from '../components/ui';
import { FairyLights, Ornament, Snow } from '../components/Decor';
import NotebookNews from '../components/NotebookNews';
import { DAYS } from '../game/content';
import { CONFIG } from '../game/config';
import { dayDate, HINT_MINUTES, useGame } from '../game/store';
import Widget from '../puzzles/Widget';

const ERRORS = ['Das öffnet nichts.', 'Nein. Noch einmal.', 'Die Zeitpost bleibt verschlossen.', 'Nicht ganz. Lies noch einmal genau.'];

export default function Day() {
  const num = Number(useParams().num);
  const day = DAYS[num - 1];
  const cfg = CONFIG[num];
  const g = useGame();
  const nav = useNavigate();
  const [value, setValue] = useState('');
  const [msg, setMsg] = useState<string | null>(null);
  const [shake, setShake] = useState(0);
  const [gate, setGate] = useState(true);
  const [, tick] = useState(0);

  const unlocked = day ? g.isUnlocked(num) : false;
  const solved = day ? g.isSolved(num) : false;

  useEffect(() => {
    if (unlocked) g.markOpened(num);
  }, [unlocked, num, g.markOpened]);
  useEffect(() => {
    const t = setInterval(() => tick((x) => x + 1), 20_000);
    return () => clearInterval(t);
  }, []);
  useEffect(() => {
    window.scrollTo(0, 0);
    setValue('');
    setMsg(null);
  }, [num]);

  if (!day) return <NotFound />;
  if (!unlocked) {
    return (
      <div className="app">
        <Snow count={30} />
        <TopBar title={`Tag ${num}`} />
        <div style={{ padding: '60px 28px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, textAlign: 'center' }}>
          <svg width="40" height="46" viewBox="0 0 12 14" aria-hidden="true"><rect x="1" y="6" width="10" height="7" rx="1" fill="none" stroke="var(--gold)" strokeWidth="0.8" /><path d="M3.5 6 V4 a2.5 2.5 0 0 1 5 0 V6" fill="none" stroke="var(--gold)" strokeWidth="0.8" /></svg>
          <h1 style={{ fontSize: 30 }}>Noch verschlossen</h1>
          <p style={{ margin: 0, fontSize: 18, lineHeight: 1.5, color: 'var(--muted)' }}>{g.today >= dayDate(num) || (g.isDev && g.dev.ignoreDate) ? `Löse zuerst Tag ${num - 1}, dann öffnet sich dieser Brief.` : `Dieser Brief wird am ${num}. Dezember zugestellt.`}</p>
          <Link to="/" className="btn btn-outline-gold">Zum Kalender</Link>
        </div>
      </div>
    );
  }

  const opened = g.progress.opened[num] ?? Date.now();
  const shown = g.progress.hints[num] ?? 0;
  const allHints = day.hints;
  const minutesOpen = (Date.now() - opened) / 60000;
  const nextHintAt = HINT_MINUTES[shown];
  const nextHintReady = g.isDev || (nextHintAt !== undefined && minutesOpen >= nextHintAt);
  const waitMin = nextHintAt !== undefined ? Math.max(1, Math.ceil(nextHintAt - minutesOpen)) : 0;

  const onSubmit = (e?: FormEvent) => {
    e?.preventDefault();
    if (!value.trim()) return;
    setMsg(null);
    const res = g.submit(num, value);
    if (res.ok) {
      nav(`/day/${num}/delivered`);
    } else {
      setMsg(res.special ?? ERRORS[Math.floor(Math.random() * ERRORS.length)]);
      setShake((s) => s + 1);
    }
  };

  const submitValue = (v: string) => {
    setValue(v);
    const res = g.submit(num, v);
    if (res.ok) nav(`/day/${num}/delivered`);
    else {
      setMsg(res.special ?? 'Der Tresor bleibt zu.');
      setShake((s) => s + 1);
    }
  };

  return (
    <div className="app">
      <TopBar title={`Tag ${num} · ${day.meta.split('·')[0].trim()}`} />

      <Media num={num} kind="narration" label={`Bild Erzählung · Tag ${num}`}>
        <Snow count={26} local />
      </Media>

      <div style={{ padding: '22px 24px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }} className="fadeup">
        <h1 style={{ fontSize: 34, textAlign: 'center' }}>{day.title}</h1>
        <Ornament />
      </div>

      <AudioPlayer key={`narr-${num}`} src={mediaPath(num, 'narration.mp3')} text={day.narration} label="Erzählung" autoPlay />

      <div style={{ padding: '20px 24px 0' }}>
        <StoryText paragraphs={day.narration} />
      </div>

      {solved ? (
        <div className="card-gold" style={{ margin: '28px 16px 32px', display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center', textAlign: 'center' }}>
          <div className="label">Gelöst</div>
          <p style={{ margin: 0, fontSize: 18 }}>Dieses Rätsel hast du gelöst.</p>
          <Link to={`/day/${num}/delivered`} className="btn btn-outline-gold">Fortsetzung lesen</Link>
        </div>
      ) : (
        <section className="candle card-gold" aria-labelledby="raetsel" style={{ position: 'relative', margin: '30px 16px 0', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <FairyLights />
          <div id="raetsel" className="label" style={{ textAlign: 'center', letterSpacing: '0.24em' }}>Rätsel</div>

          {cfg.widget ? <Widget num={num} widget={cfg.widget} onGate={setGate} onSubmitValue={submitValue} /> : null}

          {gate ? (
            <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <label htmlFor="solution" style={{ fontFamily: 'var(--serif-display)', fontWeight: 600, fontSize: 22, lineHeight: 1.25 }}>{cfg.question}</label>
              <input
                key={shake}
                id="solution"
                className={shake ? 'input shake' : 'input'}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder={cfg.placeholder ?? 'Losungswort'}
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="characters"
                spellCheck={false}
                enterKeyHint="send"
              />
              {msg ? <p role="status" style={{ margin: 0, fontStyle: 'italic', color: 'var(--gold-soft)', fontSize: 17 }}>{msg}</p> : null}
              <button type="submit" className="btn btn-gold" disabled={!value.trim()}>Auflösen</button>
            </form>
          ) : null}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, borderTop: '1px solid var(--line)', paddingTop: 12 }}>
            {allHints.slice(0, shown).map((h, i) => (
              <div key={i} className="fadeup" style={{ padding: '12px 14px', background: 'var(--navy-3)', display: 'flex', flexDirection: 'column', gap: 4 }}>
                <div className="label" style={{ letterSpacing: '0.18em' }}>Hinweis {i + 1}{i === 2 ? ' · Lösung' : ''}</div>
                <p style={{ margin: 0, fontSize: 17, lineHeight: 1.5 }}>{h}</p>
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
              <span className="small">Hinweise: {shown} von {allHints.length}</span>
              {shown < allHints.length ? (
                <button className="btn" style={{ minHeight: 44, fontSize: 12 }} disabled={!nextHintReady} onClick={() => g.revealHint(num)}>
                  {nextHintReady ? (shown === 2 ? 'Lösung zeigen' : 'Hinweis öffnen') : `in ${waitMin} Min.`}
                </button>
              ) : null}
            </div>
          </div>
        </section>
      )}
      <NotebookNews />
      <div style={{ height: 48 }} />
    </div>
  );
}

function NotFound() {
  return (
    <div className="app" style={{ padding: 40, alignItems: 'center', gap: 16 }}>
      <h1>Diesen Tag gibt es nicht.</h1>
      <Link to="/" className="btn btn-outline-gold">Zum Kalender</Link>
    </div>
  );
}
