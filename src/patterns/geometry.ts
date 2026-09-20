import { Candle } from '../types/indicators';
import { ChartPatternId, DetectedPattern, PatternGeometry, PatternLineSegment, SwingPoint } from './types';
import {
  allSegmentsCandleSafe,
  extendTrendlineToRange,
  extendWhileSafe,
  fitHorizontalResistance,
  fitHorizontalSupport,
  fitLowerTrendline,
  fitUpperTrendline,
  horizontalSegment,
} from './trendlineFit';
import { pricesNear } from './swings';

const MAJOR_PATTERN_IDS = new Set<ChartPatternId>([
  'rising_wedge',
  'falling_wedge',
  'ascending_triangle',
  'descending_triangle',
  'symmetrical_triangle',
  'broadening_formation',
  'double_top',
  'double_bottom',
  'cup_and_handle',
]);

function swingsInRange(swings: SwingPoint[], start: number, end: number, kind: 'high' | 'low'): SwingPoint[] {
  return swings.filter((s) => s.kind === kind && s.index >= start && s.index <= end);
}

function finalizeGeometry(
  pattern: DetectedPattern,
  lines: PatternLineSegment[],
  candles: Candle[],
  markerIndex?: number,
  markerPrice?: number,
): DetectedPattern {
  const valid = lines.filter((l) => l.from.index !== l.to.index || l.from.price !== l.to.price);
  if (valid.length === 0) {
    return { ...pattern, geometry: undefined };
  }
  // Prefer candle-safe lines, but still draw when wick-heavy markets fail the strict test.
  const safe = allSegmentsCandleSafe(candles, valid);
  return {
    ...pattern,
    geometry: { lines: valid, markerIndex, markerPrice, candleSafe: safe },
  };
}

function wedgeOrTriangleGeometry(
  pattern: DetectedPattern,
  swings: SwingPoint[],
  candles: Candle[],
  mode: 'ascending' | 'descending' | 'wedge',
): DetectedPattern {
  const start = pattern.startIndex;
  const end = pattern.endIndex;
  const bodyEnd = Math.min(
    end,
    Math.max(start + 1, pattern.structureAnchors?.bodyEndIndex ?? end),
  );
  const rangeHighs = pattern.structureAnchors?.highs?.length >= 2
    ? pattern.structureAnchors.highs
    : swingsInRange(swings, start, bodyEnd, 'high');
  const rangeLows = pattern.structureAnchors?.lows?.length >= 2
    ? pattern.structureAnchors.lows
    : swingsInRange(swings, start, bodyEnd, 'low');

  if (rangeHighs.length < 2 || rangeLows.length < 2) {
    return { ...pattern, geometry: undefined };
  }

  const h1 = rangeHighs[0];
  const h2 = rangeHighs[rangeHighs.length - 1];
  const l1 = rangeLows[0];
  const l2 = rangeLows[rangeLows.length - 1];
  const lines: PatternLineSegment[] = [];

  if (mode === 'ascending') {
    const resistance = fitHorizontalResistance(candles, start, bodyEnd, Math.max(h1.price, h2.price));
    const upper = horizontalSegment(candles, start, bodyEnd, resistance, 'upper');
    const lowerFit = fitLowerTrendline(l1, l2, candles, start, bodyEnd);
    const lower = lowerFit
      ? extendWhileSafe(lowerFit, candles, start, end, 'lower', Math.max(l2.index, bodyEnd))
      : null;
    if (upper) lines.push(upper);
    if (lower) lines.push(lower);
  } else if (mode === 'descending') {
    const upperFit = fitUpperTrendline(h1, h2, candles, start, bodyEnd);
    const upper = upperFit
      ? extendWhileSafe(upperFit, candles, start, end, 'upper', Math.max(h2.index, bodyEnd))
      : null;
    if (upper) lines.push(upper);

    if (pricesNear(l1.price, l2.price, 0.015)) {
      const support = fitHorizontalSupport(candles, start, bodyEnd, Math.min(l1.price, l2.price));
      const lower = horizontalSegment(candles, start, bodyEnd, support, 'lower');
      if (lower) lines.push(lower);
    } else {
      const lowerFit = fitLowerTrendline(l1, l2, candles, start, bodyEnd);
      const lower = lowerFit
        ? extendTrendlineToRange(lowerFit, candles, start, bodyEnd, 'lower')
          ?? extendWhileSafe(lowerFit, candles, start, bodyEnd, 'lower', l2.index)
        : null;
      if (lower) lines.push(lower);
    }
  } else {
    const upperFit = fitUpperTrendline(h1, h2, candles, start, bodyEnd);
    const lowerFit = fitLowerTrendline(l1, l2, candles, start, bodyEnd);
    const upper = upperFit
      ? extendWhileSafe(upperFit, candles, start, end, 'upper', Math.max(h2.index, bodyEnd))
      : null;
    const lower = lowerFit
      ? extendTrendlineToRange(lowerFit, candles, start, bodyEnd, 'lower')
        ?? extendWhileSafe(lowerFit, candles, start, bodyEnd, 'lower', l2.index)
      : null;
    if (upper) lines.push(upper);
    if (lower) lines.push(lower);
  }

  return finalizeGeometry(pattern, lines, candles, end, lines[0]?.to.price);
}

