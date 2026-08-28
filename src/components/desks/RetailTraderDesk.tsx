import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ChartSymbolSearch } from '../charts/ChartSymbolSearch';
import { LightweightCandles } from '../charts/LightweightCandles';
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
import { navigateToDesk } from '../../lib/traderDesks';
import { Bento, KV, Unavail } from './institutional/Bento';
import WhatAmILookingAt from './WhatAmILookingAt';
import type { Candle } from '../../types/indicators';

const WATCHLIST_KEY = 'clearpath_retail_watchlist';
const TIMEFRAMES = ['1m', '5m', '15m', '30m', '1h', '4h', '1d', '1w', '1M'] as const;
const RIBBON = [
  { symbol: 'SPX', label: 'S&P 500' },
  { symbol: 'NDX', label: 'NASDAQ' },
  { symbol: 'DXY', label: 'DXY' },
  { symbol: 'XAUUSD', label: 'GOLD' },
  { symbol: 'WTI', label: 'OIL' },
  { symbol: 'BTCUSD', label: 'BTC' },
] as const;
const DEFAULT_WATCH = ['EURUSD', 'GBPUSD', 'USDJPY', 'SPX', 'NDX', 'XAUUSD', 'BTCUSD'];

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

function readWatch(): string[] {
  try {
    const raw = localStorage.getItem(WATCHLIST_KEY);
    if (!raw) return DEFAULT_WATCH;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return DEFAULT_WATCH;
    const next = parsed.map((s) => String(s).toUpperCase()).filter(Boolean).slice(0, 12);
    return next.length ? next : DEFAULT_WATCH;
  } catch {
    return DEFAULT_WATCH;
  }
}

function writeWatch(symbols: string[]) {
  try {
    localStorage.setItem(WATCHLIST_KEY, JSON.stringify(symbols));
  } catch {
    /* ignore */
  }
}

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

