import React, { useState } from 'react';
import { InstitutionalRegistry } from '../../../core/registry/InstitutionalRegistry';
import { Bento } from '../institutional/Bento';

/** Compact education module — keeps BOS/CHoCH/FVG/OB/SWEEPS/VP/CVD glossary intact. */
export function RetailEducationBento({
  expanded,
  onToggle,
  maximized,
}: {
  expanded?: boolean;
  onToggle?: () => void;
  maximized?: boolean;
}) {
  const [openId, setOpenId] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);

  const items = showAll || maximized ? InstitutionalRegistry : InstitutionalRegistry.slice(0, 4);

  return (
    <Bento
      title="Education"
      status="What am I looking at?"
      expanded={expanded}
      onToggle={onToggle}
      collapsedSummary="BOS · CHoCH · FVG · OB · SWEEPS · VP · CVD"
      className={maximized ? 'retail-bento min-h-[280px]' : 'retail-bento min-h-[160px]'}
    >
      <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-[var(--desk-muted)]">
        Plain-language structure terms. Supporting study only — not trade instructions.
      </p>
      <ul className="space-y-1.5">
        {items.map((item) => {
          const open = openId === item.id;
          return (
            <li key={item.id} className="rounded border border-[var(--desk-border)]">
              <button
                type="button"
                onClick={() => setOpenId(open ? null : item.id)}
                aria-expanded={open}
                className="flex w-full items-center justify-between gap-2 px-2 py-1.5 text-left"
              >
                <span className="min-w-0">
                  <span className="block font-mono text-[11px] font-extrabold text-[var(--desk-cyan)]">
                    {item.abbr}
                  </span>
                  <span className="block truncate text-[10px] font-bold text-[var(--desk-text)]">
                    {item.name}
                  </span>
                </span>
                <span className="shrink-0 text-[9px] uppercase text-[var(--desk-muted)]">
                  {open ? 'Hide' : 'Explain'}
                </span>
              </button>
              {open ? (
                <p className="border-t border-[var(--desk-border)] px-2 py-1.5 text-[11px] font-bold leading-relaxed text-[var(--desk-muted)]">
                  {item.description}
                </p>
              ) : null}
            </li>
          );
        })}
      </ul>
      <div className="mt-2 flex flex-wrap gap-2">
        {!showAll && !maximized ? (
          <button
            type="button"
            onClick={() => setShowAll(true)}
            className="text-[10px] font-black uppercase tracking-wider text-[var(--desk-indigo)] hover:text-[var(--desk-cyan)]"
          >
            View education
          </button>
        ) : null}
        <a
          href="/education"
          className="text-[10px] font-black uppercase tracking-wider text-[var(--desk-cyan)] underline-offset-2 hover:underline"
        >
          Education hub
        </a>
        <a
          href="/literacy"
          className="text-[10px] font-black uppercase tracking-wider text-[var(--desk-cyan)] underline-offset-2 hover:underline"
        >
          Literacy OS
        </a>
        <a
          href="/encyclopedia"
          className="text-[10px] font-black uppercase tracking-wider text-[var(--desk-cyan)] underline-offset-2 hover:underline"
        >
          Encyclopedia
        </a>
      </div>
    </Bento>
  );
}
