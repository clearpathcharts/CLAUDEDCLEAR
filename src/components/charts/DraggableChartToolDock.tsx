"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { GripVertical, RotateCcw, EyeOff, X } from "lucide-react";
import { useDraggablePosition, type PanelPosition } from "../../hooks/useDraggablePosition";

/** Always start on the far LEFT — never over the price scale on the right. */
const SAFE_DEFAULT: PanelPosition = { x: 8, y: 120 };

function sanitizePos(pos: PanelPosition, fallback: PanelPosition): PanelPosition {
  if (typeof window === "undefined") return pos;
  const w = window.innerWidth || 1200;
  // If a saved position lands on the right half (over candles/price scale), reset.
  if (pos.x > w * 0.35) return fallback;
  return {
    x: Math.min(w - 28, Math.max(-200, pos.x)),
    y: Math.min(window.innerHeight - 28, Math.max(0, pos.y)),
  };
}

type DraggableChartToolDockProps = {
  storageKey: string;
  children: React.ReactNode;
  label?: string;
  defaultPosition?: PanelPosition;
  onClose?: () => void;
};

/**
 * Optional floating draw-tools dock. Must stay off the candle/price-scale area.
 * Park tucks to the LEFT edge (not the right — that covers the Y-axis).
 */
export function DraggableChartToolDock({
  storageKey,
  children,
  label = "Chart tools",
  defaultPosition = SAFE_DEFAULT,
  onClose,
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

  // One-time sanitize: kick docks off the right side of the screen.
  useEffect(() => {
    if (!mounted) return;
    const safe = sanitizePos(pos, defaultPosition);
    if (safe.x !== pos.x || safe.y !== pos.y) setPos(safe);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only on mount / key
  }, [mounted, storageKey]);

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
      setPos(sanitizePos(next, defaultPosition));
    },
    [defaultPosition, setPos],
  );

  const onPointerUp = useCallback((e: React.PointerEvent) => {
    if (dragRef.current?.pointerId === e.pointerId) dragRef.current = null;
  }, []);

  const parkOffScreen = useCallback(() => {
    // Tuck LEFT — keep a grab strip; never park over the price scale.
    setPos({ x: -40, y: Math.max(80, pos.y) });
  }, [pos.y, setPos]);

  const resetPos = useCallback(() => {
    setPos(defaultPosition);
  }, [defaultPosition, setPos]);

  if (!mounted || typeof document === "undefined") return null;

  return createPortal(
    <div
      role="toolbar"
      aria-label={label}
      className="pointer-events-auto fixed z-[250] flex max-h-[min(70vh,480px)] flex-col overflow-hidden rounded-xl border border-[#00D9FF]/35 bg-black/95 shadow-[0_0_24px_rgba(0,217,255,0.25)] backdrop-blur-md"
      style={{ left: pos.x, top: pos.y }}
    >
      <div
        className="flex cursor-grab items-center gap-1 border-b border-white/10 bg-black/80 px-1.5 py-1 active:cursor-grabbing touch-none select-none"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        title="Drag tools — keep them off the chart"
      >
        <GripVertical size={14} className="shrink-0 text-[#00D9FF]" aria-hidden />
        <span className="min-w-0 flex-1 truncate text-[8px] font-black uppercase tracking-wider text-zinc-400">
          Draw
        </span>
        <button
          type="button"
          title="Park off left edge"
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
          title="Reset position"
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
        {onClose && (
          <button
            type="button"
            title="Close drawing tools"
            aria-label="Close drawing tools"
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            onPointerDown={(e) => e.stopPropagation()}
            className="rounded p-1 text-zinc-500 transition-colors hover:bg-white/10 hover:text-rose-400"
          >
            <X size={12} />
          </button>
        )}
      </div>
      <div className="flex max-h-[min(60vh,420px)] flex-col items-center gap-1 overflow-y-auto overscroll-contain p-1">
        {children}
      </div>
    </div>,
    document.body,
  );
}
