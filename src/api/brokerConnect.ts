export type BrokerPublicStatus = {
  brokerId: string;
  label: string;
  configured: boolean;
  connected: boolean;
  environment: 'paper' | 'live' | null;
  accountId: string | null;
  connectedAt: string | null;
  mode: 'live' | 'stub';
};

export type BrokerStatusResponse = {
  ok: boolean;
  model: string;
  note: string;
  brokers: Record<string, BrokerPublicStatus>;
};

export type AlpacaAccountSummary = {
  id: string | null;
  account_number: string | null;
  status: string | null;
  currency: string | null;
  buying_power: string | null;
  cash: string | null;
  portfolio_value: string | null;
  equity: string | null;
};

export type AlpacaOrderSummary = {
  id: string | null;
  status: string | null;
  symbol: string | null;
  qty: string | null;
  side: string | null;
  type: string | null;
  submitted_at: string | null;
};

export async function fetchBrokerStatus(): Promise<BrokerStatusResponse> {
  const res = await fetch('/api/broker/status', { credentials: 'include' });
  if (!res.ok) throw new Error(`Broker status HTTP ${res.status}`);
  return res.json();
}

/** Starts Alpaca OAuth — browser navigates to authorize URL (session cookie required). */
export function startAlpacaConnect(returnTo = '/?tab=Biography#Biography'): void {
  const q = encodeURIComponent(returnTo);
  window.location.href = `/api/broker/alpaca/authorize?returnTo=${q}`;
}

export async function disconnectAlpaca(): Promise<void> {
  const res = await fetch('/api/broker/alpaca/disconnect', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.error || `Disconnect HTTP ${res.status}`);
  }
}

export async function fetchAlpacaAccount(): Promise<{
  ok: boolean;
  account: AlpacaAccountSummary;
  environment: 'paper' | 'live';
}> {
  const res = await fetch('/api/broker/alpaca/account', { credentials: 'include' });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body?.error || `Account HTTP ${res.status}`);
  return body;
}

export async function submitAlpacaOrder(input: {
  symbol: string;
  qty: number;
  side: 'buy' | 'sell';
  type: 'market' | 'limit';
  limit_price?: number;
  time_in_force?: 'day' | 'gtc';
  passThroughAcknowledged: boolean;
}): Promise<{ ok: boolean; order: AlpacaOrderSummary; executedBy: string }> {
  const res = await fetch('/api/broker/alpaca/orders', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body?.error || `Order HTTP ${res.status}`);
  return body;
}
