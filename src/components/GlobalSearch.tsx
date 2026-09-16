// /src/components/GlobalSearch.tsx
import React, { useState } from "react";
import { symbolLookup } from "../utils/symbolLookup";
import { Search, Globe, Landmark, TrendingUp, Cpu, Award } from "lucide-react";

export default function GlobalSearch() {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<any>(null);
  const [searched, setSearched] = useState(false);

  function handleSearch() {
    const found = symbolLookup(query);
    setResult(found || null);
    setSearched(true);
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  return (
    <div className="global-search glass p-6 flex flex-col gap-5 max-w-xl mx-auto w-full select-none">
      <div className="flex flex-col gap-1">
        <span className="font-mono text-[9px] uppercase tracking-[0.25em] text-[#00D9FF] font-black leading-none mb-1">
          OPERATING SYSTEM // SEARCH BAR ENGINE
        </span>
        <h2 className="text-white font-black text-sm uppercase tracking-tight">
          Query Master Symbol Matrix
        </h2>
      </div>

      <div className="flex gap-2 relative">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Search stocks (e.g. AAPL, TSLA), forex, crypto..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full bg-neutral-950/80 border border-white/10 hover:border-white/20 focus:border-[#00D9FF]/40 text-white font-mono text-xs placeholder-zinc-550 pl-10 pr-4 py-3 rounded-xl outline-none transition-all"
            id="global-search-input"
          />
          <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3.5" />
        </div>

        <button 
          onClick={handleSearch}
          className="bg-[#00D9FF] hover:bg-[#00c5e6] text-black font-mono font-black text-xs uppercase px-5 rounded-xl transition-all cursor-pointer select-none active:scale-[0.98]"
          id="global-search-submit"
        >
          Search
        </button>
      </div>

      {result ? (
        <div className="search-result p-4 bg-white/[0.02] border border-white/5 rounded-2xl flex flex-col gap-3 animate-fadeIn">
          <div className="flex items-center justify-between border-b border-white/5 pb-2">
            <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#FF007F] font-black">
              INDEX MATRIX MATCHED: {result.type.toUpperCase()}
            </span>
            <span className="font-mono text-[9px] text-[#00D9FF] font-black">
              {result.type === 'stock' ? (result.data.ticker || result.data.symbol) : result.type === 'crypto' ? result.data.symbol : result.data.pair}
            </span>
          </div>

          <h3 className="text-white font-black text-base uppercase tracking-tight flex items-center gap-2">
            {result.type === 'stock' && <Landmark className="w-4 h-4 text-[#00D9FF]" />}
            {result.type === 'crypto' && <Cpu className="w-4 h-4 text-[#FF007F]" />}
            {result.type === 'forex' && <Globe className="w-4 h-4 text-green-400" />}
            {result.data.name || result.data.company || result.data.pair}
          </h3>

          <p className="text-zinc-350 text-xs leading-relaxed select-text font-sans">
            {result.data.description}
          </p>

          <div className="grid grid-cols-2 gap-3 mt-1 font-mono text-[10px]">
            {result.data.sector && (
              <div className="p-2.5 bg-black/45 rounded-xl border border-white/5">
                <span className="text-zinc-550 block text-[8px] uppercase">Sector</span>
                <span className="text-white font-black uppercase mt-0.5 block truncate">{result.data.sector}</span>
              </div>
            )}
            {result.data.exchange && (
              <div className="p-2.5 bg-black/45 rounded-xl border border-white/5">
                <span className="text-zinc-550 block text-[8px] uppercase">Exchange</span>
                <span className="text-[#00D9FF] font-black mt-0.5 block">{result.data.exchange}</span>
              </div>
            )}
            {result.data.category && (
              <div className="p-2.5 bg-black/45 rounded-xl border border-white/5">
                <span className="text-zinc-550 block text-[8px] uppercase">Category</span>
                <span className="text-white font-black mt-0.5 block truncate">{result.data.category}</span>
              </div>
            )}
            {result.data.creator && (
              <div className="p-2.5 bg-black/45 rounded-xl border border-white/5">
                <span className="text-zinc-550 block text-[8px] uppercase">Creator</span>
                <span className="text-zinc-200 mt-0.5 block truncate">{result.data.creator}</span>
              </div>
            )}
            {result.data.type && result.type === 'forex' && (
              <div className="p-2.5 bg-black/45 rounded-xl border border-white/5 font-mono">
                <span className="text-zinc-550 block text-[8px] uppercase">Pair Type</span>
                <span className="text-white font-black mt-0.5 block">{result.data.type}</span>
              </div>
            )}
          </div>

          <div className="flex justify-end mt-4 border-t border-white/5 pt-3">
            <button
              onClick={() => {
                let path = "/financial-encyclopedia";
                if (result.type === "stock") {
                  path = `/stocks/${result.data.ticker.toLowerCase()}`;
                } else if (result.type === "crypto") {
                  path = `/crypto/${result.data.symbol.toLowerCase()}`;
                } else if (result.type === "forex") {
                  path = `/forex/${result.data.pair.toLowerCase().replace("/", "")}`;
                }
                window.history.pushState({}, "", path);
              }}
              className="py-2.5 px-5 bg-[#00D9FF] hover:bg-[#00c5e6] text-black font-mono text-[10px] font-black uppercase rounded-lg cursor-pointer transition-all active:scale-[0.98] shadow-md flex items-center gap-1.5"
            >
              🚀 Open Academic dossier →
            </button>
          </div>
        </div>
      ) : searched ? (
        <div className="p-4 bg-red-950/20 border border-red-500/10 rounded-2xl text-center text-zinc-400 font-mono text-xs animate-fadeIn">
          ⚠️ NO DIRECT INDEX MATCH FOUND IN CLEARPATH CORP DATABASE
        </div>
      ) : null}
    </div>
  );
}
