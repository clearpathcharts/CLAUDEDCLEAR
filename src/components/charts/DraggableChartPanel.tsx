"use client";

import React from "react";
import { motion, useDragControls } from "motion/react";
import { GripVertical } from "lucide-react";
import type { PanelPosition } from "../../hooks/useDraggablePosition";

interface DraggableChartPanelProps {
  position: PanelPosition;
  onPositionChange: (next: PanelPosition) => void;
  /** fixed = viewport overlay; absolute = within a positioned parent; static = in document flow */
  mode?: "fixed" | "absolute" | "static";
  width?: number | string;
  zIndex?: number;
  children: React.ReactNode;
  header: React.ReactNode;
  className?: string;
  /** When false, panel is in-flow only (no drag transform). */
  draggable?: boolean;
}

export function DraggableChartPanel({
  position,
  onPositionChange,
  mode = "absolute",
  width = "100%",
  zIndex = 10,
  children,
  header,
  className = "",
  draggable = true,
}: DraggableChartPanelProps) {
  const dragControls = useDragControls();
  const isStatic = mode === "static" || !draggable;

  if (isStatic) {
    return (
      <div
        style={{ width }}
        className={`rounded-2xl border border-white/10 bg-black/90 shadow-2xl backdrop-blur-md overflow-hidden flex flex-col ${className}`}
      >
        <div className="flex items-center gap-2 px-3 py-2 border-b border-white/10 bg-black/50 select-none">
          <GripVertical size={14} className="text-zinc-700 shrink-0" aria-hidden />
          <div className="flex-1 min-w-0">{header}</div>
        </div>
        <div className="flex-1 min-h-0">{children}</div>
      </div>
    );
  }

  return (
    <motion.div
      drag
      dragListener={false}
      dragControls={dragControls}
      dragMomentum={false}
      dragElastic={0.05}
      animate={{ x: position.x, y: position.y }}
      transition={{ type: false }}
      style={{
        position: mode,
        left: 0,
        top: 0,
        width,
        zIndex,
        touchAction: "none",
      }}
      onDragEnd={(_, info) => {
        onPositionChange({
          x: Math.max(0, position.x + info.offset.x),
          y: Math.max(0, position.y + info.offset.y),
        });
      }}
      className={`rounded-2xl border border-white/10 bg-black/90 shadow-2xl backdrop-blur-md overflow-hidden flex flex-col ${className}`}
    >
      <div
        className="flex items-center gap-2 px-3 py-2 border-b border-white/10 bg-black/50 cursor-grab active:cursor-grabbing select-none touch-none"
        onPointerDown={(e) => dragControls.start(e)}
      >
        <GripVertical size={14} className="text-zinc-500 shrink-0" aria-hidden />
        <span className="text-[8px] font-mono text-zinc-600 uppercase tracking-widest shrink-0 hidden sm:inline">
          Drag to move
        </span>
        <div className="flex-1 min-w-0">{header}</div>
      </div>
      <div className="flex-1 min-h-0">{children}</div>
    </motion.div>
  );
}
