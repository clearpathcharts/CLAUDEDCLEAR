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
import { TimeframeMenu } from './charts/TimeframeMenu';

export default function PublicLiveChart() {
  const [symbol, setSymbol] = useState<string>(DEFAULT_MARKET_SYMBOLS[0]);
  const [timeframe, setTimeframe] = useState<string>('1h');
  const [bodyHeight, setBodyHeight] = useState(720);
  const [narrow, setNarrow] = useState(() => isNarrowChartViewport());

  useEffect(() => {
    const measure = () => {
      const phone = isNarrowChartViewport();
      const reserved = phone ? 168 : 160;
      setBodyHeight(desktopStackedMarketChartHeight(undefined, reserved));
      setNarrow(phone);
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
      className="relative w-full px-1.5 sm:px-4 pb-6 sm:pb-10 z-20 scroll-mt-14 md:scroll-mt-28"
      aria-labelledby="public-chart-heading"
      data-mobile-chart-first={narrow ? 'true' : 'false'}
    >
      <div className="w-full rounded-[16px] sm:rounded-[22px] overflow-hidden border border-white/15 bg-black/80 shadow-[0_0_40px_rgba(0,255,255,0.08)]">
        <div className="px-2 sm:px-5 pt-2 sm:pt-4 pb-1.5 sm:pb-3 border-b border-white/10 space-y-1.5 sm:space-y-3">
          <h2
            id="public-chart-heading"
            className="sr-only md:not-sr-only md:text-base font-black uppercase tracking-widest text-white"
          >
            Live chart — search any market
          </h2>
          <ChartSymbolSearch
            compact={narrow}
            placeholder="Search AAPL, EURUSD, XAUUSD…"
            activeSymbol={symbol}
            onSubmit={(raw) => setSymbol(resolveMarketAsset(raw).value)}
          />
          <div className="flex flex-wrap items-center justify-between gap-2">
            <TimeframeMenu value={timeframe} onChange={setTimeframe} />
            {narrow ? null : <ChartBackgroundToggle />}
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
            hideChartToolbar={narrow}
          />
        </div>
      </div>
    </section>
  );
}
