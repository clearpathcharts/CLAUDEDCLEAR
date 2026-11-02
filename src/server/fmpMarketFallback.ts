/**
 * Second-layer market data: Financial Modeling Prep after Twelve Data.
 * Same-instrument proxies only. Never fabricates prices. Never swaps spot for
 * futures (or index for ETF) just to keep a chart populated — missing FMP
 * cells stay unavailable.
 */
import { getEnabledAssets, getRegistryAsset } from '../constants/assetRegistry';
import {
  buildProvenance,
  forbiddenSubstitutionReason,
  isForbiddenPriceSubstitution,
  type InstrumentProvenance,
} from '../lib/instrumentIntegrity';
import { historySymbol } from '../lib/institutional/vendorMaps';
import { getFmpApiKey } from './secrets';

const FMP_STABLE = 'https://financialmodelingprep.com/stable';

/**
 * Same-instrument FMP ids only.
 * Spot metals / energy / DXY must NOT map to futures tickers (GCUSD, CLUSD, …).
 * Cash-index → ETF (SPX→SPY) is also refused for price fallback — different exposure.
 */
export const FMP_QUOTE_SYMBOL: Record<string, string> = {
  VIX: '^VIX',
  US10Y: '^TNX',
  US30Y: '^TYX',
};

function isSafeTicker(raw: string): boolean {
  return /^[A-Z0-9./^=-]{1,24}$/.test(raw) && !raw.includes('..');
}

