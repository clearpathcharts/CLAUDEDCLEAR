import type { IChartApi, ISeriesApi, SeriesType, Time } from "lightweight-charts";
import type { ChartDrawing, ChartPoint } from "./types";
import { FIB_EXT_RATIOS, FIB_RATIOS, FIB_TIME_RATIOS, fibPrice } from "./fibLevels";
import {
  circleThrough3,
  cubicPoints,
  extendBoth,
  extendRay,
  fibFanRays,
  gannFanRays,
  ghostFeedPoints,
  goldenSpiralPoints,
  parallelChannel,
  pitchforkLines,
  quadraticPoints,
  rotatedRectCorners,
  sinePoints,
  type PitchforkKind,
} from "./geometry";
import { ELLIOTT_LABELS } from "./toolCatalog";
import type { OhlcBar, VolumeAtPriceNode } from "../../../lib/charts/priceSeriesStyles";
import { volumeAtPrice } from "../../../lib/charts/priceSeriesStyles";

export type CoordPoint = { x: number; y: number };

export type SeriesRefs = {
  chart: IChartApi;
  series: ISeriesApi<SeriesType>;
};

const LABEL_FONT = "600 12px 'IBM Plex Sans', Inter, ui-sans-serif, system-ui, sans-serif";
const MONO_FONT = "10px 'IBM Plex Mono', ui-monospace, monospace";
const EMOJI_FONT = "22px 'Segoe UI Emoji', 'Apple Color Emoji', 'Noto Color Emoji', sans-serif";

export function timeToX(chart: IChartApi, time: number): number | null {
  const x = chart.timeScale().timeToCoordinate(time as Time);
  return x == null ? null : x;
}

export function priceToY(series: ISeriesApi<SeriesType>, price: number): number | null {
  const y = series.priceToCoordinate(price);
  return y == null ? null : y;
}

export function toCoord(refs: SeriesRefs, p: ChartPoint): CoordPoint | null {
  const x = timeToX(refs.chart, p.time);
  const y = priceToY(refs.series, p.price);
  if (x == null || y == null) return null;
  return { x, y };
}

export function strokeLine(
  ctx: CanvasRenderingContext2D,
  a: CoordPoint,
  b: CoordPoint,
  color: string,
  width = 1.5,
  dash?: number[],
) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  if (dash) ctx.setLineDash(dash);
  ctx.beginPath();
  ctx.moveTo(a.x, a.y);
  ctx.lineTo(b.x, b.y);
  ctx.stroke();
  ctx.restore();
}

function strokePoly(
  ctx: CanvasRenderingContext2D,
  pts: CoordPoint[],
  color: string,
  closed: boolean,
  width = 1.5,
  dash?: number[],
) {
  if (pts.length < 2) return;
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  if (dash) ctx.setLineDash(dash);
  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
  if (closed) ctx.closePath();
  ctx.stroke();
  ctx.restore();
}

