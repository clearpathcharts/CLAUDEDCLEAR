import { Candle } from "../../types/indicators";

export interface IchimokuOutput {
  time: number;
  tenkan: number | null;
  kijun: number | null;
  spanA: number | null;
  spanB: number | null;
  chikou: number | null;
}

function donchianMid(data: Candle[], len: number, idx: number): number | null {
  if (idx < len - 1) return null;
  let high = -Infinity;
  let low = Infinity;
  for (let i = idx - len + 1; i <= idx; i++) {
    if (data[i].high > high) high = data[i].high;
    if (data[i].low < low) low = data[i].low;
  }
  return (high + low) / 2;
}

/**
 * Standard Ichimoku (9/26/52/26):
 * - Tenkan / Kijun / Span B require full lookbacks
 * - Senkou Span A/B plotted `displacement` bars ahead
 * - Chikou = close plotted `displacement` bars back
 */
export function calculateIchimoku(
  data: Candle[],
  tenkanPeriod: number = 9,
  kijunPeriod: number = 26,
  spanBPeriod: number = 52,
  displacement: number = 26
): IchimokuOutput[] {
  const N = data.length;
  if (N === 0) return [];

  const tenkanRaw = data.map((_, idx) => donchianMid(data, tenkanPeriod, idx));
  const kijunRaw = data.map((_, idx) => donchianMid(data, kijunPeriod, idx));
  const spanBRaw = data.map((_, idx) => donchianMid(data, spanBPeriod, idx));
  const spanARaw = data.map((_, idx) => {
    const t = tenkanRaw[idx];
    const k = kijunRaw[idx];
    if (t == null || k == null) return null;
    return (t + k) / 2;
  });

  const step = N > 1 ? data[1].time - data[0].time : 86400;
  const lastTime = data[N - 1].time;
  const getFutureTime = (idx: number): number => {
    if (idx < N) return data[idx].time;
    return lastTime + (idx - N + 1) * step;
  };

  const results: IchimokuOutput[] = [];

  for (let idx = 0; idx < N + displacement; idx++) {
    const t = getFutureTime(idx);

    const tenkan = idx < N ? tenkanRaw[idx] : null;
    const kijun = idx < N ? kijunRaw[idx] : null;

    // Span values computed at bar i appear at bar i + displacement
    const spanSrc = idx - displacement;
    const spanA = spanSrc >= 0 && spanSrc < N ? spanARaw[spanSrc] : null;
    const spanB = spanSrc >= 0 && spanSrc < N ? spanBRaw[spanSrc] : null;

    // Chikou: close of bar (idx + displacement) drawn at bar idx
    const chikouIdx = idx + displacement;
    const chikou = chikouIdx < N ? data[chikouIdx].close : null;

    // Skip trailing projection rows that have no spans yet (keep forward cloud only)
    if (idx >= N && spanA == null && spanB == null) continue;

    results.push({
      time: t,
      tenkan,
      kijun,
      spanA,
      spanB,
      chikou,
    });
  }

  return results;
}
