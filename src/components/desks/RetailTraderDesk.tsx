import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ChartSymbolSearch } from '../charts/ChartSymbolSearch';
import { LightweightCandles, type PriceSeriesType } from '../charts/LightweightCandles';
import { ChartIndicatorPicker } from '../charts/ChartIndicatorPicker';
import { ChartDrawingSessionProvider, ChartDrawingToolsPanel } from '../charts/drawings';
import { resolveMarketAsset } from '../../constants/marketAssets';
import { getRegistryAsset, searchEnabledAssets } from '../../constants/assetRegistry';
import { resolveQuotePrice } from '../MarketTicker';
import { usePageAutoUpdate } from '../../hooks/usePageAutoUpdate';
import { fetchTieredHistoricalData } from '../../services/marketData';
import { fetchEconomicNews, type EconomicNewsItem } from '../../services/economicService';
import { calculateEMA } from '../../indicators/trend/EMA';
import { calculateATR } from '../../indicators/volatility/ATR';
import { getActiveRiverIndicator } from '../../river/riverEngine';
import {
  DESK_CHARTS_ANCHOR,
  FX_SESSIONS,
  isSessionOpen,
  navigateToDesk,
} from '../../lib/traderDesks';
import { Bento, KV, Unavail } from './institutional/Bento';
import WhatAmILookingAt from './WhatAmILookingAt';
import RetailHeldFile from './RetailHeldFile';
import { useRetailHeldPanels, type RetailPanelId } from './retailHeldPanels';
import type { Candle } from '../../types/indicators';
import './retailDesk.css';

const TIMEFRAMES = ['1m', '5m', '15m', '30m', '1h', '4h', '1d', '1w', '1M'] as const;
const RIBBON = [
  { symbol: 'SPX', label: 'S&P 500' },
  { symbol: 'NDX', label: 'NASDAQ' },
  { symbol: 'DJI', label: 'DOW' },
  { symbol: 'DXY', label: 'DXY' },
  { symbol: 'XAUUSD', label: 'GOLD' },
  { symbol: 'WTI', label: 'OIL' },
  { symbol: 'BTCUSD', label: 'BTC' },
] as const;
const LIST_NAMES = ['MY WATCHLIST', 'FOREX', 'STOCKS', 'CRYPTO', 'FAVORITES'] as const;
const DEFAULT_LISTS: Record<string, string[]> = {
  'MY WATCHLIST': ['EURUSD', 'GBPUSD', 'USDJPY', 'SPX', 'NDX', 'XAUUSD', 'BTCUSD'],
  FOREX: ['EURUSD', 'GBPUSD', 'USDJPY', 'AUDUSD', 'USDCAD'],
  STOCKS: ['AAPL', 'MSFT', 'NVDA'],
  CRYPTO: ['BTCUSD'],
  FAVORITES: [],
};
const WATCH_STORE_KEY = 'clearpath_retail_watchlists';
const LEGACY_WATCH_KEY = 'clearpath_retail_watchlist';
const INDICATOR_STORAGE_KEY = 'clearpath_active_chart_indicators';
const ALERTS_KEY = 'clearpath_retail_alerts';
const LAST_VIEW_KEY = 'clearpath_retail_last_view';
const SIM_KEY = 'clearpath_retail_sim_notes';

type QuoteSnap = {
  symbol: string;
  price: number | null;
  pct: number | null;
  change: number | null;
  open: number | null;
  high: number | null;
  low: number | null;
  prev: number | null;
  volume: number | null;
  live: boolean;
  delayed: boolean;
};

type RetailAlert = {
  id: string;
  symbol: string;
  kind: 'above' | 'below' | 'pct';
  value: number;
};

type LastView = {
  symbol: string;
  price: number | null;
  volume: number | null;
  newsCount: number;
  at: number;
};

type SimNote = { id: string; symbol: string; note: string; at: number };

type ExtraSlot = { id: string; symbol: string; timeframe: string };

function num(v: unknown): number | null {
  const n = typeof v === 'number' ? v : parseFloat(String(v ?? ''));
  return Number.isFinite(n) ? n : null;
}

function fmt(n: number | null, d = 2): string {
  if (n == null) return 'DATA UNAVAILABLE';
  return n.toLocaleString(undefined, { maximumFractionDigits: d });
}

function pctTone(pct: number | null): string {
  if (pct == null) return 'text-[var(--desk-muted)]';
  return pct >= 0 ? 'text-emerald-400' : 'text-rose-400';
}

function readSharedIndicators(): string[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(INDICATOR_STORAGE_KEY) || 'null');
    if (Array.isArray(parsed) && parsed.every((x) => typeof x === 'string')) return parsed;
  } catch {
    /* ignore */
  }
  return [];
}

function readWatchStore(): { active: string; lists: Record<string, string[]> } {
  try {
    const raw = localStorage.getItem(WATCH_STORE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as { active?: string; lists?: Record<string, string[]> };
      if (parsed?.lists && typeof parsed.lists === 'object') {
        const lists = { ...DEFAULT_LISTS, ...parsed.lists };
        const active = LIST_NAMES.includes(parsed.active as (typeof LIST_NAMES)[number])
          ? String(parsed.active)
          : 'MY WATCHLIST';
        return { active, lists };
      }
    }
    const legacy = localStorage.getItem(LEGACY_WATCH_KEY);
    if (legacy) {
      const parsed = JSON.parse(legacy);
      if (Array.isArray(parsed) && parsed.length) {
        const next = parsed.map((s) => String(s).toUpperCase()).filter(Boolean).slice(0, 12);
        return { active: 'MY WATCHLIST', lists: { ...DEFAULT_LISTS, 'MY WATCHLIST': next } };
      }
    }
  } catch {
    /* ignore */
  }
  return { active: 'MY WATCHLIST', lists: { ...DEFAULT_LISTS } };
}

function writeWatchStore(active: string, lists: Record<string, string[]>) {
  try {
    localStorage.setItem(WATCH_STORE_KEY, JSON.stringify({ active, lists }));
    localStorage.setItem(LEGACY_WATCH_KEY, JSON.stringify(lists[active] || []));
  } catch {
    /* ignore */
  }
}

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function vwapFromCandles(candles: Candle[]): number | null {
  let pv = 0;
  let vol = 0;
  for (const c of candles) {
    if (typeof c.volume !== 'number' || c.volume <= 0) continue;
    pv += ((c.high + c.low + c.close) / 3) * c.volume;
    vol += c.volume;
  }
  return vol > 0 ? pv / vol : null;
}

