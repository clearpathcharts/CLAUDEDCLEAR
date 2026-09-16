import { Candle } from "../../types/indicators";

export interface StructureBreak {
  index: number;
  time: string | number;
  type: "BULLISH_BOS" | "BEARISH_BOS";
  price: number;
}

export function calculateBOS(candles: Candle[], leftBars: number = 5, rightBars: number = 5): StructureBreak[] {
  if (candles.length < (leftBars + rightBars + 1)) return [];
  const breaks: StructureBreak[] = [];
  
  // Pivot Highs & Lows Tracking
  for (let i = leftBars; i < candles.length - rightBars; i++) {
    const current = candles[i];
    let isPivotHigh = true;
    let isPivotLow = true;

    for (let j = i - leftBars; j <= i + rightBars; j++) {
      if (j === i) continue;
      if (candles[j].high > current.high) isPivotHigh = false;
      if (candles[j].low < current.low) isPivotLow = false;
    }

    if (isPivotHigh) {
      // Find subsequent prints breaking high
      for (let k = i + rightBars + 1; k < candles.length; k++) {
        if (candles[k].close > current.high) {
          breaks.push({
            index: k,
            time: candles[k].time,
            type: "BULLISH_BOS",
            price: current.high
          });
          break;
        }
      }
    }

    if (isPivotLow) {
      // Find subsequent prints breaking low
      for (let k = i + rightBars + 1; k < candles.length; k++) {
        if (candles[k].close < current.low) {
          breaks.push({
            index: k,
            time: candles[k].time,
            type: "BEARISH_BOS",
            price: current.low
          });
          break;
        }
      }
    }
  }

  return breaks;
}
