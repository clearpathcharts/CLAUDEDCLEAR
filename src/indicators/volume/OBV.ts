import { Candle } from "../../types/indicators";

function candleVolume(c: Candle): number {
  // Use real volume when present; never invent volume as 1.
  return typeof c.volume === "number" && Number.isFinite(c.volume) ? c.volume : 0;
}

export function calculateOBV(data: Candle[]): { time: number; value: number }[] {
  if (data.length === 0) return [];

  const results: { time: number; value: number }[] = [];
  let currentOBV = 0;
  results.push({ time: data[0].time, value: currentOBV });

  for (let i = 1; i < data.length; i++) {
    const vol = candleVolume(data[i]);
    if (data[i].close > data[i - 1].close) {
      currentOBV += vol;
    } else if (data[i].close < data[i - 1].close) {
      currentOBV -= vol;
    }
    results.push({ time: data[i].time, value: currentOBV });
  }

  return results;
}
