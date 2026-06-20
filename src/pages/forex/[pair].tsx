// /src/pages/forex/[pair].tsx
import React, { useMemo } from "react";
import { getProceduralForex } from "../../utils/searchEngine";

interface ForexPageProps {
  pairData?: {
    pair: string;
    type: string;
    description: string;
    countries?: string[];
    affectedBy?: string[];
  };
}

export default function ForexPage({ pairData }: ForexPageProps) {
  // Graceful client-side routing fallback
  const pairParam = useMemo(() => {
    return window.location.pathname.split("/").pop()?.toUpperCase() || "EURUSD";
  }, []);

  const resolvedPair = useMemo(() => {
    if (pairData) return pairData;
    const allForex = getProceduralForex();
    const cleanParam = pairParam.replace("-", "").replace("/", "").toUpperCase();
    return allForex.find(
      f => f.pair.replace("/", "").toUpperCase() === cleanParam
    ) || allForex[0];
  }, [pairData, pairParam]);

  const affectedList = useMemo(() => {
    return resolvedPair?.affectedBy || [
      "Reserve bank interest rate differentials and sovereign yield curves",
      "Sovereign inflation spreads (CPI mismatch rates)",
      "Trade surplus ratios and balance of payment accounts",
      "Geopolitical safe-haven flows during regional escalation"
    ];
  }, [resolvedPair]);

  if (!resolvedPair) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#030408] text-white">
        <span className="font-mono text-xs text-zinc-550 uppercase">Loading FX sovereign node...</span>
      </div>
    );
  }

  const educationalCtx = `A foreign exchange (forex) pair expresses the relative purchasing power index between two distinct currency-issuing sovereign domains. The pricing discovery is determined by capital flows, trade balances, and central bank interest rate spreads. Higher interest rates in one sovereign region attract yield-seeking international capital, leading to upward appreciation of the denominating unit, weighted by terminal inflation expectations.`;

  return (
    <div className="forex-page min-h-screen p-6 md:p-10 bg-[#03010b] text-white">
      <div className="max-w-4xl mx-auto flex flex-col gap-8 animate-fadeIn">
        
        {/* HERO GLASS */}
        <div className="hero glass p-8 relative overflow-hidden flex flex-col gap-4 bg-black/45 border border-white/5 rounded-3xl">
          <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none select-none">
            <span className="font-mono text-9xl font-black text-emerald-400">
              {resolvedPair.pair}
            </span>
          </div>

          <span className="font-mono text-[9px] uppercase tracking-[0.25em] text-emerald-400 font-black">
            PERMANENT SCIENTIFIC PORTAL // FX SOVEREIGN CURRENCY MATRIX
          </span>

          <div className="flex flex-col sm:flex-row sm:items-baseline gap-2 mt-2">
            <h1 className="text-white font-black text-3xl uppercase tracking-tight">
              {resolvedPair.pair} Sovereign Node
            </h1>
            <span className="px-3 py-1 bg-emerald-400/20 text-emerald-400 border border-emerald-400/30 font-mono font-black text-xs rounded-lg select-none">
              {resolvedPair.type}
            </span>
          </div>

          <p className="text-zinc-400 text-xs leading-relaxed max-w-2xl select-text font-sans">
            <strong className="text-zinc-200">Sovereign Spec:</strong> {resolvedPair.description}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 pt-5 border-t border-white/5 font-mono text-[10.5px]">
            <div className="p-3 bg-white/[0.01] border border-white/5 rounded-xl">
              <span className="text-zinc-500 block uppercase text-[8px]">Associated Sovereign Regions</span>
              <span className="text-white font-black uppercase mt-1 block">
                {resolvedPair.countries?.join(" • ") || "Global Markets"}
              </span>
            </div>
            <div className="p-3 bg-white/[0.01] border border-white/5 rounded-xl border-emerald-400/10 shadow-[0_0_10px_rgba(52,211,153,0.03)]">
              <span className="text-zinc-500 block uppercase text-[8px]">Index Classification</span>
              <span className="text-emerald-400 font-bold uppercase mt-1 block">
                Sovereign Debt Liquidity Matrix
              </span>
            </div>
          </div>
        </div>

        {/* EDUCATIONAL ACADEMIC INSIGHT */}
        <div className="glass p-6 flex flex-col gap-2 bg-black/45 border border-white/5 rounded-2xl">
          <span className="font-mono text-[8.5px] uppercase tracking-[0.15em] text-emerald-400 font-black">
            ACADEMIC CONTEXT
          </span>
          <h3 className="text-white font-black text-xs uppercase">Sovereign Currency Dynamics & Spreads</h3>
          <p className="text-zinc-400 text-xs leading-relaxed font-sans select-text">{educationalCtx}</p>
        </div>

        {/* DRIVERS SECTION */}
        <div className="drivers-section glass p-8 bg-black/45 border border-white/5 rounded-3xl">
          <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#00D9FF] font-black block mb-2">
            MACRO TRANSMISSION CHANNELS
          </span>
          <h2 className="text-white font-black text-lg uppercase tracking-tight mb-4 flex items-center gap-2">
            Primary Influence Drivers
          </h2>

          <ul className="list-disc pl-5 font-mono text-xs text-zinc-400 flex flex-col gap-3 leading-relaxed select-text">
            {affectedList.map((item, i) => (
              <li key={i} className="hover:text-white transition-all">
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="flex justify-start">
          <button 
            onClick={() => window.history.pushState({}, '', '/financial-encyclopedia')}
            className="px-6 py-3 bg-white/5 border border-white/10 hover:border-emerald-500/50 hover:bg-emerald-500/10 font-bold font-mono text-xs uppercase tracking-wider text-white rounded-xl cursor-pointer transition-all active:scale-[0.98]"
          >
            ← Back to Financial Encyclopedia
          </button>
        </div>

      </div>
    </div>
  );
}
