import { Candle } from "../../types/indicators";
import { LinePoint } from "../lib/math";

/** Annualized historical volatility (log returns, √252). */
export function calculateHV(data: Candle[], period: number = 20): LinePoint[] {
  if (data.length < period + 1) return [];
  const logRet: number[] = [0];
  for (let i = 1; i < data.length; i++) {
    logRet.push(data[i - 1].close === 0 ? 0 : Math.log(data[i].close / data[i - 1].close));
  }
  const out: LinePoint[] = [];
  for (let i = period; i < data.length; i++) {
    let mean = 0;
    for (let j = i - period + 1; j <= i; j++) mean += logRet[j];
    mean /= period;
    let variance = 0;
    for (let j = i - period + 1; j <= i; j++) variance += (logRet[j] - mean) ** 2;
    variance /= period;
    out.push({ time: data[i].time, value: Math.sqrt(variance) * Math.sqrt(252) * 100 });
  }
  return out;
}
