import { Candle } from '../types/indicators';
import { ChartPatternId, DetectedPattern } from './types';
import { getChartPatternGroup } from './patternMeta';
import { findSwingPoints, pricesNear } from './swings';
import { attachChartGeometry } from './geometry';
import { clamp01, fitLineThroughPivots, lineValueAt, roundConfidence } from './lineFit';

type ChartPatternDraft = Omit<DetectedPattern, 'patternGroup' | 'geometry'> & { id: ChartPatternId };

/** Normalized slope vs avg price across the structure span — works for any asset class. */
const FLAT_SLOPE_N = 0.018;
const NEAR_FLAT_SLOPE_N = 0.035;

function withGeometry(
  pattern: ChartPatternDraft,
  swings: ReturnType<typeof findSwingPoints>,
  candles: Candle[],
): DetectedPattern {
  // Always keep the measured pattern for the sidebar — geometry may fail on
  // wick-heavy markets when candle-safe fitting is strict.
  return attachChartGeometry(
    { ...pattern, patternGroup: getChartPatternGroup(pattern.id) },
    swings,
    candles,
  );
}

function tryPush(
  found: DetectedPattern[],
  draft: ChartPatternDraft,
  swings: ReturnType<typeof findSwingPoints>,
  candles: Candle[],
): void {
  found.push(withGeometry(draft, swings, candles));
}

function wedgeTriangleConfidence(
  upperR2: number,
  lowerR2: number,
  touchHighs: number,
  touchLows: number,
): number {
  const fitQuality = (Math.max(0, upperR2) + Math.max(0, lowerR2)) / 2;
  const touch = Math.min(touchHighs, 4) + Math.min(touchLows, 4);
  return roundConfidence(clamp01(0.45 + fitQuality * 0.35 + (touch - 4) * 0.04));
}

