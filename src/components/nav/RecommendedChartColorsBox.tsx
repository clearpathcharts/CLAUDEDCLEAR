import React, { useEffect, useState } from "react";
import { useChartColorPreference } from "../../hooks/useChartColorPreference";
import {
  CEO_DAILY_COLOR_ROWS,
  CEO_DAILY_TRADING_COLORS,
  CHART_BACKGROUND_GRAYS,
  normalizeChartHex,
} from "../../lib/charts/ceoDailyColors";

/** Bumped so an older open box does not keep stealing chart height. */
export const CHART_COLORS_BOX_STORAGE_KEY = "clearpath_chart_colors_box_v1";
export const CHART_LAYOUT_EVENT = "clearpath-chart-layout";

function readColorsCollapsed(): boolean {
  try {
    return localStorage.getItem(CHART_COLORS_BOX_STORAGE_KEY) !== "0";
  } catch {
    return true;
  }
}

/**
 * Tab-bar box: any chart background, plus the CEO daily trading colors.
 * Starts collapsed so the home chart can fill the window.
 * Display preference only — not financial advice.
 */
export function RecommendedChartColorsBox({ compact = false }: { compact?: boolean }) {
  const pref = useChartColorPreference();
  const selected = pref.backgroundHex;
  const [collapsed, setCollapsed] = useState(readColorsCollapsed);

  useEffect(() => {
    try {
      localStorage.setItem(CHART_COLORS_BOX_STORAGE_KEY, collapsed ? "1" : "0");
    } catch {
      /* storage blocked — this visit still collapses */
    }
    const notify = () => window.dispatchEvent(new Event(CHART_LAYOUT_EVENT));
    notify();
    const raf = window.requestAnimationFrame(notify);
    return () => window.cancelAnimationFrame(raf);
  }, [collapsed]);

  const toggle = (
    <button
      type="button"
      data-testid="toggle-chart-colors-box"
      aria-expanded={!collapsed}
      onClick={() => setCollapsed((open) => !open)}
      className="rounded-full border border-[#00F5FF]/40 px-2.5 py-1 font-mono text-[9px] font-black uppercase tracking-wider text-[#00F5FF] hover:bg-[#00F5FF]/15"
    >
      {collapsed ? "Show colors" : "Hide colors"}
    </button>
  );

  const ceoButton = (
    <button
      type="button"
      data-testid="apply-ceo-daily-colors"
      aria-pressed={pref.ceoDaily}
      onClick={() => pref.applyCeoDaily()}
      className={`rounded-full border px-2.5 py-1 font-mono text-[9px] font-black uppercase tracking-wider ${
        pref.ceoDaily
          ? "border-[#00F5FF] bg-[#00F5FF]/15 text-[#00F5FF]"
          : "border-white/20 text-zinc-200 hover:border-[#00F5FF]/50"
      }`}
    >
      {pref.ceoDaily ? "CEO daily colors on" : "Use CEO daily colors"}
    </button>
  );

  const themeButton = pref.ceoDaily || selected ? (
    <button
      type="button"
      onClick={() => pref.clearPreference()}
      className="rounded-full border border-white/15 px-2 py-1 font-mono text-[9px] uppercase tracking-wider text-zinc-400 hover:text-white"
    >
      Chart theme
    </button>
  ) : null;

  if (collapsed) {
    return (
      <section
        data-testid="recommended-chart-colors"
        data-collapsed="true"
        aria-label="ClearPath recommended colors for your charts"
        className="rounded-xl border border-[#00F5FF]/25 bg-black/80 px-3 py-1.5"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="min-w-0 font-mono text-[10px] font-black uppercase tracking-[0.14em] text-white">
            ClearPath recommended colors
          </p>
          <div className="flex shrink-0 items-center gap-1">
            {ceoButton}
            {themeButton}
            {toggle}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section
      data-testid="recommended-chart-colors"
      data-collapsed="false"
      aria-label="ClearPath recommended colors for your charts"
      className="rounded-xl border border-[#00F5FF]/25 bg-black/80 px-3 py-2"
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-mono text-[10px] font-black uppercase tracking-[0.14em] text-white">
            ClearPath recommended colors for your charts
          </p>
          <p className="mt-0.5 max-w-3xl font-mono text-[9px] leading-snug text-zinc-400">
            CEO daily trading colors for maximum visual performance. A display preference. Not financial advice.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {ceoButton}
          {themeButton}
          {toggle}
        </div>
      </div>

      <div className="mt-2">
        <p className="mb-1 font-mono text-[8px] font-black uppercase tracking-widest text-zinc-500">
          Chart background — black to white, or any color
        </p>
        <div className="flex flex-wrap items-center gap-1" role="listbox" aria-label="Chart background grayscale">
          {CHART_BACKGROUND_GRAYS.map((hex) => {
            const on = selected === hex;
            return (
              <button
                key={hex}
                type="button"
                role="option"
                aria-selected={on}
                aria-label={`Chart background ${hex}`}
                title={hex}
                onClick={() => pref.setBackgroundHex(hex)}
                className={`h-5 w-5 rounded-sm border ${
                  on ? "ring-2 ring-[#00F5FF] border-white" : "border-white/30"
                }`}
                style={{ backgroundColor: hex }}
              />
            );
          })}
          <label
            className="ml-1 flex h-5 cursor-pointer items-center gap-1 rounded-sm border border-white/20 px-1.5 font-mono text-[8px] uppercase tracking-wider text-zinc-300"
            title="Any chart background color"
          >
            Any
            <input
              type="color"
              aria-label="Any chart background color"
              value={selected && /^#[0-9A-Fa-f]{6}$/.test(selected) ? selected : "#000000"}
              onChange={(e) => {
                const hex = normalizeChartHex(e.target.value);
                if (hex) pref.setBackgroundHex(hex);
              }}
              className="h-4 w-4 cursor-pointer border-0 bg-transparent p-0"
            />
          </label>
        </div>
      </div>

      <div className="mt-2">
        <p className="mb-1 font-mono text-[8px] font-black uppercase tracking-widest text-zinc-500">
          CEO daily trading colors
        </p>
        <ul className={`flex flex-wrap gap-1 ${compact ? "max-h-16 overflow-y-auto" : ""}`}>
          {CEO_DAILY_COLOR_ROWS.map((row) => (
            <li key={row.element}>
              <span
                className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-1.5 py-0.5 font-mono text-[8px] text-zinc-200"
                title={`${row.element}: ${row.name} ${row.hex}`}
              >
                <span
                  className="inline-block h-2.5 w-2.5 rounded-sm border border-white/30"
                  style={{ backgroundColor: row.hex }}
                />
                {compact ? row.hex : `${row.element} ${row.hex}`}
              </span>
            </li>
          ))}
        </ul>
        {!compact ? (
          <p className="mt-1 font-mono text-[8px] text-zinc-500">
            Support {CEO_DAILY_TRADING_COLORS.horizontalSupport} · Resistance {CEO_DAILY_TRADING_COLORS.resistanceLine} · Alert {CEO_DAILY_TRADING_COLORS.alertLine}
          </p>
        ) : null}
      </div>
    </section>
  );
}
