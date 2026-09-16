import { Candle } from "../../types/indicators";

export interface DonchianOutput {
  time: number;
  upper: number;
  middle: number;
  lower: number;
}

export function calculateDonchian(data: Candle[], period: number = 20): DonchianOutput[] {
  if (data.length < period) return [];
  const out: DonchianOutput[] = [];
  for (let i = period - 1; i < data.length; i++) {
    let hh = -Infinity;
    let ll = Infinity;
    for (let j = i - period + 1; j <= i; j++) {
      hh = Math.max(hh, data[j].high);
      ll = Math.min(ll, data[j].low);
    }
    out.push({ time: data[i].time, upper: hh, middle: (hh + ll) / 2, lower: ll });
  }
  return out;
}
