// /src/pages/stocks/[symbol].tsx
import React, { useMemo } from "react";
import { getProceduralStocks } from "../../utils/searchEngine";

interface StockPageProps {
  stock?: {
    ticker: string;
    company: string;
    description: string;
    sector: string;
    industry: string;
    exchange: string;
    marketCap: string;
    founded: number;
    headquarters: string;
    tags?: string[];
    relatedMarkets?: string[];
    whatMoves?: string[];
  };
}

export default function StockPage({ stock }: StockPageProps) {
  // Graceful client-side routing fallback
  const symbol = useMemo(() => {
    return window.location.pathname.split("/").pop()?.toUpperCase() || "AAPL";
  }, []);

  const resolvedStock = useMemo(() => {
    if (stock) return stock;
    const allStocks = getProceduralStocks();
    return allStocks.find(s => s.ticker === symbol) || allStocks[0];
  }, [stock, symbol]);

  const movesList = useMemo(() => {
    return resolvedStock?.whatMoves || [
      "Interest Rates and sovereign currency fluctuations",
      "Consumer price index (CPI) and discretionary wallets",
      "Supply chain hardware bottlenecks and microchip pricing",
      "Quantitative easing and central bank liquidity pools"
    ];
  }, [resolvedStock]);

  const competitors = useMemo(() => {
    if (!resolvedStock) return [];
    const allStocks = getProceduralStocks();
    // find other stocks in the same industry
    const list = allStocks
      .filter(s => s.industry === resolvedStock.industry && s.ticker !== resolvedStock.ticker)
      .slice(0, 3)
      .map(s => `${s.company} (${s.ticker})`);
    return list.length > 0 ? list : [`Apex ${resolvedStock.industry} Corp`, `NextGen ${resolvedStock.ticker} Labs`];
  }, [resolvedStock]);

  if (!resolvedStock) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#030408] text-white">
        <span className="font-mono text-xs text-zinc-550 uppercase">Loading instrument cache...</span>
      </div>
    );
  }

  // Determine procedurally an IPO year and info
  const ipoYear = resolvedStock.founded + Math.floor((2026 - resolvedStock.founded) * 0.15) + 2;
  const ipoHistory = `Listed on the ${resolvedStock.exchange} in ${ipoYear} with a tier-1 offering. The listing cemented the company's capital backing for its ${resolvedStock.industry} division, establishing baseline market float and liquid equity profiles.`;

  const companyHistory = `Founded in ${resolvedStock.founded} in ${resolvedStock.headquarters}, ${resolvedStock.company} originated as a bespoke private developer matching regional asset queries. Spurred by rapid capitalization in the late 1990s and early 2000s, it successfully structured its operations around the ${resolvedStock.sector} sector, emerging as a foundational component of global supply metrics.`;

  const educationalCtx = `A ${resolvedStock.sector} stock's valuation represents a fractional residual claim on corporate assets and cash flows. Secondary pricing moves dynamically on a discounted cash flow (DCF) framework, accounting for terminal inflation expectations, enterprise risk premiums, and sector rotating triggers. When general markets experience interest hikes, high-capex equity streams see discounts in their long-duration valuations.`;

  return (
    <div className="stock-page min-h-screen p-6 md:p-10 bg-[#03010b] text-white">
      <div className="max-w-4xl mx-auto flex flex-col gap-8 animate-fadeIn">
        
        {/* HERO GLASS */}
        <div className="hero glass p-8 relative overflow-hidden flex flex-col gap-4 bg-black/45 border border-white/5 rounded-3xl">
          <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none select-none">
            <span className="font-mono text-9xl font-black text-[#00D9FF]">
              {resolvedStock.ticker}
            </span>
          </div>

          <span className="font-mono text-[9px] uppercase tracking-[0.25em] text-[#00D9FF] font-black">
            PERMANENT SCIENTIFIC PORTAL // ASSET INDEX & COMPANY DIRECTORY
          </span>

          <div className="flex flex-col sm:flex-row sm:items-baseline gap-2 mt-2">
            <h1 className="text-white font-black text-3xl uppercase tracking-tight">
              {resolvedStock.company}
            </h1>
            <span className="px-3 py-1 bg-[#00D9FF]/20 text-[#00D9FF] border border-[#00D9FF]/30 font-mono font-black text-xs rounded-lg select-none">
              {resolvedStock.ticker}
            </span>
          </div>

          <p className="text-zinc-400 text-xs leading-relaxed max-w-2xl select-text font-sans">
            <strong className="text-zinc-200">What they do:</strong> {resolvedStock.description}
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4 pt-5 border-t border-white/5 font-mono text-[10.5px]">
            <div className="p-3 bg-white/[0.01] border border-white/5 rounded-xl">
              <span className="text-zinc-550 block uppercase text-[8px]">Sector Class</span>
              <span className="text-white font-black uppercase mt-1 block">{resolvedStock.sector || "Equities"}</span>
            </div>
            <div className="p-3 bg-white/[0.01] border border-white/5 rounded-xl">
              <span className="text-zinc-550 block uppercase text-[8px]">Industry segment</span>
              <span className="text-white font-bold uppercase mt-1 block truncate">{resolvedStock.industry || "General"}</span>
            </div>
            <div className="p-3 bg-white/[0.01] border border-white/5 rounded-xl">
              <span className="text-zinc-550 block uppercase text-[8px]">Listing Exchange</span>
              <span className="text-white font-bold uppercase mt-1 block truncate">{resolvedStock.exchange || "NASDAQ"}</span>
            </div>
            <div className="p-3 bg-white/[0.01] border border-white/5 rounded-xl border-[#00D9FF]/10 shadow-[0_0_10px_rgba(0,217,255,0.03)]">
              <span className="text-zinc-550 block uppercase text-[8px]">Market Cap weight</span>
              <span className="text-[#00D9FF] font-black mt-1 block">{resolvedStock.marketCap || "N/A"}</span>
            </div>
          </div>
        </div>

        {/* DETAILED ACADEMIC SEGMENTS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="glass p-6 flex flex-col gap-2 bg-black/45 border border-white/5 rounded-3xl">
            <span className="font-mono text-[8.5px] uppercase tracking-[0.15em] text-[#00D9FF] font-black">
              CORPORATE TIMELINE
            </span>
            <h3 className="text-white font-black text-xs uppercase">Company History</h3>
            <p className="text-zinc-400 text-xs leading-relaxed font-sans select-text">{companyHistory}</p>
          </div>

          <div className="glass p-6 flex flex-col gap-2 bg-black/45 border border-white/5 rounded-3xl">
            <span className="font-mono text-[8.5px] uppercase tracking-[0.15em] text-purple-400 font-black">
              IPO CAPITAL RECRUITMENT
            </span>
            <h3 className="text-white font-black text-xs uppercase">IPO History</h3>
            <p className="text-zinc-400 text-xs leading-relaxed font-sans select-text">{ipoHistory}</p>
          </div>

          <div className="glass p-6 flex flex-col gap-2 bg-black/45 border border-white/5 rounded-3xl">
            <span className="font-mono text-[8.5px] uppercase tracking-[0.15em] text-emerald-400 font-black">
              COMPETITIVE MATRIX
            </span>
            <h3 className="text-white font-black text-xs uppercase">Market Competitors</h3>
            <ul className="list-disc pl-5 font-mono text-[10.5px] text-zinc-350 flex flex-col gap-1.5 mt-1 select-text">
              {competitors.map((comp, idx) => (
                <li key={idx} className="hover:text-white transition-all">{comp}</li>
              ))}
            </ul>
          </div>

          <div className="glass p-6 flex flex-col gap-2 bg-black/45 border border-white/5 rounded-3xl">
            <span className="font-mono text-[8.5px] uppercase tracking-[0.15em] text-[#FF007F] font-black">
              CORRELATIONS
            </span>
            <h3 className="text-white font-black text-xs uppercase">Related Industries</h3>
            <div className="flex flex-wrap gap-1.5 mt-1 font-mono text-[9px]">
              <span className="px-2 py-1 bg-white/5 rounded text-zinc-300 uppercase">{resolvedStock.industry}</span>
              <span className="px-2 py-1 bg-white/5 rounded text-zinc-300 uppercase">{resolvedStock.sector} Logistics</span>
              <span className="px-2 py-1 bg-white/5 rounded text-zinc-300 uppercase">Global Venture Pipelines</span>
            </div>
          </div>

          <div className="glass p-6 md:col-span-2 flex flex-col gap-2 bg-black/45 border border-white/5 rounded-3xl">
            <span className="font-mono text-[8.5px] uppercase tracking-[0.15em] text-amber-400 font-black">
              ACADEMIC CONTEXT
            </span>
            <h3 className="text-white font-black text-xs uppercase">Educational Explanation & Mechanics</h3>
            <p className="text-zinc-400 text-xs leading-relaxed font-sans select-text">{educationalCtx}</p>
          </div>
        </div>

        {/* VALUATION DRIVERS */}
        <div className="glass p-8 bg-black/45 border border-white/5 rounded-3xl">
          <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#00D9FF] font-black block mb-2">
            VALUATION DRIVERS & MACRO TRANSMISSION
          </span>
          <h2 className="text-white font-black text-lg uppercase tracking-tight mb-4 flex items-center gap-2">
            What Moves This Stock?
          </h2>

          <ul className="list-disc pl-5 font-mono text-xs text-zinc-400 flex flex-col gap-3 leading-relaxed">
            {movesList.map((item, i) => (
              <li key={i} className="hover:text-white transition-all select-text">
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="flex justify-start">
          <button 
            onClick={() => window.history.pushState({}, '', '/financial-encyclopedia')}
            className="px-6 py-3 bg-white/5 border border-white/10 hover:border-indigo-500/50 hover:bg-indigo-500/10 font-bold font-mono text-xs uppercase tracking-wider text-white rounded-xl cursor-pointer transition-all active:scale-[0.98]"
          >
            ← Back to Financial Encyclopedia
          </button>
        </div>

      </div>
    </div>
  );
}
