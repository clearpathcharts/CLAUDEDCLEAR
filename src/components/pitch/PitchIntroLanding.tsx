import React from 'react';
import SEO from '../SEO';
import { BrandMark } from '../brand/BrandMark';
import { PitchCategorySelect } from './PitchCategorySelect';
import { pitchHref } from '../../pitch/pitchDeckData';

export default function PitchIntroLanding() {
  return (
    <div className="min-h-[100dvh] bg-[#050505] text-white">
      <SEO
        title="ClearPath Trader — Investor pitch"
        description="Investor overview for ClearPath Trader: market, product, AI, traction, and $1.5M SAFE raise."
        canonical="https://clearpathtrader.com/pitch"
      />
      <header className="border-b border-white/10 bg-black/80 backdrop-blur-xl px-4 md:px-8 py-4 flex flex-wrap items-center justify-between gap-4">
        <a href="/" className="flex items-center gap-3 group">
          <BrandMark size={36} />
          <span className="flex flex-col leading-tight">
            <span className="text-xs font-black uppercase tracking-[0.2em] text-white">ClearPath</span>
            <span className="text-[10px] font-mono uppercase tracking-widest text-[#FF1493]">Trader</span>
          </span>
        </a>
        <PitchCategorySelect value="cover" />
      </header>

      <main className="max-w-3xl mx-auto px-6 py-16 md:py-24 text-center space-y-8">
        <p className="text-[10px] font-mono uppercase tracking-[0.35em] text-[#00E5FF]/80">
          Investor materials
        </p>
        <h1 className="text-4xl md:text-5xl font-black tracking-tight">
          ClearPath Trader{' '}
          <span className="block text-2xl md:text-3xl mt-2 text-[#BF00FF]">pitch deck</span>
        </h1>
        <p className="text-zinc-400 text-lg leading-relaxed max-w-xl mx-auto">
          Separate from the public marketing home — ten slides covering market, product, AI, traction
          (with honest placeholders), and a proposed $1.5M SAFE.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <a
            href={pitchHref('cover')}
            className="inline-flex items-center justify-center px-8 py-3 rounded-full text-sm font-black uppercase tracking-widest text-white bg-gradient-to-r from-[#BF00FF] to-[#FF1493] shadow-[0_0_24px_rgba(191,0,255,0.35)] hover:opacity-95 transition-opacity"
          >
            Open presentation
          </a>
          <a
            href="/technology-opportunity"
            className="inline-flex items-center justify-center px-8 py-3 rounded-full text-sm font-black uppercase tracking-widest text-black bg-[#00E5FF] hover:bg-white transition-colors"
          >
            Technology &amp; investment page
          </a>
          <a
            href="/"
            className="text-xs font-mono uppercase tracking-widest text-zinc-500 hover:text-[#00E5FF]"
          >
            ← Main site
          </a>
        </div>
      </main>
    </div>
  );
}
