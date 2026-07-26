import { Candle } from "../../types/indicators";
import { LinePoint } from "../lib/math";

export function calculateWilliamsR(data: Candle[], period: number = 14): LinePoint[] {
  if (data.length < period) return [];
  const out: LinePoint[] = [];
  for (let i = period - 1; i < data.length; i++) {
    let hh = -Infinity;
    let ll = Infinity;
    for (let j = i - period + 1; j <= i; j++) {
      hh = Math.max(hh, data[j].high);
      ll = Math.min(ll, data[j].low);
    }
    const range = hh - ll;
    out.push({
      time: data[i].time,
      value: range === 0 ? -50 : ((hh - data[i].close) / range) * -100,
    });
  }
  return out;
}
