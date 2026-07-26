/** Chart drawing tools — shared model for all three toolbar layers. */

export type DrawingColor = "#00D9FF" | "#BF00FF" | "#FFD166";

export const DRAWING_COLORS: DrawingColor[] = ["#00D9FF", "#BF00FF", "#FFD166"];

export type DrawingToolId =
  | "select"
  | "trend"
  | "ray"
  | "horizontal"
  | "vertical"
  | "fib"
  | "rectangle"
  | "triangle"
  | "channel"
  | "text"
  | "arrow"
  | "pitchfork"
  | "gann";

export type ChartPoint = {
  /** UTC timestamp in seconds (lightweight-charts time). */
  time: number;
  price: number;
};

type DrawingBase = {
  id: string;
  color: DrawingColor;
};

export type ChartDrawing =
  | (DrawingBase & { kind: "trend"; p1: ChartPoint; p2: ChartPoint })
  | (DrawingBase & { kind: "ray"; p1: ChartPoint; p2: ChartPoint })
  | (DrawingBase & { kind: "horizontal"; price: number })
  | (DrawingBase & { kind: "vertical"; time: number })
  | (DrawingBase & { kind: "fib"; p1: ChartPoint; p2: ChartPoint })
  | (DrawingBase & { kind: "rectangle"; p1: ChartPoint; p2: ChartPoint })
  | (DrawingBase & { kind: "triangle"; p1: ChartPoint; p2: ChartPoint; p3: ChartPoint })
  | (DrawingBase & { kind: "channel"; p1: ChartPoint; p2: ChartPoint; p3: ChartPoint })
  | (DrawingBase & { kind: "text"; point: ChartPoint; text: string })
  | (DrawingBase & { kind: "arrow"; p1: ChartPoint; p2: ChartPoint })
  | (DrawingBase & { kind: "pitchfork"; p1: ChartPoint; p2: ChartPoint; p3: ChartPoint })
  | (DrawingBase & { kind: "gann"; p1: ChartPoint; p2: ChartPoint });

export const TOOL_CLICKS: Record<Exclude<DrawingToolId, "select">, number> = {
  trend: 2,
  ray: 2,
  horizontal: 1,
  vertical: 1,
  fib: 2,
  rectangle: 2,
  triangle: 3,
  channel: 3,
  text: 1,
  arrow: 2,
  pitchfork: 3,
  gann: 2,
};

export function newDrawingId(): string {
  return `d_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}
