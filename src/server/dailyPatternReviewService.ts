/**
 * Overnight structure review — dual daily + weekly scans, ET schedule, CEO publish gate.
 */

import { getFmpApiKey, getTwelveDataApiKey } from "./secrets";
import { getMarketCandles, getCleanApiKey } from "./marketDataGateway";
import { scanAllPatterns } from "../patterns/scan";
import { sanitizeCandles } from "../patterns/sanitize";
import type { Candle } from "../types/indicators";
import type { DetectedPattern } from "../patterns/types";
import {
  DAILY_PATTERN_UNIVERSE,
  type PatternReviewTarget,
} from "./dailyPatternUniverse";
import {
  classifyTimeframePatterns,
  summarizeClassification,
  summarizeMultiTimeframe,
} from "./dailyPatternClassify";
import { renderDailyPatternSnapshot, sessionDateFromCandles } from "./dailyPatternSnapshot";
import { fetchFreeFinanceNews } from "./freeFinanceNews";
import {
  persistDailyPatternReviewReport,
  resolveDailyPatternReviewReport,
  resolveLatestDailyPatternReviewReport,
} from "./dailyPatternReviewStore";
import { fetchMarketProphetsBrief } from "./marketProphetsClient";
import {
  marketProphetsUnavailableSummary,
  sendDailyPatternReviewDigest,
} from "./dailyPatternReviewEmail";
import {
  activeSlots,
  briefingReportId,
  easternDateKey,
  isBriefingDay,
  nextDueHintText,
  slotLabel,
  type BriefingSlot,
} from "./dailyPatternReviewSchedule";
import {
  defaultBriefingDisclaimer,
  defaultScannerNote,
  defaultTrainingPricingNote,
} from "./dailyPatternReviewTypes";

export type {
  PatternHitSummary,
  SymbolReviewRow,
  DailyPatternReviewReport,
  PublishStatus,
} from "./dailyPatternReviewTypes";

import type {
  PatternHitSummary,
  SymbolReviewRow,
  DailyPatternReviewReport,
} from "./dailyPatternReviewTypes";

export type TimeframeCandles = { daily: Candle[]; weekly: Candle[] };
export type CandleFetcher = (symbol: string) => Promise<TimeframeCandles>;
export type NewsFetcher = () => Promise<DailyPatternReviewReport["news"]>;
export type MarketProphetsFetcher = () => Promise<DailyPatternReviewReport["marketProphets"]>;

let latest: DailyPatternReviewReport | null = null;
let schedulerTimer: ReturnType<typeof setInterval> | null = null;
let lastFiredReportId: string | null = null;
let running = false;

function easternDayFromMs(ms: number): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(ms));
}

/** Drop in-progress daily bar (US/Eastern calendar). */
export function previousCompletedDaily(candles: Candle[], now = Date.now()): Candle[] {
  const safe = sanitizeCandles(candles);
  if (safe.length === 0) return [];
  const last = safe[safe.length - 1];
  if (easternDayFromMs(last.time) === easternDateKey(new Date(now))) return safe.slice(0, -1);
  return safe;
}

/** Drop in-progress weekly bar when the last week is still open (<6 days old). */
export function previousCompletedWeekly(candles: Candle[], now = Date.now()): Candle[] {
  const safe = sanitizeCandles(candles);
  if (safe.length === 0) return [];
  const last = safe[safe.length - 1];
  if (now - last.time < 6 * 86_400_000) return safe.slice(0, -1);
  return safe;
}

function toHit(p: DetectedPattern): PatternHitSummary {
  return {
    id: p.id,
    label: p.label,
    direction: p.direction,
    scale: p.scale,
    category: p.category,
    confidence: p.confidence,
    startIndex: p.startIndex,
    endIndex: p.endIndex,
    detail: p.detail,
  };
}

export function twelveValuesToCandles(values: unknown): Candle[] {
  if (!Array.isArray(values)) return [];
  const out: Candle[] = [];
  for (const raw of values) {
    if (!raw || typeof raw !== "object") continue;
    const row = raw as Record<string, unknown>;
    const time = Date.parse(String(row.datetime ?? row.date ?? ""));
    const open = Number(row.open);
    const high = Number(row.high);
    const low = Number(row.low);
    const close = Number(row.close);
    const volume = row.volume == null || row.volume === "" ? undefined : Number(row.volume);
    if (!Number.isFinite(time) || !Number.isFinite(open) || !Number.isFinite(high) || !Number.isFinite(low) || !Number.isFinite(close)) {
      continue;
    }
    out.push({
      time,
      open,
      high,
      low,
      close,
      volume: Number.isFinite(volume) ? volume : undefined,
    });
  }
  return sanitizeCandles(out);
}

