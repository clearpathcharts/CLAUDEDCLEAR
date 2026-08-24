import React from 'react';

/** Shared Regulatory Compliance card — Profile desk and post-login popup. */
export function RegulatoryComplianceCard({
  onUpdate,
  footer,
  titleId,
}: {
  onUpdate: () => void;
  footer?: React.ReactNode;
  titleId?: string;
}) {
  return (
    <div className="text-left">
      <h2
        id={titleId}
        className="m-0 mb-4 text-[20px] font-bold uppercase md:text-[28px] w-fit bg-gradient-to-r from-[#ff2ea6] to-[#00e5ff] text-transparent bg-clip-text"
        style={{ fontFamily: "'Orbitron', 'Cinzel', sans-serif" }}
      >
        REGULATORY COMPLIANCE
      </h2>
      <div className="space-y-4">
        <p className="m-0 text-xs text-zinc-400 font-mono leading-relaxed uppercase">
          Financial Industry Regulatory Authority (FINRA), Securities and Exchange Commission (SEC),
          Commodity Futures Trading Commission (CFTC), and Federal Trade Commission (FTC) Frameworks.
        </p>
        <div className="p-4 bg-zinc-950/90 border border-emerald-500/20 rounded-2xl flex items-center gap-3">
          <div className="w-2 rounded-full h-8 bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)] shrink-0" />
          <div>
            <h3 className="m-0 text-xs font-mono font-black text-emerald-400 uppercase tracking-widest">
              ✓ SEC & CFTC SANDBOX STATUS: AGREEMENTS LOGGED
            </h3>
            <p className="m-0 text-[10px] text-zinc-500 font-semibold font-mono uppercase mt-0.5">
              Platform Consent Database Synchronized and Secure.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={onUpdate}
            className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-amber-600 to-orange-500 hover:from-amber-500 hover:to-orange-400 text-black font-mono text-xs font-black uppercase tracking-widest transition-all cursor-pointer shadow-[0_0_15px_rgba(245,158,11,0.2)] hover:shadow-[0_0_25px_rgba(245,158,11,0.4)]"
          >
            Update Compliance Status
          </button>
          {footer}
        </div>
      </div>
    </div>
  );
}
