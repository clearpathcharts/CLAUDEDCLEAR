/**
 * Site Doctor — hourly internal sweep (detect + report, not auto-rewrite).
 *
 * TradingView / Alpaca stay reliable because they:
 *  1) detect failures continuously
 *  2) page humans / page systems
 *  3) roll back / feature-flag
 * They do NOT have an AI that silently rewrites production on every bug.
 *
 * This module is ClearPath's "detect + report to CEO" layer:
 *   - runs once per hour
 *   - checks auth durability, market data, sessions, waitlist wiring, plan integrity
 *   - writes data/site-doctor/latest.json
 *   - exposed to founder CEO Dashboard
 *
 * Env:
 *   SITE_DOCTOR_ENABLED=1|0   (default 1)
 *   SITE_DOCTOR_INTERVAL_MS   (default 3600000 = 1h)
 */

import fs from "node:fs";
import path from "node:path";
import { getTwelveDataApiKey, getSessionSecret, getSecretPresenceReport } from "./secrets";
import { getMarketCandles } from "./marketDataGateway";
import { getAdminFirestore, getFirebaseAdminStatus } from "./firebaseAdmin";
import { resolveTimeframePlan } from "../services/marketData";
import { getLatestTimeframeVerifyReport } from "./timeframeAccuracyVerifier";
import { getPrivateStorageMeta } from "./privateAuthService";

// UI timeframes list duplicated lightly to avoid circular import issues if any
const UI_TFS = [
  "1m", "2m", "3m", "5m", "10m", "15m", "30m",
  "1h", "2h", "3h", "4h", "1d", "1w", "1M", "3M", "6M", "ytd",
] as const;

export type SiteDoctorCheck = {
  id: string;
  label: string;
  ok: boolean;
  severity: "critical" | "warn" | "info";
  detail: string;
  latencyMs?: number;
};

export type SiteDoctorReport = {
  ranAt: string;
  overall: "green" | "yellow" | "red";
  okCount: number;
  failCount: number;
  warnCount: number;
  checks: SiteDoctorCheck[];
  nextDueHint: string;
};

let latest: SiteDoctorReport | null = null;
let timer: ReturnType<typeof setInterval> | null = null;
let running = false;

const REPORT_DIR = path.join(process.cwd(), "data", "site-doctor");

function isEnabled(): boolean {
  const v = (process.env.SITE_DOCTOR_ENABLED || "1").toLowerCase();
  return v !== "0" && v !== "false" && v !== "off";
}

function intervalMs(): number {
  const n = Number(process.env.SITE_DOCTOR_INTERVAL_MS || "3600000");
  return Number.isFinite(n) && n >= 60_000 ? n : 3_600_000;
}

function persist(report: SiteDoctorReport) {
  try {
    if (!fs.existsSync(REPORT_DIR)) fs.mkdirSync(REPORT_DIR, { recursive: true });
    fs.writeFileSync(
      path.join(REPORT_DIR, "latest.json"),
      JSON.stringify(report, null, 2),
      "utf8"
    );
    const stamp = report.ranAt.replace(/[:.]/g, "-");
    fs.writeFileSync(
      path.join(REPORT_DIR, `${stamp}.json`),
      JSON.stringify(report, null, 2),
      "utf8"
    );
  } catch (e: any) {
    console.warn("[SiteDoctor] persist failed:", e?.message || e);
  }
}

function loadLatestFromDisk(): SiteDoctorReport | null {
  try {
    const p = path.join(REPORT_DIR, "latest.json");
    if (!fs.existsSync(p)) return null;
    return JSON.parse(fs.readFileSync(p, "utf8")) as SiteDoctorReport;
  } catch {
    return null;
  }
}

export function getLatestSiteDoctorReport(): SiteDoctorReport | null {
  return latest || loadLatestFromDisk();
}

