/** Fibonacci ratios used across retracement, extension, fan, time, and circle tools. */

export const FIB_RATIOS = [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1] as const;

export const FIB_EXT_RATIOS = [0, 0.618, 1, 1.272, 1.618, 2.0, 2.618] as const;

export const FIB_TIME_RATIOS = [0, 0.382, 0.5, 0.618, 1, 1.618, 2.618, 4.236] as const;

export function fibPrice(high: number, low: number, ratio: number): number {
  return high - (high - low) * ratio;
}

export function fibAlong(a: number, b: number, ratio: number): number {
  return a + (b - a) * ratio;
}
