import { Candle } from '../types/indicators';
import { SwingPoint } from './types';

/** Fractal-style pivot detection (same family as BOS logic). */
export function findSwingPoints(
  candles: Candle[],
  leftBars = 3,
  rightBars = 3,
): SwingPoint[] {
  if (candles.length < leftBars + rightBars + 1) return [];

  const swings: SwingPoint[] = [];

  for (let i = leftBars; i < candles.length - rightBars; i++) {
    const c = candles[i];
    let isHigh = true;
    let isLow = true;

    for (let j = i - leftBars; j <= i + rightBars; j++) {
      if (j === i) continue;
      if (candles[j].high >= c.high) isHigh = false;
      if (candles[j].low <= c.low) isLow = false;
    }

    if (isHigh) swings.push({ index: i, time: c.time, price: c.high, kind: 'high' });
    if (isLow) swings.push({ index: i, time: c.time, price: c.low, kind: 'low' });
  }

  return swings.sort((a, b) => a.index - b.index);
}

export function slope(p1: SwingPoint, p2: SwingPoint): number {
  const dx = p2.index - p1.index;
  if (dx === 0) return 0;
  return (p2.price - p1.price) / dx;
}

export function pricesNear(a: number, b: number, tolerancePct = 0.015): boolean {
  const mid = (a + b) / 2;
  if (mid === 0) return false;
  return Math.abs(a - b) / mid <= tolerancePct;
}
