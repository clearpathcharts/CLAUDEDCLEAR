import { Candle } from '../types/indicators';
import { ChartPatternId, DetectedPattern, PatternGeometry, SwingPoint } from './types';

const CHART_PATTERN_IDS = new Set<string>([
  'bull_flag',
  'bear_flag',
  'bull_pennant',
  'bear_pennant',
  'rectangle',
  'head_and_shoulders',
  'inverse_head_and_shoulders',
  'double_top',
  'double_bottom',
  'rising_wedge',
  'falling_wedge',
  'ascending_triangle',
  'descending_triangle',
  'symmetrical_triangle',
  'broadening_wedge',
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

function channelGeometry(
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

  return {
    lines: [
      {
        role: 'upper',
        from: { index: start, time: candles[start].time, price: priceOnTrendline(h1, h2, start) },
        to: { index: end, time: candles[end].time, price: priceOnTrendline(h1, h2, end) },
      },
      {
        role: 'lower',
        from: { index: start, time: candles[start].time, price: priceOnTrendline(l1, l2, start) },
        to: { index: end, time: candles[end].time, price: priceOnTrendline(l1, l2, end) },
      },
    ],
    markerIndex: end,
    markerPrice: priceOnTrendline(h1, h2, end),
  };
}

function swingsInRange(swings: SwingPoint[], start: number, end: number, kind: 'high' | 'low'): SwingPoint[] {
  return swings.filter((s) => s.kind === kind && s.index >= start && s.index <= end);
}

function multiPeakGeometry(
  peaks: SwingPoint[],
  candles: Candle[],
  role: 'upper' | 'lower',
): PatternGeometry['lines'] {
  if (peaks.length < 2) return [];
  const avg = peaks.reduce((sum, p) => sum + p.price, 0) / peaks.length;
  const padStart = Math.max(0, peaks[0].index - 3);
  const padEnd = Math.min(candles.length - 1, peaks[peaks.length - 1].index + 8);

  const lines: PatternGeometry['lines'] = [
    {
      role: 'horizontal',
      from: { index: padStart, time: candles[padStart].time, price: avg },
      to: { index: padEnd, time: candles[padEnd].time, price: avg },
    },
  ];

  for (const peak of peaks) {
    const nextIdx = Math.min(peak.index + 1, padEnd);
    lines.push({
      role,
      from: { index: peak.index, time: peak.time, price: peak.price },
      to: { index: peak.index, time: candles[nextIdx].time, price: avg },
    });
  }

  return lines;
}

export function attachChartGeometry(
  pattern: DetectedPattern,
  swings: SwingPoint[],
  candles: Candle[],
): DetectedPattern {
  if (!CHART_PATTERN_IDS.has(pattern.id)) return pattern;

  const highs = swings.filter((s) => s.kind === 'high');
  const lows = swings.filter((s) => s.kind === 'low');

  const channelPatternIds: ChartPatternId[] = [
    'bull_flag',
    'bear_flag',
    'bull_pennant',
    'bear_pennant',
    'rectangle',
    'rising_wedge',
    'falling_wedge',
    'ascending_triangle',
    'descending_triangle',
    'symmetrical_triangle',
    'broadening_wedge',
  ];

  if (channelPatternIds.includes(pattern.id as ChartPatternId)) {
    const rangeHighs = swingsInRange(swings, pattern.startIndex, pattern.endIndex, 'high');
    const rangeLows = swingsInRange(swings, pattern.startIndex, pattern.endIndex, 'low');
    const h1 = rangeHighs[0] ?? highs[highs.length - 2];
    const h2 = rangeHighs[rangeHighs.length - 1] ?? highs[highs.length - 1];
    const l1 = rangeLows[0] ?? lows[lows.length - 2];
    const l2 = rangeLows[rangeLows.length - 1] ?? lows[lows.length - 1];

    if (h1 && h2 && l1 && l2) {
      return {
        ...pattern,
        geometry: channelGeometry(h1, h2, l1, l2, pattern.startIndex, pattern.endIndex, candles),
      };
    }
  }

  if (pattern.id === 'double_top' || pattern.id === 'double_bottom') {
    const pool = pattern.id === 'double_top' ? highs : lows;
    const pair = pool.filter((s) => s.index >= pattern.startIndex && s.index <= pattern.endIndex).slice(-2);
    if (pair.length >= 2) {
      return {
        ...pattern,
        geometry: {
          lines: multiPeakGeometry(pair, candles, pattern.id === 'double_top' ? 'upper' : 'lower'),
          markerIndex: pair[1].index,
          markerPrice: (pair[0].price + pair[1].price) / 2,
        },
      };
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
          lines: multiPeakGeometry(trio, candles, pattern.id === 'triple_top' ? 'upper' : 'lower'),
          markerIndex: trio[2].index,
          markerPrice: avg,
        },
      };
    }
  }

  if (pattern.id === 'head_and_shoulders' || pattern.id === 'inverse_head_and_shoulders') {
    const pool = pattern.id === 'head_and_shoulders' ? highs : lows;
    const trio = pool.filter((s) => s.index >= pattern.startIndex && s.index <= pattern.endIndex).slice(-3);
    if (trio.length >= 3) {
      const [left, head, right] = trio;
      const neckSwings = swings.filter(
        (s) => s.kind === (pattern.id === 'head_and_shoulders' ? 'low' : 'high') &&
          s.index > left.index &&
          s.index < right.index,
      );
      const neckLeft = neckSwings.find((s) => s.index < head.index) ?? neckSwings[0];
      const neckRight = neckSwings.filter((s) => s.index > head.index).pop() ?? neckSwings[neckSwings.length - 1];

      const lines: PatternGeometry['lines'] = [];
      if (neckLeft && neckRight) {
        lines.push({
          role: 'neckline',
          from: { index: neckLeft.index, time: neckLeft.time, price: neckLeft.price },
          to: { index: neckRight.index, time: neckRight.time, price: neckRight.price },
        });
      }

      for (const peak of trio) {
        const role = peak === head ? 'horizontal' : pattern.id === 'head_and_shoulders' ? 'upper' : 'lower';
        lines.push({
          role,
          from: { index: peak.index, time: peak.time, price: peak.price },
          to: {
            index: peak.index,
            time: candles[Math.min(peak.index + 2, candles.length - 1)].time,
            price: peak.price,
          },
        });
      }

      return {
        ...pattern,
        geometry: { lines, markerIndex: head.index, markerPrice: head.price },
      };
    }
  }

  if (pattern.id === 'cup_and_handle') {
    const cupLows = lows.filter((s) => s.index >= pattern.startIndex && s.index <= pattern.endIndex);
    const cupLow = cupLows.reduce<SwingPoint | null>((min, s) => (!min || s.price < min.price ? s : min), null);
    const left = highs.find((s) => s.index === pattern.startIndex) ?? highs.find((s) => s.index < (cupLow?.index ?? 0));
    const right = highs.find((s) => s.index === pattern.endIndex - 5) ?? highs[highs.length - 1];
    if (cupLow && left && right) {
      return {
        ...pattern,
        geometry: {
          lines: [
            { role: 'cup', from: { index: left.index, time: left.time, price: left.price }, to: { index: cupLow.index, time: cupLow.time, price: cupLow.price } },
            { role: 'cup', from: { index: cupLow.index, time: cupLow.time, price: cupLow.price }, to: { index: right.index, time: right.time, price: right.price } },
            { role: 'neckline', from: { index: left.index, time: left.time, price: left.price }, to: { index: right.index, time: right.time, price: left.price } },
          ],
          markerIndex: pattern.endIndex,
          markerPrice: candles[pattern.endIndex]?.high,
        },
      };
    }
  }

  return pattern;
}
