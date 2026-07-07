import { Candle } from '../../types/indicators';
import { calculateATR } from '../volatility/ATR';

export function calculateSupertrend(
  data: Candle[],
  period = 10,
  multiplier = 3,
): { time: number; value: number }[] {
  if (data.length < period + 1) return [];

  const atrSeries = calculateATR(data, period);
  const atrByTime = new Map(atrSeries.map((a) => [a.time, a.value]));

  const results: { time: number; value: number }[] = [];
  let finalUpper = 0;
  let finalLower = 0;
  let supertrend = 0;
  let started = false;

  for (let i = 0; i < data.length; i++) {
    const c = data[i];
    const atr = atrByTime.get(c.time);
    if (atr === undefined) continue;

    const hl2 = (c.high + c.low) / 2;
    const basicUpper = hl2 + multiplier * atr;
    const basicLower = hl2 - multiplier * atr;
    const prevClose = i > 0 ? data[i - 1].close : c.close;

    if (!started) {
      finalUpper = basicUpper;
      finalLower = basicLower;
      supertrend = basicUpper;
      started = true;
      results.push({ time: c.time, value: supertrend });
      continue;
    }

    finalUpper = basicUpper < finalUpper || prevClose > finalUpper ? basicUpper : finalUpper;
    finalLower = basicLower > finalLower || prevClose < finalLower ? basicLower : finalLower;

    const prevSt = supertrend;
    if (prevSt === finalUpper) {
      supertrend = c.close > finalUpper ? finalLower : finalUpper;
    } else {
      supertrend = c.close < finalLower ? finalUpper : finalLower;
    }

    results.push({ time: c.time, value: supertrend });
  }

  return results;
}
