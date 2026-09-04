/**
 * Educational company directory — public issuers + study-tree subsidiaries.
 * Public issuers canonical to /stocks/{ticker}. Subsidiaries are unique /companies/{slug} pages.
 * Not a live filing database. Missing financials stay DATA UNAVAILABLE.
 */
import { getProceduralStocks } from '../utils/searchEngine';

export const COMPANY_DIRECTORY_DISCLAIMER =
  'Educational corporate-tree directory. Not a live filing database, not a brokerage, and not investment advice. Missing financial cells stay DATA UNAVAILABLE.';

/** Real majors already have honest stock profiles — do not invent fake subsidiaries for them. */
export const REAL_MAJOR_TICKERS = new Set([
  'AAPL',
  'TSLA',
  'MSFT',
  'NVDA',
  'AMZN',
  'GOOGL',
  'META',
  'JPM',
]);

export const COMPANY_UNITS = [
  {
    key: 'logistics-system',
    label: 'Logistics System',
    studyAngle: 'how inventory, shipping, and fulfillment costs feed the parent issuer’s margins',
  },
  {
    key: 'digital-engine',
    label: 'Digital Engine',
    studyAngle: 'software, data, and automation behind the listed equity’s product story',
  },
  {
    key: 'european-ventures',
    label: 'European Ventures',
    studyAngle: 'regional expansion, FX translation, and EU regulatory context for the parent ticker',
  },
  {
    key: 'asian-foundry-group',
    label: 'Asian Foundry Group',
    studyAngle: 'manufacturing, supply-chain, and East-Asia production risk for the parent ticker',
  },
  {
    key: 'real-estate-capital',
    label: 'Real Estate Capital',
    studyAngle: 'property, leases, and capital-allocation choices that sit off the headline product story',
  },
] as const;

export type CompanyUnitKey = (typeof COMPANY_UNITS)[number]['key'];

export type CompanyRecord = {
  slug: string;
  name: string;
  status: 'Public' | 'Subsidiary';
  sector: string;
  industry?: string;
  ticker?: string;
  parentCompany?: string;
  parentTicker?: string;
  unitKey?: CompanyUnitKey;
  unitLabel?: string;
  capitalTier?: string;
  description: string;
  seoTitle: string;
  seoDescription: string;
};

export function slugifyCompanyName(raw: string): string {
  const slug = raw
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
  return slug || 'company';
}

function uniqueStocks(): any[] {
  const byTicker = new Map<string, any>();
  for (const s of getProceduralStocks()) {
    const t = String(s.ticker || '').toUpperCase();
    if (!t) continue;
    if (!byTicker.has(t)) byTicker.set(t, s);
  }
  return [...byTicker.values()];
}

function publicDescription(stock: any): string {
  const company = String(stock.company || stock.ticker);
  const ticker = String(stock.ticker).toUpperCase();
  const sector = stock.sector ? ` in ${stock.sector}` : '';
  return `${company} (${ticker}) is the public issuer${sector} in the ClearPath equity encyclopedia. Open the stock profile for educational context. Live filings stay DATA UNAVAILABLE unless a vendor cell is filled.`;
}

function subsidiaryDescription(name: string, stock: any, unit: (typeof COMPANY_UNITS)[number]): string {
  const ticker = String(stock.ticker).toUpperCase();
  const parent = String(stock.company || ticker);
  const sector = stock.sector || 'equity';
  return `${name} is an educational study node under ${parent} (${ticker}) in the ${sector} sector. Use it to practice ${unit.studyAngle}. Not a live subsidiary filing — financials stay DATA UNAVAILABLE.`;
}

function clampDesc(raw: string, max = 160): string {
  const t = raw.replace(/\s+/g, ' ').trim();
  if (t.length <= max) return t;
  const cut = t.slice(0, max - 1);
  const sp = cut.lastIndexOf(' ');
  return `${(sp > 100 ? cut.slice(0, sp) : cut).trimEnd()}…`;
}

let cached: CompanyRecord[] | null = null;
let bySlug: Map<string, CompanyRecord> | null = null;

