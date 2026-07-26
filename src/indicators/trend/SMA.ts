import { Candle } from "../../types/indicators";

/** Simple moving average — emits only after a full `period` window. */
export function calculateSMA(data: Candle[], period: number = 20): { time: number; value: number }[] {
  if (data.length === 0 || period < 1 || data.length < period) return [];

  const results: { time: number; value: number }[] = [];
  let sum = 0;

  for (let i = 0; i < data.length; i++) {
    sum += data[i].close;
    if (i >= period) {
      sum -= data[i - period].close;
    }
    if (i >= period - 1) {
      results.push({ time: data[i].time, value: sum / period });
    }
  }

  return results;
}
