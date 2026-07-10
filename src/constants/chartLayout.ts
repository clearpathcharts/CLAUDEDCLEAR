export type ChartLayoutSlot = {
  symbol: string | null;
  x: number;
  y: number;
};

export const MARKET_CHART_SLOT_COUNT = 3;
export const YWC_CHART_SLOT_COUNT = 4;

export const MARKET_CHART_HEIGHT = 500;
export const YWC_CHART_WIDTH = 280;
export const YWC_CHART_HEIGHT = 200;

export function createEmptyMarketSlots(): ChartLayoutSlot[] {
  return Array.from({ length: MARKET_CHART_SLOT_COUNT }, (_, i) => ({
    symbol: null,
    x: 0,
    y: i * MARKET_CHART_HEIGHT,
  }));
}

export function createEmptyYwcSlots(): ChartLayoutSlot[] {
  const gap = 16;
  const w = YWC_CHART_WIDTH + gap;
  const h = YWC_CHART_HEIGHT + gap;
  return Array.from({ length: YWC_CHART_SLOT_COUNT }, (_, i) => ({
    symbol: null,
    x: gap + (i % 2) * w,
    y: 100 + Math.floor(i / 2) * h,
  }));
}
