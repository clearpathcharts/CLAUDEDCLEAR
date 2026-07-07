import { Candle } from '../../types/indicators';
import { calculateRSI } from './RSI';

export interface StochRsiOutput {
  time: number;
  k: number;
  d: number;
}

export function calculateStochRSI(
  data: Candle[],
  rsiPeriod = 14,
  stochPeriod = 14,
  kSmooth = 3,
  dSmooth = 3,
): StochRsiOutput[] {
  const rsi = calculateRSI(data, rsiPeriod);
  if (rsi.length < stochPeriod) return [];

  const rawK: { time: number; k: number }[] = [];
  for (let i = stochPeriod - 1; i < rsi.length; i++) {
    const slice = rsi.slice(i - stochPeriod + 1, i + 1);
    const highest = Math.max(...slice.map((p) => p.value));
    const lowest = Math.min(...slice.map((p) => p.value));
    const cur = rsi[i].value;
    const k = highest === lowest ? 50 : ((cur - lowest) / (highest - lowest)) * 100;
    rawK.push({ time: rsi[i].time, k });
  }

  const smoothK: { time: number; k: number }[] = [];
  for (let i = kSmooth - 1; i < rawK.length; i++) {
    const slice = rawK.slice(i - kSmooth + 1, i + 1);
    smoothK.push({ time: rawK[i].time, k: slice.reduce((s, p) => s + p.k, 0) / kSmooth });
  }

  const out: StochRsiOutput[] = [];
  for (let i = dSmooth - 1; i < smoothK.length; i++) {
    const slice = smoothK.slice(i - dSmooth + 1, i + 1);
    const d = slice.reduce((s, p) => s + p.k, 0) / dSmooth;
    out.push({ time: smoothK[i].time, k: smoothK[i].k, d });
  }
  return out;
}
