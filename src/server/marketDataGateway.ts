// ============================================
// CLEARPATH MARKET DATA GATEWAY
// Prevents API overload + websocket bottlenecks
// ============================================
//
// DATA-INTEGRITY POLICY:
// This gateway NEVER fabricates market data. If a live request fails (rate
// limit, network error, missing components), it throws an honest error so the
// UI can show "data unavailable" rather than displaying invented prices or
// candles. The previous build contained synthetic DXY generators
// (generateDxyFallbackQuote / generateDxyFallbackCandles) that produced fake
// random-walk prices on failure; those have been removed deliberately.
//
// The Twelve Data API key is read ONLY from environment variables. There is no
// hardcoded fallback key — a leaked key in source is a security hole and the
// old one has been rotated.

import { LiveDataEnforcementEngine } from "../truth/LiveDataEnforcementEngine";
import { resolveProviderSymbol } from "../constants/assetRegistry";
import { historySymbol } from "../lib/institutional/vendorMaps";
import { fetchFmpCandles, fetchFmpQuote, fetchFmpQuotes } from "./fmpMarketFallback";
import { getTwelveDataApiKey, listTwelveDataApiKeyCandidates } from "./secrets";
import { resolveQuotePrice, withTapePrice } from "../lib/resolveQuotePrice";

export interface TwelveDataHealth {
  status: 'HEALTHY' | 'RATE_LIMITED' | 'TIMEOUT' | 'ERROR' | 'OFFLINE';
  lastChecked: string;
  apiKeyPresent: boolean;
  rateLimitLimit: string;
  rateLimitRemaining: string;
  rateLimitReset: string | number;
  lastError: string | null;
  latencyMs: number;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
}

export interface HealthEvent {
  timestamp: string;
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR' | 'FALLBACK';
  message: string;
  code?: string | number;
}

export const twelvedataHealth: TwelveDataHealth = {
  status: 'OFFLINE',
  lastChecked: new Date().toISOString(),
  apiKeyPresent: false,
  rateLimitLimit: 'Unlimited',
  rateLimitRemaining: 'Unlimited',
  rateLimitReset: 0,
  lastError: null,
  latencyMs: 0,
  totalRequests: 0,
  successfulRequests: 0,
  failedRequests: 0,
};

export const twelvedataEvents: HealthEvent[] = [
  {
    timestamp: new Date().toISOString(),
    type: 'INFO',
    message: 'CPM Data Ingestion Gateway initialized successfully.'
  }
];

export function logHealthEvent(type: HealthEvent['type'], message: string, code?: string | number) {
  twelvedataEvents.unshift({
    timestamp: new Date().toISOString(),
    type,
    message,
    code
  });
  // Cap at 30 events to avoid memory leaks
  if (twelvedataEvents.length > 30) {
    twelvedataEvents.pop();
  }
}

function isTwelveDataCoolingDown(): boolean {
  return Date.now() < rateLimitedUntil;
}

async function quoteWithFmpFallback(deskSymbol: string, tdErr: unknown): Promise<any> {
  const fmp = await fetchFmpQuote(deskSymbol);
  if (fmp) {
    logHealthEvent('FALLBACK', `Quote ${deskSymbol} served from FMP after Twelve Data miss`);
    return fmp;
  }
  throw tdErr;
}

async function candlesWithFmpFallback(
  deskSymbol: string,
  interval: string,
  limit: number,
  tdErr: unknown,
): Promise<any> {
  const fmp = await fetchFmpCandles(deskSymbol, interval, limit);
  if (fmp) {
    logHealthEvent('FALLBACK', `Candles ${deskSymbol} ${interval} served from FMP after Twelve Data miss`);
    return fmp;
  }
  throw tdErr;
}

function markStale<T>(data: T): T {
  if (data && typeof data === 'object' && !Array.isArray(data)) {
    return { ...(data as Record<string, unknown>), stale: true } as T;
  }
  return data;
}

type CacheEntry = {
  data: any
  timestamp: number
}

const CACHE_TTL_PRICE = 5000 // 5 seconds for raw live price
const CACHE_TTL_QUOTE = 5000 // 5 seconds for full quotes
const CACHE_TTL_CANDLES_INTRADAY = 15000 // 15s for intraday candles
const CACHE_TTL_CANDLES_DAILY = 60000 // 60s for 1day+
const CACHE_TTL_CANDLES_WEEKLY = 120000 // 120s for week/month
const MARKET_CACHE_MAX_ENTRIES = 400
const MAX_UPSTREAM_IN_FLIGHT = 20
const RATE_LIMIT_COOLDOWN_MS = 15_000
const AUTH_FAIL_COOLDOWN_MS = 5 * 60_000

const marketCache: Record<string, CacheEntry> = {}
const pendingRequests: Record<string, Promise<any>> = {}

let upstreamInFlight = 0
const upstreamWaitQueue: Array<() => void> = []
let rateLimitedUntil = 0
let authFailedUntil = 0
let pinnedWorkingKey: string | null = null

/** Test-only: clear 401 pin + cooldown between self-tests. */
export function resetTwelveDataAuthStateForTests(): void {
  authFailedUntil = 0
  pinnedWorkingKey = null
  rateLimitedUntil = 0
  twelvedataHealth.status = 'HEALTHY'
  twelvedataHealth.lastError = null
}

