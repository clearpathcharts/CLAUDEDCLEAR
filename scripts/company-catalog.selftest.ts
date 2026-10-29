/**
 * Company catalog: real public issuers only. No generated subsidiaries, tickers, or company names.
 * Run: npx tsx scripts/company-catalog.selftest.ts
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  companyCatalogCounts,
  getCompanyCatalog,
  lookupCompany,
} from '../src/lib/companyCatalog.ts';
import { companyEntries, catalogCounts } from '../src/server/crawlCatalog.ts';
import { enrichHtmlWithMetadata } from '../src/server/semanticDatabase.ts';
import { renderStaticContentPage } from '../src/server/contentPages.ts';
import { getProceduralStocks, getProceduralCrypto, getProceduralCommodities } from '../src/utils/searchEngine.ts';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const counts = companyCatalogCounts();
assert.equal(counts.subsidiaries, 0, 'company catalog must not invent subsidiaries');
assert.equal(counts.publicIssuers, counts.total);
assert.ok(counts.total >= 50, `catalog unexpectedly small: ${counts.total}`);
assert.ok(counts.total < 1_000, `catalog grew past the hand-checked list: ${counts.total} — is a generator back?`);

const apiCounts = catalogCounts();
assert.equal(apiCounts.companies, counts.total);
assert.equal(apiCounts.companyPages, 0);
assert.equal(companyEntries().length, 0);

const aapl = lookupCompany('aapl');
assert.ok(aapl);
assert.equal(aapl!.status, 'Public');
assert.equal(aapl!.ticker, 'AAPL');
assert.equal(lookupCompany('apple-logistics-system'), null);

const stocks = getProceduralStocks();
assert.equal(stocks.length, counts.total);
for (const s of stocks) {
  assert.ok(!('marketCap' in s), `hardcoded market cap on ${s.ticker}`);
  assert.doesNotMatch(String(s.exchange), /Sovereign Board/);
  assert.doesNotMatch(String(s.headquarters || ''), / City, Texas$/);
}
assert.ok(!stocks.some((s) => s.ticker === 'YDUU' || s.ticker === 'WIEM'), 'generated tickers are back');
assert.ok(getProceduralCrypto().length < 1_000, 'crypto list grew past the real-coin list — is a generator back?');
for (const c of getProceduralCommodities()) {
  assert.doesNotMatch(String(c.name), /Graphene|Magnisium|Silicon Raw|Hardwood|Pork Bellies|Frozen Broilers/);
}

for (const rec of getCompanyCatalog()) {
  assert.ok(rec.seoTitle.length <= 70, `title too long: ${rec.seoTitle}`);
  assert.doesNotMatch(rec.seoTitle, /…/);
  assert.ok(rec.seoDescription.length <= 160, `desc too long (${rec.seoDescription.length}): ${rec.slug}`);
  assert.ok(rec.seoDescription.length >= 50, `desc too short: ${rec.slug}`);
  assert.doesNotMatch(rec.seoDescription, /…/);
}

const indexHtml = renderStaticContentPage('/companies/page/1');
assert.ok(indexHtml);
assert.match(indexHtml!, /href="\/stocks\/aapl"/);
assert.doesNotMatch(indexHtml!, /study node|Subsidiary/i);

const missing = enrichHtmlWithMetadata(
  fs.readFileSync(path.join(root, 'index.html'), 'utf8'),
  '/companies/apple-logistics-system',
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
assert.doesNotMatch(dir, /marketCap: '/);

console.log(`company-catalog.selftest: ok issuers=${counts.total}`);