async function defaultFetchCandles(symbol: string): Promise<TimeframeCandles> {
  const apiKey = getCleanApiKey();
  const [dailyData, weeklyData] = await Promise.all([
    getMarketCandles(symbol, "1day", 80, apiKey),
    getMarketCandles(symbol, "1week", 52, apiKey),
  ]);
  if (!dailyData || dailyData.status === "error" || !Array.isArray(dailyData.values)) {
    throw new Error(dailyData?.message || "No daily values");
  }
  const daily = previousCompletedDaily(twelveValuesToCandles(dailyData.values));
  let weekly: Candle[] = [];
  if (weeklyData && weeklyData.status !== "error" && Array.isArray(weeklyData.values)) {
    weekly = previousCompletedWeekly(twelveValuesToCandles(weeklyData.values));
  }
  return { daily, weekly };
}

async function mapPool<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let cursor = 0;
  async function worker() {
    while (cursor < items.length) {
      const idx = cursor++;
      out[idx] = await fn(items[idx]);
    }
  }
  const n = Math.max(1, Math.min(limit, items.length));
  await Promise.all(Array.from({ length: n }, () => worker()));
  return out;
}

function rowHasLabel(row: SymbolReviewRow): boolean {
  return Boolean(row.dailyPattern || row.weeklyPattern);
}

function withUnreadCounts(report: DailyPatternReviewReport): DailyPatternReviewReport {
  const unreadCount = report.rows.filter((r) => r.status === "ok" && !r.reviewed && rowHasLabel(r)).length;
  return {
    ...report,
    unreadCount,
    unreadAlert: unreadCount > 0,
  };
}

function unavailableRow(target: PatternReviewTarget, prior?: SymbolReviewRow, reason?: string): SymbolReviewRow {
  return {
    id: target.id,
    bucket: target.bucket,
    symbol: target.symbol,
    display: target.display,
    description: target.description,
    proxyNote: target.proxyNote,
    status: "unavailable",
    unavailableReason: reason || target.unavailableReason || "NO VENDOR MAP",
    sessionDate: null,
    weeklySessionDate: null,
    dailyPattern: null,
    weeklyPattern: null,
    subPatterns: [],
    independentPatterns: [],
    weeklySubPatterns: [],
    weeklyIndependentPatterns: [],
    weeklySummary: "DATA UNAVAILABLE",
    summary: "DATA UNAVAILABLE",
    snapshotSvg: renderDailyPatternSnapshot([], [], {
      symbol: target.display,
      sessionDate: null,
      title: target.display,
    }),
    weeklySnapshotSvg: renderDailyPatternSnapshot([], [], {
      symbol: target.display,
      sessionDate: null,
      title: `${target.display} · weekly`,
    }),
    reviewed: prior?.reviewed ?? false,
    reviewNote: prior?.reviewNote,
    reviewedAt: prior?.reviewedAt,
  };
}

