/**
 * Durable storage for overnight structure review reports.
 * Local disk (dev / fallback) + Firestore (survives Cloud Run redeploys).
 */

import fs from "node:fs";
import path from "node:path";
import { getAdminFirestore } from "./firebaseAdmin";
import type { DailyPatternReviewReport } from "./dailyPatternReviewTypes";

const DIR = path.join(process.cwd(), "data", "daily-pattern-review");
const COLLECTION = "daily_pattern_reviews";
const LATEST_FILE = "latest.json";

function ensureDir() {
  if (!fs.existsSync(DIR)) fs.mkdirSync(DIR, { recursive: true });
}

function fileFor(reportId: string) {
  return path.join(DIR, `${reportId}.json`);
}

export function loadDailyPatternReviewFromDisk(reportId: string): DailyPatternReviewReport | null {
  try {
    const p = fileFor(reportId);
    if (!fs.existsSync(p)) return null;
    return JSON.parse(fs.readFileSync(p, "utf8")) as DailyPatternReviewReport;
  } catch {
    return null;
  }
}

export function loadLatestDailyPatternReviewFromDisk(): DailyPatternReviewReport | null {
  const latestPath = path.join(DIR, LATEST_FILE);
  try {
    if (fs.existsSync(latestPath)) {
      return JSON.parse(fs.readFileSync(latestPath, "utf8")) as DailyPatternReviewReport;
    }
  } catch {
    /* fall through */
  }
  try {
    if (!fs.existsSync(DIR)) return null;
    const ids = fs
      .readdirSync(DIR)
      .filter((f) => f.endsWith(".json") && f !== LATEST_FILE)
      .map((f) => f.replace(/\.json$/, ""))
      .sort((a, b) => b.localeCompare(a));
    if (!ids.length) return null;
    return loadDailyPatternReviewFromDisk(ids[0]);
  } catch {
    return null;
  }
}

export function saveDailyPatternReviewToDisk(report: DailyPatternReviewReport): DailyPatternReviewReport {
  ensureDir();
  fs.writeFileSync(fileFor(report.reportId), JSON.stringify(report, null, 2), "utf8");
  fs.writeFileSync(path.join(DIR, LATEST_FILE), JSON.stringify(report, null, 2), "utf8");
  return report;
}

export async function loadDailyPatternReviewFromFirestore(
  reportId: string,
): Promise<DailyPatternReviewReport | null> {
  const db = getAdminFirestore();
  if (!db) return null;
  try {
    const snap = await db.collection(COLLECTION).doc(reportId).get();
    if (!snap.exists) return null;
    const data = snap.data() as DailyPatternReviewReport | undefined;
    return data?.reportId ? data : null;
  } catch (err) {
    console.warn("[DailyPatternReview] Firestore load failed:", err instanceof Error ? err.message : err);
    return null;
  }
}

export async function loadLatestDailyPatternReviewFromFirestore(): Promise<DailyPatternReviewReport | null> {
  const db = getAdminFirestore();
  if (!db) return null;
  try {
    const snap = await db.collection(COLLECTION).orderBy("ranAt", "desc").limit(1).get();
    if (snap.empty) return null;
    const data = snap.docs[0]?.data() as DailyPatternReviewReport | undefined;
    return data?.reportId ? data : null;
  } catch (err) {
    console.warn("[DailyPatternReview] Firestore latest load failed:", err instanceof Error ? err.message : err);
    return null;
  }
}

export async function saveDailyPatternReviewToFirestore(
  report: DailyPatternReviewReport,
): Promise<boolean> {
  const db = getAdminFirestore();
  if (!db) return false;
  try {
    await db.collection(COLLECTION).doc(report.reportId).set(report, { merge: true });
    return true;
  } catch (err) {
    console.warn("[DailyPatternReview] Firestore save failed:", err instanceof Error ? err.message : err);
    return false;
  }
}

export async function persistDailyPatternReviewReport(
  report: DailyPatternReviewReport,
): Promise<DailyPatternReviewReport> {
  saveDailyPatternReviewToDisk(report);
  const fsOk = await saveDailyPatternReviewToFirestore(report);
  return {
    ...report,
    storage: fsOk ? "both" : "disk",
  };
}

export async function resolveDailyPatternReviewReport(
  reportId: string,
): Promise<DailyPatternReviewReport | null> {
  return (
    loadDailyPatternReviewFromDisk(reportId) ||
    (await loadDailyPatternReviewFromFirestore(reportId)) ||
    null
  );
}

export async function resolveLatestDailyPatternReviewReport(): Promise<DailyPatternReviewReport | null> {
  return (
    loadLatestDailyPatternReviewFromDisk() ||
    (await loadLatestDailyPatternReviewFromFirestore()) ||
    null
  );
}
