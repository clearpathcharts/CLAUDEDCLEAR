import React, { useCallback, useMemo, useState } from 'react';
import { ChartSymbolSearch } from '../charts/ChartSymbolSearch';
import { LightweightCandles } from '../charts/LightweightCandles';
import { ChartSeriesStylePicker } from '../charts/ChartSeriesStylePicker';
import { NeuroProfilePicker } from '../charts/NeuroProfilePicker';
import { ChartDrawingSessionProvider, ChartDrawingToolsPanel } from '../charts/drawings';
import { DESK_CHARTS_ANCHOR } from '../../lib/traderDesks';
import { themeProfiles, type ThemeProfileId } from '../../lib/theme/profiles';
import { useChartSeriesStyle } from '../../hooks/useChartSeriesStyle';

const TIMEFRAMES = ['1m', '5m', '15m', '30m', '1h', '4h', '1d', '1w'] as const;
const DEFAULT_SYMBOL = 'EURUSD';

function isThemeProfileId(value: string | null | undefined): value is ThemeProfileId {
  return !!value && value in themeProfiles;
}

function readSavedProfile(): ThemeProfileId {
  if (typeof window === 'undefined') return 'calm_focus';
  try {
    const fromQuery = new URLSearchParams(window.location.search).get('profile');
    if (isThemeProfileId(fromQuery)) return fromQuery;
    const saved = localStorage.getItem('clearpath_current_profile_id');
    if (isThemeProfileId(saved)) return saved;
  } catch {
    /* ignore */
  }
  return 'calm_focus';
}

function persistProfile(id: ThemeProfileId) {
  try {
    localStorage.setItem('clearpath_current_profile_id', id);
  } catch {
    /* ignore */
  }
  if (typeof window === 'undefined') return;
  try {
    const url = new URL(window.location.href);
    url.searchParams.set('profile', id);
    window.history.replaceState({ ...window.history.state }, '', `${url.pathname}?${url.searchParams.toString()}${url.hash}`);
  } catch {
    /* ignore */
  }
}

export default function NeurodivergentTraderDesk() {
  const [profileId, setProfileId] = useState<ThemeProfileId>(readSavedProfile);
  const [symbol, setSymbol] = useState(DEFAULT_SYMBOL);
  const [timeframe, setTimeframe] = useState<(typeof TIMEFRAMES)[number]>('1h');
  const [chartType, setChartType] = useChartSeriesStyle();

  const theme = themeProfiles[profileId];

  const applyProfile = useCallback((id: ThemeProfileId) => {
    setProfileId(id);
    persistProfile(id);
  }, []);

  const shellStyle = useMemo(
    () => ({
      background: `linear-gradient(180deg, ${theme.bgTop}, ${theme.bgBottom})`,
      color: theme.text,
    }),
    [theme],
  );

  return (
    <ChartDrawingSessionProvider>
      <div
        className="mx-auto flex min-h-0 w-full max-w-[1600px] flex-1 flex-col gap-3 p-3 md:p-4"
        data-neurodivergent-door=""
        style={shellStyle}
      >
        <section
          id={DESK_CHARTS_ANCHOR}
          className="flex min-h-0 flex-1 flex-col gap-2 scroll-mt-2 rounded-2xl border p-3"
          style={{ borderColor: `${theme.borderA}44`, background: 'rgba(0,0,0,0.35)' }}
        >
            <div className="flex flex-wrap items-end justify-between gap-2">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.2em] opacity-60">Neurodivergent UI · Chart</p>
                <p className="text-lg font-black uppercase tracking-tight">{theme.label}</p>
              </div>
              <div className="min-w-[220px] flex-1">
                <ChartSymbolSearch compact placeholder="Search asset…" activeSymbol={symbol} onSubmit={setSymbol} />
              </div>
            </div>
            <div className="relative min-h-[360px] flex-1 overflow-hidden rounded-xl border border-white/10 bg-black" style={{ minHeight: 'min(62vh, 640px)' }}>
              <LightweightCandles
                symbol={symbol}
                profileId={profileId}
                timeframe={timeframe}
                fillParent
                height={560}
                hidePatternOverlays
                hideChartToolbar
                publishDrawingSession
                priceSeriesType={chartType}
                onPriceSeriesTypeChange={setChartType}
              />
            </div>
            <div className="flex flex-wrap items-center gap-1" role="group" aria-label="Timeframe">
              {TIMEFRAMES.map((tf) => (
                <button
                  key={tf}
                  type="button"
                  onClick={() => setTimeframe(tf)}
                  aria-pressed={timeframe === tf}
                  className="rounded-md border px-2 py-1 text-[10px] font-black uppercase"
                  style={{
                    color: timeframe === tf ? theme.bgTop : theme.borderA,
                    borderColor: `${theme.borderA}66`,
                    background: timeframe === tf ? theme.borderA : 'transparent',
                  }}
                >
                  {tf}
                </button>
              ))}
              <ChartSeriesStylePicker compact value={chartType} onChange={setChartType} />
            </div>
            <ChartDrawingToolsPanel compact />
            <p className="font-mono text-[10px] uppercase tracking-wider opacity-50">
              Information and analytics only — no trade execution — no personalized investment advice
            </p>
        </section>

        <details className="rounded-2xl border p-3" style={{ borderColor: `${theme.borderA}55`, background: theme.panel }}>
          <summary className="cursor-pointer text-base font-black uppercase tracking-tight" style={{ color: theme.text }}>
            Sensory profiles · {theme.label}
          </summary>
          <p className="mt-2 max-w-2xl text-base font-bold leading-relaxed opacity-80">
            Pick a sensory profile. The chart stays on this desk — we do not send you to login.
            One chart. Low motion. No order ticket.
          </p>
          <div className="mt-3">
            <NeuroProfilePicker activeProfileId={profileId} onProfileChange={applyProfile} compact />
          </div>
        </details>
      </div>
    </ChartDrawingSessionProvider>
  );
}
