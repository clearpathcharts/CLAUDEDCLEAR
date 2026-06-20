// ========================================================
// CLEARPATH MASTER MARKETS DIRECTORY
// FILE:
// /src/pages/markets/index.tsx
// ========================================================

import React from "react";
import MarketTicker from "../../components/MarketTicker";
import StatsBar from "../../components/StatsBar";

export default function MarketsDirectory({ onSelectFile }: { onSelectFile?: (file: string) => void }) {

  const marketWorlds = [
    {
      title: "Stocks",
      description:
        "Explore 10,000+ publicly traded companies, sectors, earnings systems, and valuation models.",
      route: "/stocks",
      fileNode: "encyclopedia/markets/stocks.html",
      glow: "pink"
    },
    {
      title: "Forex",
      description:
        "Learn currencies, inflation, central banks, interest rates, and global capital flows.",
      route: "/forex",
      fileNode: "encyclopedia/markets/forex.html",
      glow: "cyan"
    },
    {
      title: "Crypto",
      description:
        "Explore Bitcoin, Ethereum, blockchain systems, mining, tokenomics, and decentralized finance.",
      route: "/crypto",
      fileNode: "encyclopedia/markets/crypto.html",
      glow: "purple"
    },
    {
      title: "Commodities",
      description:
        "Oil, gold, silver, natural gas, wheat, coffee, inflation, wars, and supply chains.",
      route: "/commodities",
      fileNode: "encyclopedia/markets/commodities.html",
      glow: "orange"
    },
    {
      title: "Macroeconomics",
      description:
        "Interest rates, inflation, debt systems, Federal Reserve policy, recessions, and GDP.",
      route: "/economy",
      fileNode: "economy.html",
      glow: "blue"
    }
  ];

  return (
    <div className="markets-directory-page relative overflow-hidden">
      <div className="hero-background absolute inset-0 z-0">
        <div className="hero-background-extra"></div>
      </div>

      <div className="relative z-10">
        <section className="markets-hero glass">
          <div className="markets-hero-left">
            <div className="directory-badge text-xs font-mono font-bold tracking-wider uppercase">
              GLOBAL MARKET SYSTEMS
            </div>
            <h1 className="text-white font-black leading-tight uppercase font-sans">
              MARKET WORLDS
            </h1>
            <p className="text-zinc-300 mt-4 text-sm leading-relaxed max-w-xl">
              Explore every major financial ecosystem through cinematic educational environments.
              Learn relationships between currencies, stocks, bonds, commodities, crypto assets, inflation, and global economics.
            </p>
          </div>

          <div className="markets-hero-right hidden lg:block">
            <div className="planet-glow"></div>
            <img
              src="/images/market-planet.png"
              className="market-planet"
              alt="Market Planet Logo"
            />
          </div>
        </section>

        <MarketTicker />
        <div className="h-4" />
        <StatsBar />

        <section className="market-world-grid">
          {marketWorlds.map((world, i) => (
            <a
              href={world.route}
              key={i}
              onClick={(e) => {
                if (onSelectFile) {
                  e.preventDefault();
                  onSelectFile(world.fileNode);
                }
              }}
              className={`glass market-world-card ${world.glow} group block`}
            >
              <div className="world-inner-glow"></div>
              <h2 className="text-white font-bold text-xl uppercase group-hover:text-[#00D9FF] transition-colors">
                {world.title}
              </h2>
              <p className="text-zinc-400 mt-2 text-xs leading-relaxed">
                {world.description}
              </p>
              <span className="text-[#00D9FF] text-[10px] font-mono font-bold uppercase tracking-wider mt-4 inline-block group-hover:translate-x-1 transition-transform">
                ENTER WORLD →
              </span>
            </a>
          ))}
        </section>

        {/* FEATURED EDUCATION */}
        <section className="featured-market-learning">
          <div className="glass learning-panel">
            <h2 className="text-[#00D9FF] font-bold text-lg uppercase mb-3">
              Why Do Currencies Move?
            </h2>
            <p className="text-zinc-450 text-xs leading-relaxed">
              Currencies are affected by inflation, interest rates, wars, GDP, debt systems, and central bank policy.
            </p>
          </div>

          <div className="glass learning-panel">
            <h2 className="text-[#00D9FF] font-bold text-lg uppercase mb-3">
              What Is Market Capitalization?
            </h2>
            <p className="text-zinc-450 text-xs leading-relaxed">
              Market capitalization measures the total value of a company’s outstanding shares.
            </p>
          </div>

          <div className="glass learning-panel">
            <h2 className="text-[#00D9FF] font-bold text-lg uppercase mb-3">
              Why Did Gold Rise Today?
            </h2>
            <p className="text-zinc-450 text-xs leading-relaxed">
              Gold often rises during inflation fears, banking stress, currency instability, and geopolitical uncertainty.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
