import type { Request, Response, NextFunction } from 'express';
import { timingSafeEqual } from 'crypto';
import { getAuth } from 'firebase-admin/auth';
import { isFounderEmail } from '../lib/founder';
import { ensureAdminApp } from './firebaseAdmin';
import { getCatalogAdminSecret, getIntelligenceWebhookSecret } from './secrets';

export type SessionPrivateUser = {
  uid: string;
  email?: string;
  displayName?: string;
};

export function getPrivateSessionUser(req: Request): SessionPrivateUser | null {
  const user = (req.session as { privateUser?: SessionPrivateUser } | undefined)?.privateUser;
  if (!user?.uid || typeof user.uid !== 'string') return null;
  return user;
}

/**
 * Resolve the authenticated workspace uid from:
 * 1) Private member Express session, or
 * 2) Firebase ID token (Authorization: Bearer <idToken>)
 *
 * Client-supplied uid query/body values are NEVER trusted alone.
 */
export async function resolveAuthenticatedUid(req: Request): Promise<string | null> {
  const sessionUser = getPrivateSessionUser(req);
  if (sessionUser?.uid) return sessionUser.uid;

  const header = req.get('authorization') || '';
  const match = header.match(/^Bearer\s+(.+)$/i);
  if (!match?.[1]) return null;

  try {
    if (!ensureAdminApp()) return null;
    const decoded = await getAuth().verifyIdToken(match[1].trim());
    return decoded.uid || null;
  } catch {
    return null;
  }
}

export function requirePrivateSession(req: Request, res: Response, next: NextFunction): void {
  const user = getPrivateSessionUser(req);
  if (!user?.uid) {
    res.status(401).json({ error: 'Unauthorized', message: 'Sign in required.' });
    return;
  }
  next();
}

export function timingSafeEqualString(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

export function requireAdminSecret(
  headerNames: string[],
  getSecret: () => string,
  missingMessage: string
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const secret = getSecret();
    const isProd = process.env.NODE_ENV === 'production';
    if (!secret) {
      if (isProd) {
        res.status(503).json({
          error: 'Misconfigured',
          message: missingMessage,
        });
        return;
      }
      console.warn(`[Security] ${missingMessage} — allowing in non-production only.`);
      next();
      return;
    }

    const provided = headerNames.map((n) => req.get(n) || '').find(Boolean) || '';
    if (!provided || !timingSafeEqualString(provided, secret)) {
      res.status(401).json({ error: 'Unauthorized', message: 'Invalid or missing admin secret.' });
      return;
    }
    next();
  };
}

export const requireCatalogAdmin = requireAdminSecret(
  ['x-catalog-admin-secret', 'x-river-admin-secret'],
  getCatalogAdminSecret,
  'CATALOG_ADMIN_SECRET is not configured.'
);

export const requireIntelligenceAdmin = requireAdminSecret(
  ['x-intelligence-webhook-secret', 'x-intelligence-admin-secret'],
  getIntelligenceWebhookSecret,
  'INTELLIGENCE_WEBHOOK_SECRET is not configured.'
);

/**
 * Founder console gate for read-only member lists.
 * Accepts either:
 * 1) Valid `x-catalog-admin-secret` / `x-river-admin-secret`, or
 * 2) Private Express session whose email is the founder, or
 * 3) Firebase ID token (Authorization: Bearer) whose email is the founder.
 *
 * Never opens without one of the above — even in non-production.
 */
export async function requireFounderOrCatalogAdmin(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const secret = getCatalogAdminSecret();
    const provided =
      ['x-catalog-admin-secret', 'x-river-admin-secret']
        .map((n) => req.get(n) || '')
        .find(Boolean) || '';
    if (secret && provided && timingSafeEqualString(provided, secret)) {
      next();
      return;
    }

    const sessionUser = getPrivateSessionUser(req);
    if (sessionUser && isFounderEmail(sessionUser.email)) {
      next();
      return;
    }

    const header = req.get('authorization') || '';
    const match = header.match(/^Bearer\s+(.+)$/i);
    if (match?.[1]) {
      if (!ensureAdminApp()) {
        res.status(503).json({
          error: 'Misconfigured',
          message: 'Firebase Admin is not configured to verify founder tokens.',
        });
        return;
      }
      try {
        const decoded = await getAuth().verifyIdToken(match[1].trim());
        if (isFounderEmail(decoded.email)) {
          next();
          return;
        }
        res.status(403).json({
          error: 'Forbidden',
          message: 'Founder account required.',
        });
        return;
      } catch {
        res.status(401).json({
          error: 'Unauthorized',
          message: 'Invalid or expired auth token.',
        });
        return;
      }
    }

    res.status(401).json({
      error: 'Unauthorized',
      message: 'Founder auth (Bearer ID token / private session) or catalog admin secret required.',
    });
  } catch (err) {
    console.error('[authGuards] requireFounderOrCatalogAdmin failed:', err);
    res.status(500).json({ error: 'Auth check failed' });
  }
}
