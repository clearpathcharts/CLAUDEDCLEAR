/** Drawing tool catalog — TradingView-style groups for the analytics toolbox. */

import type { DrawingToolId } from "./types";

export type ToolGroupId =
  | "nav"
  | "lines"
  | "channels"
  | "pitchforks"
  | "fibonacci"
  | "gann"
  | "elliott"
  | "cycles"
  | "forecast"
  | "volume"
  | "measure"
  | "brushes"
  | "arrows"
  | "shapes"
  | "text"
  | "stickers";

export type ToolClicks = number | "poly" | "brush";

export type ToolDef = {
  id: DrawingToolId;
  label: string;
  group: ToolGroupId;
  clicks: ToolClicks;
  hint: string;
};

export const TOOL_GROUPS: { id: ToolGroupId; label: string; defaultOpen?: boolean }[] = [
  { id: "nav", label: "Cursor", defaultOpen: true },
  { id: "lines", label: "Lines", defaultOpen: true },
  { id: "channels", label: "Channels" },
  { id: "pitchforks", label: "Pitchforks" },
  { id: "fibonacci", label: "Fibonacci" },
  { id: "gann", label: "Gann" },
  { id: "elliott", label: "Elliott waves" },
  { id: "cycles", label: "Cycles" },
  { id: "forecast", label: "Forecasting" },
  { id: "volume", label: "Volume" },
  { id: "measure", label: "Measurers" },
  { id: "brushes", label: "Brushes" },
  { id: "arrows", label: "Arrows" },
  { id: "shapes", label: "Shapes" },
  { id: "text", label: "Text and notes", defaultOpen: true },
  { id: "stickers", label: "Emojis and stickers", defaultOpen: true },
];

