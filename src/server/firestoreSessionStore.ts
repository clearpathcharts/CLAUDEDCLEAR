/**
 * express-session store backed by Firestore — survives Cloud Run multi-instance traffic.
 * Falls back to in-process Map when Firestore Admin is offline (dev / CI only).
 */
import type { Store } from 'express-session';
import session from 'express-session';
import { getAdminFirestore } from './firebaseAdmin';

const COLLECTION = 'express_sessions';

type StoredSession = {
  json: string;
  expiresAt: number;
};

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

/** Prefer Firestore; warn and use memory when Admin is offline. */
export function createSessionStore(): Store {
  const db = getAdminFirestore();
  if (db) {
    console.log('[Session] Using Firestore session store (multi-instance safe)');
    return new FirestoreSessionStore();
  }
  console.warn(
    '[Session] Firestore Admin offline — in-memory sessions only (single Cloud Run instance / dev).'
  );
  return new MemorySessionFallback();
}