function buildCatalog(): void {
  const stocks = uniqueStocks();
  const list: CompanyRecord[] = [];
  const slugs = new Set<string>();

  const takeSlug = (preferred: string, fallback: string): string => {
    let slug = preferred;
    if (!slug || slugs.has(slug)) slug = fallback;
    let n = 2;
    while (slugs.has(slug)) {
      slug = `${fallback}-${n}`;
      n += 1;
    }
    slugs.add(slug);
    return slug;
  };

  for (const stock of stocks) {
    const ticker = String(stock.ticker).toUpperCase();
    const tickerSlug = ticker.toLowerCase().replace(/[^a-z0-9.-]/g, '');
    const company = String(stock.company || ticker);
    const pubDesc = publicDescription(stock);
    const pub: CompanyRecord = {
      slug: takeSlug(tickerSlug, slugifyCompanyName(company)),
      name: company,
      status: 'Public',
      sector: String(stock.sector || ''),
      industry: stock.industry ? String(stock.industry) : undefined,
      ticker,
      description: pubDesc,
      seoTitle: `${company} (${ticker}) | ClearPathTrader Directory`,
      seoDescription: clampDesc(
        `${company} (${ticker}) public issuer in the ClearPath company directory — educational stock profile, not a live filing.`,
      ),
    };
    list.push(pub);
    const nameSlug = slugifyCompanyName(company);
    if (nameSlug !== pub.slug && !slugs.has(nameSlug)) {
      slugs.add(nameSlug);
    }

    if (REAL_MAJOR_TICKERS.has(ticker)) continue;

    for (let i = 0; i < COMPANY_UNITS.length; i++) {
      const unit = COMPANY_UNITS[i];
      const parentName = company.replace(/\s+Inc\.?$/i, '').trim() || company;
      const name = `${parentName} ${unit.label}`;
      const desc = subsidiaryDescription(name, stock, unit);
      const rec: CompanyRecord = {
        slug: takeSlug(slugifyCompanyName(name), `${tickerSlug}-${unit.key}`),
        name,
        status: 'Subsidiary',
        sector: String(stock.sector || ''),
        industry: stock.industry ? String(stock.industry) : undefined,
        parentCompany: company,
        parentTicker: ticker,
        unitKey: unit.key,
        unitLabel: unit.label,
        capitalTier: `Tier ${i + 1}`,
        description: desc,
        seoTitle: `${name} | ClearPathTrader Directory`,
        seoDescription: clampDesc(desc),
      };
      list.push(rec);
    }
  }

  cached = list;
  bySlug = new Map();
  for (const rec of list) {
    bySlug.set(rec.slug, rec);
    if (rec.ticker) {
      const t = rec.ticker.toLowerCase();
      if (!bySlug.has(t)) bySlug.set(t, rec);
    }
    if (rec.status === 'Public') {
      const ns = slugifyCompanyName(rec.name);
      if (!bySlug.has(ns)) bySlug.set(ns, rec);
    }
  }
}

function ensureCatalog(): void {
  if (!cached) buildCatalog();
}

export function getCompanyCatalog(): CompanyRecord[] {
  ensureCatalog();
  return cached!;
}

export function lookupCompany(slug: string): CompanyRecord | null {
  ensureCatalog();
  const key = String(slug || '')
    .toLowerCase()
    .replace(/^\/companies\//, '')
    .replace(/\/$/, '');
  return bySlug!.get(key) || null;
}

export function companyCatalogCounts() {
  ensureCatalog();
  let publicIssuers = 0;
  let subsidiaries = 0;
  for (const rec of cached!) {
    if (rec.status === 'Public') publicIssuers += 1;
    else subsidiaries += 1;
  }
  return {
    total: cached!.length,
    publicIssuers,
    subsidiaries,
  };
}

export function featuredCompanies(limit = 16): CompanyRecord[] {
  ensureCatalog();
  const prefer = ['aapl', 'tsla', 'msft', 'nvda', 'amzn', 'googl', 'meta', 'jpm'];
  const out: CompanyRecord[] = [];
  for (const t of prefer) {
    const rec = bySlug!.get(t);
    if (rec) out.push(rec);
  }
  for (const rec of cached!) {
    if (out.length >= limit) break;
    if (out.includes(rec)) continue;
    if (rec.status !== 'Public') continue;
    out.push(rec);
  }
  return out.slice(0, limit);
}

export function relatedCompanies(rec: CompanyRecord, limit = 4): CompanyRecord[] {
  ensureCatalog();
  const out: CompanyRecord[] = [];
  if (rec.parentTicker) {
    for (const c of cached!) {
      if (c.slug === rec.slug) continue;
      if (c.parentTicker === rec.parentTicker || c.ticker === rec.parentTicker) {
        out.push(c);
        if (out.length >= limit) return out;
      }
    }
  }
  for (const c of cached!) {
    if (out.length >= limit) break;
    if (c.slug === rec.slug) continue;
    if (rec.sector && c.sector !== rec.sector) continue;
    if (c.status !== rec.status) continue;
    out.push(c);
  }
  return out;
}