function acceptFmpId(deskSymbol: string, candidate: string | null | undefined): string | null {
  if (!candidate) return null;
  const id = candidate.trim().toUpperCase();
  if (!id || !isSafeTicker(id)) return null;
  if (isForbiddenPriceSubstitution(deskSymbol, id)) return null;
  // Refuse cash-index → ETF silent swaps on the FMP path.
  const desk = deskSymbol.trim().toUpperCase().replace(/\//g, '');
  if ((desk === 'SPX' || desk === 'NDX' || desk === 'DJI') && /^(SPY|QQQ|DIA)$/.test(id.replace(/\//g, ''))) {
    return null;
  }
  return id;
}

export function fmpQuoteSymbol(deskSymbol: string): string | null {
  const key = deskSymbol.trim().toUpperCase().replace(/\s+/g, '');
  if (!key || !isSafeTicker(key)) return null;
  const compact = key.replace(/\//g, '');

  const fromTable = acceptFmpId(key, FMP_QUOTE_SYMBOL[key] || FMP_QUOTE_SYMBOL[compact]);
  if (fromTable) return fromTable;

  const aliased = historySymbol(compact).symbol.toUpperCase().replace(/\//g, '');
  const fromAliasTable = acceptFmpId(key, FMP_QUOTE_SYMBOL[aliased]);
  if (fromAliasTable) return fromAliasTable;

  const asset = getRegistryAsset(compact) || getRegistryAsset(key);
  if (asset) {
    const fromAssetTable = acceptFmpId(key, FMP_QUOTE_SYMBOL[asset.symbol]);
    if (fromAssetTable) return fromAssetTable;
    if (asset.category === 'forex') return acceptFmpId(key, asset.symbol);
    if (asset.category === 'crypto') {
      const cryptoId = asset.symbol.endsWith('USDT')
        ? asset.symbol.replace(/USDT$/, 'USD')
        : asset.symbol;
      return acceptFmpId(key, cryptoId);
    }
    if (asset.category === 'stocks') return acceptFmpId(key, asset.symbol);
    if (asset.category === 'bonds') {
      return acceptFmpId(key, FMP_QUOTE_SYMBOL[asset.symbol] || null);
    }
    // Metals / commodities: try the desk's own symbol only (never futures stand-ins).
    if (asset.category === 'metals' || asset.category === 'commodities') {
      return acceptFmpId(key, asset.symbol);
    }
    // Indices: only explicit same-instrument table entries (VIX, yields). No SPX→SPY.
    if (asset.category === 'indices') {
      return acceptFmpId(key, FMP_QUOTE_SYMBOL[asset.symbol] || null);
    }
  }

  // Same compact ticker only — never an aliased different instrument.
  return acceptFmpId(key, compact);
}

/** Why FMP will not price this desk symbol (null when a same-instrument id exists). */
export function fmpPriceRefusal(deskSymbol: string): string | null {
  const key = deskSymbol.trim().toUpperCase().replace(/\s+/g, '');
  if (fmpQuoteSymbol(key)) return null;
  const banned = ['GCUSD', 'SIUSD', 'CLUSD', 'BZUSD', 'NGUSD', 'HGUSD', 'DXUSD', 'SPY', 'QQQ', 'DIA'];
  for (const sub of banned) {
    const reason = forbiddenSubstitutionReason(key, sub);
    if (reason) return reason;
  }
  return 'No same-instrument FMP symbol for this ticker.';
}

/**
 * Same-instrument FMP ids for registry rows that have one.
 * Metals/commodities without an FMP spot ticker are omitted (honest gap).
 */
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

export type FmpNormalizedQuote = {
  symbol: string;
  name: string;
  close: string;
  price: string;
  vendor: 'FMP';
  previous_close?: string;
  percent_change?: string;
  provenance: InstrumentProvenance;
};

export function normalizeFmpQuote(
  row: Record<string, unknown>,
  deskSymbol: string,
  providerSymbol?: string,
): FmpNormalizedQuote | null {
  const price = Number(row.price ?? row.close);
  if (!Number.isFinite(price) || price <= 0) return null;
  const mapped = providerSymbol || fmpQuoteSymbol(deskSymbol) || deskSymbol;
  if (isForbiddenPriceSubstitution(deskSymbol, mapped)) return null;
  const prev = Number(row.previousClose ?? row.previous_close);
  const pct = Number(row.changesPercentage ?? row.changePercentage ?? row.percent_change);
  const exchange = row.exchange != null ? String(row.exchange) : null;
  const provenance = buildProvenance({
    requestedSymbol: deskSymbol,
    provider: 'fmp',
    providerSymbol: mapped,
    exchange,
    currency: row.currency != null ? String(row.currency) : null,
    priceSource: `fmp:${mapped}`,
    isFallback: true,
    isProxy: false,
    delayed: null,
  });
  const out: FmpNormalizedQuote = {
    symbol: deskSymbol,
    name: String(row.name || deskSymbol),
    close: String(price),
    price: String(price),
    vendor: 'FMP',
    provenance,
  };
  if (Number.isFinite(prev) && prev > 0) out.previous_close = String(prev);
  if (Number.isFinite(pct)) out.percent_change = String(pct);
  return out;
}

export function normalizeFmpCandles(raw: unknown, deskSymbol: string, interval: string, limit: number): {
  meta: { symbol: string; interval: string };
  values: Array<{ datetime: string; open: string; high: string; low: string; close: string; volume: string }>;
  status: 'ok';
  vendor: 'FMP';
  provenance: InstrumentProvenance;
} | null {
  const mapped = fmpQuoteSymbol(deskSymbol);
  if (!mapped) return null;
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
    provenance: buildProvenance({
      requestedSymbol: deskSymbol,
      provider: 'fmp',
      providerSymbol: mapped,
      priceSource: `fmp:${mapped}`,
      isFallback: true,
      isProxy: false,
    }),
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

export async function fetchFmpQuote(deskSymbol: string): Promise<FmpNormalizedQuote | null> {
  const map = await fetchFmpQuotes([deskSymbol]);
  return map[deskSymbol] ?? null;
}

export async function fetchFmpQuotes(deskSymbols: string[]): Promise<Record<string, FmpNormalizedQuote>> {
  const apiKey = getFmpApiKey();
  const out: Record<string, FmpNormalizedQuote> = {};
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
    const normalized = normalizeFmpQuote(rec, row.desk, row.fmp);
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
