/**
 * Single-flight leader lock for interval jobs across Cloud Run instances.
 * Uses Firestore when available; otherwise always grants (single-instance dev).
 */
import { getAdminFirestore } from './firebaseAdmin';

const COLLECTION = '_scheduler_locks';

export async function tryAcquireSchedulerLock(
  lockId: string,
  leaseMs = 45_000,
): Promise<boolean> {
  const db = getAdminFirestore();
  if (!db) return true;

  const ref = db.collection(COLLECTION).doc(lockId);
  const now = Date.now();
  const instance = process.env.K_REVISION || process.env.HOSTNAME || 'local';

  try {
    return await db.runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      const data = snap.data() as { expiresAt?: number; holder?: string } | undefined;
      if (data?.expiresAt && data.expiresAt > now && data.holder !== instance) {
        return false;
      }
      tx.set(ref, { holder: instance, expiresAt: now + leaseMs, updatedAt: now });
      return true;
    });
  } catch (err) {
    console.warn(`[LeaderLock] ${lockId} failed — skipping tick`, err);
    return false;
  }
}
