import { Candle } from '../../types/indicators';

export function calculateCCI(data: Candle[], period = 20): { time: number; value: number }[] {
  if (data.length < period) return [];

  const results: { time: number; value: number }[] = [];
  for (let i = period - 1; i < data.length; i++) {
    const slice = data.slice(i - period + 1, i + 1);
    const tp = slice.map((c) => (c.high + c.low + c.close) / 3);
    const sma = tp.reduce((a, b) => a + b, 0) / period;
    const meanDev = tp.reduce((a, b) => a + Math.abs(b - sma), 0) / period;
    const cur = (data[i].high + data[i].low + data[i].close) / 3;
    const cci = meanDev === 0 ? 0 : (cur - sma) / (0.015 * meanDev);
    results.push({ time: data[i].time, value: cci });
  }
  return results;
}
