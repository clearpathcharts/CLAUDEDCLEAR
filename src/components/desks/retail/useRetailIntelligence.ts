import { useCallback, useEffect, useMemo, useState } from 'react';
import { ASSET_REGISTRY, LATENCY_LABEL } from '../../../constants/assetRegistry';
import { resolveQuotePrice } from '../../MarketTicker';
import { usePageAutoUpdate } from '../../../hooks/usePageAutoUpdate';
import { fetchTieredHistoricalData } from '../../../services/marketData';
import { fetchEconomicNews, type EconomicNewsItem } from '../../../services/economicService';
import type { Candle } from '../../../types/indicators';

export const RETAIL_RIBBON: { symbol: string; label: string }[] = [
  { symbol: 'SPX', label: 'S&P 500' },
  { symbol: 'NDX', label: 'NASDAQ' },
  { symbol: 'DJI', label: 'DOW' },
  { symbol: 'DXY', label: 'DXY' },
  { symbol: 'VIX', label: 'VIX' },
  { symbol: 'XAUUSD', label: 'GOLD' },
  { symbol: 'WTI', label: 'OIL' },
  { symbol: 'BTCUSD', label: 'BTC' },
];

export type RetailQuote = {
  symbol: string;
  name: string;
  price: number | null;
  pct: number | null;
  volume: number | null;
  live: boolean;
  latency: string;
};

export type RetailNewsItem = {
  title: string;
  source: string;
  link?: string;
  time: string;
  pubDate?: string;
};

export type RetailFundamentalSnap = {
  marketCap: number | null;
  pe: number | null;
  eps: number | null;
  revenueGrowth: number | null;
  dividend: number | null;
  debt: number | null;
  fcf: number | null;
  status: 'ok' | 'unavailable' | 'unconfigured' | 'n/a';
};

function toCandle(c: {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}): Candle {
  return { time: c.time, open: c.open, high: c.high, low: c.low, close: c.close, volume: c.volume };
}

async function fetchQuoteMap(symbols: string[]): Promise<Record<string, RetailQuote>> {
  const unique = [...new Set(symbols.map((s) => s.trim().toUpperCase()).filter(Boolean))].slice(0, 80);
  const out: Record<string, RetailQuote> = {};
  if (unique.length === 0) return out;
  const res = await fetch(`/api/quotes?symbols=${encodeURIComponent(unique.join(','))}`);
  if (!res.ok) throw new Error(`Quotes HTTP ${res.status}`);
  const body = await res.json();
  const map = (body?.quotes || {}) as Record<
    string,
    { close?: string; price?: string; percent_change?: string; volume?: string }
  >;
  for (const symbol of unique) {
    const data = map[symbol];
    const price = resolveQuotePrice(data);
    const pctRaw = parseFloat(String(data?.percent_change ?? ''));
    const volRaw = parseFloat(String(data?.volume ?? ''));
    const asset = ASSET_REGISTRY.find((a) => a.symbol === symbol);
    out[symbol] = {
      symbol,
      name: asset?.display ?? symbol,
      price,
      pct: Number.isFinite(pctRaw) ? pctRaw : null,
      volume: Number.isFinite(volRaw) && volRaw > 0 ? volRaw : null,
      live: price !== null,
      latency: asset ? LATENCY_LABEL[asset.latencyClass] : 'UNKNOWN',
    };
  }
  return out;
}

const histCache = new Map<string, { at: number; candles: Candle[] }>();

async function loadHistory(symbol: string, timeframe: string): Promise<Candle[]> {
  const key = `${symbol}:${timeframe}`;
  const hit = histCache.get(key);
  if (hit && Date.now() - hit.at < 45_000) return hit.candles;
  const hist = await fetchTieredHistoricalData(symbol, timeframe, 'VIP');
  const candles = hist.map(toCandle);
  histCache.set(key, { at: Date.now(), candles });
  return candles;
}

function emptyQuote(symbol: string): RetailQuote {
  const asset = ASSET_REGISTRY.find((a) => a.symbol === symbol);
  return {
    symbol,
    name: asset?.display ?? symbol,
    price: null,
    pct: null,
    volume: null,
    live: false,
    latency: asset ? LATENCY_LABEL[asset.latencyClass] : 'UNKNOWN',
  };
}

export function retailWorkspaceSlots(
  primary: string,
  layout: 1 | 2 | 4,
  slotOverrides: Partial<Record<number, { symbol: string; timeframe: string }>>,
  defaultTf: string,
): { symbol: string; timeframe: string }[] {
  if (layout === 1) {
    return [{ symbol: primary, timeframe: slotOverrides[0]?.timeframe ?? defaultTf }];
  }
  const defaults =
    layout === 2
      ? [
          { symbol: primary, timeframe: defaultTf },
          { symbol: slotOverrides[1]?.symbol ?? primary, timeframe: slotOverrides[1]?.timeframe ?? '15m' },
        ]
      : [
          { symbol: primary, timeframe: defaultTf },
          { symbol: slotOverrides[1]?.symbol ?? primary, timeframe: slotOverrides[1]?.timeframe ?? '15m' },
          { symbol: slotOverrides[2]?.symbol ?? 'DXY', timeframe: slotOverrides[2]?.timeframe ?? defaultTf },
          { symbol: slotOverrides[3]?.symbol ?? 'SPX', timeframe: slotOverrides[3]?.timeframe ?? defaultTf },
        ];
  return defaults.map((d, i) => ({
    symbol: slotOverrides[i]?.symbol ?? d.symbol,
    timeframe: slotOverrides[i]?.timeframe ?? d.timeframe,
  }));
}

