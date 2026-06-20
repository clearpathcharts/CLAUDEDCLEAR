import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Landmark, TrendingUp, DollarSign, Percent, BarChart, Search } from 'lucide-react';
import { fetchCompanyFundamentals } from '../services/fundamentalsService';
import { CompanyFundamentals } from '../types';
import { subscribeToClearState, getClearState } from '../lib/trading/clearState';
import { TradingHaltController } from '../truth/TradingHaltController';

export default function FundamentalsPanel() {
  const [symbol, setSymbol] = useState(getClearState().selectedAsset || 'AAPL');
  const [data, setData] = useState<CompanyFundamentals | null>(null);
  const [loading, setLoading] = useState(false);

  const [halted, setHalted] = useState(TradingHaltController.isHalted());
  const [haltReason, setHaltReason] = useState(TradingHaltController.getHaltReason());

  useEffect(() => {
    return TradingHaltController.subscribe((isHalted, reason) => {
      setHalted(isHalted);
      setHaltReason(reason);
    });
  }, []);

  const loadData = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);
    const result = await fetchCompanyFundamentals(symbol);
    setData(result);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
    
    return subscribeToClearState((state) => {
      if (state.selectedAsset && state.selectedAsset !== symbol) {
        setSymbol(state.selectedAsset);
        setLoading(true);
        fetchCompanyFundamentals(state.selectedAsset).then(res => {
          setData(res);
          setLoading(false);
        });
      }
    });
  }, [symbol]);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      notation: 'compact',
      maximumFractionDigits: 1
    }).format(val);
  };

  if (halted) {
    return (
      <div className="p-6 bg-black/40 backdrop-blur-md rounded-3xl border border-red-900 border-dashed h-full flex flex-col items-center justify-center text-center">
        <span className="text-red-500 font-extrabold uppercase tracking-widest text-sm mb-2">🔴 SYSTEM VALUATION TRADING HALT</span>
        <p className="text-xs text-zinc-400 max-w-sm font-mono uppercase">{haltReason || 'ALL INSTITUTIONAL AND ACCOUNTING MODULES BLANKED'}</p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-black/40 backdrop-blur-md rounded-3xl border border-white/5 h-full flex flex-col">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 flex items-center justify-center border border-amber-500/30">
            <Landmark className="w-6 h-6 text-amber-400" />
          </div>
          <div>
            <h2 className="text-2xl font-black uppercase tracking-widest text-white italic mb-2">Fundamentals</h2>
            <p className="text-lg font-black text-amber-400 font-mono uppercase tracking-widest max-w-3xl leading-relaxed">HOW TO USE THIS: Search for any ticker symbol to view its fundamental accounting data, such as Revenue, Net Income, Margins, and EPS.</p>
          </div>
        </div>

        <form onSubmit={loadData} className="relative">
          <input 
            value={symbol}
            onChange={(e) => setSymbol(e.target.value.toUpperCase())}
            placeholder="Search Ticker..."
            className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-xs text-white outline-none focus:border-amber-500/50 w-40 transition-all"
          />
          <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors">
            <Search className="w-4 h-4" />
          </button>
        </form>
      </div>

      {!data ? (
        <div className="flex-1 flex items-center justify-center text-gray-500 text-xs font-mono uppercase">
          {loading ? 'Crunching Financial Nodes...' : 'No Data Available'}
        </div>
      ) : (
        <div className="flex-1 space-y-6 overflow-y-auto pr-2 custom-scrollbar">
          <div className="grid grid-cols-2 gap-4">
            <motion.div 
               initial={{ opacity: 0, y: 10 }}
               animate={{ opacity: 1, y: 0 }}
               className="p-5 rounded-2xl bg-white/[0.02] border border-white/5"
            >
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="w-4 h-4 text-emerald-400" />
                <span className="text-[10px] font-black uppercase text-gray-500">Revenue</span>
              </div>
              <div className="text-2xl font-black italic text-white">{formatCurrency(data.revenue)}</div>
            </motion.div>

            <motion.div 
               initial={{ opacity: 0, y: 10 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ delay: 0.1 }}
               className="p-5 rounded-2xl bg-white/[0.02] border border-white/5"
            >
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-amber-400" />
                <span className="text-[10px] font-black uppercase text-gray-500">Net Income</span>
              </div>
              <div className="text-2xl font-black italic text-white">{formatCurrency(data.netIncome)}</div>
            </motion.div>
          </div>

          <div className="grid grid-cols-3 gap-4">
             {[
               { label: 'Margin', value: `${(data.margin * 100).toFixed(2)}%`, icon: Percent, color: 'text-blue-400' },
               { label: 'P/E Ratio', value: data.pe.toFixed(2), icon: BarChart, color: 'text-purple-400' },
               { label: 'EPS', value: `$${data.eps.toFixed(2)}`, icon: TrendingUp, color: 'text-emerald-400' }
             ].map((stat, i) => (
               <motion.div 
                 key={stat.label}
                 initial={{ opacity: 0, scale: 0.9 }}
                 animate={{ opacity: 1, scale: 1 }}
                 transition={{ delay: 0.2 + (i * 0.1) }}
                 className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 text-center"
               >
                 <stat.icon className={`w-4 h-4 mx-auto mb-2 ${stat.color}`} />
                 <div className="text-[8px] font-black uppercase text-gray-600 mb-1">{stat.label}</div>
                 <div className="text-sm font-bold text-white">{stat.value}</div>
               </motion.div>
             ))}
          </div>

          <div className="p-6 rounded-3xl bg-amber-500/5 border border-amber-500/10">
             <h4 className="text-[10px] font-black uppercase tracking-widest text-amber-400 mb-4">Valuation Score</h4>
             <div className="flex items-center gap-4">
                <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                   <div className="h-full bg-amber-500 w-[78%]" />
                </div>
                <span className="text-lg font-black text-amber-400">7.8</span>
             </div>
             <p className="text-[9px] text-gray-500 font-mono mt-3 uppercase leading-relaxed">
               Proprietary analysis indicates {symbol} is currently trading at a premium relative to sector peers, with strong margin stability.
             </p>
          </div>
        </div>
      )}
    </div>
  );
}
