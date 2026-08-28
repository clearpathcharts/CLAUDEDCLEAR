import type { Candle } from '../../types/indicators';
import { calculateATR } from '../../indicators/volatility/ATR';

export function pearsonCorrelation(a: number[], b: number[]): number | null {
  const n = Math.min(a.length, b.length);
  if (n < 8) return null;
  const ax = a.slice(a.length - n);
  const bx = b.slice(b.length - n);
  const ma = ax.reduce((s, v) => s + v, 0) / n;
  const mb = bx.reduce((s, v) => s + v, 0) / n;
  let num = 0;
  let da = 0;
  let db = 0;
  for (let i = 0; i < n; i++) {
    const x = ax[i] - ma;
    const y = bx[i] - mb;
    num += x * y;
    da += x * x;
    db += y * y;
  }
  const den = Math.sqrt(da * db);
  if (!Number.isFinite(den) || den === 0) return null;
  const r = num / den;
  if (!Number.isFinite(r)) return null;
  return Math.max(-1, Math.min(1, r));
}

export function closeSeries(candles: Candle[]): number[] {
  return candles.map((c) => c.close).filter((v) => Number.isFinite(v));
}

export function realizedVolPct(candles: Candle[], lookback = 20): number | null {
  if (candles.length < lookback + 1) return null;
  const slice = candles.slice(-lookback - 1);
  const rets: number[] = [];
  for (let i = 1; i < slice.length; i++) {
    const prev = slice[i - 1].close;
    if (prev === 0) continue;
    rets.push(Math.log(slice[i].close / prev));
  }
  if (rets.length < 8) return null;
  const mean = rets.reduce((s, v) => s + v, 0) / rets.length;
  const var_ = rets.reduce((s, v) => s + (v - mean) ** 2, 0) / rets.length;
  const daily = Math.sqrt(var_);
  if (!Number.isFinite(daily)) return null;
  return daily * Math.sqrt(252) * 100;
}

export function atrValue(candles: Candle[], period = 14): number | null {
  if (candles.length < period + 2) return null;
  const series = calculateATR(candles, period);
  const last = series[series.length - 1];
  return last && Number.isFinite(last.value) ? last.value : null;
}

export function maxDrawdownPct(candles: Candle[]): number | null {
  if (candles.length < 8) return null;
  let peak = candles[0].close;
  let maxDd = 0;
  for (const c of candles) {
    peak = Math.max(peak, c.close);
    if (peak <= 0) continue;
    maxDd = Math.max(maxDd, (peak - c.close) / peak);
  }
  return maxDd * 100;
}

export function expectedRangeFromAtr(atr: number | null): number | null {
  return atr != null && Number.isFinite(atr) ? atr : null;
}

export type TapePrint = {
  time: string;
  price: number;
  size: number;
  side: 'BUY-SIDE' | 'SELL-SIDE' | 'UNCLASSIFIED';
  reconstructed: true;
};

/** Bar-level reconstruction from OHLC+volume — not a live tape. */
export function reconstructBarTape(candles: Candle[], limit = 40): TapePrint[] {
  const out: TapePrint[] = [];
  for (const c of candles.slice(-limit).reverse()) {
    const range = c.high - c.low;
    const vol = typeof c.volume === 'number' && c.volume > 0 ? c.volume : Math.max(0, range);
    let side: TapePrint['side'] = 'UNCLASSIFIED';
    if (range > 0) {
      const loc = (c.close - c.low) / range;
      side = loc >= 0.5 ? 'BUY-SIDE' : 'SELL-SIDE';
    }
    const ms = c.time < 1e12 ? c.time * 1000 : c.time;
    const t = new Date(ms);
    const hh = Number.isFinite(t.getTime())
      ? t.toISOString().slice(11, 19)
      : '—';
    out.push({
      time: hh,
      price: c.close,
      size: vol,
      side,
      reconstructed: true,
    });
  }
  return out;
}

export function scenarioPrices(last: number | null): { pct: number; price: number }[] | null {
  if (last == null || !Number.isFinite(last) || last <= 0) return null;
  return [-5, -10, -20].map((pct) => ({ pct, price: last * (1 + pct / 100) }));
}
