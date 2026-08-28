export type DataAvailability = 'live' | 'delayed' | 'unavailable' | 'unconfigured';

export type StatementPeriod = 'annual' | 'quarter' | 'ttm';

export type ResearchSection =
  | 'overview'
  | 'financials'
  | 'earnings'
  | 'valuation'
  | 'industry'
  | 'macro'
  | 'news'
  | 'filings'
  | 'risk'
  | 'workspace';

export type ChartWorkspaceId =
  | 'business_growth'
  | 'valuation'
  | 'quality'
  | 'balance_sheet'
  | 'earnings'
  | 'company_vs_industry';

export type AssetType =
  | 'EQUITY'
  | 'ETF'
  | 'INDEX'
  | 'CURRENCY'
  | 'COMMODITY'
  | 'BOND'
  | 'ECONOMIC_INDICATOR'
  | 'COMPANY';

export type SearchHit = {
  name: string;
  ticker: string;
  exchange: string;
  country: string;
  sector: string;
  industry: string;
  assetType: AssetType;
  source: 'catalog' | 'provider';
};

export type SeriesPoint = {
  label: string;
  value: number | null;
  date?: string;
};

export type StatementRow = {
  id: string;
  label: string;
  values: Array<number | null>;
};

export type StatementBlock = {
  title: string;
  columns: string[];
  rows: StatementRow[];
  unitNote: string;
  source?: string;
  period?: string;
  reported?: string;
};

export type SegmentRow = {
  segment: string;
  revenue: number | null;
  growth: number | null;
  operatingMargin: number | null;
  contribution: number | null;
};

export type SurpriseRow = {
  period: string;
  estimate: number | null;
  actual: number | null;
  surprise: number | null;
  surprisePct: number | null;
};

export type GuidanceRow = {
  metric: string;
  previous: string | null;
  current: string | null;
  change: string | null;
};

export type NewsItem = {
  time: string;
  source: string;
  headline: string;
  company: string;
  category: string;
  relevance: string;
  url?: string;
};

export type FilingItem = {
  date: string;
  type: string;
  company: string;
  description: string;
  url?: string;
};

export type InsiderRow = {
  date: string;
  name: string;
  role: string;
  transaction: string;
  shares: number | null;
  value: number | null;
};

export type PeerRow = {
  company: string;
  ticker: string;
  pe: number | null;
  evEbitda: number | null;
  revenueGrowth: number | null;
  epsGrowth: number | null;
  roic: number | null;
  fcfMargin: number | null;
  debtEbitda: number | null;
};

export type MacroPoint = {
  id: string;
  label: string;
  value: number | null;
  date: string | null;
  unit: string;
  source: string;
  seriesId: string;
};

export type ScorecardMetric = {
  id: string;
  label: string;
  display: string;
  methodology: string;
};

export type CompanyIdentity = {
  name: string;
  ticker: string;
  exchange: string;
  country: string;
  currency: string;
  sector: string;
  industry: string;
  website: string | null;
  description: string | null;
  ceo: string | null;
  employees: number | null;
  ipoDate: string | null;
  cik: string | null;
  isin: string | null;
  reportingFrequency: string | null;
  fiscalYear: string | null;
  sharesOutstanding: number | null;
  floatShares: number | null;
  image: string | null;
};

export type QuoteSnapshot = {
  price: number | null;
  changePct: number | null;
  marketCap: number | null;
  volume: number | null;
  eps: number | null;
  pe: number | null;
  earningsAnnouncement: string | null;
};

export type ValuationBundle = {
  pe: number | null;
  forwardPe: number | null;
  peg: number | null;
  priceToSales: number | null;
  priceToBook: number | null;
  evSales: number | null;
  evEbitda: number | null;
  evEbit: number | null;
  evFcf: number | null;
  fcfYield: number | null;
  eps: number | null;
  fcfPerShare: number | null;
  bookValuePerShare: number | null;
  enterpriseValue: number | null;
  marketCap: number | null;
  totalDebt: number | null;
  cash: number | null;
};

export type FundamentalBundle = {
  symbol: string;
  fetchedAt: number;
  fmp: DataAvailability;
  fred: DataAvailability;
  identity: CompanyIdentity | null;
  quote: QuoteSnapshot | null;
  incomeAnnual: Record<string, unknown>[] | null;
  incomeQuarter: Record<string, unknown>[] | null;
  balanceAnnual: Record<string, unknown>[] | null;
  balanceQuarter: Record<string, unknown>[] | null;
  cashAnnual: Record<string, unknown>[] | null;
  cashQuarter: Record<string, unknown>[] | null;
  metricsAnnual: Record<string, unknown>[] | null;
  metricsQuarter: Record<string, unknown>[] | null;
  ratiosAnnual: Record<string, unknown>[] | null;
  metricsTtm: Record<string, unknown> | null;
  ratiosTtm: Record<string, unknown> | null;
  enterpriseValues: Record<string, unknown>[] | null;
  estimates: Record<string, unknown>[] | null;
  epsSurprises: Record<string, unknown>[] | null;
  growth: Record<string, unknown>[] | null;
  marketCapHistory: Record<string, unknown>[] | null;
  filings: FilingItem[];
  news: NewsItem[];
  insiders: InsiderRow[];
  peers: string[];
  productSegments: unknown;
  geoSegments: unknown;
  sharesFloat: Record<string, unknown> | null;
  macro: MacroPoint[];
  commodities: MacroPoint[];
  rates: MacroPoint[];
};
