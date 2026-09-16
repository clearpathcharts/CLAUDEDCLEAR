/**
 * Daily swap-hour market-data accuracy verifier.
 *
 * Runs once per day between 02:00–02:59 (configurable) and checks that every
 * UI timeframe produces distinct, structurally valid candles via Twelve Data
 * (native intervals + client aggregation plans).
 *
 * FX "swap / rollover" is often quoted as ~17:00 New York by brokers; this
 * site uses the 2–3 o'clock window the operator requested. Override with:
 *   TIMEFRAME_VERIFY_HOUR=2
 *   TIMEFRAME_VERIFY_TZ=America/New_York
 *   TIMEFRAME_VERIFY_ENABLED=1|0
 */

import fs from "node:fs";
import path from "node:path";
import {
  aggregateCandles,
  resolveTimeframePlan,
  type NormalizedCandle,
} from "../services/marketData";
import { getMarketCandles } from "./marketDataGateway";
import { getTwelveDataApiKey } from "./secrets";
import { getDeckCriticalAssets } from "../constants/assetRegistry";

export const UI_TIMEFRAMES = [
  "1m",
  "2m",
  "3m",
  "5m",
  "10m",
  "15m",
  "30m",
  "1h",
  "2h",
  "3h",
  "4h",
  "1d",
  "1w",
  "1M",
  "3M",
  "6M",
  "ytd",
] as const;

export type UiTimeframe = (typeof UI_TIMEFRAMES)[number];

/** Expected bar spacing (seconds) after aggregation. null = calendar-variable (1M). */
const EXPECTED_STEP_SEC: Record<string, number | null> = {
  "1m": 60,
  "2m": 120,
  "3m": 180,
  "5m": 300,
  "10m": 600,
  "15m": 900,
  "30m": 1800,
  "1h": 3600,
  "2h": 7200,
  "3h": 10800,
  "4h": 14400,
  "1d": 86_400,
  "1w": 604_800,
  "1M": null,
  "3M": 86_400,
  "6M": 86_400,
  ytd: 86_400,
};

export type TimeframeCheckRow = {
  symbol: string;
  ui: string;
  fetchInterval: string;
  aggregateBars: number;
  mode: string;
  ok: boolean;
  errors: string[];
  candleCount: number;
  stepSec: number | null;
  expectedStepSec: number | null;
};

export type TimeframeVerifyReport = {
  ranAt: string;
  window: { hour: number; tz: string; label: string };
  symbols: string[];
  timeframes: string[];
  planCollisions: string[];
  rows: TimeframeCheckRow[];
  summary: {
    total: number;
    passed: number;
    failed: number;
    ok: boolean;
  };
};

let latestReport: TimeframeVerifyReport | null = null;
let lastRunDayKey = "";
let timer: ReturnType<typeof setInterval> | null = null;

const REPORT_DIR = path.join(process.cwd(), "data", "timeframe-verify");

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function verifyHour(): number {
  const n = Number(process.env.TIMEFRAME_VERIFY_HOUR ?? "2");
  return Number.isFinite(n) ? Math.min(23, Math.max(0, Math.floor(n))) : 2;
}

function verifyTz(): string {
  return (process.env.TIMEFRAME_VERIFY_TZ || "America/New_York").trim();
}

function isVerifyEnabled(): boolean {
  const v = (process.env.TIMEFRAME_VERIFY_ENABLED || "1").toLowerCase();
  return v !== "0" && v !== "false" && v !== "off";
}

/** Local hour + YYYY-MM-DD in the configured timezone. */
function zonedNowParts(tz: string): { hour: number; dayKey: string } {
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    hour12: false,
  });
  const parts = Object.fromEntries(
    fmt.formatToParts(new Date()).map((p) => [p.type, p.value])
  );
  let hour = Number(parts.hour);
  // Some engines emit "24" for midnight
  if (hour === 24) hour = 0;
  return {
    hour,
    dayKey: `${parts.year}-${parts.month}-${parts.day}`,
  };
}