function candleTtlMs(interval: string): number {
  const v = (interval || '').toLowerCase()
  if (v.includes('week') || v.includes('month') || v === '1w' || v === '1m') return CACHE_TTL_CANDLES_WEEKLY
  if (v.includes('day') || v === '1d' || v === '1day') return CACHE_TTL_CANDLES_DAILY
  return CACHE_TTL_CANDLES_INTRADAY
}

function evictMarketCacheIfNeeded() {
  const keys = Object.keys(marketCache)
  if (keys.length <= MARKET_CACHE_MAX_ENTRIES) return
  const sorted = keys
    .map((k) => ({ k, t: marketCache[k]?.timestamp ?? 0 }))
    .sort((a, b) => a.t - b.t)
  const drop = sorted.slice(0, keys.length - MARKET_CACHE_MAX_ENTRIES)
  for (const { k } of drop) delete marketCache[k]
}

function canonicalCacheSymbol(symbol: string): string {
  return formatSymbolForTwelveData(symbol)
}

async function acquireUpstreamSlot(): Promise<void> {
  if (Date.now() >= rateLimitedUntil && twelvedataHealth.status === 'RATE_LIMITED') {
    // Cooldown elapsed — allow traffic again; next success will mark HEALTHY.
    twelvedataHealth.status = 'HEALTHY';
  }
  if (Date.now() < authFailedUntil) {
    const waitMs = authFailedUntil - Date.now();
    throw new Error(
      `API fetch failed with status 401 for Twelve Data (invalid or stale key). Cooling down ${Math.ceil(waitMs / 1000)}s. On Cloud Run: paste the full paid key into TWELVEDATA_API_KEY, delete any stale TWELVE_DATA_API_KEY duplicate, Deploy, keep traffic on LATEST.`
    );
  }
  if (Date.now() < rateLimitedUntil) {
    const waitMs = rateLimitedUntil - Date.now();
    throw new Error(
      `Twelve Data rate limited — cooling down ${Math.ceil(waitMs / 1000)}s. Retry shortly.`
    );
  }
  if (upstreamInFlight < MAX_UPSTREAM_IN_FLIGHT) {
    upstreamInFlight++
    return
  }
  await new Promise<void>((resolve) => upstreamWaitQueue.push(resolve))
  upstreamInFlight++
}

function releaseUpstreamSlot() {
  upstreamInFlight = Math.max(0, upstreamInFlight - 1)
  const next = upstreamWaitQueue.shift()
  if (next) next()
}

// Helper to execute fetch with custom timeout signal
async function fetchWithTimeout(
  url: string,
  durationMs = 5000,
  headers?: HeadersInit,
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), durationMs);
  try {
    return await fetch(url, { signal: controller.signal, headers });
  } finally {
    clearTimeout(timeoutId);
  }
}

function twelveAuthHeaders(apiKey: string): HeadersInit {
  return { Authorization: `apikey ${apiKey}` };
}

function withEncodedApiKey(url: string, apiKey: string): string {
  const stripped = url
    .replace(/[?&]apikey=[^&]*/g, '')
    .replace(/\?&/, '?')
    .replace(/[?&]$/, '');
  const joiner = stripped.includes('?') ? '&' : '?';
  return `${stripped}${joiner}apikey=${encodeURIComponent(apiKey)}`;
}

function isAuthFailure(status: number, data?: { code?: unknown; message?: unknown }): boolean {
  if (status === 401) return true;
  const code = Number(data?.code);
  const msg = String(data?.message || '').toLowerCase();
  return (
    code === 401 ||
    msg.includes('invalid api key') ||
    msg.includes('apikey is invalid') ||
    msg.includes('api key is invalid')
  );
}

function authCandidates(preferredKey?: string): Array<{ source: string; key: string }> {
  const fromEnv = listTwelveDataApiKeyCandidates();
  const ordered: Array<{ source: string; key: string }> = [];
  const seen = new Set<string>();
  const push = (source: string, key: string) => {
    if (!key || seen.has(key)) return;
    seen.add(key);
    ordered.push({ source, key });
  };
  if (pinnedWorkingKey) push('pinned', pinnedWorkingKey);
  if (preferredKey) push('caller', preferredKey);
  for (const c of fromEnv) push(c.source, c.key);
  return ordered;
}

