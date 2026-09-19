import { Candle } from '../types/indicators';
import { PatternLineSegment } from './types';
import { SwingPoint } from './types';

export interface LineAnchor {
  index: number;
  time: number;
  price: number;
}

/** True when the trendline price sits inside the candle body/wick range (not on a wick tip). */
export function lineCutsCandle(candle: Candle, linePrice: number): boolean {
  return linePrice > candle.low && linePrice < candle.high;
}

export function priceAtLine(from: LineAnchor, to: LineAnchor, index: number): number {
  const dx = to.index - from.index;
  if (dx === 0) return from.price;
  const t = (index - from.index) / dx;
  return from.price + t * (to.price - from.price);
}

export function countLineViolations(
  candles: Candle[],
  from: LineAnchor,
  to: LineAnchor,
  startIndex: number,
  endIndex: number,
): number {
  let violations = 0;
  const lo = Math.max(startIndex, Math.min(from.index, to.index));
  const hi = Math.min(endIndex, Math.max(from.index, to.index));
  for (let i = lo; i <= hi; i++) {
    const p = priceAtLine(from, to, i);
    if (lineCutsCandle(candles[i], p)) violations++;
  }
  return violations;
}

/** Upper boundary: shift up until the line never pierces a candle interior. */
export function fitUpperTrendline(
  h1: SwingPoint,
  h2: SwingPoint,
  candles: Candle[],
  startIndex: number,
  endIndex: number,
): { from: LineAnchor; to: LineAnchor } | null {
  const from: LineAnchor = { index: h1.index, time: h1.time, price: h1.price };
  const to: LineAnchor = { index: h2.index, time: h2.time, price: h2.price };

  let shift = 0;
  for (let i = startIndex; i <= endIndex; i++) {
    const p = priceAtLine(from, to, i);
    const c = candles[i];
    if (p < c.high) shift = Math.max(shift, c.high - p);
  }

  const fittedFrom = { ...from, price: from.price + shift };
  const fittedTo = { ...to, price: to.price + shift };

  // Return best shifted line even if a few wicks still nick it.
  return { from: fittedFrom, to: fittedTo };
}

/** Lower boundary: shift down until the line never pierces a candle interior. */
export function fitLowerTrendline(
  l1: SwingPoint,
  l2: SwingPoint,
  candles: Candle[],
  startIndex: number,
  endIndex: number,
): { from: LineAnchor; to: LineAnchor } | null {
  const from: LineAnchor = { index: l1.index, time: l1.time, price: l1.price };
  const to: LineAnchor = { index: l2.index, time: l2.time, price: l2.price };

  let shift = 0;
  for (let i = startIndex; i <= endIndex; i++) {
    const p = priceAtLine(from, to, i);
    const c = candles[i];
    if (p > c.low) shift = Math.max(shift, p - c.low);
  }

  const fittedFrom = { ...from, price: from.price - shift };
  const fittedTo = { ...to, price: to.price - shift };

  return { from: fittedFrom, to: fittedTo };
}

/** Horizontal resistance — level at or above every high in range. */
export function fitHorizontalResistance(
  candles: Candle[],
  startIndex: number,
  endIndex: number,
  hintLevel?: number,
): number {
  let level = hintLevel ?? -Infinity;
  for (let i = startIndex; i <= endIndex; i++) {
    level = Math.max(level, candles[i].high);
  }
  return level;
}

/** Horizontal support — level at or below every low in range. */
export function fitHorizontalSupport(
  candles: Candle[],
  startIndex: number,
  endIndex: number,
  hintLevel?: number,
): number {
  let level = hintLevel ?? Infinity;
  for (let i = startIndex; i <= endIndex; i++) {
    level = Math.min(level, candles[i].low);
  }
  return level;
}

export function projectTrendline(
  fitted: { from: LineAnchor; to: LineAnchor },
  candles: Candle[],
  startIndex: number,
  endIndex: number,
  role: PatternLineSegment['role'],
): PatternLineSegment {
  return {
    role,
    from: {
      index: startIndex,
      time: candles[startIndex].time,
      price: priceAtLine(fitted.from, fitted.to, startIndex),
    },
    to: {
      index: endIndex,
      time: candles[endIndex].time,
      price: priceAtLine(fitted.from, fitted.to, endIndex),
    },
  };
}

export function extendTrendlineToRange(
  fitted: { from: LineAnchor; to: LineAnchor },
  candles: Candle[],
  startIndex: number,
  endIndex: number,
  role: PatternLineSegment['role'],
  opts?: { checkEndIndex?: number },
): PatternLineSegment | null {
  const projected = projectTrendline(fitted, candles, startIndex, endIndex, role);
  const checkEnd = Math.min(endIndex, opts?.checkEndIndex ?? endIndex);
  if (countLineViolations(candles, projected.from, projected.to, startIndex, checkEnd) > 0) {
    return null;
  }

  return projected;
}

/** Walk the live edge back until the ray no longer cuts the breakout impulse. */
export function extendWhileSafe(
  fitted: { from: LineAnchor; to: LineAnchor },
  candles: Candle[],
  startIndex: number,
  endIndex: number,
  role: PatternLineSegment['role'],
  minEndIndex: number,
): PatternLineSegment {
  let to = endIndex;
  const floor = Math.max(startIndex + 1, minEndIndex);
  while (to > floor) {
    const candidate = projectTrendline(fitted, candles, startIndex, to, role);
    if (countLineViolations(candles, candidate.from, candidate.to, startIndex, to) === 0) {
      return candidate;
    }
    to -= 1;
  }
  return projectTrendline(fitted, candles, startIndex, floor, role);
}

export function horizontalSegment(
  candles: Candle[],
  startIndex: number,
  endIndex: number,
  price: number,
  role: PatternLineSegment['role'],
): PatternLineSegment | null {
  // Always emit the horizontal — strict wick avoidance used to delete real triangles.
  return {
    role,
    from: { index: startIndex, time: candles[startIndex].time, price },
    to: { index: endIndex, time: candles[endIndex].time, price },
  };
}

/** Verify every drawn segment in a pattern respects candle bounds. */
export function allSegmentsCandleSafe(
  candles: Candle[],
  lines: PatternLineSegment[],
  maxViolationRatio = 0.12,
): boolean {
  for (const line of lines) {
    const lo = Math.min(line.from.index, line.to.index);
    const hi = Math.max(line.from.index, line.to.index);
    const span = Math.max(1, hi - lo + 1);
    let violations = 0;
    for (let i = lo; i <= hi; i++) {
      const p = priceAtLine(line.from, line.to, i);
      if (lineCutsCandle(candles[i], p)) violations++;
    }
    if (violations / span > maxViolationRatio) return false;
  }
  return true;
}
