import { Candle } from "../../types/indicators";
import { LinePoint, smaSeries } from "../lib/math";

export function calculateDPO(data: Candle[], period: number = 20): LinePoint[] {
  const closes = data.map((d) => d.close);
  const sma = smaSeries(closes, period);
  const shift = Math.floor(period / 2) + 1;
  const out: LinePoint[] = [];
  for (let i = 0; i < data.length; i++) {
    const smaIdx = i + shift;
    if (smaIdx >= data.length || sma[smaIdx] == null) continue;
    out.push({ time: data[i].time, value: data[i].close - (sma[smaIdx] as number) });
  }
  return out;
}
