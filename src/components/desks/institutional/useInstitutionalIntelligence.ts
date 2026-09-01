import { useCallback, useEffect, useMemo, useState } from 'react';
import { ASSET_REGISTRY, LATENCY_LABEL, getEnabledAssets, type AssetCategory } from '../../../constants/assetRegistry';
import { resolveQuotePrice } from '../../MarketTicker';
import { usePageAutoUpdate } from '../../../hooks/usePageAutoUpdate';
import { fetchTieredHistoricalData } from '../../../services/marketData';
import { fetchEconomicNews, type EconomicNewsItem } from '../../../services/economicService';
import { classifyNewsCategory } from '../../../fundamental/format';
import type { Candle } from '../../../types/indicators';
import { closeSeries, pearsonCorrelation } from '../../../lib/institutional/marketMath';
import type { CotAnalytics } from '../../../lib/cot/analytics';

export const RIBBON_MARKETS: { symbol: string; label: string }[] = [
  { symbol: 'SPX', label: 'SPX' },
  { symbol: 'NDX', label: 'NASDAQ' },
  { symbol: 'DXY', label: 'DXY' },
  { symbol: 'VIX', label: 'VIX' },
  { symbol: 'US10Y', label: '10Y' },
  { symbol: 'XAUUSD', label: 'GOLD' },
  { symbol: 'WTI', label: 'OIL' },
];

export const CORR_KEYS = ['SPX', 'DXY', 'XAUUSD', 'VIX', 'US10Y'] as const;
export type CorrKey = (typeof CORR_KEYS)[number];

export const UNIVERSE_TABS: {
  id: string;
  label: string;
  categories: AssetCategory[];
  note?: string;
}[] = [
  { id: 'equities', label: 'EQUITIES', categories: ['stocks'] },
  { id: 'fx', label: 'FX', categories: ['forex'] },
  { id: 'futures', label: 'FUTURES', categories: ['indices'], note: 'Index proxies — listed futures tape DATA UNAVAILABLE' },
  { id: 'rates', label: 'RATES', categories: ['bonds'] },
  { id: 'commodities', label: 'COMMODITIES', categories: ['commodities', 'metals'] },
  { id: 'crypto', label: 'CRYPTO', categories: ['crypto'] },
];

export type QuoteRow = {
  symbol: string;
  name: string;
  price: number | null;
  pct: number | null;
  live: boolean;
  latency: string;
};

export type NewsIntel = {
  title: string;
  source: string;
  link?: string;
  time: string;
  category: string;
  affected: string;
  relevance: 'HIGH' | 'MED' | 'LOW';
};

export type FredPoint = { id: string; label: string; value: number | null; date: string | null; unit: string };

export type EarningsRow = { symbol: string; date: string; actual: number | null; estimated: number | null };

export type DeskCot = {
  status: 'ok' | 'unmapped' | 'unavailable';
  note: string;
  contract: string | null;
  cftcCode: string | null;
  cached: boolean;
  fetchedAt: string | null;
  analytics: CotAnalytics | null;
};

function emptyCot(partial: Partial<DeskCot> = {}): DeskCot {
  return {
    status: 'unavailable',
    note: 'loading',
    contract: null,
    cftcCode: null,
    cached: false,
    fetchedAt: null,
    analytics: null,
    ...partial,
  };
}

function toCandle(c: { time: number; open: number; high: number; low: number; close: number; volume?: number }): Candle {
  return { time: c.time, open: c.open, high: c.high, low: c.low, close: c.close, volume: c.volume };
}

async function fetchQuoteMap(symbols: string[]): Promise<Record<string, QuoteRow>> {
  const unique = [...new Set(symbols.map((s) => s.trim().toUpperCase()).filter(Boolean))].slice(0, 80);
  const out: Record<string, QuoteRow> = {};
  if (unique.length === 0) return out;
  const res = await fetch(`/api/quotes?symbols=${encodeURIComponent(unique.join(','))}`);
  if (!res.ok) throw new Error(`Quotes HTTP ${res.status}`);
  const body = await res.json();
  const map = (body?.quotes || {}) as Record<string, { close?: string; price?: string; percent_change?: string }>;
  for (const symbol of unique) {
    const data = map[symbol];
    const price = resolveQuotePrice(data);
    const pctRaw = parseFloat(String(data?.percent_change ?? ''));
    const asset = ASSET_REGISTRY.find((a) => a.symbol === symbol);
    out[symbol] = {
      symbol,
      name: asset?.display ?? symbol,
      price,
      pct: Number.isFinite(pctRaw) ? pctRaw : null,
      live: price !== null,
      latency: asset ? LATENCY_LABEL[asset.latencyClass] : 'UNKNOWN',
    };
  }
  return out;
}

