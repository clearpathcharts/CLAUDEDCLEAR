import { Candle } from "../../types/indicators";

export interface FairValueGap {
  index: number;
  time: string | number;
  type: "BULLISH_FVG" | "BEARISH_FVG";
  top: number;
  bottom: number;
  mitigated: boolean;
}

export function calculateFVG(candles: Candle[]): FairValueGap[] {
  if (candles.length < 3) return [];
  const gvgs: FairValueGap[] = [];

  for (let i = 1; i < candles.length - 1; i++) {
    const prev = candles[i - 1];
    const next = candles[i + 1];

    // Bullish FVG: Low of candle 3 is greater than High of candle 1
    if (next.low > prev.high) {
      gvgs.push({
        index: i,
        time: candles[i].time,
        type: "BULLISH_FVG",
        top: next.low,
        bottom: prev.high,
        mitigated: false
      });
    }

    // Bearish FVG: High of candle 3 is lower than Low of candle 1
    if (next.high < prev.low) {
      gvgs.push({
        index: i,
        time: candles[i].time,
        type: "BEARISH_FVG",
        top: prev.low,
        bottom: next.high,
        mitigated: false
      });
    }
  }

  return gvgs;
}
