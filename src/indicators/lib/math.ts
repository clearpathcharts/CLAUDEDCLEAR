import { Candle } from "../../types/indicators";

export type LinePoint = { time: number; value: number };

export function candleVolume(c: Candle): number {
  return typeof c.volume === "number" && Number.isFinite(c.volume) ? c.volume : 0;
}

export function typicalPrice(c: Candle): number {
  return (c.high + c.low + c.close) / 3;
}

export function midpoint(c: Candle): number {
  return (c.high + c.low) / 2;
}

/** Rolling SMA of a number series; null until full window. */
export function smaSeries(values: number[], period: number): (number | null)[] {
  const out: (number | null)[] = new Array(values.length).fill(null);
  if (period < 1 || values.length < period) return out;
  let sum = 0;
  for (let i = 0; i < values.length; i++) {
    sum += values[i];
    if (i >= period) sum -= values[i - period];
    if (i >= period - 1) out[i] = sum / period;
  }
  return out;
}

/** EMA seeded with SMA of first `period` values. */
export function emaSeries(values: number[], period: number): (number | null)[] {
  const out: (number | null)[] = new Array(values.length).fill(null);
  if (period < 1 || values.length < period) return out;
  let seed = 0;
  for (let i = 0; i < period; i++) seed += values[i];
  let ema = seed / period;
  out[period - 1] = ema;
  const k = 2 / (period + 1);
  for (let i = period; i < values.length; i++) {
    ema = values[i] * k + ema * (1 - k);
    out[i] = ema;
  }
  return out;
}

/** Wilder / RMA smoothing. */
export function rmaSeries(values: number[], period: number): (number | null)[] {
  const out: (number | null)[] = new Array(values.length).fill(null);
  if (period < 1 || values.length < period) return out;
  let sum = 0;
  for (let i = 0; i < period; i++) sum += values[i];
  let rma = sum / period;
  out[period - 1] = rma;
  for (let i = period; i < values.length; i++) {
    rma = (rma * (period - 1) + values[i]) / period;
    out[i] = rma;
  }
  return out;
}

export function wmaSeries(values: number[], period: number): (number | null)[] {
  const out: (number | null)[] = new Array(values.length).fill(null);
  if (period < 1 || values.length < period) return out;
  const denom = (period * (period + 1)) / 2;
  for (let i = period - 1; i < values.length; i++) {
    let sum = 0;
    for (let j = 0; j < period; j++) {
      sum += values[i - period + 1 + j] * (j + 1);
    }
    out[i] = sum / denom;
  }
  return out;
}

export function lineFromSeries(data: Candle[], series: (number | null)[]): LinePoint[] {
  const out: LinePoint[] = [];
  for (let i = 0; i < data.length; i++) {
    const v = series[i];
    if (v != null && Number.isFinite(v)) out.push({ time: data[i].time, value: v });
  }
  return out;
}

export function trueRangeAt(data: Candle[], i: number): number {
  if (i === 0) return data[0].high - data[0].low;
  return Math.max(
    data[i].high - data[i].low,
    Math.abs(data[i].high - data[i - 1].close),
    Math.abs(data[i].low - data[i - 1].close)
  );
}
