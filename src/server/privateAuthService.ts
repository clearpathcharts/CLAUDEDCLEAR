/**
 * ClearPath Trader — Private account auth (email + password).
 * Durable stores (either is enough in production):
 *   1) Firestore `private_accounts` when Admin is available
 *   2) Stripe Customer metadata (STRIPE_SECRET_KEY) — survives Cloud Run redeploys
 * Local file is a cache / offline-dev fallback only — never source of truth in production.
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { promisify } from 'node:util';
import { getAdminFirestore, getFirebaseAdminStatus, isFirestoreDurableReady } from './firebaseAdmin';
import {
  findStripePrivateUserByEmail,
  listStripePrivateUsers,
  stripePrivateStoreConfigured,
  upsertStripePrivateUser,
} from './stripePrivateAccountStore';

const scrypt = promisify(crypto.scrypt);

function isProdEnv(): boolean {
  return process.env.NODE_ENV === 'production';
}

/** Test-only: simulate Cloud Run with Firestore Admin offline. */
let forceEphemeralForTests = false;
export function _forceEphemeralPrivateStoreForTests(value: boolean) {
  forceEphemeralForTests = value;
}

export function hasFirestoreDurableStore(): boolean {
  if (forceEphemeralForTests) return false;
  return isFirestoreDurableReady() && Boolean(getAdminFirestore());
}

/** True when Firestore Admin and/or Stripe can persist members across redeploys. */
export function hasDurablePrivateStore(): boolean {
  if (forceEphemeralForTests) return false;
  return hasFirestoreDurableStore() || stripePrivateStoreConfigured();
}

/**
 * Production hard-fail for mutating private-account paths when durable store is offline.
 * Dev/test may continue with the local file.
 */
export function assertDurablePrivateWritesAllowed(): void {
  if (!isProdEnv()) return;
  if (hasDurablePrivateStore()) return;
  const status = getFirebaseAdminStatus();
  throw new PrivateAuthError(
    `Private accounts require a durable store in production (Firestore Admin offline` +
      `${status.reason ? `: ${status.reason}` : ''}; Stripe also unavailable). ` +
      `Set STRIPE_SECRET_KEY and/or FIREBASE_SERVICE_ACCOUNT on Cloud Run.`,
    503
  );
}

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
  if (!hasFirestoreDurableStore()) return null;
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
  if (!hasFirestoreDurableStore()) return null;
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
  if (!hasFirestoreDurableStore()) return false;
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
    console.warn('[privateAuth] Firestore upsert failed.', err);
    return false;
  }
}

async function findDurableUserByEmail(email: string): Promise<PrivateUserRecord | null> {
  const fromFs = await findFirestoreUserByEmail(email);
  if (fromFs) return fromFs;
  const fromStripe = await findStripePrivateUserByEmail(email);
  if (!fromStripe) return null;
  return {
    uid: fromStripe.uid,
    email: fromStripe.email,
    displayName: fromStripe.displayName,
    passwordHash: fromStripe.passwordHash,
    passwordSalt: fromStripe.passwordSalt,
    createdAt: fromStripe.createdAt,
    ...(fromStripe.lastLoginAt ? { lastLoginAt: fromStripe.lastLoginAt } : {}),
  };
}

async function upsertDurableUser(
  user: PrivateUserRecord,
  opts?: { tempPassword?: string }
): Promise<boolean> {
  let ok = false;
  if (hasFirestoreDurableStore()) {
    ok = (await upsertFirestoreUser(user)) || ok;
  }
  if (stripePrivateStoreConfigured()) {
    const stripeOk = await upsertStripePrivateUser({
      ...user,
      ...(opts?.tempPassword ? { tempPassword: opts.tempPassword } : {}),
    });
    ok = stripeOk || ok;
  }
  return ok;
}

