import { Candle } from '../../types/indicators';

export interface DonchianOutput {
  time: number;
  upper: number;
  lower: number;
  basis: number;
}

export function calculateDonchianChannels(data: Candle[], period = 20): DonchianOutput[] {
  if (data.length < period) return [];

  const results: DonchianOutput[] = [];
  for (let i = period - 1; i < data.length; i++) {
    const slice = data.slice(i - period + 1, i + 1);
    const upper = Math.max(...slice.map((c) => c.high));
    const lower = Math.min(...slice.map((c) => c.low));
    results.push({ time: data[i].time, upper, lower, basis: (upper + lower) / 2 });
  }
  return results;
}
