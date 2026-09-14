import React, { useEffect, useMemo, useState } from 'react';
import { X } from 'lucide-react';
import { ChartSymbolSearch } from '../../charts/ChartSymbolSearch';
import { LightweightCandles } from '../../charts/LightweightCandles';
import { DeskReplayPanel } from '../../replay/DeskReplayPanel';
import { resolveMarketAsset } from '../../../constants/marketAssets';
import { formatStructurePrice } from '../../../lib/institutional/analyzeStructure';
import { themeProfiles, type ThemeProfileId } from '../../../lib/theme/profiles';
import { Bento, Unavail, KV } from '../institutional/Bento';
import { useDeskHold } from '../DeskHoldScope';
import { deskSectionOpen } from '../heldMeta';
import { DeskChartFill } from '../DeskChartFill';
import { RetailEducationBento } from '../retail/RetailEducationBento';
import { useRetailIntelligence, type RetailQuote } from '../retail/useRetailIntelligence';
import {
  loadAlerts,
  newAlertId,
  saveAlerts,
  type RetailAlert,
  type RetailWatchlist,
} from '../retail/retailStore';
import { useOptionalDeskAppearance } from '../DeskAppearanceContext';
import { useDeskMonitorSync } from '../../../hooks/useDeskMonitorSync';
import {
  NEURO_DEFAULT_SYMBOL,
  NEURO_DEFAULT_WATCHLISTS,
  NEURO_DESK_PROFILES,
  NEURO_PROFILE_BLURBS,
  NEURO_RIBBON,
  applyNeuroProfile,
  prefersReducedChrome,
  readInitialNeuroProfile,
} from './neuroProfile';

const TIMEFRAMES = ['15m', '1h', '4h', '1d'] as const;
const WL_KEY = 'clearpath_neuro_watchlists_v1';
const WL_ACTIVE_KEY = 'clearpath_neuro_active_watchlist_v1';

function pctClass(pct: number | null): string {
  if (pct == null) return 'text-[var(--desk-muted)]';
  return pct >= 0 ? 'text-emerald-400' : 'text-rose-400';
}

function loadNeuroWatchlists(): RetailWatchlist[] {
  try {
    const raw = localStorage.getItem(WL_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as RetailWatchlist[];
      if (Array.isArray(parsed) && parsed.length) return parsed;
    }
  } catch {
    /* ignore */
  }
  return NEURO_DEFAULT_WATCHLISTS.map((w) => ({ ...w, symbols: [...w.symbols] }));
}

function QuoteRow({
  row,
  on,
  onPick,
}: {
  row: RetailQuote;
  on?: boolean;
  onPick: (s: string) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onPick(row.symbol)}
      className="flex w-full items-center justify-between gap-2 rounded-lg px-2 py-2 text-left hover:bg-white/5"
      style={{ background: on ? 'rgba(176,38,255,0.12)' : undefined }}
    >
      <span className="font-mono text-sm font-extrabold text-[var(--desk-text)]">{row.symbol}</span>
      <span className="text-right font-mono">
        {row.live && row.price != null ? (
          <>
            <span className="block text-sm tabular-nums text-[var(--desk-text)]">
              {formatStructurePrice(row.price)}
            </span>
            <span className={`block text-sm ${pctClass(row.pct)}`}>
              {row.pct == null ? '—' : `${row.pct >= 0 ? '+' : ''}${row.pct.toFixed(2)}%`}
            </span>
          </>
        ) : (
          <span className="text-sm uppercase text-amber-200/80">DATA UNAVAILABLE</span>
        )}
      </span>
    </button>
  );
}

