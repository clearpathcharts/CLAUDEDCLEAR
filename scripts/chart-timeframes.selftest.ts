/**
 * Complete timeframe catalog + fetch plans.
 * Run: npx tsx scripts/chart-timeframes.selftest.ts
 */
import assert from "node:assert/strict";
import {
  ALL_CHART_TIMEFRAMES,
  CHART_TIMEFRAME_GROUPS,
  chartTimeframeLabel,
  chartTimeframeStepSeconds,
  isMinuteOrSecondTimeframe,
  normalizeChartTimeframe,
} from "../src/constants/chartTimeframes.ts";
import { resolveTimeframePlan } from "../src/services/marketData.ts";
import { isIntradayTimeframe } from "../src/lib/planCatalog.ts";

assert.equal(CHART_TIMEFRAME_GROUPS.length, 6);
assert.equal(ALL_CHART_TIMEFRAMES.length, 9 + 13 + 11 + 3 + 9 + 8);

assert.equal(normalizeChartTimeframe("1H"), "1h");
assert.equal(normalizeChartTimeframe("1D"), "1d");
assert.equal(normalizeChartTimeframe("YTD"), "ytd");
assert.equal(normalizeChartTimeframe("5m"), "5m");
assert.equal(normalizeChartTimeframe("5M"), "5M");
assert.equal(normalizeChartTimeframe("1M"), "1M");
assert.equal(normalizeChartTimeframe("3Y"), "3Y");
assert.equal(normalizeChartTimeframe("60s"), "60s");

assert.equal(chartTimeframeLabel("1m"), "1 min");
assert.equal(chartTimeframeLabel("12h"), "12h");
assert.equal(chartTimeframeLabel("ytd"), "YTD");

assert.equal(isMinuteOrSecondTimeframe("13m"), true);
assert.equal(isMinuteOrSecondTimeframe("1s"), true);
assert.equal(isMinuteOrSecondTimeframe("1h"), false);
assert.equal(isMinuteOrSecondTimeframe("5M"), false);
assert.equal(isIntradayTimeframe("8m"), true);
assert.equal(isIntradayTimeframe("1d"), false);

assert.equal(chartTimeframeStepSeconds("1s"), 1);
assert.equal(chartTimeframeStepSeconds("13m"), 13 * 60);
assert.equal(chartTimeframeStepSeconds("12h"), 12 * 3600);
assert.equal(chartTimeframeStepSeconds("1w"), 604800);

const required = [
  "1s", "2s", "3s", "5s", "10s", "15s", "30s", "45s", "60s",
  "1m", "2m", "3m", "5m", "8m", "10m", "13m", "15m", "18m", "20m", "25m", "30m", "45m",
  "1h", "2h", "3h", "4h", "5h", "6h", "7h", "8h", "9h", "10h", "12h",
  "1d", "1w", "1M",
  "3M", "5M", "6M", "7M", "8M", "9M", "10M", "11M", "12M",
  "ytd", "3Y", "5Y", "7Y", "10Y", "11Y", "13Y", "15Y",
];
const ids = new Set(ALL_CHART_TIMEFRAMES.map((o) => o.id));
for (const id of required) {
  assert.ok(ids.has(id), `missing timeframe ${id}`);
  const plan = resolveTimeframePlan(id);
  assert.ok(plan.fetchInterval, `no fetch plan for ${id}`);
  assert.notEqual(plan.note, "Fallback 1day", `${id} fell through to 1day fallback`);
}

assert.equal(resolveTimeframePlan("5M").visibleBars, 110);
assert.equal(resolveTimeframePlan("8m").aggregateBars, 8);
assert.equal(resolveTimeframePlan("12h").fetchInterval, "4h");
assert.equal(resolveTimeframePlan("60s").fetchInterval, "1min");
assert.equal(resolveTimeframePlan("10Y").fetchInterval, "1month");

console.log(`ok chart-timeframes · ${ALL_CHART_TIMEFRAMES.length} intervals`);
