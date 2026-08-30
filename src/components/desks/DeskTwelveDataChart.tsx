import React, { useEffect, useState } from 'react';
import { LightweightCandles, type PriceSeriesType } from '../charts/LightweightCandles';
import type { Candle } from '../../types/indicators';

type TwelveConfig = {
  ready?: boolean;
  keyInfo?: string;
  activeSource?: string | null;
  keyLength?: number;
};

/**
 * Shared desk chart that always pulls OHLC through the server Twelve Data
 * gateway (`/api/market/history` + `/api/quote`). Never pass an empty `data`
 * array — that short-circuits self-fetch and leaves a blank chart.
 */
export function DeskTwelveDataChart({
  symbol,
  timeframe = '1h',
  profileId = 'standard_red_green',
  height = 360,
  fillParent = false,
  embedMode = false,
  hideChartToolbar = false,
  hidePatternOverlays = true,
  useDedicatedPatternPanel = false,
  publishDrawingSession = false,
  activeIndicators = [],
  priceSeriesType = 'candlestick',
  /** Optional preloaded candles — only used when non-empty */
  candles,
  showStatus = true,
  className = '',
}: {
  symbol: string;
  timeframe?: string;
  profileId?: string;
  height?: number;
  fillParent?: boolean;
  embedMode?: boolean;
  hideChartToolbar?: boolean;
  hidePatternOverlays?: boolean;
  useDedicatedPatternPanel?: boolean;
  publishDrawingSession?: boolean;
  activeIndicators?: string[];
  priceSeriesType?: PriceSeriesType;
  candles?: Candle[] | null;
  showStatus?: boolean;
  className?: string;
}) {
  const [cfg, setCfg] = useState<TwelveConfig | null>(null);

  useEffect(() => {
    let alive = true;
    void fetch('/api/twelvedata/config')
      .then((r) => r.json())
      .then((body) => {
        if (alive) setCfg(body as TwelveConfig);
      })
      .catch(() => {
        if (alive) setCfg({ ready: false, keyInfo: 'Twelve Data status unavailable' });
      });
    return () => {
      alive = false;
    };
  }, []);

  const liveCandles = candles && candles.length > 0 ? candles : undefined;
  const ready = cfg?.ready === true;

  return (
    <div data-desk-twelvedata-chart className={`relative flex min-h-0 flex-col ${className}`}>
      {showStatus ? (
        <p
          className="shrink-0 px-2 py-1 font-mono text-[10px] font-bold uppercase tracking-wider"
          style={{ color: ready ? '#34d399' : '#fbbf24' }}
        >
          {ready
            ? `Twelve Data · live gateway${cfg?.activeSource ? ` · ${cfg.activeSource}` : ''}${
                typeof cfg?.keyLength === 'number' && cfg.keyLength > 0 ? ` · len ${cfg.keyLength}` : ''
              }`
            : cfg
              ? `Twelve Data · ${cfg.keyInfo || 'key not configured on server'}`
              : 'Twelve Data · checking…'}
        </p>
      ) : null}
      <div className={`relative min-h-0 flex-1 ${fillParent ? '' : ''}`} style={fillParent ? { minHeight: height } : undefined}>
        <LightweightCandles
          symbol={symbol}
          profileId={profileId}
          timeframe={timeframe}
          height={height}
          fillParent={fillParent}
          embedMode={embedMode}
          hideChartToolbar={hideChartToolbar}
          hidePatternOverlays={hidePatternOverlays}
          useDedicatedPatternPanel={useDedicatedPatternPanel}
          publishDrawingSession={publishDrawingSession}
          activeIndicators={activeIndicators}
          priceSeriesType={priceSeriesType}
          data={liveCandles}
          userTier="VIP"
        />
      </div>
    </div>
  );
}
