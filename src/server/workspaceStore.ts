/**
 * GoogleDesk workspace persistence (saved Drive/Sheet/Course assets + notes).
 *
 * Backend order — every call is scoped to the verified uid supplied by the route:
 *   1) Postgres / Cloud SQL, only when SQL_HOST is configured
 *   2) Firestore (Admin SDK, probed durable) under workspace_users/{uid}/...
 *   3) Local JSON file — non-production only (credential-less dev, CI)
 * Production with neither SQL nor Firestore reports "unavailable" instead of a raw 500.
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { and, eq } from 'drizzle-orm';
import { getAdminFirestore } from './firebaseAdmin';
import { getDb, isSqlConfigured, schema } from '../db';

export type WorkspaceBackend = 'postgres' | 'firestore' | 'local' | 'unavailable';

export type WorkspaceAsset = {
  id: number;
  assetId: string;
  title: string;
  type: string;
  createdAt: string | Date | null;
};

export type WorkspaceNote = {
  id: number;
  associatedId: string;
  content: string;
  createdAt: string | Date | null;
};

export type AddAssetResult = 'created' | 'exists';

export interface WorkspaceStore {
  readonly backend: Exclude<WorkspaceBackend, 'unavailable'>;
  listAssets(uid: string): Promise<WorkspaceAsset[]>;
  addAsset(uid: string, input: { email?: string; assetId: string; title: string; type: string }): Promise<AddAssetResult>;
  deleteAsset(uid: string, id: number): Promise<boolean>;
  listNotes(uid: string): Promise<WorkspaceNote[]>;
  upsertNote(uid: string, associatedId: string, content: string): Promise<void>;
}

export const WORKSPACE_LIMITS = {
  assetId: 256,
  title: 500,
  type: 40,
  associatedId: 256,
  noteContent: 20_000,
  email: 320,
} as const;

export class WorkspaceInputError extends Error {}

export function validateAssetInput(body: unknown): { email?: string; assetId: string; title: string; type: string } {
  const b = (body && typeof body === 'object' ? body : {}) as Record<string, unknown>;
  const assetId = typeof b.assetId === 'string' ? b.assetId.trim() : '';
  const title = typeof b.title === 'string' ? b.title.trim() : '';
  const type = typeof b.type === 'string' ? b.type.trim() : '';
  if (!assetId || !title || !type) {
    throw new WorkspaceInputError('Missing required field in request body');
  }
  if (
    assetId.length > WORKSPACE_LIMITS.assetId ||
    title.length > WORKSPACE_LIMITS.title ||
    type.length > WORKSPACE_LIMITS.type
  ) {
    throw new WorkspaceInputError('Field too long in request body');
  }
  const email = typeof b.email === 'string' ? b.email.trim().slice(0, WORKSPACE_LIMITS.email) : undefined;
  return { email: email || undefined, assetId, title, type };
}

export function validateNoteInput(body: unknown): { associatedId: string; content: string } {
  const b = (body && typeof body === 'object' ? body : {}) as Record<string, unknown>;
  const associatedId = typeof b.associatedId === 'string' ? b.associatedId.trim() : '';
  if (!associatedId) throw new WorkspaceInputError('Missing required parameters');
  if (associatedId.length > WORKSPACE_LIMITS.associatedId) {
    throw new WorkspaceInputError('associatedId too long');
  }
  const content = typeof b.content === 'string' ? b.content : '';
  if (content.length > WORKSPACE_LIMITS.noteContent) {
    throw new WorkspaceInputError('Note too long');
  }
  return { associatedId, content };
}

function isProdEnv(): boolean {
  return process.env.NODE_ENV === 'production';
}

let lastIssuedId = 0;
/** Numeric ids keep the existing client contract (DELETE /api/workspace/assets/:id). */
function newNumericId(): number {
  const candidate = Date.now() * 1000 + crypto.randomInt(0, 1000);
  lastIssuedId = candidate > lastIssuedId ? candidate : lastIssuedId + 1;
  return lastIssuedId;
}

function b64(value: string, prefix: string): string {
  return `${prefix}${Buffer.from(value, 'utf8').toString('base64url')}`;
}

// ——— Postgres ———

