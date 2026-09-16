import { Candle } from "../../types/indicators";

export interface LiquiditySweep {
  index: number;
  time: string | number;
  type: "HIGH_SWEEP" | "LOW_SWEEP";
  priceLevel: number;
}

export function calculateLiquiditySweep(candles: Candle[], lookback: number = 20): LiquiditySweep[] {
  if (candles.length < lookback + 1) return [];
  const sweeps: LiquiditySweep[] = [];

  for (let i = lookback; i < candles.length; i++) {
    const slice = candles.slice(i - lookback, i);
    const highestHigh = Math.max(...slice.map(c => c.high));
    const lowestLow = Math.min(...slice.map(c => c.low));

    const current = candles[i];

    // Bullish/Low Sweep: Price dips below prior structural lows, but wicks and closes above it.
    if (current.low < lowestLow && current.close > lowestLow) {
      sweeps.push({
        index: i,
        time: current.time,
        type: "LOW_SWEEP",
        priceLevel: lowestLow
      });
    }

    // Bearish/High Sweep: Price spikes above prior high but closes back under it
    if (current.high > highestHigh && current.close < highestHigh) {
      sweeps.push({
        index: i,
        time: current.time,
        type: "HIGH_SWEEP",
        priceLevel: highestHigh
      });
    }
  }

  return sweeps;
}
