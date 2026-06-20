import React, { useState, useEffect } from 'react';
import { Star, Plus, Trash2, TrendingUp, TrendingDown, RefreshCw, Layers, ExternalLink, Shield } from 'lucide-react';
import { TradingHaltController } from '../../truth/TradingHaltController';

interface WatchlistItem {
  symbol: string;
  name: string;
  type: 'STOCKS' | 'FOREX' | 'CRYPTO' | 'COMMODITIES';
  price: number;
  change: number;
  high: number;
  low: number;
  volume: string;
  history: number[];
}

export default function WatchlistView({ selectFileNode }: { selectFileNode: (f: string) => void }) {
  const [halted, setHalted] = useState(TradingHaltController.isHalted());
  const [haltReason, setHaltReason] = useState(TradingHaltController.getHaltReason());

  useEffect(() => {
    return TradingHaltController.subscribe((isHalted, reason) => {
      setHalted(isHalted);
      setHaltReason(reason);
    });
  }, []);

  const [watchlist, setWatchlist] = useState<WatchlistItem[]>(() => {
    const saved = localStorage.getItem('cp_watchlist_items');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // Fallback default
      }
    }
    return [
      { symbol: 'BTCUSD', name: 'Bitcoin / US Dollar', type: 'CRYPTO', price: 67482.50, change: 3.42, high: 68100, low: 65200, volume: '24.1B', history: [65200, 65800, 66100, 65900, 66400, 67100, 67482] },
      { symbol: 'NVDA', name: 'NVIDIA Corporation', type: 'STOCKS', price: 115.42, change: 5.18, high: 116.80, low: 109.50, volume: '5.2B', history: [109.5, 111.0, 112.5, 110.8, 113.2, 114.9, 115.42] },
      { symbol: 'EURUSD', name: 'Euro / US Dollar', type: 'FOREX', price: 1.0854, change: -0.15, high: 1.0890, low: 1.0830, volume: '98.5B', history: [1.088, 1.087, 1.086, 1.084, 1.085, 1.0845, 1.0854] },
      { symbol: 'XAUUSD', name: 'Gold / US Dollar', type: 'COMMODITIES', price: 2342.80, change: 1.25, high: 2355.0, low: 2315.0, volume: '12.4B', history: [2315, 2322, 2328, 2324, 2335, 2340, 2342.8] },
      { symbol: 'AAPL', name: 'Apple Inc.', type: 'STOCKS', price: 189.84, change: 0.85, high: 191.20, low: 188.40, volume: '3.1B', history: [188.4, 189.0, 189.2, 188.9, 189.5, 189.6, 189.84] }
    ];
  });

  const [newSymbol, setNewSymbol] = useState('');
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState<'STOCKS' | 'FOREX' | 'CRYPTO' | 'COMMODITIES'>('STOCKS');
  const [newPrice, setNewPrice] = useState('');
  const [filterType, setFilterType] = useState<'ALL' | 'STOCKS' | 'FOREX' | 'CRYPTO' | 'COMMODITIES'>('ALL');
  const [isAdding, setIsAdding] = useState(false);

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem('cp_watchlist_items', JSON.stringify(watchlist));
  }, [watchlist]);

  // Small real-time simulation tick
  useEffect(() => {
    const timer = setInterval(() => {
      setWatchlist((prev) =>
        prev.map((item) => {
          const changePercent = (Math.random() - 0.495) * 0.4; // slight upward drift
          const delta = item.price * (changePercent / 100);
          const nextPrice = parseFloat((item.price + delta).toFixed(item.type === 'FOREX' ? 4 : 2));
          const nextHigh = Math.max(item.high, nextPrice);
          const nextLow = Math.min(item.low, nextPrice);
          const accumulatedHistory = [...item.history.slice(-15), nextPrice];
          const calculatedChange = parseFloat((item.change + changePercent).toFixed(2));
          
          return {
            ...item,
            price: nextPrice,
            change: calculatedChange,
            high: nextHigh,
            low: nextLow,
            history: accumulatedHistory
          };
        })
      );
    }, 4500);

    return () => clearInterval(timer);
  }, []);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSymbol) return;

    const priceNum = parseFloat(newPrice) || 100.00;
    const addedItem: WatchlistItem = {
      symbol: newSymbol.toUpperCase().trim(),
      name: newName.trim() || `${newSymbol.toUpperCase()} Security Asset`,
      type: newType,
      price: priceNum,
      change: 0.00,
      high: priceNum,
      low: priceNum,
      volume: '150M',
      history: [priceNum, priceNum, priceNum, priceNum, priceNum, priceNum, priceNum]
    };

    setWatchlist((prev) => [...prev, addedItem]);
    setNewSymbol('');
    setNewName('');
    setNewPrice('');
    setIsAdding(false);
  };

  const handleRemove = (sym: string) => {
    setWatchlist((prev) => prev.filter((item) => item.symbol !== sym));
  };

  const filteredList = watchlist.filter((item) => filterType === 'ALL' || item.type === filterType);

  // Generate simple inline Sparkline SVG path
  const getSparklinePath = (hist: number[], width = 120, height = 30) => {
    if (hist.length < 2) return '';
    const minVal = Math.min(...hist);
    const maxVal = Math.max(...hist);
    const valRange = maxVal - minVal === 0 ? 1 : maxVal - minVal;

    return hist
      .map((val, idx) => {
        const x = (idx / (hist.length - 1)) * width;
        const y = height - ((val - minVal) / valRange) * height;
        return `${idx === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
      })
      .join(' ');
  };

  if (halted) {
    return (
      <div className="w-full h-full min-h-[400px] flex flex-col items-center justify-center bg-[#050505]/95 rounded-3xl border border-red-900/30 border-dashed p-8 text-center backdrop-blur-md">
        <span className="text-red-500 font-extrabold uppercase tracking-widest text-lg mb-2">🔴 CRITICAL SYSTEM HALT DETECTED</span>
        <p className="text-xs text-zinc-400 font-mono uppercase max-w-sm">{haltReason || 'ALL WATCHLIST MODULES BLANKED INDEFINITELY'}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 font-sans select-none animate-fadeIn">
      {/* Header Banner */}
      <div className="p-8 bg-gradient-to-r from-cyan-950/20 to-black/80 border border-cyan-500/20 rounded-3xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-cyan-500/5 rounded-full blur-[100px] pointer-events-none" />
        <div className="relative z-10 flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-cyan-400 rounded-full animate-ping" />
            <span className="text-[10px] font-mono tracking-widest text-[#00D9FF] font-black uppercase">LIVE OBSERVATORY WATCHLIST</span>
          </div>
          <h2 className="text-2xl font-black text-white uppercase tracking-tight">ACTIVE RESEARCH WATCHLIST</h2>
          <p className="text-zinc-400 text-xs leading-relaxed max-w-3xl font-medium">
            Monitor real-time high-volatility financial instruments. Add public corporations, sovereign yields, crypto models, or commodity benchmarks to synchronize current learning sessions with global pricing matrices.
          </p>
        </div>
      </div>

      {/* Control filters bar */}
      <div className="flex flex-col sm:flex-row gap-3 justify-between items-center bg-black/40 border border-white/5 p-4 rounded-2xl">
        <div className="flex flex-wrap items-center gap-2">
          {(['ALL', 'STOCKS', 'FOREX', 'CRYPTO', 'COMMODITIES'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setFilterType(t)}
              className={`px-3 py-1.5 rounded-lg text-[9.5px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                filterType === t 
                  ? 'bg-cyan-500 text-black font-black shadow-[0_0_10px_rgba(0,217,255,0.3)]' 
                  : 'bg-white/5 border border-white/5 text-zinc-400 hover:text-white hover:bg-white/10'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <button
          onClick={() => setIsAdding(!isAdding)}
          className="w-full sm:w-auto px-4 py-2 bg-[#00D9FF] hover:bg-cyan-400 text-black font-black text-[10.5px] tracking-wider uppercase rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4 text-black" />
          <span>Track New Asset</span>
        </button>
      </div>

      {/* Add Position Slide Down form */}
      {isAdding && (
        <form onSubmit={handleAdd} className="p-6 bg-black/80 border border-[#00D9FF]/20 rounded-2xl grid grid-cols-1 md:grid-cols-4 gap-4 animate-scaleUp">
          <div className="flex flex-col gap-1.5">
            <label className="text-[9px] font-mono font-black uppercase text-zinc-500">Asset Symbol</label>
            <input
              type="text"
              required
              placeholder="e.g. AMZN"
              value={newSymbol}
              onChange={(e) => setNewSymbol(e.target.value)}
              className="w-full bg-black border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white uppercase outline-none focus:border-[#00D9FF]"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[9px] font-mono font-black uppercase text-zinc-500">Full Name</label>
            <input
              type="text"
              placeholder="e.g. Amazon.com Inc."
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="w-full bg-black border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white outline-none focus:border-[#00D9FF]"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[9px] font-mono font-black uppercase text-zinc-500">Base Price</label>
            <input
              type="number"
              step="any"
              required
              placeholder="e.g. 180.50"
              value={newPrice}
              onChange={(e) => setNewPrice(e.target.value)}
              className="w-full bg-black border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white outline-none focus:border-[#00D9FF]"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[9px] font-mono font-black uppercase text-zinc-500">Asset Category</label>
            <select
              value={newType}
              onChange={(e) => setNewType(e.target.value as any)}
              className="w-full bg-black border border-white/10 rounded-xl px-3 py-2.5 text-xs text-zinc-400 outline-none focus:border-[#00D9FF]"
            >
              <option value="STOCKS">STOCKS (Corporation)</option>
              <option value="FOREX">FOREX (Currencies)</option>
              <option value="CRYPTO">CRYPTO (Blockchain)</option>
              <option value="COMMODITIES">COMMODITIES (Hard Assets)</option>
            </select>
          </div>
          <div className="md:col-span-4 flex justify-end gap-3 mt-2">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="px-4 py-2 border border-white/10 hover:bg-white/5 rounded-xl text-zinc-400 text-xs font-bold uppercase transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 text-black font-black text-xs uppercase tracking-wider rounded-xl transition-all"
            >
              Track Asset In Watchlist
            </button>
          </div>
        </form>
      )}

      {/* Grid of watch items */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredList.map((item) => {
          const isUp = item.change >= 0;
          return (
            <div
              key={item.symbol}
              className="relative p-6 bg-black/60 border border-white/5 hover:border-cyan-500/20 bg-gradient-to-r from-cyan-950/5 to-transparent rounded-3xl flex flex-col gap-4 transition-all hover:scale-[1.01]"
            >
              {/* Card top */}
              <div className="flex items-start justify-between">
                <div>
                  <span className="px-2 py-0.5 border border-white/15 bg-white/5 rounded text-[7.5px] font-mono text-zinc-400 uppercase tracking-wider font-bold">
                    {item.type}
                  </span>
                  <h3 className="text-lg font-black text-white uppercase tracking-tight mt-1.5">{item.symbol}</h3>
                  <span className="text-[10px] text-zinc-400 leading-none">{item.name}</span>
                </div>

                <div className="text-right">
                  <div className={`text-sm font-mono font-bold ${isUp ? 'text-green-400' : 'text-red-400'}`}>
                    ${item.price.toLocaleString(undefined, { minimumFractionDigits: item.type === 'FOREX' ? 4 : 2, maximumFractionDigits: item.type === 'FOREX' ? 4 : 2 })}
                  </div>
                  <div className={`inline-flex items-center gap-1 text-[9.5px] font-bold font-mono mt-0.5 ${isUp ? 'text-green-500' : 'text-red-500'}`}>
                    {isUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    <span>{isUp ? '+' : ''}{item.change.toFixed(2)}%</span>
                  </div>
                </div>
              </div>

              {/* Sparklines Visual */}
              <div className="my-2 p-2 bg-black/45 hover:bg-black/60 border border-white/5 rounded-2xl flex items-center justify-between relative overflow-hidden h-14">
                <span className="text-[8px] font-mono text-zinc-500 uppercase tracking-widest font-black self-start">Historical Flow</span>
                
                <svg className="w-[120px] h-[35px]" viewBox="0 0 120 35">
                  <path
                    d={getSparklinePath(item.history, 120, 30)}
                    fill="none"
                    stroke={isUp ? '#4ade80' : '#f87171'}
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="drop-shadow-[0_0_4px_rgba(74,222,128,0.3)]"
                  />
                </svg>
              </div>

              {/* High/Low volumes */}
              <div className="grid grid-cols-3 gap-2 text-center border-t border-white/5 pt-3.5 select-none font-mono text-[9px]">
                <div className="flex flex-col">
                  <span className="text-zinc-500">24H HIGH</span>
                  <span className="text-white font-bold mt-0.5">${item.high.toLocaleString()}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-zinc-500">24H LOW</span>
                  <span className="text-white font-bold mt-0.5">${item.low.toLocaleString()}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-zinc-500">VOLUME</span>
                  <span className="text-cyan-400 font-bold mt-0.5">{item.volume}</span>
                </div>
              </div>

              {/* Actions row */}
              <div className="flex items-center justify-between border-t border-white/5 pt-3 mt-1.5">
                <button
                  onClick={() => selectFileNode('master-index.html')}
                  className="px-2.5 py-1 text-[8.5px] font-mono text-cyan-400 hover:text-white border border-cyan-400/20 hover:bg-cyan-400/10 rounded-lg flex items-center gap-1 cursor-pointer transition-all uppercase"
                >
                  <ExternalLink className="w-3 h-3" />
                  <span>Analyze in Atlas</span>
                </button>

                <button
                  onClick={() => handleRemove(item.symbol)}
                  className="p-1 px-2.5 text-zinc-600 hover:text-red-500 hover:bg-red-500/10 border border-transparent rounded-lg transition-all cursor-pointer text-[8px] font-bold tracking-wider uppercase font-mono flex items-center gap-1.5"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Untrack</span>
                </button>
              </div>
            </div>
          );
        })}

        {filteredList.length === 0 && (
          <div className="col-span-full py-16 text-center text-zinc-500 border border-dashed border-white/10 rounded-3xl flex flex-col items-center justify-center gap-3">
            <Star className="w-8 h-8 text-zinc-700 animate-spin" style={{ animationDuration: '10s' }} />
            <p className="font-mono text-xs uppercase tracking-widest leading-relaxed">
              No matching assets tracked.<br/>Add symbols above to feed the sensory streams.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
