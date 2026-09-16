import { DetectedPattern } from './types';

/** Candlestick patterns must complete near the right edge. */
export const LIVE_EDGE_BARS = 16;

/** Chart structures (triangles/doubles) stay visible longer while still "live". */
export const CHART_LIVE_EDGE_BARS = 64;

/** Candlestick scanner only examines this many most-recent bars. */
export const CANDLESTICK_SCAN_BARS = 20;

export function filterLivePatterns(
  patterns: DetectedPattern[],
  candleCount: number,
  edgeBars = LIVE_EDGE_BARS,
): DetectedPattern[] {
  if (candleCount <= 0) return [];
  const candleMin = Math.max(0, candleCount - edgeBars);
  const chartMin = Math.max(0, candleCount - CHART_LIVE_EDGE_BARS);
  const liveTip = Math.max(0, candleCount - 4);

  return patterns
    .filter((p) => {
      if (p.scale === 'nested' && p.category === 'chart') {
        if (p.endIndex >= chartMin) return true;
        return patterns.some((parent) => (
          parent.category === 'chart'
          && parent.scale !== 'nested'
          && parent.endIndex >= liveTip
          && p.startIndex >= parent.startIndex
          && p.endIndex <= parent.endIndex
        ));
      }
      // Active structures that extend to the latest bars always stay.
      if (p.category === 'chart' && p.endIndex >= liveTip) return true;
      if (p.category === 'chart') return p.endIndex >= chartMin;
      return p.endIndex >= candleMin;
    })
    .sort((a, b) => b.endIndex - a.endIndex || b.confidence - a.confidence);
}
