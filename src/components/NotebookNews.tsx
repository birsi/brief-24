import { Link } from 'react-router-dom';
import { describeNews } from '../game/notebook';
import { useGame } from '../game/store';

/**
 * Card at the end of a page that lists what is new in the notebook ("Neu im Notizbuch").
 * It stays until the new entries have been looked at in the notebook.
 */
export default function NotebookNews() {
  const { unseen, book } = useGame();
  const lines = describeNews(unseen.all, book.figures);
  if (!lines.length) return null;

  return (
    <Link
      to="/notebook"
      className="fadeup"
      style={{ margin: '28px 16px 0', minHeight: 56, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 14, border: '1px solid var(--gold)', background: 'var(--navy-2)', color: 'var(--ink)', textDecoration: 'none' }}
    >
      <svg width="22" height="22" viewBox="0 0 20 20" aria-hidden="true" style={{ flexShrink: 0, color: 'var(--gold)' }}><path d="M4 2 H15 a1 1 0 0 1 1 1 V18 H5 a1 1 0 0 1 -1 -1 Z" fill="none" stroke="currentColor" strokeWidth="1.4" /><line x1="7" y1="6" x2="13" y2="6" stroke="currentColor" strokeWidth="1.2" /><line x1="7" y1="9" x2="13" y2="9" stroke="currentColor" strokeWidth="1.2" /></svg>
      <span style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: 3 }}>
        <span className="label">Neu im Notizbuch</span>
        {lines.map((l) => (
          <span key={l} style={{ fontSize: 16, lineHeight: 1.35 }}>{l}</span>
        ))}
      </span>
      <span aria-hidden="true" style={{ color: 'var(--gold)', fontSize: 20 }}>›</span>
    </Link>
  );
}
