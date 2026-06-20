import { Candle } from "../../types/indicators";

export function calculateATR(data: Candle[], period: number = 14): { time: number; value: number }[] {
  if (data.length <= 1) return [];

  // 1. Compute True Range (TR) for each candle
  const trData: number[] = [];
  trData.push(data[0].high - data[0].low); // First bar has no prior close

  for (let i = 1; i < data.length; i++) {
    const highLow = data[i].high - data[i].low;
    const highClose = Math.abs(data[i].high - data[i - 1].close);
    const lowClose = Math.abs(data[i].low - data[i - 1].close);
    trData.push(Math.max(highLow, highClose, lowClose));
  }

  // 2. Compute Wilders' Moving Average of the True Range
  const results: { time: number; value: number }[] = [];
  let trSum = 0;

  for (let i = 0; i < period; i++) {
    trSum += trData[i];
  }

  let currentATR = trSum / period;
  results.push({ time: data[period - 1].time, value: currentATR });

  for (let i = period; i < data.length; i++) {
    currentATR = (currentATR * (period - 1) + trData[i]) / period;
    results.push({ time: data[i].time, value: currentATR });
  }

  return results;
}
