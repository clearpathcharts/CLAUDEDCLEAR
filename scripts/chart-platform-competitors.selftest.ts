/**
 * Chart-platform competitor catalog — canonical list for Metricool setup + site guide.
 * Run: npx tsx scripts/chart-platform-competitors.selftest.ts
 */
import assert from 'node:assert/strict';
import {
  chartPlatformCompetitorsByCategory,
  getChartPlatformCompetitorCatalog,
  metricoolStarterCompetitors,
} from '../src/server/chartPlatformCompetitors.ts';

const catalog = getChartPlatformCompetitorCatalog();

assert.equal(catalog.competitors.length, 33, 'founder list should contain 33 products');
assert.equal(catalog.metricool.freePlanStarterIds.length, 5, 'Metricool free tier allows five per network');

const ids = new Set<string>();
for (const row of catalog.competitors) {
  assert.match(row.id, /^[a-z0-9-]+$/, `${row.name}: id must be url-safe`);
  assert.ok(!ids.has(row.id), `duplicate id ${row.id}`);
  ids.add(row.id);
  assert.match(row.website, /^https:\/\//, `${row.name}: website must be https`);
  assert.ok(row.focus.length >= 12, `${row.name}: focus blurb too short`);
  assert.ok(
    catalog.categories.some((c) => c.id === row.categoryId),
    `${row.name}: unknown category ${row.categoryId}`
  );
}

for (const id of catalog.metricool.freePlanStarterIds) {
  assert.ok(ids.has(id), `starter id missing from catalog: ${id}`);
}

assert.equal(metricoolStarterCompetitors().length, 5);

const grouped = chartPlatformCompetitorsByCategory();
assert.equal(
  grouped.reduce((n, g) => n + g.competitors.length, 0),
  catalog.competitors.length,
  'every competitor must appear in a category group'
);

console.log('chart-platform-competitors.selftest: ok');
