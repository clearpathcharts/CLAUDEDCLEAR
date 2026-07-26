import { Candle } from "../../types/indicators";
import { rmaSeries, trueRangeAt } from "../lib/math";

export interface SupertrendOutput {
  time: number;
  value: number;
  direction: 1 | -1;
}

export function calculateSupertrend(
  data: Candle[],
  atrPeriod: number = 10,
  multiplier: number = 3
): SupertrendOutput[] {
  if (data.length < atrPeriod + 1) return [];
  const tr = data.map((_, i) => trueRangeAt(data, i));
  const atr = rmaSeries(tr, atrPeriod);
  const out: SupertrendOutput[] = [];
  let direction: 1 | -1 = 1;
  let finalUpper = 0;
  let finalLower = 0;

  for (let i = 0; i < data.length; i++) {
    if (atr[i] == null) continue;
    const hl2 = (data[i].high + data[i].low) / 2;
    const basicUpper = hl2 + multiplier * (atr[i] as number);
    const basicLower = hl2 - multiplier * (atr[i] as number);

    if (out.length === 0) {
      finalUpper = basicUpper;
      finalLower = basicLower;
      direction = data[i].close >= hl2 ? 1 : -1;
    } else {
      finalUpper =
        basicUpper < finalUpper || data[i - 1].close > finalUpper ? basicUpper : finalUpper;
      finalLower =
        basicLower > finalLower || data[i - 1].close < finalLower ? basicLower : finalLower;
      if (direction === 1 && data[i].close < finalLower) direction = -1;
      else if (direction === -1 && data[i].close > finalUpper) direction = 1;
    }

    out.push({
      time: data[i].time,
      value: direction === 1 ? finalLower : finalUpper,
      direction,
    });
  }
  return out;
}
