"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { createChart, ColorType, Time, CandlestickData, CandlestickSeries, BarSeries, BaselineSeries, CrosshairMode, LineSeries, LineStyle, LineType, AreaSeries, HistogramSeries, createSeriesMarkers, SeriesMarker, type IChartApi, type ISeriesApi, type SeriesType } from "lightweight-charts";
import { IndicatorEngine } from "../../core/engine/IndicatorEngine";
import { calculateCOT, fetchCotReportsForChart } from "../../indicators/sentiment/COT";
import { getActiveRiverIndicator, runPine } from "../../river/riverEngine";
import {
  themeProfiles,
  type ThemeProfileId,
} from "../../lib/theme/profiles";
import { chartThemes } from "../../config/chartThemes";
import { lightweightThemeAdapter } from "../../lib/charts/lightweightThemeAdapter";
import { cleanCandleSeriesOptions } from "../../lib/charts/cleanCandleSeries";
import { ChartFeedAdapter } from "../../engine/chartFeedAdapter";
import { getCandleLimit } from "../../config/tierLimits";
import { fetchTieredHistoricalData } from "../../services/marketData";
import { executeActiveRirOnCandles, applyRirColorsToCandles, getActiveRirProgram } from "../../river/runtime";
import { scanAllPatterns, buildPatternLineOverlays, buildCandlestickMarkers, buildPatternPeakMarkers, scheduleChartVisionImmediate, cancelChartVision } from "../../patterns";
import type { PatternScanResult, FormingStructureBrief } from "../../patterns";
import { ChartPatternHud } from "./ChartPatternHud";
import { ChartFormingWatch } from "./ChartFormingWatch";
import { ChartZoomControls } from "./ChartZoomControls";
import { ChartBackgroundToggle } from "./ChartBackgroundToggle";
import { ChartSeriesStylePicker } from "./ChartSeriesStylePicker";
import { useChartDrawings, useRegisterChartDrawingSession } from "./drawings";
import { useChartSeriesStyle } from "../../hooks/useChartSeriesStyle";
import {
  seriesFamily,
  showsVolumeOverlay,
  transformOhlc,
  volumeAtPrice,
  relativeVolumes,
  isBrickTransform,
  type PriceSeriesType,
  type OhlcBar,
} from "../../lib/charts/priceSeriesStyles";
import { Crosshair, Scan, Radio, Focus, Maximize2, Minimize2 } from "lucide-react";
import { useVisibilityPause } from "../../hooks/useVisibilityPause";
import { focusRecentBars, visibleBarTarget } from "../../lib/charts/chartZoom";
import {
  attachShiftWheelPriceScale,
  chartHandleScroll,
  CHART_HANDLE_SCALE,
  CHART_PRICE_SCALE_GESTURE,
  CHART_TIME_SCALE_GESTURE,
} from "../../lib/charts/chartInteraction";
import { MARKET_CHART_DESKTOP_CANDLE_HEIGHT } from "../../constants/chartLayout";
import { nextChartPixelSize } from "../../lib/charts/chartResize";
import { chartBackgroundColors } from "../../lib/charts/chartBackground";
import { useChartBackgroundMode } from "../../hooks/useChartBackgroundMode";
import { useOptionalDeskAppearance } from "../desks/DeskAppearanceContext";
import type { DeskVisualPaint } from "../../lib/deskColorChart";

/** Visible in the chart chrome — if live does not show this string, Cloud Run is on an old build. */
export const CHART_UI_BUILD_STAMP = "CHART-BUILD-2026-09-01-FILL";

export type { PriceSeriesType };

type Candle = {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
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
  "EFI", "EOM", "VOL", "NETVOL", "VO", "COT",
]);
const OSCILLATOR_SCALE_ID = "oscillator-scale";

function uniqueAscendingTimes<T extends { time: number }>(candles: T[]): T[] {
  const out: T[] = [];
  for (const c of candles) {
    if (!Number.isFinite(c.time)) continue;
    const prev = out[out.length - 1];
    if (!prev) {
      out.push(c);
      continue;
    }
    if (c.time === prev.time) {
      out[out.length - 1] = c;
      continue;
    }
    if (c.time > prev.time) out.push(c);
  }
  return out;
}

