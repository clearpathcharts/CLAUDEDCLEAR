import React, { useState, useEffect } from 'react';
import { Star, Plus, Trash2, TrendingUp, TrendingDown, ExternalLink } from 'lucide-react';
import { TradingHaltController } from '../../truth/TradingHaltController';
import { useMembership } from '../../hooks/useMembership';
import { formatLimit, isUnlimited } from '../../lib/planCatalog';
import { useLiveQuotes, formatPct, DATA_UNAVAILABLE } from '../../hooks/useLiveQuotes';

type AssetType = 'STOCKS' | 'FOREX' | 'CRYPTO' | 'COMMODITIES';

interface WatchlistItem {
  symbol: string;
  name: string;
  type: AssetType;
}

const STORAGE_KEY = 'cp_watchlist_symbols_v2';
const LEGACY_STORAGE_KEY = 'cp_watchlist_items';

const DEFAULT_WATCHLIST: WatchlistItem[] = [
  { symbol: 'BTCUSD', name: 'Bitcoin / US Dollar', type: 'CRYPTO' },
  { symbol: 'NVDA', name: 'NVIDIA Corporation', type: 'STOCKS' },
  { symbol: 'EURUSD', name: 'Euro / US Dollar', type: 'FOREX' },
  { symbol: 'XAUUSD', name: 'Gold / US Dollar', type: 'COMMODITIES' },
  { symbol: 'AAPL', name: 'Apple Inc.', type: 'STOCKS' },
];

/** Vendor pair format: BTCUSD → BTC/USD for non-equity six-letter pairs. */
function toQuoteSymbol(item: WatchlistItem): string {
  const s = item.symbol.toUpperCase().trim();
  if (item.type !== 'STOCKS' && !s.includes('/') && /^[A-Z]{6}$/.test(s)) {
    return `${s.slice(0, 3)}/${s.slice(3)}`;
  }
  return s;
}

function loadWatchlist(): WatchlistItem[] {
  const parse = (raw: string | null): WatchlistItem[] | null => {
    if (!raw) return null;
    try {
      const arr = JSON.parse(raw);
      if (!Array.isArray(arr)) return null;
      return arr
        .filter((x) => x && typeof x.symbol === 'string')
        .map((x) => ({ symbol: String(x.symbol), name: String(x.name || x.symbol), type: (x.type || 'STOCKS') as AssetType }));
    } catch {
      return null;
    }
  };
  // Legacy entries carried locally invented prices; only their symbols survive the migration.
  return parse(localStorage.getItem(STORAGE_KEY)) ?? parse(localStorage.getItem(LEGACY_STORAGE_KEY)) ?? DEFAULT_WATCHLIST;
}