export function scanSymbolFromCandles(
  target: PatternReviewTarget,
  candles: TimeframeCandles,
  prior?: SymbolReviewRow,
): SymbolReviewRow {
  if (!target.symbol || target.unavailableReason) {
    return unavailableRow(target, prior);
  }

  const { daily, weekly } = candles;
  if (daily.length < 25) {
    return {
      ...unavailableRow(
        target,
        prior,
        daily.length === 0 ? "DATA UNAVAILABLE" : "Not enough completed daily bars",
      ),
      sessionDate: sessionDateFromCandles(daily),
      weeklySessionDate: sessionDateFromCandles(weekly),
      lastClose: daily.length ? daily[daily.length - 1].close : undefined,
      snapshotSvg: renderDailyPatternSnapshot(daily, [], {
        symbol: target.symbol,
        sessionDate: sessionDateFromCandles(daily),
        title: target.display,
      }),
      weeklySnapshotSvg: renderDailyPatternSnapshot(weekly, [], {
        symbol: target.symbol,
        sessionDate: sessionDateFromCandles(weekly),
        title: `${target.display} · weekly`,
      }),
    };
  }

  const dailyScan = scanAllPatterns(daily);
  const dailyClass = classifyTimeframePatterns(dailyScan.patterns);
  const weeklyClass =
    weekly.length >= 12 ? classifyTimeframePatterns(scanAllPatterns(weekly).patterns) : null;

  const snapshotPatterns = [
    dailyClass.dailyPattern,
    ...dailyClass.subPatterns,
    ...dailyClass.independentPatterns.filter((p) => p.category === "chart"),
  ].filter((p): p is DetectedPattern => Boolean(p));

  const weeklySnapshotPatterns = weeklyClass
    ? [
        weeklyClass.dailyPattern,
        ...weeklyClass.subPatterns,
        ...weeklyClass.independentPatterns.filter((p) => p.category === "chart"),
      ].filter((p): p is DetectedPattern => Boolean(p))
    : [];

  return {
    id: target.id,
    bucket: target.bucket,
    symbol: target.symbol,
    display: target.display,
    description: target.description,
    proxyNote: target.proxyNote,
    status: "ok",
    sessionDate: sessionDateFromCandles(daily),
    weeklySessionDate: sessionDateFromCandles(weekly),
    lastClose: daily[daily.length - 1].close,
    weeklyPattern: weeklyClass?.dailyPattern ? toHit(weeklyClass.dailyPattern) : null,
    weeklySubPatterns: weeklyClass?.subPatterns.map(toHit) ?? [],
    weeklyIndependentPatterns: weeklyClass?.independentPatterns.map(toHit) ?? [],
    weeklySummary: weeklyClass ? summarizeClassification(weeklyClass) : "weekly DATA UNAVAILABLE",
    dailyPattern: dailyClass.dailyPattern ? toHit(dailyClass.dailyPattern) : null,
    subPatterns: dailyClass.subPatterns.map(toHit),
    independentPatterns: dailyClass.independentPatterns.map(toHit),
    summary: weeklyClass
      ? summarizeMultiTimeframe(weeklyClass, dailyClass)
      : summarizeClassification(dailyClass),
    snapshotSvg: renderDailyPatternSnapshot(daily, snapshotPatterns, {
      symbol: target.symbol,
      sessionDate: sessionDateFromCandles(daily),
      title: `${target.display} · daily`,
    }),
    weeklySnapshotSvg: renderDailyPatternSnapshot(weekly, weeklySnapshotPatterns, {
      symbol: target.symbol,
      sessionDate: sessionDateFromCandles(weekly),
      title: `${target.display} · weekly`,
    }),
    reviewed: prior?.reviewed ?? false,
    reviewNote: prior?.reviewNote,
    reviewedAt: prior?.reviewedAt,
  };
}

export async function getLatestDailyPatternReview(): Promise<DailyPatternReviewReport | null> {
  if (latest) return latest;
  latest = await resolveLatestDailyPatternReviewReport();
  return latest;
}

export async function hydrateDailyPatternReviewFromStore(): Promise<DailyPatternReviewReport | null> {
  latest = await getLatestDailyPatternReview();
  return latest;
}

export async function runDailyPatternSweep(options?: {
  slot?: BriefingSlot;
  force?: boolean;
  fetchCandles?: CandleFetcher;
  fetchNews?: NewsFetcher;
  fetchMarketProphets?: MarketProphetsFetcher;
  skipEmail?: boolean;
}): Promise<DailyPatternReviewReport> {
  const force = Boolean(options?.force);
  const slot: BriefingSlot = options?.slot ?? "market_close";
  const date = easternDateKey();
  const reportId = briefingReportId(date, slot);
  const existing = await resolveDailyPatternReviewReport(reportId);
  if (!force && existing?.rows?.length) {
    latest = existing;
    return existing;
  }
  if (running && existing) return existing;
  running = true;
  try {
    const fetchCandles = options?.fetchCandles ?? defaultFetchCandles;
    const hasVendor = Boolean(getTwelveDataApiKey() || getFmpApiKey()) || Boolean(options?.fetchCandles);

    const rows = await mapPool(DAILY_PATTERN_UNIVERSE, 3, async (target) => {
      const prior = existing?.rows.find((r) => r.id === target.id);
      if (!target.symbol || target.unavailableReason) {
        return scanSymbolFromCandles(target, { daily: [], weekly: [] }, prior);
      }
      if (!hasVendor && !options?.fetchCandles) {
        return scanSymbolFromCandles(target, { daily: [], weekly: [] }, prior);
      }
      try {
        const candles = await fetchCandles(target.symbol);
        return scanSymbolFromCandles(target, candles, prior);
      } catch (err) {
        return unavailableRow(
          target,
          prior,
          err instanceof Error ? err.message : "DATA UNAVAILABLE",
        );
      }
    });

    let news: DailyPatternReviewReport["news"] = {
      items: [],
      sourcesTried: [],
      sourcesOk: [],
    };
    try {
      news = options?.fetchNews ? await options.fetchNews() : await fetchFreeFinanceNews();
    } catch (err) {
      console.info("[DailyPatternReview] news sweep failed:", err instanceof Error ? err.message : err);
    }

    let marketProphets: DailyPatternReviewReport["marketProphets"] = null;
    try {
      marketProphets = options?.fetchMarketProphets
        ? await options.fetchMarketProphets()
        : await fetchMarketProphetsBrief();
    } catch {
      marketProphets = null;
    }
    if (!marketProphets) marketProphets = marketProphetsUnavailableSummary();

    const labeled = rows.filter((r) => rowHasLabel(r)).length;
    const unavailable = rows.filter((r) => r.status === "unavailable").length;

    const report: DailyPatternReviewReport = {
      reportId,
      date,
      slot,
      ranAt: new Date().toISOString(),
      timezone: "America/New_York",
      publishStatus: "draft",
      publishedAt: force ? undefined : existing?.publishedAt,
      unreadAlert: false,
      unreadCount: 0,
      scanned: rows.filter((r) => r.status === "ok").length,
      labeled,
      unavailable,
      disclaimer: defaultBriefingDisclaimer(),
      scannerNote: defaultScannerNote(),
      trainingPricingNote: defaultTrainingPricingNote(),
      nextDueHint: nextDueHintText(),
      news,
      marketProphets,
      digestEmailSentAt: force ? undefined : existing?.digestEmailSentAt,
      digestEmailTo: force ? undefined : existing?.digestEmailTo,
      rows,
    };

    const saved = await persistDailyPatternReviewReport(withUnreadCounts(report));
    latest = saved;
    console.log(
      `[DailyPatternReview] ${reportId} (${slotLabel(slot)}) scanned=${saved.scanned} labeled=${saved.labeled} unavailable=${saved.unavailable} storage=${saved.storage || "disk"}`,
    );
    return saved;
  } finally {
    running = false;
  }
}

