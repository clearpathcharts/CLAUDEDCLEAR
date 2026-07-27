"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { GripVertical, RotateCcw, EyeOff } from "lucide-react";
import { useDraggablePosition, type PanelPosition } from "../../hooks/useDraggablePosition";

const DEFAULT_POS: PanelPosition = { x: 12, y: 140 };

type DraggableChartToolDockProps = {
  /** Unique localStorage key (e.g. per symbol). */
  storageKey: string;
  children: React.ReactNode;
  label?: string;
  defaultPosition?: PanelPosition;
};

/**
 * Floating viewport dock for chart tools — drag anywhere, including off the chart
 * or to the screen edge so candles stay clear.
 */
export function DraggableChartToolDock({
  storageKey,
  children,
  label = "Chart tools",
  defaultPosition = DEFAULT_POS,
}: DraggableChartToolDockProps) {
  const [mounted, setMounted] = useState(false);
  const [pos, setPos] = useDraggablePosition(storageKey, defaultPosition);
  const dragRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    origX: number;
    origY: number;
  } | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (e.button !== 0) return;
      e.preventDefault();
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      dragRef.current = {
        pointerId: e.pointerId,
        startX: e.clientX,
        startY: e.clientY,
        origX: pos.x,
        origY: pos.y,
      };
    },
    [pos.x, pos.y],
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      const d = dragRef.current;
      if (!d || d.pointerId !== e.pointerId) return;
      const next = {
        x: d.origX + (e.clientX - d.startX),
        y: d.origY + (e.clientY - d.startY),
      };
      // Allow parking mostly off-screen; keep a 24px grab strip visible.
      const maxX = typeof window !== "undefined" ? window.innerWidth - 28 : next.x;
      const maxY = typeof window !== "undefined" ? window.innerHeight - 28 : next.y;
      setPos({
        x: Math.min(maxX, Math.max(-200, next.x)),
        y: Math.min(maxY, Math.max(0, next.y)),
      });
    },
    [setPos],
  );

  const onPointerUp = useCallback((e: React.PointerEvent) => {
    if (dragRef.current?.pointerId === e.pointerId) {
      dragRef.current = null;
    }
  }, []);

  const parkOffScreen = useCallback(() => {
    if (typeof window === "undefined") return;
    // Tuck to the far right edge — only the drag handle peeks in.
    setPos({ x: window.innerWidth - 36, y: Math.max(80, pos.y) });
  }, [pos.y, setPos]);

  const resetPos = useCallback(() => {
    setPos(defaultPosition);
  }, [defaultPosition, setPos]);

  if (!mounted || typeof document === "undefined") return null;

  return createPortal(
    <div
      role="toolbar"
      aria-label={label}
      className="pointer-events-auto fixed z-[250] flex max-h-[min(80vh,560px)] flex-col overflow-hidden rounded-xl border border-[#00D9FF]/35 bg-black/95 shadow-[0_0_24px_rgba(0,217,255,0.2)] backdrop-blur-md"
      style={{ left: pos.x, top: pos.y }}
    >
      <div
        className="flex cursor-grab items-center gap-1 border-b border-white/10 bg-black/80 px-1.5 py-1 active:cursor-grabbing touch-none select-none"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        title="Drag to move tools off the chart"
      >
        <GripVertical size={14} className="shrink-0 text-[#00D9FF]" aria-hidden />
        <span className="min-w-0 flex-1 truncate text-[8px] font-black uppercase tracking-wider text-zinc-400">
          Drag
        </span>
        <button
          type="button"
          title="Park tools off the right edge"
          aria-label="Park tools off screen"
          onClick={(e) => {
            e.stopPropagation();
            parkOffScreen();
          }}
          onPointerDown={(e) => e.stopPropagation()}
          className="rounded p-1 text-zinc-500 transition-colors hover:bg-white/10 hover:text-[#00D9FF]"
        >
          <EyeOff size={12} />
        </button>
        <button
          type="button"
          title="Reset tool position"
          aria-label="Reset tool position"
          onClick={(e) => {
            e.stopPropagation();
            resetPos();
          }}
          onPointerDown={(e) => e.stopPropagation()}
          className="rounded p-1 text-zinc-500 transition-colors hover:bg-white/10 hover:text-[#BF00FF]"
        >
          <RotateCcw size={12} />
        </button>
      </div>
      <div className="flex max-h-[min(70vh,500px)] flex-col items-center gap-1 overflow-y-auto overscroll-contain p-1">
        {children}
      </div>
    </div>,
    document.body,
  );
}
