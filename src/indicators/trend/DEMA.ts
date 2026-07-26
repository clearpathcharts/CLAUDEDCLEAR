import { Candle } from "../../types/indicators";
import { emaSeries, lineFromSeries } from "../lib/math";

export function calculateDEMA(data: Candle[], period: number = 20) {
  const closes = data.map((d) => d.close);
  const e1 = emaSeries(closes, period);
  const e1Nums = e1.map((v) => (v == null ? 0 : v));
  const e2 = emaSeries(e1Nums, period);
  const dema = e1.map((v, i) => (v == null || e2[i] == null ? null : 2 * v - (e2[i] as number)));
  // Invalidate until both EMAs are ready
  for (let i = 0; i < Math.min(data.length, (period - 1) * 2); i++) dema[i] = null;
  return lineFromSeries(data, dema);
}
