import React from 'react';
import { ArrowLeft } from 'lucide-react';
import SEO from './SEO';
import { SurfBackground } from './SurfBackground';
import PublicSiteLinks from './PublicSiteLinks';
import { FOUNDER_LEADER } from '../content/leadershipPublic';
import { PRESS_KIT } from '../content/pressKit';

export default function FounderPage() {
  return (
    <div className="min-h-[100dvh] w-full bg-[#050505] text-[#ccc8db] font-sans overflow-x-hidden relative text-base md:text-lg">
      <SEO
        title="Founder — Richard Floyd"
        description="Richard Anthony Floyd, founder and CEO of ClearPath Trader and Clear Path Markets Science Corp."
        canonical="https://clearpathtrader.com/founder"
      />
      <SurfBackground />

      <nav className="relative z-10 w-full px-4 py-5 md:px-10 flex items-center justify-between border-b border-white/10 bg-black/80 backdrop-blur-xl">
        <a href="/" className="flex items-center gap-2 text-xs md:text-sm font-black uppercase tracking-widest text-[#00E5FF] hover:text-white transition-colors">
          <ArrowLeft size={16} />
          ClearPath Home
        </a>
      </nav>

      <main className="relative z-10 max-w-3xl mx-auto px-4 py-12 md:py-16 space-y-10">
        <div className="flex flex-col md:flex-row gap-8 items-center md:items-start">
          <img
            src={FOUNDER_LEADER.imageUrl}
            alt="Richard Anthony Floyd, Founder and CEO of ClearPath Trader"
            width={280}
            height={350}
            className="w-56 md:w-64 rounded-2xl object-cover border-2 border-[#FF1493]/30 shadow-xl"
          />
          <header className="space-y-4 text-center md:text-left">
            <p className="text-xs font-mono uppercase tracking-[0.25em] text-[#FF1493]">Founder & CEO</p>
            <h1 className="text-4xl md:text-5xl font-black text-white" style={{ fontFamily: "'Cinzel', serif" }}>
              {FOUNDER_LEADER.displayName}
            </h1>
            <p className="text-xl text-zinc-300 italic">“{PRESS_KIT.pullQuote}”</p>
          </header>
        </div>

        <p className="text-lg text-zinc-300 leading-relaxed">{PRESS_KIT.shortBio}</p>

        <div className="flex flex-wrap gap-4">
          <a
            href="/press"
            className="inline-flex px-5 py-3 rounded-xl bg-[#FF1493]/20 border border-[#FF1493]/40 text-white font-bold text-sm uppercase tracking-wider hover:bg-[#FF1493]/30 transition-colors"
          >
            Read full press kit
          </a>
          <a
            href="/leadership"
            className="inline-flex px-5 py-3 rounded-xl border border-white/20 text-zinc-300 font-bold text-sm uppercase tracking-wider hover:border-[#00E5FF]/50 transition-colors"
          >
            Leadership team
          </a>
        </div>

        <PublicSiteLinks />
      </main>
    </div>
  );
}
