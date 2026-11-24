/**
 * History of IndexNow submissions (Bing, Yandex, Seznam, Naver …) so the CEO
 * Marketing Department can show when search engines were last told about
 * the site, and what they answered. Firestore when available, memory otherwise.
 */
import { getAdminFirestore } from './firebaseAdmin';
import type { IndexNowResult } from './indexNow';

export type SeoPingEntry = {
  at: string;
  trigger: 'startup' | 'manual';
  submitted: number;
  ok: boolean;
  skipped: string | null;
  results: { endpoint: string; status: number }[];
};

const COLLECTION = 'site_settings';
const DOC = 'seo_indexnow_log';
const MAX_ENTRIES = 40;

let memory: SeoPingEntry[] = [];

export async function recordSeoPing(trigger: SeoPingEntry['trigger'], result: IndexNowResult): Promise<SeoPingEntry> {
  const entry: SeoPingEntry = {
    at: new Date().toISOString(),
    trigger,
    submitted: result.submitted,
    ok: result.ok,
    skipped: result.skipped || null,
    results: result.results.map((r) => ({ endpoint: r.endpoint, status: r.status })),
  };
  const current = await listSeoPings();
  memory = [entry, ...current].slice(0, MAX_ENTRIES);
  const db = getAdminFirestore();
  if (db) {
    await db
      .collection(COLLECTION)
      .doc(DOC)
      .set({ entries: memory, updatedAt: entry.at })
      .catch((err) => console.warn('[SEO ping log] Firestore write failed', err instanceof Error ? err.message : err));
  }
  return entry;
}

export async function listSeoPings(): Promise<SeoPingEntry[]> {
  const db = getAdminFirestore();
  if (!db) return memory;
  try {
    const snap = await db.collection(COLLECTION).doc(DOC).get();
    const entries = (snap.data() as { entries?: unknown } | undefined)?.entries;
    return Array.isArray(entries) ? (entries as SeoPingEntry[]) : memory;
  } catch {
    return memory;
  }
}
