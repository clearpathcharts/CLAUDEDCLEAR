import { Candle } from "../../types/indicators";
import { LinePoint, wmaSeries } from "../lib/math";
import { calculateROC } from "./ROC";

export function calculateCoppock(
  data: Candle[],
  roc1: number = 14,
  roc2: number = 11,
  wmaPeriod: number = 10
): LinePoint[] {
  const a = calculateROC(data, roc1);
  const b = calculateROC(data, roc2);
  const mapA = new Map(a.map((p) => [p.time, p.value]));
  const mapB = new Map(b.map((p) => [p.time, p.value]));
  const sum = data.map((d) => {
    const va = mapA.get(d.time);
    const vb = mapB.get(d.time);
    if (va == null || vb == null) return null;
    return va + vb;
  });
  const wma = wmaSeries(sum.map((v) => v ?? 0), wmaPeriod);
  for (let i = 0; i < data.length; i++) if (sum[i] == null) wma[i] = null;
  const out: LinePoint[] = [];
  for (let i = 0; i < data.length; i++) {
    if (wma[i] == null) continue;
    out.push({ time: data[i].time, value: wma[i] as number });
  }
  return out;
}
