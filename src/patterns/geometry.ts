import { Candle } from '../types/indicators';
import { ChartPatternId, DetectedPattern, PatternGeometry, PatternLineSegment, SwingPoint } from './types';
import {
  allSegmentsCandleSafe,
  extendTrendlineToRange,
  fitHorizontalResistance,
  fitHorizontalSupport,
  fitLowerTrendline,
  fitUpperTrendline,
  horizontalSegment,
} from './trendlineFit';

const MAJOR_PATTERN_IDS = new Set<ChartPatternId>([
  'rising_wedge',
  'falling_wedge',
  'ascending_triangle',
  'descending_triangle',
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
  if (valid.length === 0 || !allSegmentsCandleSafe(candles, valid)) {
    return { ...pattern, geometry: undefined };
  }
  return {
    ...pattern,
    geometry: { lines: valid, markerIndex, markerPrice },
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
  const rangeHighs = swingsInRange(swings, start, end, 'high');
  const rangeLows = swingsInRange(swings, start, end, 'low');

  if (rangeHighs.length < 2 || rangeLows.length < 2) {
    return { ...pattern, geometry: undefined };
  }

  const h1 = rangeHighs[0];
  const h2 = rangeHighs[rangeHighs.length - 1];
  const l1 = rangeLows[0];
  const l2 = rangeLows[rangeLows.length - 1];
  const lines: PatternLineSegment[] = [];

  if (mode === 'ascending') {
    const resistance = fitHorizontalResistance(candles, start, end, Math.max(h1.price, h2.price));
    const upper = horizontalSegment(candles, start, end, resistance, 'upper');
    const lowerFit = fitLowerTrendline(l1, l2, candles, start, end);
    const lower = lowerFit ? extendTrendlineToRange(lowerFit, candles, start, end, 'lower') : null;
    if (upper) lines.push(upper);
    if (lower) lines.push(lower);
  } else if (mode === 'descending') {
    const support = fitHorizontalSupport(candles, start, end, Math.min(l1.price, l2.price));
    const lower = horizontalSegment(candles, start, end, support, 'lower');
    const upperFit = fitUpperTrendline(h1, h2, candles, start, end);
    const upper = upperFit ? extendTrendlineToRange(upperFit, candles, start, end, 'upper') : null;
    if (upper) lines.push(upper);
    if (lower) lines.push(lower);
  } else {
    const upperFit = fitUpperTrendline(h1, h2, candles, start, end);
    const lowerFit = fitLowerTrendline(l1, l2, candles, start, end);
    const upper = upperFit ? extendTrendlineToRange(upperFit, candles, start, end, 'upper') : null;
    const lower = lowerFit ? extendTrendlineToRange(lowerFit, candles, start, end, 'lower') : null;
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
      return wedgeOrTriangleGeometry(pattern, swings, candles, 'wedge');
    case 'cup_and_handle':
      return cupAndHandleGeometry(pattern, swings, candles);
    default:
      return { ...pattern, geometry: undefined };
  }
}