export const DRAWING_TOOLS: ToolDef[] = [
  { id: "select", label: "Select / pan", group: "nav", clicks: 0, hint: "Pan and zoom the chart" },

  { id: "trend", label: "Trendline", group: "lines", clicks: 2, hint: "Two-point trend line" },
  { id: "ray", label: "Ray", group: "lines", clicks: 2, hint: "Extends forward from the first point" },
  { id: "info_line", label: "Info line", group: "lines", clicks: 2, hint: "Trend line with price, %, bars, angle" },
  { id: "extended", label: "Extended line", group: "lines", clicks: 2, hint: "Infinite line both directions" },
  { id: "trend_angle", label: "Trend angle", group: "lines", clicks: 2, hint: "Line with degree readout" },
  { id: "horizontal", label: "Horizontal line", group: "lines", clicks: 1, hint: "Full-width price level" },
  { id: "hray", label: "Horizontal ray", group: "lines", clicks: 1, hint: "Price level from this bar forward" },
  { id: "vertical", label: "Vertical line", group: "lines", clicks: 1, hint: "Full-height time marker" },
  { id: "crossline", label: "Crossline", group: "lines", clicks: 1, hint: "Horizontal + vertical at one point" },

  { id: "channel", label: "Parallel channel", group: "channels", clicks: 3, hint: "Two parallel rays, third click sets width" },
  { id: "regression", label: "Regression trend", group: "channels", clicks: 2, hint: "Midline channel through two anchors" },
  { id: "flat_channel", label: "Flat top/bottom", group: "channels", clicks: 3, hint: "Trend plus a flat opposite rail" },
  { id: "disjoint", label: "Disjoint channel", group: "channels", clicks: 3, hint: "Two independent rails" },

  { id: "pitchfork", label: "Pitchfork", group: "pitchforks", clicks: 3, hint: "Andrews pitchfork" },
  { id: "schiff", label: "Schiff pitchfork", group: "pitchforks", clicks: 3, hint: "Origin shifted to midpoint of P1–P2" },
  { id: "modified_schiff", label: "Modified Schiff pitchfork", group: "pitchforks", clicks: 3, hint: "Half-time Schiff origin" },
  { id: "inside_pitchfork", label: "Inside pitchfork", group: "pitchforks", clicks: 3, hint: "Median from inside P1–P2" },

  { id: "fib", label: "Fib retracement", group: "fibonacci", clicks: 2, hint: "0–100% retracement with 23.6–78.6" },
  { id: "fib_extension", label: "Trend-based fib extension", group: "fibonacci", clicks: 3, hint: "ABC projection" },
  { id: "fib_channel", label: "Fib channel", group: "fibonacci", clicks: 3, hint: "Parallel fib rails" },
  { id: "fib_timezone", label: "Fib time zone", group: "fibonacci", clicks: 2, hint: "Vertical time ratios" },
  { id: "fib_fan", label: "Fib speed resistance fan", group: "fibonacci", clicks: 2, hint: "Fan from P1 through fib prices" },
  { id: "fib_trend_time", label: "Trend-based fib time", group: "fibonacci", clicks: 3, hint: "Time projections along a trend" },
  { id: "fib_circles", label: "Fib circles", group: "fibonacci", clicks: 2, hint: "Concentric circles at fib radii" },
  { id: "fib_spiral", label: "Fib spiral", group: "fibonacci", clicks: 2, hint: "Golden spiral from two points" },
  { id: "fib_arcs", label: "Fib speed resistance arcs", group: "fibonacci", clicks: 2, hint: "Arcs at fib radii" },
  { id: "fib_wedge", label: "Fib wedge", group: "fibonacci", clicks: 3, hint: "Converging rays with fib arcs" },
  { id: "pitchfan", label: "Pitchfan", group: "fibonacci", clicks: 3, hint: "Pitchfork plus fib fan" },

  { id: "gann", label: "Gann fan", group: "gann", clicks: 2, hint: "1x8 through 8x1 rays" },
  { id: "gann_box", label: "Gann box", group: "gann", clicks: 2, hint: "Price/time box with 1x1 grid" },
  { id: "gann_square", label: "Gann square", group: "gann", clicks: 2, hint: "Box with diagonals and 50% cross" },

  { id: "elliott_impulse", label: "Elliott impulse (1·2·3·4·5)", group: "elliott", clicks: 5, hint: "Five-wave motive" },
  { id: "elliott_correction", label: "Elliott correction (A·B·C)", group: "elliott", clicks: 3, hint: "Three-wave correction" },
  { id: "elliott_triangle", label: "Elliott triangle (A·B·C·D·E)", group: "elliott", clicks: 5, hint: "Contracting triangle" },
  { id: "elliott_double", label: "Elliott double combo (W·X·Y)", group: "elliott", clicks: 3, hint: "Double three" },
  { id: "elliott_triple", label: "Elliott triple combo (W·X·Y·X·Z)", group: "elliott", clicks: 5, hint: "Triple three" },

  { id: "cyclic_lines", label: "Cyclic lines", group: "cycles", clicks: 2, hint: "Equal-interval verticals" },
  { id: "time_cycles", label: "Time cycles", group: "cycles", clicks: 2, hint: "Repeating semicircle cycles" },
  { id: "sine", label: "Sine line", group: "cycles", clicks: 2, hint: "Sine wave between two anchors" },

  { id: "long_position", label: "Long position", group: "forecast", clicks: 2, hint: "Entry, take-profit, stop boxes" },
  { id: "short_position", label: "Short position", group: "forecast", clicks: 2, hint: "Short entry / TP / SL" },
  { id: "ghost_feed", label: "Ghost feed", group: "forecast", clicks: 2, hint: "Projected path from two points" },
  { id: "sector", label: "Sector", group: "forecast", clicks: 3, hint: "Circular sector from a center" },

  { id: "anchored_vwap", label: "Anchored VWAP", group: "volume", clicks: 1, hint: "VWAP from this bar using loaded volume" },
  { id: "volume_profile", label: "Fixed range volume profile", group: "volume", clicks: 2, hint: "Volume-at-price between two times" },

  { id: "measure", label: "Date and price range", group: "measure", clicks: 2, hint: "Box with Δprice and Δtime" },
  { id: "price_range", label: "Price range", group: "measure", clicks: 2, hint: "Vertical price distance" },
  { id: "date_range", label: "Date range", group: "measure", clicks: 2, hint: "Horizontal time distance" },

  { id: "brush", label: "Brush", group: "brushes", clicks: "brush", hint: "Drag to draw freehand" },
  { id: "highlighter", label: "Highlighter", group: "brushes", clicks: "brush", hint: "Wide translucent stroke" },

  { id: "arrow", label: "Arrow", group: "arrows", clicks: 2, hint: "Line with an arrowhead" },
  { id: "arrow_up", label: "Arrow mark up", group: "arrows", clicks: 1, hint: "Up marker at this bar" },
  { id: "arrow_down", label: "Arrow mark down", group: "arrows", clicks: 1, hint: "Down marker at this bar" },

  { id: "rectangle", label: "Rectangle", group: "shapes", clicks: 2, hint: "Axis-aligned box" },
  { id: "rotated_rect", label: "Rotated rectangle", group: "shapes", clicks: 3, hint: "Two-point edge, third sets width" },
  { id: "path", label: "Path", group: "shapes", clicks: "poly", hint: "Click points, Enter to finish" },
  { id: "circle", label: "Circle", group: "shapes", clicks: 2, hint: "Center and radius" },
  { id: "ellipse", label: "Ellipse", group: "shapes", clicks: 2, hint: "Bounding-box ellipse" },
  { id: "polyline", label: "Polyline", group: "shapes", clicks: "poly", hint: "Open multi-segment line" },
  { id: "triangle", label: "Triangle", group: "shapes", clicks: 3, hint: "Three-point triangle" },
  { id: "arc", label: "Arc", group: "shapes", clicks: 3, hint: "Arc through three points" },
  { id: "curve", label: "Curve", group: "shapes", clicks: 3, hint: "Quadratic bezier" },
  { id: "double_curve", label: "Double curve", group: "shapes", clicks: 4, hint: "Cubic S-curve" },

  { id: "text", label: "Text", group: "text", clicks: 1, hint: "Clean label on the chart" },
  { id: "note", label: "Note", group: "text", clicks: 1, hint: "Text in a pointed card" },
  { id: "price_note", label: "Price note", group: "text", clicks: 1, hint: "Note that shows the price" },
  { id: "pin", label: "Pin", group: "text", clicks: 1, hint: "Location pin" },
  { id: "callout", label: "Callout", group: "text", clicks: 2, hint: "Speech box pointing at a second point" },
  { id: "comment", label: "Comment", group: "text", clicks: 1, hint: "Rounded comment bubble" },
  { id: "price_label", label: "Price label", group: "text", clicks: 1, hint: "Flag with the price" },
  { id: "flag", label: "Flag mark", group: "text", clicks: 1, hint: "Pennant marker" },

  { id: "emoji", label: "Emoji", group: "stickers", clicks: 1, hint: "Place an emoji on the chart" },
  { id: "sticker", label: "Sticker", group: "stickers", clicks: 1, hint: "Place a trading sticker" },
];

