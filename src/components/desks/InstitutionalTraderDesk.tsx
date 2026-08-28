import React, { useEffect, useMemo, useState } from 'react';
import { ChartSymbolSearch } from '../charts/ChartSymbolSearch';
import { LightweightCandles } from '../charts/LightweightCandles';
import { resolveMarketAsset } from '../../constants/marketAssets';
import { analyzeInstitutionalStructure, formatStructurePrice } from '../../lib/institutional/analyzeStructure';
import { fetchTieredHistoricalData } from '../../services/marketData';
import { getTickerAssets, LATENCY_LABEL } from '../../constants/assetRegistry';
import { resolveQuotePrice } from '../MarketTicker';
import { usePageAutoUpdate } from '../../hooks/usePageAutoUpdate';
import { DEFAULT_MARKET_SYMBOLS } from '../../constants/chartLayout';
import type { Candle } from '../../types/indicators';
import { InstitutionalRegistry } from '../../core/registry/InstitutionalRegistry';

const TIMEFRAMES = ['5m', '15m', '1h', '4h', '1d'] as const;
const WATCHLIST = getTickerAssets(8);

type QuoteRow = {
  symbol: string;
  name: string;
  price: number | null;
  pct: number | null;
  live: boolean;
  latency: string;
};

type NewsRow = { title: string; source: string; link?: string };

function lastClose(candles: Candle[]): number | null {
  const last = candles[candles.length - 1];
  return last && Number.isFinite(last.close) ? last.close : null;
}

function familyTone(family: string): string {
  if (family === 'BOS' || family === 'CHOCH') return 'text-cyan-300';
  if (family === 'FVG' || family === 'OB') return 'text-fuchsia-300';
  return 'text-amber-300';
}

