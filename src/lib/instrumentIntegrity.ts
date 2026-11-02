/**
 * Instrument integrity — never silently swap a different market exposure
 * just to keep a chart populated (e.g. spot gold XAU/USD ≠ COMEX GC futures).
 *
 * COT / positioning may still map spot desks to futures contracts (CFTC prints
 * on futures). That is a different data product and must not drive OHLC prices.
 */

export type InstrumentType =
  | 'spot'
  | 'futures'
  | 'etf'
  | 'index'
  | 'equity'
  | 'fx'
  | 'crypto'
  | 'bond'
  | 'commodity'
  | 'derived'
  | 'unknown';

export type MarketDataProvider = 'twelvedata' | 'fmp' | 'derived' | 'none';

export type InstrumentProvenance = {
  requestedSymbol: string;
  instrumentType: InstrumentType;
  provider: MarketDataProvider;
  providerSymbol: string;
  exchange: string | null;
  currency: string | null;
  priceSource: string;
  timestamp: string;
  delayed: boolean | null;
  isFallback: boolean;
  isProxy: boolean;
  proxyNote: string | null;
};

/**
 * Desk / registry symbols that must NEVER be price-fed from a different
 * instrument (spot↔futures, cash index↔ETF, etc.).
 * Key = requested desk symbol (compact or slashed). Value = forbidden substitute
 * and the human reason.
 */
export const FORBIDDEN_PRICE_SUBSTITUTIONS: Record<
  string,
  { substitute: string; reason: string }
> = {
  XAUUSD: { substitute: 'GCUSD', reason: 'Spot gold is not COMEX gold futures (GC).' },
  'XAU/USD': { substitute: 'GCUSD', reason: 'Spot gold is not COMEX gold futures (GC).' },
  XAU: { substitute: 'GCUSD', reason: 'Spot gold is not COMEX gold futures (GC).' },
  GOLD: { substitute: 'GCUSD', reason: 'Spot gold is not COMEX gold futures (GC).' },
  XAGUSD: { substitute: 'SIUSD', reason: 'Spot silver is not COMEX silver futures (SI).' },
  'XAG/USD': { substitute: 'SIUSD', reason: 'Spot silver is not COMEX silver futures (SI).' },
  XAG: { substitute: 'SIUSD', reason: 'Spot silver is not COMEX silver futures (SI).' },
  SILVER: { substitute: 'SIUSD', reason: 'Spot silver is not COMEX silver futures (SI).' },
  WTI: { substitute: 'CLUSD', reason: 'WTI spot/reference is not CL crude futures.' },
  USOIL: { substitute: 'CLUSD', reason: 'WTI spot/reference is not CL crude futures.' },
  CRUDE: { substitute: 'CLUSD', reason: 'Crude spot/reference is not CL crude futures.' },
  BRENT: { substitute: 'BZUSD', reason: 'Brent spot/reference is not BZ crude futures.' },
  NATGAS: { substitute: 'NGUSD', reason: 'Natural-gas spot/reference is not NG futures.' },
  COPPER: { substitute: 'HGUSD', reason: 'Copper spot/reference is not HG futures.' },
  DXY: { substitute: 'DXUSD', reason: 'US Dollar Index spot/derived is not DX futures.' },
  USDX: { substitute: 'DXUSD', reason: 'US Dollar Index spot/derived is not DX futures.' },
};

function normKey(symbol: string): string {
  return symbol.trim().toUpperCase().replace(/\s+/g, '');
}

