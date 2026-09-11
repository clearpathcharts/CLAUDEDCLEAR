/**
 * Alpaca OAuth — pass-through broker connect (TradingView-style).
 * Stub mode when ALPACA_CLIENT_ID / ALPACA_CLIENT_SECRET are unset.
 */
import crypto from 'node:crypto';
import {
  getAlpacaClientId,
  getAlpacaClientSecret,
  getAlpacaOAuthScope,
  isAlpacaOAuthConfigured,
  isAlpacaPaperMode,
} from '../secrets';
import {
  encryptBrokerSecret,
  isBrokerTokenEncryptionConfigured,
} from './tokenCrypto';
import { saveBrokerConnection } from './brokerConnectionStore';
import type { AlpacaOAuthPendingState, BrokerEnvironment } from './types';

const DEFAULT_AUTHORIZE = 'https://app.alpaca.markets/oauth/authorize';
const DEFAULT_TOKEN = 'https://api.alpaca.markets/oauth/token';

function authorizeBase(): string {
  return (process.env.ALPACA_OAUTH_AUTHORIZE_URL || DEFAULT_AUTHORIZE).replace(/\/$/, '');
}

function tokenBase(): string {
  return (process.env.ALPACA_OAUTH_TOKEN_URL || DEFAULT_TOKEN).replace(/\/$/, '');
}

export function alpacaRedirectUri(reqHost?: string): string {
  const fromEnv = (process.env.ALPACA_REDIRECT_URI || '').trim();
  if (fromEnv) return fromEnv;
  const site = (process.env.PUBLIC_SITE_URL || process.env.SITE_URL || '').replace(/\/$/, '');
  if (site) return `${site}/api/broker/alpaca/callback`;
  if (reqHost) return `https://${reqHost}/api/broker/alpaca/callback`;
  return 'http://localhost:3000/api/broker/alpaca/callback';
}

export function createAlpacaOAuthState(uid: string, returnTo: string): AlpacaOAuthPendingState {
  return {
    state: crypto.randomBytes(24).toString('base64url'),
    uid,
    returnTo,
    createdAt: Date.now(),
  };
}

export function isAlpacaOAuthStateValid(pending: AlpacaOAuthPendingState | undefined): boolean {
  if (!pending?.state || !pending.uid) return false;
  return Date.now() - pending.createdAt < 15 * 60_000;
}

export function buildAlpacaAuthorizeUrl(state: string, redirectUri: string): string | null {
  if (!isAlpacaOAuthConfigured()) return null;
  const clientId = getAlpacaClientId();
  if (!clientId) return null;
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: clientId,
    redirect_uri: redirectUri,
    state,
    scope: getAlpacaOAuthScope(),
  });
  return `${authorizeBase()}?${params.toString()}`;
}

type TokenResponse = {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  scope?: string;
  error?: string;
  error_description?: string;
};

export async function exchangeAlpacaCode(
  code: string,
  redirectUri: string,
): Promise<{ accessToken: string; refreshToken: string; expiresIn: number | null; scope: string | null }> {
  const clientId = getAlpacaClientId();
  const clientSecret = getAlpacaClientSecret();
  if (!clientId || !clientSecret) {
    throw new Error('Alpaca OAuth is not configured');
  }
  if (!isBrokerTokenEncryptionConfigured()) {
    throw new Error('BROKER_TOKEN_ENCRYPTION_KEY is required before storing broker tokens');
  }

  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: redirectUri,
  });

  const res = await fetch(tokenBase(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });

  const data = (await res.json().catch(() => ({}))) as TokenResponse;
  if (!res.ok || !data.access_token) {
    throw new Error(data.error_description || data.error || `Alpaca token HTTP ${res.status}`);
  }

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token || data.access_token,
    expiresIn: typeof data.expires_in === 'number' ? data.expires_in : null,
    scope: data.scope || null,
  };
}

export async function persistAlpacaConnection(input: {
  uid: string;
  accessToken: string;
  refreshToken: string;
  expiresIn: number | null;
  scope: string | null;
  accountId?: string | null;
}): Promise<void> {
  const environment: BrokerEnvironment = isAlpacaPaperMode() ? 'paper' : 'live';
  const now = new Date().toISOString();
  const tokenExpiresAt =
    input.expiresIn != null
      ? new Date(Date.now() + input.expiresIn * 1000).toISOString()
      : null;

  await saveBrokerConnection({
    uid: input.uid,
    brokerId: 'alpaca',
    environment,
    accessTokenEnc: encryptBrokerSecret(input.accessToken),
    refreshTokenEnc: encryptBrokerSecret(input.refreshToken),
    tokenExpiresAt,
    accountId: input.accountId || null,
    scopes: input.scope,
    connectedAt: now,
    updatedAt: now,
  });
}

export function alpacaConfiguredSummary() {
  return {
    configured: isAlpacaOAuthConfigured(),
    encryptionConfigured: isBrokerTokenEncryptionConfigured(),
    paper: isAlpacaPaperMode(),
    mode: isAlpacaOAuthConfigured() ? ('live' as const) : ('stub' as const),
  };
}
