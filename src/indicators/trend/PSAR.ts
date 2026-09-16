import { Candle } from "../../types/indicators";
import { LinePoint } from "../lib/math";

/** Parabolic SAR (Wilder). */
export function calculatePSAR(
  data: Candle[],
  step: number = 0.02,
  maxStep: number = 0.2
): LinePoint[] {
  if (data.length < 2) return [];
  const out: LinePoint[] = [];
  let bull = true;
  let af = step;
  let ep = data[0].high;
  let sar = data[0].low;

  out.push({ time: data[0].time, value: sar });

  for (let i = 1; i < data.length; i++) {
    const prevSar = sar;
    sar = prevSar + af * (ep - prevSar);

    if (bull) {
      sar = Math.min(sar, data[i - 1].low, i >= 2 ? data[i - 2].low : data[i - 1].low);
      if (data[i].low < sar) {
        bull = false;
        sar = ep;
        ep = data[i].low;
        af = step;
      } else {
        if (data[i].high > ep) {
          ep = data[i].high;
          af = Math.min(maxStep, af + step);
        }
      }
    } else {
      sar = Math.max(sar, data[i - 1].high, i >= 2 ? data[i - 2].high : data[i - 1].high);
      if (data[i].high > sar) {
        bull = true;
        sar = ep;
        ep = data[i].high;
        af = step;
      } else {
        if (data[i].low < ep) {
          ep = data[i].low;
          af = Math.min(maxStep, af + step);
        }
      }
    }
    out.push({ time: data[i].time, value: sar });
  }
  return out;
}
