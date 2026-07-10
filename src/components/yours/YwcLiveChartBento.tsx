"use client";

import React, { useEffect } from "react";
import { Activity, X } from "lucide-react";
import { LightweightCandles } from "../charts/LightweightCandles";
import { ChartSymbolSearch } from "../charts/ChartSymbolSearch";
import { DraggableChartPanel } from "../charts/DraggableChartPanel";
import { resolveMarketAsset } from "../../constants/marketAssets";
import {
  createEmptyYwcSlots,
  YWC_CHART_HEIGHT,
  YWC_CHART_SLOT_COUNT,
  YWC_CHART_WIDTH,
  type ChartLayoutSlot,
} from "../../constants/chartLayout";
import { usePersistedLayout } from "../../hooks/useDraggablePosition";
import { YwcLavaPanel, YwcSectionTitle } from "./YwcLavaPanel";

const STORAGE_KEY = "cpt-ywc-live-chart-layout";

function loadYwcSlots(): ChartLayoutSlot[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length === YWC_CHART_SLOT_COUNT) {
        return parsed.map((slot: ChartLayoutSlot) => ({
          symbol: slot.symbol ?? null,
          x: typeof slot.x === "number" ? slot.x : 16,
          y: typeof slot.y === "number" ? slot.y : 100,
        }));
      }
    }
    // Migrate legacy symbol-only storage
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

export function YwcLiveChartBento() {
  const [slots, saveSlots] = usePersistedLayout<ChartLayoutSlot[]>(STORAGE_KEY, loadYwcSlots);

  useEffect(() => {
    saveSlots(slots);
  }, [slots, saveSlots]);

  const updateSlot = (index: number, patch: Partial<ChartLayoutSlot>) => {
    saveSlots((prev) => prev.map((slot, i) => (i === index ? { ...slot, ...patch } : slot)));
  };

  const clearSlot = (index: number) => {
    updateSlot(index, { symbol: null });
  };

  return (
    <>
      <YwcLavaPanel className="space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="flex items-center gap-2">
            <Activity size={16} className="text-[#00E5FF] drop-shadow-[0_0_8px_#00E5FF]" />
            <YwcSectionTitle className="text-xs tracking-widest">
              ADD YOUR FAVORITE CHARTS TO YWC
            </YwcSectionTitle>
          </div>
          <p className="text-[10px] font-mono text-zinc-400 max-w-md leading-relaxed">
            Search each chart slot below — nothing is pre-selected. Drag any panel anywhere on your screen while you read or scroll.
          </p>
        </div>
      </YwcLavaPanel>

      {slots.map((slot, index) => (
        <DraggableChartPanel
          key={`ywc-chart-${index}`}
          mode="fixed"
          width={YWC_CHART_WIDTH}
          zIndex={40 + index}
          position={{ x: slot.x, y: slot.y }}
          onPositionChange={(pos) => updateSlot(index, pos)}
          header={
            <div className="flex items-center gap-1 min-w-0">
              <ChartSymbolSearch
                compact
                placeholder="Search your chart…"
                activeSymbol={slot.symbol}
                onSubmit={(sym) => updateSlot(index, { symbol: resolveMarketAsset(sym).value })}
              />
              {slot.symbol && (
                <button
                  type="button"
                  onClick={() => clearSlot(index)}
                  className="p-1 rounded text-zinc-600 hover:text-rose-400 transition-colors shrink-0"
                  aria-label="Clear chart slot"
                >
                  <X size={12} />
                </button>
              )}
            </div>
          }
        >
          {slot.symbol ? (
            <div className="h-[168px] relative">
              <LightweightCandles
                profileId="calm_focus"
                symbol={slot.symbol}
                timeframe="1h"
                height={168}
                embedMode
              />
            </div>
          ) : (
            <div className="h-[168px] flex flex-col items-center justify-center gap-2 px-4 text-center border-t border-dashed border-[#FF1493]/20 bg-zinc-950/80">
              <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">
                Empty chart slot {index + 1}
              </span>
              <span className="text-[9px] text-zinc-600 leading-relaxed">
                Type any symbol above — EURUSD, AAPL, your pick
              </span>
            </div>
          )}
        </DraggableChartPanel>
      ))}
    </>
  );
}
