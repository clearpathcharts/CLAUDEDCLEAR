import React from "react";
import {
  MousePointer2,
  TrendingUp,
  MoveRight,
  Minus,
  SeparatorVertical,
  Spline,
  Square,
  Circle,
  Triangle,
  Columns3,
  Type,
  ArrowUpRight,
  Ruler,
  GitFork,
  Fan,
  Undo2,
  Trash2,
  Infinity as InfinityIcon,
  Crosshair,
  PenLine,
  Highlighter,
  ArrowUp,
  ArrowDown,
  Smile,
  StickyNote,
  Pin,
  MessageSquare,
  Flag,
  Hexagon,
  Waves,
  Activity,
  Box,
  CircleDot,
} from "lucide-react";
import type { DrawingColor, DrawingToolId } from "./types";
import { DRAWING_COLORS } from "./types";
import {
  CHART_EMOJIS,
  CHART_STICKERS,
  DRAWING_TOOLS,
  TOOL_GROUPS,
  type ToolGroupId,
} from "./toolCatalog";

const ICONS: Partial<Record<DrawingToolId, React.ReactNode>> = {
  select: <MousePointer2 size={13} />,
  trend: <TrendingUp size={13} />,
  ray: <MoveRight size={13} />,
  info_line: <Activity size={13} />,
  extended: <InfinityIcon size={13} />,
  trend_angle: <Spline size={13} />,
  horizontal: <Minus size={13} />,
  hray: <MoveRight size={13} />,
  vertical: <SeparatorVertical size={13} />,
  crossline: <Crosshair size={13} />,
  channel: <Columns3 size={13} />,
  regression: <Columns3 size={13} />,
  flat_channel: <Minus size={13} />,
  disjoint: <Columns3 size={13} />,
  pitchfork: <GitFork size={13} />,
  schiff: <GitFork size={13} />,
  modified_schiff: <GitFork size={13} />,
  inside_pitchfork: <GitFork size={13} />,
  fib: <Spline size={13} />,
  fib_extension: <Spline size={13} />,
  fib_channel: <Columns3 size={13} />,
  fib_timezone: <SeparatorVertical size={13} />,
  fib_fan: <Fan size={13} />,
  fib_trend_time: <SeparatorVertical size={13} />,
  fib_circles: <Circle size={13} />,
  fib_spiral: <Waves size={13} />,
  fib_arcs: <CircleDot size={13} />,
  fib_wedge: <Triangle size={13} />,
  pitchfan: <Fan size={13} />,
  gann: <Fan size={13} />,
  gann_box: <Box size={13} />,
  gann_square: <Box size={13} />,
  elliott_impulse: <Waves size={13} />,
  elliott_correction: <Waves size={13} />,
  elliott_triangle: <Waves size={13} />,
  elliott_double: <Waves size={13} />,
  elliott_triple: <Waves size={13} />,
  cyclic_lines: <SeparatorVertical size={13} />,
  time_cycles: <Waves size={13} />,
  sine: <Activity size={13} />,
  long_position: <ArrowUp size={13} />,
  short_position: <ArrowDown size={13} />,
  ghost_feed: <Activity size={13} />,
  sector: <CircleDot size={13} />,
  anchored_vwap: <TrendingUp size={13} />,
  volume_profile: <Columns3 size={13} />,
  measure: <Ruler size={13} />,
  price_range: <Ruler size={13} />,
  date_range: <Ruler size={13} />,
  brush: <PenLine size={13} />,
  highlighter: <Highlighter size={13} />,
  arrow: <ArrowUpRight size={13} />,
  arrow_up: <ArrowUp size={13} />,
  arrow_down: <ArrowDown size={13} />,
  rectangle: <Square size={13} />,
  rotated_rect: <Square size={13} />,
  path: <PenLine size={13} />,
  circle: <Circle size={13} />,
  ellipse: <Circle size={13} />,
  polyline: <PenLine size={13} />,
  triangle: <Triangle size={13} />,
  arc: <CircleDot size={13} />,
  curve: <Spline size={13} />,
  double_curve: <Waves size={13} />,
  text: <Type size={13} />,
  note: <StickyNote size={13} />,
  price_note: <StickyNote size={13} />,
  pin: <Pin size={13} />,
  callout: <MessageSquare size={13} />,
  comment: <MessageSquare size={13} />,
  price_label: <Flag size={13} />,
  flag: <Flag size={13} />,
  emoji: <Smile size={13} />,
  sticker: <Hexagon size={13} />,
};

interface ChartDrawingToolbarProps {
  activeTool: DrawingToolId;
  onToolChange: (tool: DrawingToolId) => void;
  drawColor: DrawingColor;
  onColorChange: (c: DrawingColor) => void;
  hint: string;
  canUndo: boolean;
  onUndo: () => void;
  onClear: () => void;
  annotationText: string;
  onAnnotationText: (text: string) => void;
  annotationGlyph: string;
  onAnnotationGlyph: (glyph: string) => void;
  className?: string;
  variant?: "rail" | "panel";
  forceExpanded?: boolean;
}

function ToolRow({
  active,
  title,
  onClick,
  children,
}: {
  active?: boolean;
  title: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      aria-pressed={active}
      onClick={onClick}
      className={`flex w-full items-center gap-2 rounded-md px-2 py-1 text-left text-[11px] leading-tight transition-colors ${
        active
          ? "bg-white/12 text-white"
          : "text-zinc-200 hover:bg-white/8"
      }`}
    >
      {children}
    </button>
  );
}

