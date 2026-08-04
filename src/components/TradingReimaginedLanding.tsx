"use client";

import React from 'react';
import {
  ArrowLeft,
  Zap,
  Palette,
  BarChart3,
  GraduationCap,
  Sparkles,
  Layers,
  Scan,
  BookOpen,
  Gauge,
  Brain,
} from 'lucide-react';
import SEO from './SEO';
import { SurfBackground } from './SurfBackground';
import GovernmentFinanceLinks from './GovernmentFinanceLinks';
import {
  TRADING_REIMAGINED_FAQS,
  TRADING_REIMAGINED_SEO,
  SPEED_COPY,
} from '../content/tradingReimaginedLanding';

export default function TradingReimaginedLanding() {
  const handleBack = () => {
    window.location.href = '/';
  };

  const handleCta = () => {
    window.location.href = '/';
  };

  return (
    <div className="min-h-[100dvh] w-full bg-[#050505] text-[#ccc8db] font-sans overflow-y-auto overflow-x-hidden pb-20 relative">
      <SEO
        title={TRADING_REIMAGINED_SEO.title}
        description={TRADING_REIMAGINED_SEO.description}
        keywords={TRADING_REIMAGINED_SEO.keywords}
        canonical={TRADING_REIMAGINED_SEO.canonical}
      />
      <SurfBackground />

      <nav className="relative z-10 w-full p-6 lg:px-12 flex justify-between items-center border-b border-white/5 bg-[#050505]/80 backdrop-blur-md">
        <span className="font-black tracking-tighter text-xl uppercase italic text-white flex flex-col leading-none">
          <span>CLEAR PATH</span>
          <span className="text-sm lava-hot-text">TRADER</span>
        </span>
        <button
          type="button"
          onClick={handleBack}
          className="flex items-center space-x-2 px-4 py-2 border border-white/10 text-white text-xs font-bold uppercase tracking-widest rounded-lg hover:bg-white/5 transition-colors"
        >
          <ArrowLeft size={16} />
          <span>Back</span>
        </button>
      </nav>

      <main className="relative z-10 max-w-4xl mx-auto px-6 pt-14 pb-20 space-y-14">
        <header className="text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-cyan-500/30 bg-cyan-500/10 text-cyan-400 text-xs font-mono uppercase tracking-widest">
            <Sparkles size={14} />
            Next-generation terminal
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.08]">
            If Trading and ChatGPT Had a Baby
          </h1>
          <p className="text-lg md:text-xl text-gray-400 max-w-3xl mx-auto leading-relaxed">
            What we&apos;ve built is something you&apos;ve never seen before — and honestly, probably never imagined. We studied the top trading platforms, took their best features, made them our own, added bonuses nobody else offers, and then turbocharged the whole thing.
          </p>
          <p className="text-base text-zinc-500 max-w-2xl mx-auto leading-relaxed">
            We&apos;re confident it will transform the way you trade. And here&apos;s the part that sets us apart: this isn&apos;t just for the seasoned trader. It&apos;s built for the complete beginner too.
          </p>
          <p className="text-sm font-mono text-[#FF1493] uppercase tracking-widest">
            So how are we different from everyone else? Let me walk you through it.
          </p>
          <button
            type="button"
            onClick={handleCta}
            className="mt-4 px-8 py-3 rounded-xl bg-gradient-to-r from-[#FF0080] via-[#FF4500] to-[#FF8C00] text-black text-sm font-black uppercase tracking-wider hover:shadow-[0_0_28px_rgba(255,69,0,0.5)] transition-shadow"
          >
            Open the Terminal
          </button>
        </header>

        <FeatureSection
          icon={<Gauge className="text-[#00FFFF]" size={28} />}
          title={SPEED_COPY.headline}
          accent="cyan"
        >
          <p>{SPEED_COPY.body}</p>
        </FeatureSection>

        <FeatureSection
          icon={<Brain className="text-[#FF1493]" size={28} />}
          title="Neurodivergence"
          accent="pink"
        >
          <p>
            Not everyone learns the same way, and not everyone can absorb information from a single one-size-fits-all layout. So we designed colors and layouts to match your learning style — everything from traditional trading layouts all the way through to fully autism-friendly designs. <strong className="text-white font-normal">You pick what your brain works best with.</strong>
          </p>
        </FeatureSection>

        <FeatureSection
          icon={<Palette className="text-violet-400" size={28} />}
          title="Customization"
          accent="violet"
        >
          <p>
            The platform is completely yours. Change the colors. Change the layout. Add windows, remove windows. Link your social media, watch the news, keep your world connected — all without leaving your charts. And we&apos;re just getting started; more is coming.
          </p>
        </FeatureSection>

        <FeatureSection
          icon={<BarChart3 className="text-amber-400" size={28} />}
          title="Indicators"
          accent="amber"
        >
          <p className="mb-4">
            Now listen carefully. Most platforms limit how many indicators you&apos;re allowed to run at once. We think that&apos;s ridiculous — so we opened the floodgates. <strong className="text-white">Run as many as you want. No caps.</strong>
          </p>
          <p className="mb-4 flex items-start gap-2">
            <Scan className="text-[#FF1493] shrink-0 mt-1" size={18} />
            <span>
              And here&apos;s something no one else does: we built a function that automatically detects and marks chart patterns for you. Perfect if you&apos;re still learning to read them, or if you just don&apos;t feel like marking up your charts by hand.
            </span>
          </p>
          <p className="flex items-start gap-2">
            <BookOpen className="text-cyan-400 shrink-0 mt-1" size={18} />
            <span>
              <strong className="text-white">But wait — there&apos;s more.</strong> Ever scrolled through a list of indicators and thought, &quot;What even is that, and how does it work?&quot; Same. So we built an <strong className="text-cyan-400">Indicator Encyclopedia</strong> that explains exactly what each one does and how it works.
            </span>
          </p>
        </FeatureSection>

        <FeatureSection
          icon={<GraduationCap className="text-emerald-400" size={28} />}
          title="Education"
          accent="emerald"
        >
          <p>
            We added a full education path where a total beginner can start at square one and climb all the way to advanced. And we explain everything in plain human language — not dense trading jargon. We break it down using everyday comparisons and real-life examples, so it actually clicks.
          </p>
        </FeatureSection>

        <section className="glass p-8 rounded-3xl border border-white/10 space-y-6">
          <h2 className="text-2xl font-black text-white uppercase tracking-tight text-center">
            Frequently Asked Questions
          </h2>
          <div className="space-y-4">
            {TRADING_REIMAGINED_FAQS.map((faq) => (
              <div key={faq.question} className="bg-black/50 rounded-xl p-5 border border-white/5">
                <h3 className="text-sm font-bold text-white mb-2">{faq.question}</h3>
                <p className="text-sm text-zinc-400 leading-relaxed">{faq.answer}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="text-center space-y-4 py-8">
          <Layers className="mx-auto text-[#00FFFF]" size={32} />
          <h2 className="text-2xl font-black text-white uppercase">Ready to see it?</h2>
          <p className="text-zinc-500 text-sm max-w-md mx-auto">
            Charts, patterns, indicators, education, and your connected world — one terminal.
          </p>
          <button
            type="button"
            onClick={handleCta}
            className="px-10 py-3 rounded-xl border border-[#00FFFF]/40 text-[#00FFFF] text-xs font-black uppercase tracking-widest hover:bg-[#00FFFF]/10 transition-colors"
          >
            Launch ClearPath Trader
          </button>
        </section>
      </main>

      <footer className="relative z-10 text-center py-8 text-zinc-600 text-[10px] uppercase tracking-widest font-mono border-t border-white/5">
        <nav className="flex flex-wrap justify-center gap-4 mb-4" aria-label="Accessibility and legal links">
          <a href="/accessibility" className="text-[#00FFFF] hover:text-white transition-colors font-bold">Accessibility · WCAG</a>
          <a href="/ui" className="hover:text-zinc-400 transition-colors">Accessible UI Modes</a>
          <a href="/about" className="hover:text-zinc-400 transition-colors">About</a>
          <a href="/terms.html" className="hover:text-zinc-400 transition-colors">Terms</a>
          <a href="/privacy.html" className="hover:text-zinc-400 transition-colors">Privacy</a>
          <a href="/disclaimer.html" className="hover:text-zinc-400 transition-colors">Disclaimer</a>
        </nav>
        <p>&copy; {new Date().getFullYear()} Clear Path Markets Science</p>
        <GovernmentFinanceLinks compact />
      </footer>
    </div>
  );
}

function FeatureSection({
  icon,
  title,
  accent,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  accent: string;
  children: React.ReactNode;
}) {
  const borderMap: Record<string, string> = {
    cyan: 'border-cyan-500/20',
    pink: 'border-[#FF1493]/25',
    violet: 'border-violet-500/20',
    amber: 'border-amber-500/20',
    emerald: 'border-emerald-500/20',
  };

  return (
    <section className={`glass p-8 md:p-10 rounded-3xl border ${borderMap[accent] || 'border-white/10'} space-y-4`}>
      <div className="flex items-center gap-3">
        {icon}
        <h2 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tight">{title}</h2>
      </div>
      <div className="text-gray-400 text-base md:text-lg leading-relaxed space-y-4">{children}</div>
    </section>
  );
}
