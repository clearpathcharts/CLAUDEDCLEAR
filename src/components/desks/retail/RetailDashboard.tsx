import React, { useEffect, useMemo, useState } from 'react';
import { ChartSymbolSearch } from '../../charts/ChartSymbolSearch';
import { LightweightCandles, type PriceSeriesType } from '../../charts/LightweightCandles';
import { ChartIndicatorPicker } from '../../charts/ChartIndicatorPicker';
import { resolveMarketAsset } from '../../../constants/marketAssets';
import { DEFAULT_MARKET_SYMBOLS } from '../../../constants/chartLayout';
import { formatStructurePrice } from '../../../lib/institutional/analyzeStructure';
import { atrValue, realizedVolPct } from '../../../lib/institutional/marketMath';
import { analyzeInstitutionalStructure } from '../../../lib/institutional/analyzeStructure';
import { navigateToDesk } from '../../../lib/traderDesks';
import { FX_SESSIONS, isSessionOpen } from '../../../lib/traderDesks';
import { advancedProfiles } from '../../../lib/advanced/profiles';
import { Bento, Unavail, KV, Bar } from '../institutional/Bento';
import { RetailEducationBento } from './RetailEducationBento';
import {
  RETAIL_RIBBON,
  useRetailIntelligence,
  type RetailQuote,
} from './useRetailIntelligence';
import {
  loadActiveWatchlistId,
  loadAlerts,
  loadSessionSnapshot,
  loadWatchlists,
  newAlertId,
  saveActiveWatchlistId,
  saveAlerts,
  saveSessionSnapshot,
  saveWatchlists,
  type RetailAlert,
  type RetailAlertKind,
  type RetailWatchlist,
} from './retailStore';
import type { Candle } from '../../../types/indicators';

const TIMEFRAMES = ['1m', '5m', '15m', '30m', '1h', '4h', '1d', '1w'] as const;
const CHART_TYPES: { id: PriceSeriesType; label: string }[] = [
  { id: 'candlestick', label: 'Candles' },
  { id: 'line', label: 'Line' },
  { id: 'area', label: 'Area' },
  { id: 'ohlc', label: 'OHLC' },
];
const RETAIL_INDICATORS = [
  'SMA',
  'EMA',
  'VWAP',
  'RSI',
  'MACD',
  'BB',
  'ATR',
  'VOL',
  'STOCH',
  'ADX',
] as const;

function readChartProfileId(): string {
  try {
    const saved = localStorage.getItem('clearpath_current_profile_id');
    if (saved && (advancedProfiles as any)[saved]) return saved;
  } catch {
    /* ignore */
  }
  return 'standard_red_green';
}

function pctClass(pct: number | null): string {
  if (pct == null) return 'text-[var(--desk-muted)]';
  return pct >= 0 ? 'text-emerald-400' : 'text-rose-400';
}

