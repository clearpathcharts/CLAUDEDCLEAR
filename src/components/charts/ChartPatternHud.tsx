import React from 'react';
import { Scan, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import type { PatternScanResult } from '../../patterns';

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

interface ChartPatternHudProps {
  symbol: string;
  scan: PatternScanResult | null;
}

/** Per-chart pattern panel — always mounted beside the chart that produced the scan. */
export function ChartPatternHud({ symbol, scan }: ChartPatternHudProps) {
  if (!scan) return null;

  const chartPatterns = scan.patterns.filter((p) => p.category === 'chart').slice(-5);
  const candlePatterns = scan.patterns.filter((p) => p.category === 'candlestick').slice(-5);
  const total = scan.patterns.length;

  return (
    <div
      className="absolute bottom-3 left-3 z-50 w-64 max-h-56 overflow-hidden rounded-xl border border-[#00D9FF]/30 bg-black/90 p-3 font-mono shadow-[0_0_24px_rgba(0,217,255,0.15)] backdrop-blur-md pointer-events-auto"
      id={`pattern-hud-${symbol}`}
    >
      <div className="mb-2 flex items-center gap-2 border-b border-white/10 pb-2">
        <Scan size={14} className="text-[#00D9FF]" />
        <span className="text-[10px] font-black uppercase tracking-wider text-white">Pattern Scanner</span>
        <span className="ml-auto text-[10px] text-[#00D9FF]">{symbol}</span>
      </div>

      <p className="mb-2 text-[9px] leading-relaxed text-white/45">
        {total > 0
          ? `${total} hits on ${scan.scannedBars.toLocaleString()} bars · red/green trendlines = chart geometry`
          : `Scanned ${scan.scannedBars.toLocaleString()} bars · no patterns on this symbol yet`}
      </p>

      {chartPatterns.length > 0 && (
        <div className="mb-2">
          <p className="mb-1 text-[8px] font-bold uppercase tracking-widest text-white/30">Chart geometry</p>
          <div className="space-y-1">
            {chartPatterns.map((p, i) => {
              const Icon = DIRECTION_ICON[p.direction];
              return (
                <div key={`chart-${p.id}-${p.time}-${i}`} className="flex items-center gap-1.5 rounded bg-white/5 px-2 py-1 text-[10px]">
                  <Icon size={10} className={DIRECTION_COLOR[p.direction]} />
                  <span className="flex-1 truncate text-white/85">{p.label}</span>
                  <span className="text-white/35">{Math.round(p.confidence * 100)}%</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {candlePatterns.length > 0 && (
        <div>
          <p className="mb-1 text-[8px] font-bold uppercase tracking-widest text-white/30">Candlesticks</p>
          <div className="space-y-1 max-h-20 overflow-y-auto">
            {candlePatterns.map((p, i) => {
              const Icon = DIRECTION_ICON[p.direction];
              return (
                <div key={`candle-${p.id}-${p.time}-${i}`} className="flex items-center gap-1.5 rounded bg-white/5 px-2 py-1 text-[10px]">
                  <Icon size={10} className={DIRECTION_COLOR[p.direction]} />
                  <span className="flex-1 truncate text-white/75">{p.label}</span>
                  <span className="text-white/35">{Math.round(p.confidence * 100)}%</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
