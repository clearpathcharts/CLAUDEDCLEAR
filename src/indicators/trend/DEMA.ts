import { Candle } from '../../types/indicators';
import { getOssIndicators } from '../oss/client';
import { alignSeriesToTimes, candleArrays } from '../oss/adapters';

export function calculateDEMA(data: Candle[], period = 20): { time: number; value: number }[] {
  const { times, closes } = candleArrays(data);
  const values = getOssIndicators().dema(closes, period);
  return alignSeriesToTimes(times, values);
}
