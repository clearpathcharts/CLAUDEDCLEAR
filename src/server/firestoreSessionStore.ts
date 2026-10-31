/**
 * express-session store backed by Firestore — survives Cloud Run multi-instance traffic.
 * Falls back to in-process Map when Firestore Admin is offline (dev / CI only).
 */
import type { Store } from 'express-session';
import session from 'express-session';
import { getAdminFirestore } from './firebaseAdmin';

/** Login cookies only. Never private_accounts / waitlist / profiles. */
export const EXPRESS_SESSIONS_COLLECTION = 'express_sessions';
const COLLECTION = EXPRESS_SESSIONS_COLLECTION;

let memoryFallback: MemorySessionFallback | null = null;

type StoredSession = {
  json: string;
  expiresAt: number;
};

function sessionBelongsTo(json: string, email: string): boolean {
  try {
    const parsed = JSON.parse(json) as { privateUser?: { email?: unknown } };
    return String(parsed?.privateUser?.email || '').trim().toLowerCase() === email;
  } catch {
    return false;
  }
}

class MemorySessionFallback extends session.Store {
  private readonly rows = new Map<string, StoredSession>();

  get(sid: string, callback: (err: unknown, session?: session.SessionData | null) => void) {
    try {
      const row = this.rows.get(sid);
      if (!row || row.expiresAt <= Date.now()) {
        this.rows.delete(sid);
        return callback(null, null);
      }
      callback(null, JSON.parse(row.json) as session.SessionData);
    } catch (err) {
      callback(err);
    }
  }

  set(sid: string, sess: session.SessionData, callback?: (err?: unknown) => void) {
    try {
      const maxAge = typeof sess.cookie?.maxAge === 'number' ? sess.cookie.maxAge : 7 * 86400_000;
      this.rows.set(sid, { json: JSON.stringify(sess), expiresAt: Date.now() + maxAge });
      callback?.();
    } catch (err) {
      callback?.(err);
    }
  }

  destroy(sid: string, callback?: (err?: unknown) => void) {
    this.rows.delete(sid);
    callback?.();
  }

  touch(sid: string, sess: session.SessionData, callback?: (err?: unknown) => void) {
    this.set(sid, sess, callback);
  }

  size(): number {
    return this.rows.size;
  }

  clearForEmail(email: string): number {
    let n = 0;
    for (const [sid, row] of this.rows) {
      if (sessionBelongsTo(row.json, email)) {
        this.rows.delete(sid);
        n += 1;
      }
    }
    return n;
  }

  clearAll(): number {
    const n = this.rows.size;
    this.rows.clear();
    return n;
  }
}

class FirestoreSessionStore extends session.Store {
  get(sid: string, callback: (err: unknown, session?: session.SessionData | null) => void) {
    const db = getAdminFirestore();
    if (!db) return callback(new Error('Firestore unavailable'));
    void db
      .collection(COLLECTION)
      .doc(sid)
      .get()
      .then((snap) => {
        if (!snap.exists) return callback(null, null);
        const data = snap.data() as StoredSession | undefined;
        if (!data?.json || !data.expiresAt || data.expiresAt <= Date.now()) {
          void snap.ref.delete().catch(() => {});
          return callback(null, null);
        }
        callback(null, JSON.parse(data.json) as session.SessionData);
      })
      .catch((err) => callback(err));
  }

  set(sid: string, sess: session.SessionData, callback?: (err?: unknown) => void) {
    const db = getAdminFirestore();
    if (!db) return callback?.(new Error('Firestore unavailable'));
    try {
      const maxAge = typeof sess.cookie?.maxAge === 'number' ? sess.cookie.maxAge : 7 * 86400_000;
      const payload: StoredSession = {
        json: JSON.stringify(sess),
        expiresAt: Date.now() + maxAge,
      };
      void db
        .collection(COLLECTION)
        .doc(sid)
        .set(payload)
        .then(() => callback?.())
        .catch((err) => callback?.(err));
    } catch (err) {
      callback?.(err);
    }
  }

