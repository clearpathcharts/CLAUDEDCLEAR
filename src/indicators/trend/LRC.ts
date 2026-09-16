import { Candle } from "../../types/indicators";
import { LinePoint } from "../lib/math";

/** Linear regression curve (end-point of least-squares fit over period). */
export function calculateLRC(data: Candle[], period: number = 25): LinePoint[] {
  if (data.length < period || period < 2) return [];
  const out: LinePoint[] = [];
  const xMean = (period - 1) / 2;
  let denom = 0;
  for (let x = 0; x < period; x++) denom += (x - xMean) ** 2;

  for (let i = period - 1; i < data.length; i++) {
    let yMean = 0;
    for (let j = 0; j < period; j++) yMean += data[i - period + 1 + j].close;
    yMean /= period;
    let cov = 0;
    for (let j = 0; j < period; j++) {
      cov += (j - xMean) * (data[i - period + 1 + j].close - yMean);
    }
    const slope = cov / denom;
    const intercept = yMean - slope * xMean;
    out.push({ time: data[i].time, value: intercept + slope * (period - 1) });
  }
  return out;
}
