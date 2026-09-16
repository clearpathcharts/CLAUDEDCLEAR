// /src/components/StatsBar.tsx
import React from "react";
import { TrendingUp, Users, Cpu, DollarSign } from "lucide-react";

export default function StatsBar() {
  return (
    <div className="stats-bar glass p-6 grid grid-cols-2 md:grid-cols-4 gap-6 select-none relative overflow-hidden">
      {/* Dynamic line glow */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#00D9FF]/30 to-transparent" />

      {/* STAT 1 */}
      <div className="flex flex-col gap-1 items-center md:items-start text-center md:text-left border-r border-white/5 last:border-0 pr-4">
        <div className="flex items-center gap-2 mb-1">
          <TrendingUp className="w-3.5 h-3.5 text-[#00D9FF]" />
          <span className="font-mono text-[9px] uppercase tracking-wider text-zinc-500 font-bold">STOCKS MATRIX</span>
        </div>
        <h2 className="text-white font-black text-2xl tracking-tight leading-none">
          10,000+
        </h2>
        <span className="font-mono text-[9.5px] text-zinc-400">Archived Seed Listings</span>
      </div>

      {/* STAT 2 */}
      <div className="flex flex-col gap-1 items-center md:items-start text-center md:text-left border-r border-white/5 last:border-0 pr-4">
        <div className="flex items-center gap-2 mb-1">
          <Users className="w-3.5 h-3.5 text-[#FF6A00]" />
          <span className="font-mono text-[9px] uppercase tracking-wider text-zinc-500 font-bold">COMPANIES MAP</span>
        </div>
        <h2 className="text-white font-black text-2xl tracking-tight leading-none">
          60,000+
        </h2>
        <span className="font-mono text-[9.5px] text-zinc-400">Institutional Dossiers</span>
      </div>

      {/* STAT 3 */}
      <div className="flex flex-col gap-1 items-center md:items-start text-center md:text-left border-r border-white/5 last:border-0 pr-4">
        <div className="flex items-center gap-2 mb-1">
          <Cpu className="w-3.5 h-3.5 text-[#FF007F]" />
          <span className="font-mono text-[9px] uppercase tracking-wider text-zinc-500 font-bold">CRYPTOCURRENCY</span>
        </div>
        <h2 className="text-white font-black text-2xl tracking-tight leading-none">
          20,000+
        </h2>
        <span className="font-mono text-[9.5px] text-zinc-400">Consensus Assets</span>
      </div>

      {/* STAT 4 */}
      <div className="flex flex-col gap-1 items-center md:items-start text-center md:text-left">
        <div className="flex items-center gap-2 mb-1">
          <DollarSign className="w-3.5 h-3.5 text-green-400" />
          <span className="font-mono text-[9px] uppercase tracking-wider text-zinc-500 font-bold">FOREX PAIRS</span>
        </div>
        <h2 className="text-white font-black text-2xl tracking-tight leading-none">
          1,200+
        </h2>
        <span className="font-mono text-[9.5px] text-zinc-400">Bilateral Swap Channels</span>
      </div>
    </div>
  );
}
