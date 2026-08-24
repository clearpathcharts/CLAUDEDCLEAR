/**
 * Guards Market Terminal chart sizing — stacked slots must fill the
 * remaining window, not sit as 520px thumbnails under a tall header stack.
 *
 * Run: npx tsx scripts/chart-layout.selftest.ts
 */
import assert from 'node:assert/strict';
import {
  MARKET_CHART_DESKTOP_BODY_HEIGHT,
  MARKET_CHART_DESKTOP_CHROME,
  MARKET_CHART_DESKTOP_MIN_BODY_HEIGHT,
  MARKET_CHART_HEIGHT,
  MARKET_CHART_HEIGHT_LEGACY,
  MARKET_CHART_MOBILE_MIN_BODY_HEIGHT,
  MARKET_CHART_MOBILE_SLOT_HEADER,
  desktopMarketPanelHeight,
  desktopStackedMarketChartHeight,
  mobileStackedMarketChartHeight,
  normalizeMarketSlotY,
} from '../src/constants/chartLayout.ts';
import { nextChartPixelSize } from '../src/lib/charts/chartResize.ts';

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
  MARKET_CHART_DESKTOP_MIN_BODY_HEIGHT >= 420,
  'desktop floor stays usable on tiny windows',
);
assert.ok(
  MARKET_CHART_DESKTOP_MIN_BODY_HEIGHT < 700,
  'desktop floor must not exceed a typical leftover viewport (that was the squeeze)',
);
assert.ok(
  MARKET_CHART_HEIGHT >= MARKET_CHART_DESKTOP_BODY_HEIGHT + MARKET_CHART_DESKTOP_CHROME - 16,
  'desktop panel must leave room for pulse+search without shrinking candles',
);
assert.equal(
  desktopStackedMarketChartHeight(700),
  700 - 56,
  'short desktops fill the remaining window instead of forcing 860px past the fold',
);
assert.equal(
  desktopStackedMarketChartHeight(1080),
  1080 - 56,
  '1080px desktop → window minus default nav reserve',
);
assert.equal(
  desktopStackedMarketChartHeight(1080, 240),
  1080 - 240,
  'measured header offset is subtracted so candles fill the leftover hole',
);
assert.equal(
  desktopStackedMarketChartHeight(400),
  MARKET_CHART_DESKTOP_MIN_BODY_HEIGHT,
  'tiny windows still hit the 420px floor',
);
assert.equal(
  desktopMarketPanelHeight(900),
  900 + MARKET_CHART_DESKTOP_CHROME,
  'panel height is candle body plus pulse/search chrome',
);
assert.equal(nextChartPixelSize(0, 800), null, 'skip resize while width is 0');
assert.equal(nextChartPixelSize(1200, 0), null, 'skip resize while height is 0 — never lock a stale px fallback');
assert.deepEqual(nextChartPixelSize(1200.9, 640.2), { width: 1200, height: 640 });

assert.equal(normalizeMarketSlotY(0, 0), 0);
assert.equal(normalizeMarketSlotY(MARKET_CHART_HEIGHT_LEGACY, 1), MARKET_CHART_HEIGHT);
assert.equal(normalizeMarketSlotY(MARKET_CHART_HEIGHT_LEGACY * 2, 2), MARKET_CHART_HEIGHT * 2);
assert.equal(normalizeMarketSlotY(520, 1), MARKET_CHART_HEIGHT);
assert.equal(normalizeMarketSlotY(640, 1), MARKET_CHART_HEIGHT);

console.log('chart-layout.selftest: ok');