function detectWedgesAndTriangles(
  swings: ReturnType<typeof findSwingPoints>,
  candles: Candle[],
  avgPrice: number,
): DetectedPattern[] {
  const found: DetectedPattern[] = [];
  // Use more pivots so consolidations on any symbol still resolve into triangles.
  const highs = swings.filter((s) => s.kind === 'high').slice(-6);
  const lows = swings.filter((s) => s.kind === 'low').slice(-6);

  if (highs.length < 2 || lows.length < 2) return found;

  const upper = fitLineThroughPivots(highs);
  const lower = fitLineThroughPivots(lows);
  if (!upper || !lower) return found;

  const startIdx = Math.min(highs[0].index, lows[0].index);
  const endIdx = candles.length - 1;
  const span = Math.max(endIdx - startIdx, 1);

  const upperStart = lineValueAt(upper, startIdx);
  const upperEnd = lineValueAt(upper, endIdx);
  const lowerStart = lineValueAt(lower, startIdx);
  const lowerEnd = lineValueAt(lower, endIdx);

  const gapStart = upperStart - lowerStart;
  const gapEnd = upperEnd - lowerEnd;
  if (gapStart <= 0 || gapEnd <= 0) return found;

  const upSlopeN = (upper.slope * span) / avgPrice;
  const lowSlopeN = (lower.slope * span) / avgPrice;
  const converging = gapEnd < gapStart * 0.88;
  const diverging = gapEnd > gapStart * 1.2;
  const confidence = wedgeTriangleConfidence(upper.r2, lower.r2, highs.length, lows.length);
  const endTime = candles[endIdx].time;

  const base = {
    category: 'chart' as const,
    startIndex: startIdx,
    endIndex: endIdx,
    time: endTime,
    confidence,
  };

  const h1 = highs[highs.length - 2];
  const h2 = highs[highs.length - 1];
  const l1 = lows[lows.length - 2];
  const l2 = lows[lows.length - 1];
  const risingLows = l2.price > l1.price || lowSlopeN > FLAT_SLOPE_N * 0.45;
  const fallingHighs = h2.price < h1.price || upSlopeN < -FLAT_SLOPE_N * 0.45;
  const flatCeiling =
    Math.abs(upSlopeN) <= NEAR_FLAT_SLOPE_N && pricesNear(h1.price, h2.price, 0.04);
  const flatFloor =
    Math.abs(lowSlopeN) <= NEAR_FLAT_SLOPE_N && pricesNear(l1.price, l2.price, 0.04);

  if (upSlopeN > FLAT_SLOPE_N && lowSlopeN > FLAT_SLOPE_N && converging) {
    tryPush(found, {
      ...base,
      id: 'rising_wedge',
      label: 'Rising Wedge',
      direction: 'bearish',
      detail: 'Both highs and lows are climbing while the lines squeeze together — often a tiring uptrend.',
    }, swings, candles);
  } else if (upSlopeN < -FLAT_SLOPE_N && lowSlopeN < -FLAT_SLOPE_N && converging) {
    tryPush(found, {
      ...base,
      id: 'falling_wedge',
      label: 'Falling Wedge',
      direction: 'bullish',
      detail: 'Both highs and lows are sliding down while the lines pinch together — often ends with a push back up.',
    }, swings, candles);
  } else if (flatCeiling && risingLows) {
    tryPush(found, {
      ...base,
      id: 'ascending_triangle',
      label: 'Ascending Triangle',
      direction: 'bullish',
      detail: 'Flat ceiling with rising lows — buyers pressing upward into resistance.',
    }, swings, candles);
  } else if (flatFloor && fallingHighs) {
    tryPush(found, {
      ...base,
      id: 'descending_triangle',
      label: 'Descending Triangle',
      direction: 'bearish',
      detail: 'Flat floor with falling highs — sellers pressing downward into support.',
    }, swings, candles);
  } else if (upSlopeN < -FLAT_SLOPE_N && lowSlopeN > FLAT_SLOPE_N && converging) {
    tryPush(found, {
      ...base,
      id: 'symmetrical_triangle',
      label: 'Symmetrical Triangle',
      direction: 'neutral',
      detail: 'Falling highs and rising lows converging — direction usually reveals on breakout.',
    }, swings, candles);
  } else if (upSlopeN > FLAT_SLOPE_N && lowSlopeN < -FLAT_SLOPE_N && diverging) {
    tryPush(found, {
      ...base,
      id: 'broadening_formation',
      label: 'Broadening Formation',
      direction: 'neutral',
      detail: 'Higher highs and lower lows — expanding volatility, not a squeeze.',
    }, swings, candles);
  }

  return found;
}

function detectDoubleTopsAndBottoms(
  swings: ReturnType<typeof findSwingPoints>,
  candles: Candle[],
  avgPrice: number,
  lookback: number,
): DetectedPattern[] {
  const found: DetectedPattern[] = [];
  const highs = swings.filter((s) => s.kind === 'high');
  const lows = swings.filter((s) => s.kind === 'low');

  if (highs.length >= 2) {
    const [a, b] = highs.slice(-2);
    const diff = Math.abs(a.price - b.price) / avgPrice;
    const betweenLows = lows.filter((s) => s.index > a.index && s.index < b.index);
    // Keep endIndex at the live edge so active doubles stay visible (not only the 2nd peak bar).
    if (diff <= 0.012 && b.index - a.index >= lookback * 2 && betweenLows.length > 0) {
      const neckline = Math.min(...betweenLows.map((s) => s.price));
      tryPush(found, {
        id: 'double_top',
        category: 'chart',
        label: 'Double Top',
        direction: 'bearish',
        startIndex: a.index,
        endIndex: candles.length - 1,
        time: candles[candles.length - 1].time,
        confidence: roundConfidence(clamp01(0.5 + (0.012 - diff) * 18)),
        detail: `Two peaks stalled near ${roundConfidence(a.price).toFixed(2)} with a trough between them — bearish if neckline near ${roundConfidence(neckline).toFixed(2)} breaks.`,
      }, swings, candles);
    }
  }

  if (lows.length >= 2) {
    const [a, b] = lows.slice(-2);
    const diff = Math.abs(a.price - b.price) / avgPrice;
    const betweenHighs = highs.filter((s) => s.index > a.index && s.index < b.index);
    if (diff <= 0.012 && b.index - a.index >= lookback * 2 && betweenHighs.length > 0) {
      const neckline = Math.max(...betweenHighs.map((s) => s.price));
      tryPush(found, {
        id: 'double_bottom',
        category: 'chart',
        label: 'Double Bottom',
        direction: 'bullish',
        startIndex: a.index,
        endIndex: candles.length - 1,
        time: candles[candles.length - 1].time,
        confidence: roundConfidence(clamp01(0.5 + (0.012 - diff) * 18)),
        detail: `Two troughs held near ${roundConfidence(a.price).toFixed(2)} with a peak between them — bullish if neckline near ${roundConfidence(neckline).toFixed(2)} breaks.`,
      }, swings, candles);
    }
  }

  return found;
}

