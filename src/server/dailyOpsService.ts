/**
 * Daily Ops — once-per-Pacific-day sweep for the CEO Dashboard.
 *
 * Combines: live site checks, GitHub Actions, vendor pings, leftover-grant
 * scan, and one researched investor. Human items are stored as checkboxes
 * and never auto-marked done.
 */

import fs from "node:fs";
import path from "node:path";
import { getGroqApiKey, getSecretPresenceReport } from "./secrets";
import { getLatestSiteDoctorReport, runSiteDoctorSweep } from "./siteDoctor";
import { SUPPORTED_CHART_INDICATORS } from "../config/tradingViewIndicators";
import { themeProfiles } from "../lib/theme/profiles";
import { QUIZZES, isQuizPassed } from "../education/quizData";
import {
  LEGAL_NON_ADVISORY_CLAUSE,
  LEGAL_POSITIONING_BLURB,
  legalNonAdvisoryClausePresent,
} from "../legal/nonAdvisoryCopy";
import {
  CATALOG,
  itemsForDay,
  pacificDateKey,
  SHIPPED_AS_OF_2026_08_18,
  OPEN_SITE_WORK,
  type CatalogItem,
} from "./dailyOpsCatalog";
import {
  researchInvestorForDate,
  readPipeline,
  updatePipeline,
  INVESTOR_SEED,
  type InvestorResearch,
  type InvestorSeed,
  type PipelineRow,
  type PipelineStatus,
} from "./investorDesk";

export type AutoCheck = {
  id: string;
  ok: boolean;
  severity: "critical" | "warn" | "info";
  detail: string;
  latencyMs?: number;
};

export type HumanState = {
  done: boolean;
  note?: string;
  at?: string;
};

export type DailyOpsReport = {
  date: string;
  ranAt: string;
  timezone: "America/Los_Angeles";
  overall: "green" | "yellow" | "red";
  auto: AutoCheck[];
  items: CatalogItem[];
  human: Record<string, HumanState>;
  investor: InvestorResearch | null;
  /** Live catalog for the pin-by-name picker. Filled on read; not used as research source. */
  investorCatalog?: Array<Pick<InvestorSeed, "id" | "name" | "kind" | "stage">>;
  pipeline: PipelineRow[];
  shipped: typeof SHIPPED_AS_OF_2026_08_18;
  openWork: typeof OPEN_SITE_WORK;
  nextDueHint: string;
};

const DIR = path.join(process.cwd(), "data", "daily-ops");
const GITHUB_REPO = process.env.GITHUB_REPO || "clearpathcharts/CLAUDEDCLEAR";
const PUBLIC_ORIGIN = (
  process.env.PUBLIC_SITE_URL ||
  process.env.PUBLIC_ORIGIN ||
  "https://clearpathtrader.com"
).replace(/\/$/, "");

let latest: DailyOpsReport | null = null;
let timer: ReturnType<typeof setInterval> | null = null;
let running = false;

function ensureDir() {
  if (!fs.existsSync(DIR)) fs.mkdirSync(DIR, { recursive: true });
}

function fileFor(date: string) {
  return path.join(DIR, `${date}.json`);
}

function loadFromDisk(date: string): DailyOpsReport | null {
  try {
    const p = fileFor(date);
    if (!fs.existsSync(p)) return null;
    return JSON.parse(fs.readFileSync(p, "utf8")) as DailyOpsReport;
  } catch {
    return null;
  }
}

function withCatalog(report: DailyOpsReport): DailyOpsReport {
  return {
    ...report,
    investorCatalog: INVESTOR_SEED.map((s) => ({
      id: s.id,
      name: s.name,
      kind: s.kind,
      stage: s.stage,
    })),
  };
}

function persist(report: DailyOpsReport): DailyOpsReport {
  const next = withCatalog(report);
  ensureDir();
  fs.writeFileSync(fileFor(next.date), JSON.stringify(next, null, 2), "utf8");
  fs.writeFileSync(path.join(DIR, "latest.json"), JSON.stringify(next, null, 2), "utf8");
  latest = next;
  return next;
}

export function getLatestDailyOpsReport(): DailyOpsReport | null {
  const today = pacificDateKey();
  const disk = loadFromDisk(today);
  if (disk) {
    latest = withCatalog(disk);
    return latest;
  }
  return null;
}

