import React, { useCallback, useEffect, useState } from 'react';
import SEO from '../SEO';
import { BrandMark } from '../brand/BrandMark';
import { PitchCategorySelect } from './PitchCategorySelect';
import { PitchSlideView } from './PitchSlideView';
import {
  PITCH_SLIDES,
  pitchHref,
  slideById,
  type PitchSlideId,
} from '../../pitch/pitchDeckData';

export default function InvestorPitchDeck({ slideId }: { slideId: PitchSlideId }) {
  const index = PITCH_SLIDES.findIndex((s) => s.id === slideId);
  const safeIndex = index >= 0 ? index : 0;
  const slide = slideById(PITCH_SLIDES[safeIndex].id);
  const [fullscreen, setFullscreen] = useState(false);

  const go = useCallback((id: PitchSlideId) => {
    window.location.assign(pitchHref(id));
  }, []);

  const prev = safeIndex > 0 ? PITCH_SLIDES[safeIndex - 1].id : null;
  const next = safeIndex < PITCH_SLIDES.length - 1 ? PITCH_SLIDES[safeIndex + 1].id : null;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' && next) go(next);
      if (e.key === 'ArrowLeft' && prev) go(prev);
      if (e.key === 'f' || e.key === 'F') {
        if (!document.fullscreenElement) {
          void document.documentElement.requestFullscreen?.();
        } else {
          void document.exitFullscreen?.();
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [go, next, prev]);

  useEffect(() => {
    const onFs = () => setFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', onFs);
    return () => document.removeEventListener('fullscreenchange', onFs);
  }, []);

  const pageLabel = `${String(safeIndex + 1).padStart(2, '0')}/${String(PITCH_SLIDES.length).padStart(2, '0')}`;

  return (
    <div
      className={`min-h-[100dvh] bg-[#030303] text-white flex flex-col ${fullscreen ? 'fixed inset-0 z-[200]' : ''}`}
    >
      <SEO
        title={`ClearPath pitch — ${slide.kicker}`}
        description={slide.subtitle || slide.title}
        canonical={`https://clearpathtrader.com${pitchHref(slide.id)}`}
      />
      <header className="shrink-0 border-b border-white/10 bg-black/90 backdrop-blur-xl px-3 md:px-6 py-3 flex flex-wrap items-center justify-between gap-3">
        <a href="/pitch" className="flex items-center gap-2 min-w-0">
          <BrandMark size={32} />
          <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 truncate">
            Investor pitch
          </span>
        </a>
        <div className="flex items-center gap-2 flex-wrap justify-end">
          <PitchCategorySelect value={slide.id} onChange={go} className="min-w-[180px]" />
          <button
            type="button"
            onClick={() => {
              if (!document.fullscreenElement) void document.documentElement.requestFullscreen?.();
              else void document.exitFullscreen?.();
            }}
            className="hidden sm:inline-flex text-[10px] font-mono uppercase tracking-wider px-3 py-2 rounded-lg border border-white/15 text-zinc-400 hover:text-white"
          >
            Fullscreen
          </button>
        </div>
      </header>

      <div className="flex-1 flex items-center justify-center p-4 md:p-8 overflow-y-auto">
        <article
          className="w-full max-w-lg md:max-w-2xl rounded-[1.75rem] border border-[#BF00FF]/45 bg-gradient-to-b from-[#BF00FF]/[0.08] to-black/80 p-6 md:p-10 shadow-[0_0_40px_rgba(191,0,255,0.12)]"
          aria-live="polite"
        >
          <PitchSlideView slide={slide} />
        </article>
      </div>

      <footer className="shrink-0 border-t border-white/10 bg-black/95 px-4 py-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {PITCH_SLIDES.map((s, i) => (
            <button
              key={s.id}
              type="button"
              aria-label={`Go to slide ${i + 1}`}
              onClick={() => go(s.id)}
              className={`h-2 rounded-full transition-all ${
                i === safeIndex
                  ? 'w-6 bg-gradient-to-r from-[#BF00FF] to-[#FF1493]'
                  : 'w-2 bg-white/20 hover:bg-white/40'
              }`}
            />
          ))}
        </div>
        <span className="font-mono text-xs text-zinc-500 tabular-nums">{pageLabel}</span>
        <div className="flex gap-2">
          <button
            type="button"
            disabled={!prev}
            onClick={() => prev && go(prev)}
            className="px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider border border-white/15 text-zinc-400 disabled:opacity-30 hover:text-white"
          >
            Prev
          </button>
          <button
            type="button"
            disabled={!next}
            onClick={() => next && go(next)}
            className="px-5 py-2 rounded-full text-xs font-black uppercase tracking-wider text-white bg-gradient-to-r from-[#BF00FF] to-[#FF1493] disabled:opacity-30 shadow-[0_0_16px_rgba(255,20,147,0.25)]"
          >
            Next
          </button>
        </div>
      </footer>
    </div>
  );
}
