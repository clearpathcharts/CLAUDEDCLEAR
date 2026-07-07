import { Candle } from '../../types/indicators';
import { TRIX as quantumTRIX } from '../quantum/core';
import { candleArrays, seriesToPoints } from '../quantum/adapters';

export function calculateTRIX(data: Candle[], period = 14): { time: number; value: number }[] {
  const { times, closes } = candleArrays(data);
  return seriesToPoints(times, quantumTRIX(closes, period));
}
