import { Candle } from "../../types/indicators";

export function calculateOBV(data: Candle[]): { time: number; value: number }[] {
  if (data.length === 0) return [];

  const results: { time: number; value: number }[] = [];
  let currentOBV = 0;
  results.push({ time: data[0].time, value: currentOBV });

  for (let i = 1; i < data.length; i++) {
    const vol = data[i].volume || 1;
    if (data[i].close > data[i - 1].close) {
      currentOBV += vol;
    } else if (data[i].close < data[i - 1].close) {
      currentOBV -= vol;
    }
    // If closes are equal, OBV remains unchanged.
    
    results.push({ time: data[i].time, value: currentOBV });
  }

  return results;
}
