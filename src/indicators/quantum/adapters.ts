import { Candle } from '../../types/indicators';

export function candleArrays(data: Candle[]) {
  return {
    times: data.map((c) => c.time),
    highs: data.map((c) => c.high),
    lows: data.map((c) => c.low),
    closes: data.map((c) => c.close),
    volumes: data.map((c) => c.volume ?? 0),
  };
}

export function seriesToPoints(
  times: number[],
  values: number[],
): { time: number; value: number }[] {
  const out: { time: number; value: number }[] = [];
  for (let i = 0; i < values.length; i++) {
    const v = values[i];
    if (Number.isFinite(v)) out.push({ time: times[i], value: v });
  }
  return out;
}

export function seriesToNamedPoints<T extends Record<string, number>>(
  times: number[],
  rows: T[],
  keys: (keyof T)[],
): Record<string, { time: number; value: number }[]> {
  const result: Record<string, { time: number; value: number }[]> = {};
  for (const key of keys) result[String(key)] = [];
  for (let i = 0; i < rows.length; i++) {
    const t = times[i];
    for (const key of keys) {
      const v = rows[i][key];
      if (Number.isFinite(v)) result[String(key)].push({ time: t, value: v as number });
    }
  }
  return result;
}
