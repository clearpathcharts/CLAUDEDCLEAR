import type { ThemeProfile } from "../theme/profiles";
import { chartPhysics } from "../theme/chartPhysics";

export function lightweightThemeAdapter(profile: ThemeProfile) {
  const physics = chartPhysics(profile);

  return {
    layout: {
      background: {
        topColor: profile.bgTop,
        bottomColor: profile.bgBottom,
      },
      textColor: profile.text,
    },
    grid: {
      vertLines: { color: profile.grid },
      horzLines: { color: profile.grid },
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
    },
    timeScale: {
      borderColor: profile.grid,
      timeVisible: true,
      secondsVisible: false,
    },
    candleSeries: {
      upColor: profile.upColor,
      downColor: profile.downColor,
      wickUpColor: profile.wickUpColor,
      wickDownColor: profile.wickDownColor,
      borderUpColor: profile.borderUpColor,
      borderDownColor: profile.borderDownColor,
    },
    physics,
  };
}
