import { Candle } from "../../types/indicators";
import { emaSeries } from "../lib/math";

export interface PPOOutput {
  time: number;
  ppo: number;
  signal: number;
  histogram: number;
}

export function calculatePPO(
  data: Candle[],
  fastPeriod: number = 12,
  slowPeriod: number = 26,
  signalPeriod: number = 9
): PPOOutput[] {
  const closes = data.map((d) => d.close);
  const fast = emaSeries(closes, fastPeriod);
  const slow = emaSeries(closes, slowPeriod);
  const ppoLine: (number | null)[] = closes.map((_, i) => {
    if (fast[i] == null || slow[i] == null || slow[i] === 0) return null;
    return (((fast[i] as number) - (slow[i] as number)) / (slow[i] as number)) * 100;
  });
  const compact: number[] = [];
  const map: number[] = [];
  for (let i = 0; i < ppoLine.length; i++) {
    if (ppoLine[i] != null) {
      compact.push(ppoLine[i] as number);
      map.push(i);
    }
  }
  const sigCompact = emaSeries(compact, signalPeriod);
  const out: PPOOutput[] = [];
  for (let j = 0; j < sigCompact.length; j++) {
    if (sigCompact[j] == null) continue;
    const i = map[j];
    const ppo = ppoLine[i] as number;
    const signal = sigCompact[j] as number;
    out.push({ time: data[i].time, ppo, signal, histogram: ppo - signal });
  }
  return out;
}