function createPostgresStore(): WorkspaceStore {
  return {
    backend: 'postgres',
    async listAssets(uid) {
      const db = getDb();
      const user = await db.query.users.findFirst({ where: eq(schema.users.uid, uid) });
      if (!user) return [];
      const rows = await db.select().from(schema.googleAssets).where(eq(schema.googleAssets.userId, user.id));
      return rows.map((r) => ({ id: r.id, assetId: r.assetId, title: r.title, type: r.type, createdAt: r.createdAt }));
    },
    async addAsset(uid, input) {
      const db = getDb();
      let user = await db.query.users.findFirst({ where: eq(schema.users.uid, uid) });
      if (!user) {
        const [inserted] = await db
          .insert(schema.users)
          .values({ uid, email: input.email || 'anonymous@gmail.com' })
          .returning();
        user = inserted;
      }
      const exists = await db
        .select()
        .from(schema.googleAssets)
        .where(and(eq(schema.googleAssets.userId, user.id), eq(schema.googleAssets.assetId, input.assetId)));
      if (exists.length > 0) return 'exists';
      await db.insert(schema.googleAssets).values({
        userId: user.id,
        assetId: input.assetId,
        title: input.title,
        type: input.type,
      });
      return 'created';
    },
    async deleteAsset(uid, id) {
      const db = getDb();
      const user = await db.query.users.findFirst({ where: eq(schema.users.uid, uid) });
      if (!user) return false;
      const owned = await db
        .select()
        .from(schema.googleAssets)
        .where(and(eq(schema.googleAssets.id, id), eq(schema.googleAssets.userId, user.id)));
      if (!owned.length) return false;
      await db
        .delete(schema.googleAssets)
        .where(and(eq(schema.googleAssets.id, id), eq(schema.googleAssets.userId, user.id)));
      return true;
    },
    async listNotes(uid) {
      const db = getDb();
      const user = await db.query.users.findFirst({ where: eq(schema.users.uid, uid) });
      if (!user) return [];
      const rows = await db.select().from(schema.workspaceNotes).where(eq(schema.workspaceNotes.userId, user.id));
      return rows.map((r) => ({
        id: r.id,
        associatedId: r.associatedId,
        content: r.content,
        createdAt: r.createdAt,
      }));
    },
    async upsertNote(uid, associatedId, content) {
      const db = getDb();
      let user = await db.query.users.findFirst({ where: eq(schema.users.uid, uid) });
      if (!user) {
        const [inserted] = await db
          .insert(schema.users)
          .values({ uid, email: 'anonymous@gmail.com' })
          .returning();
        user = inserted;
      }
      const existing = await db
        .select()
        .from(schema.workspaceNotes)
        .where(and(eq(schema.workspaceNotes.userId, user.id), eq(schema.workspaceNotes.associatedId, associatedId)));
      if (existing.length > 0) {
        await db
          .update(schema.workspaceNotes)
          .set({ content })
          .where(and(eq(schema.workspaceNotes.userId, user.id), eq(schema.workspaceNotes.associatedId, associatedId)));
      } else {
        await db.insert(schema.workspaceNotes).values({ userId: user.id, associatedId, content });
      }
    },
  };
}

// ——— Firestore ———

/** Structural subset of the Admin SDK Firestore used here (lets the self-test inject a fake). */
export type WorkspaceFirestore = {
  collection(name: string): {
    doc(id: string): {
      collection(name: string): WorkspaceCollection;
    };
  };
};
type WorkspaceCollection = {
  doc(id: string): {
    get(): Promise<{ exists: boolean; data(): Record<string, any> | undefined }>;
    set(data: Record<string, unknown>): Promise<unknown>;
    create(data: Record<string, unknown>): Promise<unknown>;
    delete(): Promise<unknown>;
  };
  get(): Promise<{ docs: Array<{ id: string; data(): Record<string, any> }> }>;
};

const FS_ROOT = 'workspace_users';

function isAlreadyExists(err: any): boolean {
  return err?.code === 6 || err?.code === 'already-exists' || /already exists/i.test(String(err?.message || ''));
}

