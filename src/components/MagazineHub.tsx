import React, { useState } from 'react';
import { BookOpen } from 'lucide-react';
import { YwcMagazineRack } from './yours/YwcMagazineRack';
import type { MagazineCategory } from '../lib/ywc/magazineTypes';

const TABS: Array<{ id: 'all' | MagazineCategory; label: string }> = [
  { id: 'all', label: 'ALL EDITIONS' },
  { id: 'automotive', label: 'CARS & RACING' },
  { id: 'lifestyle', label: 'LIFESTYLE' },
  { id: 'tech', label: 'TECH' },
  { id: 'science', label: 'SCIENCE' },
  { id: 'news', label: 'NEWS & POLITICS' },
];

export default function MagazineHub() {
  const [activeTab, setActiveTab] = useState<'all' | MagazineCategory>('all');

  return (
    <div
      id="magazine-hub-portal-div"
      className="bg-[#0b0c10] border border-white/5 rounded-3xl p-6 md:p-8 space-y-8 shadow-[0_12px_45px_rgba(0,0,0,0.85)] relative overflow-hidden"
    >
      <div className="absolute right-10 bottom-0 w-48 h-48 bg-purple-500/5 blur-3xl rounded-full" />
      <div className="absolute left-10 top-0 w-48 h-48 bg-emerald-500/5 blur-3xl rounded-full" />

      <div className="relative z-10 space-y-1.5 text-left">
        <div className="flex items-center gap-2 text-[9px] font-mono tracking-[0.25em] text-[#39ff14] bg-[#39ff14]/10 w-fit px-3 py-1 rounded-full font-black">
          <BookOpen className="w-3 h-3 text-[#39ff14]" />
          <span>MAGAZINE RACK — PUBLISHER SITES</span>
        </div>
        <h2 className="text-4xl md:text-5xl font-black font-serif italic text-white tracking-tight">
          MAGAZINE <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-[#39ff14] to-cyan-400">WIRES</span>
        </h2>
        <p className="text-xs text-zinc-400 font-sans max-w-2xl leading-relaxed">
          Live RSS from Motorsport, MotorTrend, Car and Driver, Road &amp; Track, WIRED, GQ, Esquire,
          Smithsonian, and Popular Science. Each headline opens the magazine&apos;s own page — subscribe
          there if you like the desk. ClearPath does not sell these titles.
        </p>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 border-b border-white/5 relative z-10">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`px-3 py-1.5 text-[9px] font-black uppercase tracking-wider rounded-lg transition-all cursor-pointer whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-[#39ff14] text-black shadow-[0_0_12px_rgba(57,255,20,0.55)] font-extrabold'
                : 'text-zinc-400 hover:text-[#39ff14] hover:bg-zinc-900/50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="relative z-10">
        <YwcMagazineRack category={activeTab} hideIntro />
      </div>
    </div>
  );
}
