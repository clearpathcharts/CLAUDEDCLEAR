/**
 * Regional hub SEO guards (RU/CN/JP/PH).
 * Run: npx tsx scripts/regional-hubs.selftest.ts
 */
import assert from 'node:assert/strict';
import {
  REGIONAL_MARKETS,
  REGIONAL_FX_ENRICHMENTS,
  getRegionalMarket,
  getRegionalFxEnrichment,
  regionalHreflangHints,
  regionalIndexNowUrls,
} from '../src/server/regionalSeo.ts';
import {
  renderStaticContentPage,
  isUnknownRegionPath,
  renderUnknownRegionNotFound,
} from '../src/server/contentPages.ts';
import { enrichHtmlWithMetadata } from '../src/server/semanticDatabase.ts';

assert.deepEqual(
  REGIONAL_MARKETS.map((m) => m.id),
  ['ru', 'cn', 'jp', 'ph'],
);

for (const m of REGIONAL_MARKETS) {
  assert.ok(m.bodyHtml.length > 1200, `${m.id} body should be thickened`);
  assert.ok(m.faqs.length >= 3, `${m.id} needs FAQ entries`);
  assert.ok(m.cta.chartTitle.length > 4, `${m.id} needs localized CTA`);
  const html = renderStaticContentPage(m.hubPath);
  assert.ok(html, `${m.id} must render static HTML`);
  const enriched = enrichHtmlWithMetadata(html!, m.hubPath);
  assert.match(enriched, /<h1>/, `${m.id} needs H1`);
  assert.equal((enriched.match(/<h1[\s>]/gi) || []).length, 1, `${m.id} exactly one H1`);
  assert.match(enriched, /"@type": "FAQPage"/, `${m.id} FAQPage JSON-LD`);
  assert.match(enriched, new RegExp(`lang="${m.lang.split('-')[0]}"`), `${m.id} html lang`);
  // Localized CTA should not force English chart headline on hubs
  assert.doesNotMatch(
    enriched,
    /Put this knowledge on a live chart/,
    `${m.id} CTA must be localized`,
  );
}

const ph = getRegionalMarket('ph')!;
assert.match(ph.bodyHtml, /\/forex\/usdphp/, 'PH hub must link USD/PHP');
assert.doesNotMatch(ph.bodyHtml, /\/forex\/usdjpy/, 'PH hub should not misuse USD/JPY as primary');

const enLearn = regionalHreflangHints('https://clearpathtrader.com/learn');
assert.deepEqual(
  enLearn.map((h) => h.hreflang),
  ['x-default', 'en'],
  'generic EN pages should not fake language alternates to hubs',
);

const ruAlt = regionalHreflangHints('https://clearpathtrader.com/regions/ru', { marketId: 'ru' });
assert.ok(ruAlt.some((h) => h.hreflang === 'ru-RU'));
assert.ok(ruAlt.some((h) => h.hreflang === 'tl' && h.href.endsWith('/regions/ph')));

const urls = regionalIndexNowUrls();
assert.ok(urls.includes('https://clearpathtrader.com/forex/usdphp'));
assert.ok(urls.includes('https://clearpathtrader.com/regions/cn'));

// Unknown region paths must not render as thin SPA HTML
assert.equal(isUnknownRegionPath('/regions/kr'), true);
assert.equal(isUnknownRegionPath('/regions/ru'), false);
assert.equal(renderStaticContentPage('/regions/kr'), null);
const notFound = enrichHtmlWithMetadata(renderUnknownRegionNotFound('/regions/kr'), '/regions/kr');
assert.match(notFound, /noindex/);
assert.match(notFound, /Regional hub not found/);
assert.match(notFound, /\/regions\/ru/);
assert.match(notFound, /rel="canonical" href="https:\/\/clearpathtrader.com\/regions"/);

// Regional FX pair pages should be thickened (not procedural one-liners only)
for (const fx of REGIONAL_FX_ENRICHMENTS) {
  const html = renderStaticContentPage(`/forex/${fx.pairKey}`);
  assert.ok(html, `${fx.pairKey} must render`);
  const enriched = enrichHtmlWithMetadata(html!, `/forex/${fx.pairKey}`);
  assert.match(enriched, new RegExp(fx.pairLabel.replace('/', '\\/')));
  assert.match(enriched, /"@type": "FAQPage"/, `${fx.pairKey} FAQPage`);
  assert.ok(
    (enriched.match(/<h2>/gi) || []).length >= 4,
    `${fx.pairKey} should have multiple study sections`,
  );
  const overlay = getRegionalFxEnrichment(fx.pairKey);
  assert.ok(overlay?.contextHtml.includes(`/regions/${fx.hubId}`), `${fx.pairKey} links hub`);
}

console.log('regional-hubs.selftest: ok');
