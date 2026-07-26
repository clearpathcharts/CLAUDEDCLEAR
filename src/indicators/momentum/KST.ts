import { Candle } from "../../types/indicators";
import { LinePoint, smaSeries } from "../lib/math";
import { calculateROC } from "./ROC";

export interface KSTOutput {
  time: number;
  kst: number;
  signal: number;
}

export function calculateKST(data: Candle[]): KSTOutput[] {
  const roc = (period: number) => {
    const pts = calculateROC(data, period);
    const map = new Map(pts.map((p) => [p.time, p.value]));
    return data.map((d) => map.get(d.time) ?? null);
  };
  const r1 = roc(10);
  const r2 = roc(15);
  const r3 = roc(20);
  const r4 = roc(30);
  const s1 = smaSeries(r1.map((v) => v ?? 0), 10);
  const s2 = smaSeries(r2.map((v) => v ?? 0), 10);
  const s3 = smaSeries(r3.map((v) => v ?? 0), 10);
  const s4 = smaSeries(r4.map((v) => v ?? 0), 15);
  for (let i = 0; i < data.length; i++) {
    if (r1[i] == null) s1[i] = null;
    if (r2[i] == null) s2[i] = null;
    if (r3[i] == null) s3[i] = null;
    if (r4[i] == null) s4[i] = null;
  }
  const kst: (number | null)[] = data.map((_, i) => {
    if (s1[i] == null || s2[i] == null || s3[i] == null || s4[i] == null) return null;
    return (s1[i] as number) + 2 * (s2[i] as number) + 3 * (s3[i] as number) + 4 * (s4[i] as number);
  });
  const sig = smaSeries(kst.map((v) => v ?? 0), 9);
  for (let i = 0; i < data.length; i++) if (kst[i] == null) sig[i] = null;
  const out: KSTOutput[] = [];
  for (let i = 0; i < data.length; i++) {
    if (kst[i] == null || sig[i] == null) continue;
    out.push({ time: data[i].time, kst: kst[i] as number, signal: sig[i] as number });
  }
  return out;
}

export function calculateKSTLine(data: Candle[]): LinePoint[] {
  return calculateKST(data).map((d) => ({ time: d.time, value: d.kst }));
}
