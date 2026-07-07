import { Candle } from '../../types/indicators';
import { getOssIndicators } from '../oss/client';
import { alignSeriesToTimes, candleArrays } from '../oss/adapters';

export function calculateUltimateOscillator(
  data: Candle[],
  period1 = 7,
  period2 = 14,
  period3 = 28,
): { time: number; value: number }[] {
  const { times, highs, lows, closes } = candleArrays(data);
  const values = getOssIndicators().ultosc(highs, lows, closes, period1, period2, period3);
  return alignSeriesToTimes(times, values);
}
