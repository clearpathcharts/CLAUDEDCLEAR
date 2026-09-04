/**
 * Educational company catalog: ~60k listings, crawlable subsidiaries, no fake Apple/Tesla subs.
 * Run: npx tsx scripts/company-catalog.selftest.ts
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  COMPANY_UNITS,
  REAL_MAJOR_TICKERS,
  companyCatalogCounts,
  getCompanyCatalog,
  lookupCompany,
} from '../src/lib/companyCatalog.ts';
import { companyEntries, catalogCounts } from '../src/server/crawlCatalog.ts';
import { enrichHtmlWithMetadata } from '../src/server/semanticDatabase.ts';
import { renderStaticContentPage } from '../src/server/contentPages.ts';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const counts = companyCatalogCounts();
assert.ok(counts.total >= 50_000, `catalog too small: ${counts.total}`);
assert.ok(counts.publicIssuers >= 8_000, `public issuers ${counts.publicIssuers}`);
assert.ok(counts.subsidiaries >= 40_000, `subsidiaries ${counts.subsidiaries}`);
assert.equal(counts.publicIssuers + counts.subsidiaries, counts.total);

const apiCounts = catalogCounts();
assert.equal(apiCounts.companies, counts.total);
assert.equal(apiCounts.companyPages, counts.subsidiaries);

const pages = companyEntries();
assert.equal(pages.length, counts.subsidiaries);
assert.ok(pages.length <= 50_000, `sitemap shard limit exceeded: ${pages.length}`);
assert.ok(pages.every((e) => e.path.startsWith('/companies/')));

const aapl = lookupCompany('aapl');
assert.ok(aapl);
assert.equal(aapl!.status, 'Public');
assert.equal(aapl!.ticker, 'AAPL');

for (const unit of COMPANY_UNITS) {
  const fake = lookupCompany(`apple-${unit.key}`);
  assert.equal(fake, null, `must not invent Apple ${unit.label}`);
}

const catalog = getCompanyCatalog();
for (const rec of catalog) {
  if (rec.status === 'Subsidiary' && rec.parentTicker) {
    assert.ok(!REAL_MAJOR_TICKERS.has(rec.parentTicker), `fake sub under ${rec.parentTicker}`);
  }
}

const sample = catalog.find((c) => c.status === 'Subsidiary');
assert.ok(sample);
const html = renderStaticContentPage(`/companies/${sample!.slug}`);
assert.ok(html);
const enriched = enrichHtmlWithMetadata(html!, `/companies/${sample!.slug}`);
assert.match(enriched, /<title>/i);
assert.match(enriched, /DATA UNAVAILABLE/);
assert.match(enriched, /rel="canonical"/i);
assert.doesNotMatch(enriched, /guaranteed returns|buy now|order ticket/i);
assert.equal(
  (enriched.match(/<meta name="robots" content="noindex/) || []).length,
  0,
);

const missing = enrichHtmlWithMetadata(
  fs.readFileSync(path.join(root, 'index.html'), 'utf8'),
  '/companies/this-slug-does-not-exist-zz',
);
assert.match(missing, /noindex/);

const server = fs.readFileSync(path.join(root, 'server.ts'), 'utf8');
assert.match(server, /sitemap-companies\.xml/);
assert.match(server, /companyEntries/);
assert.match(server, /res\.redirect\(301, `\/stocks\//);

const dir = fs.readFileSync(path.join(root, 'src/components/encyclopedia/CompaniesDirectoryView.tsx'), 'utf8');
assert.match(dir, /getCompanyCatalog/);
assert.doesNotMatch(dir, /62,541/);
assert.doesNotMatch(dir, /\$120\+ Trillion/);

console.log(
  `company-catalog.selftest: ok total=${counts.total} public=${counts.publicIssuers} subsidiaries=${counts.subsidiaries}`,
);
