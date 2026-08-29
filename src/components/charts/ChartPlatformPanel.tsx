import React, { useState } from 'react';
import { ChartSymbolSearch } from './ChartSymbolSearch';
import { ChartBackgroundToggle } from './ChartBackgroundToggle';
import { LightweightCandles } from './LightweightCandles';
import { resolveMarketAsset } from '../../constants/marketAssets';
import { DEFAULT_MARKET_SYMBOLS } from '../../constants/chartLayout';

export const CHART_PLATFORM_VARIANTS = ['retail', 'neurodivergent'] as const;
export type ChartPlatformVariant = (typeof CHART_PLATFORM_VARIANTS)[number];

export const CHART_PLATFORM_TIMEFRAMES = {
  retail: ['15m', '1h', '4h', '1d'],
  neurodivergent: ['15m', '1h', '4h', '1d'],
} as const;

export type ChartPlatformPanelProps = {
  /** Which desk owns this chart — later customization keys off this. */
  variant: ChartPlatformVariant;
  profileId: string;
  heading: string;
  description?: React.ReactNode;
  headingId?: string;
  timeframes?: readonly string[];
  accent?: string;
  searchPlaceholder?: string;
  defaultSymbol?: string;
  defaultTimeframe?: string;
  showBackgroundToggle?: boolean;
};

/**
 * Shared chart platform for trader desks (search + timeframe + candles).
 * Retail and Neurodivergent mount the same engine so each can be themed later
 * without forking LightweightCandles.
 */
export function ChartPlatformPanel({
  variant,
  profileId,
  heading,
  description,
  headingId,
  timeframes,
  accent = '#00FFFF',
  searchPlaceholder = 'Search AAPL, EURUSD, gold…',
  defaultSymbol = DEFAULT_MARKET_SYMBOLS[0],
  defaultTimeframe = '1h',
  showBackgroundToggle = true,
}: ChartPlatformPanelProps) {
  const [symbol, setSymbol] = useState(defaultSymbol);
  const [timeframe, setTimeframe] = useState(defaultTimeframe);
  const frames = timeframes ?? CHART_PLATFORM_TIMEFRAMES[variant];
  const labelId = headingId ?? `chart-platform-${variant}-heading`;

  return (
    <section
      data-chart-platform={variant}
      className="overflow-hidden rounded-2xl border bg-black/80"
      style={{ borderColor: `${accent}59` }}
      aria-labelledby={labelId}
    >
      <div className="space-y-3 border-b border-white/10 px-4 py-3">
        <h2 id={labelId} className="text-lg font-black uppercase tracking-tight text-white">
          {heading}
        </h2>
        {description ? (
          <div className="max-w-2xl text-base font-bold leading-relaxed text-zinc-400">
            {description}
          </div>
        ) : null}
        <ChartSymbolSearch
          placeholder={searchPlaceholder}
          activeSymbol={symbol}
          onSubmit={(raw) => setSymbol(resolveMarketAsset(raw).value)}
        />
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap gap-2" role="group" aria-label="Timeframe">
            {frames.map((tf) => {
              const active = timeframe === tf;
              return (
                <button
                  key={tf}
                  type="button"
                  onClick={() => setTimeframe(tf)}
                  aria-pressed={active}
                  className="rounded-lg border px-3 py-1.5 text-sm font-extrabold uppercase"
                  style={{
                    color: active ? '#050505' : accent,
                    borderColor: `${accent}66`,
                    background: active ? accent : 'transparent',
                  }}
                >
                  {tf}
                </button>
              );
            })}
          </div>
          {showBackgroundToggle ? <ChartBackgroundToggle compact /> : null}
        </div>
      </div>
      <div className="relative h-[min(70vh,640px)] min-h-[360px]">
        <LightweightCandles
          symbol={symbol}
          profileId={profileId}
          timeframe={timeframe}
          fillParent
          height={480}
        />
      </div>
    </section>
  );
}
