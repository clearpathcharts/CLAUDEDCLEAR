import { Candle } from '../../types/indicators';

export interface StochasticOutput {
  time: number;
  k: number;
  d: number;
}

export function calculateStochastic(
  data: Candle[],
  kPeriod = 14,
  dPeriod = 3,
): StochasticOutput[] {
  if (data.length < kPeriod) return [];

  const rawK: { time: number; k: number }[] = [];
  for (let i = kPeriod - 1; i < data.length; i++) {
    const slice = data.slice(i - kPeriod + 1, i + 1);
    const highest = Math.max(...slice.map((c) => c.high));
    const lowest = Math.min(...slice.map((c) => c.low));
    const close = data[i].close;
    const k = highest === lowest ? 50 : ((close - lowest) / (highest - lowest)) * 100;
    rawK.push({ time: data[i].time, k });
  }

  const out: StochasticOutput[] = [];
  for (let i = dPeriod - 1; i < rawK.length; i++) {
    const slice = rawK.slice(i - dPeriod + 1, i + 1);
    const d = slice.reduce((s, p) => s + p.k, 0) / slice.length;
    out.push({ time: rawK[i].time, k: rawK[i].k, d });
  }
  return out;
}
