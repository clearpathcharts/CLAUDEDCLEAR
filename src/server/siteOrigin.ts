import type { Request } from 'express';

export const CANONICAL_SITE_ORIGIN = 'https://clearpathtrader.com';

/**
 * Origin for links the server puts in emails and payment redirects.
 * Production never trusts the Host / X-Forwarded-Host headers: a crafted Host would
 * send confirmation tokens or checkout returns to someone else's site.
 */
export function siteOrigin(req: Request): string {
  const fromEnv = String(process.env.PUBLIC_SITE_URL || process.env.SITE_URL || '').trim().replace(/\/$/, '');
  if (/^https?:\/\/[^\s/]+$/.test(fromEnv)) return fromEnv;
  if (process.env.NODE_ENV === 'production') return CANONICAL_SITE_ORIGIN;
  const host = String(req.get('host') || '').trim();
  return host ? `${req.protocol}://${host}` : CANONICAL_SITE_ORIGIN;
}

/** True for hosts this deployment legitimately answers on (custom domain, run.app, local dev). */
export function isOwnHost(host: string): boolean {
  const h = host.trim().toLowerCase().replace(/:\d+$/, '');
  return (
    h === 'clearpathtrader.com' ||
    h.endsWith('.clearpathtrader.com') ||
    h.endsWith('.run.app') ||
    h === 'localhost' ||
    h === '127.0.0.1'
  );
}
