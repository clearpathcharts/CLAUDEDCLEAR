import { Candle } from "../../types/indicators";

export interface PivotOutput {
  time: number;
  pp: number;
  r1: number;
  r2: number;
  s1: number;
  s2: number;
}

/**
 * Classic floor pivots from prior bar H/L/C (intraday rolling).
 * For session pivots, feed daily candles.
 */
export function calculatePivotPoints(data: Candle[]): PivotOutput[] {
  if (data.length < 2) return [];
  const out: PivotOutput[] = [];
  for (let i = 1; i < data.length; i++) {
    const prev = data[i - 1];
    const pp = (prev.high + prev.low + prev.close) / 3;
    const r1 = 2 * pp - prev.low;
    const s1 = 2 * pp - prev.high;
    const r2 = pp + (prev.high - prev.low);
    const s2 = pp - (prev.high - prev.low);
    out.push({ time: data[i].time, pp, r1, r2, s1, s2 });
  }
  return out;
}
