/**
 * Quantum Charts — Indicator Core (adapted for ClearPath)
 * Array-based math, NaN lead-in for safe plotting.
 */

export const N = Number.NaN;
export const nz = (v: number, d = 0) => (Number.isFinite(v) ? v : d);

export function rolling<T>(
  len: number,
  src: T[],
  fn: (win: T[], i: number) => number,
): number[] {
  const out = Array(src.length).fill(N);
  const buf: T[] = [];
  for (let i = 0; i < src.length; i++) {
    buf.push(src[i]);
    if (buf.length > len) buf.shift();
    if (buf.length === len) out[i] = fn(buf, i);
  }
  return out;
}

export function smaArr(values: number[], len: number): number[] {
  const out: number[] = [];
  let sum = 0;
  for (let i = 0; i < values.length; i++) {
    sum += values[i];
    if (i >= len) sum -= values[i - len];
    out.push(i >= len - 1 ? sum / len : N);
  }
  return out;
}

export function SMA(values: number[], len: number): number[] {
  return smaArr(values, len);
}

export function EMA(values: number[], len: number): number[] {
  const out: number[] = [];
  if (!values.length) return out;
  const k = 2 / (len + 1);
  let ema = values[0];
  for (let i = 0; i < values.length; i++) {
    ema = i === 0 ? values[0] : values[i] * k + ema * (1 - k);
    out.push(i >= len - 1 ? ema : N);
  }
  return out;
}

export function WMA(values: number[], len: number): number[] {
  const denom = (len * (len + 1)) / 2;
  return rolling(len, values, (win) => {
    let num = 0;
    for (let i = 0; i < len; i++) num += win[i] * (i + 1);
    return num / denom;
  });
}

export function HMA(values: number[], len: number): number[] {
  const wmaHalf = WMA(values, Math.max(1, Math.floor(len / 2)));
  const wmaFull = WMA(values, len);
  const diff = values.map((_, i) => {
    const a = wmaHalf[i];
    const b = wmaFull[i];
    return Number.isFinite(a) && Number.isFinite(b) ? 2 * a - b : N;
  });
  return WMA(diff, Math.max(1, Math.round(Math.sqrt(len))));
}

export function RSI(closes: number[], len = 14): number[] {
  const out: number[] = Array(closes.length).fill(N);
  let gain = 0;
  let loss = 0;
  for (let i = 1; i < closes.length; i++) {
    const ch = closes[i] - closes[i - 1];
    const up = Math.max(ch, 0);
    const dn = Math.max(-ch, 0);
    if (i <= len) {
      gain += up;
      loss += dn;
      continue;
    }
    gain = (gain * (len - 1) + up) / len;
    loss = (loss * (len - 1) + dn) / len;
    const rs = loss === 0 ? 1e9 : gain / loss;
    out[i] = 100 - 100 / (1 + rs);
  }
  return out;
}

export function MACD(
  closes: number[],
  fast = 12,
  slow = 26,
  signalLen = 9,
): { macd: number[]; signal: number[]; hist: number[] } {
  const emaF = EMA(closes, fast);
  const emaS = EMA(closes, slow);
  const macd = closes.map((_, i) =>
    Number.isFinite(emaF[i]) && Number.isFinite(emaS[i]) ? emaF[i] - emaS[i] : N,
  );
  const signal = EMA(macd.map((v) => nz(v, 0)), signalLen);
  const hist = macd.map((v, i) =>
    Number.isFinite(v) && Number.isFinite(signal[i]) ? v - signal[i] : N,
  );
  return { macd, signal, hist };
}

export function Bollinger(
  closes: number[],
  len = 20,
  mult = 2,
): { mid: number[]; upper: number[]; lower: number[] } {
  const mid = SMA(closes, len);
  const outU: number[] = Array(closes.length).fill(N);
  const outL: number[] = Array(closes.length).fill(N);
  let sum = 0;
  let sumSq = 0;
  for (let i = 0; i < closes.length; i++) {
    const x = closes[i];
    sum += x;
    sumSq += x * x;
    if (i >= len) {
      const xp = closes[i - len];
      sum -= xp;
      sumSq -= xp * xp;
    }
    if (i >= len - 1) {
      const mean = sum / len;
      const variance = sumSq / len - mean * mean;
      const stdev = Math.sqrt(Math.max(variance, 0));
      outU[i] = mean + mult * stdev;
      outL[i] = mean - mult * stdev;
    }
  }
  return { mid, upper: outU, lower: outL };
}

