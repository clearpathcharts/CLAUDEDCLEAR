"use client";

import { useEffect, useId, useRef, useState } from "react";
import { CandlestickChart, ChevronDown } from "lucide-react";
import {
  PRICE_SERIES_GROUPS,
  PRICE_SERIES_OPTIONS,
  priceSeriesLabel,
  type PriceSeriesType,
} from "../../lib/charts/priceSeriesStyles";

export function ChartSeriesStylePicker({
  value,
  onChange,
  compact = false,
}: {
  value: PriceSeriesType;
  onChange: (next: PriceSeriesType) => void;
  compact?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative inline-flex" data-testid="chart-series-style-picker">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={menuId}
        title="Chart style"
        onClick={() => setOpen((v) => !v)}
        className={`inline-flex items-center gap-1.5 rounded-md border border-white/15 bg-black/70 font-mono font-black uppercase tracking-wider text-zinc-200 hover:border-[#00D9FF]/50 hover:text-[#00D9FF] ${
          compact ? "h-7 px-1.5 text-[8px]" : "h-8 px-2 text-[9px]"
        }`}
      >
        <CandlestickChart size={compact ? 11 : 13} />
        <span className="max-w-[9rem] truncate">{priceSeriesLabel(value)}</span>
        <ChevronDown size={11} className={open ? "rotate-180" : ""} />
      </button>
      {open ? (
        <div
          id={menuId}
          role="listbox"
          aria-label="Chart style"
          className="absolute left-0 top-[calc(100%+4px)] z-[80] max-h-[min(70vh,28rem)] w-[17.5rem] overflow-y-auto rounded-lg border border-white/15 bg-[#1b1b1f] py-1 shadow-[0_16px_40px_rgba(0,0,0,0.55)]"
        >
          {PRICE_SERIES_GROUPS.map((group, gi) => (
            <div key={group.id} className={gi > 0 ? "border-t border-white/10 pt-1 mt-1" : ""}>
              {PRICE_SERIES_OPTIONS.filter((o) => o.group === group.id).map((opt) => {
                const active = opt.id === value;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    role="option"
                    aria-selected={active}
                    title={opt.hint}
                    onClick={() => {
                      onChange(opt.id);
                      setOpen(false);
                    }}
                    className={`flex w-full items-start gap-2 px-3 py-1.5 text-left transition-colors ${
                      active ? "bg-white/12 text-white" : "text-zinc-200 hover:bg-white/8"
                    }`}
                  >
                    <span className="mt-0.5 w-3 shrink-0 text-[10px] text-[#00D9FF]">{active ? "●" : ""}</span>
                    <span className="min-w-0">
                      <span className="block text-[12px] font-medium leading-tight">{opt.label}</span>
                      <span className="block text-[9px] leading-snug text-zinc-500">{opt.hint}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
