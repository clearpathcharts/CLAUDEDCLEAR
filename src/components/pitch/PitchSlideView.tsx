import React from 'react';
import type { PitchSlide } from '../../pitch/pitchDeckData';

export function PitchSlideView({ slide }: { slide: PitchSlide }) {
  return (
    <div className="flex flex-col gap-5 md:gap-6">
      <p className="text-[11px] font-mono uppercase tracking-[0.25em] text-[#BF00FF]/90">
        {slide.kicker}
      </p>
      <h1 className="text-2xl md:text-3xl lg:text-[2rem] font-black leading-snug text-white">
        {slide.title.includes('$1.5M') ? (
          <>
            {slide.title.split('$1.5M')[0]}
            <span className="text-[#BF00FF]">$1.5M</span>
            {slide.title.split('$1.5M')[1]}
          </>
        ) : (
          slide.title
        )}
      </h1>
      {slide.subtitle ? (
        <p className="text-sm md:text-base text-zinc-400 leading-relaxed max-w-2xl">{slide.subtitle}</p>
      ) : null}

      {slide.callout ? (
        <div className="rounded-2xl border border-[#FF1493]/30 bg-gradient-to-br from-[#BF00FF]/20 via-[#FF1493]/10 to-transparent p-4 md:p-5">
          <p className="text-[10px] font-mono uppercase tracking-widest text-[#FF1493]/90 mb-2">
            {slide.callout.label}
          </p>
          <p className="text-lg md:text-xl font-black text-white">{slide.callout.body}</p>
        </div>
      ) : null}

      {slide.pairs?.length ? (
        <div className="grid grid-cols-2 gap-3">
          {slide.pairs.map((p) => (
            <div
              key={p.label}
              className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3"
            >
              <p className="text-[10px] uppercase tracking-wider text-zinc-500">{p.label}</p>
              <p className="text-xl font-black text-[#00E5FF] mt-1">{p.value}</p>
            </div>
          ))}
        </div>
      ) : null}

      {slide.funds?.length ? (
        <div className="space-y-3">
          <p className="text-xs font-mono uppercase tracking-widest text-zinc-500">Use of funds</p>
          {slide.funds.map((f) => (
            <div key={f.label}>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-zinc-300">{f.label}</span>
                <span className="font-mono text-[#BF00FF]">{f.pct}%</span>
              </div>
              <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#BF00FF] to-[#FF1493]"
                  style={{ width: `${f.pct}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {slide.metrics?.length ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {slide.metrics.map((m) => (
            <div
              key={m.label}
              className="rounded-xl border border-amber-500/30 bg-amber-500/5 px-4 py-3"
            >
              <p className="text-[10px] uppercase tracking-wider text-zinc-500">{m.label}</p>
              <p className="text-2xl font-black text-white mt-1">{m.value}</p>
              {m.unverified ? (
                <p className="text-[10px] font-mono uppercase text-amber-300/90 mt-2">
                  Unverified — founder to confirm
                </p>
              ) : null}
            </div>
          ))}
        </div>
      ) : null}

      {slide.bullets?.length ? (
        <ul className="space-y-3 text-sm md:text-base text-zinc-300 leading-relaxed list-disc pl-5">
          {slide.bullets.map((b) => (
            <li key={b.slice(0, 48)}>{b}</li>
          ))}
        </ul>
      ) : null}

      {slide.footnote ? (
        <p className="text-xs text-zinc-500 border-t border-white/10 pt-4">{slide.footnote}</p>
      ) : null}
    </div>
  );
}
