import { Candle } from '../../types/indicators';
import { PivotsClassic } from '../quantum/core';

export interface PivotPointsOutput {
  time: number;
  P: number;
  R1: number;
  S1: number;
  R2: number;
  S2: number;
}

/**
 * Classic pivot levels from prior session H/L/C.
 * lookback = bars per session (24 ≈ prior day on 1H).
 */
export function calculatePivotPoints(data: Candle[], lookback = 24): PivotPointsOutput[] {
  if (data.length <= lookback) return [];

  const results: PivotPointsOutput[] = [];
  let active: Omit<PivotPointsOutput, 'time'> | null = null;

  for (let i = lookback; i < data.length; i++) {
    const offset = i - lookback;
    if (offset % lookback === 0) {
      const slice = data.slice(i - lookback, i);
      const high = Math.max(...slice.map((c) => c.high));
      const low = Math.min(...slice.map((c) => c.low));
      const close = slice[slice.length - 1].close;
      const p = PivotsClassic(high, low, close);
      active = { P: p.P, R1: p.R1, S1: p.S1, R2: p.R2, S2: p.S2 };
    }

    if (active) {
      results.push({ time: data[i].time, ...active });
    }
  }

  return results;
}