const FRED_SPECS: { id: string; label: string; unit: string; seriesId: string }[] = [
  { id: 'fed', label: 'FED', unit: '%', seriesId: 'FEDFUNDS' },
  { id: 'cpi', label: 'CPI', unit: 'index', seriesId: 'CPIAUCSL' },
  { id: 'gdp', label: 'GDP', unit: 'USD bn', seriesId: 'GDP' },
  { id: 'nfp', label: 'NFP', unit: 'thousands', seriesId: 'PAYEMS' },
  { id: 'dgs10', label: '10Y YIELD', unit: '%', seriesId: 'DGS10' },
  { id: 'dgs2', label: '2Y YIELD', unit: '%', seriesId: 'DGS2' },
];

let fredCache: { at: number; points: FredPoint[] } | null = null;

async function loadFred(): Promise<FredPoint[]> {
  if (fredCache && Date.now() - fredCache.at < 10 * 60 * 1000) return fredCache.points;
  const points: FredPoint[] = [];
  for (let i = 0; i < FRED_SPECS.length; i += 3) {
    const chunk = FRED_SPECS.slice(i, i + 3);
    const rows = await Promise.all(
      chunk.map(async (s) => {
        try {
          const res = await fetch(`/api/fred/observations?series_id=${encodeURIComponent(s.seriesId)}&limit=2`);
          if (!res.ok) return { id: s.id, label: s.label, value: null, date: null, unit: s.unit };
          const data = await res.json();
          const observations = (data?.observations || []) as Array<{ date?: string; value?: string }>;
          const latest = observations.find((o) => o.value && o.value !== '.');
          const n = latest ? Number(latest.value) : NaN;
          return {
            id: s.id,
            label: s.label,
            value: Number.isFinite(n) ? n : null,
            date: latest?.date || null,
            unit: s.unit,
          };
        } catch {
          return { id: s.id, label: s.label, value: null, date: null, unit: s.unit };
        }
      }),
    );
    points.push(...rows);
  }
  fredCache = { at: Date.now(), points };
  return points;
}

function newsCategory(title: string): string {
  const h = title.toLowerCase();
  if (/\bfed\b|\bfomc\b|\bpowel/.test(h)) return 'FED';
  if (/\boil\b|\benergy\b|\bopec\b|\bwti\b/.test(h)) return 'ENERGY';
  if (/\bstock\b|\bequity\b|\bnasdaq\b|\bs&p\b|\bearnings\b/.test(h)) return 'EQUITIES';
  if (/\bwar\b|\bsanction\b|\bgeopolit|\btariff/.test(h)) return 'GEOPOLITICAL';
  const c = classifyNewsCategory(title);
  return c.toUpperCase();
}

function affectedAsset(title: string): string {
  const h = title.toUpperCase();
  for (const a of getEnabledAssets()) {
    if (h.includes(a.symbol) || h.includes(a.display.toUpperCase())) return a.symbol;
  }
  if (/\bGOLD\b|\bXAU\b/.test(h)) return 'XAUUSD';
  if (/\bOIL\b|\bCRUDE\b/.test(h)) return 'WTI';
  if (/\bDOLLAR\b|\bDXY\b/.test(h)) return 'DXY';
  return 'CROSS-ASSET';
}

function relevance(title: string, symbol: string): NewsIntel['relevance'] {
  const h = title.toUpperCase();
  if (h.includes(symbol.toUpperCase())) return 'HIGH';
  if (/\bFED\b|\bCPI\b|\bFOMC\b|\bNFP\b/.test(h)) return 'MED';
  return 'LOW';
}

