import { useCallback, useEffect, useRef, useState, type RefObject } from "react";
import type { IChartApi, ISeriesApi, MouseEventParams, SeriesType, Time } from "lightweight-charts";
import { DrawingPrimitive } from "./DrawingPrimitive";
import { loadDrawings, saveDrawings } from "./drawingStorage";
import {
  type ChartDrawing,
  type ChartPoint,
  type DrawingColor,
  type DrawingToolId,
  TOOL_CLICKS,
  newDrawingId,
} from "./types";

function timeToNumber(time: Time): number | null {
  if (typeof time === "number" && Number.isFinite(time)) return time;
  if (time && typeof time === "object" && "year" in time) {
    const d = time as { year: number; month: number; day: number };
    return Math.floor(Date.UTC(d.year, d.month - 1, d.day) / 1000);
  }
  return null;
}

function buildDrawing(
  tool: Exclude<DrawingToolId, "select">,
  points: ChartPoint[],
  color: DrawingColor,
  text?: string,
): ChartDrawing | null {
  const id = newDrawingId();
  switch (tool) {
    case "trend":
      return { id, kind: "trend", p1: points[0], p2: points[1], color };
    case "ray":
      return { id, kind: "ray", p1: points[0], p2: points[1], color };
    case "horizontal":
      return { id, kind: "horizontal", price: points[0].price, color };
    case "vertical":
      return { id, kind: "vertical", time: points[0].time, color };
    case "fib":
      return { id, kind: "fib", p1: points[0], p2: points[1], color };
    case "rectangle":
      return { id, kind: "rectangle", p1: points[0], p2: points[1], color };
    case "triangle":
      return { id, kind: "triangle", p1: points[0], p2: points[1], p3: points[2], color };
    case "channel":
      return { id, kind: "channel", p1: points[0], p2: points[1], p3: points[2], color };
    case "text":
      return {
        id,
        kind: "text",
        point: points[0],
        text: (text || "Note").slice(0, 80),
        color,
      };
    case "arrow":
      return { id, kind: "arrow", p1: points[0], p2: points[1], color };
    case "pitchfork":
      return { id, kind: "pitchfork", p1: points[0], p2: points[1], p3: points[2], color };
    case "gann":
      return { id, kind: "gann", p1: points[0], p2: points[1], color };
    default:
      return null;
  }
}

export function useChartDrawings(opts: {
  chartRef: RefObject<IChartApi | null>;
  seriesRef: RefObject<ISeriesApi<SeriesType> | null>;
  symbol: string;
  timeframe: string;
  enabled: boolean;
  /** Bumps when chart/series is (re)created so the primitive can re-attach. */
  chartReadyKey: number;
}) {
  const { chartRef, seriesRef, symbol, timeframe, enabled, chartReadyKey } = opts;

  const [activeTool, setActiveToolState] = useState<DrawingToolId>("select");
  const [drawColor, setDrawColor] = useState<DrawingColor>("#00D9FF");
  const [drawings, setDrawings] = useState<ChartDrawing[]>([]);
  const [pendingPoints, setPendingPoints] = useState<ChartPoint[]>([]);

  const primitiveRef = useRef<DrawingPrimitive | null>(null);
  const activeToolRef = useRef(activeTool);
  const colorRef = useRef(drawColor);
  const pendingRef = useRef(pendingPoints);
  const drawingsRef = useRef(drawings);
  /** Only persist after drawings were loaded for this symbol:tf (avoids cross-symbol overwrite). */
  const loadedKeyRef = useRef("");

  activeToolRef.current = activeTool;
  colorRef.current = drawColor;
  pendingRef.current = pendingPoints;
  drawingsRef.current = drawings;

  // Load when symbol/timeframe changes
  useEffect(() => {
    if (!enabled) return;
    const key = `${symbol.toUpperCase()}:${timeframe}`;
    setDrawings(loadDrawings(symbol, timeframe));
    loadedKeyRef.current = key;
    setPendingPoints([]);
    setActiveToolState("select");
  }, [symbol, timeframe, enabled]);

  // Persist
  useEffect(() => {
    if (!enabled) return;
    const key = `${symbol.toUpperCase()}:${timeframe}`;
    if (loadedKeyRef.current !== key) return;
    saveDrawings(symbol, timeframe, drawings);
  }, [drawings, symbol, timeframe, enabled]);

  // Attach primitive + click handler when chart ready
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
      if (!param.point || param.time == null) return;

      const time = timeToNumber(param.time);
      if (time == null) return;

      const price = series.coordinateToPrice(param.point.y);
      if (price == null || !Number.isFinite(price)) return;

      const point: ChartPoint = { time, price: Number(price) };
      const need = TOOL_CLICKS[tool];
      const next = [...pendingRef.current, point];

      if (next.length < need) {
        setPendingPoints(next);
        return;
      }

      let text: string | undefined;
      if (tool === "text") {
        const entered =
          typeof window !== "undefined"
            ? window.prompt("Label text", "Note")
            : "Note";
        if (entered == null) {
          setPendingPoints([]);
          return;
        }
        text = entered.trim() || "Note";
      }

      const drawing = buildDrawing(tool, next, colorRef.current, text);
      setPendingPoints([]);
      if (drawing) {
        setDrawings((prev) => [...prev, drawing]);
      }
    };

    chart.subscribeClick(onClick);

    return () => {
      chart.unsubscribeClick(onClick);
      try {
        series.detachPrimitive(primitive);
      } catch {
        /* series may already be disposed */
      }
      if (primitiveRef.current === primitive) primitiveRef.current = null;
    };
  }, [enabled, chartReadyKey, chartRef, seriesRef]);

  // Sync drawings / pending into primitive
  useEffect(() => {
    primitiveRef.current?.setDrawings(drawings);
  }, [drawings]);

  useEffect(() => {
    primitiveRef.current?.setPending(pendingPoints, drawColor);
  }, [pendingPoints, drawColor]);

  // Escape cancels pending / returns to select
  useEffect(() => {
    if (!enabled) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setPendingPoints([]);
        setActiveToolState("select");
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [enabled]);

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

  const clicksNeeded =
    activeTool === "select" ? 0 : TOOL_CLICKS[activeTool as Exclude<DrawingToolId, "select">];
  const hint =
    activeTool !== "select" && clicksNeeded > 0
      ? pendingPoints.length >= clicksNeeded
        ? ""
        : `Click ${pendingPoints.length + 1} of ${clicksNeeded}`
      : "";

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
  };
}
