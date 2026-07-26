import React, { useEffect, useState } from "react";
import { Scan, TrendingUp, TrendingDown, Minus, Radio, ChevronRight } from "lucide-react";
import {
  getActivePatternScan,
  getPatternScan,
  subscribePatternScan,
  PATTERN_GROUP_LABELS,
  getFormingBrief,
  subscribeFormingBrief,
  type PatternGroup,
  type PatternScanResult,
} from "../../patterns";
import type { FormingPossibility } from "../../patterns/forming";

function resolvePanelScan(symbol: string, timeframe: string): PatternScanResult | null {
  if (symbol && symbol !== "—") {
    const keyed = getPatternScan(symbol, timeframe);
    if (keyed?.scan) return keyed.scan;
  }
  return getActivePatternScan();
}

const DIRECTION_ICON = {
  bullish: TrendingUp,
  bearish: TrendingDown,
  neutral: Minus,
};

const GROUP_ORDER: PatternGroup[] = ["continuation", "reversal"];

const GROUP_BADGE: Record<PatternGroup, string> = {
  continuation: "text-[#FF1493] border-[#FF1493]/40 bg-[#FF1493]/10",
  reversal: "text-[#BF00FF] border-[#BF00FF]/40 bg-[#BF00FF]/10",
};

const FORMING_STATUS: Record<FormingPossibility["status"], string> = {
  forming: "text-[#FF1493] border-[#FF1493]/50 bg-[#FF1493]/10",
  possible: "text-[#BF00FF] border-[#BF00FF]/40 bg-[#BF00FF]/10",
  watch: "text-[#9D00FF] border-[#9D00FF]/30 bg-[#9D00FF]/5",
};

interface PatternScannerPanelProps {
  symbol: string;
  timeframe: string;
  compact?: boolean;
}

/**
 * Dedicated left-column pattern readout for the Charts terminal.
 * Replaces floating HUD overlays on the chart canvas.
 */
