import { Candle } from '../../types/indicators';
import { getOssIndicators } from '../oss/client';
import { alignDualSeriesToTimes, candleArrays } from '../oss/adapters';

export function calculateAroon(
  data: Candle[],
  period = 14,
): { time: number; down: number; up: number }[] {
  const { times, highs, lows } = candleArrays(data);
  const [down, up] = getOssIndicators().aroon(highs, lows, period);
  return alignDualSeriesToTimes(times, down, up).map(({ time, a, b }) => ({
    time,
    down: a,
    up: b,
  }));
}
