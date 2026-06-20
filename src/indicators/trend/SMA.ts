import { Candle } from "../../types/indicators";

export function calculateSMA(data: Candle[], period: number = 20): { time: number; value: number }[] {
  if (data.length === 0) return [];
  return data.map((d, idx) => {
    const start = Math.max(0, idx - period + 1);
    const slice = data.slice(start, idx + 1);
    const sum = slice.reduce((acc, curr) => acc + curr.close, 0);
    return { time: d.time, value: sum / slice.length };
  });
}
