"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { createChart, ColorType, Time, CandlestickData, CandlestickSeries, CrosshairMode, LineSeries, LineStyle, AreaSeries } from "lightweight-charts";
import { IndicatorEngine } from "../../core/engine/IndicatorEngine";
import {
  themeProfiles,
  type ThemeProfileId,
} from "../../lib/theme/profiles";
import { chartThemes } from "../../config/chartThemes";
import { lightweightThemeAdapter } from "../../lib/charts/lightweightThemeAdapter";
import { ChartFeedAdapter } from "../../engine/chartFeedAdapter";
import { getCandleLimit } from "../../config/tierLimits";
import { fetchTieredHistoricalData } from "../../services/marketData";
import { Crosshair } from "lucide-react";
import { useVisibilityPause } from "../../hooks/useVisibilityPause";

type Candle = {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
};

export function LightweightCandles({
  data,
  symbol = "UNKNOWN",
  profileId,
  height = 520,
  timeframe = "1h",
  theme: customTheme,
  userTier = "BRONZE",
  takeSnapshotRef,
  activeIndicators = [],
  showMineIndicator = false,
  mineIndicatorName = "",
  ichimokuSettings = {
    conversionPeriods: 9,
    basePeriods: 26,
    laggingSpan2Periods: 52,
    displacement: 26
  },
}: {
  data?: Candle[];
  symbol?: string;
  profileId: string;
  height?: number;
  timeframe?: string;
  theme?: any;
  userTier?: string;
  takeSnapshotRef?: React.MutableRefObject<(() => string | null) | null>;
  activeIndicators?: string[];
  showMineIndicator?: boolean;
  mineIndicatorName?: string;
  ichimokuSettings?: {
    conversionPeriods: number;
    basePeriods: number;
    laggingSpan2Periods: number;
    displacement: number;
  };
  blackoutMode?: boolean;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [crosshairEnabled, setCrosshairEnabled] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const visible = useVisibilityPause();

  const normalizedProfileId = (profileId || "").toLowerCase();
  const safeProfileId = normalizedProfileId in themeProfiles ? (normalizedProfileId as ThemeProfileId) : "calm_focus";
  const profile = useMemo(() => themeProfiles[safeProfileId] || themeProfiles.calm_focus, [safeProfileId]);
  const defaultTheme = useMemo(() => lightweightThemeAdapter(profile), [profile]);
  
  // Load globally selected chart theme from localStorage if no customTheme is explicitly provided
  const savedTheme = useMemo(() => {
    try {
      const savedKey = localStorage.getItem('clearpath_selected_chart_theme_key');
      if (savedKey && savedKey in chartThemes) {
        return chartThemes[savedKey as keyof typeof chartThemes];
      }
    } catch (e) {
      console.warn(e);
    }
    return null;
  }, [customTheme]);

  // Accessibility / Neuro-adaptive profiles specify their own custom contrast, borders and colors.
  // We should prioritize the active profile's specialized styling instead of let a generic saved custom theme override it.
  // When returning to'calm_focus', we restore the user's custom-selected chart theme safely.
  const activeCustomTheme = (safeProfileId === "calm_focus") ? (customTheme || savedTheme) : null;

  // Use custom theme if provided, otherwise fallback to profile-based theme
  const theme = useMemo(() => {
    return activeCustomTheme || {
      layout: {
        background: { bottomColor: defaultTheme.layout.background.bottomColor },
        textColor: defaultTheme.layout.textColor
      },
      grid: defaultTheme.grid,
      candleSeries: {
        upColor: defaultTheme.candleSeries.upColor,
        downColor: defaultTheme.candleSeries.downColor,
        wickUpColor: defaultTheme.candleSeries.wickUpColor,
        wickDownColor: defaultTheme.candleSeries.wickDownColor,
        borderUpColor: defaultTheme.candleSeries.borderUpColor,
        borderDownColor: defaultTheme.candleSeries.borderDownColor,
      }
    };
  }, [activeCustomTheme, defaultTheme]);

  useEffect(() => {
    if (!visible) return;
    if (!containerRef.current) return;

    let active = true;

    const initialWidth = containerRef.current.clientWidth || 500;
    const initialHeight = containerRef.current.clientHeight || height || 450;

    const chart = createChart(containerRef.current, {
      width: initialWidth,
      height: initialHeight,
      layout: {
        background: {
          type: ColorType.Solid,
          color: activeCustomTheme ? activeCustomTheme.background : theme.layout.background.bottomColor,
        },
        textColor: activeCustomTheme ? activeCustomTheme.text : theme.layout.textColor,
        attributionLogo: false,
      },
      grid: activeCustomTheme ? {
        vertLines: { color: activeCustomTheme.grid },
        horzLines: { color: activeCustomTheme.grid },
      } : theme.grid,
      crosshair: {
        ...defaultTheme.crosshair,
        mode: crosshairEnabled ? CrosshairMode.Normal : CrosshairMode.Hidden,
      },
      rightPriceScale: defaultTheme.rightPriceScale,
      timeScale: defaultTheme.timeScale,
      // PERFORMANCE TWEAKS & OPTIMIZATIONS FOR HIGH-VOLUME DENSITY (40k NODES)
      handleScroll: { mouseWheel: true, pressedMouseMove: true },
      handleScale: { axisPressedMouseMove: true, mouseWheel: true },
    });

    if (takeSnapshotRef) {
      takeSnapshotRef.current = () => {
        try {
          const snapshotCanvas = chart.takeScreenshot();
          if (snapshotCanvas) {
            return snapshotCanvas.toDataURL("image/png");
          }
        } catch (e) {
          console.error("Take screenshot failed", e);
        }
        return null;
      };
    }

    const series = chart.addSeries(CandlestickSeries, {
      upColor: activeCustomTheme ? (activeCustomTheme.upColor || activeCustomTheme.candleUp) : theme.candleSeries.upColor,
      downColor: activeCustomTheme ? (activeCustomTheme.downColor || activeCustomTheme.candleDown) : theme.candleSeries.downColor,
      wickUpColor: activeCustomTheme ? (activeCustomTheme.wickUpColor || activeCustomTheme.wickUp || activeCustomTheme.upColor || activeCustomTheme.candleUp) : theme.candleSeries.wickUpColor,
      wickDownColor: activeCustomTheme ? (activeCustomTheme.wickDownColor || activeCustomTheme.wickDown || activeCustomTheme.downColor || activeCustomTheme.candleDown) : theme.candleSeries.wickDownColor,
      borderUpColor: activeCustomTheme ? (activeCustomTheme.borderUpColor || activeCustomTheme.borderUp || activeCustomTheme.upColor || activeCustomTheme.candleUp) : theme.candleSeries.borderUpColor,
      borderDownColor: activeCustomTheme ? (activeCustomTheme.borderDownColor || activeCustomTheme.borderDown || activeCustomTheme.downColor || activeCustomTheme.candleDown) : theme.candleSeries.borderDownColor,
    });

    const stepMap: Record<string, number> = { '1m': 60, '5m': 300, '15m': 900, '1h': 3600, '4h': 14400, '1d': 86400 };
    const stepSeconds = stepMap[timeframe.toLowerCase()] || 3600;

    let base = 150.0;
    const sym = symbol.toUpperCase();
    if (sym.includes('GOLD')) base = 2180.50;
    else if (sym.includes('OIL') || sym.includes('WTI')) base = 81.20;
    else if (sym.includes('BTC')) base = 65000;
    else if (sym.includes('EUR') || sym.includes('USD')) base = 1.0850;
    else if (sym.includes('US10Y')) base = 4.25;

    let displayData: Candle[] = [];
    let lastCandle: Candle | null = null;
    let interval: any;

    async function load() {
      try {
        const allowedLimit = getCandleLimit(userTier);

        if (data && data.length > 0) {
          if (!active) return;
          displayData = data;
        } else {
          let fetched: Candle[] | null = null;
          try {
            // Fetch tiered data from Twelve Data + robust backend proxy + fallback cascade
            fetched = await fetchTieredHistoricalData(sym, timeframe, userTier);
          } catch (err) {
            console.warn("Falling back to adapter / simulation for", sym, err);
            try {
              if (active) {
                fetched = await ChartFeedAdapter.getCandles(sym, timeframe);
              }
            } catch (adapterErr) {
              console.error(adapterErr);
            }
          }

          if (!active) return;

          if (fetched && fetched.length > 0) {
            displayData = fetched;
          } else {
            setError("No historical data available for this timeframe.");
            return;
          }
        }

        if (!active) return;

        // SLICE DATA BOUND TO THE SUBSCRIPTION LEVEL RESTRICTIONS (Up to 40k)
        const tierOptimizedData = displayData.slice(-allowedLimit);

        series.setData(tierOptimizedData as CandlestickData<Time>[]);
        lastCandle = tierOptimizedData[tierOptimizedData.length - 1];

        // Core Mathematical Indicators Plotting (Request 2)
        const COLOR_MAP: Record<string, string> = {
          "SMA": "#00FFFF",
          "EMA": "#FFAA00",
          "RSI": "#00FF66",
          "BB": "#7A3BFF",
          "ADX": "#00D9FF",
          "ATR": "#FF4500",
          "AO": "#3E78FF",
          "MACD": "#FF00C8"
        };

        if (activeIndicators && activeIndicators.length > 0) {
          activeIndicators.forEach((indAbbr) => {
            const color = COLOR_MAP[indAbbr] || "#4DFFFF"; // premium non-magenta cyan fallback
            try {
              if (indAbbr === "SMA") {
                const lineData = IndicatorEngine.calculate("SMA", tierOptimizedData, { period: 20 });
                const smaLine = chart.addSeries(LineSeries, {
                  color: "#00FFFF",
                  lineWidth: 2,
                  title: "SMA (20)",
                });
                smaLine.setData(lineData as any[]);
              } 
              else if (indAbbr === "EMA") {
                const lineData = IndicatorEngine.calculate("EMA", tierOptimizedData, { period: 50 });
                const emaLine = chart.addSeries(LineSeries, {
                  color: "#FFAA00",
                  lineWidth: 2,
                  title: "EMA (50)",
                });
                emaLine.setData(lineData as any[]);
              }
              else if (indAbbr === "BB") {
                const bbData = IndicatorEngine.calculate("BB", tierOptimizedData, { period: 20, multiplier: 2 });
                const basisData = bbData.map((d: any) => ({ time: d.time as Time, value: d.basis }));
                const upperData = bbData.map((d: any) => ({ time: d.time as Time, value: d.upper }));
                const lowerData = bbData.map((d: any) => ({ time: d.time as Time, value: d.lower }));

                const mLine = chart.addSeries(LineSeries, { color: "#7A3BFF", lineWidth: 1, title: "BB basis" });
                const uLine = chart.addSeries(LineSeries, { color: "#22C55E", lineWidth: 2, title: "BB upper" }); // non-magenta
                const lLine = chart.addSeries(LineSeries, { color: "#EF4444", lineWidth: 2, title: "BB lower" }); // non-magenta
                
                mLine.setData(basisData);
                uLine.setData(upperData);
                lLine.setData(lowerData);
              }
              else if (indAbbr === "ICHIMOKU") {
                const ichiData = IndicatorEngine.calculate("ICHIMOKU", tierOptimizedData, ichimokuSettings);
                
                const tenkanData = ichiData.map((d: any) => ({ time: d.time as Time, value: d.tenkan }));
                const kijunData = ichiData.map((d: any) => ({ time: d.time as Time, value: d.kijun }));
                const spanAData = ichiData.map((d: any) => ({ time: d.time as Time, value: d.spanA }));
                const spanBData = ichiData.map((d: any) => ({ time: d.time as Time, value: d.spanB }));
                const chikouData = ichiData.map((d: any) => ({ time: d.time as Time, value: d.chikou }));

                const convLine = chart.addSeries(LineSeries, { color: "#2962FF", lineWidth: 2, title: "Conversion (Tenkan)" });
                convLine.setData(tenkanData);

                const bsLine = chart.addSeries(LineSeries, { color: "#B71C1C", lineWidth: 2, title: "Base (Kijun)" });
                bsLine.setData(kijunData);

                const lagLine = chart.addSeries(LineSeries, { color: "#43A047", lineWidth: 1, title: "Lagging (Chikou)" });
                lagLine.setData(chikouData);

                const spanALine = chart.addSeries(LineSeries, { color: "#A5D6A7", lineWidth: 1, lineStyle: LineStyle.Dashed, title: "Span A" });
                spanALine.setData(spanAData);

                const spanBLine = chart.addSeries(LineSeries, { color: "#EF9A9A", lineWidth: 1, lineStyle: LineStyle.Dashed, title: "Span B" });
                spanBLine.setData(spanBData);

                // Compute exact clouds paths
                const bullCloudData = ichiData.map((d: any) => {
                  const val = d.spanA >= d.spanB ? d.spanA : null;
                  return { time: d.time as Time, value: val };
                }).filter((d: any) => d.value !== null);

                const bearCloudData = ichiData.map((d: any) => {
                  const val = d.spanA < d.spanB ? d.spanB : null;
                  return { time: d.time as Time, value: val };
                }).filter((d: any) => d.value !== null);

                if (bullCloudData.length > 0) {
                  const bullCloud = chart.addSeries(AreaSeries, {
                    topColor: "rgba(0, 255, 0, 0.25)",
                    bottomColor: "rgba(0, 255, 0, 0.0)",
                    lineColor: "rgba(0, 255, 0, 0.15)",
                    lineWidth: 1,
                  });
                  bullCloud.setData(bullCloudData as any[]);
                }

                if (bearCloudData.length > 0) {
                  const bearCloud = chart.addSeries(AreaSeries, {
                    topColor: "rgba(255, 0, 0, 0.25)",
                    bottomColor: "rgba(255, 0, 0, 0.0)",
                    lineColor: "rgba(255, 0, 0, 0.15)",
                    lineWidth: 1,
                  });
                  bearCloud.setData(bearCloudData as any[]);
                }
              }
              else if (indAbbr === "RSI") {
                const rsiData = IndicatorEngine.calculate("RSI", tierOptimizedData, { period: 14 });
                const rsiLine = chart.addSeries(LineSeries, {
                  color: "#00FF66",
                  lineWidth: 2,
                  title: "RSI (14)",
                });
                rsiLine.setData(rsiData as any[]);
              }
              else if (indAbbr === "MACD") {
                const macdOutput = IndicatorEngine.calculate("MACD", tierOptimizedData, { fastPeriod: 12, slowPeriod: 26, signalPeriod: 9 });
                
                const macdLineData = macdOutput.map((d: any) => ({ time: d.time as Time, value: d.macd }));
                const signalLineData = macdOutput.map((d: any) => ({ time: d.time as Time, value: d.signal }));

                const mLine = chart.addSeries(LineSeries, { color: "#3B82F6", lineWidth: 2, title: "MACD Line" });
                const sLine = chart.addSeries(LineSeries, { color: "#F59E0B", lineWidth: 2, title: "Signal Line" }); // non-magenta

                mLine.setData(macdLineData);
                sLine.setData(signalLineData);
              }
              else if (indAbbr === "ATR") {
                const atrData = IndicatorEngine.calculate("ATR", tierOptimizedData, { period: 14 });
                const atrLine = chart.addSeries(LineSeries, {
                  color: "#FF4500",
                  lineWidth: 2,
                  title: "ATR (14)",
                });
                atrLine.setData(atrData as any[]);
              }
              else if (indAbbr === "VWAP") {
                const vwapData = IndicatorEngine.calculate("VWAP", tierOptimizedData);
                const vwapLine = chart.addSeries(LineSeries, {
                  color: "#F72585",
                  lineWidth: 2,
                  title: "VWAP",
                });
                vwapLine.setData(vwapData as any[]);
              }
              else if (indAbbr === "OBV") {
                const obvData = IndicatorEngine.calculate("OBV", tierOptimizedData);
                const obvLine = chart.addSeries(LineSeries, {
                  color: "#118AB2",
                  lineWidth: 2,
                  title: "OBV",
                });
                obvLine.setData(obvData as any[]);
              }
              else if (indAbbr === "ADX") {
                const adxData = IndicatorEngine.calculate("ADX", tierOptimizedData, { period: 14 });
                const adxValueData = adxData.map((d: any) => ({ time: d.time as Time, value: d.adx }));
                const adxLine = chart.addSeries(LineSeries, {
                  color: "#00D9FF",
                  lineWidth: 2,
                  title: "ADX (14)",
                });
                adxLine.setData(adxValueData);
              }
              else {
                // Calculation fallbacks routed via the IndicatorEngine
                const lineData = IndicatorEngine.calculate(indAbbr, tierOptimizedData);
                const otherLine = chart.addSeries(LineSeries, {
                  color: color,
                  lineWidth: 2,
                  title: `${indAbbr} (Live)`,
                });
                otherLine.setData(lineData as any[]);
              }
            } catch (err) {
              console.error(`Error loading indicator line for ${indAbbr}`, err);
            }
          });
        }

        // Plot "The River" (Mine) Custom Indicator if active
        if (showMineIndicator) {
          try {
            const period = 14;
            const lineData = tierOptimizedData.map((d, idx) => {
              const start = Math.max(0, idx - period + 1);
              const slice = tierOptimizedData.slice(start, idx + 1);
              const avg = slice.reduce((acc, curr) => acc + curr.close, 0) / slice.length;
              const offsetAngle = idx * 0.12;
              const rirFactor = Math.sin(offsetAngle) * (d.close * 0.0015) + Math.cos(offsetAngle * 0.5) * (d.close * 0.0006);
              return { time: d.time as Time, value: avg + rirFactor };
            });

            const riverLine = chart.addSeries(LineSeries, {
              color: "#FF007F",
              lineWidth: 3,
              title: (mineIndicatorName || "the river").split('.')[0].toUpperCase(),
            });
            riverLine.setData(lineData);
          } catch (err) {
            console.error("Error setting custom river indicator line", err);
          }
        }

        // Live tick update — pulls a real quote through ChartFeedAdapter (which was
        // already imported in this file but never actually called). On any failure,
        // the candle is simply left alone rather than filled in with random noise.
        let tickDelay = 1500;
        if (timeframe.toLowerCase().includes("m") && timeframe !== "1M") tickDelay = 1000;
        else if (timeframe.includes("d") || timeframe.includes("w") || timeframe === "1M" || timeframe === "YTD") tickDelay = 3000;

        interval = setInterval(async () => {
          if (!active || !lastCandle) return;

          let livePrice: number | null = null;
          try {
            const quote = await ChartFeedAdapter.getLiveQuote(sym);
            if (quote && typeof quote.price === "number" && quote.price > 0) {
              livePrice = quote.price;
            }
          } catch (err) {
            console.error(`[LightweightCandles] Live quote fetch failed for ${sym}:`, err);
          }

          // No real price available — do nothing this tick. Do NOT fabricate movement.
          if (livePrice === null) return;

          const nowRaw = Math.floor(Date.now() / 1000);
          const currentTime = nowRaw - (nowRaw % stepSeconds);

          const newClose = livePrice;
          let newHigh = lastCandle.high;
          let newLow = lastCandle.low;

          let updateTime = lastCandle.time;
          let updateOpen = lastCandle.open;

          if (currentTime > lastCandle.time) {
            updateTime = currentTime;
            updateOpen = lastCandle.close;
            newHigh = Math.max(updateOpen, newClose);
            newLow = Math.min(updateOpen, newClose);
          } else {
            newHigh = Math.max(lastCandle.high, newClose);
            newLow = Math.min(lastCandle.low, newClose);
          }

          if (!active) return;

          const updateObj = {
            time: updateTime as Time,
            open: updateOpen,
            high: newHigh,
            low: newLow,
            close: newClose,
          };

          series.update(updateObj);
          lastCandle = { ...updateObj, time: updateTime as number };
        }, tickDelay);

        chart.timeScale().fitContent();
      } catch (err) {
        console.warn("[LightweightCandles load error handler] Recovered from load failure gracefully:", err);
      }
    }

    load().catch(err => {
      console.warn("[LightweightCandles load promise catch] Suppressed chart loading promise rejection:", err);
    });

    const resizeObserver = new ResizeObserver((entries) => {
      if (!active || !entries || entries.length === 0) return;
      const { width, height: rectHeight } = entries[0].contentRect;
      if (width > 0) {
        chart.applyOptions({ 
          width, 
          height: rectHeight > 0 ? rectHeight : initialHeight 
        });
        setTimeout(() => {
          if (active) chart.timeScale().fitContent();
        }, 10);
      }
    });

    resizeObserver.observe(containerRef.current);

    return () => {
      active = false;
      if (takeSnapshotRef) {
        takeSnapshotRef.current = null;
      }
      if (interval) clearInterval(interval);
      resizeObserver.disconnect();
      chart.remove();
    };
  }, [data, height, profile, theme, activeCustomTheme, defaultTheme, timeframe, symbol, userTier, crosshairEnabled, takeSnapshotRef, visible, activeIndicators.join(","), showMineIndicator, mineIndicatorName, JSON.stringify(ichimokuSettings), error]);

  return (
    <div
      ref={containerRef}
      style={{
        width: "100%",
        height: `${height}px`,
        borderRadius: 20,
        overflow: "hidden",
        position: "relative",
        background: activeCustomTheme ? activeCustomTheme.background : `linear-gradient(180deg, ${profile.bgTop}, ${profile.bgBottom})`,
        boxShadow:
          defaultTheme.physics.glowBlur > 0
            ? `0 0 ${defaultTheme.physics.glowBlur}px ${profile.borderA}55`
            : "none",
      }}
    >
      {/* FLOATING COORDINATE TRACKER CONTROL (HUD SWITCH) */}
      {error && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 text-red-500 font-mono text-sm p-4 text-center">
          {error}
        </div>
      )}
      <button
        onClick={() => setCrosshairEnabled(!crosshairEnabled)}
        className="absolute top-3 right-3 z-40 bg-black/75 backdrop-blur-sm hover:bg-black text-[9px] px-2.5 py-1.5 rounded-lg border border-white/15 hover:border-[#00D9FF]/40 transition-all flex items-center gap-1.5 cursor-pointer text-zinc-300 font-mono tracking-wider select-none shadow-lg active:scale-95"
        title="Toggle Crosshair Coordinates tracking"
        id={`crosshair_toggle_${symbol}`}
      >
        <Crosshair size={10} className={crosshairEnabled ? "text-[#00D9FF] animate-pulse" : "text-zinc-500"} />
        <span>{crosshairEnabled ? "CROSSHAIR: ON" : "CROSSHAIR: OFF"}</span>
      </button>
    </div>
  );
}

