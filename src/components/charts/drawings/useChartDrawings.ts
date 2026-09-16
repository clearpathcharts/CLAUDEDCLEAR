import { useCallback, useEffect, useRef, useState, type RefObject } from "react";
import type { IChartApi, ISeriesApi, MouseEventParams, SeriesType, Time } from "lightweight-charts";
import { DrawingPrimitive } from "./DrawingPrimitive";
import { loadDrawings, saveDrawings } from "./drawingStorage";
import {
  type ChartDrawing,
  type ChartPoint,
  type DrawingColor,
  type DrawingToolId,
  newDrawingId,
} from "./types";
import { toolClicks } from "./toolCatalog";
import type { OhlcBar, VolumeAtPriceNode } from "../../../lib/charts/priceSeriesStyles";

function timeToNumber(time: Time): number | null {
  if (typeof time === "number" && Number.isFinite(time)) return time;
  if (time && typeof time === "object" && "year" in time) {
    const d = time as { year: number; month: number; day: number };
    return Math.floor(Date.UTC(d.year, d.month - 1, d.day) / 1000);
  }
  return null;
}

function isAnnotate(tool: DrawingToolId): boolean {
  return (
    tool === "text" ||
    tool === "note" ||
    tool === "price_note" ||
    tool === "pin" ||
    tool === "comment" ||
    tool === "price_label" ||
    tool === "flag" ||
    tool === "emoji" ||
    tool === "sticker" ||
    tool === "callout"
  );
}

function buildDrawing(
  tool: Exclude<DrawingToolId, "select">,
  points: ChartPoint[],
  color: DrawingColor,
  text?: string,
): ChartDrawing | null {
  if (points.length === 0) return null;
  const id = newDrawingId();
  let label = text;
  if (tool === "emoji" || tool === "sticker") {
    label = (text || "⭐").slice(0, 8);
  } else if (isAnnotate(tool)) {
    label = (text || "Note").slice(0, 160);
  }
  return { id, kind: tool, color, points, text: label };
}

function readPoint(
  series: ISeriesApi<SeriesType>,
  param: { point?: { x: number; y: number }; time?: Time },
): ChartPoint | null {
  if (!param.point || param.time == null) return null;
  const time = timeToNumber(param.time);
  if (time == null) return null;
  const price = series.coordinateToPrice(param.point.y);
  if (price == null || !Number.isFinite(price)) return null;
  return { time, price: Number(price) };
}

