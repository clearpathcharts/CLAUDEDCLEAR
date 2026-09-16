import React from 'react';
import {
  AFFILIATE_TERMS_SECTIONS,
  AFFILIATE_TERMS_VERSION,
} from '../content/affiliateTerms';

/** Public Affiliate Program Agreement — linked from the activation modal and emails. */
export default function AffiliateTermsPage() {
  return (
    <div className="min-h-screen w-full bg-[#050505] text-white">
      <div className="max-w-3xl mx-auto px-5 py-12">
        <a
          href="/"
          className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 hover:text-[#00ffe1] transition-colors"
        >
          ← ClearPath Trader
        </a>
        <h1 className="mt-6 text-2xl md:text-3xl font-black uppercase tracking-wide">
          Affiliate Program Agreement
        </h1>
        <p className="mt-2 text-[11px] font-mono text-zinc-500">
          Version {AFFILIATE_TERMS_VERSION} · 25% lifetime residual · single-level · not an MLM
        </p>
        <div className="mt-8 space-y-8">
          {AFFILIATE_TERMS_SECTIONS.map((section) => (
            <section key={section.heading}>
              <h2 className="text-sm font-black uppercase tracking-wider text-[#00ffe1] mb-2">
                {section.heading}
              </h2>
              {section.body.map((p, i) => (
                <p key={i} className="text-sm text-zinc-400 leading-relaxed mb-2">
                  {p}
                </p>
              ))}
            </section>
          ))}
        </div>
        <p className="mt-12 text-[10px] font-mono text-zinc-600">
          © {new Date().getFullYear()} ClearPath Trader. Activate your link from the Affiliate
          Network tab inside your member dashboard.
        </p>
      </div>
    </div>
  );
}
