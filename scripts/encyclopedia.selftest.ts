/**
 * Completeness checks for both encyclopedias.
 * Run: npx tsx scripts/encyclopedia.selftest.ts
 *
 * Indicators encyclopedia: no video players; every entry has a standard SVG
 * illustration, a description, and a study guide. Live overlays map onto
 * IndicatorBank abbreviations. Finance encyclopedia: BONDS article exists;
 * education articles have no video-feed placeholders.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

async function main() {
  const {
    INDICATOR_NAMES,
    buildIndicators,
    indicatorImageSlug,
    indicatorChartAbbr,
  } = await import('../src/components/indicatorsData.ts');
  const { INDICATOR_DESCRIPTIONS } = await import('../src/components/indicatorDescriptions.ts');
  const { SUPPORTED_CHART_INDICATORS } = await import('../src/config/tradingViewIndicators.ts');
  const { IndicatorBank } = await import('../src/core/engine/IndicatorBank.ts');
  const { ENCYCLOPEDIA_KNOWLEDGE_BASE } = await import(
    '../src/components/encyclopedia/KnowledgeBaseData.ts'
  );
  const { encyclopediaArticles } = await import(
    '../src/components/encyclopedia/EncyclopediaData.ts'
  );

  const indicators = buildIndicators();
  assert.equal(indicators.length, INDICATOR_NAMES.length);
  assert.ok(indicators.length >= 180, `expected a full indicator set, got ${indicators.length}`);

  const slugs = new Set<string>();
  for (const ind of indicators) {
    assert.ok(ind.name, 'indicator missing name');
    assert.ok(ind.description && ind.description.length > 40, `thin description: ${ind.name}`);
    assert.ok(INDICATOR_DESCRIPTIONS[ind.name], `missing INDICATOR_DESCRIPTIONS for ${ind.name}`);
    assert.equal(ind.slug, indicatorImageSlug(ind.name));
    assert.ok(!slugs.has(ind.slug), `duplicate slug ${ind.slug}`);
    slugs.add(ind.slug);

    assert.ok(!('hasVideo' in ind), `${ind.name} still carries hasVideo`);
    assert.ok(!('videoUrl' in ind), `${ind.name} still carries videoUrl`);
    assert.ok(ind.img.startsWith('/encyclopedia-indicators/') && ind.img.endsWith('.svg'), `${ind.name} img is not a standard SVG path`);

    const svgPath = path.join(root, 'public', ind.img.replace(/^\//, ''));
    assert.ok(fs.existsSync(svgPath), `missing SVG for ${ind.name}: ${svgPath}`);

    assert.ok(ind.guide.formula);
    assert.ok(ind.guide.howToRead);
    assert.ok(ind.guide.limitations);
    assert.ok(ind.guide.typicalSettings);

    if (ind.hasLiveOverlay) {
      assert.ok(ind.chartAbbr, `${ind.name} marked live without abbr`);
      assert.equal(typeof IndicatorBank[ind.chartAbbr], 'function', `${ind.name} live abbr ${ind.chartAbbr} is not in IndicatorBank`);
    }
  }

  const liveAbbrs = new Set(SUPPORTED_CHART_INDICATORS.map((i) => i.abbr));
  const covered = new Set(
    indicators.filter((i) => i.chartAbbr && liveAbbrs.has(i.chartAbbr as never)).map((i) => i.chartAbbr)
  );
  for (const live of SUPPORTED_CHART_INDICATORS) {
    assert.ok(covered.has(live.abbr), `live overlay ${live.abbr} (${live.name}) has no encyclopedia card`);
  }

  const src = fs.readFileSync(path.join(root, 'src/components/indicatorsData.ts'), 'utf8');
  assert.doesNotMatch(src, /BigBuckBunny/);
  assert.doesNotMatch(src, /gtv-videos-bucket/);
  const ui = fs.readFileSync(path.join(root, 'src/components/EncyclopediaOfIndicators.tsx'), 'utf8');
  assert.doesNotMatch(ui, /<video/);
  assert.doesNotMatch(ui, /hasVideo/);
  assert.doesNotMatch(ui, /videoUrl/);

  assert.ok(ENCYCLOPEDIA_KNOWLEDGE_BASE['encyclopedia/markets/bonds.html'], 'BONDS knowledge article missing');
  for (const art of encyclopediaArticles) {
    assert.doesNotMatch(art.content, /NANO BANANA VIDEO FEED/);
    assert.doesNotMatch(art.content, /<video/i);
  }

  // DMI vs ADX mapping must not collapse both onto ADX.
  assert.equal(indicatorChartAbbr('Directional Movement Index (DMI)'), 'DMI');
  assert.equal(indicatorChartAbbr('ADX (Average Directional Index)'), 'ADX');
  assert.equal(indicatorChartAbbr('Commitment of Traders (COT)'), 'COT');

  console.log(
    `encyclopedia.selftest ok — ${indicators.length} indicator SVGs, ${covered.size} live overlays, ${encyclopediaArticles.length} finance articles`
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
