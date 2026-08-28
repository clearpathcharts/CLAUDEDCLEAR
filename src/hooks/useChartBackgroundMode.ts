import { useCallback, useEffect, useState } from "react";
import {
  CHART_BACKGROUND_EVENT,
  readChartBackgroundMode,
  writeChartBackgroundMode,
  type ChartBackgroundMode,
} from "../lib/charts/chartBackground";

export function useChartBackgroundMode(): [
  ChartBackgroundMode,
  (mode: ChartBackgroundMode) => void,
] {
  const [mode, setMode] = useState<ChartBackgroundMode>(() =>
    typeof window === "undefined" ? "profile" : readChartBackgroundMode(),
  );

  useEffect(() => {
    const sync = () => setMode(readChartBackgroundMode());
    window.addEventListener("storage", sync);
    window.addEventListener(CHART_BACKGROUND_EVENT, sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener(CHART_BACKGROUND_EVENT, sync);
    };
  }, []);

  const update = useCallback((next: ChartBackgroundMode) => {
    writeChartBackgroundMode(next);
    setMode(next);
  }, []);

  return [mode, update];
}
