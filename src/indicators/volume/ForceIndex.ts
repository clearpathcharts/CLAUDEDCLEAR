import { Candle } from '../../types/indicators';
import { getOssIndicators } from '../oss/client';
import { alignSeriesToTimes, candleArrays } from '../oss/adapters';

export function calculateForceIndex(data: Candle[], period = 13): { time: number; value: number }[] {
  const { times, closes, volumes } = candleArrays(data);
  const values = getOssIndicators().fi(closes, volumes, period);
  return alignSeriesToTimes(times, values);
}