async function timed<T>(fn: () => Promise<T>, ms: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      fn(),
      new Promise<T>((_, reject) => {
        timer = setTimeout(() => reject(new Error(`timeout ${ms}ms`)), ms);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

function readSrc(rel: string): string {
  try {
    return fs.readFileSync(path.join(process.cwd(), rel), "utf8");
  } catch {
    return "";
  }
}

function walkSrcFiles(dir: string, acc: string[] = []): string[] {
  if (!fs.existsSync(dir)) return acc;
  for (const name of fs.readdirSync(dir)) {
    if (name === "node_modules" || name === "dist" || name.startsWith(".")) continue;
    const full = path.join(dir, name);
    let st: fs.Stats;
    try {
      st = fs.statSync(full);
    } catch {
      continue;
    }
    if (st.isDirectory()) walkSrcFiles(full, acc);
    else if (/\.(ts|tsx|js|jsx)$/.test(name)) acc.push(full);
  }
  return acc;
}

async function checkPublicPages(): Promise<AutoCheck> {
  const t0 = Date.now();
  const paths = ["/", "/accessibility", "/learn", "/faq"];
  const results: string[] = [];
  let ok = true;
  for (const p of paths) {
    try {
      const res = await timed(
        () =>
          fetch(`${PUBLIC_ORIGIN}${p}`, {
            method: "GET",
            redirect: "follow",
            headers: { "User-Agent": "ClearPathTraderDailyOps/1.0" },
          }),
        8000
      );
      results.push(`${p}:${res.status}`);
      if (res.status >= 400) ok = false;
    } catch (e: any) {
      results.push(`${p}:ERR`);
      ok = false;
    }
  }
  return {
    id: "auto_public_pages",
    ok,
    severity: ok ? "info" : "critical",
    detail: `${PUBLIC_ORIGIN} → ${results.join(" ")}`,
    latencyMs: Date.now() - t0,
  };
}

async function checkGithubActions(): Promise<AutoCheck> {
  const t0 = Date.now();
  const token = (process.env.GITHUB_TOKEN || process.env.GH_TOKEN || "").trim();
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "User-Agent": "ClearPathTraderDailyOps/1.0",
    "X-GitHub-Api-Version": "2022-11-28",
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  try {
    const res = await timed(
      () =>
        fetch(`https://api.github.com/repos/${GITHUB_REPO}/actions/runs?per_page=12`, {
          headers,
        }),
      8000
    );
    if (res.status === 404 || res.status === 401 || res.status === 403) {
      // Private repo without a token (or bad token) — expected skip, not a site fault.
      return {
        id: "auto_github_actions",
        ok: true,
        severity: "info",
        detail: token
          ? `GitHub API ${res.status} for ${GITHUB_REPO} — check GITHUB_TOKEN scopes (actions:read)`
          : `Repo ${GITHUB_REPO} is private/unreadable without auth — set GITHUB_TOKEN to monitor Actions (${res.status}, ${Date.now() - t0}ms)`,
        latencyMs: Date.now() - t0,
      };
    }
    if (!res.ok) {
      return {
        id: "auto_github_actions",
        ok: false,
        severity: "warn",
        detail: `GitHub API ${res.status}${token ? "" : " (unauthenticated)"}`,
        latencyMs: Date.now() - t0,
      };
    }
    const body = (await res.json()) as {
      workflow_runs?: Array<{ conclusion: string | null; status: string; html_url: string; created_at: string; name: string }>;
    };
    const runs = body.workflow_runs || [];
    const cutoff = Date.now() - 36 * 60 * 60 * 1000;
    const recent = runs.filter((r) => new Date(r.created_at).getTime() >= cutoff);
    const failed = recent.filter(
      (r) => r.conclusion === "failure" || r.conclusion === "startup_failure" || r.conclusion === "timed_out"
    );
    const ok = failed.length === 0;
    return {
      id: "auto_github_actions",
      ok,
      severity: ok ? "info" : "critical",
      detail: ok
        ? `${GITHUB_REPO}: ${recent.length} runs in 36h, none failed`
        : `${failed.length} failed: ${failed
            .slice(0, 3)
            .map((f) => f.name)
            .join(", ")}`,
      latencyMs: Date.now() - t0,
    };
  } catch (e: any) {
    return {
      id: "auto_github_actions",
      ok: false,
      severity: "warn",
      detail: e?.message || String(e),
      latencyMs: Date.now() - t0,
    };
  }
}

async function checkGroq(): Promise<AutoCheck> {
  const t0 = Date.now();
  const key = getGroqApiKey();
  if (!key) {
    return {
      id: "auto_groq",
      ok: false,
      severity: "warn",
      detail: "GROQ_API_KEY missing — Buddy/Genie offline stubs",
    };
  }
  try {
    const res = await timed(
      () =>
        fetch("https://api.groq.com/openai/v1/models", {
          headers: { Authorization: `Bearer ${key}` },
        }),
      7000
    );
    const ok = res.ok;
    return {
      id: "auto_groq",
      ok,
      severity: ok ? "info" : "critical",
      detail: ok ? "Groq models list ok" : `Groq HTTP ${res.status}`,
      latencyMs: Date.now() - t0,
    };
  } catch (e: any) {
    return {
      id: "auto_groq",
      ok: false,
      severity: "critical",
      detail: e?.message || String(e),
      latencyMs: Date.now() - t0,
    };
  }
}

async function checkTwilio(): Promise<AutoCheck> {
  const t0 = Date.now();
  const sid = (process.env.TWILIO_ACCOUNT_SID || "").trim();
  const token = (process.env.TWILIO_AUTH_TOKEN || "").trim();
  // Ava voice receptionist is still open work — do not paint the CEO desk yellow for it.
  if (!sid || !token) {
    return {
      id: "auto_twilio_ava",
      ok: true,
      severity: "info",
      detail:
        "Ava voice receptionist not shipped yet — Twilio optional. Check skipped until Ava lands in-repo.",
      latencyMs: Date.now() - t0,
    };
  }
  try {
    const auth = Buffer.from(`${sid}:${token}`).toString("base64");
    const res = await timed(
      () =>
        fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}.json`, {
          headers: { Authorization: `Basic ${auth}` },
        }),
      7000
    );
    return {
      id: "auto_twilio_ava",
      ok: res.ok,
      severity: res.ok ? "info" : "warn",
      detail: res.ok
        ? "Twilio account authenticated. Ava voice route still not present in this codebase."
        : `Twilio HTTP ${res.status}`,
      latencyMs: Date.now() - t0,
    };
  } catch (e: any) {
    return {
      id: "auto_twilio_ava",
      ok: false,
      severity: "warn",
      detail: e?.message || String(e),
      latencyMs: Date.now() - t0,
    };
  }
}

function checkStripe(): AutoCheck {
  return {
    id: "auto_stripe",
    ok: true,
    severity: "info",
    detail: "Payments removed — Stripe checkout, webhooks, and cash payouts are disabled",
  };
}

function checkIndicatorBank(): AutoCheck {
  const n = Number(SUPPORTED_CHART_INDICATORS.length);
  const placeholders = n === 0 || n === 99 || n === 100 || n === 999;
  const ok = n >= 20 && !placeholders;
  return {
    id: "auto_indicator_bank",
    ok,
    severity: ok ? "info" : "critical",
    detail: ok
      ? `${n} live-math indicators in tradingViewIndicators.ts`
      : `Suspicious bank size ${n} (placeholder risk)`,
  };
}

function checkA11yProfiles(): AutoCheck {
  const n = Object.keys(themeProfiles).length;
  const ok = n === 13;
  return {
    id: "auto_a11y_profiles",
    ok,
    severity: ok ? "info" : "warn",
    detail: ok ? "13 ThemeProfileId values" : `Found ${n} profiles — catalog expects 13`,
  };
}

function checkLegacyVip(): AutoCheck {
  const membership = readSrc("src/hooks/useMembership.ts");
  const tab = readSrc("src/components/MembershipTab.tsx");
  const stillGrants =
    /legacyPaid\s*=/.test(membership) ||
    /vipStatus\s*===\s*['"]vip_pro['"]/.test(membership) ||
    /vipStatus\s*===\s*['"]vip_pro['"]/.test(tab) ||
    /handleSelfUpgrade/.test(tab);
  const ok = !stillGrants;
  return {
    id: "auto_legacy_vip",
    ok,
    severity: ok ? "info" : "critical",
    detail: ok
      ? "No client vip_pro / handleSelfUpgrade grant in MembershipTab or useMembership"
      : "Client still treats vipStatus/subscriptionActive as paid — patch immediately",
  };
}

function checkLegal(): AutoCheck {
  // Prefer the bundled constant (works in Cloud Run where /src is not copied).
  const constantOk =
    legalNonAdvisoryClausePresent(LEGAL_NON_ADVISORY_CLAUSE) &&
    legalNonAdvisoryClausePresent(LEGAL_POSITIONING_BLURB);
  const footer = readSrc("src/components/LegalFooter.tsx");
  const footerOk =
    !footer ||
    footer.includes("LEGAL_POSITIONING_BLURB") ||
    legalNonAdvisoryClausePresent(footer);
  const ok = constantOk && footerOk;
  return {
    id: "auto_legal",
    ok,
    severity: ok ? "info" : "critical",
    detail: ok
      ? "LegalFooter educational-only sentence present (bundled constant)"
      : "LegalFooter missing the non-advisory sentence",
  };
}

function checkQuiz(): AutoCheck {
  const quizzes = Object.values(QUIZZES);
  const allHavePass = quizzes.length > 0 && quizzes.every((q) => q.passingScore >= 1);
  // Prove pass logic without reading QuizEngine.tsx from disk (absent in Docker runtime).
  const sample = quizzes[0];
  const logicOk = Boolean(
    sample &&
      isQuizPassed(sample.passingScore, sample) &&
      !isQuizPassed(Math.max(0, sample.passingScore - 1), sample)
  );
  const engine = readSrc("src/education/QuizEngine.tsx");
  const engineWired =
    !engine ||
    engine.includes("isQuizPassed") ||
    /score\s*>=\s*quiz\.passingScore/.test(engine);
  const ok = allHavePass && logicOk && engineWired;
  return {
    id: "auto_quiz",
    ok,
    severity: ok ? "info" : "warn",
    detail: ok
      ? `QuizEngine uses passingScore · ${quizzes.length} quizzes loaded`
      : "Quiz pass logic missing or quizzes have passingScore < 1",
  };
}

function checkSecretsScan(): AutoCheck {
  const root = path.join(process.cwd(), "src");
  const files = walkSrcFiles(root);
  const hits: string[] = [];
  const live = /sk_live_[0-9a-zA-Z]{8,}|rk_live_[0-9a-zA-Z]{8,}|gsk_[0-9a-zA-Z]{8,}|AIza[0-9A-Za-z\-_]{20,}/;
  for (const file of files) {
    let text = "";
    try {
      text = fs.readFileSync(file, "utf8");
    } catch {
      continue;
    }
    if (live.test(text)) {
      hits.push(path.relative(process.cwd(), file).replace(/\\/g, "/"));
    }
  }
  const ok = hits.length === 0;
  return {
    id: "auto_secrets_scan",
    ok,
    severity: ok ? "info" : "critical",
    detail: ok
      ? `Scanned ${files.length} src files — no live Stripe/Groq/Google key literals`
      : `Possible live key literals in: ${hits.slice(0, 5).join(", ")}`,
  };
}

function checkSiteDoctor(): AutoCheck {
  const report = getLatestSiteDoctorReport();
  if (!report) {
    return {
      id: "auto_site_doctor",
      ok: false,
      severity: "warn",
      detail: "No Site Doctor report yet",
    };
  }
  const ok = report.overall !== "red";
  return {
    id: "auto_site_doctor",
    ok,
    severity: report.overall === "red" ? "critical" : report.overall === "yellow" ? "warn" : "info",
    detail: `Site Doctor ${report.overall} · ok=${report.okCount} warn=${report.warnCount} fail=${report.failCount} · ${report.ranAt}`,
  };
}

async function runAutoChecks(): Promise<AutoCheck[]> {
  try {
    if (!getLatestSiteDoctorReport()) await runSiteDoctorSweep();
  } catch {
    /* still record a missing report */
  }
  const parallel = await Promise.all([
    checkPublicPages(),
    checkGithubActions(),
    checkGroq(),
    checkTwilio(),
  ]);
  return [
    checkSiteDoctor(),
    ...parallel,
    checkStripe(),
    checkIndicatorBank(),
    checkA11yProfiles(),
    checkLegacyVip(),
    checkLegal(),
    checkQuiz(),
    checkSecretsScan(),
  ];
}

function overallOf(auto: AutoCheck[]): DailyOpsReport["overall"] {
  if (auto.some((c) => !c.ok && c.severity === "critical")) return "red";
  if (auto.some((c) => !c.ok || c.severity === "warn")) return "yellow";
  return "green";
}

export async function runDailyOpsSweep(force = false, investorId?: string): Promise<DailyOpsReport> {
  const date = pacificDateKey();
  const existing = loadFromDisk(date);
  if (!force && !investorId && existing?.auto?.length && existing.investor) {
    existing.items = itemsForDay();
    latest = withCatalog(existing);
    return latest;
  }
  if (running && existing) return withCatalog(existing);
  running = true;
  try {
    const auto = await runAutoChecks();
    let investor: InvestorResearch | null = existing?.investor || null;
    try {
      investor = await researchInvestorForDate(new Date(), investorId);
    } catch (e: any) {
      auto.push({
        id: "auto_investor",
        ok: false,
        severity: "warn",
        detail: e?.message || "Investor research failed",
      });
    }
    if (investor) {
      auto.push({
        id: "auto_investor",
        ok: investor.warnings.length === 0 || Boolean(investor.wikiExtract || investor.siteTitle),
        severity: investor.sources.length > 1 ? "info" : "warn",
        detail: `${investor.investor.name} · sources: ${investor.sources.join(", ")}`,
      });
    }

    const report: DailyOpsReport = {
      date,
      ranAt: new Date().toISOString(),
      timezone: "America/Los_Angeles",
      overall: overallOf(auto),
      auto,
      items: itemsForDay(),
      human: existing?.human || {},
      investor,
      pipeline: readPipeline(),
      shipped: SHIPPED_AS_OF_2026_08_18,
      openWork: OPEN_SITE_WORK,
      nextDueHint: "Automatic sweep once per Pacific day (re-runs after midnight LA, or Run now)",
    };
    persist(report);
    console.log(`[DailyOps] ${date} ${report.overall.toUpperCase()} auto=${auto.length}`);
    return latest || report;
  } finally {
    running = false;
  }
}

export function completeDailyOpsItem(
  itemId: string,
  done: boolean,
  note?: string
): DailyOpsReport {
  const date = pacificDateKey();
  const report = loadFromDisk(date) || latest;
  if (!report) {
    throw new Error("No daily ops report yet — run the sweep first.");
  }
  const allowed = new Set(CATALOG.map((c) => c.id));
  if (!allowed.has(itemId)) throw new Error("Unknown checklist item.");
  const nextHuman = {
    ...report.human,
    [itemId]: {
      done,
      note: note?.slice(0, 2000),
      at: new Date().toISOString(),
    },
  };
  const next = { ...report, human: nextHuman, items: itemsForDay() };
  return persist(next);
}

export function recordInvestorAction(input: {
  investorId: string;
  status: PipelineStatus;
  notes?: string;
  followUpDate?: string;
}): DailyOpsReport {
  updatePipeline(input.investorId, {
    status: input.status,
    notes: input.notes,
    followUpDate: input.followUpDate,
    lastDate: pacificDateKey(),
  });
  const date = pacificDateKey();
  const report = loadFromDisk(date) || latest;
  if (!report) throw new Error("No daily ops report yet — run the sweep first.");
  const next = { ...report, pipeline: readPipeline(), items: itemsForDay() };
  return persist(next);
}

/** Replace today's researched investor without re-running site pings. */
export async function pinInvestorResearch(investorId: string): Promise<DailyOpsReport> {
  const date = pacificDateKey();
  const report = loadFromDisk(date) || latest;
  const investor = await researchInvestorForDate(new Date(), investorId);
  const auto = (report?.auto || []).filter((c) => c.id !== "auto_investor");
  auto.push({
    id: "auto_investor",
    ok: investor.warnings.length === 0 || Boolean(investor.wikiExtract || investor.siteTitle),
    severity: investor.sources.length > 1 ? "info" : "warn",
    detail: `${investor.investor.name} · sources: ${investor.sources.join(", ")}`,
  });
  const next: DailyOpsReport = {
    date,
    ranAt: new Date().toISOString(),
    timezone: "America/Los_Angeles",
    overall: report?.overall || overallOf(auto),
    auto,
    items: itemsForDay(),
    human: report?.human || {},
    investor,
    pipeline: readPipeline(),
    shipped: SHIPPED_AS_OF_2026_08_18,
    openWork: OPEN_SITE_WORK,
    nextDueHint: report?.nextDueHint || "Pinned named investor for today — copy the draft, do not auto-mail.",
  };
  return persist(next);
}

export function startDailyOpsScheduler() {
  if (timer) return;
  const enabled = (process.env.DAILY_OPS_ENABLED || "1").toLowerCase();
  if (enabled === "0" || enabled === "false" || enabled === "off") {
    console.log("[DailyOps] Disabled (DAILY_OPS_ENABLED=0)");
    return;
  }
  console.log("[DailyOps] Scheduler armed — Pacific daily");
  setTimeout(() => {
    void runDailyOpsSweep(false);
  }, 45_000);
  timer = setInterval(() => {
    const today = pacificDateKey();
    const have = loadFromDisk(today);
    if (!have) void runDailyOpsSweep(false);
  }, 60 * 60 * 1000);
}

export function stopDailyOpsScheduler() {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
}
