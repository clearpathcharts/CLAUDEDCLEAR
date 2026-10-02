import { normalizeChartTimeframe } from "../../constants/chartTimeframes";

/** Native candle intervals. Each one is a different Twelve Data bar size. */
export const CHART_INTERVALS = [
  { id: "1m", label: "1m" },
  { id: "5m", label: "5m" },
  { id: "15m", label: "15m" },
  { id: "30m", label: "30m" },
  { id: "1h", label: "1H" },
  { id: "4h", label: "4H" },
  { id: "1d", label: "1D" },
] as const;

export function ChartIntervalBar({
  value,
  onChange,
  isLocked,
  lockReason = "Intraday charts start at Silver",
}: {
  value: string;
  onChange: (timeframe: string) => void;
  isLocked?: (id: string) => boolean;
  lockReason?: string;
}) {
  const current = normalizeChartTimeframe(value);

  return (
    <div
      className="flex items-center gap-1 min-w-0 w-full overflow-x-auto no-scrollbar flex-nowrap"
      role="group"
      aria-label="Chart timeframe"
    >
      <span className="text-[8px] font-black uppercase tracking-widest text-cyan-300/80 shrink-0 pr-1">
        Time
      </span>
      {CHART_INTERVALS.map((opt) => {
        const active = current === opt.id;
        const locked = isLocked?.(opt.id) === true;
        return (
          <button
            key={opt.id}
            type="button"
            disabled={locked}
            aria-pressed={active}
            title={locked ? lockReason : `${opt.label} candles`}
            onClick={() => {
              if (locked || active) return;
              onChange(opt.id);
            }}
            className={`rounded-md border px-2 py-1 font-mono font-black uppercase tracking-wider shrink-0 text-[10px] min-w-[36px] ${
              locked
                ? "border-white/10 bg-black/40 text-zinc-600 cursor-not-allowed"
                : active
                  ? "border-cyan-300 bg-cyan-400/20 text-cyan-100 shadow-[0_0_10px_rgba(0,229,255,0.35)]"
                  : "border-cyan-500/40 bg-black/50 text-cyan-200/80 hover:bg-cyan-950/50"
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
