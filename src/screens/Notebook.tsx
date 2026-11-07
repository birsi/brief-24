import { useEffect, useState } from 'react';
import { Snow, SnowBank } from '../components/Decor';
import FigureList from '../components/Figures';
import { BottomNav, NewDot, StampCard } from '../components/ui';
import { STAMP_DAYS, TAB_LABELS, type NotebookTab } from '../game/notebook';
import { useGame } from '../game/store';
import type { Stamp } from '../game/types';

export const MORSE: Record<string, string> = {
  A: '.-', B: '-...', C: '-.-.', D: '-..', E: '.', F: '..-.', G: '--.', H: '....', I: '..', J: '.---', K: '-.-', L: '.-..', M: '--',
  N: '-.', O: '---', P: '.--.', Q: '--.-', R: '.-.', S: '...', T: '-', U: '..-', V: '...-', W: '.--', X: '-..-', Y: '-.--', Z: '--..',
};

export default function Notebook() {
  const { payloads, book, unseen, markSeen } = useGame();
  const visible = book.tabs.filter((t) => t.on);
  // Open on the first tab with something new.
  const [tab, setTab] = useState<NotebookTab>(() => visible.find((t) => unseen[t.id].length)?.id ?? 'stamps');
  const cur = visible.find((t) => t.id === tab)?.id ?? visible[0]?.id;
  const stamps = STAMP_DAYS.map((t) => ({ day: t, m: payloads[t]?.stamp as Stamp | undefined }));
  const count = stamps.filter((x) => x.m).length;

  // Whatever was new in the open tab counts as seen now, but keeps its golden dot while the tab stays open.
  const [fresh, setFresh] = useState<{ tab?: NotebookTab; keys: Set<string> }>({ keys: new Set() });
  const curUnseen = cur ? unseen[cur] : [];
  let freshKeys = fresh.tab === cur ? fresh.keys : new Set<string>();
  const missing = curUnseen.filter((k) => !freshKeys.has(k));
  if (cur && (fresh.tab !== cur || missing.length)) {
    freshKeys = new Set([...freshKeys, ...missing]);
    setFresh({ tab: cur, keys: freshKeys });
  }
  const curUnseenList = curUnseen.join('|');
  useEffect(() => {
    markSeen(curUnseenList.split('|').filter(Boolean));
  }, [curUnseenList, markSeen]);
  const isFresh = (key: string) => freshKeys.has(key);
  const freshNotes = new Set([...(cur === 'figures' ? freshKeys : [])].map((k) => k.replace(/^note:/, '')));

  return (
    <div className="app">
      <Snow count={28} opacity={0.7} />
      <header style={{ padding: '56px 20px 14px', display: 'flex', flexDirection: 'column', gap: 4 }}>
        <div className="label">Larissas</div>
        <h1 style={{ fontSize: 34 }}>Notizbuch</h1>
      </header>

      <div role="tablist" aria-label="Notizbuch-Bereiche" style={{ padding: '0 20px 18px', display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {visible.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={cur === t.id}
            onClick={() => setTab(t.id)}
            style={{ minHeight: 44, padding: '0 14px', display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'var(--sans)', fontSize: 12, letterSpacing: '0.14em', textTransform: 'uppercase', background: cur === t.id ? 'var(--gold)' : 'transparent', color: cur === t.id ? 'var(--navy)' : '#D5DAE2', border: `1px solid ${cur === t.id ? 'var(--gold)' : 'var(--line-2)'}` }}
          >
            {TAB_LABELS[t.id]}
            {cur !== t.id && unseen[t.id].length ? <NewDot label="neu" /> : null}
          </button>
        ))}
      </div>

      <main style={{ flexGrow: 1, padding: '0 20px 24px', position: 'relative' }}>
        {!cur ? <p style={{ margin: 0, fontSize: 16, lineHeight: 1.5, color: '#D5DAE2' }}>Noch ist nichts notiert. Das Notizbuch füllt sich, während du die Briefe löst.</p> : null}
        {cur === 'stamps' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <h2 style={{ fontSize: 22 }}>Briefmarken</h2>
              <span className="small">{count} von 6</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 12 }}>
              {stamps.map(({ day, m }) =>
                m ? (
                  <div key={day} style={{ position: 'relative' }}>
                    <StampCard m={m} small />
                    {isFresh(`stamp:${day}`) ? <NewDot label="neu" style={{ position: 'absolute', top: 0, right: 0 }} /> : null}
                  </div>
                ) : (
                  <div key={day} style={{ height: 150, margin: 4, border: '1px dashed var(--line-2)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6, color: 'var(--muted-2)', fontFamily: 'var(--sans)', fontSize: 12, letterSpacing: '0.1em' }}>
                    <span style={{ fontFamily: 'var(--serif-display)', fontSize: 26 }}>?</span>
                    <span>TAG {day}</span>
                  </div>
                ),
              )}
            </div>
            <p style={{ margin: '4px 0 0', fontSize: 16, lineHeight: 1.5, color: '#D5DAE2' }}>Jede Marke trägt einen Buchstaben und einen Poststempel.</p>
          </div>
        ) : null}

        {cur === 'figures' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <h2 style={{ fontSize: 22 }}>Figuren</h2>
            {book.figures.length ? (
              <FigureList figures={book.figures} fresh={freshNotes} />
            ) : (
              <p style={{ margin: 0, fontSize: 16, lineHeight: 1.5, color: '#D5DAE2' }}>Noch hat niemand einen Eintrag.</p>
            )}
          </div>
        ) : null}

        {cur === 'morse' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <h2 style={{ fontSize: 22 }}>Tafel aus dem Telegrafenzimmer</h2>
            <p style={{ margin: 0, fontSize: 16, color: '#D5DAE2' }}>Punkt = kurz, Strich = lang.</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '6px 12px' }}>
              {Object.entries(MORSE).map(([l, c]) => (
                <div key={l} style={{ display: 'flex', gap: 10, alignItems: 'baseline', borderBottom: '1px solid #22344E', padding: '6px 0' }}>
                  <span style={{ fontFamily: 'var(--serif-display)', fontWeight: 600, fontSize: 20, color: 'var(--gold)', width: 18 }}>{l}</span>
                  <span style={{ fontFamily: 'var(--mono)', fontSize: 17, letterSpacing: '0.2em' }}>{c.replace(/\./g, '·').replace(/-/g, '–')}</span>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {cur === 'fraktur' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <h2 style={{ fontSize: 22 }}>Frakturschrift</h2>
            <p style={{ margin: 0, fontSize: 16, color: '#D5DAE2' }}>Die gebrochene Schrift alter Bücher und Gravuren.</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
              {[...'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'].map((l) => (
                <div key={l} style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 8, padding: '6px 0', borderBottom: '1px solid #22344E' }}>
                  <span style={{ fontFamily: "'UnifrakturMaguntia', serif", fontSize: 28, lineHeight: 1.2, color: 'var(--gold)' }}>{l}</span>
                  <span style={{ fontSize: 16, color: '#D5DAE2' }}>{l}</span>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {cur === 'finds' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <h2 style={{ fontSize: 22 }}>Zimmerbelegung</h2>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 17 }}>
              <tbody>
                {[
                  ['7', 'Frau Elisabeth Lenz'],
                  ['12', 'Baustelle'],
                  ['19', 'Jonas Reiter'],
                  ['24', 'Larissa'],
                  ['31', 'Dr. Felix Hartl'],
                ].map(([n, w]) => (
                  <tr key={n}>
                    <td style={{ padding: '9px 0', borderBottom: '1px solid #22344E', fontFamily: 'var(--serif-display)', fontWeight: 600, fontSize: 21, color: 'var(--gold)', width: 64 }}>{n}</td>
                    <td style={{ padding: '9px 0', borderBottom: '1px solid #22344E' }}>{w}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </main>

      <SnowBank />
      <BottomNav />
    </div>
  );
}
