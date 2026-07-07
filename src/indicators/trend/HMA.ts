import { Candle } from '../../types/indicators';
import { calculateWMA } from './WMA';

function wmaOnSeries(times: number[], values: number[], period: number): { time: number; value: number }[] {
  const pseudo: Candle[] = times.map((time, i) => ({
    time,
    open: values[i],
    high: values[i],
    low: values[i],
    close: values[i],
  }));
  return calculateWMA(pseudo, period);
}

export function calculateHMA(data: Candle[], period = 20): { time: number; value: number }[] {
  if (data.length < period) return [];

  const half = Math.max(1, Math.floor(period / 2));
  const sqrt = Math.max(1, Math.floor(Math.sqrt(period)));

  const wmaFull = calculateWMA(data, period);
  const wmaHalf = calculateWMA(data, half);
  const fullByTime = new Map(wmaFull.map((p) => [p.time, p.value]));
  const raw: { time: number; value: number }[] = [];

  for (const p of wmaHalf) {
    const full = fullByTime.get(p.time);
    if (full !== undefined) raw.push({ time: p.time, value: 2 * p.value - full });
  }

  if (raw.length < sqrt) return [];
  const times = raw.map((r) => r.time);
  const values = raw.map((r) => r.value);
  return wmaOnSeries(times, values, sqrt);
}
