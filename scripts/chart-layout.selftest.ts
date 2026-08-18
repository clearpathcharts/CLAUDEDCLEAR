/**
 * Guards Market Terminal phone chart sizing — stacked slots must be full-size,
 * not ~300px thumbnails.
 *
 * Run: npx tsx scripts/chart-layout.selftest.ts
 */
import assert from 'node:assert/strict';
import {
  MARKET_CHART_MOBILE_MIN_BODY_HEIGHT,
  MARKET_CHART_MOBILE_SLOT_HEADER,
  mobileStackedMarketChartHeight,
} from '../src/constants/chartLayout.ts';

assert.equal(
  mobileStackedMarketChartHeight(300),
  MARKET_CHART_MOBILE_MIN_BODY_HEIGHT,
  'short viewports still get the mobile floor (not thumbnail height)',
);
assert.equal(
  mobileStackedMarketChartHeight(800),
  800 - MARKET_CHART_MOBILE_SLOT_HEADER,
  '800px viewport → full height minus slot header',
);
assert.equal(
  mobileStackedMarketChartHeight(667),
  MARKET_CHART_MOBILE_MIN_BODY_HEIGHT,
  'short phones still hit the 640px floor',
);
assert.ok(
  mobileStackedMarketChartHeight(844) >= 790,
  'modern phone height should leave a near-fullscreen candle area',
);
assert.ok(
  mobileStackedMarketChartHeight(0) >= MARKET_CHART_MOBILE_MIN_BODY_HEIGHT,
  'invalid viewport falls back safely',
);
assert.ok(
  mobileStackedMarketChartHeight(800) > 300,
  'must stay well above the old 300px thumbnail cap',
);
assert.equal(
  mobileStackedMarketChartHeight(900),
  900 - MARKET_CHART_MOBILE_SLOT_HEADER,
  'body should consume the full viewport minus only the slot header',
);

console.log('chart-layout.selftest: ok');