function formatVol(n: number | null): string {
  if (n == null || !Number.isFinite(n)) return '—';
  if (n >= 1e9) return `${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(2)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
  return n.toFixed(0);
}

function daySnapshot(candles: Candle[]) {
  if (!candles.length) {
    return {
      open: null as number | null,
      high: null as number | null,
      low: null as number | null,
      close: null as number | null,
      prevClose: null as number | null,
      volume: null as number | null,
      avgVolume: null as number | null,
      relVolume: null as number | null,
      change: null as number | null,
      changePct: null as number | null,
      range: null as number | null,
      vwap: null as number | null,
    };
  }
  const last = candles[candles.length - 1];
  const lookback = candles.slice(-Math.min(candles.length, 48));
  const open = lookback[0].open;
  const high = Math.max(...lookback.map((c) => c.high));
  const low = Math.min(...lookback.map((c) => c.low));
  const close = last.close;
  const prev = candles.length > 1 ? candles[candles.length - 2].close : null;
  const vols = lookback
    .map((c) => (typeof c.volume === 'number' && c.volume > 0 ? c.volume : null))
    .filter((v): v is number => v != null);
  const volume = vols.length ? vols[vols.length - 1] : null;
  const avgVolume = vols.length ? vols.reduce((s, v) => s + v, 0) / vols.length : null;
  const relVolume = volume != null && avgVolume != null && avgVolume > 0 ? volume / avgVolume : null;
  const change = prev != null ? close - prev : null;
  const changePct = prev != null && prev !== 0 ? ((close - prev) / prev) * 100 : null;
  const range = high - low;

  let vwap: number | null = null;
  let pv = 0;
  let vv = 0;
  for (const c of lookback) {
    const vol = typeof c.volume === 'number' && c.volume > 0 ? c.volume : 0;
    if (vol <= 0) continue;
    const typical = (c.high + c.low + c.close) / 3;
    pv += typical * vol;
    vv += vol;
  }
  if (vv > 0) vwap = pv / vv;

  return {
    open,
    high,
    low,
    close,
    prevClose: prev,
    volume,
    avgVolume,
    relVolume,
    change,
    changePct,
    range,
    vwap,
  };
}

function sessionLabel(): string {
  const h = new Date().getUTCHours();
  const open = FX_SESSIONS.filter((s) => isSessionOpen(h, s.utcStart, s.utcEnd));
  if (open.length === 0) return 'OFF-HOURS';
  return open.map((s) => s.label).join(' · ');
}

function trendContext(candles: Candle[]): string {
  if (candles.length < 8) return 'DATA UNAVAILABLE';
  const slice = candles.slice(-20);
  const first = slice[0].close;
  const last = slice[slice.length - 1].close;
  if (first === 0) return 'DATA UNAVAILABLE';
  const pct = ((last - first) / first) * 100;
  if (pct > 0.35) return 'HIGHER OVER LOOKBACK';
  if (pct < -0.35) return 'LOWER OVER LOOKBACK';
  return 'RANGE-BOUND LOOKBACK';
}

function QuoteRowBtn({
  row,
  on,
  onPick,
  onRemove,
}: {
  row: RetailQuote;
  on?: boolean;
  onPick: (s: string) => void;
  onRemove?: () => void;
}) {
  return (
    <div
      className="flex items-center gap-1 rounded px-1 py-0.5"
      style={{ background: on ? 'rgba(0,255,255,0.08)' : undefined }}
    >
      <button type="button" onClick={() => onPick(row.symbol)} className="min-w-0 flex-1 text-left hover:bg-white/5">
        <span className="flex items-center justify-between gap-2">
          <span className="min-w-0">
            <span className="block truncate font-mono text-sm font-extrabold text-[var(--desk-text)]">
              {row.symbol}
            </span>
            {row.volume != null ? (
              <span className="block text-sm text-[var(--desk-muted)]">Vol {formatVol(row.volume)}</span>
            ) : null}
          </span>
          <span className="shrink-0 text-right font-mono">
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
        </span>
      </button>
      {onRemove ? (
        <button
          type="button"
          onClick={onRemove}
          title="Remove"
          className="shrink-0 px-1 text-sm text-[var(--desk-muted)] hover:text-rose-400"
        >
          ×
        </button>
      ) : null}
    </div>
  );
}

export default function RetailDashboard() {
  const [symbol, setSymbol] = useState<string>(DEFAULT_MARKET_SYMBOLS[0]);
  const [timeframe, setTimeframe] = useState('1h');
  const [layout, setLayout] = useState<1 | 2 | 4>(1);
  const [chartType, setChartType] = useState<PriceSeriesType>('candlestick');
  const [chartProfileId, setChartProfileId] = useState(readChartProfileId);
  const [activeIndicators, setActiveIndicators] = useState<string[]>([]);
  const [showIndicators, setShowIndicators] = useState(false);
  const [focusMode, setFocusMode] = useState(false);
  const [blackout, setBlackout] = useState(false);
  const [addSymbol, setAddSymbol] = useState('');
  const [openPanels, setOpenPanels] = useState<Record<string, boolean>>({
    watchlist: true,
    snapshot: true,
    context: true,
    volume: true,
    movers: true,
    news: true,
    calendar: true,
    alerts: true,
    education: true,
    fundamentals: true,
    simulation: true,
    changed: true,
  });
  const [maximized, setMaximized] = useState<string | null>(null);
  const [slotOverrides, setSlotOverrides] = useState<
    Partial<Record<number, { symbol: string; timeframe: string }>>
  >({});
  const [watchlists, setWatchlists] = useState<RetailWatchlist[]>(() => loadWatchlists());
  const [activeWlId, setActiveWlId] = useState(() => loadActiveWatchlistId());
  const [alerts, setAlerts] = useState<RetailAlert[]>(() => loadAlerts());
  const [alertKind, setAlertKind] = useState<RetailAlertKind>('price_above');
  const [alertThreshold, setAlertThreshold] = useState('');
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  const activeWl = watchlists.find((w) => w.id === activeWlId) ?? watchlists[0];
  const watchSymbols = activeWl?.symbols ?? [];

  const intel = useRetailIntelligence(symbol, timeframe, watchSymbols, layout, slotOverrides);
  const candles = intel.primaryCandles;
  const snap = useMemo(() => daySnapshot(candles), [candles]);
  const structure = useMemo(
    () => (candles.length ? analyzeInstitutionalStructure(candles) : null),
    [candles],
  );
  const rv = realizedVolPct(candles);
  const atr = atrValue(candles);
  const lastCvd = structure?.cvd.length ? structure.cvd[structure.cvd.length - 1].cumulativeDelta : null;
  const poc = structure?.volumeProfile.find((n) => n.isPOC);
  const primaryQuote = intel.watchQuotes.find((q) => q.symbol === symbol)
    ?? intel.ribbon.find((q) => q.symbol === symbol);

  const displayPrice = primaryQuote?.live && primaryQuote.price != null ? primaryQuote.price : snap.close;
  const displayPct = primaryQuote?.pct ?? snap.changePct;

  const prevSnap = loadSessionSnapshot();
  const whatChanged = useMemo(() => {
    const items: { label: string; value: string; tone?: string }[] = [];
    if (!prevSnap || prevSnap.symbol !== symbol) {
      items.push({ label: 'SESSION', value: 'FIRST VIEW / ASSET CHANGED' });
      return items;
    }
    if (displayPrice != null && prevSnap.price != null && prevSnap.price !== 0) {
      const pct = ((displayPrice - prevSnap.price) / prevSnap.price) * 100;
      items.push({
        label: 'PRICE',
        value: `${pct >= 0 ? '+' : ''}${pct.toFixed(2)}%`,
        tone: pctClass(pct),
      });
    } else {
      items.push({ label: 'PRICE', value: 'DATA UNAVAILABLE' });
    }
    if (snap.volume != null && prevSnap.volume != null && prevSnap.volume > 0) {
      const vp = ((snap.volume - prevSnap.volume) / prevSnap.volume) * 100;
      items.push({ label: 'VOLUME', value: `${vp >= 0 ? '+' : ''}${vp.toFixed(0)}%` });
    } else {
      items.push({ label: 'VOLUME', value: 'DATA UNAVAILABLE' });
    }
    if (rv != null && prevSnap.volPct != null) {
      items.push({
        label: 'VOLATILITY',
        value: rv > prevSnap.volPct * 1.1 ? 'INCREASED' : rv < prevSnap.volPct * 0.9 ? 'DECREASED' : 'STABLE',
      });
    } else if (rv != null) {
      items.push({ label: 'VOLATILITY', value: `${rv.toFixed(1)}% ann.` });
    }
    const newsDelta = Math.max(0, intel.news.length - (prevSnap.newsCount || 0));
    items.push({ label: 'NEW NEWS', value: String(newsDelta) });
    items.push({
      label: 'ECONOMIC',
      value: intel.econ.length > 0 ? 'WIRE ACTIVE' : 'DATA UNAVAILABLE',
    });
    return items;
  }, [prevSnap, symbol, displayPrice, snap.volume, rv, intel.news.length, intel.econ.length]);

  useEffect(() => {
    const onSetProfile = (event: Event) => {
      const detail = (event as CustomEvent).detail;
      if (typeof detail === 'string' && (advancedProfiles as any)[detail]) {
        setChartProfileId(detail);
      }
    };
    window.addEventListener('clearpath-set-profile', onSetProfile as EventListener);
    return () => window.removeEventListener('clearpath-set-profile', onSetProfile as EventListener);
  }, []);

  useEffect(() => {
    saveSessionSnapshot({
      at: Date.now(),
      symbol,
      price: displayPrice,
      volume: snap.volume,
      newsCount: intel.news.length,
      econCount: intel.econ.length,
      volPct: rv,
    });
  }, [symbol, displayPrice, snap.volume, intel.news.length, intel.econ.length, rv]);

  const persistWatchlists = (next: RetailWatchlist[]) => {
    setWatchlists(next);
    saveWatchlists(next);
  };

  const setActiveWatchlist = (id: string) => {
    setActiveWlId(id);
    saveActiveWatchlistId(id);
  };

  const addToWatchlist = (raw: string) => {
    const resolved = resolveMarketAsset(raw).value.toUpperCase();
    if (!activeWl) return;
    if (activeWl.symbols.includes(resolved)) return;
    persistWatchlists(
      watchlists.map((w) =>
        w.id === activeWl.id ? { ...w, symbols: [...w.symbols, resolved] } : w,
      ),
    );
    setAddSymbol('');
  };

  const removeFromWatchlist = (sym: string) => {
    if (!activeWl) return;
    persistWatchlists(
      watchlists.map((w) =>
        w.id === activeWl.id ? { ...w, symbols: w.symbols.filter((s) => s !== sym) } : w,
      ),
    );
  };

  const reorderWatchlist = (from: number, to: number) => {
    if (!activeWl || from === to || from < 0 || to < 0) return;
    const next = [...activeWl.symbols];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    persistWatchlists(watchlists.map((w) => (w.id === activeWl.id ? { ...w, symbols: next } : w)));
  };

  const togglePanel = (id: string) =>
    setOpenPanels((s) => ({ ...s, [id]: s[id] === false ? true : false }));

  const hideSecondary = focusMode || blackout;
  const denseBlackout = blackout;

  const gainers = [...intel.moverQuotes].sort((a, b) => (b.pct ?? 0) - (a.pct ?? 0)).slice(0, 4);
  const decliners = [...intel.moverQuotes].sort((a, b) => (a.pct ?? 0) - (b.pct ?? 0)).slice(0, 4);
  const mostActive = [...intel.moverQuotes]
    .filter((q) => q.volume != null)
    .sort((a, b) => (b.volume ?? 0) - (a.volume ?? 0))
    .slice(0, 4);

  const support =
    structure?.orderBlocks.find((b) => b.type === 'BULLISH_OB')?.low ??
    (candles.length ? Math.min(...candles.slice(-20).map((c) => c.low)) : null);
  const resistance =
    structure?.orderBlocks.find((b) => b.type === 'BEARISH_OB')?.high ??
    (candles.length ? Math.max(...candles.slice(-20).map((c) => c.high)) : null);

  const prevDayHigh =
    candles.length >= 2 ? Math.max(...candles.slice(-Math.min(candles.length, 24), -1).map((c) => c.high)) : null;
  const prevDayLow =
    candles.length >= 2 ? Math.min(...candles.slice(-Math.min(candles.length, 24), -1).map((c) => c.low)) : null;

  return (
    <div data-retail-door className="flex min-h-0 flex-1 flex-col gap-3 p-3">
      {/* Header */}
      {!denseBlackout && (
        <section data-retail-bento className="retail-bento flex flex-wrap items-end justify-between gap-3">
          <header className="flex min-w-0 flex-1 flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.2em] text-[var(--desk-cyan)]">
                ClearPath Trader
              </p>
              <h1 className="text-xl font-black uppercase tracking-tight text-[var(--desk-text)]">
                Retail Market
              </h1>
              <p className="text-base font-bold text-[var(--desk-muted)]">See the market clearly</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  setFocusMode((v) => !v);
                  if (!focusMode) setBlackout(false);
                }}
                className="rounded-lg border px-3 py-2 text-sm font-black uppercase tracking-wider"
                style={{
                  borderColor: focusMode ? 'var(--desk-indigo)' : 'var(--desk-border)',
                  color: focusMode ? 'var(--desk-indigo)' : 'var(--desk-muted)',
                }}
              >
                Focus mode
              </button>
              <button
                type="button"
                onClick={() => {
                  setBlackout((v) => !v);
                  if (!blackout) setFocusMode(false);
                }}
                className="rounded-lg border px-3 py-2 text-sm font-black uppercase tracking-wider"
                style={{
                  borderColor: blackout ? 'var(--desk-pink)' : 'var(--desk-border)',
                  color: blackout ? 'var(--desk-pink)' : 'var(--desk-muted)',
                }}
              >
                Blackout
              </button>
              <a
                href="/education"
                className="rounded-lg border border-[var(--desk-border)] px-3 py-2 text-sm font-black uppercase tracking-wider text-[var(--desk-muted)] hover:text-[var(--desk-cyan)]"
              >
                Learn
              </a>
            </div>
          </header>
        </section>
      )}

      {/* Global market ribbon */}
      {!hideSecondary && (
        <Bento title="Global Market Ribbon" status="context" className="retail-bento shrink-0">
          <div className="flex gap-2 overflow-x-auto pb-1">
            {RETAIL_RIBBON.map((m) => {
              const row = intel.ribbon.find((r) => r.symbol === m.symbol);
              return (
                <button
                  key={m.symbol}
                  type="button"
                  onClick={() => setSymbol(m.symbol)}
                  className="min-w-[120px] shrink-0 rounded-lg border border-[var(--desk-border)] px-3 py-2 text-left hover:border-[var(--desk-cyan)]/40"
                >
                  <p className="text-sm font-black uppercase tracking-[0.14em] text-[var(--desk-muted)]">
                    {m.label}
                  </p>
                  {row?.live && row.price != null ? (
                    <>
                      <p className="font-mono text-base font-extrabold tabular-nums text-[var(--desk-text)]">
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

      {/* Asset search + quick picks */}
      <section data-retail-bento className="retail-bento flex min-w-0 flex-col overflow-hidden">
        <header>
          <h2 className="text-sm font-black uppercase tracking-[0.16em] text-[var(--desk-cyan)]">
            Search Asset
          </h2>
        </header>
        <div className="retail-bento-body flex flex-wrap items-center gap-3">
          <div className="min-w-[220px] flex-1">
            <ChartSymbolSearch
              placeholder="Search stocks, ETFs, forex, indices, commodities, crypto…"
              activeSymbol={symbol}
              onSubmit={(raw) => setSymbol(resolveMarketAsset(raw).value)}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {['EURUSD', 'SPX', 'NDX', 'XAUUSD', 'BTCUSD', 'DXY'].map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSymbol(s)}
                className="rounded-lg border px-3 py-2 font-mono text-sm font-black uppercase"
                style={{
                  borderColor: symbol === s ? 'var(--desk-cyan)' : 'var(--desk-border)',
                  color: symbol === s ? 'var(--desk-cyan)' : 'var(--desk-muted)',
                }}
              >
                {s}
              </button>
            ))}
          </div>
          <div className="ml-auto flex items-baseline gap-2 font-mono">
            <span className="text-base font-extrabold text-[var(--desk-text)]">{symbol}</span>
            {displayPrice != null ? (
              <span className="text-base font-extrabold text-[var(--desk-cyan)]">
                {formatStructurePrice(displayPrice)}
              </span>
            ) : (
              <span className="text-sm uppercase text-amber-200/80">DATA UNAVAILABLE</span>
            )}
            {displayPct != null ? (
              <span className={`text-base ${pctClass(displayPct)}`}>
                {displayPct >= 0 ? '+' : ''}
                {displayPct.toFixed(2)}%
              </span>
            ) : null}
          </div>
        </div>
      </section>

      {/* Primary row: watchlist | chart | snapshot */}
      <div
        className={`grid min-h-[380px] gap-3 ${
          hideSecondary
            ? 'grid-cols-1'
            : 'grid-cols-1 lg:grid-cols-[240px_minmax(0,1fr)_240px] xl:grid-cols-[260px_minmax(0,1.7fr)_270px]'
        }`}
      >
        {!hideSecondary && (
          <Bento
            title="My Watchlist"
            status={activeWl?.name}
            expanded={openPanels.watchlist !== false}
            onToggle={() => togglePanel('watchlist')}
            onExpand={() => setMaximized(maximized === 'watchlist' ? null : 'watchlist')}
            className="retail-bento min-h-[280px]"
          >
            <div className="mb-2 flex flex-wrap gap-1">
              {watchlists.map((w) => (
                <button
                  key={w.id}
                  type="button"
                  onClick={() => setActiveWatchlist(w.id)}
                  className="rounded border px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider"
                  style={{
                    borderColor: activeWlId === w.id ? 'var(--desk-cyan)' : 'var(--desk-border)',
                    color: activeWlId === w.id ? 'var(--desk-cyan)' : 'var(--desk-muted)',
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
                if (addSymbol.trim()) addToWatchlist(addSymbol.trim());
              }}
            >
              <input
                value={addSymbol}
                onChange={(e) => setAddSymbol(e.target.value)}
                placeholder="Add asset"
                className="min-w-0 flex-1 rounded border border-[var(--desk-border)] bg-black/40 px-2 py-1 font-mono text-[11px] text-[var(--desk-text)]"
              />
              <button
                type="submit"
                className="rounded border border-[var(--desk-cyan)]/40 px-2 py-1 text-[10px] font-black uppercase text-[var(--desk-cyan)]"
              >
                Add
              </button>
            </form>
            <ul>
              {(activeWl?.symbols ?? []).map((sym, idx) => {
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
                  <li
                    key={sym}
                    draggable
                    onDragStart={() => setDragIndex(idx)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => {
                      if (dragIndex != null) reorderWatchlist(dragIndex, idx);
                      setDragIndex(null);
                    }}
                  >
                    <QuoteRowBtn
                      row={row}
                      on={sym === symbol}
                      onPick={setSymbol}
                      onRemove={() => removeFromWatchlist(sym)}
                    />
                  </li>
                );
              })}
            </ul>
          </Bento>
        )}

        <section data-retail-bento className="retail-bento flex min-h-[360px] min-w-0 flex-col overflow-hidden">
          <header className="shrink-0 space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-sm font-black uppercase tracking-[0.16em] text-[var(--desk-cyan)]">
                Primary Chart
              </h2>
              <div className="flex gap-1" role="group" aria-label="Chart layout">
                {([1, 2, 4] as const).map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setLayout(n)}
                    className="rounded-lg border px-2.5 py-1 text-sm font-black uppercase"
                    style={{
                      borderColor: layout === n ? 'var(--desk-pink)' : 'var(--desk-border)',
                      color: layout === n ? 'var(--desk-pink)' : 'var(--desk-muted)',
                    }}
                  >
                    {n} chart{n > 1 ? 's' : ''}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5" role="group" aria-label="Timeframe">
              {TIMEFRAMES.map((tf) => (
                <button
                  key={tf}
                  type="button"
                  onClick={() => setTimeframe(tf)}
                  aria-pressed={timeframe === tf}
                  className="rounded-lg border px-2.5 py-1 text-sm font-black uppercase"
                  style={{
                    borderColor: timeframe === tf ? 'var(--desk-indigo)' : 'var(--desk-border)',
                    color: timeframe === tf ? 'var(--desk-indigo)' : 'var(--desk-muted)',
                    background: timeframe === tf ? 'rgba(129,140,248,0.15)' : 'transparent',
                  }}
                >
                  {tf}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-sm font-black uppercase tracking-wider text-[var(--desk-muted)]">
                Type
              </span>
              {CHART_TYPES.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setChartType(t.id)}
                  className="rounded-lg border px-2.5 py-1 text-sm font-black uppercase"
                  style={{
                    borderColor: chartType === t.id ? 'var(--desk-cyan)' : 'var(--desk-border)',
                    color: chartType === t.id ? 'var(--desk-cyan)' : 'var(--desk-muted)',
                  }}
                >
                  {t.label}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setShowIndicators((v) => !v)}
                className="rounded-lg border border-[var(--desk-border)] px-2.5 py-1 text-sm font-black uppercase text-[var(--desk-muted)] hover:text-[var(--desk-cyan)]"
              >
                Indicators{activeIndicators.length ? ` (${activeIndicators.length})` : ''}
              </button>
            </div>
            {showIndicators ? (
              <ChartIndicatorPicker
                compact
                activeIndicators={activeIndicators}
                allowedAbbrs={RETAIL_INDICATORS}
                maxActive={6}
                onToggle={(abbr) =>
                  setActiveIndicators((prev) =>
                    prev.includes(abbr) ? prev.filter((a) => a !== abbr) : [...prev, abbr],
                  )
                }
                onClear={() => setActiveIndicators([])}
              />
            ) : null}
            {intel.candleError ? (
              <p className="font-mono text-[11px] text-rose-400">{intel.candleError}</p>
            ) : null}
          </header>
          <div
            className={`min-h-0 flex-1 ${
              layout === 1 ? '' : layout === 2 ? 'grid grid-cols-1 gap-1 md:grid-cols-2' : 'grid grid-cols-1 gap-1 md:grid-cols-2'
            }`}
          >
            {intel.slots.map((slot, i) => (
              <div key={`${slot.symbol}-${slot.timeframe}-${i}`} className="relative min-h-[280px]">
                {layout > 1 ? (
                  <div className="absolute left-1 top-1 z-10 flex flex-wrap gap-1 rounded border border-[var(--desk-border)] bg-black/70 px-1 py-0.5">
                    <input
                      defaultValue={slot.symbol}
                      key={`sym-${i}-${slot.symbol}`}
                      onBlur={(e) => {
                        const v = resolveMarketAsset(e.target.value).value;
                        setSlotOverrides((prev) => ({
                          ...prev,
                          [i]: { symbol: v, timeframe: prev[i]?.timeframe ?? slot.timeframe },
                        }));
                        if (i === 0) setSymbol(v);
                      }}
                      className="w-20 rounded border border-[var(--desk-border)] bg-transparent px-1 font-mono text-[10px] text-[var(--desk-text)]"
                      title="Slot symbol"
                    />
                    <select
                      value={slot.timeframe}
                      onChange={(e) => {
                        const tf = e.target.value;
                        setSlotOverrides((prev) => ({
                          ...prev,
                          [i]: { symbol: prev[i]?.symbol ?? slot.symbol, timeframe: tf },
                        }));
                        if (i === 0) setTimeframe(tf);
                      }}
                      className="rounded border border-[var(--desk-border)] bg-black/80 px-1 text-[10px] text-[var(--desk-text)]"
                      title="Slot timeframe"
                    >
                      {TIMEFRAMES.map((tf) => (
                        <option key={tf} value={tf}>
                          {tf}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : null}
                <LightweightCandles
                  symbol={slot.symbol}
                  profileId={chartProfileId}
                  timeframe={slot.timeframe}
                  fillParent
                  height={layout === 1 ? 420 : 260}
                  activeIndicators={i === 0 ? activeIndicators : []}
                  priceSeriesType={chartType}
                  hidePatternOverlays
                  publishDrawingSession={layout === 1 && i === 0}
                />
              </div>
            ))}
          </div>
          <p className="shrink-0 border-t border-[var(--desk-border)] px-3 py-2 text-sm font-bold uppercase tracking-wider text-[var(--desk-muted)]">
            Chart tools: use the chart toolbar for crosshair, zoom, pan, reset, drawings, and fullscreen.
            Default chart stays clean — indicators are opt-in.
          </p>
        </section>

        {!hideSecondary && (
          <Bento
            title="Market Snapshot"
            status={symbol}
            expanded={openPanels.snapshot !== false}
            onToggle={() => togglePanel('snapshot')}
            className="retail-bento min-h-[280px]"
          >
            {snap.close == null && displayPrice == null ? (
              <Unavail />
            ) : (
              <div className="space-y-0.5">
                <KV
                  k="Price"
                  v={displayPrice != null ? formatStructurePrice(displayPrice) : '—'}
                  accent="text-[var(--desk-cyan)]"
                />
                <KV
                  k="Change"
                  v={
                    displayPct != null
                      ? `${displayPct >= 0 ? '+' : ''}${displayPct.toFixed(2)}%`
                      : 'DATA UNAVAILABLE'
                  }
                  accent={pctClass(displayPct)}
                />
                <KV k="Open" v={snap.open != null ? formatStructurePrice(snap.open) : 'DATA UNAVAILABLE'} />
                <KV k="High" v={snap.high != null ? formatStructurePrice(snap.high) : 'DATA UNAVAILABLE'} />
                <KV k="Low" v={snap.low != null ? formatStructurePrice(snap.low) : 'DATA UNAVAILABLE'} />
                <KV
                  k="Prev close"
                  v={snap.prevClose != null ? formatStructurePrice(snap.prevClose) : 'DATA UNAVAILABLE'}
                />
                <KV k="Volume" v={snap.volume != null ? formatVol(snap.volume) : 'DATA UNAVAILABLE'} />
                <KV k="VWAP" v={snap.vwap != null ? formatStructurePrice(snap.vwap) : 'DATA UNAVAILABLE'} />
                <KV
                  k="Day range"
                  v={
                    snap.high != null && snap.low != null
                      ? `${formatStructurePrice(snap.low)} – ${formatStructurePrice(snap.high)}`
                      : 'DATA UNAVAILABLE'
                  }
                />
              </div>
            )}
          </Bento>
        )}
      </div>

      {/* Secondary bento grid */}
      {!hideSecondary && (
        <>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            <Bento
              title="Market Context"
              status={sessionLabel()}
              expanded={openPanels.context !== false}
              onToggle={() => togglePanel('context')}
              className="retail-bento min-h-[180px]"
            >
              <KV k="Session" v={sessionLabel()} />
              <KV k="Trend context" v={trendContext(candles)} />
              <KV
                k="Volatility"
                v={rv != null ? `${rv.toFixed(1)}% ann.` : 'DATA UNAVAILABLE'}
              />
              <KV
                k="ATR"
                v={atr != null ? formatStructurePrice(atr) : 'DATA UNAVAILABLE'}
              />
              <KV
                k="Range"
                v={snap.range != null ? formatStructurePrice(snap.range) : 'DATA UNAVAILABLE'}
              />
              <KV
                k="Support"
                v={support != null ? formatStructurePrice(support) : 'DATA UNAVAILABLE'}
              />
              <KV
                k="Resistance"
                v={resistance != null ? formatStructurePrice(resistance) : 'DATA UNAVAILABLE'}
              />
              <KV
                k="Prev high"
                v={prevDayHigh != null ? formatStructurePrice(prevDayHigh) : 'DATA UNAVAILABLE'}
              />
              <KV
                k="Prev low"
                v={prevDayLow != null ? formatStructurePrice(prevDayLow) : 'DATA UNAVAILABLE'}
              />
              <KV
                k="Session high"
                v={snap.high != null ? formatStructurePrice(snap.high) : 'DATA UNAVAILABLE'}
              />
              <KV
                k="Session low"
                v={snap.low != null ? formatStructurePrice(snap.low) : 'DATA UNAVAILABLE'}
              />
              <p className="mt-2 text-[9px] font-bold uppercase tracking-wider text-[var(--desk-muted)]">
                Descriptive measurements only — not buy/sell guidance.
              </p>
            </Bento>

            <Bento
              title="Volume / Price"
              status={structure?.volumeMode === 'vendor' ? 'vendor volume' : 'range-proxy'}
              expanded={openPanels.volume !== false}
              onToggle={() => togglePanel('volume')}
              className="retail-bento min-h-[180px]"
            >
              <KV k="Current volume" v={snap.volume != null ? formatVol(snap.volume) : 'DATA UNAVAILABLE'} />
              <KV k="Average volume" v={snap.avgVolume != null ? formatVol(snap.avgVolume) : 'DATA UNAVAILABLE'} />
              <KV
                k="Relative volume"
                v={snap.relVolume != null ? `${snap.relVolume.toFixed(2)}×` : 'DATA UNAVAILABLE'}
              />
              {snap.relVolume != null ? <Bar pct={Math.min(100, snap.relVolume * 40)} color="bg-cyan-400" /> : null}
              <KV k="VWAP" v={snap.vwap != null ? formatStructurePrice(snap.vwap) : 'DATA UNAVAILABLE'} />
              <KV
                k="POC"
                v={poc ? formatStructurePrice(poc.price) : 'DATA UNAVAILABLE'}
              />
              <KV
                k="CVD"
                v={lastCvd != null ? formatStructurePrice(lastCvd) : 'DATA UNAVAILABLE'}
              />
              <KV
                k="Prev high / low"
                v={
                  prevDayHigh != null && prevDayLow != null
                    ? `${formatStructurePrice(prevDayHigh)} / ${formatStructurePrice(prevDayLow)}`
                    : 'DATA UNAVAILABLE'
                }
              />
            </Bento>

            <Bento
              title="Market Movers"
              status={intel.moversStatus === 'ok' ? 'live quotes' : 'unavailable'}
              expanded={openPanels.movers !== false}
              onToggle={() => togglePanel('movers')}
              className="retail-bento min-h-[180px]"
            >
              {intel.moversStatus !== 'ok' ? (
                <Unavail label="DATA UNAVAILABLE — no live mover quotes" />
              ) : (
                <div className="space-y-2">
                  <div>
                    <p className="mb-1 text-[9px] font-black uppercase tracking-wider text-[var(--desk-muted)]">
                      Top gainers
                    </p>
                    {gainers.map((r) => (
                      <QuoteRowBtn key={`g-${r.symbol}`} row={r} onPick={setSymbol} />
                    ))}
                  </div>
                  <div>
                    <p className="mb-1 text-[9px] font-black uppercase tracking-wider text-[var(--desk-muted)]">
                      Top decliners
                    </p>
                    {decliners.map((r) => (
                      <QuoteRowBtn key={`d-${r.symbol}`} row={r} onPick={setSymbol} />
                    ))}
                  </div>
                  <div>
                    <p className="mb-1 text-[9px] font-black uppercase tracking-wider text-[var(--desk-muted)]">
                      Most active
                    </p>
                    {mostActive.length ? (
                      mostActive.map((r) => <QuoteRowBtn key={`a-${r.symbol}`} row={r} onPick={setSymbol} />)
                    ) : (
                      <Unavail label="VOLUME DATA UNAVAILABLE" />
                    )}
                  </div>
                </div>
              )}
            </Bento>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            <Bento
              title="News"
              status={intel.newsError ? 'offline' : `${intel.news.length} items`}
              expanded={openPanels.news !== false}
              onToggle={() => togglePanel('news')}
              className="retail-bento min-h-[180px]"
            >
              {intel.news.length === 0 ? (
                <Unavail label={intel.newsError || 'DATA UNAVAILABLE'} />
              ) : (
                <ul className="space-y-2">
                  {intel.news.slice(0, 5).map((n, i) => (
                    <li key={`${n.title}-${i}`} className="border-b border-[var(--desk-border)] pb-1.5 last:border-0">
                      <p className="font-mono text-[9px] uppercase text-[var(--desk-muted)]">
                        {n.time} · {n.source}
                      </p>
                      {n.link ? (
                        <a
                          href={n.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[11px] font-bold leading-snug text-[var(--desk-text)] hover:text-[var(--desk-cyan)]"
                        >
                          {n.title}
                        </a>
                      ) : (
                        <p className="text-[11px] font-bold leading-snug text-[var(--desk-text)]">{n.title}</p>
                      )}
                    </li>
                  ))}
                </ul>
              )}
              <a
                href="/markets"
                className="mt-2 inline-block text-[10px] font-black uppercase tracking-wider text-[var(--desk-indigo)] hover:text-[var(--desk-cyan)]"
              >
                View all news
              </a>
            </Bento>

            <Bento
              title="Economic Calendar"
              status="informational"
              expanded={openPanels.calendar !== false}
              onToggle={() => togglePanel('calendar')}
              className="retail-bento min-h-[180px]"
            >
              <p className="mb-2 text-[9px] font-bold uppercase tracking-wider text-[var(--desk-muted)]">
                Timed CPI/NFP/FOMC calendar rows are not fabricated. Showing economic wire when available.
              </p>
              {intel.econ.length === 0 ? (
                <Unavail label={intel.econError || 'DATA UNAVAILABLE'} />
              ) : (
                <ul className="space-y-2">
                  {intel.econ.slice(0, 5).map((e, i) => (
                    <li key={`${e.title}-${i}`} className="border-b border-[var(--desk-border)] pb-1.5 last:border-0">
                      <p className="font-mono text-[9px] uppercase text-[var(--desk-muted)]">
                        {e.pubDate ? new Date(e.pubDate).toLocaleString() : '—'} · {e.source}
                        {e.category ? ` · ${e.category}` : ''}
                      </p>
                      <p className="text-[11px] font-bold leading-snug text-[var(--desk-text)]">{e.title}</p>
                    </li>
                  ))}
                </ul>
              )}
            </Bento>

            <Bento
              title="Alerts / Events"
              status={`${alerts.filter((a) => a.enabled).length} active`}
              expanded={openPanels.alerts !== false}
              onToggle={() => togglePanel('alerts')}
              className="retail-bento min-h-[180px]"
            >
              <p className="mb-2 text-[9px] font-bold uppercase tracking-wider text-[var(--desk-muted)]">
                User-controlled informational alerts — not trade recommendations.
              </p>
              <form
                className="mb-2 space-y-1"
                onSubmit={(e) => {
                  e.preventDefault();
                  const threshold = alertThreshold ? Number(alertThreshold) : undefined;
                  const next: RetailAlert = {
                    id: newAlertId(),
                    kind: alertKind,
                    symbol,
                    threshold: Number.isFinite(threshold) ? threshold : undefined,
                    note: `${alertKind.replace(/_/g, ' ')} on ${symbol}`,
                    createdAt: Date.now(),
                    enabled: true,
                  };
                  const list = [next, ...alerts].slice(0, 40);
                  setAlerts(list);
                  saveAlerts(list);
                  setAlertThreshold('');
                }}
              >
                <select
                  value={alertKind}
                  onChange={(e) => setAlertKind(e.target.value as RetailAlertKind)}
                  className="w-full rounded border border-[var(--desk-border)] bg-black/40 px-2 py-1 text-[10px] text-[var(--desk-text)]"
                >
                  <option value="price_above">Price above</option>
                  <option value="price_below">Price below</option>
                  <option value="pct_change">Percentage change</option>
                  <option value="volume_change">Volume change</option>
                  <option value="news">News event</option>
                  <option value="economic">Economic event</option>
                  <option value="watchlist">Watchlist event</option>
                </select>
                {(alertKind === 'price_above' ||
                  alertKind === 'price_below' ||
                  alertKind === 'pct_change' ||
                  alertKind === 'volume_change') && (
                  <input
                    value={alertThreshold}
                    onChange={(e) => setAlertThreshold(e.target.value)}
                    placeholder="Threshold"
                    className="w-full rounded border border-[var(--desk-border)] bg-black/40 px-2 py-1 font-mono text-[11px] text-[var(--desk-text)]"
                  />
                )}
                <button
                  type="submit"
                  className="w-full rounded border border-[var(--desk-cyan)]/40 px-2 py-1 text-[10px] font-black uppercase text-[var(--desk-cyan)]"
                >
                  Add alert for {symbol}
                </button>
              </form>
              {alerts.length === 0 ? (
                <p className="text-[10px] text-[var(--desk-muted)]">No alerts yet.</p>
              ) : (
                <ul className="space-y-1">
                  {alerts.slice(0, 6).map((a) => (
                    <li
                      key={a.id}
                      className="flex items-center justify-between gap-2 rounded border border-[var(--desk-border)] px-2 py-1"
                    >
                      <span className="min-w-0 truncate text-[10px] text-[var(--desk-text)]">
                        {a.symbol} · {a.kind.replace(/_/g, ' ')}
                        {a.threshold != null ? ` · ${a.threshold}` : ''}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          const list = alerts.filter((x) => x.id !== a.id);
                          setAlerts(list);
                          saveAlerts(list);
                        }}
                        className="text-[10px] text-[var(--desk-muted)] hover:text-rose-400"
                      >
                        Remove
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </Bento>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
            <Bento
              title="What Changed?"
              status="since last view"
              expanded={openPanels.changed !== false}
              onToggle={() => togglePanel('changed')}
              className="retail-bento min-h-[140px]"
            >
              {whatChanged.map((c) => (
                <KV key={c.label} k={c.label} v={c.value} accent={c.tone} />
              ))}
            </Bento>

            <RetailEducationBento
              expanded={openPanels.education !== false}
              onToggle={() => togglePanel('education')}
              maximized={maximized === 'education'}
            />

            <Bento
              title="Fundamental Snapshot"
              status={intel.fundamentals.status}
              expanded={openPanels.fundamentals !== false}
              onToggle={() => togglePanel('fundamentals')}
              className="retail-bento min-h-[140px]"
            >
              {intel.fundamentals.status === 'n/a' ? (
                <p className="text-[10px] font-bold uppercase text-[var(--desk-muted)]">
                  Fundamentals apply to equities. Current asset has no statement snapshot.
                </p>
              ) : intel.fundamentals.status !== 'ok' ? (
                <Unavail
                  label={
                    intel.fundamentals.status === 'unconfigured'
                      ? 'DATA UNAVAILABLE — fundamentals key not configured'
                      : 'DATA UNAVAILABLE'
                  }
                />
              ) : (
                <div>
                  <KV
                    k="Market cap"
                    v={
                      intel.fundamentals.marketCap != null
                        ? formatVol(intel.fundamentals.marketCap)
                        : 'DATA UNAVAILABLE'
                    }
                  />
                  <KV
                    k="P/E"
                    v={
                      intel.fundamentals.pe != null
                        ? intel.fundamentals.pe.toFixed(2)
                        : 'DATA UNAVAILABLE'
                    }
                  />
                  <KV
                    k="EPS"
                    v={
                      intel.fundamentals.eps != null
                        ? intel.fundamentals.eps.toFixed(2)
                        : 'DATA UNAVAILABLE'
                    }
                  />
                  <KV
                    k="Dividend"
                    v={
                      intel.fundamentals.dividend != null
                        ? intel.fundamentals.dividend.toFixed(2)
                        : 'DATA UNAVAILABLE'
                    }
                  />
                  <KV k="Revenue growth" v="DATA UNAVAILABLE" />
                  <KV k="FCF" v="DATA UNAVAILABLE" />
                  <KV k="Debt" v="DATA UNAVAILABLE" />
                </div>
              )}
              <button
                type="button"
                onClick={() => navigateToDesk('fundamental')}
                className="mt-2 text-[10px] font-black uppercase tracking-wider text-[var(--desk-indigo)] hover:text-[var(--desk-cyan)]"
              >
                View fundamentals
              </button>
            </Bento>

            <Bento
              title="Simulation Lab"
              status="hypothetical"
              expanded={openPanels.simulation !== false}
              onToggle={() => togglePanel('simulation')}
              className="retail-bento min-h-[140px]"
            >
              <p className="mb-2 text-[11px] font-bold leading-relaxed text-[var(--desk-text)]">
                Simulated trading only.
              </p>
              <ul className="mb-3 space-y-1 text-[10px] font-bold uppercase tracking-wider text-[var(--desk-muted)]">
                <li>No real money</li>
                <li>No broker execution</li>
                <li>Practice / study environment</li>
              </ul>
              <a
                href="/encyclopedia"
                className="inline-block rounded border border-[var(--desk-pink)]/40 px-2 py-1.5 text-[10px] font-black uppercase tracking-wider text-[var(--desk-pink)] hover:bg-[var(--desk-pink)]/10"
              >
                Open simulation tools
              </a>
            </Bento>
          </div>
        </>
      )}

      <footer data-retail-bento className="retail-bento px-3 py-3 text-center text-sm font-bold uppercase tracking-[0.14em] text-[var(--desk-muted)]">
        Information & analytics only — no live trade execution · Not personalized financial advice
      </footer>
    </div>
  );
}
