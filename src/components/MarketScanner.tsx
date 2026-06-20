import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Activity, Zap, Shield, Search } from 'lucide-react';
import { ScannerItem } from '../types';
import { MARKET_PAIRS } from '../constants/marketPairs';

export default function MarketScanner() {
  const [data, setData] = useState<ScannerItem[]>([]);
  const [scanning, setScanning] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    // Select 20 random pairs for the scan
    const selectedSymbols = MARKET_PAIRS
      .sort(() => 0.5 - Math.random())
      .slice(0, 25)
      .map(s => s.replace('/', ''));
    
    const generateData = () => {
      const items: ScannerItem[] = selectedSymbols.map(s => ({
        symbol: s,
        price: Math.random() * 2000 + 10,
        change: (Math.random() * 6) - 3, // More volatile
        volume: Math.random() * 5000000 + 100000,
        score: Math.random() * 100
      }));
      setData(items.sort((a, b) => b.score - a.score));
      setScanning(false);
    };

    const interval = setInterval(generateData, 8000);
    generateData();

    return () => clearInterval(interval);
  }, []);

  const filteredData = data.filter(item => 
    item.symbol.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-4 bg-black/40 backdrop-blur-md rounded-2xl border border-white/5 h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30">
            <Activity className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <h2 className="text-sm font-black uppercase tracking-widest text-white">Live Scanner</h2>
            <p className="text-[10px] text-indigo-400/60 font-mono uppercase">Market Intelligence Layer v4.2</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-xl border border-white/10">
            <Search className="w-3.5 h-3.5 text-gray-500" />
            <input 
              type="text"
              placeholder="Search pairs..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="bg-transparent border-none outline-none text-[10px] text-white font-mono uppercase w-32"
            />
          </div>
          <div className={`px-3 py-1 rounded-full text-[10px] font-mono uppercase tracking-tighter ${scanning ? 'bg-amber-500/10 text-amber-500' : 'bg-green-500/10 text-green-500 '}`}>
            {scanning ? 'Calibrating...' : 'Real-time Feed'}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
        {filteredData.map((item, i) => (
          <motion.div 
            key={item.symbol}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.05] transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center font-black text-[10px] text-white">
                {item.symbol.substring(0, 2)}
              </div>
              <div>
                <div className="text-xs font-bold text-white tracking-tight">{item.symbol}</div>
                <div className="text-[9px] text-gray-500 font-mono">VOL: {(item.volume / 1000).toFixed(1)}K</div>
              </div>
            </div>
            
            <div className="text-right">
              <div className="text-[11px] font-mono text-white">${item.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
              <div className={`text-[9px] font-black uppercase tracking-widest ${item.change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {item.change >= 0 ? '+' : ''}{item.change.toFixed(2)}%
              </div>
            </div>

            <div className="w-16 h-1 bg-white/5 rounded-full overflow-hidden ml-4 hidden sm:block">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${item.score}%` }}
                className={`h-full ${item.score > 80 ? 'bg-indigo-500' : item.score > 50 ? 'bg-blue-500' : 'bg-gray-700'}`}
              />
            </div>
          </motion.div>
        ))}
      </div>

      <div className="mt-4 pt-4 border-t border-white/5 grid grid-cols-2 gap-4">
        <div className="p-3 rounded-xl bg-indigo-500/5 border border-indigo-500/10">
          <div className="flex items-center gap-2 mb-1">
            <Zap className="w-3 h-3 text-indigo-400" />
            <span className="text-[9px] font-black uppercase tracking-widest text-indigo-400">Momentum</span>
          </div>
          <div className="text-xs font-bold text-white capitalize">Bullish Skew</div>
        </div>
        <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/10">
          <div className="flex items-center gap-2 mb-1">
            <Shield className="w-3 h-3 text-amber-400" />
            <span className="text-[9px] font-black uppercase tracking-widest text-amber-400">Risk Factor</span>
          </div>
          <div className="text-xs font-bold text-white capitalize">Elevated</div>
        </div>
      </div>
    </div>
  );
}
