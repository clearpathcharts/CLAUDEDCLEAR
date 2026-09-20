import { Candle } from '../types/indicators';
import { SwingPoint } from './types';
import { findSwingPoints } from './swings';

export type TrendBias = 'up' | 'down' | 'neutral';

export interface StructureBody {
  trendBias: TrendBias;
  /** Retrace / consolidation peaks — the line traders actually draw. */
  highs: SwingPoint[];
  /** Retrace / consolidation floors — not impulse breakdown lows. */
  lows: SwingPoint[];
  /** Last bar of the structure body. Later bars are the breakout impulse. */
  bodyEndIndex: number;
  /** True when the latest impulse already left the body in the trend direction. */
  brokeWithTrend: boolean;
}

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 1 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function netTrendBias(candles: Candle[]): TrendBias {
  if (candles.length < 8) return 'neutral';
  const first = candles[0];
  const last = candles[candles.length - 1];
  const prior = candles[Math.max(0, candles.length - Math.min(24, Math.floor(candles.length / 3)))];
  if (last.close < first.close * 0.994 || last.close < prior.close * 0.996) return 'down';
  if (last.close > first.close * 1.006 || last.close > prior.close * 1.004) return 'up';
  return 'neutral';
}

/**
 * Collapse consecutive same-kind swings to the more extreme print, then keep
 * only reversals that travel a real distance. Stops the fit from chasing every wick.
 */
export function significantZigzag(
  swings: SwingPoint[],
  avgPrice: number,
  minMovePct: number,
): SwingPoint[] {
  const sorted = [...swings].sort((a, b) => a.index - b.index);
  if (sorted.length < 2) return sorted;

  const collapsed: SwingPoint[] = [sorted[0]];
  for (let i = 1; i < sorted.length; i++) {
    const last = collapsed[collapsed.length - 1];
    const cur = sorted[i];
    if (cur.kind === last.kind) {
      if (cur.kind === 'high' && cur.price >= last.price) collapsed[collapsed.length - 1] = cur;
      else if (cur.kind === 'low' && cur.price <= last.price) collapsed[collapsed.length - 1] = cur;
      continue;
    }
    if (Math.abs(cur.price - last.price) / avgPrice >= minMovePct) {
      collapsed.push(cur);
    }
  }
  return collapsed;
}

/** Start at the origin peak of the decline, then keep only subsequent lower highs. */
export function lowerHighSequence(highs: SwingPoint[]): SwingPoint[] {
  if (highs.length < 2) return highs;
  const sorted = [...highs].sort((a, b) => a.index - b.index);
  const span = sorted[sorted.length - 1].index - sorted[0].index;
  const cutoff = sorted[0].index + span * 0.42;
  let origin = 0;
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i].index > cutoff) break;
    if (sorted[i].price >= sorted[origin].price) origin = i;
  }
  const out: SwingPoint[] = [sorted[origin]];
  for (let i = origin + 1; i < sorted.length; i++) {
    if (sorted[i].price < out[out.length - 1].price) out.push(sorted[i]);
  }
  return out.length >= 2 ? out : sorted.slice(-2);
}

/** Start at the origin trough of the advance, then keep only subsequent higher lows. */
export function higherLowSequence(lows: SwingPoint[]): SwingPoint[] {
  if (lows.length < 2) return lows;
  const sorted = [...lows].sort((a, b) => a.index - b.index);
  const span = sorted[sorted.length - 1].index - sorted[0].index;
  const cutoff = sorted[0].index + span * 0.42;
  let origin = 0;
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i].index > cutoff) break;
    if (sorted[i].price <= sorted[origin].price) origin = i;
  }
  const out: SwingPoint[] = [sorted[origin]];
  for (let i = origin + 1; i < sorted.length; i++) {
    if (sorted[i].price > out[out.length - 1].price) out.push(sorted[i]);
  }
  return out.length >= 2 ? out : sorted.slice(-2);
}

function clusterByPrice(points: SwingPoint[], avgPrice: number): SwingPoint[][] {
  const sorted = [...points].sort((a, b) => a.index - b.index);
  const clusters: SwingPoint[][] = [];
  const tol = avgPrice * 0.0035;
  for (const p of sorted) {
    const last = clusters[clusters.length - 1];
    if (last && Math.abs(p.price - last[last.length - 1].price) <= tol) last.push(p);
    else clusters.push([p]);
  }
  return clusters;
}

