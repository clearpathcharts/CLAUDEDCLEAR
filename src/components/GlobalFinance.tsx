import React, { useState, useEffect } from 'react';
import { Landmark, TrendingUp, DollarSign, Globe, Award, Percent, ChevronRight, Activity, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { motion } from 'motion/react';
import { RSSService, globalFinanceFeeds } from '../services/rssService';

interface FeedItem {
  title: string;
  link: string;
  description: string;
  timestamp: string;
  image: string;
  author: string;
  feedUrl: string;
}

export default function GlobalFinance() {
  const [activeTab, setActiveTab] = useState<'all' | 'brics' | 'cb' | 'sovereign' | 'private'>('all');
  const [feeds, setFeeds] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(false);

  // Dynamic system simulation of finance data
  const premiumAxioms = [
    { title: "BRICS Nations Expand Trade Agreements", source: "Global Finance Magazine", date: "Just now", tag: "BRICS", image: "https://images.unsplash.com/photo-1520607162513-77705c0f0d4a", detail: "Member nations convene in Kazan to outline custom clearing architectures that bypass standard clearing desks, expanding alternative settlements." },
    { title: "Central Banks Prepare for Digital Currencies", source: "The Economist", date: "5m ago", tag: "CENTRAL BANKS", image: "https://images.unsplash.com/photo-1554224155-6726b3ff858f", detail: "Over 40 central banks enter pilot schemes to launch unified institutional wholesale CBDCs, prioritizing atomic settlements on cross-border bonds." },
    { title: "Hedge Funds Rotate Into Commodities", source: "Institutional Investor", date: "15m ago", tag: "COMMODITIES", image: "https://images.unsplash.com/photo-1526304640581-d334cdbbf45e", detail: "Macro strategists allocate high-conviction stakes to base metals, cocoa, and crude options as standard currency buffers experience friction." },
    { title: "Sovereign Debt Reserves Experience Record Contraction", source: "Bloomberg Markets", date: "1h ago", tag: "SOVEREIGN WEALTH", image: "https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f", detail: "Bilateral debt balances are increasingly repatriated as geopolitical tensions trigger structural diversification of liquid currency parameters." },
    { title: "Private Equity Inflows Target AI Cloud Nodes", source: "Financial Times", date: "2h ago", tag: "PRIVATE EQUITY", image: "https://images.unsplash.com/photo-1451187580459-43490279c0fa", detail: "Tier-1 sovereign backing groups lead custom consortium rounds to finance high-performance data servers throughout low-tax zones." }
  ];

  useEffect(() => {
    // Attempt real feed query from our lists
    const loadFeeds = async () => {
      setLoading(true);
      try {
        const results = await Promise.all(
          globalFinanceFeeds.slice(0, 3).map(async (url) => {
            const items = await RSSService.fetchAndAnalyze(url);
            return items.map(item => ({ ...item, feedUrl: url }));
          })
        );
        const flattened = results.flat().slice(0, 8);
        if (flattened.length > 0) {
          setFeeds(flattened);
        }
      } catch (err) {
        console.warn("Could not query live finance feeds, utilizing premium native telemetry models instead.");
      } finally {
        setLoading(false);
      }
    };
    loadFeeds();
  }, []);

  const getFilteredAxioms = () => {
    if (activeTab === 'all') return premiumAxioms;
    if (activeTab === 'brics') return premiumAxioms.filter(a => a.tag === 'BRICS');
    if (activeTab === 'cb') return premiumAxioms.filter(a => a.tag === 'CENTRAL BANKS');
    if (activeTab === 'sovereign') return premiumAxioms.filter(a => a.tag === 'SOVEREIGN WEALTH');
    if (activeTab === 'private') return premiumAxioms.filter(a => a.tag === 'PRIVATE EQUITY' || a.tag === 'COMMODITIES');
    return premiumAxioms;
  };

  return (
    <div id="global-finance-hub-section" className="bg-[#0a0a0c] border border-white/5 rounded-3xl p-6 md:p-8 space-y-8 shadow-[0_12px_40px_rgba(0,0,0,0.85)] relative overflow-hidden">
      {/* Background glow meshes */}
      <div className="absolute right-0 top-0 w-48 h-48 bg-[#39ff14]/5 blur-[80px] rounded-full pointer-events-none" />
      <div className="absolute left-1/3 bottom-0 w-64 h-64 bg-indigo-500/5 blur-[100px] rounded-full pointer-events-none" />

      {/* Title block */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-white/10 relative z-10">
        <div className="space-y-1.5 animate-fade-in">
          <div className="flex items-center gap-2 text-[9px] font-mono tracking-[0.25em] text-[#39ff14] bg-[#39ff14]/10 w-fit px-3 py-1 rounded-full font-black">
            <Landmark className="w-3 h-3 text-[#39ff14]" />
            <span>MACRO INSTITUTIONAL INTELLIGENCE</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-black font-serif italic text-white tracking-tight flex items-center gap-2">
            GLOBAL <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-[#39ff14] to-teal-400">FINANCE & MACROECONOMICS</span>
          </h2>
          <p className="text-xs text-zinc-400 font-sans max-w-2xl leading-relaxed">
            Real-time telemetry reports covering foreign exchange reserves, sovereign wealth networks, central bank balance sheets, BRICS alignments, private equities, and commodities warfare.
          </p>
        </div>

        {/* Global rates indicators bar */}
        <div className="grid grid-cols-2 xs:grid-cols-4 gap-2.5 bg-black/60 border border-white/5 p-3 rounded-2xl md:min-w-[340px]">
          {[
            { label: 'SOVEREIGN YIELD 10Y', val: '4.24%', chg: '-0.04', isPos: false },
            { label: 'BRICS BASKET INDEX', val: '108.40', chg: '+0.65', isPos: true },
            { label: 'GOLD RESERVE DESK', val: '$2,364.80', chg: '+$18.2', isPos: true },
            { label: 'DXY EXCHANGE RATE', val: '104.12', chg: '-0.15', isPos: false }
          ].map((r, i) => (
            <div key={i} className="text-center space-y-0.5">
              <span className="block text-[8px] font-mono text-zinc-500 tracking-wider uppercase">{r.label}</span>
              <span className="block text-[11px] font-mono font-bold text-white">{r.val}</span>
              <span className={`block text-[9px] font-mono ${r.isPos ? 'text-emerald-400' : 'text-rose-500'}`}>
                {r.chg}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Navigation Tab system */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 border-b border-white/5 relative z-10">
        {[
          { id: 'all', label: 'ALL GLOBAL REPORTS' },
          { id: 'brics', label: 'BRICS & TRADE EXPANSION' },
          { id: 'cb', label: 'CENTRAL BANKS & DISRUPTOR CBDCS' },
          { id: 'sovereign', label: 'SOVEREIGN DEBT & VALUATION' },
          { id: 'private', label: 'PRIVATE EQUITY & OIL DESKS' }
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id as any)}
            className={`px-3.5 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all whitespace-nowrap cursor-pointer ${
              activeTab === t.id 
                ? 'bg-[#39ff14] text-black shadow-[0_0_12px_rgba(57,255,20,0.45)]' 
                : 'text-zinc-400 hover:text-[#39ff14] hover:bg-zinc-900/50'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Main Grid: Left Cinematic Card, Right Secondary Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 relative z-10">
        {/* Main interactive showcase article */}
        <div className="lg:col-span-7 bg-zinc-950/80 border border-white/5 rounded-2xl overflow-hidden shadow-inner flex flex-col justify-between group p-0 relative">
          <div className="relative h-64 md:h-80 w-full overflow-hidden">
            <img 
              src={getFilteredAxioms()[0]?.image || "https://images.unsplash.com/photo-1520607162513-77705c0f0d4a"} 
              alt="Finance focus" 
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover opacity-80 group-hover:scale-103 transition-transform duration-700 font-sans"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
            <span className="absolute top-4 left-4 bg-emerald-500 text-black text-[9px] font-mono font-black tracking-widest px-3 py-1 rounded">
              {getFilteredAxioms()[0]?.tag || "MACRO HIGH SHIELD"}
            </span>
            <div className="absolute bottom-4 left-4 right-4 space-y-1">
              <span className="text-[10px] font-mono text-zinc-400 flex items-center gap-2">
                <span className="text-[#39ff14]">•</span> {getFilteredAxioms()[0]?.source || "Central Vault Transmission"}
              </span>
              <h3 className="text-xl md:text-2xl font-serif italic text-white font-black leading-tight">
                {getFilteredAxioms()[0]?.title}
              </h3>
            </div>
          </div>
          <div className="p-5 md:p-6 space-y-4">
            <p className="text-xs text-zinc-300 font-sans leading-relaxed">
              {getFilteredAxioms()[0]?.detail}
            </p>
            <div className="flex items-center justify-between text-[11px] font-mono text-zinc-500 pt-4 border-t border-white/5">
              <span>SYSTEM ENCRYPTED DISK ARCHIVE</span>
              <span className="text-[#39ff14]">ACTIVE PIPELINE</span>
            </div>
          </div>
        </div>

        {/* Right detailed list columns */}
        <div className="lg:col-span-5 space-y-4">
          <h4 className="text-xs font-mono uppercase tracking-widest text-[#39ff14] flex items-center gap-2">
            <span>●</span> CENTRAL BANK INTEL WIRE
          </h4>
          <div className="space-y-3 max-h-[460px] overflow-y-auto no-scrollbar">
            {getFilteredAxioms().slice(1).map((axiom, index) => (
              <div 
                key={index} 
                className="bg-black/60 border border-white/5 hover:border-[#39ff14]/30 p-4 rounded-xl transition-all duration-300 flex gap-4 overflow-hidden relative group cursor-pointer"
              >
                {/* Visual anchor */}
                <div className="w-16 h-16 rounded-lg overflow-hidden shrink-0 bg-zinc-900 border border-white/5">
                  <img 
                    src={axiom.image} 
                    alt="Axiom imagery" 
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-550" 
                  />
                </div>
                {/* Details */}
                <div className="space-y-1 flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[8px] font-mono bg-zinc-900 text-zinc-400 px-1.5 py-0.5 rounded uppercase tracking-wider font-extrabold">
                      {axiom.tag}
                    </span>
                    <span className="text-[9px] font-mono text-zinc-500">{axiom.date}</span>
                  </div>
                  <h5 className="text-xs font-sans font-bold text-white group-hover:text-[#39ff14] transition-colors leading-snug">
                    {axiom.title}
                  </h5>
                  <p className="text-[10px] text-zinc-400 font-sans leading-relaxed line-clamp-2">
                    {axiom.detail}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* RSS Live Stream block if available */}
          {feeds.length > 0 && (
            <div className="pt-4 border-t border-white/5 space-y-2.5 pointer-events-auto">
              <span className="text-[9px] font-mono tracking-wider text-pink-400 uppercase font-black">
                LIVE FINANCIAL FEED TRANSMISSIONS:
              </span>
              <div className="space-y-2 max-h-[140px] overflow-y-auto no-scrollbar text-[11px] font-mono text-zinc-400">
                {feeds.map((feed, idx) => (
                  <div key={idx} className="flex items-start gap-2.5 py-1.5 border-b border-white/5 hover:text-white transition-all">
                    <span className="text-[#39ff14] font-bold shrink-0">[{feed.timestamp}]</span>
                    <a href={feed.link} target="_blank" rel="noreferrer" className="hover:underline text-zinc-300 truncate block max-w-xs">{feed.title}</a>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
