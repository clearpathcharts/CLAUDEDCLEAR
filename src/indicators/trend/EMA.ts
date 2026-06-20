import { Candle } from "../../types/indicators";

export function calculateEMA(data: Candle[], period: number = 50): { time: number; value: number }[] {
  if (data.length === 0) return [];
  const k = 2 / (period + 1);
  let prevEMA = data[0]?.close || 0;
  return data.map((d) => {
    const val = d.close * k + prevEMA * (1 - k);
    prevEMA = val;
    return { time: d.time, value: val };
  });
}
