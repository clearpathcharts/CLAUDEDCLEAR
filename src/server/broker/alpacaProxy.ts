/**
 * Server-side pass-through to Alpaca REST — user bearer token never sent to browser.
 */
import {
  getAlpacaApiBase,
  getAlpacaClientId,
  getAlpacaClientSecret,
} from '../secrets';
import { decryptBrokerSecret, encryptBrokerSecret } from './tokenCrypto';
import { loadBrokerConnection, saveBrokerConnection } from './brokerConnectionStore';
import type { BrokerConnectionRecord } from './types';

async function refreshAlpacaAccessToken(record: BrokerConnectionRecord): Promise<BrokerConnectionRecord> {
  const refreshToken = decryptBrokerSecret(record.refreshTokenEnc);
  const clientId = getAlpacaClientId();
  const clientSecret = getAlpacaClientSecret();
  if (!clientId || !clientSecret) throw new Error('Alpaca OAuth not configured');

  const tokenUrl = (process.env.ALPACA_OAUTH_TOKEN_URL || 'https://api.alpaca.markets/oauth/token').replace(/\/$/, '');
  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
    client_id: clientId,
    client_secret: clientSecret,
  });

  const res = await fetch(tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });
  const data = (await res.json().catch(() => ({}))) as {
    access_token?: string;
    refresh_token?: string;
    expires_in?: number;
  };
  if (!res.ok || !data.access_token) {
    throw new Error(`Alpaca token refresh failed (HTTP ${res.status})`);
  }

  const updated: BrokerConnectionRecord = {
    ...record,
    accessTokenEnc: encryptBrokerSecret(data.access_token),
    refreshTokenEnc: encryptBrokerSecret(data.refresh_token || refreshToken),
    tokenExpiresAt:
      typeof data.expires_in === 'number'
        ? new Date(Date.now() + data.expires_in * 1000).toISOString()
        : record.tokenExpiresAt,
    updatedAt: new Date().toISOString(),
  };
  await saveBrokerConnection(updated);
  return updated;
}

async function connectionWithFreshToken(uid: string): Promise<BrokerConnectionRecord> {
  let record = await loadBrokerConnection(uid, 'alpaca');
  if (!record) throw new Error('No Alpaca connection for this account');

  const expires = record.tokenExpiresAt ? Date.parse(record.tokenExpiresAt) : null;
  if (expires != null && expires <= Date.now() + 60_000) {
    record = await refreshAlpacaAccessToken(record);
  }
  return record;
}

async function alpacaFetch(uid: string, path: string): Promise<unknown> {
  const record = await connectionWithFreshToken(uid);
  const accessToken = decryptBrokerSecret(record.accessTokenEnc);
  const base = getAlpacaApiBase(record.environment);
  const res = await fetch(`${base}${path}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/json',
    },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg =
      typeof (body as { message?: string }).message === 'string'
        ? (body as { message: string }).message
        : `Alpaca HTTP ${res.status}`;
    throw new Error(msg);
  }
  return body;
}

/** Sanitized account summary — no tokens. */
export async function fetchAlpacaAccountSummary(uid: string): Promise<Record<string, unknown>> {
  const raw = (await alpacaFetch(uid, '/v2/account')) as Record<string, unknown>;
  return {
    id: raw.id ?? null,
    account_number: raw.account_number ?? null,
    status: raw.status ?? null,
    currency: raw.currency ?? null,
    buying_power: raw.buying_power ?? null,
    cash: raw.cash ?? null,
    portfolio_value: raw.portfolio_value ?? null,
    pattern_day_trader: raw.pattern_day_trader ?? null,
    trading_blocked: raw.trading_blocked ?? null,
    transfers_blocked: raw.transfers_blocked ?? null,
    equity: raw.equity ?? null,
  };
}

export async function fetchAlpacaPositions(uid: string): Promise<unknown[]> {
  const raw = await alpacaFetch(uid, '/v2/positions');
  return Array.isArray(raw) ? raw : [];
}
