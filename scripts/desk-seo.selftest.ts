/**
 * SSR SEO for Institutional / Fundamental / Retail / Neurodivergent trader desks.
 * Run: npx tsx scripts/desk-seo.selftest.ts
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { enrichHtmlWithMetadata } from '../src/server/semanticDatabase.ts';
import { renderStaticContentPage, isSearchEngineBot } from '../src/server/contentPages.ts';
import { DESK_INDEX_SEO, DESK_SEO } from '../src/content/traderDesksCopy.ts';
import {
  TRADER_DESK_IDS,
  TRADER_DESKS,
  deskCanonicalPath,
} from '../src/lib/traderDesks.ts';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function grab(html: string, pattern: RegExp): string {
  const m = html.match(pattern);
  assert.ok(m, `missing ${pattern}`);
  return m[1].replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&lt;/g, '<');
}

assert.equal(isSearchEngineBot('Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)'), true);

assert.equal(deskCanonicalPath('/desk'), '/desk');
assert.equal(deskCanonicalPath('/fundamental'), '/desk/fundamental');
assert.equal(deskCanonicalPath('/fundamental/NVDA'), '/desk/fundamental');
assert.equal(deskCanonicalPath('/desk/fundamental/AAPL'), '/desk/fundamental');
assert.equal(deskCanonicalPath('/desk/retail/screen/chart'), '/desk/retail');
assert.equal(deskCanonicalPath('/encyclopedia'), null);

assert.ok(DESK_INDEX_SEO.title.length <= 70);
assert.ok(DESK_INDEX_SEO.description.length >= 140 && DESK_INDEX_SEO.description.length <= 160);
assert.doesNotMatch(DESK_INDEX_SEO.description, /…/);

const titles = new Set<string>();
const descriptions = new Set<string>();

for (const id of TRADER_DESK_IDS) {
  const seo = DESK_SEO[id];
  const href = TRADER_DESKS[id].href;
  assert.equal(href, `/desk/${id}`);
  assert.match(seo.title, new RegExp(`${id === 'neurodivergent' ? 'Neurodivergent' : id[0].toUpperCase() + id.slice(1)} Trader Desk`));
  assert.match(seo.h1, /Trader Desk$/);
  assert.ok(seo.title.length <= 70, `${id} title too long: ${seo.title.length}`);
  assert.ok(
    seo.description.length >= 140 && seo.description.length <= 160,
    `${id} description ${seo.description.length} not in 140–160`,
  );
  assert.doesNotMatch(seo.description, /…/);
  assert.ok(!titles.has(seo.title), `duplicate title ${seo.title}`);
  assert.ok(!descriptions.has(seo.description), `duplicate description for ${id}`);
  titles.add(seo.title);
  descriptions.add(seo.description);
  assert.match(seo.keywords, /ClearPath Trader/i);
  assert.ok(seo.faqs.length >= 2);
  assert.ok(seo.faqs.every((f) => f.question && f.answer));
  assert.doesNotMatch(seo.description, /brokerage account|guaranteed|buy now|GEX|Level II/i);

  const page = renderStaticContentPage(href);
  assert.ok(page, `missing static HTML for ${href}`);
  const html = enrichHtmlWithMetadata(page!, href);
  const title = grab(html, /<title>([^<]*)<\/title>/i);
  const desc = grab(html, /<meta\s+name="description"\s+content="([^"]*)"/i);
  const canonical = grab(html, /<link\s+rel="canonical"\s+href="([^"]*)"/i);
  const ogTitle = grab(html, /<meta\s+property="og:title"\s+content="([^"]*)"/i);
  const ogDesc = grab(html, /<meta\s+property="og:description"\s+content="([^"]*)"/i);
  const h1 = grab(html, /<h1[^>]*>([^<]*)<\/h1>/i);

  assert.equal(title, seo.title);
  assert.equal(desc, seo.description);
  assert.doesNotMatch(desc, /…/);
  assert.equal(canonical, `https://clearpathtrader.com${href}`);
  assert.equal(ogTitle, seo.title);
  assert.equal(ogDesc, seo.description);
  assert.equal(h1, seo.h1);
  assert.match(html, /"@type": "WebApplication"/);
  assert.match(html, /"@type": "FAQPage"/);
  assert.match(html, /"@type": "BreadcrumbList"/);
  assert.doesNotMatch(html, /<meta name="robots" content="noindex/);
}

const indexPage = renderStaticContentPage('/desk');
assert.ok(indexPage);
const indexHtml = enrichHtmlWithMetadata(indexPage!, '/desk');
assert.equal(grab(indexHtml, /<title>([^<]*)<\/title>/i), DESK_INDEX_SEO.title);
assert.equal(grab(indexHtml, /<meta\s+name="description"\s+content="([^"]*)"/i), DESK_INDEX_SEO.description);
assert.match(indexHtml, /"@type": "CollectionPage"/);
for (const id of TRADER_DESK_IDS) {
  assert.match(indexHtml, new RegExp(`href="${TRADER_DESKS[id].href}"`));
}

const alias = enrichHtmlWithMetadata(renderStaticContentPage('/fundamental')!, '/fundamental');
assert.equal(grab(alias, /<link\s+rel="canonical"\s+href="([^"]*)"/i), 'https://clearpathtrader.com/desk/fundamental');
assert.equal(grab(alias, /<title>([^<]*)<\/title>/i), DESK_SEO.fundamental.title);

const satellite = enrichHtmlWithMetadata(
  fs.readFileSync(path.join(root, 'index.html'), 'utf8'),
  '/desk/retail/screen/news',
);
assert.match(satellite, /<meta name="robots" content="noindex, follow"/);
assert.equal(grab(satellite, /<link\s+rel="canonical"\s+href="([^"]*)"/i), 'https://clearpathtrader.com/desk/retail');
assert.equal(grab(satellite, /<title>([^<]*)<\/title>/i), DESK_SEO.retail.title);

const server = fs.readFileSync(path.join(root, 'server.ts'), 'utf8');
assert.match(server, /\/desk\/institutional/);
assert.match(server, /\/desk\/fundamental/);
assert.match(server, /\/desk\/retail/);
assert.match(server, /\/desk\/neurodivergent/);
assert.match(server, /app\.get\(\['\/fundamental', '\/fundamental\/:symbol'\]/);
assert.match(server, /res\.redirect\(301,/);

const deskRoute = fs.readFileSync(path.join(root, 'src/components/desks/DeskRoute.tsx'), 'utf8');
assert.match(deskRoute, /from 'react-helmet-async'/);
assert.match(deskRoute, /<Helmet>/);
assert.match(deskRoute, /seo\.title/);
assert.match(deskRoute, /FundamentalTraderDesk/);
assert.doesNotMatch(deskRoute, /FundamentalResearchDesk/);

const sitemapChunk = server.slice(server.indexOf("app.get('/sitemap-pages.xml'"));
assert.match(sitemapChunk, /path: '\/desk\/institutional'/);
assert.match(sitemapChunk, /path: '\/desk\/fundamental'/);
assert.match(sitemapChunk, /path: '\/desk\/retail'/);
assert.match(sitemapChunk, /path: '\/desk\/neurodivergent'/);

console.log('desk-seo.selftest: ok');
