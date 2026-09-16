import { Candle } from "../../types/indicators";
import { candleVolume, LinePoint } from "../lib/math";

export function calculateVWMA(data: Candle[], period: number = 20): LinePoint[] {
  if (data.length < period || period < 1) return [];
  const out: LinePoint[] = [];
  for (let i = period - 1; i < data.length; i++) {
    let pv = 0;
    let vol = 0;
    for (let j = i - period + 1; j <= i; j++) {
      const v = candleVolume(data[j]);
      pv += data[j].close * v;
      vol += v;
    }
    out.push({ time: data[i].time, value: vol > 0 ? pv / vol : data[i].close });
  }
  return out;
}
