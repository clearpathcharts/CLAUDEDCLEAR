import React from 'react';
import { motion } from 'motion/react';
import { Globe, MapPin, TrendingUp, TrendingDown } from 'lucide-react';

export default function GeographicMap() {
  const assets = [
    { symbol: 'AAPL', x: 25, y: 35, change: 1.2, name: 'New York' },
    { symbol: 'EUR/USD', x: 48, y: 30, change: -0.4, name: 'London' },
    { symbol: 'BTC', x: 75, y: 40, change: 4.5, name: 'Tokyo' },
    { symbol: 'GOLD', x: 15, y: 55, change: 0.8, name: 'Chicago' },
    { symbol: 'OIL', x: 55, y: 45, change: -2.1, name: 'Dubai' },
    { symbol: 'ASX', x: 85, y: 75, change: 0.5, name: 'Sydney' }
  ];

  return (
    <div className="p-6 bg-black/40 backdrop-blur-md rounded-3xl border border-white/5 h-full flex flex-col relative overflow-hidden">
      <div className="flex items-center justify-between mb-8 relative z-10">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-500/20 flex items-center justify-center border border-blue-500/30">
            <Globe className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <h2 className="text-lg font-black uppercase tracking-widest text-white italic">Global Market Map</h2>
            <p className="text-[10px] text-blue-400/60 font-mono uppercase tracking-[0.2em]">Geospatial Alpha v1.0</p>
          </div>
        </div>
      </div>

      <div className="flex-1 relative bg-black/20 rounded-2xl border border-white/5 overflow-hidden">
        {/* Simplified Map Background */}
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_#ffffff05_1px,_transparent_1px)] bg-[length:40px_40px]" />
        
        {assets.map((asset, i) => (
          <motion.div 
            key={asset.symbol}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: i * 0.1, type: 'spring' }}
            style={{ left: `${asset.x}%`, top: `${asset.y}%` }}
            className="absolute -translate-x-1/2 -translate-y-1/2 group cursor-pointer"
          >
            <div className={`relative w-4 h-4 rounded-full ${asset.change > 0 ? 'bg-green-500' : 'bg-red-500'} `}>
              <div className={`absolute inset-0 rounded-full ${asset.change > 0 ? 'bg-green-500' : 'bg-red-500'} scale-150 opacity-20`} />
            </div>
            
            <div className="absolute top-6 left-1/2 -translate-x-1/2 bg-black/80 backdrop-blur-md border border-white/10 px-3 py-2 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none">
              <div className="text-[10px] font-black uppercase text-white mb-0.5">{asset.symbol}</div>
              <div className="flex items-center gap-2">
                <span className="text-[8px] font-mono text-gray-500">{asset.name}</span>
                <span className={`text-[9px] font-bold ${asset.change > 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {asset.change > 0 ? '+' : ''}{asset.change}%
                </span>
              </div>
            </div>

            <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-black text-white/40 uppercase tracking-tighter opacity-0 group-hover:opacity-100 transition-opacity">
              {asset.symbol}
            </div>
          </motion.div>
        ))}

        {/* Global Connection Lines (Visual Decor) */}
        <svg className="absolute inset-0 pointer-events-none opacity-10">
           <path d="M 25 35 Q 48 10 48 30" stroke="white" strokeWidth="0.5" fill="none" />
           <path d="M 48 30 Q 75 10 75 40" stroke="white" strokeWidth="0.5" fill="none" />
           <path d="M 15 55 Q 25 45 25 35" stroke="white" strokeWidth="0.5" fill="none" />
        </svg>
      </div>

      <div className="mt-6 flex items-center gap-8 justify-center border-t border-white/5 pt-4">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-green-500" />
          <span className="text-[9px] font-mono text-gray-500 uppercase">Bullish Node</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500" />
          <span className="text-[9px] font-mono text-gray-500 uppercase">Bearish Node</span>
        </div>
      </div>
    </div>
  );
}
