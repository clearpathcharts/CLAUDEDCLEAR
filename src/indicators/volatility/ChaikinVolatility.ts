import { Candle } from "../../types/indicators";
import { emaSeries, LinePoint } from "../lib/math";

export function calculateChaikinVolatility(
  data: Candle[],
  emaPeriod: number = 10,
  rocPeriod: number = 10
): LinePoint[] {
  const hl = data.map((d) => d.high - d.low);
  const ema = emaSeries(hl, emaPeriod);
  const out: LinePoint[] = [];
  for (let i = rocPeriod; i < data.length; i++) {
    if (ema[i] == null || ema[i - rocPeriod] == null || ema[i - rocPeriod] === 0) continue;
    out.push({
      time: data[i].time,
      value: (((ema[i] as number) - (ema[i - rocPeriod] as number)) / (ema[i - rocPeriod] as number)) * 100,
    });
  }
  return out;
}