async function checkPrivateStorage(): Promise<SiteDoctorCheck> {
  try {
    const meta = getPrivateStorageMeta();
    const isProd = process.env.NODE_ENV === "production";
    const ok = Boolean(meta.durable) || !isProd;
    return {
      id: "private_storage",
      label: "Private login storage",
      ok,
      severity: ok ? "info" : "critical",
      detail: ok
        ? `durable=${meta.durable} storage=${meta.privateStorage} writes=${meta.writesAllowed}`
        : `NON-DURABLE in production — logins will wipe on redeploy (storage=${meta.privateStorage})`,
    };
  } catch (e: any) {
    return {
      id: "private_storage",
      label: "Private login storage",
      ok: false,
      severity: "critical",
      detail: e?.message || String(e),
    };
  }
}

async function checkTwelveData(): Promise<SiteDoctorCheck> {
  const t0 = Date.now();
  const key = getTwelveDataApiKey();
  if (!key) {
    return {
      id: "twelvedata",
      label: "Twelve Data market feed",
      ok: false,
      severity: "critical",
      detail: "TWELVEDATA_API_KEY missing",
    };
  }
  try {
    const raw = await getMarketCandles("EURUSD", "1h", 5, key);
    const n = Array.isArray(raw?.values) ? raw.values.length : 0;
    const ok = n > 0;
    return {
      id: "twelvedata",
      label: "Twelve Data market feed",
      ok,
      severity: ok ? "info" : "critical",
      detail: ok ? `EURUSD 1h sample ok (${n} bars)` : raw?.message || "empty candle response",
      latencyMs: Date.now() - t0,
    };
  } catch (e: any) {
    return {
      id: "twelvedata",
      label: "Twelve Data market feed",
      ok: false,
      severity: "critical",
      detail: e?.message || String(e),
      latencyMs: Date.now() - t0,
    };
  }
}

function checkSessionSecret(): SiteDoctorCheck {
  const s = getSessionSecret();
  const ok = Boolean(s && s.length >= 32);
  return {
    id: "session_secret",
    label: "Session signing secret",
    ok,
    severity: ok ? "info" : "critical",
    detail: ok
      ? `SESSION_SECRET configured (len>=32)`
      : "SESSION_SECRET missing/short — logins reset on restart",
  };
}

function checkFirebaseAdmin(): SiteDoctorCheck {
  const st = getFirebaseAdminStatus();
  const db = getAdminFirestore();
  const ok = Boolean(st.firestore || db);
  const isProd = process.env.NODE_ENV === "production";
  return {
    id: "firebase_admin",
    label: "Firebase Admin / Firestore",
    ok: ok || !isProd,
    severity: ok ? "info" : isProd ? "critical" : "warn",
    detail: ok
      ? `mode=${st.mode} firestore=${st.firestore}`
      : st.reason || "Firebase Admin not connected",
  };
}

function checkWaitlistWiring(): SiteDoctorCheck {
  const appwrite = Boolean(
    process.env.VITE_APPWRITE_PROJECT_ID &&
      process.env.VITE_APPWRITE_PROJECT_ID !== "YOUR_PROJECT_ID"
  );
  const fsOk = Boolean(getAdminFirestore());
  const ok = appwrite || fsOk;
  return {
    id: "waitlist",
    label: "Waitlist backend",
    ok,
    severity: ok ? "info" : "warn",
    detail: ok
      ? `appwrite=${appwrite} firestore=${fsOk}`
      : "Neither Appwrite nor Firestore waitlist configured",
  };
}

function checkTimeframePlans(): SiteDoctorCheck {
  const sig = new Map<string, string[]>();
  for (const ui of UI_TFS) {
    const p = resolveTimeframePlan(ui);
    const key = `${p.fetchInterval}|x${p.aggregateBars}|v${p.visibleBars ?? "full"}`;
    if (!sig.has(key)) sig.set(key, []);
    sig.get(key)!.push(ui);
  }
  const collisions = [...sig.entries()].filter(([, a]) => a.length > 1);
  const ok = collisions.length === 0;
  return {
    id: "timeframe_plans",
    label: "Chart timeframe uniqueness",
    ok,
    severity: ok ? "info" : "critical",
    detail: ok
      ? `${UI_TFS.length} UI timeframes → ${sig.size} unique plans`
      : collisions.map(([k, a]) => `${k}→${a.join(",")}`).join("; "),
  };
}

