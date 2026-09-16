import { Candle } from "../../types/indicators";
import { candleVolume, LinePoint, smaSeries } from "../lib/math";

export function calculateVolume(data: Candle[]): LinePoint[] {
  return data.map((d) => ({ time: d.time, value: candleVolume(d) }));
}

export function calculateNetVolume(data: Candle[]): LinePoint[] {
  return data.map((d) => ({
    time: d.time,
    value: d.close >= d.open ? candleVolume(d) : -candleVolume(d),
  }));
}

export function calculateVolumeOscillator(
  data: Candle[],
  fastPeriod: number = 5,
  slowPeriod: number = 10
): LinePoint[] {
  const vols = data.map(candleVolume);
  const fast = smaSeries(vols, fastPeriod);
  const slow = smaSeries(vols, slowPeriod);
  const out: LinePoint[] = [];
  for (let i = 0; i < data.length; i++) {
    if (fast[i] == null || slow[i] == null || slow[i] === 0) continue;
    out.push({
      time: data[i].time,
      value: (((fast[i] as number) - (slow[i] as number)) / (slow[i] as number)) * 100,
    });
  }
  return out;
}
