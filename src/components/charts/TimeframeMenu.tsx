import { useEffect, useId, useRef, useState } from "react";
import { ChevronDown, X } from "lucide-react";
import {
  CHART_TIMEFRAME_GROUPS,
  chartTimeframeLabel,
  normalizeChartTimeframe,
} from "../../constants/chartTimeframes";

type Props = {
  value: string;
  onChange: (timeframe: string) => void;
  /** Return true to disable a row (e.g. Basic plan locks seconds/minutes). */
  isLocked?: (id: string) => boolean;
  lockReason?: string;
  compact?: boolean;
  tone?: "neon" | "desk";
  className?: string;
};

export function TimeframeMenu({
  value,
  onChange,
  isLocked,
  lockReason = "This interval starts at Silver",
  compact = false,
  tone = "neon",
  className = "",
}: Props) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const labelId = useId();
  const current = normalizeChartTimeframe(value);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    const onPointer = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("mousedown", onPointer);
    closeRef.current?.focus();
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("mousedown", onPointer);
    };
  }, [open]);

  const desk = tone === "desk";
  const triggerCls = desk
    ? "inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-sm font-black uppercase tracking-wide"
    : "inline-flex items-center gap-1.5 rounded-md border px-3 py-1 text-xs font-black uppercase tracking-wide";

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <button
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={labelId}
        onClick={() => setOpen((v) => !v)}
        className={triggerCls}
        style={
          desk
            ? {
                borderColor: "var(--desk-indigo, #818cf8)",
                color: "var(--desk-indigo, #818cf8)",
                background: "rgba(129,140,248,0.12)",
              }
            : {
                color: "#ffffff",
                borderColor: "#FF007F",
                background: "linear-gradient(135deg, #FF007F 0%, #FF4500 60%, #3a0000 100%)",
              }
        }
      >
        <span>{chartTimeframeLabel(current)}</span>
        <ChevronDown size={compact ? 12 : 14} aria-hidden="true" />
      </button>

      {open ? (
        <div
          id={labelId}
          role="dialog"
          aria-label="Chart timeframes"
          className="absolute left-0 z-[80] mt-2 w-[min(22rem,calc(100vw-1.5rem))] max-h-[min(28rem,70vh)] overflow-y-auto rounded-xl border border-white/15 bg-[#05070c] p-3 shadow-[0_12px_40px_rgba(0,0,0,0.55)]"
        >
          <div className="mb-2 flex items-center justify-between gap-2">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-400">
              Timeframes
            </p>
            <button
              ref={closeRef}
              type="button"
              onClick={() => setOpen(false)}
              className="inline-flex items-center gap-1 rounded-md border border-white/20 px-2 py-1 text-[10px] font-black uppercase tracking-widest text-zinc-200 hover:bg-white/10"
              aria-label="Close timeframe menu"
            >
              <X size={12} aria-hidden="true" />
              Close
            </button>
          </div>

          <div className="space-y-3">
            {CHART_TIMEFRAME_GROUPS.map((group) => (
              <section key={group.id} aria-label={group.title}>
                <h3 className="mb-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-zinc-500">
                  {group.title}
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {group.options.map((opt) => {
                    const active = current === opt.id;
                    const locked = isLocked?.(opt.id) === true;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        disabled={locked}
                        title={locked ? lockReason : opt.label}
                        aria-pressed={active}
                        onClick={() => {
                          if (locked) return;
                          onChange(opt.id);
                          setOpen(false);
                        }}
                        className="rounded-md border px-2 py-1 text-[10px] font-bold uppercase tracking-wide disabled:cursor-not-allowed disabled:opacity-30"
                        style={{
                          borderColor: active ? "#FF007F" : "rgba(255,255,255,0.12)",
                          color: active ? "#ffffff" : "rgba(255,255,255,0.78)",
                          background: active
                            ? "linear-gradient(135deg, #FF007F 0%, #FF4500 60%, #3a0000 100%)"
                            : "rgba(10, 10, 18, 0.6)",
                        }}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default TimeframeMenu;
