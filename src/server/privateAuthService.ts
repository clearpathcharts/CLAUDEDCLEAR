/**
 * ClearPath Trader — Private account auth (email + password).
 * Durable store: Firestore `private_accounts` when Admin is available;
 * local file fallback for offline/local dev. Write-through keeps both in sync.
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { promisify } from 'node:util';
import { getAdminFirestore } from './firebaseAdmin';

const scrypt = promisify(crypto.scrypt);

export type PrivateUserRecord = {
  uid: string;
  email: string;
  displayName: string;
  passwordHash: string;
  passwordSalt: string;
  createdAt: string;
  lastLoginAt?: string;
};

export type PublicPrivateUser = {
  uid: string;
  email: string;
  displayName: string;
};

export class PrivateAuthError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

const COLLECTION = 'private_accounts';
const DATA_DIR = path.join(process.cwd(), 'data', 'private_accounts');
const USERS_FILE = 'users.json';

let migrateAttempted = false;

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function normalizeEmail(email: string): string {
  return (email || '').trim().toLowerCase();
}

function readLocalUsers(): PrivateUserRecord[] {
  ensureDataDir();
  const filePath = path.join(DATA_DIR, USERS_FILE);
  if (!fs.existsSync(filePath)) return [];
  try {
    const parsed = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeLocalUsers(users: PrivateUserRecord[]) {
  ensureDataDir();
  fs.writeFileSync(path.join(DATA_DIR, USERS_FILE), JSON.stringify(users, null, 2));
}

function toPublic(user: PrivateUserRecord): PublicPrivateUser {
  return {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
  };
}

function docToRecord(data: Record<string, unknown>): PrivateUserRecord | null {
  const email = normalizeEmail(String(data.email || ''));
  const uid = String(data.uid || '').trim();
  const displayName = String(data.displayName || '').trim();
  const passwordHash = String(data.passwordHash || '');
  const passwordSalt = String(data.passwordSalt || '');
  const createdAt = String(data.createdAt || '');
  if (!email || !uid || !passwordHash || !passwordSalt) return null;
  const record: PrivateUserRecord = {
    uid,
    email,
    displayName: displayName || email.split('@')[0] || 'Member',
    passwordHash,
    passwordSalt,
    createdAt: createdAt || new Date().toISOString(),
  };
  if (typeof data.lastLoginAt === 'string' && data.lastLoginAt.trim()) {
    record.lastLoginAt = data.lastLoginAt.trim();
  }
  return record;
}

async function readFirestoreUsers(): Promise<PrivateUserRecord[] | null> {
  const db = getAdminFirestore();
  if (!db) return null;
  try {
    const snapshot = await db.collection(COLLECTION).limit(2000).get();
    const users: PrivateUserRecord[] = [];
    for (const doc of snapshot.docs) {
      const record = docToRecord(doc.data() as Record<string, unknown>);
      if (record) users.push(record);
    }
    return users;
  } catch (err) {
    console.warn('[privateAuth] Firestore list failed; using local file.', err);
    return null;
  }
}

async function findFirestoreUserByEmail(email: string): Promise<PrivateUserRecord | null> {
  const db = getAdminFirestore();
  if (!db) return null;
  const normalized = normalizeEmail(email);
  try {
    const byId = await db.collection(COLLECTION).doc(normalized).get();
    if (byId.exists) {
      const record = docToRecord(byId.data() as Record<string, unknown>);
      if (record) return record;
    }
    const snapshot = await db
      .collection(COLLECTION)
      .where('email', '==', normalized)
      .limit(1)
      .get();
    if (snapshot.empty) return null;
    return docToRecord(snapshot.docs[0]!.data() as Record<string, unknown>);
  } catch (err) {
    console.warn('[privateAuth] Firestore email lookup failed.', err);
    return null;
  }
}

async function upsertFirestoreUser(user: PrivateUserRecord): Promise<boolean> {
  const db = getAdminFirestore();
  if (!db) return false;
  try {
    const payload: Record<string, unknown> = {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      passwordHash: user.passwordHash,
      passwordSalt: user.passwordSalt,
      createdAt: user.createdAt,
    };
    if (user.lastLoginAt) payload.lastLoginAt = user.lastLoginAt;
    await db.collection(COLLECTION).doc(user.email).set(payload, { merge: true });
    return true;
  } catch (err) {
    console.warn('[privateAuth] Firestore upsert failed; local file still written.', err);
    return false;
  }
}

function upsertLocalUser(user: PrivateUserRecord) {
  const users = readLocalUsers();
  const idx = users.findIndex((u) => u.email === user.email || u.uid === user.uid);
  if (idx >= 0) users[idx] = user;
  else users.push(user);
  writeLocalUsers(users);
}

async function hashPassword(password: string, salt?: string): Promise<{ hash: string; salt: string }> {
  const useSalt = salt || crypto.randomBytes(16).toString('hex');
  const derived = (await scrypt(password, useSalt, 64)) as Buffer;
  return { hash: derived.toString('hex'), salt: useSalt };
}

/**
 * One-shot boot migration: push any local-file users into Firestore,
 * then refresh the local cache from Firestore when available.
 */
