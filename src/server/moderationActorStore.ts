/**
 * Moderation actor state — memory L1 + Firestore for multi-instance mutes/suspensions.
 */
import { getAdminFirestore } from './firebaseAdmin';

export type ModerationActorRecord = {
  count: number;
  firstAt: number;
  lastAt: number;
  mutedUntil?: number;
  suspended?: boolean;
};

const COLLECTION = 'moderation_actors';
const memory = new Map<string, ModerationActorRecord>();

export function readModerationActorLocal(actorKey: string): ModerationActorRecord | null {
  return memory.get(actorKey) ?? null;
}

export async function hydrateModerationActor(actorKey: string): Promise<ModerationActorRecord | null> {
  const cached = memory.get(actorKey);
  if (cached) return cached;

  const db = getAdminFirestore();
  if (!db) return null;
  try {
    const snap = await db.collection(COLLECTION).doc(actorKey.slice(0, 256)).get();
    if (!snap.exists) return null;
    const rec = snap.data() as ModerationActorRecord;
    if (rec && typeof rec.count === 'number') {
      memory.set(actorKey, rec);
      return rec;
    }
  } catch (err) {
    console.warn('[Moderation] Firestore actor hydrate failed', err);
  }
  return null;
}

export async function persistModerationActor(
  actorKey: string,
  rec: ModerationActorRecord,
): Promise<void> {
  memory.set(actorKey, rec);
  const db = getAdminFirestore();
  if (!db) return;
  try {
    await db.collection(COLLECTION).doc(actorKey.slice(0, 256)).set(rec, { merge: true });
  } catch (err) {
    console.warn('[Moderation] Firestore actor persist failed', err);
  }
}

export function clearModerationActorLocal(actorKey: string): void {
  memory.delete(actorKey);
}
