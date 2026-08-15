/**
 * Guards Market Terminal phone chart sizing — stacked slots must be full-size,
 * not ~300px thumbnails.
 *
 * Run: npx tsx scripts/chart-layout.selftest.ts
 */
import assert from 'node:assert/strict';
import {
  MARKET_CHART_MOBILE_MIN_BODY_HEIGHT,
  mobileStackedMarketChartHeight,
} from '../src/constants/chartLayout.ts';

assert.equal(
  mobileStackedMarketChartHeight(300),
  MARKET_CHART_MOBILE_MIN_BODY_HEIGHT,
  'short viewports still get the mobile floor (not thumbnail height)',
);
assert.equal(mobileStackedMarketChartHeight(800), 720, '800px viewport → 90% height');
assert.equal(mobileStackedMarketChartHeight(667), 600, 'iPhone SE-class → 90% height');
assert.ok(
  mobileStackedMarketChartHeight(844) >= 750,
  'modern phone height should leave a large candle area',
);
assert.ok(
  mobileStackedMarketChartHeight(0) >= MARKET_CHART_MOBILE_MIN_BODY_HEIGHT,
  'invalid viewport falls back safely',
);
assert.ok(
  mobileStackedMarketChartHeight(800) > 300,
  'must stay well above the old 300px thumbnail cap',
);

console.log('chart-layout.selftest: ok');