type PriceBar = {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
  color?: string;
  wickColor?: string;
  borderColor?: string;
};

function hexAlpha(hex: string, a: number): string {
  const raw = hex.trim().replace("#", "");
  if (raw.length !== 6) return hex;
  const r = parseInt(raw.slice(0, 2), 16);
  const g = parseInt(raw.slice(2, 4), 16);
  const b = parseInt(raw.slice(4, 6), 16);
  if (![r, g, b].every(Number.isFinite)) return hex;
  return `rgba(${r},${g},${b},${Math.max(0, Math.min(1, a))})`;
}

function applyVolumeTint(candles: PriceBar[], up: string, down: string): PriceBar[] {
  const rel = relativeVolumes(candles);
  return candles.map((c, i) => {
    const bull = c.close >= c.open;
    const tint = hexAlpha(bull ? up : down, 0.35 + rel[i] * 0.35);
    return { ...c, color: tint, wickColor: bull ? up : down, borderColor: bull ? up : down };
  });
}

function toPriceSeriesData(
  candles: PriceBar[],
  type: PriceSeriesType,
  colors: { up: string; down: string },
) {
  candles = uniqueAscendingTimes(candles);
  const family = seriesFamily(type);
  if (family === "line" || family === "area" || family === "baseline" || family === "histogram") {
    return candles.map((c) => ({
      time: c.time as Time,
      value: c.close,
      color: type === "columns" ? (c.close >= c.open ? colors.up : colors.down) : undefined,
    }));
  }
  const painted = type === "volume_candles" ? applyVolumeTint(candles, colors.up, colors.down) : candles;
  return painted.map((c) => {
    const bar: CandlestickData<Time> = {
      time: c.time as Time,
      open: c.open,
      high: c.high,
      low: c.low,
      close: c.close,
    };
    if (c.color) {
      bar.color = c.color;
      bar.wickColor = c.wickColor ?? c.color;
      bar.borderColor = c.borderColor ?? c.color;
    }
    return bar;
  });
}

function toPriceSeriesUpdate(
  bar: { time: number; open: number; high: number; low: number; close: number },
  type: PriceSeriesType,
) {
  const family = seriesFamily(type);
  if (family === "line" || family === "area" || family === "baseline" || family === "histogram") {
    return { time: bar.time as Time, value: bar.close };
  }
  return {
    time: bar.time as Time,
    open: bar.open,
    high: bar.high,
    low: bar.low,
    close: bar.close,
  };
}

