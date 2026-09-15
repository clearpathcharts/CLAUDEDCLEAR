import type { ThemeProfile } from "../theme/profiles";
import { chartPhysics } from "../theme/chartPhysics";
import { cleanCandleSeriesOptions } from "./cleanCandleSeries";

export function lightweightThemeAdapter(profile: ThemeProfile) {
  const physics = chartPhysics(profile);
  const candleSeries = cleanCandleSeriesOptions(
    {
      upColor: profile.upColor,
      downColor: profile.downColor,
      wickUpColor: profile.wickUpColor,
      wickDownColor: profile.wickDownColor,
      borderUpColor: profile.borderUpColor,
      borderDownColor: profile.borderDownColor,
    },
    profile.id === "low_stim_emergency" ? 0.65 : 1.05,
  );

  return {
    layout: {
      background: {
        topColor: profile.bgTop,
        bottomColor: profile.bgBottom,
      },
      textColor: profile.text,
    },
    grid: {
      // Soft grid — TradingView-clean charts keep lines barely visible.
      vertLines: { color: profile.grid, visible: profile.id !== "low_stim_emergency" },
      horzLines: { color: profile.grid, visible: profile.id !== "low_stim_emergency" },
    },
    crosshair: {
      vertLine: {
        color: profile.borderA,
        labelBackgroundColor: profile.borderA,
      },
      horzLine: {
        color: profile.borderB,
        labelBackgroundColor: profile.borderB,
      },
    },
    rightPriceScale: {
      borderColor: profile.grid,
      minimumWidth: 64,
      borderVisible: true,
      entireTextOnly: false,
    },
    timeScale: {
      borderColor: profile.grid,
      timeVisible: true,
      secondsVisible: false,
      lockVisibleTimeRangeOnResize: false,
      minBarSpacing: 0.5,
      rightOffset: 4,
    },
    candleSeries,
    physics,
  };
}
