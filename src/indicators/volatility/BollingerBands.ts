import { Candle } from "../../types/indicators";

export interface BollingerBandsOutput {
  time: number;
  basis: number;
  upper: number;
  lower: number;
}

export function calculateBollingerBands(
  data: Candle[], 
  period: number = 20, 
  stdDevMultiplier: number = 2
): BollingerBandsOutput[] {
  if (data.length === 0) return [];

  return data.map((d, idx) => {
    const start = Math.max(0, idx - period + 1);
    const slice = data.slice(start, idx + 1);
    
    // SMA Basis
    const basis = slice.reduce((acc, curr) => acc + curr.close, 0) / slice.length;
    
    // Standard Deviation
    const variance = slice.reduce((acc, curr) => acc + Math.pow(curr.close - basis, 2), 0) / slice.length;
    const stdDev = Math.sqrt(variance);

    return {
      time: d.time,
      basis,
      upper: basis + stdDevMultiplier * stdDev,
      lower: basis - stdDevMultiplier * stdDev
    };
  });
}