export async function migratePrivateAccountsToDurableStore(): Promise<{
  source: 'firestore' | 'local' | 'none';
  migrated: number;
  total: number;
}> {
  if (migrateAttempted) {
    const local = readLocalUsers();
    const remote = await readFirestoreUsers();
    return {
      source: remote ? 'firestore' : local.length ? 'local' : 'none',
      migrated: 0,
      total: remote?.length ?? local.length,
    };
  }
  migrateAttempted = true;

  const local = readLocalUsers();
  const db = getAdminFirestore();
  let migrated = 0;

  if (db && local.length) {
    const remote = (await readFirestoreUsers()) || [];
    const remoteEmails = new Set(remote.map((u) => u.email));
    for (const user of local) {
      if (!remoteEmails.has(user.email)) {
        const ok = await upsertFirestoreUser(user);
        if (ok) migrated += 1;
      }
    }
  }

  const remoteAfter = await readFirestoreUsers();
  if (remoteAfter && remoteAfter.length) {
    writeLocalUsers(remoteAfter);
    return { source: 'firestore', migrated, total: remoteAfter.length };
  }

  return {
    source: local.length ? 'local' : 'none',
    migrated,
    total: local.length,
  };
}

export function getPrivateStorageMeta(): {
  privateStorage: 'firestore' | 'local_file' | 'none';
  privatePath: string;
  privateCollection: string;
  persistenceWarning?: string;
} {
  const db = getAdminFirestore();
  if (db) {
    return {
      privateStorage: 'firestore',
      privatePath: 'data/private_accounts/users.json (local cache)',
      privateCollection: COLLECTION,
    };
  }
  const local = readLocalUsers();
  return {
    privateStorage: local.length ? 'local_file' : 'none',
    privatePath: 'data/private_accounts/users.json',
    privateCollection: COLLECTION,
    persistenceWarning:
      'Private accounts are on the local filesystem only (no Firebase Admin). On Cloud Run without Firestore, this list resets when the revision is replaced.',
  };
}

/** Existence check only — never leak displayName (email enumeration hardening). */
export async function lookupPrivateUser(email: string): Promise<{
  exists: boolean;
}> {
  const normalized = normalizeEmail(email);
  if (!normalized || !normalized.includes('@')) {
    throw new PrivateAuthError('Enter a valid email address.');
  }
  const remote = await findFirestoreUserByEmail(normalized);
  if (remote) return { exists: true };
  const local = readLocalUsers().find((u) => u.email === normalized);
  return { exists: Boolean(local) };
}

/** Admin-only: resolve uid for grant/badge tooling. Prefer durable store. */
export async function findPrivateUserByEmail(email: string): Promise<PublicPrivateUser | null> {
  const normalized = normalizeEmail(email);
  if (!normalized.includes('@')) return null;
  const remote = await findFirestoreUserByEmail(normalized);
  if (remote) return toPublic(remote);
  const found = readLocalUsers().find((u) => u.email === normalized);
  return found ? toPublic(found) : null;
}

/** Sync fallback for rare boot paths before migrate — local file only. */
export function findPrivateUserByEmailLocal(email: string): PublicPrivateUser | null {
  const normalized = normalizeEmail(email);
  if (!normalized.includes('@')) return null;
  const found = readLocalUsers().find((u) => u.email === normalized);
  return found ? toPublic(found) : null;
}

/** Founder/admin-only safe projection — never includes passwordHash / passwordSalt. */
export type SafePrivateMember = {
  uid: string;
  email: string;
  displayName: string;
  createdAt: string;
  lastLoginAt?: string;
  source?: 'firestore' | 'local';
};

function toSafeMember(u: PrivateUserRecord, source: 'firestore' | 'local'): SafePrivateMember {
  const row: SafePrivateMember = {
    uid: u.uid,
    email: u.email,
    displayName: u.displayName,
    createdAt: u.createdAt,
    source,
  };
  if (u.lastLoginAt) row.lastLoginAt = u.lastLoginAt;
  return row;
}