function resolveSymbols(): string[] {
  const raw = (process.env.TIMEFRAME_VERIFY_SYMBOLS || "").trim();
  if (raw) {
    return raw
      .split(",")
      .map((s) => s.trim().toUpperCase())
      .filter(Boolean);
  }
  const critical = new Set(getDeckCriticalAssets().map((a) => a.symbol));
  // Keep credit burn bounded: majors + metal/crypto/equity/index when present
  const prefer = [
    "EURUSD",
    "GBPUSD",
    "USDJPY",
    "XAUUSD",
    "BTCUSD",
    "AAPL",
    "SPX",
    "DXY",
  ];
  const fromCritical = prefer.filter((s) => critical.has(s));
  const list = (fromCritical.length ? fromCritical : prefer).slice(0, 8);
  return list.length ? list : ["EURUSD"];
}

function checkPlanUniqueness(): string[] {
  const sig = new Map<string, string[]>();
  for (const ui of UI_TIMEFRAMES) {
    const p = resolveTimeframePlan(ui);
    const key = `${p.fetchInterval}|x${p.aggregateBars}|v${p.visibleBars ?? "full"}`;
    if (!sig.has(key)) sig.set(key, []);
    sig.get(key)!.push(ui);
  }
  const collisions: string[] = [];
  for (const [key, uis] of sig) {
    if (uis.length > 1) collisions.push(`${key} → ${uis.join(",")}`);
  }
  return collisions;
}

function validateOhlc(c: NormalizedCandle): string | null {
  if (!(c.high >= c.low)) return "high < low";
  if (!(c.high >= c.open && c.high >= c.close)) return "high below open/close";
  if (!(c.low <= c.open && c.low <= c.close)) return "low above open/close";
  if (
    !Number.isFinite(c.open) ||
    !Number.isFinite(c.high) ||
    !Number.isFinite(c.low) ||
    !Number.isFinite(c.close)
  ) {
    return "non-finite OHLC";
  }
  return null;
}

function stepOk(ui: string, stepSec: number | null): boolean {
  const expected = EXPECTED_STEP_SEC[ui];
  if (expected == null) {
    // Monthly bars vary 28–31 days
    if (stepSec == null) return false;
    return stepSec >= 27 * 86_400 && stepSec <= 32 * 86_400;
  }
  if (stepSec == null) return false;
  if (ui === "1w") {
    // Weekends / holidays can stretch a week bar slightly
    return stepSec >= 5 * 86_400 && stepSec <= 10 * 86_400;
  }
  if (ui === "1d" || ui === "3M" || ui === "6M" || ui === "ytd") {
    // Daily bars skip weekends — allow 1–4 calendar days between stamps
    return stepSec >= 86_400 && stepSec <= 4 * 86_400;
  }
  return stepSec === expected;
}

async function fetchPlannedCandles(
  symbol: string,
  ui: string,
  apiKey: string
): Promise<NormalizedCandle[]> {
  const plan = resolveTimeframePlan(ui);
  const desiredFinal = plan.visibleBars ?? 120;
  const fetchLimit = Math.min(
    5000,
    Math.max(plan.aggregateBars, desiredFinal * plan.aggregateBars)
  );
  const raw = await getMarketCandles(
    symbol,
    plan.fetchInterval,
    fetchLimit,
    apiKey
  );
  // Gateway returns Twelve Data shape: { values: [{ datetime, open, high, low, close }] }
  const values = Array.isArray(raw?.values) ? raw.values : [];
  if (!values.length) {
    throw new Error(raw?.message || "No candle values from gateway");
  }
  let candles: NormalizedCandle[] = values
    .map((v: any) => ({
      time: Math.floor(new Date(v.datetime).getTime() / 1000),
      open: Number(v.open),
      high: Number(v.high),
      low: Number(v.low),
      close: Number(v.close),
    }))
    .filter(
      (c) =>
        Number.isFinite(c.time) &&
        Number.isFinite(c.open) &&
        Number.isFinite(c.high) &&
        Number.isFinite(c.low) &&
        Number.isFinite(c.close)
    )
    .sort((a, b) => a.time - b.time);

  candles = aggregateCandles(candles, plan.aggregateBars);
  if (plan.visibleBars && candles.length > plan.visibleBars) {
    candles = candles.slice(candles.length - plan.visibleBars);
  }
  return candles;
}

