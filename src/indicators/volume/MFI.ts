import { Candle } from '../../types/indicators';

export function calculateMFI(data: Candle[], period = 14): { time: number; value: number }[] {
  if (data.length <= period) return [];

  const results: { time: number; value: number }[] = [];
  for (let i = period; i < data.length; i++) {
    let posFlow = 0;
    let negFlow = 0;
    for (let j = i - period + 1; j <= i; j++) {
      const tp = (data[j].high + data[j].low + data[j].close) / 3;
      const prevTp = (data[j - 1].high + data[j - 1].low + data[j - 1].close) / 3;
      const raw = tp * (data[j].volume ?? 1);
      if (tp > prevTp) posFlow += raw;
      else if (tp < prevTp) negFlow += raw;
    }
    const ratio = negFlow === 0 ? 100 : posFlow / negFlow;
    const mfi = 100 - 100 / (1 + ratio);
    results.push({ time: data[i].time, value: mfi });
  }
  return results;
}