export function useChartDrawings(opts: {
  chartRef: RefObject<IChartApi | null>;
  seriesRef: RefObject<ISeriesApi<SeriesType> | null>;
  symbol: string;
  timeframe: string;
  enabled: boolean;
  chartReadyKey: number;
}) {
  const { chartRef, seriesRef, symbol, timeframe, enabled, chartReadyKey } = opts;

  const [activeTool, setActiveToolState] = useState<DrawingToolId>("select");
  const [drawColor, setDrawColor] = useState<DrawingColor>("#00D9FF");
  const [drawings, setDrawings] = useState<ChartDrawing[]>([]);
  const [pendingPoints, setPendingPoints] = useState<ChartPoint[]>([]);
  const [annotationText, setAnnotationText] = useState("Note");
  const [annotationGlyph, setAnnotationGlyph] = useState("⭐");

  const primitiveRef = useRef<DrawingPrimitive | null>(null);
  const activeToolRef = useRef(activeTool);
  const colorRef = useRef(drawColor);
  const pendingRef = useRef(pendingPoints);
  const drawingsRef = useRef(drawings);
  const annotationTextRef = useRef(annotationText);
  const annotationGlyphRef = useRef(annotationGlyph);
  const loadedKeyRef = useRef("");
  const brushDownRef = useRef(false);

  activeToolRef.current = activeTool;
  colorRef.current = drawColor;
  pendingRef.current = pendingPoints;
  drawingsRef.current = drawings;
  annotationTextRef.current = annotationText;
  annotationGlyphRef.current = annotationGlyph;

  useEffect(() => {
    if (!enabled) return;
    const key = `${symbol.toUpperCase()}:${timeframe}`;
    setDrawings(loadDrawings(symbol, timeframe));
    loadedKeyRef.current = key;
    setPendingPoints([]);
    setActiveToolState("select");
  }, [symbol, timeframe, enabled]);

  useEffect(() => {
    if (!enabled) return;
    const key = `${symbol.toUpperCase()}:${timeframe}`;
    if (loadedKeyRef.current !== key) return;
    saveDrawings(symbol, timeframe, drawings);
  }, [drawings, symbol, timeframe, enabled]);

  const commitPoints = useCallback((tool: Exclude<DrawingToolId, "select">, points: ChartPoint[]) => {
    let text: string | undefined;
    if (tool === "emoji" || tool === "sticker") text = annotationGlyphRef.current;
    else if (isAnnotate(tool)) text = annotationTextRef.current;
    const drawing = buildDrawing(tool, points, colorRef.current, text);
    setPendingPoints([]);
    if (drawing) setDrawings((prev) => [...prev, drawing]);
  }, []);

  useEffect(() => {
    if (!enabled) return;
    const chart = chartRef.current;
    const series = seriesRef.current;
    if (!chart || !series) return;

    const primitive = new DrawingPrimitive();
    primitiveRef.current = primitive;
    series.attachPrimitive(primitive);
    primitive.setDrawings(drawingsRef.current);
    primitive.setPending(pendingRef.current, colorRef.current);

    const onClick = (param: MouseEventParams<Time>) => {
      const tool = activeToolRef.current;
      if (tool === "select") return;
      const clicks = toolClicks(tool);
      if (clicks === "brush") return;
      const point = readPoint(series, param);
      if (!point) return;

      if (clicks === "poly") {
        setPendingPoints((prev) => [...prev, point]);
        return;
      }

      const need = typeof clicks === "number" ? clicks : 2;
      if (need <= 0) return;
      const next = [...pendingRef.current, point];
      if (next.length < need) {
        setPendingPoints(next);
        return;
      }
      commitPoints(tool, next);
    };

    const onDblClick = () => {
      const tool = activeToolRef.current;
      if (tool === "select") return;
      if (toolClicks(tool) !== "poly") return;
      if (pendingRef.current.length >= 2) commitPoints(tool, pendingRef.current);
    };

    chart.subscribeClick(onClick);
    chart.subscribeDblClick(onDblClick);

    const el = chart.chartElement();
    const onPointerDown = (e: PointerEvent) => {
      if (activeToolRef.current !== "brush" && activeToolRef.current !== "highlighter") return;
      if (e.button !== 0) return;
      brushDownRef.current = true;
      setPendingPoints([]);
    };
    const onPointerUp = () => {
      if (!brushDownRef.current) return;
      brushDownRef.current = false;
      const tool = activeToolRef.current;
      if ((tool === "brush" || tool === "highlighter") && pendingRef.current.length >= 2) {
        commitPoints(tool, pendingRef.current);
      }
    };
    el.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointerup", onPointerUp);

    const onMove = (param: MouseEventParams<Time>) => {
      if (!brushDownRef.current) return;
      const tool = activeToolRef.current;
      if (tool !== "brush" && tool !== "highlighter") return;
      const point = readPoint(series, param);
      if (!point) return;
      setPendingPoints((prev) => {
        const last = prev[prev.length - 1];
        if (last && Math.abs(last.time - point.time) < 1 && Math.abs(last.price - point.price) < 1e-12) return prev;
        return [...prev, point];
      });
    };
    chart.subscribeCrosshairMove(onMove);

    return () => {
      chart.unsubscribeClick(onClick);
      chart.unsubscribeDblClick(onDblClick);
      chart.unsubscribeCrosshairMove(onMove);
      el.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointerup", onPointerUp);
      try {
        series.detachPrimitive(primitive);
      } catch {
        /* series may already be disposed */
      }
      if (primitiveRef.current === primitive) primitiveRef.current = null;
    };
  }, [enabled, chartReadyKey, chartRef, seriesRef, commitPoints]);

  useEffect(() => {
    primitiveRef.current?.setDrawings(drawings);
  }, [drawings]);

  useEffect(() => {
    primitiveRef.current?.setPending(pendingPoints, drawColor);
  }, [pendingPoints, drawColor]);

  useEffect(() => {
    if (!enabled) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setPendingPoints([]);
        setActiveToolState("select");
        return;
      }
      if (e.key === "Enter") {
        const tool = activeToolRef.current;
        if (tool !== "select" && toolClicks(tool) === "poly" && pendingRef.current.length >= 2) {
          e.preventDefault();
          commitPoints(tool, pendingRef.current);
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [enabled, commitPoints]);

  const setActiveTool = useCallback((tool: DrawingToolId) => {
    setActiveToolState((prev) => {
      if (prev === tool && tool !== "select") {
        setPendingPoints([]);
        return "select";
      }
      setPendingPoints([]);
      return tool;
    });
  }, []);

  const undo = useCallback(() => {
    setPendingPoints([]);
    setDrawings((prev) => prev.slice(0, -1));
  }, []);

  const clearAll = useCallback(() => {
    setPendingPoints([]);
    setDrawings([]);
  }, []);

  const setMarketBars = useCallback((bars: OhlcBar[]) => {
    primitiveRef.current?.setMarketBars(bars);
  }, []);

  const setVolumeOverlay = useCallback(
    (nodes: VolumeAtPriceNode[], mode: "profile" | "footprint" | "tpo" | null) => {
      primitiveRef.current?.setVolumeOverlay(nodes, mode);
    },
    [],
  );

  const clicks = toolClicks(activeTool);
  let hint = "";
  if (activeTool !== "select") {
    if (clicks === "brush") hint = "Drag on the chart to draw · Esc cancel";
    else if (clicks === "poly") {
      hint =
        pendingPoints.length < 2
          ? `Click points (${pendingPoints.length}) · need 2+ then Enter`
          : `${pendingPoints.length} points · Enter or double-click to finish`;
    } else if (typeof clicks === "number" && clicks > 0) {
      hint = `Click ${pendingPoints.length + 1} of ${clicks}`;
    }
  }

  return {
    activeTool,
    setActiveTool,
    drawColor,
    setDrawColor,
    drawings,
    pendingPoints,
    hint,
    undo,
    clearAll,
    canUndo: drawings.length > 0 || pendingPoints.length > 0,
    annotationText,
    setAnnotationText,
    annotationGlyph,
    setAnnotationGlyph,
    setMarketBars,
    setVolumeOverlay,
  };
}
