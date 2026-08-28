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
} from "lucide-react";
import type { DrawingColor, DrawingToolId } from "./types";
import { DRAWING_COLORS } from "./types";

type ToolBtn = {
  id: DrawingToolId;
  label: string;
  icon: React.ReactNode;
  group: "nav" | "lines" | "shapes" | "advanced";
};

const TOOLS: ToolBtn[] = [
  { id: "select", label: "Select / pan", icon: <MousePointer2 size={13} />, group: "nav" },
  { id: "trend", label: "Trend line", icon: <TrendingUp size={13} />, group: "lines" },
  { id: "ray", label: "Ray", icon: <MoveRight size={13} />, group: "lines" },
  { id: "horizontal", label: "Horizontal line", icon: <Minus size={13} />, group: "lines" },
  { id: "vertical", label: "Vertical line", icon: <SeparatorVertical size={13} />, group: "lines" },
  { id: "fib", label: "Fibonacci", icon: <Spline size={13} />, group: "lines" },
  { id: "channel", label: "Parallel channel", icon: <Columns3 size={13} />, group: "lines" },
  { id: "rectangle", label: "Rectangle", icon: <Square size={13} />, group: "shapes" },
  { id: "ellipse", label: "Ellipse", icon: <Circle size={13} />, group: "shapes" },
  { id: "triangle", label: "Triangle", icon: <Triangle size={13} />, group: "shapes" },
  { id: "text", label: "Text note", icon: <Type size={13} />, group: "advanced" },
  { id: "arrow", label: "Arrow", icon: <ArrowUpRight size={13} />, group: "advanced" },
  { id: "measure", label: "Measure", icon: <Ruler size={13} />, group: "advanced" },
  { id: "pitchfork", label: "Pitchfork", icon: <GitFork size={13} />, group: "advanced" },
  { id: "gann", label: "Gann fan", icon: <Fan size={13} />, group: "advanced" },
];

interface ChartDrawingToolbarProps {
  activeTool: DrawingToolId;
  onToolChange: (tool: DrawingToolId) => void;
  drawColor: DrawingColor;
  onColorChange: (c: DrawingColor) => void;
  hint: string;
  canUndo: boolean;
  onUndo: () => void;
  onClear: () => void;
  className?: string;
  /** Sidebar panel under Pattern Scanner — wrap grid, always expanded. */
  variant?: "rail" | "panel";
  /** @deprecated use variant="panel" */
  forceExpanded?: boolean;
  allowedTools?: "basic" | "all";
}

function ToolButton({
  active,
  title,
  onClick,
  children,
  danger,
  wide,
}: {
  active?: boolean;
  title: string;
  onClick: () => void;
  children: React.ReactNode;
  danger?: boolean;
  wide?: boolean;
}) {
  const base = wide
    ? "flex h-8 items-center gap-1.5 rounded-md border px-2 text-[9px] font-bold uppercase tracking-wide transition-all active:scale-95"
    : "flex h-8 w-8 shrink-0 items-center justify-center rounded-md border transition-all active:scale-95";
  const tone = danger
    ? "border-red-500/30 text-red-400 hover:border-red-400/60 hover:bg-red-500/10"
    : active
      ? "border-[#00D9FF]/70 bg-[#00D9FF]/15 text-[#00D9FF]"
      : "border-[#00D9FF]/25 text-[#00D9FF] hover:border-[#00D9FF]/60 hover:bg-[#00D9FF]/10";
  return (
    <button type="button" title={title} aria-label={title} onClick={onClick} className={`${base} ${tone}`}>
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
  className = "",
  variant = "rail",
  forceExpanded = false,
  allowedTools = "all",
}: ChartDrawingToolbarProps) {
  const panel = variant === "panel" || forceExpanded;
  const tools = allowedTools === "all"
    ? TOOLS
    : TOOLS.filter((t) => t.group === "nav" || t.id === "trend" || t.id === "horizontal" || t.id === "vertical");

  if (panel) {
    return (
      <div className={`pointer-events-auto flex flex-col gap-2 ${className}`} aria-label="Chart drawing tools">
        {hint ? (
          <div className="rounded bg-[#00D9FF]/10 px-2 py-1 text-center text-[9px] font-mono uppercase tracking-wide text-[#00D9FF]">
            {hint}
          </div>
        ) : null}

        {(["nav", "lines", "shapes", "advanced"] as const).map((group) => {
          const groupTools = tools.filter((t) => t.group === group);
          if (groupTools.length === 0) return null;
          return (
          <div key={group}>
            <p className="mb-1 text-[8px] font-black uppercase tracking-widest text-zinc-500">
              {group === "nav" ? "Cursor" : group}
            </p>
            <div className="flex flex-wrap gap-1">
              {groupTools.map((t) => (
                <ToolButton
                  key={t.id}
                  active={activeTool === t.id}
                  title={t.label}
                  onClick={() => onToolChange(t.id)}
                >
                  {t.icon}
                </ToolButton>
              ))}
            </div>
          </div>
          );
        })}

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
            <ToolButton title="Undo last drawing" onClick={() => canUndo && onUndo()} danger={canUndo}>
              <Undo2 size={13} className={!canUndo ? "opacity-40" : undefined} />
            </ToolButton>
            <ToolButton title="Clear all drawings" onClick={() => canUndo && onClear()} danger>
              <Trash2 size={13} />
            </ToolButton>
          </div>
        </div>
      </div>
    );
  }

  // Compact rail fallback (unused on Charts tab — panel is the product path)
  return (
    <div
      className={`pointer-events-auto flex max-h-full flex-col items-center gap-1 overflow-y-auto overscroll-contain rounded-lg border border-white/15 bg-black/90 p-1 ${className}`}
      aria-label="Chart drawing tools"
    >
      {tools.map((t) => (
        <ToolButton
          key={t.id}
          active={activeTool === t.id}
          title={t.label}
          onClick={() => onToolChange(t.id)}
        >
          {t.icon}
        </ToolButton>
      ))}
    </div>
  );
}
