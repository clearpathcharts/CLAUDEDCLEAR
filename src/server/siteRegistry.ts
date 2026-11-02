// One list of every public URL. The XML sitemaps and the CEO Marketing Department
// both read from here, so the dashboard can never disagree with what crawlers see.

import {
  stockEntries,
  cryptoEntries,
  forexEntries,
  commodityEntries,
  companyEntries,
  companyIndexEntries,
  economyEntries,
  indicatorEntries,
  educationEntries,
  uiProfileEntries,
  encyclopediaHubEntries,
  glossaryEntries,
  literacyEntries,
  knowledgeBaseEntries,
  sitemapLastmod,
} from './crawlCatalog';
import { regionalHubEntries, regionalIndexNowUrls } from './regionalSeo';
import { SEMANTIC_RECORDS } from './semanticDatabase';
import { GUIDE_RECORDS } from './contentData';

export const SITE_ORIGIN = 'https://clearpathtrader.com';

export interface SiteEntry {
  path: string;
  lastmod: string;
  changefreq: string;
  priority: string;
}

export interface SitemapSection {
  id: string;
  file: string;
  label: string;
  /** Large procedural catalogs are stable per process; small hand-edited ones are rebuilt per request. */
  cache: boolean;
  entries: () => SiteEntry[];
}

const STATIC_PAGES: Array<[path: string, changefreq: string, priority: string]> = [
  ['/', 'daily', '1.0'],
  // NOTE: /trading-ai is a canonical alias — omit from sitemaps.
  ['/if-trading-and-chatgpt-had-a-baby', 'weekly', '0.95'],
  ['/about', 'monthly', '0.85'],
  ['/company', 'monthly', '0.88'],
  ['/meet-the-board', 'monthly', '0.88'],
  ['/founder', 'monthly', '0.87'],
  ['/ceo-statement', 'yearly', '0.86'],
  ['/press', 'monthly', '0.9'],
  ['/plans', 'weekly', '0.86'],
  ['/brokers', 'monthly', '0.75'],
  ['/encyclopedia', 'weekly', '0.85'],
  ['/indicators', 'weekly', '0.85'],
  ['/education', 'weekly', '0.85'],
  ['/literacy', 'weekly', '0.8'],
  ['/learn', 'weekly', '0.8'],
  ['/guides', 'weekly', '0.8'],
  ['/glossary', 'weekly', '0.75'],
  ['/faq', 'monthly', '0.7'],
  ['/tools', 'monthly', '0.8'],
  ['/tools/position-size', 'monthly', '0.85'],
  ['/accessibility', 'yearly', '0.55'],
  ['/desk', 'weekly', '0.85'],
  ['/desk/institutional', 'weekly', '0.9'],
  ['/desk/fundamental', 'weekly', '0.8'],
  ['/desk/retail', 'weekly', '0.8'],
  ['/desk/neurodivergent', 'weekly', '0.8'],
];

function pageEntries(): SiteEntry[] {
  const lastmod = sitemapLastmod();
  return [
    ...STATIC_PAGES.map(([path, changefreq, priority]) => ({ path, lastmod, changefreq, priority })),
    ...encyclopediaHubEntries(),
    ...regionalHubEntries(),
  ];
}

