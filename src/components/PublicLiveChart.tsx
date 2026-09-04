import React, { useEffect, useState } from 'react';
import { ChartSymbolSearch } from './charts/ChartSymbolSearch';
import { ChartBackgroundToggle } from './charts/ChartBackgroundToggle';
import { LightweightCandles } from './charts/LightweightCandles';
import { resolveMarketAsset } from '../constants/marketAssets';
import {
  DEFAULT_MARKET_SYMBOLS,
  desktopStackedMarketChartHeight,
} from '../constants/chartLayout';
import { NARROW_CHART_MQ, isNarrowChartViewport } from '../lib/charts/chartOverlayPrefs';

const TIMEFRAMES = ['1m', '5m', '15m', '30m', '1h', '4h', '1d', '1w'] as const;

export default function PublicLiveChart() {
  const [symbol, setSymbol] = useState<string>(DEFAULT_MARKET_SYMBOLS[0]);
  const [timeframe, setTimeframe] = useState<string>('1h');
  const [bodyHeight, setBodyHeight] = useState(720);
  const [narrow, setNarrow] = useState(() => isNarrowChartViewport());

  useEffect(() => {
    const measure = () => {
      const reserved = isNarrowChartViewport() ? 220 : 160;
      setBodyHeight(desktopStackedMarketChartHeight(undefined, reserved));
      setNarrow(isNarrowChartViewport());
    };
    measure();
    window.addEventListener('resize', measure);
    const mq = typeof window.matchMedia === 'function' ? window.matchMedia(NARROW_CHART_MQ) : null;
    mq?.addEventListener('change', measure);
    return () => {
      window.removeEventListener('resize', measure);
      mq?.removeEventListener('change', measure);
    };
  }, []);

  return (
    <section
      id="public-chart"
      className="relative w-full px-2 sm:px-4 pb-10 z-20 scroll-mt-16 md:scroll-mt-28"
      aria-labelledby="public-chart-heading"
      data-mobile-chart-first={narrow ? 'true' : 'false'}
    >
      <div className="w-full rounded-[22px] overflow-hidden border border-white/15 bg-black/80 shadow-[0_0_40px_rgba(0,255,255,0.08)]">
        <div className="px-3 sm:px-5 pt-3 sm:pt-4 pb-2 sm:pb-3 border-b border-white/10 space-y-2 sm:space-y-3">
          <h2
            id="public-chart-heading"
            className="text-sm sm:text-base font-black uppercase tracking-widest text-white"
          >
            Live chart — search any market
          </h2>
          <ChartSymbolSearch
            placeholder="Search AAPL, EURUSD, XAUUSD…"
            activeSymbol={symbol}
            onSubmit={(raw) => setSymbol(resolveMarketAsset(raw).value)}
          />
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap gap-1.5 sm:gap-2" role="group" aria-label="Chart timeframe">
              {TIMEFRAMES.map((tf) => {
                const active = timeframe === tf;
                return (
                  <button
                    key={tf}
                    type="button"
                    onClick={() => setTimeframe(tf)}
                    aria-pressed={active}
                    className="px-2.5 sm:px-3 py-1 text-[10px] sm:text-xs rounded-md border uppercase font-sans cursor-pointer hover:opacity-90"
                    style={{
                      color: active ? '#ffffff' : 'rgba(255,255,255,0.7)',
                      borderColor: active ? '#FF007F' : 'rgba(255,255,255,0.10)',
                      background: active
                        ? 'linear-gradient(135deg, #FF007F 0%, #FF4500 60%, #3a0000 100%)'
                        : 'rgba(10, 10, 18, 0.5)',
                      boxShadow: active
                        ? '0 0 12px rgba(255, 0, 127, 0.6), inset 0 0 6px rgba(255, 69, 0, 0.7)'
                        : 'none',
                      fontWeight: active ? 900 : 500,
                      letterSpacing: '0.05em',
                    }}
                  >
                    {tf.toUpperCase()}
                  </button>
                );
              })}
            </div>
            <ChartBackgroundToggle />
          </div>
        </div>

        <div
          className="relative w-full min-h-[70vh] md:min-h-[85vh]"
          style={{ height: `max(${narrow ? '70vh' : '85vh'}, ${bodyHeight}px)` }}
          data-public-chart-plot=""
        >
          <LightweightCandles
            symbol={symbol}
            profileId="calm_focus"
            timeframe={timeframe}
            height={bodyHeight}
            fillParent
          />
        </div>
      </div>
    </section>
  );
}
