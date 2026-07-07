import { KST } from 'technicalindicators';
import { Candle } from '../../types/indicators';
import { candleArrays } from '../oss/adapters';

export function calculateKST(
  data: Candle[],
  rocPer1 = 10,
  rocPer2 = 15,
  rocPer3 = 20,
  rocPer4 = 30,
  smaRocPer1 = 10,
  smaRocPer2 = 10,
  smaRocPer3 = 10,
  smaRocPer4 = 15,
  signalPeriod = 9,
): { time: number; kst: number; signal: number }[] {
  const { times, closes } = candleArrays(data);
  const rows = new KST({
    values: closes,
    ROCPer1: rocPer1,
    ROCPer2: rocPer2,
    ROCPer3: rocPer3,
    ROCPer4: rocPer4,
    SMAROCPer1: smaRocPer1,
    SMAROCPer2: smaRocPer2,
    SMAROCPer3: smaRocPer3,
    SMAROCPer4: smaRocPer4,
    signalPeriod,
  }).getResult();

  const out: { time: number; kst: number; signal: number }[] = [];
  const offset = times.length - rows.length;
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    if (Number.isFinite(row.kst) && Number.isFinite(row.signal)) {
      out.push({ time: times[offset + i], kst: row.kst, signal: row.signal });
    }
  }
  return out;
}