async function listDurableUsers(): Promise<PrivateUserRecord[] | null> {
  const byEmail = new Map<string, PrivateUserRecord>();
  let any = false;
  const fsUsers = await readFirestoreUsers();
  if (fsUsers) {
    any = true;
    for (const u of fsUsers) byEmail.set(u.email, u);
  }
  if (stripePrivateStoreConfigured()) {
    const stripeUsers = await listStripePrivateUsers({ max: 2000 });
    any = true;
    for (const u of stripeUsers) {
      if (!byEmail.has(u.email)) {
        byEmail.set(u.email, {
          uid: u.uid,
          email: u.email,
          displayName: u.displayName,
          passwordHash: u.passwordHash,
          passwordSalt: u.passwordSalt,
          createdAt: u.createdAt,
          ...(u.lastLoginAt ? { lastLoginAt: u.lastLoginAt } : {}),
        });
      }
    }
  }
  if (!any) return null;
  return [...byEmail.values()];
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
 * One-shot boot migration: push any local-file users into durable stores
 * (Firestore and/or Stripe), then refresh the local cache from durable data.
 */
export async function migratePrivateAccountsToDurableStore(): Promise<{
  source: 'firestore' | 'stripe' | 'local' | 'none';
  migrated: number;
  total: number;
}> {
  if (migrateAttempted) {
    const local = readLocalUsers();
    const remote = await listDurableUsers();
    return {
      source: hasFirestoreDurableStore()
        ? 'firestore'
        : stripePrivateStoreConfigured()
          ? 'stripe'
          : local.length
            ? 'local'
            : 'none',
      migrated: 0,
      total: remote?.length ?? local.length,
    };
  }
  migrateAttempted = true;

  const local = readLocalUsers();
  let migrated = 0;

  if (hasDurablePrivateStore() && local.length) {
    const remote = (await listDurableUsers()) || [];
    const remoteEmails = new Set(remote.map((u) => u.email));
    for (const user of local) {
      if (!remoteEmails.has(user.email)) {
        const ok = await upsertDurableUser(user);
        if (ok) migrated += 1;
      }
    }
  }

  const remoteAfter = await listDurableUsers();
  if (remoteAfter && remoteAfter.length) {
    writeLocalUsers(remoteAfter);
    return {
      source: hasFirestoreDurableStore() ? 'firestore' : 'stripe',
      migrated,
      total: remoteAfter.length,
    };
  }

  return {
    source: local.length ? 'local' : 'none',
    migrated,
    total: local.length,
  };
}

export function getPrivateStorageMeta(): {
  privateStorage: 'firestore' | 'stripe' | 'local_file' | 'none';
  privatePath: string;
  privateCollection: string;
  durable: boolean;
  writesAllowed: boolean;
  productionHardFail: boolean;
  stripeDurable: boolean;
  firebaseAdmin: ReturnType<typeof getFirebaseAdminStatus>;
  persistenceWarning?: string;
} {
  const admin = getFirebaseAdminStatus();
  const durable = hasDurablePrivateStore();
  const productionHardFail = isProdEnv() && !durable;
  const writesAllowed = durable || !isProdEnv();
  const stripeDurable = stripePrivateStoreConfigured() && !forceEphemeralForTests;

  if (hasFirestoreDurableStore()) {
    return {
      privateStorage: 'firestore',
      privatePath: 'data/private_accounts/users.json (local cache)',
      privateCollection: COLLECTION,
      durable: true,
      writesAllowed: true,
      productionHardFail: false,
      stripeDurable,
      firebaseAdmin: admin,
    };
  }

  if (stripeDurable) {
    return {
      privateStorage: 'stripe',
      privatePath: 'Stripe Customer metadata (cp_priv_*) + local cache',
      privateCollection: COLLECTION,
      durable: true,
      writesAllowed: true,
      productionHardFail: false,
      stripeDurable: true,
      firebaseAdmin: admin,
      persistenceWarning:
        'Firestore Admin offline — using Stripe Customer metadata as durable private-account store so Cloud Run redeploys cannot wipe members.',
    };
  }

  const local = readLocalUsers();
  const warning = productionHardFail
    ? 'PRODUCTION BLOCKED: No durable store (Firestore Admin offline and Stripe unavailable). Private register/login refuse local-only writes (Cloud Run disk is wiped on redeploy).'
    : 'Private accounts are on the local filesystem only. On Cloud Run without Firestore/Stripe, this list resets when the revision is replaced.';

  return {
    privateStorage: local.length ? 'local_file' : 'none',
    privatePath: 'data/private_accounts/users.json',
    privateCollection: COLLECTION,
    durable: false,
    writesAllowed,
    productionHardFail,
    stripeDurable: false,
    firebaseAdmin: admin,
    persistenceWarning: warning,
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
  if (isProdEnv() && !hasDurablePrivateStore()) {
    throw new PrivateAuthError(
      'Private account lookup unavailable: durable store is offline in production.',
      503
    );
  }
  const remote = await findDurableUserByEmail(normalized);
  if (remote) return { exists: true };
  if (isProdEnv()) return { exists: false };
  const local = readLocalUsers().find((u) => u.email === normalized);
  return { exists: Boolean(local) };
}

/** Admin-only: resolve uid for grant/badge tooling. Prefer durable store. */
export async function findPrivateUserByEmail(email: string): Promise<PublicPrivateUser | null> {
  const normalized = normalizeEmail(email);
  if (!normalized.includes('@')) return null;
  const remote = await findDurableUserByEmail(normalized);
  if (remote) return toPublic(remote);
  // Production: never treat ephemeral disk as source of truth.
  if (isProdEnv()) return null;
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
  source?: 'firestore' | 'stripe' | 'local';
};

function toSafeMember(
  u: PrivateUserRecord,
  source: 'firestore' | 'stripe' | 'local'
): SafePrivateMember {
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

/**
 * Founder disaster-recovery export — includes password hashes/salts from durable
 * store only. Never use for public APIs. Required so a wipe can be restored
 * without inventing emails.
 */
export async function exportPrivateAccountsForBackup(): Promise<{
  accounts: PrivateUserRecord[];
  source: 'firestore' | 'stripe' | 'local' | 'none';
}> {
  const remote = await listDurableUsers();
  if (remote && remote.length > 0) {
    const source: 'firestore' | 'stripe' = hasFirestoreDurableStore() ? 'firestore' : 'stripe';
    return {
      accounts: remote
        .slice()
        .sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || ''))),
      source,
    };
  }
  if (isProdEnv()) {
    return {
      accounts: [],
      source: hasFirestoreDurableStore() ? 'firestore' : stripePrivateStoreConfigured() ? 'stripe' : 'none',
    };
  }
  return { accounts: readLocalUsers(), source: 'local' };
}

