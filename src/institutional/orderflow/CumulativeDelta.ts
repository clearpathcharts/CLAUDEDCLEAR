import { Candle } from "../../types/indicators";

export interface CumulativeVolumeDeltaPoint {
  time: string | number;
  delta: number;
  cumulativeDelta: number;
}

export function calculateCumulativeDelta(candles: Candle[]): CumulativeVolumeDeltaPoint[] {
  let runningCumulative = 0;
  return candles.map(candle => {
    // High-performance heuristic for bid/ask volume split (buy vs sell pressure)
    const priceRange = candle.high - candle.low;
    let buyerRatio = 0.5;

    if (priceRange > 0) {
      // Closes near high denote buyer control; closes near low denote seller control
      buyerRatio = (candle.close - candle.low) / priceRange;
    }

    const buyingVol = buyerRatio * candle.volume;
    const sellingVol = (1 - buyerRatio) * candle.volume;
    const delta = buyingVol - sellingVol;
    runningCumulative += delta;

    return {
      time: candle.time,
      delta: Math.round(delta),
      cumulativeDelta: Math.round(runningCumulative)
    };
  });
}
