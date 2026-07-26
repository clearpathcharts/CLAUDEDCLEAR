import { Candle } from "../../types/indicators";
import { LinePoint, typicalPrice } from "../lib/math";

export function calculateCCI(data: Candle[], period: number = 20): LinePoint[] {
  if (data.length < period) return [];
  const out: LinePoint[] = [];
  for (let i = period - 1; i < data.length; i++) {
    const slice = data.slice(i - period + 1, i + 1);
    const tps = slice.map(typicalPrice);
    const sma = tps.reduce((a, b) => a + b, 0) / period;
    const meanDev = tps.reduce((a, b) => a + Math.abs(b - sma), 0) / period;
    out.push({
      time: data[i].time,
      value: meanDev === 0 ? 0 : (tps[tps.length - 1] - sma) / (0.015 * meanDev),
    });
  }
  return out;
}
