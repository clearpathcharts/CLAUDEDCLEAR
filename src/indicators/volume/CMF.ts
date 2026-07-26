import { Candle } from "../../types/indicators";
import { candleVolume, LinePoint } from "../lib/math";

export function calculateCMF(data: Candle[], period: number = 20): LinePoint[] {
  if (data.length < period) return [];
  const out: LinePoint[] = [];
  for (let i = period - 1; i < data.length; i++) {
    let mfv = 0;
    let vol = 0;
    for (let j = i - period + 1; j <= i; j++) {
      const range = data[j].high - data[j].low;
      const mfm = range === 0 ? 0 : ((data[j].close - data[j].low) - (data[j].high - data[j].close)) / range;
      const v = candleVolume(data[j]);
      mfv += mfm * v;
      vol += v;
    }
    out.push({ time: data[i].time, value: vol === 0 ? 0 : mfv / vol });
  }
  return out;
}