export function createFirestoreStore(getDbFn: () => WorkspaceFirestore | null): WorkspaceStore {
  const userDoc = (uid: string) => {
    const db = getDbFn();
    if (!db) throw new Error('Firestore unavailable');
    return db.collection(FS_ROOT).doc(b64(uid, 'u_'));
  };
  return {
    backend: 'firestore',
    async listAssets(uid) {
      const snap = await userDoc(uid).collection('assets').get();
      return snap.docs
        .map((d) => d.data())
        .map((d) => ({
          id: Number(d.id),
          assetId: String(d.assetId),
          title: String(d.title),
          type: String(d.type),
          createdAt: d.createdAt ?? null,
        }))
        .sort((a, b) => a.id - b.id);
    },
    async addAsset(uid, input) {
      const ref = userDoc(uid).collection('assets').doc(b64(input.assetId, 'a_'));
      try {
        await ref.create({
          id: newNumericId(),
          assetId: input.assetId,
          title: input.title,
          type: input.type,
          createdAt: new Date().toISOString(),
        });
        return 'created';
      } catch (err) {
        if (isAlreadyExists(err)) return 'exists';
        throw err;
      }
    },
    async deleteAsset(uid, id) {
      const assets = userDoc(uid).collection('assets');
      const snap = await assets.get();
      const match = snap.docs.find((d) => Number(d.data().id) === id);
      if (!match) return false;
      await assets.doc(match.id).delete();
      return true;
    },
    async listNotes(uid) {
      const snap = await userDoc(uid).collection('notes').get();
      return snap.docs
        .map((d) => d.data())
        .map((d) => ({
          id: Number(d.id),
          associatedId: String(d.associatedId),
          content: String(d.content),
          createdAt: d.createdAt ?? null,
        }))
        .sort((a, b) => a.id - b.id);
    },
    async upsertNote(uid, associatedId, content) {
      const ref = userDoc(uid).collection('notes').doc(b64(associatedId, 'n_'));
      const existing = await ref.get();
      const prior = existing.exists ? existing.data() : undefined;
      await ref.set({
        id: prior?.id ?? newNumericId(),
        associatedId,
        content,
        createdAt: prior?.createdAt ?? new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    },
  };
}

// ——— Local file (dev / credential-less) ———

type LocalShape = Record<string, { assets: WorkspaceAsset[]; notes: WorkspaceNote[] }>;

function localFilePath(): string {
  const dir = (process.env.CLEARPATH_WORKSPACE_DATA_DIR || '').trim() || path.join(process.cwd(), 'data', 'workspace');
  return path.join(dir, 'workspace.json');
}

function readLocal(): LocalShape {
  try {
    const parsed = JSON.parse(fs.readFileSync(localFilePath(), 'utf8'));
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? (parsed as LocalShape) : {};
  } catch {
    return {};
  }
}

function writeLocal(data: LocalShape) {
  const file = localFilePath();
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const tmp = `${file}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2));
  fs.renameSync(tmp, file);
}

function bucket(data: LocalShape, uid: string) {
  // Own-property check: a uid like "__proto__" must not reach Object.prototype.
  if (!Object.prototype.hasOwnProperty.call(data, uid)) {
    Object.defineProperty(data, uid, {
      value: { assets: [], notes: [] },
      enumerable: true,
      writable: true,
      configurable: true,
    });
  }
  return data[uid];
}

function createLocalStore(): WorkspaceStore {
  return {
    backend: 'local',
    async listAssets(uid) {
      return [...bucket(readLocal(), uid).assets];
    },
    async addAsset(uid, input) {
      const data = readLocal();
      const mine = bucket(data, uid);
      if (mine.assets.some((a) => a.assetId === input.assetId)) return 'exists';
      mine.assets.push({
        id: newNumericId(),
        assetId: input.assetId,
        title: input.title,
        type: input.type,
        createdAt: new Date().toISOString(),
      });
      writeLocal(data);
      return 'created';
    },
    async deleteAsset(uid, id) {
      const data = readLocal();
      const mine = bucket(data, uid);
      const next = mine.assets.filter((a) => a.id !== id);
      if (next.length === mine.assets.length) return false;
      mine.assets = next;
      writeLocal(data);
      return true;
    },
    async listNotes(uid) {
      return [...bucket(readLocal(), uid).notes];
    },
    async upsertNote(uid, associatedId, content) {
      const data = readLocal();
      const mine = bucket(data, uid);
      const existing = mine.notes.find((n) => n.associatedId === associatedId);
      if (existing) existing.content = content;
      else {
        mine.notes.push({ id: newNumericId(), associatedId, content, createdAt: new Date().toISOString() });
      }
      writeLocal(data);
    },
  };
}

// ——— Selection ———

export function resolveWorkspaceBackend(): WorkspaceBackend {
  if (isSqlConfigured()) return 'postgres';
  if (getAdminFirestore()) return 'firestore';
  return isProdEnv() ? 'unavailable' : 'local';
}

export function getWorkspaceStore(): WorkspaceStore | null {
  switch (resolveWorkspaceBackend()) {
    case 'postgres':
      return createPostgresStore();
    case 'firestore':
      return createFirestoreStore(() => getAdminFirestore() as unknown as WorkspaceFirestore | null);
    case 'local':
      return createLocalStore();
    default:
      return null;
  }
}

export function createLocalWorkspaceStoreForTests(): WorkspaceStore {
  return createLocalStore();
}
