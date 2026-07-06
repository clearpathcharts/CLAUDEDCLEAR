import { Candle } from '../types/indicators';
import { DetectedPattern } from './types';
import { findSwingPoints, pricesNear, slope } from './swings';
import { attachChartGeometry } from './geometry';

function withGeometry(pattern: DetectedPattern, swings: ReturnType<typeof findSwingPoints>, candles: Candle[]): DetectedPattern {
  return attachChartGeometry(pattern, swings, candles);
}

function detectTripleTopsBottoms(
  candles: Candle[],
  swings: ReturnType<typeof findSwingPoints>,
): DetectedPattern[] {
  const found: DetectedPattern[] = [];
  const highs = swings.filter((s) => s.kind === 'high');
  const lows = swings.filter((s) => s.kind === 'low');

  for (let i = 0; i <= highs.length - 3; i++) {
    const a = highs[i];
    const b = highs[i + 1];
    const c = highs[i + 2];
    if (pricesNear(a.price, b.price, 0.02) && pricesNear(b.price, c.price, 0.02) && b.index - a.index >= 5 && c.index - b.index >= 5) {
      found.push(withGeometry({
        id: 'triple_top',
        category: 'chart',
        label: 'Triple Top',
        direction: 'bearish',
        startIndex: a.index,
        endIndex: c.index,
        time: c.time,
        confidence: 0.7,
        detail: `Peaks near ${c.price.toFixed(2)}`,
      }, swings, candles));
    }
  }

  for (let i = 0; i <= lows.length - 3; i++) {
    const a = lows[i];
    const b = lows[i + 1];
    const c = lows[i + 2];
    if (pricesNear(a.price, b.price, 0.02) && pricesNear(b.price, c.price, 0.02) && b.index - a.index >= 5 && c.index - b.index >= 5) {
      found.push(withGeometry({
        id: 'triple_bottom',
        category: 'chart',
        label: 'Triple Bottom',
        direction: 'bullish',
        startIndex: a.index,
        endIndex: c.index,
        time: c.time,
        confidence: 0.7,
        detail: `Lows near ${c.price.toFixed(2)}`,
      }, swings, candles));
    }
  }

  return found;
}

function detectTriangles(swings: ReturnType<typeof findSwingPoints>, candles: Candle[]): DetectedPattern[] {
  const found: DetectedPattern[] = [];
  const highs = swings.filter((s) => s.kind === 'high').slice(-4);
  const lows = swings.filter((s) => s.kind === 'low').slice(-4);

  if (highs.length >= 2 && lows.length >= 2) {
    const h1 = highs[highs.length - 2];
    const h2 = highs[highs.length - 1];
    const l1 = lows[lows.length - 2];
    const l2 = lows[lows.length - 1];

    const highSlope = slope(h1, h2);
    const lowSlope = slope(l1, l2);

    // Ascending triangle — flat top, rising lows
    if (Math.abs(highSlope) < Math.abs(lowSlope) * 0.25 && lowSlope > 0 && pricesNear(h1.price, h2.price, 0.02)) {
      found.push(withGeometry({
        id: 'ascending_triangle',
        category: 'chart',
        label: 'Ascending Triangle',
        direction: 'bullish',
        startIndex: Math.min(h1.index, l1.index),
        endIndex: Math.max(h2.index, l2.index),
        time: h2.time,
        confidence: 0.65,
      }, swings, candles));
    }

    // Descending triangle — flat bottom, falling highs
    if (Math.abs(lowSlope) < Math.abs(highSlope) * 0.25 && highSlope < 0 && pricesNear(l1.price, l2.price, 0.02)) {
      found.push(withGeometry({
        id: 'descending_triangle',
        category: 'chart',
        label: 'Descending Triangle',
        direction: 'bearish',
        startIndex: Math.min(h1.index, l1.index),
        endIndex: Math.max(h2.index, l2.index),
        time: h2.time,
        confidence: 0.65,
      }, swings, candles));
    }

    // Symmetrical — highs falling, lows rising (converging)
    if (highSlope < 0 && lowSlope > 0) {
      found.push(withGeometry({
        id: 'symmetrical_triangle',
        category: 'chart',
        label: 'Symmetrical Triangle',
        direction: 'neutral',
        startIndex: Math.min(h1.index, l1.index),
        endIndex: Math.max(h2.index, l2.index),
        time: h2.time,
        confidence: 0.6,
      }, swings, candles));
    }

    // Rising wedge — both up, highs slope less than lows (converging up)
    if (highSlope > 0 && lowSlope > 0 && highSlope < lowSlope) {
      found.push(withGeometry({
        id: 'rising_wedge',
        category: 'chart',
        label: 'Rising Wedge',
        direction: 'bearish',
        startIndex: Math.min(h1.index, l1.index),
        endIndex: Math.max(h2.index, l2.index),
        time: h2.time,
        confidence: 0.62,
      }, swings, candles));
    }

    // Falling wedge — both down, lows slope steeper (converging down)
    if (highSlope < 0 && lowSlope < 0 && highSlope > lowSlope) {
      found.push(withGeometry({
        id: 'falling_wedge',
        category: 'chart',
        label: 'Falling Wedge',
        direction: 'bullish',
        startIndex: Math.min(h1.index, l1.index),
        endIndex: Math.max(h2.index, l2.index),
        time: h2.time,
        confidence: 0.62,
      }, swings, candles));
    }
  }

  return found;
}

function detectCupAndHandle(candles: Candle[], swings: ReturnType<typeof findSwingPoints>): DetectedPattern[] {
  const found: DetectedPattern[] = [];
  const lows = swings.filter((s) => s.kind === 'low');
  if (lows.length < 3 || candles.length < 40) return found;

  const recent = lows.slice(-5);
  const cupLow = recent.reduce((min, s) => (s.price < min.price ? s : min), recent[0]);
  const left = recent.find((s) => s.index < cupLow.index && pricesNear(s.price, cupLow.price * 1.15, 0.08));
  const right = recent.find((s) => s.index > cupLow.index && pricesNear(s.price, cupLow.price * 1.15, 0.08));

  if (left && right && right.index - left.index >= 15) {
    const handleStart = right.index;
    const handleEnd = Math.min(candles.length - 1, handleStart + 8);
    const handleLow = Math.min(...candles.slice(handleStart, handleEnd + 1).map((c) => c.low));
    if (handleLow > cupLow.price && handleLow < right.price) {
      found.push(withGeometry({
        id: 'cup_and_handle',
        category: 'chart',
        label: 'Cup and Handle',
        direction: 'bullish',
        startIndex: left.index,
        endIndex: handleEnd,
        time: candles[handleEnd].time,
        confidence: 0.58,
        detail: 'Teacup / cup-with-handle formation',
      }, swings, candles));
    }
  }

  return found;
}

export function scanChartPatterns(candles: Candle[]): DetectedPattern[] {
  const swings = findSwingPoints(candles, 3, 3);
  return [
    ...detectTripleTopsBottoms(candles, swings),
    ...detectTriangles(swings, candles),
    ...detectCupAndHandle(candles, swings),
  ];
}

export { findSwingPoints };
