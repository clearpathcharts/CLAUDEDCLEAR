/**
 * Overnight daily-structure review for the founder CEO inbox.
 *
 * Fetches completed daily OHLC for the curated universe, runs the existing
 * educational pattern engine, stores SVG snapshots + free RSS headlines,
 * and raises an unread alert until the founder marks rows reviewed.
 *
 * Not a trade signal. Live overlays stay on MARKETS/CHARTS.
 */

import fs from "node:fs";
import path from "node:path";
import { getFmpApiKey, getTwelveDataApiKey } from "./secrets";
import { getMarketCandles, getCleanApiKey } from "./marketDataGateway";
import { scanAllPatterns } from "../patterns/scan";
import { sanitizeCandles } from "../patterns/sanitize";
import type { Candle } from "../types/indicators";
import type { DetectedPattern } from "../patterns/types";
import { pacificDateKey } from "./dailyOpsCatalog";
import {
  DAILY_PATTERN_UNIVERSE,
  type PatternReviewBucket,
  type PatternReviewTarget,
} from "./dailyPatternUniverse";
import { classifyDailyPatterns, summarizeClassification } from "./dailyPatternClassify";
import { renderDailyPatternSnapshot, sessionDateFromCandles } from "./dailyPatternSnapshot";
import { fetchFreeFinanceNews, type FreeNewsItem } from "./freeFinanceNews";

export type PatternHitSummary = {
  id: string;
  label: string;
  direction: DetectedPattern["direction"];
  scale?: DetectedPattern["scale"];
  category: DetectedPattern["category"];
  confidence: number;
  startIndex: number;
  endIndex: number;
  detail?: string;
};

export type SymbolReviewRow = {
  id: string;
  bucket: PatternReviewBucket;
  symbol: string | null;
  display: string;
  description: string;
  proxyNote?: string;
  status: "ok" | "unavailable";
  unavailableReason?: string;
  sessionDate: string | null;
  lastClose?: number;
  dailyPattern: PatternHitSummary | null;
  subPatterns: PatternHitSummary[];
  independentPatterns: PatternHitSummary[];
  summary: string;
  snapshotSvg: string;
  reviewed: boolean;
  reviewNote?: string;
  reviewedAt?: string;
};

export type DailyPatternReviewReport = {
  date: string;
  ranAt: string;
  timezone: "America/Los_Angeles";
  unreadAlert: boolean;
  unreadCount: number;
  scanned: number;
  labeled: number;
  unavailable: number;
  disclaimer: string;
  nextDueHint: string;
  news: {
    items: FreeNewsItem[];
    sourcesTried: string[];
    sourcesOk: string[];
  };
  rows: SymbolReviewRow[];
};

export type CandleFetcher = (symbol: string) => Promise<Candle[]>;
export type NewsFetcher = () => Promise<DailyPatternReviewReport["news"]>;

const DIR = path.join(process.cwd(), "data", "daily-pattern-review");
const DISCLAIMER =
  "Educational geometry on completed daily bars. Possible / forming — never a confirmed signal. Full overlays stay on MARKETS/CHARTS.";

let latest: DailyPatternReviewReport | null = null;
let timer: ReturnType<typeof setInterval> | null = null;
let running = false;

function ensureDir() {
  if (!fs.existsSync(DIR)) fs.mkdirSync(DIR, { recursive: true });
}

function fileFor(date: string) {
  return path.join(DIR, `${date}.json`);
}

function loadFromDisk(date: string): DailyPatternReviewReport | null {
  try {
    const p = fileFor(date);
    if (!fs.existsSync(p)) return null;
    return JSON.parse(fs.readFileSync(p, "utf8")) as DailyPatternReviewReport;
  } catch {
    return null;
  }
}

function persist(report: DailyPatternReviewReport): DailyPatternReviewReport {
  ensureDir();
  const unreadCount = report.rows.filter((r) => r.status === "ok" && !r.reviewed && r.dailyPattern).length;
  const next: DailyPatternReviewReport = {
    ...report,
    unreadCount,
    unreadAlert: unreadCount > 0,
  };
  fs.writeFileSync(fileFor(next.date), JSON.stringify(next, null, 2), "utf8");
  fs.writeFileSync(path.join(DIR, "latest.json"), JSON.stringify(next, null, 2), "utf8");
  latest = next;
  return next;
}

