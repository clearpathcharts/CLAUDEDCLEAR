export type ChartLayoutSlot = {
  symbol: string | null;
  x: number;
  y: number;
};

/** Where a YWC mini-chart lives on the page — never viewport-fixed overlays. */
export type YwcChartAnchor =
  | "sidebar"
  | "main-top"
  | "main-mid"
  | "float";

export type YwcChartSlot = {
  symbol: string | null;
  anchor: YwcChartAnchor;
  /** Order within a docked anchor grid (0–3). */
  dockOrder: number;
  /** Only used when anchor === "float" — position inside #ywc-page-canvas. */
  x: number;
  y: number;
};

export const MARKET_CHART_SLOT_COUNT = 3;
export const YWC_CHART_SLOT_COUNT = 4;
export const YWC_LAYOUT_STORAGE_VERSION = 3;

export const MARKET_CHART_HEIGHT = 500;
/** Desktop in-panel candle body (below the slot header). */
export const MARKET_CHART_DESKTOP_BODY_HEIGHT = 452;
export const MARKET_CHART_DESKTOP_CANDLE_HEIGHT = 440;
/** Floor so short phones still get a usable plot, not a thumbnail. */
export const MARKET_CHART_MOBILE_MIN_BODY_HEIGHT = 560;
export const YWC_CHART_WIDTH = 280;
export const YWC_CHART_HEIGHT = 200;

/**
 * Phone stacked Market Terminal charts: nearly full viewport so each slot is
 * trading-usable (scroll to the next). Uses visualViewport when present.
 */
export function mobileStackedMarketChartHeight(
  viewportHeight =
    (typeof window !== "undefined" && window.visualViewport?.height) ||
    (typeof window !== "undefined" ? window.innerHeight : 720),
): number {
  const h = Number.isFinite(viewportHeight) && viewportHeight > 0 ? viewportHeight : 720;
  return Math.round(Math.max(MARKET_CHART_MOBILE_MIN_BODY_HEIGHT, h * 0.9));
}

/** Default symbols so pattern scanner + charts load on first open (neurodivergent-friendly). */
export const DEFAULT_MARKET_SYMBOLS = ["XAUUSD", "EURUSD", "DXY"] as const;

export const YWC_CHART_ANCHORS: { id: YwcChartAnchor; label: string }[] = [
  { id: "sidebar", label: "Sidebar" },
];

export function createEmptyMarketSlots(): ChartLayoutSlot[] {
  return Array.from({ length: MARKET_CHART_SLOT_COUNT }, (_, i) => ({
    symbol: DEFAULT_MARKET_SYMBOLS[i] ?? null,
    x: 0,
    y: i * MARKET_CHART_HEIGHT,
  }));
}

/** If a saved layout wiped every symbol, restore defaults so the scanner can run. */
export function ensureMarketSlotsHaveSymbols(slots: ChartLayoutSlot[]): ChartLayoutSlot[] {
  if (slots.some((s) => s.symbol)) return slots;
  return createEmptyMarketSlots();
}

export function createEmptyYwcSlots(): YwcChartSlot[] {
  return Array.from({ length: YWC_CHART_SLOT_COUNT }, (_, i) => ({
    symbol: null,
    anchor: "sidebar" as YwcChartAnchor,
    dockOrder: i,
    x: 24,
    y: 120 + i * 48,
  }));
}