function detectCupAndHandle(
  candles: Candle[],
  swings: ReturnType<typeof findSwingPoints>,
  avgPrice: number,
): DetectedPattern[] {
  const found: DetectedPattern[] = [];
  const n = candles.length;
  if (n < 40) return found;

  const window = candles.slice(-Math.min(80, n));
  const w = window.length;
  const third = Math.floor(w / 3);
  const windowStart = n - w;

  const leftRim = Math.max(...window.slice(0, third).map((c) => c.high));
  const bottom = Math.min(...window.slice(third, 2 * third).map((c) => c.low));
  const rightRim = Math.max(...window.slice(2 * third).map((c) => c.high));

  const cupDepth = ((leftRim + rightRim) / 2) - bottom;
  if (cupDepth <= 0 || cupDepth / avgPrice < 0.03) return found;

  const rimDiff = Math.abs(leftRim - rightRim) / avgPrice;
  if (rimDiff > 0.04) return found;

  const lastFew = window.slice(-Math.max(4, Math.floor(w / 8)));
  const handleLow = Math.min(...lastFew.map((c) => c.low));
  const handleDepth = rightRim - handleLow;
  if (handleDepth <= 0 || handleDepth > cupDepth * 0.5) return found;

  const levelBonus = (1 - Math.min(rimDiff / 0.04, 1)) * 0.2;
  const handleBonus = (1 - Math.min(handleDepth / (cupDepth * 0.5), 1)) * 0.15;
  const confidence = roundConfidence(clamp01(0.55 + levelBonus + handleBonus));

  tryPush(found, {
    id: 'cup_and_handle',
    category: 'chart',
    label: 'Cup and Handle',
    direction: 'bullish',
    startIndex: windowStart,
    endIndex: n - 1,
    time: candles[n - 1].time,
    confidence,
    detail: 'Rounded bottom recovered near the old high, then paused in a shallow handle — classic continuation shape.',
  }, swings, candles);

  return found;
}

/** Major OHLC chart patterns — wedges, triangles, doubles, cup & handle. No harmonics. */
export function scanChartPatterns(candles: Candle[]): DetectedPattern[] {
  if (!Array.isArray(candles) || candles.length < 25) return [];

  const avgPrice = candles.reduce((s, c) => s + c.close, 0) / candles.length;
  if (!Number.isFinite(avgPrice) || avgPrice <= 0) return [];

  const lookback = candles.length >= 120 ? 4 : 3;
  const swings = findSwingPoints(candles, lookback, lookback);

  const results = [
    ...detectWedgesAndTriangles(swings, candles, avgPrice),
    ...detectDoubleTopsAndBottoms(swings, candles, avgPrice, lookback),
    ...detectCupAndHandle(candles, swings, avgPrice),
  ];

  return results.sort((a, b) => b.confidence - a.confidence);
}

export { findSwingPoints };
