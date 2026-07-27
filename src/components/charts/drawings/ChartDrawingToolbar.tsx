import React, { useEffect, useState } from "react";
import {
  MousePointer2,
  TrendingUp,
  MoveRight,
  Minus,
  SeparatorVertical,
  Spline,
  Square,
  Triangle,
  Columns3,
  Type,
  ArrowUpRight,
  GitFork,
  Fan,
  Undo2,
  Trash2,
  Pencil,
  ChevronLeft,
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
  { id: "rectangle", label: "Rectangle", icon: <Square size={13} />, group: "shapes" },
  { id: "triangle", label: "Triangle", icon: <Triangle size={13} />, group: "shapes" },
  { id: "channel", label: "Parallel channel", icon: <Columns3 size={13} />, group: "shapes" },
  { id: "text", label: "Text note", icon: <Type size={13} />, group: "advanced" },
  { id: "arrow", label: "Arrow", icon: <ArrowUpRight size={13} />, group: "advanced" },
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
}

function ToolButton({
  active,
  title,
  onClick,
  children,
  danger,
}: {
  active?: boolean;
  title: string;
  onClick: () => void;
  children: React.ReactNode;
  danger?: boolean;
}) {
  const base =
    "flex h-8 w-8 shrink-0 items-center justify-center rounded-md border transition-all active:scale-95";
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

function GroupDivider() {
  return <div className="my-0.5 h-px w-full bg-white/10" aria-hidden />;
}

function useIsNarrow(): boolean {
  const [narrow, setNarrow] = useState(() =>
    typeof window !== "undefined" ? window.matchMedia("(max-width: 767px)").matches : false,
  );
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const apply = () => setNarrow(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);
  return narrow;
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
}: ChartDrawingToolbarProps) {
  const isNarrow = useIsNarrow();
  /** Always start collapsed — a left-rail pencil keeps the candle area clear. */
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (isNarrow) setExpanded(false);
  }, [isNarrow]);

  const renderGroup = (group: ToolBtn["group"]) =>
    TOOLS.filter((t) => t.group === group).map((t) => (
      <ToolButton
        key={t.id}
        active={activeTool === t.id}
        title={t.label}
        onClick={() => onToolChange(t.id)}
      >
        {t.icon}
      </ToolButton>
    ));

  const drawingActive = activeTool !== "select";

  if (!expanded) {
    return (
      <div className={`pointer-events-auto flex flex-col items-center gap-1 ${className}`}>
        {hint ? (
          <div className="max-w-[72px] rounded bg-black/80 px-1 py-0.5 text-center text-[8px] font-mono uppercase leading-tight tracking-wide text-[#00D9FF]">
            {hint}
          </div>
        ) : null}
        <button
          type="button"
          title="Drawing tools"
          aria-label="Open drawing tools"
          aria-expanded={false}
          onClick={() => setExpanded(true)}
          className={`flex h-9 w-9 items-center justify-center rounded-lg border bg-black/85 shadow-lg backdrop-blur-md transition-all active:scale-95 ${
            drawingActive
              ? "border-[#00D9FF] text-[#00D9FF] shadow-[0_0_12px_rgba(0,217,255,0.35)]"
              : "border-white/15 text-[#00D9FF] hover:border-[#00D9FF]/60"
          }`}
        >
          <Pencil size={14} strokeWidth={2.5} />
        </button>
      </div>
    );
  }

  return (
    <div
      className={`pointer-events-auto flex max-h-full flex-col items-center gap-1 overflow-y-auto overscroll-contain rounded-lg border border-white/15 bg-black/90 p-1 ${className}`}
      aria-label="Chart drawing tools"
    >
      <ToolButton title="Collapse drawing tools" onClick={() => setExpanded(false)}>
        <ChevronLeft size={13} />
      </ToolButton>

      {hint ? (
        <div className="mb-0.5 max-w-[72px] px-0.5 text-center text-[8px] font-mono uppercase leading-tight tracking-wide text-[#00D9FF]/90">
          {hint}
        </div>
      ) : null}

      {renderGroup("nav")}
      <GroupDivider />
      {renderGroup("lines")}
      <GroupDivider />
      {renderGroup("shapes")}
      <GroupDivider />
      {renderGroup("advanced")}
      <GroupDivider />

      <div className="flex flex-col gap-1 py-0.5" aria-label="Drawing color">
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

      <GroupDivider />
      <ToolButton
        title="Undo last drawing"
        onClick={() => {
          if (canUndo) onUndo();
        }}
        danger={canUndo}
      >
        <Undo2 size={13} className={!canUndo ? "opacity-40" : undefined} />
      </ToolButton>
      <ToolButton
        title="Clear all drawings"
        onClick={() => {
          if (canUndo) onClear();
        }}
        danger
      >
        <Trash2 size={13} />
      </ToolButton>
    </div>
  );
}
