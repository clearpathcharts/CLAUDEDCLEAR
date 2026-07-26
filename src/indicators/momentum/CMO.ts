import { Candle } from "../../types/indicators";
import { LinePoint } from "../lib/math";

export function calculateCMO(data: Candle[], period: number = 14): LinePoint[] {
  if (data.length <= period) return [];
  const out: LinePoint[] = [];
  for (let i = period; i < data.length; i++) {
    let up = 0;
    let down = 0;
    for (let j = i - period + 1; j <= i; j++) {
      const diff = data[j].close - data[j - 1].close;
      if (diff > 0) up += diff;
      else down += -diff;
    }
    const sum = up + down;
    out.push({ time: data[i].time, value: sum === 0 ? 0 : ((up - down) / sum) * 100 });
  }
  return out;
}
