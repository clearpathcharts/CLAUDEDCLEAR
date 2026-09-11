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
