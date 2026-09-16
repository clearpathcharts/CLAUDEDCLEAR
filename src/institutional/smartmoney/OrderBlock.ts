import { Candle } from "../../types/indicators";

export interface OrderBlock {
  index: number;
  time: string | number;
  type: "BULLISH_OB" | "BEARISH_OB";
  high: number;
  low: number;
  volume: number;
}

export function calculateOrderBlock(candles: Candle[], expansionRatio: number = 2): OrderBlock[] {
  if (candles.length < 5) return [];
  const obs: OrderBlock[] = [];

  for (let i = 2; i < candles.length - 2; i++) {
    const current = candles[i];
    const next1 = candles[i + 1];
    const next2 = candles[i + 2];

    const bodySize = Math.abs(current.close - current.open);
    const nextBodySize1 = Math.abs(next1.close - next1.open);
    const nextBodySize2 = Math.abs(next2.close - next2.open);

    // Bullish OB: current candle is down-candle, followed by two strong up-candles
    if (current.close < current.open && next1.close > next1.open && next2.close > next2.open) {
      if (nextBodySize1 > (bodySize * expansionRatio) || nextBodySize2 > (bodySize * expansionRatio)) {
        obs.push({
          index: i,
          time: current.time,
          type: "BULLISH_OB",
          high: current.high,
          low: current.low,
          volume: current.volume
        });
      }
    }

    // Bearish OB: current candle is up-candle, followed by two strong down-candles
    if (current.close > current.open && next1.close < next1.open && next2.close < next2.open) {
      if (nextBodySize1 > (bodySize * expansionRatio) || nextBodySize2 > (bodySize * expansionRatio)) {
        obs.push({
          index: i,
          time: current.time,
          type: "BEARISH_OB",
          high: current.high,
          low: current.low,
          volume: current.volume
        });
      }
    }
  }

  return obs;
}
