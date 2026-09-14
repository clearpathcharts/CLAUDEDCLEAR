import React from 'react';
import type { HeldMeta } from './deskHeldPanels';
import './heldFile.css';

type Props = {
  desk: string;
  held: string[];
  meta: Record<string, HeldMeta>;
  open: boolean;
  justHeld: string | null;
  onOpenChange: (open: boolean) => void;
  onRestore: (id: string) => void;
  onRestoreAll: () => void;
};

export default function DeskHeldFile({
  desk,
  held,
  meta,
  open,
  justHeld,
  onOpenChange,
  onRestore,
  onRestoreAll,
}: Props) {
  if (!open) {
    return (
      <button
        type="button"
        className="rt-held-tab"
        data-desk-held-file="collapsed"
        data-held-desk={desk}
        aria-expanded={false}
        aria-controls={`${desk}-held-file`}
        onClick={() => onOpenChange(true)}
      >
        <span className="rt-held-tab__label">Held file</span>
        <span className="rt-held-tab__count">{held.length}</span>
      </button>
    );
  }

  return (
    <aside
      id={`${desk}-held-file`}
      className="rt-held-file"
      data-desk-held-file="open"
      data-held-desk={desk}
      aria-label="Held file — panels moved off the desk"
    >
      <div className="rt-held-file__tab" aria-hidden="true">
        File
      </div>
      <header className="rt-held-file__head">
        <div>
          <p className="rt-held-file__kicker">Visual file</p>
          <h2 className="rt-held-file__title">Held panels</h2>
        </div>
        <button
          type="button"
          className="rt-tool"
          aria-expanded={true}
          aria-controls={`${desk}-held-file`}
          onClick={() => onOpenChange(false)}
        >
          Hide
        </button>
      </header>
      <p className="rt-held-file__hint">
        {held.length === 0
          ? 'Click the red X on any box to hold it here. The page scrollbar reaches every box you leave on the desk.'
          : 'These boxes are off the desk. Restore them, then scroll the page to reach them.'}
      </p>
      {held.length > 1 ? (
        <button type="button" className="rt-held-file__all" onClick={onRestoreAll}>
          Restore all
        </button>
      ) : null}
      {held.length === 0 ? (
        <p className="rt-held-file__empty">Nothing held yet</p>
      ) : (
        <ul className="rt-held-file__list">
          {held.map((id) => {
            const item = meta[id] ?? { title: id, blurb: 'Held panel' };
            const fresh = id === justHeld;
            return (
              <li key={id}>
                <article className={`rt-held-card${fresh ? ' is-fresh' : ''}`} data-held-panel={id}>
                  <div className="min-w-0 flex-1">
                    <p className="rt-held-card__title">{item.title}</p>
                    <p className="rt-held-card__blurb">{item.blurb}</p>
                  </div>
                  <button type="button" className="rt-held-card__restore" onClick={() => onRestore(id)}>
                    Restore
                  </button>
                </article>
              </li>
            );
          })}
        </ul>
      )}
    </aside>
  );
}
