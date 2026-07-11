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

export const MARKET_CHART_HEIGHT = 500;
export const YWC_CHART_WIDTH = 280;
export const YWC_CHART_HEIGHT = 200;

export const YWC_CHART_ANCHORS: { id: YwcChartAnchor; label: string }[] = [
  { id: "sidebar", label: "Sidebar" },
  { id: "main-top", label: "Main top" },
  { id: "main-mid", label: "Main mid" },
  { id: "float", label: "Free float" },
];

export function createEmptyMarketSlots(): ChartLayoutSlot[] {
  return Array.from({ length: MARKET_CHART_SLOT_COUNT }, (_, i) => ({
    symbol: null,
    x: 0,
    y: i * MARKET_CHART_HEIGHT,
  }));
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
