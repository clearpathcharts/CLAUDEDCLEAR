/**
 * Guards Market Terminal phone chart sizing — stacked slots must be full-size,
 * not ~300px thumbnails.
 *
 * Run: npx tsx scripts/chart-layout.selftest.ts
 */
import assert from 'node:assert/strict';
import {
  MARKET_CHART_DESKTOP_BODY_HEIGHT,
  MARKET_CHART_HEIGHT,
  MARKET_CHART_HEIGHT_LEGACY,
  MARKET_CHART_MOBILE_MIN_BODY_HEIGHT,
  MARKET_CHART_MOBILE_SLOT_HEADER,
  mobileStackedMarketChartHeight,
  normalizeMarketSlotY,
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
  mobileStackedMarketChartHeight(844) >= 844 - MARKET_CHART_MOBILE_SLOT_HEADER,
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

assert.ok(
  MARKET_CHART_HEIGHT >= MARKET_CHART_DESKTOP_BODY_HEIGHT + 80,
  'desktop panel must leave room for pulse+search without shrinking candles',
);
assert.ok(
  MARKET_CHART_DESKTOP_BODY_HEIGHT >= 500,
  'desktop candle body must stay readable (not a thumbnail)',
);
assert.equal(normalizeMarketSlotY(0, 0), 0);
assert.equal(normalizeMarketSlotY(MARKET_CHART_HEIGHT_LEGACY, 1), MARKET_CHART_HEIGHT);
assert.equal(normalizeMarketSlotY(MARKET_CHART_HEIGHT_LEGACY * 2, 2), MARKET_CHART_HEIGHT * 2);

console.log('chart-layout.selftest: ok');