/**
 * Founder restore of a single private account from disaster backup (hash/salt).
 * Upserts durable store — does not require knowing the plaintext password.
 */
export async function restorePrivateAccountFromBackup(input: {
  email: string;
  displayName?: string;
  uid?: string;
  passwordHash: string;
  passwordSalt: string;
  createdAt?: string;
  lastLoginAt?: string;
}): Promise<PublicPrivateUser> {
  assertDurablePrivateWritesAllowed();
  const email = normalizeEmail(input.email);
  const passwordHash = String(input.passwordHash || '').trim();
  const passwordSalt = String(input.passwordSalt || '').trim();
  if (!email.includes('@')) throw new PrivateAuthError('Enter a valid email address.');
  if (passwordHash.length < 16 || passwordSalt.length < 8) {
    throw new PrivateAuthError('Backup passwordHash/passwordSalt missing or invalid.');
  }

  const existing = await findDurableUserByEmail(email);
  const record: PrivateUserRecord = {
    uid: (input.uid || existing?.uid || `cpt_${crypto.randomBytes(12).toString('hex')}`).trim(),
    email,
    displayName:
      (input.displayName || existing?.displayName || email.split('@')[0] || 'Member').trim().slice(0, 80),
    passwordHash,
    passwordSalt,
    createdAt: (input.createdAt || existing?.createdAt || new Date().toISOString()).trim(),
  };
  if (input.lastLoginAt || existing?.lastLoginAt) {
    record.lastLoginAt = (input.lastLoginAt || existing?.lastLoginAt || '').trim();
  }

  const ok = await upsertDurableUser(record);
  if (!ok) {
    throw new PrivateAuthError('Failed to restore private account to durable store.', 503);
  }
  upsertLocalUser(record);
  return toPublic(record);
}

/** Read-only member list for CEO Dashboard. Strips all secret fields. */
export async function listPrivateMembersSafe(): Promise<{
  members: SafePrivateMember[];
  source: 'firestore' | 'stripe' | 'local' | 'none';
}> {
  const remote = await listDurableUsers();
  const local = readLocalUsers();
  const source: 'firestore' | 'stripe' | 'none' = hasFirestoreDurableStore()
    ? 'firestore'
    : stripePrivateStoreConfigured()
      ? 'stripe'
      : 'none';

  if (remote && remote.length > 0) {
    const members = remote
      .map((u) => toSafeMember(u, source === 'none' ? 'stripe' : source))
      .sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')));
    return { members, source: source === 'none' ? 'stripe' : source };
  }

  if (remote) {
    // Durable reachable but empty — do not mask with ephemeral local in production.
    if (isProdEnv()) return { members: [], source: source === 'none' ? 'stripe' : source };
  }

  // Dev / pre-migrate: surface local cache when durable stores are empty or offline.
  if (!isProdEnv() && local.length > 0) {
    const members = local
      .map((u) => toSafeMember(u, 'local'))
      .sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')));
    return { members, source: 'local' };
  }

  if (remote) {
    return { members: [], source: source === 'none' ? 'stripe' : source };
  }
  return { members: [], source: 'none' };
}

