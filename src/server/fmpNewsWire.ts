/**
 * Live desk news + economic calendar from Financial Modeling Prep.
 * Never invents headlines or CPI/NFP prints — empty FMP payloads stay empty.
 */
import { getFmpApiKey } from './secrets';

const FMP_STABLE = 'https://financialmodelingprep.com/stable';

export type DeskWireItem = {
  title: string;
  source: string;
  category: string;
  pubDate?: string;
  link?: string;
  description?: string;
};

function isoDay(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function finiteLabel(value: unknown): string | null {
  if (value == null || value === '') return null;
  const n = Number(value);
  if (Number.isFinite(n)) return String(n);
  const s = String(value).trim();
  return s.length ? s : null;
}

async function fmpGet(url: string): Promise<unknown> {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetch(url, { signal: controller.signal, redirect: 'error' });
    if (!res.ok) throw new Error(`FMP HTTP ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(t);
  }
}

export function normalizeFmpNewsArticle(row: Record<string, unknown>, category: string): DeskWireItem | null {
  const title = String(row.title ?? '').trim();
  if (!title) return null;
  const pub = String(row.publishedDate ?? row.publishedAt ?? row.date ?? '').trim();
  const source = String(row.publisher ?? row.site ?? row.symbol ?? 'FMP').trim() || 'FMP';
  const link = String(row.url ?? row.link ?? '').trim();
  const description = String(row.text ?? row.snippet ?? '').trim();
  return {
    title,
    source: source.toUpperCase(),
    category,
    pubDate: pub || undefined,
    link: link || undefined,
    description: description || undefined,
  };
}

export function normalizeFmpCalendarEvent(row: Record<string, unknown>): DeskWireItem | null {
  const event = String(row.event ?? row.title ?? '').trim();
  if (!event) return null;
  const currency = String(row.currency ?? '').trim().toUpperCase();
  const country = String(row.country ?? '').trim().toUpperCase();
  const impact = String(row.impact ?? '').trim().toUpperCase();
  const actual = finiteLabel(row.actual);
  const estimate = finiteLabel(row.estimate ?? row.forecast);
  const previous = finiteLabel(row.previous);
  const bits: string[] = [];
  if (actual) bits.push(`actual ${actual}`);
  if (estimate) bits.push(`est ${estimate}`);
  if (previous) bits.push(`prev ${previous}`);
  const prefix = [currency || country, event].filter(Boolean).join(' ');
  const title = bits.length ? `${prefix} · ${bits.join(' · ')}` : prefix;
  const sourceParts = ['FMP', country || null, impact || null].filter(Boolean);
  return {
    title,
    source: sourceParts.join(' · '),
    category: impact || 'CALENDAR',
    pubDate: String(row.date ?? '').trim() || undefined,
    description: bits.length ? bits.join(', ') : undefined,
  };
}

function dedupeByTitle(items: DeskWireItem[]): DeskWireItem[] {
  const seen = new Set<string>();
  const out: DeskWireItem[] = [];
  for (const item of items) {
    const key = item.title.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }
  return out;
}

function sortByDateDesc(items: DeskWireItem[]): DeskWireItem[] {
  return [...items].sort((a, b) => {
    const ta = a.pubDate ? Date.parse(a.pubDate) : 0;
    const tb = b.pubDate ? Date.parse(b.pubDate) : 0;
    return (Number.isFinite(tb) ? tb : 0) - (Number.isFinite(ta) ? ta : 0);
  });
}

async function fetchNewsFeed(path: string, category: string, apiKey: string): Promise<DeskWireItem[]> {
  const url = `${FMP_STABLE}/${path}?page=0&limit=20&apikey=${encodeURIComponent(apiKey)}`;
  try {
    const data = await fmpGet(url);
    const rows = Array.isArray(data) ? data : [];
    const mapped: DeskWireItem[] = [];
    for (const row of rows) {
      if (!row || typeof row !== 'object') continue;
      const item = normalizeFmpNewsArticle(row as Record<string, unknown>, category);
      if (item) mapped.push(item);
    }
    return mapped;
  } catch {
    return [];
  }
}

/** Forex + crypto + equity headlines — the 24h trading wire. */
export async function fetchFmpDeskNews(): Promise<DeskWireItem[]> {
  const apiKey = getFmpApiKey();
  if (!apiKey) return [];
  const batches = await Promise.all([
    fetchNewsFeed('news/forex-latest', 'FOREX', apiKey),
    fetchNewsFeed('news/crypto-latest', 'CRYPTO', apiKey),
    fetchNewsFeed('news/stock-latest', 'MARKET', apiKey),
  ]);
  return sortByDateDesc(dedupeByTitle(batches.flat())).slice(0, 40);
}

const IMPACT_RANK: Record<string, number> = { HIGH: 0, MEDIUM: 1, LOW: 2 };

/** Timed economic releases (NFP, CPI, FOMC) — never fabricated. */
export async function fetchFmpEconomicWire(): Promise<DeskWireItem[]> {
  const apiKey = getFmpApiKey();
  if (!apiKey) return [];
  const from = new Date();
  from.setUTCDate(from.getUTCDate() - 1);
  const to = new Date();
  to.setUTCDate(to.getUTCDate() + 7);
  const url =
    `${FMP_STABLE}/economic-calendar?from=${isoDay(from)}&to=${isoDay(to)}&apikey=${encodeURIComponent(apiKey)}`;
  try {
    const data = await fmpGet(url);
    const rows = Array.isArray(data) ? data : [];
    const mapped: DeskWireItem[] = [];
    for (const row of rows) {
      if (!row || typeof row !== 'object') continue;
      const item = normalizeFmpCalendarEvent(row as Record<string, unknown>);
      if (item) mapped.push(item);
    }
    mapped.sort((a, b) => {
      const ia = IMPACT_RANK[a.category] ?? 9;
      const ib = IMPACT_RANK[b.category] ?? 9;
      if (ia !== ib) return ia - ib;
      const ta = a.pubDate ? Date.parse(a.pubDate) : 0;
      const tb = b.pubDate ? Date.parse(b.pubDate) : 0;
      return (Number.isFinite(ta) ? ta : 0) - (Number.isFinite(tb) ? tb : 0);
    });
    return mapped.slice(0, 40);
  } catch {
    return [];
  }
}
