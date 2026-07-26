"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { createChart, ColorType, Time, CandlestickData, CandlestickSeries, CrosshairMode, LineSeries, LineStyle, AreaSeries, HistogramSeries, createSeriesMarkers, SeriesMarker, type IChartApi, type ISeriesApi, type SeriesType } from "lightweight-charts";
import { IndicatorEngine } from "../../core/engine/IndicatorEngine";
import { getActiveRiverIndicator, runPine } from "../../river/riverEngine";
import {
  themeProfiles,
  type ThemeProfileId,
} from "../../lib/theme/profiles";
import { chartThemes } from "../../config/chartThemes";
import { lightweightThemeAdapter } from "../../lib/charts/lightweightThemeAdapter";
import { intensifyCandleColors } from "../../lib/charts/intensifyColor";
import { ChartFeedAdapter } from "../../engine/chartFeedAdapter";
import { getCandleLimit } from "../../config/tierLimits";
import { fetchTieredHistoricalData } from "../../services/marketData";
import { executeActiveRirOnCandles, applyRirColorsToCandles, getActiveRirProgram } from "../../river/runtime";
import { scanAllPatterns, buildPatternLineOverlays, buildCandlestickMarkers, buildPatternPeakMarkers, scheduleChartVisionImmediate, cancelChartVision } from "../../patterns";
import type { PatternScanResult, FormingStructureBrief } from "../../patterns";
import { ChartPatternHud } from "./ChartPatternHud";
import { ChartFormingWatch } from "./ChartFormingWatch";
import { ChartZoomControls } from "./ChartZoomControls";
import { ChartDrawingToolbar, useChartDrawings } from "./drawings";
import { Crosshair, Scan, Radio, Focus } from "lucide-react";
import { useVisibilityPause } from "../../hooks/useVisibilityPause";
import { focusRecentBars, visibleBarTarget } from "../../lib/charts/chartZoom";

type Candle = {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
};

/** Seconds per bar for live updates. Keep `1M` (month) distinct from `1m` (minute). */
function timeframeStepSeconds(timeframe: string): number {
  const raw = (timeframe || "1h").trim();
  if (raw === "1M") return 30 * 86400;
  const tf = raw.toLowerCase();
  const stepMap: Record<string, number> = {
    "1m": 60,
    "2m": 120,
    "3m": 180,
    "5m": 300,
    "10m": 600,
    "15m": 900,
    "30m": 1800,
    "1h": 3600,
    "2h": 7200,
    "3h": 10800,
    "4h": 14400,
    "1d": 86400,
    "1w": 604800,
    ytd: 86400,
  };
  return stepMap[tf] || 3600;
}

/** Minimum price change that counts as a real new bar (blocks weekend flat-bar spam). */
function minMeaningfulPriceMove(price: number): number {
  const p = Math.abs(price) || 1;
  if (p >= 200) return Math.max(0.08, p * 0.00003); // gold / indices
  if (p >= 20) return Math.max(0.01, p * 0.00005);
  if (p >= 2) return Math.max(0.0005, p * 0.00008); // many FX pairs
  return Math.max(0.00005, p * 0.0001);
}

function candleRange(c: Candle): number {
  return Math.max(0, c.high - c.low);
}

/**
 * Drop trailing near-flat clones painted while the market was closed.
 * Keeps weekend analysis on real session history instead of a barcode of last-price ticks.
 */
function trimTrailingStagnantBars(candles: Candle[]): Candle[] {
  if (candles.length < 8) return candles;
  const out = candles.slice();
  while (out.length > 4) {
    const last = out[out.length - 1];
    const prev = out[out.length - 2];
    const floor = minMeaningfulPriceMove(last.close);
    const flat =
      candleRange(last) < floor &&
      Math.abs(last.close - prev.close) < floor &&
      Math.abs(last.open - last.close) < floor;
    if (!flat) break;
    out.pop();
  }
  return out;
}

/**
 * Oscillator indicators output values on a scale completely unrelated to price
 * (e.g. RSI is 0-100, MACD oscillates around zero). If they share the candle
 * price scale, the chart stretches to fit both price (~700) and the oscillator
 * (~30), crushing the candles into a flat ribbon. These MUST live on their own
 * separate price scale. Price-based overlays (SMA, EMA, BB, VWAP, Ichimoku,
 * River) belong ON the candle scale and are deliberately excluded here.
 */
const OSCILLATOR_INDICATORS = new Set([
  "RSI", "MACD", "ATR", "ADX", "DMI", "OBV", "AO", "STOCH", "STOCHRSI",
  "CCI", "WPR", "ROC", "PPO", "CMO", "DPO", "RVI", "TRIX", "TSI", "UO",
  "KST", "FT", "CC", "BBW", "HV", "CHV", "AD", "A/D", "CMF", "MFI",
  "EFI", "EOM", "VOL", "NETVOL", "VO",
]);
const OSCILLATOR_SCALE_ID = "oscillator-scale";

