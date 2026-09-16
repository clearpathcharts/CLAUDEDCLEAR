import { Candle } from "../../types/indicators";

export interface ADXOutput {
  time: number;
  adx: number;
  plusDI: number;
  minusDI: number;
}

/**
 * Wilder's ADX:
 * 1) TR / +DM / -DM
 * 2) Wilder smooth those series
 * 3) +DI / -DI / DX
 * 4) First ADX = SMA of first `period` DX values
 * 5) Subsequent ADX = Wilder smooth of DX
 */
export function calculateADX(data: Candle[], period: number = 14): ADXOutput[] {
  if (data.length <= period * 2 || period < 1) return [];

  const tr: number[] = [];
  const plusDM: number[] = [];
  const minusDM: number[] = [];

  for (let i = 1; i < data.length; i++) {
    const highDiff = data[i].high - data[i - 1].high;
    const lowDiff = data[i - 1].low - data[i].low;

    plusDM.push(highDiff > lowDiff && highDiff > 0 ? highDiff : 0);
    minusDM.push(lowDiff > highDiff && lowDiff > 0 ? lowDiff : 0);

    tr.push(
      Math.max(
        data[i].high - data[i].low,
        Math.abs(data[i].high - data[i - 1].close),
        Math.abs(data[i].low - data[i - 1].close)
      )
    );
  }

  // Need at least `period` TR samples before first smooth values exist
  if (tr.length < period) return [];

  let smoothedTR = tr.slice(0, period).reduce((sum, v) => sum + v, 0);
  let smoothedPlusDM = plusDM.slice(0, period).reduce((sum, v) => sum + v, 0);
  let smoothedMinusDM = minusDM.slice(0, period).reduce((sum, v) => sum + v, 0);

  const dxList: number[] = [];
  const diAtBar: { plusDI: number; minusDI: number }[] = [];

  const pushDX = (smoothedTr: number, smoothedPlus: number, smoothedMinus: number) => {
    const plusDI = smoothedTr === 0 ? 0 : (smoothedPlus / smoothedTr) * 100;
    const minusDI = smoothedTr === 0 ? 0 : (smoothedMinus / smoothedTr) * 100;
    const diSum = plusDI + minusDI;
    const dx = diSum === 0 ? 0 : (Math.abs(plusDI - minusDI) / diSum) * 100;
    dxList.push(dx);
    diAtBar.push({ plusDI, minusDI });
  };

  // First DX at TR index period-1 → candle index `period`
  pushDX(smoothedTR, smoothedPlusDM, smoothedMinusDM);

  for (let i = period; i < tr.length; i++) {
    smoothedTR = smoothedTR - smoothedTR / period + tr[i];
    smoothedPlusDM = smoothedPlusDM - smoothedPlusDM / period + plusDM[i];
    smoothedMinusDM = smoothedMinusDM - smoothedMinusDM / period + minusDM[i];
    pushDX(smoothedTR, smoothedPlusDM, smoothedMinusDM);
  }

  if (dxList.length < period) return [];

  const results: ADXOutput[] = [];
  let adx = dxList.slice(0, period).reduce((sum, v) => sum + v, 0) / period;

  // First ADX aligns with the bar of the `period`-th DX
  // DX[0] is at candle index `period`; DX[period-1] is at candle index `period + period - 1`
  const firstAdxCandleIdx = period + period - 1;
  const firstDi = diAtBar[period - 1];
  results.push({
    time: data[firstAdxCandleIdx].time,
    adx,
    plusDI: firstDi.plusDI,
    minusDI: firstDi.minusDI,
  });

  for (let i = period; i < dxList.length; i++) {
    adx = (adx * (period - 1) + dxList[i]) / period;
    const candleIdx = period + i;
    if (candleIdx >= data.length) break;
    results.push({
      time: data[candleIdx].time,
      adx,
      plusDI: diAtBar[i].plusDI,
      minusDI: diAtBar[i].minusDI,
    });
  }

  return results;
}
