/**
 * ClearPath Trader — Private account auth (email + password).
 * Durable stores (either is enough in production):
 *   1) Firestore `private_accounts` when Admin is available
 *   2) Stripe Customer metadata (STRIPE_SECRET_KEY) — survives Cloud Run redeploys
 * Local file is a cache / offline-dev fallback only — never source of truth in production.
 *
 * Identity quarantine: suspect emails/names create pending_confirm accounts;
 * declined/expired accounts refuse dashboard entry ("Have a good one").
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
import {
  assertRegistrationEmailAllowedAsync,
  assertRegistrationNameAllowed,
  assessIdentityRisk,
  emailRiskReasons,
} from './identityRisk';

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

export type IdentityStatus = 'ok' | 'pending_confirm' | 'declined' | 'expired';

export type PrivateUserRecord = {
  uid: string;
  email: string;
  displayName: string;
  passwordHash: string;
  passwordSalt: string;
  createdAt: string;
  lastLoginAt?: string;
  identityStatus?: IdentityStatus;
  identityRiskReasons?: string[];
  /** SHA-256 hex of one-time confirm token (raw token only in email). */
  identityChallengeTokenHash?: string;
  identityChallengeExpiresAt?: string;
  identityDeclinedAt?: string;
  identityConfirmedAt?: string;
  /** True when original signup flagged the email itself as suspect. */
  identityEmailWasSuspect?: boolean;
};

export type PublicPrivateUser = {
  uid: string;
  email: string;
  displayName: string;
  identityStatus?: IdentityStatus;
};

export class PrivateAuthError extends Error {
  status: number;
  code?: string;
  details?: Record<string, unknown>;
  constructor(message: string, status = 400, code?: string, details?: Record<string, unknown>) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

const COLLECTION = 'private_accounts';
const ATTEMPTS_COLLECTION = 'identity_attempts';
const DATA_DIR = path.join(process.cwd(), 'data', 'private_accounts');
const USERS_FILE = 'users.json';
const CHALLENGE_TTL_MS = 48 * 60 * 60 * 1000;

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
  const out: PublicPrivateUser = {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
  };
  if (user.identityStatus) out.identityStatus = user.identityStatus;
  return out;
}

function hashToken(raw: string): string {
  return crypto.createHash('sha256').update(raw).digest('hex');
}

function applyIdentityFields(record: PrivateUserRecord, data: Record<string, unknown>) {
  const status = String(data.identityStatus || '').trim() as IdentityStatus;
  if (status === 'ok' || status === 'pending_confirm' || status === 'declined' || status === 'expired') {
    record.identityStatus = status;
  }
  if (Array.isArray(data.identityRiskReasons)) {
    record.identityRiskReasons = data.identityRiskReasons.map(String);
  }
  if (typeof data.identityChallengeTokenHash === 'string' && data.identityChallengeTokenHash.trim()) {
    record.identityChallengeTokenHash = data.identityChallengeTokenHash.trim();
  }
  if (typeof data.identityChallengeExpiresAt === 'string' && data.identityChallengeExpiresAt.trim()) {
    record.identityChallengeExpiresAt = data.identityChallengeExpiresAt.trim();
  }
  if (typeof data.identityDeclinedAt === 'string' && data.identityDeclinedAt.trim()) {
    record.identityDeclinedAt = data.identityDeclinedAt.trim();
  }
  if (typeof data.identityConfirmedAt === 'string' && data.identityConfirmedAt.trim()) {
    record.identityConfirmedAt = data.identityConfirmedAt.trim();
  }
  if (typeof data.identityEmailWasSuspect === 'boolean') {
    record.identityEmailWasSuspect = data.identityEmailWasSuspect;
  }
}

