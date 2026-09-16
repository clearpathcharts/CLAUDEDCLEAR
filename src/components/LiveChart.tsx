import React, { useEffect, useRef, useState } from 'react';
import { createChart, ColorType, IChartApi, ISeriesApi, Time, CandlestickSeries } from 'lightweight-charts';
import { TradingHaltController } from '../truth/TradingHaltController';
import { cleanCandleSeriesOptions } from '../lib/charts/cleanCandleSeries';
import { ChartZoomControls } from './charts/ChartZoomControls';
import {
  attachShiftWheelPriceScale,
  chartHandleScroll,
  CHART_HANDLE_SCALE,
  CHART_PRICE_SCALE_GESTURE,
  CHART_TIME_SCALE_GESTURE,
} from '../lib/charts/chartInteraction';

interface LiveChartProps {
  symbol?: string;
  interval?: string;
  theme?: {
    upColor: string;
    downColor: string;
    accent: string;
  };
}

export default function LiveChart({ 
  symbol = 'BTCUSDT', 
  interval = '1m',
  theme = { upColor: '#4169E1', downColor: '#FF3131', accent: '#00FFFF', background: '#050505', textColor: '#888888' }
}: LiveChartProps & { theme?: any }) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);

  const [halted, setHalted] = useState(TradingHaltController.isHalted());
  const [haltReason, setHaltReason] = useState(TradingHaltController.getHaltReason());
  const [errorState, setErrorState] = useState<string | null>(null);

  useEffect(() => {
    return TradingHaltController.subscribe((isHalted, reason) => {
      setHalted(isHalted);
      setHaltReason(reason);
    });
  }, []);

  const upColor = theme?.upColor || '#4169E1';
  const downColor = theme?.downColor || '#FF3131';
  const accent = theme?.accent || '#00FFFF';
  const background = theme?.background || '#050505';
  const textColor = theme?.textColor || '#888888';

  useEffect(() => {
    if (!chartContainerRef.current) return;

    let isMounted = true;

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: background === 'transparent' ? '#000000' : (background || '#000000') },
        textColor: textColor || '#888888',
        fontFamily: '"IBM Plex Mono", ui-monospace, "SF Mono", Consolas, monospace',
      },
      grid: {
        vertLines: { color: 'rgba(255, 255, 255, 0.05)' },
        horzLines: { color: 'rgba(255, 255, 255, 0.05)' },
      },
      rightPriceScale: {
        borderColor: 'rgba(255, 255, 255, 0.1)',
        ...CHART_PRICE_SCALE_GESTURE,
      },
      timeScale: {
        borderColor: 'rgba(255, 255, 255, 0.1)',
        ...CHART_TIME_SCALE_GESTURE,
      },
      crosshair: {
        mode: 0,
      },
      handleScroll: chartHandleScroll(true),
      handleScale: CHART_HANDLE_SCALE,
    });

    const vivid = cleanCandleSeriesOptions({
      upColor: upColor || '#00E5FF',
      downColor: downColor || '#FF1493',
      wickUpColor: upColor || '#00E5FF',
      wickDownColor: downColor || '#FF1493',
      borderUpColor: upColor || '#00E5FF',
      borderDownColor: downColor || '#FF1493',
    }, 1.05);

    const candlestickSeries = chart.addSeries(CandlestickSeries, {
      upColor: vivid.upColor,
      downColor: vivid.downColor,
      borderVisible: false,
      wickUpColor: vivid.wickUpColor,
      wickDownColor: vivid.wickDownColor,
      borderUpColor: vivid.borderUpColor,
      borderDownColor: vivid.borderDownColor,
    });

    chartRef.current = chart;
    seriesRef.current = candlestickSeries;

    // Fetch historical data via server proxy
    let lastClose = 0;
    let lastTime = 0;
    let isHistoryLoaded = false;

    const fetchHistory = async () => {
      try {
        const response = await fetch(`/api/market/history?symbol=${encodeURIComponent(symbol)}&interval=${interval}&limit=2500`);
        if (!response.ok) throw new Error('Feed Delay');
        const data = await response.json();
        
        if (!isMounted) return;

        if (!Array.isArray(data)) {
          throw new Error('Data format error');
        }

        const formattedData = data.map((d: any) => ({
          time: (Math.floor(d[0] / 1000)) as Time,
          open: parseFloat(d[1]),
          high: parseFloat(d[2]),
          low: parseFloat(d[3]),
          close: parseFloat(d[4]),
        }));

        formattedData.sort((a, b) => (a.time as number) - (b.time as number));
        candlestickSeries.setData(formattedData);
        
        if (formattedData.length > 0) {
          const lastBar = formattedData[formattedData.length - 1];
          lastClose = lastBar.close;
          lastTime = lastBar.time as number;
          isHistoryLoaded = true;
          chart.timeScale().fitContent();
        }
      } catch (error) {
        console.warn('Feed Error (Simulated fallbacks disabled):', error);
        if (!isMounted) return;
        setErrorState('Real-time data subscription is currently unavailable. Simulated data has been disabled.');
      }
    };

    fetchHistory();

    const handleResize = () => {
      if (!isMounted || !chartContainerRef.current) return;
      try {
        chart.applyOptions({ width: chartContainerRef.current.clientWidth });
        const range = chart.timeScale().getVisibleLogicalRange();
        if (!range || !Number.isFinite(range.from) || range.to <= range.from) {
          chart.timeScale().fitContent();
        }
      } catch {
        /* chart may already be disposed */
      }
    };

    window.addEventListener('resize', handleResize);

    const detachShiftWheel = chartContainerRef.current
      ? attachShiftWheelPriceScale(chartContainerRef.current, () => (isMounted ? chart : null))
      : () => {};

    return () => {
      isMounted = false;
      detachShiftWheel();
      window.removeEventListener('resize', handleResize);
      try {
        chart.remove();
      } catch {
        /* already disposed */
      }
    };
  }, [symbol, interval, upColor, downColor, accent, background, textColor]);

  if (halted) {
    return (
      <div className="w-full h-full min-h-[400px] flex flex-col items-center justify-center bg-black/90 rounded-3xl border border-red-900 border-dashed p-8 text-center backdrop-blur-md">
        <span className="text-red-500 font-extrabold uppercase tracking-widest text-lg mb-2">🔴 CRITICAL SYSTEM HALT DETECTED</span>
        <p className="text-xs text-zinc-400 font-mono uppercase max-w-md">{haltReason || 'ALL MARKET DISPLAY INTERFACES BLANKED INDEFINITELY'}</p>
      </div>
    );
  }

  if (errorState) {
    return (
      <div className="w-full h-full min-h-[400px] flex flex-col items-center justify-center bg-black/60 rounded-3xl border border-zinc-800 p-8 text-center">
        <span className="text-zinc-500 font-extrabold uppercase tracking-widest text-sm mb-2">📊 SECURE FEED DATA STATUS</span>
        <p className="text-xs text-zinc-400 max-w-sm">{errorState}</p>
      </div>
    );
  }

  return (
    <div className="w-full h-full min-h-[400px] relative">
      <div style={{ position: 'relative', width: '100%', height: '100%' }}>
        <div ref={chartContainerRef} className="w-full h-full" style={{ touchAction: 'none' }} />
        <ChartZoomControls chartRef={chartRef} className="absolute bottom-12 left-3 z-20 flex-row" />
      </div>
    </div>
  );
}
