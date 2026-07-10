"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo } from "react";
import { Activity, Pin, X } from "lucide-react";
import { LightweightCandles } from "../charts/LightweightCandles";
import { ChartSymbolSearch } from "../charts/ChartSymbolSearch";
import { DraggableChartPanel } from "../charts/DraggableChartPanel";
import { resolveMarketAsset } from "../../constants/marketAssets";
import {
  createEmptyYwcSlots,
  YWC_CHART_ANCHORS,
  YWC_CHART_HEIGHT,
  YWC_CHART_SLOT_COUNT,
  YWC_CHART_WIDTH,
  type YwcChartAnchor,
  type YwcChartSlot,
} from "../../constants/chartLayout";
import { usePersistedLayout } from "../../hooks/useDraggablePosition";
import { YwcLavaPanel, YwcSectionTitle } from "./YwcLavaPanel";

const STORAGE_KEY = "cpt-ywc-live-chart-layout";

type YwcChartContextValue = {
  slots: YwcChartSlot[];
  updateSlot: (index: number, patch: Partial<YwcChartSlot>) => void;
  clearSlot: (index: number) => void;
  moveSlotToAnchor: (index: number, anchor: YwcChartAnchor) => void;
};

const YwcChartContext = createContext<YwcChartContextValue | null>(null);

function useYwcCharts() {
  const ctx = useContext(YwcChartContext);
  if (!ctx) throw new Error("Ywc chart components must be used inside YwcChartWorkspace");
  return ctx;
}

function loadYwcSlots(): YwcChartSlot[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length === YWC_CHART_SLOT_COUNT) {
        return parsed.map((slot: Partial<YwcChartSlot>, i: number) => ({
          symbol: slot.symbol ?? null,
          anchor: isYwcAnchor(slot.anchor) ? slot.anchor : "sidebar",
          dockOrder: typeof slot.dockOrder === "number" ? slot.dockOrder : i,
          x: typeof slot.x === "number" ? slot.x : 24,
          y: typeof slot.y === "number" ? slot.y : 120 + i * 48,
        }));
      }
      // Legacy { symbol, x, y } without anchor — was fixed overlay; migrate to float
      if (Array.isArray(parsed) && parsed[0] && "x" in parsed[0] && !("anchor" in parsed[0])) {
        return parsed.map((slot: { symbol?: string | null; x?: number; y?: number }, i: number) => ({
          symbol: slot.symbol ?? null,
          anchor: "sidebar" as YwcChartAnchor,
          dockOrder: i,
          x: typeof slot.x === "number" ? slot.x : 24,
          y: typeof slot.y === "number" ? slot.y : 120,
        }));
      }
    }
    const legacy = localStorage.getItem("cpt-ywc-live-chart-slots");
    if (legacy) {
      const parsed = JSON.parse(legacy);
      const defaults = createEmptyYwcSlots();
      if (Array.isArray(parsed)) {
        return defaults.map((slot, i) => ({
          ...slot,
          symbol: parsed[i]?.value ?? null,
        }));
      }
    }
  } catch {
    /* ignore */
  }
  return createEmptyYwcSlots();
}

function isYwcAnchor(value: unknown): value is YwcChartAnchor {
  return value === "sidebar" || value === "main-top" || value === "main-mid" || value === "float";
}

function nextDockOrder(slots: YwcChartSlot[], anchor: YwcChartAnchor): number {
  const used = slots.filter((s) => s.anchor === anchor).map((s) => s.dockOrder);
  for (let i = 0; i < YWC_CHART_SLOT_COUNT; i++) {
    if (!used.includes(i)) return i;
  }
  return 0;
}

