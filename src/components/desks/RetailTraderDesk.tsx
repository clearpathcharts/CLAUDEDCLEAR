import React, { useState } from 'react';
import { ChartPlatformPanel } from '../charts/ChartPlatformPanel';
import { PATH_CARDS } from '../../content/chooseYourPath';
import { InstitutionalRegistry } from '../../core/registry/InstitutionalRegistry';

const RETAIL_PATH = PATH_CARDS.find((card) => card.id === 'retail');

export default function RetailTraderDesk() {
  const [openId, setOpenId] = useState<string | null>(InstitutionalRegistry[0]?.id ?? null);
  const profileId = RETAIL_PATH?.profileId ?? 'standard_red_green';
  const accent = RETAIL_PATH?.accent ?? '#00FFFF';

  return (
    <div className="desk-desk-body mx-auto flex min-h-0 w-full max-w-5xl flex-1 flex-col gap-3 p-3">
      <ChartPlatformPanel
        variant="retail"
        profileId={profileId}
        accent={accent}
        heading="Your chart"
        description="Search a market. Watch the candles. When a word on the right is new, tap it — we explain it in plain language. This is a study desk, not a place that tells you to buy or sell."
        searchPlaceholder="Search AAPL, EURUSD, gold…"
      />

      <section
        data-desk-movable-sheet=""
        className="desk-movable-sheet rounded-2xl border border-white/10 bg-black/60 p-4"
      >
        <div className="desk-movable-sheet-handle mx-auto mb-3 h-1.5 w-12 rounded-full bg-white/25" aria-hidden="true" />
        <h2 className="mb-2 text-lg font-black uppercase tracking-widest text-[#00FFFF]">
          What am I looking at?
        </h2>
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
    </div>
  );
}
