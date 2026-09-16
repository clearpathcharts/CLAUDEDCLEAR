import { Candle } from "../../types/indicators";
import { emaSeries, rmaSeries, trueRangeAt } from "../lib/math";

export interface KeltnerOutput {
  time: number;
  middle: number;
  upper: number;
  lower: number;
}

export function calculateKeltner(
  data: Candle[],
  emaPeriod: number = 20,
  atrPeriod: number = 10,
  multiplier: number = 2
): KeltnerOutput[] {
  const closes = data.map((d) => d.close);
  const mid = emaSeries(closes, emaPeriod);
  const tr = data.map((_, i) => trueRangeAt(data, i));
  const atr = rmaSeries(tr, atrPeriod);
  const out: KeltnerOutput[] = [];
  for (let i = 0; i < data.length; i++) {
    if (mid[i] == null || atr[i] == null) continue;
    const m = mid[i] as number;
    const a = atr[i] as number;
    out.push({
      time: data[i].time,
      middle: m,
      upper: m + multiplier * a,
      lower: m - multiplier * a,
    });
  }
  return out;
}