function checkTimeframeVerifyFreshness(): SiteDoctorCheck {
  const report = getLatestTimeframeVerifyReport();
  if (!report) {
    return {
      id: "timeframe_verify",
      label: "Daily swap-hour TF verify",
      ok: true,
      // Pending first scheduled run is expected — not a yellow desk alarm.
      severity: "info",
      detail: "No report yet (runs 02:00–02:59 America/New_York) — pending first sweep",
    };
  }
  const ageH =
    (Date.now() - new Date(report.ranAt).getTime()) / (1000 * 60 * 60);
  const fresh = ageH <= 36;
  const ok = report.summary.ok && fresh;
  return {
    id: "timeframe_verify",
    label: "Daily swap-hour TF verify",
    ok,
    severity: report.summary.ok ? (fresh ? "info" : "warn") : "critical",
    detail: `last=${report.ranAt} ok=${report.summary.ok} passed=${report.summary.passed}/${report.summary.total} ageHours=${ageH.toFixed(1)}`,
  };
}

function checkSecretsPresence(): SiteDoctorCheck {
  const rep = getSecretPresenceReport();
  const need = ["TWELVEDATA_API_KEY", "SESSION_SECRET"] as const;
  const missing = need.filter((k) => !rep[k]);
  const ok = missing.length === 0;
  return {
    id: "core_secrets",
    label: "Core secrets present",
    ok,
    severity: ok ? "info" : "critical",
    detail: ok
      ? "TWELVEDATA_API_KEY + SESSION_SECRET present"
      : `Missing: ${missing.join(", ")}`,
  };
}

export async function runSiteDoctorSweep(): Promise<SiteDoctorReport> {
  if (running) {
    const existing = getLatestSiteDoctorReport();
    if (existing) return existing;
  }
  running = true;
  try {
    const checks: SiteDoctorCheck[] = [];
    checks.push(checkSessionSecret());
    checks.push(checkSecretsPresence());
    checks.push(checkFirebaseAdmin());
    checks.push(await checkPrivateStorage());
    checks.push(checkWaitlistWiring());
    checks.push(checkTimeframePlans());
    checks.push(checkTimeframeVerifyFreshness());
    checks.push(await checkTwelveData());

    const failCount = checks.filter((c) => !c.ok && c.severity === "critical").length;
    const warnCount = checks.filter((c) => c.severity === "warn").length;
    const okCount = checks.filter((c) => c.ok && c.severity !== "warn").length;

    let overall: SiteDoctorReport["overall"] = "green";
    if (failCount > 0) overall = "red";
    else if (warnCount > 0 || checks.some((c) => !c.ok)) overall = "yellow";

    const report: SiteDoctorReport = {
      ranAt: new Date().toISOString(),
      overall,
      okCount,
      failCount,
      warnCount,
      checks,
      nextDueHint: `Automatic sweep every ${Math.round(intervalMs() / 60000)} minutes`,
    };
    latest = report;
    persist(report);
    console.log(
      `[SiteDoctor] Sweep ${overall.toUpperCase()} — ok=${okCount} criticalFail=${failCount} warn=${report.warnCount}`
    );
    return report;
  } finally {
    running = false;
  }
}

export function startSiteDoctorScheduler() {
  if (!isEnabled()) {
    console.log("[SiteDoctor] Disabled (SITE_DOCTOR_ENABLED=0)");
    return;
  }
  if (timer) return;
  const ms = intervalMs();
  console.log(`[SiteDoctor] Scheduler armed — every ${Math.round(ms / 60000)} min`);
  // First run shortly after boot
  setTimeout(() => {
    void runSiteDoctorSweep();
  }, 20_000);
  timer = setInterval(() => {
    void runSiteDoctorSweep();
  }, ms);
}

export function stopSiteDoctorScheduler() {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
}
