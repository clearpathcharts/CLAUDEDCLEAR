import type { ChartPoint } from "./types";

/** Extend a ray far past p2 along the p1→p2 vector. */
export function extendRay(p1: ChartPoint, p2: ChartPoint, factor = 40): ChartPoint {
  const dt = p2.time - p1.time;
  const dp = p2.price - p1.price;
  if (dt === 0 && dp === 0) {
    return { time: p2.time + 86_400 * factor, price: p2.price };
  }
  // Prefer forward in time; if dt is zero/negative, still push forward.
  const scale = dt > 0 ? factor : factor;
  const forwardDt = dt === 0 ? 86_400 * scale : Math.abs(dt) * scale;
  const signT = dt >= 0 ? 1 : -1;
  return {
    time: p2.time + signT * forwardDt,
    price: p2.price + (dt === 0 ? 0 : (dp / dt) * signT * forwardDt),
  };
}

/** Midpoint between two chart points. */
export function midpoint(a: ChartPoint, b: ChartPoint): ChartPoint {
  return {
    time: (a.time + b.time) / 2,
    price: (a.price + b.price) / 2,
  };
}

/**
 * Parallel channel: line A through p1→p2, line B offset so it passes through p3.
 * Returns endpoints for both lines (extended).
 */
export function parallelChannel(
  p1: ChartPoint,
  p2: ChartPoint,
  p3: ChartPoint,
): { a1: ChartPoint; a2: ChartPoint; b1: ChartPoint; b2: ChartPoint } {
  const far = extendRay(p1, p2, 30);
  const back = extendRay(p2, p1, 8);
  const dt = p2.time - p1.time;
  const dp = p2.price - p1.price;
  // Offset so that translated p1 lands such that line passes near p3.
  // Project: offset = p3 - closest point on infinite line, simplified as p3 - p1 projected.
  let t = 0;
  const len2 = dt * dt + dp * dp;
  if (len2 > 0) {
    t = ((p3.time - p1.time) * dt + (p3.price - p1.price) * dp) / len2;
  }
  const proj = { time: p1.time + t * dt, price: p1.price + t * dp };
  const ox = p3.time - proj.time;
  const oy = p3.price - proj.price;
  return {
    a1: back,
    a2: far,
    b1: { time: back.time + ox, price: back.price + oy },
    b2: { time: far.time + ox, price: far.price + oy },
  };
}

/**
 * Andrews pitchfork: median from p1 through mid(p2,p3), parallels through p2 & p3.
 */
export function pitchforkLines(
  p1: ChartPoint,
  p2: ChartPoint,
  p3: ChartPoint,
): { median: [ChartPoint, ChartPoint]; upper: [ChartPoint, ChartPoint]; lower: [ChartPoint, ChartPoint] } {
  const mid = midpoint(p2, p3);
  const medFar = extendRay(p1, mid, 35);
  const medBack = p1;
  const dt = mid.time - p1.time;
  const dp = mid.price - p1.price;
  // Offset from median to p2 / p3
  let t2 = 0;
  const len2 = dt * dt + dp * dp;
  if (len2 > 0) {
    t2 = ((p2.time - p1.time) * dt + (p2.price - p1.price) * dp) / len2;
  }
  const proj2 = { time: p1.time + t2 * dt, price: p1.price + t2 * dp };
  const o2x = p2.time - proj2.time;
  const o2y = p2.price - proj2.price;

  let t3 = 0;
  if (len2 > 0) {
    t3 = ((p3.time - p1.time) * dt + (p3.price - p1.price) * dp) / len2;
  }
  const proj3 = { time: p1.time + t3 * dt, price: p1.price + t3 * dp };
  const o3x = p3.time - proj3.time;
  const o3y = p3.price - proj3.price;

  return {
    median: [medBack, medFar],
    upper: [
      { time: medBack.time + o2x, price: medBack.price + o2y },
      { time: medFar.time + o2x, price: medFar.price + o2y },
    ],
    lower: [
      { time: medBack.time + o3x, price: medBack.price + o3y },
      { time: medFar.time + o3x, price: medFar.price + o3y },
    ],
  };
}

/** Classic Gann fan angle slopes as rise/run in price-per-time units (normalized). */
export const GANN_RATIOS = [
  1 / 8,
  1 / 4,
  1 / 3,
  1 / 2,
  1,
  2,
  3,
  4,
  8,
] as const;

/**
 * Build Gann fan rays from anchor p1 toward direction implied by p2.
 * `unit` scales price change per second of time.
 */
export function gannFanRays(
  p1: ChartPoint,
  p2: ChartPoint,
  horizonSec = 86_400 * 120,
): Array<[ChartPoint, ChartPoint]> {
  const dir = p2.price >= p1.price ? 1 : -1;
  const dt = Math.max(60, Math.abs(p2.time - p1.time));
  const dp = Math.abs(p2.price - p1.price) || Math.abs(p1.price) * 0.01 || 1;
  const unit = dp / dt; // price per second for 1×1
  const tEnd = p1.time + (p2.time >= p1.time ? horizonSec : -horizonSec);
  const signT = tEnd >= p1.time ? 1 : -1;

  return GANN_RATIOS.map((ratio) => {
    const priceEnd = p1.price + dir * unit * ratio * Math.abs(tEnd - p1.time);
    return [p1, { time: p1.time + signT * Math.abs(tEnd - p1.time), price: priceEnd }];
  });
}
