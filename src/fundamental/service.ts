import type {
  DataAvailability,
  FilingItem,
  FundamentalBundle,
  InsiderRow,
  MacroPoint,
  NewsItem,
  SearchHit,
  StatementPeriod,
} from './types';
import { asFinite, classifyNewsCategory } from './format';
import { searchIdentityCatalog } from './searchCatalog';

type FetchOk<T> = { ok: true; data: T };
type FetchFail = { ok: false; availability: DataAvailability };
type FetchResult<T> = FetchOk<T> | FetchFail;

async function getJson(url: string): Promise<FetchResult<unknown>> {
  try {
    const res = await fetch(url);
    if (res.status === 503) return { ok: false, availability: 'unconfigured' };
    if (res.status === 429) return { ok: false, availability: 'delayed' };
    if (!res.ok) return { ok: false, availability: 'unavailable' };
    const data = await res.json();
    if (data && typeof data === 'object' && 'error' in data && (data as { error?: unknown }).error) {
      return { ok: false, availability: 'unavailable' };
    }
    return { ok: true, data };
  } catch {
    return { ok: false, availability: 'unavailable' };
  }
}

function asArray(data: unknown): Record<string, unknown>[] | null {
  if (!Array.isArray(data) || data.length === 0) return null;
  return data as Record<string, unknown>[];
}

function firstRecord(data: unknown): Record<string, unknown> | null {
  if (Array.isArray(data) && data[0] && typeof data[0] === 'object') return data[0] as Record<string, unknown>;
  if (data && typeof data === 'object' && !Array.isArray(data)) return data as Record<string, unknown>;
  return null;
}

async function fmpSymbol(endpoint: string, symbol: string, query = ''): Promise<FetchResult<unknown>> {
  const q = query ? (query.startsWith('?') ? query : `?${query}`) : '';
  return getJson(`/api/fmp/${endpoint}/${encodeURIComponent(symbol)}${q}`);
}

async function fmpLookup(kind: string, params: Record<string, string>): Promise<FetchResult<unknown>> {
  const sp = new URLSearchParams({ kind, ...params });
  return getJson(`/api/fmp/lookup?${sp.toString()}`);
}

const MACRO_SERIES: { id: string; label: string; unit: string; seriesId: string }[] = [
  { id: 'gdp', label: 'GDP', unit: 'USD bn (SAAR)', seriesId: 'GDP' },
  { id: 'cpi', label: 'CPI', unit: 'index', seriesId: 'CPIAUCSL' },
  { id: 'ppi', label: 'PPI', unit: 'index', seriesId: 'PPIACO' },
  { id: 'unemployment', label: 'Unemployment', unit: '%', seriesId: 'UNRATE' },
  { id: 'payrolls', label: 'Nonfarm payrolls', unit: 'thousands', seriesId: 'PAYEMS' },
  { id: 'pmi', label: 'ISM-equivalent activity (INDPRO)', unit: 'index', seriesId: 'INDPRO' },
  { id: 'confidence', label: 'Consumer sentiment', unit: 'index', seriesId: 'UMCSENT' },
  { id: 'retail', label: 'Retail sales', unit: 'USD mn', seriesId: 'RSAFS' },
];

const RATE_SERIES: { id: string; label: string; unit: string; seriesId: string }[] = [
  { id: 'fed', label: 'Policy rate (Fed funds)', unit: '%', seriesId: 'FEDFUNDS' },
  { id: 'dgs2', label: '2Y Treasury', unit: '%', seriesId: 'DGS2' },
  { id: 'dgs10', label: '10Y Treasury', unit: '%', seriesId: 'DGS10' },
  { id: 'dgs30', label: '30Y Treasury', unit: '%', seriesId: 'DGS30' },
  { id: 'real10', label: '10Y TIPS real yield', unit: '%', seriesId: 'DFII10' },
];

const COMMODITY_SERIES: { id: string; label: string; unit: string; seriesId: string }[] = [
  { id: 'oil', label: 'WTI oil', unit: 'USD/bbl', seriesId: 'DCOILWTICO' },
  { id: 'gas', label: 'Henry Hub gas', unit: 'USD/mmbtu', seriesId: 'DHHNGSP' },
  { id: 'copper', label: 'Copper', unit: 'USD/mt', seriesId: 'PCOPPUSDM' },
  { id: 'gold', label: 'Gold (London AM)', unit: 'USD/oz', seriesId: 'GOLDAMGBD228NLBM' },
];

