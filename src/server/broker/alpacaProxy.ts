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

export type AlpacaOrderInput = {
  symbol: string;
  qty: number;
  side: 'buy' | 'sell';
  type: 'market' | 'limit';
  limit_price?: number;
  time_in_force?: 'day' | 'gtc';
};

function sanitizeOrder(raw: Record<string, unknown>) {
  return {
    id: raw.id != null ? String(raw.id) : null,
    status: raw.status != null ? String(raw.status) : null,
    symbol: raw.symbol != null ? String(raw.symbol) : null,
    qty: raw.qty != null ? String(raw.qty) : null,
    side: raw.side != null ? String(raw.side) : null,
    type: raw.type != null ? String(raw.type) : null,
    submitted_at: raw.submitted_at != null ? String(raw.submitted_at) : null,
  };
}

/** Pass-through order — Alpaca executes; ClearPath is not counterparty. */
export async function submitAlpacaOrder(uid: string, input: AlpacaOrderInput) {
  const record = await connectionWithFreshToken(uid);
  const accessToken = decryptBrokerSecret(record.accessTokenEnc);
  const base = getAlpacaApiBase(record.environment);

  const symbol = String(input.symbol || '')
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9./]/g, '')
    .slice(0, 24);
  if (!symbol) throw new Error('Invalid symbol');

  const qty = Number(input.qty);
  if (!Number.isFinite(qty) || qty <= 0 || qty > 1_000_000) {
    throw new Error('Invalid quantity');
  }

  const payload: Record<string, unknown> = {
    symbol,
    qty: Math.floor(qty),
    side: input.side,
    type: input.type,
    time_in_force: input.time_in_force || 'day',
  };
  if (input.type === 'limit') {
    const lp = Number(input.limit_price);
    if (!Number.isFinite(lp) || lp <= 0) throw new Error('Limit price required');
    payload.limit_price = lp;
  }

  const res = await fetch(`${base}/v2/orders`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  const body = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok) {
    const msg =
      typeof body.message === 'string' ? body.message : `Alpaca order HTTP ${res.status}`;
    throw new Error(msg);
  }
  return sanitizeOrder(body);
}

export async function listAlpacaOrders(uid: string, limit = 20) {
  const raw = await alpacaFetch(uid, `/v2/orders?status=all&limit=${Math.min(limit, 50)}`);
  if (!Array.isArray(raw)) return [];
  return raw.map((row) => sanitizeOrder(row as Record<string, unknown>));
}
