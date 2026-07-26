import { Candle } from "../../types/indicators";
import { lineFromSeries, wmaSeries } from "../lib/math";

export function calculateWMA(data: Candle[], period: number = 20) {
  return lineFromSeries(data, wmaSeries(data.map((d) => d.close), period));
}
