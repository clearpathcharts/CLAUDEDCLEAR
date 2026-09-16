import { Candle } from "../../types/indicators";
import { emaSeries } from "../trend/EMA";

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

  const closes = data.map((d) => d.close);
  const fastEMA = emaSeries(closes, fastPeriod);
  const slowEMA = emaSeries(closes, slowPeriod);

  const macdLine: (number | null)[] = closes.map((_, idx) => {
    const f = fastEMA[idx];
    const s = slowEMA[idx];
    if (f == null || s == null) return null;
    return f - s;
  });

  // Signal = EMA of MACD line (skip null warmup bars)
  const macdForSignal: number[] = [];
  const macdIndexMap: number[] = [];
  for (let i = 0; i < macdLine.length; i++) {
    if (macdLine[i] != null) {
      macdForSignal.push(macdLine[i] as number);
      macdIndexMap.push(i);
    }
  }

  const signalOnCompact = emaSeries(macdForSignal, signalPeriod);
  const signalLine: (number | null)[] = new Array(data.length).fill(null);
  for (let j = 0; j < signalOnCompact.length; j++) {
    if (signalOnCompact[j] != null) {
      signalLine[macdIndexMap[j]] = signalOnCompact[j];
    }
  }

  const results: MACDOutput[] = [];
  for (let i = 0; i < data.length; i++) {
    const macd = macdLine[i];
    const signal = signalLine[i];
    if (macd == null || signal == null) continue;
    results.push({
      time: data[i].time,
      macd,
      signal,
      histogram: macd - signal,
    });
  }

  return results;
}
