import React, { Suspense, lazy, useState } from 'react';

const CinemaShelf = lazy(() => import('./CpmsApk'));

/**
 * Features kept in the repo but not linked on the public site.
 * The founder can open them here and put one back later.
 */
export default function CeoHiddenFeatures() {
  const [cinemaOpen, setCinemaOpen] = useState(false);

  return (
    <section
      data-ceo-hidden-features
      className="mb-8 rounded-2xl border border-amber-400/40 bg-black/70 p-5"
    >
      <h2 className="m-0 text-sm font-black uppercase tracking-[0.18em] text-amber-200">
        Hidden features
      </h2>
      <p className="mt-2 mb-4 max-w-3xl text-sm leading-relaxed text-zinc-300">
        These are off the public site and off Google. The code is still here. Open one below if you want to look at it or bring it back later.
      </p>
      <div className="rounded-xl border border-white/10 bg-black/50 p-4">
        <p className="m-0 text-xs font-black uppercase tracking-widest text-white">ClearPath Cinema</p>
        <p className="mt-1 mb-3 text-sm leading-relaxed text-zinc-400">
          The theater and video shelves. Visitors do not see this. There is no public arcade and no public TV channel.
        </p>
        <button
          type="button"
          data-ceo-hidden-cinema
          onClick={() => setCinemaOpen((open) => !open)}
          className="rounded-lg border border-amber-400/50 px-3 py-2 font-mono text-[10px] font-black uppercase tracking-widest text-amber-100 hover:bg-amber-400/10"
        >
          {cinemaOpen ? 'Hide Cinema' : 'Open Cinema here'}
        </button>
        {cinemaOpen ? (
          <div className="mt-4 overflow-hidden rounded-xl border border-white/10">
            <Suspense fallback={<p className="p-4 text-xs text-zinc-500">Opening Cinema…</p>}>
              <CinemaShelf />
            </Suspense>
          </div>
        ) : null}
      </div>
    </section>
  );
}
