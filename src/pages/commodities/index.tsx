// ========================================================
// CLEARPATH MASTER COMMODITIES INTELLIGENCE ENGINE
// FILE:
// /src/pages/commodities/index.tsx
// ========================================================

import React from "react";
import commodities from "../../../data/commodities/commodities.json";
import MarketTicker from "../../components/MarketTicker";
import GlobalSearch from "../../components/GlobalSearch";

export default function CommoditiesUniverse() {
  return (
    <div className="commodities-universe-page text-white font-sans">
      {/* BACKGROUND */}
      <div className="hero-background"></div>

      {/* HERO */}
      <section className="commodities-hero glass">
        <div className="commodities-hero-left">
          <div className="commodities-badge">
            GLOBAL RESOURCE SYSTEMS
          </div>
          <h1 className="text-white font-black leading-none mb-6">
            COMMODITIES<br />
            INTELLIGENCE
          </h1>
          <p className="text-zinc-300 text-lg leading-relaxed mb-8 max-w-xl">
            Explore the raw materials powering civilization. Learn the core dynamics balancing crude oil, gold bullion, silver reserves, natural gas pressures, raw wheat yields, and global shipping lanes.
          </p>
          <div className="commodities-actions flex gap-4">
            <button className="glass commodities-primary-btn px-6 py-3 rounded-xl font-bold hover:scale-105 transition-transform duration-300">
              Explore Commodities
            </button>
            <button className="glass commodities-secondary-btn px-6 py-3 rounded-xl font-bold bg-white/5 border border-white/10 hover:bg-white/10 transition-colors duration-300">
              Global Supply Chains
            </button>
          </div>
        </div>

        {/* VISUAL */}
        <div className="commodities-hero-right hidden lg:block">
          <div className="commodity-orb"></div>
          <img
            src="/images/commodities-core.png"
            className="commodities-core-image"
            alt="Commodities Core"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
          <div className="resource-wave"></div>
          <div className="industrial-grid"></div>
        </div>
      </section>

      {/* MARKET STRIP */}
      <MarketTicker />

      {/* SEARCH */}
      <GlobalSearch />

      {/* EDUCATION */}
      <section className="commodities-learning-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-16">
        <div className="glass commodities-learning-card p-8 bg-neutral-900/25 border border-white/5 rounded-3xl">
          <h2 className="text-[#FFB347] font-black text-xl mb-4">
            Why Does Gold Matter?
          </h2>
          <p className="text-zinc-300 text-sm leading-relaxed">
            Gold acts as a tangible reserve asset that cannot be inflated by decree. It maintains historical purchasing power over millennia, outliving paper money systems.
          </p>
        </div>
        <div className="glass commodities-learning-card p-8 bg-neutral-900/25 border border-white/5 rounded-3xl">
          <h2 className="text-[#FFB347] font-black text-xl mb-4">
            What Moves Oil Prices?
          </h2>
          <p className="text-zinc-300 text-sm leading-relaxed">
            Crude oil prices react to OPEC+ quotas, geopolitical logistics stress, global refinery runs, and macroeconomic industrial energy consumption.
          </p>
        </div>
        <div className="glass commodities-learning-card p-8 bg-neutral-900/25 border border-white/5 rounded-3xl">
          <h2 className="text-[#FFB347] font-black text-xl mb-4">
            Why Do Commodities Affect Inflation?
          </h2>
          <p className="text-zinc-300 text-sm leading-relaxed">
            Raw materials are the foundation of product supply chains. Higher primary energy or grain costs multiply final retail prices across global markets.
          </p>
        </div>
        <div className="glass commodities-learning-card p-8 bg-neutral-900/25 border border-white/5 rounded-3xl">
          <h2 className="text-[#FFB347] font-black text-xl mb-4">
            What Are Supply Shocks?
          </h2>
          <p className="text-zinc-300 text-sm leading-relaxed">
            Sudden output disruptions (wars, embargoes, weather anomalies) that create acute collateral shortfalls, forcing aggressive market price restructuring.
          </p>
        </div>
      </section>

      {/* COMMODITIES DIRECTORY */}
      <section className="commodities-directory-section mt-20">
        <div className="section-header flex justify-between items-center mb-8 border-b border-white/5 pb-4">
          <h2 className="text-white font-black text-3xl">
            RESOURCE DIRECTORY
          </h2>
          <span className="text-[#FFB347] font-mono font-bold tracking-widest text-xs uppercase bg-[#FFB347]/10 p-2 rounded-lg">
            GLOBAL COMMODITY SYSTEMS
          </span>
        </div>
        <div className="commodities-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {commodities.map((item, i) => (
            <div
              key={i}
              className="glass commodity-card p-6 bg-neutral-950/40 border border-white/5 hover:border-[#FFB347]/45 rounded-2xl relative overflow-hidden transition-all duration-300"
            >
              <div className="commodity-card-glow"></div>
              <div className="commodity-top flex justify-between items-start mb-4">
                <span className="commodity-symbol text-[#FFB347] font-mono font-bold uppercase tracking-widest text-sm">
                  {item.symbol}
                </span>
                <span className="commodity-category text-zinc-500 font-mono text-[10px] uppercase">
                  {item.category}
                </span>
              </div>
              <h3 className="text-white font-bold text-lg mb-2">
                {item.name}
              </h3>
              <p className="text-zinc-400 text-xs leading-relaxed mb-4">
                {item.description}
              </p>
              <div className="commodity-education border-t border-white/5 pt-4">
                <h4 className="text-[#FF5E00] font-black text-xs uppercase mb-2 tracking-wider">
                  Affected By:
                </h4>
                <ul className="flex flex-col gap-1.5 font-sans text-xs text-zinc-400">
                  {item.affectedBy?.map((factor, idx) => (
                    <li key={idx} className="flex items-center gap-2">
                      <span className="w-1 h-1 bg-[#FF5E00] rounded-full"></span>
                      {factor}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="flex justify-end mt-6">
                <button className="bg-white/5 hover:bg-[#FFB347]/15 border border-white/10 hover:border-[#FFB347]/40 px-3.5 py-1.5 rounded-xl text-xs text-white uppercase font-bold tracking-normal transition-all duration-300">
                  Open Intelligence →
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* GLOBAL RELATIONSHIPS */}
      <section className="commodity-relationships grid grid-cols-1 lg:grid-cols-3 gap-6 mt-16 text-left">
        <div className="glass commodity-relation-panel p-8 bg-neutral-900/25 border border-white/5 rounded-3xl">
          <h2 className="text-[#FFB347] font-black text-xl mb-4">
            GOLD & INFLATION
          </h2>
          <p className="text-zinc-300 text-sm leading-relaxed">
            As systemic risk increases, gold gains prominence relative to interest yields. When the purchase limits of paper systems fall, real metal acts as capital security.
          </p>
        </div>
        <div className="glass commodity-relation-panel p-8 bg-neutral-900/25 border border-white/5 rounded-3xl">
          <h2 className="text-[#FFB347] font-black text-xl mb-4">
            OIL & GLOBAL ECONOMIES
          </h2>
          <p className="text-zinc-300 text-sm leading-relaxed">
            Crude reserves anchor shipping logistics, flight systems, chemical fertilizers, and basic heavy outputs, which connects oil price shifts directly to global commerce metrics.
          </p>
        </div>
        <div className="glass commodity-relation-panel p-8 bg-neutral-900/25 border border-white/5 rounded-3xl">
          <h2 className="text-[#FFB347] font-black text-xl mb-4">
            AGRICULTURE & WEATHER
          </h2>
          <p className="text-zinc-300 text-sm leading-relaxed">
            Grains, sugar, and livestock are bounded by climate, water rights, and soil. Heavy droughts or weather anomalies stimulate regional trade supply crises.
          </p>
        </div>
      </section>

      {/* WHY IT MOVED */}
      <section className="commodity-why-moved mt-16 mb-10">
        <div className="glass commodity-why-card p-8 bg-neutral-900/20 border border-white/5 rounded-3xl">
          <h2 className="text-white font-black text-3xl mb-6">
            Why Did Oil Rise Today?
          </h2>
          <div className="commodity-reason-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="commodity-reason-node p-4 bg-white/5 border border-white/10 rounded-xl font-bold flex items-center justify-center text-center">
              OPEC+ Production Cuts
            </div>
            <div className="commodity-reason-node p-4 bg-white/5 border border-white/10 rounded-xl font-bold flex items-center justify-center text-center">
              Geopolitical Tensions
            </div>
            <div className="commodity-reason-node p-4 bg-white/5 border border-white/10 rounded-xl font-bold flex items-center justify-center text-center">
              Supply Chain Congestion
            </div>
            <div className="commodity-reason-node p-4 bg-white/5 border border-white/10 rounded-xl font-bold flex items-center justify-center text-center">
              Global Stockpile Draws
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
