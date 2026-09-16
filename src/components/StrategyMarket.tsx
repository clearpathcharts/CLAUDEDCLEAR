import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ShoppingCart, Upload, Database, TrendingUp, User, Clock, Trash2, ShieldCheck } from 'lucide-react';
import { useAuth } from '../contexts/FirebaseContext';
import { subscribeToStrategies } from '../services/backendService';
import { TradingStrategy } from '../types';

export default function StrategyMarket() {
  const { user, uploadStrategy, requireVerified } = useAuth();
  const [strategies, setStrategies] = useState<TradingStrategy[]>([]);
  const [name, setName] = useState('');
  const [result, setResult] = useState('');
  const [showUpload, setShowUpload] = useState(false);

  useEffect(() => {
    return subscribeToStrategies(setStrategies);
  }, []);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !result) return;
    await uploadStrategy(name, parseFloat(result));
    setName('');
    setResult('');
    setShowUpload(false);
  };

  const isVerified = requireVerified();

  return (
    <div className="p-4 bg-black/40 backdrop-blur-md rounded-2xl border border-white/5 h-full flex flex-col">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30">
            <ShoppingCart className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <h2 className="text-sm font-black uppercase tracking-widest text-white">Strategy Marketplace</h2>
            <p className="text-[10px] text-indigo-400/60 font-mono uppercase">Strategy Market v1.0</p>
          </div>
        </div>
        <button 
          onClick={() => setShowUpload(!showUpload)}
          className="px-4 py-2 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-[10px] font-black uppercase tracking-widest text-white transition-all shadow-[0_0_15px_rgba(99,102,241,0.3)]"
        >
          {showUpload ? 'Cancel' : 'Upload Alpha'}
        </button>
      </div>

      {showUpload && (
        <motion.form 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={handleUpload}
          className="mb-8 p-6 rounded-2xl bg-indigo-500/5 border border-indigo-500/10 space-y-4"
        >
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[9px] font-black uppercase text-indigo-400">Strategy Name</label>
              <input 
                value={name} 
                onChange={e => setName(e.target.value)} 
                placeholder="Market EMA Replay"
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-indigo-500/50"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[9px] font-black uppercase text-indigo-400">Backtest Return (%)</label>
              <input 
                type="number"
                value={result} 
                onChange={e => setResult(e.target.value)} 
                placeholder="12.5"
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-indigo-500/50"
              />
            </div>
          </div>
          <button 
            type="submit"
            className="w-full py-3 rounded-xl bg-white/5 border border-white/10 text-white text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all"
          >
            Deploy to Marketplace
          </button>
        </motion.form>
      )}

      <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
        {strategies.map((strat, i) => (
          <motion.div 
            key={strat.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className="group p-5 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-indigo-500/30 transition-all flex items-center justify-between"
          >
            <div className="flex items-center gap-6">
               <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center">
                 <ShieldCheck className="w-6 h-6 text-indigo-500/40" />
               </div>
               <div>
                  <div className="text-sm font-bold text-white mb-1">{strat.name}</div>
                  <div className="flex items-center gap-4 text-[9px] text-gray-500 font-mono uppercase tracking-widest">
                    <span className="flex items-center gap-1.5"><User className="w-3 h-3" /> Agent_{strat.uid.substring(0,6)}</span>
                    <span className="flex items-center gap-1.5"><Clock className="w-3 h-3" /> {new Date(strat.createdAt?.seconds * 1000).toLocaleDateString()}</span>
                  </div>
               </div>
            </div>

            <div className="text-right">
               <div className={`text-lg font-black italic tracking-tighter ${strat.result > 0 ? 'text-green-500' : 'text-red-500'}`}>
                 {strat.result > 0 ? '+' : ''}{strat.result}%
               </div>
               <div className="text-[8px] font-black uppercase text-gray-600 tracking-[0.2em]">Alpha Score</div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