export function LightweightCandles({
  data,
  symbol = "UNKNOWN",
  profileId,
  height = 520,
  isExpanded = false,
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
  embedMode = false,
  useDedicatedPatternPanel = false,
}: {
  data?: Candle[];
  symbol?: string;
  profileId: string;
  height?: number;
  isExpanded?: boolean;
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
  /** Compact embed: hide HUD chrome for bento mini-charts. */
  embedMode?: boolean;
  /** When true, pattern readout lives in the left sidebar — no floating HUD on the chart. */
  useDedicatedPatternPanel?: boolean;
}) {
  const hidePatternChrome = embedMode || useDedicatedPatternPanel;
  const containerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<SeriesType> | null>(null);
  const [chartReadyKey, setChartReadyKey] = useState(0);
  const barCountRef = useRef(0);
  const [crosshairEnabled, setCrosshairEnabled] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [patternScan, setPatternScan] = useState<PatternScanResult | null>(null);
  const [formingBrief, setFormingBrief] = useState<FormingStructureBrief | null>(null);
  const [showPatternHud, setShowPatternHud] = useState(() => {
    try {
      const stored = localStorage.getItem("cp_chart_pattern_hud_open");
      return stored === null ? true : stored === "1";
    } catch {
      return true;
    }
  });
  const [showFormingWatch, setShowFormingWatch] = useState(() => {
    try {
      const stored = localStorage.getItem("cp_chart_forming_watch_open");
      return stored === null ? true : stored === "1";
    } catch {
      return true;
    }
  });
  const visible = useVisibilityPause();
  const sym = useMemo(() => (symbol || "UNKNOWN").toUpperCase(), [symbol]);

  const drawings = useChartDrawings({
    chartRef,
    seriesRef: candleSeriesRef,
    symbol: sym,
    timeframe,
    enabled: !embedMode,
    chartReadyKey,
  });

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
  // When returning to 'calm_focus', we restore the user's custom-selected chart theme safely.
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
        fontSize: 13,
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
      // MOBILE SCROLL FIX: vertTouchDrag defaults to true in this library, which
      // means a one-finger vertical swipe anywhere on the chart gets captured by
      // the chart itself (to pan/zoom it) instead of being passed through to
      // scroll the page. That's what was freezing the page at the first chart on
      // mobile. horzTouchDrag stays on so users can still drag the chart
      // left/right through time; only vertical drag is released back to the page.
      // When expanded (fullscreen modal), re-enable vertical drag so the chart
      // can be panned freely — body scroll is locked while the modal is open.
      handleScroll: {
        mouseWheel: true,
        pressedMouseMove: true,
        horzTouchDrag: true,
        vertTouchDrag: isExpanded,
      },
      handleScale: { axisPressedMouseMove: true, mouseWheel: true, pinch: true },
    });

    chartRef.current = chart;
    candleSeriesRef.current = null;

    // Keep the candle series in the top ~70% of the chart ONLY when an oscillator
    // sub-pane is actually shown. With no oscillator active, candles use the full
    // height so they don't get crushed into a detached ribbon.
    const hasOscillator = activeIndicators.some((i) => OSCILLATOR_INDICATORS.has(i));
    series_priceScaleMargins(chart, hasOscillator);

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

    const rawCandleColors = {
      upColor: activeCustomTheme ? (activeCustomTheme.upColor || activeCustomTheme.candleUp) : theme.candleSeries.upColor,
      downColor: activeCustomTheme ? (activeCustomTheme.downColor || activeCustomTheme.candleDown) : theme.candleSeries.downColor,
      wickUpColor: activeCustomTheme ? (activeCustomTheme.wickUpColor || activeCustomTheme.wickUp || activeCustomTheme.upColor || activeCustomTheme.candleUp) : theme.candleSeries.wickUpColor,
      wickDownColor: activeCustomTheme ? (activeCustomTheme.wickDownColor || activeCustomTheme.wickDown || activeCustomTheme.downColor || activeCustomTheme.candleDown) : theme.candleSeries.wickDownColor,
      borderUpColor: activeCustomTheme ? (activeCustomTheme.borderUpColor || activeCustomTheme.borderUp || activeCustomTheme.upColor || activeCustomTheme.candleUp) : theme.candleSeries.borderUpColor,
      borderDownColor: activeCustomTheme ? (activeCustomTheme.borderDownColor || activeCustomTheme.borderDown || activeCustomTheme.downColor || activeCustomTheme.candleDown) : theme.candleSeries.borderDownColor,
    };
    const vividCandles = activeCustomTheme
      ? intensifyCandleColors(rawCandleColors, 1.1)
      : rawCandleColors;

    const series = chart.addSeries(CandlestickSeries, vividCandles);
    candleSeriesRef.current = series;
    setChartReadyKey((k) => k + 1);

    /**
     * Adds a line series to its own dedicated oscillator price scale, pinned to
     * the bottom 25% of the chart. This is what stops RSI/MACD/etc. from
     * flattening the candles.
     */
    const addOscillatorSeries = (opts: { color: string; lineWidth: any; title: string; lineStyle?: any }) => {
      const s = chart.addSeries(LineSeries, {
        color: opts.color,
        lineWidth: opts.lineWidth,
        title: opts.title,
        lineStyle: opts.lineStyle,
        priceScaleId: OSCILLATOR_SCALE_ID,
      });
      chart.priceScale(OSCILLATOR_SCALE_ID).applyOptions({
        scaleMargins: { top: 0.78, bottom: 0 },
        borderVisible: false,
      });
      return s;
    };

    const stepSeconds = timeframeStepSeconds(timeframe);

    let displayData: Candle[] = [];
    let lastCandle: Candle | null = null;
    let interval: any;

    async function load() {
      try {
        if (!active) return;
        // Clear any error left over from a previous load (e.g. a transient
        // rate-limit) so a stale overlay never covers freshly loaded candles.
        setError(null);
        setIsLoading(true);

        const allowedLimit = getCandleLimit(userTier);

        if (data && data.length > 0) {
          if (!active) return;
          displayData = data;
        } else {
          let fetched: Candle[] | null = null;
          let lastFetchError: string | null = null;

          try {
            fetched = await fetchTieredHistoricalData(sym, timeframe, userTier);
          } catch (err: any) {
            lastFetchError = err?.message || String(err);
            console.warn("Primary fetch failed for", sym, err);
            // On rate limit, do NOT burn a second credit path via ChartFeedAdapter.
            const msg = String(lastFetchError).toLowerCase();
            if (msg.includes("429") || msg.includes("rate limit") || msg.includes("rate limited")) {
              setError(`Rate limited — charts paused briefly. (${lastFetchError})`);
              setIsLoading(false);
              return;
            }
          }

          if ((!fetched || fetched.length === 0) && active) {
            const primaryWasRateLimited = String(lastFetchError || "")
              .toLowerCase()
              .match(/429|rate limit/);
            if (!primaryWasRateLimited) {
              try {
                fetched = await ChartFeedAdapter.getCandles(sym, timeframe);
              } catch (adapterErr: any) {
                console.error(adapterErr);
                lastFetchError = lastFetchError || adapterErr?.message || String(adapterErr);
              }
            }
          }

          if (!active) return;

          if (fetched && fetched.length > 0) {
            displayData = fetched;
          } else {
            const hint = lastFetchError?.includes("API Key not configured")
              ? " Set TWELVEDATA_API_KEY in .env and restart the server."
              : "";
            setError(
              lastFetchError
                ? `No historical data available for this timeframe. (${lastFetchError})${hint}`
                : "No historical data available for this timeframe."
            );
            setIsLoading(false);
            return;
          }
        }

        if (!active) return;

        // SLICE DATA BOUND TO THE SUBSCRIPTION LEVEL RESTRICTIONS (Up to 40k)
        const tierOptimizedData = trimTrailingStagnantBars(displayData.slice(-allowedLimit));

        let chartCandles = tierOptimizedData as CandlestickData<Time>[];
        if (getActiveRirProgram()) {
          const rirExec = executeActiveRirOnCandles(tierOptimizedData);
          if (rirExec) {
            chartCandles = applyRirColorsToCandles(tierOptimizedData, rirExec) as CandlestickData<Time>[];
          }
        }

        series.setData(chartCandles);

        scheduleChartVisionImmediate(
          { candles: tierOptimizedData, symbol: sym, timeframe },
          (output) => {
            if (!active) return;
            setPatternScan(output.scan);
            setFormingBrief(output.forming);

            try {
              const patternLines = buildPatternLineOverlays(tierOptimizedData, output.scan.patterns);
              for (const overlay of patternLines) {
                const line = chart.addSeries(LineSeries, {
                  color: overlay.color,
                  lineWidth: overlay.lineWidth as 1 | 2 | 3 | 4,
                  lineStyle: overlay.dashed ? LineStyle.Dashed : LineStyle.Solid,
                  title: '',
                  priceLineVisible: false,
                  lastValueVisible: false,
                  crosshairMarkerVisible: false,
                });
                line.setData(overlay.points);
              }

              const candleMarkers = [
                ...buildCandlestickMarkers(tierOptimizedData, output.scan.patterns),
                ...buildPatternPeakMarkers(tierOptimizedData, output.scan.patterns),
              ];
              if (candleMarkers.length > 0) {
                createSeriesMarkers(series, candleMarkers as any);
              }
            } catch (overlayErr) {
              console.warn('[LightweightCandles] Pattern overlay draw skipped:', overlayErr);
            }
          },
        );

        chart.timeScale().applyOptions({ barSpacing: tierOptimizedData.length > 800 ? 6 : 8, minBarSpacing: 3 });

        const isMobile = typeof window !== "undefined" && window.innerWidth < 768;
        const visibleBars = embedMode ? 72 : isMobile ? 96 : 160;
        const totalBars = tierOptimizedData.length;
        if (totalBars > 0) {
          const from = Math.max(0, totalBars - Math.min(visibleBars, totalBars));
          chart.timeScale().setVisibleLogicalRange({ from, to: totalBars });
        }

        barCountRef.current = tierOptimizedData.length;
        const isMobileViewport =
          typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches;
        focusRecentBars(
          chart.timeScale(),
          tierOptimizedData.length,
          visibleBarTarget(isMobileViewport, isExpanded),
        );

        lastCandle = tierOptimizedData[tierOptimizedData.length - 1];

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
              // ---- PRICE-SCALE OVERLAYS (stay on the candle axis) ----
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
                const uLine = chart.addSeries(LineSeries, { color: "#22C55E", lineWidth: 2, title: "BB upper" });
                const lLine = chart.addSeries(LineSeries, { color: "#EF4444", lineWidth: 2, title: "BB lower" });

                mLine.setData(basisData);
                uLine.setData(upperData);
                lLine.setData(lowerData);
              }
              else if (indAbbr === "ICHIMOKU") {
                const ichiData = IndicatorEngine.calculate("ICHIMOKU", tierOptimizedData, ichimokuSettings);
                const linePts = (key: "tenkan" | "kijun" | "spanA" | "spanB" | "chikou") =>
                  ichiData
                    .filter((d: any) => d[key] != null && Number.isFinite(d[key]))
                    .map((d: any) => ({ time: d.time as Time, value: d[key] as number }));

                const convLine = chart.addSeries(LineSeries, { color: "#2962FF", lineWidth: 2, title: "Conversion (Tenkan)" });
                convLine.setData(linePts("tenkan"));

                const bsLine = chart.addSeries(LineSeries, { color: "#B71C1C", lineWidth: 2, title: "Base (Kijun)" });
                bsLine.setData(linePts("kijun"));

                const lagLine = chart.addSeries(LineSeries, { color: "#43A047", lineWidth: 1, title: "Lagging (Chikou)" });
                lagLine.setData(linePts("chikou"));

                const spanALine = chart.addSeries(LineSeries, { color: "#A5D6A7", lineWidth: 1, lineStyle: LineStyle.Dashed, title: "Span A" });
                spanALine.setData(linePts("spanA"));

                const spanBLine = chart.addSeries(LineSeries, { color: "#EF9A9A", lineWidth: 1, lineStyle: LineStyle.Dashed, title: "Span B" });
                spanBLine.setData(linePts("spanB"));

                const bullCloudData = ichiData.map((d: any) => {
                  if (d.spanA == null || d.spanB == null) return { time: d.time as Time, value: null };
                  const val = d.spanA >= d.spanB ? d.spanA : null;
                  return { time: d.time as Time, value: val };
                }).filter((d: any) => d.value !== null);

                const bearCloudData = ichiData.map((d: any) => {
                  if (d.spanA == null || d.spanB == null) return { time: d.time as Time, value: null };
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
              else if (indAbbr === "VWAP") {
                const vwapData = IndicatorEngine.calculate("VWAP", tierOptimizedData);
                const vwapLine = chart.addSeries(LineSeries, {
                  color: "#F72585",
                  lineWidth: 2,
                  title: "VWAP",
                });
                vwapLine.setData(vwapData as any[]);
              }
              // ---- OSCILLATORS (own separate scale, pinned to bottom) ----
              else if (indAbbr === "RSI") {
                const rsiData = IndicatorEngine.calculate("RSI", tierOptimizedData, { period: 14 });
                const rsiLine = addOscillatorSeries({ color: "#00FF66", lineWidth: 2, title: "RSI (14)" });
                rsiLine.setData(rsiData as any[]);
              }
              else if (indAbbr === "MACD") {
                const macdOutput = IndicatorEngine.calculate("MACD", tierOptimizedData, { fastPeriod: 12, slowPeriod: 26, signalPeriod: 9 });
                const macdLineData = macdOutput.map((d: any) => ({ time: d.time as Time, value: d.macd }));
                const signalLineData = macdOutput.map((d: any) => ({ time: d.time as Time, value: d.signal }));

                const mLine = addOscillatorSeries({ color: "#3B82F6", lineWidth: 2, title: "MACD Line" });
                const sLine = addOscillatorSeries({ color: "#F59E0B", lineWidth: 2, title: "Signal Line" });
                mLine.setData(macdLineData);
                sLine.setData(signalLineData);
              }
              else if (indAbbr === "ATR") {
                const atrData = IndicatorEngine.calculate("ATR", tierOptimizedData, { period: 14 });
                const atrLine = addOscillatorSeries({ color: "#FF4500", lineWidth: 2, title: "ATR (14)" });
                atrLine.setData(atrData as any[]);
              }
              else if (indAbbr === "OBV") {
                const obvData = IndicatorEngine.calculate("OBV", tierOptimizedData);
                const obvLine = addOscillatorSeries({ color: "#118AB2", lineWidth: 2, title: "OBV" });
                obvLine.setData(obvData as any[]);
              }
              else if (indAbbr === "ADX" || indAbbr === "DMI") {
                const adxData = IndicatorEngine.calculate(indAbbr, tierOptimizedData, { period: 14 });
                const adxValueData = adxData.map((d: any) => ({ time: d.time as Time, value: d.adx }));
                const plusData = adxData.map((d: any) => ({ time: d.time as Time, value: d.plusDI }));
                const minusData = adxData.map((d: any) => ({ time: d.time as Time, value: d.minusDI }));
                addOscillatorSeries({ color: "#00D9FF", lineWidth: 2, title: "ADX (14)" }).setData(adxValueData);
                if (indAbbr === "DMI") {
                  addOscillatorSeries({ color: "#22C55E", lineWidth: 1, title: "+DI" }).setData(plusData);
                  addOscillatorSeries({ color: "#EF4444", lineWidth: 1, title: "-DI" }).setData(minusData);
                }
              }
              else if (indAbbr === "STOCH" || indAbbr === "STOCHRSI") {
                const st = IndicatorEngine.calculate(indAbbr, tierOptimizedData);
                addOscillatorSeries({ color: "#B5179E", lineWidth: 2, title: `${indAbbr} %K` }).setData(
                  st.map((d: any) => ({ time: d.time as Time, value: d.k }))
                );
                addOscillatorSeries({ color: "#FFD166", lineWidth: 1, title: `${indAbbr} %D` }).setData(
                  st.map((d: any) => ({ time: d.time as Time, value: d.d }))
                );
              }
              else if (indAbbr === "DC" || indAbbr === "KC") {
                const ch = IndicatorEngine.calculate(indAbbr, tierOptimizedData);
                const midKey = indAbbr === "DC" ? "middle" : "middle";
                chart.addSeries(LineSeries, { color: "#F72585", lineWidth: 1, title: `${indAbbr} mid` }).setData(
                  ch.map((d: any) => ({ time: d.time as Time, value: d[midKey] }))
                );
                chart.addSeries(LineSeries, { color: "#22C55E", lineWidth: 1, title: `${indAbbr} upper` }).setData(
                  ch.map((d: any) => ({ time: d.time as Time, value: d.upper }))
                );
                chart.addSeries(LineSeries, { color: "#EF4444", lineWidth: 1, title: `${indAbbr} lower` }).setData(
                  ch.map((d: any) => ({ time: d.time as Time, value: d.lower }))
                );
              }
              else if (indAbbr === "SUPERTREND" || indAbbr === "PSAR") {
                const series = IndicatorEngine.calculate(indAbbr, tierOptimizedData);
                chart.addSeries(LineSeries, {
                  color: indAbbr === "PSAR" ? "#FFD166" : "#00FFCC",
                  lineWidth: 2,
                  title: indAbbr,
                }).setData(series.map((d: any) => ({ time: d.time as Time, value: d.value })));
              }
              else if (indAbbr === "PIVOT") {
                const piv = IndicatorEngine.calculate("PIVOT", tierOptimizedData);
                for (const key of ["pp", "r1", "s1"] as const) {
                  chart.addSeries(LineSeries, {
                    color: key === "pp" ? "#F72585" : key === "r1" ? "#22C55E" : "#EF4444",
                    lineWidth: 1,
                    lineStyle: LineStyle.Dashed,
                    title: key.toUpperCase(),
                  }).setData(piv.map((d: any) => ({ time: d.time as Time, value: d[key] })));
                }
              }
              else if (indAbbr === "PPO" || indAbbr === "RVI" || indAbbr === "KST" || indAbbr === "TSI" || indAbbr === "FT") {
                const multi = IndicatorEngine.calculate(indAbbr, tierOptimizedData);
                const primaryKey = indAbbr === "PPO" ? "ppo" : indAbbr === "RVI" ? "rvi" : indAbbr === "KST" ? "kst" : indAbbr === "TSI" ? "tsi" : "fisher";
                const secondaryKey = indAbbr === "FT" ? "trigger" : "signal";
                addOscillatorSeries({ color, lineWidth: 2, title: indAbbr }).setData(
                  multi.map((d: any) => ({ time: d.time as Time, value: d[primaryKey] }))
                );
                addOscillatorSeries({ color: "#F59E0B", lineWidth: 1, title: `${indAbbr} signal` }).setData(
                  multi.map((d: any) => ({ time: d.time as Time, value: d[secondaryKey] }))
                );
              }
              else {
                // Generic single-line series from IndicatorBank
                const lineData = IndicatorEngine.calculate(indAbbr, tierOptimizedData);
                const points = Array.isArray(lineData)
                  ? lineData
                      .map((d: any) => ({
                        time: d.time as Time,
                        value: typeof d.value === "number" ? d.value : d.adx ?? d.k ?? d.ppo ?? null,
                      }))
                      .filter((d: any) => d.value != null)
                  : [];
                const isOscillator = OSCILLATOR_INDICATORS.has(indAbbr);
                const otherLine = isOscillator
                  ? addOscillatorSeries({ color, lineWidth: 2, title: `${indAbbr} (Live)` })
                  : chart.addSeries(LineSeries, { color, lineWidth: 2, title: `${indAbbr} (Live)` });
                otherLine.setData(points as any[]);
              }
            } catch (err) {
              console.error(`Error loading indicator line for ${indAbbr}`, err);
            }
          });
        }

        // THE RIVER: execute the user's compiled Pine Script bar-by-bar over the
        // REAL candles on this chart and render its actual output — plots,
        // buy/sell shape markers, and signal-colored (gold) candles.
        if (showMineIndicator) {
          try {
            const activeScript = getActiveRiverIndicator();
            if (!activeScript) {
              console.warn("[The River] MINE is on but no compiled indicator is active. Import one in The River workstation.");
            } else {
              const result = runPine(activeScript.source, tierOptimizedData, {
                inputOverrides: activeScript.inputs,
                symbol: sym,
                timeframe,
              });

              const RIVER_PLOT_FALLBACKS = ["#FF007F", "#00D9FF", "#FFD700", "#00FF66", "#FFAA00", "#7A3BFF"];
              result.plots.forEach((plot, plotIdx) => {
                const color = plot.color || RIVER_PLOT_FALLBACKS[plotIdx % RIVER_PLOT_FALLBACKS.length];
                const isHistogram = plot.style === "histogram" || plot.style === "columns";
                let plotSeries;
                if (isHistogram) {
                  plotSeries = chart.addSeries(HistogramSeries, {
                    color,
                    title: plot.title,
                    priceScaleId: result.meta.overlay ? "right" : OSCILLATOR_SCALE_ID,
                  });
                } else if (result.meta.overlay) {
                  plotSeries = chart.addSeries(LineSeries, {
                    color,
                    lineWidth: (plot.lineWidth || 2) as any,
                    title: plot.title,
                    lineStyle: plot.style === "circles" || plot.style === "cross" ? LineStyle.Dotted : LineStyle.Solid,
                  });
                } else {
                  // Non-overlay scripts (RSI-like) live on the oscillator sub-scale.
                  plotSeries = addOscillatorSeries({ color, lineWidth: (plot.lineWidth || 2) as any, title: plot.title });
                  series_priceScaleMargins(chart, true);
                }
                // na points become whitespace so warm-up gaps render honestly.
                const plotData = plot.points.map(p =>
                  p.value === null ? { time: p.time as Time } : { time: p.time as Time, value: p.value }
                );
                plotSeries.setData(plotData as any[]);
              });

              if (result.markers.length > 0) {
                const markers: SeriesMarker<Time>[] = result.markers.map(m => ({
                  time: m.time as Time,
                  position: m.position,
                  shape: m.shape,
                  color: m.color,
                  text: m.text,
                }));
                createSeriesMarkers(series, markers);
              }

              // barcolor(): repaint the exact candles the script flagged (Gold Bars).
              if (result.barColors.length > 0) {
                const colorByTime = new Map(result.barColors.map(bc => [bc.time, bc.color]));
                series.setData(tierOptimizedData.map(d => {
                  const c = colorByTime.get(d.time);
                  return c
                    ? ({ ...d, time: d.time as Time, color: c, wickColor: c, borderColor: c } as CandlestickData<Time>)
                    : (d as CandlestickData<Time>);
                }));
              }

              result.hlines.forEach(hl => {
                series.createPriceLine({ price: hl.value, color: hl.color, lineWidth: 1, lineStyle: LineStyle.Dashed, axisLabelVisible: true, title: hl.title });
              });

              result.warnings.forEach(w => console.warn(`[The River] ${activeScript.name}: ${w}`));
            }
          } catch (err) {
            console.error("[The River] Compiled indicator failed on this chart's data:", err);
          }
        }

        // Live tick — align with server quote cache (CACHE_TTL_QUOTE ≈ 5s).
        // Sub-second polling burned the Express marketLimiter (was 300/15min) and
        // blanked charts with a false "rate limit" while Twelve Data was fine.
        let tickDelay = 5000;
        if (timeframe.toLowerCase().includes("m") && timeframe !== "1M") tickDelay = 5000;
        else if (timeframe.includes("d") || timeframe.includes("w") || timeframe === "1M" || timeframe === "YTD") tickDelay = 10000;

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
          const moveFloor = minMeaningfulPriceMove(lastCandle.close);

          // Weekend / closed market: wall-clock keeps ticking, but the quote is
          // stuck at last print. Never invent new flat bars — that barcodes M1–M15
          // and ruins weekend analysis of real session history.
          if (currentTime > lastCandle.time) {
            if (Math.abs(newClose - lastCandle.close) < moveFloor) {
              return;
            }
            // Meaningful gap/move (e.g. Monday open) → open a real new bar.
            const updateObj = {
              time: currentTime as Time,
              open: lastCandle.close,
              high: Math.max(lastCandle.close, newClose),
              low: Math.min(lastCandle.close, newClose),
              close: newClose,
            };
            if (!active) return;
            series.update(updateObj);
            lastCandle = { ...updateObj, time: currentTime };
            return;
          }

          // Same bucket as the last real bar — update in place only.
          const newHigh = Math.max(lastCandle.high, newClose);
          const newLow = Math.min(lastCandle.low, newClose);
          if (
            newClose === lastCandle.close &&
            newHigh === lastCandle.high &&
            newLow === lastCandle.low
          ) {
            return;
          }

          if (!active) return;

          const updateObj = {
            time: lastCandle.time as Time,
            open: lastCandle.open,
            high: newHigh,
            low: newLow,
            close: newClose,
          };

          series.update(updateObj);
          lastCandle = { ...updateObj, time: lastCandle.time };
        }, tickDelay);

        if (active) setIsLoading(false);
      } catch (err) {
        if (!active) return;
        const msg = err instanceof Error ? err.message : String(err);
        console.warn("[LightweightCandles load error]", err);
        setError(msg || "Chart failed to load.");
        setIsLoading(false);
      }
    }

    load().catch(err => {
      console.warn("[LightweightCandles load promise catch]", err);
      if (active) {
        setError(err instanceof Error ? err.message : String(err));
        setIsLoading(false);
      }
    });

    const resizeObserver = new ResizeObserver((entries) => {
      if (!active || !entries || entries.length === 0) return;
      const { width, height: rectHeight } = entries[0].contentRect;
      if (width > 0) {
        chart.applyOptions({
          width,
          height: rectHeight > 0 ? rectHeight : initialHeight
        });
      }
    });

    resizeObserver.observe(containerRef.current);

    return () => {
      active = false;
      chartRef.current = null;
      candleSeriesRef.current = null;
      barCountRef.current = 0;
      cancelChartVision(sym, timeframe);
      if (takeSnapshotRef) {
        takeSnapshotRef.current = null;
      }
      if (interval) clearInterval(interval);
      resizeObserver.disconnect();
      chart.remove();
    };
  // NOTE: `error` is intentionally NOT a dependency — re-running the effect on
  // error changes caused a chart-rebuild/refetch loop whenever a fetch failed.
  }, [data, height, isExpanded, profile, theme, activeCustomTheme, defaultTheme, timeframe, sym, userTier, crosshairEnabled, takeSnapshotRef, visible, activeIndicators.join(","), showMineIndicator, mineIndicatorName, JSON.stringify(ichimokuSettings)]);

  const handleFocusRecent = () => {
    const chart = chartRef.current;
    if (!chart || barCountRef.current <= 0) return;
    const isMobileViewport =
      typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches;
    focusRecentBars(
      chart.timeScale(),
      barCountRef.current,
      visibleBarTarget(isMobileViewport, isExpanded),
    );
  };

  return (
    <div
      ref={containerRef}
      style={{
        width: "100%",
        height: isExpanded ? "100%" : `${height}px`,
        minHeight: isExpanded ? 320 : undefined,
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
      {isLoading && !error && (
        <div className="absolute inset-0 z-40 flex flex-col items-center justify-center gap-2 bg-black/70 text-cyan-400 font-mono text-xs p-4 text-center">
          <span className="animate-pulse">Loading {sym} chart…</span>
        </div>
      )}
      {error && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center gap-3 bg-black/85 text-red-400 font-mono text-sm p-6 text-center">
          <span className="text-red-500 font-bold uppercase tracking-wider text-xs">Chart data unavailable</span>
          <span>{error}</span>
          <button
            type="button"
            className="mt-1 rounded-md border border-cyan-500/40 bg-cyan-500/10 px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-cyan-300 hover:bg-cyan-500/20"
            onClick={() => {
              setError(null);
              setIsLoading(true);
              // Force effect remount by nudging a harmless URL hash — chart deps
              // already include timeframe/sym; full reload is the reliable recovery
              // after an Express rate-limit window.
              window.location.reload();
            }}
          >
            Retry chart
          </button>
        </div>
      )}
      <ChartFormingWatch
        symbol={sym}
        brief={!hidePatternChrome && showFormingWatch ? formingBrief : null}
        onClose={() => {
          setShowFormingWatch(false);
          try {
            localStorage.setItem("cp_chart_forming_watch_open", "0");
          } catch {
            /* ignore */
          }
        }}
      />
      {!hidePatternChrome && !showFormingWatch && (
        <button
          type="button"
          onClick={() => {
            setShowFormingWatch(true);
            try {
              localStorage.setItem("cp_chart_forming_watch_open", "1");
            } catch {
              /* ignore */
            }
          }}
          aria-label="Open forming watch"
          className="absolute top-3 right-3 z-50 flex items-center gap-1.5 rounded-lg border border-[#BF00FF]/35 bg-black/85 px-2.5 py-1.5 text-[9px] font-black uppercase tracking-wider text-[#BF00FF] shadow-lg backdrop-blur-md transition-all hover:border-[#FF1493]/50 hover:text-[#FF1493]"
        >
          <Radio size={10} className="animate-pulse" />
          Forming
        </button>
      )}
      <ChartPatternHud
        symbol={sym}
        scan={!hidePatternChrome && showPatternHud ? patternScan : null}
        onClose={() => {
          setShowPatternHud(false);
          try {
            localStorage.setItem("cp_chart_pattern_hud_open", "0");
          } catch {
            /* ignore */
          }
        }}
      />
      {!hidePatternChrome && !showPatternHud && (
        <button
          type="button"
          onClick={() => {
            setShowPatternHud(true);
            try {
              localStorage.setItem("cp_chart_pattern_hud_open", "1");
            } catch {
              /* ignore */
            }
          }}
          aria-label="Open pattern scanner"
          className="absolute bottom-3 left-3 z-50 flex items-center gap-1.5 rounded-lg border border-[#FF1493]/35 bg-black/85 px-2.5 py-1.5 text-[9px] font-black uppercase tracking-wider text-[#FF1493] shadow-lg backdrop-blur-md transition-all hover:border-[#BF00FF]/50 hover:text-[#BF00FF]"
        >
          <Scan size={10} />
          Patterns
        </button>
      )}
      {!embedMode && (
        <div className="absolute bottom-3 right-3 z-[60] flex items-end gap-1.5">
          <ChartDrawingToolbar
            activeTool={drawings.activeTool}
            onToolChange={drawings.setActiveTool}
            drawColor={drawings.drawColor}
            onColorChange={drawings.setDrawColor}
            hint={drawings.hint}
            canUndo={drawings.canUndo}
            onUndo={drawings.undo}
            onClear={drawings.clearAll}
          />
          <button
            type="button"
            onClick={handleFocusRecent}
            aria-label="Focus recent bars"
            title="Snap to recent price action"
            className="flex h-8 w-8 items-center justify-center rounded-md border border-[#00D9FF]/25 bg-black/85 text-[#00D9FF] shadow-lg backdrop-blur-md transition-all hover:border-[#00D9FF]/60 hover:bg-[#00D9FF]/10 active:scale-95"
          >
            <Focus size={13} strokeWidth={2.5} />
          </button>
          <ChartZoomControls chartRef={chartRef} />
        </div>
      )}
      {!embedMode && (
        <button
          onClick={() => setCrosshairEnabled(!crosshairEnabled)}
          className={`absolute z-40 bg-black/75 backdrop-blur-sm hover:bg-black text-[9px] px-2.5 py-1.5 rounded-lg border border-white/15 hover:border-[#00D9FF]/40 transition-all flex items-center gap-1.5 cursor-pointer text-zinc-300 font-mono tracking-wider select-none shadow-lg active:scale-95 ${
            !hidePatternChrome && showFormingWatch ? 'top-3 left-3' : 'top-3 right-3'
          }`}
          title="Toggle Crosshair Coordinates tracking"
          id={`crosshair_toggle_${symbol}`}
        >
          <Crosshair size={10} className={crosshairEnabled ? "text-[#00D9FF] animate-pulse" : "text-zinc-500"} />
          <span>{crosshairEnabled ? "CROSSHAIR: ON" : "CROSSHAIR: OFF"}</span>
        </button>
      )}
    </div>
  );
}

/**
 * Reserves the bottom slice of the main price scale so candles occupy the top
 * ~70% of the chart, leaving visual room for the oscillator sub-pane — but ONLY
 * when an oscillator is actually active. With no oscillator, candles use nearly
 * the full height (symmetric small margins) instead of being squashed into a
 * detached ribbon with empty space below.
 */
function series_priceScaleMargins(chart: any, hasOscillator: boolean) {
  try {
    chart.priceScale("right").applyOptions({
      scaleMargins: hasOscillator
        ? { top: 0.08, bottom: 0.28 }   // leave room for the oscillator sub-pane
        : { top: 0.08, bottom: 0.08 },  // no oscillator: candles fill the chart
    });
  } catch (e) {
    console.warn("Could not apply candle price-scale margins:", e);
  }
}
