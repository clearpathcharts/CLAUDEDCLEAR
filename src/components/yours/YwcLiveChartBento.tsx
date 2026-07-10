"use client";

import React, { useEffect, useState } from "react";
import { Activity, Plus, X } from "lucide-react";
import { LightweightCandles } from "../charts/LightweightCandles";
import { MARKET_ASSETS, resolveMarketAsset, type MarketAsset } from "../../constants/marketAssets";
import { YwcLavaPanel, YwcSectionTitle } from "./YwcLavaPanel";

const SLOT_COUNT = 4;
const STORAGE_KEY = "cpt-ywc-live-chart-slots";
const DEFAULT_SLOTS: (MarketAsset | null)[] = [
  { label: "XAU/USD", value: "XAUUSD" },
  { label: "EUR/USD", value: "EURUSD" },
  null,
  null,
];

function loadSlots(): (MarketAsset | null)[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SLOTS;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length !== SLOT_COUNT) return DEFAULT_SLOTS;
    return parsed.map((entry: MarketAsset | null) =>
      entry?.value ? resolveMarketAsset(entry.value) : null
    );
  } catch {
    return DEFAULT_SLOTS;
  }
}

export function YwcLiveChartBento() {
  const [slots, setSlots] = useState<(MarketAsset | null)[]>(loadSlots);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(slots));
    } catch {
      /* ignore */
    }
  }, [slots]);

  const assignSlot = (index: number, asset: MarketAsset) => {
    setSlots((prev) => {
      const next = [...prev];
      next[index] = asset;
      return next;
    });
  };

  const clearSlot = (index: number) => {
    setSlots((prev) => {
      const next = [...prev];
      next[index] = null;
      return next;
    });
  };

  return (
    <YwcLavaPanel className="sticky top-4 z-30 space-y-3 shadow-[0_0_32px_rgba(255,69,0,0.15)]">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-2 border-b border-[#FF1493]/25">
        <div className="flex items-center gap-2">
          <Activity size={16} className="text-[#00E5FF] drop-shadow-[0_0_8px_#00E5FF]" />
          <YwcSectionTitle className="text-xs tracking-widest">
            LIVE TRADE WATCH — BENTO CHARTS
          </YwcSectionTitle>
        </div>
        <span className="text-[9px] font-mono text-zinc-500 uppercase">
          Pin symbols · scroll feeds · charts stay live
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {slots.map((slot, index) => (
          <div
            key={index}
            className="rounded-xl border border-white/10 bg-black/70 overflow-hidden flex flex-col min-h-[200px] relative group"
          >
            <div className="flex items-center justify-between px-2.5 py-1.5 border-b border-white/5 bg-black/50 shrink-0">
              {slot ? (
                <select
                  value={slot.value}
                  onChange={(e) => assignSlot(index, resolveMarketAsset(e.target.value))}
                  className="bg-transparent text-[10px] font-mono font-bold text-zinc-200 outline-none cursor-pointer max-w-[70%] truncate"
                >
                  {MARKET_ASSETS.map((asset) => (
                    <option key={asset.value} value={asset.value} className="bg-black text-white">
                      {asset.label}
                    </option>
                  ))}
                </select>
              ) : (
                <span className="text-[9px] font-mono text-zinc-600 uppercase">Empty slot</span>
              )}
              <div className="flex items-center gap-1">
                {slot && (
                  <button
                    type="button"
                    onClick={() => clearSlot(index)}
                    className="p-1 rounded text-zinc-600 hover:text-rose-400 transition-colors"
                    aria-label="Clear chart slot"
                  >
                    <X size={12} />
                  </button>
                )}
                <span className="text-[8px] font-mono text-[#00FF88] flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#00FF88] animate-pulse" />
                  LIVE
                </span>
              </div>
            </div>

            {slot ? (
              <div className="flex-1 min-h-[168px] relative">
                <LightweightCandles
                  profileId="calm_focus"
                  symbol={slot.value}
                  timeframe="1h"
                  height={168}
                  embedMode
                />
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center gap-3 p-4 border border-dashed border-[#FF1493]/25 m-2 rounded-lg bg-zinc-950/50">
                <Plus size={20} className="text-[#FF1493]/60" />
                <select
                  defaultValue=""
                  onChange={(e) => {
                    if (e.target.value) {
                      assignSlot(index, resolveMarketAsset(e.target.value));
                      e.target.value = "";
                    }
                  }}
                  className="bg-black border border-white/10 text-[10px] font-mono text-zinc-300 rounded-lg px-2 py-1.5 outline-none cursor-pointer w-full max-w-[140px]"
                >
                  <option value="" disabled>
                    Add symbol…
                  </option>
                  {MARKET_ASSETS.map((asset) => (
                    <option key={asset.value} value={asset.value}>
                      {asset.label}
                    </option>
                  ))}
                </select>
                <span className="text-[8px] font-mono text-zinc-600 text-center">
                  Watch a trade while you read
                </span>
              </div>
            )}
          </div>
        ))}
      </div>
    </YwcLavaPanel>
  );
}
