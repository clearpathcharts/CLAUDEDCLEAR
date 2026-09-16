// Builtin math helpers for RIR runtime (Pine ta.* / math.* family).

export function nz(value: number, fallback: number): number {
  return Number.isNaN(value) ? fallback : value;
}

export function crossover(aNow: number, bNow: number, aPrev: number, bPrev: number): number {
  if (Number.isNaN(aNow) || Number.isNaN(bNow) || Number.isNaN(aPrev) || Number.isNaN(bPrev)) return 0;
  return aPrev <= bPrev && aNow > bNow ? 1 : 0;
}

export function crossunder(aNow: number, bNow: number, aPrev: number, bPrev: number): number {
  if (Number.isNaN(aNow) || Number.isNaN(bNow) || Number.isNaN(aPrev) || Number.isNaN(bPrev)) return 0;
  return aPrev >= bPrev && aNow < bNow ? 1 : 0;
}

export function emaAtBar(values: number[], bar: number, period: number): number {
  if (bar < 0 || bar >= values.length) return NaN;
  if (period <= 1) return values[bar];
  const alpha = 2 / (period + 1);
  let ema = values[0];
  for (let i = 1; i <= bar; i++) {
    const v = values[i];
    if (Number.isNaN(v)) continue;
    ema = Number.isNaN(ema) ? v : alpha * v + (1 - alpha) * ema;
  }
  return ema;
}

export function toHeikinAshiCloses(candles: { open: number; high: number; low: number; close: number }[]): number[] {
  const closes: number[] = [];
  let prevHaOpen = candles[0]?.open ?? 0;
  let prevHaClose = candles[0]?.close ?? 0;

  for (let i = 0; i < candles.length; i++) {
    const c = candles[i];
    const haClose = (c.open + c.high + c.low + c.close) / 4;
    const haOpen = i === 0 ? (c.open + c.close) / 2 : (prevHaOpen + prevHaClose) / 2;
    closes.push(haClose);
    prevHaOpen = haOpen;
    prevHaClose = haClose;
  }
  return closes;
}
