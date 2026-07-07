import { Candle } from '../types/indicators';

export function isBullishBar(c: Candle): boolean {
  return c.close > c.open;
}

export function isBearishBar(c: Candle): boolean {
  return c.close < c.open;
}

/** Count consecutive bearish bars ending at `endIndex` (inclusive). */
export function consecutiveBearishEndingAt(candles: Candle[], endIndex: number): number {
  let n = 0;
  for (let i = endIndex; i >= 0; i--) {
    if (!isBearishBar(candles[i])) break;
    n++;
  }
  return n;
}

/** Count consecutive bullish bars ending at `endIndex` (inclusive). */
export function consecutiveBullishEndingAt(candles: Candle[], endIndex: number): number {
  let n = 0;
  for (let i = endIndex; i >= 0; i--) {
    if (!isBullishBar(candles[i])) break;
    n++;
  }
  return n;
}

/** Count consecutive bearish bars starting at `startIndex`. */
export function consecutiveBearishFrom(candles: Candle[], startIndex: number): number {
  let n = 0;
  for (let i = startIndex; i < candles.length; i++) {
    if (!isBearishBar(candles[i])) break;
    n++;
  }
  return n;
}

/** Count consecutive bullish bars starting at `startIndex`. */
export function consecutiveBullishFrom(candles: Candle[], startIndex: number): number {
  let n = 0;
  for (let i = startIndex; i < candles.length; i++) {
    if (!isBullishBar(candles[i])) break;
    n++;
  }
  return n;
}

export interface ImpulseLeg {
  startIndex: number;
  endIndex: number;
  barCount: number;
  direction: 'up' | 'down';
}

/**
 * Group recent bars into impulse legs (runs of same-direction closes).
 * Separated by at least one opposite or doji bar.
 */
export function findImpulseLegs(candles: Candle[], lookback = 48): ImpulseLeg[] {
  const start = Math.max(0, candles.length - lookback);
  const legs: ImpulseLeg[] = [];
  let i = start;

  while (i < candles.length) {
    const up = isBullishBar(candles[i]);
    const down = isBearishBar(candles[i]);
    if (!up && !down) {
      i++;
      continue;
    }
    const dir: 'up' | 'down' = up ? 'up' : 'down';
    const legStart = i;
    while (i < candles.length) {
      const bull = isBullishBar(candles[i]);
      const bear = isBearishBar(candles[i]);
      if (dir === 'up' && !bull) break;
      if (dir === 'down' && !bear) break;
      i++;
    }
    const legEnd = i - 1;
    if (legEnd >= legStart) {
      legs.push({
        startIndex: legStart,
        endIndex: legEnd,
        barCount: legEnd - legStart + 1,
        direction: dir,
      });
    }
  }

  return legs;
}

/** First bullish bar low wick after index `from` — uptrend anchor. */
export function firstBullishWickLowAfter(candles: Candle[], from: number): { index: number; price: number } | null {
  for (let i = from; i < candles.length; i++) {
    if (isBullishBar(candles[i])) {
      return { index: i, price: candles[i].low };
    }
  }
  return null;
}
