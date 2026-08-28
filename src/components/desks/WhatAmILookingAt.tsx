import React, { useState } from 'react';
import { InstitutionalRegistry } from '../../core/registry/InstitutionalRegistry';

/**
 * Existing Retail education glossary. Do not rewrite or fork the copy —
 * this is the same BOS / CHoCH / FVG / OB / SWEEPS / VP / CVD list that
 * previously filled /desk/retail. The workspace wraps this component.
 */
export default function WhatAmILookingAt({
  compact = false,
}: {
  compact?: boolean;
}) {
  const [openId, setOpenId] = useState<string | null>(InstitutionalRegistry[0]?.id ?? null);
  const [listOpen, setListOpen] = useState(!compact);

  return (
    <section
      className={compact ? 'p-0' : 'rounded-2xl border border-white/10 bg-black/60 p-4'}
      data-retail-education=""
    >
      <div className="mb-2 flex items-start justify-between gap-2">
        <h2 className="text-lg font-black uppercase tracking-widest text-[#00FFFF]">
          What am I looking at?
        </h2>
        {compact ? (
          <button
            type="button"
            onClick={() => setListOpen((v) => !v)}
            className="shrink-0 text-[10px] font-black uppercase tracking-wider text-[#00FFFF]"
          >
            {listOpen ? 'Cards' : 'View all'}
          </button>
        ) : null}
      </div>

      {compact && !listOpen ? (
        <div className="grid grid-cols-2 gap-2">
          {InstitutionalRegistry.map((item) => {
            const open = openId === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setOpenId(open ? null : item.id)}
                aria-expanded={open}
                className="rounded-xl border border-white/10 bg-black/40 p-2.5 text-left hover:border-[#00FFFF]/40"
                style={{ borderColor: open ? 'rgba(0,255,255,0.45)' : undefined }}
              >
                <span className="block font-mono text-[10px] font-black uppercase tracking-widest text-[#00FFFF]">
                  {item.abbr}
                </span>
                <span className="mt-0.5 block text-[11px] font-extrabold leading-snug text-white">{item.name}</span>
                {open ? (
                  <p className="mt-2 text-[11px] font-bold leading-relaxed text-zinc-400">{item.description}</p>
                ) : null}
              </button>
            );
          })}
        </div>
      ) : (
        <ul className="space-y-2">
          {InstitutionalRegistry.map((item) => {
            const open = openId === item.id;
            return (
              <li key={item.id} className="rounded-xl border border-white/10">
                <button
                  type="button"
                  onClick={() => setOpenId(open ? null : item.id)}
                  aria-expanded={open}
                  className="flex w-full items-center justify-between px-3 py-2 text-left text-base font-extrabold text-white"
                >
                  {item.name}
                  <span className="font-mono text-sm font-bold text-zinc-500">{item.abbr}</span>
                </button>
                {open && (
                  <p className="border-t border-white/10 px-3 py-2 text-base font-bold leading-relaxed text-zinc-400">
                    {item.description}
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <div className="mt-4 flex flex-wrap gap-3 text-base font-bold">
        <a href="/education" className="text-[#00FFFF] underline-offset-2 hover:underline">
          Education
        </a>
        <a href="/literacy" className="text-[#00FFFF] underline-offset-2 hover:underline">
          Literacy OS
        </a>
        <a href="/encyclopedia" className="text-[#00FFFF] underline-offset-2 hover:underline">
          Encyclopedia
        </a>
      </div>
    </section>
  );
}