async function fetchFredPoint(seriesId: string, label: string, unit: string, id: string): Promise<MacroPoint> {
  const result = await getJson(`/api/fred/observations?series_id=${encodeURIComponent(seriesId)}&limit=2`);
  if (!result.ok) {
    return {
      id,
      label,
      value: null,
      date: null,
      unit,
      source: 'ECONOMIC DATA PROVIDER (FRED)',
      seriesId,
    };
  }
  const observations = (result.data as { observations?: Array<{ date?: string; value?: string }> }).observations || [];
  const latest = observations.find((o) => o.value && o.value !== '.');
  return {
    id,
    label,
    value: latest ? asFinite(latest.value) : null,
    date: latest?.date || null,
    unit,
    source: 'ECONOMIC DATA PROVIDER (FRED)',
    seriesId,
  };
}

async function pool<T, R>(items: T[], size: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const out: R[] = [];
  for (let i = 0; i < items.length; i += size) {
    out.push(...(await Promise.all(items.slice(i, i + size).map(fn))));
  }
  return out;
}

let macroCache: { at: number; macro: MacroPoint[]; rates: MacroPoint[]; commodities: MacroPoint[] } | null = null;

async function loadMacroFamily() {
  if (macroCache && Date.now() - macroCache.at < 10 * 60 * 1000) {
    return { macro: macroCache.macro, rates: macroCache.rates, commodities: macroCache.commodities };
  }
  const specs = [...MACRO_SERIES, ...RATE_SERIES, ...COMMODITY_SERIES];
  const points = await pool(specs, 3, (s) => fetchFredPoint(s.seriesId, s.label, s.unit, s.id));
  const packed = {
    at: Date.now(),
    macro: points.slice(0, MACRO_SERIES.length),
    rates: points.slice(MACRO_SERIES.length, MACRO_SERIES.length + RATE_SERIES.length),
    commodities: points.slice(MACRO_SERIES.length + RATE_SERIES.length),
  };
  macroCache = packed;
  return packed;
}

function mapNews(raw: unknown, symbol: string): NewsItem[] {
  const rows = asArray(raw) || [];
  return rows.slice(0, 40).map((row) => {
    const headline = String(row.title || row.headline || '').trim();
    return {
      time: String(row.publishedDate || row.date || ''),
      source: String(row.site || row.source || ''),
      headline: headline || 'DATA UNAVAILABLE',
      company: symbol,
      category: classifyNewsCategory(headline),
      relevance: String(row.symbol || symbol),
      url: typeof row.url === 'string' ? row.url : undefined,
    };
  });
}

function mapFilings(raw: unknown, company: string): FilingItem[] {
  const rows = asArray(raw) || [];
  return rows.slice(0, 40).map((row) => ({
    date: String(row.fillingDate || row.filedDate || row.date || ''),
    type: String(row.type || row.form || ''),
    company,
    description: String(row.title || row.description || row.type || ''),
    url: typeof row.finalLink === 'string' ? row.finalLink : typeof row.link === 'string' ? row.link : undefined,
  }));
}

function mapInsiders(raw: unknown): InsiderRow[] {
  const rows = asArray(raw) || [];
  return rows.slice(0, 40).map((row) => ({
    date: String(row.transactionDate || row.filingDate || ''),
    name: String(row.reportingName || row.name || ''),
    role: String(row.typeOfOwner || row.reportingCik || ''),
    transaction: String(row.transactionType || row.acquistionOrDisposition || ''),
    shares: asFinite(row.securitiesTransacted ?? row.shares),
    value: asFinite(row.securitiesOwned),
  }));
}

function mapPeers(raw: unknown, symbol: string): string[] {
  if (Array.isArray(raw) && raw.every((x) => typeof x === 'string')) {
    return (raw as string[]).filter((s) => s && s !== symbol).slice(0, 12);
  }
  const rec = firstRecord(raw);
  if (!rec) return [];
  const peers = rec.peersSymbol || rec.peers || rec.symbolPeers;
  if (Array.isArray(peers)) return peers.map(String).filter((s) => s && s !== symbol).slice(0, 12);
  return [];
}

