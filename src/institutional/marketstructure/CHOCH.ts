import { Candle } from "../../types/indicators";

export interface CharacterShift {
  index: number;
  time: string | number;
  type: "BULLISH_CHOCH" | "BEARISH_CHOCH";
  price: number;
}

export function calculateCHOCH(candles: Candle[], leftBars: number = 5, rightBars: number = 5): CharacterShift[] {
  if (candles.length < (leftBars + rightBars + 1)) return [];
  const shifts: CharacterShift[] = [];
  
  // High-performance structural swing mapping
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
      for (let k = i + rightBars + 1; k < candles.length; k++) {
        // Break to opposite direction denotes change of character
        if (candles[k].close < current.low) {
          shifts.push({
            index: k,
            time: candles[k].time,
            type: "BEARISH_CHOCH",
            price: current.low
          });
          break;
        }
      }
    }

    if (isPivotLow) {
      for (let k = i + rightBars + 1; k < candles.length; k++) {
        if (candles[k].close > current.high) {
          shifts.push({
            index: k,
            time: candles[k].time,
            type: "BULLISH_CHOCH",
            price: current.high
          });
          break;
        }
      }
    }
  }

  return shifts;
}
