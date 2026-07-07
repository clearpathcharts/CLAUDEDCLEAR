import { Candle } from '../../types/indicators';

export function calculateWilliamsR(data: Candle[], period = 14): { time: number; value: number }[] {
  if (data.length < period) return [];

  const results: { time: number; value: number }[] = [];
  for (let i = period - 1; i < data.length; i++) {
    const slice = data.slice(i - period + 1, i + 1);
    const highest = Math.max(...slice.map((c) => c.high));
    const lowest = Math.min(...slice.map((c) => c.low));
    const close = data[i].close;
    const wr = highest === lowest ? -50 : ((highest - close) / (highest - lowest)) * -100;
    results.push({ time: data[i].time, value: wr });
  }
  return results;
}
