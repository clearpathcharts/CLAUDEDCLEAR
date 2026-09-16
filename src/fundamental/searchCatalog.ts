import stocks from '../../data/stocks/stocks.json';
import etfs from '../../data/etfs/etfs.json';
import commodities from '../../data/commodities/commodities.json';
import forex from '../../data/forex/pairs.json';
import economics from '../../data/economics/economics.json';
import { ASSET_REGISTRY } from '../constants/assetRegistry';
import type { AssetType, SearchHit } from './types';

const ECONOMIC_SERIES: SearchHit[] = [
  { name: 'Gross Domestic Product', ticker: 'GDP', exchange: 'FRED', country: 'UNITED STATES', sector: 'MACRO', industry: 'GROWTH', assetType: 'ECONOMIC_INDICATOR', source: 'catalog' },
  { name: 'Consumer Price Index', ticker: 'CPIAUCSL', exchange: 'FRED', country: 'UNITED STATES', sector: 'MACRO', industry: 'INFLATION', assetType: 'ECONOMIC_INDICATOR', source: 'catalog' },
  { name: 'Producer Price Index', ticker: 'PPIACO', exchange: 'FRED', country: 'UNITED STATES', sector: 'MACRO', industry: 'INFLATION', assetType: 'ECONOMIC_INDICATOR', source: 'catalog' },
  { name: 'Unemployment Rate', ticker: 'UNRATE', exchange: 'FRED', country: 'UNITED STATES', sector: 'MACRO', industry: 'LABOR', assetType: 'ECONOMIC_INDICATOR', source: 'catalog' },
  { name: 'Nonfarm Payrolls', ticker: 'PAYEMS', exchange: 'FRED', country: 'UNITED STATES', sector: 'MACRO', industry: 'LABOR', assetType: 'ECONOMIC_INDICATOR', source: 'catalog' },
  { name: 'Federal Funds Rate', ticker: 'FEDFUNDS', exchange: 'FRED', country: 'UNITED STATES', sector: 'MACRO', industry: 'RATES', assetType: 'ECONOMIC_INDICATOR', source: 'catalog' },
  { name: '2-Year Treasury Yield', ticker: 'DGS2', exchange: 'FRED', country: 'UNITED STATES', sector: 'MACRO', industry: 'RATES', assetType: 'ECONOMIC_INDICATOR', source: 'catalog' },
  { name: '10-Year Treasury Yield', ticker: 'DGS10', exchange: 'FRED', country: 'UNITED STATES', sector: 'MACRO', industry: 'RATES', assetType: 'ECONOMIC_INDICATOR', source: 'catalog' },
  { name: '30-Year Treasury Yield', ticker: 'DGS30', exchange: 'FRED', country: 'UNITED STATES', sector: 'MACRO', industry: 'RATES', assetType: 'ECONOMIC_INDICATOR', source: 'catalog' },
  { name: 'University of Michigan Consumer Sentiment', ticker: 'UMCSENT', exchange: 'FRED', country: 'UNITED STATES', sector: 'MACRO', industry: 'DEMAND', assetType: 'ECONOMIC_INDICATOR', source: 'catalog' },
  { name: 'Retail Sales', ticker: 'RSAFS', exchange: 'FRED', country: 'UNITED STATES', sector: 'MACRO', industry: 'DEMAND', assetType: 'ECONOMIC_INDICATOR', source: 'catalog' },
  { name: 'Industrial Production', ticker: 'INDPRO', exchange: 'FRED', country: 'UNITED STATES', sector: 'MACRO', industry: 'ACTIVITY', assetType: 'ECONOMIC_INDICATOR', source: 'catalog' },
];

function categoryToAssetType(category: string): AssetType {
  if (category === 'forex') return 'CURRENCY';
  if (category === 'crypto') return 'CURRENCY';
  if (category === 'stocks') return 'EQUITY';
  if (category === 'indices') return 'INDEX';
  if (category === 'commodities' || category === 'metals') return 'COMMODITY';
  if (category === 'bonds') return 'BOND';
  return 'COMPANY';
}

