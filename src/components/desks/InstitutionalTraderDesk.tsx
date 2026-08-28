import React, { useEffect, useMemo, useState } from 'react';
import { ChartSymbolSearch } from '../charts/ChartSymbolSearch';
import { LightweightCandles } from '../charts/LightweightCandles';
import { resolveMarketAsset } from '../../constants/marketAssets';
import {
  analyzeInstitutionalStructure,
  closeLocationFlow,
  formatStructurePrice,
} from '../../lib/institutional/analyzeStructure';
import { fetchTieredHistoricalData } from '../../services/marketData';
import {
  ASSET_REGISTRY,
  LATENCY_LABEL,
  type AssetCategory,
} from '../../constants/assetRegistry';
import { resolveQuotePrice } from '../MarketTicker';
import { usePageAutoUpdate } from '../../hooks/usePageAutoUpdate';
import { fetchEconomicNews } from '../../services/economicService';
import { calculateATR } from '../../indicators/volatility/ATR';
import { calculateHV } from '../../indicators/volatility/HistoricalVolatility';
import type { Candle } from '../../types/indicators';
import { DESK_DISCLAIMER } from '../../content/traderDesksCopy';

const TIMEFRAMES = ['5m', '15m', '1h', '4h', '1d'] as const;
const RIBBON = ['SPX', 'NDX', 'DJI', 'DXY', 'XAUUSD', 'BTCUSD', 'WTI', 'EURUSD'] as const;

const UNIVERSE: { id: AssetCategory; label: string }[] = [
  { id: 'stocks', label: 'Equities' },
  { id: 'indices', label: 'Indices' },
  { id: 'forex', label: 'FX' },
  { id: 'bonds', label: 'Fixed income' },
  { id: 'commodities', label: 'Commodities' },
  { id: 'metals', label: 'Metals' },
  { id: 'crypto', label: 'Crypto' },
];

type QuoteRow = {
  symbol: string;
  name: string;
  price: number | null;
  pct: number | null;
  live: boolean;
};

type NewsRow = { title: string; source: string; link?: string; pubDate?: string };
type YieldPoint = { maturity: string; label: string; value: number };

function lastClose(candles: Candle[]): number | null {
  const last = candles[candles.length - 1];
  return last && Number.isFinite(last.close) ? last.close : null;
}

function Widget({
  title,
  children,
  className = '',
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`flex min-h-0 flex-col overflow-hidden border border-white/15 bg-black ${className}`}
    >
      <h2 className="shrink-0 border-b border-white/10 px-2 py-1.5 text-sm font-extrabold uppercase tracking-widest text-zinc-300">
        {title}
      </h2>
      <div className="min-h-0 flex-1 overflow-auto p-2">{children}</div>
    </section>
  );
}

function Unavailable({ children }: { children: React.ReactNode }) {
  return <p className="text-sm font-bold leading-relaxed text-zinc-500">{children}</p>;
}

function pctClass(pct: number | null): string {
  if (pct === null) return 'text-zinc-500';
  return pct >= 0 ? 'text-emerald-400' : 'text-rose-400';
}

