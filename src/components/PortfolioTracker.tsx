import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Briefcase, Plus, TrendingUp, DollarSign, Activity, Trash2, PieChart } from 'lucide-react';
import { useAuth } from '../contexts/FirebaseContext';
import { getClearState, subscribeToClearState } from '../lib/trading/clearState';

export default function PortfolioTracker() {
  const { portfolio, addPosition } = useAuth();
  const [symbol, setSymbol] = useState(getClearState().selectedAsset || '');
  const [price, setPrice] = useState('');
  const [qty, setQty] = useState('');
  const [showAdd, setShowAdd] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!symbol || !price || !qty) return;
    await addPosition(symbol, parseFloat(price), parseFloat(qty));
    setSymbol('');
    setPrice('');
    setQty('');
    setShowAdd(false);
  };

  const totalValue = portfolio.reduce((acc, curr) => acc + (curr.price * curr.quantity), 0);

  useEffect(() => {
    return subscribeToClearState((state) => {
      if (state.selectedAsset && state.selectedAsset !== symbol) {
        setSymbol(state.selectedAsset);
      }
    });
  }, [symbol]);

  return (
    <div className="p-4 bg-black/40 backdrop-blur-md rounded-2xl border border-white/5 h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center border border-green-500/30">
            <Briefcase className="w-5 h-5 text-green-400" />
          </div>
          <div>
            <h2 className="text-2xl font-black uppercase tracking-widest text-white mb-2">Portfolio Tracker</h2>
            <p className="text-lg font-black text-green-400 font-mono uppercase tracking-widest max-w-2xl leading-relaxed">
              HOW TO USE THIS: The Portfolio Tracker allows you to input positions you hold by entering the Asset symbol, your Entry Price, and Quantity. It calculates your total theoretical exposure and lets you track these theoretical positions on the platform.
            </p>
          </div>
        </div>
        <button 
          onClick={() => setShowAdd(!showAdd)}
          className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-[10px] font-black uppercase tracking-widest text-white border border-white/10 transition-all"
        >
          {showAdd ? 'Close' : 'Add Position'}
        </button>
      </div>

      {showAdd && (
        <motion.form 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={handleSubmit} 
          className="mb-6 p-4 rounded-2xl bg-white/5 border border-white/10 grid grid-cols-2 gap-3"
        >
          <div className="space-y-1">
            <label className="text-[9px] font-black uppercase text-gray-500">Asset</label>
            <input value={symbol} onChange={e => setSymbol(e.target.value)} placeholder="BTCUSD" className="w-full bg-black border border-white/10 rounded-lg px-3 py-2 text-xs text-white uppercase outline-none focus:border-green-500/50" />
          </div>
          <div className="space-y-1">
            <label className="text-[9px] font-black uppercase text-gray-500">Entry</label>
            <input type="number" value={price} onChange={e => setPrice(e.target.value)} placeholder="Price" className="w-full bg-black border border-white/10 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-green-500/50" />
          </div>
          <div className="space-y-1 col-span-2">
            <label className="text-[9px] font-black uppercase text-gray-500">Quantity</label>
            <input type="number" value={qty} onChange={e => setQty(e.target.value)} placeholder="Size" className="w-full bg-black border border-white/10 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-green-500/50" />
          </div>
          <button type="submit" className="col-span-2 py-3 rounded-lg bg-green-500 hover:bg-green-600 text-white text-[10px] font-black uppercase tracking-widest transition-colors mt-2">
            Commit Position
          </button>
        </motion.form>
      )}

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="p-3 rounded-xl bg-white/5 border border-white/5">
          <div className="text-[8px] font-black text-gray-500 uppercase mb-1">Exposure</div>
          <div className="text-sm font-mono font-bold text-white">${totalValue.toLocaleString()}</div>
        </div>
        <div className="p-3 rounded-xl bg-white/5 border border-white/5">
          <div className="text-[8px] font-black text-gray-500 uppercase mb-1">Positions</div>
          <div className="text-sm font-mono font-bold text-white">{portfolio.length}</div>
        </div>
        <div className="p-3 rounded-xl bg-white/5 border border-white/5">
          <div className="text-[8px] font-black text-gray-500 uppercase mb-1">Status</div>
          <div className="text-xs font-bold text-green-500 uppercase tracking-tighter">Neutral</div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
        {portfolio.map((p, i) => (
          <motion.div 
            key={p.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className="group flex items-center justify-between p-4 rounded-xl bg-white/[0.03] border border-white/5 hover:border-green-500/30 transition-all"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center font-black text-xs text-white">
                {p.symbol.substring(0, 2)}
              </div>
              <div>
                <div className="text-sm font-bold text-white">{p.symbol}</div>
                <div className="text-[10px] text-gray-500 font-mono">QTY: {p.quantity}</div>
              </div>
            </div>
            <div className="text-right flex items-center gap-4">
              <div>
                <div className="text-xs font-mono text-white">${(p.price * p.quantity).toLocaleString()}</div>
                <div className="text-[9px] text-gray-500 font-mono italic">Entry: ${p.price}</div>
              </div>
              <button className="opacity-0 group-hover:opacity-100 p-2 text-gray-600 hover:text-red-500 transition-all">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        ))}
        {portfolio.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center opacity-30 mt-10">
            <PieChart className="w-12 h-12 mb-4" />
            <p className="text-xs font-mono uppercase tracking-widest leading-relaxed">
              No manual tracks detected.<br/>Initialize status to monitor ledger.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
