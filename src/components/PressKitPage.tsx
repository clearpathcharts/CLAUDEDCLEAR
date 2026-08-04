import React from 'react';
import { ArrowLeft, Quote, Newspaper } from 'lucide-react';
import SEO from './SEO';
import { SurfBackground } from './SurfBackground';
import { PRESS_KIT } from '../content/pressKit';

/**
 * Public press kit — no login required.
 * Paths: /press , /press-kit
 * Font scale is intentionally larger (TBI/ADHD readability); scoped to this page only.
 */
export default function PressKitPage() {
  const { founderStatement } = PRESS_KIT;

  return (
    <div className="min-h-[100dvh] w-full bg-[#050505] text-[#ccc8db] font-sans overflow-x-hidden relative text-base md:text-lg">
      <SEO
        title="Press Kit — Richard Floyd, Founder of ClearPath Trader"
        description="Official press kit for Richard Floyd, founder of ClearPathTrader.com: short bio, founder story, and media facts."
        canonical="https://clearpathtrader.com/press"
      />
      <SurfBackground />

      <nav className="relative z-10 w-full px-4 py-5 md:px-10 flex items-center justify-between border-b border-white/10 bg-black/80 backdrop-blur-xl">
        <a
          href="/"
          className="flex items-center gap-2 text-xs md:text-sm font-black uppercase tracking-widest text-[#00E5FF] hover:text-white transition-colors"
          style={{ fontFamily: "'Cinzel', serif" }}
        >
          <ArrowLeft size={16} />
          ClearPath Home
        </a>
        <span className="inline-flex items-center gap-1.5 text-[11px] md:text-xs font-black uppercase tracking-widest text-zinc-400">
          <Newspaper size={13} className="text-[#FF1493]" />
          Press Kit
        </span>
      </nav>

      <main className="relative z-10 max-w-3xl mx-auto px-4 py-12 md:py-16 space-y-14">
        <header className="space-y-5">
          <p className="text-xs md:text-sm font-mono uppercase tracking-[0.25em] text-[#FF1493]">
            Media / founder bio
          </p>
          <h1
            className="text-4xl md:text-6xl font-black text-white tracking-tight"
            style={{ fontFamily: "'Cinzel', serif" }}
          >
            {PRESS_KIT.subject}
          </h1>
          <p className="text-xl md:text-2xl text-[#00E5FF] font-semibold">{PRESS_KIT.role}</p>
          <p className="text-lg md:text-xl text-zinc-300 leading-relaxed border-l-2 border-[#FF1493]/60 pl-4">
            {PRESS_KIT.thesis}
          </p>
        </header>

        {/* Short bio — for journalists */}
        <section className="rounded-2xl border border-white/10 bg-black/50 p-6 md:p-8 space-y-4">
          <h2 className="text-sm md:text-base font-black uppercase tracking-[0.2em] text-[#FFD700]">
            Short bio
          </h2>
          <p className="text-base md:text-lg text-zinc-300 leading-relaxed">{PRESS_KIT.shortBio}</p>
        </section>

        {/* Pull quote */}
        <blockquote className="rounded-2xl border border-[#FF1493]/30 bg-[#FF1493]/5 p-6 md:p-8">
          <Quote size={24} className="text-[#FF1493] mb-3" />
          <p
            className="text-2xl md:text-3xl font-bold text-white leading-snug"
            style={{ fontFamily: "'Cinzel', serif" }}
          >
            “{PRESS_KIT.pullQuote}”
          </p>
        </blockquote>

        {/* Founder statement — centered, investor-facing */}
        <section
          className="rounded-2xl border border-white/15 bg-black/60 px-5 py-10 md:px-12 md:py-14 text-center space-y-6"
          aria-labelledby="press-founder-statement-heading"
        >
          <h2
            id="press-founder-statement-heading"
            className="text-2xl sm:text-3xl md:text-4xl font-black text-white tracking-tight leading-tight uppercase"
            style={{ fontFamily: "'Cinzel', serif" }}
          >
            {founderStatement.headline}
          </h2>
          {founderStatement.paragraphs.map((p) => (
            <p key={p.slice(0, 48)} className="text-base md:text-lg text-zinc-300 leading-relaxed max-w-2xl mx-auto">
              {p}
            </p>
          ))}
          <p className="text-lg md:text-xl text-white leading-relaxed max-w-2xl mx-auto">
            <strong className="font-black">{founderStatement.durableLine}</strong>
            <br />
            {founderStatement.trackRecordLine}
          </p>
          <p className="text-base md:text-lg text-zinc-200 leading-relaxed max-w-2xl mx-auto">
            This platform is education and market intelligence.{' '}
            <strong className="font-black text-white">Not a brokerage. Not financial advice.</strong>
          </p>
          <p className="text-base md:text-lg font-semibold text-[#00E5FF] pt-2">
            {founderStatement.signature}
          </p>
        </section>

        {/* Fact box */}
        <section className="rounded-2xl border border-[#00E5FF]/20 bg-[#00E5FF]/5 p-6 md:p-8">
          <h2 className="text-sm md:text-base font-black uppercase tracking-[0.2em] text-[#00E5FF] mb-5">
            Fact box
          </h2>
          <dl className="grid grid-cols-1 gap-4">
            {PRESS_KIT.facts.map((row) => (
              <div
                key={row.label}
                className="flex flex-col sm:flex-row sm:gap-4 border-b border-white/5 pb-3 last:border-0 last:pb-0"
              >
                <dt className="text-xs md:text-sm font-mono uppercase tracking-widest text-zinc-500 sm:w-40 shrink-0 pt-0.5">
                  {row.label}
                </dt>
                <dd className="text-base md:text-lg text-zinc-200">
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
          <h2 className="text-sm md:text-base font-black uppercase tracking-[0.2em] text-zinc-500">
            Full founder story
          </h2>
          {PRESS_KIT.fullBioSections.map((section) => (
            <article key={section.heading} className="space-y-4">
              <h3
                className="text-2xl md:text-3xl font-black text-white tracking-tight"
                style={{ fontFamily: "'Cinzel', serif" }}
              >
                {section.heading}
              </h3>
              {section.paragraphs.map((p) => (
                <p key={p.slice(0, 48)} className="text-base md:text-lg text-zinc-400 leading-relaxed">
                  {p}
                </p>
              ))}
            </article>
          ))}
        </section>

        <footer className="pt-6 border-t border-white/10 text-sm md:text-base text-zinc-500 space-y-3">
          <nav className="flex flex-wrap gap-x-4 gap-y-2 text-xs uppercase tracking-widest font-mono" aria-label="Accessibility and site links">
            <a href="/accessibility" className="text-[#00E5FF] hover:underline font-bold">
              Accessibility · WCAG
            </a>
            <a href="/ui" className="text-[#00E5FF]/80 hover:underline">
              Accessible UI Modes
            </a>
            <a href="/about" className="text-[#00E5FF] hover:underline">
              About ClearPath Trader
            </a>
          </nav>
          <p>
            For interviews, quotes, or assets, contact{' '}
            <a href={`mailto:${PRESS_KIT.contactEmail}`} className="text-[#00E5FF] hover:underline">
              {PRESS_KIT.contactEmail}
            </a>
            .
          </p>
        </footer>
      </main>
    </div>
  );
}
