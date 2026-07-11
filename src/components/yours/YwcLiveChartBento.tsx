"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo } from "react";
import { Activity, ChevronDown, ChevronUp, Pin, X } from "lucide-react";
import { LightweightCandles } from "../charts/LightweightCandles";
import { ChartSymbolSearch } from "../charts/ChartSymbolSearch";
import { DraggableChartPanel } from "../charts/DraggableChartPanel";
import { resolveMarketAsset } from "../../constants/marketAssets";
import {
  createEmptyYwcSlots,
  YWC_CHART_SLOT_COUNT,
  YWC_LAYOUT_STORAGE_VERSION,
  type YwcChartSlot,
} from "../../constants/chartLayout";
import { usePersistedLayout } from "../../hooks/useDraggablePosition";
import { YwcLavaPanel, YwcSectionTitle } from "./YwcLavaPanel";

const STORAGE_KEY = "cpt-ywc-live-chart-layout";
const VERSION_KEY = "cpt-ywc-live-chart-layout-version";

type YwcChartContextValue = {
  slots: YwcChartSlot[];
  updateSlot: (index: number, patch: Partial<YwcChartSlot>) => void;
  clearSlot: (index: number) => void;
  moveSlot: (index: number, direction: "up" | "down") => void;
  dockAllToSidebar: () => void;
};

const YwcChartContext = createContext<YwcChartContextValue | null>(null);

function useYwcCharts() {
  const ctx = useContext(YwcChartContext);
  if (!ctx) throw new Error("Ywc chart components must be used inside YwcChartWorkspace");
  return ctx;
}

/** Force every slot into the sidebar bento — never viewport overlays. */
function normalizeSlots(raw: unknown): YwcChartSlot[] {
  const defaults = createEmptyYwcSlots();
  if (!Array.isArray(raw) || raw.length !== YWC_CHART_SLOT_COUNT) {
    return defaults;
  }
  return raw.map((slot: Partial<YwcChartSlot>, i: number) => ({
    symbol: slot?.symbol ?? null,
    anchor: "sidebar" as const,
    dockOrder: typeof slot?.dockOrder === "number" ? slot.dockOrder : i,
    x: 0,
    y: 0,
  }));
}

function loadYwcSlots(): YwcChartSlot[] {
  try {
    const version = parseInt(localStorage.getItem(VERSION_KEY) || "0", 10);
    const raw = localStorage.getItem(STORAGE_KEY);

    if (version < YWC_LAYOUT_STORAGE_VERSION) {
      let migrated = createEmptyYwcSlots();
      if (raw) {
        try {
          migrated = normalizeSlots(JSON.parse(raw));
        } catch {
          /* use defaults */
        }
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
      localStorage.setItem(VERSION_KEY, String(YWC_LAYOUT_STORAGE_VERSION));
      return migrated;
    }

    if (raw) {
      return normalizeSlots(JSON.parse(raw));
    }
  } catch {
    /* ignore */
  }
  const fresh = createEmptyYwcSlots();
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh));
    localStorage.setItem(VERSION_KEY, String(YWC_LAYOUT_STORAGE_VERSION));
  } catch {
    /* ignore */
  }
  return fresh;
}

