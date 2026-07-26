import { Candle } from "../../types/indicators";
import { LinePoint } from "../lib/math";

export function calculateUO(
  data: Candle[],
  p1: number = 7,
  p2: number = 14,
  p3: number = 28
): LinePoint[] {
  if (data.length < p3 + 1) return [];
  const bp: number[] = [];
  const tr: number[] = [];
  for (let i = 0; i < data.length; i++) {
    const prevClose = i === 0 ? data[i].open : data[i - 1].close;
    const lowMin = Math.min(data[i].low, prevClose);
    bp.push(data[i].close - lowMin);
    tr.push(Math.max(data[i].high, prevClose) - lowMin);
  }
  const avg = (arr: number[], end: number, len: number) => {
    let s = 0;
    for (let i = end - len + 1; i <= end; i++) s += arr[i];
    return s;
  };
  const out: LinePoint[] = [];
  for (let i = p3 - 1; i < data.length; i++) {
    const a1 = avg(bp, i, p1) / avg(tr, i, p1);
    const a2 = avg(bp, i, p2) / avg(tr, i, p2);
    const a3 = avg(bp, i, p3) / avg(tr, i, p3);
    out.push({ time: data[i].time, value: 100 * ((4 * a1 + 2 * a2 + a3) / 7) });
  }
  return out;
}
