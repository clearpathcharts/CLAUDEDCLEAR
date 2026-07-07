import { Candle } from '../../types/indicators';

export function calculateCMF(data: Candle[], period = 20): { time: number; value: number }[] {
  if (data.length < period) return [];

  const results: { time: number; value: number }[] = [];
  for (let i = period - 1; i < data.length; i++) {
    const slice = data.slice(i - period + 1, i + 1);
    let sumMfv = 0;
    let sumVol = 0;
    for (const c of slice) {
      const vol = c.volume ?? 1;
      const range = c.high - c.low;
      const mfm = range === 0 ? 0 : ((c.close - c.low) - (c.high - c.close)) / range;
      sumMfv += mfm * vol;
      sumVol += vol;
    }
    results.push({ time: data[i].time, value: sumVol === 0 ? 0 : sumMfv / sumVol });
  }
  return results;
}
