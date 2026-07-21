"use client";

import React, { Suspense, lazy, useState } from 'react';
import { BarChart3, Plus, Trash2, ExternalLink } from 'lucide-react';
import { useYwcPersonalCharts } from '../../hooks/useYwcPersonalCharts';
import { YwcSectionTitle } from './YwcLavaPanel';

const LightweightCandles = lazy(() =>
  import('../charts/LightweightCandles').then((m) => ({ default: m.LightweightCandles }))
);

const PRESET_SYMBOLS = [
  { symbol: 'SPY', label: 'S&P 500' },
  { symbol: 'QQQ', label: 'NASDAQ' },
  { symbol: 'EUR/USD', label: 'Euro FX' },
  { symbol: 'BTC/USD', label: 'Bitcoin' },
  { symbol: 'GC', label: 'Gold' },
  { symbol: 'CL', label: 'Crude Oil' },
];

type YwcPersonalChartsProps = {
  compact?: boolean;
  onOpenChartsTab?: () => void;
};

export function YwcPersonalCharts({ compact = false, onOpenChartsTab }: YwcPersonalChartsProps) {
  const { slots, addSlot, removeSlot, maxSlots } = useYwcPersonalCharts();
  const [symbolInput, setSymbolInput] = useState('');
  const [addError, setAddError] = useState('');

  const handleAdd = (symbol?: string) => {
    const value = symbol || symbolInput;
    const ok = addSlot(value);
    if (!ok) {
      setAddError(
        slots.length >= maxSlots
          ? `Maximum ${maxSlots} personal charts. Remove one to add another.`
          : 'Enter a symbol or pick a preset.'
      );
      return;
    }
    setAddError('');
    setSymbolInput('');
  };

  return (
    <div className={`space-y-4 ${compact ? '' : 'w-full'}`}>
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <BarChart3 size={16} className="text-[#FF4500]" />
          <YwcSectionTitle className="text-xs tracking-widest">
            Personal Trading Charts
          </YwcSectionTitle>
        </div>
        {onOpenChartsTab && (
          <button
            type="button"
            onClick={onOpenChartsTab}
            className="text-[9px] font-mono font-black uppercase tracking-widest text-[#00f0ff] hover:text-[#ff0088] flex items-center gap-1 cursor-pointer"
          >
            <ExternalLink size={10} />
            Open Full Charts
          </button>
        )}
      </div>

      <p className="text-[10px] text-zinc-500 leading-relaxed">
        Pin symbols to your Y.W.C. workspace. Charts load from ClearPath market data and stay saved on this device.
      </p>

      <div className="flex flex-wrap gap-2">
        {PRESET_SYMBOLS.map((preset) => (
          <button
            key={preset.symbol}
            type="button"
            onClick={() => handleAdd(preset.symbol)}
            className="px-2.5 py-1 rounded-lg border border-white/10 bg-zinc-950 text-[9px] font-mono text-zinc-400 hover:text-[#00f0ff] hover:border-[#00f0ff]/30 transition-all cursor-pointer"
          >
            + {preset.label}
          </button>
        ))}
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          value={symbolInput}
          onChange={(e) => setSymbolInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          placeholder="Custom symbol (e.g. AAPL, ES, GBP/USD)"
          className="flex-1 px-3 py-2 rounded-xl border border-white/10 bg-black text-xs text-white focus:border-[#ff0088] outline-none font-mono"
        />
        <button
          type="button"
          onClick={() => handleAdd()}
          className="px-3 py-2 rounded-xl bg-[#ff0088]/20 border border-[#ff0088]/40 text-[#ff0088] hover:bg-[#ff0088] hover:text-white text-[10px] font-black uppercase tracking-wider flex items-center gap-1 cursor-pointer"
        >
          <Plus size={12} />
          Add
        </button>
      </div>
      {addError && <p className="text-[10px] text-rose-400 font-mono">{addError}</p>}

      <div className={`grid gap-4 ${compact ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'}`}>
        {slots.map((slot) => (
          <div
            key={slot.id}
            className="rounded-2xl border border-white/10 bg-black/60 overflow-hidden"
          >
            <div className="flex items-center justify-between px-3 py-2 border-b border-white/5">
              <div>
                <span className="text-xs font-black text-white font-mono">{slot.symbol}</span>
                <span className="text-[9px] text-zinc-500 ml-2">{slot.label}</span>
              </div>
              <button
                type="button"
                onClick={() => removeSlot(slot.id)}
                aria-label={`Remove ${slot.symbol} chart`}
                className="p-1.5 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-rose-950/30 cursor-pointer"
              >
                <Trash2 size={12} />
              </button>
            </div>
            <Suspense
              fallback={
                <div className="h-[180px] flex items-center justify-center text-[10px] text-zinc-500 font-mono">
                  Loading chart…
                </div>
              }
            >
              <LightweightCandles
                profileId="calm_focus"
                symbol={slot.symbol}
                height={compact ? 160 : 200}
                timeframe="1h"
                embedMode
              />
            </Suspense>
          </div>
        ))}
      </div>

      {slots.length === 0 && (
        <p className="text-[10px] text-zinc-600 font-mono text-center py-6">
          No charts pinned yet. Add a symbol above.
        </p>
      )}
    </div>
  );
}
