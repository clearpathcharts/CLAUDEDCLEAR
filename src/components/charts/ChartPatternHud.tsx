import React from 'react';
import { Scan, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import type { PatternScanResult, PatternGroup } from '../../patterns';
import { PATTERN_GROUP_LABELS } from '../../patterns';

const DIRECTION_ICON = {
  bullish: TrendingUp,
  bearish: TrendingDown,
  neutral: Minus,
};

const GROUP_ORDER: PatternGroup[] = ['continuation', 'reversal', 'bilateral'];

const GROUP_BADGE: Record<PatternGroup, string> = {
  continuation: 'text-[#FF1493] border-[#FF1493]/40 bg-[#FF1493]/10',
  reversal: 'text-[#BF00FF] border-[#BF00FF]/40 bg-[#BF00FF]/10',
  bilateral: 'text-[#9D00FF] border-[#9D00FF]/40 bg-[#9D00FF]/10',
};

interface ChartPatternHudProps {
  symbol: string;
  scan: PatternScanResult | null;
}

/** Per-chart pattern panel — always mounted beside the chart that produced the scan. */
export function ChartPatternHud({ symbol, scan }: ChartPatternHudProps) {
  if (!scan) return null;

  const chartPatterns = scan.patterns.filter((p) => p.category === 'chart').slice(-12);
  const candlePatterns = scan.patterns.filter((p) => p.category === 'candlestick').slice(-5);
  const total = scan.patterns.length;

  const byGroup = GROUP_ORDER.map((group) => ({
    group,
    items: chartPatterns.filter((p) => p.patternGroup === group),
  })).filter((g) => g.items.length > 0);

  return (
    <div
      className="absolute bottom-3 left-3 z-50 w-72 max-h-64 overflow-hidden rounded-xl border border-[#FF1493]/40 bg-black/92 p-3 font-mono shadow-[0_0_28px_rgba(255,20,147,0.25)] backdrop-blur-md pointer-events-auto"
      id={`pattern-hud-${symbol}`}
    >
      <div className="mb-2 flex items-center gap-2 border-b border-[#BF00FF]/30 pb-2">
        <Scan size={14} className="text-[#FF1493]" />
        <span className="text-[10px] font-black uppercase tracking-wider text-white">Pattern Scanner</span>
        <span className="ml-auto text-[10px] text-[#BF00FF]">{symbol}</span>
      </div>

      <p className="mb-2 text-[9px] leading-relaxed text-white/50">
        {total > 0
          ? `${total} hits · neon pink/purple geometry on chart`
          : `Scanned ${scan.scannedBars.toLocaleString()} bars · no patterns yet`}
      </p>

      {byGroup.map(({ group, items }) => (
        <div key={group} className="mb-2">
          <p className={`mb-1 inline-block rounded border px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-widest ${GROUP_BADGE[group]}`}>
            {PATTERN_GROUP_LABELS[group]}
          </p>
          <div className="mt-1 space-y-1">
            {items.map((p, i) => {
              const Icon = DIRECTION_ICON[p.direction];
              return (
                <div key={`${group}-${p.id}-${p.time}-${i}`} className="flex items-center gap-1.5 rounded border border-[#FF00CC]/15 bg-[#BF00FF]/5 px-2 py-1 text-[10px]">
                  <Icon size={10} className="text-[#FF1493]" />
                  <span className="flex-1 truncate text-white/90">{p.label}</span>
                  <span className="text-[#9D00FF]">{Math.round(p.confidence * 100)}%</span>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {candlePatterns.length > 0 && (
        <div>
          <p className="mb-1 text-[8px] font-bold uppercase tracking-widest text-white/30">Candlesticks</p>
          <div className="max-h-16 space-y-1 overflow-y-auto">
            {candlePatterns.map((p, i) => {
              const Icon = DIRECTION_ICON[p.direction];
              return (
                <div key={`candle-${p.id}-${p.time}-${i}`} className="flex items-center gap-1.5 rounded bg-white/5 px-2 py-1 text-[10px]">
                  <Icon size={10} className={p.direction === 'bullish' ? 'text-green-400' : p.direction === 'bearish' ? 'text-red-400' : 'text-yellow-400'} />
                  <span className="flex-1 truncate text-white/75">{p.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
