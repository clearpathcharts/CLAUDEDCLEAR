/**
 * Overnight structure review — universe, classifier, snapshot, sweep (no live vendor).
 * Run: npm run test:daily-pattern-review
 */
import assert from "node:assert/strict";
import {
  DAILY_PATTERN_UNIVERSE,
  universeCounts,
  mappedUniverse,
} from "../src/server/dailyPatternUniverse";
import { classifyDailyPatterns } from "../src/server/dailyPatternClassify";
import { renderDailyPatternSnapshot, sessionDateFromCandles } from "../src/server/dailyPatternSnapshot";
import { FREE_FINANCE_NEWS_FEEDS } from "../src/server/freeFinanceNews";
import {
  previousCompletedDaily,
  scanSymbolFromCandles,
  runDailyPatternSweep,
  twelveValuesToCandles,
} from "../src/server/dailyPatternReviewService";
import { detectNestedStructures } from "../src/patterns/chartPatterns";
import { getRegistryAsset } from "../src/constants/assetRegistry";
import type { DetectedPattern } from "../src/patterns/types";
import type { Candle } from "../src/types/indicators";

const counts = universeCounts();
assert.equal(counts.forex, 25, "top 25 forex");
assert.equal(counts.stocks, 10, "top stocks from registry");
assert.equal(counts.indices, 5, "top indices from registry");
assert.equal(counts.futures, 10, "top 10 futures proxy slots");
assert.equal(counts.commodities, 10, "top 10 commodities slots");

const unmapped = DAILY_PATTERN_UNIVERSE.filter((t) => t.unavailableReason === "NO VENDOR MAP");
assert.equal(unmapped.length, 4);
assert.ok(unmapped.every((t) => t.symbol === null));

for (const row of mappedUniverse()) {
  assert.ok(row.symbol);
  const asset = getRegistryAsset(row.symbol!);
  assert.ok(asset?.enabled, `${row.symbol} must be an enabled registry asset`);
}

assert.ok(
  DAILY_PATTERN_UNIVERSE.filter((t) => t.bucket === "futures").every((t) => t.proxyNote),
  "futures rows must disclose cash/index proxy — not listed contracts",
);

