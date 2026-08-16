import type { Candle } from './types';
import { findSwingPoints } from './swings';

export type MarketStructureId =
  | 'trending_up'
  | 'trending_down'
  | 'ranging'
  | 'volatile'
  | 'transition';

export interface MarketStructureState {
  id: MarketStructureId;
  /** Educational display label — never a trade regime recommendation. */
  displayLabel: string;
  detail: string;
  strength: number;
}

const LABELS: Record<MarketStructureId, string> = {
  trending_up: 'Trending up (structure)',
  trending_down: 'Trending down (structure)',
  ranging: 'Ranging (structure)',
  volatile: 'Volatile (structure)',
  transition: 'Transition (structure)',
};

/**
 * Descriptive market structure state for literacy — not advice.
 */
export function analyzeMarketStructure(candles: Candle[]): MarketStructureState {
  if (!candles || candles.length < 20) {
    return {
      id: 'transition',
      displayLabel: LABELS.transition,
      detail: 'Insufficient bars to classify structure.',
      strength: 0.3,
    };
  }

  const window = candles.slice(-48);
  const first = window[0];
  const last = window[window.length - 1];
  const drift = (last.close - first.close) / Math.max(Math.abs(first.close), 1e-9);

  let sumRet = 0;
  let sumSq = 0;
  let n = 0;
  for (let i = 1; i < window.length; i++) {
    const prev = window[i - 1].close;
    if (prev === 0) continue;
    const r = (window[i].close - prev) / prev;
    sumRet += r;
    sumSq += r * r;
    n++;
  }
  const mean = n > 0 ? sumRet / n : 0;
  const variance = n > 1 ? sumSq / n - mean * mean : 0;
  const vol = Math.sqrt(Math.max(0, variance));

  const swings = findSwingPoints(window, 2, 2);
  const highs = swings.filter((s) => s.kind === 'high').slice(-4);
  const lows = swings.filter((s) => s.kind === 'low').slice(-4);

  let higherHighs = 0;
  let lowerLows = 0;
  for (let i = 1; i < highs.length; i++) {
    if (highs[i].price > highs[i - 1].price) higherHighs++;
  }
  for (let i = 1; i < lows.length; i++) {
    if (lows[i].price < lows[i - 1].price) lowerLows++;
  }

  if (vol > 0.012) {
    return {
      id: 'volatile',
      displayLabel: LABELS.volatile,
      detail: 'Elevated bar-to-bar movement relative to recent window.',
      strength: Math.min(1, vol / 0.02),
    };
  }

  if (drift > 0.008 && higherHighs >= 1) {
    return {
      id: 'trending_up',
      displayLabel: LABELS.trending_up,
      detail: 'Recent closes and swing highs lean higher.',
      strength: Math.min(1, Math.abs(drift) / 0.03),
    };
  }

  if (drift < -0.008 && lowerLows >= 1) {
    return {
      id: 'trending_down',
      displayLabel: LABELS.trending_down,
      detail: 'Recent closes and swing lows lean lower.',
      strength: Math.min(1, Math.abs(drift) / 0.03),
    };
  }

  if (Math.abs(drift) < 0.004 && vol < 0.006) {
    return {
      id: 'ranging',
      displayLabel: LABELS.ranging,
      detail: 'Limited net drift — price is compressing in a range-like window.',
      strength: 0.55,
    };
  }

  return {
    id: 'transition',
    displayLabel: LABELS.transition,
    detail: 'Structure between clear trend and range classifications.',
    strength: 0.4,
  };
}
