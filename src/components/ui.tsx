import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Link, NavLink } from 'react-router-dom';
import type { Stamp } from '../game/types';

export const mediaPath = (num: number, name: string) => `/media/day-${String(num).padStart(2, '0')}/${name}`;

/** Render text with *italics*. */
export function StoryText({ paragraphs }: { paragraphs: string[] }) {
  return (
    <div className="prose">
      {paragraphs.map((p, i) => (
        <p key={i}>
          {p.split(/(\*[^*]+\*)/g).map((part, j) =>
            part.startsWith('*') && part.endsWith('*') && part.length > 2 ? <em key={j}>{part.slice(1, -1)}</em> : <span key={j}>{part}</span>,
          )}
        </p>
      ))}
    </div>
  );
}

const IMAGE_EXT = ['webp', 'jpg', 'png'];

/** Image or video from public/media, with a placeholder while the file is missing. */
export function Media({ num, kind, video = false, label, children }: { num: number; kind: 'narration' | 'resolution'; video?: boolean; label: string; children?: ReactNode }) {
  const [videoFailed, setVideoFailed] = useState(!video);
  const [extIdx, setExtIdx] = useState(0);
  const imgFailed = extIdx >= IMAGE_EXT.length;
  return (
    <div style={{ position: 'relative', overflow: 'hidden', aspectRatio: '3 / 2', margin: '0 16px', border: '1px solid var(--line)', background: 'var(--navy-3)' }}>
      {!videoFailed ? (
        <video
          src={mediaPath(num, `${kind}.mp4`)}
          autoPlay
          muted
          playsInline
          loop
          onError={() => setVideoFailed(true)}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />
      ) : !imgFailed ? (
        <img
          src={mediaPath(num, `${kind}.${IMAGE_EXT[extIdx]}`)}
          alt={label}
          onError={() => setExtIdx((i) => i + 1)}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />
      ) : (
        <div role="img" aria-label={label} style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, color: 'var(--muted)', background: 'radial-gradient(circle at 50% 40%, #22385a, var(--navy-3) 70%)' }}>
          <svg width="30" height="30" viewBox="0 0 28 28" aria-hidden="true">
            <rect x="2" y="5" width="24" height="18" fill="none" stroke="currentColor" strokeWidth="1.3" />
            <path d="M4 21 L11 13 L16 18 L19 15 L24 21" fill="none" stroke="currentColor" strokeWidth="1.3" />
          </svg>
          <span className="small" style={{ letterSpacing: '0.14em', textTransform: 'uppercase' }}>{label}</span>
        </div>
      )}
      {children}
      <div aria-hidden="true" style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 56, background: 'linear-gradient(rgba(14,26,43,0), var(--navy))', pointerEvents: 'none' }} />
    </div>
  );
}

function pickGermanVoice(): SpeechSynthesisVoice | undefined {
  const voices = window.speechSynthesis?.getVoices() ?? [];
  return voices.find((v) => v.lang === 'de-AT') ?? voices.find((v) => v.lang.startsWith('de'));
}

/**
 * Plays an MP3 from public/media. If the file is missing, the browser reads the
 * text aloud via speech synthesis – so everything can be tested before the
 * ElevenLabs recordings are ready.
 */
