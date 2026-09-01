/**
 * Second-layer market data: Financial Modeling Prep after Twelve Data.
 * Every desk / registry / typed ticker is proxied (safe charset only).
 * Never fabricates prices. Missing FMP cells stay unavailable.
 */
import { getEnabledAssets, getRegistryAsset } from '../constants/assetRegistry';
import { historySymbol } from '../lib/institutional/vendorMaps';
import { getFmpApiKey } from './secrets';

const FMP_STABLE = 'https://financialmodelingprep.com/stable';

/** Special FMP ids. Everything else is derived from the asset registry. */
export const FMP_QUOTE_SYMBOL: Record<string, string> = {
  SPX: 'SPY',
  NDX: 'QQQ',
  DJI: 'DIA',
  VIX: '^VIX',
  US10Y: '^TNX',
  US30Y: '^TYX',
  XAUUSD: 'GCUSD',
  XAGUSD: 'SIUSD',
  WTI: 'CLUSD',
  BRENT: 'BZUSD',
  DXY: 'DXUSD',
  NATGAS: 'NGUSD',
  COPPER: 'HGUSD',
};

function isSafeTicker(raw: string): boolean {
  return /^[A-Z0-9./^=-]{1,24}$/.test(raw) && !raw.includes('..');
}

export function fmpQuoteSymbol(deskSymbol: string): string | null {
  const key = deskSymbol.trim().toUpperCase().replace(/\s+/g, '');
  if (!key || !isSafeTicker(key)) return null;
  const compact = key.replace(/\//g, '');

  if (FMP_QUOTE_SYMBOL[key]) return FMP_QUOTE_SYMBOL[key];
  if (FMP_QUOTE_SYMBOL[compact]) return FMP_QUOTE_SYMBOL[compact];

  const aliased = historySymbol(compact).symbol.toUpperCase().replace(/\//g, '');
  if (FMP_QUOTE_SYMBOL[aliased]) return FMP_QUOTE_SYMBOL[aliased];

  const asset = getRegistryAsset(compact) || getRegistryAsset(key);
  if (asset) {
    if (FMP_QUOTE_SYMBOL[asset.symbol]) return FMP_QUOTE_SYMBOL[asset.symbol];
    if (asset.category === 'forex') return asset.symbol;
    if (asset.category === 'crypto') {
      return asset.symbol.endsWith('USDT') ? asset.symbol.replace(/USDT$/, 'USD') : asset.symbol;
    }
    if (asset.category === 'stocks') return asset.symbol;
    if (asset.category === 'indices') return aliased || asset.symbol;
    if (asset.category === 'bonds') return FMP_QUOTE_SYMBOL[asset.symbol] || aliased;
    if (asset.category === 'metals' || asset.category === 'commodities') {
      return FMP_QUOTE_SYMBOL[asset.symbol] || asset.symbol;
    }
  }

  if (aliased && aliased !== compact && isSafeTicker(aliased)) return aliased;
  return compact;
}

/** Every enabled registry row must have an FMP proxy id. */
export function fmpSymbolsForRegistry(): Record<string, string> {
  const out: Record<string, string> = {};
  for (const asset of getEnabledAssets()) {
    const mapped = fmpQuoteSymbol(asset.symbol);
    if (mapped) out[asset.symbol] = mapped;
  }
  return out;
}

export function fmpChartInterval(twelveInterval: string): { kind: 'intraday'; path: string } | { kind: 'eod' } {
  const v = (twelveInterval || '').toLowerCase();
  if (v === '1min' || v === '1m') return { kind: 'intraday', path: '1min' };
  if (v === '5min' || v === '5m') return { kind: 'intraday', path: '5min' };
  if (v === '15min' || v === '15m') return { kind: 'intraday', path: '15min' };
  if (v === '30min' || v === '30m') return { kind: 'intraday', path: '30min' };
  if (v === '1h' || v === '1hour' || v === '60min' || v === '2h') return { kind: 'intraday', path: '1hour' };
  if (v === '4h' || v === '4hour') return { kind: 'intraday', path: '4hour' };
  return { kind: 'eod' };
}

export function normalizeFmpQuote(row: Record<string, unknown>, deskSymbol: string): Record<string, string> | null {
  const price = Number(row.price ?? row.close);
  if (!Number.isFinite(price) || price <= 0) return null;
  const prev = Number(row.previousClose ?? row.previous_close);
  const pct = Number(row.changesPercentage ?? row.changePercentage ?? row.percent_change);
  return {
    symbol: deskSymbol,
    name: String(row.name || deskSymbol),
    close: String(price),
    price: String(price),
    previous_close: Number.isFinite(prev) ? String(prev) : String(price),
    percent_change: Number.isFinite(pct) ? String(pct) : '0',
    vendor: 'FMP',
  };
}

export function normalizeFmpCandles(raw: unknown, deskSymbol: string, interval: string, limit: number): {
  meta: { symbol: string; interval: string };
  values: Array<{ datetime: string; open: string; high: string; low: string; close: string; volume: string }>;
  status: 'ok';
  vendor: 'FMP';
} | null {
  const rows = Array.isArray(raw) ? raw : Array.isArray((raw as { historical?: unknown })?.historical)
    ? ((raw as { historical: unknown[] }).historical)
    : [];
  const values: Array<{ datetime: string; open: string; high: string; low: string; close: string; volume: string }> = [];
  for (const item of rows) {
    if (!item || typeof item !== 'object') continue;
    const row = item as Record<string, unknown>;
    const open = Number(row.open);
    const high = Number(row.high);
    const low = Number(row.low);
    const close = Number(row.close);
    if (![open, high, low, close].every((n) => Number.isFinite(n))) continue;
    const dt = String(row.date ?? row.datetime ?? '');
    if (!dt) continue;
    values.push({
      datetime: dt,
      open: String(open),
      high: String(high),
      low: String(low),
      close: String(close),
      volume: Number.isFinite(Number(row.volume)) ? String(row.volume) : '0',
    });
  }
  if (!values.length) return null;
  values.sort((a, b) => new Date(b.datetime).getTime() - new Date(a.datetime).getTime());
  return {
    meta: { symbol: deskSymbol, interval },
    values: values.slice(0, Math.max(1, limit)),
    status: 'ok',
    vendor: 'FMP',
  };
}

async function fmpGet(url: string): Promise<unknown> {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetch(url, { signal: controller.signal, redirect: 'error' });
    if (!res.ok) throw new Error(`FMP HTTP ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(t);
  }
}

export async function fetchFmpQuote(deskSymbol: string): Promise<Record<string, string> | null> {
  const map = await fetchFmpQuotes([deskSymbol]);
  return map[deskSymbol] ?? null;
}

export async function fetchFmpQuotes(deskSymbols: string[]): Promise<Record<string, Record<string, string>>> {
  const apiKey = getFmpApiKey();
  const out: Record<string, Record<string, string>> = {};
  if (!apiKey || deskSymbols.length === 0) return out;

  const rows = deskSymbols
    .map((desk) => ({ desk, fmp: fmpQuoteSymbol(desk) }))
    .filter((row): row is { desk: string; fmp: string } => Boolean(row.fmp));
  if (!rows.length) return out;

  const uniqueFmp = [...new Set(rows.map((r) => r.fmp))];
  const byFmp = new Map<string, Record<string, unknown>>();

  for (let i = 0; i < uniqueFmp.length; i += 20) {
    const chunk = uniqueFmp.slice(i, i + 20);
    const url = `${FMP_STABLE}/quote?symbol=${encodeURIComponent(chunk.join(','))}&apikey=${encodeURIComponent(apiKey)}`;
    try {
      const data = await fmpGet(url);
      const list = Array.isArray(data) ? data : data && typeof data === 'object' ? [data] : [];
      for (const item of list) {
        if (!item || typeof item !== 'object') continue;
        const rec = item as Record<string, unknown>;
        const id = String(rec.symbol || '').toUpperCase();
        if (!id) continue;
        byFmp.set(id, rec);
        byFmp.set(id.replace(/^\^/, ''), rec);
      }
    } catch {
      /* try remaining chunks */
    }
  }

  for (const row of rows) {
    const want = row.fmp.toUpperCase();
    const rec = byFmp.get(want) || byFmp.get(want.replace(/^\^/, ''));
    if (!rec) continue;
    const normalized = normalizeFmpQuote(rec, row.desk);
    if (normalized) out[row.desk] = normalized;
  }
  return out;
}

export async function fetchFmpCandles(
  deskSymbol: string,
  twelveInterval: string,
  limit: number,
): Promise<ReturnType<typeof normalizeFmpCandles>> {
  const apiKey = getFmpApiKey();
  const mapped = fmpQuoteSymbol(deskSymbol);
  if (!apiKey || !mapped) return null;
  const interval = fmpChartInterval(twelveInterval);
  const cap = Math.min(Math.max(limit || 100, 1), 1000);
  const url = interval.kind === 'eod'
    ? `${FMP_STABLE}/historical-price-eod?symbol=${encodeURIComponent(mapped)}&limit=${cap}&apikey=${encodeURIComponent(apiKey)}`
    : `${FMP_STABLE}/historical-chart/${interval.path}?symbol=${encodeURIComponent(mapped)}&apikey=${encodeURIComponent(apiKey)}`;
  try {
    const data = await fmpGet(url);
    return normalizeFmpCandles(data, deskSymbol, twelveInterval, cap);
  } catch {
    return null;
  }
}