function identityPayload(user: PrivateUserRecord): Record<string, unknown> {
  const payload: Record<string, unknown> = {};
  if (user.identityStatus) payload.identityStatus = user.identityStatus;
  if (user.identityRiskReasons) payload.identityRiskReasons = user.identityRiskReasons;
  if (user.identityChallengeTokenHash) payload.identityChallengeTokenHash = user.identityChallengeTokenHash;
  if (user.identityChallengeExpiresAt) payload.identityChallengeExpiresAt = user.identityChallengeExpiresAt;
  if (user.identityDeclinedAt) payload.identityDeclinedAt = user.identityDeclinedAt;
  if (user.identityConfirmedAt) payload.identityConfirmedAt = user.identityConfirmedAt;
  if (typeof user.identityEmailWasSuspect === 'boolean') {
    payload.identityEmailWasSuspect = user.identityEmailWasSuspect;
  }
  return payload;
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
  applyIdentityFields(record, data);
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
      ...identityPayload(user),
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
  const mapped: PrivateUserRecord = {
    uid: fromStripe.uid,
    email: fromStripe.email,
    displayName: fromStripe.displayName,
    passwordHash: fromStripe.passwordHash,
    passwordSalt: fromStripe.passwordSalt,
    createdAt: fromStripe.createdAt,
    ...(fromStripe.lastLoginAt ? { lastLoginAt: fromStripe.lastLoginAt } : {}),
  };
  applyIdentityFields(mapped, fromStripe as unknown as Record<string, unknown>);
  return mapped;
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
      ...(user.identityStatus ? { identityStatus: user.identityStatus } : {}),
      ...(user.identityRiskReasons ? { identityRiskReasons: user.identityRiskReasons } : {}),
      ...(user.identityChallengeTokenHash
        ? { identityChallengeTokenHash: user.identityChallengeTokenHash }
        : {}),
      ...(user.identityChallengeExpiresAt
        ? { identityChallengeExpiresAt: user.identityChallengeExpiresAt }
        : {}),
      ...(user.identityDeclinedAt ? { identityDeclinedAt: user.identityDeclinedAt } : {}),
      ...(user.identityConfirmedAt ? { identityConfirmedAt: user.identityConfirmedAt } : {}),
      ...(typeof user.identityEmailWasSuspect === 'boolean'
        ? { identityEmailWasSuspect: user.identityEmailWasSuspect }
        : {}),
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
        const mapped: PrivateUserRecord = {
          uid: u.uid,
          email: u.email,
          displayName: u.displayName,
          passwordHash: u.passwordHash,
          passwordSalt: u.passwordSalt,
          createdAt: u.createdAt,
          ...(u.lastLoginAt ? { lastLoginAt: u.lastLoginAt } : {}),
        };
        applyIdentityFields(mapped, u as unknown as Record<string, unknown>);
        byEmail.set(u.email, mapped);
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

async function findUserRecordByEmail(email: string): Promise<PrivateUserRecord | null> {
  const normalized = normalizeEmail(email);
  const remote = await findDurableUserByEmail(normalized);
  if (remote) return remote;
  if (isProdEnv()) return null;
  return readLocalUsers().find((u) => u.email === normalized) || null;
}

async function persistUser(
  user: PrivateUserRecord,
  opts?: { tempPassword?: string }
): Promise<void> {
  if (hasDurablePrivateStore()) {
    const ok = await upsertDurableUser(user, opts);
    if (!ok && isProdEnv()) {
      throw new PrivateAuthError(
        'Failed to persist private account to durable store (Firestore/Stripe).',
        503
      );
    }
  }
  upsertLocalUser(user);
}

export async function logIdentityAttempt(input: {
  email: string;
  displayName: string;
  reasons: string[];
  ip?: string;
  userAgent?: string;
}): Promise<void> {
  const db = getAdminFirestore();
  const email = normalizeEmail(input.email);
  const ipHash = input.ip
    ? crypto.createHash('sha256').update(String(input.ip)).digest('hex').slice(0, 16)
    : undefined;
  const row = {
    email,
    displayName: (input.displayName || '').trim(),
    reasons: input.reasons,
    ipHash,
    userAgent: (input.userAgent || '').slice(0, 300) || undefined,
    createdAt: new Date().toISOString(),
  };
  try {
    ensureDataDir();
    const filePath = path.join(DATA_DIR, 'identity_attempts.json');
    let rows: unknown[] = [];
    if (fs.existsSync(filePath)) {
      try {
        const parsed = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        rows = Array.isArray(parsed) ? parsed : [];
      } catch {
        rows = [];
      }
    }
    rows.unshift(row);
    fs.writeFileSync(filePath, JSON.stringify(rows.slice(0, 500), null, 2));
  } catch {
    /* ignore */
  }
  if (!db) return;
  try {
    await db.collection(ATTEMPTS_COLLECTION).add(row);
  } catch (err) {
    console.warn('[privateAuth] identity_attempts write failed:', err);
  }
}

function mintChallenge(user: PrivateUserRecord): { rawToken: string; expiresAt: string } {
  const rawToken = crypto.randomBytes(24).toString('base64url');
  user.identityChallengeTokenHash = hashToken(rawToken);
  user.identityChallengeExpiresAt = new Date(Date.now() + CHALLENGE_TTL_MS).toISOString();
  return { rawToken, expiresAt: user.identityChallengeExpiresAt };
}

function expireIfNeeded(user: PrivateUserRecord): PrivateUserRecord {
  if (user.identityStatus !== 'pending_confirm') return user;
  const exp = user.identityChallengeExpiresAt ? Date.parse(user.identityChallengeExpiresAt) : NaN;
  if (Number.isFinite(exp) && Date.now() > exp) {
    user.identityStatus = 'expired';
    user.identityChallengeTokenHash = undefined;
  }
  return user;
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
  identityStatus?: IdentityStatus;
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
  let found = await findUserRecordByEmail(normalized);
  if (!found) return { exists: false };
  found = expireIfNeeded(found);
  if (found.identityStatus === 'expired') {
    await persistUser(found);
  }
  const out: { exists: boolean; identityStatus?: IdentityStatus } = { exists: true };
  if (found.identityStatus && found.identityStatus !== 'ok') {
    out.identityStatus = found.identityStatus;
  }
  return out;
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
  identityStatus?: IdentityStatus;
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
  if (u.identityStatus) row.identityStatus = u.identityStatus;
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
      .map((u) => toSafeMember(expireIfNeeded(u), source === 'none' ? 'stripe' : source))
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
      .map((u) => toSafeMember(expireIfNeeded(u), 'local'))
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
 * Suspect identities are quarantined (pending_confirm) — caller must not grant dashboard session.
 */
export type RegisterPrivateResult =
  | { kind: 'ok'; user: PublicPrivateUser }
  | {
      kind: 'pending_confirm';
      user: PublicPrivateUser;
      reasons: string[];
      rawChallengeToken: string;
      emailWasSuspect: boolean;
    };

export async function provisionPrivateUser(input: {
  email: string;
  password: string;
  displayName: string;
  /** Optional one-time password stored on Stripe for founder invite export. */
  tempPassword?: string;
  /** When true (founder convert / seed / recovery), skip identity risk quarantine. */
  skipIdentityRisk?: boolean;
  meta?: { ip?: string; userAgent?: string };
}): Promise<RegisterPrivateResult> {
  assertDurablePrivateWritesAllowed();

  const email = normalizeEmail(input.email);
  const displayName = (input.displayName || '').trim();
  const password = input.password || '';

  if (!email.includes('@')) throw new PrivateAuthError('Enter a valid email address.');
  if (displayName.length < 2) throw new PrivateAuthError('Display name must be at least 2 characters.');
  if (password.length < 8) throw new PrivateAuthError('Password must be at least 8 characters.');

  // Hard no-entry: fake / test / disposable / reserved emails + fake names never create an account.
  // Founder seed / recovery / waitlist-convert may skip via skipIdentityRisk.
  if (!input.skipIdentityRisk) {
    try {
      await assertRegistrationEmailAllowedAsync(email);
      assertRegistrationNameAllowed(displayName);
    } catch (err) {
      const e = err as Error & { status?: number; code?: string };
      throw new PrivateAuthError(e.message || 'This email is not allowed for registration.', e.status || 400, e.code);
    }
  }

  const existingRemote = await findDurableUserByEmail(email);
  const existingLocal = isProdEnv() ? null : readLocalUsers().find((u) => u.email === email);
  if (existingRemote || existingLocal) {
    throw new PrivateAuthError('An account with this email already exists. Use Private Login.', 409);
  }

  const risk = input.skipIdentityRisk
    ? { risk: 'clean' as const, reasons: [] as string[] }
    : assessIdentityRisk({ email, displayName });

  const { hash, salt } = await hashPassword(password);
  const record: PrivateUserRecord = {
    uid: `cpt_${crypto.randomBytes(12).toString('hex')}`,
    email,
    displayName,
    passwordHash: hash,
    passwordSalt: salt,
    createdAt: new Date().toISOString(),
    identityStatus: 'ok',
  };

  const writeOpts = { tempPassword: input.tempPassword || undefined };

  if (risk.risk === 'suspect') {
    await logIdentityAttempt({
      email,
      displayName,
      reasons: risk.reasons,
      ip: input.meta?.ip,
      userAgent: input.meta?.userAgent,
    });
    record.identityStatus = 'pending_confirm';
    record.identityRiskReasons = risk.reasons;
    record.identityEmailWasSuspect = emailRiskReasons(risk.reasons);
    const { rawToken } = mintChallenge(record);

    if (hasDurablePrivateStore()) {
      const ok = await upsertDurableUser(record, writeOpts);
      if (!ok) {
        throw new PrivateAuthError(
          'Failed to persist private account to durable store (Firestore/Stripe). Account was not created.',
          503
        );
      }
      upsertLocalUser(record);
    } else {
      upsertLocalUser(record);
    }

    return {
      kind: 'pending_confirm',
      user: toPublic(record),
      reasons: risk.reasons,
      rawChallengeToken: rawToken,
      emailWasSuspect: Boolean(record.identityEmailWasSuspect),
    };
  }

  if (hasDurablePrivateStore()) {
    const ok = await upsertDurableUser(record, writeOpts);
    if (!ok) {
      throw new PrivateAuthError(
        'Failed to persist private account to durable store (Firestore/Stripe). Account was not created.',
        503
      );
    }
    upsertLocalUser(record);
    return { kind: 'ok', user: toPublic(record) };
  }

  // Non-production offline fallback only.
  upsertLocalUser(record);
  return { kind: 'ok', user: toPublic(record) };
}

export async function registerPrivateUser(input: {
  email: string;
  password: string;
  displayName: string;
  meta?: { ip?: string; userAgent?: string };
}): Promise<RegisterPrivateResult> {
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

export type LoginPrivateResult =
  | { kind: 'ok'; user: PublicPrivateUser }
  | {
      kind: 'pending_confirm';
      user: PublicPrivateUser;
      reasons: string[];
    };

export async function loginPrivateUser(input: {
  email: string;
  password: string;
}): Promise<LoginPrivateResult> {
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

  let found =
    (await findDurableUserByEmail(email)) ||
    (isProdEnv() ? null : readLocalUsers().find((u) => u.email === email) || null) ||
    null;
  // Generic messages — avoid confirming whether the email is registered.
  if (!found) throw new PrivateAuthError('Invalid email or password.', 401);

  found = expireIfNeeded(found);
  if (found.identityStatus === 'expired') {
    await persistUser(found);
  }

  const { hash } = await hashPassword(password, found.passwordSalt);
  const a = Buffer.from(hash, 'hex');
  const b = Buffer.from(found.passwordHash, 'hex');
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    throw new PrivateAuthError('Invalid email or password.', 401);
  }

  if (found.identityStatus === 'declined' || found.identityStatus === 'expired') {
    throw new PrivateAuthError('Have a good one.', 403, 'IDENTITY_DECLINED', {
      identityStatus: found.identityStatus,
      email: found.email,
    });
  }

  // Retroactive quarantine: accounts created before the gate (or without status)
  // still get caught on password login when email/name look fake.
  if (!found.identityStatus || found.identityStatus === 'ok') {
    const risk = assessIdentityRisk({ email: found.email, displayName: found.displayName });
    if (risk.risk === 'suspect') {
      await logIdentityAttempt({
        email: found.email,
        displayName: found.displayName,
        reasons: [...risk.reasons, 'retroactive_login'],
      });
      found.identityStatus = 'pending_confirm';
      found.identityRiskReasons = risk.reasons;
      found.identityEmailWasSuspect = emailRiskReasons(risk.reasons);
      mintChallenge(found);
      await persistUser(found);
      return {
        kind: 'pending_confirm',
        user: toPublic(found),
        reasons: risk.reasons,
      };
    }
  }

  if (found.identityStatus === 'pending_confirm') {
    return {
      kind: 'pending_confirm',
      user: toPublic(found),
      reasons: found.identityRiskReasons || [],
    };
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
  return { kind: 'ok', user: toPublic(found) };
}

export type IdentityResubmitResult =
  | { kind: 'unlocked'; user: PublicPrivateUser }
  | {
      kind: 'pending_confirm';
      user: PublicPrivateUser;
      reasons: string[];
      rawChallengeToken: string;
      emailSentRequired: boolean;
    }
  | { kind: 'still_suspect'; user: PublicPrivateUser; reasons: string[] };

/** Update name/email while pending; re-run risk. */
export async function resubmitIdentity(input: {
  currentEmail: string;
  password: string;
  newEmail: string;
  newDisplayName: string;
  meta?: { ip?: string; userAgent?: string };
}): Promise<IdentityResubmitResult> {
  assertDurablePrivateWritesAllowed();
  const currentEmail = normalizeEmail(input.currentEmail);
  let found = await findUserRecordByEmail(currentEmail);
  if (!found) throw new PrivateAuthError('Account not found.', 404);

  found = expireIfNeeded(found);
  if (found.identityStatus === 'expired') {
    await persistUser(found);
    throw new PrivateAuthError('Have a good one.', 403, 'IDENTITY_DECLINED', {
      identityStatus: 'expired',
    });
  }
  if (found.identityStatus === 'declined') {
    throw new PrivateAuthError('Have a good one.', 403, 'IDENTITY_DECLINED', {
      identityStatus: 'declined',
    });
  }
  if (found.identityStatus !== 'pending_confirm') {
    throw new PrivateAuthError('Identity is already confirmed.', 400);
  }

  const { hash } = await hashPassword(input.password || '', found.passwordSalt);
  const a = Buffer.from(hash, 'hex');
  const b = Buffer.from(found.passwordHash, 'hex');
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    throw new PrivateAuthError('Invalid email or password.', 401);
  }

  const newEmail = normalizeEmail(input.newEmail);
  const newDisplayName = (input.newDisplayName || '').trim();
  if (!newEmail.includes('@')) throw new PrivateAuthError('Enter a valid email address.');
  if (newDisplayName.length < 2) throw new PrivateAuthError('Display name must be at least 2 characters.');

  try {
    await assertRegistrationEmailAllowedAsync(newEmail);
    assertRegistrationNameAllowed(newDisplayName);
  } catch (err) {
    const e = err as Error & { status?: number; code?: string };
    throw new PrivateAuthError(e.message || 'This email is not allowed for registration.', e.status || 400, e.code);
  }

  if (newEmail !== found.email) {
    const clash = await findUserRecordByEmail(newEmail);
    if (clash && clash.uid !== found.uid) {
      throw new PrivateAuthError('An account with this email already exists.', 409);
    }
  }

  const risk = assessIdentityRisk({ email: newEmail, displayName: newDisplayName });
  await logIdentityAttempt({
    email: newEmail,
    displayName: newDisplayName,
    reasons: risk.reasons.length ? risk.reasons : ['resubmit_clean'],
    ip: input.meta?.ip,
    userAgent: input.meta?.userAgent,
  });

  const oldEmail = found.email;
  const emailWasSuspectAlready = Boolean(found.identityEmailWasSuspect);
  found.displayName = newDisplayName;
  found.email = newEmail;
  found.identityRiskReasons = risk.reasons;

  if (risk.risk === 'suspect') {
    found.identityStatus = 'pending_confirm';
    if (emailRiskReasons(risk.reasons)) found.identityEmailWasSuspect = true;
    mintChallenge(found);
    await rewriteEmailAndPersist(found, oldEmail);
    return {
      kind: 'still_suspect',
      user: toPublic(found),
      reasons: risk.reasons,
    };
  }

  if (emailWasSuspectAlready) {
    found.identityStatus = 'pending_confirm';
    found.identityRiskReasons = [];
    const { rawToken } = mintChallenge(found);
    await rewriteEmailAndPersist(found, oldEmail);
    return {
      kind: 'pending_confirm',
      user: toPublic(found),
      reasons: [],
      rawChallengeToken: rawToken,
      emailSentRequired: true,
    };
  }

  found.identityStatus = 'ok';
  found.identityRiskReasons = [];
  found.identityChallengeTokenHash = undefined;
  found.identityChallengeExpiresAt = undefined;
  found.identityConfirmedAt = new Date().toISOString();
  await rewriteEmailAndPersist(found, oldEmail);
  return { kind: 'unlocked', user: toPublic(found) };
}

async function rewriteEmailAndPersist(found: PrivateUserRecord, oldEmail: string) {
  await persistUser(found);
  if (oldEmail !== found.email) {
    await deleteAccountDoc(oldEmail);
    const locals = readLocalUsers()
      .filter((u) => u.uid === found.uid || u.email !== oldEmail)
      .map((u) => (u.uid === found.uid ? found : u));
    const dedup = new Map<string, PrivateUserRecord>();
    for (const u of locals) dedup.set(u.uid, u);
    writeLocalUsers([...dedup.values()]);
  }
}

async function deleteAccountDoc(email: string): Promise<void> {
  if (!hasFirestoreDurableStore()) return;
  const db = getAdminFirestore();
  if (!db) return;
  try {
    await db.collection(COLLECTION).doc(normalizeEmail(email)).delete();
  } catch (err) {
    console.warn('[privateAuth] Failed to delete old email doc:', err);
  }
}

export async function declineIdentity(input: {
  email: string;
  password?: string;
}): Promise<void> {
  assertDurablePrivateWritesAllowed();
  const email = normalizeEmail(input.email);
  let found = await findUserRecordByEmail(email);
  if (!found) throw new PrivateAuthError('Account not found.', 404);
  found = expireIfNeeded(found);

  if (input.password) {
    const { hash } = await hashPassword(input.password, found.passwordSalt);
    const a = Buffer.from(hash, 'hex');
    const b = Buffer.from(found.passwordHash, 'hex');
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
      throw new PrivateAuthError('Invalid email or password.', 401);
    }
  }

  found.identityStatus = 'declined';
  found.identityDeclinedAt = new Date().toISOString();
  found.identityChallengeTokenHash = undefined;
  await persistUser(found);
}

export async function confirmIdentityByToken(rawToken: string): Promise<PublicPrivateUser> {
  const token = (rawToken || '').trim();
  if (!token || token.length < 16) {
    throw new PrivateAuthError('Invalid or expired confirmation link.', 400);
  }
  const tokenHash = hashToken(token);

  const remote = await listDurableUsers();
  const local = readLocalUsers();
  const pool = remote && remote.length ? remote : local;
  let found =
    pool.find((u) => u.identityChallengeTokenHash === tokenHash) ||
    local.find((u) => u.identityChallengeTokenHash === tokenHash) ||
    null;

  if (!found) throw new PrivateAuthError('Invalid or expired confirmation link.', 400);

  found = expireIfNeeded(found);
  if (found.identityStatus === 'expired') {
    await persistUser(found);
    throw new PrivateAuthError('Have a good one.', 403, 'IDENTITY_DECLINED', {
      identityStatus: 'expired',
    });
  }

  found.identityStatus = 'ok';
  found.identityConfirmedAt = new Date().toISOString();
  found.identityChallengeTokenHash = undefined;
  found.identityChallengeExpiresAt = undefined;
  found.identityRiskReasons = [];
  await persistUser(found);
  return toPublic(found);
}

/** Remint challenge token for pending accounts (resend email). */
export async function remintIdentityChallenge(input: {
  email: string;
  password: string;
}): Promise<{ user: PublicPrivateUser; rawChallengeToken: string }> {
  assertDurablePrivateWritesAllowed();
  const email = normalizeEmail(input.email);
  let found = await findUserRecordByEmail(email);
  if (!found) throw new PrivateAuthError('Account not found.', 404);
  found = expireIfNeeded(found);
  if (found.identityStatus === 'expired' || found.identityStatus === 'declined') {
    throw new PrivateAuthError('Have a good one.', 403, 'IDENTITY_DECLINED', {
      identityStatus: found.identityStatus,
    });
  }
  if (found.identityStatus !== 'pending_confirm') {
    throw new PrivateAuthError('Identity is already confirmed.', 400);
  }
  const { hash } = await hashPassword(input.password, found.passwordSalt);
  const a = Buffer.from(hash, 'hex');
  const b = Buffer.from(found.passwordHash, 'hex');
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    throw new PrivateAuthError('Invalid email or password.', 401);
  }
  const { rawToken } = mintChallenge(found);
  await persistUser(found);
  return { user: toPublic(found), rawChallengeToken: rawToken };
}