export function Stochastic(
  highs: number[],
  lows: number[],
  closes: number[],
  kLen = 14,
  dLen = 3,
): { k: number[]; d: number[] } {
  const k: number[] = Array(closes.length).fill(N);
  for (let i = 0; i < closes.length; i++) {
    const s = Math.max(0, i - kLen + 1);
    const hh = Math.max(...highs.slice(s, i + 1));
    const ll = Math.min(...lows.slice(s, i + 1));
    k[i] = hh === ll ? 50 : ((closes[i] - ll) / (hh - ll)) * 100;
  }
  const d = SMA(k.map((v) => nz(v, 50)), dLen);
  return { k, d };
}

export function ATR(highs: number[], lows: number[], closes: number[], len = 14): number[] {
  const tr: number[] = [];
  for (let i = 0; i < closes.length; i++) {
    if (i === 0) {
      tr.push(highs[i] - lows[i]);
      continue;
    }
    tr.push(
      Math.max(
        highs[i] - lows[i],
        Math.abs(highs[i] - closes[i - 1]),
        Math.abs(lows[i] - closes[i - 1]),
      ),
    );
  }
  return EMA(tr, len);
}

export function ADX(
  highs: number[],
  lows: number[],
  closes: number[],
  len = 14,
): { adx: number[]; dip: number[]; dim: number[] } {
  const dmPlus: number[] = [N];
  const dmMinus: number[] = [N];
  for (let i = 1; i < highs.length; i++) {
    const up = highs[i] - highs[i - 1];
    const dn = lows[i - 1] - lows[i];
    dmPlus.push(up > dn && up > 0 ? up : 0);
    dmMinus.push(dn > up && dn > 0 ? dn : 0);
  }
  const atr = ATR(highs, lows, closes, len).map((v) => nz(v, 1e-9));
  const smDmP = EMA(dmPlus, len);
  const smDmM = EMA(dmMinus, len);
  const dip = smDmP.map((v, i) => (Number.isFinite(v) ? (100 * v) / atr[i] : N));
  const dim = smDmM.map((v, i) => (Number.isFinite(v) ? (100 * v) / atr[i] : N));
  const dx = dip.map((v, i) =>
    Number.isFinite(v) && Number.isFinite(dim[i]) && dip[i] + dim[i] !== 0
      ? (100 * Math.abs(v - dim[i])) / (dip[i] + dim[i])
      : N,
  );
  const adx = EMA(dx.map((v) => nz(v, 0)), len);
  return { adx, dip, dim };
}

export function Supertrend(
  highs: number[],
  lows: number[],
  closes: number[],
  atrLen = 10,
  mult = 3,
): { trend: number[]; upper: number[]; lower: number[] } {
  const atr = ATR(highs, lows, closes, atrLen);
  const mid = highs.map((_, i) => (highs[i] + lows[i]) / 2);
  const upper: number[] = Array(closes.length).fill(N);
  const lower: number[] = Array(closes.length).fill(N);
  const trend: number[] = Array(closes.length).fill(N);

  for (let i = 0; i < closes.length; i++) {
    if (!Number.isFinite(atr[i])) continue;
    const u = mid[i] + mult * atr[i];
    const l = mid[i] - mult * atr[i];
    upper[i] = i === 0 ? u : Math.min(u, upper[i - 1]);
    lower[i] = i === 0 ? l : Math.max(l, lower[i - 1]);
    const prev = i === 0 ? -1 : trend[i - 1];
    const dirUp = closes[i] > upper[i - 1];
    const dirDn = closes[i] < lower[i - 1];
    trend[i] = dirUp ? 1 : dirDn ? -1 : prev;
  }
  return { trend, upper, lower };
}

