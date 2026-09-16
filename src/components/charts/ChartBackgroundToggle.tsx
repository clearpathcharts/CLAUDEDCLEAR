import React from "react";
import { useChartBackgroundMode } from "../../hooks/useChartBackgroundMode";
import type { ChartBackgroundMode } from "../../lib/charts/chartBackground";

const OPTIONS: { id: ChartBackgroundMode; label: string }[] = [
  { id: "white", label: "White" },
  { id: "black", label: "Black" },
  { id: "profile", label: "Theme" },
];

export function ChartBackgroundToggle({
  compact = false,
}: {
  compact?: boolean;
}) {
  const [mode, setMode] = useChartBackgroundMode();

  return (
    <div
      role="group"
      aria-label="Chart background"
      className={`flex items-center ${compact ? "gap-0.5" : "gap-1"}`}
    >
      {OPTIONS.map((opt) => {
        const active = mode === opt.id;
        return (
          <button
            key={opt.id}
            type="button"
            aria-pressed={active}
            onClick={() => setMode(opt.id)}
            className={`rounded-md border uppercase font-mono font-black tracking-wider cursor-pointer transition-all ${
              compact ? "h-7 px-1.5 text-[8px]" : "h-8 px-2 text-[9px]"
            }`}
            style={{
              color: active ? "#ffffff" : "rgba(255,255,255,0.7)",
              borderColor: active
                ? opt.id === "white"
                  ? "#e5e7eb"
                  : opt.id === "black"
                    ? "#00D9FF"
                    : "#FF007F"
                : "rgba(255,255,255,0.15)",
              background:
                opt.id === "white"
                  ? active
                    ? "#ffffff"
                    : "rgba(255,255,255,0.12)"
                  : opt.id === "black"
                    ? active
                      ? "#000000"
                      : "rgba(0,0,0,0.55)"
                    : active
                      ? "linear-gradient(135deg, #FF007F 0%, #FF4500 60%, #3a0000 100%)"
                      : "rgba(10, 10, 18, 0.5)",
              boxShadow: active
                ? opt.id === "white"
                  ? "0 0 10px rgba(255,255,255,0.45)"
                  : opt.id === "black"
                    ? "0 0 10px rgba(0,217,255,0.35)"
                    : "0 0 10px rgba(255,0,127,0.45)"
                : "none",
            }}
          >
            <span style={{ color: opt.id === "white" ? (active ? "#111827" : "#e5e7eb") : undefined }}>
              {opt.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