export const SITEMAP_SECTIONS: SitemapSection[] = [
  { id: 'pages', file: 'sitemap-pages.xml', label: 'Core pages', cache: false, entries: pageEntries },
  {
    id: 'learn',
    file: 'sitemap-learn.xml',
    label: 'Learn',
    cache: false,
    entries: () =>
      Object.values(SEMANTIC_RECORDS).map((r) => ({ path: `/learn/${r.id}`, lastmod: r.updatedDate, changefreq: 'weekly', priority: '0.9' })),
  },
  {
    id: 'guides',
    file: 'sitemap-guides.xml',
    label: 'Guides',
    cache: false,
    entries: () =>
      Object.values(GUIDE_RECORDS).map((g) => ({ path: `/guides/${g.id}`, lastmod: g.updatedDate, changefreq: 'weekly', priority: '0.85' })),
  },
  { id: 'stocks', file: 'sitemap-stocks.xml', label: 'Stocks', cache: true, entries: stockEntries },
  { id: 'crypto', file: 'sitemap-crypto.xml', label: 'Crypto', cache: true, entries: cryptoEntries },
  { id: 'forex', file: 'sitemap-forex.xml', label: 'Forex', cache: true, entries: forexEntries },
  { id: 'commodities', file: 'sitemap-commodities.xml', label: 'Commodities', cache: true, entries: commodityEntries },
  { id: 'companies', file: 'sitemap-companies.xml', label: 'Companies', cache: true, entries: () => [...companyEntries(), ...companyIndexEntries()] },
  { id: 'glossary', file: 'sitemap-glossary.xml', label: 'Glossary', cache: true, entries: glossaryEntries },
  { id: 'literacy', file: 'sitemap-literacy.xml', label: 'Literacy', cache: true, entries: literacyEntries },
  { id: 'knowledge', file: 'sitemap-knowledge.xml', label: 'Knowledge base', cache: true, entries: knowledgeBaseEntries },
  { id: 'economy', file: 'sitemap-economy.xml', label: 'Economy', cache: true, entries: economyEntries },
  { id: 'indicators', file: 'sitemap-indicators.xml', label: 'Indicators', cache: true, entries: indicatorEntries },
  { id: 'education', file: 'sitemap-education.xml', label: 'Education', cache: true, entries: educationEntries },
  { id: 'ui', file: 'sitemap-ui.xml', label: 'Accessible UI profiles', cache: true, entries: uiProfileEntries },
];

export function buildUrlset(entries: SiteEntry[]): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries
  .map(
    (e) => `  <url>
    <loc>${SITE_ORIGIN}${e.path}</loc>
    <lastmod>${e.lastmod}</lastmod>
    <changefreq>${e.changefreq}</changefreq>
    <priority>${e.priority}</priority>
  </url>`
  )
  .join('\n')}
</urlset>`;
}

const xmlCache = new Map<string, string>();
export function sectionXml(section: SitemapSection): string {
  if (!section.cache) return buildUrlset(section.entries());
  let xml = xmlCache.get(section.id);
  if (!xml) {
    xml = buildUrlset(section.entries());
    xmlCache.set(section.id, xml);
  }
  return xml;
}

export function sitemapIndexXml(): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${SITEMAP_SECTIONS.map(
  (s) => `  <sitemap>
    <loc>${SITE_ORIGIN}/${s.file}</loc>
  </sitemap>`
).join('\n')}
</sitemapindex>`;
}

export type SiteUrlRow = SiteEntry & { section: string; url: string };

export function listSiteUrls(sectionId?: string): SiteUrlRow[] {
  const rows: SiteUrlRow[] = [];
  for (const s of SITEMAP_SECTIONS) {
    if (sectionId && s.id !== sectionId) continue;
    for (const e of s.entries()) rows.push({ ...e, section: s.id, url: `${SITE_ORIGIN}${e.path}` });
  }
  return rows;
}

/** Hubs, guides, learn pages and regional markets: the set IndexNow is told about on boot and on demand. */
export function priorityIndexNowUrls(): string[] {
  return [
    `${SITE_ORIGIN}/`,
    `${SITE_ORIGIN}/about`,
    `${SITE_ORIGIN}/glossary`,
    `${SITE_ORIGIN}/literacy`,
    `${SITE_ORIGIN}/markets/bonds`,
    `${SITE_ORIGIN}/companies`,
    `${SITE_ORIGIN}/encyclopedia`,
    `${SITE_ORIGIN}/guides`,
    `${SITE_ORIGIN}/learn`,
    `${SITE_ORIGIN}/tools/position-size`,
    ...Object.keys(GUIDE_RECORDS).map((id) => `${SITE_ORIGIN}/guides/${id}`),
    ...Object.keys(SEMANTIC_RECORDS).map((id) => `${SITE_ORIGIN}/learn/${id}`),
    ...regionalIndexNowUrls(),
  ];
}

export function siteSectionCounts(): Array<{ id: string; label: string; file: string; count: number }> {
  return SITEMAP_SECTIONS.map((s) => ({ id: s.id, label: s.label, file: s.file, count: s.entries().length }));
}
