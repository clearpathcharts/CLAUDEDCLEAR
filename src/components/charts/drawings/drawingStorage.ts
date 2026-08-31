import type { ChartDrawing, ChartPoint, DrawingColor } from "./types";
import { DRAWING_COLORS } from "./types";
import { DRAWING_TOOLS } from "./toolCatalog";

const PREFIX = "cp_drawings:";
const KIND_SET = new Set(DRAWING_TOOLS.map((t) => t.id).filter((id) => id !== "select"));

export function drawingsStorageKey(symbol: string, timeframe: string): string {
  return `${PREFIX}${symbol.toUpperCase()}:${(timeframe || "1h").trim()}`;
}

function isPoint(v: unknown): v is ChartPoint {
  return (
    !!v &&
    typeof v === "object" &&
    typeof (v as { time: unknown }).time === "number" &&
    typeof (v as { price: unknown }).price === "number" &&
    Number.isFinite((v as ChartPoint).time) &&
    Number.isFinite((v as ChartPoint).price)
  );
}

function isColor(v: unknown): v is DrawingColor {
  return typeof v === "string" && (DRAWING_COLORS as string[]).includes(v);
}

function collectPoints(d: Record<string, unknown>): ChartPoint[] {
  if (Array.isArray(d.points)) {
    return d.points.filter(isPoint);
  }
  const pts: ChartPoint[] = [];
  if (isPoint(d.p1)) pts.push(d.p1);
  if (isPoint(d.p2)) pts.push(d.p2);
  if (isPoint(d.p3)) pts.push(d.p3);
  if (isPoint(d.point)) pts.push(d.point);
  if (pts.length === 0 && typeof d.price === "number" && Number.isFinite(d.price)) {
    pts.push({ time: typeof d.time === "number" && Number.isFinite(d.time) ? d.time : 0, price: d.price });
  } else if (pts.length === 0 && typeof d.time === "number" && Number.isFinite(d.time)) {
    pts.push({ time: d.time, price: 0 });
  }
  return pts;
}

const LEGACY_KIND: Record<string, ChartDrawing["kind"]> = {
  trend: "trend",
  ray: "ray",
  fib: "fib",
  rectangle: "rectangle",
  ellipse: "ellipse",
  arrow: "arrow",
  measure: "measure",
  gann: "gann",
  horizontal: "horizontal",
  vertical: "vertical",
  triangle: "triangle",
  channel: "channel",
  pitchfork: "pitchfork",
  text: "text",
};

function sanitizeDrawing(raw: unknown): ChartDrawing | null {
  if (!raw || typeof raw !== "object") return null;
  const d = raw as Record<string, unknown>;
  if (typeof d.id !== "string" || typeof d.kind !== "string") return null;
  const mapped = LEGACY_KIND[d.kind] ?? (KIND_SET.has(d.kind as ChartDrawing["kind"]) ? (d.kind as ChartDrawing["kind"]) : null);
  if (!mapped) return null;
  const color: DrawingColor = isColor(d.color) ? d.color : "#00D9FF";
  const points = collectPoints(d);
  if (points.length === 0) return null;
  const text = typeof d.text === "string" ? d.text.slice(0, 160) : undefined;
  return { id: d.id, kind: mapped, color, points, text };
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

export { sanitizeDrawing };
