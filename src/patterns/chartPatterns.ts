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
): DetectedPattern {
  return attachChartGeometry(
    { ...pattern, patternGroup: getChartPatternGroup(pattern.id) },
    swings,
    candles,
  );
}

function detectDoubleTopsBottoms(
  candles: Candle[],
  swings: ReturnType<typeof findSwingPoints>,
): DetectedPattern[] {
  const found: DetectedPattern[] = [];
  const highs = swings.filter((s) => s.kind === 'high');
  const lows = swings.filter((s) => s.kind === 'low');

  for (let i = 0; i <= highs.length - 2; i++) {
    const a = highs[i];
    const b = highs[i + 1];
    if (pricesNear(a.price, b.price, 0.02) && b.index - a.index >= 5) {
      found.push(withGeometry({
        id: 'double_top',
        category: 'chart',
        label: 'Double Top',
        direction: 'bearish',
        startIndex: a.index,
        endIndex: b.index,
        time: b.time,
        confidence: 0.68,
        detail: `Resistance near ${b.price.toFixed(2)}`,
      }, swings, candles));
    }
  }

  for (let i = 0; i <= lows.length - 2; i++) {
    const a = lows[i];
    const b = lows[i + 1];
    if (pricesNear(a.price, b.price, 0.02) && b.index - a.index >= 5) {
      found.push(withGeometry({
        id: 'double_bottom',
        category: 'chart',
        label: 'Double Bottom',
        direction: 'bullish',
        startIndex: a.index,
        endIndex: b.index,
        time: b.time,
        confidence: 0.68,
        detail: `Support near ${b.price.toFixed(2)}`,
      }, swings, candles));
    }
  }

  return found;
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

function detectHeadAndShoulders(
  candles: Candle[],
  swings: ReturnType<typeof findSwingPoints>,
): DetectedPattern[] {
  const found: DetectedPattern[] = [];
  const highs = swings.filter((s) => s.kind === 'high');
  const lows = swings.filter((s) => s.kind === 'low');

  for (let i = 0; i <= highs.length - 3; i++) {
    const left = highs[i];
    const head = highs[i + 1];
    const right = highs[i + 2];
    if (
      head.price > left.price &&
      head.price > right.price &&
      pricesNear(left.price, right.price, 0.04) &&
      head.index - left.index >= 3 &&
      right.index - head.index >= 3
    ) {
      found.push(withGeometry({
        id: 'head_and_shoulders',
        category: 'chart',
        label: 'Head and Shoulders',
        direction: 'bearish',
        startIndex: left.index,
        endIndex: right.index,
        time: right.time,
        confidence: 0.72,
        detail: `Head at ${head.price.toFixed(2)}`,
      }, swings, candles));
    }
  }

  for (let i = 0; i <= lows.length - 3; i++) {
    const left = lows[i];
    const head = lows[i + 1];
    const right = lows[i + 2];
    if (
      head.price < left.price &&
      head.price < right.price &&
      pricesNear(left.price, right.price, 0.04) &&
      head.index - left.index >= 3 &&
      right.index - head.index >= 3
    ) {
      found.push(withGeometry({
        id: 'inverse_head_and_shoulders',
        category: 'chart',
        label: 'Inverse Head and Shoulders',
        direction: 'bullish',
        startIndex: left.index,
        endIndex: right.index,
        time: right.time,
        confidence: 0.72,
        detail: `Head at ${head.price.toFixed(2)}`,
      }, swings, candles));
    }
  }

  return found;
}

function detectRectangles(
  swings: ReturnType<typeof findSwingPoints>,
  candles: Candle[],
): DetectedPattern[] {
  const found: DetectedPattern[] = [];
  const highs = swings.filter((s) => s.kind === 'high').slice(-4);
  const lows = swings.filter((s) => s.kind === 'low').slice(-4);

  if (highs.length >= 2 && lows.length >= 2) {
    const h1 = highs[0];
    const h2 = highs[highs.length - 1];
    const l1 = lows[0];
    const l2 = lows[lows.length - 1];
    const span = h2.index - h1.index;

    if (
      span >= 12 &&
      pricesNear(h1.price, h2.price, 0.015) &&
      pricesNear(l1.price, l2.price, 0.015)
    ) {
      found.push(withGeometry({
        id: 'rectangle',
        category: 'chart',
        label: 'Rectangle',
        direction: 'neutral',
        startIndex: Math.min(h1.index, l1.index),
        endIndex: Math.max(h2.index, l2.index),
        time: h2.time,
        confidence: 0.64,
        detail: 'Sideways parallel channel',
      }, swings, candles));
    }
  }

  return found;
}

function detectFlagsAndPennants(
  candles: Candle[],
  swings: ReturnType<typeof findSwingPoints>,
): DetectedPattern[] {
  const found: DetectedPattern[] = [];
  const window = 32;
  if (candles.length < window + 5) return found;

  const start = candles.length - window;
  const poleEnd = start + Math.floor(window * 0.35);
  const consStart = poleEnd;
  const consEnd = candles.length - 1;

  const poleBase = candles[start].close;
  const poleTip = candles[poleEnd].close;
  const polePct = (poleTip - poleBase) / poleBase;
  if (Math.abs(polePct) < 0.025) return found;

  const consHighs = swings.filter((s) => s.kind === 'high' && s.index >= consStart && s.index <= consEnd);
  const consLows = swings.filter((s) => s.kind === 'low' && s.index >= consStart && s.index <= consEnd);
  if (consHighs.length < 2 || consLows.length < 2) return found;

  const h1 = consHighs[0];
  const h2 = consHighs[consHighs.length - 1];
  const l1 = consLows[0];
  const l2 = consLows[consLows.length - 1];
  const highSlope = slope(h1, h2);
  const lowSlope = slope(l1, l2);
  const parallel = Math.abs(highSlope - lowSlope) <= Math.max(Math.abs(highSlope), Math.abs(lowSlope), 1e-9) * 0.45;

  if (polePct > 0 && highSlope < 0 && lowSlope < 0 && parallel) {
    found.push(withGeometry({
      id: 'bull_flag',
      category: 'chart',
      label: 'Bull Flag',
      direction: 'bullish',
      startIndex: consStart,
      endIndex: consEnd,
      time: candles[consEnd].time,
      confidence: 0.66,
      detail: 'Impulse up + downward channel',
    }, swings, candles));
  }

  if (polePct < 0 && highSlope > 0 && lowSlope > 0 && parallel) {
    found.push(withGeometry({
      id: 'bear_flag',
      category: 'chart',
      label: 'Bear Flag',
      direction: 'bearish',
      startIndex: consStart,
      endIndex: consEnd,
      time: candles[consEnd].time,
      confidence: 0.66,
      detail: 'Impulse down + upward channel',
    }, swings, candles));
  }

  if (polePct > 0 && highSlope < 0 && lowSlope > 0) {
    found.push(withGeometry({
      id: 'bull_pennant',
      category: 'chart',
      label: 'Bull Pennant',
      direction: 'bullish',
      startIndex: consStart,
      endIndex: consEnd,
      time: candles[consEnd].time,
      confidence: 0.63,
      detail: 'Impulse up + contracting triangle',
    }, swings, candles));
  }

  if (polePct < 0 && highSlope < 0 && lowSlope > 0) {
    found.push(withGeometry({
      id: 'bear_pennant',
      category: 'chart',
      label: 'Bear Pennant',
      direction: 'bearish',
      startIndex: consStart,
      endIndex: consEnd,
      time: candles[consEnd].time,
      confidence: 0.63,
      detail: 'Impulse down + contracting triangle',
    }, swings, candles));
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

    if (highSlope > 0 && lowSlope < 0) {
      found.push(withGeometry({
        id: 'broadening_wedge',
        category: 'chart',
        label: 'Broadening Wedge',
        direction: 'neutral',
        startIndex: Math.min(h1.index, l1.index),
        endIndex: Math.max(h2.index, l2.index),
        time: h2.time,
        confidence: 0.58,
        detail: 'Megaphone — widening range',
      }, swings, candles));
    }

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
    ...detectFlagsAndPennants(candles, swings),
    ...detectRectangles(swings, candles),
    ...detectHeadAndShoulders(candles, swings),
    ...detectDoubleTopsBottoms(candles, swings),
    ...detectTripleTopsBottoms(candles, swings),
    ...detectTriangles(swings, candles),
    ...detectCupAndHandle(candles, swings),
  ];
}

export { findSwingPoints };
