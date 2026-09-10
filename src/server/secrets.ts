/**
 * Central server-side secret access.
 * Never return raw keys to clients. Never log key material.
 * Prefer non-VITE_* names — VITE_ vars can leak into the browser bundle if imported client-side.
 */

function unwrapSecretEnvelope(trimmed: string): string {
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    try {
      const obj = JSON.parse(trimmed) as Record<string, unknown>;
      const nested =
        obj.TWELVEDATA_API_KEY ||
        obj.TWELVE_DATA_API_KEY ||
        obj.apikey ||
        obj.api_key ||
        obj.apiKey ||
        obj.key;
      if (typeof nested === 'string' && nested.trim()) return nested.trim();
    } catch {
      /* not a JSON secret envelope */
    }
  }
  return trimmed;
}

function clean(raw: string | undefined): string {
  if (!raw) return '';
  // Strip BOM / zero-width / quotes / whitespace that break Twelve Data auth (401).
  let trimmed = raw
    .replace(/^\uFEFF/, '')
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .trim()
    .replace(/^["']|["']$/g, '')
    .trim();
  trimmed = unwrapSecretEnvelope(trimmed);
  trimmed = trimmed.replace(/^(apikey|bearer)\s+/i, '').trim();
  if (!trimmed) return '';
  const lower = trimmed.toLowerCase();
  if (
    lower.includes('placeholder') ||
    lower.includes('your_') ||
    lower === 'undefined' ||
    lower === 'null' ||
    lower.startsWith('xxxx') ||
    lower === 'secret' ||
    lower === 'changeme'
  ) {
    return '';
  }
  return trimmed;
}

function first(...candidates: Array<string | undefined>): string {
  for (const c of candidates) {
    const v = clean(c);
    if (v) return v;
  }
  return '';
}

export type TwelveDataKeySource = 'TWELVEDATA_API_KEY' | 'TWELVE_DATA_API_KEY';

let dualKeyWarned = false;

/** Test-only: allow self-tests to re-arm the dual-key console warning. */
export function resetTwelveDataSecretWarnForTests(): void {
  dualKeyWarned = false;
}

export type TwelveDataKeyCandidate = {
  source: TwelveDataKeySource;
  key: string;
};

/**
 * Twelve Data key. Accepts both Cloud Run spellings founders use:
 * - TWELVEDATA_API_KEY (docs / .env.example)
 * - TWELVE_DATA_API_KEY (common Cloud Run spelling)
 * If both are set and differ, prefer the longer value. A stale short/old key in
 * TWELVEDATA_API_KEY was causing live 401s while the new paid key sat unused
 * under TWELVE_DATA_API_KEY. On equal length, prefer TWELVE_DATA_API_KEY.
 */
export function getTwelveDataApiKey(): string {
  return listTwelveDataApiKeyCandidates()[0]?.key || '';
}

/** Which env var name supplied the active Twelve Data key (diagnostics only). */
export function getTwelveDataApiKeySource(): TwelveDataKeySource | null {
  return listTwelveDataApiKeyCandidates()[0]?.source ?? null;
}

/**
 * Unique cleaned keys, preferred first, then the unused duplicate spelling.
 * The market gateway tries these in order on HTTP 401 so a stale Cloud Run
 * duplicate does not brick the live site while local .env works.
 */
export function listTwelveDataApiKeyCandidates(): TwelveDataKeyCandidate[] {
  const primary = clean(process.env.TWELVEDATA_API_KEY);
  const alt = clean(process.env.TWELVE_DATA_API_KEY);
  const ordered: TwelveDataKeyCandidate[] = [];

  const pickPreferred = (): TwelveDataKeyCandidate | null => {
    if (primary && alt && primary !== alt) {
      if (alt.length >= primary.length) return { source: 'TWELVE_DATA_API_KEY', key: alt };
      return { source: 'TWELVEDATA_API_KEY', key: primary };
    }
    if (primary) return { source: 'TWELVEDATA_API_KEY', key: primary };
    if (alt) return { source: 'TWELVE_DATA_API_KEY', key: alt };
    return null;
  };

  const preferred = pickPreferred();
  if (preferred) ordered.push(preferred);
  if (primary && !ordered.some((c) => c.key === primary)) {
    ordered.push({ source: 'TWELVEDATA_API_KEY', key: primary });
  }
  if (alt && !ordered.some((c) => c.key === alt)) {
    ordered.push({ source: 'TWELVE_DATA_API_KEY', key: alt });
  }

  if (primary && alt && primary !== alt && !dualKeyWarned) {
    dualKeyWarned = true;
    console.warn(
      '[secrets] Both TWELVEDATA_API_KEY and TWELVE_DATA_API_KEY are set and differ. ' +
        `Trying ${ordered.map((c) => `${c.source}(len=${c.key.length})`).join(' then ')}. ` +
        'Delete the stale duplicate on Cloud Run, then Deploy.',
    );
  }

  return ordered;
}

export function getTwelveDataKeyPresence(): {
  TWELVEDATA_API_KEY: boolean;
  TWELVE_DATA_API_KEY: boolean;
  bothSetAndDiffer: boolean;
  activeSource: TwelveDataKeySource | null;
  keyLength: number;
  candidateCount: number;
} {
  const primary = Boolean(clean(process.env.TWELVEDATA_API_KEY));
  const alt = Boolean(clean(process.env.TWELVE_DATA_API_KEY));
  const candidates = listTwelveDataApiKeyCandidates();
  const primaryVal = clean(process.env.TWELVEDATA_API_KEY);
  const altVal = clean(process.env.TWELVE_DATA_API_KEY);
  return {
    TWELVEDATA_API_KEY: primary,
    TWELVE_DATA_API_KEY: alt,
    bothSetAndDiffer: Boolean(primaryVal && altVal && primaryVal !== altVal),
    activeSource: candidates[0]?.source ?? null,
    keyLength: candidates[0]?.key.length ?? 0,
    candidateCount: candidates.length,
  };
}

export function getGeminiApiKey(): string {
  return first(process.env.GEMINI_API_KEY);
}

export function getGroqApiKey(): string {
  return first(process.env.GROQ_API_KEY);
}

export function getFredApiKey(): string {
  return first(process.env.FRED_API_KEY);
}

/** Canonical env name is FMP_API_KEY. FINANCIAL_MODELING_PREP_API_KEY is a fallback alias only. */
export function getFmpApiKey(): string {
  return first(process.env.FMP_API_KEY, process.env.FINANCIAL_MODELING_PREP_API_KEY);
}

export function getNewsDataApiKey(): string {
  return first(process.env.NEWSDATA_API_KEY);
}

export function getFinnhubApiKey(): string {
  return first(process.env.FINNHUB_API_KEY);
}

export function getPodcastIndexCredentials(): { key: string; secret: string } {
  return {
    key: first(process.env.PODCAST_INDEX_API_KEY),
    secret: first(process.env.PODCAST_INDEX_API_SECRET),
  };
}

export function getIntelligenceWebhookSecret(): string {
  return first(process.env.INTELLIGENCE_WEBHOOK_SECRET);
}

export function getCatalogAdminSecret(): string {
  return first(process.env.CATALOG_ADMIN_SECRET, process.env.RIVER_CATALOG_ADMIN_SECRET);
}

export function getSessionSecret(): string {
  return first(process.env.SESSION_SECRET);
}

export function getStripeSecretKey(): string {
  return first(process.env.STRIPE_SECRET_KEY);
}

export function getStripeWebhookSecret(): string {
  return first(process.env.STRIPE_WEBHOOK_SECRET);
}

/** Board / Founders portal code — server-only; never expose via client APIs. */
export function getBoardAccessCode(): string {
  return first(process.env.BOARD_ACCESS_CODE, process.env.VITE_BOARD_ACCESS_CODE);
}

/** Safe boolean presence flags for diagnostics — never include key material. */
export function getSecretPresenceReport(): Record<string, boolean> {
  return {
    TWELVEDATA_API_KEY: Boolean(getTwelveDataApiKey()),
    TWELVE_DATA_API_KEY: Boolean(clean(process.env.TWELVE_DATA_API_KEY)),
    GEMINI_API_KEY: Boolean(getGeminiApiKey()),
    GROQ_API_KEY: Boolean(getGroqApiKey()),
    FRED_API_KEY: Boolean(getFredApiKey()),
    FMP_API_KEY: Boolean(getFmpApiKey()),
    NEWSDATA_API_KEY: Boolean(getNewsDataApiKey()),
    FINNHUB_API_KEY: Boolean(getFinnhubApiKey()),
    PODCAST_INDEX_API_KEY: Boolean(getPodcastIndexCredentials().key),
    PODCAST_INDEX_API_SECRET: Boolean(getPodcastIndexCredentials().secret),
    INTELLIGENCE_WEBHOOK_SECRET: Boolean(getIntelligenceWebhookSecret()),
    CATALOG_ADMIN_SECRET: Boolean(getCatalogAdminSecret()),
    SESSION_SECRET: Boolean(getSessionSecret()),
    STRIPE_SECRET_KEY: Boolean(getStripeSecretKey()),
    STRIPE_WEBHOOK_SECRET: Boolean(getStripeWebhookSecret()),
    BOARD_ACCESS_CODE: Boolean(getBoardAccessCode()),
    SOCIAL_DIRECT_WEBHOOK_URL: Boolean(clean(process.env.SOCIAL_DIRECT_WEBHOOK_URL)),
    SOCIAL_X_BEARER_TOKEN: Boolean(clean(process.env.SOCIAL_X_BEARER_TOKEN) || clean(process.env.SOCIAL_X_ACCESS_TOKEN)),
    SOCIAL_LINKEDIN_ACCESS_TOKEN: Boolean(clean(process.env.SOCIAL_LINKEDIN_ACCESS_TOKEN)),
    SOCIAL_FACEBOOK_PAGE_ACCESS_TOKEN: Boolean(clean(process.env.SOCIAL_FACEBOOK_PAGE_ACCESS_TOKEN)),
    SOCIAL_DISCORD_WEBHOOK_URL: Boolean(clean(process.env.SOCIAL_DISCORD_WEBHOOK_URL)),
    SOCIAL_TELEGRAM_BOT_TOKEN: Boolean(clean(process.env.SOCIAL_TELEGRAM_BOT_TOKEN)),
    SOCIAL_BLUESKY_HANDLE: Boolean(clean(process.env.SOCIAL_BLUESKY_HANDLE)),
    SQL_HOST: Boolean(clean(process.env.SQL_HOST)),
    FIREBASE_SERVICE_ACCOUNT: Boolean(clean(process.env.FIREBASE_SERVICE_ACCOUNT)),
    VITE_FIREBASE_API_KEY: Boolean(clean(process.env.VITE_FIREBASE_API_KEY) || clean(process.env.FIREBASE_WEB_API_KEY)),
    SMTP_HOST: Boolean(clean(process.env.SMTP_HOST)),
    TWILIO_ACCOUNT_SID: Boolean(clean(process.env.TWILIO_ACCOUNT_SID)),
    TWILIO_FROM: Boolean(clean(process.env.TWILIO_FROM) || clean(process.env.TWILIO_PHONE_NUMBER)),
  };
}

const FMP_STABLE_BASE = 'https://financialmodelingprep.com/stable';

/** Internal proxy names — blocks open path injection. Maps to FMP /stable paths. */
export const FMP_ALLOWED_ENDPOINTS = new Set([
  'income-statement',
  'balance-sheet-statement',
  'cash-flow-statement',
  'quote',
  'profile',
  'key-metrics',
  'ratios',
  'enterprise-values',
  'key-executives',
  'analyst-estimates',
  'earnings-surprises',
  'key-metrics-ttm',
  'ratios-ttm',
  'financial-growth',
  'historical-market-capitalization',
  'sec_filings',
  'shares_float',
  'revenue-product-segmentation',
  'revenue-geographic-segmentation',
]);

/** Query-style FMP resources (not /:endpoint/:symbol). */
export const FMP_LOOKUP_KINDS = new Set(['search', 'news', 'insider', 'peers', 'cot']);

/** SPA still uses legacy names (sec_filings, shares_float, earnings-surprises). */
const FMP_STABLE_SYMBOL_PATHS: Record<string, string> = {
  'income-statement': 'income-statement',
  'balance-sheet-statement': 'balance-sheet-statement',
  'cash-flow-statement': 'cash-flow-statement',
  quote: 'quote',
  profile: 'profile',
  'key-metrics': 'key-metrics',
  ratios: 'ratios',
  'enterprise-values': 'enterprise-values',
  'key-executives': 'key-executives',
  'analyst-estimates': 'analyst-estimates',
  'earnings-surprises': 'earnings',
  'key-metrics-ttm': 'key-metrics-ttm',
  'ratios-ttm': 'ratios-ttm',
  'financial-growth': 'financial-growth',
  'historical-market-capitalization': 'historical-market-capitalization',
  sec_filings: 'sec-filings-search/symbol',
  shares_float: 'shares-float',
  'revenue-product-segmentation': 'revenue-product-segmentation',
  'revenue-geographic-segmentation': 'revenue-geographic-segmentation',
};

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function buildFmpStableSymbolUrl(
  endpoint: string,
  symbol: string,
  apiKey: string,
  opts?: { limit?: number; period?: string },
): string | null {
  const path = FMP_STABLE_SYMBOL_PATHS[endpoint];
  if (!path) return null;
  const params = new URLSearchParams({ symbol, apikey: apiKey });
  if (opts?.limit) params.set('limit', String(opts.limit));
  if (opts?.period === 'annual' || opts?.period === 'quarter') params.set('period', opts.period);
  if (endpoint === 'sec_filings') {
    const to = new Date();
    const from = new Date(to);
    from.setUTCFullYear(to.getUTCFullYear() - 2);
    params.set('from', isoDate(from));
    params.set('to', isoDate(to));
  }
  return `${FMP_STABLE_BASE}/${path}?${params.toString()}`;
}

export function buildFmpStableLookupUrl(
  kind: string,
  apiKey: string,
  opts: { symbol?: string; q?: string; fromDays?: number },
): string | null {
  const params = new URLSearchParams({ apikey: apiKey });
  if (kind === 'search') {
    params.set('query', opts.q || '');
    params.set('limit', '20');
    return `${FMP_STABLE_BASE}/search-symbol?${params.toString()}`;
  }
  if (kind === 'news') {
    params.set('symbols', opts.symbol || '');
    params.set('limit', '30');
    return `${FMP_STABLE_BASE}/news/stock?${params.toString()}`;
  }
  if (kind === 'insider') {
    params.set('symbol', opts.symbol || '');
    params.set('limit', '30');
    return `${FMP_STABLE_BASE}/insider-trading/search?${params.toString()}`;
  }
  if (kind === 'peers') {
    params.set('symbol', opts.symbol || '');
    return `${FMP_STABLE_BASE}/stock-peers?${params.toString()}`;
  }
  if (kind === 'cot') {
    params.set('symbol', opts.symbol || '');
    const to = new Date();
    const from = new Date(to);
    const days = opts.fromDays && opts.fromDays > 0 ? Math.min(Math.floor(opts.fromDays), 3650) : 730;
    from.setUTCDate(to.getUTCDate() - days);
    params.set('from', isoDate(from));
    params.set('to', isoDate(to));
    return `${FMP_STABLE_BASE}/commitment-of-traders-report?${params.toString()}`;
  }
  return null;
}
