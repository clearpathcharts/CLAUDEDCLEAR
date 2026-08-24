/**
 * Central server-side secret access.
 * Never return raw keys to clients. Never log key material.
 * Prefer non-VITE_* names — VITE_ vars can leak into the browser bundle if imported client-side.
 */

function clean(raw: string | undefined): string {
  if (!raw) return '';
  const trimmed = raw.trim().replace(/^["']|["']$/g, '');
  if (!trimmed) return '';
  const lower = trimmed.toLowerCase();
  if (
    lower.includes('placeholder') ||
    lower.includes('your_') ||
    lower === 'undefined' ||
    lower === 'null' ||
    lower.startsWith('xxxx')
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

export function getTwelveDataApiKey(): string {
  return first(process.env.TWELVEDATA_API_KEY, process.env.TWELVE_DATA_API_KEY);
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

export function getMakeWebhookUrl(): string {
  return first(process.env.MAKE_WEBHOOK_URL);
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
    MAKE_WEBHOOK_URL: Boolean(getMakeWebhookUrl()),
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

/** Allowed FMP v3 path segments — blocks open proxy path injection. */
export const FMP_ALLOWED_ENDPOINTS = new Set([
  'income-statement',
  'balance-sheet-statement',
  'cash-flow-statement',
  'quote',
  'profile',
  'key-metrics',
  'ratios',
  'enterprise-values',
  'rating',
]);