export async function publishDailyPatternReview(reportId?: string): Promise<DailyPatternReviewReport> {
  const report =
    (reportId ? await resolveDailyPatternReviewReport(reportId) : null) || latest || (await getLatestDailyPatternReview());
  if (!report) throw new Error("No briefing to publish — run a sweep first.");
  if (report.publishStatus === "published" && report.digestEmailSentAt) return report;

  const mail = await sendDailyPatternReviewDigest(report);
  const next: DailyPatternReviewReport = {
    ...report,
    publishStatus: "published",
    publishedAt: new Date().toISOString(),
    digestEmailSentAt: mail.sent ? new Date().toISOString() : report.digestEmailSentAt,
    digestEmailTo: mail.to ?? report.digestEmailTo,
  };
  latest = await persistDailyPatternReviewReport(next);
  if (!mail.sent) {
    console.info("[DailyPatternReview] Publish saved; digest not sent:", mail.reason);
  }
  return latest;
}

export async function markDailyPatternReviewed(
  rowId: string,
  reviewed: boolean,
  note?: string,
  reportId?: string,
): Promise<DailyPatternReviewReport> {
  const report =
    (reportId ? await resolveDailyPatternReviewReport(reportId) : null) || latest || (await getLatestDailyPatternReview());
  if (!report) throw new Error("No daily pattern review yet — run the sweep first.");
  const idx = report.rows.findIndex((r) => r.id === rowId);
  if (idx < 0) throw new Error("Unknown review row.");
  const nextRows = report.rows.slice();
  nextRows[idx] = {
    ...nextRows[idx],
    reviewed,
    reviewNote: note?.slice(0, 2000),
    reviewedAt: new Date().toISOString(),
  };
  latest = await persistDailyPatternReviewReport(withUnreadCounts({ ...report, rows: nextRows }));
  return latest;
}

async function schedulerTick() {
  if (!isBriefingDay()) return;
  for (const slot of activeSlots()) {
    const reportId = briefingReportId(easternDateKey(), slot);
    if (lastFiredReportId === reportId) continue;
    const existing = await resolveDailyPatternReviewReport(reportId);
    if (existing) {
      lastFiredReportId = reportId;
      continue;
    }
    lastFiredReportId = reportId;
    void runDailyPatternSweep({ slot });
  }
}

export function startDailyPatternReviewScheduler() {
  if (schedulerTimer) return;
  const enabled = (process.env.DAILY_PATTERN_REVIEW_ENABLED || "1").toLowerCase();
  if (enabled === "0" || enabled === "false" || enabled === "off") {
    console.log("[DailyPatternReview] Disabled (DAILY_PATTERN_REVIEW_ENABLED=0)");
    return;
  }
  console.log(
    "[DailyPatternReview] Scheduler armed — Sun–Fri · NYSE close + 1 AM ET · weekly+daily · CEO publish gate",
  );
  void hydrateDailyPatternReviewFromStore();
  void schedulerTick();
  schedulerTimer = setInterval(() => {
    void schedulerTick();
  }, 60_000);
}

export function stopDailyPatternReviewScheduler() {
  if (schedulerTimer) {
    clearInterval(schedulerTimer);
    schedulerTimer = null;
  }
}
