import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Scan, TrendingUp, TrendingDown, Minus, X } from 'lucide-react';
import { getActivePatternScan, subscribePatternScan, PATTERN_GROUP_LABELS } from '../patterns';
import type { PatternGroup } from '../patterns';

const DIRECTION_ICON = {
  bullish: TrendingUp,
  bearish: TrendingDown,
  neutral: Minus,
};

const GROUP_ORDER: PatternGroup[] = ['continuation', 'reversal'];

const GROUP_BADGE: Record<PatternGroup, string> = {
  continuation: 'text-[#FF1493] border-[#FF1493]/40',
  reversal: 'text-[#BF00FF] border-[#BF00FF]/40',
};

interface PatternOverlayProps {
  chartActive?: boolean;
}

export default function PatternOverlay({ chartActive = false }: PatternOverlayProps) {
  const [scan, setScan] = useState(getActivePatternScan());
  const [open, setOpen] = useState(false);

  useEffect(() => subscribePatternScan(() => setScan(getActivePatternScan())), []);

  const chartPatterns = scan?.patterns.filter((p) => p.category === 'chart').slice(-10) ?? [];
  const candlePatterns = scan?.patterns.filter((p) => p.category === 'candlestick').slice(-5) ?? [];
  const patternCount = scan?.patterns.length ?? 0;

  if (!chartActive && (!scan || patternCount === 0)) return null;

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-24 right-4 z-[120] flex items-center gap-2 rounded-full border border-[#FF1493]/40 bg-black/90 px-4 py-2 font-mono text-[10px] font-black uppercase tracking-wider text-[#FF1493] shadow-[0_0_20px_rgba(255,20,147,0.25)] backdrop-blur-md transition-all hover:border-[#BF00FF]/50 hover:text-[#BF00FF]"
        aria-label="Open pattern scanner"
      >
        <Scan size={14} />
        Pattern Scanner
      </button>
    );
  }

  const byGroup = GROUP_ORDER.map((group) => ({
    group,
    items: chartPatterns.filter((p) => p.patternGroup === group),
  })).filter((g) => g.items.length > 0);

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="fixed bottom-24 right-4 z-[120] w-80 overflow-visible rounded-xl border border-[#FF1493]/40 bg-black/92 p-4 pt-5 font-mono shadow-[0_0_32px_rgba(191,0,255,0.3)] backdrop-blur-md"
    >
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen(false);
        }}
        aria-label="Close pattern scanner"
        title="Close pattern scanner"
        className="absolute -top-2.5 -right-2.5 z-[130] flex h-9 w-9 items-center justify-center rounded-full border-2 border-[#FF1493] bg-[#1a0010] text-[#FF1493] shadow-[0_0_18px_rgba(255,20,147,0.55)] transition-all hover:scale-110 hover:bg-[#FF1493] hover:text-white"
      >
        <X size={18} strokeWidth={3} />
      </button>
      <div className="mb-3 flex items-center gap-2 border-b border-[#BF00FF]/30 pb-2 pr-10">
        <Scan size={16} className="text-[#FF1493]" />
        <span className="text-xs font-black uppercase tracking-wider text-white">Pattern Scanner</span>
        <span className="ml-auto text-xs text-[#BF00FF]">
          {patternCount > 0 ? `${patternCount} found` : 'active'}
        </span>
      </div>

      {patternCount === 0 ? (
        <p className="text-[10px] leading-relaxed text-white/50">
          {scan
            ? `Scanned ${scan.scannedBars.toLocaleString()} bars · continuation, reversal & bilateral shapes draw in hot pink / purple neon.`
            : 'Loading chart… pattern geometry runs on every chart load.'}
        </p>
      ) : (
        <>
          <p className="mb-3 text-[10px] text-[#FF00CC]/80">
            Neon geometry · lines never cut through candle bodies
          </p>

          {byGroup.map(({ group, items }) => (
            <div key={group} className="mb-2">
              <p className={`mb-1 text-[8px] font-bold uppercase tracking-widest ${GROUP_BADGE[group]}`}>
                {PATTERN_GROUP_LABELS[group]}
              </p>
              <div className="space-y-1">
                {items.map((p, i) => {
                  const Icon = DIRECTION_ICON[p.direction];
                  return (
                    <div key={`${group}-${p.id}-${i}`} className="flex items-center gap-2 rounded-lg border border-[#FF00CC]/20 bg-[#BF00FF]/10 px-2 py-1.5 text-xs">
                      <Icon size={12} className="text-[#FF1493]" />
                      <span className="flex-1 truncate text-white/85">{p.label}</span>
                      <span className="text-[#9D00FF]">{Math.round(p.confidence * 100)}%</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {candlePatterns.length > 0 && (
            <div className="mt-2 max-h-28 space-y-1 overflow-y-auto border-t border-white/10 pt-2">
              <p className="text-[8px] font-bold uppercase tracking-widest text-white/30">Candlesticks</p>
              {candlePatterns.map((p, i) => {
                const Icon = DIRECTION_ICON[p.direction];
                return (
                  <div key={`candle-${p.id}-${i}`} className="flex items-center gap-2 rounded bg-white/5 px-2 py-1 text-xs">
                    <Icon size={12} className="text-white/60" />
                    <span className="flex-1 truncate text-white/75">{p.label}</span>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </motion.div>
  );
}
