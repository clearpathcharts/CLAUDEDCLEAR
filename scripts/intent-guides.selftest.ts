/**
 * Search-intent guides stay truthful, substantial, and internally linked.
 * Run: npx tsx scripts/intent-guides.selftest.ts
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { INTENT_GUIDE_RECORDS, INTENT_DISCLAIMER } from '../src/server/intentGuides.ts';
import { GUIDE_RECORDS } from '../src/server/contentData.ts';
import { SEMANTIC_RECORDS } from '../src/server/semanticDatabase.ts';
import { PROFILE_SEO } from '../src/server/crawlCatalog.ts';
import { markdownToHtml } from '../src/server/contentPages.ts';
import { MEMBERSHIP_PLANS } from '../src/content/membershipPricing.ts';

const STATIC_PATHS = new Set([
  '/plans', '/encyclopedia', '/indicators', '/education', '/literacy', '/glossary', '/tools/position-size',
  '/accessibility', '/ui', '/desk/neurodivergent', '/desk/retail', '/desk/institutional', '/desk/fundamental',
]);
const PROHIBITED = [/\bnumber[- ]one\b/i, /#1\b/, /\bbest\b/i, /\bwe (are|’re|'re) a (broker|brokerage)\b/i, /\bguarantee(d|s)? (you|your|profit)/i];
const paidPrices = MEMBERSHIP_PLANS.filter((p) => p.priceCents > 0).map((p) => p.priceLabel);

const ids = Object.keys(INTENT_GUIDE_RECORDS);
assert.ok(ids.length >= 8, 'expected at least 8 intent guides');
const titles = new Set<string>();
for (const [key, g] of Object.entries(INTENT_GUIDE_RECORDS)) {
  assert.equal(g.id, key, `${key}: id must equal key`);
  assert.match(key, /^[a-z0-9-]+$/, `${key}: slug must be url-safe`);
  assert.equal(GUIDE_RECORDS[key], g, `${key}: must be served through GUIDE_RECORDS (sitemap + SSR)`);
  assert.ok(!titles.has(g.title), `${key}: duplicate title`);
  titles.add(g.title);
  assert.ok(g.title.length <= 95, `${key}: title too long for search results`);
  assert.ok(g.summary.length >= 120 && g.summary.length <= 320, `${key}: summary/meta description length`);
  assert.ok(g.content.length >= 2500, `${key}: thin content (${g.content.length} chars)`);
  assert.ok(g.faqs.length >= 3, `${key}: needs FAQ schema entries`);
  assert.ok(g.content.includes(INTENT_DISCLAIMER), `${key}: missing required disclaimer`);
  assert.doesNotMatch(g.content, /undefined|\$\/month|\s\/month/, `${key}: unresolved price interpolation`);

  const visible = [g.title, g.summary, g.content, ...g.faqs.flatMap((f) => [f.question, f.answer])].join('\n');
  for (const re of PROHIBITED) {
    const safe = visible.replace(/no guaranteed returns|guaranteed returns\.|can guarantee trading profits|guarantees the next move|“guaranteed profit” courses/gi, '');
    assert.doesNotMatch(safe, re, `${key}: prohibited claim ${re}`);
  }
  for (const m of visible.matchAll(/\$(\d+\.\d{2})\/month|\$(\d+\.\d{2}) per month/g)) {
    assert.ok(paidPrices.includes(`$${m[1] || m[2]}`), `${key}: price $${m[1] || m[2]} not in membershipPricing`);
  }

  for (const m of g.content.matchAll(/\]\((\/[^)]*)\)/g)) {
    const href = m[1];
    const ok =
      STATIC_PATHS.has(href) ||
      (href.startsWith('/guides/') && GUIDE_RECORDS[href.slice(8)]) ||
      (href.startsWith('/learn/') && SEMANTIC_RECORDS[href.slice(7)]) ||
      (href.startsWith('/ui/') && PROFILE_SEO.some((p) => p.slug === href.slice(4)));
    assert.ok(ok, `${key}: broken internal link ${href}`);
  }
}

const html = markdownToHtml('See [the calculator](/tools/position-size) and [bad](javascript:alert(1)) and [ext](https://evil.example).');
assert.match(html, /<a href="\/tools\/position-size">the calculator<\/a>/);
assert.doesNotMatch(html, /href="javascript|href="https/, 'only same-site links may render');

for (const rel of ['src/server/contentPages.ts', 'src/server/semanticDatabase.ts', 'src/server/regionalSeo.ts', 'src/components/Auth.tsx', 'src/components/ExternalAboutPage.tsx', 'src/content/tradingReimaginedLanding.ts']) {
  assert.doesNotMatch(fs.readFileSync(rel, 'utf8'), /unlimited indicators|无限指标|無制限のインジケーター|неограниченные индикаторы/i, `${rel}: free plan has 5 indicators, not unlimited`);
}

const serverSrc = fs.readFileSync('server.ts', 'utf8');
assert.match(serverSrc, /submitIndexNow\(priorityIndexNowUrls\(\)\)/, 'IndexNow boot ping uses the shared priority list');
const { priorityIndexNowUrls } = await import('../src/server/siteRegistry.ts');
const pinged = new Set(priorityIndexNowUrls());
for (const id of ids) {
  assert.ok(pinged.has(`https://clearpathtrader.com/guides/${id}`), `${id}: must be pinged to IndexNow on boot`);
}

console.log(`intent-guides.selftest: ok (${ids.length} guides)`);
