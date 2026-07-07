import React from 'react';
import { Radio, ChevronRight, X } from 'lucide-react';
import type { FormingPossibility, FormingStructureBrief } from '../../patterns/forming';

const STATUS_STYLE: Record<FormingPossibility['status'], string> = {
  forming: 'text-[#FF1493] border-[#FF1493]/50 bg-[#FF1493]/10',
  possible: 'text-[#BF00FF] border-[#BF00FF]/40 bg-[#BF00FF]/10',
  watch: 'text-[#9D00FF] border-[#9D00FF]/30 bg-[#9D00FF]/5',
};

interface ChartFormingWatchProps {
  symbol: string;
  brief: FormingStructureBrief | null;
  onClose?: () => void;
}

/** Live forming-pattern probabilities — per chart, every symbol and timeframe. */
export function ChartFormingWatch({ symbol, brief, onClose }: ChartFormingWatchProps) {
  if (!brief) return null;

  return (
    <div
      className="absolute top-3 right-3 z-50 w-72 max-h-52 overflow-hidden rounded-xl border border-[#BF00FF]/35 bg-black/92 p-3 pt-4 font-mono shadow-[0_0_24px_rgba(191,0,255,0.2)] backdrop-blur-md pointer-events-auto"
      id={`forming-watch-${symbol}`}
    >
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label="Close forming watch"
          title="Close forming watch"
          className="absolute top-2 right-2 z-10 flex h-7 w-7 items-center justify-center rounded-full border border-[#BF00FF]/50 bg-black/90 text-[#BF00FF] shadow-[0_0_12px_rgba(191,0,255,0.35)] transition-all hover:border-[#BF00FF] hover:bg-[#BF00FF]/20 hover:text-white"
        >
          <X size={14} strokeWidth={2.5} />
        </button>
      )}
      <div className="mb-2 flex items-center gap-2 border-b border-[#FF1493]/25 pb-2 pr-8">
        <Radio size={13} className="text-[#FF1493] animate-pulse" />
        <span className="text-[10px] font-black uppercase tracking-wider text-white">Forming Watch</span>
        <span className="ml-auto text-[9px] text-[#BF00FF]">{brief.symbol} · {brief.timeframe}</span>
      </div>

      {brief.clock.active && (
        <p className="mb-2 text-[9px] leading-relaxed text-[#FF00CC]/90">
          {brief.clock.type === '16-bar-retrace' ? '16' : '12'}-bar clock:{' '}
          <strong>
            {brief.clock.bar}/{brief.clock.total}
          </strong>{' '}
          — {brief.clock.reason}
        </p>
      )}

      {brief.possibilities.length === 0 ? (
        <p className="text-[9px] text-white/45">Scanning structure… ask C.P.T. Buddy what may be forming.</p>
      ) : (
        <div className="space-y-1 overflow-y-auto max-h-32">
          {brief.possibilities.map((p) => (
            <div
              key={p.id}
              className={`rounded border px-2 py-1.5 text-[10px] ${STATUS_STYLE[p.status]}`}
            >
              <div className="flex items-center gap-1">
                <ChevronRight size={10} />
                <span className="font-bold uppercase tracking-wide">{p.status}</span>
                <span className="flex-1 truncate text-white/90">{p.label}</span>
                <span>{Math.round(p.probability * 100)}%</span>
              </div>
              <p className="mt-0.5 pl-3 text-[8px] text-white/50 leading-snug">{p.detail}</p>
            </div>
          ))}
        </div>
      )}

      <p className="mt-2 text-[8px] text-white/30">Possible only — not confirmed. Ask C.P.T. for detail.</p>
    </div>
  );
}
