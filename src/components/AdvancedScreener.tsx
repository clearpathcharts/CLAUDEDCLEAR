import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  SlidersHorizontal, 
  Search, 
  TrendingUp, 
  BarChart3, 
  Database, 
  ChevronRight, 
  Activity, 
  Grid, 
  Tv, 
  Flame, 
  Zap,
  Info
} from 'lucide-react';
import { runScreener, ScreenerResult, ScreenerFilters } from '../lib/trading/screenerEngine';
import { setClearState } from '../lib/trading/clearState';
import MarketScanner from './MarketScanner';

const MOCK_DATA: ScreenerResult[] = [
  { symbol: 'AAPL', pe: 28.5, margin: 0.25, volume: 52000000, price: 182.52, change: 1.2 },
  { symbol: 'TSLA', pe: 42.1, margin: 0.12, volume: 85000000, price: 175.05, change: -2.4 },
  { symbol: 'MSFT', pe: 35.8, margin: 0.32, volume: 22000000, price: 415.10, change: 0.8 },
  { symbol: 'NVDA', pe: 72.4, margin: 0.45, volume: 45000000, price: 820.45, change: 4.5 },
  { symbol: 'AMD', pe: 55.2, margin: 0.18, volume: 38000000, price: 162.30, change: 1.5 },
  { symbol: 'GOOGL', pe: 24.5, margin: 0.24, volume: 18000000, price: 154.20, change: -0.5 },
  { symbol: 'META', pe: 32.1, margin: 0.35, volume: 15000000, price: 495.30, change: 2.1 },
  { symbol: 'AMZN', pe: 58.4, margin: 0.08, volume: 28000000, price: 178.40, change: 0.3 },
];