function fillPoly(ctx: CanvasRenderingContext2D, pts: CoordPoint[], color: string, alpha: number) {
  if (pts.length < 3) return;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawArrowHead(ctx: CanvasRenderingContext2D, from: CoordPoint, to: CoordPoint, color: string, size = 10) {
  const angle = Math.atan2(to.y - from.y, to.x - from.x);
  ctx.save();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(to.x, to.y);
  ctx.lineTo(to.x - size * Math.cos(angle - Math.PI / 6), to.y - size * Math.sin(angle - Math.PI / 6));
  ctx.lineTo(to.x - size * Math.cos(angle + Math.PI / 6), to.y - size * Math.sin(angle + Math.PI / 6));
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function roundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

function measureLabel(ctx: CanvasRenderingContext2D, text: string): { w: number; h: number } {
  ctx.save();
  ctx.font = LABEL_FONT;
  const w = ctx.measureText(text).width;
  ctx.restore();
  return { w, h: 16 };
}

function paintLabel(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  text: string,
  color: string,
  opts?: { bg?: boolean; align?: CanvasTextAlign },
) {
  ctx.save();
  ctx.font = LABEL_FONT;
  ctx.textAlign = opts?.align ?? "left";
  ctx.textBaseline = "middle";
  if (opts?.bg) {
    const w = ctx.measureText(text).width;
    const padX = 7;
    const h = 20;
    const left = opts.align === "center" ? x - w / 2 - padX : opts.align === "right" ? x - w - padX : x - 2;
    ctx.fillStyle = "rgba(8,8,12,0.88)";
    roundedRect(ctx, left, y - h / 2, w + padX * 2, h, 5);
    ctx.fill();
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.55;
    ctx.stroke();
    ctx.globalAlpha = 1;
  }
  ctx.fillStyle = color;
  ctx.fillText(text, x, y);
  ctx.restore();
}

function waveLabel(ctx: CanvasRenderingContext2D, p: CoordPoint, text: string, color: string) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(p.x, p.y, 9, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#0a0a0c";
  ctx.font = "700 10px 'IBM Plex Sans', sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, p.x, p.y + 0.5);
  ctx.restore();
}

function coords(refs: SeriesRefs, pts: ChartPoint[]): CoordPoint[] {
  const out: CoordPoint[] = [];
  for (const p of pts) {
    const c = toCoord(refs, p);
    if (c) out.push(c);
  }
  return out;
}

function angleDeg(a: CoordPoint, b: CoordPoint): number {
  return (-Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI;
}

function drawPitchfork(
  ctx: CanvasRenderingContext2D,
  refs: SeriesRefs,
  pts: ChartPoint[],
  color: string,
  kind: PitchforkKind,
) {
  if (pts.length < 3) return;
  const pf = pitchforkLines(pts[0], pts[1], pts[2], kind);
  for (const [seg, w] of [
    [pf.median, 1.75],
    [pf.upper, 1.25],
    [pf.lower, 1.25],
  ] as const) {
    const a = toCoord(refs, seg[0]);
    const b = toCoord(refs, seg[1]);
    if (a && b) strokeLine(ctx, a, b, color, w);
  }
}

function drawFibRetracement(
  ctx: CanvasRenderingContext2D,
  refs: SeriesRefs,
  p1: ChartPoint,
  p2: ChartPoint,
  color: string,
  mediaW: number,
  ratios: readonly number[] = FIB_RATIOS,
) {
  const hi = Math.max(p1.price, p2.price);
  const lo = Math.min(p1.price, p2.price);
  const t0 = Math.min(p1.time, p2.time);
  const t1 = Math.max(p1.time, p2.time);
  const x0 = timeToX(refs.chart, t0);
  const x1 = timeToX(refs.chart, t1);
  if (x0 == null || x1 == null) return;
  const left = Math.min(x0, x1);
  const right = Math.max(x0, x1) + (mediaW - Math.max(x0, x1)) * 0.28;
  ctx.save();
  ctx.font = MONO_FONT;
  const yTop = priceToY(refs.series, hi);
  const yBot = priceToY(refs.series, lo);
  if (yTop != null && yBot != null) {
    ctx.globalAlpha = 0.08;
    ctx.fillStyle = color;
    ctx.fillRect(left, Math.min(yTop, yBot), Math.max(8, right - left), Math.abs(yBot - yTop));
    ctx.globalAlpha = 1;
  }
  for (const r of ratios) {
    const price = fibPrice(hi, lo, r > 1 ? 0 : r);
    const y = priceToY(refs.series, r > 1 ? lo - (hi - lo) * (r - 1) : price);
    if (y == null) continue;
    strokeLine(ctx, { x: left, y }, { x: right, y }, color, 1, r === 0.5 || r === 1 ? undefined : [4, 3]);
    ctx.fillStyle = color;
    ctx.fillText(`${(r * 100).toFixed(1)}%`, right + 4, y - 2);
  }
  ctx.restore();
}

function drawPosition(
  ctx: CanvasRenderingContext2D,
  refs: SeriesRefs,
  p1: ChartPoint,
  p2: ChartPoint,
  color: string,
  long: boolean,
) {
  const a = toCoord(refs, p1);
  const b = toCoord(refs, { time: p2.time, price: p1.price });
  const tp = toCoord(refs, { time: p2.time, price: p2.price });
  const risk = p2.price - p1.price;
  const slPrice = p1.price - risk;
  const sl = toCoord(refs, { time: p2.time, price: slPrice });
  if (!a || !b || !tp || !sl) return;
  const left = Math.min(a.x, b.x);
  const right = Math.max(a.x, b.x);
  const tpFill = long ? "#22C55E" : "#EF4444";
  const slFill = long ? "#EF4444" : "#22C55E";
  fillPoly(
    ctx,
    [
      { x: left, y: a.y },
      { x: right, y: a.y },
      { x: right, y: tp.y },
      { x: left, y: tp.y },
    ],
    tpFill,
    0.18,
  );
  fillPoly(
    ctx,
    [
      { x: left, y: a.y },
      { x: right, y: a.y },
      { x: right, y: sl.y },
      { x: left, y: sl.y },
    ],
    slFill,
    0.18,
  );
  strokeLine(ctx, { x: left, y: a.y }, { x: right, y: a.y }, color, 1.5);
  strokeLine(ctx, { x: left, y: tp.y }, { x: right, y: tp.y }, tpFill, 1.25);
  strokeLine(ctx, { x: left, y: sl.y }, { x: right, y: sl.y }, slFill, 1.25);
  paintLabel(ctx, right + 6, a.y, long ? "Long" : "Short", color, { bg: true });
}

export function drawVolumeOverlay(
  ctx: CanvasRenderingContext2D,
  refs: SeriesRefs,
  nodes: VolumeAtPriceNode[],
  mediaW: number,
  mode: "profile" | "footprint" | "tpo",
) {
  if (nodes.length < 2) return;
  const maxVol = Math.max(...nodes.map((n) => n.volume), 1);
  const width = Math.min(220, mediaW * 0.28);
  const x0 = mediaW - width - 8;
  for (const n of nodes) {
    const y = priceToY(refs.series, n.price);
    if (y == null) continue;
    const w = (n.volume / maxVol) * width;
    const h = 7;
    if (mode === "footprint") {
      const buyW = (n.buy / maxVol) * width;
      const sellW = (n.sell / maxVol) * width;
      ctx.fillStyle = "rgba(34,197,94,0.45)";
      ctx.fillRect(x0, y - h / 2, buyW, h);
      ctx.fillStyle = "rgba(239,68,68,0.45)";
      ctx.fillRect(x0 + buyW, y - h / 2, sellW, h);
    } else {
      ctx.fillStyle = n.isPoc ? "rgba(0,217,255,0.55)" : "rgba(0,217,255,0.22)";
      ctx.fillRect(x0, y - h / 2, w, h);
    }
    if (mode === "tpo" && n.letters) {
      ctx.fillStyle = "rgba(255,255,255,0.75)";
      ctx.font = "9px 'IBM Plex Mono', monospace";
      ctx.fillText(n.letters, x0 + 2, y + 3);
    }
  }
}

export function drawOne(
  ctx: CanvasRenderingContext2D,
  refs: SeriesRefs,
  d: ChartDrawing,
  mediaH: number,
  mediaW: number,
  marketBars: OhlcBar[],
) {
  const color = d.color;
  const pts = d.points;
  const p1 = pts[0];
  const p2 = pts[1];
  const p3 = pts[2];

  const line2 = () => {
    if (!p1 || !p2) return null;
    const a = toCoord(refs, p1);
    const b = toCoord(refs, p2);
    return a && b ? { a, b } : null;
  };

  switch (d.kind) {
    case "trend": {
      const s = line2();
      if (s) strokeLine(ctx, s.a, s.b, color);
      break;
    }
    case "ray": {
      if (!p1 || !p2) break;
      const far = extendRay(p1, p2);
      const a = toCoord(refs, p1);
      const b = toCoord(refs, far);
      if (a && b) strokeLine(ctx, a, b, color);
      break;
    }
    case "extended": {
      if (!p1 || !p2) break;
      const ext = extendBoth(p1, p2);
      const a = toCoord(refs, ext.a);
      const b = toCoord(refs, ext.b);
      if (a && b) strokeLine(ctx, a, b, color);
      break;
    }
    case "info_line":
    case "trend_angle": {
      const s = line2();
      if (!s || !p1 || !p2) break;
      strokeLine(ctx, s.a, s.b, color);
      const dPrice = p2.price - p1.price;
      const pct = p1.price !== 0 ? (dPrice / p1.price) * 100 : 0;
      const deg = angleDeg(s.a, s.b);
      const label =
        d.kind === "trend_angle"
          ? `${deg.toFixed(1)}°`
          : `${dPrice >= 0 ? "+" : ""}${dPrice.toFixed(Math.abs(dPrice) >= 10 ? 2 : 5)}  ${pct >= 0 ? "+" : ""}${pct.toFixed(2)}%  ${deg.toFixed(1)}°`;
      paintLabel(ctx, (s.a.x + s.b.x) / 2 + 8, (s.a.y + s.b.y) / 2 - 8, label, color, { bg: true });
      break;
    }
    case "horizontal": {
      if (!p1) break;
      const y = priceToY(refs.series, p1.price);
      if (y == null) break;
      strokeLine(ctx, { x: 0, y }, { x: mediaW, y }, color, 1.25, [6, 4]);
      paintLabel(ctx, 8, y - 10, p1.price.toFixed(p1.price >= 100 ? 2 : 5), color, { bg: true });
      break;
    }
    case "hray": {
      if (!p1) break;
      const y = priceToY(refs.series, p1.price);
      const x = timeToX(refs.chart, p1.time);
      if (y == null || x == null) break;
      strokeLine(ctx, { x, y }, { x: mediaW, y }, color, 1.25);
      break;
    }
    case "vertical": {
      if (!p1) break;
      const x = timeToX(refs.chart, p1.time);
      if (x == null) break;
      strokeLine(ctx, { x, y: 0 }, { x, y: mediaH }, color, 1.25, [6, 4]);
      break;
    }
    case "crossline": {
      if (!p1) break;
      const c = toCoord(refs, p1);
      if (!c) break;
      strokeLine(ctx, { x: 0, y: c.y }, { x: mediaW, y: c.y }, color, 1.15, [5, 4]);
      strokeLine(ctx, { x: c.x, y: 0 }, { x: c.x, y: mediaH }, color, 1.15, [5, 4]);
      break;
    }
    case "fib": {
      if (p1 && p2) drawFibRetracement(ctx, refs, p1, p2, color, mediaW);
      break;
    }
    case "fib_extension": {
      if (!p1 || !p2 || !p3) break;
      const range = p2.price - p1.price;
      const t0 = Math.min(p2.time, p3.time);
      const t1 = Math.max(p2.time, p3.time);
      const x0 = timeToX(refs.chart, t0);
      const x1 = timeToX(refs.chart, t1);
      if (x0 == null || x1 == null) break;
      const left = Math.min(x0, x1);
      const right = Math.max(x0, x1) + 40;
      ctx.save();
      ctx.font = MONO_FONT;
      ctx.fillStyle = color;
      for (const r of FIB_EXT_RATIOS) {
        const price = p3.price + range * r;
        const y = priceToY(refs.series, price);
        if (y == null) continue;
        strokeLine(ctx, { x: left, y }, { x: right, y }, color, 1, r === 1 ? undefined : [4, 3]);
        ctx.fillText(`${(r * 100).toFixed(1)}%`, right + 4, y - 2);
      }
      ctx.restore();
      const a = toCoord(refs, p1);
      const b = toCoord(refs, p2);
      const c = toCoord(refs, p3);
      if (a && b) strokeLine(ctx, a, b, color, 1, [3, 3]);
      if (b && c) strokeLine(ctx, b, c, color, 1, [3, 3]);
      break;
    }
    case "fib_channel": {
      if (!p1 || !p2 || !p3) break;
      const ch = parallelChannel(p1, p2, p3);
      const dt = ch.b1.time - ch.a1.time;
      const dp = ch.b1.price - ch.a1.price;
      for (const r of FIB_RATIOS) {
        const s1 = { time: ch.a1.time + dt * r, price: ch.a1.price + dp * r };
        const s2 = { time: ch.a2.time + (ch.b2.time - ch.a2.time) * r, price: ch.a2.price + (ch.b2.price - ch.a2.price) * r };
        const a = toCoord(refs, s1);
        const b = toCoord(refs, s2);
        if (a && b) strokeLine(ctx, a, b, color, r === 0 || r === 1 ? 1.5 : 1, r === 0.5 ? undefined : [4, 3]);
      }
      break;
    }
    case "fib_timezone":
    case "fib_trend_time": {
      if (!p1 || !p2) break;
      const base = Math.abs(p2.time - p1.time) || 86_400;
      const dir = p2.time >= p1.time ? 1 : -1;
      const origin = d.kind === "fib_trend_time" && p3 ? p3.time : p1.time;
      for (const r of FIB_TIME_RATIOS) {
        const t = origin + dir * base * r;
        const x = timeToX(refs.chart, t);
        if (x == null) continue;
        strokeLine(ctx, { x, y: 0 }, { x, y: mediaH }, color, 1, r === 1 ? undefined : [3, 3]);
        paintLabel(ctx, x + 4, 14, r.toFixed(3), color);
      }
      break;
    }
    case "fib_fan": {
      if (!p1 || !p2) break;
      for (const [a, b] of fibFanRays(p1, p2, FIB_RATIOS)) {
        const ca = toCoord(refs, a);
        const cb = toCoord(refs, b);
        if (ca && cb) strokeLine(ctx, ca, cb, color, 1);
      }
      break;
    }
    case "fib_circles":
    case "fib_arcs": {
      const s = line2();
      if (!s) break;
      const r0 = Math.hypot(s.b.x - s.a.x, s.b.y - s.a.y);
      ctx.save();
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.1;
      for (const r of FIB_RATIOS) {
        if (r <= 0) continue;
        ctx.beginPath();
        if (d.kind === "fib_arcs") ctx.arc(s.a.x, s.a.y, r0 * r, Math.PI, 0, false);
        else ctx.arc(s.a.x, s.a.y, r0 * r, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.restore();
      break;
    }
    case "fib_spiral": {
      const s = line2();
      if (!s) break;
      strokePoly(ctx, goldenSpiralPoints(s.a, s.b), color, false, 1.25);
      break;
    }
    case "fib_wedge": {
      if (!p1 || !p2 || !p3) break;
      const a = toCoord(refs, p1);
      const b = toCoord(refs, p2);
      const c = toCoord(refs, p3);
      if (!a || !b || !c) break;
      strokeLine(ctx, a, b, color);
      strokeLine(ctx, a, c, color);
      const r0 = Math.hypot(b.x - a.x, b.y - a.y);
      ctx.save();
      ctx.strokeStyle = color;
      ctx.lineWidth = 1;
      ctx.globalAlpha = 0.7;
      for (const r of [0.382, 0.5, 0.618, 1]) {
        ctx.beginPath();
        ctx.arc(a.x, a.y, r0 * r, Math.atan2(b.y - a.y, b.x - a.x), Math.atan2(c.y - a.y, c.x - a.x));
        ctx.stroke();
      }
      ctx.restore();
      break;
    }
    case "pitchfan": {
      if (!p1 || !p2 || !p3) break;
      drawPitchfork(ctx, refs, pts, color, "andrews");
      for (const [a, b] of fibFanRays(p1, p2, FIB_RATIOS)) {
        const ca = toCoord(refs, a);
        const cb = toCoord(refs, b);
        if (ca && cb) strokeLine(ctx, ca, cb, color, 1, [3, 3]);
      }
      break;
    }
    case "rectangle": {
      const s = line2();
      if (!s) break;
      const box = [
        { x: s.a.x, y: s.a.y },
        { x: s.b.x, y: s.a.y },
        { x: s.b.x, y: s.b.y },
        { x: s.a.x, y: s.b.y },
      ];
      fillPoly(ctx, box, color, 0.08);
      strokePoly(ctx, box, color, true);
      break;
    }
    case "rotated_rect": {
      if (!p1 || !p2 || !p3) break;
      const corners = rotatedRectCorners(p1, p2, p3).map((p) => toCoord(refs, p)).filter((c): c is CoordPoint => !!c);
      fillPoly(ctx, corners, color, 0.08);
      strokePoly(ctx, corners, color, true);
      break;
    }
    case "ellipse": {
      const s = line2();
      if (!s) break;
      const cx = (s.a.x + s.b.x) / 2;
      const cy = (s.a.y + s.b.y) / 2;
      const rx = Math.abs(s.b.x - s.a.x) / 2;
      const ry = Math.abs(s.b.y - s.a.y) / 2;
      if (rx < 1 || ry < 1) break;
      ctx.save();
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
      break;
    }
    case "circle": {
      const s = line2();
      if (!s) break;
      const r = Math.hypot(s.b.x - s.a.x, s.b.y - s.a.y);
      if (r < 1) break;
      ctx.save();
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(s.a.x, s.a.y, r, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
      break;
    }
    case "measure":
    case "price_range":
    case "date_range": {
      const s = line2();
      if (!s || !p1 || !p2) break;
      if (d.kind === "price_range") {
        strokeLine(ctx, { x: s.a.x, y: s.a.y }, { x: s.a.x, y: s.b.y }, color, 1.25);
        strokeLine(ctx, { x: s.a.x - 6, y: s.a.y }, { x: s.a.x + 6, y: s.a.y }, color, 1.25);
        strokeLine(ctx, { x: s.a.x - 6, y: s.b.y }, { x: s.a.x + 6, y: s.b.y }, color, 1.25);
      } else if (d.kind === "date_range") {
        strokeLine(ctx, { x: s.a.x, y: s.a.y }, { x: s.b.x, y: s.a.y }, color, 1.25);
      } else {
        const box = [
          { x: s.a.x, y: s.a.y },
          { x: s.b.x, y: s.a.y },
          { x: s.b.x, y: s.b.y },
          { x: s.a.x, y: s.b.y },
        ];
        fillPoly(ctx, box, color, 0.08);
        strokePoly(ctx, box, color, true, 1.25, [5, 4]);
      }
      const dPrice = p2.price - p1.price;
      const dBars = Math.round(Math.abs(p2.time - p1.time));
      const pct = p1.price !== 0 ? (dPrice / p1.price) * 100 : 0;
      const label =
        d.kind === "date_range"
          ? `Δt ${dBars}s`
          : d.kind === "price_range"
            ? `${dPrice >= 0 ? "+" : ""}${dPrice.toFixed(Math.abs(dPrice) >= 10 ? 2 : 5)} (${pct >= 0 ? "+" : ""}${pct.toFixed(2)}%)`
            : `${dPrice >= 0 ? "+" : ""}${dPrice.toFixed(Math.abs(dPrice) >= 10 ? 2 : 5)} (${pct >= 0 ? "+" : ""}${pct.toFixed(2)}%) · Δt ${dBars}s`;
      paintLabel(ctx, (s.a.x + s.b.x) / 2 + 6, (s.a.y + s.b.y) / 2 - 6, label, color, { bg: true });
      break;
    }
    case "triangle": {
      const cs = coords(refs, pts.slice(0, 3));
      if (cs.length === 3) {
        fillPoly(ctx, cs, color, 0.08);
        strokePoly(ctx, cs, color, true);
      }
      break;
    }
    case "channel": {
      if (!p1 || !p2 || !p3) break;
      const ch = parallelChannel(p1, p2, p3);
      const a1 = toCoord(refs, ch.a1);
      const a2 = toCoord(refs, ch.a2);
      const b1 = toCoord(refs, ch.b1);
      const b2 = toCoord(refs, ch.b2);
      if (a1 && a2) strokeLine(ctx, a1, a2, color);
      if (b1 && b2) strokeLine(ctx, b1, b2, color);
      if (a1 && b1) strokeLine(ctx, a1, b1, color, 1, [3, 3]);
      if (a2 && b2) strokeLine(ctx, a2, b2, color, 1, [3, 3]);
      break;
    }
    case "regression": {
      if (!p1 || !p2) break;
      const mid = { time: (p1.time + p2.time) / 2, price: (p1.price + p2.price) / 2 };
      const half = { time: p2.time - mid.time, price: p2.price - mid.price };
      const offset = Math.abs(p2.price - p1.price) * 0.25 || Math.abs(p1.price) * 0.004;
      const ch = parallelChannel(p1, p2, { time: mid.time, price: mid.price + offset });
      const a1 = toCoord(refs, ch.a1);
      const a2 = toCoord(refs, ch.a2);
      const b1 = toCoord(refs, ch.b1);
      const b2 = toCoord(refs, ch.b2);
      const m1 = toCoord(refs, extendRay({ time: mid.time - half.time, price: mid.price - half.price }, mid, 8));
      const m2 = toCoord(refs, extendRay(mid, { time: mid.time + half.time, price: mid.price + half.price }, 8));
      if (a1 && a2) strokeLine(ctx, a1, a2, color, 1);
      if (b1 && b2) strokeLine(ctx, b1, b2, color, 1);
      if (m1 && m2) strokeLine(ctx, m1, m2, color, 1.5);
      break;
    }
    case "flat_channel": {
      if (!p1 || !p2 || !p3) break;
      const a = toCoord(refs, p1);
      const b = toCoord(refs, extendRay(p1, p2));
      const y = priceToY(refs.series, p3.price);
      if (a && b) strokeLine(ctx, a, b, color);
      if (y != null) strokeLine(ctx, { x: 0, y }, { x: mediaW, y }, color, 1.25);
      break;
    }
    case "disjoint": {
      if (!p1 || !p2 || !p3) break;
      const a = toCoord(refs, p1);
      const b = toCoord(refs, extendRay(p1, p2));
      const c = toCoord(refs, p2);
      const dpt = toCoord(refs, extendRay(p2, p3));
      if (a && b) strokeLine(ctx, a, b, color);
      if (c && dpt) strokeLine(ctx, c, dpt, color);
      break;
    }
    case "text":
    case "note":
    case "price_note":
    case "comment":
    case "callout":
    case "price_label":
    case "pin":
    case "flag": {
      const p = p1 ? toCoord(refs, p1) : null;
      if (!p) break;
      const raw = (d.text || "Note").slice(0, 160);
      const priceBit = p1 ? p1.price.toFixed(p1.price >= 100 ? 2 : 5) : "";
      const text =
        d.kind === "price_note" || d.kind === "price_label"
          ? raw.includes(priceBit)
            ? raw
            : `${raw}  ${priceBit}`
          : raw;
      if (d.kind === "pin") {
        ctx.save();
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(p.x, p.y - 10, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x - 5, p.y - 8);
        ctx.lineTo(p.x + 5, p.y - 8);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
        if (raw && raw !== "Note") paintLabel(ctx, p.x + 10, p.y - 10, raw, color, { bg: true });
        break;
      }
      if (d.kind === "flag") {
        ctx.save();
        ctx.strokeStyle = color;
        ctx.fillStyle = color;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y + 10);
        ctx.lineTo(p.x, p.y - 14);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(p.x, p.y - 14);
        ctx.lineTo(p.x + 16, p.y - 8);
        ctx.lineTo(p.x, p.y - 2);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
        break;
      }
      if (d.kind === "callout" && p2) {
        const q = toCoord(refs, p2);
        if (q) strokeLine(ctx, p, q, color, 1.1);
      }
      ctx.save();
      ctx.font = LABEL_FONT;
      const { w } = measureLabel(ctx, text);
      const boxW = Math.min(280, w + 16);
      const boxH = d.kind === "comment" || d.kind === "note" || d.kind === "callout" ? 28 : 22;
      const bx = p.x + 8;
      const by = p.y - boxH - 4;
      ctx.fillStyle = "rgba(10,10,14,0.92)";
      if (d.kind === "comment") {
        roundedRect(ctx, bx, by, boxW, boxH, 12);
      } else {
        roundedRect(ctx, bx, by, boxW, boxH, 5);
      }
      ctx.fill();
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.15;
      ctx.stroke();
      ctx.fillStyle = "#f4f4f5";
      ctx.textBaseline = "middle";
      ctx.fillText(text, bx + 8, by + boxH / 2);
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      break;
    }
    case "emoji":
    case "sticker": {
      const p = p1 ? toCoord(refs, p1) : null;
      if (!p) break;
      ctx.save();
      ctx.font = EMOJI_FONT;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText((d.text || "⭐").slice(0, 8), p.x, p.y);
      ctx.restore();
      break;
    }
    case "arrow": {
      const s = line2();
      if (!s) break;
      strokeLine(ctx, s.a, s.b, color, 1.75);
      drawArrowHead(ctx, s.a, s.b, color);
      break;
    }
    case "arrow_up":
    case "arrow_down": {
      const p = p1 ? toCoord(refs, p1) : null;
      if (!p) break;
      const up = d.kind === "arrow_up";
      const tip = { x: p.x, y: p.y + (up ? -16 : 16) };
      const base = { x: p.x, y: p.y + (up ? 6 : -6) };
      strokeLine(ctx, base, tip, color, 2);
      drawArrowHead(ctx, base, tip, color, 11);
      break;
    }
    case "pitchfork":
      drawPitchfork(ctx, refs, pts, color, "andrews");
      break;
    case "schiff":
      drawPitchfork(ctx, refs, pts, color, "schiff");
      break;
    case "modified_schiff":
      drawPitchfork(ctx, refs, pts, color, "modified_schiff");
      break;
    case "inside_pitchfork":
      drawPitchfork(ctx, refs, pts, color, "inside");
      break;
    case "gann": {
      if (!p1 || !p2) break;
      for (const [a, b] of gannFanRays(p1, p2)) {
        const ca = toCoord(refs, a);
        const cb = toCoord(refs, b);
        if (ca && cb) strokeLine(ctx, ca, cb, color, 1);
      }
      break;
    }
    case "gann_box":
    case "gann_square": {
      const s = line2();
      if (!s) break;
      const box = [
        { x: s.a.x, y: s.a.y },
        { x: s.b.x, y: s.a.y },
        { x: s.b.x, y: s.b.y },
        { x: s.a.x, y: s.b.y },
      ];
      strokePoly(ctx, box, color, true);
      const divs = d.kind === "gann_square" ? 4 : 2;
      for (let i = 1; i < divs; i++) {
        const u = i / divs;
        strokeLine(
          ctx,
          { x: s.a.x + (s.b.x - s.a.x) * u, y: s.a.y },
          { x: s.a.x + (s.b.x - s.a.x) * u, y: s.b.y },
          color,
          1,
          [3, 3],
        );
        strokeLine(
          ctx,
          { x: s.a.x, y: s.a.y + (s.b.y - s.a.y) * u },
          { x: s.b.x, y: s.a.y + (s.b.y - s.a.y) * u },
          color,
          1,
          [3, 3],
        );
      }
      strokeLine(ctx, { x: s.a.x, y: s.a.y }, { x: s.b.x, y: s.b.y }, color, 1);
      strokeLine(ctx, { x: s.a.x, y: s.b.y }, { x: s.b.x, y: s.a.y }, color, 1);
      break;
    }
    case "elliott_impulse":
    case "elliott_correction":
    case "elliott_triangle":
    case "elliott_double":
    case "elliott_triple": {
      const cs = coords(refs, pts);
      if (cs.length < 2) break;
      strokePoly(ctx, cs, color, false, 1.75);
      const labels = ELLIOTT_LABELS[d.kind] || [];
      cs.forEach((c, i) => {
        if (labels[i]) waveLabel(ctx, c, labels[i], color);
      });
      break;
    }
    case "cyclic_lines": {
      if (!p1 || !p2) break;
      const interval = Math.abs(p2.time - p1.time) || 86_400;
      const dir = p2.time >= p1.time ? 1 : -1;
      for (let i = 0; i < 12; i++) {
        const t = p1.time + dir * interval * i;
        const x = timeToX(refs.chart, t);
        if (x == null) continue;
        strokeLine(ctx, { x, y: 0 }, { x, y: mediaH }, color, 1, i === 0 ? undefined : [4, 4]);
      }
      break;
    }
    case "time_cycles": {
      const s = line2();
      if (!s) break;
      const r = Math.abs(s.b.x - s.a.x) / 2;
      const midY = (s.a.y + s.b.y) / 2;
      ctx.save();
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.25;
      for (let i = 0; i < 6; i++) {
        const cx = s.a.x + (s.b.x >= s.a.x ? 1 : -1) * r * (1 + i * 2);
        ctx.beginPath();
        ctx.arc(cx, midY, r, Math.PI, 0, true);
        ctx.stroke();
      }
      ctx.restore();
      break;
    }
    case "sine": {
      if (!p1 || !p2) break;
      strokePoly(ctx, coords(refs, sinePoints(p1, p2)), color, false, 1.5);
      break;
    }
    case "long_position":
      if (p1 && p2) drawPosition(ctx, refs, p1, p2, color, true);
      break;
    case "short_position":
      if (p1 && p2) drawPosition(ctx, refs, p1, p2, color, false);
      break;
    case "ghost_feed": {
      if (!p1 || !p2) break;
      const ghost = coords(refs, ghostFeedPoints(p1, p2));
      strokePoly(ctx, ghost, color, false, 1.25, [5, 4]);
      ghost.slice(2).forEach((c, i) => {
        ctx.save();
        ctx.globalAlpha = 0.45;
        ctx.strokeStyle = color;
        ctx.strokeRect(c.x - 4, c.y - 10, 8, 20);
        ctx.restore();
        if (i === 0) paintLabel(ctx, c.x + 8, c.y, "Ghost", color);
      });
      break;
    }
    case "sector": {
      if (!p1 || !p2 || !p3) break;
      const a = toCoord(refs, p1);
      const b = toCoord(refs, p2);
      const c = toCoord(refs, p3);
      if (!a || !b || !c) break;
      const r = Math.hypot(b.x - a.x, b.y - a.y);
      const a0 = Math.atan2(b.y - a.y, b.x - a.x);
      const a1 = Math.atan2(c.y - a.y, c.x - a.x);
      ctx.save();
      ctx.fillStyle = color;
      ctx.globalAlpha = 0.12;
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.arc(a.x, a.y, r, a0, a1);
      ctx.closePath();
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.25;
      ctx.stroke();
      ctx.restore();
      break;
    }
    case "anchored_vwap": {
      if (!p1 || marketBars.length === 0) break;
      const from = marketBars.filter((b) => b.time >= p1.time);
      if (from.length < 2) break;
      let pv = 0;
      let vol = 0;
      const line: CoordPoint[] = [];
      for (const b of from) {
        const v = typeof b.volume === "number" && b.volume > 0 ? b.volume : Math.max(0, b.high - b.low);
        pv += ((b.high + b.low + b.close) / 3) * v;
        vol += v;
        const price = vol > 0 ? pv / vol : b.close;
        const c = toCoord(refs, { time: b.time, price });
        if (c) line.push(c);
      }
      strokePoly(ctx, line, color, false, 1.75);
      if (line[0]) paintLabel(ctx, line[0].x + 6, line[0].y - 8, "AVWAP", color, { bg: true });
      break;
    }
    case "volume_profile": {
      if (!p1 || !p2) break;
      const t0 = Math.min(p1.time, p2.time);
      const t1 = Math.max(p1.time, p2.time);
      const slice = marketBars.filter((b) => b.time >= t0 && b.time <= t1);
      const nodes = volumeAtPrice(slice.length ? slice : marketBars);
      const x0 = timeToX(refs.chart, t0);
      const x1 = timeToX(refs.chart, t1);
      if (x0 == null || x1 == null) break;
      const left = Math.min(x0, x1);
      const span = Math.max(24, Math.abs(x1 - x0));
      const maxVol = Math.max(...nodes.map((n) => n.volume), 1);
      for (const n of nodes) {
        const y = priceToY(refs.series, n.price);
        if (y == null) continue;
        ctx.fillStyle = n.isPoc ? color : color;
        ctx.globalAlpha = n.isPoc ? 0.45 : 0.2;
        ctx.fillRect(left, y - 3, (n.volume / maxVol) * span, 6);
        ctx.globalAlpha = 1;
      }
      break;
    }
    case "brush":
    case "highlighter":
    case "path":
    case "polyline": {
      const cs = coords(refs, pts);
      strokePoly(ctx, cs, color, false, d.kind === "highlighter" ? 10 : 2);
      if (d.kind === "highlighter") {
        ctx.save();
        ctx.globalAlpha = 0.28;
        ctx.strokeStyle = color;
        ctx.lineWidth = 10;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.beginPath();
        if (cs[0]) ctx.moveTo(cs[0].x, cs[0].y);
        for (let i = 1; i < cs.length; i++) ctx.lineTo(cs[i].x, cs[i].y);
        ctx.stroke();
        ctx.restore();
      }
      break;
    }
    case "arc": {
      const cs = coords(refs, pts.slice(0, 3));
      if (cs.length < 3) break;
      const circle = circleThrough3(cs[0], cs[1], cs[2]);
      if (!circle) {
        strokePoly(ctx, cs, color, false);
        break;
      }
      const a0 = Math.atan2(cs[0].y - circle.cy, cs[0].x - circle.cx);
      const a1 = Math.atan2(cs[2].y - circle.cy, cs[2].x - circle.cx);
      ctx.save();
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(circle.cx, circle.cy, circle.r, a0, a1);
      ctx.stroke();
      ctx.restore();
      break;
    }
    case "curve": {
      const cs = coords(refs, pts.slice(0, 3));
      if (cs.length < 3) break;
      strokePoly(ctx, quadraticPoints(cs[0], cs[1], cs[2]), color, false, 1.5);
      break;
    }
    case "double_curve": {
      const cs = coords(refs, pts.slice(0, 4));
      if (cs.length < 4) break;
      strokePoly(ctx, cubicPoints(cs[0], cs[1], cs[2], cs[3]), color, false, 1.5);
      break;
    }
    default:
      break;
  }
}
