import type { CandleColorSet } from "./intensifyColor";
import { intensifyCandleColors } from "./intensifyColor";

/** TradingView-clean neon palette: solid cyan ups / magenta downs, no outline noise. */
export const CLEAN_NEON_CANDLE_COLORS = {
  upColor: "#00E5FF",
  downColor: "#FF1493",
  wickUpColor: "#00E5FF",
  wickDownColor: "#FF1493",
  borderUpColor: "#00E5FF",
  borderDownColor: "#FF1493",
} as const satisfies CandleColorSet;

/**
 * Force wick + border to match body colors.
 * Mismatched lighter wicks / outlines are what makes candles look muddy vs TradingView.
 */
export function unifyCandleColors<T extends Partial<CandleColorSet>>(colors: T): T & CandleColorSet {
  const up = colors.upColor || CLEAN_NEON_CANDLE_COLORS.upColor;
  const down = colors.downColor || CLEAN_NEON_CANDLE_COLORS.downColor;
  return {
    ...colors,
    upColor: up,
    downColor: down,
    wickUpColor: up,
    wickDownColor: down,
    borderUpColor: up,
    borderDownColor: down,
  };
}

export type CleanCandleSeriesOptions = CandleColorSet & {
  borderVisible: false;
};

/**
 * Options for lightweight-charts CandlestickSeries that match a clean TV look:
 * solid neon bodies, same-color wicks, no borders.
 */
export function cleanCandleSeriesOptions(
  colors: Partial<CandleColorSet> = CLEAN_NEON_CANDLE_COLORS,
  intensifyAmount = 0,
): CleanCandleSeriesOptions {
  const unified = unifyCandleColors(colors);
  const vivid =
    intensifyAmount > 0 ? intensifyCandleColors(unified, intensifyAmount) : unified;
  // Re-unify after intensify so body/wick/border stay identical (intensify is per-key).
  const matched = unifyCandleColors(vivid);
  return {
    ...matched,
    borderVisible: false,
  };
}
