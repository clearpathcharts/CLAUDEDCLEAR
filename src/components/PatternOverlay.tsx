import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Scan, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { getActivePatternScan, getRecentPatterns, subscribePatternScan } from '../patterns';

const DIRECTION_ICON = {
  bullish: TrendingUp,
  bearish: TrendingDown,
  neutral: Minus,
};

const DIRECTION_COLOR = {
  bullish: 'text-green-400',
  bearish: 'text-red-400',
  neutral: 'text-yellow-400',
};

export default function PatternOverlay() {
  const [scan, setScan] = useState(getActivePatternScan());

  useEffect(() => subscribePatternScan(() => setScan(getActivePatternScan())), []);

  const recent = getRecentPatterns(6);

  if (!scan || scan.patterns.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="fixed bottom-24 right-4 z-40 w-72 bg-black/90 border border-white/10 rounded-xl p-4 backdrop-blur-md shadow-2xl font-mono"
    >
      <div className="flex items-center gap-2 mb-3 border-b border-white/10 pb-2">
        <Scan size={16} className="text-[#00D9FF]" />
        <span className="text-xs font-black uppercase tracking-wider text-white">Pattern Scanner</span>
        <span className="text-xs text-white/30 ml-auto">{scan.patterns.length} found</span>
      </div>
      <p className="text-[10px] text-white/40 mb-3">
        Wedges · triangles · teacups · triple tops/bottoms · candlestick formations
      </p>
      <div className="space-y-1.5 max-h-48 overflow-y-auto">
        {recent.map((p, i) => {
          const Icon = DIRECTION_ICON[p.direction];
          return (
            <div key={`${p.id}-${p.time}-${i}`} className="flex items-center gap-2 text-xs bg-white/5 rounded-lg px-2 py-1.5">
              <Icon size={12} className={DIRECTION_COLOR[p.direction]} />
              <span className="text-white/80 flex-1 truncate">{p.label}</span>
              <span className="text-white/30">{Math.round(p.confidence * 100)}%</span>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
