import { Candle } from '../../types/indicators';

export function calculateROC(data: Candle[], period = 12): { time: number; value: number }[] {
  if (data.length <= period) return [];

  const results: { time: number; value: number }[] = [];
  for (let i = period; i < data.length; i++) {
    const prev = data[i - period].close;
    const roc = prev === 0 ? 0 : ((data[i].close - prev) / prev) * 100;
    results.push({ time: data[i].time, value: roc });
  }
  return results;
}