export function getLatestDailyPatternReview(): DailyPatternReviewReport | null {
  const today = pacificDateKey();
  const disk = loadFromDisk(today);
  if (disk) {
    latest = disk;
    return latest;
  }
  return latest;
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

/** Drop the in-progress daily bar so we scan previous completed sessions. */
export function previousCompletedDaily(candles: Candle[], now = Date.now()): Candle[] {
  const safe = sanitizeCandles(candles);
  if (safe.length === 0) return [];
  const last = safe[safe.length - 1];
  const lastDay = new Date(last.time).toISOString().slice(0, 10);
  const today = new Date(now).toISOString().slice(0, 10);
  if (lastDay === today) return safe.slice(0, -1);
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

async function defaultFetchCandles(symbol: string): Promise<Candle[]> {
  const apiKey = getCleanApiKey();
  const data = await getMarketCandles(symbol, "1day", 80, apiKey);
  if (!data || data.status === "error" || !Array.isArray(data.values)) {
    throw new Error(data?.message || "No daily values");
  }
  return previousCompletedDaily(twelveValuesToCandles(data.values));
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

export function scanSymbolFromCandles(
  target: PatternReviewTarget,
  candles: Candle[],
  prior?: SymbolReviewRow,
): SymbolReviewRow {
  if (!target.symbol || target.unavailableReason) {
    return {
      id: target.id,
      bucket: target.bucket,
      symbol: target.symbol,
      display: target.display,
      description: target.description,
      proxyNote: target.proxyNote,
      status: "unavailable",
      unavailableReason: target.unavailableReason || "NO VENDOR MAP",
      sessionDate: null,
      dailyPattern: null,
      subPatterns: [],
      independentPatterns: [],
      summary: "DATA UNAVAILABLE",
      snapshotSvg: renderDailyPatternSnapshot([], [], {
        symbol: target.display,
        sessionDate: null,
        title: target.display,
      }),
      reviewed: prior?.reviewed ?? false,
      reviewNote: prior?.reviewNote,
      reviewedAt: prior?.reviewedAt,
    };
  }

  if (candles.length < 25) {
    return {
      id: target.id,
      bucket: target.bucket,
      symbol: target.symbol,
      display: target.display,
      description: target.description,
      proxyNote: target.proxyNote,
      status: "unavailable",
      unavailableReason: candles.length === 0 ? "DATA UNAVAILABLE" : "Not enough completed daily bars",
      sessionDate: sessionDateFromCandles(candles),
      lastClose: candles.length ? candles[candles.length - 1].close : undefined,
      dailyPattern: null,
      subPatterns: [],
      independentPatterns: [],
      summary: "DATA UNAVAILABLE",
      snapshotSvg: renderDailyPatternSnapshot(candles, [], {
        symbol: target.symbol,
        sessionDate: sessionDateFromCandles(candles),
        title: target.display,
      }),
      reviewed: prior?.reviewed ?? false,
      reviewNote: prior?.reviewNote,
      reviewedAt: prior?.reviewedAt,
    };
  }

  const scan = scanAllPatterns(candles);
  const classified = classifyDailyPatterns(scan.patterns);
  const snapshotPatterns = [
    classified.dailyPattern,
    ...classified.subPatterns,
    ...classified.independentPatterns.filter((p) => p.category === "chart"),
  ].filter((p): p is DetectedPattern => Boolean(p));

  return {
    id: target.id,
    bucket: target.bucket,
    symbol: target.symbol,
    display: target.display,
    description: target.description,
    proxyNote: target.proxyNote,
    status: "ok",
    sessionDate: sessionDateFromCandles(candles),
    lastClose: candles[candles.length - 1].close,
    dailyPattern: classified.dailyPattern ? toHit(classified.dailyPattern) : null,
    subPatterns: classified.subPatterns.map(toHit),
    independentPatterns: classified.independentPatterns.map(toHit),
    summary: summarizeClassification(classified),
    snapshotSvg: renderDailyPatternSnapshot(candles, snapshotPatterns, {
      symbol: target.symbol,
      sessionDate: sessionDateFromCandles(candles),
      title: target.display,
    }),
    reviewed: prior?.reviewed ?? false,
    reviewNote: prior?.reviewNote,
    reviewedAt: prior?.reviewedAt,
  };
}

export async function runDailyPatternSweep(options?: {
  force?: boolean;
  fetchCandles?: CandleFetcher;
  fetchNews?: NewsFetcher;
}): Promise<DailyPatternReviewReport> {
  const force = Boolean(options?.force);
  const date = pacificDateKey();
  const existing = loadFromDisk(date);
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
        return scanSymbolFromCandles(target, [], prior);
      }
      if (!hasVendor && !options?.fetchCandles) {
        return scanSymbolFromCandles(target, [], prior);
      }
      try {
        const candles = await fetchCandles(target.symbol);
        return scanSymbolFromCandles(target, candles, prior);
      } catch (err) {
        return {
          id: target.id,
          bucket: target.bucket,
          symbol: target.symbol,
          display: target.display,
          description: target.description,
          proxyNote: target.proxyNote,
          status: "unavailable" as const,
          unavailableReason: err instanceof Error ? err.message : "DATA UNAVAILABLE",
          sessionDate: null,
          dailyPattern: null,
          subPatterns: [],
          independentPatterns: [],
          summary: "DATA UNAVAILABLE",
          snapshotSvg: renderDailyPatternSnapshot([], [], {
            symbol: target.display,
            sessionDate: null,
            title: target.display,
          }),
          reviewed: prior?.reviewed ?? false,
          reviewNote: prior?.reviewNote,
          reviewedAt: prior?.reviewedAt,
        };
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
      news = {
        items: [],
        sourcesTried: [],
        sourcesOk: [],
      };
      console.info(
        "[DailyPatternReview] news sweep failed:",
        err instanceof Error ? err.message : err,
      );
    }

    const labeled = rows.filter((r) => r.dailyPattern).length;
    const unavailable = rows.filter((r) => r.status === "unavailable").length;
    const report: DailyPatternReviewReport = {
      date,
      ranAt: new Date().toISOString(),
      timezone: "America/Los_Angeles",
      unreadAlert: false,
      unreadCount: 0,
      scanned: rows.filter((r) => r.status === "ok").length,
      labeled,
      unavailable,
      disclaimer: DISCLAIMER,
      nextDueHint: "Automatic sweep once per Pacific day (re-runs after midnight LA, or Run now)",
      news,
      rows,
    };
    const saved = persist(report);
    console.log(
      `[DailyPatternReview] ${date} scanned=${saved.scanned} labeled=${saved.labeled} unavailable=${saved.unavailable} news=${news.sourcesOk.length}`,
    );
    return saved;
  } finally {
    running = false;
  }
}

export function markDailyPatternReviewed(
  rowId: string,
  reviewed: boolean,
  note?: string,
): DailyPatternReviewReport {
  const date = pacificDateKey();
  const report = loadFromDisk(date) || latest;
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
  return persist({ ...report, rows: nextRows });
}

export function startDailyPatternReviewScheduler() {
  if (timer) return;
  const enabled = (process.env.DAILY_PATTERN_REVIEW_ENABLED || "1").toLowerCase();
  if (enabled === "0" || enabled === "false" || enabled === "off") {
    console.log("[DailyPatternReview] Disabled (DAILY_PATTERN_REVIEW_ENABLED=0)");
    return;
  }
  console.log("[DailyPatternReview] Scheduler armed — Pacific daily");
  setTimeout(() => {
    void runDailyPatternSweep();
  }, 90_000);
  timer = setInterval(() => {
    const today = pacificDateKey();
    const have = loadFromDisk(today);
    if (!have) void runDailyPatternSweep();
  }, 60 * 60 * 1000);
}

export function stopDailyPatternReviewScheduler() {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
}
