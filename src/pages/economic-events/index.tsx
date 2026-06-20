// ========================================================
// CLEARPATH MASTER GLOBAL EVENTS ENGINE
// FILE:
// /src/pages/economic-events/index.tsx
// ========================================================

import React from "react";
import events from "../../../data/events/events.json";
import MarketTicker from "../../components/MarketTicker";
import GlobalSearch from "../../components/GlobalSearch";

export default function EconomicEventsUniverse() {
  return (
    <div className="events-universe-page text-white font-sans">
      {/* BACKGROUND */}
      <div className="hero-background"></div>

      {/* HERO */}
      <section className="events-hero glass">
        <div className="events-hero-left">
          <div className="events-badge">
            HISTORICAL ECONOMIC EVENTS
          </div>
          <h1 className="text-white font-black leading-none mb-6">
            MARKET<br />
            HISTORY
          </h1>
          <p className="text-zinc-300 text-lg leading-relaxed mb-8 max-w-xl">
            Explore the economic events that reshaped civilization. Learn how wars, banking collapses, inflation cycles, debt crises, recessions, speculative bubbles, and monetary policy transformed global markets.
          </p>
          <div className="events-actions flex gap-4">
            <button className="glass events-primary-btn px-6 py-3 rounded-xl font-bold hover:scale-105 transition-transform duration-300">
              Explore History
            </button>
            <button className="glass events-secondary-btn px-6 py-3 rounded-xl font-bold bg-white/5 border border-white/10 hover:bg-white/10 transition-colors duration-300">
              Crisis Timeline
            </button>
          </div>
        </div>

        {/* VISUAL */}
        <div className="events-hero-right hidden lg:block">
          <div className="events-orb"></div>
          <img
            src="/images/history-core.png"
            className="events-core-image"
            alt="History Core"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
          <div className="timeline-wave"></div>
          <div className="history-grid"></div>
          <div className="timeline-line"></div>
        </div>
      </section>

      {/* MARKET STRIP */}
      <MarketTicker />

      {/* SEARCH */}
      <GlobalSearch />

      {/* EDUCATION */}
      <section className="events-learning-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-16">
        <div className="glass events-learning-card p-8 bg-neutral-900/25 border border-white/5 rounded-3xl">
          <h2 className="text-[#FFD700] font-black text-xl mb-4">
            Why Do Financial Crises Happen?
          </h2>
          <p className="text-zinc-300 text-sm leading-relaxed">
            Crises often emerge from leverage, debt expansion, speculative bubbles, liquidity collapse, and systemic risk.
          </p>
        </div>
        <div className="glass events-learning-card p-8 bg-neutral-900/25 border border-white/5 rounded-3xl">
          <h2 className="text-[#FFD700] font-black text-xl mb-4">
            What Causes Inflation Surges?
          </h2>
          <p className="text-zinc-300 text-sm leading-relaxed">
            Inflation surges occur when money supply expands rapidly, supply chains weaken, or energy prices rise sharply.
          </p>
        </div>
        <div className="glass events-learning-card p-8 bg-neutral-900/25 border border-white/5 rounded-3xl">
          <h2 className="text-[#FFD700] font-black text-xl mb-4">
            Why Do Bubbles Form?
          </h2>
          <p className="text-zinc-300 text-sm leading-relaxed">
            Bubbles form during periods of excessive optimism, speculation, and easy liquidity.
          </p>
        </div>
        <div className="glass events-learning-card p-8 bg-neutral-900/25 border border-white/5 rounded-3xl">
          <h2 className="text-[#FFD700] font-black text-xl mb-4">
            Why Do Recessions Repeat?
          </h2>
          <p className="text-zinc-300 text-sm leading-relaxed">
            Economic cycles repeat because debt, leverage, and human behavior create recurring boom-and-bust systems.
          </p>
        </div>
      </section>

      {/* TIMELINE */}
      <section className="timeline-section mt-20">
        <div className="section-header flex justify-between items-center mb-8 border-b border-white/5 pb-4">
          <h2 className="text-white font-black text-3xl">
            GLOBAL ECONOMIC TIMELINE
          </h2>
          <span className="text-[#FFD700] font-mono font-bold tracking-widest text-xs uppercase bg-[#FFD700]/10 p-2 rounded-lg">
            CIVILIZATION EVENTS
          </span>
        </div>
        <div className="timeline-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event, i) => (
            <div
              key={i}
              className="glass timeline-card p-6 bg-neutral-950/40 border border-white/5 hover:border-[#FFD700]/45 rounded-2xl relative overflow-hidden transition-all duration-300"
            >
              <div className="timeline-glow"></div>
              <span className="timeline-year text-[#FFD700] font-mono font-bold tracking-widest text-sm block mb-2">
                {event.year}
              </span>
              <h3 className="text-white font-bold text-lg mb-2">
                {event.title}
              </h3>
              <p className="text-zinc-400 text-xs leading-relaxed mb-4">
                {event.description}
              </p>
              <div className="timeline-effects border-t border-white/5 pt-4">
                <h4 className="text-[#FFD700] font-black text-xs uppercase mb-2 tracking-wider">
                  Affected Markets
                </h4>
                <div className="effects-grid flex flex-wrap gap-2 text-xs">
                  {event.affectedMarkets?.map((market, idx) => (
                    <div
                      key={idx}
                      className="timeline-node px-2.5 py-1 bg-white/5 border border-white/10 rounded-lg text-zinc-300 font-mono text-[10px]"
                    >
                      {market}
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex justify-end mt-6">
                <button className="bg-white/5 hover:bg-[#FFD700]/15 border border-white/10 hover:border-[#FFD700]/40 px-3.5 py-1.5 rounded-xl text-xs text-white uppercase font-bold tracking-normal transition-all duration-300">
                  Open Historical Intelligence →
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* HISTORICAL HIGHLIGHTS */}
      <section className="history-highlights grid grid-cols-1 lg:grid-cols-3 gap-6 mt-16 text-left">
        <div className="glass history-highlight-card p-8 bg-neutral-900/25 border border-white/5 rounded-3xl">
          <h2 className="text-[#FFD700] font-black text-xl mb-4">
            THE 1929 CRASH
          </h2>
          <p className="text-zinc-300 text-sm leading-relaxed">
            Excessive leverage, speculation, and euphoric buying contributed to one of the largest market collapses in history.
          </p>
        </div>
        <div className="glass history-highlight-card p-8 bg-neutral-900/25 border border-white/5 rounded-3xl">
          <h2 className="text-[#FFD700] font-black text-xl mb-4">
            THE 1971 GOLD STANDARD SHIFT
          </h2>
          <p className="text-zinc-300 text-sm leading-relaxed">
            The United States ended dollar convertibility into gold, reshaping the global monetary system.
          </p>
        </div>
        <div className="glass history-highlight-card p-8 bg-neutral-900/25 border border-white/5 rounded-3xl">
          <h2 className="text-[#FFD700] font-black text-xl mb-4">
            THE 2008 FINANCIAL CRISIS
          </h2>
          <p className="text-zinc-300 text-sm leading-relaxed">
            Mortgage leverage, banking contagion, and systemic instability triggered a global collapse.
          </p>
        </div>
      </section>

      {/* WHY IT MOVED */}
      <section className="events-why-section mt-16 mb-10">
        <div className="glass events-why-card p-8 bg-neutral-900/20 border border-white/5 rounded-3xl">
          <h2 className="text-white font-black text-3xl mb-6">
            Why Did Markets Crash In 2008?
          </h2>
          <div className="events-reason-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="events-reason-node p-4 bg-white/5 border border-white/10 rounded-xl font-bold flex items-center justify-center text-center">
              Mortgage Leverage
            </div>
            <div className="events-reason-node p-4 bg-white/5 border border-white/10 rounded-xl font-bold flex items-center justify-center text-center">
              Banking Contagion
            </div>
            <div className="events-reason-node p-4 bg-white/5 border border-white/10 rounded-xl font-bold flex items-center justify-center text-center">
              Liquidity Collapse
            </div>
            <div className="events-reason-node p-4 bg-white/5 border border-white/10 rounded-xl font-bold flex items-center justify-center text-center">
              Credit System Failure
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
