export type ChartBackgroundMode = "profile" | "white" | "black";

export const CHART_BACKGROUND_STORAGE_KEY = "clearpath_chart_background";
export const CHART_BACKGROUND_EVENT = "clearpath-chart-background";

export const CHART_BACKGROUND_PRESETS = {
  white: {
    background: "#ffffff",
    text: "#111827",
    grid: "#e5e7eb",
  },
  black: {
    background: "#000000",
    text: "#f8fafc",
    grid: "#222222",
  },
} as const;

export function isChartBackgroundMode(value: unknown): value is ChartBackgroundMode {
  return value === "profile" || value === "white" || value === "black";
}

export function readChartBackgroundMode(): ChartBackgroundMode {
  try {
    const raw = localStorage.getItem(CHART_BACKGROUND_STORAGE_KEY);
    if (isChartBackgroundMode(raw)) return raw;
  } catch {
    /* private mode / SSR */
  }
  return "profile";
}

export function writeChartBackgroundMode(mode: ChartBackgroundMode): void {
  try {
    localStorage.setItem(CHART_BACKGROUND_STORAGE_KEY, mode);
  } catch {
    /* quota / private mode */
  }
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(CHART_BACKGROUND_EVENT));
  }
}

export function chartBackgroundColors(
  mode: ChartBackgroundMode,
  fallback: { background: string; text: string; grid: string },
): { background: string; text: string; grid: string } {
  if (mode === "white") return { ...CHART_BACKGROUND_PRESETS.white };
  if (mode === "black") return { ...CHART_BACKGROUND_PRESETS.black };
  return fallback;
}
