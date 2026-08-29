/** Retail desk local persistence: watchlists, alerts, session snapshot. Never invents market data. */

export type RetailWatchlist = {
  id: string;
  name: string;
  symbols: string[];
};

export type RetailAlertKind =
  | 'price_above'
  | 'price_below'
  | 'pct_change'
  | 'volume_change'
  | 'news'
  | 'economic'
  | 'watchlist';

export type RetailAlert = {
  id: string;
  kind: RetailAlertKind;
  symbol: string;
  threshold?: number;
  note: string;
  createdAt: number;
  enabled: boolean;
};

export type RetailSessionSnapshot = {
  at: number;
  symbol: string;
  price: number | null;
  volume: number | null;
  newsCount: number;
  econCount: number;
  volPct: number | null;
};

const WL_KEY = 'clearpath_retail_watchlists_v1';
const ALERT_KEY = 'clearpath_retail_alerts_v1';
const SNAP_KEY = 'clearpath_retail_session_snap_v1';
const ACTIVE_WL_KEY = 'clearpath_retail_active_watchlist_v1';

export const DEFAULT_WATCHLISTS: RetailWatchlist[] = [
  {
    id: 'my',
    name: 'MY WATCHLIST',
    symbols: ['EURUSD', 'GBPUSD', 'USDJPY', 'AUDUSD', 'USDCAD', 'SPX', 'NDX', 'XAUUSD', 'BTCUSD'],
  },
  {
    id: 'forex',
    name: 'FOREX',
    symbols: ['EURUSD', 'GBPUSD', 'USDJPY', 'AUDUSD', 'USDCAD', 'NZDUSD', 'USDCHF'],
  },
  {
    id: 'stocks',
    name: 'STOCKS',
    symbols: ['AAPL', 'MSFT', 'NVDA', 'AMZN', 'TSLA', 'META', 'GOOGL'],
  },
  {
    id: 'crypto',
    name: 'CRYPTO',
    symbols: ['BTCUSD', 'ETHUSD', 'SOLUSD'],
  },
  {
    id: 'favorites',
    name: 'FAVORITES',
    symbols: ['XAUUSD', 'EURUSD', 'SPX', 'BTCUSD'],
  },
];

function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function loadWatchlists(): RetailWatchlist[] {
  if (typeof localStorage === 'undefined') return DEFAULT_WATCHLISTS.map((w) => ({ ...w, symbols: [...w.symbols] }));
  const stored = safeParse<RetailWatchlist[] | null>(localStorage.getItem(WL_KEY), null);
  if (!stored || !Array.isArray(stored) || stored.length === 0) {
    return DEFAULT_WATCHLISTS.map((w) => ({ ...w, symbols: [...w.symbols] }));
  }
  return stored.map((w) => ({
    id: String(w.id),
    name: String(w.name || 'WATCHLIST'),
    symbols: Array.isArray(w.symbols)
      ? w.symbols.map((s) => String(s).toUpperCase()).filter(Boolean)
      : [],
  }));
}

export function saveWatchlists(lists: RetailWatchlist[]): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(WL_KEY, JSON.stringify(lists));
}

export function loadActiveWatchlistId(): string {
  if (typeof localStorage === 'undefined') return 'my';
  return localStorage.getItem(ACTIVE_WL_KEY) || 'my';
}

export function saveActiveWatchlistId(id: string): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(ACTIVE_WL_KEY, id);
}

export function loadAlerts(): RetailAlert[] {
  if (typeof localStorage === 'undefined') return [];
  const stored = safeParse<RetailAlert[]>(localStorage.getItem(ALERT_KEY), []);
  if (!Array.isArray(stored)) return [];
  return stored.map((a) => ({
    id: String(a.id),
    kind: a.kind,
    symbol: String(a.symbol || '').toUpperCase(),
    threshold: typeof a.threshold === 'number' ? a.threshold : undefined,
    note: String(a.note || ''),
    createdAt: typeof a.createdAt === 'number' ? a.createdAt : Date.now(),
    enabled: a.enabled !== false,
  }));
}

export function saveAlerts(alerts: RetailAlert[]): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(ALERT_KEY, JSON.stringify(alerts));
}

export function loadSessionSnapshot(): RetailSessionSnapshot | null {
  if (typeof localStorage === 'undefined') return null;
  return safeParse<RetailSessionSnapshot | null>(localStorage.getItem(SNAP_KEY), null);
}

export function saveSessionSnapshot(snap: RetailSessionSnapshot): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(SNAP_KEY, JSON.stringify(snap));
}

export function newAlertId(): string {
  return `alert_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}
