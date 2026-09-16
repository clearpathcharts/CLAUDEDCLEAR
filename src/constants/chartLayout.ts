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
/** Practical max when the sheet says unlimited charts (Platinum). */
export const MARKET_CHART_SLOT_COUNT_MAX = 16;
export const YWC_CHART_SLOT_COUNT = 4;
export const YWC_LAYOUT_STORAGE_VERSION = 3;

/** Stacking pitch fallback; live desktop panels use desktopMarketPanelHeight(). */
export const MARKET_CHART_HEIGHT = 1000;
/** Older pulse layout used 576px panels — remap saved y so slots do not overlap. */
export const MARKET_CHART_HEIGHT_LEGACY = 576;
/** Pulse + search chrome above the candle plot. */
export const MARKET_CHART_DESKTOP_CHROME = 96;
/**
 * Absolute floor for a tiny window. Must stay BELOW a typical leftover
 * viewport — a 860px floor made the panel taller than the visible hole,
 * so candles looked like a thumbnail until you scrolled.
 */
export const MARKET_CHART_DESKTOP_MIN_BODY_HEIGHT = 420;
export const MARKET_CHART_DESKTOP_BODY_HEIGHT = MARKET_CHART_DESKTOP_MIN_BODY_HEIGHT;
export const MARKET_CHART_DESKTOP_CANDLE_HEIGHT = MARKET_CHART_DESKTOP_MIN_BODY_HEIGHT;
/** LOAD / search row plus compact local-time + pulse bar on a stacked phone panel. */
export const MARKET_CHART_MOBILE_SLOT_HEADER = 72;
/** Floor so short phones still get a usable plot, not a thumbnail. */
export const MARKET_CHART_MOBILE_MIN_BODY_HEIGHT = 640;
export const YWC_CHART_WIDTH = 280;
export const YWC_CHART_HEIGHT = 200;

/**
 * Phone stacked Market Terminal charts: body fills the viewport minus the
 * slot header so each snap panel is a true full-screen trading chart.
 * Uses visualViewport when present.
 */
export function mobileStackedMarketChartHeight(
  viewportHeight =
    (typeof window !== "undefined" && window.visualViewport?.height) ||
    (typeof window !== "undefined" ? window.innerHeight : 720),
): number {
  const h = Number.isFinite(viewportHeight) && viewportHeight > 0 ? viewportHeight : 720;
  return Math.round(
    Math.max(MARKET_CHART_MOBILE_MIN_BODY_HEIGHT, h - MARKET_CHART_MOBILE_SLOT_HEADER),
  );
}

/**
 * Desktop Market Terminal candle body.
 * `reservedTop` is pixels already used above the plot (nav + page chrome +
 * in-panel pulse/search). The plot fills whatever is left in the window.
 */
export function desktopStackedMarketChartHeight(
  viewportHeight =
    (typeof window !== "undefined" && window.visualViewport?.height) ||
    (typeof window !== "undefined" ? window.innerHeight : 900),
  reservedTop = 56,
): number {
  const h = Number.isFinite(viewportHeight) && viewportHeight > 0 ? viewportHeight : 900;
  const reserved = Number.isFinite(reservedTop) && reservedTop > 0 ? reservedTop : 56;
  return Math.round(Math.max(MARKET_CHART_DESKTOP_MIN_BODY_HEIGHT, h - reserved));
}

export function desktopMarketPanelHeight(bodyHeight = desktopStackedMarketChartHeight()): number {
  return bodyHeight + MARKET_CHART_DESKTOP_CHROME;
}

/** Default symbols so pattern scanner + charts load on first open (neurodivergent-friendly). */
export const DEFAULT_MARKET_SYMBOLS = ["XAUUSD", "EURUSD", "DXY"] as const;

export const YWC_CHART_ANCHORS: { id: YwcChartAnchor; label: string }[] = [
  { id: "sidebar", label: "Sidebar" },
];

export function createEmptyMarketSlots(count: number = MARKET_CHART_SLOT_COUNT): ChartLayoutSlot[] {
  const n = Math.max(1, Math.min(MARKET_CHART_SLOT_COUNT_MAX, Math.floor(count)));
  return Array.from({ length: n }, (_, i) => ({
    symbol: DEFAULT_MARKET_SYMBOLS[i] ?? null,
    x: 0,
    y: i * MARKET_CHART_HEIGHT,
  }));
}

export function capMarketSlots(slots: ChartLayoutSlot[], max: number): ChartLayoutSlot[] {
  const n = Math.max(1, Math.min(MARKET_CHART_SLOT_COUNT_MAX, Math.floor(max)));
  if (slots.length === n) return slots;
  if (slots.length > n) return slots.slice(0, n);
  const extra = createEmptyMarketSlots(n).slice(slots.length);
  return [...slots, ...extra];
}

/** Snap saved y from the old 576px grid onto the current stacking pitch. */
export function normalizeMarketSlotY(
  y: number,
  index: number,
  pitch: number = MARKET_CHART_HEIGHT,
): number {
  const legacyPitches = [480, 520, 576, 640, 760, 880, MARKET_CHART_HEIGHT_LEGACY, pitch];
  for (const old of legacyPitches) {
    if (Math.abs(y - index * old) < 16) return index * pitch;
  }
  return Math.max(0, y);
}

/** If a saved layout wiped every symbol, restore defaults so the scanner can run. */
export function ensureMarketSlotsHaveSymbols(slots: ChartLayoutSlot[]): ChartLayoutSlot[] {
  if (slots.some((s) => s.symbol)) return slots;
  return createEmptyMarketSlots(slots.length || MARKET_CHART_SLOT_COUNT);
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