export function toolDef(id: DrawingToolId): ToolDef | undefined {
  return DRAWING_TOOLS.find((t) => t.id === id);
}

export function toolClicks(id: DrawingToolId): ToolClicks {
  return toolDef(id)?.clicks ?? 2;
}

export const CHART_EMOJIS = [
  "📈", "📉", "🚀", "💥", "🔥", "💎", "⭐", "⚡", "🎯", "📌",
  "✅", "❌", "⚠️", "💡", "👀", "🐂", "🐻", "💰", "🔔", "🧭",
  "🧊", "🌙", "☀️", "💪", "🧠", "💬", "📝", "🏆",
] as const;

export const CHART_STICKERS: { glyph: string; label: string }[] = [
  { glyph: "🚀", label: "Breakout" },
  { glyph: "💎", label: "Hold" },
  { glyph: "🔥", label: "Hot" },
  { glyph: "🐂", label: "Bull" },
  { glyph: "🐻", label: "Bear" },
  { glyph: "🎯", label: "Target" },
  { glyph: "⚠️", label: "Caution" },
  { glyph: "✅", label: "Confirm" },
  { glyph: "❌", label: "Invalidate" },
  { glyph: "💰", label: "Level" },
  { glyph: "📌", label: "Pin" },
  { glyph: "⭐", label: "Watch" },
];

export const ELLIOTT_LABELS: Record<string, string[]> = {
  elliott_impulse: ["1", "2", "3", "4", "5"],
  elliott_correction: ["A", "B", "C"],
  elliott_triangle: ["A", "B", "C", "D", "E"],
  elliott_double: ["W", "X", "Y"],
  elliott_triple: ["W", "X", "Y", "X", "Z"],
};