export default function InstitutionalTraderDesk() {
  const [symbol, setSymbol] = useState<string>(DEFAULT_MARKET_SYMBOLS[0]);
  const [timeframe, setTimeframe] = useState<string>('1h');
  const [candles, setCandles] = useState<Candle[]>([]);
  const [candleError, setCandleError] = useState<string | null>(null);
  const [quotes, setQuotes] = useState<QuoteRow[]>(() =>
    WATCHLIST.map((a) => ({
      symbol: a.symbol,
      name: a.display,
      price: null,
      pct: null,
      live: false,
      latency: LATENCY_LABEL[a.latencyClass],
    })),
  );
  const [news, setNews] = useState<NewsRow[]>([]);
  const [newsError, setNewsError] = useState<string | null>(null);

  const loadCandles = async () => {
    try {
      const hist = await fetchTieredHistoricalData(symbol, timeframe, 'VIP');
      const mapped: Candle[] = hist.map((c) => ({
        time: c.time,
        open: c.open,
        high: c.high,
        low: c.low,
        close: c.close,
      }));
      setCandles(mapped);
      setCandleError(null);
    } catch (e) {
      setCandles([]);
      setCandleError(e instanceof Error ? e.message : 'Candle history unavailable');
    }
  };

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

  usePageAutoUpdate(loadCandles, { intervalMs: 60_000, immediate: false });

  usePageAutoUpdate(
    async () => {
      try {
        const symbols = WATCHLIST.map((a) => a.symbol).join(',');
        const res = await fetch(`/api/quotes?symbols=${encodeURIComponent(symbols)}`);
        if (res.status === 429) {
          setQuotes((prev) => prev.map((q) => ({ ...q, live: false })));
          return;
        }
        if (!res.ok) throw new Error(`Quotes HTTP ${res.status}`);
        const body = await res.json();
        const map = (body?.quotes || {}) as Record<
          string,
          { close?: string; price?: string; percent_change?: string; error?: unknown }
        >;
        setQuotes(
          WATCHLIST.map((a) => {
            const data = map[a.symbol];
            const price = resolveQuotePrice(data);
            const pctRaw = parseFloat(String(data?.percent_change ?? ''));
            return {
              symbol: a.symbol,
              name: a.display,
              price,
              pct: Number.isFinite(pctRaw) ? pctRaw : null,
              live: price !== null,
              latency: LATENCY_LABEL[a.latencyClass],
            };
          }),
        );
      } catch {
        setQuotes((prev) => prev.map((q) => ({ ...q, live: false })));
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
          setNewsError(`News unavailable (HTTP ${res.status})`);
          return;
        }
        const data = await res.json();
        if (!Array.isArray(data)) {
          setNews([]);
          setNewsError('Invalid news payload');
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
            .slice(0, 12),
        );
        setNewsError(null);
      } catch (e) {
        setNews([]);
        setNewsError(e instanceof Error ? e.message : 'News offline');
      }
    },
    { intervalMs: 60_000 },
  );

  const report = useMemo(
    () => (candles.length ? analyzeInstitutionalStructure(candles) : null),
    [candles],
  );
  const mark = lastClose(candles);
  const poc = report?.volumeProfile.find((n) => n.isPOC);
  const maxVp = report ? Math.max(...report.volumeProfile.map((n) => n.volume), 1) : 1;
  const recentEvents = report?.events.slice(0, 14) ?? [];
  const lastCvdPoint = report?.cvd.length ? report.cvd[report.cvd.length - 1] : null;

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2 p-2 lg:grid lg:grid-cols-[220px_minmax(0,1fr)_280px] lg:grid-rows-[minmax(420px,1fr)_220px] lg:gap-2">
      <aside className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-[#FF1493]/30 bg-black/70 lg:row-span-2">
        <h2 className="border-b border-white/10 px-3 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-[#FF1493]">
          Watchlist
        </h2>
        <ul className="min-h-0 flex-1 overflow-y-auto font-mono text-[11px]">
          {quotes.map((row) => {
            const on = row.symbol === symbol;
            return (
              <li key={row.symbol}>
                <button
                  type="button"
                  onClick={() => setSymbol(row.symbol)}
                  className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left hover:bg-white/5"
                  style={{ background: on ? 'rgba(255,20,147,0.12)' : undefined }}
                >
                  <span>
                    <span className="block font-bold text-white">{row.symbol}</span>
                    <span className="block text-[9px] uppercase text-zinc-500">{row.latency}</span>
                  </span>
                  <span className="text-right">
                    {row.live && row.price !== null ? (
                      <>
                        <span className="block tabular-nums text-zinc-100">
                          {formatStructurePrice(row.price)}
                        </span>
                        {row.pct !== null && (
                          <span
                            className={`block text-[10px] ${row.pct >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}
                          >
                            {row.pct >= 0 ? '+' : ''}
                            {row.pct.toFixed(2)}%
                          </span>
                        )}
                      </>
                    ) : (
                      <span className="text-[10px] uppercase text-zinc-600">No quote</span>
                    )}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </aside>

      <section className="flex min-h-[420px] min-w-0 flex-col overflow-hidden rounded-xl border border-white/15 bg-black/80">
        <div className="space-y-2 border-b border-white/10 px-3 py-2">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <div>
              <h2 className="text-sm font-black uppercase tracking-widest text-white">
                {symbol}
                {mark !== null && (
                  <span className="ml-3 font-mono text-base tabular-nums text-[#00FFFF]">
                    {formatStructurePrice(mark)}
                  </span>
                )}
              </h2>
              <p className="font-mono text-[9px] uppercase text-zinc-500">
                Last print from candle history · {timeframe}
              </p>
            </div>
            {report && (
              <dl className="flex flex-wrap gap-3 font-mono text-[10px] uppercase text-zinc-400">
                <div>
                  BOS <strong className="text-white">{report.bos.length}</strong>
                </div>
                <div>
                  CHoCH <strong className="text-white">{report.choch.length}</strong>
                </div>
                <div>
                  FVG <strong className="text-white">{report.fvg.length}</strong>
                </div>
                <div>
                  OB <strong className="text-white">{report.orderBlocks.length}</strong>
                </div>
                <div>
                  Sweeps <strong className="text-white">{report.sweeps.length}</strong>
                </div>
              </dl>
            )}
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
                  className="rounded border px-2 py-0.5 text-[10px] font-black uppercase tracking-widest"
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
            <p className="font-mono text-[10px] text-rose-400">{candleError}</p>
          )}
        </div>
        <div className="relative min-h-[360px] flex-1">
          <LightweightCandles
            data={candles.length ? candles : undefined}
            symbol={symbol}
            profileId="focus_mode"
            timeframe={timeframe}
            fillParent
            height={420}
            hideChartToolbar={false}
          />
        </div>
      </section>

      <aside className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-[#FF1493]/25 bg-black/70">
        <h2 className="border-b border-white/10 px-3 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-[#FF1493]">
          Market structure
        </h2>
        <p className="px-3 py-1.5 font-mono text-[8px] uppercase leading-relaxed text-zinc-500">
          Derived from the loaded OHLC series. Not signals.
        </p>
        <ul className="min-h-0 flex-1 overflow-y-auto">
          {recentEvents.length === 0 && (
            <li className="px-3 py-4 font-mono text-[10px] uppercase text-zinc-600">
              {candles.length ? 'No structure events on this window' : 'Waiting for candles'}
            </li>
          )}
          {recentEvents.map((ev, i) => (
            <li
              key={`${ev.family}-${ev.time}-${i}`}
              className="flex items-baseline justify-between gap-2 border-b border-white/5 px-3 py-1.5"
            >
              <span className={`text-[10px] font-black uppercase tracking-wide ${familyTone(ev.family)}`}>
                {ev.family}
              </span>
              <span className="min-w-0 truncate font-mono text-[10px] text-zinc-400">{ev.label}</span>
              <span className="shrink-0 font-mono text-[10px] tabular-nums text-zinc-200">
                {formatStructurePrice(ev.price)}
              </span>
            </li>
          ))}
        </ul>
        <div className="border-t border-white/10 px-3 py-2">
          <p className="mb-1 font-mono text-[8px] uppercase text-zinc-500">Engine roster</p>
          <ul className="space-y-0.5">
            {InstitutionalRegistry.map((item) => (
              <li key={item.id} className="font-mono text-[9px] text-zinc-500">
                <span className="text-zinc-300">{item.abbr}</span> {item.name}
              </li>
            ))}
          </ul>
        </div>
      </aside>

      <section className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-white/10 bg-black/70">
        <h2 className="border-b border-white/10 px-3 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-300">
          Volume profile
        </h2>
        <p className="px-3 py-1 font-mono text-[8px] uppercase text-zinc-500">
          {report?.volumeMode === 'vendor'
            ? 'Vendor volume bins'
            : 'Range-weighted proxy — vendor volume is not in this candle feed'}
          {poc ? ` · POC ${formatStructurePrice(poc.price)}` : ''}
        </p>
        <div className="min-h-0 flex-1 overflow-y-auto px-2 py-1">
          {(report?.volumeProfile ?? [])
            .slice()
            .reverse()
            .map((node) => (
              <div key={node.price} className="flex items-center gap-2 py-0.5">
                <span className="w-16 shrink-0 font-mono text-[9px] tabular-nums text-zinc-500">
                  {formatStructurePrice(node.price)}
                </span>
                <div className="h-2 flex-1 rounded-sm bg-white/5">
                  <div
                    className={`h-2 rounded-sm ${node.isPOC ? 'bg-[#FF1493]' : 'bg-cyan-500/50'}`}
                    style={{ width: `${Math.max(2, (node.volume / maxVp) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
        </div>
      </section>

      <section className="grid min-h-0 grid-cols-1 gap-2 sm:grid-cols-2">
        <div className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-white/10 bg-black/70">
          <h2 className="border-b border-white/10 px-3 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-300">
            Cumulative delta
          </h2>
          <div className="flex flex-1 flex-col justify-center px-3 py-3">
            {lastCvdPoint ? (
              <>
                <p className="font-mono text-2xl tabular-nums text-white">
                  {lastCvdPoint.cumulativeDelta.toLocaleString()}
                </p>
                <p className="mt-1 font-mono text-[10px] uppercase text-zinc-500">
                  Last bar delta {lastCvdPoint.delta.toLocaleString()} ·{' '}
                  {report?.volumeMode === 'vendor' ? 'vendor volume' : 'range proxy'}
                </p>
              </>
            ) : (
              <p className="font-mono text-[10px] uppercase text-zinc-600">No CVD until candles load</p>
            )}
          </div>
        </div>
        <div className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-white/10 bg-black/70">
          <h2 className="border-b border-white/10 px-3 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-300">
            Wire
          </h2>
          {newsError && (
            <p className="px-3 py-2 font-mono text-[10px] text-rose-400">{newsError}</p>
          )}
          <ul className="min-h-0 flex-1 overflow-y-auto">
            {news.map((item, i) => (
              <li key={`${item.title}-${i}`} className="border-b border-white/5 px-3 py-1.5">
                {item.link ? (
                  <a
                    href={item.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] leading-snug text-zinc-200 hover:text-[#00FFFF]"
                  >
                    {item.title}
                  </a>
                ) : (
                  <span className="text-[11px] leading-snug text-zinc-200">{item.title}</span>
                )}
                <span className="mt-0.5 block font-mono text-[8px] uppercase text-zinc-600">
                  {item.source}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}