export function LightweightCandles({
  data,
  symbol = "UNKNOWN",
  profileId,
  height = MARKET_CHART_DESKTOP_CANDLE_HEIGHT,
  isExpanded = false,
  fillParent = false,
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
  /** Publish drawing controls to the Pattern Scanner column toolbox (Charts tab). */
  publishDrawingSession = false,
  hideChartToolbar = false,
  hidePatternOverlays = false,
  priceSeriesType,
  onPriceSeriesTypeChange,
  onExpandToggle,
  visualPaint: visualPaintProp,
}: {
  data?: Candle[];
  symbol?: string;
  profileId: string;
  height?: number;
  isExpanded?: boolean;
  /** Fill the parent flex box (phone stacked full-viewport panels). */
  fillParent?: boolean;
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
  /** When true, this chart owns the left-column Drawing Tools panel. */
  publishDrawingSession?: boolean;
  /** Hide the in-plot CROSSHAIR/zoom bar so candles fill the empty-slot box. */
  hideChartToolbar?: boolean;
  /** Hide forming/pattern HUD (Retail Door keeps the chart visually quiet). */
  hidePatternOverlays?: boolean;
  /** Price series style. When omitted, the chart remembers the last style in this browser. */
  priceSeriesType?: PriceSeriesType;
  onPriceSeriesTypeChange?: (type: PriceSeriesType) => void;
  /** Full-window expand for this slot — not zoom-reset. */
  onExpandToggle?: () => void;
  /** Desk color-chart overrides (charts, candles, indicators). */
  visualPaint?: DeskVisualPaint;
}) {
  const deskAppearance = useOptionalDeskAppearance();
  const visualPaint = visualPaintProp ?? deskAppearance?.visualPaint;
  const hidePatternChrome = embedMode || useDedicatedPatternPanel || hidePatternOverlays;
  const [storedSeriesStyle, setStoredSeriesStyle] = useChartSeriesStyle();
  const seriesStyle = priceSeriesType ?? storedSeriesStyle;
  const setSeriesStyle = onPriceSeriesTypeChange ?? setStoredSeriesStyle;
  const containerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const layoutRef = useRef({ isExpanded, fillParent });
  layoutRef.current = { isExpanded, fillParent };
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
  const registerDrawingSession = useRegisterChartDrawingSession();

  // Drawings attach on the candle series (engine only — toolbar lives under Pattern Scanner).
  const drawings = useChartDrawings({
    chartRef,
    seriesRef: candleSeriesRef,
    symbol: sym,
    timeframe,
    enabled: !embedMode,
    chartReadyKey,
  });

  useEffect(() => {
    if (!publishDrawingSession || embedMode || !registerDrawingSession) return;
    return registerDrawingSession({
      symbol: sym,
      timeframe,
      activeTool: drawings.activeTool,
      setActiveTool: drawings.setActiveTool,
      drawColor: drawings.drawColor,
      setDrawColor: drawings.setDrawColor,
      hint: drawings.hint,
      canUndo: drawings.canUndo,
      undo: drawings.undo,
      clearAll: drawings.clearAll,
      annotationText: drawings.annotationText,
      setAnnotationText: drawings.setAnnotationText,
      annotationGlyph: drawings.annotationGlyph,
      setAnnotationGlyph: drawings.setAnnotationGlyph,
    });
  }, [
    publishDrawingSession,
    embedMode,
    registerDrawingSession,
    sym,
    timeframe,
    drawings.activeTool,
    drawings.drawColor,
    drawings.hint,
    drawings.canUndo,
    drawings.annotationText,
    drawings.annotationGlyph,
    drawings.setActiveTool,
    drawings.setDrawColor,
    drawings.undo,
    drawings.clearAll,
    drawings.setAnnotationText,
    drawings.setAnnotationGlyph,
  ]);

  const marketBarsRef = useRef<OhlcBar[]>([]);
  useEffect(() => {
    drawings.setMarketBars(marketBarsRef.current);
    if (showsVolumeOverlay(seriesStyle) && marketBarsRef.current.length) {
      const mode = seriesStyle === "tpo" ? "tpo" : seriesStyle === "volume_footprint" ? "footprint" : "profile";
      drawings.setVolumeOverlay(volumeAtPrice(marketBarsRef.current), mode);
    }
  }, [chartReadyKey, drawings.setMarketBars, drawings.setVolumeOverlay, seriesStyle]);

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
  const [backgroundMode] = useChartBackgroundMode();
  const paint = useMemo(() => {
    const base = chartBackgroundColors(backgroundMode, {
      background: activeCustomTheme?.background || profile.bgBottom,
      text: activeCustomTheme?.text || profile.text,
      grid: activeCustomTheme?.grid || profile.grid,
    });
    return {
      background: visualPaint?.chart || base.background,
      text: visualPaint?.text || base.text,
      grid: visualPaint?.grid || base.grid,
    };
  }, [backgroundMode, activeCustomTheme, profile, visualPaint]);

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
      // Library ResizeObserver fills the flex parent. Explicit width/height
      // are fallbacks only if that observer is missing.
      autoSize: true,
      width: initialWidth,
      height: initialHeight,
      layout: {
        background: {
          type: ColorType.Solid,
          color: paint.background,
        },
        textColor: paint.text,
        fontFamily: '"IBM Plex Mono", ui-monospace, "SF Mono", Consolas, monospace',
        fontSize: 13,
        attributionLogo: false,
      },
      grid: {
        vertLines: { color: paint.grid },
        horzLines: { color: paint.grid },
      },
      crosshair: {
        ...defaultTheme.crosshair,
        mode: crosshairEnabled ? CrosshairMode.Normal : CrosshairMode.Hidden,
      },
      rightPriceScale: {
        ...defaultTheme.rightPriceScale,
        ...CHART_PRICE_SCALE_GESTURE,
      },
      timeScale: {
        ...defaultTheme.timeScale,
        ...CHART_TIME_SCALE_GESTURE,
      },
      // Phone stacked charts keep vertTouchDrag off so a vertical swipe can
      // snap to the next full-screen slot. Expanded / desktop / tablet keep
      // vertical pan. Time stretch = drag the bottom axis; price lift/squish =
      // drag the right axis (or the axis buttons / Shift+wheel).
      handleScroll: chartHandleScroll(Boolean(layoutRef.current.isExpanded || !layoutRef.current.fillParent)),
      handleScale: CHART_HANDLE_SCALE,
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
      upColor: visualPaint?.candleUp || (activeCustomTheme ? (activeCustomTheme.upColor || activeCustomTheme.candleUp) : theme.candleSeries.upColor),
      downColor: visualPaint?.candleDown || (activeCustomTheme ? (activeCustomTheme.downColor || activeCustomTheme.candleDown) : theme.candleSeries.downColor),
      wickUpColor: visualPaint?.candleUp || (activeCustomTheme ? (activeCustomTheme.wickUpColor || activeCustomTheme.wickUp || activeCustomTheme.upColor || activeCustomTheme.candleUp) : theme.candleSeries.wickUpColor),
      wickDownColor: visualPaint?.candleDown || (activeCustomTheme ? (activeCustomTheme.wickDownColor || activeCustomTheme.wickDown || activeCustomTheme.downColor || activeCustomTheme.candleDown) : theme.candleSeries.wickDownColor),
      borderUpColor: visualPaint?.candleUp || (activeCustomTheme ? (activeCustomTheme.borderUpColor || activeCustomTheme.borderUp || activeCustomTheme.upColor || activeCustomTheme.candleUp) : theme.candleSeries.borderUpColor),
      borderDownColor: visualPaint?.candleDown || (activeCustomTheme ? (activeCustomTheme.borderDownColor || activeCustomTheme.borderDown || activeCustomTheme.downColor || activeCustomTheme.candleDown) : theme.candleSeries.borderDownColor),
    };
    // TradingView-clean: body === wick === border, borders off (no muddy outlines).
    const vividCandles = cleanCandleSeriesOptions(
      rawCandleColors,
      activeCustomTheme ? 1.05 : 0,
    );

    const series = addStyledPriceSeries(chart, seriesStyle, vividCandles);
    candleSeriesRef.current = series;
    setChartReadyKey((k) => k + 1);

    /**
     * Adds a line series to its own dedicated oscillator price scale, pinned to
     * the bottom 25% of the chart. This is what stops RSI/MACD/etc. from
     * flattening the candles.
     */
    const addOscillatorSeries = (opts: {
      color: string;
      lineWidth: any;
      title: string;
      lineStyle?: any;
      lineType?: LineType;
    }) => {
      const s = chart.addSeries(LineSeries, {
        color: opts.color,
        lineWidth: opts.lineWidth,
        title: opts.title,
        lineStyle: opts.lineStyle,
        lineType: opts.lineType,
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

        if (Array.isArray(data)) {
          if (!active) return;
          if (data.length === 0) {
            setError('CHART DATA UNAVAILABLE');
            setIsLoading(false);
            return;
          }
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
        const tierOptimizedData = uniqueAscendingTimes(trimTrailingStagnantBars(displayData.slice(-allowedLimit)));

        let chartCandles = tierOptimizedData as CandlestickData<Time>[];
        if (getActiveRirProgram()) {
          const rirExec = executeActiveRirOnCandles(tierOptimizedData);
          if (rirExec) {
            chartCandles = applyRirColorsToCandles(tierOptimizedData, rirExec) as CandlestickData<Time>[];
          }
        }

        const rawBars = chartCandles as PriceBar[];
        const plotBars = transformOhlc(rawBars, seriesStyle);
        series.setData(toPriceSeriesData(plotBars, seriesStyle, {
          up: vividCandles.upColor,
          down: vividCandles.downColor,
        }) as any);
        drawings.setMarketBars(rawBars as OhlcBar[]);
        marketBarsRef.current = rawBars as OhlcBar[];
        if (showsVolumeOverlay(seriesStyle)) {
          const mode = seriesStyle === "tpo" ? "tpo" : seriesStyle === "volume_footprint" ? "footprint" : "profile";
          drawings.setVolumeOverlay(volumeAtPrice(rawBars as OhlcBar[]), mode);
        } else {
          drawings.setVolumeOverlay([], null);
        }
        if (seriesStyle === "hlc_area") {
          const hi = chart.addSeries(LineSeries, {
            color: hexAlpha(vividCandles.upColor, 0.55),
            lineWidth: 1,
            title: "High",
            priceLineVisible: false,
            lastValueVisible: false,
          });
          const lo = chart.addSeries(LineSeries, {
            color: hexAlpha(vividCandles.downColor, 0.55),
            lineWidth: 1,
            title: "Low",
            priceLineVisible: false,
            lastValueVisible: false,
          });
          hi.setData(plotBars.map((c) => ({ time: c.time as Time, value: c.high })));
          lo.setData(plotBars.map((c) => ({ time: c.time as Time, value: c.low })));
        }

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

        chart.timeScale().applyOptions({
          ...CHART_TIME_SCALE_GESTURE,
          barSpacing: tierOptimizedData.length > 800 ? 6 : 8,
        });

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
          "SMA": visualPaint?.indicator || "#00FFFF",
          "EMA": visualPaint?.indicator || "#FFAA00",
          "RSI": visualPaint?.indicator || "#00FF66",
          "BB": visualPaint?.indicator || "#7A3BFF",
          "ADX": visualPaint?.indicator || "#00D9FF",
          "ATR": visualPaint?.indicator || "#FF4500",
          "AO": visualPaint?.indicator || "#3E78FF",
          "MACD": visualPaint?.indicator || "#FF00C8",
          "COT": "#22C55E",
        };

        let cotPack: Awaited<ReturnType<typeof fetchCotReportsForChart>> | null = null;
        if (activeIndicators.includes("COT")) {
          cotPack = await fetchCotReportsForChart(sym);
        }

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
              else if (indAbbr === "COT") {
                const cotSeries = calculateCOT(tierOptimizedData, {
                  reports: cotPack?.reports ?? [],
                  hideCurrentWeek: true,
                  nowSec: Date.now() / 1000,
                  barDurationSec: stepSeconds,
                });
                const unavailable = cotSeries.length === 0;
                const commTitle = unavailable
                  ? `COT COMM — ${cotPack?.note || "DATA UNAVAILABLE"}`
                  : "Commercials";
                const largeTitle = unavailable ? "Large Traders — DATA UNAVAILABLE" : "Large Traders";
                const commLine = addOscillatorSeries({
                  color: "#22C55E",
                  lineWidth: 2,
                  title: commTitle,
                  lineType: LineType.WithSteps,
                });
                const largeLine = addOscillatorSeries({
                  color: "#EF4444",
                  lineWidth: 2,
                  title: largeTitle,
                  lineType: LineType.WithSteps,
                });
                commLine.setData(
                  cotSeries
                    .filter((d) => d.commercial != null)
                    .map((d) => ({ time: d.time as Time, value: d.commercial as number })),
                );
                largeLine.setData(
                  cotSeries
                    .filter((d) => d.large != null)
                    .map((d) => ({ time: d.time as Time, value: d.large as number })),
                );
                commLine.createPriceLine({
                  price: 0,
                  color: "#94A3B8",
                  lineWidth: 1,
                  lineStyle: LineStyle.Solid,
                  axisLabelVisible: true,
                  title: unavailable ? (cotPack?.note || "DATA UNAVAILABLE") : "0",
                });
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
              time: currentTime,
              open: lastCandle.close,
              high: Math.max(lastCandle.close, newClose),
              low: Math.min(lastCandle.close, newClose),
              close: newClose,
            };
            if (!active) return;
            if (!isBrickTransform(seriesStyle)) {
              series.update(toPriceSeriesUpdate(updateObj, seriesStyle) as any);
            }
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
            time: lastCandle.time,
            open: lastCandle.open,
            high: newHigh,
            low: newLow,
            close: newClose,
          };

          series.update(toPriceSeriesUpdate(updateObj, seriesStyle) as any);
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
      if (chart.autoSizeActive()) return;
      const { width, height: rectHeight } = entries[0].contentRect;
      const next = nextChartPixelSize(width, rectHeight);
      if (!next) return;
      chart.applyOptions(next);
    });

    resizeObserver.observe(containerRef.current);

    const detachShiftWheel = attachShiftWheelPriceScale(
      containerRef.current,
      () => (active ? chart : null),
    );

    return () => {
      active = false;
      detachShiftWheel();
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
  }, [data, profile, theme, activeCustomTheme, defaultTheme, timeframe, sym, userTier, takeSnapshotRef, visible, activeIndicators.join(","), showMineIndicator, mineIndicatorName, JSON.stringify(ichimokuSettings), seriesStyle, JSON.stringify(visualPaint ?? null)]);

  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;
    chart.applyOptions({
      handleScroll: chartHandleScroll(Boolean(isExpanded || !fillParent)),
    });
  }, [isExpanded, fillParent, chartReadyKey]);

  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;
    chart.applyOptions({
      layout: {
        background: { type: ColorType.Solid, color: paint.background },
        textColor: paint.text,
        fontFamily: '"IBM Plex Mono", ui-monospace, "SF Mono", Consolas, monospace',
      },
      grid: {
        vertLines: { color: paint.grid },
        horzLines: { color: paint.grid },
      },
    });
  }, [paint, chartReadyKey]);

  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;
    chart.applyOptions({
      crosshair: {
        ...defaultTheme.crosshair,
        mode: crosshairEnabled ? CrosshairMode.Normal : CrosshairMode.Hidden,
      },
    });
  }, [crosshairEnabled, defaultTheme.crosshair, chartReadyKey]);

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

  const frameHeight = isExpanded || fillParent ? "100%" : `${height}px`;

  return (
    <div
      className="flex w-full flex-col overflow-hidden rounded-[20px]"
      style={{
        height: frameHeight,
        minHeight: isExpanded || fillParent ? Math.max(320, height || 0) || 320 : undefined,
        boxShadow:
          defaultTheme.physics.glowBlur > 0
            ? `0 0 ${defaultTheme.physics.glowBlur}px ${profile.borderA}55`
            : "none",
      }}
    >
      {/* Chrome ABOVE the canvas only — drawing toolbox lives under Pattern Scanner */}
      {!embedMode && !hideChartToolbar && (
        <>
        <div
          className="flex shrink-0 flex-nowrap items-center gap-1.5 overflow-x-auto no-scrollbar border-b border-white/10 bg-black/95 px-2 py-1"
          aria-label="Chart controls"
        >
          <button
            type="button"
            onClick={() => setCrosshairEnabled(!crosshairEnabled)}
            className="flex h-8 items-center gap-1.5 rounded-md border border-white/15 px-2 font-mono text-[9px] tracking-wider text-zinc-300 transition-all hover:border-[#00D9FF]/40"
            title="Toggle Crosshair"
            id={`crosshair_toggle_${symbol}`}
          >
            <Crosshair size={10} className={crosshairEnabled ? "text-[#00D9FF] animate-pulse" : "text-zinc-500"} />
            <span>{crosshairEnabled ? "CROSSHAIR ON" : "CROSSHAIR OFF"}</span>
          </button>
          <ChartSeriesStylePicker compact value={seriesStyle} onChange={setSeriesStyle} />
          <ChartBackgroundToggle compact />
          <span
            className="rounded border border-emerald-500/40 px-1.5 py-0.5 font-mono text-[8px] font-bold tracking-wider text-emerald-400"
            data-chart-build=""
            title="If you do not see this stamp on live, Cloud Run is still serving an old image"
          >
            {CHART_UI_BUILD_STAMP}
          </span>
          <div className="ml-auto flex items-center gap-1">
            <button
              type="button"
              onClick={handleFocusRecent}
              aria-label="Focus recent bars"
              title="Snap to recent price action"
              className="flex h-8 w-8 items-center justify-center rounded-md border border-[#00D9FF]/25 text-[#00D9FF] transition-all hover:border-[#00D9FF]/60 hover:bg-[#00D9FF]/10 active:scale-95"
            >
              <Focus size={13} strokeWidth={2.5} />
            </button>
            {onExpandToggle ? (
              <button
                type="button"
                onClick={onExpandToggle}
                aria-label={isExpanded ? "Exit full size" : "Expand chart to fill the window"}
                title={isExpanded ? "Exit full size (Esc)" : "Expand chart to fill the window"}
                className="flex h-8 w-8 items-center justify-center rounded-md border border-emerald-400/40 text-emerald-300 transition-all hover:border-emerald-300/70 hover:bg-emerald-400/10 active:scale-95"
              >
                {isExpanded ? <Minimize2 size={13} strokeWidth={2.5} /> : <Maximize2 size={13} strokeWidth={2.5} />}
              </button>
            ) : null}
            <ChartZoomControls chartRef={chartRef} className="flex-row" />
          </div>
        </div>
        {useDedicatedPatternPanel ? null : (
        <p className="px-2 pb-1 text-[8px] font-mono uppercase tracking-wider text-zinc-600">
          Drag the right axis to lift/squish · drag the bottom axis to stretch time · Shift+wheel = price
        </p>
        )}
        </>
      )}

      <div
        ref={containerRef}
        className="relative min-h-0 w-full flex-1 overflow-hidden"
        style={{
          touchAction: fillParent && !isExpanded ? 'pan-y' : 'none',
          background: paint.background,
        }}
      >
        {embedMode || hideChartToolbar ? (
          <span
            className="pointer-events-none absolute top-2 left-2 z-40 rounded border border-emerald-500/40 bg-black/70 px-1.5 py-0.5 font-mono text-[8px] font-bold tracking-wider text-emerald-400"
            data-chart-build=""
            title="If you do not see this stamp on live, Cloud Run is still serving an old image"
          >
            {CHART_UI_BUILD_STAMP}
          </span>
        ) : null}
        {!embedMode && hideChartToolbar && onExpandToggle ? (
          <button
            type="button"
            onClick={onExpandToggle}
            aria-label={isExpanded ? "Exit full size" : "Expand chart to fill the window"}
            title={isExpanded ? "Exit full size (Esc)" : "Expand chart to fill the window"}
            className="absolute top-2 right-2 z-[60] flex h-8 w-8 items-center justify-center rounded-md border border-emerald-400/40 bg-black/75 text-emerald-300 shadow-lg backdrop-blur-md transition-all hover:border-emerald-300/70 hover:bg-emerald-400/10"
          >
            {isExpanded ? <Minimize2 size={14} strokeWidth={2.5} /> : <Maximize2 size={14} strokeWidth={2.5} />}
          </button>
        ) : null}
        {isLoading && !error && (
          <div
            className="absolute inset-0 z-40 flex flex-col items-center justify-center gap-2 p-4 text-center font-mono text-xs"
            style={{ backgroundColor: paint.background, color: paint.text }}
          >
            <span className="animate-pulse">Loading {sym} chart…</span>
          </div>
        )}
        {error && (
          <div
            className="absolute inset-0 z-50 flex flex-col items-center justify-center gap-3 p-6 text-center font-mono text-sm"
            style={{ backgroundColor: paint.background, color: paint.text }}
          >
            <span className="text-xs font-bold uppercase tracking-wider text-red-500">Chart data unavailable</span>
            <span>{error}</span>
            <button
              type="button"
              className="mt-1 rounded-md border px-3 py-1.5 text-xs font-bold uppercase tracking-wide hover:opacity-90"
              style={{
                borderColor: backgroundMode === "white" ? "#111827" : "rgba(34,211,238,0.4)",
                backgroundColor: backgroundMode === "white" ? "rgba(17,24,39,0.06)" : "rgba(6,182,212,0.1)",
                color: backgroundMode === "white" ? "#111827" : "#67e8f9",
              }}
              onClick={() => {
                setError(null);
                setIsLoading(true);
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
            className="absolute top-3 right-16 z-50 flex items-center gap-1.5 rounded-lg border border-[#BF00FF]/35 bg-black/85 px-2.5 py-1.5 text-[9px] font-black uppercase tracking-wider text-[#BF00FF] shadow-lg backdrop-blur-md transition-all hover:border-[#FF1493]/50 hover:text-[#FF1493]"
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
      </div>
    </div>
  );
}

function addStyledPriceSeries(
  chart: IChartApi,
  type: PriceSeriesType,
  vividCandles: {
    upColor: string;
    downColor: string;
    wickUpColor: string;
    wickDownColor: string;
    borderUpColor: string;
    borderDownColor: string;
    borderVisible?: boolean;
  },
) {
  const family = seriesFamily(type);
  if (family === "line") {
    return chart.addSeries(LineSeries, {
      color: vividCandles.upColor,
      lineWidth: 2,
      title: "Close",
      lineType: type === "step_line" ? LineType.WithSteps : LineType.Simple,
      pointMarkersVisible: type === "line_markers",
    });
  }
  if (family === "area") {
    return chart.addSeries(AreaSeries, {
      lineColor: vividCandles.upColor,
      topColor: `${vividCandles.upColor}99`,
      bottomColor: `${vividCandles.upColor}08`,
      lineWidth: 2,
      title: "Close",
    });
  }
  if (family === "baseline") {
    return chart.addSeries(BaselineSeries, {
      topLineColor: vividCandles.upColor,
      bottomLineColor: vividCandles.downColor,
      topFillColor1: hexAlpha(vividCandles.upColor, 0.28),
      topFillColor2: hexAlpha(vividCandles.upColor, 0.05),
      bottomFillColor1: hexAlpha(vividCandles.downColor, 0.05),
      bottomFillColor2: hexAlpha(vividCandles.downColor, 0.28),
      lineWidth: 2,
      title: "Close",
    });
  }
  if (family === "histogram") {
    return chart.addSeries(HistogramSeries, {
      color: vividCandles.upColor,
      title: "Close",
    });
  }
  if (family === "bar") {
    return chart.addSeries(BarSeries, {
      upColor: vividCandles.upColor,
      downColor: vividCandles.downColor,
      thinBars: false,
    });
  }
  if (type === "hollow") {
    return chart.addSeries(CandlestickSeries, {
      ...vividCandles,
      upColor: "rgba(0,0,0,0)",
      downColor: vividCandles.downColor,
      borderVisible: true,
      wickUpColor: vividCandles.wickUpColor,
      wickDownColor: vividCandles.wickDownColor,
      borderUpColor: vividCandles.borderUpColor,
      borderDownColor: vividCandles.borderDownColor,
    });
  }
  // Solid candles: matched wick/border + no outline = TradingView-clean neon.
  return chart.addSeries(CandlestickSeries, {
    upColor: vividCandles.upColor,
    downColor: vividCandles.downColor,
    wickUpColor: vividCandles.wickUpColor,
    wickDownColor: vividCandles.wickDownColor,
    borderUpColor: vividCandles.borderUpColor,
    borderDownColor: vividCandles.borderDownColor,
    borderVisible: vividCandles.borderVisible ?? false,
  });
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
      ...CHART_PRICE_SCALE_GESTURE,
      scaleMargins: hasOscillator
        ? { top: 0.08, bottom: 0.28 }   // leave room for the oscillator sub-pane
        : { top: 0.04, bottom: 0.04 },  // no oscillator: candles fill the chart
    });
  } catch (e) {
    console.warn("Could not apply candle price-scale margins:", e);
  }
}