/**
 * Re-check durable identity status for an existing cookie session.
 * Quarantined / declined accounts must not keep dashboard access.
 */
export async function assertSessionIdentityAllowed(input: {
  uid?: string;
  email?: string;
}): Promise<{
  allowed: boolean;
  identityStatus?: IdentityStatus;
  reasons?: string[];
  user?: PublicPrivateUser;
}> {
  const email = normalizeEmail(input.email || '');
  let found: PrivateUserRecord | null = email ? await findUserRecordByEmail(email) : null;
  if (!found && input.uid) {
    const remote = await listDurableUsers();
    found =
      (remote || []).find((u) => u.uid === input.uid) ||
      (!isProdEnv() ? readLocalUsers().find((u) => u.uid === input.uid) || null : null);
  }
  // Board / non-private sessions: no private account record → allow.
  if (!found) return { allowed: true };

  found = expireIfNeeded(found);
  if (found.identityStatus === 'expired') {
    await persistUser(found);
  }

  if (found.identityStatus === 'declined' || found.identityStatus === 'expired') {
    return {
      allowed: false,
      identityStatus: found.identityStatus,
      user: toPublic(found),
    };
  }

  if (!found.identityStatus || found.identityStatus === 'ok') {
    const risk = assessIdentityRisk({ email: found.email, displayName: found.displayName });
    if (risk.risk === 'suspect') {
      found.identityStatus = 'pending_confirm';
      found.identityRiskReasons = risk.reasons;
      found.identityEmailWasSuspect = emailRiskReasons(risk.reasons);
      mintChallenge(found);
      await persistUser(found);
      return {
        allowed: false,
        identityStatus: 'pending_confirm',
        reasons: risk.reasons,
        user: toPublic(found),
      };
    }
  }

  if (found.identityStatus === 'pending_confirm') {
    return {
      allowed: false,
      identityStatus: 'pending_confirm',
      reasons: found.identityRiskReasons || [],
      user: toPublic(found),
    };
  }

  return { allowed: true, identityStatus: found.identityStatus || 'ok', user: toPublic(found) };
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
    ...(user.identityStatus ? { identityStatus: user.identityStatus } : {}),
  };
}

/** Build absolute confirm URL for identity email. */
export function buildIdentityConfirmUrl(baseUrl: string, rawToken: string): string {
  const base = (baseUrl || '').replace(/\/$/, '');
  return `${base}/api/auth/private/identity/confirm?token=${encodeURIComponent(rawToken)}`;
}