function volumeStats(candles: Candle[]): { last: number | null; avg: number | null; relative: number | null } {
  const vols = candles.map((c) => c.volume).filter((v): v is number => typeof v === 'number' && v > 0);
  if (!vols.length) return { last: null, avg: null, relative: null };
  const last = vols[vols.length - 1];
  const prior = vols.slice(0, -1);
  const avg = prior.length ? prior.reduce((a, b) => a + b, 0) / prior.length : last;
  return { last, avg, relative: avg > 0 ? last / avg : null };
}

function openSessions(utcHour: number): string {
  const open = FX_SESSIONS.filter((s) => isSessionOpen(utcHour, s.utcStart, s.utcEnd)).map((s) => s.label);
  return open.length ? open.join(' · ') : 'None in FX windows';
}

export default function RetailTraderDesk() {
  const initialStore = useMemo(() => readWatchStore(), []);
  const [symbol, setSymbol] = useState('EURUSD');
  const [timeframe, setTimeframe] = useState('1h');
  const [chartType, setChartType] = useState<PriceSeriesType>('candlestick');
  const [layout, setLayout] = useState<1 | 2 | 4>(1);
  const [extras, setExtras] = useState<ExtraSlot[]>([
    { id: 'b', symbol: '', timeframe: '15m' },
    { id: 'c', symbol: '', timeframe: '1h' },
    { id: 'd', symbol: '', timeframe: '4h' },
  ]);
  const [indicators, setIndicators] = useState<string[]>(readSharedIndicators);
  const takeSnapshotRef = useRef<(() => string | null) | null>(null);
  const [showMineIndicator, setShowMineIndicator] = useState(() => !!getActiveRiverIndicator());
  const [mineIndicatorName, setMineIndicatorName] = useState(
    () => getActiveRiverIndicator()?.name || 'No script imported',
  );
  const [snapshotNote, setSnapshotNote] = useState<string | null>(null);
  const [listName, setListName] = useState(initialStore.active);
  const [lists, setLists] = useState<Record<string, string[]>>(initialStore.lists);
  const watch = lists[listName] || [];
  const [quotes, setQuotes] = useState<Record<string, QuoteSnap>>({});
  const [quoteStatus, setQuoteStatus] = useState<'loading' | 'live' | 'unavailable'>('loading');
  const [candles, setCandles] = useState<Candle[]>([]);
  const [news, setNews] = useState<Array<{ time: string; source: string; title: string; link?: string }>>([]);
  const [newsErr, setNewsErr] = useState<string | null>(null);
  const [econ, setEcon] = useState<EconomicNewsItem[]>([]);
  const [econErr, setEconErr] = useState<string | null>(null);
  const [fund, setFund] = useState<Record<string, string | number | null> | null>(null);
  const [fundStatus, setFundStatus] = useState<'idle' | 'loading' | 'live' | 'unavailable'>('idle');
  const [addQuery, setAddQuery] = useState('');
  const [focusMode, setFocusMode] = useState(false);
  const [blackout, setBlackout] = useState(false);
  const [showDraw, setShowDraw] = useState(false);
  const [showIndicators, setShowIndicators] = useState(false);
  const [eduOpen, setEduOpen] = useState(false);
  const [alerts, setAlerts] = useState<RetailAlert[]>(() => readJson(ALERTS_KEY, []));
  const [alertValue, setAlertValue] = useState('');
  const [alertKind, setAlertKind] = useState<RetailAlert['kind']>('above');
  const [simNotes, setSimNotes] = useState<SimNote[]>(() => readJson(SIM_KEY, []));
  const [simDraft, setSimDraft] = useState('');
  const [lastView, setLastView] = useState<LastView | null>(() => readJson(LAST_VIEW_KEY, null));
  const [moverTab, setMoverTab] = useState<'gainers' | 'decliners' | 'active'>('gainers');
  const heldPanels = useRetailHeldPanels();

  const pick = useCallback((raw: string) => {
    setSymbol(resolveMarketAsset(raw).value);
  }, []);

  const watchSet = useCallback(
    (next: string[]) => {
      setLists((prev) => {
        const listsNext = { ...prev, [listName]: next };
        writeWatchStore(listName, listsNext);
        return listsNext;
      });
    },
    [listName],
  );

  const switchList = (name: string) => {
    setListName(name);
    writeWatchStore(name, lists);
  };

  useEffect(() => {
    try {
      localStorage.setItem(INDICATOR_STORAGE_KEY, JSON.stringify(indicators));
    } catch {
      /* ignore */
    }
  }, [indicators]);

  useEffect(() => {
    try {
      localStorage.setItem(ALERTS_KEY, JSON.stringify(alerts));
    } catch {
      /* ignore */
    }
  }, [alerts]);

  useEffect(() => {
    try {
      localStorage.setItem(SIM_KEY, JSON.stringify(simNotes));
    } catch {
      /* ignore */
    }
  }, [simNotes]);

  useEffect(() => {
    const onAdd = (event: Event) => {
      const abbr = (event as CustomEvent).detail?.abbr;
      if (typeof abbr === 'string' && abbr.trim()) {
        setIndicators((prev) => (prev.includes(abbr) ? prev : [...prev, abbr]));
      }
    };
    window.addEventListener('clearpath-add-indicator', onAdd as EventListener);
    return () => window.removeEventListener('clearpath-add-indicator', onAdd as EventListener);
  }, []);

  useEffect(() => {
    const handleIndicatorUpdate = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.name) {
        setMineIndicatorName(String(detail.name));
        setShowMineIndicator(true);
      } else {
        setMineIndicatorName('No script imported');
        setShowMineIndicator(false);
      }
    };
    window.addEventListener('river-indicator-updated', handleIndicatorUpdate);
    return () => window.removeEventListener('river-indicator-updated', handleIndicatorUpdate);
  }, []);

  const captureChart = useCallback(() => {
    setSnapshotNote(null);
    const grab = takeSnapshotRef.current;
    if (!grab) {
      setSnapshotNote('Chart capture DATA UNAVAILABLE — engine not ready');
      return;
    }
    const dataUrl = grab();
    if (!dataUrl) {
      setSnapshotNote('Chart capture DATA UNAVAILABLE');
      return;
    }
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = `${symbol}-${timeframe}-chart.png`;
    link.click();
  }, [symbol, timeframe]);

  const quoteSymbols = useMemo(() => {
    const extraSymbols = extras.map((s) => s.symbol).filter(Boolean);
    const pri = [symbol, ...extraSymbols, ...watch, ...RIBBON.map((r) => r.symbol)];
    const out: string[] = [];
    const seen = new Set<string>();
    for (const s of pri) {
      if (!s || seen.has(s)) continue;
      seen.add(s);
      out.push(s);
      if (out.length >= 12) break;
    }
    return out;
  }, [symbol, extras, watch]);

  usePageAutoUpdate(async () => {
    try {
      const res = await fetch(`/api/quotes?symbols=${encodeURIComponent(quoteSymbols.join(','))}`);
      if (!res.ok) {
        setQuoteStatus('unavailable');
        return;
      }
      const body = await res.json();
      const map = (body?.quotes || {}) as Record<string, Record<string, unknown>>;
      const next: Record<string, QuoteSnap> = {};
      for (const s of quoteSymbols) {
        const data = map[s];
        const price = resolveQuotePrice(data);
        const asset = getRegistryAsset(s);
        next[s] = {
          symbol: s,
          price,
          pct: num(data?.percent_change ?? data?.percentChange),
          change: num(data?.change),
          open: num(data?.open),
          high: num(data?.high),
          low: num(data?.low),
          prev: num(data?.previous_close ?? data?.previousClose),
          volume: num(data?.volume),
          live: price != null,
          delayed: asset?.latencyClass === 'delayed' || asset?.latencyClass === 'eod',
        };
      }
      setQuotes(next);
      setQuoteStatus(Object.values(next).some((q) => q.live) ? 'live' : 'unavailable');
    } catch {
      setQuoteStatus('unavailable');
    }
  }, { intervalMs: 30_000 });

  useEffect(() => {
    let cancelled = false;
    fetchTieredHistoricalData(symbol, timeframe, 'VIP')
      .then((rows) => {
        if (!cancelled) setCandles(rows.map((c) => ({ ...c })));
      })
      .catch(() => {
        if (!cancelled) setCandles([]);
      });
    return () => {
      cancelled = true;
    };
  }, [symbol, timeframe]);

  usePageAutoUpdate(async () => {
    try {
      const rows = await fetchTieredHistoricalData(symbol, timeframe, 'VIP');
      setCandles(rows.map((c) => ({ ...c })));
    } catch {
      setCandles([]);
    }
  }, { intervalMs: 60_000 });

  usePageAutoUpdate(async () => {
    try {
      const res = await fetch('/api/newsdata/latest');
      if (!res.ok) {
        setNews([]);
        setNewsErr(`News unavailable (HTTP ${res.status})`);
        return;
      }
      const data = await res.json();
      if (!Array.isArray(data)) {
        setNews([]);
        setNewsErr('Invalid news payload');
        return;
      }
      setNews(
        data
          .map((item: Record<string, unknown>) => {
            const title = String(item.title ?? '').trim();
            const pub = String(item.pubDate ?? item.published_at ?? '');
            const d = pub ? new Date(pub) : null;
            const time = d && Number.isFinite(d.getTime()) ? d.toISOString().slice(11, 16) : '—';
            return {
              time,
              source: String(item.source ?? item.source_id ?? 'Wire'),
              title,
              link: item.link ? String(item.link) : item.url ? String(item.url) : undefined,
            };
          })
          .filter((n) => n.title)
          .slice(0, 5),
      );
      setNewsErr(null);
    } catch {
      setNews([]);
      setNewsErr('News unavailable');
    }
  }, { intervalMs: 60_000 });

  usePageAutoUpdate(async () => {
    try {
      const items = await fetchEconomicNews();
      setEcon(items.slice(0, 6));
      setEconErr(items.length ? null : 'Timed calendar rows DATA UNAVAILABLE — economic wire empty');
    } catch {
      setEcon([]);
      setEconErr('Economic events unavailable');
    }
  }, { intervalMs: 60_000 });

  usePageAutoUpdate(async () => {
    const asset = getRegistryAsset(symbol);
    if (asset && asset.category !== 'stocks') {
      setFund(null);
      setFundStatus('unavailable');
      return;
    }
    setFundStatus('loading');
    try {
      const [qRes, mRes] = await Promise.all([
        fetch(`/api/fmp/quote/${encodeURIComponent(symbol)}`),
        fetch(`/api/fmp/key-metrics-ttm/${encodeURIComponent(symbol)}`),
      ]);
      if (!qRes.ok && !mRes.ok) {
        setFund(null);
        setFundStatus('unavailable');
        return;
      }
      const q = qRes.ok ? await qRes.json() : null;
      const m = mRes.ok ? await mRes.json() : null;
      const quote = Array.isArray(q) ? q[0] : q;
      const metrics = Array.isArray(m) ? m[0] : m;
      if (!quote && !metrics) {
        setFund(null);
        setFundStatus('unavailable');
        return;
      }
      setFund({
        marketCap: quote?.marketCap ?? metrics?.marketCap ?? null,
        pe: quote?.pe ?? metrics?.peRatio ?? null,
        revenueGrowth: metrics?.revenueGrowth ?? null,
        eps: quote?.eps ?? metrics?.netIncomePerShare ?? null,
        fcf: metrics?.freeCashFlowPerShare ?? metrics?.freeCashFlowYield ?? null,
        debt: metrics?.totalDebtToCapitalization ?? metrics?.debtToAssets ?? null,
      });
      setFundStatus('live');
    } catch {
      setFund(null);
      setFundStatus('unavailable');
    }
  }, { intervalMs: 6 * 60 * 60 * 1000 });

  const snap = quotes[symbol];
  const display = getRegistryAsset(symbol)?.display ?? symbol;
  const last = candles[candles.length - 1];
  const ema20 = calculateEMA(candles, 20).at(-1)?.value ?? null;
  const atr = calculateATR(candles, 14).at(-1)?.value ?? null;
  const sessionHigh = candles.length ? Math.max(...candles.slice(-24).map((c) => c.high)) : null;
  const sessionLow = candles.length ? Math.min(...candles.slice(-24).map((c) => c.low)) : null;
  const rangePct = last && last.low > 0 ? ((last.high - last.low) / last.close) * 100 : null;
  const vwap = vwapFromCandles(candles);
  const vol = volumeStats(candles);
  const searchHits = addQuery.trim().length >= 1 ? searchEnabledAssets(addQuery, 8) : [];
  const utcHour = new Date().getUTCHours();
  const isFx = /USD|EUR|GBP|JPY|AUD|CAD|CHF|NZD/.test(symbol) && symbol.length <= 7;
  const quiet = focusMode || blackout;
  const showWatch = !quiet && !heldPanels.isHeld('watchlist');
  const showSnap = !quiet && !heldPanels.isHeld('snapshot');
  const stageSides: 'both' | 'watch' | 'snap' | 'none' =
    showWatch && showSnap ? 'both' : showWatch ? 'watch' : showSnap ? 'snap' : 'none';
  const panel = (id: RetailPanelId) => ({
    onDismiss: () => heldPanels.hold(id),
  });

  const liveQuotes = Object.values(quotes).filter((q) => q.live && q.pct != null);
  const gainers = [...liveQuotes].sort((a, b) => (b.pct ?? 0) - (a.pct ?? 0)).slice(0, 5);
  const decliners = [...liveQuotes].sort((a, b) => (a.pct ?? 0) - (b.pct ?? 0)).slice(0, 5);
  const movers = moverTab === 'gainers' ? gainers : moverTab === 'decliners' ? decliners : [];

  const firedAlerts = alerts
    .map((a) => {
      const q = quotes[a.symbol];
      if (!q?.live || q.price == null) return null;
      if (a.kind === 'above' && q.price >= a.value) return a;
      if (a.kind === 'below' && q.price <= a.value) return a;
      if (a.kind === 'pct' && q.pct != null && Math.abs(q.pct) >= a.value) return a;
      return null;
    })
    .filter(Boolean) as RetailAlert[];

  useEffect(() => {
    const stored = readJson<LastView | null>(LAST_VIEW_KEY, null);
    setLastView(stored?.symbol === symbol ? stored : null);
  }, [symbol]);

  useEffect(() => {
    return () => {
      try {
        localStorage.setItem(
          LAST_VIEW_KEY,
          JSON.stringify({
            symbol,
            price: snap?.price ?? null,
            volume: snap?.volume ?? vol.last,
            newsCount: news.length,
            at: Date.now(),
          } satisfies LastView),
        );
      } catch {
        /* ignore */
      }
    };
  }, [symbol, snap?.price, snap?.volume, vol.last, news.length]);

  const visibleExtras = extras.slice(0, layout === 1 ? 0 : layout - 1);

  const chartBlock = (
    <div id={DESK_CHARTS_ANCHOR} className="rt-chart-well min-h-0">
      <div className="mb-2 flex flex-wrap items-end justify-between gap-2">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--desk-muted)]">Asset</p>
          <h2 className="text-xl font-black uppercase tracking-tight text-[var(--desk-text)]">{display}</h2>
        </div>
        <div className="text-right">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--desk-muted)]">Price</p>
          <p className="font-mono text-2xl font-black tabular-nums text-[var(--desk-text)]">
            {snap?.live ? fmt(snap.price, snap.price != null && snap.price < 10 ? 4 : 2) : 'DATA UNAVAILABLE'}
          </p>
          {snap?.live && snap.pct != null ? (
            <p className={`font-mono text-sm ${pctTone(snap.pct)}`}>
              {snap.change != null ? `${snap.change >= 0 ? '+' : ''}${fmt(snap.change, 2)} ` : ''}
              ({snap.pct >= 0 ? '+' : ''}
              {snap.pct.toFixed(2)}%)
            </p>
          ) : null}
          <p className="font-mono text-[9px] uppercase text-[var(--desk-muted)]">
            {quoteStatus === 'loading' ? 'LOADING MARKET DATA...' : snap?.delayed ? 'DELAYED' : snap?.live ? 'LIVE' : 'DATA UNAVAILABLE'}
          </p>
        </div>
      </div>
      <div className={`rt-chart-grid min-h-0 flex-1 ${blackout ? 'min-h-[70vh]' : ''}`} data-layout={layout}>
        <div className={`relative overflow-hidden rounded-xl border border-[var(--desk-border)] bg-black ${blackout ? 'min-h-[70vh]' : layout === 1 ? 'h-full min-h-[320px]' : 'min-h-[180px]'}`}>
          <LightweightCandles
            symbol={symbol}
            profileId="standard_red_green"
            timeframe={timeframe}
            fillParent
            height={layout === 1 ? 480 : 220}
            hidePatternOverlays
            hideChartToolbar
            publishDrawingSession
            activeIndicators={indicators}
            takeSnapshotRef={takeSnapshotRef}
            showMineIndicator={showMineIndicator}
            mineIndicatorName={mineIndicatorName}
            priceSeriesType={chartType}
          />
        </div>
        {visibleExtras.map((slot) => (
          <div key={slot.id} className="relative min-h-[180px] overflow-hidden rounded-xl border border-[var(--desk-border)] bg-black">
            {slot.symbol ? (
              <LightweightCandles
                symbol={slot.symbol}
                profileId="standard_red_green"
                timeframe={slot.timeframe}
                fillParent
                height={220}
                hidePatternOverlays
                hideChartToolbar
                priceSeriesType={chartType}
              />
            ) : (
              <div className="flex h-full min-h-[180px] flex-col justify-center gap-2 p-3">
                <p className="rt-empty">Select an asset — not auto-filled</p>
                <ChartSymbolSearch
                  compact
                  placeholder="Compare asset…"
                  onSubmit={(raw) => {
                    const next = resolveMarketAsset(raw).value;
                    setExtras((prev) => prev.map((s) => (s.id === slot.id ? { ...s, symbol: next } : s)));
                  }}
                />
              </div>
            )}
          </div>
        ))}
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-1" role="group" aria-label="Timeframe">
        {TIMEFRAMES.map((tf) => (
          <button
            key={tf}
            type="button"
            onClick={() => setTimeframe(tf)}
            aria-pressed={timeframe === tf}
            className={`rt-tool ${timeframe === tf ? 'is-on' : ''}`}
            style={timeframe === tf ? undefined : { color: '#00FFFF', borderColor: '#00FFFF66' }}
          >
            {tf}
          </button>
        ))}
        {!blackout ? (
          <>
            <button type="button" className={`rt-tool ${chartType === 'candlestick' ? 'is-on' : ''}`} onClick={() => setChartType('candlestick')}>
              Candles
            </button>
            <button type="button" className={`rt-tool ${chartType === 'line' ? 'is-on' : ''}`} onClick={() => setChartType('line')}>
              Line
            </button>
            <button
              type="button"
              onClick={() => setShowIndicators((v) => !v)}
              className="rt-tool"
              style={{ color: '#818cf8', borderColor: '#818cf866' }}
            >
              Indicators ({indicators.length})
            </button>
            <button
              type="button"
              onClick={() => {
                setShowMineIndicator((v) => !v);
                setShowIndicators(false);
              }}
              className="rt-tool"
              style={{
                color: showMineIndicator ? '#050505' : '#fbbf24',
                borderColor: '#fbbf2466',
                background: showMineIndicator ? '#fbbf24' : 'transparent',
              }}
            >
              Mine: {showMineIndicator ? 'on' : 'off'}
            </button>
            <button type="button" className="rt-tool" onClick={captureChart}>
              Snapshot
            </button>
            <button type="button" className="rt-tool" onClick={() => setShowDraw((v) => !v)}>
              Draw
            </button>
            <button type="button" className={`rt-tool ${layout === 1 ? 'is-on' : ''}`} onClick={() => setLayout(1)}>1 chart</button>
            <button type="button" className={`rt-tool ${layout === 2 ? 'is-on' : ''}`} onClick={() => setLayout(2)}>2 charts</button>
            <button type="button" className={`rt-tool ${layout === 4 ? 'is-on' : ''}`} onClick={() => setLayout(4)}>4 charts</button>
          </>
        ) : null}
        {indicators.length ? (
          <span className="font-mono text-[10px] uppercase text-[var(--desk-muted)]">{indicators.join(' · ')}</span>
        ) : null}
        {showMineIndicator ? (
          <span className="font-mono text-[10px] uppercase text-amber-200/80">{mineIndicatorName}</span>
        ) : null}
      </div>
      {snapshotNote ? <p className="mt-1 text-[10px] uppercase text-amber-200/80">{snapshotNote}</p> : null}
      {showIndicators && !blackout ? (
        <div className="mt-2">
          <ChartIndicatorPicker
            compact
            activeIndicators={indicators}
            onToggle={(abbr) =>
              setIndicators((prev) => (prev.includes(abbr) ? prev.filter((x) => x !== abbr) : [...prev, abbr]))
            }
            onClear={() => setIndicators([])}
          />
        </div>
      ) : null}
      {showDraw && !blackout ? (
        <div className="mt-2">
          <ChartDrawingToolsPanel compact />
        </div>
      ) : null}
    </div>
  );

  if (blackout) {
    return (
      <ChartDrawingSessionProvider>
        <div className="rt-desk flex min-h-0 flex-1 flex-col bg-black p-3" data-retail-door="" data-retail-blackout="">
          <div className="mb-2 flex items-center justify-between">
            <p className="font-mono text-[10px] uppercase tracking-widest text-zinc-500">Blackout · analysis only</p>
            <button type="button" onClick={() => setBlackout(false)} className="rt-tool">
              Exit blackout
            </button>
          </div>
          {chartBlock}
        </div>
      </ChartDrawingSessionProvider>
    );
  }

  return (
    <ChartDrawingSessionProvider>
      <div className="rt-desk mx-auto flex w-full max-w-[1680px] flex-1 flex-col gap-2 p-2 md:p-3" data-retail-door="" data-retail-workspace="" data-retail-cockpit="" data-held-count={heldPanels.held.length}>
        <div className="flex flex-wrap items-end justify-between gap-2 px-1">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[var(--desk-muted)]">ClearPath Trader</p>
            <h2 className="text-lg font-black uppercase tracking-tight text-[var(--desk-text)]">Retail Market</h2>
            <p className="text-[11px] uppercase tracking-wider text-[#00FFFF]">See the market clearly</p>
          </div>
          <p className="max-w-xl text-[10px] uppercase leading-relaxed text-[var(--desk-muted)]">
            Information &amp; analytics only — no trade execution — no personalized investment advice
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-[var(--desk-border)] bg-[var(--desk-panel)] px-2 py-2">
          <div className="min-w-[200px] flex-1">
            <ChartSymbolSearch compact placeholder="Search stocks, FX, indices, commodities, crypto…" activeSymbol={symbol} onSubmit={pick} />
          </div>
          <div className="rt-ribbon flex-1" aria-label="Market ribbon">
            {RIBBON.map((row) => {
              const q = quotes[row.symbol];
              const on = symbol === row.symbol;
              return (
                <button
                  key={row.symbol}
                  type="button"
                  onClick={() => pick(row.symbol)}
                  className="rt-chip"
                  style={{
                    borderColor: on ? '#00FFFF' : 'rgba(255,255,255,0.12)',
                    background: on ? 'rgba(0,255,255,0.1)' : 'transparent',
                  }}
                >
                  <span className="block text-[9px] font-black uppercase text-[var(--desk-muted)]">{row.label}</span>
                  <span className="font-mono text-[11px] text-[var(--desk-text)]">{q?.live ? fmt(q.price, 2) : '—'}</span>
                  <span className={`ml-1 font-mono text-[10px] ${pctTone(q?.pct ?? null)}`}>
                    {q?.pct == null ? '' : `${q.pct >= 0 ? '+' : ''}${q.pct.toFixed(2)}%`}
                  </span>
                </button>
              );
            })}
            <span className="rt-empty self-center px-2">VIX DATA UNAVAILABLE — not on this quote roster</span>
          </div>
        </div>

        <div className={quiet ? 'grid grid-cols-1' : 'rt-stage'} data-sides={quiet ? undefined : stageSides}>
          {showWatch ? (
            <div className="rt-watch min-h-0">
              <Bento title="My Watchlist" {...panel('watchlist')}>
                <div className="mb-2 flex flex-wrap gap-1">
                  {LIST_NAMES.map((name) => (
                    <button
                      key={name}
                      type="button"
                      onClick={() => switchList(name)}
                      className="rt-tool"
                      style={listName === name ? { background: '#00ffff', color: '#050505', borderColor: '#00ffff' } : undefined}
                    >
                      {name.replace('MY WATCHLIST', 'MY')}
                    </button>
                  ))}
                </div>
                <ul className="space-y-0.5">
                  {watch.map((s, i) => {
                    const q = quotes[s];
                    const label = getRegistryAsset(s)?.display ?? s;
                    return (
                      <li key={s} className="flex items-center gap-1">
                        <button type="button" className="min-w-0 flex-1 text-left" onClick={() => pick(s)}>
                          <span className="block truncate font-mono text-[11px] text-[var(--desk-text)]">{label}</span>
                          <span className="font-mono text-[10px] text-[var(--desk-muted)]">
                            {q?.live ? fmt(q.price) : 'DATA UNAVAILABLE'}{' '}
                            <span className={pctTone(q?.pct ?? null)}>
                              {q?.pct == null ? '' : `${q.pct >= 0 ? '+' : ''}${q.pct.toFixed(2)}%`}
                            </span>
                          </span>
                        </button>
                        <button type="button" aria-label={`Move ${s} up`} disabled={i === 0} onClick={() => {
                          const next = [...watch];
                          [next[i - 1], next[i]] = [next[i], next[i - 1]];
                          watchSet(next);
                        }} className="px-1 text-[10px] text-zinc-500 disabled:opacity-30">↑</button>
                        <button type="button" aria-label={`Move ${s} down`} disabled={i === watch.length - 1} onClick={() => {
                          const next = [...watch];
                          [next[i + 1], next[i]] = [next[i], next[i + 1]];
                          watchSet(next);
                        }} className="px-1 text-[10px] text-zinc-500 disabled:opacity-30">↓</button>
                        <button type="button" aria-label={`Remove ${s}`} onClick={() => watchSet(watch.filter((x) => x !== s))} className="px-1 text-[10px] text-zinc-500">×</button>
                      </li>
                    );
                  })}
                </ul>
                <div className="relative mt-2">
                  <input
                    value={addQuery}
                    onChange={(e) => setAddQuery(e.target.value)}
                    placeholder="Add asset"
                    aria-label="Add watchlist asset"
                    className="w-full rounded-md border border-white/15 bg-black/50 px-2 py-1 text-[11px] text-white"
                  />
                  {searchHits.length > 0 ? (
                    <ul className="absolute z-20 mt-1 w-full rounded-md border border-white/15 bg-black p-1">
                      {searchHits.map((a) => (
                        <li key={a.symbol}>
                          <button
                            type="button"
                            className="w-full rounded px-2 py-1 text-left text-[11px] text-white hover:bg-white/10"
                            onClick={() => {
                              if (!watch.includes(a.symbol)) watchSet([...watch, a.symbol].slice(0, 12));
                              setAddQuery('');
                              pick(a.symbol);
                            }}
                          >
                            {a.display} · {a.symbol} · {a.category}
                            {a.exchange ? ` · ${a.exchange}` : ''}
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              </Bento>
            </div>
          ) : null}

          <div className="rt-chart min-h-0">{chartBlock}</div>

          {showSnap ? (
            <div className="rt-snap min-h-0">
              <Bento title="Market Snapshot" status={snap?.live ? (snap.delayed ? 'DELAYED' : 'LIVE') : 'UNAVAILABLE'} {...panel('snapshot')}>
                <KV k="Price" v={snap?.live ? fmt(snap.price) : 'DATA UNAVAILABLE'} />
                <KV
                  k="Change"
                  v={
                    snap?.live && snap.pct != null
                      ? `${snap.change != null ? `${snap.change >= 0 ? '+' : ''}${fmt(snap.change)} ` : ''}(${snap.pct >= 0 ? '+' : ''}${snap.pct.toFixed(2)}%)`
                      : 'DATA UNAVAILABLE'
                  }
                />
                <KV k="Open" v={fmt(snap?.open ?? null)} />
                <KV k="High" v={fmt(snap?.high ?? null)} />
                <KV k="Low" v={fmt(snap?.low ?? null)} />
                <KV k="Previous close" v={fmt(snap?.prev ?? null)} />
                <KV k="Volume" v={snap?.volume != null ? fmt(snap.volume, 0) : vol.last != null ? fmt(vol.last, 0) : 'DATA UNAVAILABLE'} />
                <KV k="VWAP" v={vwap != null ? fmt(vwap, 4) : 'DATA UNAVAILABLE'} />
                <KV k="Day range" v={snap?.high != null && snap?.low != null ? `${fmt(snap.low)} – ${fmt(snap.high)}` : 'DATA UNAVAILABLE'} />
                {vwap == null ? (
                  <p className="mt-1 text-[9px] uppercase text-[var(--desk-muted)]">VWAP uses bar volume on this candle window when the vendor supplies it.</p>
                ) : null}
              </Bento>
            </div>
          ) : null}
        </div>

        {!quiet ? (
          <>
            <div className="rt-bento-row">
              {heldPanels.isHeld('context') ? null : (
              <Bento title="Market Context" {...panel('context')}>
                <div className="rt-bento-body">
                  <KV k="Trend" v={last && ema20 != null ? (last.close >= ema20 ? 'Price above 20 EMA' : 'Price below 20 EMA') : 'DATA UNAVAILABLE'} />
                  <KV k="Session" v={isFx ? openSessions(utcHour) : 'FX session windows only'} />
                  <KV k="Volatility (ATR)" v={atr != null ? fmt(atr, 4) : 'DATA UNAVAILABLE'} />
                  <KV k="Range" v={last ? fmt(last.high - last.low, 4) : 'DATA UNAVAILABLE'} />
                  <KV k="Quote high" v={fmt(snap?.high ?? sessionHigh)} />
                  <KV k="Quote low" v={fmt(snap?.low ?? sessionLow)} />
                  <KV k="Loaded-window high" v={fmt(sessionHigh)} />
                  <KV k="Loaded-window low" v={fmt(sessionLow)} />
                  <p className="mt-1 text-[10px] leading-relaxed text-[var(--desk-muted)]">
                    High/low of the loaded candle window are descriptive levels, not trade advice.
                  </p>
                </div>
              </Bento>
              )}
              {heldPanels.isHeld('volume') ? null : (
              <Bento title="Volume / Price" {...panel('volume')}>
                <div className="rt-bento-body">
                  <KV k="Quote volume" v={snap?.volume != null ? fmt(snap.volume, 0) : 'DATA UNAVAILABLE'} />
                  <KV k="Last bar volume" v={vol.last != null ? fmt(vol.last, 0) : 'DATA UNAVAILABLE'} />
                  <KV k="Average bar volume" v={vol.avg != null ? fmt(vol.avg, 0) : 'DATA UNAVAILABLE'} />
                  <KV k="Relative volume" v={vol.relative != null ? `${vol.relative.toFixed(2)}×` : 'DATA UNAVAILABLE'} />
                  <KV k="VWAP" v={vwap != null ? fmt(vwap, 4) : 'DATA UNAVAILABLE'} />
                  <KV k="Percentage range" v={rangePct != null ? `${rangePct.toFixed(2)}%` : 'DATA UNAVAILABLE'} />
                  <p className="mt-1 text-[10px] leading-relaxed text-[var(--desk-muted)]">
                    Relative volume is last bar vs prior bars in this window. Volume profile / CVD DATA UNAVAILABLE on this feed.
                  </p>
                </div>
              </Bento>
              )}
              {heldPanels.isHeld('movers') ? null : (
              <Bento title="Market Movers" status="loaded quotes only" {...panel('movers')}>
                <div className="mb-2 flex flex-wrap gap-1">
                  {(['gainers', 'decliners', 'active'] as const).map((tab) => (
                    <button key={tab} type="button" className={`rt-tool ${moverTab === tab ? 'is-on' : ''}`} onClick={() => setMoverTab(tab)}>
                      {tab === 'gainers' ? 'Gainers' : tab === 'decliners' ? 'Decliners' : 'Most active'}
                    </button>
                  ))}
                </div>
                <div className="rt-bento-body">
                  {moverTab === 'active' ? (
                    <Unavail label="Most-active / unusual-volume scan DATA UNAVAILABLE — no full-market volume rank on this feed" />
                  ) : movers.length === 0 ? (
                    <Unavail label="No live quotes in the loaded set" />
                  ) : (
                    <ul>
                      {movers.map((q) => (
                        <li key={q.symbol}>
                          <button type="button" className="flex w-full justify-between py-0.5 text-left" onClick={() => pick(q.symbol)}>
                            <span className="font-mono text-[11px]">{q.symbol}</span>
                            <span className={`font-mono text-[11px] ${pctTone(q.pct)}`}>
                              {q.pct == null ? '—' : `${q.pct >= 0 ? '+' : ''}${q.pct.toFixed(2)}%`}
                            </span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                  <p className="mt-2 text-[9px] uppercase text-[var(--desk-muted)]">
                    Ranked from ribbon + watchlist quotes currently loaded (max 12). Not a whole-market tape.
                  </p>
                </div>
              </Bento>
              )}
            </div>

            <div className="rt-bento-row">
              {heldPanels.isHeld('news') ? null : (
              <Bento title="News" {...panel('news')}>
                <div className="rt-bento-body">
                  {newsErr ? <p className="text-[10px] text-rose-400">{newsErr}</p> : null}
                  {news.length === 0 && !newsErr ? <Unavail /> : null}
                  <ul>
                    {news.map((item, i) => (
                      <li key={`${item.title}-${i}`} className="border-b border-[var(--desk-border)] py-1.5">
                        <p className="font-mono text-[10px] uppercase text-[var(--desk-muted)]">
                          {item.time} · {item.source}
                        </p>
                        {item.link ? (
                          <a href={item.link} target="_blank" rel="noopener noreferrer" className="text-[12px] text-[var(--desk-text)] hover:text-[#00FFFF]">
                            {item.title}
                          </a>
                        ) : (
                          <p className="text-[12px] text-[var(--desk-text)]">{item.title}</p>
                        )}
                      </li>
                    ))}
                  </ul>
                  <a href="/#News" className="mt-2 inline-block text-[10px] font-black uppercase tracking-wider text-[#00FFFF]">
                    View all news
                  </a>
                </div>
              </Bento>
              )}
              {heldPanels.isHeld('calendar') ? null : (
              <Bento title="Economic Calendar" status="wire — not a timed calendar" {...panel('calendar')}>
                <div className="rt-bento-body">
                  <p className="mb-1 text-[9px] uppercase text-[var(--desk-muted)]">
                    Timed country/importance rows DATA UNAVAILABLE. Economic wire headlines only.
                  </p>
                  {econErr && econ.length === 0 ? <Unavail label={econErr} /> : null}
                  <ul>
                    {econ.slice(0, 5).map((item, i) => (
                      <li key={`${item.title}-${i}`} className="border-b border-[var(--desk-border)] py-1.5">
                        <p className="font-mono text-[10px] uppercase text-[var(--desk-muted)]">
                          Time {item.pubDate ? new Date(item.pubDate).toISOString().slice(11, 16) : 'DATA UNAVAILABLE'} · Country DATA UNAVAILABLE · Importance DATA UNAVAILABLE
                        </p>
                        <p className="text-[12px] text-[var(--desk-text)]">{item.title}</p>
                      </li>
                    ))}
                  </ul>
                </div>
              </Bento>
              )}
              {heldPanels.isHeld('alerts') ? null : (
              <Bento title="Alerts / Events" {...panel('alerts')}>
                <div className="rt-bento-body">
                  <p className="mb-2 text-[9px] uppercase text-[var(--desk-muted)]">
                    You set the threshold. This is a reminder, not a recommendation.
                  </p>
                  <div className="mb-2 flex flex-wrap gap-1">
                    <select
                      value={alertKind}
                      onChange={(e) => setAlertKind(e.target.value as RetailAlert['kind'])}
                      className="rounded border border-white/15 bg-black px-1 py-1 text-[10px] uppercase text-white"
                    >
                      <option value="above">Price above</option>
                      <option value="below">Price below</option>
                      <option value="pct">Abs % change</option>
                    </select>
                    <input
                      value={alertValue}
                      onChange={(e) => setAlertValue(e.target.value)}
                      placeholder="Value"
                      className="w-24 rounded border border-white/15 bg-black px-2 py-1 font-mono text-[11px] text-white"
                    />
                    <button
                      type="button"
                      className="rt-tool"
                      onClick={() => {
                        const value = Number(alertValue);
                        if (!Number.isFinite(value)) return;
                        setAlerts((prev) => [...prev, { id: `${Date.now()}`, symbol, kind: alertKind, value }]);
                        setAlertValue('');
                      }}
                    >
                      Add
                    </button>
                  </div>
                  {firedAlerts.length ? (
                    <p className="mb-1 text-[10px] uppercase text-amber-200">Threshold reached on {firedAlerts.map((a) => a.symbol).join(', ')}</p>
                  ) : null}
                  {alerts.length === 0 ? <Unavail label="No alerts set" /> : (
                    <ul>
                      {alerts.map((a) => (
                        <li key={a.id} className="flex justify-between gap-2 py-0.5 font-mono text-[10px]">
                          <span>
                            {a.symbol} {a.kind} {a.value}
                          </span>
                          <button type="button" className="text-zinc-500" onClick={() => setAlerts((prev) => prev.filter((x) => x.id !== a.id))}>
                            ×
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </Bento>
              )}
            </div>

            {heldPanels.isHeld('changed') ? null : (
            <Bento title="What changed?" collapsedSummary="Since last stored view" {...panel('changed')}>
              {lastView && lastView.symbol === symbol ? (
                <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                  <KV
                    k="Price"
                    v={
                      lastView.price != null && snap?.price != null
                        ? `${snap.price - lastView.price >= 0 ? '+' : ''}${fmt(snap.price - lastView.price, 4)}`
                        : 'DATA UNAVAILABLE'
                    }
                  />
                  <KV
                    k="Volume"
                    v={
                      lastView.volume != null && (snap?.volume ?? vol.last) != null
                        ? `${(((snap?.volume ?? vol.last)! - lastView.volume) / Math.max(lastView.volume, 1)) * 100 >= 0 ? '+' : ''}${((((snap?.volume ?? vol.last)! - lastView.volume) / Math.max(lastView.volume, 1)) * 100).toFixed(1)}%`
                        : 'DATA UNAVAILABLE'
                    }
                  />
                  <KV k="News items" v={String(news.length)} />
                  <KV k="Economic wire" v={econ.length ? `${econ.length} headlines` : 'DATA UNAVAILABLE'} />
                </div>
              ) : (
                <p className="rt-empty">First view this session — a comparison stores after a few seconds on this asset.</p>
              )}
            </Bento>
            )}

            <div className="rt-bento-row">
              {heldPanels.isHeld('education') ? null : (
              <Bento title="Education" onExpand={() => setEduOpen(true)} {...panel('education')}>
                <div className={eduOpen ? '' : 'max-h-[140px] overflow-auto'}>
                  <WhatAmILookingAt compact={!eduOpen} />
                </div>
                <button
                  type="button"
                  onClick={() => setEduOpen(true)}
                  className="mt-2 w-full rounded border border-[#00FFFF]/40 px-2 py-1.5 text-[10px] font-black uppercase tracking-wider text-[#00FFFF]"
                >
                  View education
                </button>
              </Bento>
              )}
              {heldPanels.isHeld('fundamental') ? null : (
              <Bento title="Fundamental Snapshot" status={fundStatus === 'live' ? 'LIVE' : 'UNAVAILABLE'} {...panel('fundamental')}>
                {fundStatus !== 'live' || !fund ? (
                  <Unavail label="Fundamental snapshot DATA UNAVAILABLE for this asset or vendor" />
                ) : (
                  <>
                    <KV k="Market cap" v={fund.marketCap != null ? fmt(Number(fund.marketCap), 0) : 'DATA UNAVAILABLE'} />
                    <KV k="P/E" v={fund.pe != null ? fmt(Number(fund.pe), 2) : 'DATA UNAVAILABLE'} />
                    <KV k="Revenue growth" v={fund.revenueGrowth != null ? fmt(Number(fund.revenueGrowth), 2) : 'DATA UNAVAILABLE'} />
                    <KV k="EPS" v={fund.eps != null ? fmt(Number(fund.eps), 2) : 'DATA UNAVAILABLE'} />
                    <KV k="FCF" v={fund.fcf != null ? fmt(Number(fund.fcf), 2) : 'DATA UNAVAILABLE'} />
                    <KV k="Debt" v={fund.debt != null ? fmt(Number(fund.debt), 2) : 'DATA UNAVAILABLE'} />
                  </>
                )}
                <button
                  type="button"
                  onClick={() => navigateToDesk('fundamental')}
                  className="mt-2 w-full rounded border border-[#FF7A00]/50 px-2 py-1.5 text-[10px] font-black uppercase tracking-wider text-[#FF7A00]"
                >
                  View fundamentals
                </button>
              </Bento>
              )}
              {heldPanels.isHeld('simulation') ? null : (
              <Bento title="Simulation Lab" {...panel('simulation')}>
                <p className="text-[11px] leading-relaxed text-[var(--desk-muted)]">
                  Simulated trading. No real money. No broker execution. Notes stay on this device.
                </p>
                <textarea
                  value={simDraft}
                  onChange={(e) => setSimDraft(e.target.value)}
                  placeholder="Hypothetical study note…"
                  className="mt-2 h-16 w-full rounded border border-white/15 bg-black/40 p-2 text-[11px] text-white"
                />
                <button
                  type="button"
                  className="rt-tool mt-2"
                  onClick={() => {
                    const note = simDraft.trim();
                    if (!note) return;
                    setSimNotes((prev) => [{ id: `${Date.now()}`, symbol, note, at: Date.now() }, ...prev].slice(0, 20));
                    setSimDraft('');
                  }}
                >
                  Save note
                </button>
                <ul className="mt-2 max-h-24 overflow-auto">
                  {simNotes.slice(0, 4).map((n) => (
                    <li key={n.id} className="border-b border-white/5 py-1 text-[10px] text-zinc-400">
                      <span className="font-mono text-[#00FFFF]">{n.symbol}</span> · {n.note}
                    </li>
                  ))}
                </ul>
              </Bento>
              )}
              {heldPanels.isHeld('workspace') ? null : (
              <Bento title="Workspace" {...panel('workspace')}>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setFocusMode((v) => !v)}
                    className="rounded-md border border-[#00FFFF]/40 px-3 py-1.5 text-[10px] font-black uppercase text-[#00FFFF]"
                  >
                    {focusMode ? 'Exit focus' : 'Focus mode'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setBlackout(true)}
                    className="rounded-md border border-white/20 px-3 py-1.5 text-[10px] font-black uppercase text-zinc-200"
                  >
                    Blackout
                  </button>
                </div>
                <p className="mt-3 text-[10px] uppercase leading-relaxed text-[var(--desk-muted)]">
                  ClearPathTrader · information &amp; analytics only · no trade execution · no personalized investment advice ·
                  market data may be delayed or subject to source availability
                </p>
              </Bento>
              )}
            </div>
          </>
        ) : (
          <div className="flex gap-2">
            <button type="button" onClick={() => setFocusMode(false)} className="rt-tool is-on">
              Exit focus
            </button>
            <button type="button" onClick={() => setBlackout(true)} className="rt-tool">
              Blackout
            </button>
          </div>
        )}

        {eduOpen ? (
          <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 p-4" role="dialog" aria-modal="true" aria-label="Education">
            <div className="max-h-[85vh] w-full max-w-3xl overflow-auto rounded-xl border border-[var(--desk-border)] bg-[#050505] p-4">
              <div className="mb-3 flex justify-between">
                <p className="text-[10px] font-black uppercase tracking-widest text-[#00FFFF]">Education</p>
                <button type="button" className="rt-tool" onClick={() => setEduOpen(false)}>Close</button>
              </div>
              <WhatAmILookingAt />
            </div>
          </div>
        ) : null}

        {!quiet ? (
          <RetailHeldFile
            held={heldPanels.held}
            open={heldPanels.fileOpen}
            justHeld={heldPanels.justHeld}
            onOpenChange={heldPanels.setFileOpen}
            onRestore={heldPanels.restore}
            onRestoreAll={heldPanels.restoreAll}
          />
        ) : null}
      </div>
    </ChartDrawingSessionProvider>
  );
}
