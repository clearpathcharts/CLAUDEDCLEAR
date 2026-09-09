/**
 * Daily structure briefing — universe, weekly+daily classifier, schedule, sweep.
 * Run: npm run test:daily-pattern-review
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {
  DAILY_PATTERN_UNIVERSE,
  universeCounts,
  mappedUniverse,
} from "../src/server/dailyPatternUniverse";
import { classifyDailyPatterns, summarizeMultiTimeframe } from "../src/server/dailyPatternClassify";
import { renderDailyPatternSnapshot, sessionDateFromCandles } from "../src/server/dailyPatternSnapshot";
import { FREE_FINANCE_NEWS_FEEDS } from "../src/server/freeFinanceNews";
import {
  previousCompletedDaily,
  previousCompletedWeekly,
  scanSymbolFromCandles,
  runDailyPatternSweep,
  twelveValuesToCandles,
} from "../src/server/dailyPatternReviewService";
import {
  loadDailyPatternReviewFromDisk,
  saveDailyPatternReviewToDisk,
} from "../src/server/dailyPatternReviewStore";
import {
  buildDailyPatternReviewDigest,
  dailyPatternReviewRecipient,
} from "../src/server/dailyPatternReviewEmail";
import { fetchMarketProphetsBrief, marketProphetsBriefUrl } from "../src/server/marketProphetsClient";
import {
  briefingReportId,
  easternDateKey,
  isBriefingDay,
  isSlotDue,
  slotLabel,
} from "../src/server/dailyPatternReviewSchedule";
import { SCANNER_ACCURACY_NOTE, TRAINING_PRICING_NOTE } from "../src/server/dailyPatternReviewCopy";
import { detectNestedStructures } from "../src/patterns/chartPatterns";
import { getRegistryAsset } from "../src/constants/assetRegistry";
import type { DetectedPattern } from "../src/patterns/types";
import type { Candle } from "../src/types/indicators";

const counts = universeCounts();
assert.equal(counts.forex, 25);
assert.equal(counts.commodities, 25);
assert.ok(counts.indices >= 5);
assert.ok(counts.futures >= 10);

const unmapped = DAILY_PATTERN_UNIVERSE.filter((t) => t.unavailableReason === "NO VENDOR MAP");
assert.ok(unmapped.length >= 19);

assert.ok(DAILY_PATTERN_UNIVERSE.some((t) => t.symbol === "DXY"));
assert.ok(DAILY_PATTERN_UNIVERSE.some((t) => t.symbol === "DJI"));
assert.ok(DAILY_PATTERN_UNIVERSE.some((t) => t.symbol === "WTI"));
assert.ok(DAILY_PATTERN_UNIVERSE.some((t) => t.symbol === "XAUUSD"));

for (const row of mappedUniverse()) {
  assert.ok(row.symbol);
  const asset = getRegistryAsset(row.symbol!);
  assert.ok(asset?.enabled, `${row.symbol} must be enabled`);
}

assert.match(SCANNER_ACCURACY_NOTE, /mathematically sound/i);
assert.match(TRAINING_PRICING_NOTE, /\$5\.99/);

const mondayClose = new Date("2026-09-07T20:00:00-04:00");
assert.equal(isBriefingDay(mondayClose), true);
assert.equal(isBriefingDay(new Date("2026-09-05T12:00:00-04:00")), false);
assert.equal(isSlotDue("market_close", new Date("2026-09-08T16:00:00-04:00")), true);
assert.equal(isSlotDue("overnight", new Date("2026-09-08T01:00:00-04:00")), true);
assert.match(slotLabel("market_close"), /close/i);

const values = [
  { datetime: "2026-09-07", open: "1.10", high: "1.12", low: "1.09", close: "1.11" },
  { datetime: "2026-09-08", open: "1.11", high: "1.13", low: "1.10", close: "1.12" },
];
const fromTd = twelveValuesToCandles(values);
const nowEt = Date.parse("2026-09-09T20:00:00-04:00");
const withToday: Candle[] = [
  ...fromTd,
  { time: Date.parse("2026-09-09T08:00:00-04:00"), open: 1.12, high: 1.14, low: 1.11, close: 1.13 },
];
assert.equal(previousCompletedDaily(withToday, nowEt).length, 2);

const weeklyBars: Candle[] = [];
for (let i = 0; i < 8; i++) {
  weeklyBars.push({
    time: Date.parse("2026-06-01T00:00:00.000Z") + i * 7 * 86_400_000,
    open: 100 + i,
    high: 105 + i,
    low: 99 + i,
    close: 103 + i,
  });
}
assert.equal(previousCompletedWeekly(weeklyBars, weeklyBars[weeklyBars.length - 1].time + 86_400_000).length, 7);

function wedgeCandles(n: number, t0: number): Candle[] {
  const out: Candle[] = [];
  for (let i = 0; i < n; i++) {
    const floor = 100 + i * 0.35;
    const ceil = floor + 4 - i * 0.06;
    out.push({ time: t0 + i * 86_400_000, open: floor + 1, high: ceil, low: floor, close: floor + 2.5 });
  }
  return out;
}

const wedgeDaily = wedgeCandles(40, Date.parse("2026-06-01T00:00:00.000Z"));
const wedgeWeekly = wedgeCandles(30, Date.parse("2026-01-01T00:00:00.000Z"));

const eurusdTarget = DAILY_PATTERN_UNIVERSE.find((t) => t.symbol === "EURUSD");
assert.ok(eurusdTarget);
const scanned = scanSymbolFromCandles(eurusdTarget, { daily: wedgeDaily, weekly: wedgeWeekly });
assert.equal(scanned.status, "ok");
assert.match(scanned.summary, /weekly /);
assert.match(scanned.snapshotSvg, /<svg /);

const mockMpFetcher = async () => ({
  editionDate: "2026-09-09",
  headline: "Fixture headline",
  summary: "Fixture summary.",
  bullets: ["Bullet one"],
  url: marketProphetsBriefUrl("2026-09-09"),
  source: "live" as const,
});

const report = await runDailyPatternSweep({
  force: true,
  slot: "market_close",
  skipEmail: true,
  fetchCandles: async () => ({ daily: wedgeDaily, weekly: wedgeWeekly }),
  fetchNews: async () => ({
    items: [{ title: "Fed holds rates (fixture)", source: "Federal Reserve Press" }],
    sourcesTried: ["Federal Reserve Press"],
    sourcesOk: ["Federal Reserve Press"],
  }),
  fetchMarketProphets: mockMpFetcher,
});

assert.equal(report.rows.length, DAILY_PATTERN_UNIVERSE.length);
assert.equal(report.slot, "market_close");
assert.equal(report.publishStatus, "draft");
assert.match(report.reportId, /_market_close$/);
assert.match(report.scannerNote, /mathematically sound/i);
assert.match(report.trainingPricingNote, /\$5\.99/);
assert.ok(report.scanned >= 25);
assert.ok(report.unavailable >= 19);

saveDailyPatternReviewToDisk(report);
assert.equal(loadDailyPatternReviewFromDisk(report.reportId)?.reportId, report.reportId);

const digest = buildDailyPatternReviewDigest(report);
assert.match(digest.subject, /daily briefing/i);
assert.match(digest.text, /Fixture headline/);
assert.ok(dailyPatternReviewRecipient().includes("@"));

const id = briefingReportId(easternDateKey(), "overnight");
assert.match(id, /_overnight$/);

const desk = fs.readFileSync(path.join(process.cwd(), "src/components/DailyPatternReviewDesk.tsx"), "utf8");
assert.match(desk, /Approve & publish/);
assert.match(desk, /Weekly pattern/);
assert.match(desk, /\$5\.99|trainingPricingNote|mathematically sound/i);

console.log(
  `PASS: briefing forex=${counts.forex} commodities=${counts.commodities} indices=${counts.indices} futures=${counts.futures} total=${report.rows.length}`,
);
