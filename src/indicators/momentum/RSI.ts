import { Candle } from "../../types/indicators";

export function calculateRSI(data: Candle[], period: number = 14): { time: number; value: number }[] {
  if (data.length <= period) return [];

  const results: { time: number; value: number }[] = [];
  let gains = 0;
  let losses = 0;

  // First RSI value computation
  for (let i = 1; i <= period; i++) {
    const diff = data[i].close - data[i - 1].close;
    if (diff > 0) {
      gains += diff;
    } else {
      losses -= diff;
    }
  }

  let avgGain = gains / period;
  let avgLoss = losses / period;

  let rsi = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);
  results.push({ time: data[period].time, value: rsi });

  // Smooth Wilder's RSI calculation
  for (let i = period + 1; i < data.length; i++) {
    const diff = data[i].close - data[i - 1].close;
    const gain = diff > 0 ? diff : 0;
    const loss = diff < 0 ? -diff : 0;

    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;

    rsi = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);
    results.push({ time: data[i].time, value: rsi });
  }

  return results;
}
