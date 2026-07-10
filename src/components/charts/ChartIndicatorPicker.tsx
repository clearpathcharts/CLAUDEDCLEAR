import React from "react";
import { Sliders, Check } from "lucide-react";
import { SUPPORTED_CHART_INDICATORS } from "../../config/tradingViewIndicators";

interface ChartIndicatorPickerProps {
  activeIndicators: string[];
  onToggle: (abbr: string) => void;
  onClear: () => void;
}

/** Compact indicator toggles for the Charts / Market Terminal tab. */
export function ChartIndicatorPicker({
  activeIndicators,
  onToggle,
  onClear,
}: ChartIndicatorPickerProps) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/60 backdrop-blur-md p-4 space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-[#00D9FF]">
          <Sliders size={14} />
          <span className="text-sm font-black uppercase tracking-widest text-white">
            Indicators
          </span>
          <span className="text-xs font-mono text-zinc-500">
            ({activeIndicators.length} active)
          </span>
        </div>
        {activeIndicators.length > 0 && (
          <button
            type="button"
            onClick={onClear}
            className="text-xs font-black uppercase tracking-wider text-zinc-500 hover:text-red-400 transition-colors"
          >
            Clear all
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {SUPPORTED_CHART_INDICATORS.map((ind) => {
          const isActive = activeIndicators.includes(ind.abbr);
          return (
            <button
              key={ind.abbr}
              type="button"
              onClick={() => onToggle(ind.abbr)}
              className={`px-3 py-1.5 rounded-lg border text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 ${
                isActive
                  ? "border-[#00D9FF]/50 bg-[#00D9FF]/10 text-[#00D9FF] shadow-[0_0_10px_rgba(0,217,255,0.2)]"
                  : "border-zinc-800 bg-black/40 text-zinc-400 hover:border-zinc-600 hover:text-white"
              }`}
              style={isActive ? { borderLeftColor: ind.activeColor, borderLeftWidth: 3 } : undefined}
            >
              {isActive && <Check size={12} className="stroke-[3px]" />}
              {ind.abbr}
            </button>
          );
        })}
      </div>

      <p className="text-xs text-zinc-500 font-mono">
        Computed locally from live candle data — no extra API calls.
      </p>
    </div>
  );
}
