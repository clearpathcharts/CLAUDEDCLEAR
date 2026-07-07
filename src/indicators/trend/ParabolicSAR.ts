import { Candle } from '../../types/indicators';

export function calculateParabolicSAR(
  data: Candle[],
  step = 0.02,
  maxStep = 0.2,
): { time: number; value: number }[] {
  if (data.length < 2) return [];

  const results: { time: number; value: number }[] = [];
  let isLong = data[1].close >= data[0].close;
  let af = step;
  let ep = isLong ? data[0].high : data[0].low;
  let sar = isLong ? data[0].low : data[0].high;

  results.push({ time: data[0].time, value: sar });

  for (let i = 1; i < data.length; i++) {
    const c = data[i];
    sar = sar + af * (ep - sar);

    if (isLong) {
      if (c.low < sar) {
        isLong = false;
        sar = ep;
        ep = c.low;
        af = step;
      } else {
        if (c.high > ep) {
          ep = c.high;
          af = Math.min(af + step, maxStep);
        }
      }
    } else if (c.high > sar) {
      isLong = true;
      sar = ep;
      ep = c.high;
      af = step;
    } else {
      if (c.low < ep) {
        ep = c.low;
        af = Math.min(af + step, maxStep);
      }
    }

    results.push({ time: c.time, value: sar });
  }
  return results;
}
