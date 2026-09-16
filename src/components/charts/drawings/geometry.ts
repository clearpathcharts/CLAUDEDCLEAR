import type { ChartPoint } from "./types";

/** Extend a ray far past p2 along the p1→p2 vector. */
export function extendRay(p1: ChartPoint, p2: ChartPoint, factor = 40): ChartPoint {
  const dt = p2.time - p1.time;
  const dp = p2.price - p1.price;
  if (dt === 0 && dp === 0) {
    return { time: p2.time + 86_400 * factor, price: p2.price };
  }
  const scale = factor;
  const forwardDt = dt === 0 ? 86_400 * scale : Math.abs(dt) * scale;
  const signT = dt >= 0 ? 1 : -1;
  return {
    time: p2.time + signT * forwardDt,
    price: p2.price + (dt === 0 ? 0 : (dp / dt) * signT * forwardDt),
  };
}

export function extendBoth(
  p1: ChartPoint,
  p2: ChartPoint,
  factor = 30,
): { a: ChartPoint; b: ChartPoint } {
  return { a: extendRay(p2, p1, factor), b: extendRay(p1, p2, factor) };
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

export type PitchforkKind = "andrews" | "schiff" | "modified_schiff" | "inside";

/**
 * Andrews / Schiff / modified Schiff / inside pitchfork.
 */
export function pitchforkLines(
  p1: ChartPoint,
  p2: ChartPoint,
  p3: ChartPoint,
  kind: PitchforkKind = "andrews",
): { median: [ChartPoint, ChartPoint]; upper: [ChartPoint, ChartPoint]; lower: [ChartPoint, ChartPoint] } {
  const mid23 = midpoint(p2, p3);
  let origin = p1;
  if (kind === "schiff") {
    origin = midpoint(p1, p2);
  } else if (kind === "modified_schiff") {
    origin = { time: (p1.time + p2.time) / 2, price: p1.price };
  } else if (kind === "inside") {
    origin = midpoint(p1, mid23);
  }
  const medFar = extendRay(origin, mid23, 35);
  const dt = mid23.time - origin.time;
  const dp = mid23.price - origin.price;
  const len2 = dt * dt + dp * dp;

  const offsetTo = (pt: ChartPoint): { x: number; y: number } => {
    let t = 0;
    if (len2 > 0) {
      t = ((pt.time - origin.time) * dt + (pt.price - origin.price) * dp) / len2;
    }
    const proj = { time: origin.time + t * dt, price: origin.price + t * dp };
    return { x: pt.time - proj.time, y: pt.price - proj.price };
  };
  const o2 = offsetTo(p2);
  const o3 = offsetTo(p3);

  return {
    median: [origin, medFar],
    upper: [
      { time: origin.time + o2.x, price: origin.price + o2.y },
      { time: medFar.time + o2.x, price: medFar.price + o2.y },
    ],
    lower: [
      { time: origin.time + o3.x, price: origin.price + o3.y },
      { time: medFar.time + o3.x, price: medFar.price + o3.y },
    ],
  };
}

/** Classic Gann fan angle slopes as rise/run in price-per-time units (normalized). */
export const GANN_RATIOS = [1 / 8, 1 / 4, 1 / 3, 1 / 2, 1, 2, 3, 4, 8] as const;

/**
 * Build Gann fan rays from anchor p1 toward direction implied by p2.
 */
export function gannFanRays(
  p1: ChartPoint,
  p2: ChartPoint,
  horizonSec = 86_400 * 120,
): Array<[ChartPoint, ChartPoint]> {
  const dir = p2.price >= p1.price ? 1 : -1;
  const dt = Math.max(60, Math.abs(p2.time - p1.time));
  const dp = Math.abs(p2.price - p1.price) || Math.abs(p1.price) * 0.01 || 1;
  const unit = dp / dt;
  const tEnd = p1.time + (p2.time >= p1.time ? horizonSec : -horizonSec);
  const signT = tEnd >= p1.time ? 1 : -1;

  return GANN_RATIOS.map((ratio) => {
    const priceEnd = p1.price + dir * unit * ratio * Math.abs(tEnd - p1.time);
    return [p1, { time: p1.time + signT * Math.abs(tEnd - p1.time), price: priceEnd }];
  });
}

export function fibFanRays(p1: ChartPoint, p2: ChartPoint, ratios: readonly number[]): Array<[ChartPoint, ChartPoint]> {
  const hi = Math.max(p1.price, p2.price);
  const lo = Math.min(p1.price, p2.price);
  const tEnd = p2.time + (p2.time - p1.time) * 8;
  return ratios.map((r) => {
    const price = hi - (hi - lo) * r;
    const far = extendRay(p1, { time: p2.time, price }, 12);
    return [p1, { time: tEnd, price: far.price }];
  });
}

export function rotatedRectCorners(p1: ChartPoint, p2: ChartPoint, p3: ChartPoint): ChartPoint[] {
  const dt = p2.time - p1.time;
  const dp = p2.price - p1.price;
  const len2 = dt * dt + dp * dp;
  let t = 0;
  if (len2 > 0) {
    t = ((p3.time - p1.time) * dt + (p3.price - p1.price) * dp) / len2;
  }
  const proj = { time: p1.time + t * dt, price: p1.price + t * dp };
  const ox = p3.time - proj.time;
  const oy = p3.price - proj.price;
  return [
    p1,
    p2,
    { time: p2.time + ox, price: p2.price + oy },
    { time: p1.time + ox, price: p1.price + oy },
  ];
}

export function sinePoints(p1: ChartPoint, p2: ChartPoint, samples = 48): ChartPoint[] {
  const dt = p2.time - p1.time;
  const mid = (p1.price + p2.price) / 2;
  const amp = (p2.price - p1.price) / 2;
  const out: ChartPoint[] = [];
  for (let i = 0; i <= samples; i++) {
    const u = i / samples;
    out.push({
      time: p1.time + dt * u,
      price: mid + amp * Math.sin(u * Math.PI * 2),
    });
  }
  return out;
}

export function ghostFeedPoints(p1: ChartPoint, p2: ChartPoint, copies = 8): ChartPoint[] {
  const dt = p2.time - p1.time;
  const dp = p2.price - p1.price;
  const out: ChartPoint[] = [p1, p2];
  for (let i = 1; i <= copies; i++) {
    out.push({ time: p2.time + dt * i, price: p2.price + dp * i });
  }
  return out;
}

export function circleThrough3(
  a: { x: number; y: number },
  b: { x: number; y: number },
  c: { x: number; y: number },
): { cx: number; cy: number; r: number } | null {
  const d = 2 * (a.x * (b.y - c.y) + b.x * (c.y - a.y) + c.x * (a.y - b.y));
  if (Math.abs(d) < 1e-6) return null;
  const a2 = a.x * a.x + a.y * a.y;
  const b2 = b.x * b.x + b.y * b.y;
  const c2 = c.x * c.x + c.y * c.y;
  const cx = (a2 * (b.y - c.y) + b2 * (c.y - a.y) + c2 * (a.y - b.y)) / d;
  const cy = (a2 * (c.x - b.x) + b2 * (a.x - c.x) + c2 * (b.x - a.x)) / d;
  const r = Math.hypot(a.x - cx, a.y - cy);
  if (!Number.isFinite(r) || r < 1) return null;
  return { cx, cy, r };
}

export function quadraticPoints(
  a: { x: number; y: number },
  c: { x: number; y: number },
  b: { x: number; y: number },
  samples = 24,
): Array<{ x: number; y: number }> {
  const out: Array<{ x: number; y: number }> = [];
  for (let i = 0; i <= samples; i++) {
    const t = i / samples;
    const u = 1 - t;
    out.push({
      x: u * u * a.x + 2 * u * t * c.x + t * t * b.x,
      y: u * u * a.y + 2 * u * t * c.y + t * t * b.y,
    });
  }
  return out;
}

export function cubicPoints(
  a: { x: number; y: number },
  c1: { x: number; y: number },
  c2: { x: number; y: number },
  b: { x: number; y: number },
  samples = 28,
): Array<{ x: number; y: number }> {
  const out: Array<{ x: number; y: number }> = [];
  for (let i = 0; i <= samples; i++) {
    const t = i / samples;
    const u = 1 - t;
    out.push({
      x: u * u * u * a.x + 3 * u * u * t * c1.x + 3 * u * t * t * c2.x + t * t * t * b.x,
      y: u * u * u * a.y + 3 * u * u * t * c1.y + 3 * u * t * t * c2.y + t * t * t * b.y,
    });
  }
  return out;
}

export function goldenSpiralPoints(
  origin: { x: number; y: number },
  end: { x: number; y: number },
  samples = 64,
): Array<{ x: number; y: number }> {
  const r0 = Math.hypot(end.x - origin.x, end.y - origin.y) || 1;
  const theta0 = Math.atan2(end.y - origin.y, end.x - origin.x);
  const out: Array<{ x: number; y: number }> = [];
  const turns = 1.75;
  for (let i = 0; i <= samples; i++) {
    const u = i / samples;
    const theta = theta0 + u * turns * Math.PI * 2;
    const r = r0 * Math.pow(1.618, u * 4 - 2);
    out.push({
      x: origin.x + r * Math.cos(theta),
      y: origin.y + r * Math.sin(theta),
    });
  }
  return out;
}
