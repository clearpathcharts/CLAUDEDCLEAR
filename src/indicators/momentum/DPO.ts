import { Candle } from '../../types/indicators';
import { DPO as quantumDPO } from '../quantum/core';
import { candleArrays, seriesToPoints } from '../quantum/adapters';

export function calculateDPO(data: Candle[], period = 20): { time: number; value: number }[] {
  const { times, closes } = candleArrays(data);
  return seriesToPoints(times, quantumDPO(closes, period));
}
