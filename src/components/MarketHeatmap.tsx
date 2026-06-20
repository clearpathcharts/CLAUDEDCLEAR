import React from 'react';
import { motion } from 'motion/react';
import { Grid, TrendingUp, TrendingDown } from 'lucide-react';
import { MARKET_PAIRS } from '../constants/marketPairs';

export default function MarketHeatmap() {
  // Generate mock data for the heatmap once on mount
  const data = React.useMemo(() => {
    return MARKET_PAIRS.slice(0, 48).map(symbol => ({
      symbol,
      change: (Math.random() * 6) - 3,
      volume: Math.random() * 1000000
    }));
  }, []);

  const getHeatColor = (change: number) => {
    if (change > 2) return 'bg-green-500 text-black';
    if (change > 0) return 'bg-green-500/40 text-green-100';
    if (change < -2) return 'bg-red-500 text-white';
    if (change < 0) return 'bg-red-500/40 text-red-100';
    return 'bg-gray-500/20 text-gray-400';
  };

  return (
    <div className="p-4 bg-black/40 backdrop-blur-md rounded-2xl border border-white/5 h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center border border-orange-500/30">
            <Grid className="w-5 h-5 text-orange-400" />
          </div>
          <div>
            <h2 className="text-sm font-black uppercase tracking-widest text-white">Market Heatmap</h2>
            <p className="text-[10px] text-orange-400/60 font-mono uppercase">Cluster View v2.0</p>
          </div>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-12 gap-1 overflow-y-auto pr-2 custom-scrollbar">
        {data.map((item, i) => (
          <motion.div 
            key={item.symbol}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.005 }}
            className={`aspect-square rounded-lg flex flex-col items-center justify-center p-1 transition-all hover:scale-105 cursor-pointer border border-white/5 ${getHeatColor(item.change)}`}
          >
            <div className="text-[9px] font-black tracking-tighter truncate w-full text-center">
              {item.symbol.split('/')[1]}
            </div>
            <div className="text-[7px] font-mono opacity-80">
              {item.change > 0 ? '+' : ''}{item.change.toFixed(1)}%
            </div>
          </motion.div>
        ))}
      </div>


      <div className="mt-6 flex items-center gap-6 justify-center border-t border-white/5 pt-4">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-red-500" />
          <span className="text-[9px] font-mono text-gray-500 uppercase">Extreme Fear</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-gray-500/20" />
          <span className="text-[9px] font-mono text-gray-500 uppercase">Neutral</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-green-500" />
          <span className="text-[9px] font-mono text-gray-500 uppercase">Extreme Greed</span>
        </div>
      </div>
    </div>
  );
}