export function ChartDrawingToolbar({
  activeTool,
  onToolChange,
  drawColor,
  onColorChange,
  hint,
  canUndo,
  onUndo,
  onClear,
  annotationText,
  onAnnotationText,
  annotationGlyph,
  onAnnotationGlyph,
  className = "",
  variant = "rail",
  forceExpanded = false,
}: ChartDrawingToolbarProps) {
  const panel = variant === "panel" || forceExpanded;
  const showTextComposer =
    activeTool === "text" ||
    activeTool === "note" ||
    activeTool === "price_note" ||
    activeTool === "pin" ||
    activeTool === "callout" ||
    activeTool === "comment" ||
    activeTool === "price_label" ||
    activeTool === "flag";
  const showGlyphs = activeTool === "emoji" || activeTool === "sticker";

  const groups = panel
    ? TOOL_GROUPS
    : TOOL_GROUPS.filter((g) => g.id === "nav" || g.id === "lines" || g.id === "text");

  return (
    <div
      className={`pointer-events-auto flex min-h-0 flex-col gap-2 ${className}`}
      aria-label="Chart drawing tools"
      data-testid="chart-drawing-toolbar"
    >
      {hint ? (
        <div className="rounded bg-[#00D9FF]/10 px-2 py-1 text-center text-[9px] font-mono uppercase tracking-wide text-[#00D9FF]">
          {hint}
        </div>
      ) : null}

      <div className={panel ? "min-h-0 max-h-[min(58vh,34rem)] space-y-1 overflow-y-auto overscroll-contain pr-0.5" : "space-y-1"}>
        {groups.map((group) => (
          <details key={group.id} open={group.defaultOpen} className="rounded-md border border-white/5 bg-black/20">
            <summary className="cursor-pointer list-none px-2 py-1 text-[8px] font-black uppercase tracking-widest text-zinc-500 [&::-webkit-details-marker]:hidden">
              {group.label}
            </summary>
            <div className="flex flex-col pb-1">
              {DRAWING_TOOLS.filter((t) => t.group === group.id).map((t) => (
                <ToolRow
                  key={t.id}
                  active={activeTool === t.id}
                  title={t.hint}
                  onClick={() => onToolChange(t.id)}
                >
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center text-[#00D9FF]">
                    {ICONS[t.id] ?? <Spline size={13} />}
                  </span>
                  <span className="min-w-0 truncate">{t.label}</span>
                </ToolRow>
              ))}
            </div>
          </details>
        ))}
      </div>

      {showTextComposer ? (
        <label className="block space-y-1">
          <span className="text-[8px] font-black uppercase tracking-widest text-zinc-500">Label text</span>
          <textarea
            value={annotationText}
            onChange={(e) => onAnnotationText(e.target.value.slice(0, 160))}
            rows={2}
            placeholder="Write on the chart…"
            className="w-full resize-none rounded-md border border-white/15 bg-black/60 px-2 py-1.5 text-[12px] leading-snug text-zinc-100 outline-none focus:border-[#00D9FF]/60"
            style={{ fontFamily: "'IBM Plex Sans', Inter, system-ui, sans-serif" }}
          />
          <span className="block text-[9px] text-zinc-500">Type here, then click the chart to place it.</span>
        </label>
      ) : null}

      {showGlyphs ? (
        <div className="space-y-1">
          <p className="text-[8px] font-black uppercase tracking-widest text-zinc-500">
            {activeTool === "sticker" ? "Stickers" : "Emojis"} — click one, then click the chart
          </p>
          <div className="grid grid-cols-7 gap-1">
            {(activeTool === "sticker" ? CHART_STICKERS.map((s) => s.glyph) : CHART_EMOJIS).map((glyph) => (
              <button
                key={glyph}
                type="button"
                title={glyph}
                onClick={() => onAnnotationGlyph(glyph)}
                className={`flex h-8 items-center justify-center rounded-md border text-base ${
                  annotationGlyph === glyph
                    ? "border-[#00D9FF]/70 bg-[#00D9FF]/15"
                    : "border-white/10 bg-black/40 hover:border-white/25"
                }`}
              >
                {glyph}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <div className="flex items-center justify-between gap-2 border-t border-white/10 pt-2">
        <div className="flex items-center gap-1.5" aria-label="Drawing color">
          {DRAWING_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              title={`Color ${c}`}
              aria-label={`Drawing color ${c}`}
              onClick={() => onColorChange(c)}
              className={`h-4 w-4 rounded-full border-2 transition-transform active:scale-90 ${
                drawColor === c ? "scale-110 border-white" : "border-white/30"
              }`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            title="Undo last drawing"
            onClick={() => canUndo && onUndo()}
            className="flex h-8 w-8 items-center justify-center rounded-md border border-red-500/30 text-red-400 hover:bg-red-500/10"
          >
            <Undo2 size={13} className={!canUndo ? "opacity-40" : undefined} />
          </button>
          <button
            type="button"
            title="Clear all drawings"
            onClick={() => canUndo && onClear()}
            className="flex h-8 w-8 items-center justify-center rounded-md border border-red-500/30 text-red-400 hover:bg-red-500/10"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>
    </div>
  );
}

export type { ToolGroupId };
