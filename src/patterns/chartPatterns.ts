import { Candle } from '../types/indicators';
import { ChartPatternId, DetectedPattern, SwingPoint } from './types';
import { getChartPatternGroup } from './patternMeta';
import { findSwingPoints, pricesNear } from './swings';
import { attachChartGeometry } from './geometry';
import {
  chartPatternConfidence,
  convergenceScore,
  countTouches,
  doubleFormationConfidence,
  fitLineToSwings,
  LineFit,
} from './lineFit';

type ChartPatternDraft = Omit<DetectedPattern, 'patternGroup' | 'geometry'> & { id: ChartPatternId };

const MAX_PIVOTS = 4;
const FLAT_SLOPE_RATIO = 0.25;

function withGeometry(
  pattern: ChartPatternDraft,
  swings: ReturnType<typeof findSwingPoints>,
  candles: Candle[],
): DetectedPattern | null {
  const result = attachChartGeometry(
    { ...pattern, patternGroup: getChartPatternGroup(pattern.id) },
    swings,
    candles,
  );
  if (!result.geometry?.lines?.length) return null;
  return result;
}

function recentPivots(swings: ReturnType<typeof findSwingPoints>, kind: 'high' | 'low'): SwingPoint[] {
  return swings.filter((s) => s.kind === kind).slice(-MAX_PIVOTS);
}

function rangeFromPivots(...groups: SwingPoint[][]): { startIndex: number; endIndex: number; time: number } {
  const all = groups.flat();
  const startIndex = Math.min(...all.map((p) => p.index));
  const endIndex = Math.max(...all.map((p) => p.index));
  const last = all.reduce((a, b) => (a.index > b.index ? a : b), all[0]);
  return { startIndex, endIndex, time: last.time };
}

function isFlatSlope(fit: LineFit, reference: LineFit): boolean {
  return Math.abs(fit.slope) < Math.abs(reference.slope) * FLAT_SLOPE_RATIO;
}

function detectWedgesAndTriangles(
  swings: ReturnType<typeof findSwingPoints>,
  candles: Candle[],
): DetectedPattern[] {
  const found: DetectedPattern[] = [];
  const highs = recentPivots(swings, 'high');
  const lows = recentPivots(swings, 'low');

  if (highs.length < 2 || lows.length < 2) return found;

  const upperFit = fitLineToSwings(highs);
  const lowerFit = fitLineToSwings(lows);
  if (!upperFit || !lowerFit) return found;

  const { startIndex, endIndex, time } = rangeFromPivots(highs, lows);
  const upperTouches = countTouches(highs, upperFit);
  const lowerTouches = countTouches(lows, lowerFit);
  const convergence = convergenceScore(upperFit, lowerFit, startIndex, endIndex);

  const baseConfidence = () =>
    chartPatternConfidence({
      upperR2: upperFit.r2,
      lowerR2: lowerFit.r2,
      upperTouches,
      lowerTouches,
      convergence,
    });

  const tryPush = (draft: ChartPatternDraft) => {
    if (draft.confidence <= 0) return;
    const p = withGeometry(draft, swings, candles);
    if (p) found.push(p);
  };

  const flatHighs = isFlatSlope(upperFit, lowerFit) && pricesNear(highs[0].price, highs[highs.length - 1].price, 0.02);
  if (flatHighs && lowerFit.slope > 0 && upperTouches >= 2 && lowerTouches >= 2) {
    tryPush({
      id: 'ascending_triangle',
      category: 'chart',
      label: 'Ascending Triangle',
      direction: 'bullish',
      startIndex,
      endIndex,
      time,
      confidence: baseConfidence(),
      detail: `Flat resistance (R² ${(upperFit.r2 * 100).toFixed(0)}%) + rising lows (R² ${(lowerFit.r2 * 100).toFixed(0)}%)`,
    });
  }

  const flatLows = isFlatSlope(lowerFit, upperFit) && pricesNear(lows[0].price, lows[lows.length - 1].price, 0.02);
  if (flatLows && upperFit.slope < 0 && upperTouches >= 2 && lowerTouches >= 2) {
    tryPush({
      id: 'descending_triangle',
      category: 'chart',
      label: 'Descending Triangle',
      direction: 'bearish',
      startIndex,
      endIndex,
      time,
      confidence: baseConfidence(),
      detail: `Flat support (R² ${(lowerFit.r2 * 100).toFixed(0)}%) + falling highs (R² ${(upperFit.r2 * 100).toFixed(0)}%)`,
    });
  }

  const symmetrical =
    upperFit.slope < 0 &&
    lowerFit.slope > 0 &&
    convergence > 0.15 &&
    upperTouches >= 2 &&
    lowerTouches >= 2;
  if (symmetrical) {
    tryPush({
      id: 'symmetrical_triangle',
      category: 'chart',
      label: 'Symmetrical Triangle',
      direction: 'neutral',
      startIndex,
      endIndex,
      time,
      confidence: baseConfidence(),
      detail: `Converging highs and lows — breakout direction TBD (pinch ${(convergence * 100).toFixed(0)}%)`,
    });
  }

  if (upperFit.slope > 0 && lowerFit.slope > 0 && upperFit.slope < lowerFit.slope && convergence > 0.1) {
    tryPush({
      id: 'rising_wedge',
      category: 'chart',
      label: 'Rising Wedge',
      direction: 'bearish',
      startIndex,
      endIndex,
      time,
      confidence: baseConfidence(),
      detail: `Converging upward — bearish reversal risk (R² ${((upperFit.r2 + lowerFit.r2) / 2 * 100).toFixed(0)}%)`,
    });
  }

  if (upperFit.slope < 0 && lowerFit.slope < 0 && upperFit.slope > lowerFit.slope && convergence > 0.1) {
    tryPush({
      id: 'falling_wedge',
      category: 'chart',
      label: 'Falling Wedge',
      direction: 'bullish',
      startIndex,
      endIndex,
      time,
      confidence: baseConfidence(),
      detail: `Converging downward — bullish reversal risk (R² ${((upperFit.r2 + lowerFit.r2) / 2 * 100).toFixed(0)}%)`,
    });
  }

  return found;
}

