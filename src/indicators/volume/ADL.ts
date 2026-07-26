import { Candle } from "../../types/indicators";
import { candleVolume, LinePoint } from "../lib/math";

/** Accumulation / Distribution Line. */
export function calculateADL(data: Candle[]): LinePoint[] {
  let adl = 0;
  return data.map((d) => {
    const range = d.high - d.low;
    const mfm = range === 0 ? 0 : ((d.close - d.low) - (d.high - d.close)) / range;
    adl += mfm * candleVolume(d);
    return { time: d.time, value: adl };
  });
}