export function identityCatalog(): SearchHit[] {
  const hits: SearchHit[] = [];
  for (const s of stocks as Array<{ ticker: string; company: string; sector?: string; industry?: string; exchange?: string; headquarters?: string }>) {
    hits.push({
      name: s.company,
      ticker: s.ticker,
      exchange: (s.exchange || '').toUpperCase(),
      country: (s.headquarters || '').toUpperCase().includes('UNITED') ? 'UNITED STATES' : '—',
      sector: (s.sector || '—').toUpperCase(),
      industry: (s.industry || '—').toUpperCase(),
      assetType: 'EQUITY',
      source: 'catalog',
    });
  }
  for (const e of etfs as Array<{ symbol: string; name: string; category?: string }>) {
    hits.push({
      name: e.name,
      ticker: e.symbol,
      exchange: 'US ETF',
      country: 'UNITED STATES',
      sector: (e.category || 'ETF').toUpperCase(),
      industry: 'EXCHANGE-TRADED FUND',
      assetType: 'ETF',
      source: 'catalog',
    });
  }
  for (const c of commodities as Array<{ symbol: string; name: string; category?: string }>) {
    hits.push({
      name: c.name,
      ticker: c.symbol,
      exchange: 'SPOT / FUTURES',
      country: 'GLOBAL',
      sector: (c.category || 'COMMODITY').toUpperCase(),
      industry: 'COMMODITY',
      assetType: 'COMMODITY',
      source: 'catalog',
    });
  }
  for (const f of forex as Array<{ pair: string; description?: string }>) {
    hits.push({
      name: f.description || f.pair,
      ticker: String(f.pair).replace('/', ''),
      exchange: 'FX',
      country: 'GLOBAL',
      sector: 'CURRENCY',
      industry: 'FOREIGN EXCHANGE',
      assetType: 'CURRENCY',
      source: 'catalog',
    });
  }
  for (const topic of economics as Array<{ topic: string }>) {
    hits.push({
      name: topic.topic,
      ticker: topic.topic.replace(/[^A-Za-z0-9]/g, '').slice(0, 12).toUpperCase() || 'ECON',
      exchange: 'CONCEPT',
      country: '—',
      sector: 'MACRO',
      industry: 'ECONOMIC CONCEPT',
      assetType: 'ECONOMIC_INDICATOR',
      source: 'catalog',
    });
  }
  for (const a of ASSET_REGISTRY.filter((row) => row.enabled)) {
    hits.push({
      name: a.description || a.display,
      ticker: a.symbol,
      exchange: (a.exchange || a.category).toUpperCase(),
      country: a.category === 'forex' ? 'GLOBAL' : '—',
      sector: a.category.toUpperCase(),
      industry: a.category.toUpperCase(),
      assetType: categoryToAssetType(a.category),
      source: 'catalog',
    });
  }
  hits.push(...ECONOMIC_SERIES);
  const seen = new Set<string>();
  return hits.filter((h) => {
    const k = `${h.ticker}|${h.assetType}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

export function searchIdentityCatalog(query: string, limit = 20): SearchHit[] {
  const q = query.trim().toLowerCase();
  if (!q) return identityCatalog().slice(0, limit);
  const scored = identityCatalog()
    .map((hit) => {
      const blob = `${hit.name} ${hit.ticker} ${hit.sector} ${hit.industry} ${hit.exchange}`.toLowerCase();
      let score = 0;
      if (hit.ticker.toLowerCase() === q) score += 100;
      else if (hit.ticker.toLowerCase().startsWith(q)) score += 60;
      else if (hit.ticker.toLowerCase().includes(q)) score += 30;
      if (hit.name.toLowerCase().startsWith(q)) score += 40;
      else if (blob.includes(q)) score += 10;
      return { hit, score };
    })
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score);
  return scored.slice(0, limit).map((s) => s.hit);
}