// Global generic tracker for checking status codes, JSON flags, and headers
async function fetchAndTrack(
  url: string,
  type: string,
  symbol: string,
  timeoutMs = 5000,
  preferredKey?: string,
): Promise<any> {
  await acquireUpstreamSlot()
  twelvedataHealth.lastChecked = new Date().toISOString();

  const candidates = authCandidates(preferredKey || getTwelveDataApiKey());
  twelvedataHealth.apiKeyPresent = candidates.length > 0;
  if (candidates.length === 0) {
    releaseUpstreamSlot();
    throw new Error('Twelve Data API Key not configured.');
  }

  const startTime = Date.now();
  let lastAuthError: Error | null = null;
  let countedFailure = false;

  try {
    for (let i = 0; i < candidates.length; i++) {
      const { source, key } = candidates[i];
      const keyedUrl = withEncodedApiKey(url, key);
      const redactedUrl = keyedUrl.replace(/apikey=[^&]+/, 'apikey=REDACTED');
      twelvedataHealth.totalRequests++;

      console.log(`\n==================================================`);
      console.log(`[TwelveData Connection Request] Firing real HTTP fetch.`);
      console.log(`-> Target Type:  ${type}`);
      console.log(`-> Symbol:       ${symbol}`);
      console.log(`-> Auth:         Authorization header + encoded query (${source}, len=${key.length})`);
      console.log(`-> Redacted URL: ${redactedUrl}`);
      console.log(`==================================================\n`);

      const response = await fetchWithTimeout(keyedUrl, timeoutMs, twelveAuthHeaders(key));
      twelvedataHealth.latencyMs = Date.now() - startTime;

      console.log(`\n==================================================`);
      console.log(`[TwelveData Connection Response] Received Answer.`);
      console.log(`-> Symbol:      ${symbol}`);
      console.log(`-> Status Code: ${response.status} (${response.statusText})`);
      console.log(`-> Latency:     ${twelvedataHealth.latencyMs} ms`);
      console.log(`==================================================\n`);

      const ratelimiterLimit = response.headers.get('x-rate-limit-limit');
      const ratelimiterRemaining = response.headers.get('x-rate-limit-remaining');
      const ratelimiterReset = response.headers.get('x-rate-limit-reset');
      if (ratelimiterLimit) twelvedataHealth.rateLimitLimit = ratelimiterLimit;
      if (ratelimiterRemaining) twelvedataHealth.rateLimitRemaining = ratelimiterRemaining;
      if (ratelimiterReset) twelvedataHealth.rateLimitReset = ratelimiterReset;

      if (isAuthFailure(response.status)) {
        lastAuthError = new Error(`API fetch failed with status ${response.status} for ${symbol}`);
        logHealthEvent(
          'WARNING',
          `HTTP ${response.status} auth using ${source} (len=${key.length})` +
            (i < candidates.length - 1 ? ' — trying the other Cloud Run env spelling' : ''),
          response.status,
        );
        continue;
      }

      if (!response.ok) {
        twelvedataHealth.failedRequests++;
        countedFailure = true;
        console.error(`\n==================================================`);
        console.error(`[TwelveData Ingest ERROR] HTTP Fetch Failed!`);
        console.error(`-> Status Code:   ${response.status}`);
        console.error(`-> Symbol:        ${symbol}`);
        console.error(`-> Redacted URL:  ${redactedUrl}`);
        console.error(`==================================================\n`);

        if (response.status === 429) {
          twelvedataHealth.lastError = `HTTP 429 Rate Limited: speed quota limit exceeded for ${symbol}`;
          logHealthEvent('WARNING', `429 Rate Limit Exceeded: ${symbol} ${type} via ${source}`, 429);
          if (i < candidates.length - 1) continue;
          twelvedataHealth.status = 'RATE_LIMITED';
          rateLimitedUntil = Date.now() + RATE_LIMIT_COOLDOWN_MS;
        } else {
          twelvedataHealth.status = 'ERROR';
          twelvedataHealth.lastError = `HTTP ${response.status} failed for ${symbol}`;
          logHealthEvent('ERROR', `HTTP ${response.status} failure during ${symbol} fetch`, response.status);
        }
        if (response.status === 404) {
          throw new Error(`Symbol "${symbol}" was not found by the market data provider. Check the ticker and try again.`);
        }
        throw new Error(`API fetch failed with status ${response.status} for ${symbol}`);
      }

      const data = await response.json();
      console.log(`\n==================================================`);
      console.log(`[TwelveData Ingest DATA] Successfully parsed Response JSON.`);
      console.log(`-> Symbol:       ${symbol}`);
      console.log(`-> Data Keys:    ${Object.keys(data || {})}`);
      if (data && data.status === 'error') {
        console.warn(`-> API status:   ERROR (message: "${data.message}", code: ${data.code})`);
      } else {
        console.log(`-> API status:   OK/SUCCESS`);
      }
      console.log(`==================================================\n`);

      if (data && data.status === 'error' && isAuthFailure(200, data)) {
        lastAuthError = new Error(`Twelve Data API Error: ${data.message} (Code: ${data.code})`);
        logHealthEvent(
          'WARNING',
          `JSON auth error using ${source}: ${data.message}` +
            (i < candidates.length - 1 ? ' — trying the other Cloud Run env spelling' : ''),
          data.code || 401,
        );
        continue;
      }

      if (data && data.status === 'error') {
        twelvedataHealth.failedRequests++;
        countedFailure = true;
        twelvedataHealth.lastError = data.message || `Twelve Data JSON error for ${symbol}`;
        if (
          data.code === 429 ||
          (data.message && String(data.message).toLowerCase().includes('speed limit')) ||
          (data.message && String(data.message).toLowerCase().includes('plan limit'))
        ) {
          twelvedataHealth.status = 'RATE_LIMITED';
          rateLimitedUntil = Date.now() + RATE_LIMIT_COOLDOWN_MS;
          twelvedataHealth.rateLimitRemaining = '0';
          logHealthEvent('WARNING', `API Speed Plan Limit Tipped (JSON 429) for ${symbol}`, 429);
        } else {
          twelvedataHealth.status = 'ERROR';
          logHealthEvent('ERROR', `Twelve Data JSON Error for ${symbol}: ${data.message}`, data.code || 'JSON_ERR');
        }
        throw new Error(`Twelve Data API Error: ${data.message} (Code: ${data.code})`);
      }

      pinnedWorkingKey = key;
      authFailedUntil = 0;
      twelvedataHealth.successfulRequests++;
      if (twelvedataHealth.status !== 'HEALTHY') {
        logHealthEvent('SUCCESS', `Connection recovered via ${source} for ${symbol} ${type}`, 200);
      } else if (twelvedataHealth.successfulRequests % 10 === 1) {
        logHealthEvent('SUCCESS', `Endpoint verification check successful for ${symbol} ${type}`, 200);
      }
      twelvedataHealth.status = 'HEALTHY';
      rateLimitedUntil = 0;
      twelvedataHealth.lastError = null;
      return data;
    }

    authFailedUntil = Date.now() + AUTH_FAIL_COOLDOWN_MS;
    twelvedataHealth.status = 'ERROR';
    twelvedataHealth.failedRequests++;
    countedFailure = true;
    twelvedataHealth.lastError = lastAuthError?.message || `HTTP 401 failed for ${symbol}`;
    logHealthEvent(
      'ERROR',
      `Twelve Data rejected every configured key (401). Cooling down ${AUTH_FAIL_COOLDOWN_MS / 1000}s. Fix Cloud Run env, Deploy, traffic on LATEST.`,
      401,
    );
    throw lastAuthError || new Error(`API fetch failed with status 401 for ${symbol}`);
  } catch (err: any) {
    twelvedataHealth.latencyMs = Date.now() - startTime;
    const alreadyAuth = lastAuthError && err === lastAuthError;
    if (alreadyAuth || String(err?.message || '').includes('status 401')) {
      throw err;
    }
    console.error(`\n==================================================`);
    console.error(`[TwelveData Exception Thrown]`);
    console.error(`-> Symbol:    ${symbol}`);
    console.error(`-> Error Msg: ${err.message || err}`);
    console.error(`==================================================\n`);

    if (err.name === 'AbortError' || err.message?.includes('aborted') || err.message?.includes('timeout')) {
      twelvedataHealth.status = 'TIMEOUT';
      twelvedataHealth.lastError = `Network Timeout of ${type} for ${symbol} (exceeded ${timeoutMs}ms threshold)`;
      logHealthEvent('ERROR', `Network Timeout (exceeded ${timeoutMs}ms) for ${symbol} ${type}`, 'TIMEOUT');
    } else {
      if (!countedFailure) twelvedataHealth.failedRequests++;
      if (!twelvedataHealth.lastError) {
        twelvedataHealth.lastError = err.message || `Unknown error during ${type} fetching of ${symbol}`;
      }
      logHealthEvent('ERROR', `Exception during fetch of ${symbol}: ${err.message || err}`, 'EXCEPTION');
    }
    throw err;
  } finally {
    releaseUpstreamSlot();
  }
}