/**
 * Last expansion in the trend is the breakout, not another trendline anchor.
 * Body ends at the last retrace peak/trough before that impulse.
 */
function breakdownAnchor(
  candles: Candle[],
  zigzag: SwingPoint[],
  trendBias: TrendBias,
  avgPrice: number,
): { bodyEndIndex: number; brokeWithTrend: boolean } {
  const lastBar = candles.length - 1;
  if (zigzag.length < 3 || trendBias === 'neutral') {
    return { bodyEndIndex: lastBar, brokeWithTrend: false };
  }

  const last = zigzag[zigzag.length - 1];
  const prev = zigzag[zigzag.length - 2];
  const ranges = candles.map((c) => c.high - c.low).filter((r) => r > 0);
  const medRange = median(ranges) || avgPrice * 0.002;
  const move = Math.abs(last.price - prev.price);
  const late = last.index >= Math.floor(candles.length * 0.62);

  if (trendBias === 'down') {
    const lows = zigzag.filter((s) => s.kind === 'low');
    const clusters = clusterByPrice(lows, avgPrice);
    if (clusters.length >= 2) {
      const latest = clusters[clusters.length - 1];
      const prior = clusters[clusters.length - 2];
      const latestMean = latest.reduce((s, p) => s + p.price, 0) / latest.length;
      const priorMean = prior.reduce((s, p) => s + p.price, 0) / prior.length;
      const clusterLate = latest[0].index >= Math.floor(candles.length * 0.45);
      if (clusterLate && latestMean < priorMean * 0.996) {
        const highs = zigzag.filter((s) => s.kind === 'high' && s.index < latest[0].index);
        const lastRetraceHigh = highs[highs.length - 1];
        if (lastRetraceHigh) {
          return { bodyEndIndex: lastRetraceHigh.index, brokeWithTrend: true };
        }
      }
    }

    if (last.kind === 'low' && late) {
      const priorLows = zigzag.filter((s) => s.kind === 'low' && s.index < last.index);
      const priorFloor = priorLows.length
        ? Math.min(...priorLows.map((s) => s.price))
        : prev.kind === 'high' ? prev.price : last.price;
      const expansion = move >= medRange * 1.35 || last.price < priorFloor * 0.997;
      if (expansion && candles[lastBar].close <= last.price * 1.004) {
        const bodyEnd = prev.kind === 'high' ? prev.index : Math.max(0, last.index - 1);
        return { bodyEndIndex: bodyEnd, brokeWithTrend: true };
      }
    }
  }

  if (trendBias === 'up') {
    const highs = zigzag.filter((s) => s.kind === 'high');
    const clusters = clusterByPrice(highs, avgPrice);
    if (clusters.length >= 2) {
      const latest = clusters[clusters.length - 1];
      const prior = clusters[clusters.length - 2];
      const latestMean = latest.reduce((s, p) => s + p.price, 0) / latest.length;
      const priorMean = prior.reduce((s, p) => s + p.price, 0) / prior.length;
      const clusterLate = latest[0].index >= Math.floor(candles.length * 0.45);
      if (clusterLate && latestMean > priorMean * 1.004) {
        const lows = zigzag.filter((s) => s.kind === 'low' && s.index < latest[0].index);
        const lastRetraceLow = lows[lows.length - 1];
        if (lastRetraceLow) {
          return { bodyEndIndex: lastRetraceLow.index, brokeWithTrend: true };
        }
      }
    }

    if (last.kind === 'high' && late) {
      const priorHighs = zigzag.filter((s) => s.kind === 'high' && s.index < last.index);
      const priorCeil = priorHighs.length
        ? Math.max(...priorHighs.map((s) => s.price))
        : prev.kind === 'low' ? prev.price : last.price;
      const expansion = move >= medRange * 1.35 || last.price > priorCeil * 1.003;
      if (expansion && candles[lastBar].close >= last.price * 0.996) {
        const bodyEnd = prev.kind === 'low' ? prev.index : Math.max(0, last.index - 1);
        return { bodyEndIndex: bodyEnd, brokeWithTrend: true };
      }
    }
  }

  return { bodyEndIndex: lastBar, brokeWithTrend: false };
}

