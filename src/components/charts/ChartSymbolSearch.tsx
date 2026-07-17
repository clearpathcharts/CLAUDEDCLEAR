"use client";

import React, { useState } from "react";
import { Search } from "lucide-react";

interface ChartSymbolSearchProps {
  onSubmit: (symbol: string) => void;
  placeholder?: string;
  compact?: boolean;
  activeSymbol?: string | null;
}

export function ChartSymbolSearch({
  onSubmit,
  placeholder = "Search your chart…",
  compact = false,
  activeSymbol,
}: ChartSymbolSearchProps) {
  const [query, setQuery] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const sym = query.trim();
    if (sym) {
      onSubmit(sym);
      setQuery("");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2 flex-1 min-w-0">
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
          className={`w-full bg-black/60 border border-white/15 rounded-lg font-mono text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-[#00D9FF]/40 focus:border-[#00D9FF]/50 ${
            compact ? "pl-7 pr-2 py-1 text-[10px]" : "pl-8 pr-3 py-2 text-xs"
          }`}
        />
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
}
