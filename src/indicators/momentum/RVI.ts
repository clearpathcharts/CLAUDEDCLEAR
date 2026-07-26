import { Candle } from "../../types/indicators";
import { smaSeries } from "../lib/math";

export interface RVIOutput {
  time: number;
  rvi: number;
  signal: number;
}

export function calculateRVI(data: Candle[], period: number = 10): RVIOutput[] {
  if (data.length < period + 4) return [];
  const num: number[] = [];
  const den: number[] = [];
  for (let i = 0; i < data.length; i++) {
    num.push(data[i].close - data[i].open);
    den.push(data[i].high - data[i].low);
  }
  // TradingView-style 4-bar weighted numerator/denominator then SMA
  const numW: (number | null)[] = new Array(data.length).fill(null);
  const denW: (number | null)[] = new Array(data.length).fill(null);
  for (let i = 3; i < data.length; i++) {
    numW[i] = (num[i] + 2 * num[i - 1] + 2 * num[i - 2] + num[i - 3]) / 6;
    denW[i] = (den[i] + 2 * den[i - 1] + 2 * den[i - 2] + den[i - 3]) / 6;
  }
  const numS = smaSeries(numW.map((v) => v ?? 0), period);
  const denS = smaSeries(denW.map((v) => v ?? 0), period);
  for (let i = 0; i < data.length; i++) {
    if (numW[i] == null) {
      numS[i] = null;
      denS[i] = null;
    }
  }
  const rviLine: (number | null)[] = numS.map((n, i) => {
    const d = denS[i];
    if (n == null || d == null || d === 0) return null;
    return n / d;
  });
  const rviNums = rviLine.map((v) => v ?? 0);
  const signal = smaSeries(rviNums, 4);
  for (let i = 0; i < data.length; i++) if (rviLine[i] == null) signal[i] = null;

  const out: RVIOutput[] = [];
  for (let i = 0; i < data.length; i++) {
    if (rviLine[i] == null || signal[i] == null) continue;
    out.push({ time: data[i].time, rvi: rviLine[i] as number, signal: signal[i] as number });
  }
  return out;
}
