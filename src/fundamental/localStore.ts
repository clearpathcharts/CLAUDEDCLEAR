import type { ChartWorkspaceId, ResearchSection, StatementPeriod } from './types';

const NOTES_KEY = 'clearpath_fundamental_notes_v1';
const WATCH_KEY = 'clearpath_fundamental_watchlists_v1';
const ALERT_KEY = 'clearpath_fundamental_alert_snapshot_v1';

export type ResearchNote = {
  id: string;
  symbol: string;
  createdAt: number;
  body: string;
  tags: string[];
};

export type Watchlist = {
  id: string;
  name: string;
  group: string;
  symbols: string[];
};

export type StoredAlert = {
  id: string;
  kind: string;
  title: string;
  detail: string;
  at: number;
  symbol: string;
};

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* quota */
  }
}

export function loadNotes(): ResearchNote[] {
  return readJson(NOTES_KEY, []);
}

export function saveNotes(notes: ResearchNote[]): void {
  writeJson(NOTES_KEY, notes);
}

export function loadWatchlists(): Watchlist[] {
  const existing = readJson<Watchlist[]>(WATCH_KEY, []);
  if (existing.length) return existing;
  return [
    { id: 'wl-default', name: 'Research queue', group: 'research status', symbols: ['NVDA', 'AAPL', 'MSFT'] },
  ];
}

export function saveWatchlists(lists: Watchlist[]): void {
  writeJson(WATCH_KEY, lists);
}

export type MetricSnapshot = {
  symbol: string;
  revenue: number | null;
  eps: number | null;
  pe: number | null;
  fetchedAt: number;
};

export function loadPriorSnapshot(symbol: string): MetricSnapshot | null {
  const all = readJson<Record<string, MetricSnapshot>>(ALERT_KEY, {});
  return all[symbol] || null;
}

export function saveSnapshot(snap: MetricSnapshot): void {
  const all = readJson<Record<string, MetricSnapshot>>(ALERT_KEY, {});
  all[snap.symbol] = snap;
  writeJson(ALERT_KEY, all);
}

export const RESEARCH_NAV: { id: ResearchSection; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'financials', label: 'Financials' },
  { id: 'earnings', label: 'Earnings' },
  { id: 'valuation', label: 'Valuation' },
  { id: 'industry', label: 'Industry' },
  { id: 'macro', label: 'Macro' },
  { id: 'news', label: 'News' },
  { id: 'filings', label: 'Filings' },
  { id: 'risk', label: 'Risk' },
  { id: 'workspace', label: 'Workspace' },
];

export const CHART_LAYOUTS: { id: ChartWorkspaceId; label: string; series: string[] }[] = [
  { id: 'business_growth', label: 'Business growth', series: ['Revenue', 'EPS', 'Free Cash Flow', 'Operating Margin'] },
  { id: 'valuation', label: 'Valuation', series: ['P/E', 'EV/EBITDA', 'FCF Yield', 'Price/Sales'] },
  { id: 'quality', label: 'Quality', series: ['ROIC', 'ROE', 'Gross Margin', 'FCF Margin'] },
  { id: 'balance_sheet', label: 'Balance sheet', series: ['Cash', 'Debt', 'Net Debt', 'Debt/EBITDA'] },
  { id: 'earnings', label: 'Earnings', series: ['EPS Estimate vs Actual', 'Revenue Estimate vs Actual', 'Guidance', 'Earnings Surprise'] },
  { id: 'company_vs_industry', label: 'Company vs industry', series: ['Revenue Growth', 'Margin', 'ROIC', 'Valuation'] },
];

export const PERIODS: { id: StatementPeriod; label: string }[] = [
  { id: 'annual', label: 'Annual' },
  { id: 'quarter', label: 'Quarterly' },
  { id: 'ttm', label: 'TTM' },
];
