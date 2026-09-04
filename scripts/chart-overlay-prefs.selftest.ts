/**
 * Phone chart-first overlays: Pattern Scanner / Forming Watch start off the candles.
 * Run: npx tsx scripts/chart-overlay-prefs.selftest.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "path";
import { fileURLToPath } from "node:url";
import {
  FORMING_WATCH_OPEN_KEY,
  NARROW_CHART_MQ,
  PATTERN_HUD_OPEN_KEY,
  defaultChartOverlayOpen,
  hideDesktopAxisHints,
  isNarrowChartViewport,
} from "../src/lib/charts/chartOverlayPrefs.ts";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

assert.equal(defaultChartOverlayOpen(true), false);
assert.equal(defaultChartOverlayOpen(false), true);
assert.equal(PATTERN_HUD_OPEN_KEY, "cp_chart_pattern_hud_open_v2");
assert.equal(FORMING_WATCH_OPEN_KEY, "cp_chart_forming_watch_open_v2");
assert.match(NARROW_CHART_MQ, /767px/);

assert.equal(
  isNarrowChartViewport({ innerWidth: 390, matchMedia: (q) => ({ matches: q.includes("767") }) }),
  true,
);
assert.equal(
  isNarrowChartViewport({ innerWidth: 1280, matchMedia: () => ({ matches: false }) }),
  false,
);
assert.equal(
  hideDesktopAxisHints({
    matchMedia: (q) => ({ matches: q.includes("coarse") || q.includes("hover") }),
  }),
  true,
);
assert.equal(hideDesktopAxisHints({ matchMedia: () => ({ matches: false }) }), false);

const lc = fs.readFileSync(path.join(root, "src/components/charts/LightweightCandles.tsx"), "utf8");
assert.match(lc, /PATTERN_HUD_OPEN_KEY/);
assert.match(lc, /FORMING_WATCH_OPEN_KEY/);
assert.match(lc, /data-chart-mobile-intel/);
assert.match(lc, /data-chart-mobile-intel-panels/);
assert.match(lc, /placement="inline"/);
assert.match(lc, /placement="overlay"/);
assert.match(lc, /CHART-BUILD-2026-09-04-MOBILE/);
assert.match(lc, /hidden md:block/);
assert.doesNotMatch(lc, /cp_chart_pattern_hud_open"/);
assert.doesNotMatch(lc, /localStorage\.getItem\("cp_chart_pattern_hud_open"\)/);

const hud = fs.readFileSync(path.join(root, "src/components/charts/ChartPatternHud.tsx"), "utf8");
assert.match(hud, /placement\?: 'overlay' \| 'inline'/);
assert.match(hud, /data-pattern-hud-placement/);

const forming = fs.readFileSync(path.join(root, "src/components/charts/ChartFormingWatch.tsx"), "utf8");
assert.match(forming, /data-forming-watch-placement/);

const pub = fs.readFileSync(path.join(root, "src/components/PublicLiveChart.tsx"), "utf8");
assert.match(pub, /min-h-\[70vh\]/);
assert.match(pub, /data-mobile-chart-first/);
assert.match(pub, /data-public-chart-plot/);

const auth = fs.readFileSync(path.join(root, "src/components/Auth.tsx"), "utf8");
assert.match(auth, /data-auth-chart-first/);
assert.match(auth, /order-1 md:order-2/);
assert.match(auth, /Site menu/);
assert.match(auth, /hidden md:block/);

const market = fs.readFileSync(path.join(root, "src/components/markets/LightweightMarketUI.tsx"), "utf8");
assert.match(market, /Pattern Scanner \+ drawing tools — tap to open/);
assert.match(market, /<details className="lg:hidden/);

console.log("chart-overlay-prefs.selftest: ok");
