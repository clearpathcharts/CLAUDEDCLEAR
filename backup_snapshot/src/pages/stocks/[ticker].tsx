// /src/pages/stocks/[ticker].tsx
import React from "react";
import stocks from "../../../data/stocks/stocks.json";

interface StockPageProps {
  stock?: {
    ticker: string;
    company: string;
    description: string;
    sector: string;
    industry: string;
    marketCap: string;
    whatMoves?: string[];
  };
}

export async function getStaticPaths() {
  const paths = stocks.map((stock) => ({
    params: {
      ticker: stock.ticker.toLowerCase(),
    },
  }));

  return {
    paths,
    fallback: false,
  };
}

export async function getStaticProps({ params }: { params: { ticker: string } }) {
  const stock = stocks.find(
    (s) => s.ticker.toLowerCase() === params.ticker.toLowerCase()
  );

  return {
    props: {
      stock,
    },
  };
}

export default function StockPage({ stock }: StockPageProps) {
  // Graceful client-side router resolution if needed
  const resolvedStock = stock || stocks[0];

  if (!resolvedStock) {
    return (
      <div className="stock-page min-h-screen bg-[#03010b] flex items-center justify-center p-6 text-zinc-500 font-mono">
        NO RECOGNIZED STOCK SPECIFICATION DETECTED.
      </div>
    );
  }

  const movesList = resolvedStock.whatMoves || [
    "Interest Rates and Treasury Yield adjustments",
    "Consumer Demand indices and discretionary budgets",
    "Supply chain hardware delays and microchip pricing",
    "Macroeconomic liquidity indexes and sector rotating"
  ];

  return (
    <div className="stock-page min-h-screen p-6 md:p-10 bg-[#03010b] text-white">
      <div className="max-w-4xl mx-auto flex flex-col gap-8 animate-fadeIn">
        
        {/* HERO GLASS */}
        <div className="hero glass p-8 relative overflow-hidden flex flex-col gap-4">
          <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
            <span className="font-mono text-9xl font-black text-[#00D9FF] select-none">
              {resolvedStock.ticker}
            </span>
          </div>

          <span className="font-mono text-[9px] uppercase tracking-[0.25em] text-[#00D9FF] font-black">
            CLEARPATH TICKER ENGINE // SEC PORTAL
          </span>

          <div className="flex flex-col sm:flex-row sm:items-baseline gap-2 mt-2">
            <h1 className="text-white font-black text-3xl uppercase tracking-tight">
              {resolvedStock.company}
            </h1>
            <span className="px-3 py-1 bg-[#00D9FF]/20 text-[#00D9FF] border border-[#00D9FF]/30 font-mono font-black text-xs rounded-lg select-none">
              {resolvedStock.ticker}
            </span>
          </div>

          <p className="text-zinc-350 text-xs leading-relaxed max-w-2xl select-text">
            {resolvedStock.description}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4 pt-5 border-t border-white/5 font-mono text-[10.5px]">
            <div className="p-3 bg-white/[0.01] border border-white/5 rounded-xl">
              <span className="text-zinc-550 block uppercase text-[8px]">Sector Class</span>
              <span className="text-white font-black uppercase mt-1 block">{resolvedStock.sector || "Equities"}</span>
            </div>
            <div className="p-3 bg-white/[0.01] border border-white/5 rounded-xl">
              <span className="text-zinc-550 block uppercase text-[8px]">Industry segment</span>
              <span className="text-white font-bold uppercase mt-1 block truncate">{resolvedStock.industry || "General"}</span>
            </div>
            <div className="p-3 bg-white/[0.01] border border-white/5 rounded-xl border-[#00D9FF]/10 shadow-[0_0_10px_rgba(0,217,255,0.03)]">
              <span className="text-zinc-550 block uppercase text-[8px]">Market Cap weight</span>
              <span className="text-[#00D9FF] font-black mt-1 block">{resolvedStock.marketCap || "N/A"}</span>
            </div>
          </div>
        </div>

        {/* EDUCATION SECTION */}
        <div className="education-section glass p-8">
          <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#FF007F] font-black block mb-2">
            MACRO TRANSMISSION INDICATORS
          </span>
          <h2 className="text-white font-black text-lg uppercase tracking-tight mb-4 flex items-center gap-2">
            What Moves This Stock?
          </h2>

          <ul className="list-disc pl-5 font-mono text-xs text-zinc-350 flex flex-col gap-3">
            {movesList.map((item, i) => (
              <li key={i} className="hover:text-white transition-all select-text">
                {item}
              </li>
            ))}
          </ul>
        </div>

      </div>
    </div>
  );
}
