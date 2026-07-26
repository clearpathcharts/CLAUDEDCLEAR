import { Candle } from "../../types/indicators";
import { lineFromSeries, wmaSeries } from "../lib/math";

export function calculateHMA(data: Candle[], period: number = 20) {
  const closes = data.map((d) => d.close);
  const half = Math.max(1, Math.floor(period / 2));
  const sqrtP = Math.max(1, Math.floor(Math.sqrt(period)));
  const wmaHalf = wmaSeries(closes, half);
  const wmaFull = wmaSeries(closes, period);
  const raw = closes.map((_, i) => {
    if (wmaHalf[i] == null || wmaFull[i] == null) return null;
    return 2 * (wmaHalf[i] as number) - (wmaFull[i] as number);
  });
  // WMA of raw series — replace nulls carefully
  const rawNums = raw.map((v, i) => (v == null ? closes[i] : v));
  const hma = wmaSeries(rawNums, sqrtP);
  for (let i = 0; i < data.length; i++) {
    if (raw[i] == null) hma[i] = null;
  }
  return lineFromSeries(data, hma);
}
