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

/** Right-align a shorter OSS series to candle timestamps. */
export function alignSeriesToTimes(
  times: number[],
  values: number[],
): { time: number; value: number }[] {
  const out: { time: number; value: number }[] = [];
  const offset = times.length - values.length;
  for (let i = 0; i < values.length; i++) {
    const v = values[i];
    if (Number.isFinite(v)) out.push({ time: times[offset + i], value: v });
  }
  return out;
}

export function alignDualSeriesToTimes(
  times: number[],
  a: number[],
  b: number[],
): { time: number; a: number; b: number }[] {
  const out: { time: number; a: number; b: number }[] = [];
  const offset = times.length - a.length;
  for (let i = 0; i < a.length; i++) {
    const va = a[i];
    const vb = b[i];
    if (Number.isFinite(va) && Number.isFinite(vb)) {
      out.push({ time: times[offset + i], a: va, b: vb });
    }
  }
  return out;
}

export function alignTripleSeriesToTimes(
  times: number[],
  a: number[],
  b: number[],
  c: number[],
): { time: number; a: number; b: number; c: number }[] {
  const out: { time: number; a: number; b: number; c: number }[] = [];
  const offset = times.length - a.length;
  for (let i = 0; i < a.length; i++) {
    const va = a[i];
    const vb = b[i];
    const vc = c[i];
    if (Number.isFinite(va) && Number.isFinite(vb) && Number.isFinite(vc)) {
      out.push({ time: times[offset + i], a: va, b: vb, c: vc });
    }
  }
  return out;
}