export function Keltner(
  highs: number[],
  lows: number[],
  closes: number[],
  emaLen = 20,
  atrLen = 10,
  mult = 2,
): { mid: number[]; upper: number[]; lower: number[] } {
  const mid = EMA(closes, emaLen);
  const atr = ATR(highs, lows, closes, atrLen);
  const upper = atr.map((a, i) =>
    Number.isFinite(a) && Number.isFinite(mid[i]) ? mid[i] + mult * a : N,
  );
  const lower = atr.map((a, i) =>
    Number.isFinite(a) && Number.isFinite(mid[i]) ? mid[i] - mult * a : N,
  );
  return { mid, upper, lower };
}

export function Donchian(
  highs: number[],
  lows: number[],
  len = 20,
): { upper: number[]; lower: number[]; mid: number[] } {
  const upper = rolling(len, highs, (w) => Math.max(...w));
  const lower = rolling(len, lows, (w) => Math.min(...w));
  const mid = upper.map((u, i) =>
    Number.isFinite(u) && Number.isFinite(lower[i]) ? (u + lower[i]) / 2 : N,
  );
  return { upper, lower, mid };
}

export function OBV(closes: number[], volumes: number[]): number[] {
  const out: number[] = [];
  let obv = 0;
  out.push(N);
  for (let i = 1; i < closes.length; i++) {
    const dir = closes[i] > closes[i - 1] ? 1 : closes[i] < closes[i - 1] ? -1 : 0;
    obv += dir * (volumes[i] ?? 0);
    out.push(obv);
  }
  return out;
}

export function CMF(
  highs: number[],
  lows: number[],
  closes: number[],
  volumes: number[],
  len = 20,
): number[] {
  const mfv = closes.map((_, i) => {
    const hl = Math.max(highs[i] - lows[i], 1e-9);
    const mfm = ((closes[i] - lows[i]) - (highs[i] - closes[i])) / hl;
    return mfm * (volumes[i] ?? 0);
  });
  const num = smaArr(mfv, len);
  const den = smaArr(volumes.map((v) => v ?? 0), len).map((v) => (v === 0 ? 1e-9 : v));
  return num.map((v, i) => (Number.isFinite(v) ? v / den[i] : N));
}

export function PivotsClassic(high: number, low: number, close: number) {
  const P = (high + low + close) / 3;
  return {
    P,
    R1: 2 * P - low,
    S1: 2 * P - high,
    R2: P + (high - low),
    S2: P - (high - low),
    R3: high + 2 * (P - low),
    S3: low - 2 * (high - P),
  };
}

export function ROC(values: number[], len = 12): number[] {
  return values.map((v, i) =>
    i >= len && values[i - len] !== 0 ? ((v - values[i - len]) / values[i - len]) * 100 : N,
  );
}

export function DPO(values: number[], len = 20): number[] {
  const shift = Math.floor(len / 2) + 1;
  const sma = SMA(values, len);
  return values.map((v, i) =>
    i - shift >= 0 && Number.isFinite(sma[i - shift]) ? v - sma[i - shift] : N,
  );
}

export function TRIX(values: number[], len = 14): number[] {
  const e1 = EMA(values, len);
  const e2 = EMA(e1.map((v) => nz(v, 0)), len);
  const e3 = EMA(e2.map((v) => nz(v, 0)), len);
  return e3.map((v, i) =>
    i > 0 && Number.isFinite(e3[i - 1]) && e3[i - 1] !== 0 ? ((v - e3[i - 1]) / e3[i - 1]) * 100 : N,
  );
}

export function VWAP(high: number[], low: number[], close: number[], vol: number[]): number[] {
  const out: number[] = [];
  let pv = 0;
  let vs = 0;
  for (let i = 0; i < close.length; i++) {
    const tp = (high[i] + low[i] + close[i]) / 3;
    pv += tp * (vol[i] ?? 0);
    vs += vol[i] ?? 0;
    out.push(vs ? pv / vs : N);
  }
  return out;
}