/**
 * Create a private account (durable store + local cache).
 * Used by public register, founder waitlist conversion, import, and Stripe recovery.
 * Production: refuses when no durable backend; requires successful durable write.
 */
export async function provisionPrivateUser(input: {
  email: string;
  password: string;
  displayName: string;
  /** Optional one-time password stored on Stripe for founder invite export. */
  tempPassword?: string;
}): Promise<PublicPrivateUser> {
  assertDurablePrivateWritesAllowed();

  const email = normalizeEmail(input.email);
  const displayName = (input.displayName || '').trim();
  const password = input.password || '';

  if (!email.includes('@')) throw new PrivateAuthError('Enter a valid email address.');
  if (displayName.length < 2) throw new PrivateAuthError('Display name must be at least 2 characters.');
  if (password.length < 8) throw new PrivateAuthError('Password must be at least 8 characters.');

  const existingRemote = await findDurableUserByEmail(email);
  const existingLocal = isProdEnv() ? null : readLocalUsers().find((u) => u.email === email);
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

  if (hasDurablePrivateStore()) {
    const ok = await upsertDurableUser(record, {
      tempPassword: input.tempPassword || undefined,
    });
    if (!ok) {
      throw new PrivateAuthError(
        'Failed to persist private account to durable store (Firestore/Stripe). Account was not created.',
        503
      );
    }
    upsertLocalUser(record);
    return toPublic(record);
  }

  // Non-production offline fallback only.
  upsertLocalUser(record);
  return toPublic(record);
}

export async function registerPrivateUser(input: {
  email: string;
  password: string;
  displayName: string;
}): Promise<PublicPrivateUser> {
  return provisionPrivateUser(input);
}

/**
 * Founder/admin password reset — updates durable store (Firestore and/or Stripe) + local cache.
 * Accepts `password` or `newPassword` (same meaning). Optional tempPassword is stored on
 * Stripe metadata for invite export.
 */
export async function resetPrivateUserPassword(input: {
  email: string;
  password?: string;
  newPassword?: string;
  tempPassword?: string;
}): Promise<PublicPrivateUser> {
  assertDurablePrivateWritesAllowed();

  const email = normalizeEmail(input.email);
  const password = (input.password || input.newPassword || '').trim();
  if (!email.includes('@')) throw new PrivateAuthError('Enter a valid email address.');
  if (password.length < 8) throw new PrivateAuthError('Password must be at least 8 characters.');

  const found =
    (await findDurableUserByEmail(email)) ||
    (!isProdEnv() ? readLocalUsers().find((u) => u.email === email) || null : null);
  if (!found) {
    throw new PrivateAuthError('No private account found for that email.', 404);
  }

  const { hash, salt } = await hashPassword(password);
  const updated: PrivateUserRecord = {
    ...found,
    passwordHash: hash,
    passwordSalt: salt,
  };

  if (hasDurablePrivateStore()) {
    const ok = await upsertDurableUser(updated, {
      tempPassword: input.tempPassword || undefined,
    });
    if (!ok) {
      throw new PrivateAuthError(
        'Failed to persist password reset to durable store (Firestore/Stripe).',
        503
      );
    }
    upsertLocalUser(updated);
    return toPublic(updated);
  }

  upsertLocalUser(updated);
  return toPublic(updated);
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

  if (isProdEnv() && !hasDurablePrivateStore()) {
    throw new PrivateAuthError(
      'Private login unavailable: durable store is offline in production. Accounts are not kept on ephemeral Cloud Run disk.',
      503
    );
  }

  const found =
    (await findDurableUserByEmail(email)) ||
    (isProdEnv() ? null : readLocalUsers().find((u) => u.email === email) || null) ||
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
  const durableOk = await upsertDurableUser(found);
  if (isProdEnv() && !durableOk) {
    throw new PrivateAuthError(
      'Private login could not update durable store. Try again shortly.',
      503
    );
  }
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
