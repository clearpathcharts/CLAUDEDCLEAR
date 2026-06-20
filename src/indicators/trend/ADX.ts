import { Candle } from "../../types/indicators";

export interface ADXOutput {
  time: number;
  adx: number;
  plusDI: number;
  minusDI: number;
}

export function calculateADX(data: Candle[], period: number = 14): ADXOutput[] {
  if (data.length <= period) return [];

  const results: ADXOutput[] = [];
  const tr: number[] = [];
  const plusDM: number[] = [];
  const minusDM: number[] = [];

  // Compute DM and TR values
  for (let i = 1; i < data.length; i++) {
    const highDiff = data[i].high - data[i - 1].high;
    const lowDiff = data[i - 1].low - data[i].low;

    plusDM.push(highDiff > lowDiff && highDiff > 0 ? highDiff : 0);
    minusDM.push(lowDiff > highDiff && lowDiff > 0 ? lowDiff : 0);

    const trval = Math.max(
      data[i].high - data[i].low,
      Math.abs(data[i].high - data[i - 1].close),
      Math.abs(data[i].low - data[i - 1].close)
    );
    tr.push(trval);
  }

  // Smooth Wilder-style DM and TR
  let smoothedTR = tr.slice(0, period).reduce((sum, v) => sum + v, 0);
  let smoothedPlusDM = plusDM.slice(0, period).reduce((sum, v) => sum + v, 0);
  let smoothedMinusDM = minusDM.slice(0, period).reduce((sum, v) => sum + v, 0);

  const dxList: number[] = [];
  
  const calculateDXAndAdd = (idx: number, trVal: number, plusVal: number, minusVal: number) => {
    const plusDI = trVal === 0 ? 0 : (plusVal / trVal) * 100;
    const minusDI = trVal === 0 ? 0 : (minusVal / trVal) * 100;
    const diSum = plusDI + minusDI;
    const diDiff = Math.abs(plusDI - minusDI);
    const dx = diSum === 0 ? 0 : (diDiff / diSum) * 100;
    
    dxList.push(dx);
    return { plusDI, minusDI };
  };

  let initialDIs = calculateDXAndAdd(period, smoothedTR, smoothedPlusDM, smoothedMinusDM);

  // Compute subsequent smoothed TR / DM values
  for (let i = period; i < tr.length; i++) {
    smoothedTR = smoothedTR - smoothedTR / period + tr[i];
    smoothedPlusDM = smoothedPlusDM - smoothedPlusDM / period + plusDM[i];
    smoothedMinusDM = smoothedMinusDM - smoothedMinusDM / period + minusDM[i];

    const { plusDI, minusDI } = calculateDXAndAdd(i + 1, smoothedTR, smoothedPlusDM, smoothedMinusDM);
    
    // Once we have enough DX values to compute initial ADX, we smooth the DX list
    if (dxList.length >= period) {
      const startIdx = dxList.length - period;
      const dxSlice = dxList.slice(startIdx);
      const adx = dxSlice.reduce((sum, val) => sum + val, 0) / period;
      
      results.push({
        time: data[i + 1].time,
        adx,
        plusDI,
        minusDI
      });
    }
  }

  return results;
}
