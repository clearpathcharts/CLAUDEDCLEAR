import type { Candle, DetectedPattern, PatternGeometry, PatternLineSegment, PatternLifecycleStatus } from './types';

export type { PatternLifecycleStatus } from './types';

export const LIFECYCLE_LABELS: Record<PatternLifecycleStatus, string> = {
  possible: 'Possible',
  forming: 'Forming',
  confirmed: 'Confirmed',
  triggered: 'Triggered',
};

function linePriceAtIndex(line: PatternLineSegment, index: number): number | null {
  const i0 = line.from.index;
  const i1 = line.to.index;
  if (i1 === i0) return line.to.price;
  const t = (index - i0) / (i1 - i0);
  if (t < -0.05 || t > 1.15) return null;
  return line.from.price + t * (line.to.price - line.from.price);
}

function findLine(geometry: PatternGeometry | undefined, role: PatternLineSegment['role']): PatternLineSegment | undefined {
  return geometry?.lines.find((l) => l.role === role);
}

/**
 * Classify pattern geometry state from confidence + boundary respect / cross.
 * Triggered = price crossed a measured boundary (structure event only).
 */
export function classifyPatternLifecycle(
  pattern: DetectedPattern,
  candles: Candle[],
): PatternLifecycleStatus {
  if (pattern.confidence < 0.5) return 'possible';
  if (pattern.confidence < 0.62) return 'forming';

  const last = candles[candles.length - 1];
  if (!last || !pattern.geometry?.lines?.length) {
    return pattern.confidence >= 0.72 ? 'confirmed' : 'forming';
  }

  const endIndex = candles.length - 1;
  const upper = findLine(pattern.geometry, 'upper') || findLine(pattern.geometry, 'neckline');
  const lower = findLine(pattern.geometry, 'lower') || findLine(pattern.geometry, 'horizontal');
  const neckline = findLine(pattern.geometry, 'neckline');

  const upperPx = upper ? linePriceAtIndex(upper, endIndex) : null;
  const lowerPx = lower ? linePriceAtIndex(lower, endIndex) : null;
  const neckPx = neckline ? linePriceAtIndex(neckline, endIndex) : null;

  // Boundary cross = structure Triggered (not an entry signal).
  if (pattern.direction === 'bearish') {
    if (lowerPx != null && last.close < lowerPx * 0.998) return 'triggered';
    if (neckPx != null && last.close < neckPx * 0.998) return 'triggered';
  }
  if (pattern.direction === 'bullish') {
    if (upperPx != null && last.close > upperPx * 1.002) return 'triggered';
    if (neckPx != null && last.close > neckPx * 1.002) return 'triggered';
  }

  // Still inside measured structure with solid fit → Confirmed geometry.
  const insideUpper = upperPx == null || last.close <= upperPx * 1.004;
  const insideLower = lowerPx == null || last.close >= lowerPx * 0.996;
  if (insideUpper && insideLower && pattern.confidence >= 0.62) return 'confirmed';

  return 'forming';
}

export function annotatePatternsWithLifecycle(
  patterns: DetectedPattern[],
  candles: Candle[],
): DetectedPattern[] {
  return patterns.map((p) => ({
    ...p,
    lifecycle: classifyPatternLifecycle(p, candles),
  }));
}

export function lifecycleFromConfidence(confidence: number): PatternLifecycleStatus {
  if (confidence >= 0.72) return 'confirmed';
  if (confidence >= 0.62) return 'forming';
  return 'possible';
}
