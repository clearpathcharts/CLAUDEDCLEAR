import type { ChartDrawing, DrawingColor } from "./types";
import { DRAWING_COLORS } from "./types";

const PREFIX = "cp_drawings:";

export function drawingsStorageKey(symbol: string, timeframe: string): string {
  return `${PREFIX}${symbol.toUpperCase()}:${(timeframe || "1h").trim()}`;
}

function isPoint(v: unknown): v is { time: number; price: number } {
  return (
    !!v &&
    typeof v === "object" &&
    typeof (v as { time: unknown }).time === "number" &&
    typeof (v as { price: unknown }).price === "number" &&
    Number.isFinite((v as { time: number }).time) &&
    Number.isFinite((v as { price: number }).price)
  );
}

function isColor(v: unknown): v is DrawingColor {
  return typeof v === "string" && (DRAWING_COLORS as string[]).includes(v);
}

function sanitizeDrawing(raw: unknown): ChartDrawing | null {
  if (!raw || typeof raw !== "object") return null;
  const d = raw as Record<string, unknown>;
  if (typeof d.id !== "string" || typeof d.kind !== "string") return null;
  const color: DrawingColor = isColor(d.color) ? d.color : "#00D9FF";

  switch (d.kind) {
    case "trend":
    case "ray":
    case "fib":
    case "rectangle":
    case "arrow":
    case "gann":
      if (!isPoint(d.p1) || !isPoint(d.p2)) return null;
      return { id: d.id, kind: d.kind, p1: d.p1, p2: d.p2, color };
    case "horizontal":
      if (typeof d.price !== "number" || !Number.isFinite(d.price)) return null;
      return { id: d.id, kind: "horizontal", price: d.price, color };
    case "vertical":
      if (typeof d.time !== "number" || !Number.isFinite(d.time)) return null;
      return { id: d.id, kind: "vertical", time: d.time, color };
    case "triangle":
    case "channel":
    case "pitchfork":
      if (!isPoint(d.p1) || !isPoint(d.p2) || !isPoint(d.p3)) return null;
      return { id: d.id, kind: d.kind, p1: d.p1, p2: d.p2, p3: d.p3, color };
    case "text":
      if (!isPoint(d.point) || typeof d.text !== "string") return null;
      return {
        id: d.id,
        kind: "text",
        point: d.point,
        text: d.text.slice(0, 80),
        color,
      };
    default:
      return null;
  }
}

export function loadDrawings(symbol: string, timeframe: string): ChartDrawing[] {
  try {
    const raw = localStorage.getItem(drawingsStorageKey(symbol, timeframe));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map(sanitizeDrawing).filter((d): d is ChartDrawing => d != null);
  } catch {
    return [];
  }
}

export function saveDrawings(
  symbol: string,
  timeframe: string,
  drawings: ChartDrawing[],
): void {
  try {
    localStorage.setItem(drawingsStorageKey(symbol, timeframe), JSON.stringify(drawings));
  } catch {
    /* quota / private mode */
  }
}
