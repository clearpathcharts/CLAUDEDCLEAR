import React from 'react';
import { ShieldAlert, CheckCircle2, XCircle } from 'lucide-react';
import { RIVER_PAGE_CONTENT } from '../river/marketing/riverPageContent';

/** Public honesty warning — visible to every trader on The River page. */
export default function RiverHonestLimitsBento() {
  const { honestLimits } = RIVER_PAGE_CONTENT;

  return (
    <section
      id="river-honest-limits-warning"
      aria-labelledby="river-honest-limits-title"
      className="mb-8 rounded-2xl border-2 border-amber-500/30 bg-gradient-to-br from-amber-950/40 via-[#0a0805] to-black/80 overflow-hidden shadow-[0_0_32px_rgba(245,158,11,0.08)]"
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">
        {/* Lead bento cell */}
        <div className="lg:col-span-4 p-6 md:p-7 border-b lg:border-b-0 lg:border-r border-amber-500/15 flex flex-col justify-center">
          <div className="flex items-center gap-2 mb-3">
            <ShieldAlert size={20} className="text-amber-400 shrink-0" aria-hidden />
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-400/90">Public warning</p>
          </div>
          <h2
            id="river-honest-limits-title"
            className="text-lg md:text-xl font-black uppercase tracking-tight text-white mb-1"
          >
            {honestLimits.title}
          </h2>
          <p className="text-sm font-bold text-amber-300/90 mb-3">{honestLimits.tagline}</p>
          <p className="text-xs text-white/55 leading-relaxed">{honestLimits.intro}</p>
        </div>

        {/* Won't auto-convert */}
        <div className="lg:col-span-4 p-6 md:p-7 border-b lg:border-b-0 lg:border-r border-amber-500/15 bg-black/30">
          <p className="text-[10px] font-black uppercase tracking-wider text-red-400/80 mb-3 flex items-center gap-1.5">
            <XCircle size={12} aria-hidden /> Will not 100% auto-convert
          </p>
          <ul className="space-y-2.5">
            {honestLimits.wontConvert.map((line) => (
              <li key={line} className="text-xs text-white/50 leading-snug pl-3 border-l-2 border-red-500/30">
                {line}
              </li>
            ))}
          </ul>
        </div>

        {/* ClearPath promise */}
        <div className="lg:col-span-4 p-6 md:p-7 bg-amber-500/5">
          <p className="text-[10px] font-black uppercase tracking-wider text-emerald-400/90 mb-3 flex items-center gap-1.5">
            <CheckCircle2 size={12} aria-hidden /> ClearPath wins by being honest
          </p>
          <ul className="space-y-2.5 mb-4">
            {honestLimits.wePromise.map((line) => (
              <li
                key={line}
                className="text-xs text-white/70 leading-snug font-mono bg-black/40 rounded-lg px-3 py-2 border border-emerald-500/15"
              >
                &ldquo;{line}&rdquo;
              </li>
            ))}
          </ul>
          <p className="text-[11px] text-white/45 leading-relaxed border-t border-white/5 pt-3">
            {honestLimits.closing}
          </p>
        </div>
      </div>
    </section>
  );
}