export default function RetailTraderDesk() {
  const [symbol, setSymbol] = useState('EURUSD');
  const [timeframe, setTimeframe] = useState('1h');
  const [indicators, setIndicators] = useState<string[]>([]);
  const [watch, setWatch] = useState<string[]>(readWatch);
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

  const pick = useCallback((raw: string) => {
    setSymbol(resolveMarketAsset(raw).value);
  }, []);

  const watchSet = useCallback((next: string[]) => {
    setWatch(next);
    writeWatch(next);
  }, []);

  const quoteSymbols = useMemo(() => {
    const set = new Set<string>([symbol, ...watch, ...RIBBON.map((r) => r.symbol)]);
    return [...set].slice(0, 12);
  }, [symbol, watch]);

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
          .slice(0, 3),
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
  const rangePct =
    last && last.low > 0 ? ((last.high - last.low) / last.close) * 100 : null;
  const searchHits = addQuery.trim().length >= 1 ? searchEnabledAssets(addQuery, 8) : [];

  const quiet = focusMode || blackout;

  const chartBlock = (
    <div className={blackout ? 'flex min-h-0 flex-1 flex-col' : 'min-h-0'}>
      <div className="mb-2 flex flex-wrap items-end justify-between gap-2">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--desk-muted)]">Asset</p>
          <h2 className="text-xl font-black uppercase tracking-tight text-white">{display}</h2>
        </div>
        <div className="text-right">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--desk-muted)]">Price</p>
          <p className="font-mono text-2xl font-black tabular-nums text-white">
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
            {quoteStatus === 'loading'
              ? 'LOADING MARKET DATA...'
              : snap?.delayed
                ? 'DELAYED'
                : snap?.live
                  ? 'LIVE'
                  : 'DATA UNAVAILABLE'}
          </p>
        </div>
      </div>
      <div className={`relative overflow-hidden rounded-xl border border-[var(--desk-border)] bg-black ${blackout ? 'min-h-0 flex-1' : 'h-[min(52vh,520px)] min-h-[320px]'}`}>
        <LightweightCandles
          symbol={symbol}
          profileId="standard_red_green"
          timeframe={timeframe}
          fillParent
          height={480}
          hidePatternOverlays
          hideChartToolbar
          publishDrawingSession
          activeIndicators={indicators}
        />
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-1" role="group" aria-label="Timeframe">
        {TIMEFRAMES.map((tf) => (
          <button
            key={tf}
            type="button"
            onClick={() => setTimeframe(tf)}
            aria-pressed={timeframe === tf}
            className="rounded-md border px-2 py-1 text-[10px] font-black uppercase"
            style={{
              color: timeframe === tf ? '#050505' : '#00FFFF',
              borderColor: '#00FFFF66',
              background: timeframe === tf ? '#00FFFF' : 'transparent',
            }}
          >
            {tf}
          </button>
        ))}
        {!blackout ? (
          <>
            <button
              type="button"
              onClick={() => setShowIndicators((v) => !v)}
              className="ml-2 rounded-md border border-[#818cf8]/40 px-2 py-1 text-[10px] font-black uppercase text-[#818cf8]"
            >
              Indicators
            </button>
            <button
              type="button"
              onClick={() => setShowDraw((v) => !v)}
              className="rounded-md border border-white/20 px-2 py-1 text-[10px] font-black uppercase text-zinc-300"
            >
              Draw
            </button>
          </>
        ) : null}
        {indicators.length ? (
          <span className="font-mono text-[10px] uppercase text-[var(--desk-muted)]">
            {indicators.join(' · ')}
          </span>
        ) : null}
      </div>
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
        <div className="flex min-h-0 flex-1 flex-col bg-black p-3" data-retail-door="" data-retail-blackout="">
          <div className="mb-2 flex items-center justify-between">
            <p className="font-mono text-[10px] uppercase tracking-widest text-zinc-500">Blackout · analysis only</p>
            <button
              type="button"
              onClick={() => setBlackout(false)}
              className="rounded-md border border-white/20 px-3 py-1 text-[10px] font-black uppercase text-white"
            >
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
      <div className="mx-auto flex w-full max-w-[1600px] flex-1 flex-col gap-2 p-2 md:p-3" data-retail-door="" data-retail-workspace="">
        <div className="flex flex-wrap items-end justify-between gap-2 px-1">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[var(--desk-muted)]">ClearPath Trader</p>
            <h2 className="text-lg font-black uppercase tracking-tight text-white">Retail Market</h2>
            <p className="text-[11px] uppercase tracking-wider text-[#00FFFF]">See the market clearly</p>
          </div>
          <p className="max-w-xl text-[10px] uppercase leading-relaxed text-[var(--desk-muted)]">
            Information &amp; analytics only — no trade execution — no personalized investment advice
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-[var(--desk-border)] bg-[var(--desk-panel)] px-2 py-2">
          <div className="min-w-[200px] flex-1">
            <ChartSymbolSearch
              compact
              placeholder="Search asset…"
              activeSymbol={symbol}
              onSubmit={pick}
            />
          </div>
          <div className="flex min-w-0 flex-1 gap-1 overflow-x-auto" aria-label="Market ribbon">
            {RIBBON.map((row) => {
              const q = quotes[row.symbol];
              const on = symbol === row.symbol;
              return (
                <button
                  key={row.symbol}
                  type="button"
                  onClick={() => pick(row.symbol)}
                  className="shrink-0 rounded-md border px-2 py-1 text-left"
                  style={{
                    borderColor: on ? '#00FFFF' : 'rgba(255,255,255,0.12)',
                    background: on ? 'rgba(0,255,255,0.1)' : 'transparent',
                  }}
                >
                  <span className="block text-[9px] font-black uppercase text-[var(--desk-muted)]">{row.label}</span>
                  <span className="font-mono text-[11px] text-white">{q?.live ? fmt(q.price, 2) : '—'}</span>
                  <span className={`ml-1 font-mono text-[10px] ${pctTone(q?.pct ?? null)}`}>
                    {q?.pct == null ? '' : `${q.pct >= 0 ? '+' : ''}${q.pct.toFixed(2)}%`}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className={`grid gap-2 ${quiet ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-[220px_minmax(0,1fr)_220px]'}`}>
          {!quiet ? (
            <Bento title="My Watchlist">
              <ul className="space-y-0.5">
                {watch.map((s, i) => {
                  const q = quotes[s];
                  const label = getRegistryAsset(s)?.display ?? s;
                  return (
                    <li key={s} className="flex items-center gap-1">
                      <button type="button" className="min-w-0 flex-1 text-left" onClick={() => pick(s)}>
                        <span className="block truncate font-mono text-[11px] text-white">{label}</span>
                        <span className="font-mono text-[10px] text-[var(--desk-muted)]">
                          {q?.live ? fmt(q.price) : 'DATA UNAVAILABLE'}{' '}
                          <span className={pctTone(q?.pct ?? null)}>
                            {q?.pct == null ? '' : `${q.pct >= 0 ? '+' : ''}${q.pct.toFixed(2)}%`}
                          </span>
                        </span>
                      </button>
                      <button
                        type="button"
                        aria-label={`Move ${s} up`}
                        disabled={i === 0}
                        onClick={() => {
                          const next = [...watch];
                          [next[i - 1], next[i]] = [next[i], next[i - 1]];
                          watchSet(next);
                        }}
                        className="px-1 text-[10px] text-zinc-500 disabled:opacity-30"
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        aria-label={`Move ${s} down`}
                        disabled={i === watch.length - 1}
                        onClick={() => {
                          const next = [...watch];
                          [next[i + 1], next[i]] = [next[i], next[i + 1]];
                          watchSet(next);
                        }}
                        className="px-1 text-[10px] text-zinc-500 disabled:opacity-30"
                      >
                        ↓
                      </button>
                      <button
                        type="button"
                        aria-label={`Remove ${s}`}
                        onClick={() => watchSet(watch.filter((x) => x !== s))}
                        className="px-1 text-[10px] text-zinc-500"
                      >
                        ×
                      </button>
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
          ) : null}

          {chartBlock}

          {!quiet ? (
            <Bento title="Market Snapshot" status={snap?.live ? (snap.delayed ? 'DELAYED' : 'LIVE') : 'UNAVAILABLE'}>
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
              <KV k="Volume" v={snap?.volume != null ? fmt(snap.volume, 0) : 'DATA UNAVAILABLE'} />
              <KV k="VWAP" v="DATA UNAVAILABLE" />
            </Bento>
          ) : null}
        </div>

        {!quiet ? (
          <>
            <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
              <Bento title="Market Context">
                <KV
                  k="Trend"
                  v={last && ema20 != null ? (last.close >= ema20 ? 'Price above 20 EMA' : 'Price below 20 EMA') : 'DATA UNAVAILABLE'}
                />
                <KV k="Volume" v={snap?.volume != null ? fmt(snap.volume, 0) : 'DATA UNAVAILABLE'} />
                <KV k="Volatility (ATR)" v={atr != null ? fmt(atr, 4) : 'DATA UNAVAILABLE'} />
                <KV k="Session high" v={fmt(sessionHigh)} />
                <KV k="Session low" v={fmt(sessionLow)} />
                <KV k="Support" v={fmt(sessionLow)} />
                <KV k="Resistance" v={fmt(sessionHigh)} />
                <p className="mt-1 text-[10px] leading-relaxed text-[var(--desk-muted)]">
                  Support and resistance here are the high and low of the loaded candle window — descriptive levels, not trade advice.
                </p>
              </Bento>
              <Bento title="Price / Volume">
                <KV k="Volume" v={snap?.volume != null ? fmt(snap.volume, 0) : 'DATA UNAVAILABLE'} />
                <KV k="Average volume" v="DATA UNAVAILABLE" />
                <KV k="Relative volume" v="DATA UNAVAILABLE" />
                <p className="mt-1 text-[10px] leading-relaxed text-[var(--desk-muted)]">
                  Historical bar volume is not in this candle feed. Quote volume is shown when the vendor provides it.
                </p>
                <KV k="Range" v={last ? fmt(last.high - last.low, 4) : 'DATA UNAVAILABLE'} />
                <KV k="Percentage range" v={rangePct != null ? `${rangePct.toFixed(2)}%` : 'DATA UNAVAILABLE'} />
                <KV k="VWAP" v="DATA UNAVAILABLE" />
              </Bento>
            </div>

            <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
              <Bento title="News">
                {newsErr ? <p className="text-[10px] text-rose-400">{newsErr}</p> : null}
                {news.length === 0 && !newsErr ? <Unavail /> : null}
                <ul>
                  {news.map((item, i) => (
                    <li key={`${item.title}-${i}`} className="border-b border-[var(--desk-border)] py-1.5">
                      <p className="font-mono text-[10px] uppercase text-[var(--desk-muted)]">
                        {item.time} · {item.source}
                      </p>
                      {item.link ? (
                        <a href={item.link} target="_blank" rel="noopener noreferrer" className="text-[12px] text-white hover:text-[#00FFFF]">
                          {item.title}
                        </a>
                      ) : (
                        <p className="text-[12px] text-white">{item.title}</p>
                      )}
                    </li>
                  ))}
                </ul>
                <a href="/#News" className="mt-2 inline-block text-[10px] font-black uppercase tracking-wider text-[#00FFFF]">
                  View all
                </a>
              </Bento>
              <Bento title="Economic Calendar" status="wire — not a timed calendar">
                <p className="mb-1 text-[9px] uppercase text-[var(--desk-muted)]">
                  Timed country/importance rows DATA UNAVAILABLE. Economic wire headlines only — not a scheduled event calendar.
                </p>
                {econErr && econ.length === 0 ? <Unavail label={econErr} /> : null}
                <ul>
                  {econ.slice(0, 5).map((item, i) => (
                    <li key={`${item.title}-${i}`} className="border-b border-[var(--desk-border)] py-1.5">
                      <p className="font-mono text-[10px] uppercase text-[var(--desk-muted)]">
                        Time {item.pubDate ? new Date(item.pubDate).toISOString().slice(11, 16) : 'DATA UNAVAILABLE'} · Country DATA UNAVAILABLE · Importance DATA UNAVAILABLE
                      </p>
                      <p className="text-[12px] text-white">{item.title}</p>
                    </li>
                  ))}
                </ul>
              </Bento>
            </div>

            <div className="grid grid-cols-1 gap-2 lg:grid-cols-2">
              <Bento
                title="Education"
                onExpand={() => setEduOpen((v) => !v)}
              >
                <div className={eduOpen ? '' : 'max-h-[280px] overflow-auto'}>
                  <WhatAmILookingAt compact={!eduOpen} />
                </div>
                <button
                  type="button"
                  onClick={() => setEduOpen(true)}
                  className="mt-2 w-full rounded border border-[#00FFFF]/40 px-2 py-1.5 text-[10px] font-black uppercase tracking-wider text-[#00FFFF]"
                >
                  Open education
                </button>
              </Bento>
              <Bento title="Fundamental Snapshot" status={fundStatus === 'live' ? 'LIVE' : 'UNAVAILABLE'}>
                {fundStatus !== 'live' || !fund ? (
                  <Unavail label="Fundamental snapshot DATA UNAVAILABLE for this asset or vendor" />
                ) : (
                  <>
                    <KV k="Market cap" v={fund.marketCap != null ? fmt(Number(fund.marketCap), 0) : 'DATA UNAVAILABLE'} />
                    <KV k="P/E" v={fund.pe != null ? fmt(Number(fund.pe), 2) : 'DATA UNAVAILABLE'} />
                    <KV
                      k="Revenue growth"
                      v={fund.revenueGrowth != null ? fmt(Number(fund.revenueGrowth), 2) : 'DATA UNAVAILABLE'}
                    />
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
                  View full fundamental analysis
                </button>
              </Bento>
            </div>

            <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
              <Bento title="Simulation Lab">
                <p className="text-[11px] leading-relaxed text-[var(--desk-muted)]">
                  Hypothetical study space. Simulated trading. No real money. No broker execution.
                </p>
                <p className="mt-2 text-[10px] uppercase text-amber-200/80">Simulation desk DATA UNAVAILABLE — no paper blotter wired</p>
              </Bento>
              <Bento title="Workspace">
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
              </Bento>
              <Bento title="Information">
                <p className="text-[10px] uppercase leading-relaxed text-[var(--desk-muted)]">
                  ClearPathTrader · information &amp; analytics only · no trade execution · no personalized investment advice ·
                  market data may be delayed or subject to source availability
                </p>
              </Bento>
            </div>
          </>
        ) : (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setFocusMode(false)}
              className="rounded-md border border-[#00FFFF]/40 px-3 py-1.5 text-[10px] font-black uppercase text-[#00FFFF]"
            >
              Exit focus
            </button>
            <button
              type="button"
              onClick={() => setBlackout(true)}
              className="rounded-md border border-white/20 px-3 py-1.5 text-[10px] font-black uppercase text-zinc-200"
            >
              Blackout
            </button>
          </div>
        )}
      </div>
    </ChartDrawingSessionProvider>
  );
}
