/**
 * ClearPath recommended chart colors.
 * CEO daily trading colors are a display preference for visual performance.
 * They are not financial advice.
 */

export const CHART_BG_HEX_KEY = "clearpath_chart_bg_hex";
export const CEO_DAILY_COLORS_KEY = "clearpath_ceo_daily_colors";
export const CHART_COLOR_PREF_EVENT = "clearpath-chart-color-pref";

export const CEO_DAILY_TRADING_COLORS = {
  bullishCandle: "#00F5FF",
  bearishCandle: "#FF00CC",
  goldBarCandle: "#FFD700",
  secondaryBullish: "#39FF14",
  secondaryBearish: "#FF1744",
  bullishWick: "#00FFFF",
  bearishWick: "#FF1493",
  goldBarWick: "#FFFF00",
  chartBackground: "#000000",
  secondaryBackground: "#111318",
  chartGrid: "#252A34",
  priceLabels: "#F5F7FF",
  horizontalSupport: "#00E5FF",
  resistanceLine: "#FF00CC",
  alertLine: "#FFFF00",
} as const;

export type CeoDailyColorKey = keyof typeof CEO_DAILY_TRADING_COLORS;

export const CEO_DAILY_COLOR_ROWS: readonly {
  element: string;
  name: string;
  hex: string;
}[] = [
  { element: "Bullish Candle", name: "Electric Cyan", hex: CEO_DAILY_TRADING_COLORS.bullishCandle },
  { element: "Bearish Candle", name: "Neon Magenta", hex: CEO_DAILY_TRADING_COLORS.bearishCandle },
  { element: "Gold Bar Candle", name: "Molten Gold", hex: CEO_DAILY_TRADING_COLORS.goldBarCandle },
  { element: "Secondary Bullish", name: "Laser Green", hex: CEO_DAILY_TRADING_COLORS.secondaryBullish },
  { element: "Secondary Bearish", name: "Neon Crimson", hex: CEO_DAILY_TRADING_COLORS.secondaryBearish },
  { element: "Bullish Wick", name: "Bright Cyan", hex: CEO_DAILY_TRADING_COLORS.bullishWick },
  { element: "Bearish Wick", name: "Hot Pink", hex: CEO_DAILY_TRADING_COLORS.bearishWick },
  { element: "Gold Bar Wick", name: "Bright Gold", hex: CEO_DAILY_TRADING_COLORS.goldBarWick },
  { element: "Chart Background", name: "Pure Black", hex: CEO_DAILY_TRADING_COLORS.chartBackground },
  { element: "Secondary Background", name: "Dark Charcoal", hex: CEO_DAILY_TRADING_COLORS.secondaryBackground },
  { element: "Chart Grid", name: "Slate Grid", hex: CEO_DAILY_TRADING_COLORS.chartGrid },
  { element: "Price Labels", name: "Bright White", hex: CEO_DAILY_TRADING_COLORS.priceLabels },
  { element: "Horizontal Support", name: "Electric Cyan", hex: CEO_DAILY_TRADING_COLORS.horizontalSupport },
  { element: "Resistance Line", name: "Laser Pink", hex: CEO_DAILY_TRADING_COLORS.resistanceLine },
  { element: "Alert Line", name: "Signal Yellow", hex: CEO_DAILY_TRADING_COLORS.alertLine },
];

/** 11 stops, pure black through pure white. */
export const CHART_BACKGROUND_GRAYS: readonly string[] = Array.from({ length: 11 }, (_, i) => {
  const v = Math.round((i / 10) * 255);
  const h = v.toString(16).padStart(2, "0");
  return `#${h}${h}${h}`.toUpperCase();
});

export type ChartColorPreference = {
  backgroundHex: string | null;
  ceoDaily: boolean;
};

export function normalizeChartHex(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const t = raw.trim();
  if (/^#[0-9A-Fa-f]{6}$/.test(t)) return t.toUpperCase();
  if (/^#[0-9A-Fa-f]{3}$/.test(t)) {
    return `#${t[1]}${t[1]}${t[2]}${t[2]}${t[3]}${t[3]}`.toUpperCase();
  }
  return null;
}

export function isLightChartBackground(hex: string): boolean {
  const n = normalizeChartHex(hex);
  if (!n) return false;
  const lin = (c: number) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  const r = lin(parseInt(n.slice(1, 3), 16) / 255);
  const g = lin(parseInt(n.slice(3, 5), 16) / 255);
  const b = lin(parseInt(n.slice(5, 7), 16) / 255);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b > 0.45;
}

export function readChartColorPreference(): ChartColorPreference {
  try {
    const backgroundHex = normalizeChartHex(localStorage.getItem(CHART_BG_HEX_KEY));
    const ceoDaily = localStorage.getItem(CEO_DAILY_COLORS_KEY) === "1";
    return { backgroundHex, ceoDaily };
  } catch {
    return { backgroundHex: null, ceoDaily: false };
  }
}

function broadcast(detail: ChartColorPreference): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(CHART_COLOR_PREF_EVENT, { detail }));
}

function persist(next: ChartColorPreference): void {
  try {
    if (next.backgroundHex) localStorage.setItem(CHART_BG_HEX_KEY, next.backgroundHex);
    else localStorage.removeItem(CHART_BG_HEX_KEY);
    localStorage.setItem(CEO_DAILY_COLORS_KEY, next.ceoDaily ? "1" : "0");
  } catch {
    /* quota / private mode */
  }
  broadcast(next);
}

export function writeChartBackgroundHex(hex: string | null): ChartColorPreference {
  const prev = readChartColorPreference();
  const next = { ...prev, backgroundHex: normalizeChartHex(hex) };
  persist(next);
  return next;
}

/** Apply the CEO daily set, including the pure-black chart background. */
export function applyCeoDailyColors(): ChartColorPreference {
  const next: ChartColorPreference = {
    backgroundHex: CEO_DAILY_TRADING_COLORS.chartBackground,
    ceoDaily: true,
  };
  persist(next);
  return next;
}

export function clearChartColorPreference(): ChartColorPreference {
  const next: ChartColorPreference = { backgroundHex: null, ceoDaily: false };
  persist(next);
  return next;
}

/** Gold-bar bodies keep molten gold; the wick switches to bright gold. */
export function ceoGoldBarWick(bodyColor: string, ceoDaily: boolean): string | null {
  if (!ceoDaily) return null;
  const n = normalizeChartHex(bodyColor);
  if (n === CEO_DAILY_TRADING_COLORS.goldBarCandle) return CEO_DAILY_TRADING_COLORS.goldBarWick;
  return null;
}
