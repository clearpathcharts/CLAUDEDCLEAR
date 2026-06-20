import { Candle } from "../../types/indicators";

export interface MACDOutput {
  time: number;
  macd: number;
  signal: number;
  histogram: number;
}

export function calculateMACD(
  data: Candle[], 
  fastPeriod: number = 12, 
  slowPeriod: number = 26, 
  signalPeriod: number = 9
): MACDOutput[] {
  if (data.length === 0) return [];

  // Independent EMA calculation helper inside MACD (no outside dependency reuse)
  const computeInternalEMA = (prices: number[], len: number): number[] => {
    const k = 2 / (len + 1);
    let ema = prices[0] || 0;
    return prices.map((p) => {
      ema = p * k + ema * (1 - k);
      return ema;
    });
  };

  const closes = data.map(d => d.close);
  const fastEMA = computeInternalEMA(closes, fastPeriod);
  const slowEMA = computeInternalEMA(closes, slowPeriod);

  const macdVals = data.map((_, idx) => fastEMA[idx] - slowEMA[idx]);
  const signalVals = computeInternalEMA(macdVals, signalPeriod);

  return data.map((d, idx) => ({
    time: d.time,
    macd: macdVals[idx],
    signal: signalVals[idx],
    histogram: macdVals[idx] - signalVals[idx]
  }));
}
