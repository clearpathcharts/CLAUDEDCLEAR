import React, { useEffect, useMemo, useState } from 'react';
import { ChartSymbolSearch } from './charts/ChartSymbolSearch';
import { ChartBackgroundToggle } from './charts/ChartBackgroundToggle';
import { LightweightCandles } from './charts/LightweightCandles';
import { NeuroProfilePicker } from './charts/NeuroProfilePicker';
import { resolveMarketAsset } from '../constants/marketAssets';
import {
  DEFAULT_MARKET_SYMBOLS,
  desktopStackedMarketChartHeight,
} from '../constants/chartLayout';
import { NARROW_CHART_MQ, isNarrowChartViewport } from '../lib/charts/chartOverlayPrefs';
import { TimeframeMenu } from './charts/TimeframeMenu';
import { themeProfiles, type ThemeProfileId } from '../lib/theme/profiles';

/** Same key the desks and Auth use, so a choice made here survives sign-in. */
const PROFILE_STORAGE_KEY = 'clearpath_current_profile_id';

function readStoredProfile(): ThemeProfileId {
  try {
    const saved = localStorage.getItem(PROFILE_STORAGE_KEY);
    if (saved && saved in themeProfiles) return saved as ThemeProfileId;
  } catch {
    /* storage blocked — fall through to the default */
  }
  return 'calm_focus';
}

export default function PublicLiveChart() {
  const [symbol, setSymbol] = useState<string>(DEFAULT_MARKET_SYMBOLS[0]);
  const [timeframe, setTimeframe] = useState<string>('1h');
  const [bodyHeight, setBodyHeight] = useState(720);
  const [narrow, setNarrow] = useState(() => isNarrowChartViewport());
  // Was hardcoded to 'calm_focus', which is why none of the other twelve
  // neuro-adaptive profiles could ever load on the public chart.
  const [profileId, setProfileId] = useState<ThemeProfileId>(readStoredProfile);

  const asset = useMemo(() => resolveMarketAsset(symbol), [symbol]);
  const assetName = asset.label.toUpperCase() === symbol.toUpperCase() ? '' : asset.label;

  const changeProfile = (id: ThemeProfileId) => {
    setProfileId(id);
    try {
      localStorage.setItem(PROFILE_STORAGE_KEY, id);
    } catch {
      /* storage blocked — the chart still repaints for this visit */
    }
  };

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
          <h2 id="public-chart-heading" className="sr-only">
            {`Live chart — ${symbol}${assetName ? ` (${assetName})` : ''}, ${timeframe} timeframe. Search any market.`}
          </h2>
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1" data-public-chart-title="">
            <span className="text-2xl sm:text-4xl font-black uppercase leading-none tracking-tight text-white">
              {symbol}
            </span>
            <span className="rounded-md border border-[#00E5FF]/45 bg-[#00E5FF]/10 px-2 py-0.5 font-mono text-[11px] sm:text-sm font-black uppercase tracking-wider text-[#7FE9FF]">
              {timeframe}
            </span>
            {assetName ? (
              <span className="text-xs sm:text-base font-semibold text-zinc-400">{assetName}</span>
            ) : null}
          </div>
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
            profileId={profileId}
            timeframe={timeframe}
            height={bodyHeight}
            fillParent
            hideChartToolbar={narrow}
          />
        </div>

        {/* Kept below the plot so the chart still owns the first screen. */}
        <div className="px-2 sm:px-5 pb-3 pt-3 sm:pb-5 border-t border-white/10">
          <NeuroProfilePicker
            activeProfileId={profileId}
            onProfileChange={changeProfile}
            compact={narrow}
          />
        </div>
      </div>
    </section>
  );
}
