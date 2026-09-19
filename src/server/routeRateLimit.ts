/**
 * Route-scoped rate limits — auth + AI only (never quote/candle routes).
 * Uses express-rate-limit with in-memory store per instance; still blocks abuse bursts.
 */
import rateLimit from 'express-rate-limit';
import type { Request } from 'express';

function clientIp(req: Request): string {
  const fwd = req.headers['x-forwarded-for'];
  if (typeof fwd === 'string' && fwd.trim()) return fwd.split(',')[0].trim();
  return req.ip || 'unknown';
}

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
export const authLookupLimiter = rateLimit({
  windowMs: 60_000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => `lookup:${clientIp(req)}`,
  message: { error: 'Too many lookups. Wait a minute and try again.' },
});

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

export const frontendErrorLimiter = rateLimit({
  windowMs: 60_000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => `logerr:${clientIp(req)}`,
  message: { error: 'Too many error reports.' },
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