export function universeSymbols(tabId: string): string[] {
  const tab = UNIVERSE_TABS.find((t) => t.id === tabId) ?? UNIVERSE_TABS[0];
  return getEnabledAssets()
    .filter((a) => tab.categories.includes(a.category))
    .map((a) => a.symbol)
    .slice(0, 12);
}

export function workspaceSymbols(primary: string, layout: 1 | 2 | 4): string[] {
  const context = ['XAUUSD', 'DXY', 'US10Y', 'SPX'].filter((s) => s !== primary);
  if (layout === 1) return [primary];
  if (layout === 2) return [primary, context[0] ?? 'DXY'];
  return [primary, ...context].slice(0, 4);
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

export function useInstitutionalIntelligence(symbol: string, timeframe: string, layout: 1 | 2 | 4, universeTab: string) {
  const [candlesBySymbol, setCandlesBySymbol] = useState<Record<string, Candle[]>>({});
  const [candleError, setCandleError] = useState<string | null>(null);
  const [ribbon, setRibbon] = useState<QuoteRow[]>([]);
  const [universeQuotes, setUniverseQuotes] = useState<QuoteRow[]>([]);
  const [news, setNews] = useState<NewsIntel[]>([]);
  const [newsError, setNewsError] = useState<string | null>(null);
  const [econ, setEcon] = useState<EconomicNewsItem[]>([]);
  const [econError, setEconError] = useState<string | null>(null);
  const [macro, setMacro] = useState<FredPoint[]>([]);
  const [corrSeries, setCorrSeries] = useState<Partial<Record<CorrKey, number[]>>>({});
  const [earnings, setEarnings] = useState<EarningsRow[] | null>(null);
  const [earningsAvail, setEarningsAvail] = useState<'ok' | 'unconfigured' | 'unavailable'>('unavailable');
  const [cot, setCot] = useState<DeskCot>(emptyCot({ note: 'loading' }));

  const slots = useMemo(() => workspaceSymbols(symbol, layout), [symbol, layout]);

  const loadWorkspace = useCallback(async () => {
    const next: Record<string, Candle[]> = {};
    const errors: string[] = [];
    for (const s of slots) {
      try {
        next[s] = await loadHistory(s, timeframe);
      } catch (e) {
        next[s] = [];
        errors.push(`${s}: ${e instanceof Error ? e.message : 'unavailable'}`);
      }
    }
    setCandlesBySymbol(next);
    setCandleError(errors.length ? errors.join(' · ') : null);
  }, [slots, timeframe]);

  useEffect(() => {
    void loadWorkspace();
  }, [loadWorkspace]);

  usePageAutoUpdate(loadWorkspace, { intervalMs: 60_000, immediate: false });

  usePageAutoUpdate(
    async () => {
      try {
        const map = await fetchQuoteMap(RIBBON_MARKETS.map((m) => m.symbol));
        setRibbon(
          RIBBON_MARKETS.map((m) => map[m.symbol] ?? {
            symbol: m.symbol,
            name: m.label,
            price: null,
            pct: null,
            live: false,
            latency: 'UNKNOWN',
          }),
        );
      } catch {
        setRibbon((prev) =>
          prev.length
            ? prev.map((q) => ({ ...q, live: false }))
            : RIBBON_MARKETS.map((m) => ({
                symbol: m.symbol,
                name: m.label,
                price: null,
                pct: null,
                live: false,
                latency: 'UNKNOWN',
              })),
        );
      }
    },
    { intervalMs: 20_000 },
  );

  const loadUniverse = useCallback(async () => {
    const symbols = universeSymbols(universeTab);
    try {
      const map = await fetchQuoteMap(symbols);
      setUniverseQuotes(
        symbols.map((s) => {
          const asset = ASSET_REGISTRY.find((a) => a.symbol === s);
          return (
            map[s] ?? {
              symbol: s,
              name: asset?.display ?? s,
              price: null,
              pct: null,
              live: false,
              latency: asset ? LATENCY_LABEL[asset.latencyClass] : 'UNKNOWN',
            }
          );
        }),
      );
    } catch {
      setUniverseQuotes((prev) => prev.map((q) => ({ ...q, live: false })));
    }
  }, [universeTab]);

  useEffect(() => {
    void loadUniverse();
  }, [loadUniverse]);

  usePageAutoUpdate(loadUniverse, { intervalMs: 20_000, immediate: false });

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
                category: newsCategory(title),
                affected: affectedAsset(title),
                relevance: relevance(title, symbol),
              } satisfies NewsIntel;
            })
            .filter((n: NewsIntel) => n.title.length > 0)
            .slice(0, 16),
        );
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
        setEconError(items.length ? null : 'Timed calendar rows DATA UNAVAILABLE — showing economic wire only');
      } catch (e) {
        setEcon([]);
        setEconError(e instanceof Error ? e.message : 'Economic wire unavailable');
      }
    },
    { intervalMs: 60_000 },
  );

  usePageAutoUpdate(
    async () => {
      setMacro(await loadFred());
    },
    { intervalMs: 10 * 60 * 1000 },
  );

  usePageAutoUpdate(
    async () => {
      const next: Partial<Record<CorrKey, number[]>> = {};
      for (const key of CORR_KEYS) {
        try {
          const series = await loadHistory(key, '1d');
          next[key] = closeSeries(series);
        } catch {
          next[key] = undefined;
        }
      }
      setCorrSeries(next);
    },
    { intervalMs: 5 * 60 * 1000 },
  );

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch(`/api/fmp/earnings-surprises/${encodeURIComponent(symbol)}`);
        if (cancelled) return;
        if (res.status === 503) {
          setEarnings(null);
          setEarningsAvail('unconfigured');
          return;
        }
        if (!res.ok) {
          setEarnings(null);
          setEarningsAvail('unavailable');
          return;
        }
        const data = await res.json();
        const rows = Array.isArray(data) ? data : [];
        setEarnings(
          rows.slice(0, 8).map((row: Record<string, unknown>) => ({
            symbol: String(row.symbol ?? symbol),
            date: String(row.date ?? ''),
            actual: Number.isFinite(Number(row.actualEarningResult)) ? Number(row.actualEarningResult) : null,
            estimated: Number.isFinite(Number(row.estimatedEarning)) ? Number(row.estimatedEarning) : null,
          })),
        );
        setEarningsAvail('ok');
      } catch {
        if (!cancelled) {
          setEarnings(null);
          setEarningsAvail('unavailable');
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [symbol]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/cot/history?symbol=${encodeURIComponent(symbol)}`);
        const body = (await res.json().catch(() => null)) as {
          error?: string;
          contract?: string;
          cftcCode?: string;
          cached?: boolean;
          fetchedAt?: string;
          analytics?: CotAnalytics;
        } | null;
        if (cancelled) return;
        if (res.status === 404) {
          setCot(
            emptyCot({
              status: 'unmapped',
              note: body?.error || 'NO CFTC MAP',
            }),
          );
          return;
        }
        if (!res.ok || !body?.analytics) {
          setCot(
            emptyCot({
              status: 'unavailable',
              note: body?.error || `COT HTTP ${res.status}`,
            }),
          );
          return;
        }
        const contract = body.contract || null;
        const cftcCode = body.cftcCode || null;
        setCot({
          status: 'ok',
          note: `CFTC.gov · ${contract || 'COT'}${cftcCode ? ` · ${cftcCode}` : ''}`,
          contract,
          cftcCode,
          cached: Boolean(body.cached),
          fetchedAt: body.fetchedAt || null,
          analytics: body.analytics,
        });
      } catch {
        if (!cancelled) {
          setCot(emptyCot({ status: 'unavailable', note: 'COT REQUEST FAILED' }));
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [symbol]);

  const correlation = useMemo(() => {
    const matrix: Record<string, Record<string, number | null>> = {};
    for (const a of CORR_KEYS) {
      matrix[a] = {};
      for (const b of CORR_KEYS) {
        if (a === b) {
          matrix[a][b] = corrSeries[a]?.length ? 1 : null;
          continue;
        }
        const sa = corrSeries[a];
        const sb = corrSeries[b];
        matrix[a][b] = sa && sb ? pearsonCorrelation(sa, sb) : null;
      }
    }
    return matrix;
  }, [corrSeries]);

  return {
    slots,
    candlesBySymbol,
    candleError,
    ribbon,
    universeQuotes,
    news,
    newsError,
    econ,
    econError,
    macro,
    correlation,
    earnings,
    earningsAvail,
    cot,
  };
}