export default function WatchlistView({ selectFileNode }: { selectFileNode: (f: string) => void }) {
  const { limits } = useMembership();
  const [halted, setHalted] = useState(TradingHaltController.isHalted());
  const [haltReason, setHaltReason] = useState(TradingHaltController.getHaltReason());

  useEffect(() => {
    return TradingHaltController.subscribe((isHalted, reason) => {
      setHalted(isHalted);
      setHaltReason(reason);
    });
  }, []);

  const [watchlist, setWatchlist] = useState<WatchlistItem[]>(loadWatchlist);
  const [newSymbol, setNewSymbol] = useState('');
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState<AssetType>('STOCKS');
  const [filterType, setFilterType] = useState<'ALL' | AssetType>('ALL');
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(watchlist));
    localStorage.removeItem(LEGACY_STORAGE_KEY);
  }, [watchlist]);

  const { get: getQuote, updatedAt } = useLiveQuotes(watchlist.map(toQuoteSymbol));

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const symbol = newSymbol.toUpperCase().trim();
    if (!symbol) return;
    if (!isUnlimited(limits.watchlists) && watchlist.length >= limits.watchlists) return;
    if (watchlist.some((w) => w.symbol === symbol)) return;

    setWatchlist((prev) => [...prev, { symbol, name: newName.trim() || symbol, type: newType }]);
    setNewSymbol('');
    setNewName('');
    setIsAdding(false);
  };

  const handleRemove = (sym: string) => {
    setWatchlist((prev) => prev.filter((item) => item.symbol !== sym));
  };

  const filteredList = watchlist.filter((item) => filterType === 'ALL' || item.type === filterType);

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
            Prices come from the live market data feed and refresh every minute. A symbol the feed cannot price shows {DATA_UNAVAILABLE} — nothing is estimated.
          </p>
          <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">
            Source: ClearPath market feed (Twelve Data){updatedAt ? ` · updated ${updatedAt.toLocaleTimeString()}` : ''}
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
          onClick={() => {
            if (!isUnlimited(limits.watchlists) && watchlist.length >= limits.watchlists) return;
            setIsAdding(!isAdding);
          }}
          disabled={!isUnlimited(limits.watchlists) && watchlist.length >= limits.watchlists}
          className="w-full sm:w-auto px-4 py-2 bg-[#00D9FF] hover:bg-cyan-400 text-black font-black text-[10.5px] tracking-wider uppercase rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-40"
        >
          <Plus className="w-4 h-4 text-black" />
          <span>Track New Asset ({watchlist.length}/{formatLimit(limits.watchlists)})</span>
        </button>
      </div>

      {/* Add Position Slide Down form */}
      {isAdding && (
        <form onSubmit={handleAdd} className="p-6 bg-black/80 border border-[#00D9FF]/20 rounded-2xl grid grid-cols-1 md:grid-cols-3 gap-4 animate-scaleUp">
          <div className="flex flex-col gap-1.5">
            <label className="text-[9px] font-mono font-black uppercase text-zinc-500">Asset Symbol</label>
            <input
              type="text"
              required
              placeholder="e.g. AMZN or GBPUSD"
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
            <label className="text-[9px] font-mono font-black uppercase text-zinc-500">Asset Category</label>
            <select
              value={newType}
              onChange={(e) => setNewType(e.target.value as AssetType)}
              className="w-full bg-black border border-white/10 rounded-xl px-3 py-2.5 text-xs text-zinc-400 outline-none focus:border-[#00D9FF]"
            >
              <option value="STOCKS">STOCKS (Corporation)</option>
              <option value="FOREX">FOREX (Currencies)</option>
              <option value="CRYPTO">CRYPTO (Blockchain)</option>
              <option value="COMMODITIES">COMMODITIES (Hard Assets)</option>
            </select>
          </div>
          <div className="md:col-span-3 flex justify-end gap-3 mt-2">
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
          const quote = getQuote(toQuoteSymbol(item));
          const digits = item.type === 'FOREX' ? 4 : 2;
          const fmt = (n: number | null) =>
            n == null ? DATA_UNAVAILABLE : `${item.type === 'FOREX' ? '' : '$'}${n.toLocaleString(undefined, { minimumFractionDigits: digits, maximumFractionDigits: digits })}`;
          const pct = quote?.percentChange ?? null;
          const isUp = (pct ?? 0) >= 0;
          const tone = pct == null ? 'text-zinc-300' : isUp ? 'text-green-400' : 'text-red-400';
          return (
            <div
              key={item.symbol}
              className="relative p-6 bg-black/60 border border-white/5 hover:border-cyan-500/20 bg-gradient-to-r from-cyan-950/5 to-transparent rounded-3xl flex flex-col gap-4 transition-all hover:scale-[1.01]"
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="px-2 py-0.5 border border-white/15 bg-white/5 rounded text-[7.5px] font-mono text-zinc-400 uppercase tracking-wider font-bold">
                    {item.type}
                  </span>
                  <h3 className="text-lg font-black text-white uppercase tracking-tight mt-1.5">{item.symbol}</h3>
                  <span className="text-[10px] text-zinc-400 leading-none">{item.name}</span>
                </div>

                <div className="text-right">
                  <div className={`text-sm font-mono font-bold ${tone}`}>{fmt(quote?.price ?? null)}</div>
                  {pct != null && (
                    <div className={`inline-flex items-center gap-1 text-[9.5px] font-bold font-mono mt-0.5 ${isUp ? 'text-green-500' : 'text-red-500'}`}>
                      {isUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                      <span>{formatPct(pct)}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center border-t border-white/5 pt-3.5 select-none font-mono text-[9px]">
                <div className="flex flex-col">
                  <span className="text-zinc-500">OPEN</span>
                  <span className="text-white font-bold mt-0.5">{fmt(quote?.open ?? null)}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-zinc-500">DAY HIGH</span>
                  <span className="text-white font-bold mt-0.5">{fmt(quote?.high ?? null)}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-zinc-500">DAY LOW</span>
                  <span className="text-white font-bold mt-0.5">{fmt(quote?.low ?? null)}</span>
                </div>
              </div>

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
