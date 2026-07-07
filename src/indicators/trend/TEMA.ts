import { Candle } from '../../types/indicators';

function emaSeries(values: number[], period: number): number[] {
  if (values.length === 0) return [];
  const k = 2 / (period + 1);
  let prev = values[0];
  return values.map((v) => {
    prev = v * k + prev * (1 - k);
    return prev;
  });
}

export function calculateTEMA(data: Candle[], period = 20): { time: number; value: number }[] {
  if (data.length === 0) return [];

  const closes = data.map((d) => d.close);
  const ema1 = emaSeries(closes, period);
  const ema2 = emaSeries(ema1, period);
  const ema3 = emaSeries(ema2, period);

  return data.map((d, i) => ({
    time: d.time,
    value: 3 * ema1[i] - 3 * ema2[i] + ema3[i],
  }));
}