for (const feed of FREE_FINANCE_NEWS_FEEDS) {
  assert.match(feed.url, /^https:\/\//);
}

const values = [
  { datetime: "2026-09-07", open: "1.10", high: "1.12", low: "1.09", close: "1.11" },
  { datetime: "2026-09-08", open: "1.11", high: "1.13", low: "1.10", close: "1.12" },
];
const fromTd = twelveValuesToCandles(values);
assert.equal(fromTd.length, 2);
assert.ok(fromTd[0].time < fromTd[1].time);

const today = Date.parse("2026-09-09T12:00:00.000Z");
const withToday: Candle[] = [
  ...fromTd,
  { time: Date.parse("2026-09-09T00:00:00.000Z"), open: 1.12, high: 1.14, low: 1.11, close: 1.13 },
];
const completed = previousCompletedDaily(withToday, today);
assert.equal(completed.length, 2);
assert.equal(sessionDateFromCandles(completed), "2026-09-08");

function descTriangleBars(
  bars: number,
  floor: number,
  startHigh: number,
  t0: number,
): Candle[] {
  const out: Candle[] = [];
  for (let i = 0; i < bars; i++) {
    const t = bars === 1 ? 0 : i / (bars - 1);
    const peak = startHigh - (startHigh - floor - 0.4) * t;
    const isPeak = i % 3 === 0;
    const isTrough = i % 3 === 1;
    const high = isPeak ? peak : peak - 0.18;
    const low = isTrough ? floor : floor + 0.14;
    const open = low + (high - low) * (isPeak ? 0.35 : 0.65);
    const close = low + (high - low) * (isPeak ? 0.7 : 0.3);
    out.push({ time: t0 + i * 86_400_000, open, high, low, close });
  }
  return out;
}

const nestedA = descTriangleBars(16, 105.4, 108.2, Date.parse("2026-06-01T00:00:00.000Z"));
const drop1 = descTriangleBars(10, 102.2, 105.5, nestedA[nestedA.length - 1].time + 86_400_000);
const nestedB = descTriangleBars(16, 102.4, 105.1, drop1[drop1.length - 1].time + 86_400_000);
const drop2 = descTriangleBars(14, 100.0, 102.6, nestedB[nestedB.length - 1].time + 86_400_000);
const fractalDesc = [...nestedA, ...drop1, ...nestedB, ...drop2];

const parentDesc: DetectedPattern = {
  id: "descending_triangle",
  category: "chart",
  label: "Descending Triangle",
  direction: "bearish",
  startIndex: 0,
  endIndex: fractalDesc.length - 1,
  time: fractalDesc[fractalDesc.length - 1].time,
  confidence: 0.81,
  scale: "major",
  geometry: {
    lines: [
      {
        role: "upper",
        from: { index: 0, time: fractalDesc[0].time, price: 108.2 },
        to: { index: fractalDesc.length - 1, time: fractalDesc[fractalDesc.length - 1].time, price: 101.2 },
      },
      {
        role: "lower",
        from: { index: 0, time: fractalDesc[0].time, price: 100 },
        to: { index: fractalDesc.length - 1, time: fractalDesc[fractalDesc.length - 1].time, price: 100 },
      },
    ],
  },
};

const nestedHits = detectNestedStructures(fractalDesc, [parentDesc]);
assert.ok(nestedHits.some((p) => p.scale === "nested"));

const candleHit: DetectedPattern = {
  id: "bearish_engulfing",
  category: "candlestick",
  label: "Bearish Engulfing",
  direction: "bearish",
  startIndex: fractalDesc.length - 1,
  endIndex: fractalDesc.length - 1,
  time: fractalDesc[fractalDesc.length - 1].time,
  confidence: 0.7,
};

const classified = classifyDailyPatterns([parentDesc, ...nestedHits, candleHit]);
assert.equal(classified.dailyPattern?.id, "descending_triangle");
assert.ok(classified.subPatterns.length >= 1);
assert.ok(
  classified.independentPatterns.some((p) => p.id === "bearish_engulfing"),
  "candlestick not nested inside a child structure should be independent",
);

const svg = renderDailyPatternSnapshot(fractalDesc, [parentDesc, ...nestedHits], {
  symbol: "EURUSD",
  sessionDate: sessionDateFromCandles(fractalDesc),
  title: "EUR/USD",
});
assert.match(svg, /<svg /);
assert.match(svg, /EUR\/USD/);
assert.doesNotMatch(svg, /<script/i);

const eurusdTarget = DAILY_PATTERN_UNIVERSE.find((t) => t.symbol === "EURUSD");
assert.ok(eurusdTarget);
const scanned = scanSymbolFromCandles(eurusdTarget, fractalDesc);
assert.equal(scanned.status, "ok");
assert.match(scanned.snapshotSvg, /<svg /);
assert.match(scanned.summary, /daily /);

const wheat = DAILY_PATTERN_UNIVERSE.find((t) => t.id === "commodities:wheat");
assert.ok(wheat);
const blank = scanSymbolFromCandles(wheat, []);
assert.equal(scanned.status === "ok", true);
assert.equal(blank.status, "unavailable");
assert.equal(blank.summary, "DATA UNAVAILABLE");

const wedgeCandles: Candle[] = [];
for (let i = 0; i < 40; i++) {
  const floor = 100 + i * 0.35;
  const ceil = floor + 4 - i * 0.06;
  wedgeCandles.push({
    time: Date.parse("2026-06-01T00:00:00.000Z") + i * 86_400_000,
    open: floor + 1,
    high: ceil,
    low: floor,
    close: floor + 2.5,
  });
}

const report = await runDailyPatternSweep({
  force: true,
  fetchCandles: async () => wedgeCandles,
  fetchNews: async () => ({
    items: [
      {
        title: "Fed holds rates (fixture)",
        source: "Federal Reserve Press",
        link: "https://www.federalreserve.gov/",
      },
    ],
    sourcesTried: ["BBC Business", "Federal Reserve Press"],
    sourcesOk: ["Federal Reserve Press"],
  }),
});

assert.equal(report.rows.length, DAILY_PATTERN_UNIVERSE.length);
assert.ok(report.scanned >= 25);
assert.ok(report.unavailable >= 4);
assert.ok(report.news.items[0]?.title.includes("Fed holds rates"));
assert.match(report.disclaimer, /never a confirmed signal/i);
assert.doesNotMatch(JSON.stringify(report.rows.filter((r) => r.status === "unavailable").slice(0, 4)), /1\.2345/);

const wheatRow = report.rows.find((r) => r.id === "commodities:wheat");
assert.equal(wheatRow?.status, "unavailable");
assert.equal(wheatRow?.unavailableReason, "NO VENDOR MAP");

const fxRow = report.rows.find((r) => r.symbol === "EURUSD");
assert.equal(fxRow?.status, "ok");
assert.match(fxRow?.snapshotSvg || "", /<svg /);
assert.match(fxRow?.summary || "", /daily /);

console.log(
  `PASS: daily pattern review universe forex=${counts.forex} stocks=${counts.stocks} indices=${counts.indices} futures=${counts.futures} commodities=${counts.commodities} labeled=${report.labeled}`,
);
