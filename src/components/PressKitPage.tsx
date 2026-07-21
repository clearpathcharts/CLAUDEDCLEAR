import React from 'react';
import { ArrowLeft, Quote, Newspaper } from 'lucide-react';
import SEO from './SEO';
import { SurfBackground } from './SurfBackground';
import { PRESS_KIT } from '../content/pressKit';

/**
 * Public press kit — no login required.
 * Paths: /press , /press-kit
 */
export default function PressKitPage() {
  return (
    <div className="min-h-[100dvh] w-full bg-[#050505] text-[#ccc8db] font-sans overflow-x-hidden relative">
      <SEO
        title="Press Kit — Richard Floyd, Founder of ClearPath Trader"
        description="Official press kit for Richard Floyd, founder of ClearPathTrader.com: short bio, founder story, and media facts."
        canonical="https://clearpathtrader.com/press"
      />
      <SurfBackground />

      <nav className="relative z-10 w-full px-4 py-4 md:px-10 flex items-center justify-between border-b border-white/10 bg-black/80 backdrop-blur-xl">
        <a
          href="/"
          className="flex items-center gap-2 text-[10px] md:text-xs font-black uppercase tracking-widest text-[#00E5FF] hover:text-white transition-colors"
          style={{ fontFamily: "'Cinzel', serif" }}
        >
          <ArrowLeft size={14} />
          ClearPath Home
        </a>
        <span className="inline-flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-zinc-400">
          <Newspaper size={11} className="text-[#FF1493]" />
          Press Kit
        </span>
      </nav>

      <main className="relative z-10 max-w-3xl mx-auto px-4 py-12 md:py-16 space-y-12">
        <header className="space-y-4">
          <p className="text-[10px] font-mono uppercase tracking-[0.25em] text-[#FF1493]">
            Media / founder bio
          </p>
          <h1
            className="text-3xl md:text-5xl font-black text-white tracking-tight"
            style={{ fontFamily: "'Cinzel', serif" }}
          >
            {PRESS_KIT.subject}
          </h1>
          <p className="text-lg text-[#00E5FF] font-semibold">{PRESS_KIT.role}</p>
          <p className="text-base md:text-lg text-zinc-300 leading-relaxed border-l-2 border-[#FF1493]/60 pl-4">
            {PRESS_KIT.thesis}
          </p>
        </header>

        {/* Short bio — for journalists */}
        <section className="rounded-2xl border border-white/10 bg-black/50 p-6 md:p-8 space-y-3">
          <h2 className="text-xs font-black uppercase tracking-[0.2em] text-[#FFD700]">
            Short bio
          </h2>
          <p className="text-sm md:text-base text-zinc-300 leading-relaxed">{PRESS_KIT.shortBio}</p>
        </section>

        {/* Pull quote */}
        <blockquote className="rounded-2xl border border-[#FF1493]/30 bg-[#FF1493]/5 p-6 md:p-8">
          <Quote size={20} className="text-[#FF1493] mb-3" />
          <p
            className="text-xl md:text-2xl font-bold text-white leading-snug"
            style={{ fontFamily: "'Cinzel', serif" }}
          >
            “{PRESS_KIT.pullQuote}”
          </p>
        </blockquote>

        {/* Fact box */}
        <section className="rounded-2xl border border-[#00E5FF]/20 bg-[#00E5FF]/5 p-6 md:p-8">
          <h2 className="text-xs font-black uppercase tracking-[0.2em] text-[#00E5FF] mb-4">
            Fact box
          </h2>
          <dl className="grid grid-cols-1 gap-3">
            {PRESS_KIT.facts.map((row) => (
              <div
                key={row.label}
                className="flex flex-col sm:flex-row sm:gap-4 border-b border-white/5 pb-3 last:border-0 last:pb-0"
              >
                <dt className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 sm:w-36 shrink-0 pt-0.5">
                  {row.label}
                </dt>
                <dd className="text-sm text-zinc-200">
                  {row.label === 'Website' || row.label === 'Press contact' ? (
                    <a
                      href={row.label === 'Website' ? row.value : `mailto:${row.value}`}
                      className="text-[#00E5FF] hover:underline break-all"
                    >
                      {row.value}
                    </a>
                  ) : (
                    row.value
                  )}
                </dd>
              </div>
            ))}
          </dl>
        </section>

        {/* Full story */}
        <section className="space-y-10">
          <h2 className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">
            Full founder story
          </h2>
          {PRESS_KIT.fullBioSections.map((section) => (
            <article key={section.heading} className="space-y-3">
              <h3
                className="text-xl font-black text-white tracking-tight"
                style={{ fontFamily: "'Cinzel', serif" }}
              >
                {section.heading}
              </h3>
              {section.paragraphs.map((p) => (
                <p key={p.slice(0, 48)} className="text-sm md:text-base text-zinc-400 leading-relaxed">
                  {p}
                </p>
              ))}
            </article>
          ))}
        </section>

        <footer className="pt-6 border-t border-white/10 text-[11px] text-zinc-500 space-y-2">
          <p>
            For interviews, quotes, or assets, contact{' '}
            <a href={`mailto:${PRESS_KIT.contactEmail}`} className="text-[#00E5FF] hover:underline">
              {PRESS_KIT.contactEmail}
            </a>
            .
          </p>
          <p>
            Also see{' '}
            <a href="/about" className="text-[#00E5FF] hover:underline">
              About ClearPath Trader
            </a>
            .
          </p>
        </footer>
      </main>
    </div>
  );
}
