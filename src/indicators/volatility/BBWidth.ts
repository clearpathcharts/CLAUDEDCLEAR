import { Candle } from "../../types/indicators";
import { LinePoint } from "../lib/math";
import { calculateBollingerBands } from "./BollingerBands";

export function calculateBBWidth(
  data: Candle[],
  period: number = 20,
  multiplier: number = 2
): LinePoint[] {
  return calculateBollingerBands(data, period, multiplier).map((d) => ({
    time: d.time,
    value: d.basis === 0 ? 0 : ((d.upper - d.lower) / d.basis) * 100,
  }));
}
