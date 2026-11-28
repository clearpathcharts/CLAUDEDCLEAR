import React from 'react';
import { BrandMark } from '../brand/BrandMark';
import { DESK_DISCLAIMER, DESK_SEO } from '../../content/traderDesksCopy';
import { TRADER_DESKS } from '../../lib/traderDesks';

const seo = DESK_SEO.fundamental;
const accent = TRADER_DESKS.fundamental.accent;

const RESEARCH_AREAS = [
  'Business model and revenue engine',
  'Income statement, balance sheet, and cash flow',
  'Earnings versus consensus',
  'Valuation and peer comparison',
  'Capital allocation and geographic exposure',
  'FRED macro context, filings, and news',
];

/**
 * Public door for logged-out visitors at /desk/fundamental.
 * Static copy only — it never mounts the research workstation or fetches vendor data.
 * Signed-in members still go DeskRoute -> FundamentalTraderDesk -> FundamentalDashboard.
 */
export default function FundamentalLandingPage() {
  return (
    <div className="min-h-screen w-full bg-[#0c0b0a] text-[#f3ece2]" data-fundamental-landing="true">
      <a href="#fundamental-landing-main" className="cp-skip-link">
        Skip to Fundamental desk overview
      </a>
      <header className="sticky top-0 z-[100] border-b border-white/10 bg-black/90 px-4 py-3">
        <nav aria-label="Fundamental desk" className="flex items-center justify-between gap-3">
          <a
            href="/"
            className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-[#c4a574] hover:text-white"
          >
            <BrandMark size={22} />
            ← ClearPath Home
          </a>
          <a
            href="/login"
            className="text-[10px] font-black uppercase tracking-wider hover:text-white"
            style={{ color: accent }}
          >
            Private Login
          </a>
        </nav>
      </header>

      <main id="fundamental-landing-main" tabIndex={-1} className="mx-auto max-w-4xl px-4 py-12 outline-none">
        <p className="font-mono text-[10px] uppercase tracking-[0.3em]" style={{ color: accent }}>
          {TRADER_DESKS.fundamental.tagline}
        </p>
        <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-5xl">{seo.h1}</h1>
        <p className="mt-5 max-w-3xl text-base leading-relaxed text-[#d9cfc0]">{seo.lead}</p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <a
            href="/join"
            className="rounded-2xl px-6 py-4 text-center text-xs font-black uppercase tracking-widest text-black"
            style={{ backgroundColor: accent }}
          >
            Create private account
          </a>
          <a
            href="/login"
            className="rounded-2xl border border-white/20 px-6 py-4 text-center text-xs font-black uppercase tracking-widest text-[#f3ece2] hover:border-white/50"
          >
            Sign in to open the desk
          </a>
        </div>

        <section aria-labelledby="fundamental-landing-areas" className="mt-12">
          <h2 id="fundamental-landing-areas" className="text-lg font-black uppercase tracking-wider text-[#c4a574]">
            What the desk covers
          </h2>
          <ul className="mt-4 grid gap-2 sm:grid-cols-2">
            {RESEARCH_AREAS.map((area) => (
              <li key={area} className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm">
                {area}
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="fundamental-landing-faq" className="mt-12">
          <h2 id="fundamental-landing-faq" className="text-lg font-black uppercase tracking-wider text-[#c4a574]">
            Questions
          </h2>
          <dl className="mt-4 space-y-4">
            {seo.faqs.map((faq) => (
              <div key={faq.question} className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                <dt className="text-sm font-bold">{faq.question}</dt>
                <dd className="mt-2 text-sm leading-relaxed text-[#d9cfc0]">{faq.answer}</dd>
              </div>
            ))}
          </dl>
        </section>

        <p className="mt-12 border-t border-white/10 pt-6 text-xs leading-relaxed text-[#9a9186]">
          {DESK_DISCLAIMER}
        </p>
      </main>
    </div>
  );
}
