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

function fileFor(date: string) {
  return path.join(DIR, `${date}.json`);
}

export function loadDailyPatternReviewFromDisk(date: string): DailyPatternReviewReport | null {
  try {
    const p = fileFor(date);
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
    const dates = fs
      .readdirSync(DIR)
      .filter((f) => /^\d{4}-\d{2}-\d{2}\.json$/.test(f))
      .map((f) => f.replace(/\.json$/, ""))
      .sort((a, b) => b.localeCompare(a));
    if (!dates.length) return null;
    return loadDailyPatternReviewFromDisk(dates[0]);
  } catch {
    return null;
  }
}

export function saveDailyPatternReviewToDisk(report: DailyPatternReviewReport): DailyPatternReviewReport {
  ensureDir();
  fs.writeFileSync(fileFor(report.date), JSON.stringify(report, null, 2), "utf8");
  fs.writeFileSync(path.join(DIR, LATEST_FILE), JSON.stringify(report, null, 2), "utf8");
  return report;
}

export async function loadDailyPatternReviewFromFirestore(
  date: string,
): Promise<DailyPatternReviewReport | null> {
  const db = getAdminFirestore();
  if (!db) return null;
  try {
    const snap = await db.collection(COLLECTION).doc(date).get();
    if (!snap.exists) return null;
    const data = snap.data() as DailyPatternReviewReport | undefined;
    return data?.date ? data : null;
  } catch (err) {
    console.warn("[DailyPatternReview] Firestore load failed:", err instanceof Error ? err.message : err);
    return null;
  }
}

export async function loadLatestDailyPatternReviewFromFirestore(): Promise<DailyPatternReviewReport | null> {
  const db = getAdminFirestore();
  if (!db) return null;
  try {
    const snap = await db.collection(COLLECTION).orderBy("date", "desc").limit(1).get();
    if (snap.empty) return null;
    const data = snap.docs[0]?.data() as DailyPatternReviewReport | undefined;
    return data?.date ? data : null;
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
    await db.collection(COLLECTION).doc(report.date).set(report, { merge: true });
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
  date: string,
): Promise<DailyPatternReviewReport | null> {
  return (
    loadDailyPatternReviewFromDisk(date) ||
    (await loadDailyPatternReviewFromFirestore(date)) ||
    null
  );
}

export async function resolveLatestDailyPatternReviewReport(
  today: string,
): Promise<DailyPatternReviewReport | null> {
  return (
    loadDailyPatternReviewFromDisk(today) ||
    (await loadDailyPatternReviewFromFirestore(today)) ||
    loadLatestDailyPatternReviewFromDisk() ||
    (await loadLatestDailyPatternReviewFromFirestore()) ||
    null
  );
}
