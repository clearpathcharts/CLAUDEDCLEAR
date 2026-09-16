import { SwingPoint } from './types';

export interface FittedLine {
  slope: number;
  intercept: number;
  r2: number;
}

/** Least-squares line through swing pivots. Returns null when underdetermined. */
export function fitLineThroughPivots(points: SwingPoint[]): FittedLine | null {
  const n = points.length;
  if (n < 2) return null;

  let sx = 0;
  let sy = 0;
  let sxx = 0;
  let sxy = 0;

  for (const p of points) {
    sx += p.index;
    sy += p.price;
    sxx += p.index * p.index;
    sxy += p.index * p.price;
  }

  const denom = n * sxx - sx * sx;
  if (denom === 0) return null;

  const slope = (n * sxy - sx * sy) / denom;
  const intercept = (sy - slope * sx) / n;
  const meanY = sy / n;

  let ssTot = 0;
  let ssRes = 0;
  for (const p of points) {
    const pred = slope * p.index + intercept;
    ssRes += (p.price - pred) ** 2;
    ssTot += (p.price - meanY) ** 2;
  }

  const r2 = ssTot === 0 ? 1 : 1 - ssRes / ssTot;
  return { slope, intercept, r2 };
}

export function lineValueAt(line: FittedLine, index: number): number {
  return line.slope * index + line.intercept;
}

export function clamp01(x: number): number {
  return Math.max(0, Math.min(1, x));
}

export function roundConfidence(x: number): number {
  return Math.round(x * 100) / 100;
}
