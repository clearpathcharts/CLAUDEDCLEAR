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
  const [feeds, setFeeds] = useState<FeedItem[]>([]);
  const [openFeed, setOpenFeed] = useState<FeedItem | null>(null);
  const [loading, setLoading] = useState(false);

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
        console.warn("Could not query live finance feeds; showing the empty state.");
      } finally {
        setLoading(false);
      }
    };
    loadFeeds();
  }, []);

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

      </div>

      <div className="grid grid-cols-1 gap-6 relative z-10">
        <div className="space-y-4">
          {loading && feeds.length === 0 && (
            <p className="text-xs font-mono uppercase tracking-widest text-zinc-500">Loading live finance feeds…</p>
          )}
          {!loading && feeds.length === 0 && (
            <p className="text-xs font-mono uppercase tracking-widest text-zinc-500">
              No live finance headlines right now. Nothing is shown in their place.
            </p>
          )}
          {/* RSS Live Stream block if available */}
          {feeds.length > 0 && (
            <div className="pt-4 border-t border-white/5 space-y-2.5 pointer-events-auto">
              <span className="text-[9px] font-mono tracking-wider text-pink-400 uppercase font-black">
                LIVE FINANCIAL FEED TRANSMISSIONS:
              </span>
              {openFeed ? (
                <div className="rounded-xl border border-white/10 bg-black/60 p-3 space-y-2">
                  <button type="button" onClick={() => setOpenFeed(null)} className="text-[9px] font-mono uppercase tracking-widest text-zinc-500 hover:text-white">
                    Back to the wire
                  </button>
                  <p className="text-sm font-bold text-white">{openFeed.title}</p>
                  <p className="text-[11px] text-zinc-400 leading-relaxed">{openFeed.description || 'Shown on Your World Connected.'}</p>
                </div>
              ) : null}
              <div className="space-y-2 max-h-[140px] overflow-y-auto no-scrollbar text-[11px] font-mono text-zinc-400">
                {feeds.map((feed, idx) => (
                  <div key={idx} className="flex items-start gap-2.5 py-1.5 border-b border-white/5 hover:text-white transition-all">
                    <span className="text-[#39ff14] font-bold shrink-0">[{feed.timestamp}]</span>
                    <button type="button" onClick={() => setOpenFeed(feed)} className="text-left text-zinc-300 hover:text-white truncate block max-w-xs">
                      {feed.title}
                    </button>
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