function persistReport(report: TimeframeVerifyReport) {
  try {
    if (!fs.existsSync(REPORT_DIR)) {
      fs.mkdirSync(REPORT_DIR, { recursive: true });
    }
    const stamp = report.ranAt.replace(/[:.]/g, "-");
    fs.writeFileSync(
      path.join(REPORT_DIR, "latest.json"),
      JSON.stringify(report, null, 2),
      "utf8"
    );
    fs.writeFileSync(
      path.join(REPORT_DIR, `${stamp}.json`),
      JSON.stringify(report, null, 2),
      "utf8"
    );
  } catch (e: any) {
    console.warn(
      "[TimeframeVerify] Failed to persist report:",
      e?.message || e
    );
  }
}

export function getLatestTimeframeVerifyReport(): TimeframeVerifyReport | null {
  if (latestReport) return latestReport;
  try {
    const p = path.join(REPORT_DIR, "latest.json");
    if (fs.existsSync(p)) {
      latestReport = JSON.parse(fs.readFileSync(p, "utf8"));
      return latestReport;
    }
  } catch {
    /* ignore */
  }
  return null;
}

export async function runTimeframeAccuracyVerify(options?: {
  symbols?: string[];
  delayMs?: number;
  force?: boolean;
}): Promise<TimeframeVerifyReport> {
  const tz = verifyTz();
  const hour = verifyHour();
  const symbols = options?.symbols?.length
    ? options.symbols
    : resolveSymbols();
  const delayMs = options?.delayMs ?? 350;
  const apiKey = getTwelveDataApiKey();

  const planCollisions = checkPlanUniqueness();
  const rows: TimeframeCheckRow[] = [];

  if (!apiKey) {
    const report: TimeframeVerifyReport = {
      ranAt: new Date().toISOString(),
      window: {
        hour,
        tz,
        label: `${String(hour).padStart(2, "0")}:00–${String(hour).padStart(2, "0")}:59 ${tz} (swap-hour window)`,
      },
      symbols,
      timeframes: [...UI_TIMEFRAMES],
      planCollisions,
      rows: [],
      summary: {
        total: 0,
        passed: 0,
        failed: 1,
        ok: false,
      },
    };
    report.rows.push({
      symbol: "*",
      ui: "*",
      fetchInterval: "",
      aggregateBars: 0,
      mode: "native",
      ok: false,
      errors: ["TWELVEDATA_API_KEY missing"],
      candleCount: 0,
      stepSec: null,
      expectedStepSec: null,
    });
    latestReport = report;
    persistReport(report);
    return report;
  }

  for (const symbol of symbols) {
    for (const ui of UI_TIMEFRAMES) {
      const plan = resolveTimeframePlan(ui);
      const errors: string[] = [];
      let candleCount = 0;
      let stepSec: number | null = null;

      try {
        const candles = await fetchPlannedCandles(symbol, ui, apiKey);
        candleCount = candles.length;
        if (candleCount < 8) {
          errors.push(`too few candles (${candleCount})`);
        }
        for (let i = 0; i < candles.length; i++) {
          const ohlcErr = validateOhlc(candles[i]);
          if (ohlcErr) {
            errors.push(`ohlc@${i}: ${ohlcErr}`);
            break;
          }
          if (i > 0 && candles[i].time <= candles[i - 1].time) {
            errors.push(`non-increasing time at ${i}`);
            break;
          }
        }
        if (candleCount >= 2) {
          stepSec = candles[candleCount - 1].time - candles[candleCount - 2].time;
          if (!stepOk(ui, stepSec)) {
            errors.push(
              `step ${stepSec}s != expected ~${EXPECTED_STEP_SEC[ui] ?? "month"}`
            );
          }
        }
        if (plan.visibleBars && candleCount > plan.visibleBars) {
          errors.push(
            `visibleBars exceed plan (${candleCount} > ${plan.visibleBars})`
          );
        }
        if (
          plan.visibleBars &&
          candleCount > 0 &&
          candleCount < Math.min(20, plan.visibleBars)
        ) {
          // Soft: history may be short for new listings — warn only via error if < 8 already caught
        }
      } catch (e: any) {
        errors.push(e?.message || String(e));
      }

      rows.push({
        symbol,
        ui,
        fetchInterval: plan.fetchInterval,
        aggregateBars: plan.aggregateBars,
        mode: plan.mode,
        ok: errors.length === 0,
        errors,
        candleCount,
        stepSec,
        expectedStepSec: EXPECTED_STEP_SEC[ui] ?? null,
      });

      await sleep(delayMs);
    }
  }

  if (planCollisions.length) {
    rows.push({
      symbol: "*",
      ui: "plan",
      fetchInterval: "",
      aggregateBars: 0,
      mode: "native",
      ok: false,
      errors: planCollisions.map((c) => `plan collision: ${c}`),
      candleCount: 0,
      stepSec: null,
      expectedStepSec: null,
    });
  }

  const passed = rows.filter((r) => r.ok).length;
  const failed = rows.length - passed;
  const report: TimeframeVerifyReport = {
    ranAt: new Date().toISOString(),
    window: {
      hour,
      tz,
      label: `${String(hour).padStart(2, "0")}:00–${String(hour).padStart(2, "0")}:59 ${tz} (swap-hour window)`,
    },
    symbols,
    timeframes: [...UI_TIMEFRAMES],
    planCollisions,
    rows,
    summary: {
      total: rows.length,
      passed,
      failed,
      ok: failed === 0 && planCollisions.length === 0,
    },
  };

  latestReport = report;
  persistReport(report);
  return report;
}

