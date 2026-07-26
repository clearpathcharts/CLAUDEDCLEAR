import { Candle } from "../../types/indicators";
import { emaSeries, LinePoint } from "../lib/math";

export function calculateTRIX(data: Candle[], period: number = 15): LinePoint[] {
  const closes = data.map((d) => d.close);
  const e1 = emaSeries(closes, period);
  const e2 = emaSeries(e1.map((v) => v ?? 0), period);
  const e3 = emaSeries(e2.map((v) => v ?? 0), period);
  for (let i = 0; i < data.length; i++) {
    if (e1[i] == null) e2[i] = null;
    if (e2[i] == null) e3[i] = null;
  }
  const out: LinePoint[] = [];
  for (let i = 1; i < data.length; i++) {
    if (e3[i] == null || e3[i - 1] == null || e3[i - 1] === 0) continue;
    out.push({
      time: data[i].time,
      value: (((e3[i] as number) - (e3[i - 1] as number)) / (e3[i - 1] as number)) * 100,
    });
  }
  return out;
}
