import { Candle } from '../types/indicators';
import { ChartPatternId, DetectedPattern } from './types';
import { getChartPatternGroup } from './patternMeta';
import { findSwingPoints, pricesNear, slope } from './swings';
import { attachChartGeometry } from './geometry';

type ChartPatternDraft = Omit<DetectedPattern, 'patternGroup' | 'geometry'> & { id: ChartPatternId };

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

function detectWedgesAndTriangles(
  swings: ReturnType<typeof findSwingPoints>,
  candles: Candle[],
): DetectedPattern[] {
  const found: DetectedPattern[] = [];
  const highs = swings.filter((s) => s.kind === 'high').slice(-5);
  const lows = swings.filter((s) => s.kind === 'low').slice(-5);

  if (highs.length < 2 || lows.length < 2) return found;

  const h1 = highs[highs.length - 2];
  const h2 = highs[highs.length - 1];
  const l1 = lows[lows.length - 2];
  const l2 = lows[lows.length - 1];
  const highSlope = slope(h1, h2);
  const lowSlope = slope(l1, l2);
  const startIndex = Math.min(h1.index, l1.index);
  const endIndex = Math.max(h2.index, l2.index);

  const tryPush = (draft: ChartPatternDraft) => {
    const p = withGeometry(draft, swings, candles);
    if (p) found.push(p);
  };

  if (Math.abs(highSlope) < Math.abs(lowSlope) * 0.25 && lowSlope > 0 && pricesNear(h1.price, h2.price, 0.02)) {
    tryPush({
      id: 'ascending_triangle',
      category: 'chart',
      label: 'Ascending Triangle',
      direction: 'bullish',
      startIndex,
      endIndex,
      time: h2.time,
      confidence: 0.65,
      detail: 'Flat resistance + rising lows',
    });
  }

  if (Math.abs(lowSlope) < Math.abs(highSlope) * 0.25 && highSlope < 0 && pricesNear(l1.price, l2.price, 0.02)) {
    tryPush({
      id: 'descending_triangle',
      category: 'chart',
      label: 'Descending Triangle',
      direction: 'bearish',
      startIndex,
      endIndex,
      time: h2.time,
      confidence: 0.65,
      detail: 'Flat support + falling highs',
    });
  }

  if (highSlope > 0 && lowSlope > 0 && highSlope < lowSlope) {
    tryPush({
      id: 'rising_wedge',
      category: 'chart',
      label: 'Rising Wedge',
      direction: 'bearish',
      startIndex,
      endIndex,
      time: h2.time,
      confidence: 0.62,
      detail: 'Converging upward — bearish reversal',
    });
  }

  if (highSlope < 0 && lowSlope < 0 && highSlope > lowSlope) {
    tryPush({
      id: 'falling_wedge',
      category: 'chart',
      label: 'Falling Wedge',
      direction: 'bullish',
      startIndex,
      endIndex,
      time: h2.time,
      confidence: 0.62,
      detail: 'Converging downward — bullish reversal',
    });
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
      const p = withGeometry({
        id: 'cup_and_handle',
        category: 'chart',
        label: 'Cup and Handle',
        direction: 'bullish',
        startIndex: left.index,
        endIndex: handleEnd,
        time: candles[handleEnd].time,
        confidence: 0.58,
        detail: 'Teacup + handle consolidation',
      }, swings, candles);
      if (p) found.push(p);
    }
  }

  return found;
}

/** Major OHLC chart patterns — wedges, triangles, cup & handle. No harmonics. */
export function scanChartPatterns(candles: Candle[]): DetectedPattern[] {
  const swings = findSwingPoints(candles, 3, 3);
  return [
    ...detectWedgesAndTriangles(swings, candles),
    ...detectCupAndHandle(candles, swings),
  ];
}

export { findSwingPoints };
