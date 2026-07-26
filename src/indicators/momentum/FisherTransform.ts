import { Candle } from "../../types/indicators";
import { midpoint } from "../lib/math";

export interface FisherOutput {
  time: number;
  fisher: number;
  trigger: number;
}

export function calculateFisherTransform(data: Candle[], period: number = 9): FisherOutput[] {
  if (data.length < period) return [];
  const out: FisherOutput[] = [];
  let prevFisher = 0;
  let prevValue = 0;

  for (let i = period - 1; i < data.length; i++) {
    let hh = -Infinity;
    let ll = Infinity;
    for (let j = i - period + 1; j <= i; j++) {
      const m = midpoint(data[j]);
      hh = Math.max(hh, m);
      ll = Math.min(ll, m);
    }
    const mid = midpoint(data[i]);
    let value = hh === ll ? 0 : 0.33 * 2 * ((mid - ll) / (hh - ll) - 0.5) + 0.67 * prevValue;
    value = Math.max(-0.999, Math.min(0.999, value));
    const fisher = 0.5 * Math.log((1 + value) / (1 - value)) + 0.5 * prevFisher;
    out.push({ time: data[i].time, fisher, trigger: prevFisher });
    prevFisher = fisher;
    prevValue = value;
  }
  return out;
}