export function startTimeframeAccuracyScheduler() {
  if (!isVerifyEnabled()) {
    console.log("[TimeframeVerify] Scheduler disabled (TIMEFRAME_VERIFY_ENABLED=0)");
    return;
  }
  if (timer) return;

  const tz = verifyTz();
  const hour = verifyHour();
  console.log(
    `[TimeframeVerify] Scheduler armed — daily ${String(hour).padStart(2, "0")}:00–${String(hour).padStart(2, "0")}:59 ${tz}`
  );

  const tick = async () => {
    try {
      const { hour: h, dayKey } = zonedNowParts(tz);
      if (h !== hour) return;
      if (lastRunDayKey === dayKey) return;
      // Claim the day before awaiting so overlapping ticks don't double-run
      lastRunDayKey = dayKey;
      console.log(
        `[TimeframeVerify] Swap-hour window open (${dayKey} ${String(hour).padStart(2, "0")}:xx ${tz}) — starting accuracy sweep…`
      );
      const report = await runTimeframeAccuracyVerify();
      console.log(
        `[TimeframeVerify] Done — passed=${report.summary.passed} failed=${report.summary.failed} ok=${report.summary.ok}`
      );
      if (!report.summary.ok) {
        const sample = report.rows
          .filter((r) => !r.ok)
          .slice(0, 8)
          .map((r) => `${r.symbol}/${r.ui}: ${r.errors.join("; ")}`);
        console.warn("[TimeframeVerify] Failures:\n  " + sample.join("\n  "));
      }
    } catch (e: any) {
      console.warn("[TimeframeVerify] Tick failed:", e?.message || e);
    }
  };

  // Check every minute during the window
  timer = setInterval(() => {
    void tick();
  }, 60_000);
  // Also evaluate shortly after boot in case we restart mid-window
  setTimeout(() => {
    void tick();
  }, 15_000);
}

export function stopTimeframeAccuracyScheduler() {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
}
