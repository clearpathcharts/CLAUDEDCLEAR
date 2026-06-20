// ========================================================
// CLEARPATH MASTER FOREX INTELLIGENCE ENGINE
// FILE:
// /src/pages/forex/index.tsx
// ========================================================

import React from "react";
import forex from "../../../data/forex/pairs.json";
import MarketTicker from "../../components/MarketTicker";
import GlobalSearch from "../../components/GlobalSearch";

export default function ForexUniverse() {
  return (
    <div className="forex-universe-page text-white font-sans">
      {/* BACKGROUND */}
      <div className="hero-background"></div>

      {/* HERO */}
      <section className="forex-hero glass">
        <div className="forex-hero-left">
          <div className="forex-badge">
            GLOBAL CURRENCY SYSTEMS
          </div>
          <h1 className="text-white font-black leading-none mb-6">
            FOREX<br />
            INTELLIGENCE
          </h1>
          <p className="text-zinc-300 text-lg leading-relaxed mb-8 max-w-xl">
            Learn how the world’s currencies move. Understand inflation, central bank decisions,
            sovereign interest rates, debt dynamics, geopolitics, global reserve currencies, and macro capital flows.
          </p>
          <div className="forex-hero-actions flex gap-4">
            <button className="glass forex-primary-btn px-6 py-3 rounded-xl font-bold hover:scale-105 transition-transform duration-300">
              Explore Forex
            </button>
            <button className="glass forex-secondary-btn px-6 py-3 rounded-xl font-bold bg-white/5 border border-white/10 hover:bg-white/10 transition-colors duration-300">
              DXY Observatory
            </button>
          </div>
        </div>

        {/* HERO VISUAL */}
        <div className="forex-hero-right hidden lg:block">
          <div className="currency-orb"></div>
          <img
            src="/images/forex-globe.png"
            className="forex-globe"
            alt="Forex Globe"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
          <div className="forex-flow-line"></div>
          <div className="currency-grid"></div>
        </div>
      </section>

      {/* MARKET STRIP */}
      <MarketTicker />

      {/* SEARCH */}
      <GlobalSearch />

      {/* EDUCATION */}
      <section className="forex-learning-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-16">
        <div className="glass forex-learning-card p-8 bg-neutral-900/25 border border-white/5 rounded-3xl">
          <h2 className="text-[#00D9FF] font-black text-xl mb-4">
            Why Do Currencies Move?
          </h2>
          <p className="text-zinc-300 text-sm leading-relaxed">
            Currencies move dynamically due to inflation rate differentials, central bank interest policies, sovereign GDP prints, bond yields spread, and global trade flows.
          </p>
        </div>
        <div className="glass forex-learning-card p-8 bg-neutral-900/25 border border-white/5 rounded-3xl">
          <h2 className="text-[#00D9FF] font-black text-xl mb-4">
            What Is The DXY?
          </h2>
          <p className="text-zinc-300 text-sm leading-relaxed">
            The US Dollar Index measures the relative value of the United States Dollar against a basket of six major global currency counterparts, anchoring global trade.
          </p>
        </div>
        <div className="glass forex-learning-card p-8 bg-neutral-900/25 border border-white/5 rounded-3xl">
          <h2 className="text-[#00D9FF] font-black text-xl mb-4">
            What Is Inflation?
          </h2>
          <p className="text-zinc-300 text-sm leading-relaxed">
            Inflation acts as the dynamic expansion of money supply and credit relative to outputs, diminishing consumer purchasing power and altering FX parity over time.
          </p>
        </div>
        <div className="glass forex-learning-card p-8 bg-neutral-900/25 border border-white/5 rounded-3xl">
          <h2 className="text-[#00D9FF] font-black text-xl mb-4">
            Why Interest Rates Matter?
          </h2>
          <p className="text-zinc-300 text-sm leading-relaxed">
            Central reserves raise interest levels to curb credit expansion. High-yielding sovereign notes attract yield-carrying capital, supporting domestic currencies.
          </p>
        </div>
      </section>

      {/* MAJOR PAIRS */}
      <section className="major-pairs-section mt-20">
        <div className="section-header flex justify-between items-center mb-8 border-b border-white/5 pb-4">
          <h2 className="text-white font-black text-3xl">
            MAJOR CURRENCY PAIRS
          </h2>
          <span className="text-[#00D9FF] font-mono font-bold tracking-widest text-xs uppercase bg-[#00D9FF]/10 p-2 rounded-lg">
            GLOBAL FOREX SYSTEM
          </span>
        </div>
        <div className="forex-pairs-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {forex.map((pair, i) => (
            <div
              key={i}
              className="glass forex-pair-card p-6 bg-neutral-950/40 border border-white/5 hover:border-[#00D9FF]/45 rounded-2xl relative overflow-hidden transition-all duration-300"
            >
              <div className="pair-glow"></div>
              <div className="pair-top flex justify-between items-start mb-4">
                <span className="pair-symbol text-[#00D9FF] font-mono font-bold uppercase tracking-widest text-sm">
                  {pair.pair}
                </span>
                <span className="pair-type text-zinc-500 font-mono text-[10px] uppercase">
                  {pair.type}
                </span>
              </div>
              <h3 className="text-white font-bold text-lg mb-4">
                {pair.description}
              </h3>
              <div className="pair-education border-t border-white/5 pt-4">
                <h4 className="text-[#7A3BFF] font-black text-xs uppercase mb-2 tracking-wider">
                  Affected By:
                </h4>
                <ul className="flex flex-col gap-1.5 font-sans text-xs text-zinc-400">
                  {pair.affectedBy?.map((factor, idx) => (
                    <li key={idx} className="flex items-center gap-2">
                      <span className="w-1 h-1 bg-[#7A3BFF] rounded-full"></span>
                      {factor}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="flex justify-end mt-6">
                <button className="bg-white/5 hover:bg-[#00D9FF]/15 border border-white/10 hover:border-[#00D9FF]/40 px-3.5 py-1.5 rounded-xl text-xs text-white uppercase font-bold tracking-normal transition-all duration-300">
                  Open Intelligence →
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FOREX RELATIONSHIPS */}
      <section className="forex-relationships grid grid-cols-1 lg:grid-cols-3 gap-6 mt-16 mb-10">
        <div className="glass relationship-panel p-8 bg-neutral-900/25 border border-white/5 rounded-3xl">
          <h2 className="text-[#00D9FF] font-black text-xl mb-4">
            USD & GOLD RELATIONSHIP
          </h2>
          <p className="text-zinc-300 text-sm leading-relaxed">
            Gold acts as an alternative collateral carrying zero counterparty hazard. Consequently, gold exhibits strong inverse pricing shifts relative to periods of high USD yield trends.
          </p>
        </div>
        <div className="glass relationship-panel p-8 bg-neutral-900/25 border border-white/5 rounded-3xl">
          <h2 className="text-[#00D9FF] font-black text-xl mb-4">
            CENTRAL BANK SYSTEMS
          </h2>
          <p className="text-zinc-300 text-sm leading-relaxed">
            Monetary authorities shape currency supplies through Open Market operations, reserve ratios, discount window rates, and large sovereign-bond buyout program variables.
          </p>
        </div>
        <div className="glass relationship-panel p-8 bg-neutral-900/25 border border-white/5 rounded-3xl">
          <h2 className="text-[#00D9FF] font-black text-xl mb-4">
            FOREX & BOND YIELDS
          </h2>
          <p className="text-zinc-300 text-sm leading-relaxed">
            Yield curves represent sovereign credit parameters. Rising treasuries spread stimulates arbitrage, driving carry-capital into higher yielding sovereign swap pairs.
          </p>
        </div>
      </section>
    </div>
  );
}
