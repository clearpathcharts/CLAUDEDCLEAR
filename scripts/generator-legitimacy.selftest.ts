/**
 * Generator legitimacy: glossary, literacy, knowledge-base, unique education, 404s.
 * Run: npx tsx scripts/generator-legitimacy.selftest.ts
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  getGlossaryCatalog,
  glossaryCatalogCounts,
  lookupGlossary,
} from '../src/lib/glossaryCatalog.ts';
import { standaloneKnowledgeRoutes, knowledgeItemForPath } from '../src/lib/knowledgeBaseRoutes.ts';
import {
  catalogCounts,
  glossaryEntries,
  literacyEntries,
  knowledgeBaseEntries,
  companyIndexEntries,
} from '../src/server/crawlCatalog.ts';
import { companyIndexPageCount } from '../src/lib/companyCatalog.ts';
import { getLessonBody } from '../src/education/lessonContent.ts';
import { enrichHtmlWithMetadata } from '../src/server/semanticDatabase.ts';
import { renderStaticContentPage } from '../src/server/contentPages.ts';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const gCounts = glossaryCatalogCounts();
assert.ok(gCounts.total >= 1_500, `glossary too small: ${gCounts.total}`);
assert.ok(gCounts.core >= 40, `core terms ${gCounts.core}`);
assert.ok(gCounts.seed >= 500, `seed terms ${gCounts.seed}`);

const catalog = getGlossaryCatalog();
const slugs = new Set<string>();
for (const rec of catalog) {
  assert.ok(!slugs.has(rec.slug), `dup glossary slug ${rec.slug}`);
  slugs.add(rec.slug);
  assert.ok(rec.seoTitle.length <= 70, rec.seoTitle);
  assert.doesNotMatch(rec.seoTitle, /…/);
  assert.ok(rec.seoDescription.length <= 160, rec.slug);
  assert.doesNotMatch(rec.seoDescription, /…/);
  assert.doesNotMatch(rec.definition, /high-altitude operational environments/i);
}
assert.equal(glossaryEntries().length, gCounts.total + gCounts.letters);

const ask = lookupGlossary('ask');
assert.ok(ask);
assert.equal(ask!.source, 'core');

const html = renderStaticContentPage(`/glossary/${ask!.slug}`);
assert.ok(html);
const enriched = enrichHtmlWithMetadata(html!, `/glossary/${ask!.slug}`);
assert.match(enriched, /<title>/i);
const meta = enriched.match(/<meta name="description" content="([^"]*)"/i)?.[1] || '';
assert.ok(meta.length <= 160, meta);
assert.doesNotMatch(meta, /…/);
assert.match(enriched, /DefinedTerm|Ask/i);

const letterHtml = renderStaticContentPage('/glossary/letter/a');
assert.ok(letterHtml);
assert.match(letterHtml!, /Glossary/i);

const missingG = enrichHtmlWithMetadata(
  fs.readFileSync(path.join(root, 'index.html'), 'utf8'),
  '/glossary/this-term-does-not-exist-zz',
);
assert.match(missingG, /noindex/);

assert.equal(standaloneKnowledgeRoutes().length, 6);
for (const r of standaloneKnowledgeRoutes()) {
  const page = renderStaticContentPage(r.path);
  assert.ok(page, `missing KB SSR ${r.path}`);
  const en = enrichHtmlWithMetadata(page!, r.path);
  assert.match(en, /DATA UNAVAILABLE|education/i);
  assert.doesNotMatch(en, /guaranteed returns/i);
  const meta = en.match(/<meta name="description" content="([^"]*)"/i)?.[1] || '';
  assert.ok(meta.length >= 50 && meta.length <= 160, `${r.path} desc ${meta.length}`);
  assert.doesNotMatch(meta, /…/);
  const full = (knowledgeItemForPath(r.path)?.definition || '').replace(/\s+/g, ' ').trim();
  assert.ok(full.startsWith(meta), `${r.path} meta is not a prefix of the article`);
  if (meta.length < full.length) {
    assert.equal(full[meta.length], ' ', `${r.path} meta cut mid-word: …${meta.slice(-12)}`);
  }
}
assert.equal(knowledgeBaseEntries().length, 6);

const lit = literacyEntries();
assert.ok(lit.length >= 15, `literacy ${lit.length}`);
const track = renderStaticContentPage('/literacy/track_observe');
assert.ok(track);
const lesson = renderStaticContentPage('/literacy/track_observe/obs_1');
assert.ok(lesson);
assert.match(lesson!, /Name what you see/);
const wiki = renderStaticContentPage('/literacy/wiki/candles');
assert.ok(wiki);
assert.match(wiki!, /Candlesticks/);

const a = getLessonBody('crypto-u2-l1', 'Wallets', 'Crypto School', 'Custody');
const b = getLessonBody('stocks-u1-l1', 'Shares', 'Stocks School', 'Ownership');
assert.notEqual(a.summary, b.summary);
assert.match(a.summary, /DATA UNAVAILABLE/);

const counts = catalogCounts();
assert.equal(counts.glossary, gCounts.total);
assert.equal(counts.companyIndexPages, companyIndexPageCount());
assert.ok(companyIndexEntries().length === counts.companyIndexPages);
assert.ok(counts.companyIndexPages + counts.companyPages <= 50_000);

const idx = renderStaticContentPage('/companies/page/1');
assert.ok(idx);
assert.match(idx!, /Company study pages/);

const stocksHub = renderStaticContentPage('/stocks');
assert.ok(stocksHub);
assert.match(stocksHub!, /What Is |equity|Stock/i);

const server = fs.readFileSync(path.join(root, 'server.ts'), 'utf8');
assert.match(server, /sitemap-glossary\.xml/);
assert.match(server, /sitemap-literacy\.xml/);
assert.match(server, /sitemap-knowledge\.xml/);
assert.match(server, /sendEncyclopedia404/);

const dir = fs.readFileSync(
  path.join(root, 'src/components/encyclopedia/CompaniesDirectoryView.tsx'),
  'utf8',
);
assert.match(dir, /DATA UNAVAILABLE/);

console.log(
  `generator-legitimacy.selftest: ok glossary=${gCounts.total} literacy=${lit.length} kb=${knowledgeBaseEntries().length} companyIndex=${counts.companyIndexPages}`,
);
