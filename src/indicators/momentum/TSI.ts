import { Candle } from "../../types/indicators";
import { emaSeries, LinePoint } from "../lib/math";

export function calculateTSI(
  data: Candle[],
  longPeriod: number = 25,
  shortPeriod: number = 13,
  signalPeriod: number = 13
): { time: number; tsi: number; signal: number }[] {
  if (data.length < 2) return [];
  const mom = data.map((d, i) => (i === 0 ? 0 : d.close - data[i - 1].close));
  const absMom = mom.map(Math.abs);
  const ema1 = emaSeries(mom, longPeriod);
  const ema2 = emaSeries(ema1.map((v) => v ?? 0), shortPeriod);
  const abs1 = emaSeries(absMom, longPeriod);
  const abs2 = emaSeries(abs1.map((v) => v ?? 0), shortPeriod);
  const tsiLine: (number | null)[] = ema2.map((v, i) => {
    if (v == null || abs2[i] == null || abs2[i] === 0) return null;
    return 100 * (v / (abs2[i] as number));
  });
  const compact: number[] = [];
  const map: number[] = [];
  for (let i = 0; i < tsiLine.length; i++) {
    if (tsiLine[i] != null) {
      compact.push(tsiLine[i] as number);
      map.push(i);
    }
  }
  const sig = emaSeries(compact, signalPeriod);
  const out: { time: number; tsi: number; signal: number }[] = [];
  for (let j = 0; j < sig.length; j++) {
    if (sig[j] == null) continue;
    const i = map[j];
    out.push({ time: data[i].time, tsi: tsiLine[i] as number, signal: sig[j] as number });
  }
  return out;
}

export function calculateTSILine(data: Candle[], longPeriod = 25, shortPeriod = 13): LinePoint[] {
  return calculateTSI(data, longPeriod, shortPeriod).map((d) => ({ time: d.time, value: d.tsi }));
}
