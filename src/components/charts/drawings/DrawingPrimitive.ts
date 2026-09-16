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
import { drawOne, drawVolumeOverlay, strokeLine, toCoord, type SeriesRefs } from "./renderDrawings";
import type { OhlcBar, VolumeAtPriceNode } from "../../../lib/charts/priceSeriesStyles";

type CanvasTarget = Parameters<IPrimitivePaneRenderer["draw"]>[0];

class DrawingRenderer implements IPrimitivePaneRenderer {
  constructor(
    private readonly _refs: SeriesRefs,
    private readonly _drawings: ChartDrawing[],
    private readonly _pending: ChartPoint[],
    private readonly _pendingColor: string,
    private readonly _marketBars: OhlcBar[],
    private readonly _overlay: VolumeAtPriceNode[],
    private readonly _overlayMode: "profile" | "footprint" | "tpo" | null,
  ) {}

  draw(target: CanvasTarget): void {
    target.useMediaCoordinateSpace(({ context, mediaSize }) => {
      const refs = this._refs;
      if (this._overlayMode && this._overlay.length) {
        drawVolumeOverlay(context, refs, this._overlay, mediaSize.width, this._overlayMode);
      }
      for (const d of this._drawings) {
        drawOne(context, refs, d, mediaSize.height, mediaSize.width, this._marketBars);
      }
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
    private _getMarketBars: () => OhlcBar[],
    private _getOverlay: () => { nodes: VolumeAtPriceNode[]; mode: "profile" | "footprint" | "tpo" | null },
  ) {}

  update(): void {
    const refs = this._getRefs();
    if (!refs) {
      this._renderer = null;
      return;
    }
    const overlay = this._getOverlay();
    this._renderer = new DrawingRenderer(
      refs,
      this._getDrawings(),
      this._getPending(),
      this._getPendingColor(),
      this._getMarketBars(),
      overlay.nodes,
      overlay.mode,
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
  private _marketBars: OhlcBar[] = [];
  private _overlay: VolumeAtPriceNode[] = [];
  private _overlayMode: "profile" | "footprint" | "tpo" | null = null;
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
      () => this._marketBars,
      () => ({ nodes: this._overlay, mode: this._overlayMode }),
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

  private bump(): void {
    this._paneView.update();
    this._requestUpdate?.();
  }

  setDrawings(drawings: ChartDrawing[]): void {
    this._drawings = drawings;
    this.bump();
  }

  setPending(points: ChartPoint[], color = "#00D9FF"): void {
    this._pending = points;
    this._pendingColor = color;
    this.bump();
  }

  setMarketBars(bars: OhlcBar[]): void {
    this._marketBars = bars;
    this.bump();
  }

  setVolumeOverlay(nodes: VolumeAtPriceNode[], mode: "profile" | "footprint" | "tpo" | null): void {
    this._overlay = nodes;
    this._overlayMode = mode;
    this.bump();
  }
}
