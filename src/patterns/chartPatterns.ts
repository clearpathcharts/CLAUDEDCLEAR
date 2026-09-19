import { Candle } from '../types/indicators';
import { ChartPatternId, DetectedPattern, PatternLineSegment } from './types';
import { getChartPatternGroup } from './patternMeta';
import { findSwingPoints, pricesNear } from './swings';
import { attachChartGeometry } from './geometry';
import { clamp01, fitLineThroughPivots, lineValueAt, roundConfidence } from './lineFit';
import { resolveStructureBody, windowDirectionalEfficiency } from './structureBody';
import { horizontalSegment, priceAtLine } from './trendlineFit';

const STRUCTURE_IDS = new Set<ChartPatternId>([
  'rising_wedge',
  'falling_wedge',
  'ascending_triangle',
  'descending_triangle',
  'symmetrical_triangle',
  'broadening_formation',
]);

/** Sliding windows that re-run the same wedge/triangle fit inside a parent. */
const NESTED_WINDOW_SIZES = [12, 16, 20, 28];
const MIN_NESTED_BARS = 10;
const MIN_PARENT_SPAN = 20;
const MAX_NESTED_VS_PARENT = 0.55;
const NESTED_OVERLAP_DEDUP = 0.45;
const FLOOR_DISTINCT_PCT = 0.0012;
const MAX_NESTED_EMIT = 6;

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
  const body = resolveStructureBody(candles, swings, avgPrice);
  let highs = body.highs;
  let lows = body.lows;

  if (highs.length < 2) highs = swings.filter((s) => s.kind === 'high').slice(-6);
  if (lows.length < 2) lows = swings.filter((s) => s.kind === 'low').slice(-6);
  if (highs.length < 2 || lows.length < 2) return found;

  const upper = fitLineThroughPivots(highs);
  const lower = fitLineThroughPivots(lows);
  if (!upper || !lower) return found;

  const startIdx = Math.min(highs[0].index, lows[0].index);
  const endIdx = candles.length - 1;
  const measureEnd = Math.max(startIdx + 1, Math.min(endIdx, body.bodyEndIndex));
  const span = Math.max(measureEnd - startIdx, 1);

  const upperStart = lineValueAt(upper, startIdx);
  const upperEnd = lineValueAt(upper, measureEnd);
  const lowerStart = lineValueAt(lower, startIdx);
  const lowerEnd = lineValueAt(lower, measureEnd);

  const gapStart = upperStart - lowerStart;
  const gapEnd = upperEnd - lowerEnd;
  if (gapStart <= 0 || gapEnd <= 0) return found;

  const upSlopeN = (upper.slope * span) / avgPrice;
  const lowSlopeN = (lower.slope * span) / avgPrice;
  const converging = gapEnd < gapStart * 0.88;
  const diverging = gapEnd > gapStart * 1.2;
  const confidence = wedgeTriangleConfidence(upper.r2, lower.r2, highs.length, lows.length);
  const endTime = candles[endIdx].time;

  const anchors = {
    highs,
    lows,
    bodyEndIndex: body.bodyEndIndex,
  };

  const base = {
    category: 'chart' as const,
    startIndex: startIdx,
    endIndex: endIdx,
    time: endTime,
    confidence,
    structureAnchors: anchors,
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
  const lowerSteeperDown = lowSlopeN < upSlopeN - 0.012;
  const continuationDown = body.trendBias === 'down' || body.brokeWithTrend;
  const continuationUp = body.trendBias === 'up' && body.brokeWithTrend;

  if (flatCeiling && risingLows) {
    tryPush(found, {
      ...base,
      id: 'ascending_triangle',
      label: 'Ascending Triangle',
      direction: 'bullish',
      detail: 'Flat ceiling with rising lows — buyers pressing upward into resistance.',
    }, swings, candles);
  } else if (
    fallingHighs
    && (
      flatFloor
      || continuationDown
      || (upSlopeN < -FLAT_SLOPE_N && lowSlopeN <= NEAR_FLAT_SLOPE_N)
      || (upSlopeN < -FLAT_SLOPE_N && lowSlopeN < -FLAT_SLOPE_N && (continuationDown || !lowerSteeperDown))
    )
  ) {
    tryPush(found, {
      ...base,
      id: 'descending_triangle',
      label: 'Descending Triangle',
      direction: 'bearish',
      detail: continuationDown
        ? 'Lower highs along the downtrend — retrace pauses are continuation triangles, not a reversal wedge.'
        : 'Flat or slower floor with falling highs — sellers pressing downward into support.',
    }, swings, candles);
  } else if (
    upSlopeN < -FLAT_SLOPE_N
    && lowSlopeN < -FLAT_SLOPE_N
    && converging
    && lowerSteeperDown
    && !continuationDown
  ) {
    tryPush(found, {
      ...base,
      id: 'falling_wedge',
      label: 'Falling Wedge',
      direction: 'bullish',
      detail: 'Both lines slide down and the floor is steeper — a coil, not a breakdown. Reversal only if price is still inside.',
    }, swings, candles);
  } else if (upSlopeN > FLAT_SLOPE_N && lowSlopeN > FLAT_SLOPE_N && converging && !continuationUp) {
    tryPush(found, {
      ...base,
      id: 'rising_wedge',
      label: 'Rising Wedge',
      direction: 'bearish',
      detail: 'Both highs and lows are climbing while the lines squeeze together — often a tiring uptrend.',
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

function lowerMidPrice(pattern: DetectedPattern): number | null {
  const line =
    pattern.geometry?.lines.find((l) => l.role === 'lower')
    ?? pattern.geometry?.lines.find((l) => l.role === 'horizontal');
  if (!line) return null;
  return (line.from.price + line.to.price) / 2;
}

function overlapRatio(a: DetectedPattern, b: DetectedPattern): number {
  const start = Math.max(a.startIndex, b.startIndex);
  const end = Math.min(a.endIndex, b.endIndex);
  if (end < start) return 0;
  const overlap = end - start + 1;
  const denom = Math.min(a.endIndex - a.startIndex + 1, b.endIndex - b.startIndex + 1);
  return denom > 0 ? overlap / denom : 0;
}

function isInteriorNested(child: DetectedPattern, parent: DetectedPattern): boolean {
  const parentSpan = parent.endIndex - parent.startIndex;
  const childSpan = child.endIndex - child.startIndex;
  if (childSpan < MIN_NESTED_BARS || parentSpan < MIN_PARENT_SPAN) return false;
  if (child.startIndex < parent.startIndex || child.endIndex > parent.endIndex) return false;
  const ratio = childSpan / parentSpan;
  if (ratio > MAX_NESTED_VS_PARENT) return false;
  const insetStart = child.startIndex - parent.startIndex;
  const insetEnd = parent.endIndex - child.endIndex;
  if (insetStart < 2 && insetEnd < 2) return false;
  return true;
}

function parentTrendFamily(parent: DetectedPattern): 'down' | 'up' | null {
  if (parent.id === 'descending_triangle') return 'down';
  if (parent.id === 'ascending_triangle') return 'up';
  if (parent.id === 'falling_wedge' && parent.direction === 'bearish') return 'down';
  if (parent.id === 'rising_wedge' && parent.direction === 'bullish') return 'up';
  if (parent.direction === 'bearish' && parent.id !== 'rising_wedge') return 'down';
  if (parent.direction === 'bullish' && parent.id !== 'falling_wedge') return 'up';
  return null;
}

function clipSegment(
  line: PatternLineSegment,
  candles: Candle[],
  start: number,
  end: number,
): PatternLineSegment {
  return {
    role: line.role,
    from: {
      index: start,
      time: candles[start].time,
      price: priceAtLine(line.from, line.to, start),
    },
    to: {
      index: end,
      time: candles[end].time,
      price: priceAtLine(line.from, line.to, end),
    },
  };
}

function countLineTouches(
  candles: Candle[],
  start: number,
  end: number,
  line: PatternLineSegment,
  avgPrice: number,
  side: 'high' | 'low',
): number {
  const tol = avgPrice * 0.006;
  let touches = 0;
  for (let i = start; i <= end; i++) {
    const px = priceAtLine(line.from, line.to, i);
    const print = side === 'high' ? candles[i].high : candles[i].low;
    if (Math.abs(print - px) <= tol) touches += 1;
  }
  return touches;
}

function windowHighsFall(candles: Candle[], start: number, end: number): boolean {
  const span = end - start + 1;
  const third = Math.max(2, Math.floor(span / 3));
  let firstMax = -Infinity;
  let lastMax = -Infinity;
  for (let i = start; i <= start + third; i++) firstMax = Math.max(firstMax, candles[i].high);
  for (let i = end - third; i <= end; i++) lastMax = Math.max(lastMax, candles[i].high);
  return lastMax <= firstMax * 1.003;
}

function windowLowsRise(candles: Candle[], start: number, end: number): boolean {
  const span = end - start + 1;
  const third = Math.max(2, Math.floor(span / 3));
  let firstMin = Infinity;
  let lastMin = Infinity;
  for (let i = start; i <= start + third; i++) firstMin = Math.min(firstMin, candles[i].low);
  for (let i = end - third; i <= end; i++) lastMin = Math.min(lastMin, candles[i].low);
  return lastMin >= firstMin * 0.997;
}

function triangleAlongParent(
  parent: DetectedPattern,
  candles: Candle[],
  start: number,
  end: number,
  avgPrice: number,
): DetectedPattern | null {
  const family = parentTrendFamily(parent);
  if (!family || !parent.geometry?.lines.length) return null;
  if (end - start + 1 < MIN_NESTED_BARS) return null;
  if (windowDirectionalEfficiency(candles, start, end) > 0.93) return null;

  if (family === 'down') {
    const parentUpper = parent.geometry.lines.find((l) => l.role === 'upper');
    if (!parentUpper) return null;
    if (!windowHighsFall(candles, start, end)) return null;
    const upper = clipSegment(parentUpper, candles, start, end);
    if (countLineTouches(candles, start, end, upper, avgPrice, 'high') < 2) return null;

    let localFloor = Infinity;
    for (let i = start; i <= end; i++) localFloor = Math.min(localFloor, candles[i].low);
    if (!Number.isFinite(localFloor) || localFloor >= Math.min(upper.from.price, upper.to.price) * 0.999) {
      return null;
    }
    const parentFloor = lowerMidPrice(parent);
    if (parentFloor != null && Math.abs(localFloor - parentFloor) / avgPrice < FLOOR_DISTINCT_PCT) {
      return null;
    }

    const lower = horizontalSegment(candles, start, end, localFloor, 'lower');
    if (!lower) return null;
    const lines = [upper, lower];
    return {
      id: 'descending_triangle',
      category: 'chart',
      label: 'Descending Triangle',
      direction: 'bearish',
      patternGroup: getChartPatternGroup('descending_triangle'),
      startIndex: start,
      endIndex: end,
      time: candles[end].time,
      confidence: roundConfidence(clamp01((parent.confidence ?? 0.6) * 0.92)),
      detail: `Retrace triangle along the parent ${parent.label} — same descending resistance, local support.`,
      scale: 'nested',
      geometry: { lines, markerIndex: end, markerPrice: upper.to.price, candleSafe: true },
    };
  }

  const parentLower =
    parent.geometry.lines.find((l) => l.role === 'lower')
    ?? parent.geometry.lines.find((l) => l.role === 'horizontal');
  if (!parentLower) return null;
  if (!windowLowsRise(candles, start, end)) return null;
  const lower = clipSegment(parentLower, candles, start, end);
  if (countLineTouches(candles, start, end, lower, avgPrice, 'low') < 2) return null;

  let localCeil = -Infinity;
  for (let i = start; i <= end; i++) localCeil = Math.max(localCeil, candles[i].high);
  if (!Number.isFinite(localCeil) || localCeil <= Math.max(lower.from.price, lower.to.price) * 1.001) {
    return null;
  }

  const upper = horizontalSegment(candles, start, end, localCeil, 'upper');
  if (!upper) return null;
  return {
    id: 'ascending_triangle',
    category: 'chart',
    label: 'Ascending Triangle',
    direction: 'bullish',
    patternGroup: getChartPatternGroup('ascending_triangle'),
    startIndex: start,
    endIndex: end,
    time: candles[end].time,
    confidence: roundConfidence(clamp01((parent.confidence ?? 0.6) * 0.92)),
    detail: `Retrace triangle along the parent ${parent.label} — same rising support, local ceiling.`,
    scale: 'nested',
    geometry: { lines: [upper, lower], markerIndex: end, markerPrice: lower.to.price, candleSafe: true },
  };
}

/**
 * Nested hits ride the parent trendline. Independent least-squares triangles
 * on 12-bar windows ignore the larger trend and draw the wrong shape.
 */
export function detectNestedStructures(
  candles: Candle[],
  parents: DetectedPattern[],
): DetectedPattern[] {
  if (!Array.isArray(candles) || candles.length < MIN_PARENT_SPAN) return [];

  const avgPrice = candles.reduce((s, c) => s + c.close, 0) / candles.length;
  if (!Number.isFinite(avgPrice) || avgPrice <= 0) return [];

  const structureParents = parents.filter(
    (p) =>
      p.category === 'chart'
      && STRUCTURE_IDS.has(p.id as ChartPatternId)
      && (p.scale ?? 'major') === 'major'
      && p.endIndex - p.startIndex >= MIN_PARENT_SPAN
      && !!p.geometry?.lines.length
      && parentTrendFamily(p) != null,
  );
  if (structureParents.length === 0) return [];

  const found: DetectedPattern[] = [];

  for (const parent of structureParents) {
    const parentSpan = parent.endIndex - parent.startIndex;
    for (const winSize of NESTED_WINDOW_SIZES) {
      if (winSize > Math.floor(parentSpan * MAX_NESTED_VS_PARENT)) continue;
      if (winSize < MIN_NESTED_BARS) continue;
      const step = Math.max(3, Math.floor(winSize / 4));

      for (let start = parent.startIndex; start + winSize <= parent.endIndex; start += step) {
        const end = start + winSize;
        const probe: DetectedPattern = {
          ...parent,
          startIndex: start,
          endIndex: end,
          scale: 'nested',
        };
        if (!isInteriorNested(probe, parent)) continue;
        const hit = triangleAlongParent(parent, candles, start, end, avgPrice);
        if (!hit) continue;
        if (hit.direction !== 'neutral' && parent.direction !== 'neutral' && hit.direction !== parent.direction) {
          continue;
        }
        found.push(hit);
      }
    }
  }

  const ranked = found.sort((a, b) => {
    const aSame = structureParents.some((p) => p.id === a.id) ? 1 : 0;
    const bSame = structureParents.some((p) => p.id === b.id) ? 1 : 0;
    if (aSame !== bSame) return bSame - aSame;
    return b.endIndex - a.endIndex || b.confidence - a.confidence;
  });

  const kept: DetectedPattern[] = [];
  for (const p of ranked) {
    if (kept.length >= MAX_NESTED_EMIT) break;
    if (kept.some((k) => overlapRatio(k, p) > NESTED_OVERLAP_DEDUP)) continue;
    kept.push(p);
  }
  return kept;
}

/** Major OHLC chart patterns — wedges, triangles, doubles, cup & handle. No harmonics. */
export function scanChartPatterns(candles: Candle[]): DetectedPattern[] {
  if (!Array.isArray(candles) || candles.length < 25) return [];

  const avgPrice = candles.reduce((s, c) => s + c.close, 0) / candles.length;
  if (!Number.isFinite(avgPrice) || avgPrice <= 0) return [];

  const lookback = candles.length >= 120 ? 4 : 3;
  const swings = findSwingPoints(candles, lookback, lookback);

  const major = [
    ...detectWedgesAndTriangles(swings, candles, avgPrice),
    ...detectDoubleTopsAndBottoms(swings, candles, avgPrice, lookback),
    ...detectCupAndHandle(candles, swings, avgPrice),
  ].map((p) => ({ ...p, scale: p.scale ?? 'major' as const }));

  const nested = detectNestedStructures(candles, major);

  return [...major, ...nested].sort((a, b) => b.confidence - a.confidence);
}

export { findSwingPoints };
