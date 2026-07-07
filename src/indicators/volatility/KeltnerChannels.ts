import { Candle } from '../../types/indicators';
import { calculateEMA } from '../trend/EMA';
import { calculateATR } from '../volatility/ATR';

export interface KeltnerOutput {
  time: number;
  basis: number;
  upper: number;
  lower: number;
}

export function calculateKeltnerChannels(
  data: Candle[],
  period = 20,
  multiplier = 2,
): KeltnerOutput[] {
  if (data.length < period) return [];

  const basisSeries = calculateEMA(data, period);
  const atrSeries = calculateATR(data, period);
  const atrByTime = new Map(atrSeries.map((a) => [a.time, a.value]));

  return basisSeries
    .map((b) => {
      const atr = atrByTime.get(b.time);
      if (atr === undefined) return null;
      return {
        time: b.time,
        basis: b.value,
        upper: b.value + multiplier * atr,
        lower: b.value - multiplier * atr,
      };
    })
    .filter((r): r is KeltnerOutput => r !== null);
}