function detectDoubleTopBottom(
  swings: ReturnType<typeof findSwingPoints>,
  candles: Candle[],
): DetectedPattern[] {
  const found: DetectedPattern[] = [];
  const highs = swings.filter((s) => s.kind === 'high');
  const lows = swings.filter((s) => s.kind === 'low');

  for (let i = 0; i < highs.length - 1; i++) {
    const h1 = highs[i];
    for (let j = i + 1; j < highs.length; j++) {
      const h2 = highs[j];
      if (h2.index - h1.index < 8) continue;
      if (!pricesNear(h1.price, h2.price, 0.025)) continue;

      const valley = lows.find((l) => l.index > h1.index && l.index < h2.index);
      if (!valley) continue;

      const conf = doubleFormationConfidence(h1, h2, valley);
      const p = withGeometry({
        id: 'double_top',
        category: 'chart',
        label: 'Double Top',
        direction: 'bearish',
        startIndex: h1.index,
        endIndex: h2.index,
        time: h2.time,
        confidence: conf,
        detail: `Two peaks near ${h2.price.toFixed(2)} with neckline at ${valley.price.toFixed(2)}`,
      }, swings, candles);
      if (p) found.push(p);
      break;
    }
  }

  for (let i = 0; i < lows.length - 1; i++) {
    const l1 = lows[i];
    for (let j = i + 1; j < lows.length; j++) {
      const l2 = lows[j];
      if (l2.index - l1.index < 8) continue;
      if (!pricesNear(l1.price, l2.price, 0.025)) continue;

      const peak = highs.find((h) => h.index > l1.index && h.index < l2.index);
      if (!peak) continue;

      const conf = doubleFormationConfidence(l1, l2, peak);
      const p = withGeometry({
        id: 'double_bottom',
        category: 'chart',
        label: 'Double Bottom',
        direction: 'bullish',
        startIndex: l1.index,
        endIndex: l2.index,
        time: l2.time,
        confidence: conf,
        detail: `Two troughs near ${l2.price.toFixed(2)} with neckline at ${peak.price.toFixed(2)}`,
      }, swings, candles);
      if (p) found.push(p);
      break;
    }
  }

  return found;
}

function detectCupAndHandle(
  candles: Candle[],
  swings: ReturnType<typeof findSwingPoints>,
): DetectedPattern[] {
  const found: DetectedPattern[] = [];
  const lows = swings.filter((s) => s.kind === 'low');
  if (lows.length < 3 || candles.length < 40) return found;

  const recent = lows.slice(-6);
  const cupLow = recent.reduce((min, s) => (s.price < min.price ? s : min), recent[0]);
  const left = recent.find((s) => s.index < cupLow.index && pricesNear(s.price, cupLow.price * 1.15, 0.08));
  const right = recent.find((s) => s.index > cupLow.index && pricesNear(s.price, cupLow.price * 1.15, 0.08));

  if (left && right && right.index - left.index >= 15) {
    const handleStart = right.index;
    const handleEnd = Math.min(candles.length - 1, handleStart + 10);
    const handleLow = Math.min(...candles.slice(handleStart, handleEnd + 1).map((c) => c.low));
    if (handleLow > cupLow.price && handleLow < right.price) {
      const cupDepth = (left.price - cupLow.price) / Math.max(left.price, 1e-9);
      const depthScore = cupDepth >= 0.05 && cupDepth <= 0.35 ? 1 : 0.7;
      const rimSymmetry = pricesNear(left.price, right.price, 0.04) ? 1 : 0.6;
      const confidence = Math.min(0.85, 0.45 + depthScore * 0.2 + rimSymmetry * 0.2);

      const p = withGeometry({
        id: 'cup_and_handle',
        category: 'chart',
        label: 'Cup and Handle',
        direction: 'bullish',
        startIndex: left.index,
        endIndex: handleEnd,
        time: candles[handleEnd].time,
        confidence,
        detail: 'Teacup + handle consolidation',
      }, swings, candles);
      if (p) found.push(p);
    }
  }

  return found;
}

/** Major OHLC chart patterns — wedges, triangles, doubles, cup & handle. No harmonics. */
export function scanChartPatterns(candles: Candle[]): DetectedPattern[] {
  const swings = findSwingPoints(candles, 3, 3);
  return [
    ...detectWedgesAndTriangles(swings, candles),
    ...detectDoubleTopBottom(swings, candles),
    ...detectCupAndHandle(candles, swings),
  ];
}

export { findSwingPoints };
