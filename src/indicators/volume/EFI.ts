import { Candle } from "../../types/indicators";
import { candleVolume, emaSeries, LinePoint } from "../lib/math";

export function calculateEFI(data: Candle[], period: number = 13): LinePoint[] {
  if (data.length < 2) return [];
  const force = data.map((d, i) =>
    i === 0 ? 0 : (d.close - data[i - 1].close) * candleVolume(d)
  );
  const ema = emaSeries(force, period);
  const out: LinePoint[] = [];
  for (let i = 0; i < data.length; i++) {
    if (ema[i] == null) continue;
    out.push({ time: data[i].time, value: ema[i] as number });
  }
  return out;
}
