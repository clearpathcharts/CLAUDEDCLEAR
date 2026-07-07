import { Candle } from '../../types/indicators';

export function calculateWMA(data: Candle[], period = 20): { time: number; value: number }[] {
  if (data.length === 0) return [];

  const denom = (period * (period + 1)) / 2;
  return data.map((d, idx) => {
    const start = Math.max(0, idx - period + 1);
    const slice = data.slice(start, idx + 1);
    const len = slice.length;
    const weightBase = period - len + 1;
    let weighted = 0;
    let weightSum = 0;
    slice.forEach((c, i) => {
      const w = weightBase + i;
      weighted += c.close * w;
      weightSum += w;
    });
    return { time: d.time, value: weighted / weightSum };
  });
}
