import { Candle } from '../types/indicators';
import { DetectedPattern, PatternGeometry, SwingPoint } from './types';

const CHART_PATTERN_IDS = new Set([
  'rising_wedge',
  'falling_wedge',
  'ascending_triangle',
  'descending_triangle',
  'symmetrical_triangle',
  'triple_top',
  'triple_bottom',
  'cup_and_handle',
]);

function wedgeTriangleGeometry(
  h1: SwingPoint,
  h2: SwingPoint,
  l1: SwingPoint,
  l2: SwingPoint,
): PatternGeometry {
  return {
    lines: [
      { role: 'upper', from: { index: h1.index, time: h1.time, price: h1.price }, to: { index: h2.index, time: h2.time, price: h2.price } },
      { role: 'lower', from: { index: l1.index, time: l1.time, price: l1.price }, to: { index: l2.index, time: l2.time, price: l2.price } },
    ],
  };
}

export function attachChartGeometry(
  pattern: DetectedPattern,
  swings: SwingPoint[],
  candles: Candle[],
): DetectedPattern {
  if (!CHART_PATTERN_IDS.has(pattern.id)) return pattern;

  const highs = swings.filter((s) => s.kind === 'high');
  const lows = swings.filter((s) => s.kind === 'low');

  if (
    pattern.id === 'rising_wedge' ||
    pattern.id === 'falling_wedge' ||
    pattern.id === 'ascending_triangle' ||
    pattern.id === 'descending_triangle' ||
    pattern.id === 'symmetrical_triangle'
  ) {
    const h1 = highs[highs.length - 2];
    const h2 = highs[highs.length - 1];
    const l1 = lows[lows.length - 2];
    const l2 = lows[lows.length - 1];
    if (h1 && h2 && l1 && l2) {
      return { ...pattern, geometry: wedgeTriangleGeometry(h1, h2, l1, l2) };
    }
  }

  if (pattern.id === 'triple_top' || pattern.id === 'triple_bottom') {
    const pool = pattern.id === 'triple_top' ? highs : lows;
    const trio = pool.filter((s) => s.index >= pattern.startIndex && s.index <= pattern.endIndex).slice(-3);
    if (trio.length >= 3) {
      const avg = (trio[0].price + trio[1].price + trio[2].price) / 3;
      return {
        ...pattern,
        geometry: {
          lines: [{
            role: 'horizontal',
            from: { index: trio[0].index, time: trio[0].time, price: avg },
            to: { index: trio[2].index, time: trio[2].time, price: avg },
          }],
          markerIndex: trio[2].index,
          markerPrice: avg,
        },
      };
    }
  }

  if (pattern.id === 'cup_and_handle') {
    const cupLows = lows.filter((s) => s.index >= pattern.startIndex && s.index <= pattern.endIndex);
    const cupLow = cupLows.reduce<SwingPoint | null>((min, s) => (!min || s.price < min.price ? s : min), null);
    const left = highs.find((s) => s.index === pattern.startIndex) ?? highs.find((s) => s.index < (cupLow?.index ?? 0));
    const right = highs.find((s) => s.index === pattern.endIndex - 5) ?? highs[highs.length - 1];
    if (cupLow && left && right) {
      const midIdx = Math.floor((left.index + right.index) / 2);
      const midCandle = candles[midIdx];
      return {
        ...pattern,
        geometry: {
          lines: [
            { role: 'cup', from: { index: left.index, time: left.time, price: left.price }, to: { index: cupLow.index, time: cupLow.time, price: cupLow.price } },
            { role: 'cup', from: { index: cupLow.index, time: cupLow.time, price: cupLow.price }, to: { index: right.index, time: right.time, price: right.price } },
            ...(midCandle ? [{ role: 'neckline' as const, from: { index: left.index, time: left.time, price: left.price }, to: { index: right.index, time: right.time, price: left.price } }] : []),
          ],
          markerIndex: pattern.endIndex,
          markerPrice: candles[pattern.endIndex]?.high,
        },
      };
    }
  }

  return pattern;
}
