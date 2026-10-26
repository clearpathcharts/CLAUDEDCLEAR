import React from 'react';
import { ArrowLeft, BadgeCheck, CalendarDays, FileText, MapPin } from 'lucide-react';
import SEO from './SEO';
import { SurfBackground } from './SurfBackground';
import PublicSiteLinks from './PublicSiteLinks';
import {
  CEO_COMMITMENT_DETAILS,
  CEO_COMMITMENT_INTRO,
  CEO_COMMITMENT_META,
  CEO_COMMITMENT_SECTIONS,
  CEO_COMMITMENT_SIGNATURE,
} from '../content/ceoCommitmentStatement';

export default function CeoCommitmentStatementPage() {
  return (
    <div className="min-h-[100dvh] w-full overflow-x-hidden bg-[#050505] font-sans text-zinc-300 print:bg-white print:text-slate-900">
      <SEO
        title={CEO_COMMITMENT_META.title}
        description={CEO_COMMITMENT_META.description}
        canonical={CEO_COMMITMENT_META.canonical}
      />
      <SurfBackground />

      <nav className="relative z-10 flex w-full items-center justify-between gap-4 border-b border-white/10 bg-black/80 px-4 py-4 backdrop-blur-xl md:px-10 print:hidden">
        <a
          href="/"
          className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-[#00E5FF] transition-colors hover:text-white md:text-sm"
        >
          <ArrowLeft size={16} aria-hidden="true" />
          ClearPath Home
        </a>
        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex items-center gap-2 rounded-lg border border-white/15 px-3 py-2 text-[11px] font-black uppercase tracking-widest text-zinc-300 transition-colors hover:border-[#00E5FF]/50 hover:text-white"
        >
          <FileText size={14} aria-hidden="true" />
          Print statement
        </button>
      </nav>

      <main className="relative z-10 mx-auto max-w-4xl px-4 py-10 sm:px-6 md:py-16 print:max-w-none print:p-0">
        <article className="overflow-hidden rounded-[2rem] border border-white/10 bg-[#09090b]/95 shadow-[0_30px_100px_rgba(0,0,0,0.55)] print:rounded-none print:border-0 print:bg-white print:shadow-none">
          <header className="relative overflow-hidden border-b border-white/10 px-6 py-10 text-center sm:px-10 md:px-14 md:py-14 print:border-slate-300">
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#00E5FF] via-[#FFD700] to-[#FF1493] print:bg-slate-900" />
            <div className="relative">
              <p className="text-xs font-black uppercase tracking-[0.28em] text-zinc-400 print:text-slate-600">
                Clear Path Markets Science Corp.
              </p>
              <p className="mt-2 text-sm font-black uppercase tracking-[0.35em] text-[#00E5FF] print:text-slate-800">
                ClearPathTrader
              </p>
              <div className="mx-auto my-7 h-px w-24 bg-[#FFD700]/60 print:bg-slate-400" />
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#FFD700]/30 bg-[#FFD700]/5 px-4 py-2 text-[11px] font-black uppercase tracking-[0.2em] text-[#FFD700] print:border-slate-400 print:text-slate-700">
                <BadgeCheck size={15} aria-hidden="true" />
                Certified Statement
              </div>
              <h1
                className="text-3xl font-black leading-tight tracking-tight text-white sm:text-4xl md:text-5xl print:text-slate-950"
                style={{ fontFamily: "'Cinzel', serif" }}
              >
                Two-Year Voluntary Salary Waiver
                <span className="mt-2 block text-xl text-zinc-400 sm:text-2xl md:text-3xl print:text-slate-600">
                  &amp; Customer-First Commitment
                </span>
              </h1>
            </div>
          </header>

          <div className="px-6 py-8 sm:px-10 md:px-14 md:py-12">
            <dl className="grid gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10 sm:grid-cols-2 print:border-slate-300 print:bg-slate-300">
              {CEO_COMMITMENT_DETAILS.map(([label, value], index) => (
                <div key={label} className="bg-[#0d0d10] p-5 print:bg-white">
                  <dt className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.18em] text-zinc-500 print:text-slate-500">
                    {index === 1 ? <MapPin size={13} aria-hidden="true" /> : <CalendarDays size={13} aria-hidden="true" />}
                    {label}
                  </dt>
                  <dd className="mt-2 font-semibold text-zinc-100 print:text-slate-900">{value}</dd>
                </div>
              ))}
            </dl>

            <section aria-labelledby="official-statement" className="mt-12">
              <p className="text-xs font-black uppercase tracking-[0.25em] text-[#00E5FF] print:text-slate-600">
                Official Statement
              </p>
              <h2 id="official-statement" className="sr-only">
                Official statement
              </h2>
              <div className="mt-5 space-y-5 text-base leading-8 text-zinc-300 md:text-lg print:text-slate-800">
                {CEO_COMMITMENT_INTRO.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            </section>

            <div className="mt-12 space-y-12">
              {CEO_COMMITMENT_SECTIONS.map((section, index) => (
                <section key={section.title} aria-labelledby={`commitment-section-${index + 1}`}>
                  <div className="flex items-start gap-4">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#FFD700]/30 bg-[#FFD700]/5 font-mono text-sm font-black text-[#FFD700] print:border-slate-400 print:text-slate-700">
                      {index + 1}
                    </span>
                    <div>
                      <h2
                        id={`commitment-section-${index + 1}`}
                        className="text-xl font-black uppercase leading-snug tracking-wide text-white md:text-2xl print:text-slate-950"
                      >
                        {section.title}
                      </h2>
                      <div className="mt-4 space-y-5 text-base leading-8 text-zinc-300 md:text-lg print:text-slate-800">
                        {section.paragraphs.map((paragraph) => (
                          <p key={paragraph}>{paragraph}</p>
                        ))}
                      </div>
                    </div>
                  </div>
                </section>
              ))}
            </div>

            <section
              aria-labelledby="digital-signature"
              className="mt-14 rounded-2xl border border-[#00E5FF]/20 bg-[#00E5FF]/[0.035] p-6 sm:p-8 print:border-slate-300 print:bg-slate-50"
            >
              <h2 id="digital-signature" className="text-xs font-black uppercase tracking-[0.24em] text-[#00E5FF] print:text-slate-600">
                Digital Signature
              </h2>
              <p
                className="mt-7 text-3xl italic text-white print:text-slate-950"
                style={{ fontFamily: "'Cinzel', serif" }}
              >
                {CEO_COMMITMENT_SIGNATURE.notation}
              </p>
              <div className="mt-6 space-y-1 text-sm leading-relaxed text-zinc-300 print:text-slate-800">
                <p className="font-bold text-white print:text-slate-950">{CEO_COMMITMENT_SIGNATURE.name}</p>
                <p>{CEO_COMMITMENT_SIGNATURE.title}</p>
                <p>{CEO_COMMITMENT_SIGNATURE.company}</p>
                <p>{CEO_COMMITMENT_SIGNATURE.product}</p>
                <p>{CEO_COMMITMENT_SIGNATURE.location}</p>
                <p className="pt-3 font-semibold">Date: {CEO_COMMITMENT_SIGNATURE.date}</p>
              </div>
              <p className="mt-7 border-t border-white/10 pt-5 text-xs leading-6 text-zinc-500 print:border-slate-300 print:text-slate-600">
                {CEO_COMMITMENT_SIGNATURE.disclaimer}
              </p>
            </section>

            <div className="mt-12 print:hidden">
              <PublicSiteLinks />
            </div>
          </div>
        </article>
      </main>
    </div>
  );
}
