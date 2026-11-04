import React from 'react';
import SEO from '../SEO';
import { BrandMark } from '../brand/BrandMark';
import { PRODUCT_URL } from '../../content/productIdentity';
import {
  TECH_OPP_CLOSING,
  TECH_OPP_DIFFERENTIATORS,
  TECH_OPP_ECOSYSTEM,
  TECH_OPP_IP_ASSETS,
  TECH_OPP_MARKETS,
  TECH_OPP_META,
  TECH_OPP_NAV,
  TECH_OPP_PILLARS,
  TECH_OPP_PLATFORM,
  TECH_OPP_POSITIONING,
  TECH_OPP_SEC_NOTE,
  TECH_OPP_VALUE_LAYERS,
  TECH_OPP_VERIFICATION,
  TECH_OPP_WHY_INVEST,
} from '../../content/investorTechnologyOpportunity';

function Section({
  id,
  eyebrow,
  title,
  children,
}: {
  id: string;
  eyebrow?: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-28 border-t border-white/10 py-16 md:py-20">
      {eyebrow ? (
        <p className="text-[10px] font-mono uppercase tracking-[0.35em] text-[#00E5FF]/80 mb-3">{eyebrow}</p>
      ) : null}
      <h2 className="text-2xl md:text-3xl font-black tracking-tight text-white mb-6 max-w-3xl">{title}</h2>
      <div className="space-y-5 text-[15px] leading-relaxed text-zinc-300 max-w-3xl">{children}</div>
    </section>
  );
}

