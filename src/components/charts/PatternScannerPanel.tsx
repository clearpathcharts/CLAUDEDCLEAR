import React, { useEffect, useRef, useState } from "react";
import { Scan, TrendingUp, TrendingDown, Minus, Radio, ChevronRight, ChevronUp, ChevronDown } from "lucide-react";
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
import { describeBarWindow } from "../../patterns/forming";
import { getLatencyClass, LATENCY_LABEL, type LatencyClass } from "../../constants/assetRegistry";

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

const LATENCY_BADGE: Record<LatencyClass, string> = {
  realtime: "text-emerald-300 border-emerald-500/40 bg-emerald-500/10",
  delayed: "text-amber-300 border-amber-500/40 bg-amber-500/10",
  eod: "text-sky-300 border-sky-500/40 bg-sky-500/10",
  derived: "text-violet-300 border-violet-500/40 bg-violet-500/10",
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
  const hitsRef = useRef<HTMLDivElement>(null);
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
  const latency = hasSymbol ? getLatencyClass(symbol) : null;

  const byGroup = GROUP_ORDER.map((group) => ({
    group,
    items: chartPatterns.filter((p) => p.patternGroup === group),
  })).filter((g) => g.items.length > 0);

  const scrollHits = (dir: -1 | 1) => {
    hitsRef.current?.scrollBy({ top: dir * 120, behavior: "smooth" });
  };

  return (
    <div
      className={`flex flex-col rounded-2xl border border-[#FF1493]/30 bg-black/80 backdrop-blur-md font-mono shadow-[0_0_24px_rgba(255,20,147,0.12)] ${
        compact ? "h-full min-h-0" : "h-[min(86dvh,960px)] min-h-[560px]"
      }`}
    >
      <div className="shrink-0 p-4 border-b border-[#BF00FF]/25">
        <div className="flex items-center gap-2 mb-2">
          <Scan size={18} className="text-[#FF1493]" />
          <span className="text-sm font-black uppercase tracking-wider text-white">Pattern Scanner</span>
        </div>
        <div className="flex items-center justify-between text-xs text-zinc-400 gap-2 flex-wrap">
          <span className="text-[#BF00FF] font-bold">{symbol}</span>
          <span className="flex items-center gap-2">
            {latency && (
              <span
                className={`text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded border ${LATENCY_BADGE[latency]}`}
                title={
                  latency === "derived"
                    ? "Computed from live FX components — not a single exchange print"
                    : latency === "delayed"
                      ? "Venture feed for this asset is delayed — not realtime"
                      : latency === "eod"
                        ? "End-of-day / session close style updates"
                        : "Realtime Venture feed"
                }
              >
                {LATENCY_LABEL[latency]}
              </span>
            )}
            <span>{timeframe.toUpperCase()}</span>
          </span>
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

      <div className="flex-1 min-h-0 flex">
        <div
          ref={hitsRef}
          className="pattern-scanner-scroll flex-1 min-h-0 overflow-y-scroll p-4 space-y-4"
          data-testid="pattern-scanner-hits"
        >
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

        {hasSymbol && (
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-widest text-white/40">Candlesticks</p>
            {candlePatterns.length > 0 ? (
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
            ) : (
              <p className="text-xs text-white/35 py-6 text-center">No candlestick hits yet — this list scrolls when they appear.</p>
            )}
          </div>
        )}

        {hasSymbol && total === 0 && !forming && (
          <p className="text-xs text-white/40 text-center py-6">
            No patterns detected yet. Lines appear on the chart when structures are found.
          </p>
        )}
        </div>

        <div
          className="shrink-0 flex flex-col items-center justify-between border-l border-[#FF1493]/45 bg-[#14000a] py-1 w-8"
          data-testid="pattern-scanner-scroll-rail"
          title="Scroll pattern hits"
        >
          <button
            type="button"
            onClick={() => scrollHits(-1)}
            aria-label="Scroll pattern list up"
            className="rounded-md border border-[#FF1493]/50 p-1 text-[#FF1493] hover:bg-[#FF1493]/20"
          >
            <ChevronUp size={16} />
          </button>
          <span className="flex-1 w-1 my-1 rounded-full bg-gradient-to-b from-[#FF1493] to-[#BF00FF]" aria-hidden />
          <button
            type="button"
            onClick={() => scrollHits(1)}
            aria-label="Scroll pattern list down"
            className="rounded-md border border-[#FF1493]/50 p-1 text-[#FF1493] hover:bg-[#FF1493]/20"
          >
            <ChevronDown size={16} />
          </button>
        </div>
      </div>

      {hasSymbol && forming && (
        <div className="shrink-0 border-t border-[#FF1493]/20 p-4 bg-[#0a0014]/60">
          <div className="flex items-center gap-2 mb-2">
            <Radio size={14} className="text-[#FF1493] animate-pulse" />
            <span className="text-xs font-black uppercase tracking-wider text-white">Forming Watch</span>
          </div>

          {forming.clock.active && (
            <div className="mb-3 rounded-lg border border-[#FF00CC]/35 bg-[#FF00CC]/5 px-3 py-2 space-y-1.5">
              <p className="text-xs leading-relaxed text-[#FF00CC]">
                <span className="font-black uppercase tracking-wide">
                  {forming.clock.type === "16-bar-retrace" ? "16" : "12"}-candle clock
                </span>
                {" · "}
                <strong>
                  {forming.clock.bar}/{forming.clock.total}
                </strong>
              </p>
              <p className="text-[11px] leading-snug text-white/75">
                This is a countdown of <strong>candles on your current timeframe</strong>
                {" "}({timeframe.toUpperCase()}) — not a 12-hour chart and not “12 data.”
                {" "}Window = {describeBarWindow(forming.clock.total, timeframe)}.
              </p>
              <p className="text-[11px] leading-snug text-white/50">{forming.clock.reason}</p>
            </div>
          )}

          {forming.possibilities.length === 0 ? (
            <p className="text-xs text-white/45">Scanning structure for early setups…</p>
          ) : (
            <div className="space-y-1.5">
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