export async function searchFundamentalAssets(query: string): Promise<SearchHit[]> {
  const local = searchIdentityCatalog(query, 16);
  if (!query.trim()) return local;
  const remote = await fmpLookup('search', { q: query.trim() });
  if (!remote.ok) return local;
  const rows = asArray(remote.data) || [];
  const mapped: SearchHit[] = rows.slice(0, 16).map((row) => ({
    name: String(row.name || row.companyName || ''),
    ticker: String(row.symbol || ''),
    exchange: String(row.exchangeShortName || row.stockExchange || row.exchange || '').toUpperCase(),
    country: String(row.country || '—').toUpperCase(),
    sector: '—',
    industry: '—',
    assetType: String(row.exchangeShortName || '').toLowerCase().includes('forex')
      ? 'CURRENCY'
      : String(row.exchangeShortName || '').toUpperCase().includes('INDEX')
        ? 'INDEX'
        : 'EQUITY',
    source: 'provider',
  }));
  const seen = new Set(mapped.map((m) => m.ticker));
  return [...mapped, ...local.filter((h) => !seen.has(h.ticker))].slice(0, 20);
}

export async function loadFundamentalBundle(symbol: string): Promise<FundamentalBundle> {
  const ticker = symbol.trim().toUpperCase();
  const jobs: Array<() => Promise<FetchResult<unknown>>> = [
    () => fmpSymbol('profile', ticker),
    () => fmpSymbol('quote', ticker),
    () => fmpSymbol('income-statement', ticker, 'limit=12&period=annual'),
    () => fmpSymbol('income-statement', ticker, 'limit=16&period=quarter'),
    () => fmpSymbol('balance-sheet-statement', ticker, 'limit=12&period=annual'),
    () => fmpSymbol('balance-sheet-statement', ticker, 'limit=16&period=quarter'),
    () => fmpSymbol('cash-flow-statement', ticker, 'limit=12&period=annual'),
    () => fmpSymbol('cash-flow-statement', ticker, 'limit=16&period=quarter'),
    () => fmpSymbol('key-metrics', ticker, 'limit=12&period=annual'),
    () => fmpSymbol('key-metrics', ticker, 'limit=16&period=quarter'),
    () => fmpSymbol('ratios', ticker, 'limit=12&period=annual'),
    () => fmpSymbol('key-metrics-ttm', ticker),
    () => fmpSymbol('ratios-ttm', ticker),
    () => fmpSymbol('enterprise-values', ticker, 'limit=12'),
    () => fmpSymbol('analyst-estimates', ticker, 'limit=12'),
    () => fmpSymbol('earnings-surprises', ticker),
    () => fmpSymbol('financial-growth', ticker, 'limit=12'),
    () => fmpSymbol('historical-market-capitalization', ticker, 'limit=12'),
    () => fmpSymbol('sec_filings', ticker, 'limit=20'),
    () => fmpLookup('news', { symbol: ticker }),
    () => fmpLookup('insider', { symbol: ticker }),
    () => fmpLookup('peers', { symbol: ticker }),
    () => fmpSymbol('revenue-product-segmentation', ticker),
    () => fmpSymbol('revenue-geographic-segmentation', ticker),
    () => fmpSymbol('shares_float', ticker),
  ];
  const [
    profileRes,
    quoteRes,
    incA,
    incQ,
    balA,
    balQ,
    cfA,
    cfQ,
    metA,
    metQ,
    ratiosA,
    metTtm,
    ratiosTtm,
    ev,
    estimates,
    surprises,
    growth,
    mcap,
    filings,
    news,
    insiders,
    peers,
    prodSeg,
    geoSeg,
    flt,
  ] = await pool(jobs, 4, (job) => job());
  const macroPack = await loadMacroFamily();

  let fmpAvail: DataAvailability = 'unavailable';
  if (profileRes.ok || quoteRes.ok || incA.ok || incQ.ok) {
    fmpAvail = 'live';
  } else if ('availability' in profileRes) {
    fmpAvail = profileRes.availability;
  }

  const fredAvail: DataAvailability = [...macroPack.macro, ...macroPack.rates, ...macroPack.commodities].some(
    (p) => p.value != null,
  )
    ? 'live'
    : 'unavailable';

  const profile = firstRecord(profileRes.ok ? profileRes.data : null);
  const quote = firstRecord(quoteRes.ok ? quoteRes.data : null);
  const identity = profile
    ? {
        name: String(profile.companyName || profile.symbol || ticker),
        ticker,
        exchange: String(profile.exchangeShortName || profile.exchange || ''),
        country: String(profile.country || ''),
        currency: String(profile.currency || 'USD'),
        sector: String(profile.sector || ''),
        industry: String(profile.industry || ''),
        website: typeof profile.website === 'string' ? profile.website : null,
        description: typeof profile.description === 'string' ? profile.description : null,
        ceo: typeof profile.ceo === 'string' ? profile.ceo : null,
        employees: asFinite(profile.fullTimeEmployees),
        ipoDate: typeof profile.ipoDate === 'string' ? profile.ipoDate : null,
        cik: profile.cik != null ? String(profile.cik) : null,
        isin: profile.isin != null ? String(profile.isin) : null,
        reportingFrequency: 'Quarterly / annual (as reported)',
        fiscalYear: null as string | null,
        sharesOutstanding: asFinite(quote?.sharesOutstanding)
          ?? (asFinite(profile.mktCap) && asFinite(quote?.price)
            ? asFinite(profile.mktCap)! / asFinite(quote?.price)!
            : null),
        floatShares: null as number | null,
        image: typeof profile.image === 'string' ? profile.image : null,
      }
    : null;

  const floatRec = flt.ok ? firstRecord(flt.data) : null;
  if (identity && floatRec) {
    identity.floatShares = asFinite(floatRec.floatShares || floatRec.outstandingShares);
  }

  const incomeAnnual = incA.ok ? asArray(incA.data) : null;
  if (identity && incomeAnnual?.[0]?.calendarYear) {
    identity.fiscalYear = String(incomeAnnual[0].calendarYear);
  }

  return {
    symbol: ticker,
    fetchedAt: Date.now(),
    fmp: fmpAvail,
    fred: fredAvail,
    identity,
    quote: quote
      ? {
          price: asFinite(quote.price),
          changePct: asFinite(quote.changesPercentage),
          marketCap: asFinite(quote.marketCap) ?? asFinite(profile?.mktCap),
          volume: asFinite(quote.volume),
          eps: asFinite(quote.eps),
          pe: asFinite(quote.pe),
          earningsAnnouncement: quote.earningsAnnouncement ? String(quote.earningsAnnouncement) : null,
        }
      : null,
    incomeAnnual,
    incomeQuarter: incQ.ok ? asArray(incQ.data) : null,
    balanceAnnual: balA.ok ? asArray(balA.data) : null,
    balanceQuarter: balQ.ok ? asArray(balQ.data) : null,
    cashAnnual: cfA.ok ? asArray(cfA.data) : null,
    cashQuarter: cfQ.ok ? asArray(cfQ.data) : null,
    metricsAnnual: metA.ok ? asArray(metA.data) : null,
    metricsQuarter: metQ.ok ? asArray(metQ.data) : null,
    ratiosAnnual: ratiosA.ok ? asArray(ratiosA.data) : null,
    metricsTtm: metTtm.ok ? firstRecord(metTtm.data) : null,
    ratiosTtm: ratiosTtm.ok ? firstRecord(ratiosTtm.data) : null,
    enterpriseValues: ev.ok ? asArray(ev.data) : null,
    estimates: estimates.ok ? asArray(estimates.data) : null,
    epsSurprises: surprises.ok ? asArray(surprises.data) : null,
    growth: growth.ok ? asArray(growth.data) : null,
    marketCapHistory: mcap.ok ? asArray(mcap.data) : null,
    filings: filings.ok ? mapFilings(filings.data, identity?.name || ticker) : [],
    news: news.ok ? mapNews(news.data, ticker) : [],
    insiders: insiders.ok ? mapInsiders(insiders.data) : [],
    peers: peers.ok ? mapPeers(peers.data, ticker) : [],
    productSegments: prodSeg.ok ? prodSeg.data : null,
    geoSegments: geoSeg.ok ? geoSeg.data : null,
    sharesFloat: floatRec,
    macro: macroPack.macro,
    rates: macroPack.rates,
    commodities: macroPack.commodities,
  };
}

export function pickStatements(bundle: FundamentalBundle, period: StatementPeriod) {
  if (period === 'quarter') {
    return {
      income: bundle.incomeQuarter,
      balance: bundle.balanceQuarter,
      cash: bundle.cashQuarter,
      metrics: bundle.metricsQuarter,
    };
  }
  return {
    income: bundle.incomeAnnual,
    balance: bundle.balanceAnnual,
    cash: bundle.cashAnnual,
    metrics: bundle.metricsAnnual,
  };
}

export function num(row: Record<string, unknown> | null | undefined, key: string): number | null {
  if (!row) return null;
  return asFinite(row[key]);
}