  destroy(sid: string, callback?: (err?: unknown) => void) {
    const db = getAdminFirestore();
    if (!db) return callback?.(new Error('Firestore unavailable'));
    void db
      .collection(COLLECTION)
      .doc(sid)
      .delete()
      .then(() => callback?.())
      .catch((err) => callback?.(err));
  }

  touch(sid: string, sess: session.SessionData, callback?: (err?: unknown) => void) {
    this.set(sid, sess, callback);
  }
}

/**
 * The session middleware is wired before `probeAdminFirestore()` resolves, so the
 * backend is chosen per call: Firestore once durable, memory until then (and in dev/CI).
 * Sessions written to memory during the boot window are still readable afterwards.
 */
class AdaptiveSessionStore extends session.Store {
  private readonly durable = new FirestoreSessionStore();
  private announcedDurable = false;

  constructor(private readonly memory: MemorySessionFallback) {
    super();
  }

  private useDurable(): boolean {
    const ok = getAdminFirestore() !== null;
    if (ok && !this.announcedDurable) {
      this.announcedDurable = true;
      console.log('[Session] Firestore session store active (multi-instance safe)');
    }
    return ok;
  }

  get(sid: string, callback: (err: unknown, session?: session.SessionData | null) => void) {
    if (!this.useDurable()) return this.memory.get(sid, callback);
    this.durable.get(sid, (err, sess) => {
      if (err || sess) return callback(err, sess);
      this.memory.get(sid, callback);
    });
  }

  set(sid: string, sess: session.SessionData, callback?: (err?: unknown) => void) {
    if (!this.useDurable()) return this.memory.set(sid, sess, callback);
    this.memory.destroy(sid);
    this.durable.set(sid, sess, callback);
  }

  destroy(sid: string, callback?: (err?: unknown) => void) {
    this.memory.destroy(sid);
    if (!this.useDurable()) return callback?.();
    this.durable.destroy(sid, callback);
  }

  touch(sid: string, sess: session.SessionData, callback?: (err?: unknown) => void) {
    this.set(sid, sess, callback);
  }
}

/** Firestore when Admin is durable, in-memory until then (dev / CI / boot window). */
export function createSessionStore(): Store {
  memoryFallback = new MemorySessionFallback();
  if (!getAdminFirestore()) {
    console.log('[Session] Firestore not probed yet — memory until durable store is ready.');
  }
  return new AdaptiveSessionStore(memoryFallback);
}

/** Sign one member out everywhere (e.g. after a password reset). Login cookies only. */
export async function purgeSessionsForEmail(rawEmail: string): Promise<number> {
  const email = String(rawEmail || '').trim().toLowerCase();
  if (!email.includes('@')) return 0;
  let deleted = memoryFallback?.clearForEmail(email) ?? 0;
  const db = getAdminFirestore();
  if (!db) return deleted;
  const snap = await db.collection(COLLECTION).get();
  const mine = snap.docs.filter((doc) => sessionBelongsTo(String((doc.data() as StoredSession)?.json || ''), email));
  for (let i = 0; i < mine.length; i += 400) {
    const batch = db.batch();
    for (const doc of mine.slice(i, i + 400)) batch.delete(doc.ref);
    await batch.commit();
  }
  return deleted + mine.length;
}

/** Delete login cookies only. Never touches private_accounts, waitlist, or profiles. */
export async function purgeExpressSessionCookiesOnly(): Promise<{
  deleted: number;
  source: 'firestore' | 'memory' | 'none';
}> {
  const db = getAdminFirestore();
  if (db) {
    const snap = await db.collection(COLLECTION).get();
    let deleted = memoryFallback?.clearAll() ?? 0;
    const chunk = 400;
    for (let i = 0; i < snap.docs.length; i += chunk) {
      const batch = db.batch();
      for (const doc of snap.docs.slice(i, i + chunk)) {
        batch.delete(doc.ref);
        deleted += 1;
      }
      await batch.commit();
    }
    return { deleted, source: 'firestore' };
  }
  if (memoryFallback) {
    return { deleted: memoryFallback.clearAll(), source: 'memory' };
  }
  return { deleted: 0, source: 'none' };
}
