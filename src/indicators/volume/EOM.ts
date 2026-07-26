import { Candle } from "../../types/indicators";
import { candleVolume, LinePoint, midpoint, smaSeries } from "../lib/math";

export function calculateEOM(data: Candle[], period: number = 14): LinePoint[] {
  if (data.length < 2) return [];
  const raw: number[] = [0];
  for (let i = 1; i < data.length; i++) {
    const dist = midpoint(data[i]) - midpoint(data[i - 1]);
    const box = candleVolume(data[i]) === 0 ? 0 : (data[i].high - data[i].low) / candleVolume(data[i]);
    raw.push(box === 0 ? 0 : dist / box);
  }
  const sma = smaSeries(raw, period);
  const out: LinePoint[] = [];
  for (let i = 0; i < data.length; i++) {
    if (sma[i] == null) continue;
    out.push({ time: data[i].time, value: sma[i] as number });
  }
  return out;
}
