// /src/pages/crypto/[coin].tsx
import React, { useMemo } from "react";
import { getProceduralCrypto } from "../../utils/searchEngine";

interface CryptoPageProps {
  coinData?: {
    symbol: string;
    name: string;
    category: string;
    description: string;
    founded?: number;
    creator?: string;
    whatMoves?: string[];
  };
}

export default function CryptoPage({ coinData }: CryptoPageProps) {
  // Graceful client-side routing fallback
  const coinParam = useMemo(() => {
    return window.location.pathname.split("/").pop()?.toUpperCase() || "BTC";
  }, []);

  const resolvedCoin = useMemo(() => {
    if (coinData) return coinData;
    const allCoins = getProceduralCrypto();
    return allCoins.find(
      c => c.symbol === coinParam || c.name.toLowerCase() === coinParam.toLowerCase()
    ) || allCoins[0];
  }, [coinData, coinParam]);

  const movesList = useMemo(() => {
    return resolvedCoin?.whatMoves || [
      "Reserve asset ETF inflows and global M2 capital indexes",
      "Sovereign monetary policies and interest rate differentials",
      "Network utility adoption, active wallet counts, gas consumption ratios",
      "Web3 venture pool liquid allocations and trade volume multipliers"
    ];
  }, [resolvedCoin]);

  if (!resolvedCoin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#030408] text-white">
        <span className="font-mono text-xs text-zinc-500 uppercase">Loading digital asset cache...</span>
      </div>
    );
  }

  // Procedural attributes
  const genesisYear = resolvedCoin.founded || 2011 + (coinParam.charCodeAt(0) % 15);
  const coreCreator = resolvedCoin.creator || `Anonymous network contributors (Sovereign Node Syndicate)`;
  const categoryStr = resolvedCoin.category || "Layer 1 Clearing Network";

  const educationalCtx = `A digital asset's price discovery operates as a secondary market pricing mechanism of global currency debasement and trust-minimized ledger utility. Unlike equities, crypto assets lack discounted cash flow metrics; their premium is driven of marginal fiat system liquidity indexes, network congestion fees, staking yields, and absolute blockspace supply constraints.`;

  return (
    <div className="crypto-page min-h-screen p-6 md:p-10 bg-[#03010b] text-white">
      <div className="max-w-4xl mx-auto flex flex-col gap-8 animate-fadeIn">
        
        {/* HERO GLASS */}
        <div className="hero glass p-8 relative overflow-hidden flex flex-col gap-4 bg-black/45 border border-white/5 rounded-3xl">
          <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none select-none">
            <span className="font-mono text-9xl font-black text-[#FF007F]">
              {resolvedCoin.symbol}
            </span>
          </div>

          <span className="font-mono text-[9px] uppercase tracking-[0.25em] text-[#FF007F] font-black">
            PERMANENT SCIENTIFIC PORTAL // DYNAMIC BLOCKCHAIN LEDGER INDEX
          </span>

          <div className="flex flex-col sm:flex-row sm:items-baseline gap-2 mt-2">
            <h1 className="text-[#ff5a1f] drop-shadow-[0_0_10px_rgba(255,90,31,0.6)] font-black text-3xl uppercase tracking-tight">
              {resolvedCoin.name} Analysis
            </h1>
            <span className="px-3 py-1 bg-[#FF007F]/20 text-[#FF007F] border border-[#FF007F]/30 font-mono font-black text-xs rounded-lg select-none">
              {resolvedCoin.symbol}
            </span>
          </div>

          <p className="text-zinc-400 text-xs leading-relaxed max-w-2xl select-text font-sans">
            <strong className="text-zinc-200">Protocol Spec:</strong> {resolvedCoin.description}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4 pt-5 border-t border-white/5 font-mono text-[10.5px]">
            <div className="p-3 bg-white/[0.01] border border-white/5 rounded-xl">
              <span className="text-zinc-500 block uppercase text-[8px]">Category Layer</span>
              <span className="text-white font-black uppercase mt-1 block">{categoryStr}</span>
            </div>
            <div className="p-3 bg-white/[0.01] border border-white/5 rounded-xl">
              <span className="text-zinc-550 block uppercase text-[8px]">Genesis Era Year</span>
              <span className="text-white font-bold uppercase mt-1 block">{genesisYear}</span>
            </div>
            <div className="p-3 bg-white/[0.01] border border-white/5 rounded-xl border-[#FF007F]/10 shadow-[0_0_10px_rgba(255,0,127,0.03)]">
              <span className="text-zinc-550 block uppercase text-[8px]">Network Architect</span>
              <span className="text-[#FF007F] font-black mt-1 block truncate">{coreCreator}</span>
            </div>
          </div>
        </div>

        {/* EDUCATIONAL ACADEMIC INSIGHT */}
        <div className="glass p-6 flex flex-col gap-2 bg-black/45 border border-white/5 rounded-2xl">
          <span className="font-mono text-[8.5px] uppercase tracking-[0.15em] text-[#FF007F] font-black">
            ACADEMIC CONTEXT
          </span>
          <h3 className="text-[#ff5a1f] font-black text-xs uppercase drop-shadow-[0_0_4px_rgba(255,90,31,0.4)]">Cryptographic Asset Mechanics</h3>
          <p className="text-zinc-400 text-xs leading-relaxed font-sans select-text">{educationalCtx}</p>
        </div>

        {/* DRIVERS SECTION */}
        <div className="drivers-section glass p-8 bg-black/45 border border-white/5 rounded-3xl">
          <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#00D9FF] font-black block mb-2">
            BLOCKCHAIN DRIVER MECHANISMS
          </span>
          <h2 className="text-[#ff5a1f] font-black text-lg uppercase tracking-tight mb-4 flex items-center gap-2 drop-shadow-[0_0_6px_rgba(255,90,31,0.4)]">
            What Drives Its Market Valuation?
          </h2>

          <ul className="list-disc pl-5 font-mono text-xs text-zinc-400 flex flex-col gap-3 leading-relaxed select-text">
            {movesList.map((item, i) => (
              <li key={i} className="hover:text-white transition-all">
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="flex justify-start">
          <button 
            onClick={() => window.history.pushState({}, '', '/financial-encyclopedia')}
            className="px-6 py-3 bg-white/5 border border-white/10 hover:border-[#FF007F]/50 hover:bg-[#FF007F]/10 font-bold font-mono text-xs uppercase tracking-wider text-white rounded-xl cursor-pointer transition-all active:scale-[0.98]"
          >
            ← Back to Financial Encyclopedia
          </button>
        </div>

      </div>
    </div>
  );
}
