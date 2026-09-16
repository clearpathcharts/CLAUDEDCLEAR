import { Candle } from "../../types/indicators";

/**
 * EMA seeded with SMA of the first `period` closes (TradingView / standard convention).
 * Values are only emitted once the seed window is complete.
 */
export function calculateEMA(data: Candle[], period: number = 50): { time: number; value: number }[] {
  if (data.length === 0 || period < 1 || data.length < period) return [];

  const k = 2 / (period + 1);
  let seed = 0;
  for (let i = 0; i < period; i++) {
    seed += data[i].close;
  }
  let prevEMA = seed / period;

  const results: { time: number; value: number }[] = [
    { time: data[period - 1].time, value: prevEMA },
  ];

  for (let i = period; i < data.length; i++) {
    const val = data[i].close * k + prevEMA * (1 - k);
    prevEMA = val;
    results.push({ time: data[i].time, value: val });
  }

  return results;
}

/** Price-array EMA helper used by MACD (same SMA seed). */
export function emaSeries(prices: number[], period: number): (number | null)[] {
  const out: (number | null)[] = new Array(prices.length).fill(null);
  if (prices.length < period || period < 1) return out;

  let seed = 0;
  for (let i = 0; i < period; i++) seed += prices[i];
  let ema = seed / period;
  out[period - 1] = ema;

  const k = 2 / (period + 1);
  for (let i = period; i < prices.length; i++) {
    ema = prices[i] * k + ema * (1 - k);
    out[i] = ema;
  }
  return out;
}
