import { Candle } from "../../types/indicators";
import { LinePoint } from "../lib/math";

export function calculateROC(data: Candle[], period: number = 12): LinePoint[] {
  const out: LinePoint[] = [];
  for (let i = period; i < data.length; i++) {
    const prev = data[i - period].close;
    if (prev === 0) continue;
    out.push({ time: data[i].time, value: ((data[i].close - prev) / prev) * 100 });
  }
  return out;
}
