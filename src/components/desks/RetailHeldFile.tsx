import React from 'react';
import { RETAIL_PANEL_META, type RetailPanelId } from './retailHeldPanels';

type Props = {
  held: RetailPanelId[];
  open: boolean;
  justHeld: RetailPanelId | null;
  onOpenChange: (open: boolean) => void;
  onRestore: (id: RetailPanelId) => void;
  onRestoreAll: () => void;
};

export default function RetailHeldFile({
  held,
  open,
  justHeld,
  onOpenChange,
  onRestore,
  onRestoreAll,
}: Props) {
  if (held.length === 0) return null;

  if (!open) {
    return (
      <button
        type="button"
        className="rt-held-tab"
        data-retail-held-file="collapsed"
        aria-expanded={false}
        aria-controls="retail-held-file"
        onClick={() => onOpenChange(true)}
      >
        Held file · {held.length}
      </button>
    );
  }

  return (
    <aside
      id="retail-held-file"
      className="rt-held-file"
      data-retail-held-file="open"
      aria-label="Held file — panels moved off the desk"
    >
      <header className="rt-held-file__head">
        <div>
          <p className="rt-held-file__kicker">Visual file</p>
          <h2 className="rt-held-file__title">Held panels</h2>
        </div>
        <button
          type="button"
          className="rt-tool"
          aria-expanded={true}
          aria-controls="retail-held-file"
          onClick={() => onOpenChange(false)}
        >
          Hide
        </button>
      </header>
      <p className="rt-held-file__hint">
        These boxes are off the desk so the chart can use the space. Restore any of them when you want them back.
      </p>
      <ul className="rt-held-file__list">
        {held.map((id) => {
          const meta = RETAIL_PANEL_META[id];
          const fresh = id === justHeld;
          return (
            <li key={id}>
              <article className={`rt-held-card${fresh ? ' is-fresh' : ''}`} data-held-panel={id}>
                <div className="min-w-0 flex-1">
                  <p className="rt-held-card__title">{meta.title}</p>
                  <p className="rt-held-card__blurb">{meta.blurb}</p>
                </div>
                <button type="button" className="rt-held-card__restore" onClick={() => onRestore(id)}>
                  Restore
                </button>
              </article>
            </li>
          );
        })}
      </ul>
      {held.length > 1 ? (
        <button type="button" className="rt-held-file__all" onClick={onRestoreAll}>
          Restore all
        </button>
      ) : null}
    </aside>
  );
}
