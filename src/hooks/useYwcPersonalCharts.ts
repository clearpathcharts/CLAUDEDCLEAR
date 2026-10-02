import { useCallback, useEffect, useState } from 'react';

export type YwcChartSlot = {
  id: string;
  symbol: string;
  label: string;
  timeframe: string;
};

const STORAGE_KEY = 'ywc_personal_chart_slots_v1';
const DEFAULT_SLOTS: YwcChartSlot[] = [
  { id: 'slot-1', symbol: 'SPY', label: 'S&P 500 ETF', timeframe: '1h' },
  { id: 'slot-2', symbol: 'BTC/USD', label: 'Bitcoin', timeframe: '1h' },
];

function loadSlots(): YwcChartSlot[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SLOTS;
    const parsed = JSON.parse(raw) as Partial<YwcChartSlot>[];
    if (!Array.isArray(parsed) || !parsed.length) return DEFAULT_SLOTS;
    return parsed
      .filter((slot) => slot && typeof slot.symbol === 'string' && slot.symbol.trim())
      .map((slot, i) => ({
        id: typeof slot.id === 'string' && slot.id ? slot.id : `slot-${i}`,
        symbol: slot.symbol!.trim().toUpperCase(),
        label: typeof slot.label === 'string' && slot.label.trim() ? slot.label : slot.symbol!.trim().toUpperCase(),
        timeframe: typeof slot.timeframe === 'string' && slot.timeframe.trim() ? slot.timeframe : '1h',
      }));
  } catch {
    return DEFAULT_SLOTS;
  }
}

export function useYwcPersonalCharts(maxSlots = 4) {
  const [slots, setSlots] = useState<YwcChartSlot[]>(loadSlots);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(slots));
  }, [slots]);

  const addSlot = useCallback(
    (symbol: string, label?: string) => {
      const normalized = symbol.trim().toUpperCase();
      if (!normalized) return false;
      if (slots.some((s) => s.symbol.toUpperCase() === normalized)) return false;
      if (slots.length >= maxSlots) return false;

      setSlots((prev) => [
        ...prev,
        {
          id: `slot-${Date.now()}`,
          symbol: normalized,
          label: label?.trim() || normalized,
          timeframe: '1h',
        },
      ]);
      return true;
    },
    [maxSlots, slots]
  );

  const removeSlot = useCallback((id: string) => {
    setSlots((prev) => prev.filter((s) => s.id !== id));
  }, []);

  const setTimeframe = useCallback((id: string, timeframe: string) => {
    const next = timeframe.trim();
    if (!next) return;
    setSlots((prev) => prev.map((s) => (s.id === id ? { ...s, timeframe: next } : s)));
  }, []);

  const updateSlot = useCallback((id: string, symbol: string, label?: string) => {
    const normalized = symbol.trim().toUpperCase();
    if (!normalized) return;
    setSlots((prev) =>
      prev.map((s) =>
        s.id === id ? { ...s, symbol: normalized, label: label?.trim() || normalized } : s
      )
    );
  }, []);

  return { slots, addSlot, removeSlot, updateSlot, setTimeframe, maxSlots };
}
