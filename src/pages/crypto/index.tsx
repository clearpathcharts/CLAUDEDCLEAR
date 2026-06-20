// ========================================================
// CLEARPATH MASTER CRYPTO INTELLIGENCE ENGINE
// FILE:
// /src/pages/crypto/index.tsx
// ========================================================

import React, { useState, useMemo } from "react";
import { getProceduralCrypto } from "../../utils/searchEngine";
import MarketTicker from "../../components/MarketTicker";

export default function CryptoUniverse() {
  const allCoins = useMemo(() => {
    return getProceduralCrypto();
  }, []);

  const [activeLetter, setActiveLetter] = useState<string>("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 24;

  const categories = useMemo(() => {
    const cats = new Set<string>();
    allCoins.forEach(c => {
      if (c.category) cats.add(c.category);
    });
    return ["all", ...Array.from(cats)];
  }, [allCoins]);

  // A to Z letters
  const alphabet = useMemo(() => {
    return "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
  }, []);

  // Filter and alphabetical sorting (already sorted by name, but let's enforce double check)
  const filteredAndSortedCoins = useMemo(() => {
    return allCoins
      .filter(coin => {
        const nameMatch = coin.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          coin.symbol.toLowerCase().includes(searchQuery.toLowerCase());
        const catMatch = selectedCategory === "all" || coin.category === selectedCategory;
        const letterMatch = activeLetter === "all" || coin.name.toUpperCase().startsWith(activeLetter);
        return nameMatch && catMatch && letterMatch;
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [allCoins, searchQuery, selectedCategory, activeLetter]);

  // Pagination
  const paginatedCoins = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredAndSortedCoins.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredAndSortedCoins, currentPage]);

  const totalPages = Math.ceil(filteredAndSortedCoins.length / itemsPerPage);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // Scroll to the directory list
    const el = document.getElementById("crypto-directory-sec");
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  const handleCoinClick = (symbol: string) => {
    window.location.hash = ""; // Clear hash of standard page if any
    window.history.pushState({}, "", `/crypto/${symbol.toLowerCase()}`);
    // Trigger popstate listener in layout
    window.dispatchEvent(new Event("popstate"));
  };

  return (
    <div className="crypto-universe-page text-white font-sans p-4 md:p-8 max-w-7xl mx-auto">
      {/* BACKGROUND GRAPHIC */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0b0420]/50 to-transparent pointer-events-none -z-10 h-[500px]"></div>

      {/* HERO SECTION */}
      <section className="crypto-hero glass bg-black/35 border border-white/5 rounded-3xl p-8 md:p-12 relative overflow-hidden flex flex-col lg:flex-row gap-8 items-center">
        <div className="flex-1">
          <div className="inline-flex px-3 py-1 bg-pink-500/10 border border-pink-500/20 text-[#FF007F] text-[10px] font-mono tracking-widest uppercase rounded-lg mb-4">
            CRYPTO DIGITAL ASSET NETWORKS
          </div>
          <h1 className="text-[#ff5a1f] drop-shadow-[0_0_12px_rgba(255,90,31,0.6)] font-black text-4xl md:text-5xl uppercase tracking-tight mb-4 leading-none animate-pulse">
            CRYPTO GLOSSARY &<br />
            LEDGER INDEX
          </h1>
          <p className="text-zinc-400 text-sm leading-relaxed mb-6 max-w-xl font-sans text-justify">
            Explore the permanent digital archive of decentralized trust systems, sovereign tokens, proof-of-work protocols, layer-2 smart platforms, and Web3 consensus architectures. Spanning the entire history of cryptography back to early 2000s predecessors all the way to 2026.
          </p>
          <div className="flex flex-wrap gap-3">
            <a 
              href="#crypto-directory-sec"
              className="px-5 py-2.5 bg-gradient-to-r from-pink-600 to-[#7A3BFF] hover:opacity-90 font-mono text-xs font-bold uppercase rounded-xl transition-all"
            >
              Browse Complete Directory A-Z
            </a>
            <button 
              onClick={() => {
                const el = document.getElementById("blockchain-relationship-sec");
                if (el) el.scrollIntoView({ behavior: "smooth" });
              }}
              className="px-5 py-2.5 bg-white/5 border border-white/10 hover:bg-white/10 font-mono text-xs font-bold uppercase rounded-xl transition-all"
            >
              Sovereign Mechanics
            </button>
          </div>
        </div>

        {/* ORB DECORATION */}
        <div className="w-56 h-56 rounded-full bg-pink-500/10 border border-pink-500/20 flex items-center justify-center relative shadow-[0_0_50px_rgba(255,0,127,0.1)]">
          <div className="absolute w-44 h-44 rounded-full bg-purple-500/5 blur-xl"></div>
          <span className="font-mono text-8xl font-black text-pink-500/25">A-Z</span>
        </div>
      </section>

      {/* COMPACT MARKET TICKER */}
      <div className="mt-8">
        <MarketTicker />
      </div>

      {/* CORE DIRECTORY */}
      <section id="crypto-directory-sec" className="crypto-directory-section mt-12 bg-black/25 border border-white/5 rounded-3xl p-6 md:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-4 border-b border-white/5">
          <div>
            <h2 className="text-[#ff5a1f] drop-shadow-[0_0_10px_rgba(255,90,31,0.5)] font-black text-2xl tracking-tight uppercase">
              Alphabetical Registry
            </h2>
            <p className="text-zinc-500 text-xs font-mono mt-1 font-bold">
              {filteredAndSortedCoins.length} ACTIVE DIGITAL LEDGERS STORED IN CACHE
            </p>
          </div>

          {/* SEARCH INPUT */}
          <div className="w-full md:w-80">
            <input
              type="text"
              placeholder="Search crypto token by symbol or name..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-4 py-2.5 bg-white/5 border border-white/10 focus:border-pink-500/50 rounded-xl font-mono text-xs text-white placeholder-zinc-550 outline-none transition-all"
            />
          </div>
        </div>

        {/* ALPHABET FILTER WRAPPER */}
        <div className="mb-6">
          <span className="text-[10px] font-mono text-zinc-500 block mb-2 uppercase tracking-wider">Alphabet Index:</span>
          <div className="flex flex-wrap gap-1">
            <button
              onClick={() => {
                setActiveLetter("all");
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono uppercase font-bold transition-all ${
                activeLetter === "all"
                  ? "bg-[#FF007F] text-white shadow-[0_0_10px_rgba(255,0,127,0.3)]"
                  : "bg-white/5 border border-white/5 hover:border-white/15 text-zinc-400 hover:text-white"
              }`}
            >
              All
            </button>
            {alphabet.map((letter) => (
              <button
                key={letter}
                onClick={() => {
                  setActiveLetter(letter);
                  setCurrentPage(1);
                }}
                className={`w-8 h-8 rounded-lg text-xs font-mono uppercase font-bold transition-all flex items-center justify-center ${
                  activeLetter === letter
                    ? "bg-[#FF007F] text-white shadow-[0_0_10px_rgba(255,0,127,0.3)]"
                    : "bg-white/5 border border-white/5 hover:border-white/15 text-zinc-400 hover:text-white"
                }`}
              >
                {letter}
              </button>
            ))}
          </div>
        </div>

        {/* CATEGORY SELECTOR */}
        <div className="mb-8 flex flex-wrap gap-2 items-center">
          <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider mr-2">Ecosystem Class:</span>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => {
                setSelectedCategory(cat);
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 text-[10.5px] font-mono rounded-lg transition-all ${
                selectedCategory === cat
                  ? "bg-purple-600 text-white"
                  : "bg-white/5 text-zinc-400 hover:text-white border border-white/5 hover:border-white/10"
              }`}
            >
              {cat === "all" ? "All Ecosystems" : cat}
            </button>
          ))}
        </div>

        {/* COIN CARDS GRID */}
        {filteredAndSortedCoins.length === 0 ? (
          <div className="py-20 text-center text-zinc-500 font-mono text-xs">
            No matching cryptocurrencies or tokens located in our historical databases.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {paginatedCoins.map((coin) => (
              <div
                key={coin.symbol}
                onClick={() => handleCoinClick(coin.symbol)}
                className="group cursor-pointer glass p-5 bg-neutral-950/40 border border-white/5 hover:border-pink-500/35 hover:bg-neutral-900/40 rounded-2xl relative overflow-hidden transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  {/* Visual hover lines */}
                  <div className="absolute inset-x-0 h-[1.5px] top-0 bg-gradient-to-r from-[#FF007F] to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  
                  <div className="flex justify-between items-start mb-3">
                    <span className="text-pink-400 font-mono font-black tracking-widest text-[#FF007F] text-xs uppercase bg-pink-500/10 px-2 py-0.5 rounded border border-pink-500/10">
                      {coin.symbol}
                    </span>
                    <span className="text-zinc-500 font-mono text-[9px] uppercase tracking-wider">
                      {coin.founded || "Est. Epoch"}
                    </span>
                  </div>

                  <h3 className="text-[#ff5a1f] font-bold group-hover:text-[#ff4500] group-hover:drop-shadow-[0_0_8px_rgba(255,90,31,0.5)] text-base mb-1.5 transition-colors">
                    {coin.name}
                  </h3>
                  
                  <span className="text-zinc-500 font-mono text-[9.5px] uppercase block mb-3">
                    {coin.category || "Layer 1 Platform"}
                  </span>

                  <p className="text-zinc-400 text-xs leading-relaxed font-sans line-clamp-3 select-text mb-4">
                    {coin.description}
                  </p>
                </div>

                <div className="border-t border-white/5 pt-3.5 mt-auto flex justify-between items-center bg-white/[0.01]">
                  <span className="text-[#FF007F] font-mono text-[9px] uppercase tracking-wider font-bold">
                    View Intelligence
                  </span>
                  <span className="text-zinc-500 font-mono text-xs group-hover:translate-x-1 transition-transform">➔</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* PAGINATION PANEL */}
        {totalPages > 1 && (
          <div className="mt-10 pt-6 border-t border-white/5 flex flex-wrap items-center justify-between gap-4 font-mono text-xs">
            <span className="text-zinc-500">
              Showing page {currentPage} of {totalPages} ({filteredAndSortedCoins.length} assets found)
            </span>
            <div className="flex gap-1.5">
              <button
                disabled={currentPage === 1}
                onClick={() => handlePageChange(currentPage - 1)}
                className="px-3 py-1.5 rounded bg-white/5 text-zinc-400 hover:text-white disabled:opacity-30 disabled:pointer-events-none transition-colors"
              >
                Previous Page
              </button>
              <button
                disabled={currentPage === totalPages}
                onClick={() => handlePageChange(currentPage + 1)}
                className="px-3 py-1.5 rounded bg-white/5 text-zinc-400 hover:text-white disabled:opacity-30 disabled:pointer-events-none transition-colors"
              >
                Next Page
              </button>
            </div>
          </div>
        )}
      </section>

      {/* CRYPTO RELATIONSHIPS */}
      <section id="blockchain-relationship-sec" className="crypto-relationships grid grid-cols-1 lg:grid-cols-3 gap-6 mt-16 pb-12">
        <div className="glass p-8 bg-neutral-900/25 border border-white/5 rounded-3xl">
          <h2 className="text-[#ff5a1f] font-black text-lg mb-4 uppercase tracking-tight drop-shadow-[0_0_6px_rgba(255,90,31,0.3)]">
            Bitcoin & Macro Liquidity Channel
          </h2>
          <p className="text-zinc-400 text-xs leading-relaxed font-sans text-justify">
            Bitcoin functions as a pure global liquidity sponge. Because its absolute supply is hard-capped at 21,000,000 tokens by deterministic code constraints, its valuation premium expands exponentially whenever reserve banking currencies face debasement through Quantitative Easing (M2 credit injection periods).
          </p>
        </div>
        <div className="glass p-8 bg-neutral-900/25 border border-white/5 rounded-3xl">
          <h2 className="text-[#ff5a1f] font-black text-lg mb-4 uppercase tracking-tight drop-shadow-[0_0_6px_rgba(255,90,31,0.3)]">
            Ethereum & Layer-1 State Pools
          </h2>
          <p className="text-zinc-400 text-xs leading-relaxed font-sans text-justify">
            Smart contract protocols represent decentralized, self-enforcing sovereign micro-economies. Transactions compile as algorithmic state changes directly on the ledger pool, replacing standard secondary intermediaries (banks, escrows, legal registries) with immutable cryptographic code.
          </p>
        </div>
        <div className="glass p-8 bg-neutral-900/25 border border-white/5 rounded-3xl">
          <h2 className="text-[#ff5a1f] font-black text-lg mb-4 uppercase tracking-tight drop-shadow-[0_0_6px_rgba(255,90,31,0.3)]">
            Tokenomics & Dynamic Monetarism
          </h2>
          <p className="text-zinc-400 text-xs leading-relaxed font-sans text-justify">
            The mathematical model managing digital issuance, reward structures, programmatic transaction fees, coin-burn cycles, and staking lockups. These parameters operate as a decentralized central bank, defining policy without political agency.
          </p>
        </div>
      </section>
    </div>
  );
}
