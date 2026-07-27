import type {
  IChartApi,
  ISeriesApi,
  ISeriesPrimitive,
  IPrimitivePaneView,
  IPrimitivePaneRenderer,
  SeriesAttachedParameter,
  Time,
  SeriesType,
} from "lightweight-charts";
import type { ChartDrawing, ChartPoint } from "./types";
import { FIB_RATIOS, fibPrice } from "./fibLevels";
import { extendRay, parallelChannel, pitchforkLines, gannFanRays } from "./geometry";

type CanvasTarget = Parameters<IPrimitivePaneRenderer["draw"]>[0];

type CoordPoint = { x: number; y: number };

type SeriesRefs = {
  chart: IChartApi;
  series: ISeriesApi<SeriesType>;
};

function timeToX(chart: IChartApi, time: number): number | null {
  const x = chart.timeScale().timeToCoordinate(time as Time);
  return x == null ? null : x;
}

function priceToY(series: ISeriesApi<SeriesType>, price: number): number | null {
  const y = series.priceToCoordinate(price);
  return y == null ? null : y;
}

function toCoord(refs: SeriesRefs, p: ChartPoint): CoordPoint | null {
  const x = timeToX(refs.chart, p.time);
  const y = priceToY(refs.series, p.price);
  if (x == null || y == null) return null;
  return { x, y };
}

function strokeLine(
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
) {
  if (pts.length < 2) return;
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
  if (closed) ctx.closePath();
  ctx.stroke();
  ctx.restore();
}

