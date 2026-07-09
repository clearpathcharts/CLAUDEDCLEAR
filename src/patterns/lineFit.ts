import { SwingPoint } from './types';
import { pricesNear } from './swings';

export interface LineFit {
  slope: number;
  intercept: number;
  r2: number;
}

/** Least-squares line through pivot indices and prices. */
export function fitLineToSwings(points: SwingPoint[]): LineFit | null {
  const n = points.length;
  if (n < 2) return null;

  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumXX = 0;

  for (const p of points) {
    sumX += p.index;
    sumY += p.price;
    sumXY += p.index * p.price;
    sumXX += p.index * p.index;
  }

  const denom = n * sumXX - sumX * sumX;
  if (denom === 0) return null;

  const slope = (n * sumXY - sumX * sumY) / denom;
  const intercept = (sumY - slope * sumX) / n;

  const meanY = sumY / n;
  let ssTot = 0;
  let ssRes = 0;
  for (const p of points) {
    const predicted = slope * p.index + intercept;
    ssRes += (p.price - predicted) ** 2;
    ssTot += (p.price - meanY) ** 2;
  }

  const r2 = ssTot > 0 ? Math.max(0, Math.min(1, 1 - ssRes / ssTot)) : 0;
  return { slope, intercept, r2 };
}

export function priceOnFit(fit: LineFit, index: number): number {
  return fit.slope * index + fit.intercept;
}

/** Count pivots whose price sits near the fitted line (within tolerance). */
export function countTouches(
  points: SwingPoint[],
  fit: LineFit,
  tolerancePct = 0.015,
): number {
  let touches = 0;
  for (const p of points) {
    const onLine = priceOnFit(fit, p.index);
    if (pricesNear(p.price, onLine, tolerancePct)) touches++;
  }
  return touches;
}

/** How much two trendlines converge over a bar range (0 = parallel, 1 = strong pinch). */
export function convergenceScore(
  upper: LineFit,
  lower: LineFit,
  startIndex: number,
  endIndex: number,
): number {
  const span = Math.max(1, endIndex - startIndex);
  const gapStart = priceOnFit(upper, startIndex) - priceOnFit(lower, startIndex);
  const gapEnd = priceOnFit(upper, endIndex) - priceOnFit(lower, endIndex);
  if (gapStart <= 0) return 0;
  const ratio = gapEnd / gapStart;
  if (ratio >= 1) return 0;
  return Math.min(1, 1 - ratio);
}

/**
 * Measured geometric confidence from line-fit quality, pivot touches, and optional convergence.
 * Replaces hardcoded 0.62 / 0.65 placeholders.
 */
export function chartPatternConfidence(params: {
  upperR2: number;
  lowerR2: number;
  upperTouches: number;
  lowerTouches: number;
  convergence?: number;
  minR2?: number;
}): number {
  const minR2 = params.minR2 ?? 0.55;
  const fitScore = (params.upperR2 + params.lowerR2) / 2;
  if (fitScore < minR2) return 0;

  const touchScore = Math.min(1, (params.upperTouches + params.lowerTouches) / 6);
  let conf = 0.38 + fitScore * 0.38 + touchScore * 0.24;

  if (params.convergence !== undefined && params.convergence > 0) {
    conf += params.convergence * 0.12;
  }

  return Math.min(0.92, Math.max(0.44, conf));
}

/** Confidence for double-top / double-bottom based on peak symmetry and spacing. */
export function doubleFormationConfidence(
  peak1: SwingPoint,
  peak2: SwingPoint,
  valley: SwingPoint,
  tolerancePct = 0.02,
): number {
  const symmetric = pricesNear(peak1.price, peak2.price, tolerancePct) ? 1 : 0.5;
  const spacing = peak2.index - peak1.index;
  const spacingScore = spacing >= 8 && spacing <= 80 ? 1 : spacing >= 5 ? 0.7 : 0.4;
  const depth = Math.abs(peak1.price - valley.price) / Math.max(peak1.price, 1e-9);
  const depthScore = depth >= 0.02 && depth <= 0.15 ? 1 : depth >= 0.01 ? 0.75 : 0.5;

  return Math.min(0.88, Math.max(0.45, 0.4 + symmetric * 0.25 + spacingScore * 0.15 + depthScore * 0.15));
}
