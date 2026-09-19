import React, { useEffect, useState } from 'react';
import { ChartSymbolSearch } from './charts/ChartSymbolSearch';
import { ChartBackgroundToggle } from './charts/ChartBackgroundToggle';
import { LightweightCandles } from './charts/LightweightCandles';
import { resolveMarketAsset } from '../constants/marketAssets';
import {
  DEFAULT_MARKET_SYMBOLS,
  desktopStackedMarketChartHeight,
} from '../constants/chartLayout';
import { TimeframeMenu } from './charts/TimeframeMenu';

export default function PublicLiveChart() {
  const [symbol, setSymbol] = useState<string>(DEFAULT_MARKET_SYMBOLS[0]);
  const [timeframe, setTimeframe] = useState<string>('1h');
  const [bodyHeight, setBodyHeight] = useState(720);

  useEffect(() => {
    const measure = () => {
      setBodyHeight(desktopStackedMarketChartHeight(undefined, 160));
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);

  return (
    <section
      id="public-chart"
      className="relative w-full px-2 sm:px-4 pb-10 z-20 scroll-mt-28"
      aria-labelledby="public-chart-heading"
    >
      <div className="w-full rounded-[22px] overflow-hidden border border-white/15 bg-black/80 shadow-[0_0_40px_rgba(0,255,255,0.08)]">
        <div className="px-3 sm:px-5 pt-4 pb-3 border-b border-white/10 space-y-3">
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
            <TimeframeMenu value={timeframe} onChange={setTimeframe} />
            <ChartBackgroundToggle />
          </div>
        </div>

        <div
          className="relative w-full min-h-[85vh]"
          style={{ height: `max(85vh, ${bodyHeight}px)` }}
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
