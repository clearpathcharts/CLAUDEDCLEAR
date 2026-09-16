// /src/components/WhyItMoved.tsx
import React from 'react';

interface WhyItMovedProps {
  asset: string;
  reasons: string[];
  related: string[];
}

export default function WhyItMoved({
  asset,
  reasons,
  related,
}: WhyItMovedProps) {
  return (
    <div className="why-it-moved glass p-6 flex flex-col gap-5 animate-fadeIn">
      
      <div className="flex flex-col gap-1">
        <span className="font-mono text-[9px] uppercase tracking-[0.25em] text-[#FF007F] font-black leading-none mb-1">
          MARKET INSTABILITY VECTOR // LIVE REPORT
        </span>
        <h1 className="text-white font-black text-lg uppercase tracking-tight leading-tight">
          Why Did {asset} Move Today?
        </h1>
      </div>

      <div className="reasons bg-neutral-950/40 p-4 border border-white/5 rounded-xl flex flex-col gap-2.5">
        <h2 className="text-[#FF007F] font-mono text-[10px] font-black uppercase tracking-wider block border-b border-white/5 pb-1 select-none">
          Primary Drivers
        </h2>

        <ul className="list-disc pl-5 font-mono text-zinc-350 text-[11px] flex flex-col gap-1.5">
          {reasons.map((reason, i) => (
            <li key={i} className="hover:text-white transition-all select-text">
              {reason}
            </li>
          ))}
        </ul>
      </div>

      <div className="related-markets flex flex-col gap-3">
        <h2 className="text-zinc-550 font-mono text-[9.5px] uppercase tracking-widest block select-none">
          Related Transmission Channels
        </h2>

        <div className="related-grid grid grid-cols-2 md:grid-cols-3 gap-3">
          {related.map((item, i) => (
            <div
              key={i}
              className="related-card p-3 bg-white/[0.01] hover:bg-white/[0.04] border border-white/5 hover:border-pink-500/20 text-center font-bold font-mono text-[10.5px] text-zinc-400 hover:text-white rounded-xl transition-all cursor-pointer select-none"
            >
              {item}
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
