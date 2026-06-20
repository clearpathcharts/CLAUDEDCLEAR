// ========================================================
// CLEARPATH MASTER STOCK UNIVERSE ENGINE
// FILE:
// /src/pages/stocks/index.tsx
// ========================================================

import React from "react";
import stocks from "../../../data/stocks/stocks.json";
import GlobalSearch from "../../components/GlobalSearch";
import MarketTicker from "../../components/MarketTicker";

export default function StocksUniverse() {
  const featuredStocks = [
    "AAPL",
    "MSFT",
    "NVDA",
    "TSLA",
    "META",
    "AMZN",
    "GOOGL",
    "AMD",
    "NFLX",
    "PLTR"
  ];

  return (
    <div className="stocks-universe-page text-white font-sans">
      {/* BACKGROUND */}
      <div className="hero-background"></div>

      {/* HERO */}
      <section className="stocks-hero glass">
        <div className="stocks-hero-left">
          <div className="stocks-badge">
            10,000+ PUBLICLY TRADED STOCKS
          </div>
          <h1 className="text-white font-black leading-none mb-6">
            GLOBAL STOCK<br />
            UNIVERSE
          </h1>
          <p className="text-zinc-300 text-lg leading-relaxed mb-8 max-w-xl">
            Explore every major publicly traded corporation through immersive financial
            education systems. Learn earnings, market cap, valuation, growth, dividends,
            sectors, institutional ownership, macroeconomic relationships, and global capital flows.
          </p>
          <div className="hero-actions flex gap-4">
            <button className="glass primary-action px-6 py-3 rounded-xl font-bold hover:scale-105 transition-transform duration-300">
              Explore Stocks
            </button>
            <button className="glass secondary-action px-6 py-3 rounded-xl font-bold bg-white/5 border border-white/10 hover:bg-white/10 transition-colors duration-300">
              Sector Maps
            </button>
          </div>
        </div>

        {/* VISUAL */}
        <div className="stocks-hero-right hidden lg:block">
          <div className="stock-energy-orb"></div>
          <img
            src="/images/stocks-core.png"
            className="stocks-core-image"
            alt="Stocks Visual"
            onError={(e) => {
              // Hide broken images gracefully
              e.currentTarget.style.display = 'none';
            }}
          />
          <div className="market-wave"></div>
        </div>
      </section>

      {/* TICKER */}
      <MarketTicker />

      {/* SEARCH */}
      <GlobalSearch />

      {/* FEATURED STOCKS */}
      <section className="featured-stocks mt-16">
        <h2 className="text-white font-black text-3xl mb-8">
          Featured Market Leaders
        </h2>
        <div className="featured-stock-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {featuredStocks.map((ticker, i) => {
            const stockData = stocks.find(s => s.ticker === ticker);
            return (
              <div
                key={ticker}
                className="glass featured-stock-card p-6 bg-neutral-900/40 border border-white/10 rounded-2xl relative overflow-hidden"
              >
                <div className="stock-card-glow"></div>
                <div className="flex justify-between items-start mb-4">
                  <span className="ticker text-[#00D9FF] font-mono text-xs font-bold uppercase tracking-widest">
                    {ticker}
                  </span>
                  <span className="text-[10px] text-zinc-550 uppercase font-mono bg-[#00D9FF]/10 text-[#00D9FF] px-2 py-0.5 rounded">
                    Leader Node
                  </span>
                </div>
                <h3 className="text-white font-bold text-xl mb-3">
                  {stockData?.company || ticker}
                </h3>
                <p className="text-zinc-400 text-sm leading-relaxed mb-6">
                  {stockData?.description || "High-performance market equity tracking operational cash flow parameters."}
                </p>
                <div className="flex items-center justify-between mt-auto">
                  <span className="text-xs text-zinc-500 font-mono">
                    {stockData?.exchange || "NASDAQ"}
                  </span>
                  <button className="bg-white/5 hover:bg-[#00D9FF]/10 hover:text-[#00D9FF] border border-white/10 hover:border-[#00D9FF]/30 px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-300">
                    Open Intelligence →
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* EDUCATION */}
      <section className="stocks-learning-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-16">
        <div className="glass learning-card p-8 bg-neutral-900/25 border border-white/5 rounded-3xl">
          <h2 className="text-[#00D9FF] font-black text-xl mb-4">
            What Is A Stock?
          </h2>
          <p className="text-zinc-300 text-sm leading-relaxed">
            A stock represents ownership in a publicly traded company.
            Investors buy shares to participate in company growth, operational value, and future profits.
          </p>
        </div>
        <div className="glass learning-card p-8 bg-neutral-900/25 border border-white/5 rounded-3xl">
          <h2 className="text-[#00D9FF] font-black text-xl mb-4">
            Why Do Companies Go Public?
          </h2>
          <p className="text-zinc-300 text-sm leading-relaxed">
            Companies issue shares to access institutional capital, expand core global operations, fund extensive research, and increase market visibility.
          </p>
        </div>
        <div className="glass learning-card p-8 bg-neutral-900/25 border border-white/5 rounded-3xl">
          <h2 className="text-[#00D9FF] font-black text-xl mb-4">
            What Moves Stock Prices?
          </h2>
          <p className="text-zinc-300 text-sm leading-relaxed">
            Earnings, interest rates, inflation, regulatory news, AI technological growth, market sentiment index, and large institutional block flows.
          </p>
        </div>
        <div className="glass learning-card p-8 bg-neutral-900/25 border border-white/5 rounded-3xl">
          <h2 className="text-[#00D9FF] font-black text-xl mb-4">
            What Is Market Cap?
          </h2>
          <p className="text-zinc-300 text-sm leading-relaxed">
            Market capitalization measures the total dollar value of a company’s outstanding shares, determining its tier within the global equity system.
          </p>
        </div>
      </section>

      {/* MASSIVE STOCK DIRECTORY */}
      <section className="massive-stock-directory mt-20 mb-10">
        <div className="directory-header flex justify-between items-center mb-8 border-b border-white/5 pb-4">
          <h2 className="text-white font-black text-3xl select-none">
            LIVE STOCK DIRECTORY
          </h2>
          <span className="text-[#00D9FF] font-mono font-bold tracking-widest text-xs uppercase bg-[#00D9FF]/10 p-2 rounded-lg">
            {stocks.length}+ EQUITIES
          </span>
        </div>
        <div className="stock-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {stocks.map((stock, i) => (
            <div
              key={i}
              className="glass stock-directory-card p-6 bg-neutral-950/40 border border-white/5 hover:border-[#00D9FF]/45 rounded-2xl relative overflow-hidden transition-all duration-300"
            >
              <div className="directory-glow"></div>
              <div className="directory-top flex justify-between items-start mb-4">
                <span className="directory-ticker text-[#00D9FF] font-mono font-bold uppercase tracking-widest text-sm">
                  {stock.ticker}
                </span>
                <span className="directory-sector text-zinc-500 font-mono text-[10px] uppercase">
                  {stock.sector}
                </span>
              </div>
              <h3 className="text-white font-bold text-lg mb-2">
                {stock.company}
              </h3>
              <p className="text-zinc-400 text-xs leading-relaxed mb-6">
                {stock.description}
              </p>
              <div className="directory-footer flex justify-between items-center">
                <span className="text-zinc-550 font-mono text-[10px]">
                  {stock.exchange}
                </span>
                <button className="bg-white/5 hover:bg-[#00D9FF]/15 border border-white/10 hover:border-[#00D9FF]/40 px-3.5 py-1.5 rounded-xl text-xs text-white uppercase font-bold tracking-normal transition-all duration-300">
                  Explore →
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