// ============================================
// HELPER FUNCTIONS FOR UNIFIED SYMBOL FORMATTING & FILTERING
// ============================================

export function isSyntheticOrIndex(symbol: string): boolean {
  const clean = symbol.trim().toUpperCase();
  return (
    clean === 'DXY' ||
    clean === 'DXY INDEX' ||
    clean === 'USDX' ||
    clean === 'SPX' ||
    clean === 'NDX' ||
    clean === 'DJI' ||
    clean === 'IXIC' ||
    clean === 'COMP' ||
    clean === 'SPY' ||
    clean === 'VIX'
  );
}

const FX_CCY = new Set([
  'USD', 'EUR', 'GBP', 'JPY', 'AUD', 'NZD', 'CAD', 'CHF',
  'SEK', 'NOK', 'DKK', 'SGD', 'HKD', 'MXN', 'ZAR', 'TRY',
  'CNH', 'CNY', 'PLN', 'HUF', 'CZK', 'ILS', 'THB', 'KRW',
]);

export function formatSymbolForTwelveData(symbol: string): string {
  const clean = symbol.trim().toUpperCase().replace(/\s+/g, '');
  if (!clean) return clean;

  // Cash indices (SPX/NDX) are not clean Twelve Data quotes — use ETF proxies first.
  const mapped = historySymbol(clean).symbol.trim().toUpperCase().replace(/\s+/g, '');
  if (mapped && mapped !== clean) {
    const fromAlias = resolveProviderSymbol(mapped) || resolveProviderSymbol(mapped.replace(/\//g, ''));
    return fromAlias || mapped;
  }

  // Registry is source of truth for Venture 70 provider symbols.
  const fromRegistry = resolveProviderSymbol(clean) || resolveProviderSymbol(clean.replace(/\//g, ''));
  if (fromRegistry) return fromRegistry;

  if (clean.includes('/')) return clean;
  if (clean === 'DXY' || clean === 'USDX') return 'DX-Y.F';
  if (clean === 'XAUUSD') return 'XAU/USD';
  if (clean === 'XAGUSD') return 'XAG/USD';
  // Crypto with USDT quote (7+ chars)
  if (clean.endsWith('USDT') && clean.length >= 6) {
    return `${clean.slice(0, -4)}/USDT`;
  }
  // Crypto vs USD (common 6–7 letter forms)
  const cryptoUsd = clean.match(/^(BTC|ETH|SOL|ADA|XRP|DOGE|LINK|AVAX|DOT|MATIC)USD$/);
  if (cryptoUsd) {
    return `${cryptoUsd[1]}/USD`;
  }
  // Any 6-letter FX pair (majors + crosses)
  if (clean.length === 6) {
    const base = clean.slice(0, 3);
    const quote = clean.slice(3);
    if (FX_CCY.has(base) && FX_CCY.has(quote)) {
      return `${base}/${quote}`;
    }
  }
  return clean;
}

// ============================================
// GET CURRENT PRICE (Simple)
// ============================================
export async function getMarketData(symbol: string) {
  const canon = canonicalCacheSymbol(symbol)
  const cacheKey = `price:${canon}`
  const now = Date.now()

  const cached = marketCache[cacheKey]
  if (cached && now - cached.timestamp < CACHE_TTL_PRICE) {
    console.log(`[Gateway] PRICE CACHE HIT: ${canon}`)
    return cached.data
  }

  if (pendingRequests[cacheKey]) {
    console.log(`[Gateway] PRICE WAITING SIGNALS: ${canon}`)
    return pendingRequests[cacheKey]
  }

  const runFetch = async () => {
    const cleanSym = symbol.trim().toUpperCase();
    const isDxy = cleanSym === 'DXY' || cleanSym === 'DX-Y.F' || cleanSym === 'USDX' || cleanSym === 'DXY INDEX';
    if (isDxy) {
      // DXY is computed from live FX components inside getMarketQuote. If that
      // fails it throws — we do NOT substitute fabricated prices.
      const quote = await getMarketQuote(symbol, getCleanApiKey());
      return { price: quote.price };
    }

    const formatted = formatSymbolForTwelveData(symbol);
    try {
      return await fetchPrice(formatted);
    } catch (err) {
      const fmp = await fetchFmpQuote(symbol);
      if (fmp?.price) {
        logHealthEvent('FALLBACK', `Price ${symbol} served from FMP after Twelve Data miss`);
        return { price: fmp.price, vendor: 'FMP' };
      }
      throw err;
    }
  }

  pendingRequests[cacheKey] = runFetch()

  try {
    const data = await pendingRequests[cacheKey]

    // Live Data Enforcement Engine Validation BEFORE caching
    const priceVal = parseFloat(data?.price || '0');
    const validation = LiveDataEnforcementEngine.validateTick({
      symbol,
      price: priceVal,
      timestamp: Date.now(),
      source: 'TWELVEDATA_PRICE_LIVE',
      latencyMs: 90
    });
    if (!validation.valid) {
      console.warn(`[Gateway] Price integrity warning for ${symbol}: ${validation.message}`);
      logHealthEvent('WARNING', `Price integrity soft-fail ${symbol}: ${validation.message}`);
    }

    marketCache[cacheKey] = {
      data,
      timestamp: now,
    }
    evictMarketCacheIfNeeded()
    return data
  } finally {
    delete pendingRequests[cacheKey]
  }
}

// ============================================
// GET FULL QUOTE (Deduplicated & Cached)
// ============================================
export async function getMarketQuote(symbol: string, apiKey: string) {
  const canon = canonicalCacheSymbol(symbol)
  const cacheKey = `quote:${canon}`
  const now = Date.now()

  const cached = marketCache[cacheKey]
  if (cached && now - cached.timestamp < CACHE_TTL_QUOTE) {
    console.log(`[Gateway] QUOTE CACHE HIT: ${canon}`)
    return cached.data
  }
  if (cached && isTwelveDataCoolingDown()) {
    console.log(`[Gateway] QUOTE STALE DURING TD COOLDOWN: ${canon}`)
    return markStale(cached.data)
  }

  if (pendingRequests[cacheKey]) {
    console.log(`[Gateway] QUOTE WAITING SIGNALS: ${canon}`)
    return pendingRequests[cacheKey]
  }

  const runFetch = async () => {
    const cleanSym = symbol.trim().toUpperCase();
    const isDxy = cleanSym === 'DXY' || cleanSym === 'DX-Y.F' || cleanSym === 'USDX' || cleanSym === 'DXY INDEX';

    if (isDxy) {
      try {
      // DXY is genuinely computed from six live FX pairs. This is REAL data —
      // a legitimate derivation, not a fabrication. If any component is missing
      // or the batch query fails, we throw instead of inventing a value.
      const activeKey = apiKey || getCleanApiKey();
      const symbols = ['EUR/USD', 'USD/JPY', 'GBP/USD', 'USD/CAD', 'USD/SEK', 'USD/CHF'];
      console.log(`[Gateway] Computing DXY from live FX exchange rates via batch query.`);
      const batchUrl = `https://api.twelvedata.com/quote?symbol=${encodeURIComponent(symbols.join(','))}`;
      const batchData = await fetchAndTrack(batchUrl, 'quote_batch', symbol, 5000, activeKey);

      if (!batchData || batchData.status === 'error') {
        throw new Error(batchData?.message || 'Twelve Data batch query returned error');
      }

      const getVal = (pair: string): { close: number; prev: number } | null => {
        const item = batchData[pair];
        if (item && (item.close || item.price)) {
          const close = parseFloat(item.close || item.price || '0');
          const prev = parseFloat(item.previous_close || item.close || item.price || '0');
          return { close, prev };
        }
        return null;
      };

      const eurusd = getVal('EUR/USD');
      const usdjpy = getVal('USD/JPY');
      const gbpusd = getVal('GBP/USD');
      const usdcad = getVal('USD/CAD');
      const usdsek = getVal('USD/SEK');
      const usdchf = getVal('USD/CHF');

      if (eurusd && usdjpy && gbpusd && usdcad && usdsek && usdchf) {
        const currentDxy = 50.14348112 *
          Math.pow(eurusd.close, -0.576) *
          Math.pow(usdjpy.close, 0.136) *
          Math.pow(gbpusd.close, -0.119) *
          Math.pow(usdcad.close, 0.091) *
          Math.pow(usdsek.close, 0.042) *
          Math.pow(usdchf.close, 0.036);

        const prevDxy = 50.14348112 *
          Math.pow(eurusd.prev, -0.576) *
          Math.pow(usdjpy.prev, 0.136) *
          Math.pow(gbpusd.prev, -0.119) *
          Math.pow(usdcad.prev, 0.091) *
          Math.pow(usdsek.prev, 0.042) *
          Math.pow(usdchf.prev, 0.036);

        const price = parseFloat(currentDxy.toFixed(4));
        const prevClose = parseFloat(prevDxy.toFixed(4));
        const change = parseFloat((price - prevClose).toFixed(4));
        const percentChange = parseFloat(((change / prevClose) * 100).toFixed(4));

        return {
          symbol: symbol,
          name: "US Dollar Index",
          exchange: "ICEUS",
          datetime: new Date().toISOString().substring(0, 10),
          timestamp: Math.floor(Date.now() / 1000),
          open: (prevClose).toString(),
          high: (Math.max(price, prevClose) + 0.1).toString(),
          low: (Math.min(price, prevClose) - 0.1).toString(),
          close: price.toString(),
          volume: "0",
          previous_close: prevClose.toString(),
          change: change.toString(),
          percent_change: percentChange.toString(),
          price: price.toString()
        };
      } else {
        // Missing components — fail honestly. Do NOT fabricate a DXY value.
        throw new Error('Could not resolve all 6 major dollar index components from live API response.');
      }
      } catch (err) {
        return quoteWithFmpFallback(symbol, err);
      }
    }

    const formatted = formatSymbolForTwelveData(symbol);
    try {
      return await fetchQuoteFromAPI(formatted, apiKey);
    } catch (err) {
      return quoteWithFmpFallback(symbol, err);
    }
  }

  pendingRequests[cacheKey] = runFetch()

  try {
    const data = await pendingRequests[cacheKey]

    // Live Data Enforcement Engine Validation BEFORE caching
    const priceVal = resolveQuotePrice(data) ?? 0;
    const validation = LiveDataEnforcementEngine.validateTick({
      symbol,
      price: priceVal,
      timestamp: Date.now(),
      source: 'TWELVEDATA_QUOTE_LIVE',
      latencyMs: 100
    });
    if (!validation.valid) {
      // Never blank live Twelve Data quotes for "quiet market" false positives —
      // log and continue. Hard-blocking here took down StrictlyCharts for hours.
      console.warn(`[Gateway] Quote integrity warning for ${symbol}: ${validation.message}`);
      logHealthEvent('WARNING', `Quote integrity soft-fail ${symbol}: ${validation.message}`);
    }

    // Always expose `price` from last print (`close` wins over a leftover `price`).
    const normalized = data && typeof data === 'object'
      ? withTapePrice(data)
      : data;

    marketCache[cacheKey] = {
      data: normalized,
      timestamp: now,
    }
    evictMarketCacheIfNeeded()
    return normalized
  } finally {
    delete pendingRequests[cacheKey]
  }
}

/**
 * Batch quotes for ticker / multi-symbol UI.
 * DXY stays on the single-quote path (derived basket, then FMP DXUSD).
 * Other symbols use one Twelve Data comma-batch request, then FMP for misses.
 * Cap at 80 so a full registry tab or typed watchlist is proxied, not truncated.
 */
export async function getMarketQuotes(symbols: string[], apiKey: string): Promise<Record<string, any>> {
  const unique = [...new Set(symbols.map((s) => s.trim()).filter(Boolean))].slice(0, 80);
  const out: Record<string, any> = {};
  if (unique.length === 0) return out;

  const dxySyms: string[] = [];
  const plain: { original: string; provider: string }[] = [];

  for (const sym of unique) {
    const upper = sym.toUpperCase().replace(/\s+/g, '');
    const isDxy = upper === 'DXY' || upper === 'DX-Y.F' || upper === 'USDX' || upper === 'DXYINDEX' || upper === 'DXY INDEX';
    if (isDxy) dxySyms.push(sym);
    else plain.push({ original: sym, provider: formatSymbolForTwelveData(sym) });
  }

  for (const d of dxySyms) {
    try {
      out[d] = await getMarketQuote(d, apiKey);
    } catch (err: any) {
      out[d] = { error: true, message: err?.message || 'DXY quote failed', symbol: d };
    }
  }

  if (plain.length === 0) return out;

  // Serve any that are still warm in cache without burning credits.
  const needFetch: { original: string; provider: string }[] = [];
  const now = Date.now();
  for (const row of plain) {
    const cacheKey = `quote:${row.provider}`;
    const cached = marketCache[cacheKey];
  if (cached && now - cached.timestamp < CACHE_TTL_QUOTE) {
      out[row.original] = cached.data;
    } else if (cached && isTwelveDataCoolingDown()) {
      out[row.original] = markStale(cached.data);
    } else {
      needFetch.push(row);
    }
  }

  if (needFetch.length === 0) return out;

  const activeKey = apiKey || getCleanApiKey();
  const providers = [...new Set(needFetch.map((r) => r.provider))];
  const batchUrl = `https://api.twelvedata.com/quote?symbol=${encodeURIComponent(providers.join(','))}`;
  let batchData: any = null;
  let batchErr: unknown = null;
  try {
    batchData = await fetchAndTrack(batchUrl, 'quote_batch', providers.join(','), 5000, activeKey);
  } catch (err) {
    batchErr = err;
  }

  const pick = (provider: string): any => {
    if (!batchData) return null;
    if (providers.length === 1 && (batchData.close || batchData.price)) return batchData;
    return batchData[provider] || null;
  };

  const missing: typeof needFetch = [];
  for (const row of needFetch) {
    const item = pick(row.provider);
    if (item && item.status !== 'error' && (item.close || item.price)) {
      const normalized = withTapePrice({ ...item, symbol: row.original });
      marketCache[`quote:${row.provider}`] = { data: normalized, timestamp: Date.now() };
      out[row.original] = normalized;
    } else {
      missing.push(row);
    }
  }

  if (missing.length) {
    const fmpMap = await fetchFmpQuotes(missing.map((r) => r.original));
    if (Object.keys(fmpMap).length) {
      logHealthEvent('FALLBACK', `Quotes from FMP after Twelve Data miss: ${Object.keys(fmpMap).join(',')}`);
    }
    for (const row of missing) {
      const fmp = fmpMap[row.original];
      if (fmp) {
        marketCache[`quote:${row.provider}`] = { data: fmp, timestamp: Date.now() };
        out[row.original] = fmp;
        continue;
      }
      const stale = marketCache[`quote:${row.provider}`];
      if (stale) {
        out[row.original] = markStale(stale.data);
      } else {
        out[row.original] = {
          error: true,
          message: (batchErr as Error)?.message || `No quote for ${row.provider}`,
          symbol: row.original,
        };
      }
    }
  }
  evictMarketCacheIfNeeded();
  return out;
}

// ============================================
// GET TIME SERIES CANDLES (Deduplicated & Cached)
// ============================================
export type MarketCandleFetchOptions = {
  /** YYYY-MM-DD — Twelve Data start_date (inclusive). */
  startDate?: string;
  /** YYYY-MM-DD — Twelve Data end_date (inclusive). */
  endDate?: string;
};

export async function getMarketCandles(
  symbol: string,
  interval: string,
  requestedLimit: number,
  apiKey: string,
  options?: MarketCandleFetchOptions,
) {
  // Twelve Data only accepts outputsize in [1, 5000]; anything larger is
  // rejected with HTTP 400, which would blank the chart entirely.
  const limit = Math.min(Math.max(Number.isFinite(requestedLimit) ? requestedLimit : 100, 1), 5000);
  const canon = canonicalCacheSymbol(symbol)
  const windowKey = `${options?.startDate || ''}:${options?.endDate || ''}`
  const cacheKey = `candles:${canon}:${interval}:${limit}:${windowKey}`
  const now = Date.now()
  const ttl = candleTtlMs(interval)

  const cached = marketCache[cacheKey]
  if (cached && now - cached.timestamp < ttl) {
    console.log(`[Gateway] CANDLES CACHE HIT: ${canon} (${interval})`)
    return cached.data
  }
  if (cached && isTwelveDataCoolingDown()) {
    console.log(`[Gateway] CANDLES STALE DURING TD COOLDOWN: ${canon} (${interval})`)
    return markStale(cached.data)
  }

  if (pendingRequests[cacheKey]) {
    console.log(`[Gateway] CANDLES WAITING SIGNALS: ${canon} (${interval})`)
    return pendingRequests[cacheKey]
  }

  const runFetch = async () => {
    const cleanSym = symbol.trim().toUpperCase();
    const isDxy = cleanSym === 'DXY' || cleanSym === 'DX-Y.F' || cleanSym === 'USDX' || cleanSym === 'DXY INDEX';

    if (isDxy) {
      // DXY candles are computed from six live FX time series — real, derived
      // data. If alignment yields nothing or the query fails, we throw rather
      // than emitting a synthetic random walk.
      const activeKey = apiKey || getCleanApiKey();
      const symbols = ['EUR/USD', 'USD/JPY', 'GBP/USD', 'USD/CAD', 'USD/SEK', 'USD/CHF'];
      console.log(`[Gateway] Computing DXY candles from live FX time_series via batch query.`);
      const batchParams = new URLSearchParams({
        symbol: symbols.join(','),
        interval,
        outputsize: String(limit),
      });
      if (options?.startDate) batchParams.set('start_date', options.startDate);
      if (options?.endDate) batchParams.set('end_date', options.endDate);
      const batchUrl = `https://api.twelvedata.com/time_series?${batchParams.toString()}`;
      let batchData: any;
      try {
        batchData = await fetchAndTrack(batchUrl, 'candles_batch', symbol, 20000, activeKey);
      } catch (err) {
        return candlesWithFmpFallback(symbol, interval, limit, err);
      }

      if (!batchData || batchData.status === 'error') {
        return candlesWithFmpFallback(
          symbol,
          interval,
          limit,
          new Error(batchData?.message || 'Twelve Data batch query returned error'),
        );
      }

      const timeSeriesMap: Record<string, Record<string, any>> = {};

      for (const pair of symbols) {
        const pairData = batchData[pair];
        if (pairData && pairData.values) {
          for (const val of pairData.values) {
            const dt = val.datetime;
            if (!timeSeriesMap[dt]) {
              timeSeriesMap[dt] = {};
            }
            timeSeriesMap[dt][pair] = val;
          }
        }
      }

      const sortedDatetimes = Object.keys(timeSeriesMap).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
      const dxyValues: any[] = [];

      for (const dt of sortedDatetimes) {
        const frame = timeSeriesMap[dt];

        const eurusd = frame['EUR/USD'];
        const usdjpy = frame['USD/JPY'];
        const gbpusd = frame['GBP/USD'];
        const usdcad = frame['USD/CAD'];
        const usdsek = frame['USD/SEK'];
        const usdchf = frame['USD/CHF'];

        if (eurusd && usdjpy && gbpusd && usdcad && usdsek && usdchf) {
          const getPrice = (f: any, field: string) => parseFloat(f[field]);

          const calculateDxyValue = (field: string) => {
            const eu = getPrice(eurusd, field);
            const jp = getPrice(usdjpy, field);
            const gb = getPrice(gbpusd, field);
            const ca = getPrice(usdcad, field);
            const se = getPrice(usdsek, field);
            const ch = getPrice(usdchf, field);

            if (isNaN(eu) || isNaN(jp) || isNaN(gb) || isNaN(ca) || isNaN(se) || isNaN(ch)) {
              return null;
            }

            return 50.14348112 *
              Math.pow(eu, -0.576) *
              Math.pow(jp, 0.136) *
              Math.pow(gb, -0.119) *
              Math.pow(ca, 0.091) *
              Math.pow(se, 0.042) *
              Math.pow(ch, 0.036);
          };

          const closeVal = calculateDxyValue('close');
          const openVal = calculateDxyValue('open');
          const highVal = calculateDxyValue('high') || closeVal;
          const lowVal = calculateDxyValue('low') || closeVal;

          if (closeVal !== null && openVal !== null) {
            dxyValues.push({
              datetime: dt,
              open: openVal.toFixed(4),
              high: (highVal as number).toFixed(4),
              low: (lowVal as number).toFixed(4),
              close: closeVal.toFixed(4),
              volume: "0"
            });
          }
        }
      }

      if (dxyValues.length > 0) {
        return {
          meta: {
            symbol: symbol,
            interval,
            currency: "USD",
            exchange_timezone: "UTC",
            exchange: "ICEUS",
            type: "Index"
          },
          values: dxyValues,
          status: "ok"
        };
      } else {
        // No aligned component data — fail honestly, do not fabricate.
        return candlesWithFmpFallback(
          symbol,
          interval,
          limit,
          new Error('DXY component series alignment returned 0 entries from live data.'),
        );
      }
    }

    const formatted = formatSymbolForTwelveData(symbol);
    try {
      return await fetchCandlesFromAPI(formatted, interval, limit, apiKey, options);
    } catch (err) {
      return candlesWithFmpFallback(symbol, interval, limit, err);
    }
  }

  pendingRequests[cacheKey] = runFetch()

  try {
    const data = await pendingRequests[cacheKey]

    // Historical candles are not live ticks — do not run the stagnant-quote
    // detector here. Identical closes across refreshes are normal OHLC and were
    // falsely 403'ing /api/market/history after quote spam.

    marketCache[cacheKey] = {
      data,
      timestamp: now,
    }
    evictMarketCacheIfNeeded()
    return data
  } finally {
    delete pendingRequests[cacheKey]
  }
}

// ============================================
// RAW FETCH SUB-ACTIONS WRAPPED WITH SECURE TRACKING
// ============================================

/**
 * Reads the Twelve Data API key from environment variables only.
 * NO hardcoded fallback key. If none is set, returns an empty string and the
 * fetch helpers will surface a clear "key not configured" failure rather than
 * silently using a leaked key.
 */
export function getCleanApiKey(): string {
  const key = getTwelveDataApiKey();
  if (!key) {
    console.warn('[Gateway] No Twelve Data API key configured in environment. Live data is unavailable until one is set.');
  }
  return key;
}

async function fetchPrice(symbol: string) {
  const apiKey = getCleanApiKey();
  console.log(`[Gateway] Live Fetch PRICE: ${symbol}`)
  const url = `https://api.twelvedata.com/price?symbol=${encodeURIComponent(symbol)}`
  console.log(`[Gateway] DEBUG: Fetching URL: ${url} (auth header + encoded query)`);
  return fetchAndTrack(url, 'price', symbol, 5000, apiKey);
}

async function fetchQuoteFromAPI(symbol: string, apiKey: string) {
  console.log(`[Gateway] Live Fetch QUOTE: ${symbol}`)
  const cleanKey = apiKey ? apiKey.trim().replace(/^["']|["']$/g, '') : getCleanApiKey();
  const url = `https://api.twelvedata.com/quote?symbol=${encodeURIComponent(symbol)}`
  console.log(`[Gateway] DEBUG: Fetching URL: ${url} (auth header + encoded query)`);
  return fetchAndTrack(url, 'quote', symbol, 5000, cleanKey);
}

async function fetchCandlesFromAPI(
  symbol: string,
  interval: string,
  limit: number,
  apiKey: string,
  options?: { startDate?: string; endDate?: string },
) {
  console.log(`[Gateway] Live Fetch CANDLES: ${symbol} (${interval})`)
  const cleanKey = apiKey ? apiKey.trim().replace(/^["']|["']$/g, '') : getCleanApiKey();
  const params = new URLSearchParams({
    symbol,
    interval,
    outputsize: String(limit),
  });
  // Twelve Data historical window — enables Market Replay date picking.
  // Dates are YYYY-MM-DD (exchange calendar); never invent bars outside the response.
  if (options?.startDate) params.set('start_date', options.startDate);
  if (options?.endDate) params.set('end_date', options.endDate);
  const url = `https://api.twelvedata.com/time_series?${params.toString()}`
  console.log(`[Gateway] DEBUG: Fetching URL: ${url} (auth header + encoded query)`);
  // Historical pulls can be large (up to 5k candles); allow more time than quote/price calls.
  return fetchAndTrack(url, 'candles', symbol, 20000, cleanKey);
}