function YwcChartSlotPanel({
  slotIndex,
  slot,
  docked = false,
}: {
  slotIndex: number;
  slot: YwcChartSlot;
  docked?: boolean;
}) {
  const { updateSlot, clearSlot, moveSlotToAnchor } = useYwcCharts();

  const header = (
    <div className="flex flex-col gap-1.5 min-w-0 w-full">
      <div className="flex items-center gap-1 min-w-0">
        <ChartSymbolSearch
          compact
          placeholder="Search your chart…"
          activeSymbol={slot.symbol}
          onSubmit={(sym) => updateSlot(slotIndex, { symbol: resolveMarketAsset(sym).value })}
        />
        {slot.symbol && (
          <button
            type="button"
            onClick={() => clearSlot(slotIndex)}
            className="p-1 rounded text-zinc-600 hover:text-rose-400 transition-colors shrink-0"
            aria-label="Clear chart slot"
          >
            <X size={12} />
          </button>
        )}
      </div>
      <div className="flex flex-wrap gap-1">
        {YWC_CHART_ANCHORS.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            onClick={() => moveSlotToAnchor(slotIndex, id)}
            className={`px-1.5 py-0.5 rounded text-[8px] font-mono uppercase tracking-wide border transition-colors ${
              slot.anchor === id
                ? "border-[#00E5FF]/50 bg-[#00E5FF]/10 text-[#00E5FF]"
                : "border-white/10 text-zinc-500 hover:border-white/25 hover:text-zinc-300"
            }`}
            title={`Place chart in: ${label}`}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );

  const body = slot.symbol ? (
    <div className="h-[168px] relative">
      <LightweightCandles profileId="calm_focus" symbol={slot.symbol} timeframe="1h" height={168} embedMode />
    </div>
  ) : (
    <div className="h-[168px] flex flex-col items-center justify-center gap-2 px-4 text-center border-t border-dashed border-[#FF1493]/20 bg-zinc-950/80">
      <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">
        Empty chart slot {slotIndex + 1}
      </span>
      <span className="text-[9px] text-zinc-600 leading-relaxed">
        Search a symbol, then pick where this panel lives on the page
      </span>
    </div>
  );

  if (docked) {
    return (
      <DraggableChartPanel
        mode="static"
        draggable={false}
        position={{ x: 0, y: 0 }}
        onPositionChange={() => {}}
        width="100%"
        header={header}
      >
        {body}
      </DraggableChartPanel>
    );
  }

  return (
    <DraggableChartPanel
      mode="absolute"
      position={{ x: slot.x, y: slot.y }}
      onPositionChange={(pos) => updateSlot(slotIndex, pos)}
      width={YWC_CHART_WIDTH}
      zIndex={50 + slotIndex}
      header={header}
    >
      {body}
    </DraggableChartPanel>
  );
}

/** Wrap the YWC page — provides chart slot state and the floating layer. */
export function YwcChartWorkspace({ children }: { children: React.ReactNode }) {
  const [slots, saveSlots] = usePersistedLayout<YwcChartSlot[]>(STORAGE_KEY, loadYwcSlots);

  useEffect(() => {
    saveSlots(slots);
  }, [slots, saveSlots]);

  const updateSlot = useCallback(
    (index: number, patch: Partial<YwcChartSlot>) => {
      saveSlots((prev) => prev.map((slot, i) => (i === index ? { ...slot, ...patch } : slot)));
    },
    [saveSlots]
  );

  const clearSlot = useCallback(
    (index: number) => updateSlot(index, { symbol: null }),
    [updateSlot]
  );

  const moveSlotToAnchor = useCallback(
    (index: number, anchor: YwcChartAnchor) => {
      saveSlots((prev) => {
        const order = nextDockOrder(
          prev.filter((_, i) => i !== index),
          anchor
        );
        return prev.map((slot, i) =>
          i === index
            ? {
                ...slot,
                anchor,
                dockOrder: anchor === "float" ? slot.dockOrder : order,
              }
            : slot
        );
      });
    },
    [saveSlots]
  );

  const value = useMemo(
    () => ({ slots, updateSlot, clearSlot, moveSlotToAnchor }),
    [slots, updateSlot, clearSlot, moveSlotToAnchor]
  );

  return (
    <YwcChartContext.Provider value={value}>
      {children}
    </YwcChartContext.Provider>
  );
}

/** Place at the end of #ywc-page-canvas so free-float charts drag within the page. */
export function YwcChartFloatLayer() {
  const { slots } = useYwcCharts();

  const floatSlots = slots
    .map((slot, index) => ({ slot, index }))
    .filter(({ slot }) => slot.anchor === "float");

  if (floatSlots.length === 0) return null;

  return (
    <div className="pointer-events-none absolute inset-0 z-40 overflow-visible">
      {floatSlots.map(({ slot, index }) => (
        <div key={`ywc-float-${index}`} className="pointer-events-auto">
          <YwcChartSlotPanel slotIndex={index} slot={slot} />
        </div>
      ))}
    </div>
  );
}

/** Dock charts into a bento region on the page (in document flow — does not cover media). */
export function YwcChartDock({ anchor }: { anchor: Exclude<YwcChartAnchor, "float"> }) {
  const { slots } = useYwcCharts();
  const docked = slots
    .map((slot, index) => ({ slot, index }))
    .filter(({ slot }) => slot.anchor === anchor)
    .sort((a, b) => a.slot.dockOrder - b.slot.dockOrder);

  if (docked.length === 0) return null;

  return (
    <YwcLavaPanel className="space-y-3">
      <div className="flex items-center gap-2">
        <Pin size={14} className="text-[#FF1493] shrink-0" />
        <YwcSectionTitle className="text-[10px] tracking-widest">
          YOUR CHARTS — {anchor === "sidebar" ? "SIDEBAR" : anchor === "main-top" ? "MAIN TOP" : "MAIN MID"}
        </YwcSectionTitle>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {docked.map(({ slot, index }) => (
          <YwcChartSlotPanel key={`ywc-dock-${index}`} slotIndex={index} slot={slot} docked />
        ))}
      </div>
    </YwcLavaPanel>
  );
}

/** Page-level header explaining chart placement (once per page). */
export function YwcChartPlacementHeader() {
  return (
    <YwcLavaPanel className="space-y-2">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div className="flex items-center gap-2">
          <Activity size={16} className="text-[#00E5FF] drop-shadow-[0_0_8px_#00E5FF]" />
          <YwcSectionTitle className="text-xs tracking-widest">
            ADD YOUR FAVORITE CHARTS TO YWC
          </YwcSectionTitle>
        </div>
        <p className="text-[10px] font-mono text-zinc-400 max-w-xl leading-relaxed">
          Each slot docks into a bento box on this page (sidebar, main column, or free-float). Use the
          placement buttons on any chart to move it — nothing covers your media unless you choose Free float.
        </p>
      </div>
    </YwcLavaPanel>
  );
}

/** @deprecated Use YwcChartWorkspace + YwcChartDock instead. Kept for import stability. */
export function YwcLiveChartBento() {
  return (
    <>
      <YwcChartPlacementHeader />
      <YwcChartDock anchor="sidebar" />
    </>
  );
}
