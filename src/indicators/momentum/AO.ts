import { Candle } from '../../types/indicators';

function smaOfMedian(data: Candle[], end: number, period: number): number {
  const start = Math.max(0, end - period + 1);
  const slice = data.slice(start, end + 1);
  const sum = slice.reduce((acc, c) => acc + (c.high + c.low) / 2, 0);
  return sum / slice.length;
}

export function calculateAO(data: Candle[], fastPeriod = 5, slowPeriod = 34): { time: number; value: number }[] {
  if (data.length < slowPeriod) return [];

  const results: { time: number; value: number }[] = [];
  for (let i = slowPeriod - 1; i < data.length; i++) {
    const fast = smaOfMedian(data, i, fastPeriod);
    const slow = smaOfMedian(data, i, slowPeriod);
    results.push({ time: data[i].time, value: fast - slow });
  }
  return results;
}
