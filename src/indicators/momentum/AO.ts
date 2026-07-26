import { Candle } from "../../types/indicators";
import { LinePoint, midpoint, smaSeries } from "../lib/math";

export function calculateAO(data: Candle[], fastPeriod: number = 5, slowPeriod: number = 34): LinePoint[] {
  const mids = data.map(midpoint);
  const fast = smaSeries(mids, fastPeriod);
  const slow = smaSeries(mids, slowPeriod);
  const out: LinePoint[] = [];
  for (let i = 0; i < data.length; i++) {
    if (fast[i] == null || slow[i] == null) continue;
    out.push({ time: data[i].time, value: (fast[i] as number) - (slow[i] as number) });
  }
  return out;
}
