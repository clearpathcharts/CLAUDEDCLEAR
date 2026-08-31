"use client";

import { Pencil, Ruler } from "lucide-react";
import { ChartDrawingToolbar } from "./ChartDrawingToolbar";
import { useChartDrawingSession } from "./ChartDrawingSessionContext";

/**
 * Analytics drawing toolbox — lives under the Pattern Scanner column.
 * Never overlays the candle canvas.
 */
export function ChartDrawingToolsPanel({ compact = false }: { compact?: boolean }) {
  const session = useChartDrawingSession();

  return (
    <div
      className={`flex flex-col rounded-2xl border border-[#00D9FF]/30 bg-black/80 backdrop-blur-md font-mono shadow-[0_0_20px_rgba(0,217,255,0.1)] ${
        compact ? "min-h-0" : ""
      }`}
      data-testid="chart-drawing-tools-panel"
    >
      <div className="shrink-0 border-b border-[#00D9FF]/20 px-3 py-2.5">
        <div className="flex items-center gap-2">
          <Pencil size={14} className="text-[#00D9FF]" />
          <span className="text-xs font-black uppercase tracking-wider text-white">Drawing Tools</span>
        </div>
        <p className="mt-1 text-[10px] leading-snug text-zinc-500">
          {session
            ? `Target ${session.symbol} · ${session.timeframe.toUpperCase()} — lines, fibs, Elliott, cycles, text, emojis`
            : "Click a loaded chart (or its 5m / 10m / 15m / 30m buttons) so tools attach to that symbol"}
        </p>
      </div>

      <div className="min-h-0 overflow-y-auto p-2.5">
        {session ? (
          <ChartDrawingToolbar
            variant="panel"
            activeTool={session.activeTool}
            onToolChange={session.setActiveTool}
            drawColor={session.drawColor}
            onColorChange={session.setDrawColor}
            hint={session.hint}
            canUndo={session.canUndo}
            onUndo={session.undo}
            onClear={session.clearAll}
            annotationText={session.annotationText}
            onAnnotationText={session.setAnnotationText}
            annotationGlyph={session.annotationGlyph}
            onAnnotationGlyph={session.setAnnotationGlyph}
          />
        ) : (
          <div className="flex flex-col items-center gap-2 py-6 text-center text-[11px] text-zinc-500">
            <Ruler size={18} className="text-zinc-600" />
            <span>Search a symbol in any chart slot, then click that chart so trendlines, fibs, and shapes attach to it.</span>
          </div>
        )}
      </div>
    </div>
  );
}