/** True when mapping requested → candidate would change the market exposure. */
export function isForbiddenPriceSubstitution(requested: string, candidate: string): boolean {
  const req = normKey(requested);
  const cand = normKey(candidate).replace(/^\^/, '');
  const compactReq = req.replace(/\//g, '');
  const hit =
    FORBIDDEN_PRICE_SUBSTITUTIONS[req] ||
    FORBIDDEN_PRICE_SUBSTITUTIONS[compactReq] ||
    FORBIDDEN_PRICE_SUBSTITUTIONS[req.replace(/\//g, '')];
  if (!hit) {
    // Also catch generic spot desk → *USD futures ticker when keys differ only by futures root.
    if (/^(XAU|XAG)/.test(compactReq) && /^(GC|SI)USD$/.test(cand)) return true;
    return false;
  }
  return cand === hit.substitute || cand === hit.substitute.replace(/^\^/, '');
}

export function forbiddenSubstitutionReason(requested: string, candidate: string): string | null {
  if (!isForbiddenPriceSubstitution(requested, candidate)) return null;
  const req = normKey(requested);
  const compactReq = req.replace(/\//g, '');
  const hit =
    FORBIDDEN_PRICE_SUBSTITUTIONS[req] ||
    FORBIDDEN_PRICE_SUBSTITUTIONS[compactReq];
  if (hit) return hit.reason;
  return `Refusing to price ${requested} from ${candidate} — different instrument exposure.`;
}

export function inferInstrumentType(symbol: string, category?: string | null): InstrumentType {
  const key = normKey(symbol);
  const compact = key.replace(/\//g, '');
  if (category === 'forex' || (compact.length === 6 && !/^(BTC|ETH|SOL)/.test(compact))) {
    if (/^(EUR|GBP|AUD|NZD|USD|CAD|CHF|JPY)/.test(compact) && compact.length === 6) return 'fx';
  }
  if (category === 'crypto') return 'crypto';
  if (category === 'stocks') return 'equity';
  if (category === 'bonds') return 'bond';
  if (category === 'indices') return 'index';
  if (category === 'metals') return 'spot';
  if (category === 'commodities') return 'commodity';
  if (/^(XAU|XAG)/.test(compact)) return 'spot';
  if (/^(GC|SI|CL|NG|HG|BZ|DX)USD$/.test(compact) || /=\w?F$/.test(key)) return 'futures';
  if (/^(SPY|QQQ|DIA)$/.test(compact)) return 'etf';
  if (/^(SPX|NDX|DJI|VIX)$/.test(compact)) return 'index';
  if (key.includes('/')) return 'fx';
  return 'unknown';
}

export function buildProvenance(input: {
  requestedSymbol: string;
  provider: MarketDataProvider;
  providerSymbol: string;
  instrumentType?: InstrumentType;
  category?: string | null;
  exchange?: string | null;
  currency?: string | null;
  priceSource?: string;
  delayed?: boolean | null;
  isFallback?: boolean;
  isProxy?: boolean;
  proxyNote?: string | null;
  timestamp?: string;
}): InstrumentProvenance {
  const requestedSymbol = input.requestedSymbol.trim();
  return {
    requestedSymbol,
    instrumentType:
      input.instrumentType ||
      inferInstrumentType(requestedSymbol, input.category),
    provider: input.provider,
    providerSymbol: input.providerSymbol,
    exchange: input.exchange ?? null,
    currency: input.currency ?? null,
    priceSource: input.priceSource || `${input.provider}:${input.providerSymbol}`,
    timestamp: input.timestamp || new Date().toISOString(),
    delayed: input.delayed ?? null,
    isFallback: Boolean(input.isFallback),
    isProxy: Boolean(input.isProxy),
    proxyNote: input.proxyNote ?? null,
  };
}

/** Response headers so array-shaped /api/market/history still carries provenance. */
export function provenanceHeaders(p: InstrumentProvenance): Record<string, string> {
  return {
    'X-ClearPath-Requested-Symbol': p.requestedSymbol,
    'X-ClearPath-Instrument-Type': p.instrumentType,
    'X-ClearPath-Provider': p.provider,
    'X-ClearPath-Provider-Symbol': p.providerSymbol,
    'X-ClearPath-Exchange': p.exchange || '',
    'X-ClearPath-Currency': p.currency || '',
    'X-ClearPath-Price-Source': p.priceSource,
    'X-ClearPath-Timestamp': p.timestamp,
    'X-ClearPath-Delayed': p.delayed == null ? '' : p.delayed ? '1' : '0',
    'X-ClearPath-Fallback': p.isFallback ? '1' : '0',
    'X-ClearPath-Proxy': p.isProxy ? '1' : '0',
    'X-ClearPath-Proxy-Note': p.proxyNote || '',
  };
}