function cupAndHandleGeometry(
  pattern: DetectedPattern,
  swings: SwingPoint[],
  candles: Candle[],
): DetectedPattern {
  const lows = swingsInRange(swings, pattern.startIndex, pattern.endIndex, 'low');
  const highs = swingsInRange(swings, pattern.startIndex, pattern.endIndex, 'high');
  if (lows.length < 2 || highs.length < 2) {
    return { ...pattern, geometry: undefined };
  }

  const cupLow = lows.reduce((min, s) => (s.price < min.price ? s : min), lows[0]);
  const leftRim = highs.find((s) => s.index < cupLow.index) ?? highs[0];
  const rightRim = [...highs].reverse().find((s) => s.index > cupLow.index && s.index < pattern.endIndex - 3) ?? highs[highs.length - 1];

  const cupStart = leftRim.index;
  const cupEnd = rightRim.index;
  const lines: PatternLineSegment[] = [];

  const cupLows = lows.filter((s) => s.index >= cupStart && s.index <= cupEnd);
  for (let i = 0; i < cupLows.length - 1; i++) {
    const seg = fitLowerTrendline(cupLows[i], cupLows[i + 1], candles, cupLows[i].index, cupLows[i + 1].index);
    if (!seg) continue;
    const extended = extendTrendlineToRange(seg, candles, cupLows[i].index, cupLows[i + 1].index, 'cup');
    if (extended) lines.push(extended);
  }

  const rimLevel = fitHorizontalResistance(candles, cupStart, cupEnd, Math.max(leftRim.price, rightRim.price));
  const neckline = horizontalSegment(candles, cupStart, cupEnd, rimLevel, 'neckline');
  if (neckline) lines.push(neckline);

  const handleStart = rightRim.index;
  const handleEnd = pattern.endIndex;
  const handleHighs = swingsInRange(swings, handleStart, handleEnd, 'high');
  const handleLows = swingsInRange(swings, handleStart, handleEnd, 'low');

  if (handleHighs.length >= 2 && handleLows.length >= 2) {
    const hh1 = handleHighs[0];
    const hh2 = handleHighs[handleHighs.length - 1];
    const hl1 = handleLows[0];
    const hl2 = handleLows[handleLows.length - 1];
    const upperFit = fitUpperTrendline(hh1, hh2, candles, handleStart, handleEnd);
    const lowerFit = fitLowerTrendline(hl1, hl2, candles, handleStart, handleEnd);
    const upper = upperFit ? extendTrendlineToRange(upperFit, candles, handleStart, handleEnd, 'upper') : null;
    const lower = lowerFit ? extendTrendlineToRange(lowerFit, candles, handleStart, handleEnd, 'lower') : null;
    if (upper) lines.push(upper);
    if (lower) lines.push(lower);
  }

  return finalizeGeometry(pattern, lines, candles, pattern.endIndex, candles[pattern.endIndex]?.high);
}

function doubleTopBottomGeometry(
  pattern: DetectedPattern,
  swings: SwingPoint[],
  candles: Candle[],
  mode: 'top' | 'bottom',
): DetectedPattern {
  const start = pattern.startIndex;
  const end = pattern.endIndex;
  const lines: PatternLineSegment[] = [];

  if (mode === 'top') {
    const highs = swingsInRange(swings, start, end, 'high');
    const lows = swingsInRange(swings, start, end, 'low');
    if (highs.length < 2) return { ...pattern, geometry: undefined };

    const peak = Math.max(highs[0].price, highs[highs.length - 1].price);
    const resistance = fitHorizontalResistance(candles, start, end, peak);
    const upper = horizontalSegment(candles, start, end, resistance, 'upper');
    if (upper) lines.push(upper);

    if (lows.length > 0) {
      const neckline = Math.min(...lows.map((s) => s.price));
      const neck = horizontalSegment(candles, start, end, neckline, 'neckline');
      if (neck) lines.push(neck);
    }
  } else {
    const lows = swingsInRange(swings, start, end, 'low');
    const highs = swingsInRange(swings, start, end, 'high');
    if (lows.length < 2) return { ...pattern, geometry: undefined };

    const trough = Math.min(lows[0].price, lows[lows.length - 1].price);
    const support = fitHorizontalSupport(candles, start, end, trough);
    const lower = horizontalSegment(candles, start, end, support, 'lower');
    if (lower) lines.push(lower);

    if (highs.length > 0) {
      const neckline = Math.max(...highs.map((s) => s.price));
      const neck = horizontalSegment(candles, start, end, neckline, 'neckline');
      if (neck) lines.push(neck);
    }
  }

  return finalizeGeometry(pattern, lines, candles, end, lines[0]?.to.price);
}

export function attachChartGeometry(
  pattern: DetectedPattern,
  swings: SwingPoint[],
  candles: Candle[],
): DetectedPattern {
  if (!MAJOR_PATTERN_IDS.has(pattern.id as ChartPatternId)) {
    return { ...pattern, geometry: undefined };
  }

  switch (pattern.id) {
    case 'ascending_triangle':
      return wedgeOrTriangleGeometry(pattern, swings, candles, 'ascending');
    case 'descending_triangle':
      return wedgeOrTriangleGeometry(pattern, swings, candles, 'descending');
    case 'rising_wedge':
    case 'falling_wedge':
    case 'symmetrical_triangle':
    case 'broadening_formation':
      return wedgeOrTriangleGeometry(pattern, swings, candles, 'wedge');
    case 'double_top':
      return doubleTopBottomGeometry(pattern, swings, candles, 'top');
    case 'double_bottom':
      return doubleTopBottomGeometry(pattern, swings, candles, 'bottom');
    case 'cup_and_handle':
      return cupAndHandleGeometry(pattern, swings, candles);
    default:
      return { ...pattern, geometry: undefined };
  }
}
