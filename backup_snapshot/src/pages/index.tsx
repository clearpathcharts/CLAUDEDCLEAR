// /src/pages/index.tsx
import React, { useState } from "react";
import Sidebar from "../components/Sidebar";
import HeroModules from "../components/HeroModules";
import MarketTicker from "../components/MarketTicker";
import StatsBar from "../components/StatsBar";
import GlobalSearch from "../components/GlobalSearch";

export default function HomePage() {
  const [activeFile, setActiveFile] = useState("index.html");

  const handleNavigate = (file: string) => {
    setActiveFile(file);
    // Push history or state
    window.history.pushState(null, "", "/" + file);
  };

  return (
    <div className="clearpath-app flex min-h-screen text-white bg-[#03010b] font-sans relative overflow-hidden">
      
      {/* BACKGROUND */}
      <div className="hero-background fixed inset-0 z-0">
        <div className="hero-background-extra"></div>
      </div>

      {/* SIDEBAR */}
      <Sidebar activeFile={activeFile} onNavigate={handleNavigate} />

      {/* MAIN CONTENT */}
      <main className="main-content flex-1 p-8 md:p-10 relative z-10 overflow-y-auto max-h-screen">

        {/* TOP NAV */}
        <header className="topbar glass p-5 md:px-8 rounded-3xl flex justify-between items-center gap-6 mb-8 bg-black/45 border border-white/5">
          <div className="brand flex flex-col text-left select-none">
            <h1 className="text-[#00D9FF] font-black text-xl tracking-wider uppercase leading-none">
              CLEARPATH
            </h1>
            <span className="text-zinc-500 font-mono text-[9px] uppercase tracking-[0.25em] mt-1.5 font-bold">
              FINANCIAL ENCYCLOPEDIA
            </span>
          </div>

          <div className="top-actions flex items-center gap-3">
            <button 
              onClick={() => handleNavigate("markets.html")}
              className="glass top-btn px-4 py-2 text-xs font-mono font-bold tracking-wide uppercase text-zinc-350 hover:text-white rounded-xl transition-all cursor-pointer"
            >
              Markets
            </button>

            <button 
              onClick={() => handleNavigate("education.html")}
              className="glass top-btn px-4 py-2 text-xs font-mono font-bold tracking-wide uppercase text-zinc-350 hover:text-white rounded-xl transition-all cursor-pointer"
            >
              Education
            </button>

            <button 
              onClick={() => handleNavigate("ai-intelligence.html")}
              className="glass top-btn px-4 py-2 text-xs font-mono font-bold tracking-wide uppercase text-[#00D9FF] border border-[#00D9FF]/20 rounded-xl transition-all cursor-pointer hover:bg-[#00D9FF]/5"
            >
              AI Intelligence
            </button>
          </div>
        </header>

        {/* HERO SECTION */}
        <section className="hero-section glass p-8 md:p-12 rounded-[36px] flex flex-col lg:flex-row items-center justify-between gap-10 bg-neutral-950/45 border border-white/5 relative overflow-hidden mb-8">
          <div className="hero-left max-w-xl text-left flex flex-col gap-5 relative z-10 select-none">
            <div className="hero-badge inline-flex border border-[#00D9FF]/30 bg-[#00D9FF]/5 text-[#00D9FF] text-[9px] tracking-[0.2em] font-mono font-black uppercase px-4 py-1.5 rounded-full w-max">
              GLOBAL MARKET OBSERVATORY
            </div>

            <h1 className="hero-title text-white font-black text-4xl sm:text-5xl lg:text-6xl tracking-tight leading-none uppercase filter drop-shadow-[0_0_20px_rgba(255,0,200,0.3)]">
              THE FINANCIAL<br />ENCYCLOPEDIA
            </h1>

            <p className="hero-description text-zinc-350 text-xs sm:text-sm leading-relaxed">
              Every Market. Every Economic Relationship. Every Financial System. Learn Stocks, Forex, Crypto, 
              Commodities, Economics, AI Markets, and Global Capital Flows.
            </p>

            <div className="hero-buttons flex gap-4 mt-2">
              <button 
                onClick={() => handleNavigate("markets.html")}
                className="hero-btn primary bg-gradient-to-r from-[#FF00C8] to-[#00D9FF] hover:opacity-90 text-black font-mono font-black text-xs uppercase px-6 py-3.5 rounded-xl transition-all shadow-[0_0_15px_rgba(0,217,255,0.25)] scroll-smooth cursor-pointer"
              >
                Explore Markets
              </button>

              <button 
                onClick={() => handleNavigate("global-crisis-archive.html")}
                className="glass hero-btn border border-white/10 hover:border-white/20 text-white font-mono font-bold text-xs uppercase px-6 py-3.5 rounded-xl transition-all cursor-pointer"
              >
                Crisis Archive
              </button>
            </div>
          </div>

          {/* HERO VISUAL */}
          <div className="hero-right w-full lg:w-[420px] h-[320px] rounded-3xl overflow-hidden relative border border-white/5 bg-gradient-to-br from-white/[0.03] to-transparent flex items-center justify-center select-none shadow-inner">
            <div className="bull-orb absolute w-[300px] h-[300px] rounded-full bg-radial from-[#FF00C8]/10 to-transparent filter blur-3xl" />
            <div className="chart-glow absolute w-[120%] h-0.5 bg-gradient-to-r from-[#FF00C8] via-[#7B3BFF] to-[#00D9FF] rotate-[-5deg] shadow-[0_0_10px_#00D9FF]" />
            <div className="text-center flex flex-col gap-2 relative z-10">
              <span className="font-mono text-[9px] text-[#00D9FF] font-black tracking-widest">CLEAR_PATH ENGINE VERIFIED</span>
              <h2 className="text-zinc-600 font-sans font-black text-5xl tracking-widest">BULL</h2>
              <span className="text-zinc-550 text-[10px] font-mono font-medium">BULL-BEAR PROPULSION MATRIX LIVE</span>
            </div>
          </div>
        </section>

        {/* MARKET STRIP */}
        <div className="mb-8">
          <MarketTicker />
        </div>

        {/* STATS */}
        <div className="mb-8">
          <StatsBar />
        </div>

        {/* SEARCH */}
        <div className="mb-8">
          <GlobalSearch />
        </div>

        {/* MODULES */}
        <div className="mb-12">
          <HeroModules onModuleClick={handleNavigate} />
        </div>

        {/* FEATURED LEARNING */}
        <section className="featured-learning grid grid-cols-1 md:grid-cols-3 gap-6 mt-12 select-none">
          <div 
            onClick={() => handleNavigate("education.html")}
            className="glass featured-card p-6 rounded-2xl flex flex-col justify-between min-h-[200px] border border-white/5 bg-neutral-950/20 hover:border-[#00D9FF]/20 transition-all cursor-pointer"
          >
            <div>
              <span className="font-mono text-[8px] text-[#00D9FF]">ANALYSIS // SECTOR</span>
              <h2 className="text-white font-black text-sm uppercase mt-2">
                Why Did Gold Rise Today?
              </h2>
              <p className="text-zinc-400 text-xs mt-3 leading-relaxed">
                Gold increased because inflation fears increased and Treasury yields weakened, reinforcing its role as a premier hedge.
              </p>
            </div>
            <span className="font-mono text-[8.5px] text-zinc-550 mt-4 block">SECURE CLASSIFIED READ ➔</span>
          </div>

          <div 
            onClick={() => handleNavigate("economy.html")}
            className="glass featured-card p-6 rounded-2xl flex flex-col justify-between min-h-[200px] border border-white/5 bg-neutral-950/20 hover:border-pink-500/20 transition-all cursor-pointer"
          >
            <div>
              <span className="font-mono text-[8px] text-[#FF007F]">ANALYSIS // MACRO</span>
              <h2 className="text-white font-black text-sm uppercase mt-2">
                What Is Inflation?
              </h2>
              <p className="text-zinc-400 text-xs mt-3 leading-relaxed">
                Inflation measures how fast prices rise over time, eroding sovereign currency thresholds and impacting global trade.
              </p>
            </div>
            <span className="font-mono text-[8.5px] text-zinc-550 mt-4 block">SECURE CLASSIFIED READ ➔</span>
          </div>

          <div 
            onClick={() => handleNavigate("markets.html")}
            className="glass featured-card p-6 rounded-2xl flex flex-col justify-between min-h-[200px] border border-white/5 bg-neutral-950/20 hover:border-amber-500/20 transition-all cursor-pointer"
          >
            <div>
              <span className="font-mono text-[8px] text-amber-500 font-bold">ANALYSIS // CO-TRANSMISSION</span>
              <h2 className="text-white font-black text-sm uppercase mt-2">
                What Moves Tesla Stock?
              </h2>
              <p className="text-zinc-400 text-xs mt-3 leading-relaxed">
                Tesla fluctuates on battery chemical overheads, quarterly logistics forecasts, and autonomous driving computing updates.
              </p>
            </div>
            <span className="font-mono text-[8.5px] text-zinc-550 mt-4 block">SECURE CLASSIFIED READ ➔</span>
          </div>
        </section>

      </main>

    </div>
  );
}
