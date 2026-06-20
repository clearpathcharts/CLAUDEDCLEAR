import { Candle } from "../../types/indicators";

export interface IchimokuOutput {
  time: number;
  tenkan: number;
  kijun: number;
  spanA: number; // projected forward by displacement
  spanB: number; // projected forward by displacement
  chikou: number;
}

export function calculateIchimoku(
  data: Candle[], 
  tenkanPeriod: number = 9, 
  kijunPeriod: number = 26, 
  spanBPeriod: number = 52, 
  displacement: number = 26
): IchimokuOutput[] {
  const N = data.length;
  if (N === 0) return [];

  const getDonchian = (len: number, idx: number): number => {
    const start = Math.max(0, idx - len + 1);
    const slice = data.slice(start, idx + 1);
    const highs = slice.map(c => c.high);
    const lows = slice.map(c => c.low);
    return (Math.max(...highs) + Math.min(...lows)) / 2;
  };

  const results: IchimokuOutput[] = [];

  // Determine the timeframe step size to project Span A and Span B forward
  const step = N > 1 ? (data[1].time - data[0].time) : 86400;
  const lastTime = data[N - 1].time;

  const getFutureTime = (idx: number): number => {
    if (idx < N) return data[idx].time;
    return lastTime + (idx - N + 1) * step;
  };

  // 1. First, calculate the basic levels for each raw index
  const tenkanRaw = data.map((_, idx) => getDonchian(tenkanPeriod, idx));
  const kijunRaw = data.map((_, idx) => getDonchian(kijunPeriod, idx));
  const spanARaw = data.map((_, idx) => (tenkanRaw[idx] + kijunRaw[idx]) / 2);
  const spanBRaw = data.map((_, idx) => getDonchian(spanBPeriod, idx));

  // Construct standard output array, projecting forward for Spans
  for (let idx = 0; idx < N + displacement; idx++) {
    const t = getFutureTime(idx);
    
    // Tenkan & Kijun are printed live (not projected)
    const tenkan = idx < N ? tenkanRaw[idx] : tenkanRaw[N - 1];
    const kijun = idx < N ? kijunRaw[idx] : kijunRaw[N - 1];

    // Senkou Span A & B are projected forward by (displacement - 1) indices
    const spanAIdx = idx - displacement;
    const spanA = (spanAIdx >= 0 && spanAIdx < N) ? spanARaw[spanAIdx] : spanARaw[0];
    const spanB = (spanAIdx >= 0 && spanAIdx < N) ? spanBRaw[spanAIdx] : spanBRaw[0];

    // Chikou Span: closing price shifted back by displacement indices
    const chikouIdx = idx + displacement;
    const chikou = (chikouIdx < N) ? data[chikouIdx].close : data[N - 1].close;

    results.push({
      time: t,
      tenkan,
      kijun,
      spanA,
      spanB,
      chikou
    });
  }

  return results;
}
