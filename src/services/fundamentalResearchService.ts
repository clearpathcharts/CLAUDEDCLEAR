/// <reference types="vite/client" />

/** Live company research pack. Missing feeds stay null — never fabricated. */

export type FmpRecord = Record<string, unknown>;

export interface FundamentalResearchPack {
  symbol: string;
  fetchedAt: string;
  quote: FmpRecord | null;
  profile: FmpRecord | null;
  income: FmpRecord[];
  balance: FmpRecord[];
  cash: FmpRecord[];
  metrics: FmpRecord[];
  ratios: FmpRecord[];
  executives: FmpRecord[];
  surprises: FmpRecord[];
  filings: FmpRecord[];
  news: Array<{ title: string; source: string; pubDate?: string; link?: string; category?: string }>;
  errors: string[];
}

function num(v: unknown): number | null {
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  if (typeof v === 'string' && v.trim() && Number.isFinite(Number(v))) return Number(v);
  return null;
}

function str(v: unknown): string | null {
  if (typeof v === 'string' && v.trim()) return v.trim();
  return null;
}

function asRecords(data: unknown): FmpRecord[] {
  if (!Array.isArray(data)) return [];
  return data.filter((row): row is FmpRecord => !!row && typeof row === 'object' && !Array.isArray(row));
}

async function fmp(endpoint: string, symbol: string, limit?: number): Promise<unknown> {
  const q = limit ? `?limit=${limit}` : '';
  const res = await fetch(`/api/fmp/${endpoint}/${encodeURIComponent(symbol)}${q}`);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const msg = typeof (body as { message?: string }).message === 'string'
      ? (body as { message: string }).message
      : `HTTP ${res.status}`;
    throw new Error(`${endpoint}: ${msg}`);
  }
  return res.json();
}

export async function fetchFundamentalResearch(symbol: string): Promise<FundamentalResearchPack> {
  const ticker = symbol.trim().toUpperCase();
  const errors: string[] = [];
  const fetchedAt = new Date().toISOString();

  const settle = async <T,>(label: string, fn: () => Promise<T>, fallback: T): Promise<T> => {
    try {
      return await fn();
    } catch (e) {
      errors.push(`${label}: ${e instanceof Error ? e.message : 'failed'}`);
      return fallback;
    }
  };

  const [quoteRaw, profileRaw, income, balance, cash, metrics, ratios, executives, surprises, filings, newsRaw] =
    await Promise.all([
      settle('quote', () => fmp('quote', ticker), null),
      settle('profile', () => fmp('profile', ticker), null),
      settle('income', () => fmp('income-statement', ticker, 6), []),
      settle('balance', () => fmp('balance-sheet-statement', ticker, 6), []),
      settle('cash', () => fmp('cash-flow-statement', ticker, 6), []),
      settle('metrics', () => fmp('key-metrics', ticker, 8), []),
      settle('ratios', () => fmp('ratios', ticker, 8), []),
      settle('executives', () => fmp('key-executives', ticker), []),
      settle('earnings', () => fmp('earnings-surprises', ticker, 8), []),
      settle('filings', () => fmp('sec_filings', ticker, 12), []),
      settle('news', async () => {
        const res = await fetch('/api/newsdata/latest');
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      }, []),
    ]);

  const quoteList = asRecords(quoteRaw);
  const profileList = asRecords(profileRaw);
  const companyName = str(profileList[0]?.companyName) || ticker;

  const news = asRecords(newsRaw)
    .map((item) => ({
      title: str(item.title) || '',
      source: str(item.source) || str(item.source_id) || 'Wire',
      pubDate: str(item.pubDate) || str(item.published_at) || undefined,
      link: str(item.link) || str(item.url) || undefined,
      category: str(item.category) || undefined,
    }))
    .filter((n) => n.title)
    .filter((n) => {
      const hay = `${n.title} ${n.source}`.toUpperCase();
      return hay.includes(ticker) || hay.includes(companyName.toUpperCase().slice(0, 18));
    })
    .slice(0, 8);

  return {
    symbol: ticker,
    fetchedAt,
    quote: quoteList[0] ?? null,
    profile: profileList[0] ?? null,
    income: asRecords(income),
    balance: asRecords(balance),
    cash: asRecords(cash),
    metrics: asRecords(metrics),
    ratios: asRecords(ratios),
    executives: asRecords(executives),
    surprises: asRecords(surprises),
    filings: asRecords(filings),
    news,
    errors,
  };
}

export function n(row: FmpRecord | null | undefined, key: string): number | null {
  return num(row?.[key]);
}

export function s(row: FmpRecord | null | undefined, key: string): string | null {
  return str(row?.[key]);
}

export function series(rows: FmpRecord[], key: string): Array<{ label: string; value: number }> {
  return [...rows]
    .reverse()
    .map((row) => {
      const label = str(row.calendarYear) || str(row.date)?.slice(0, 7) || '';
      const value = num(row[key]);
      return label && value !== null ? { label, value } : null;
    })
    .filter((x): x is { label: string; value: number } => x !== null);
}

export function yoy(values: number[]): number | null {
  if (values.length < 2) return null;
  const prev = values[values.length - 2];
  const last = values[values.length - 1];
  if (!prev) return null;
  return (last - prev) / Math.abs(prev);
}

export function cagr(values: number[]): number | null {
  if (values.length < 3) return null;
  const first = values[0];
  const last = values[values.length - 1];
  const years = values.length - 1;
  if (first <= 0 || last <= 0) return null;
  return Math.pow(last / first, 1 / years) - 1;
}

export function rangeOf(values: number[]): { low: number; high: number; current: number } | null {
  const clean = values.filter((v) => Number.isFinite(v));
  if (!clean.length) return null;
  return {
    low: Math.min(...clean),
    high: Math.max(...clean),
    current: clean[0],
  };
}

export function formatMoney(v: number | null, digits = 1): string {
  if (v === null) return '—';
  const abs = Math.abs(v);
  const sign = v < 0 ? '-' : '';
  if (abs >= 1e12) return `${sign}$${(abs / 1e12).toFixed(digits)}T`;
  if (abs >= 1e9) return `${sign}$${(abs / 1e9).toFixed(digits)}B`;
  if (abs >= 1e6) return `${sign}$${(abs / 1e6).toFixed(digits)}M`;
  if (abs >= 1e3) return `${sign}$${(abs / 1e3).toFixed(digits)}K`;
  return `${sign}$${abs.toFixed(digits)}`;
}

export function formatPct(v: number | null, digits = 1): string {
  if (v === null) return '—';
  const pct = Math.abs(v) <= 1.5 ? v * 100 : v;
  return `${pct.toFixed(digits)}%`;
}

export function formatRatio(v: number | null, digits = 1): string {
  if (v === null) return '—';
  return v.toFixed(digits);
}

export function formatPrice(v: number | null): string {
  if (v === null) return '—';
  return `$${v.toLocaleString('en-US', { maximumFractionDigits: 2, minimumFractionDigits: 2 })}`;
}
