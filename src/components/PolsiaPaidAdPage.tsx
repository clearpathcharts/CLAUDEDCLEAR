import React from 'react';
import { ArrowLeft, ExternalLink, Megaphone, Sparkles, Shield } from 'lucide-react';
import SEO from './SEO';
import { SurfBackground } from './SurfBackground';
import { POLSIA_PARTNER, POLSIA_REFERRAL_URL, POLSIA_REF_CODE } from '../content/polsiaPartner';

/**
 * Public paid-advertisement page — reachable without login.
 * Path: /ads/polsia  (also /polsia, /advertise/polsia)
 */
export default function PolsiaPaidAdPage() {
  return (
    <div className="min-h-[100dvh] w-full bg-[#050505] text-[#ccc8db] font-sans overflow-x-hidden relative">
      <SEO
        title="Sponsored: Polsia — AI That Runs Your Company"
        description="Paid advertisement for Polsia — an autonomous AI teammate for founders that plans, builds, markets, and operates alongside you. Open via ClearPath's referral link."
        canonical="https://clearpathtrader.com/ads/polsia"
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
        <span
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-[#FFD700]/40 bg-[#FFD700]/10 text-[#FFD700] text-[9px] font-black uppercase tracking-widest"
        >
          <Megaphone size={11} />
          Paid Advertisement
        </span>
      </nav>

      <main className="relative z-10 max-w-3xl mx-auto px-4 py-12 md:py-16">
        <p className="text-[10px] font-mono uppercase tracking-[0.25em] text-[#FF1493] mb-4">
          Sponsored partner · Ref {POLSIA_REF_CODE}
        </p>

        <h1
          className="text-3xl md:text-5xl font-black text-white tracking-tight leading-[1.1] mb-4"
          style={{ fontFamily: "'Cinzel', serif" }}
        >
          {POLSIA_PARTNER.name}
          <span className="block text-[#00E5FF] text-xl md:text-2xl mt-3 font-bold tracking-wide normal-case" style={{ fontFamily: 'ui-sans-serif, system-ui, sans-serif' }}>
            {POLSIA_PARTNER.tagline}
          </span>
        </h1>

        <p className="text-base md:text-lg text-zinc-400 leading-relaxed mb-8 max-w-2xl">
          {POLSIA_PARTNER.writeup}
        </p>

        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-10">
          {POLSIA_PARTNER.bullets.map((item) => (
            <li
              key={item}
              className="flex items-center gap-2.5 px-4 py-3 rounded-xl border border-[#00E5FF]/20 bg-[#00E5FF]/5 text-sm text-zinc-200"
            >
              <Sparkles size={14} className="text-[#00E5FF] shrink-0" />
              {item}
            </li>
          ))}
        </ul>

        <a
          href={POLSIA_REFERRAL_URL}
          target="_blank"
          rel="noopener noreferrer sponsored"
          className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-[#FF1493] to-[#B026FF] text-white text-xs font-black uppercase tracking-widest shadow-[0_0_28px_rgba(176,38,255,0.45)] hover:scale-[1.02] transition-transform"
        >
          {POLSIA_PARTNER.cta}
          <ExternalLink size={14} />
        </a>

        <p className="mt-3 text-[11px] font-mono text-zinc-500 break-all">
          {POLSIA_REFERRAL_URL}
        </p>

        <div className="mt-12 p-5 rounded-2xl border border-white/10 bg-black/50 flex gap-3">
          <Shield size={18} className="text-[#FFD700] shrink-0 mt-0.5" />
          <p className="text-xs text-zinc-500 leading-relaxed">
            {POLSIA_PARTNER.disclosure}
          </p>
        </div>
      </main>
    </div>
  );
}