/** Read-only member list for CEO Dashboard. Strips all secret fields. */
export async function listPrivateMembersSafe(): Promise<{
  members: SafePrivateMember[];
  source: 'firestore' | 'local' | 'none';
}> {
  const remote = await readFirestoreUsers();
  const local = readLocalUsers();

  if (remote && remote.length > 0) {
    const members = remote
      .map((u) => toSafeMember(u, 'firestore'))
      .sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')));
    return { members, source: 'firestore' };
  }

  // Firestore reachable but empty → still surface local (pre-migrate / offline writes).
  if (local.length > 0) {
    const members = local
      .map((u) => toSafeMember(u, 'local'))
      .sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')));
    return { members, source: remote ? 'local' : 'local' };
  }

  if (remote) {
    return { members: [], source: 'firestore' };
  }
  return { members: [], source: 'none' };
}

/**
 * Create a private account (local + Firestore write-through).
 * Used by public register and founder waitlist conversion.
 */
export async function provisionPrivateUser(input: {
  email: string;
  password: string;
  displayName: string;
}): Promise<PublicPrivateUser> {
  const email = normalizeEmail(input.email);
  const displayName = (input.displayName || '').trim();
  const password = input.password || '';

  if (!email.includes('@')) throw new PrivateAuthError('Enter a valid email address.');
  if (displayName.length < 2) throw new PrivateAuthError('Display name must be at least 2 characters.');
  if (password.length < 8) throw new PrivateAuthError('Password must be at least 8 characters.');

  const existingRemote = await findFirestoreUserByEmail(email);
  const existingLocal = readLocalUsers().find((u) => u.email === email);
  if (existingRemote || existingLocal) {
    throw new PrivateAuthError('An account with this email already exists. Use Private Login.', 409);
  }

  const { hash, salt } = await hashPassword(password);
  const record: PrivateUserRecord = {
    uid: `cpt_${crypto.randomBytes(12).toString('hex')}`,
    email,
    displayName,
    passwordHash: hash,
    passwordSalt: salt,
    createdAt: new Date().toISOString(),
  };
  upsertLocalUser(record);
  await upsertFirestoreUser(record);
  return toPublic(record);
}

export async function registerPrivateUser(input: {
  email: string;
  password: string;
  displayName: string;
}): Promise<PublicPrivateUser> {
  return provisionPrivateUser(input);
}

export async function loginPrivateUser(input: {
  email: string;
  password: string;
}): Promise<PublicPrivateUser> {
  const email = normalizeEmail(input.email);
  const password = input.password || '';
  if (!email.includes('@') || !password) {
    throw new PrivateAuthError('Email and password are required.');
  }

  const found =
    (await findFirestoreUserByEmail(email)) ||
    readLocalUsers().find((u) => u.email === email) ||
    null;
  // Generic messages — avoid confirming whether the email is registered.
  if (!found) throw new PrivateAuthError('Invalid email or password.', 401);

  const { hash } = await hashPassword(password, found.passwordSalt);
  const a = Buffer.from(hash, 'hex');
  const b = Buffer.from(found.passwordHash, 'hex');
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    throw new PrivateAuthError('Invalid email or password.', 401);
  }

  found.lastLoginAt = new Date().toISOString();
  upsertLocalUser(found);
  await upsertFirestoreUser(found);
  return toPublic(found);
}

/**
 * Admin-only: reset an existing member's password (founder console / support).
 * Rehashes and writes through to both local file and Firestore. Throws 404 when
 * the account does not exist. Never used by unauthenticated routes.
 */
export async function resetPrivateUserPassword(input: {
  email: string;
  newPassword: string;
}): Promise<PublicPrivateUser> {
  const email = normalizeEmail(input.email);
  const newPassword = input.newPassword || '';
  if (!email.includes('@')) throw new PrivateAuthError('Enter a valid email address.');
  if (newPassword.length < 8) throw new PrivateAuthError('Password must be at least 8 characters.');

  const found =
    (await findFirestoreUserByEmail(email)) ||
    readLocalUsers().find((u) => u.email === email) ||
    null;
  if (!found) throw new PrivateAuthError('No account found for that email.', 404);

  const { hash, salt } = await hashPassword(newPassword);
  found.passwordHash = hash;
  found.passwordSalt = salt;
  upsertLocalUser(found);
  await upsertFirestoreUser(found);
  return toPublic(found);
}

/** Client-facing session payload stored in localStorage + mirrored in Express session */
export function buildClientSessionUser(user: PublicPrivateUser) {
  return {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
    isAnonymous: false,
    emailVerified: true,
    privateAccount: true,
  };
}
