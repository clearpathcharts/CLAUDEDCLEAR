/** Standard Fibonacci retracement ratios. */
export const FIB_RATIOS = [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1] as const;

export function fibPrice(high: number, low: number, ratio: number): number {
  return high - (high - low) * ratio;
}