export function PatternScannerPanel({ symbol, timeframe, compact = false }: PatternScannerPanelProps) {
  const [scan, setScan] = useState<PatternScanResult | null>(() => resolvePanelScan(symbol, timeframe));
  const [forming, setForming] = useState(() => getFormingBrief(symbol, timeframe));
  const hasSymbol = Boolean(symbol && symbol !== '—');

  useEffect(() => {
    const refresh = () => setScan(resolvePanelScan(symbol, timeframe));
    refresh();
    return subscribePatternScan(refresh);
  }, [symbol, timeframe]);

  useEffect(() => {
    const refresh = () => setForming(getFormingBrief(symbol, timeframe));
    refresh();
    return subscribeFormingBrief(refresh);
  }, [symbol, timeframe]);

  const chartPatterns = scan?.patterns.filter((p) => p.category === "chart").slice(-20) ?? [];
  const candlePatterns = scan?.patterns.filter((p) => p.category === "candlestick").slice(-12) ?? [];
  const total = scan?.patterns.length ?? 0;

  const byGroup = GROUP_ORDER.map((group) => ({
    group,
    items: chartPatterns.filter((p) => p.patternGroup === group),
  })).filter((g) => g.items.length > 0);

  return (
    <div
      className={`flex flex-col rounded-2xl border border-[#FF1493]/30 bg-black/80 backdrop-blur-md font-mono shadow-[0_0_24px_rgba(255,20,147,0.12)] ${
        compact ? "h-full min-h-0" : "min-h-[520px]"
      }`}
    >
      <div className="shrink-0 p-4 border-b border-[#BF00FF]/25">
        <div className="flex items-center gap-2 mb-2">
          <Scan size={18} className="text-[#FF1493]" />
          <span className="text-sm font-black uppercase tracking-wider text-white">Pattern Scanner</span>
        </div>
        <div className="flex items-center justify-between text-xs text-zinc-400">
          <span className="text-[#BF00FF] font-bold">{symbol}</span>
          <span>{timeframe.toUpperCase()}</span>
        </div>
        <p className="mt-2 text-xs leading-relaxed text-white/50">
          {!hasSymbol
            ? "Load a symbol in any chart slot — the scanner needs candles to read structure."
            : total > 0
              ? `${total} hits · neon lines trace outside candles only`
              : scan
                ? `Scanned ${scan.scannedBars.toLocaleString()} bars · geometry draws on chart load`
                : "Chart loading… pattern scan runs as soon as candles arrive."}
        </p>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-4 space-y-4">
        {!hasSymbol && (
          <p className="text-xs text-center py-8 text-zinc-500 leading-relaxed">
            Search your chart in any slot — pattern readouts show up here for the symbol you choose.
          </p>
        )}
        {hasSymbol && byGroup.map(({ group, items }) => (
          <div key={group}>
            <p className={`mb-2 inline-block rounded border px-2 py-0.5 text-xs font-bold uppercase tracking-widest ${GROUP_BADGE[group]}`}>
              {PATTERN_GROUP_LABELS[group]}
            </p>
            <div className="space-y-1.5">
              {items.map((p, i) => {
                const Icon = DIRECTION_ICON[p.direction];
                return (
                  <div
                    key={`${group}-${p.id}-${p.time}-${i}`}
                    className="flex items-center gap-2 rounded-lg border border-[#FF00CC]/15 bg-[#BF00FF]/5 px-3 py-2 text-sm"
                  >
                    <Icon size={14} className="text-[#FF1493] shrink-0" />
                    <span className="flex-1 text-white/90 leading-snug">{p.label}</span>
                    <span className="text-[#9D00FF] text-xs font-bold">{Math.round(p.confidence * 100)}%</span>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {hasSymbol && candlePatterns.length > 0 && (
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-widest text-white/40">Candlesticks</p>
            <div className="space-y-1.5">
              {candlePatterns.map((p, i) => {
                const Icon = DIRECTION_ICON[p.direction];
                return (
                  <div
                    key={`candle-${p.id}-${p.time}-${i}`}
                    className="flex items-center gap-2 rounded-lg bg-white/5 px-3 py-2 text-sm"
                  >
                    <Icon
                      size={14}
                      className={
                        p.direction === "bullish"
                          ? "text-green-400"
                          : p.direction === "bearish"
                            ? "text-red-400"
                            : "text-yellow-400"
                      }
                    />
                    <span className="flex-1 text-white/80">{p.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {hasSymbol && total === 0 && !forming && (
          <p className="text-xs text-white/40 text-center py-6">
            No patterns detected yet. Lines appear on the chart when structures are found.
          </p>
        )}
      </div>

      {hasSymbol && forming && (
        <div className="shrink-0 border-t border-[#FF1493]/20 p-4 bg-[#0a0014]/60">
          <div className="flex items-center gap-2 mb-2">
            <Radio size={14} className="text-[#FF1493] animate-pulse" />
            <span className="text-xs font-black uppercase tracking-wider text-white">Forming Watch</span>
          </div>

          {forming.clock.active && (
            <p className="mb-2 text-xs leading-relaxed text-[#FF00CC]/90">
              {forming.clock.type === "16-bar-retrace" ? "16" : "12"}-bar clock:{" "}
              <strong>
                {forming.clock.bar}/{forming.clock.total}
              </strong>{" "}
              — {forming.clock.reason}
            </p>
          )}

          {forming.possibilities.length === 0 ? (
            <p className="text-xs text-white/45">Scanning structure for early setups…</p>
          ) : (
            <div className="space-y-1.5 max-h-40 overflow-y-auto custom-scrollbar">
              {forming.possibilities.map((p) => (
                <div key={p.id} className={`rounded-lg border px-3 py-2 text-xs ${FORMING_STATUS[p.status]}`}>
                  <div className="flex items-center gap-1.5">
                    <ChevronRight size={12} />
                    <span className="font-bold uppercase">{p.status}</span>
                    <span className="flex-1 truncate">{p.label}</span>
                    <span>{Math.round(p.probability * 100)}%</span>
                  </div>
                  <p className="mt-1 pl-4 text-[11px] text-white/50 leading-snug">{p.detail}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
