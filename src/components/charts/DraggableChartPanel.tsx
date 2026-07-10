"use client";

import React from "react";
import { motion, useDragControls } from "motion/react";
import { GripVertical } from "lucide-react";
import type { PanelPosition } from "../../hooks/useDraggablePosition";

interface DraggableChartPanelProps {
  position: PanelPosition;
  onPositionChange: (next: PanelPosition) => void;
  /** fixed = floats over page (YWC); absolute = within a scroll canvas (Markets) */
  mode?: "fixed" | "absolute";
  width?: number | string;
  zIndex?: number;
  children: React.ReactNode;
  header: React.ReactNode;
  className?: string;
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
}: DraggableChartPanelProps) {
  const dragControls = useDragControls();

  return (
    <motion.div
      drag
      dragListener={false}
      dragControls={dragControls}
      dragMomentum={false}
      dragElastic={0.08}
      style={{
        position: mode,
        left: 0,
        top: 0,
        x: position.x,
        y: position.y,
        width,
        zIndex,
        touchAction: "none",
      }}
      onDragEnd={(_, info) => {
        onPositionChange({
          x: position.x + info.offset.x,
          y: position.y + info.offset.y,
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
