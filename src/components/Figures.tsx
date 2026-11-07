import type { VisibleFigure } from '../game/figures';
import { NewDot } from './ui';

type Props = {
  figures: VisibleFigure[];
  /** Keys of notes that are new since the last visit (golden dot). */
  fresh?: Set<string>;
  /** Dev mode: mark notes that only appear after solving. */
  showWhen?: boolean;
};

/** Cards for the notebook's figures section: name, role, then the visible notes by day. */
export default function FigureList({ figures, fresh, showWhen }: Props) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {figures.map((f) => (
        <section key={f.id} aria-label={f.name} style={{ border: '1px solid var(--line)', background: 'var(--navy-3)', padding: '16px 16px 6px' }}>
          <h3 style={{ fontSize: 26 }}>{f.name}</h3>
          <div className="label" style={{ marginTop: 4 }}>{f.role}</div>
          <ul style={{ listStyle: 'none', margin: '10px 0 0', padding: 0 }}>
            {f.notes.map((n) => {
              const isNew = fresh?.has(n.key);
              return (
                <li key={n.key} style={{ display: 'flex', gap: 12, alignItems: 'baseline', padding: '10px 0', borderTop: '1px solid #22344E' }}>
                  <span style={{ flexShrink: 0, width: 54, fontFamily: 'var(--sans)', fontSize: 12, letterSpacing: '0.1em', color: 'var(--gold)', whiteSpace: 'nowrap' }}>
                    {n.day}. XII.
                  </span>
                  <p style={{ margin: 0, flexGrow: 1, fontSize: 17, lineHeight: 1.5, color: '#D5DAE2' }}>
                    {isNew ? <NewDot label="Neu: " style={{ marginRight: 8, verticalAlign: '0.15em' }} /> : null}
                    {n.text}
                    {showWhen && n.solve ? <span className="small" style={{ marginLeft: 8, color: 'var(--muted-2)' }}>nach Lösung</span> : null}
                  </p>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}
