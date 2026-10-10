/** Chart drawing tools — shared model for all toolbar layers. */

export type DrawingColor = string;

/** Quick rainbow on the drawing dock — any hex still paints via the custom chip. */
export const DRAWING_COLORS: DrawingColor[] = [
  "#00D9FF",
  "#BF00FF",
  "#FFD166",
  "#FFFFFF",
  "#22C55E",
  "#EF4444",
  "#FF1493",
  "#FF6A00",
  "#FFCC00",
  "#39FF14",
  "#00FFFF",
  "#2962FF",
  "#7C4DFF",
  "#D500F9",
  "#FF1744",
  "#000000",
  "#8C8C8C",
  "#FF2D95",
  "#00E5FF",
  "#3D5AFE",
  "#A855F7",
  "#FFAB00",
  "#10B981",
  "#F43F5E",
];

export type DrawingToolId =
  | "select"
  | "trend"
  | "ray"
  | "info_line"
  | "extended"
  | "trend_angle"
  | "horizontal"
  | "hray"
  | "vertical"
  | "crossline"
  | "fib"
  | "fib_extension"
  | "fib_channel"
  | "fib_timezone"
  | "fib_fan"
  | "fib_trend_time"
  | "fib_circles"
  | "fib_spiral"
  | "fib_arcs"
  | "fib_wedge"
  | "pitchfan"
  | "rectangle"
  | "rotated_rect"
  | "ellipse"
  | "circle"
  | "triangle"
  | "channel"
  | "regression"
  | "flat_channel"
  | "disjoint"
  | "text"
  | "note"
  | "price_note"
  | "pin"
  | "callout"
  | "comment"
  | "price_label"
  | "flag"
  | "emoji"
  | "sticker"
  | "arrow"
  | "arrow_up"
  | "arrow_down"
  | "measure"
  | "price_range"
  | "date_range"
  | "pitchfork"
  | "schiff"
  | "modified_schiff"
  | "inside_pitchfork"
  | "gann"
  | "gann_box"
  | "gann_square"
  | "elliott_impulse"
  | "elliott_correction"
  | "elliott_triangle"
  | "elliott_double"
  | "elliott_triple"
  | "cyclic_lines"
  | "time_cycles"
  | "sine"
  | "long_position"
  | "short_position"
  | "ghost_feed"
  | "sector"
  | "anchored_vwap"
  | "volume_profile"
  | "brush"
  | "highlighter"
  | "path"
  | "polyline"
  | "arc"
  | "curve"
  | "double_curve";

export type ChartPoint = {
  /** UTC timestamp in seconds (lightweight-charts time). */
  time: number;
  price: number;
};

export type ChartDrawing = {
  id: string;
  kind: Exclude<DrawingToolId, "select">;
  color: DrawingColor;
  points: ChartPoint[];
  text?: string;
};

export function newDrawingId(): string {
  return `d_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}
