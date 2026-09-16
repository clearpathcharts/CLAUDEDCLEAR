"use client";

import React, { memo, useDeferredValue, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { searchEnabledAssets, type RegistryAsset } from "../../constants/assetRegistry";

const SUGGESTION_CAP = 25;

interface ChartSymbolSearchProps {
  onSubmit: (symbol: string) => void;
  placeholder?: string;
  compact?: boolean;
  activeSymbol?: string | null;
}

/**
 * Isolated asset search: query stays local until Load/Enter.
 * Suggestions are capped (~25) from the Venture registry — never the
 * 10k procedural encyclopedia universe, and never desk-wide state.
 */
export const ChartSymbolSearch = memo(function ChartSymbolSearch({
  onSubmit,
  placeholder = "Search your chart…",
  compact = false,
  activeSymbol,
}: ChartSymbolSearchProps) {
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);

  const suggestions = useMemo((): RegistryAsset[] => {
    const q = deferredQuery.trim();
    if (q.length < 1) return [];
    return searchEnabledAssets(q, SUGGESTION_CAP);
  }, [deferredQuery]);

  const commit = (raw: string) => {
    const sym = raw.trim();
    if (!sym) return;
    onSubmit(sym);
    setQuery("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    commit(query);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="relative flex items-center gap-2 flex-1 min-w-0"
      data-asset-search=""
    >
      <div className="relative flex-1 min-w-0">
        <Search
          size={compact ? 12 : 14}
          className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none"
          aria-hidden
        />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          aria-label={placeholder}
          aria-autocomplete="list"
          autoComplete="off"
          className={`w-full bg-black/60 border border-white/15 rounded-lg font-mono text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-[#00D9FF]/40 focus:border-[#00D9FF]/50 ${
            compact ? "pl-7 pr-2 py-1 text-[10px]" : "pl-8 pr-3 py-2 text-xs"
          }`}
        />
        {suggestions.length > 0 ? (
          <ul
            role="listbox"
            aria-label="Asset suggestions"
            className="absolute left-0 right-0 top-full z-40 mt-1 max-h-64 overflow-y-auto rounded-lg border border-white/15 bg-zinc-950/95 py-1 shadow-xl"
          >
            {suggestions.map((asset) => (
              <li key={asset.symbol} role="option">
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => commit(asset.symbol)}
                  className="flex w-full items-baseline justify-between gap-2 px-3 py-1.5 text-left font-mono hover:bg-white/10"
                >
                  <span className="text-[11px] font-extrabold text-zinc-100">{asset.symbol}</span>
                  <span className="min-w-0 truncate text-[10px] text-zinc-500">{asset.display}</span>
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
      <button
        type="submit"
        className={`shrink-0 font-black uppercase tracking-wider rounded-lg border border-[#00D9FF]/30 bg-[#00D9FF]/10 text-[#00D9FF] hover:bg-[#00D9FF]/20 transition-colors ${
          compact ? "px-2 py-1 text-[9px]" : "px-3 py-2 text-[10px]"
        }`}
      >
        Load
      </button>
      {activeSymbol && (
        <span
          className={`shrink-0 font-mono font-bold text-[#00FFFF] uppercase ${
            compact ? "text-[9px] max-w-[56px] truncate" : "text-[10px]"
          }`}
          title={activeSymbol}
        >
          {activeSymbol}
        </span>
      )}
    </form>
  );
});
