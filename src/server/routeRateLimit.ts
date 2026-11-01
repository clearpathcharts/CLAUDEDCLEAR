/**
 * Route-scoped rate limits — auth + AI only (never quote/candle routes).
 * Uses express-rate-limit with in-memory store per instance; still blocks abuse bursts.
 */
import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import type { Request } from 'express';

function clientIp(req: Request): string {
  // trust proxy = 1: req.ip is the address Google's front end saw; the left of X-Forwarded-For is client-supplied.
  return req.ip ? ipKeyGenerator(req.ip) : 'unknown';
}

export const memberInboxLimiter = rateLimit({
  windowMs: 60_000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => `inbox:${clientIp(req)}`,
  message: { error: 'Too many inbox requests. Wait a minute and try again.' },
});

export const authLoginLimiter = rateLimit({
  windowMs: 60_000,
  max: 12,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => `login:${clientIp(req)}:${String(req.body?.email || '').toLowerCase().slice(0, 120)}`,
  message: { error: 'Too many login attempts. Wait a minute and try again.' },
});

export const authRegisterLimiter = rateLimit({
  windowMs: 60_000,
  max: 8,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => `register:${clientIp(req)}`,
  message: { error: 'Too many registration attempts. Wait a minute and try again.' },
});

export const authForgotPasswordLimiter = rateLimit({
  windowMs: 60_000,
  max: 6,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => `forgot:${clientIp(req)}:${String(req.body?.email || '').toLowerCase().slice(0, 120)}`,
  message: { error: 'Too many password-reset requests. Wait a minute and try again.' },
});

/** Board / Founders access code — brute-force guard (no default code, but still throttle). */
export const boardVerifyLimiter = rateLimit({
  windowMs: 60_000,
  max: 6,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => `board:${clientIp(req)}`,
  message: { error: 'Too many access-code attempts. Wait a minute and try again.' },
});

/** Private-account email lookup — throttle account enumeration sweeps. */
/** Password-reset token consumption — tokens are 192-bit, throttle anyway. */
export const authResetPasswordLimiter = rateLimit({
  windowMs: 60_000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => `reset:${clientIp(req)}`,
  message: { error: 'Too many reset attempts. Wait a minute and try again.' },
});

/** Chart pulse subscribe/unsubscribe — blocks scripted email-blast signups. */
export const chartPulseSubscribeLimiter = rateLimit({
  windowMs: 60_000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    const uid = (req as any).session?.privateUser?.uid;
    return uid ? `pulse:uid:${uid}` : `pulse:ip:${clientIp(req)}`;
  },
  message: { error: 'Too many alert changes. Wait a minute and try again.' },
});

export const aiChatLimiter = rateLimit({
  windowMs: 60_000,
  max: 24,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    const uid = (req as any).session?.privateUser?.uid;
    return uid ? `ai:uid:${uid}` : `ai:ip:${clientIp(req)}`;
  },
  message: { error: 'Too many AI requests. Slow down for a minute.' },
});

/** Routes that spend paid vendor quota (Twelve Data, FMP, FRED, NewsData, CFTC). */
export const MARKET_DATA_ROUTES = [
  '/api/quote',
  '/api/quotes',
  '/api/candles',
  '/api/market/history',
  '/api/newsdata/latest',
  '/api/economic/news',
  '/api/fred/observations',
  '/api/fmp',
  '/api/cot/history',
] as const;

/** Routes that fetch a caller-supplied URL on the server's bandwidth. */
export const URL_PROXY_ROUTES = ['/api/stream-proxy', '/api/rss', '/api/podcast', '/api/literacy/watch-check'] as const;

export const urlProxyLimiter = rateLimit({
  windowMs: 60_000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => `proxy:${clientIp(req)}`,
  message: { error: 'Too many requests. Wait a minute and try again.' },
});

export const marketDataLimiter = rateLimit({
  windowMs: 60_000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => `mkt:${clientIp(req)}`,
  message: { error: 'Too many market data requests. Wait a minute and try again.' },
});

export const frontendErrorLimiter = rateLimit({
  windowMs: 60_000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => `logerr:${clientIp(req)}`,
  message: { error: 'Too many error reports.' },
});

/** Anonymous first-party marketing beacons — burst guard, not an analytics counter. */
export const marketingEventLimiter = rateLimit({
  windowMs: 60_000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => `marketing:${clientIp(req)}`,
  message: { error: 'Too many marketing events.' },
});

export const brokerOAuthStartLimiter = rateLimit({
  windowMs: 60_000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    const uid = (req as any).session?.privateUser?.uid;
    return uid ? `broker-oauth:uid:${uid}` : `broker-oauth:ip:${clientIp(req)}`;
  },
  message: { error: 'Too many broker connect attempts. Wait a minute.' },
});

export const brokerOAuthCallbackLimiter = rateLimit({
  windowMs: 60_000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => `broker-cb:ip:${clientIp(req)}`,
  message: { error: 'Too many broker OAuth callbacks.' },
});

export const brokerProxyLimiter = rateLimit({
  windowMs: 60_000,
  max: 40,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    const uid = (req as any).session?.privateUser?.uid;
    return uid ? `broker-proxy:uid:${uid}` : `broker-proxy:ip:${clientIp(req)}`;
  },
  message: { error: 'Too many broker API requests. Slow down.' },
});

export const brokerOrderLimiter = rateLimit({
  windowMs: 60_000,
  max: 12,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    const uid = (req as any).session?.privateUser?.uid;
    return uid ? `broker-order:uid:${uid}` : `broker-order:ip:${clientIp(req)}`;
  },
  message: { error: 'Too many pass-through orders. Wait a minute.' },
});
