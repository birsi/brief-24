import { useEffect } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { Ornament, Snow, Sparks } from '../components/Decor';
import NotebookNews from '../components/NotebookNews';
import { AudioPlayer, Media, StampCard, StoryText, TopBar, mediaPath } from '../components/ui';
import { DAYS } from '../game/content';
import { useGame } from '../game/store';

const ROMAN = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];

export default function Delivered() {
  const num = Number(useParams().num);
  const day = DAYS[num - 1];
  const g = useGame();
  const payload = g.payloads[num];

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [num]);

  if (!day || !g.isSolved(num)) return <Navigate to={`/day/${num}`} replace />;
  if (!payload) return <div className="app" style={{ padding: 40 }}><p className="small">Brief wird geöffnet …</p></div>;

  return (
    <div className="app">
      <Snow count={40} opacity={0.8} />
      <TopBar title={`Tag ${num} · Gelöst`} />

      <div style={{ position: 'relative', display: 'flex', justifyContent: 'center', padding: '6px 0 20px' }}>
        <Sparks />
        <div className="stamp-in" style={{ width: 138, height: 138, borderRadius: '50%', border: '2px solid var(--gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', transform: 'rotate(-8deg)' }}>
          <div style={{ width: 122, height: 122, borderRadius: '50%', border: '1px solid var(--gold)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2, color: 'var(--gold)' }}>
            <span className="label" style={{ letterSpacing: '0.2em' }}>Gelöst</span>
            <span style={{ fontFamily: 'var(--serif-display)', fontWeight: 600, fontSize: 25, lineHeight: 1.1 }}>ZEITPOST</span>
            <span style={{ fontFamily: 'var(--sans)', fontSize: 12, letterSpacing: '0.1em' }}>{num}. {ROMAN[12]}. 2026</span>
          </div>
        </div>
      </div>

      <Media num={num} kind="resolution" video={day.video} label={`${day.video ? 'Video' : 'Bild'} Auflösung · Tag ${num}`} />

      <div style={{ padding: '22px 24px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
        <h2 style={{ fontSize: 28, textAlign: 'center' }}>{day.title}</h2>
        <Ornament />
      </div>

      <AudioPlayer key={`cont-${num}`} src={mediaPath(num, 'continuation.mp3')} text={payload.continuation} label="Fortsetzung" autoPlay />

      <div style={{ padding: '20px 24px 0' }}>
        <StoryText paragraphs={payload.continuation} />
      </div>

      {payload.record ? (
        <div style={{ marginTop: 22 }}>
          <div className="label" style={{ textAlign: 'center' }}>Die Platte von 1926</div>
          <AudioPlayer key={`rec-${num}`} src={mediaPath(num, 'record.mp3')} text={[payload.record]} label="Aufnahme 1224" />
        </div>
      ) : null}

      {payload.stamp ? (
        <div className="float" style={{ margin: '28px 16px 0', padding: 18, border: '1px solid var(--gold)', background: 'var(--navy-2)', boxShadow: '0 10px 30px rgba(0,0,0,.35)', display: 'flex', alignItems: 'center', gap: 18 }}>
          <StampCard m={payload.stamp} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div className="label" style={{ letterSpacing: '0.2em' }}>Briefmarke {payload.stamp.num} von 6</div>
            <div style={{ fontFamily: 'var(--serif-display)', fontWeight: 600, fontSize: 22, lineHeight: 1.2 }}>{payload.stamp.motif}</div>
            <div style={{ fontSize: 16, lineHeight: 1.45, color: '#D5DAE2' }}>
              Stempel {payload.stamp.postmark}
              <br />
              Rückseite: <strong style={{ color: 'var(--ink)' }}>{payload.stamp.letter}</strong>
            </div>
            <div className="small">Ins Notizbuch gelegt</div>
          </div>
        </div>
      ) : null}

      {payload.cue ? (
        <div className="card-gold" style={{ margin: '28px 16px 0', textAlign: 'center' }}>
          <p style={{ margin: 0, fontStyle: 'italic', fontSize: 20, lineHeight: 1.5 }}>{payload.cue}</p>
        </div>
      ) : null}

      {payload.epilogue ? (
        <div className="card-gold candle" style={{ margin: '32px 16px 0', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {payload.epilogue.map((l, i) => (
            <p key={i} style={{ margin: 0, fontStyle: 'italic', fontSize: 20, lineHeight: 1.5 }}>{l}</p>
          ))}
        </div>
      ) : null}

      <NotebookNews />

      <div style={{ margin: '28px 16px 48px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <Link to="/" className="btn btn-outline-gold">Zum Kalender</Link>
        {num < 24 ? (
          g.isUnlocked(num + 1) ? (
            <Link to={`/day/${num + 1}`} className="btn">Weiter zu Tag {num + 1}</Link>
          ) : (
            <div className="small" style={{ textAlign: 'center' }}>Tag {num + 1} öffnet sich am {num + 1}. Dezember um 0:00 Uhr</div>
          )
        ) : (
          <div className="small" style={{ textAlign: 'center' }}>Frohe Weihnachten, Larissa.</div>
        )}
      </div>
    </div>
  );
}