function YwcChartSlotPanel({
  slotIndex,
  slot,
  isFirst,
  isLast,
}: {
  slotIndex: number;
  slot: YwcChartSlot;
  isFirst: boolean;
  isLast: boolean;
}) {
  const { updateSlot, clearSlot, moveSlot } = useYwcCharts();

  const header = (
    <div className="flex items-center gap-1 min-w-0 w-full">
      <div className="flex flex-col shrink-0 gap-0.5">
        <button
          type="button"
          disabled={isFirst}
          onClick={() => moveSlot(slotIndex, "up")}
          className="p-0.5 rounded text-zinc-600 hover:text-cyan-400 disabled:opacity-20"
          aria-label="Move chart up"
        >
          <ChevronUp size={12} />
        </button>
        <button
          type="button"
          disabled={isLast}
          onClick={() => moveSlot(slotIndex, "down")}
          className="p-0.5 rounded text-zinc-600 hover:text-cyan-400 disabled:opacity-20"
          aria-label="Move chart down"
        >
          <ChevronDown size={12} />
        </button>
      </div>
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
        Search any symbol above — EURUSD, AAPL, your pick
      </span>
    </div>
  );

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

export function YwcChartWorkspace({ children }: { children: React.ReactNode }) {
  const [slots, saveSlots] = usePersistedLayout<YwcChartSlot[]>(STORAGE_KEY, loadYwcSlots);

  useEffect(() => {
    saveSlots(slots);
    try {
      localStorage.setItem(VERSION_KEY, String(YWC_LAYOUT_STORAGE_VERSION));
    } catch {
      /* ignore */
    }
  }, [slots, saveSlots]);

  const updateSlot = useCallback(
    (index: number, patch: Partial<YwcChartSlot>) => {
      saveSlots((prev) => prev.map((slot, i) => (i === index ? { ...slot, ...patch, anchor: "sidebar" } : slot)));
    },
    [saveSlots]
  );

  const clearSlot = useCallback((index: number) => updateSlot(index, { symbol: null }), [updateSlot]);

  const dockAllToSidebar = useCallback(() => {
    saveSlots((prev) =>
      prev.map((slot, i) => ({
        ...slot,
        anchor: "sidebar" as const,
        dockOrder: i,
        x: 0,
        y: 0,
      }))
    );
  }, [saveSlots]);

  const moveSlot = useCallback(
    (index: number, direction: "up" | "down") => {
      saveSlots((prev) => {
        const sorted = [...prev]
          .map((slot, i) => ({ slot, index: i }))
          .sort((a, b) => a.slot.dockOrder - b.slot.dockOrder);
        const pos = sorted.findIndex((x) => x.index === index);
        if (pos < 0) return prev;
        const swap = direction === "up" ? pos - 1 : pos + 1;
        if (swap < 0 || swap >= sorted.length) return prev;
        const next = [...prev];
        const orderA = sorted[pos].slot.dockOrder;
        const orderB = sorted[swap].slot.dockOrder;
        next[sorted[pos].index] = { ...next[sorted[pos].index], dockOrder: orderB };
        next[sorted[swap].index] = { ...next[sorted[swap].index], dockOrder: orderA };
        return next;
      });
    },
    [saveSlots]
  );

  const value = useMemo(
    () => ({ slots, updateSlot, clearSlot, moveSlot, dockAllToSidebar }),
    [slots, updateSlot, clearSlot, moveSlot, dockAllToSidebar]
  );

  return <YwcChartContext.Provider value={value}>{children}</YwcChartContext.Provider>;
}

/** Sidebar bento only — in document flow, never overlays the page. */
export function YwcChartDock() {
  const { slots } = useYwcCharts();
  const docked = slots
    .map((slot, index) => ({ slot, index }))
    .sort((a, b) => a.slot.dockOrder - b.slot.dockOrder);

  return (
    <YwcLavaPanel className="space-y-3">
      <div className="flex items-center gap-2">
        <Pin size={14} className="text-[#FF1493] shrink-0" />
        <YwcSectionTitle className="text-[10px] tracking-widest">YOUR LIVE CHARTS</YwcSectionTitle>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {docked.map(({ slot, index }, i) => (
          <YwcChartSlotPanel
            key={`ywc-dock-${index}`}
            slotIndex={index}
            slot={slot}
            isFirst={i === 0}
            isLast={i === docked.length - 1}
          />
        ))}
      </div>
    </YwcLavaPanel>
  );
}

export function YwcChartPlacementHeader() {
  const { dockAllToSidebar } = useYwcCharts();

  return (
    <YwcLavaPanel className="space-y-2">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div className="flex items-center gap-2">
          <Activity size={16} className="text-[#00E5FF] drop-shadow-[0_0_8px_#00E5FF]" />
          <YwcSectionTitle className="text-xs tracking-widest">ADD YOUR FAVORITE CHARTS TO YWC</YwcSectionTitle>
        </div>
        <p className="text-[10px] font-mono text-zinc-400 max-w-xl leading-relaxed">
          Four chart slots live in the <strong className="text-zinc-300">right sidebar</strong> above media — they scroll with the page and never cover your content. Use ↑↓ to reorder.
        </p>
      </div>
      <button
        type="button"
        onClick={dockAllToSidebar}
        className="text-[9px] font-mono uppercase tracking-wider text-cyan-500 hover:text-cyan-300 border border-cyan-500/30 rounded-lg px-3 py-1.5 w-fit"
      >
        Reset chart positions
      </button>
    </YwcLavaPanel>
  );
}

/** @deprecated */
export function YwcChartFloatLayer() {
  return null;
}

/** Full chart bento — header + slots together (always visible). */
export function YwcChartSection() {
  return (
    <div className="space-y-3">
      <YwcChartPlacementHeader />
      <YwcChartDock />
    </div>
  );
}

/** @deprecated use YwcChartSection */
export function YwcLiveChartBento() {
  return <YwcChartSection />;
}
