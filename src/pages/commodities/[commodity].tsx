// /src/pages/commodities/[commodity].tsx
import React, { useMemo } from "react";
import { getProceduralCommodities } from "../../utils/searchEngine";

interface CommodityPageProps {
  commodityData?: {
    symbol: string;
    name: string;
    category: string;
    description: string;
    supplyChain?: string;
    industrialUses?: string;
    inflationImpact?: string;
    geopoliticalImpact?: string;
    historicalImportance?: string;
    affectedBy?: string[];
  };
}

export default function CommodityPage({ commodityData }: CommodityPageProps) {
  // Graceful client-side routing fallback
  const commodityParam = useMemo(() => {
    return window.location.pathname.split("/").pop()?.toUpperCase() || "XAUUSD";
  }, []);

  const resolvedCommodity = useMemo(() => {
    if (commodityData) return commodityData;
    const allCommodities = getProceduralCommodities();
    const cleanParam = commodityParam.replace("-", "").toUpperCase();
    return allCommodities.find(
      c => c.symbol.toUpperCase() === cleanParam || c.name.toLowerCase() === cleanParam.toLowerCase()
    ) || allCommodities[0];
  }, [commodityData, commodityParam]);

  const affectedList = useMemo(() => {
    return resolvedCommodity?.affectedBy || [
      "Sovereign inflation shifts and central bank printing rates",
      "Geopolitical escalation and resource trade tariffs",
      "Industrial production indices and manufacturing demands",
      "Severe climate patterns and agricultural or mining bottlenecks"
    ];
  }, [resolvedCommodity]);

  if (!resolvedCommodity) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#030408] text-white">
        <span className="font-mono text-xs text-zinc-555 uppercase">Loading resource node...</span>
      </div>
    );
  }

  const educationalCtx = `A commodity asset represents the base physical infrastructure of industrial civilization. Pricing discovery behaves on inelastic short-term supply and demand curves. Commodities serve as natural hedges during high inflation eras, as tangible assets reflect direct cost of production increases, unlike credit-denominated instruments.`;

  return (
    <div className="commodity-page min-h-screen p-6 md:p-10 bg-[#03010b] text-white">
      <div className="max-w-4xl mx-auto flex flex-col gap-8 animate-fadeIn">
        
        {/* HERO GLASS */}
        <div className="hero glass p-8 relative overflow-hidden flex flex-col gap-4 bg-black/45 border border-white/5 rounded-3xl">
          <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none select-none">
            <span className="font-mono text-9xl font-black text-[#00D9FF]">
              {resolvedCommodity.symbol}
            </span>
          </div>

          <span className="font-mono text-[9px] uppercase tracking-[0.25em] text-[#00D9FF] font-black">
            PERMANENT SCIENTIFIC PORTAL // MAIN COMMODITY PROFILE
          </span>

          <div className="flex flex-col sm:flex-row sm:items-baseline gap-2 mt-2">
            <h1 className="text-white font-black text-3xl uppercase tracking-tight">
              {resolvedCommodity.name} Asset
            </h1>
            <span className="px-3 py-1 bg-[#00D9FF]/20 text-[#00D9FF] border border-[#00D9FF]/30 font-mono font-black text-xs rounded-lg select-none">
              {resolvedCommodity.symbol}
            </span>
          </div>

          <p className="text-zinc-400 text-xs leading-relaxed max-w-2xl select-text font-sans">
            <strong className="text-zinc-200">Asset Specification:</strong> {resolvedCommodity.description}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 pt-5 border-t border-white/5 font-mono text-[10.5px]">
            <div className="p-3 bg-white/[0.01] border border-white/5 rounded-xl">
              <span className="text-zinc-500 block uppercase text-[8px]">Category Layer</span>
              <span className="text-white font-black uppercase mt-1 block">
                {resolvedCommodity.category}
              </span>
            </div>
            <div className="p-3 bg-white/[0.01] border border-white/5 rounded-xl border-[#00D9FF]/10 shadow-[0_0_10px_rgba(0,217,255,0.03)]">
              <span className="text-zinc-550 block uppercase text-[8px]">System Status</span>
              <span className="text-[#00D9FF] font-bold uppercase mt-1 block">
                Resource Backbone Profile
              </span>
            </div>
          </div>
        </div>

        {/* DETAILED ACADEMIC SEGMENTS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {resolvedCommodity.supplyChain && (
            <div className="glass p-6 flex flex-col gap-2 bg-black/45 border border-white/5 rounded-2xl">
              <span className="font-mono text-[8.5px] uppercase tracking-[0.15em] text-[#00D9FF] font-black">
                MAPPING & EXTRACTION
              </span>
              <h3 className="text-white font-black text-xs uppercase">Global Supply Chain</h3>
              <p className="text-zinc-400 text-xs leading-relaxed font-sans">{resolvedCommodity.supplyChain}</p>
            </div>
          )}

          {resolvedCommodity.industrialUses && (
            <div className="glass p-6 flex flex-col gap-2 bg-black/45 border border-white/5 rounded-2xl">
              <span className="font-mono text-[8.5px] uppercase tracking-[0.15em] text-purple-400 font-black">
                INDUSTRIAL CAPEX
              </span>
              <h3 className="text-white font-black text-xs uppercase">Real-World Utility</h3>
              <p className="text-zinc-400 text-xs leading-relaxed font-sans">{resolvedCommodity.industrialUses}</p>
            </div>
          )}

          {resolvedCommodity.inflationImpact && (
            <div className="glass p-6 flex flex-col gap-2 bg-black/45 border border-white/5 rounded-2xl">
              <span className="font-mono text-[8.5px] uppercase tracking-[0.15em] text-[#FF007F] font-black">
                MONETARY STRENGTH
              </span>
              <h3 className="text-white font-black text-xs uppercase">Inflation Pass-Through</h3>
              <p className="text-zinc-400 text-xs leading-relaxed font-sans">{resolvedCommodity.inflationImpact}</p>
            </div>
          )}

          {resolvedCommodity.geopoliticalImpact && (
            <div className="glass p-6 flex flex-col gap-2 bg-black/45 border border-white/5 rounded-2xl">
              <span className="font-mono text-[8.5px] uppercase tracking-[0.15em] text-emerald-400 font-black">
                GEOPOLITICAL LEVERAGE
              </span>
              <h3 className="text-white font-black text-xs uppercase">National Security & Quotas</h3>
              <p className="text-zinc-400 text-xs leading-relaxed font-sans">{resolvedCommodity.geopoliticalImpact}</p>
            </div>
          )}

          {resolvedCommodity.historicalImportance && (
            <div className="glass p-6 md:col-span-2 flex flex-col gap-2 bg-black/45 border border-white/5 rounded-2xl">
              <span className="font-mono text-[8.5px] uppercase tracking-[0.15em] text-amber-400 font-black">
                HISTORICAL TIMELINE
              </span>
              <h3 className="text-white font-black text-xs uppercase">Civic-Level Importance</h3>
              <p className="text-zinc-400 text-xs leading-relaxed font-sans">{resolvedCommodity.historicalImportance}</p>
            </div>
          )}
        </div>

        {/* EDUCATIONAL ACADEMIC INSIGHT */}
        <div className="glass p-6 flex flex-col gap-2 bg-black/45 border border-white/5 rounded-2xl">
          <span className="font-mono text-[8.5px] uppercase tracking-[0.15em] text-[#00D9FF] font-black">
            ACADEMIC CONTEXT
          </span>
          <h3 className="text-white font-black text-xs uppercase">Physical Asset Mechanics & Inflation</h3>
          <p className="text-zinc-400 text-xs leading-relaxed font-sans select-text">{educationalCtx}</p>
        </div>

        {/* DRIVERS */}
        <div className="glass p-8 bg-black/45 border border-white/5 rounded-3xl">
          <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#00D9FF] font-black block mb-2">
            VALUATION INFLUENCERS
          </span>
          <h2 className="text-white font-black text-lg uppercase tracking-tight mb-4 flex items-center gap-2">
            Macro Transmission Channels
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
            className="px-6 py-3 bg-white/5 border border-white/10 hover:border-[#00D9FF]/50 hover:bg-[#00D9FF]/10 font-bold font-mono text-xs uppercase tracking-wider text-white rounded-xl cursor-pointer transition-all active:scale-[0.98]"
          >
            ← Back to Financial Encyclopedia
          </button>
        </div>

      </div>
    </div>
  );
}
