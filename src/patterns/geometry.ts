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

function priceOnTrendline(
  from: SwingPoint,
  to: SwingPoint,
  targetIndex: number,
): number {
  const dx = to.index - from.index;
  if (dx === 0) return from.price;
  const t = (targetIndex - from.index) / dx;
  return from.price + t * (to.price - from.price);
}

function wedgeTriangleGeometry(
  h1: SwingPoint,
  h2: SwingPoint,
  l1: SwingPoint,
  l2: SwingPoint,
  startIndex: number,
  endIndex: number,
  candles: Candle[],
): PatternGeometry {
  const start = Math.max(0, Math.min(startIndex, h1.index, l1.index));
  const end = Math.min(candles.length - 1, Math.max(endIndex, h2.index, l2.index));

  const upperStart = priceOnTrendline(h1, h2, start);
  const upperEnd = priceOnTrendline(h1, h2, end);
  const lowerStart = priceOnTrendline(l1, l2, start);
  const lowerEnd = priceOnTrendline(l1, l2, end);

  return {
    lines: [
      {
        role: 'upper',
        from: { index: start, time: candles[start].time, price: upperStart },
        to: { index: end, time: candles[end].time, price: upperEnd },
      },
      {
        role: 'lower',
        from: { index: start, time: candles[start].time, price: lowerStart },
        to: { index: end, time: candles[end].time, price: lowerEnd },
      },
    ],
    markerIndex: end,
    markerPrice: upperEnd,
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
      return {
        ...pattern,
        geometry: wedgeTriangleGeometry(
          h1,
          h2,
          l1,
          l2,
          pattern.startIndex,
          pattern.endIndex,
          candles,
        ),
      };
    }
  }

  if (pattern.id === 'triple_top' || pattern.id === 'triple_bottom') {
    const pool = pattern.id === 'triple_top' ? highs : lows;
    const trio = pool.filter((s) => s.index >= pattern.startIndex && s.index <= pattern.endIndex).slice(-3);
    if (trio.length >= 3) {
      const avg = (trio[0].price + trio[1].price + trio[2].price) / 3;
      const padStart = Math.max(0, trio[0].index - 3);
      const padEnd = Math.min(candles.length - 1, trio[2].index + 8);
      return {
        ...pattern,
        geometry: {
          lines: [
            {
              role: 'horizontal',
              from: { index: padStart, time: candles[padStart].time, price: avg },
              to: { index: padEnd, time: candles[padEnd].time, price: avg },
            },
            {
              role: 'upper',
              from: { index: trio[0].index, time: trio[0].time, price: trio[0].price },
              to: { index: trio[0].index, time: candles[Math.min(trio[0].index + 1, padEnd)].time, price: avg },
            },
            {
              role: 'upper',
              from: { index: trio[1].index, time: trio[1].time, price: trio[1].price },
              to: { index: trio[1].index, time: candles[Math.min(trio[1].index + 1, padEnd)].time, price: avg },
            },
            {
              role: 'upper',
              from: { index: trio[2].index, time: trio[2].time, price: trio[2].price },
              to: { index: trio[2].index, time: candles[Math.min(trio[2].index + 1, padEnd)].time, price: avg },
            },
          ],
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