export default function NeurodivergentDashboard() {
  const [profileId, setProfileId] = useState<ThemeProfileId>(() => readInitialNeuroProfile());
  const [showProfiles, setShowProfiles] = useState(false);
  const [symbol, setSymbol] = useState(NEURO_DEFAULT_SYMBOL);
  const [timeframe, setTimeframe] = useState('1h');
  useDeskMonitorSync('neurodivergent', symbol, timeframe, setSymbol, setTimeframe);
  const [focusMode, setFocusMode] = useState(() => prefersReducedChrome(readInitialNeuroProfile()));
  const [blackout, setBlackout] = useState(false);
  const [watchlists, setWatchlists] = useState<RetailWatchlist[]>(() => loadNeuroWatchlists());
  const [activeWlId, setActiveWlId] = useState(() => {
    try {
      return localStorage.getItem(WL_ACTIVE_KEY) || 'calm-core';
    } catch {
      return 'calm-core';
    }
  });
  const [alerts, setAlerts] = useState(() => loadAlerts());
  const [addSymbol, setAddSymbol] = useState('');

  const deskVisual = useOptionalDeskAppearance();
  const theme = themeProfiles[profileId] ?? themeProfiles.calm_focus;
  const activeWl = watchlists.find((w) => w.id === activeWlId) ?? watchlists[0];
  const watchSymbols = activeWl?.symbols ?? [];
  const reduced = prefersReducedChrome(profileId) || focusMode || blackout;
  const hideSecondary = reduced;
  const hold = useDeskHold();
  const profilesHeld = hold?.isHeld('profiles') ?? false;
  const watchHeld = hideSecondary || (hold?.isHeld('watchlist') ?? false);
  const snapHeld = hideSecondary || (hold?.isHeld('snapshot') ?? false);
  const chartFull = watchHeld && snapHeld;
  const neuroChartCols = chartFull
    ? 'minmax(0, 1fr)'
    : [
        watchHeld ? null : '240px',
        'minmax(0, 1fr)',
        snapHeld ? null : '240px',
      ]
        .filter(Boolean)
        .join(' ');
  const showBelow = !hideSecondary && deskSectionOpen(hold?.isHeld, [
    'news',
    'calendar',
    'alerts',
    'education',
    'simulation',
  ]);

  const intel = useRetailIntelligence(symbol, timeframe, watchSymbols, 1, {}, NEURO_RIBBON, {
    // One history fetch on mount; chart live-tick handles quotes. Avoids duplicate 5k-bar fetch + rebuild.
    pollWorkspace: false,
    pollRibbon: !hideSecondary,
    pollWatchlist: !hideSecondary && !watchHeld,
    pollMovers: false,
    pollNews: showBelow,
    pollEcon: showBelow,
    pollFundamentals: false,
  });
  const candles = intel.primaryCandles;
  const last = candles.length ? candles[candles.length - 1] : null;
  const quote =
    intel.watchQuotes.find((q) => q.symbol === symbol) ??
    intel.ribbon.find((q) => q.symbol === symbol);
  const price = quote?.live && quote.price != null ? quote.price : last?.close ?? null;
  const pct = quote?.pct ?? null;

  const day = useMemo(() => {
    if (!candles.length) return null;
    const slice = candles.slice(-Math.min(candles.length, 48));
    return {
      open: slice[0].open,
      high: Math.max(...slice.map((c) => c.high)),
      low: Math.min(...slice.map((c) => c.low)),
      close: slice[slice.length - 1].close,
    };
  }, [candles]);

  useEffect(() => {
    try {
      localStorage.setItem(WL_KEY, JSON.stringify(watchlists));
      localStorage.setItem(WL_ACTIVE_KEY, activeWlId);
    } catch {
      /* ignore */
    }
  }, [watchlists, activeWlId]);

  useEffect(() => {
    const onSet = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (typeof detail === 'string' && detail in themeProfiles) {
        setProfileId(detail as ThemeProfileId);
      }
    };
    window.addEventListener('clearpath-set-profile', onSet as EventListener);
    return () => window.removeEventListener('clearpath-set-profile', onSet as EventListener);
  }, []);

  const pickProfile = (id: ThemeProfileId) => {
    const next = applyNeuroProfile(id);
    setProfileId(next);
    setShowProfiles(false);
    if (prefersReducedChrome(next)) {
      setFocusMode(true);
      setBlackout(false);
    }
  };

  const persistWl = (next: RetailWatchlist[]) => {
    setWatchlists(next);
  };

  return (
    <div
      data-neuro-door
      data-neuro-workstation
      className="flex w-full flex-col gap-3 overflow-visible p-3"
      style={{
        background: deskVisual?.overrides.background
          ? deskVisual.cssVars['--desk-user-bg']
          : `linear-gradient(180deg, ${theme.bgTop}, ${theme.bgBottom})`,
        color: theme.text,
      }}
    >
      {/* Header + profile */}
      {!blackout && (
        <section
          data-retail-bento
          className="relative retail-bento overflow-hidden rounded-xl border"
          style={{ borderColor: `${theme.borderA}55`, background: theme.panel }}
        >
          {hold && !profilesHeld ? (
            <button
              type="button"
              className="rt-bento-x"
              aria-label="Hold sensory profiles in the file"
              title="Hold in file"
              onClick={() => hold.hold('profiles')}
            >
              <X size={11} strokeWidth={2.75} aria-hidden="true" />
            </button>
          ) : null}
          <header className="flex flex-wrap items-end justify-between gap-3 px-3 py-3">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.2em]" style={{ color: theme.borderA }}>
                ClearPath Trader
              </p>
              <h1 className="text-xl font-black uppercase tracking-tight">Neurodivergent Market</h1>
              <p className="text-base font-bold opacity-70">
                Retail + crypto workstation · sensory profile: {theme.label}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {!profilesHeld ? (
              <button
                type="button"
                onClick={() => setShowProfiles((v) => !v)}
                className="rounded-lg border px-3 py-2 text-sm font-black uppercase"
                style={{ borderColor: theme.borderA, color: theme.borderA }}
              >
                {showProfiles ? 'Hide profiles' : 'Change UI profile'}
              </button>
              ) : null}
              <button
                type="button"
                onClick={() => {
                  setFocusMode((v) => !v);
                  if (!focusMode) setBlackout(false);
                }}
                className="rounded-lg border px-3 py-2 text-sm font-black uppercase"
                style={{
                  borderColor: focusMode ? theme.borderB : `${theme.borderA}55`,
                  color: focusMode ? theme.borderB : theme.text,
                }}
              >
                Focus
              </button>
              <button
                type="button"
                onClick={() => {
                  setBlackout((v) => !v);
                  if (!blackout) setFocusMode(false);
                }}
                className="rounded-lg border px-3 py-2 text-sm font-black uppercase opacity-90"
                style={{ borderColor: blackout ? '#ff1493' : `${theme.borderA}55` }}
              >
                Blackout
              </button>
              <a href="/ui" className="rounded-lg border px-3 py-2 text-sm font-black uppercase opacity-80" style={{ borderColor: `${theme.borderA}55` }}>
                All UI modes
              </a>
            </div>
          </header>
          {showProfiles && !profilesHeld ? (
            <div className="retail-bento-body grid grid-cols-1 gap-2 border-t border-white/10 p-3 sm:grid-cols-2 lg:grid-cols-3">
              {NEURO_DESK_PROFILES.map((id) => {
                const p = themeProfiles[id];
                const on = id === profileId;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => pickProfile(id)}
                    className="rounded-xl border p-3 text-left"
                    style={{
                      borderColor: on ? p.borderA : `${p.borderA}44`,
                      background: on ? `${p.borderA}18` : 'transparent',
                    }}
                  >
                    <p className="text-sm font-black uppercase tracking-widest" style={{ color: p.borderA }}>
                      {p.label}
                    </p>
                    <p className="mt-1 text-sm font-bold opacity-70">{NEURO_PROFILE_BLURBS[id]}</p>
                  </button>
                );
              })}
            </div>
          ) : null}
        </section>
      )}

      {/* Ribbon */}
      {!hideSecondary && (
        <Bento holdId="ribbon" title="Market Ribbon" status="crypto + majors" className="retail-bento shrink-0">
          <div className="flex gap-2 overflow-x-auto pb-1">
            {NEURO_RIBBON.map((m) => {
              const row = intel.ribbon.find((r) => r.symbol === m.symbol);
              return (
                <button
                  key={m.symbol}
                  type="button"
                  onClick={() => setSymbol(m.symbol)}
                  className="min-w-[110px] shrink-0 rounded-lg border px-3 py-2 text-left"
                  style={{ borderColor: `${theme.borderA}40` }}
                >
                  <p className="text-sm font-black uppercase opacity-60">{m.label}</p>
                  {row?.live && row.price != null ? (
                    <>
                      <p className="font-mono text-base font-extrabold tabular-nums">
                        {formatStructurePrice(row.price)}
                      </p>
                      <p className={`font-mono text-sm ${pctClass(row.pct)}`}>
                        {row.pct == null ? '—' : `${row.pct >= 0 ? '+' : ''}${row.pct.toFixed(2)}%`}
                      </p>
                    </>
                  ) : (
                    <p className="text-sm font-bold uppercase text-amber-200/80">DATA UNAVAILABLE</p>
                  )}
                </button>
              );
            })}
          </div>
        </Bento>
      )}

      {/* Search */}
      <section
        data-retail-bento
        className="retail-bento overflow-hidden rounded-xl border"
        style={{ borderColor: `${theme.borderA}55`, background: theme.panel }}
      >
        <header>
          <h2 className="text-sm font-black uppercase tracking-[0.16em]" style={{ color: theme.borderA }}>
            Search Asset
          </h2>
        </header>
        <div className="retail-bento-body flex flex-wrap items-center gap-3">
          <div className="min-w-[200px] flex-1">
            <ChartSymbolSearch
              placeholder="Search BTC, ETH, EURUSD, gold, stocks…"
              activeSymbol={symbol}
              onSubmit={(raw) => setSymbol(resolveMarketAsset(raw).value)}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {['BTCUSD', 'ETHUSD', 'SOLUSD', 'EURUSD', 'XAUUSD', 'SPX'].map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSymbol(s)}
                className="rounded-lg border px-3 py-2 font-mono text-sm font-black"
                style={{
                  borderColor: symbol === s ? theme.borderA : `${theme.borderA}40`,
                  color: symbol === s ? theme.borderA : theme.text,
                }}
              >
                {s}
              </button>
            ))}
          </div>
          <div className="ml-auto flex items-baseline gap-2 font-mono">
            <span className="text-base font-extrabold">{symbol}</span>
            {price != null ? (
              <span className="text-base font-extrabold" style={{ color: theme.borderA }}>
                {formatStructurePrice(price)}
              </span>
            ) : (
              <span className="text-sm uppercase text-amber-200/80">DATA UNAVAILABLE</span>
            )}
            {pct != null ? (
              <span className={`text-base ${pctClass(pct)}`}>
                {pct >= 0 ? '+' : ''}
                {pct.toFixed(2)}%
              </span>
            ) : null}
          </div>
        </div>
      </section>

      {/* Main grid */}
      <div
        data-desk-chart-room
        data-chart-room={chartFull ? 'full' : 'open'}
        className="grid min-h-[70vh] flex-1 grid-cols-1 gap-3"
        style={{ ['--desk-chart-cols' as string]: neuroChartCols }}
      >
        {!watchHeld && (
          <Bento holdId="watchlist" title="Watchlist" status={activeWl?.name} className="retail-bento min-h-[280px]">
            <div className="mb-2 flex flex-wrap gap-1">
              {watchlists.map((w) => (
                <button
                  key={w.id}
                  type="button"
                  onClick={() => setActiveWlId(w.id)}
                  className="rounded-lg border px-2 py-1 text-sm font-black uppercase"
                  style={{
                    borderColor: activeWlId === w.id ? theme.borderA : `${theme.borderA}40`,
                    color: activeWlId === w.id ? theme.borderA : theme.text,
                  }}
                >
                  {w.name}
                </button>
              ))}
            </div>
            <form
              className="mb-2 flex gap-1"
              onSubmit={(e) => {
                e.preventDefault();
                if (!addSymbol.trim() || !activeWl) return;
                const resolved = resolveMarketAsset(addSymbol.trim()).value.toUpperCase();
                if (activeWl.symbols.includes(resolved)) return;
                persistWl(
                  watchlists.map((w) =>
                    w.id === activeWl.id ? { ...w, symbols: [...w.symbols, resolved] } : w,
                  ),
                );
                setAddSymbol('');
              }}
            >
              <input
                value={addSymbol}
                onChange={(e) => setAddSymbol(e.target.value)}
                placeholder="Add asset"
                className="min-w-0 flex-1 rounded-lg border bg-black/30 px-2 py-2 font-mono text-sm"
                style={{ borderColor: `${theme.borderA}40`, color: theme.text }}
              />
              <button
                type="submit"
                className="rounded-lg border px-3 py-2 text-sm font-black uppercase"
                style={{ borderColor: theme.borderA, color: theme.borderA }}
              >
                Add
              </button>
            </form>
            <ul>
              {(activeWl?.symbols ?? []).map((sym) => {
                const row =
                  intel.watchQuotes.find((q) => q.symbol === sym) ??
                  ({
                    symbol: sym,
                    name: sym,
                    price: null,
                    pct: null,
                    volume: null,
                    live: false,
                    latency: 'UNKNOWN',
                  } satisfies RetailQuote);
                return (
                  <li key={sym}>
                    <QuoteRow row={row} on={sym === symbol} onPick={setSymbol} />
                  </li>
                );
              })}
            </ul>
          </Bento>
        )}

        <section
          data-retail-bento
          className="retail-bento flex min-h-[70vh] min-w-0 flex-1 flex-col overflow-hidden rounded-xl border"
          style={{ borderColor: `${theme.borderA}55`, background: theme.panel }}
        >
          <header className="space-y-2">
            <h2 className="text-sm font-black uppercase tracking-[0.16em]" style={{ color: theme.borderA }}>
              Primary Chart
            </h2>
            <div className="flex flex-wrap gap-1.5" role="group" aria-label="Timeframe">
              {TIMEFRAMES.map((tf) => (
                <button
                  key={tf}
                  type="button"
                  onClick={() => setTimeframe(tf)}
                  className="rounded-lg border px-2.5 py-1 text-sm font-black uppercase"
                  style={{
                    borderColor: timeframe === tf ? theme.borderB : `${theme.borderA}40`,
                    color: timeframe === tf ? theme.borderB : theme.text,
                    background: timeframe === tf ? `${theme.borderB}22` : 'transparent',
                  }}
                >
                  {tf}
                </button>
              ))}
            </div>
            {intel.candleError ? (
              <p className="font-mono text-sm text-rose-400">{intel.candleError}</p>
            ) : null}
          </header>
          <DeskChartFill tall>
            {candles.length === 0 ? (
              <div
                className="flex h-full min-h-[320px] items-center justify-center font-mono text-sm text-zinc-500"
                role="status"
                aria-live="polite"
              >
                {intel.candleError || 'Loading chart…'}
              </div>
            ) : (
              <LightweightCandles
                symbol={symbol}
                profileId={profileId}
                timeframe={timeframe}
                data={candles}
                fillParent
                height={640}
                hidePatternOverlays
                publishDrawingSession
              />
            )}
          </DeskChartFill>
          <p className="border-t border-white/10 px-3 py-2 text-sm font-bold uppercase tracking-wider opacity-60">
            Chart tools on the plot · Indicators stay off until you choose · No trade execution
          </p>
        </section>

        <DeskReplayPanel
          initialSymbol={symbol}
          initialTimeframe={timeframe}
          profileId={profileId}
        />

        {!snapHeld && (
          <Bento holdId="snapshot" title="Market Snapshot" status={symbol} className="retail-bento min-h-[280px]">
            {price == null && !day ? (
              <Unavail />
            ) : (
              <>
                <KV k="Price" v={price != null ? formatStructurePrice(price) : '—'} />
                <KV
                  k="Change"
                  v={pct != null ? `${pct >= 0 ? '+' : ''}${pct.toFixed(2)}%` : 'DATA UNAVAILABLE'}
                  accent={pctClass(pct)}
                />
                <KV k="Open" v={day ? formatStructurePrice(day.open) : 'DATA UNAVAILABLE'} />
                <KV k="High" v={day ? formatStructurePrice(day.high) : 'DATA UNAVAILABLE'} />
                <KV k="Low" v={day ? formatStructurePrice(day.low) : 'DATA UNAVAILABLE'} />
                <KV k="Close" v={day ? formatStructurePrice(day.close) : 'DATA UNAVAILABLE'} />
              </>
            )}
          </Bento>
        )}
      </div>

      {showBelow ? (
        <div className="space-y-3">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            <Bento holdId="news" title="News" status={intel.newsError ? 'offline' : `${intel.news.length} items`} className="retail-bento min-h-[160px]">
              {intel.news.length === 0 ? (
                <Unavail label={intel.newsError || 'DATA UNAVAILABLE'} />
              ) : (
                <ul className="space-y-2">
                  {intel.news.slice(0, 4).map((n, i) => (
                    <li key={`${n.title}-${i}`} className="border-b border-white/10 pb-2 last:border-0">
                      <p className="font-mono text-sm uppercase opacity-60">
                        {n.time} · {n.source}
                      </p>
                      <p className="text-sm font-bold leading-snug">{n.title}</p>
                    </li>
                  ))}
                </ul>
              )}
            </Bento>

            <Bento holdId="calendar" title="Economic Wire" status="informational" className="retail-bento min-h-[160px]">
              {intel.econ.length === 0 ? (
                <Unavail label={intel.econError || 'DATA UNAVAILABLE'} />
              ) : (
                <ul className="space-y-2">
                  {intel.econ.slice(0, 4).map((e, i) => (
                    <li key={`${e.title}-${i}`} className="border-b border-white/10 pb-2 last:border-0">
                      <p className="font-mono text-sm uppercase opacity-60">{e.source}</p>
                      <p className="text-sm font-bold leading-snug">{e.title}</p>
                    </li>
                  ))}
                </ul>
              )}
            </Bento>

            <Bento holdId="alerts" title="Alerts" status={`${alerts.length} saved`} className="retail-bento min-h-[160px]">
              <p className="mb-2 text-sm font-bold opacity-70">
                Informational only — you control the alert. Not a trade recommendation.
              </p>
              <button
                type="button"
                className="mb-2 w-full rounded-lg border px-3 py-2 text-sm font-black uppercase"
                style={{ borderColor: theme.borderA, color: theme.borderA }}
                onClick={() => {
                  const next: RetailAlert = {
                    id: newAlertId(),
                    kind: 'price_above',
                    symbol,
                    note: `Watch ${symbol}`,
                    createdAt: Date.now(),
                    enabled: true,
                  };
                  const list = [next, ...alerts].slice(0, 40);
                  setAlerts(list);
                  saveAlerts(list);
                }}
              >
                Add watch alert for {symbol}
              </button>
              {alerts.length === 0 ? (
                <p className="text-sm opacity-60">No alerts yet.</p>
              ) : (
                <ul className="space-y-1">
                  {alerts.slice(0, 5).map((a) => (
                    <li key={a.id} className="flex justify-between gap-2 text-sm">
                      <span className="truncate font-mono">
                        {a.symbol} · {a.kind.replace(/_/g, ' ')}
                      </span>
                      <button
                        type="button"
                        className="opacity-60 hover:opacity-100"
                        onClick={() => {
                          const list = alerts.filter((x) => x.id !== a.id);
                          setAlerts(list);
                          saveAlerts(list);
                        }}
                      >
                        Remove
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </Bento>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <RetailEducationBento />
            <Bento holdId="simulation" title="Simulation Lab" status="hypothetical" className="retail-bento min-h-[140px]">
              <p className="mb-2 text-base font-bold">Simulated trading only.</p>
              <ul className="mb-3 space-y-1 text-sm font-bold uppercase tracking-wider opacity-70">
                <li>No real money</li>
                <li>No broker execution</li>
                <li>Practice in a calm layout</li>
              </ul>
              <a
                href="/encyclopedia"
                className="inline-block rounded-lg border px-3 py-2 text-sm font-black uppercase"
                style={{ borderColor: '#ff149388', color: '#ff1493' }}
              >
                Open simulation tools
              </a>
            </Bento>
          </div>
        </div>
      ) : null}

      <footer
        data-retail-bento
        className="retail-bento px-3 py-3 text-center text-sm font-bold uppercase tracking-[0.14em] opacity-70"
      >
        Information & analytics only — no live trade execution · Sensory profiles change look, not market data
      </footer>
    </div>
  );
}
