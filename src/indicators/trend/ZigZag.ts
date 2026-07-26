import { Candle } from "../../types/indicators";
import { LinePoint } from "../lib/math";

/**
 * ZigZag connecting confirmed pivots (deviation % of price).
 * Last leg can still move until confirmed — standard ZigZag behavior.
 */
export function calculateZigZag(data: Candle[], deviationPct: number = 5): LinePoint[] {
  if (data.length < 3) return [];
  const pivots: LinePoint[] = [];
  let lastPivotIdx = 0;
  let lastPivotPrice = data[0].close;
  let trend: 1 | -1 | 0 = 0;

  for (let i = 1; i < data.length; i++) {
    const change = ((data[i].close - lastPivotPrice) / lastPivotPrice) * 100;
    if (trend >= 0 && change <= -deviationPct) {
      pivots.push({ time: data[lastPivotIdx].time, value: lastPivotPrice });
      lastPivotIdx = i;
      lastPivotPrice = data[i].close;
      trend = -1;
    } else if (trend <= 0 && change >= deviationPct) {
      pivots.push({ time: data[lastPivotIdx].time, value: lastPivotPrice });
      lastPivotIdx = i;
      lastPivotPrice = data[i].close;
      trend = 1;
    } else if (trend === 1 && data[i].close > lastPivotPrice) {
      lastPivotIdx = i;
      lastPivotPrice = data[i].close;
    } else if (trend === -1 && data[i].close < lastPivotPrice) {
      lastPivotIdx = i;
      lastPivotPrice = data[i].close;
    } else if (trend === 0) {
      if (Math.abs(change) >= deviationPct) {
        pivots.push({ time: data[0].time, value: data[0].close });
        lastPivotIdx = i;
        lastPivotPrice = data[i].close;
        trend = change > 0 ? 1 : -1;
      }
    }
  }
  pivots.push({ time: data[lastPivotIdx].time, value: lastPivotPrice });
  return pivots;
}
