import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { describeNews } from '../game/notebook';
import { useGame } from '../game/store';

const SHOW_AFTER_MS = 1200; // let the stamp / door animation play first
const HIDE_AFTER_MS = 9000;

/**
 * Announces new notebook content ("Neu im Notizbuch") right after it is unlocked by opening or
 * solving a day. Content that was already unseen when the app loaded is not announced again;
 * the dot on the Notizbuch tab covers that.
 */
export default function NotebookToast() {
  const { unseen, book, ready } = useGame();
  const { pathname } = useLocation();
  const nav = useNavigate();
  const announced = useRef<Set<string> | null>(null);
  const [keys, setKeys] = useState<string[]>([]);
  const [visible, setVisible] = useState(false);
  const quiet = pathname.startsWith('/notebook') || pathname.startsWith('/dev');

  useEffect(() => {
    if (!ready) return;
    if (!announced.current) {
      announced.current = new Set(unseen.all);
      return;
    }
    const fresh = unseen.all.filter((k) => !announced.current!.has(k));
    if (!fresh.length) return;
    fresh.forEach((k) => announced.current!.add(k));
    if (quiet) return;
    setKeys((k) => [...k, ...fresh]);
  }, [ready, unseen.all, quiet]);

  // Show with a short delay, hide after a while.
  useEffect(() => {
    if (!keys.length) return;
    const show = setTimeout(() => setVisible(true), visible ? 0 : SHOW_AFTER_MS);
    const hide = setTimeout(() => {
      setVisible(false);
      setKeys([]);
    }, (visible ? 0 : SHOW_AFTER_MS) + HIDE_AFTER_MS);
    return () => {
      clearTimeout(show);
      clearTimeout(hide);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- restart only when new keys arrive
  }, [keys]);

  // Entering the notebook makes the toast pointless.
  useEffect(() => {
    if (quiet) {
      setVisible(false);
      setKeys([]);
    }
  }, [quiet]);

  // Only announce what is still unseen (e.g. not if the notebook was opened in between).
  const still = keys.filter((k) => unseen.all.includes(k));
  const lines = describeNews(still, book.figures);
  const close = () => {
    setVisible(false);
    setKeys([]);
  };

  return (
    <div aria-live="polite" style={{ position: 'fixed', left: 0, right: 0, bottom: `calc(${pathname === '/' ? 84 : 20}px + env(safe-area-inset-bottom))`, display: 'flex', justifyContent: 'center', padding: '0 16px', zIndex: 40, pointerEvents: 'none' }}>
      {visible && lines.length ? (
        <div className="toast" role="status" style={{ width: '100%', maxWidth: 448, display: 'flex', alignItems: 'stretch', background: 'var(--navy-2)', border: '1px solid var(--gold)', boxShadow: '0 10px 30px rgba(0,0,0,.45)', pointerEvents: 'auto' }}>
          <button
            onClick={() => {
              close();
              nav('/notebook');
            }}
            style={{ flexGrow: 1, minHeight: 56, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12, background: 'transparent', border: 0, textAlign: 'left', color: 'var(--ink)' }}
          >
            <svg width="22" height="22" viewBox="0 0 20 20" aria-hidden="true" style={{ flexShrink: 0, color: 'var(--gold)' }}><path d="M4 2 H15 a1 1 0 0 1 1 1 V18 H5 a1 1 0 0 1 -1 -1 Z" fill="none" stroke="currentColor" strokeWidth="1.4" /><line x1="7" y1="6" x2="13" y2="6" stroke="currentColor" strokeWidth="1.2" /><line x1="7" y1="9" x2="13" y2="9" stroke="currentColor" strokeWidth="1.2" /></svg>
            <span style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <span className="label">Neu im Notizbuch</span>
              {lines.map((l) => (
                <span key={l} style={{ fontSize: 16, lineHeight: 1.35 }}>{l}</span>
              ))}
            </span>
          </button>
          <button onClick={close} aria-label="Hinweis schließen" style={{ width: 44, minHeight: 44, flexShrink: 0, background: 'transparent', border: 0, borderLeft: '1px solid var(--line)', color: 'var(--muted)', fontSize: 20 }}>
            ×
          </button>
        </div>
      ) : null}
    </div>
  );
}
