import { Candle } from "../../types/indicators";
import { candleVolume, LinePoint, typicalPrice } from "../lib/math";

export function calculateMFI(data: Candle[], period: number = 14): LinePoint[] {
  if (data.length <= period) return [];
  const tp = data.map(typicalPrice);
  const rawFlow = data.map((d, i) => tp[i] * candleVolume(d));
  const out: LinePoint[] = [];
  for (let i = period; i < data.length; i++) {
    let pos = 0;
    let neg = 0;
    for (let j = i - period + 1; j <= i; j++) {
      if (tp[j] > tp[j - 1]) pos += rawFlow[j];
      else if (tp[j] < tp[j - 1]) neg += rawFlow[j];
    }
    const ratio = neg === 0 ? 100 : pos / neg;
    out.push({ time: data[i].time, value: neg === 0 ? 100 : 100 - 100 / (1 + ratio) });
  }
  return out;
}