export default function InstitutionalTraderDesk() {
  const [symbol, setSymbol] = useState('SPX');
  const [timeframe, setTimeframe] = useState('1h');
  const [universe, setUniverse] = useState<AssetCategory>('indices');
  const [candles, setCandles] = useState<Candle[]>([]);
  const [candleError, setCandleError] = useState<string | null>(null);
  const [quotes, setQuotes] = useState<Record<string, QuoteRow>>({});
  const [news, setNews] = useState<NewsRow[]>([]);
  const [econ, setEcon] = useState<NewsRow[]>([]);
  const [yields, setYields] = useState<YieldPoint[] | null>(null);
  const [yieldError, setYieldError] = useState<string | null>(null);

  const universeNames = useMemo(
    () => ASSET_REGISTRY.filter((a) => a.enabled && a.category === universe).slice(0, 16),
    [universe],
  );
  const watchSymbols = useMemo(
    () => universeNames.slice(0, 8).map((a) => a.symbol),
    [universeNames],
  );
  const quoteSymbols = useMemo(() => {
    const set = new Set<string>([...RIBBON, ...watchSymbols, symbol]);
    return [...set].slice(0, 12);
  }, [watchSymbols, symbol]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const hist = await fetchTieredHistoricalData(symbol, timeframe, 'VIP');
        if (cancelled) return;
        setCandles(
          hist.map((c) => ({
            time: c.time,
            open: c.open,
            high: c.high,
            low: c.low,
            close: c.close,
          })),
        );
        setCandleError(null);
      } catch (e) {
        if (cancelled) return;
        setCandles([]);
        setCandleError(e instanceof Error ? e.message : 'Candle history unavailable');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [symbol, timeframe]);

  usePageAutoUpdate(
    async () => {
      try {
        const hist = await fetchTieredHistoricalData(symbol, timeframe, 'VIP');
        setCandles(
          hist.map((c) => ({
            time: c.time,
            open: c.open,
            high: c.high,
            low: c.low,
            close: c.close,
          })),
        );
        setCandleError(null);
      } catch (e) {
        setCandles([]);
        setCandleError(e instanceof Error ? e.message : 'Candle history unavailable');
      }
    },
    { intervalMs: 60_000, immediate: false },
  );

  usePageAutoUpdate(
    async () => {
      try {
        const res = await fetch(`/api/quotes?symbols=${encodeURIComponent(quoteSymbols.join(','))}`);
        if (res.status === 429 || !res.ok) {
          setQuotes((prev) => {
            const next = { ...prev };
            for (const s of quoteSymbols) {
              if (next[s]) next[s] = { ...next[s], live: false };
            }
            return next;
          });
          return;
        }
        const body = await res.json();
        const map = (body?.quotes || {}) as Record<
          string,
          { close?: string; price?: string; percent_change?: string }
        >;
        const next: Record<string, QuoteRow> = {};
        for (const s of quoteSymbols) {
          const price = resolveQuotePrice(map[s]);
          const pctRaw = parseFloat(String(map[s]?.percent_change ?? ''));
          next[s] = {
            symbol: s,
            name: s,
            price,
            pct: Number.isFinite(pctRaw) ? pctRaw : null,
            live: price !== null,
          };
        }
        setQuotes(next);
      } catch {
        /* keep last quotes, mark offline next cycle */
      }
    },
    { intervalMs: 20_000 },
  );

  usePageAutoUpdate(
    async () => {
      try {
        const res = await fetch('/api/newsdata/latest');
        if (!res.ok) {
          setNews([]);
          return;
        }
        const data = await res.json();
        if (!Array.isArray(data)) {
          setNews([]);
          return;
        }
        setNews(
          data
            .map((item: Record<string, unknown>) => ({
              title: String(item.title ?? ''),
              source: String(item.source ?? item.source_id ?? 'Wire'),
              link: item.link ? String(item.link) : item.url ? String(item.url) : undefined,
            }))
            .filter((n: NewsRow) => n.title.trim().length > 0)
            .slice(0, 10),
        );
      } catch {
        setNews([]);
      }
    },
    { intervalMs: 60_000 },
  );

  usePageAutoUpdate(
    async () => {
      const rows = await fetchEconomicNews();
      setEcon(
        rows.slice(0, 8).map((r) => ({
          title: r.title,
          source: r.source,
          link: r.link,
          pubDate: r.pubDate,
        })),
      );
    },
    { intervalMs: 60_000 },
  );

  useEffect(() => {
    let cancelled = false;
    const series = [
      { id: 'DGS2', maturity: '2Y', label: '2 Year' },
      { id: 'DGS5', maturity: '5Y', label: '5 Year' },
      { id: 'DGS10', maturity: '10Y', label: '10 Year' },
      { id: 'DGS30', maturity: '30Y', label: '30 Year' },
    ];
    void (async () => {
      try {
        const results = await Promise.all(
          series.map(async (s) => {
            const res = await fetch(`/api/fred/observations?series_id=${s.id}&limit=1`);
            if (!res.ok) throw new Error(`FRED ${s.id} HTTP ${res.status}`);
            const data = await res.json();
            const raw = data?.observations?.[0]?.value;
            const value = parseFloat(String(raw));
            if (!Number.isFinite(value)) throw new Error(`FRED ${s.id} empty`);
            return { maturity: s.maturity, label: s.label, value };
          }),
        );
        if (!cancelled) {
          setYields(results);
          setYieldError(null);
        }
      } catch (e) {
        if (!cancelled) {
          setYields(null);
          setYieldError(e instanceof Error ? e.message : 'Yield curve unavailable');
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const report = useMemo(
    () => (candles.length ? analyzeInstitutionalStructure(candles) : null),
    [candles],
  );
  const mark = lastClose(candles);
  const flow = useMemo(() => closeLocationFlow(candles, 20), [candles]);
  const atr = useMemo(() => {
    const pts = calculateATR(candles, 14);
    return pts.length ? pts[pts.length - 1].value : null;
  }, [candles]);
  const hv = useMemo(() => {
    const pts = calculateHV(candles, 20);
    return pts.length ? pts[pts.length - 1].value : null;
  }, [candles]);
  const poc = report?.volumeProfile.find((n) => n.isPOC);
  const maxVp = report ? Math.max(...report.volumeProfile.map((n) => n.volume), 1) : 1;
  const sessionOpen = report?.events.slice(0, 8) ?? [];
  const quote = quotes[symbol];

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-1.5 overflow-auto p-1.5">
      <div className="flex flex-wrap gap-1 border border-white/15 bg-black px-2 py-1.5" aria-label="Ticker ribbon">
        {RIBBON.map((sym) => {
          const q = quotes[sym];
          const on = symbol === sym;
          return (
            <button
              key={sym}
              type="button"
              onClick={() => setSymbol(sym)}
              className="min-w-[7.5rem] border px-2 py-1 text-left"
              style={{
                borderColor: on ? '#FF1493' : 'rgba(255,255,255,0.12)',
                background: on ? 'rgba(255,20,147,0.12)' : 'transparent',
              }}
            >
              <span className="block text-sm font-extrabold text-white">{sym}</span>
              {q?.live && q.price !== null ? (
                <span className={`block font-mono text-sm font-bold tabular-nums ${pctClass(q.pct)}`}>
                  {formatStructurePrice(q.price)}
                  {q.pct !== null ? ` ${q.pct >= 0 ? '+' : ''}${q.pct.toFixed(2)}%` : ''}
                </span>
              ) : (
                <span className="block text-sm font-bold text-zinc-600">No quote</span>
              )}
            </button>
          );
        })}
      </div>

      <div className="grid min-h-[520px] grid-cols-1 gap-1.5 xl:grid-cols-[240px_minmax(0,1fr)_280px]">
        <aside className="flex min-h-0 flex-col gap-1.5">
          <Widget title="Market universe" className="max-h-56">
            <ul>
              {UNIVERSE.map((u) => (
                <li key={u.id}>
                  <button
                    type="button"
                    onClick={() => setUniverse(u.id)}
                    className="flex w-full items-center justify-between px-1 py-1 text-left text-sm font-extrabold uppercase"
                    style={{ color: universe === u.id ? '#FF1493' : undefined }}
                  >
                    {u.label}
                    <span className="font-mono text-sm text-zinc-500">
                      {ASSET_REGISTRY.filter((a) => a.enabled && a.category === u.id).length}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </Widget>
          <Widget title="Watchlists" className="min-h-[200px] flex-1">
            <ul>
              {universeNames.map((a) => {
                const q = quotes[a.symbol];
                const on = symbol === a.symbol;
                return (
                  <li key={a.symbol}>
                    <button
                      type="button"
                      onClick={() => setSymbol(a.symbol)}
                      className="flex w-full items-center justify-between gap-2 px-1 py-1 text-left"
                      style={{ background: on ? 'rgba(255,20,147,0.12)' : undefined }}
                    >
                      <span>
                        <span className="block text-sm font-extrabold text-white">{a.display}</span>
                        <span className="block text-sm font-bold uppercase text-zinc-500">
                          {LATENCY_LABEL[a.latencyClass]}
                        </span>
                      </span>
                      <span className="text-right font-mono text-sm font-bold">
                        {q?.live && q.price !== null ? (
                          <>
                            <span className="block tabular-nums text-zinc-100">
                              {formatStructurePrice(q.price)}
                            </span>
                            <span className={pctClass(q.pct)}>
                              {q.pct !== null ? `${q.pct >= 0 ? '+' : ''}${q.pct.toFixed(2)}%` : ''}
                            </span>
                          </>
                        ) : (
                          <span className="text-zinc-600">No quote</span>
                        )}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </Widget>
          <Widget title="Alerts" className="max-h-48">
            {sessionOpen.length === 0 ? (
              <Unavailable>
                No alert feed is connected. Structure notes from the loaded chart appear here when
                candles are available.
              </Unavailable>
            ) : (
              <ul className="space-y-1">
                {sessionOpen.map((ev, i) => (
                  <li key={`${ev.family}-${ev.time}-${i}`} className="text-sm font-bold">
                    <span className="text-amber-300">{ev.family}</span>{' '}
                    <span className="text-zinc-300">{ev.label}</span>{' '}
                    <span className="font-mono tabular-nums text-zinc-400">
                      {formatStructurePrice(ev.price)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Widget>
        </aside>

        <div className="flex min-h-0 flex-col gap-1.5">
          <section className="flex min-h-[380px] flex-1 flex-col border border-white/15 bg-black">
            <div className="space-y-2 border-b border-white/10 px-2 py-2">
              <div className="flex flex-wrap items-end justify-between gap-2">
                <div>
                  <h2 className="text-lg font-black uppercase tracking-widest text-white">
                    {symbol}
                    {mark !== null && (
                      <span className="ml-3 font-mono text-xl tabular-nums text-[#00FFFF]">
                        {formatStructurePrice(mark)}
                      </span>
                    )}
                    {quote?.pct != null && (
                      <span className={`ml-2 font-mono text-base ${pctClass(quote.pct)}`}>
                        {quote.pct >= 0 ? '+' : ''}
                        {quote.pct.toFixed(2)}%
                      </span>
                    )}
                  </h2>
                  <p className="font-mono text-sm font-bold uppercase text-zinc-500">
                    Primary chart · last print from candle history · {timeframe}
                  </p>
                </div>
              </div>
              <ChartSymbolSearch
                placeholder="Load any market…"
                activeSymbol={symbol}
                onSubmit={(raw) => setSymbol(resolveMarketAsset(raw).value)}
              />
              <div className="flex flex-wrap gap-1" role="group" aria-label="Timeframe">
                {TIMEFRAMES.map((tf) => {
                  const on = timeframe === tf;
                  return (
                    <button
                      key={tf}
                      type="button"
                      onClick={() => setTimeframe(tf)}
                      aria-pressed={on}
                      className="border px-2 py-1 text-sm font-extrabold uppercase tracking-widest"
                      style={{
                        color: on ? '#fff' : '#a1a1aa',
                        borderColor: on ? '#FF1493' : 'rgba(255,255,255,0.12)',
                        background: on ? '#FF149322' : 'transparent',
                      }}
                    >
                      {tf}
                    </button>
                  );
                })}
              </div>
              {candleError && (
                <p className="font-mono text-sm font-bold text-rose-400">{candleError}</p>
              )}
            </div>
            <div className="relative min-h-[320px] flex-1">
              <LightweightCandles
                data={candles.length ? candles : undefined}
                symbol={symbol}
                profileId="focus_mode"
                timeframe={timeframe}
                fillParent
                height={420}
                activeIndicators={['VWAP']}
              />
            </div>
          </section>

          <div className="grid grid-cols-1 gap-1.5 md:grid-cols-3">
            <Widget title="Volume profile" className="h-44">
              <p className="mb-1 text-sm font-bold uppercase text-zinc-500">
                {report?.volumeMode === 'vendor'
                  ? 'Vendor volume bins'
                  : 'Range-weighted proxy — vendor volume is not in this candle feed'}
                {poc ? ` · POC ${formatStructurePrice(poc.price)}` : ''}
              </p>
              {(report?.volumeProfile ?? [])
                .slice()
                .reverse()
                .map((node) => (
                  <div key={node.price} className="flex items-center gap-2 py-0.5">
                    <span className="w-20 shrink-0 font-mono text-sm font-bold tabular-nums text-zinc-500">
                      {formatStructurePrice(node.price)}
                    </span>
                    <div className="h-2 flex-1 bg-white/5">
                      <div
                        className={`h-2 ${node.isPOC ? 'bg-[#FF1493]' : 'bg-cyan-500/50'}`}
                        style={{ width: `${Math.max(2, (node.volume / maxVp) * 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
            </Widget>
            <Widget title="VWAP / volatility" className="h-44">
              <dl className="space-y-1 font-mono text-sm font-bold">
                <div className="flex justify-between">
                  <dt className="text-zinc-500">Last</dt>
                  <dd>{mark !== null ? formatStructurePrice(mark) : '—'}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-zinc-500">ATR(14)</dt>
                  <dd>{atr !== null ? formatStructurePrice(atr) : 'Need candles'}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-zinc-500">HV(20) ann.</dt>
                  <dd>{hv !== null ? `${hv.toFixed(1)}%` : 'Need candles'}</dd>
                </div>
              </dl>
              <p className="mt-2 text-sm font-bold text-zinc-500">
                ATR and historical volatility from OHLC. Not implied volatility. VWAP overlay needs
                vendor volume.
              </p>
            </Widget>
            <Widget title="Liquidity" className="h-44">
              <Unavailable>
                Average daily volume, spread, and slippage are exchange-quality fields. This desk
                does not invent them. When the candle feed includes volume, range-weighted profile
                is the liquidity proxy shown at left.
              </Unavailable>
            </Widget>
          </div>
        </div>

        <aside className="flex min-h-0 flex-col gap-1.5">
          <Widget title="Market flow" className="h-36">
            {flow ? (
              <>
                <p className="font-mono text-2xl font-extrabold text-emerald-400">
                  {flow.buyPct.toFixed(1)}% close-high
                </p>
                <p className="font-mono text-lg font-extrabold text-rose-400">
                  {flow.sellPct.toFixed(1)}% close-low
                </p>
                <p className="mt-1 text-sm font-bold text-zinc-500">
                  Heuristic from last {flow.bars} bars (close location in the high–low range). Not
                  bid/ask tape.
                </p>
              </>
            ) : (
              <Unavailable>Needs at least 5 candles.</Unavailable>
            )}
          </Widget>
          <Widget title="Level II market depth" className="min-h-[140px] flex-1">
            <Unavailable>
              This terminal does not subscribe to exchange Level II. Bid/ask ladders are not shown
              and are not simulated.
            </Unavailable>
          </Widget>
          <Widget title="Time & sales" className="min-h-[140px] flex-1">
            <Unavailable>
              Time and sales requires a trade tape. ClearPath is analytics-only — no execution tape
              is printed here.
            </Unavailable>
          </Widget>
        </aside>
      </div>

      <div className="grid grid-cols-1 gap-1.5 md:grid-cols-2 xl:grid-cols-4">
        <Widget title="Cross-asset correlation" className="h-48">
          <Unavailable>
            A 20-day correlation matrix needs simultaneous history for every pair. This desk will
            not fill the heatmap with made-up coefficients. Use the ribbon to load each market on
            the primary chart.
          </Unavailable>
        </Widget>
        <Widget title="Economic calendar" className="h-48">
          {econ.length === 0 ? (
            <Unavailable>
              No economic headlines from /api/economic/news. We do not invent CPI/NFP/Fed rows.
            </Unavailable>
          ) : (
            <ul className="space-y-1.5">
              {econ.map((item, i) => (
                <li key={`${item.title}-${i}`}>
                  {item.link ? (
                    <a
                      href={item.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-bold text-zinc-200 hover:text-[#00FFFF]"
                    >
                      {item.title}
                    </a>
                  ) : (
                    <span className="text-sm font-bold text-zinc-200">{item.title}</span>
                  )}
                  <span className="mt-0.5 block font-mono text-sm text-zinc-600">
                    {item.source}
                    {item.pubDate ? ` · ${item.pubDate}` : ''}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Widget>
        <Widget title="News feed" className="h-48">
          {news.length === 0 ? (
            <Unavailable>News wire empty or offline (/api/newsdata/latest).</Unavailable>
          ) : (
            <ul className="space-y-1.5">
              {news.map((item, i) => (
                <li key={`${item.title}-${i}`}>
                  {item.link ? (
                    <a
                      href={item.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-bold text-zinc-200 hover:text-[#00FFFF]"
                    >
                      {item.title}
                    </a>
                  ) : (
                    <span className="text-sm font-bold text-zinc-200">{item.title}</span>
                  )}
                  <span className="mt-0.5 block font-mono text-sm text-zinc-600">{item.source}</span>
                </li>
              ))}
            </ul>
          )}
        </Widget>
        <Widget title="US Treasury yield curve" className="h-48">
          {yields ? (
            <ul className="space-y-1 font-mono text-sm font-bold">
              {yields.map((y) => (
                <li key={y.maturity} className="flex justify-between">
                  <span>{y.label}</span>
                  <span>{y.value.toFixed(2)}%</span>
                </li>
              ))}
            </ul>
          ) : (
            <Unavailable>
              {yieldError || 'FRED yield observations not available. No simulated curve.'}
            </Unavailable>
          )}
        </Widget>
      </div>

      <div className="grid grid-cols-1 gap-1.5 md:grid-cols-2 xl:grid-cols-4">
        <Widget title="Options overview" className="h-36">
          <Unavailable>
            Put/call ratios and option activity need an options chain. Not wired — not fabricated.
          </Unavailable>
        </Widget>
        <Widget title="Positioning (CFTC)" className="h-36">
          <Unavailable>
            CFTC Commitment of Traders is not connected on this desk. Institutional long/short
            counts are not invented.
          </Unavailable>
        </Widget>
        <Widget title="Listed names" className="h-36">
          <p className="mb-1 text-sm font-bold text-zinc-500">
            Equities in the ClearPath universe with a live quote when the vendor key is set. Not
            sector ETFs.
          </p>
          <ul>
            {ASSET_REGISTRY.filter((a) => a.enabled && a.category === 'stocks')
              .slice(0, 8)
              .map((a) => {
                const q = quotes[a.symbol];
                return (
                  <li key={a.symbol} className="flex justify-between text-sm font-bold">
                    <button type="button" onClick={() => setSymbol(a.symbol)} className="text-left">
                      {a.symbol}
                    </button>
                    <span className={pctClass(q?.pct ?? null)}>
                      {q?.live && q.pct !== null ? `${q.pct >= 0 ? '+' : ''}${q.pct.toFixed(2)}%` : '—'}
                    </span>
                  </li>
                );
              })}
          </ul>
        </Widget>
        <Widget title="Portfolio snapshot" className="h-36">
          <Unavailable>
            ClearPath does not hold accounts or execute trades. There is no portfolio, P&amp;L, beta,
            or VaR on this terminal.
          </Unavailable>
        </Widget>
      </div>

      <footer className="flex flex-wrap items-center justify-between gap-2 border border-white/15 bg-black px-3 py-2">
        <p className="text-sm font-extrabold uppercase tracking-widest text-zinc-400">
          ClearPath Institutional
        </p>
        <p className="text-center text-sm font-extrabold uppercase tracking-widest text-zinc-500">
          Information &amp; analytics only · no trade execution · no investment advice
        </p>
        <p className="text-sm font-bold text-zinc-600">{DESK_DISCLAIMER}</p>
      </footer>
    </div>
  );
}
