import { DetectedPattern } from './types';

/** Only patterns completing within this many bars of the right edge are "live". */
export const LIVE_EDGE_BARS = 12;

/** Candlestick scanner only examines this many most-recent bars. */
export const CANDLESTICK_SCAN_BARS = 15;

export function filterLivePatterns(
  patterns: DetectedPattern[],
  candleCount: number,
  edgeBars = LIVE_EDGE_BARS,
): DetectedPattern[] {
  if (candleCount <= 0) return [];
  const minEndIndex = Math.max(0, candleCount - edgeBars);
  return patterns
    .filter((p) => p.endIndex >= minEndIndex)
    .sort((a, b) => b.endIndex - a.endIndex || b.confidence - a.confidence);
}