export default function AdvancedScreener() {
  const [activeLayout, setActiveLayout] = useState<'grid' | 'screener' | 'scanner' | 'movers'>('grid');
  
  const [filters, setFilters] = useState<ScreenerFilters>({
    maxPe: 60,
    minMargin: 0.1,
    minVolume: 10000000
  });
  const [results, setResults] = useState<ScreenerResult[]>(MOCK_DATA);

  useEffect(() => {
    setResults(runScreener(MOCK_DATA, filters));
  }, [filters]);

  // Renders the Stock Screener inner UI
  const renderScreenerContent = (isCompact: boolean = false) => {
    return (
      <div className={`flex flex-col h-full ${isCompact ? 'bg-[#0b0c16]/50 p-4 border border-white/5 rounded-2xl' : 'bg-transparent'}`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <SlidersHorizontal className="w-5 h-5 text-indigo-400" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-white">Market Screener Filters</h3>
          </div>
          <div className="text-[10px] font-mono text-indigo-400 uppercase">
            matches: <span className="text-white font-black">{results.length}</span>
          </div>
        </div>

        {/* Sliders Grid */}
        <div className={`grid ${isCompact ? 'grid-cols-1 md:grid-cols-3' : 'grid-cols-3'} gap-4 mb-4`}>
          <div className="space-y-1 bg-white/[0.01] p-2.5 rounded-xl border border-white/[0.03]">
            <label className="text-[9px] font-black uppercase text-gray-500 tracking-widest flex justify-between">
              <span>Max P/E Ratio</span>
              <span className="text-white">{filters.maxPe}</span>
            </label>
            <input 
              type="range" min="10" max="100" step="5"
              value={filters.maxPe}
              onChange={e => setFilters({...filters, maxPe: parseInt(e.target.value)})}
              className="w-full accent-indigo-500 cursor-pointer h-1 bg-zinc-800 rounded-lg appearance-none"
            />
          </div>
          <div className="space-y-1 bg-white/[0.01] p-2.5 rounded-xl border border-white/[0.03]">
            <label className="text-[9px] font-black uppercase text-gray-500 tracking-widest flex justify-between">
              <span>Min Margin</span>
              <span className="text-white">{(filters.minMargin * 100).toFixed(0)}%</span>
            </label>
            <input 
              type="range" min="0" max="0.5" step="0.05"
              value={filters.minMargin}
              onChange={e => setFilters({...filters, minMargin: parseFloat(e.target.value)})}
              className="w-full accent-emerald-500 cursor-pointer h-1 bg-zinc-800 rounded-lg appearance-none"
            />
          </div>
          <div className="space-y-1 bg-white/[0.01] p-2.5 rounded-xl border border-white/[0.03]">
            <label className="text-[9px] font-black uppercase text-gray-500 tracking-widest flex justify-between">
              <span>Min Volume</span>
              <span className="text-white">{(filters.minVolume / 1000000).toFixed(0)}M</span>
            </label>
            <input 
              type="range" min="0" max="100000000" step="10000000"
              value={filters.minVolume}
              onChange={e => setFilters({...filters, minVolume: parseInt(e.target.value)})}
              className="w-full accent-amber-500 cursor-pointer h-1 bg-zinc-800 rounded-lg appearance-none"
            />
          </div>
        </div>

        {/* Results table-style rows scroll container */}
        <div className="flex-1 overflow-y-auto space-y-1.5 pr-1.5 custom-scrollbar min-h-[300px]">
          {results.sort((a,b) => b.change - a.change).map((asset, i) => (
            <motion.div 
              key={asset.symbol}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className="p-3 rounded-xl bg-white/[0.02] border border-white/5 hover:border-indigo-500/30 hover:bg-white/[0.04] transition-all flex items-center justify-between group cursor-pointer"
              onClick={() => setClearState({ selectedAsset: asset.symbol })}
            >
              <div className="flex items-center gap-4">
                 <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center font-black text-[10px] text-indigo-400 group-hover:bg-indigo-500 group-hover:text-white transition-all border border-indigo-500/20">
                   {asset.symbol.substring(0, 2)}
                 </div>
                 <div>
                    <div className="text-xs font-bold text-white group-hover:text-indigo-400 transition-colors">{asset.symbol}</div>
                    <div className="flex items-center gap-2.5 text-[8px] font-mono uppercase text-gray-500 mt-0.5">
                      <span className="flex items-center gap-1"><Database className="w-2.5 h-2.5" /> PE: {asset.pe}</span>
                      <span className="flex items-center gap-1"><Activity className="w-2.5 h-2.5" /> MRG: {(asset.margin * 100).toFixed(0)}%</span>
                    </div>
                 </div>
              </div>

              <div className="flex items-center gap-4">
                 <div className="text-right">
                    <div className="text-xs font-mono font-bold text-white">${asset.price.toFixed(2)}</div>
                    <div className={`text-[9px] font-black tracking-tighter ${asset.change > 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {asset.change > 0 ? '+' : ''}{asset.change}%
                    </div>
                 </div>
                 <button className="w-6 h-6 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-indigo-500/20 transition-all">
                   <ChevronRight className="w-3.5 h-3.5 text-gray-400 group-hover:text-indigo-400" />
                 </button>
              </div>
            </motion.div>
          ))}
          {results.length === 0 && (
            <div className="text-center py-12 text-xs font-mono text-zinc-500 border border-white/5 rounded-2xl bg-black/10">
              No matching assets discovered with active parameters.
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="p-4 md:p-6 bg-black/40 backdrop-blur-xl rounded-2xl md:rounded-3xl border border-white/5 h-full flex flex-col gap-4 overflow-hidden">
      {/* Header and Controller Area */}
      <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-4 border-b border-white/5 pb-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30">
            <SlidersHorizontal className="w-5 h-5 text-indigo-400 animate-pulse" />
          </div>
          <div>
            <h2 className="text-base md:text-lg font-black uppercase tracking-widest text-white italic">Clear Path Market Screener Suite</h2>
            <p className="text-[10px] md:text-xs text-indigo-300 font-mono uppercase tracking-wider">
              REAL-TIME MARKET SCANNING, SYSTEMATIC SCREENING & STATISTICAL INSIGHTS
            </p>
          </div>
        </div>

        {/* SEGMENTED SWITCH DECK */}
        <div className="flex bg-black border border-white/10 p-1 rounded-xl shrink-0 font-mono text-[10px] items-center gap-1 overflow-x-auto no-scrollbar">
          <button 
            type="button"
            onClick={() => setActiveLayout('grid')}
            className={`px-3 py-1.5 rounded-lg font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 tracking-wider uppercase whitespace-nowrap
              ${activeLayout === 'grid' 
                ? 'bg-indigo-500 text-white shadow-[0_0_12px_rgba(99,102,241,0.5)]' 
                : 'text-zinc-400 hover:text-white hover:bg-white/5'}`}
          >
            <Grid className="w-3 h-3" />
            GRID OVERVIEW
          </button>
          
          <button 
            type="button"
            onClick={() => setActiveLayout('screener')}
            className={`px-3 py-1.5 rounded-lg font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 tracking-wider uppercase whitespace-nowrap
              ${activeLayout === 'screener' 
                ? 'bg-indigo-500 text-white shadow-[0_0_12px_rgba(99,102,241,0.5)]' 
                : 'text-zinc-400 hover:text-white hover:bg-white/5'}`}
          >
            <SlidersHorizontal className="w-3 h-3" />
            STOCK SCREENER
          </button>

          <button 
            type="button"
            onClick={() => setActiveLayout('scanner')}
            className={`px-3 py-1.5 rounded-lg font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 tracking-wider uppercase whitespace-nowrap
              ${activeLayout === 'scanner' 
                ? 'bg-indigo-500 text-white shadow-[0_0_12px_rgba(99,102,241,0.5)]' 
                : 'text-zinc-400 hover:text-white hover:bg-white/5'}`}
          >
            <Activity className="w-3 h-3" />
            LIVE SCANNER
          </button>

          <button 
            type="button"
            onClick={() => setActiveLayout('movers')}
            className={`px-3 py-1.5 rounded-lg font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 tracking-wider uppercase whitespace-nowrap
              ${activeLayout === 'movers' 
                ? 'bg-indigo-500 text-white shadow-[0_0_12px_rgba(99,102,241,0.5)]' 
                : 'text-zinc-400 hover:text-white hover:bg-white/5'}`}
          >
            <Flame className="w-3 h-3" />
            HOT MOVERS
          </button>
        </div>
      </div>

      {/* RENDER MODIFIED LAYOUTS */}
      <div className="flex-1 w-full overflow-hidden">
        {activeLayout === 'grid' && (
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 h-full overflow-y-auto pr-1">
            {/* COLUMN 1: Stock Screener Panel */}
            <div className="xl:col-span-6 flex flex-col h-full min-h-[500px]">
              {renderScreenerContent(true)}
            </div>

            {/* COLUMN 2: Scanners + Movers Panel */}
            <div className="xl:col-span-6 flex flex-col gap-4 h-full min-h-[500px]">
              {/* TOP: Market scanner */}
              <div className="flex-1 min-h-[300px]">
                <MarketScanner />
              </div>

              {/* BOTTOM: Hot Movers Iframe Embedding */}
              <div className="h-[300px] rounded-2xl overflow-hidden border border-white/5 bg-[#0a0a14]/50 p-4 flex flex-col">
                <div className="flex items-center justify-between mb-3 shrink-0">
                  <div className="flex items-center gap-2">
                    <Flame className="w-4 h-4 text-amber-500" />
                    <span className="text-xs font-black uppercase text-white tracking-wider">TradingView Hot Movers</span>
                  </div>
                  <div className="text-[9px] font-mono text-zinc-500 uppercase">Live Index Feedback</div>
                </div>
                <div className="flex-1 rounded-xl overflow-hidden bg-black/40 border-0">
                  <iframe 
                    src="https://s.tradingview.com/embed-widget/hotlists/?locale=en&colorTheme=dark&isTransparent=true&showSymbolLogo=true"
                    className="w-full h-full min-h-0"
                    frameBorder="0"
                    style={{ border: 'none' }}
                    scrolling="yes"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Solo View: Screener Only */}
        {activeLayout === 'screener' && (
          <div className="h-full flex flex-col bg-[#0b0c16]/30 p-6 border border-white/5 rounded-3xl">
            <div className="mb-4 bg-[#8b5cf6]/5 border border-[#8b5cf6]/10 p-4 rounded-xl flex items-start gap-3">
              <Info className="w-4 h-4 text-indigo-400 mt-0.5 shrink-0" />
              <p className="text-[11px] text-zinc-300 leading-relaxed font-mono uppercase tracking-tight">
                Stock Screener filters stocks based on live parameters. Use the inputs to tweak your maximum allowed PE Multiple and keep your risk allocation optimal. Clicks on rows update your Clear Path charts.
              </p>
            </div>
            {renderScreenerContent(false)}
          </div>
        )}

        {/* Solo View: Live Scanner Only */}
        {activeLayout === 'scanner' && (
          <div className="h-full bg-[#0b0c16]/30 border border-white/5 rounded-3xl overflow-hidden">
            <MarketScanner />
          </div>
        )}

        {/* Solo View: Hot Movers Only */}
        {activeLayout === 'movers' && (
          <div className="h-full flex flex-col bg-[#0b0c16]/30 p-6 border border-white/5 rounded-3xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Flame className="w-5 h-5 text-amber-500" />
                <h3 className="text-sm font-bold uppercase tracking-wider text-white">Institutional Hotlist</h3>
              </div>
              <span className="text-[10px] font-mono text-zinc-400 uppercase">Interactive TradingView Frame</span>
            </div>
            <div className="flex-1 rounded-2xl overflow-hidden bg-black/40">
              <iframe 
                src="https://s.tradingview.com/embed-widget/hotlists/?locale=en&colorTheme=dark&isTransparent=true&showSymbolLogo=true"
                className="w-full h-full min-h-[500px]"
                frameBorder="0"
                style={{ border: 'none' }}
                scrolling="yes"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
