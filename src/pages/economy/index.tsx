// ========================================================
// CLEARPATH MASTER ECONOMY INTELLIGENCE ENGINE
// FILE:
// /src/pages/economy/index.tsx
// ========================================================

import React from "react";
import economics from "../../../data/economics/economics.json";
import MarketTicker from "../../components/MarketTicker";
import GlobalSearch from "../../components/GlobalSearch";

export default function EconomyUniverse() {
  return (
    <div className="economy-universe-page text-white font-sans">
      {/* BACKGROUND */}
      <div className="hero-background"></div>

      {/* HERO */}
      <section className="economy-hero glass">
        <div className="economy-hero-left">
          <div className="economy-badge">
            MACROECONOMIC INTELLIGENCE
          </div>
          <h1 className="text-white font-black leading-none mb-6">
            GLOBAL<br />
            ECONOMY
          </h1>
          <p className="text-zinc-300 text-lg leading-relaxed mb-8 max-w-xl">
            Understand the hidden economic systems controlling public life. Undergo standard learning on inflation curves, systemic sovereign debt, recessions, quantitative easing, bond yields, and capital flows.
          </p>
          <div className="economy-actions flex gap-4">
            <button className="glass economy-primary-btn px-6 py-3 rounded-xl font-bold hover:scale-105 transition-transform duration-300">
              Explore Economy
            </button>
            <button className="glass economy-secondary-btn px-6 py-3 rounded-xl font-bold bg-white/5 border border-white/10 hover:bg-white/10 transition-colors duration-300">
              Historical Crashes
            </button>
          </div>
        </div>

        {/* VISUAL */}
        <div className="economy-hero-right hidden lg:block">
          <div className="economy-orb"></div>
          <img
            src="/images/economy-core.png"
            className="economy-core-image"
            alt="Economy Core"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
          <div className="economy-wave"></div>
          <div className="macro-grid"></div>
        </div>
      </section>

      {/* MARKET STRIP */}
      <MarketTicker />

      {/* SEARCH */}
      <GlobalSearch />

      {/* EDUCATION */}
      <section className="economy-learning-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-16">
        <div className="glass economy-learning-card p-8 bg-neutral-900/25 border border-white/5 rounded-3xl">
          <h2 className="text-[#00FFFF] font-black text-xl mb-4">
            What Is Inflation?
          </h2>
          <p className="text-zinc-300 text-sm leading-relaxed">
            A macroeconomic condition marked by high systemic liquidity levels relative to industrial outputs, causing standard commodities and life parameters to rise.
          </p>
        </div>
        <div className="glass economy-learning-card p-8 bg-neutral-900/25 border border-white/5 rounded-3xl">
          <h2 className="text-[#00FFFF] font-black text-xl mb-4">
            What Is QE?
          </h2>
          <p className="text-zinc-300 text-sm leading-relaxed">
            Quantitative Easing (QE) consists of reserve banks buying up sovereign gilts or corporate notes directly to stimulate banking circles during low velocity trends.
          </p>
        </div>
        <div className="glass economy-learning-card p-8 bg-neutral-900/25 border border-white/5 rounded-3xl">
          <h2 className="text-[#00FFFF] font-black text-xl mb-4">
            Why Do Recessions Happen?
          </h2>
          <p className="text-zinc-300 text-sm leading-relaxed">
            Standard economic contraction indices occur due to debt bubble popping, high interest constraints, consumer over-leveraging, and declining industry metrics.
          </p>
        </div>
        <div className="glass economy-learning-card p-8 bg-neutral-900/25 border border-white/5 rounded-3xl">
          <h2 className="text-[#00FFFF] font-black text-xl mb-4">
            What Is GDP?
          </h2>
          <p className="text-zinc-300 text-sm leading-relaxed">
            Gross Domestic Product measures the absolute aggregate dollar valuation of final goods and industry services completed inside a sovereign domain's borders.
          </p>
        </div>
      </section>

      {/* ECONOMIC TOPICS */}
      <section className="economic-topics-section mt-20">
        <div className="section-header flex justify-between items-center mb-8 border-b border-white/5 pb-4">
          <h2 className="text-white font-black text-3xl">
            ECONOMIC SYSTEMS
          </h2>
          <span className="text-[#00FFFF] font-mono font-bold tracking-widest text-xs uppercase bg-[#00FFFF]/10 p-2 rounded-lg">
            GLOBAL MACRO STRUCTURES
          </span>
        </div>
        <div className="economy-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {economics.map((topic, i) => (
            <div
              key={i}
              className="glass economy-card p-6 bg-neutral-950/40 border border-white/5 hover:border-[#00FFFF]/45 rounded-2xl relative overflow-hidden transition-all duration-300"
            >
              <div className="economy-card-glow"></div>
              <h3 className="text-white font-bold text-lg mb-2">
                {topic.topic}
              </h3>
              <p className="text-zinc-400 text-xs leading-relaxed mb-4">
                {topic.description}
              </p>
              <div className="affected-assets border-t border-white/5 pt-4">
                <h4 className="text-[#00FFFF] font-black text-xs uppercase mb-2 tracking-wider">
                  Affected Assets
                </h4>
                <div className="asset-grid flex flex-wrap gap-2 text-xs">
                  {topic.affectedAssets?.map((asset, idx) => (
                    <div
                      key={idx}
                      className="asset-node px-2.5 py-1 bg-white/5 border border-white/10 rounded-lg text-zinc-300 font-mono text-[10px]"
                    >
                      {asset}
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex justify-end mt-6">
                <button className="bg-white/5 hover:bg-[#00FFFF]/15 border border-white/10 hover:border-[#00FFFF]/40 px-3.5 py-1.5 rounded-xl text-xs text-white uppercase font-bold tracking-normal transition-all duration-300">
                  Open Intelligence →
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* HISTORICAL EVENTS */}
      <section className="economic-history-section grid grid-cols-1 lg:grid-cols-3 gap-6 mt-16 text-left">
        <div className="glass history-panel p-8 bg-neutral-900/25 border border-white/5 rounded-3xl">
          <h2 className="text-[#00FFFF] font-black text-xl mb-4">
            THE GREAT DEPRESSION
          </h2>
          <p className="text-zinc-300 text-sm leading-relaxed">
            The 1929 stock market crash exposed vulnerabilities associated with leveraged bank operations, lack of reserve backstops, and severe gold-standard dynamic locks.
          </p>
        </div>
        <div className="glass history-panel p-8 bg-neutral-900/25 border border-white/5 rounded-3xl">
          <h2 className="text-[#00FFFF] font-black text-xl mb-4">
            THE 2008 FINANCIAL CRISIS
          </h2>
          <p className="text-zinc-300 text-sm leading-relaxed">
            Complex CDO structures combined with credit-default leverage created catastrophic contagion inside prime money markets, initiating trillions of dollars in relief bailouts.
          </p>
        </div>
        <div className="glass history-panel p-8 bg-neutral-900/25 border border-white/5 rounded-3xl">
          <h2 className="text-[#00FFFF] font-black text-xl mb-4">
            COVID MONETARY EXPANSION
          </h2>
          <p className="text-zinc-300 text-sm leading-relaxed">
            Simultaneous global quarantine closures was met with historical supply expansion programs and M2 liquidity boosts, driving a multi-year inflation peak.
          </p>
        </div>
      </section>

      {/* WHY IT MOVED */}
      <section className="macro-why-moved mt-16 mb-10">
        <div className="glass macro-why-card p-8 bg-neutral-900/20 border border-white/5 rounded-3xl">
          <h2 className="text-white font-black text-3xl mb-6">
            Why Did The Dollar Rise Today?
          </h2>
          <div className="macro-reason-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="macro-reason-node p-4 bg-white/5 border border-white/10 rounded-xl font-bold flex items-center justify-center text-center">
              Treasury Yields Increased
            </div>
            <div className="macro-reason-node p-4 bg-white/5 border border-white/10 rounded-xl font-bold flex items-center justify-center text-center">
              Hawkish FOMC Statements
            </div>
            <div className="macro-reason-node p-4 bg-white/5 border border-white/10 rounded-xl font-bold flex items-center justify-center text-center">
              High Risk Aversion Trends
            </div>
            <div className="macro-reason-node p-4 bg-white/5 border border-white/10 rounded-xl font-bold flex items-center justify-center text-center">
              Dynamic Safe-Haven Inflows
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
