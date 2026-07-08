import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Radio, Scan, TrendingDown, TrendingUp, Minus, X } from 'lucide-react';
import type { FormingStructureBrief } from '../../patterns/forming';
import type { PatternScanResult } from '../../patterns';
import { PATTERN_GROUP_LABELS } from '../../patterns';

const DIRECTION_ICON = {
  bullish: TrendingUp,
  bearish: TrendingDown,
  neutral: Minus,
};

const STATUS_STYLE: Record<string, string> = {
  forming: 'text-[#FF1493] border-[#FF1493]/50 bg-[#FF1493]/10',
  possible: 'text-[#BF00FF] border-[#BF00FF]/40 bg-[#BF00FF]/10',
  watch: 'text-[#9D00FF] border-[#9D00FF]/30 bg-[#9D00FF]/5',
};

interface ChartScannerDockProps {
  symbol: string;
  scan: PatternScanResult | null;
  forming: FormingStructureBrief | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** Mobile-only: one dock for pattern + forming — chart stays visible when collapsed. */
export function ChartScannerDock({ symbol, scan, forming, open, onOpenChange }: ChartScannerDockProps) {
  const [tab, setTab] = useState<'patterns' | 'forming'>('patterns');

  const totalHits = scan?.patterns.length ?? 0;
  const formingCount = forming?.possibilities.length ?? 0;
  const chartPatterns = scan?.patterns.filter((p) => p.category === 'chart').slice(-6) ?? [];
  const candlePatterns = scan?.patterns.filter((p) => p.category === 'candlestick').slice(-4) ?? [];

  return (
    <div className="absolute inset-x-0 bottom-0 z-[60] pointer-events-none flex flex-col items-stretch">
      {!open && (
        <button
          type="button"
          onClick={() => onOpenChange(true)}
          className="pointer-events-auto mx-2 mb-2 flex items-center justify-between gap-2 rounded-xl border border-[#FF1493]/45 bg-black/92 px-3 py-2.5 font-mono shadow-[0_0_20px_rgba(255,20,147,0.35)] backdrop-blur-md"
          aria-label="Open pattern scanner"
        >
          <span className="flex items-center gap-2 text-[10px] font-black uppercase tracking-wider text-white">
            <Scan size={12} className="text-[#FF1493]" />
            Scanner
            <span className="text-[#BF00FF]">{symbol}</span>
          </span>
          <span className="text-[9px] text-zinc-400">
            {totalHits} hits
            {formingCount > 0 ? ` · ${formingCount} forming` : ''}
          </span>
          <ChevronUp size={14} className="text-[#FF4500] shrink-0" />
        </button>
      )}

      {open && (
        <div className="pointer-events-auto mx-0 max-h-[42vh] rounded-t-2xl border border-[#FF1493]/40 border-b-0 bg-black/95 shadow-[0_-8px_32px_rgba(255,20,147,0.25)] backdrop-blur-xl font-mono flex flex-col">
          <div className="flex items-center gap-2 border-b border-[#BF00FF]/25 px-3 py-2.5 shrink-0">
            <button
              type="button"
              onClick={() => setTab('patterns')}
              className={`flex-1 rounded-lg px-2 py-1.5 text-[9px] font-black uppercase tracking-wider transition-all ${
                tab === 'patterns'
                  ? 'bg-[#FF1493]/20 border border-[#FF1493]/50 text-white'
                  : 'border border-transparent text-zinc-500'
              }`}
            >
              Patterns ({totalHits})
            </button>
            <button
              type="button"
              onClick={() => setTab('forming')}
              className={`flex-1 rounded-lg px-2 py-1.5 text-[9px] font-black uppercase tracking-wider transition-all ${
                tab === 'forming'
                  ? 'bg-[#BF00FF]/20 border border-[#BF00FF]/50 text-white'
                  : 'border border-transparent text-zinc-500'
              }`}
            >
              Forming ({formingCount})
            </button>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              aria-label="Close scanner dock"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#FF1493]/50 text-[#FF1493]"
            >
              <X size={16} />
            </button>
          </div>

          <div className="overflow-y-auto custom-scrollbar px-3 py-2 flex-1 min-h-0">
            {tab === 'patterns' && (
              <div className="space-y-2">
                <p className="text-[8px] text-white/45 leading-relaxed">
                  Recent {scan?.scannedBars.toLocaleString() ?? 0} bars · green ↑ bullish · red ↓ bearish
                </p>
                {chartPatterns.length > 0 && (
                  <div>
                    <p className="mb-1 text-[8px] font-bold uppercase tracking-widest text-[#FF1493]">
                      {PATTERN_GROUP_LABELS.continuation} / {PATTERN_GROUP_LABELS.reversal}
                    </p>
                    <div className="space-y-1">
                      {chartPatterns.map((p, i) => {
                        const Icon = DIRECTION_ICON[p.direction];
                        return (
                          <div key={`cp-${p.id}-${i}`} className="flex items-center gap-1.5 rounded border border-[#FF00CC]/15 bg-[#BF00FF]/5 px-2 py-1 text-[10px]">
                            <Icon size={10} className="text-[#FF1493]" />
                            <span className="flex-1 truncate text-white/90">{p.label}</span>
                            <span className="text-[#9D00FF]">{Math.round(p.confidence * 100)}%</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
                {candlePatterns.length > 0 && (
                  <div>
                    <p className="mb-1 text-[8px] font-bold uppercase tracking-widest text-white/35">Candlesticks</p>
                    <div className="space-y-1">
                      {candlePatterns.map((p, i) => {
                        const Icon = DIRECTION_ICON[p.direction];
                        return (
                          <div key={`cs-${p.id}-${i}`} className="flex items-center gap-1.5 rounded bg-white/5 px-2 py-1 text-[10px]">
                            <Icon size={10} className={p.direction === 'bullish' ? 'text-green-400' : p.direction === 'bearish' ? 'text-red-400' : 'text-yellow-400'} />
                            <span className="flex-1 truncate text-white/75">{p.label}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
                {totalHits === 0 && (
                  <p className="text-[9px] text-white/45 py-4 text-center">No patterns in recent window.</p>
                )}
              </div>
            )}

            {tab === 'forming' && (
              <div className="space-y-2">
                {forming?.clock.active && (
                  <p className="text-[9px] leading-relaxed text-[#FF00CC]/90">
                    {forming.clock.type === '16-bar-retrace' ? '16' : '12'}-bar clock:{' '}
                    <strong>{forming.clock.bar}/{forming.clock.total}</strong> — {forming.clock.reason}
                  </p>
                )}
                {formingCount === 0 ? (
                  <p className="text-[9px] text-white/45 py-4 text-center">Scanning structure…</p>
                ) : (
                  <div className="space-y-1">
                    {forming!.possibilities.map((p) => (
                      <div key={p.id} className={`rounded border px-2 py-1.5 text-[10px] ${STATUS_STYLE[p.status]}`}>
                        <div className="flex items-center gap-1">
                          <span className="font-bold uppercase tracking-wide text-[8px]">{p.status}</span>
                          <span className="flex-1 truncate text-white/90">{p.label}</span>
                          <span>{Math.round(p.probability * 100)}%</span>
                        </div>
                        <p className="mt-0.5 text-[8px] text-white/50 leading-snug">{p.detail}</p>
                      </div>
                    ))}
                  </div>
                )}
                <p className="text-[8px] text-white/30">Possible only — not confirmed.</p>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="shrink-0 flex items-center justify-center gap-1 border-t border-white/10 py-1.5 text-[8px] font-bold uppercase tracking-widest text-zinc-500"
          >
            <ChevronDown size={12} />
            Show chart
          </button>
        </div>
      )}
    </div>
  );
}
