import { Candle } from "../../types/indicators";

export interface BollingerBandsOutput {
  time: number;
  basis: number;
  upper: number;
  lower: number;
}

/**
 * Bollinger Bands: SMA basis + population standard deviation (TradingView default).
 * Emits only after a full `period` window.
 */
export function calculateBollingerBands(
  data: Candle[],
  period: number = 20,
  stdDevMultiplier: number = 2
): BollingerBandsOutput[] {
  if (data.length === 0 || period < 1 || data.length < period) return [];

  const results: BollingerBandsOutput[] = [];

  for (let idx = period - 1; idx < data.length; idx++) {
    const start = idx - period + 1;
    let sum = 0;
    for (let i = start; i <= idx; i++) sum += data[i].close;
    const basis = sum / period;

    let variance = 0;
    for (let i = start; i <= idx; i++) {
      const diff = data[i].close - basis;
      variance += diff * diff;
    }
    const stdDev = Math.sqrt(variance / period);

    results.push({
      time: data[idx].time,
      basis,
      upper: basis + stdDevMultiplier * stdDev,
      lower: basis - stdDevMultiplier * stdDev,
    });
  }

  return results;
}
