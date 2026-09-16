/**
 * Maps authored encyclopedia knowledge-base articles onto crawlable URLs.
 * Economy articles already live at /economy/{slug}. Market hubs enrich /stocks etc.
 * Sector + bonds articles were SPA-only until these standalone paths.
 */
import { ENCYCLOPEDIA_KNOWLEDGE_BASE, type KnowledgeItem } from '../components/encyclopedia/KnowledgeBaseData';

export type KnowledgeRoute = {
  path: string;
  kbKey: string;
  crumb: string;
  kind: 'standalone' | 'hub-enrichment' | 'economy';
};

export const KNOWLEDGE_BASE_ROUTES: KnowledgeRoute[] = [
  { path: '/economy/inflation', kbKey: 'encyclopedia/economy/inflation.html', crumb: 'Inflation', kind: 'economy' },
  { path: '/economy/federal-reserve', kbKey: 'encyclopedia/economy/federal-reserve.html', crumb: 'Federal Reserve', kind: 'economy' },
  { path: '/economy/recession', kbKey: 'encyclopedia/economy/recession.html', crumb: 'Recession', kind: 'economy' },
  { path: '/economy/gdp', kbKey: 'encyclopedia/economy/gdp.html', crumb: 'GDP', kind: 'economy' },
  { path: '/economy/interest-rates', kbKey: 'encyclopedia/economy/interest-rates.html', crumb: 'Interest Rates', kind: 'economy' },
  { path: '/economy/banking', kbKey: 'encyclopedia/economy/banking.html', crumb: 'Banking', kind: 'economy' },
  { path: '/stocks', kbKey: 'encyclopedia/markets/stocks.html', crumb: 'Stocks', kind: 'hub-enrichment' },
  { path: '/forex', kbKey: 'encyclopedia/markets/forex.html', crumb: 'Forex', kind: 'hub-enrichment' },
  { path: '/crypto', kbKey: 'encyclopedia/markets/crypto.html', crumb: 'Crypto', kind: 'hub-enrichment' },
  { path: '/commodities', kbKey: 'encyclopedia/markets/commodities.html', crumb: 'Commodities', kind: 'hub-enrichment' },
  { path: '/markets/bonds', kbKey: 'encyclopedia/markets/bonds.html', crumb: 'Bonds', kind: 'standalone' },
  { path: '/sectors/ai', kbKey: 'encyclopedia/sectors/ai-sector.html', crumb: 'AI sector', kind: 'standalone' },
  { path: '/sectors/banking', kbKey: 'encyclopedia/sectors/banking-sector.html', crumb: 'Banking sector', kind: 'standalone' },
  { path: '/sectors/energy', kbKey: 'encyclopedia/sectors/energy-sector.html', crumb: 'Energy sector', kind: 'standalone' },
  { path: '/sectors/biotech', kbKey: 'encyclopedia/sectors/biotech-sector.html', crumb: 'Biotech sector', kind: 'standalone' },
  { path: '/sectors/semiconductors', kbKey: 'encyclopedia/sectors/semiconductor-sector.html', crumb: 'Semiconductors', kind: 'standalone' },
];

const byPath = new Map(KNOWLEDGE_BASE_ROUTES.map((r) => [r.path, r]));

export function knowledgeRouteForPath(pathClean: string): KnowledgeRoute | null {
  return byPath.get(pathClean) || null;
}

export function standaloneKnowledgeRoutes(): KnowledgeRoute[] {
  return KNOWLEDGE_BASE_ROUTES.filter((r) => r.kind === 'standalone');
}

export function knowledgeItemForPath(pathClean: string): KnowledgeItem | null {
  const route = byPath.get(pathClean);
  if (!route) return null;
  return ENCYCLOPEDIA_KNOWLEDGE_BASE[route.kbKey] || null;
}

export function knowledgeItemForHub(hub: '/stocks' | '/crypto' | '/forex' | '/commodities'): KnowledgeItem | null {
  return knowledgeItemForPath(hub);
}
