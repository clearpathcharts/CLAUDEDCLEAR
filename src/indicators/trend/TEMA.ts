import { Candle } from "../../types/indicators";
import { emaSeries, lineFromSeries } from "../lib/math";

export function calculateTEMA(data: Candle[], period: number = 20) {
  const closes = data.map((d) => d.close);
  const e1 = emaSeries(closes, period);
  const e1n = e1.map((v) => v ?? 0);
  const e2 = emaSeries(e1n, period);
  const e2n = e2.map((v) => v ?? 0);
  const e3 = emaSeries(e2n, period);
  const tema = e1.map((v, i) => {
    if (v == null || e2[i] == null || e3[i] == null) return null;
    return 3 * v - 3 * (e2[i] as number) + (e3[i] as number);
  });
  for (let i = 0; i < Math.min(data.length, (period - 1) * 3); i++) tema[i] = null;
  return lineFromSeries(data, tema);
}