export function AudioPlayer({ src, text, label, autoPlay = false }: { src: string; text: string[]; label: string; autoPlay?: boolean }) {
  const audio = useRef<HTMLAudioElement>(null);
  const [mode, setMode] = useState<'file' | 'tts'>('file');
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const ttsIdx = useRef(0);

  useEffect(() => () => window.speechSynthesis?.cancel(), []);

  // Browsers may block autoplay without a prior gesture; then the play button stays available.
  useEffect(() => {
    if (autoPlay) audio.current?.play().catch(() => {});
  }, [autoPlay]);

  const speakFrom = (i: number) => {
    const synth = window.speechSynthesis;
    if (!synth) return;
    if (i >= text.length) {
      setPlaying(false);
      setProgress(1);
      ttsIdx.current = 0;
      return;
    }
    ttsIdx.current = i;
    const u = new SpeechSynthesisUtterance(text[i].replace(/\*/g, ''));
    u.lang = 'de-DE';
    const v = pickGermanVoice();
    if (v) u.voice = v;
    u.rate = 0.95;
    u.onend = () => {
      setProgress((i + 1) / text.length);
      speakFrom(i + 1);
    };
    synth.speak(u);
  };

  const toggle = () => {
    if (mode === 'file' && audio.current) {
      if (playing) audio.current.pause();
      else audio.current.play().catch(() => setMode('tts'));
      return;
    }
    const synth = window.speechSynthesis;
    if (!synth) return;
    if (playing) {
      synth.cancel();
      setPlaying(false);
    } else {
      setPlaying(true);
      speakFrom(ttsIdx.current);
    }
  };

  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

  return (
    <div className="card" style={{ margin: '16px 16px 0', display: 'flex', alignItems: 'center', gap: 14 }}>
      <audio
        ref={audio}
        src={src}
        preload="metadata"
        onError={() => {
          setMode('tts');
          if (autoPlay) {
            setPlaying(true);
            speakFrom(0);
          }
        }}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => setPlaying(false)}
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
        onTimeUpdate={(e) => setProgress(e.currentTarget.currentTime / (e.currentTarget.duration || 1))}
      />
      <button
        className={playing ? undefined : 'pulse'}
        onClick={toggle}
        aria-label={playing ? `${label} anhalten` : `${label} abspielen`}
        style={{ width: 48, height: 48, flexShrink: 0, borderRadius: '50%', border: '1.5px solid var(--gold)', background: 'transparent', color: 'var(--gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}
      >
        {playing ? (
          <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><rect x="3" y="2" width="3.5" height="12" fill="currentColor" /><rect x="9.5" y="2" width="3.5" height="12" fill="currentColor" /></svg>
        ) : (
          <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><path d="M4 2 L14 8 L4 14 Z" fill="currentColor" /></svg>
        )}
      </button>
      <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div className="small" style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>{label}{mode === 'tts' ? ' · Vorlesestimme' : ''}</span>
          {mode === 'file' && duration > 0 ? <span>{fmt(progress * duration)} / {fmt(duration)}</span> : null}
        </div>
        <div style={{ height: 3, background: 'var(--line)' }}>
          <div style={{ width: `${Math.round(progress * 100)}%`, height: 3, background: 'var(--gold)', transition: 'width .3s' }} />
        </div>
      </div>
    </div>
  );
}

/** A stamp in the style of the Zeitpost. */
export function StampCard({ m, small = false }: { m: Stamp; small?: boolean }) {
  return (
    <div
      style={{
        width: small ? '100%' : 92,
        height: small ? 150 : 112,
        flexShrink: 0,
        background: 'var(--paper)',
        border: '3px dotted var(--navy)',
        outline: '4px solid var(--paper)',
        outlineOffset: -1,
        margin: 4,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '8px 4px',
        color: '#14233A',
      }}
    >
      <span style={{ fontFamily: 'var(--sans)', fontSize: 11, letterSpacing: '0.06em', textTransform: 'uppercase', textAlign: 'center' }}>{m.motif}</span>
      <span style={{ fontFamily: 'var(--serif-display)', fontWeight: 600, fontSize: small ? 34 : 30, lineHeight: 1 }}>{m.letter}</span>
      <span style={{ fontFamily: 'var(--sans)', fontSize: 11, textAlign: 'center', lineHeight: 1.3 }}>{m.postmark}</span>
    </div>
  );
}

export function TopBar({ title, back = '/' }: { title: string; back?: string }) {
  return (
    <div style={{ padding: '52px 12px 10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative', zIndex: 6 }}>
      <Link to={back} aria-label="Zurück zum Kalender" style={{ width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gold)' }}>
        <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true"><path d="M13 3 L6 10 L13 17" fill="none" stroke="currentColor" strokeWidth="1.6" /></svg>
      </Link>
      <div className="label" style={{ letterSpacing: '0.2em', textAlign: 'center' }}>{title}</div>
      <div style={{ width: 44 }} />
    </div>
  );
}

export function BottomNav() {
  const style = ({ isActive }: { isActive: boolean }) => ({
    minHeight: 48,
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    textDecoration: 'none',
    color: isActive ? 'var(--navy)' : '#4A5B76',
    fontFamily: 'var(--sans)',
    fontWeight: isActive ? 600 : 400,
    fontSize: 12,
    letterSpacing: '0.14em',
  });
  return (
    <nav aria-label="Hauptnavigation" style={{ position: 'sticky', bottom: 0, background: 'var(--snow)', padding: '4px 20px calc(18px + env(safe-area-inset-bottom))', display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 8, zIndex: 20 }}>
      <NavLink to="/" end style={style}>
        <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true"><rect x="2" y="2" width="7" height="7" fill="none" stroke="currentColor" strokeWidth="1.4" /><rect x="11" y="2" width="7" height="7" fill="none" stroke="currentColor" strokeWidth="1.4" /><rect x="2" y="11" width="7" height="7" fill="none" stroke="currentColor" strokeWidth="1.4" /><rect x="11" y="11" width="7" height="7" fill="none" stroke="currentColor" strokeWidth="1.4" /></svg>
        KALENDER
      </NavLink>
      <NavLink to="/notebook" style={style}>
        <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true"><path d="M4 2 H15 a1 1 0 0 1 1 1 V18 H5 a1 1 0 0 1 -1 -1 Z" fill="none" stroke="currentColor" strokeWidth="1.4" /><line x1="7" y1="6" x2="13" y2="6" stroke="currentColor" strokeWidth="1.2" /><line x1="7" y1="9" x2="13" y2="9" stroke="currentColor" strokeWidth="1.2" /></svg>
        NOTIZBUCH
      </NavLink>
    </nav>
  );
}
