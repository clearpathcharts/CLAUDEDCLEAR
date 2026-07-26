import { Candle } from "../../types/indicators";
import { calculateRSI } from "./RSI";
import { smaSeries } from "../lib/math";

export interface StochRSIOutput {
  time: number;
  k: number;
  d: number;
}

export function calculateStochRSI(
  data: Candle[],
  rsiPeriod: number = 14,
  stochPeriod: number = 14,
  kSmooth: number = 3,
  dPeriod: number = 3
): StochRSIOutput[] {
  const rsi = calculateRSI(data, rsiPeriod);
  if (rsi.length < stochPeriod) return [];

  const rawK: (number | null)[] = new Array(rsi.length).fill(null);
  for (let i = stochPeriod - 1; i < rsi.length; i++) {
    let hi = -Infinity;
    let lo = Infinity;
    for (let j = i - stochPeriod + 1; j <= i; j++) {
      hi = Math.max(hi, rsi[j].value);
      lo = Math.min(lo, rsi[j].value);
    }
    const range = hi - lo;
    rawK[i] = range === 0 ? 50 : ((rsi[i].value - lo) / range) * 100;
  }
  const rawNums = rawK.map((v) => v ?? 0);
  const kSeries = smaSeries(rawNums, kSmooth);
  for (let i = 0; i < rsi.length; i++) if (rawK[i] == null) kSeries[i] = null;
  const kNums = kSeries.map((v) => v ?? 0);
  const dSeries = smaSeries(kNums, dPeriod);
  for (let i = 0; i < rsi.length; i++) if (kSeries[i] == null) dSeries[i] = null;

  const out: StochRSIOutput[] = [];
  for (let i = 0; i < rsi.length; i++) {
    if (kSeries[i] == null || dSeries[i] == null) continue;
    out.push({ time: rsi[i].time, k: kSeries[i] as number, d: dSeries[i] as number });
  }
  return out;
}
