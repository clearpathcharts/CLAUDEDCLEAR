import { useCallback, useEffect, useState } from "react";
import {
  applyCeoDailyColors,
  CHART_COLOR_PREF_EVENT,
  clearChartColorPreference,
  readChartColorPreference,
  writeChartBackgroundHex,
  type ChartColorPreference,
} from "../lib/charts/ceoDailyColors";

export function useChartColorPreference(): ChartColorPreference & {
  setBackgroundHex: (hex: string | null) => void;
  applyCeoDaily: () => void;
  clearPreference: () => void;
} {
  const [pref, setPref] = useState<ChartColorPreference>(() =>
    typeof window === "undefined"
      ? { backgroundHex: null, ceoDaily: false }
      : readChartColorPreference(),
  );

  useEffect(() => {
    const sync = () => setPref(readChartColorPreference());
    window.addEventListener("storage", sync);
    window.addEventListener(CHART_COLOR_PREF_EVENT, sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener(CHART_COLOR_PREF_EVENT, sync);
    };
  }, []);

  const setBackgroundHex = useCallback((hex: string | null) => {
    setPref(writeChartBackgroundHex(hex));
  }, []);

  const applyCeoDaily = useCallback(() => {
    setPref(applyCeoDailyColors());
  }, []);

  const clearPreference = useCallback(() => {
    setPref(clearChartColorPreference());
  }, []);

  return { ...pref, setBackgroundHex, applyCeoDaily, clearPreference };
}
