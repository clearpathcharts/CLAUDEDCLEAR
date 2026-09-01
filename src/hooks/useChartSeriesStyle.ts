import { useCallback, useState } from "react";
import {
  DEFAULT_PRICE_SERIES,
  isPriceSeriesType,
  type PriceSeriesType,
} from "../lib/charts/priceSeriesStyles";

const STORAGE_KEY = "cp_chart_series_style";

function readStored(): PriceSeriesType {
  if (typeof window === "undefined") return DEFAULT_PRICE_SERIES;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (isPriceSeriesType(raw)) return raw;
  } catch {
    /* ignore */
  }
  return DEFAULT_PRICE_SERIES;
}

export function useChartSeriesStyle(initial?: PriceSeriesType) {
  const [style, setStyleState] = useState<PriceSeriesType>(
    () => initial ?? readStored(),
  );

  const setStyle = useCallback((next: PriceSeriesType) => {
    setStyleState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* quota / private mode */
    }
  }, []);

  return [style, setStyle] as const;
}