export default function TechnologyInvestmentOpportunityPage() {
  const p = TECH_OPP_POSITIONING;

  return (
    <div className="min-h-[100dvh] bg-[#07090d] text-white">
      <SEO
        title={TECH_OPP_META.title}
        description={TECH_OPP_META.description}
        canonical={TECH_OPP_META.canonical}
      />

      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#07090d]/90 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-4 md:px-8 py-3 flex flex-wrap items-center justify-between gap-3">
          <a href="/" className="flex items-center gap-3">
            <BrandMark size={32} />
            <span className="flex flex-col leading-tight">
              <span className="text-xs font-black uppercase tracking-[0.2em]">ClearPath</span>
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#00E5FF]">Trader</span>
            </span>
          </a>
          <nav className="flex items-center gap-4 text-[10px] font-mono uppercase tracking-widest text-zinc-400">
            <a href={PRODUCT_URL} className="hover:text-white">
              Live site
            </a>
            <a href="/pitch" className="hover:text-white">
              Pitch slides
            </a>
            <a href="/press-kit" className="hover:text-white">
              Press kit
            </a>
            <a href="/communications" className="hover:text-[#00E5FF]">
              Communications
            </a>
          </nav>
        </div>
      </header>

      <div className="relative overflow-hidden border-b border-white/10">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-60"
          style={{
            background:
              'radial-gradient(ellipse 80% 60% at 20% -10%, rgba(0,229,255,0.18), transparent 55%), radial-gradient(ellipse 70% 50% at 90% 20%, rgba(255,20,147,0.12), transparent 50%), linear-gradient(180deg, #0a1018 0%, #07090d 100%)',
          }}
        />
        <div className="relative max-w-6xl mx-auto px-4 md:px-8 py-16 md:py-24">
          <p className="text-[10px] font-mono uppercase tracking-[0.4em] text-[#00E5FF] mb-4">{p.eyebrow}</p>
          <p className="text-sm font-black uppercase tracking-[0.25em] text-white mb-3">{p.brand}</p>
          <h1 id="opening" className="text-3xl md:text-5xl font-black tracking-tight max-w-4xl leading-[1.1]">
            {p.headline}
          </h1>
          <p className="mt-6 text-lg md:text-xl text-[#00E5FF] font-medium max-w-2xl">“{p.principle}”</p>
          <p className="mt-6 text-zinc-300 max-w-3xl leading-relaxed">{p.lead}</p>
          <p className="mt-4 text-zinc-400 max-w-3xl leading-relaxed">{p.foundation}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href={PRODUCT_URL}
              className="inline-flex items-center justify-center px-6 py-3 text-xs font-black uppercase tracking-widest bg-[#00E5FF] text-black hover:bg-white transition-colors"
            >
              Visit clearpathtrader.com
            </a>
            <a
              href="#opportunity"
              className="inline-flex items-center justify-center px-6 py-3 text-xs font-black uppercase tracking-widest border border-white/25 text-white hover:border-[#00E5FF] hover:text-[#00E5FF] transition-colors"
            >
              Investment opportunity
            </a>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 md:px-8 grid grid-cols-1 lg:grid-cols-[220px_minmax(0,1fr)] gap-10 pb-24">
        <aside className="hidden lg:block pt-16">
          <nav className="sticky top-24 space-y-2" aria-label="Page sections">
            {TECH_OPP_NAV.map((item) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                className="block text-[10px] font-mono uppercase tracking-wider text-zinc-500 hover:text-[#00E5FF] leading-snug"
              >
                {item.label}
              </a>
            ))}
          </nav>
        </aside>

        <div>
          <Section id="philosophy" eyebrow="Philosophy" title="Built to Challenge Conventional Thinking">
            <ul className="grid sm:grid-cols-2 gap-3">
              {p.philosophy.map((row) => (
                <li key={row.label} className="border border-white/10 bg-white/[0.03] px-4 py-3">
                  <span className="text-white font-semibold">{row.label}</span>
                  <span className="text-zinc-500"> over </span>
                  <span className="text-zinc-400">{row.vs}</span>
                </li>
              ))}
            </ul>
            <p>{p.focus}</p>
            <p className="text-zinc-500 text-sm">
              ClearPath does not build its identity around: {p.notAbout.join('; ')}.
            </p>
          </Section>

          <Section id="pillars" eyebrow="Principal assets" title="What You’re Actually Getting">
            <p className="text-zinc-400">
              ClearPath Trader is the delivery environment. The intellectual value is the proprietary analytical
              methodology operating inside it — not merely access to another charting platform.
            </p>
            <ol className="space-y-6">
              {TECH_OPP_VALUE_LAYERS.map((layer, i) => (
                <li key={layer.id} className="border-l-2 border-[#00E5FF]/50 pl-4">
                  <p className="text-[10px] font-mono uppercase tracking-widest text-[#00E5FF]/80 mb-1">
                    {String(i + 1).padStart(2, '0')} · {layer.role}
                  </p>
                  <h3 className="text-lg font-bold text-white mb-2">{layer.title}</h3>
                  <p>{layer.body}</p>
                </li>
              ))}
            </ol>
          </Section>

          <Section id="engines" eyebrow="Proprietary technology" title="The Analytical Engines">
            <div className="space-y-8">
              {TECH_OPP_PILLARS.map((pillar) => (
                <article key={pillar.id} className="border border-white/10 bg-[#0c1118] p-5 md:p-6">
                  <h3 className="text-xl font-bold text-white mb-3">{pillar.title}</h3>
                  <ul className="list-disc pl-5 space-y-1.5 mb-4">
                    {pillar.points.map((pt) => (
                      <li key={pt}>{pt}</li>
                    ))}
                  </ul>
                  <p className="text-sm text-[#00E5FF]/90 mb-3">{pillar.investment}</p>
                  <p className="text-[10px] font-mono text-zinc-500 break-all">
                    Repo evidence: {pillar.evidence.join(' · ')}
                  </p>
                </article>
              ))}
            </div>
          </Section>

          <Section id="patterns" eyebrow="Pattern recognition" title="Measuring Market Structure">
            <p>
              ClearPath is not merely displaying a library of pre-drawn patterns. It contains code intended to measure
              market structure from price-series data — with inspectable outputs: number of detected structures, scanned
              chart window, identification, classification, geometric-fit confidence, and developing versus completed
              structures.
            </p>
            <p className="text-sm text-zinc-400">
              Example confidence figures (e.g. 61%) are geometric-fit measurements, not probabilities of profitability.
            </p>
          </Section>

          <Section id="river" eyebrow="ClearPath River" title="An Extensible Analytical Runtime">
            <p>
              River spans language detection and importers, Pine-related parsing and compilation, AST components, RIR,
              lowering, runtime execution, builtins, series storage, and script catalogs. Diligence should cover
              compatibility, supported language coverage, and production readiness before broader commercial claims.
            </p>
          </Section>

          <Section id="buddy" eyebrow="CPT Buddy" title="Intelligence That Explains Rather Than Directs">
            {TECH_OPP_ECOSYSTEM.filter((e) => e.id === 'buddy').map((e) => (
              <p key={e.id}>{e.body}</p>
            ))}
          </Section>

          <Section id="neuro" eyebrow="Accessibility" title="Financial Technology for Different Minds">
            <p>
              {TECH_OPP_PILLARS.find((x) => x.id === 'neuro')?.points.join(' ')} The differentiation is developing
              different ways to interact with financial-market information.
            </p>
          </Section>

          <Section id="education" eyebrow="Education" title="Knowledge Without a Paywall">
            {TECH_OPP_ECOSYSTEM.filter((e) => e.id !== 'buddy').map((e) => (
              <div key={e.id}>
                <h3 className="text-white font-bold mb-2">{e.title}</h3>
                <p>{e.body}</p>
              </div>
            ))}
          </Section>

          <Section id="platform" eyebrow="Infrastructure" title="The Technology Platform">
            {TECH_OPP_PLATFORM.map((row) => (
              <div key={row.title}>
                <h3 className="text-white font-bold mb-2">{row.title}</h3>
                <p>{row.body}</p>
              </div>
            ))}
            <div className="overflow-x-auto border border-white/10">
              <table className="w-full text-sm">
                <thead className="bg-white/[0.04] text-left text-[10px] font-mono uppercase tracking-wider text-zinc-400">
                  <tr>
                    <th className="px-3 py-2">Differentiator</th>
                    <th className="px-3 py-2">ClearPath’s approach</th>
                  </tr>
                </thead>
                <tbody>
                  {TECH_OPP_DIFFERENTIATORS.map((row) => (
                    <tr key={row.area} className="border-t border-white/10">
                      <td className="px-3 py-2 text-white font-medium">{row.area}</td>
                      <td className="px-3 py-2 text-zinc-300">{row.approach}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>

          <Section id="business" eyebrow="Business model" title="An Independent Software Business">
            <p>
              Free education infrastructure is part of the ecosystem. Paid access is explained around analytical
              technology and software functionality the plan catalog actually covers — not speculative projections.
            </p>
            <p>
              Potential markets: {TECH_OPP_MARKETS.join('; ')}.
            </p>
            <h3 className="text-white font-bold pt-2">Intellectual-property inventory (potential assets)</h3>
            <ul className="list-disc pl-5 space-y-1">
              {TECH_OPP_IP_ASSETS.map((a) => (
                <li key={a}>{a}</li>
              ))}
            </ul>
            <p className="text-sm text-zinc-500">
              Source-code ownership, third-party licensing, originality, patentability, and trade-secret protection are
              separate questions. A U.S. intellectual-property attorney should review protection strategy before
              disclosing sensitive implementation details.
            </p>
          </Section>

          <Section id="opportunity" eyebrow="Investment" title="Why Invest in ClearPath Trader?">
            <ol className="space-y-5">
              {TECH_OPP_WHY_INVEST.map((item, i) => (
                <li key={item.title}>
                  <p className="text-[10px] font-mono uppercase tracking-widest text-[#00E5FF]/80 mb-1">
                    {i + 1}. {item.title}
                  </p>
                  <p>{item.body}</p>
                </li>
              ))}
            </ol>
          </Section>

          <Section id="verification" eyebrow="Credibility" title={TECH_OPP_SEC_NOTE.title}>
            <p>{TECH_OPP_SEC_NOTE.body}</p>
            <div className="overflow-x-auto border border-white/10 mt-4">
              <table className="w-full text-sm">
                <thead className="bg-white/[0.04] text-left text-[10px] font-mono uppercase tracking-wider text-zinc-400">
                  <tr>
                    <th className="px-3 py-2">Area</th>
                    <th className="px-3 py-2">Verification needed</th>
                  </tr>
                </thead>
                <tbody>
                  {TECH_OPP_VERIFICATION.map((row) => (
                    <tr key={row.area} className="border-t border-white/10">
                      <td className="px-3 py-2 text-white font-medium whitespace-nowrap">{row.area}</td>
                      <td className="px-3 py-2 text-zinc-300">{row.needed}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>

          <Section id="close" title={TECH_OPP_CLOSING.title}>
            <p>{TECH_OPP_CLOSING.body}</p>
            <p className="text-sm text-zinc-500">{TECH_OPP_CLOSING.legal}</p>
            <div className="pt-4 flex flex-wrap gap-3">
              <a
                href={PRODUCT_URL}
                className="inline-flex px-5 py-2.5 text-xs font-black uppercase tracking-widest bg-[#00E5FF] text-black"
              >
                Open the live product
              </a>
              <a
                href="/pitch"
                className="inline-flex px-5 py-2.5 text-xs font-black uppercase tracking-widest border border-white/20"
              >
                Open pitch slides
              </a>
            </div>
          </Section>
        </div>
      </div>
    </div>
  );
}