export function useRetailIntelligence(
  primarySymbol: string,
  primaryTimeframe: string,
  watchlistSymbols: string[],
  layout: 1 | 2 | 4,
  slotOverrides: Partial<Record<number, { symbol: string; timeframe: string }>>,
  ribbonMarkets: { symbol: string; label: string }[] = RETAIL_RIBBON,
) {
  const [candlesByKey, setCandlesByKey] = useState<Record<string, Candle[]>>({});
  const [candleError, setCandleError] = useState<string | null>(null);
  const [ribbon, setRibbon] = useState<RetailQuote[]>([]);
  const [watchQuotes, setWatchQuotes] = useState<RetailQuote[]>([]);
  const [moverQuotes, setMoverQuotes] = useState<RetailQuote[]>([]);
  const [moversStatus, setMoversStatus] = useState<'ok' | 'unavailable'>('unavailable');
  const [news, setNews] = useState<RetailNewsItem[]>([]);
  const [newsError, setNewsError] = useState<string | null>(null);
  const [econ, setEcon] = useState<EconomicNewsItem[]>([]);
  const [econError, setEconError] = useState<string | null>(null);
  const [fundamentals, setFundamentals] = useState<RetailFundamentalSnap>({
    marketCap: null,
    pe: null,
    eps: null,
    revenueGrowth: null,
    dividend: null,
    debt: null,
    fcf: null,
    status: 'unavailable',
  });

  const ribbonSpec = ribbonMarkets.length ? ribbonMarkets : RETAIL_RIBBON;

  const slots = useMemo(
    () => retailWorkspaceSlots(primarySymbol, layout, slotOverrides, primaryTimeframe),
    [primarySymbol, layout, slotOverrides, primaryTimeframe],
  );

  const loadWorkspace = useCallback(async () => {
    const next: Record<string, Candle[]> = {};
    const errors: string[] = [];
    for (const slot of slots) {
      const key = `${slot.symbol}:${slot.timeframe}`;
      try {
        next[key] = await loadHistory(slot.symbol, slot.timeframe);
      } catch (e) {
        next[key] = [];
        errors.push(`${slot.symbol}: ${e instanceof Error ? e.message : 'unavailable'}`);
      }
    }
    setCandlesByKey(next);
    setCandleError(errors.length ? errors.join(' · ') : null);
  }, [slots]);

  useEffect(() => {
    void loadWorkspace();
  }, [loadWorkspace]);

  usePageAutoUpdate(loadWorkspace, { intervalMs: 60_000, immediate: false });

  usePageAutoUpdate(
    async () => {
      try {
        const map = await fetchQuoteMap(ribbonSpec.map((m) => m.symbol));
        setRibbon(ribbonSpec.map((m) => map[m.symbol] ?? emptyQuote(m.symbol)));
      } catch {
        setRibbon(ribbonSpec.map((m) => emptyQuote(m.symbol)));
      }
    },
    { intervalMs: 20_000 },
  );

  const loadWatch = useCallback(async () => {
    const symbols = [...new Set(watchlistSymbols.map((s) => s.toUpperCase()))].slice(0, 24);
    if (symbols.length === 0) {
      setWatchQuotes([]);
      return;
    }
    try {
      const map = await fetchQuoteMap(symbols);
      setWatchQuotes(symbols.map((s) => map[s] ?? emptyQuote(s)));
    } catch {
      setWatchQuotes((prev) => prev.map((q) => ({ ...q, live: false })));
    }
  }, [watchlistSymbols]);

  useEffect(() => {
    void loadWatch();
  }, [loadWatch]);

  usePageAutoUpdate(loadWatch, { intervalMs: 20_000, immediate: false });

  /** Movers from live quotes of a curated retail universe — never fabricated ranks. */
  usePageAutoUpdate(
    async () => {
      const universe = [
        'AAPL',
        'MSFT',
        'NVDA',
        'AMZN',
        'TSLA',
        'META',
        'GOOGL',
        'SPX',
        'NDX',
        'EURUSD',
        'XAUUSD',
        'BTCUSD',
      ];
      try {
        const map = await fetchQuoteMap(universe);
        const rows = universe.map((s) => map[s] ?? emptyQuote(s)).filter((q) => q.live && q.pct != null);
        if (rows.length === 0) {
          setMoverQuotes([]);
          setMoversStatus('unavailable');
          return;
        }
        setMoverQuotes(rows);
        setMoversStatus('ok');
      } catch {
        setMoverQuotes([]);
        setMoversStatus('unavailable');
      }
    },
    { intervalMs: 30_000 },
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
        const primary = primarySymbol.toUpperCase();
        const watchSet = new Set(watchlistSymbols.map((s) => s.toUpperCase()));
        const mapped = data
          .map((item: Record<string, unknown>) => {
            const title = String(item.title ?? '').trim();
            const pub = String(item.pubDate ?? item.published_at ?? item.publishedAt ?? '');
            let time = '—';
            const d = pub ? new Date(pub) : null;
            if (d && Number.isFinite(d.getTime())) time = d.toISOString().slice(11, 16);
            return {
              title,
              source: String(item.source ?? item.source_id ?? 'Wire'),
              link: item.link ? String(item.link) : item.url ? String(item.url) : undefined,
              time,
              pubDate: pub || undefined,
              _rank: (() => {
                const h = title.toUpperCase();
                if (h.includes(primary) || h.includes(primary.replace('USD', ''))) return 0;
                for (const s of watchSet) {
                  if (h.includes(s) || h.includes(s.replace('USD', ''))) return 1;
                }
                return 2;
              })(),
            };
          })
          .filter((n: { title: string }) => n.title.length > 0)
          .sort((a: { _rank: number }, b: { _rank: number }) => a._rank - b._rank)
          .slice(0, 12)
          .map(({ title, source, link, time, pubDate }: RetailNewsItem & { _rank?: number }) => ({
            title,
            source,
            link,
            time,
            pubDate,
          }));
        setNews(mapped);
        setNewsError(null);
      } catch (e) {
        setNews([]);
        setNewsError(e instanceof Error ? e.message : 'News offline');
      }
    },
    { intervalMs: 60_000 },
  );

  usePageAutoUpdate(
    async () => {
      try {
        const items = await fetchEconomicNews();
        setEcon(items.slice(0, 12));
        setEconError(
          items.length
            ? null
            : 'Timed economic calendar rows DATA UNAVAILABLE — showing economic wire only when available',
        );
      } catch (e) {
        setEcon([]);
        setEconError(e instanceof Error ? e.message : 'Economic wire unavailable');
      }
    },
    { intervalMs: 60_000 },
  );

  useEffect(() => {
    let cancelled = false;
    const asset = ASSET_REGISTRY.find((a) => a.symbol === primarySymbol.toUpperCase());
    const isEquity = asset?.category === 'stocks';
    if (!isEquity) {
      setFundamentals({
        marketCap: null,
        pe: null,
        eps: null,
        revenueGrowth: null,
        dividend: null,
        debt: null,
        fcf: null,
        status: 'n/a',
      });
      return;
    }
    void (async () => {
      try {
        const res = await fetch(`/api/fmp/quote/${encodeURIComponent(primarySymbol)}`);
        if (cancelled) return;
        if (res.status === 503) {
          setFundamentals({
            marketCap: null,
            pe: null,
            eps: null,
            revenueGrowth: null,
            dividend: null,
            debt: null,
            fcf: null,
            status: 'unconfigured',
          });
          return;
        }
        if (!res.ok) {
          setFundamentals({
            marketCap: null,
            pe: null,
            eps: null,
            revenueGrowth: null,
            dividend: null,
            debt: null,
            fcf: null,
            status: 'unavailable',
          });
          return;
        }
        const data = await res.json();
        const row = Array.isArray(data) ? data[0] : data;
        if (!row || typeof row !== 'object') {
          setFundamentals({
            marketCap: null,
            pe: null,
            eps: null,
            revenueGrowth: null,
            dividend: null,
            debt: null,
            fcf: null,
            status: 'unavailable',
          });
          return;
        }
        const num = (v: unknown) => {
          const n = Number(v);
          return Number.isFinite(n) ? n : null;
        };
        setFundamentals({
          marketCap: num((row as Record<string, unknown>).marketCap),
          pe: num((row as Record<string, unknown>).pe),
          eps: num((row as Record<string, unknown>).eps),
          revenueGrowth: null,
          dividend: num((row as Record<string, unknown>).lastDiv),
          debt: null,
          fcf: null,
          status: 'ok',
        });
      } catch {
        if (!cancelled) {
          setFundamentals({
            marketCap: null,
            pe: null,
            eps: null,
            revenueGrowth: null,
            dividend: null,
            debt: null,
            fcf: null,
            status: 'unavailable',
          });
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [primarySymbol]);

  const primaryKey = `${primarySymbol}:${primaryTimeframe}`;
  const primaryCandles = candlesByKey[primaryKey] ?? [];

  return {
    slots,
    candlesByKey,
    primaryCandles,
    candleError,
    ribbon,
    watchQuotes,
    moverQuotes,
    moversStatus,
    news,
    newsError,
    econ,
    econError,
    fundamentals,
  };
}
