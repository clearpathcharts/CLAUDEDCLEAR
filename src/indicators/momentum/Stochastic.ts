import { Candle } from "../../types/indicators";
import { smaSeries } from "../lib/math";

export interface StochasticOutput {
  time: number;
  k: number;
  d: number;
}

export function calculateStochastic(
  data: Candle[],
  kPeriod: number = 14,
  kSmooth: number = 3,
  dPeriod: number = 3
): StochasticOutput[] {
  if (data.length < kPeriod) return [];
  const rawK: (number | null)[] = new Array(data.length).fill(null);
  for (let i = kPeriod - 1; i < data.length; i++) {
    let hh = -Infinity;
    let ll = Infinity;
    for (let j = i - kPeriod + 1; j <= i; j++) {
      hh = Math.max(hh, data[j].high);
      ll = Math.min(ll, data[j].low);
    }
    const range = hh - ll;
    rawK[i] = range === 0 ? 50 : ((data[i].close - ll) / range) * 100;
  }
  const rawKNums = rawK.map((v) => v ?? 0);
  const kSeries = smaSeries(rawKNums, kSmooth);
  for (let i = 0; i < data.length; i++) if (rawK[i] == null) kSeries[i] = null;
  const kNums = kSeries.map((v) => v ?? 0);
  const dSeries = smaSeries(kNums, dPeriod);
  for (let i = 0; i < data.length; i++) if (kSeries[i] == null) dSeries[i] = null;

  const out: StochasticOutput[] = [];
  for (let i = 0; i < data.length; i++) {
    if (kSeries[i] == null || dSeries[i] == null) continue;
    out.push({ time: data[i].time, k: kSeries[i] as number, d: dSeries[i] as number });
  }
  return out;
}
