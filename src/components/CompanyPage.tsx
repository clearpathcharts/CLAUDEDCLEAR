import React from 'react';
import { ArrowLeft, Building2 } from 'lucide-react';
import SEO from './SEO';
import { SurfBackground } from './SurfBackground';
import PublicSiteLinks from './PublicSiteLinks';
import {
  COMPANY_META_DESCRIPTION,
  ORG_FOUNDING_DATE,
  ORG_JURISDICTION_LABEL,
  ORG_LEGAL_NAME,
  ORG_PRODUCT_HISTORY_YEARS,
} from '../content/organizationPublic';
import { PRODUCT_DISAMBIGUATION, PRODUCT_FOUR_DESKS_PHRASE, PRODUCT_WHAT_IT_IS } from '../content/productIdentity';

const INCORP_DISPLAY = new Date(`${ORG_FOUNDING_DATE}T12:00:00`).toLocaleDateString('en-US', {
  month: 'long',
  year: 'numeric',
});

export default function CompanyPage() {
  return (
    <div className="min-h-[100dvh] w-full bg-[#050505] text-[#ccc8db] font-sans overflow-x-hidden relative text-base md:text-lg">
      <SEO
        title="Company — Clear Path Markets Science Corp."
        description={COMPANY_META_DESCRIPTION}
        canonical="https://clearpathtrader.com/company"
      />
      <SurfBackground />

      <nav className="relative z-10 w-full px-4 py-5 md:px-10 flex items-center justify-between border-b border-white/10 bg-black/80 backdrop-blur-xl">
        <a
          href="/"
          className="flex items-center gap-2 text-xs md:text-sm font-black uppercase tracking-widest text-[#00E5FF] hover:text-white transition-colors"
        >
          <ArrowLeft size={16} />
          ClearPath Home
        </a>
        <span className="inline-flex items-center gap-1.5 text-[11px] md:text-xs font-black uppercase tracking-widest text-zinc-400">
          <Building2 size={13} className="text-[#FFD700]" />
          Company
        </span>
      </nav>

      <main className="relative z-10 max-w-3xl mx-auto px-4 py-12 md:py-16 space-y-10">
        <header className="space-y-4">
          <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight" style={{ fontFamily: "'Cinzel', serif" }}>
            {ORG_LEGAL_NAME}
          </h1>
          <p className="text-xl text-[#00E5FF] font-semibold">ClearPath Trader</p>
          <p className="text-lg text-zinc-300 leading-relaxed">{COMPANY_META_DESCRIPTION}</p>
        </header>

        <section className="rounded-2xl border border-white/10 bg-black/50 p-6 md:p-8 space-y-4">
          <h2 className="text-sm font-black uppercase tracking-[0.2em] text-[#FFD700]">Corporate</h2>
          <ul className="space-y-3 text-zinc-300">
            <li>
              <strong className="text-white">Legal name:</strong> {ORG_LEGAL_NAME}
            </li>
            <li>
              <strong className="text-white">Form:</strong> {ORG_JURISDICTION_LABEL}
            </li>
            <li>
              <strong className="text-white">Incorporated:</strong> {INCORP_DISPLAY}
            </li>
            <li>
              <strong className="text-white">Platform:</strong> ClearPath Trader has been developed over approximately{' '}
              {ORG_PRODUCT_HISTORY_YEARS} years; the Delaware corporation was formed in {INCORP_DISPLAY.split(' ')[0]}{' '}
              {INCORP_DISPLAY.split(' ')[1]}.
            </li>
          </ul>
        </section>

        <section className="rounded-2xl border border-white/10 bg-black/50 p-6 md:p-8 space-y-4">
          <h2 className="text-sm font-black uppercase tracking-[0.2em] text-[#FF1493]">What we build</h2>
          <p className="text-zinc-300 leading-relaxed">{PRODUCT_WHAT_IT_IS}</p>
          <p className="text-zinc-400">
            Four trader desks on one site: {PRODUCT_FOUR_DESKS_PHRASE}.
          </p>
        </section>

        <section className="rounded-2xl border border-indigo-500/20 bg-indigo-500/5 p-6 md:p-8">
          <h2 className="text-sm font-black uppercase tracking-[0.2em] text-indigo-300 mb-3">Not confused with</h2>
          <p className="text-zinc-400 text-sm leading-relaxed">{PRODUCT_DISAMBIGUATION}</p>
        </section>

        <section className="text-sm text-zinc-500 leading-relaxed">
          <p>
            ClearPath Trader is for education and market intelligence. It is not a broker-dealer, does not custody funds, and
            does not provide personalized investment advice. See{' '}
            <a href="/platform-scope.html" className="text-[#00E5FF] hover:underline">
              platform scope
            </a>{' '}
            and{' '}
            <a href="/disclaimer.html" className="text-[#00E5FF] hover:underline">
              disclaimer
            </a>
            .
          </p>
        </section>

        <PublicSiteLinks />
      </main>
    </div>
  );
}