function retracePeaksFromFloors(
  zigzag: SwingPoint[],
  bodyEndIndex: number,
  avgPrice: number,
): SwingPoint[] {
  const lows = zigzag.filter((s) => s.kind === 'low' && s.index <= bodyEndIndex);
  const highs = zigzag.filter((s) => s.kind === 'high' && s.index <= bodyEndIndex);
  const clusters = clusterByPrice(lows, avgPrice);
  if (clusters.length < 2) return [];
  const peaks: SwingPoint[] = [];
  for (let i = 0; i < clusters.length; i++) {
    const start = i === 0 ? 0 : clusters[i][0].index;
    const end = i + 1 < clusters.length ? clusters[i + 1][0].index : bodyEndIndex + 1;
    const windowHighs = highs.filter((h) => h.index >= start && h.index < end);
    if (windowHighs.length === 0) continue;
    const peak = windowHighs.reduce((best, h) => (h.price > best.price ? h : best));
    peaks.push(peak);
  }
  return peaks;
}

function mergeSwingSets(a: SwingPoint[], b: SwingPoint[]): SwingPoint[] {
  const key = (s: SwingPoint) => `${s.kind}:${s.index}`;
  const seen = new Set(a.map(key));
  const out = [...a];
  for (const s of b) {
    if (seen.has(key(s))) continue;
    seen.add(key(s));
    out.push(s);
  }
  return out.sort((x, y) => x.index - y.index);
}

/**
 * Pivots that define a continuation structure: retrace highs/lows along the
 * trend, clipped so a breakdown impulse cannot rotate the line through the dump.
 */
export function resolveStructureBody(
  candles: Candle[],
  swings: SwingPoint[],
  avgPrice: number,
): StructureBody {
  const trendBias = netTrendBias(candles);
  const minMove = Math.max(0.0022, (median(candles.map((c) => c.high - c.low)) / avgPrice) * 0.55);
  // Fractal(3) misses lower-high sequences whose previous peak sits inside the
  // lookback window. 1-bar extrema + zigzag keep the actual retrace peaks.
  const fine = findSwingPoints(candles, 1, 1);
  const zigzag = significantZigzag(mergeSwingSets(swings, fine), avgPrice, minMove);
  const { bodyEndIndex, brokeWithTrend } = breakdownAnchor(candles, zigzag, trendBias, avgPrice);

  const bodyZigzag = zigzag.filter((s) => s.index <= bodyEndIndex);
  let highs = bodyZigzag.filter((s) => s.kind === 'high');
  let lows = bodyZigzag.filter((s) => s.kind === 'low');

  const clusteredPeaks = retracePeaksFromFloors(bodyZigzag, bodyEndIndex, avgPrice);
  if (clusteredPeaks.length >= 2) highs = clusteredPeaks;

  if (highs.length < 2) {
    highs = fine.filter((s) => s.kind === 'high' && s.index <= bodyEndIndex).slice(-8);
  }
  if (lows.length < 2) {
    lows = fine.filter((s) => s.kind === 'low' && s.index <= bodyEndIndex).slice(-8);
  }

  if (trendBias === 'down' && highs.length >= 2) highs = lowerHighSequence(highs);
  if (trendBias === 'up' && lows.length >= 2) lows = higherLowSequence(lows);

  if (brokeWithTrend && trendBias === 'down' && lows.length >= 3) {
    const lastLow = lows[lows.length - 1];
    const priorFloor = Math.min(...lows.slice(0, -1).map((s) => s.price));
    if (lastLow.price < priorFloor * 0.997) lows = lows.slice(0, -1);
  }
  if (brokeWithTrend && trendBias === 'up' && highs.length >= 3) {
    const lastHigh = highs[highs.length - 1];
    const priorCeil = Math.max(...highs.slice(0, -1).map((s) => s.price));
    if (lastHigh.price > priorCeil * 1.003) highs = highs.slice(0, -1);
  }

  return {
    trendBias,
    highs,
    lows,
    bodyEndIndex: Math.min(bodyEndIndex, candles.length - 1),
    brokeWithTrend,
  };
}

export function windowDirectionalEfficiency(candles: Candle[], start: number, end: number): number {
  if (end <= start) return 0;
  const net = Math.abs(candles[end].close - candles[start].close);
  let high = -Infinity;
  let low = Infinity;
  for (let i = start; i <= end; i++) {
    high = Math.max(high, candles[i].high);
    low = Math.min(low, candles[i].low);
  }
  const range = high - low;
  if (range <= 0) return 0;
  return net / range;
}
