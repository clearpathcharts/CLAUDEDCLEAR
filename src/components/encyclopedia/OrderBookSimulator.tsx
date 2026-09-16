import React, { useState, useEffect } from 'react';
import { Play, TrendingUp, DollarSign, Activity, Settings, RefreshCw, Layers } from 'lucide-react';

interface Order {
  id: string;
  price: number;
  size: number;
  total: number;
  type: 'bid' | 'ask';
  isUser?: boolean;
}

export default function OrderBookSimulator() {
  const [bids, setBids] = useState<Order[]>([]);
  const [asks, setAsks] = useState<Order[]>([]);
  const [lastPrice, setLastPrice] = useState<number>(100.00);
  const [priceChange, setPriceChange] = useState<'up' | 'down' | 'neutral'>('neutral');

  // Input states
  const [tradeType, setTradeType] = useState<'buy' | 'sell'>('buy');
  const [orderType, setOrderType] = useState<'market' | 'limit'>('limit');
  const [limitPrice, setLimitPrice] = useState<number>(100.00);
  const [orderSize, setOrderSize] = useState<number>(10);
  const [log, setLog] = useState<string[]>([]);

  // Initialize order book
  const resetBook = () => {
    const initialBids: Order[] = [
      { id: 'b1', price: 99.50, size: 25, total: 25, type: 'bid' },
      { id: 'b2', price: 99.00, size: 40, total: 65, type: 'bid' },
      { id: 'b3', price: 98.50, size: 60, total: 125, type: 'bid' },
      { id: 'b4', price: 98.00, size: 100, total: 225, type: 'bid' },
      { id: 'b5', price: 97.50, size: 150, total: 375, type: 'bid' },
    ];
    const initialAsks: Order[] = [
      { id: 'a1', price: 100.50, size: 30, total: 30, type: 'ask' },
      { id: 'a2', price: 101.00, size: 50, total: 80, type: 'ask' },
      { id: 'a3', price: 101.50, size: 75, total: 155, type: 'ask' },
      { id: 'a4', price: 102.00, size: 90, total: 245, type: 'ask' },
      { id: 'a5', price: 102.50, size: 140, total: 385, type: 'ask' },
    ];
    setBids(initialBids);
    setAsks(initialAsks);
    setLimitPrice(100.00);
    setLastPrice(100.00);
    setLog(['System Ready. Order book liquidity initialized at $100.00.']);
  };

  useEffect(() => {
    resetBook();
  }, []);

  // Periodic simulated market makers adding passive orders
  useEffect(() => {
    const interval = setInterval(() => {
      // Passive market makers filling empty levels
      setBids(prevBids => {
        if (prevBids.length >= 7) return prevBids;
        const newBidPrice = parseFloat((99.50 - Math.random() * 3).toFixed(2));
        const newBidSize = Math.floor(Math.random() * 30) + 15;
        const updated = [...prevBids, { id: 'mm-b-' + Date.now(), price: newBidPrice, size: newBidSize, total: 0, type: 'bid' as const }];
        return updated.sort((a, b) => b.price - a.price);
      });

      setAsks(prevAsks => {
        if (prevAsks.length >= 7) return prevAsks;
        const newAskPrice = parseFloat((100.50 + Math.random() * 3).toFixed(2));
        const newAskSize = Math.floor(Math.random() * 30) + 15;
        const updated = [...prevAsks, { id: 'mm-a-' + Date.now(), price: newAskPrice, size: newAskSize, total: 0, type: 'ask' as const }];
        return updated.sort((a, b) => a.price - b.price);
      });
    }, 4500);

    return () => clearInterval(interval);
  }, []);

  // Recalculate totals
  const bidsWithTotals = bids.reduce<Order[]>((acc, curr, index) => {
    const prevTotal = index === 0 ? 0 : acc[index - 1].total;
    acc.push({ ...curr, total: prevTotal + curr.size });
    return acc;
  }, []);

  const asksWithTotals = asks.reduce<Order[]>((acc, curr, index) => {
    const prevTotal = index === 0 ? 0 : acc[index - 1].total;
    acc.push({ ...curr, total: prevTotal + curr.size });
    return acc;
  }, []);

  const bestBid = bidsWithTotals[0]?.price || 0;
  const bestAsk = asksWithTotals[0]?.price || 0;
  const spread = parseFloat((bestAsk - bestBid).toFixed(2));
  const midPrice = parseFloat(((bestAsk + bestBid) / 2).toFixed(2));

  const addLog = (msg: string) => {
    setLog(prev => [msg, ...prev.slice(0, 15)]);
  };

  // Process order execution
  const executeOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (orderSize <= 0) return;

    if (orderType === 'market') {
      let remainingSize = orderSize;
      let totalValueSpent = 0;

      if (tradeType === 'buy') {
        const activeAsks = [...asks];
        const logEntries: string[] = [];
        let index = 0;

        while (remainingSize > 0 && activeAsks.length > 0) {
          const currentAsk = activeAsks[0];
          const fillSize = Math.min(remainingSize, currentAsk.size);
          remainingSize -= fillSize;
          totalValueSpent += fillSize * currentAsk.price;

          logEntries.push(`Matched Limit Ask level at $${currentAsk.price} for ${fillSize} units`);

          if (fillSize === currentAsk.size) {
            activeAsks.shift(); // fully consumed level
          } else {
            activeAsks[0].size -= fillSize; // partially filled level
          }
        }

        setAsks(activeAsks);
        const avgPrice = (totalValueSpent / (orderSize - remainingSize)).toFixed(2);
        setLastPrice(parseFloat(avgPrice));
        setPriceChange('up');

        if (remainingSize > 0) {
          addLog(`[Slippage Warning] Market Buy completed. Routed ${orderSize - remainingSize} units at avg $${avgPrice}. Remaining ${remainingSize} un-executed (Liquidity Void).`);
        } else {
          addLog(`Market Buy matched successfully: Filled ${orderSize} units at avg $${avgPrice}.`);
        }
        logEntries.forEach(sub => addLog(`   └ ${sub}`));
      } else {
        // Market Sell
        const activeBids = [...bids];
        const logEntries: string[] = [];

        while (remainingSize > 0 && activeBids.length > 0) {
          const currentBid = activeBids[0];
          const fillSize = Math.min(remainingSize, currentBid.size);
          remainingSize -= fillSize;
          totalValueSpent += fillSize * currentBid.price;

          logEntries.push(`Matched Limit Bid level at $${currentBid.price} for ${fillSize} units`);

          if (fillSize === currentBid.size) {
            activeBids.shift();
          } else {
            activeBids[0].size -= fillSize;
          }
        }

        setBids(activeBids);
        const avgPrice = (totalValueSpent / (orderSize - remainingSize)).toFixed(2);
        setLastPrice(parseFloat(avgPrice));
        setPriceChange('down');

        if (remainingSize > 0) {
          addLog(`[Slippage Warning] Market Sell completed. Routed ${orderSize - remainingSize} units at avg $${avgPrice}. Remaining ${remainingSize} un-executed (Liquidity Void).`);
        } else {
          addLog(`Market Sell matched successfully: Filled ${orderSize} units at avg $${avgPrice}.`);
        }
        logEntries.forEach(sub => addLog(`   └ ${sub}`));
      }
    } else {
      // Limit order logic
      const resolvedPrice = parseFloat(limitPrice.toFixed(2));
      if (tradeType === 'buy') {
        // Does it cross the lowest Ask price?
        if (asks.length > 0 && resolvedPrice >= asks[0].price) {
          addLog(`[Immediate Fill] Limit Buy crosses the spread. Execution converted to match lowest Ask at $${asks[0].price}.`);
          // Convert to a market order for this execution
          return;
        }

        // Otherwise insert in Bids Book
        setBids(prevBids => {
          const matchedIndex = prevBids.findIndex(b => b.price === resolvedPrice);
          if (matchedIndex >= 0) {
            const updated = [...prevBids];
            updated[matchedIndex].size += orderSize;
            return updated;
          } else {
            return [...prevBids, { id: 'user-b-' + Date.now(), price: resolvedPrice, size: orderSize, total: 0, type: 'bid' as const, isUser: true }].sort((a,b) => b.price - a.price);
          }
        });
        addLog(`Limit Buy Posted: ${orderSize} units sitting at $${resolvedPrice.toFixed(2)}.`);
      } else {
        // Limit Sell
        if (bids.length > 0 && resolvedPrice <= bids[0].price) {
          addLog(`[Immediate Fill] Limit Sell crosses the spread. Execution converted to match highest Bid at $${bids[0].price}.`);
          return;
        }

        // Insert in Asks Book
        setAsks(prevAsks => {
          const matchedIndex = prevAsks.findIndex(a => a.price === resolvedPrice);
          if (matchedIndex >= 0) {
            const updated = [...prevAsks];
            updated[matchedIndex].size += orderSize;
            return updated;
          } else {
            return [...prevAsks, { id: 'user-a-' + Date.now(), price: resolvedPrice, size: orderSize, total: 0, type: 'ask' as const, isUser: true }].sort((a,b) => a.price - b.price);
          }
        });
        addLog(`Limit Sell Posted: ${orderSize} units sitting at $${resolvedPrice.toFixed(2)}.`);
      }
    }
  };

  const setMidpointAsLimit = () => {
    setLimitPrice(midPrice);
  };

  // Find max total size to scale bars
  const maxTotal = Math.max(
    bidsWithTotals[bidsWithTotals.length - 1]?.total || 1,
    asksWithTotals[asksWithTotals.length - 1]?.total || 1
  );

  return (
    <div id="lob-simulator" className="p-6 bg-zinc-950 border border-white/5 rounded-2xl flex flex-col gap-6 shadow-[0_4px_30px_rgba(0,0,0,0.8)] font-sans">
      <div className="flex items-center justify-between border-b border-white/5 pb-4">
        <div className="flex items-center gap-2">
          <Layers className="w-5 h-5 text-indigo-500" />
          <h4 className="text-sm font-semibold tracking-wide text-white uppercase font-sans">LOB Depth Engine & Exchange Matcher</h4>
        </div>
        <button
          onClick={resetBook}
          className="p-1 px-3 bg-white/[0.03] border border-white/10 rounded-full hover:bg-white/[0.08] transition-all text-[10px] font-mono tracking-widest text-zinc-400 hover:text-white uppercase flex items-center gap-1"
        >
          <RefreshCw className="w-3 h-3" /> RESTOCK LIQUIDITY
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* ORDER BOOK LEDGER PANEL */}
        <div className="lg:col-span-7 flex flex-col gap-3">
          <h5 className="text-[10px] uppercase tracking-[0.2em] font-sans text-zinc-500 font-bold">LOB Real-time Depth View</h5>
          
          <div className="border border-white/5 rounded-xl bg-black/40 overflow-hidden text-xs font-mono">
            {/* Headers */}
            <div className="grid grid-cols-4 px-4 py-2 bg-zinc-900/60 border-b border-white/5 text-[10px] text-zinc-400 font-bold uppercase tracking-wider">
              <span>Price ($)</span>
              <span className="text-right">Level Size</span>
              <span className="text-right">Total Depth</span>
              <span className="text-right pr-2">Relative Size</span>
            </div>

            {/* Asks (Sells) in reverse order (highest top) */}
            <div className="flex flex-col-reverse divide-y divide-white/[0.02] border-b border-white/5">
              {asksWithTotals.slice(0, 6).map((ask) => {
                const percentage = (ask.total / maxTotal) * 100;
                return (
                  <div key={ask.id} className="grid grid-cols-4 px-4 py-1.5 relative items-center group hover:bg-white/[0.02]">
                    <div className="absolute right-0 top-0 bottom-0 bg-red-950/20 pointer-events-none transition-all duration-300" style={{ width: `${percentage}%` }} />
                    <span className={`font-semibold z-10 ${ask.isUser ? 'text-amber-400 font-bold' : 'text-red-400'}`}>
                      {ask.price.toFixed(2)} {ask.isUser && '★'}
                    </span>
                    <span className="text-right text-zinc-300 z-10">{ask.size}</span>
                    <span className="text-right text-zinc-500 z-10">{ask.total}</span>
                    <span className="text-right text-[10px] text-red-400/70 z-10 pr-2">{(percentage).toFixed(0)}%</span>
                  </div>
                );
              })}
            </div>

            {/* SPREAD INDICATOR */}
            <div className="grid grid-cols-4 px-4 py-3 bg-zinc-950/90 text-[11px] border-b border-white/5 relative z-20">
              <div className="col-span-2 flex flex-col">
                <span className="text-[9px] text-zinc-500 font-sans tracking-widest font-black uppercase">CURRENT MIDPOINT</span>
                <span className={`text-base font-black tracking-wide ${priceChange === 'up' ? 'text-green-400 font-bold' : priceChange === 'down' ? 'text-red-400 font-bold' : 'text-white'}`}>
                  ${lastPrice.toFixed(2)}
                  <span className="text-[9px] font-sans font-normal ml-2 text-zinc-400 bg-white/[0.05] p-0.5 px-1.5 rounded-full">
                    Mid: ${midPrice.toFixed(2)}
                  </span>
                </span>
              </div>
              <div className="col-span-2 text-right flex flex-col justify-center">
                <span className="text-[9px] text-zinc-500 font-sans tracking-widest font-black uppercase">BID-ASK SPREAD</span>
                <span className="text-sm font-bold tracking-wider text-indigo-400">${spread.toFixed(2)} ({((spread/midPrice)*100).toFixed(2)}%)</span>
              </div>
            </div>

            {/* Bids (Buys) highest bids on top */}
            <div className="flex flex-col divide-y divide-white/[0.02]">
              {bidsWithTotals.slice(0, 6).map((bid) => {
                const percentage = (bid.total / maxTotal) * 100;
                return (
                  <div key={bid.id} className="grid grid-cols-4 px-4 py-1.5 relative items-center group hover:bg-white/[0.02]">
                    <div className="absolute right-0 top-0 bottom-0 bg-green-950/20 pointer-events-none transition-all duration-300" style={{ width: `${percentage}%` }} />
                    <span className={`font-semibold z-10 ${bid.isUser ? 'text-amber-400 font-bold' : 'text-green-400'}`}>
                      {bid.price.toFixed(2)} {bid.isUser && '★'}
                    </span>
                    <span className="text-right text-zinc-300 z-10">{bid.size}</span>
                    <span className="text-right text-zinc-500 z-10">{bid.total}</span>
                    <span className="text-right text-[10px] text-green-400/70 z-10 pr-2">{(percentage).toFixed(0)}%</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ORDER MATCHING FORM & INSTRUCTION */}
        <div className="lg:col-span-5 flex flex-col gap-4 bg-zinc-900/40 p-4 border border-white/5 rounded-xl justify-between">
          <form onSubmit={executeOrder} className="flex flex-col gap-4">
            <h5 className="text-[10px] uppercase tracking-[0.2em] font-sans text-zinc-400 font-bold flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-indigo-400 animate-pulse" /> PLACE MATCHING ORDER
            </h5>

            {/* Trade Type Selection */}
            <div className="grid grid-cols-2 gap-2 bg-black/40 p-1 border border-white/5 rounded-lg text-xs">
              <button
                type="button"
                onClick={() => setTradeType('buy')}
                className={`py-1.5 rounded-md font-bold uppercase tracking-wider transition-all cursor-pointer ${tradeType === 'buy' ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'text-zinc-400 hover:text-white hover:bg-white/[0.02]'}`}
              >
                BUY (BID)
              </button>
              <button
                type="button"
                onClick={() => setTradeType('sell')}
                className={`py-1.5 rounded-md font-bold uppercase tracking-wider transition-all cursor-pointer ${tradeType === 'sell' ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'text-zinc-400 hover:text-white hover:bg-white/[0.02]'}`}
              >
                SELL (ASK)
              </button>
            </div>

            {/* Order Type Selection */}
            <div className="grid grid-cols-2 gap-2 bg-black/40 p-1 border border-white/5 rounded-lg text-[10px] tracking-wider uppercase font-bold">
              <button
                type="button"
                onClick={() => setOrderType('limit')}
                className={`py-1 rounded-md transition-all cursor-pointer ${orderType === 'limit' ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30' : 'text-zinc-500 hover:text-zinc-300'}`}
              >
                LIMIT ORDER
              </button>
              <button
                type="button"
                onClick={() => setOrderType('market')}
                className={`py-1 rounded-md transition-all cursor-pointer ${orderType === 'market' ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30' : 'text-zinc-500 hover:text-zinc-300'}`}
              >
                MARKET ORDER
              </button>
            </div>

            {/* Limit Price Field */}
            {orderType === 'limit' && (
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] text-zinc-400 uppercase tracking-widest font-bold">Limit Price ($)</label>
                  <button
                    type="button"
                    onClick={setMidpointAsLimit}
                    className="text-[9px] text-indigo-400 underline hover:text-indigo-300 select-none cursor-pointer"
                  >
                    Set Mid: ${midPrice.toFixed(2)}
                  </button>
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 text-xs font-mono">$</span>
                  <input
                    type="number"
                    step="0.05"
                    min="50"
                    max="150"
                    value={limitPrice}
                    onChange={(e) => setLimitPrice(parseFloat(e.target.value) || 100.00)}
                    className="w-full bg-black/50 border border-white/10 rounded-lg p-2 pl-7 text-xs text-white outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
              </div>
            )}

            {/* Order Size Field */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-zinc-400 uppercase tracking-widest font-bold">Units / Size</label>
              <input
                type="number"
                min="1"
                max="500"
                value={orderSize}
                onChange={(e) => setOrderSize(parseInt(e.target.value) || 0)}
                className="w-full bg-black/50 border border-white/10 rounded-lg p-2 text-xs text-white outline-none focus:border-indigo-500 font-mono"
              />
            </div>

            {/* Execute Button */}
            <button
              type="submit"
              className={`w-full py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all cursor-pointer flex items-center justify-center gap-2 border shadow-lg ${
                tradeType === 'buy'
                  ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white border-green-500/20 shadow-green-500/10'
                  : 'bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white border-red-500/20 shadow-red-500/10'
              }`}
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              EXECUTE {orderType} {tradeType}
            </button>
          </form>

          {/* REAL TIME TRANSACTION LOGGER */}
          <div className="flex flex-col gap-2">
            <span className="text-[9px] uppercase tracking-[0.25em] text-zinc-500 font-black font-sans">Matching Engine Feed</span>
            <div className="h-[140px] bg-black/60 p-3 rounded-lg border border-white/5 text-[10px] font-mono overflow-y-auto no-scrollbar scroll-smooth flex flex-col gap-1">
              {log.map((line, idx) => (
                <div key={idx} className={`leading-relaxed border-l-2 pl-2 ${
                  line.includes('[Immediate Fill]') || line.includes('[Slippage Warning]')
                    ? 'text-amber-400 border-amber-400' 
                    : line.includes('Market') || line.includes('Filled')
                      ? 'text-indigo-400 border-indigo-400' 
                      : line.includes('Posted')
                        ? 'text-blue-400 border-blue-400'
                        : 'text-zinc-500 border-zinc-700'
                }`}>
                  {line}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