function drawArrowHead(
  ctx: CanvasRenderingContext2D,
  from: CoordPoint,
  to: CoordPoint,
  color: string,
) {
  const angle = Math.atan2(to.y - from.y, to.x - from.x);
  const size = 10;
  ctx.save();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(to.x, to.y);
  ctx.lineTo(
    to.x - size * Math.cos(angle - Math.PI / 6),
    to.y - size * Math.sin(angle - Math.PI / 6),
  );
  ctx.lineTo(
    to.x - size * Math.cos(angle + Math.PI / 6),
    to.y - size * Math.sin(angle + Math.PI / 6),
  );
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawOne(
  ctx: CanvasRenderingContext2D,
  refs: SeriesRefs,
  d: ChartDrawing,
  mediaH: number,
  mediaW: number,
) {
  const color = d.color;

  switch (d.kind) {
    case "trend": {
      const a = toCoord(refs, d.p1);
      const b = toCoord(refs, d.p2);
      if (a && b) strokeLine(ctx, a, b, color);
      break;
    }
    case "ray": {
      const far = extendRay(d.p1, d.p2);
      const a = toCoord(refs, d.p1);
      const b = toCoord(refs, far);
      if (a && b) strokeLine(ctx, a, b, color);
      break;
    }
    case "horizontal": {
      const y = priceToY(refs.series, d.price);
      if (y == null) break;
      strokeLine(ctx, { x: 0, y }, { x: mediaW, y }, color, 1.25, [6, 4]);
      break;
    }
    case "vertical": {
      const x = timeToX(refs.chart, d.time);
      if (x == null) break;
      strokeLine(ctx, { x, y: 0 }, { x, y: mediaH }, color, 1.25, [6, 4]);
      break;
    }
    case "fib": {
      const hi = Math.max(d.p1.price, d.p2.price);
      const lo = Math.min(d.p1.price, d.p2.price);
      const t0 = Math.min(d.p1.time, d.p2.time);
      const t1 = Math.max(d.p1.time, d.p2.time);
      const x0 = timeToX(refs.chart, t0);
      const x1 = timeToX(refs.chart, t1);
      if (x0 == null || x1 == null) break;
      const left = Math.min(x0, x1);
      const right = Math.max(x0, x1) + (mediaW - Math.max(x0, x1)) * 0.35;
      ctx.save();
      ctx.font = "10px monospace";
      for (const r of FIB_RATIOS) {
        const price = fibPrice(hi, lo, r);
        const y = priceToY(refs.series, price);
        if (y == null) continue;
        strokeLine(ctx, { x: left, y }, { x: right, y }, color, 1, r === 0.5 ? undefined : [4, 3]);
        ctx.fillStyle = color;
        ctx.globalAlpha = 0.9;
        ctx.fillText(`${(r * 100).toFixed(1)}%`, right + 4, y - 2);
        ctx.globalAlpha = 1;
      }
      ctx.restore();
      break;
    }
    case "rectangle": {
      const a = toCoord(refs, d.p1);
      const b = toCoord(refs, d.p2);
      if (!a || !b) break;
      strokePoly(
        ctx,
        [
          { x: a.x, y: a.y },
          { x: b.x, y: a.y },
          { x: b.x, y: b.y },
          { x: a.x, y: b.y },
        ],
        color,
        true,
      );
      break;
    }
    case "ellipse": {
      const a = toCoord(refs, d.p1);
      const b = toCoord(refs, d.p2);
      if (!a || !b) break;
      const cx = (a.x + b.x) / 2;
      const cy = (a.y + b.y) / 2;
      const rx = Math.abs(b.x - a.x) / 2;
      const ry = Math.abs(b.y - a.y) / 2;
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
    case "measure": {
      const a = toCoord(refs, d.p1);
      const b = toCoord(refs, d.p2);
      if (!a || !b) break;
      strokeLine(ctx, a, b, color, 1.25, [5, 4]);
      const dPrice = d.p2.price - d.p1.price;
      const dBars = Math.round(Math.abs(d.p2.time - d.p1.time));
      const pct = d.p1.price !== 0 ? (dPrice / d.p1.price) * 100 : 0;
      const label = `${dPrice >= 0 ? "+" : ""}${dPrice.toFixed(Math.abs(dPrice) >= 10 ? 2 : 5)} (${pct >= 0 ? "+" : ""}${pct.toFixed(2)}%) · Δt ${dBars}s`;
      ctx.save();
      ctx.fillStyle = color;
      ctx.font = "bold 10px monospace";
      ctx.fillText(label, (a.x + b.x) / 2 + 6, (a.y + b.y) / 2 - 6);
      ctx.restore();
      break;
    }
    case "triangle": {
      const a = toCoord(refs, d.p1);
      const b = toCoord(refs, d.p2);
      const c = toCoord(refs, d.p3);
      if (a && b && c) strokePoly(ctx, [a, b, c], color, true);
      break;
    }
    case "channel": {
      const ch = parallelChannel(d.p1, d.p2, d.p3);
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
    case "text": {
      const p = toCoord(refs, d.point);
      if (!p) break;
      ctx.save();
      ctx.fillStyle = color;
      ctx.font = "bold 11px monospace";
      ctx.fillText(d.text, p.x + 4, p.y - 4);
      ctx.beginPath();
      ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      break;
    }
    case "arrow": {
      const a = toCoord(refs, d.p1);
      const b = toCoord(refs, d.p2);
      if (!a || !b) break;
      strokeLine(ctx, a, b, color, 1.75);
      drawArrowHead(ctx, a, b, color);
      break;
    }
    case "pitchfork": {
      const pf = pitchforkLines(d.p1, d.p2, d.p3);
      for (const [seg, w] of [
        [pf.median, 1.75],
        [pf.upper, 1.25],
        [pf.lower, 1.25],
      ] as const) {
        const a = toCoord(refs, seg[0]);
        const b = toCoord(refs, seg[1]);
        if (a && b) strokeLine(ctx, a, b, color, w);
      }
      break;
    }
    case "gann": {
      for (const [a, b] of gannFanRays(d.p1, d.p2)) {
        const ca = toCoord(refs, a);
        const cb = toCoord(refs, b);
        if (ca && cb) strokeLine(ctx, ca, cb, color, 1);
      }
      break;
    }
  }
}

class DrawingRenderer implements IPrimitivePaneRenderer {
  constructor(
    private readonly _refs: SeriesRefs,
    private readonly _drawings: ChartDrawing[],
    private readonly _pending: ChartPoint[],
    private readonly _pendingColor: string,
  ) {}

  draw(target: CanvasTarget): void {
    target.useMediaCoordinateSpace(({ context, mediaSize }) => {
      const refs = this._refs;
      for (const d of this._drawings) {
        drawOne(context, refs, d, mediaSize.height, mediaSize.width);
      }
      // In-progress click anchors
      for (const p of this._pending) {
        const c = toCoord(refs, p);
        if (!c) continue;
        context.save();
        context.fillStyle = this._pendingColor;
        context.beginPath();
        context.arc(c.x, c.y, 4, 0, Math.PI * 2);
        context.fill();
        context.restore();
      }
      if (this._pending.length >= 2) {
        const a = toCoord(refs, this._pending[0]);
        const b = toCoord(refs, this._pending[this._pending.length - 1]);
        if (a && b) strokeLine(context, a, b, this._pendingColor, 1, [4, 4]);
      }
    });
  }
}

class DrawingPaneView implements IPrimitivePaneView {
  private _renderer: DrawingRenderer | null = null;

  constructor(
    private _getRefs: () => SeriesRefs | null,
    private _getDrawings: () => ChartDrawing[],
    private _getPending: () => ChartPoint[],
    private _getPendingColor: () => string,
  ) {}

  update(): void {
    const refs = this._getRefs();
    if (!refs) {
      this._renderer = null;
      return;
    }
    this._renderer = new DrawingRenderer(
      refs,
      this._getDrawings(),
      this._getPending(),
      this._getPendingColor(),
    );
  }

  renderer(): IPrimitivePaneRenderer | null {
    return this._renderer;
  }

  zOrder(): "top" {
    return "top";
  }
}

/** Canvas overlay primitive for all user drawings. */
export class DrawingPrimitive implements ISeriesPrimitive<Time> {
  private _drawings: ChartDrawing[] = [];
  private _pending: ChartPoint[] = [];
  private _pendingColor = "#00D9FF";
  private _requestUpdate: (() => void) | null = null;
  private _chart: IChartApi | null = null;
  private _series: ISeriesApi<SeriesType> | null = null;
  private readonly _paneView: DrawingPaneView;

  constructor() {
    this._paneView = new DrawingPaneView(
      () =>
        this._chart && this._series
          ? { chart: this._chart, series: this._series }
          : null,
      () => this._drawings,
      () => this._pending,
      () => this._pendingColor,
    );
  }

  attached(param: SeriesAttachedParameter<Time, SeriesType>): void {
    this._chart = param.chart as IChartApi;
    this._series = param.series;
    this._requestUpdate = param.requestUpdate;
    this._paneView.update();
  }

  detached(): void {
    this._chart = null;
    this._series = null;
    this._requestUpdate = null;
  }

  paneViews(): readonly IPrimitivePaneView[] {
    return [this._paneView];
  }

  updateAllViews(): void {
    this._paneView.update();
  }

  setDrawings(drawings: ChartDrawing[]): void {
    this._drawings = drawings;
    this._paneView.update();
    this._requestUpdate?.();
  }

  setPending(points: ChartPoint[], color = "#00D9FF"): void {
    this._pending = points;
    this._pendingColor = color;
    this._paneView.update();
    this._requestUpdate?.();
  }
}
