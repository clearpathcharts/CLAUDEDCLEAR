/**
 * Durable latest Site Doctor + timeframe-verify reports (Firestore).
 * Cloud Run disk is ephemeral; local data/site-doctor and data/timeframe-verify
 * are a cache. When Admin Firestore is available, latest reports survive redeploys.
 */

import { getAdminFirestore } from "./firebaseAdmin";

export type DiagnosticsKind = "site_doctor" | "timeframe_verify";

const COLLECTION = "ops_diagnostics";

function docId(kind: DiagnosticsKind): string {
  return kind === "site_doctor" ? "site_doctor_latest" : "timeframe_verify_latest";
}

export async function writeDiagnosticsLatest<T extends { ranAt: string }>(
  kind: DiagnosticsKind,
  report: T
): Promise<boolean> {
  const db = getAdminFirestore();
  if (!db) return false;
  try {
    await db.collection(COLLECTION).doc(docId(kind)).set({
      kind,
      report,
      ranAt: report.ranAt,
      persistedAt: new Date().toISOString(),
    });
    return true;
  } catch (e: any) {
    console.warn(
      `[DiagnosticsStore] Firestore write ${kind} failed:`,
      e?.message || e
    );
    return false;
  }
}

export async function readDiagnosticsLatest<T extends { ranAt: string }>(
  kind: DiagnosticsKind
): Promise<T | null> {
  const db = getAdminFirestore();
  if (!db) return null;
  try {
    const snap = await db.collection(COLLECTION).doc(docId(kind)).get();
    if (!snap.exists) return null;
    const report = snap.data()?.report;
    if (!report || typeof report !== "object") return null;
    const ranAt = (report as { ranAt?: unknown }).ranAt;
    if (typeof ranAt !== "string") return null;
    return report as T;
  } catch (e: any) {
    console.warn(
      `[DiagnosticsStore] Firestore read ${kind} failed:`,
      e?.message || e
    );
    return null;
  }
}
