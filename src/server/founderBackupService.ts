/**
 * Founder disaster backup — the antidote to "you don't need backups."
 *
 * Builds a downloadable JSON snapshot of every recoverable member/waitlist/
 * invite record from durable stores, and optionally persists a copy to
 * Firestore `founder_backups` so Cloud Run redeploys cannot erase the only copy.
 */
import { getAdminFirestore } from './firebaseAdmin';
import {
  exportPrivateAccountsForBackup,
  getPrivateStorageMeta,
  restorePrivateAccountFromBackup,
  PrivateAuthError,
} from './privateAuthService';
import { listWaitlistRegistrationsSafe } from './registrationStore';
import { listFounderInvites } from './waitlistConvertService';
import { listStripeCustomerEmails, stripeConfigured } from './stripeService';

export type FounderBackupPackage = {
  ok: true;
  schemaVersion: 1;
  kind: 'clearpath_founder_disaster_backup';
  exportedAt: string;
  warning: string;
  privateAccounts: {
    source: string;
    count: number;
    /** Full durable records including passwordHash/salt for restore. */
    accounts: Array<{
      uid: string;
      email: string;
      displayName: string;
      passwordHash: string;
      passwordSalt: string;
      createdAt: string;
      lastLoginAt?: string;
    }>;
  };
  waitlist: {
    source: string;
    count: number;
    rows: Array<{
      id: string;
      email: string;
      firstName?: string;
      country?: string;
      experienceLevel?: string;
      status?: string;
      createdAt?: string;
      source: string;
    }>;
  };
  invites: {
    source: string;
    count: number;
    rows: Array<{
      email: string;
      displayName: string;
      uid: string;
      activationKey: string;
      tempPassword?: string;
      createdAt: string;
      waitlistSource?: string;
    }>;
  };
  stripeCustomers: {
    configured: boolean;
    count: number;
    emails: string[];
  };
  storageMeta: ReturnType<typeof getPrivateStorageMeta>;
};

const BACKUP_COLLECTION = 'founder_backups';
const MAX_REMOTE_BACKUPS = 30;

export async function buildFounderBackupPackage(opts?: {
  includeStripeCustomerEmails?: boolean;
}): Promise<FounderBackupPackage> {
  const includeStripe = opts?.includeStripeCustomerEmails !== false;
  const [priv, waitlist, invites] = await Promise.all([
    exportPrivateAccountsForBackup(),
    listWaitlistRegistrationsSafe(2000),
    listFounderInvites(),
  ]);

  let stripeEmails: string[] = [];
  if (includeStripe && stripeConfigured()) {
    try {
      const rows = await listStripeCustomerEmails({ max: 5000 });
      stripeEmails = [...new Set(rows.map((r) => r.email).filter((e) => e.includes('@')))];
    } catch (err) {
      console.warn('[founderBackup] Stripe customer email list failed:', err);
    }
  }

  return {
    ok: true,
    schemaVersion: 1,
    kind: 'clearpath_founder_disaster_backup',
    exportedAt: new Date().toISOString(),
    warning:
      'FOUNDER-ONLY SECRET BACKUP. Contains password hashes and invite temp passwords. Download and keep offline. Never post in chat. This exists because Cloud Run disk is ephemeral — agents must never tell you backups are unnecessary.',
    privateAccounts: {
      source: priv.source,
      count: priv.accounts.length,
      accounts: priv.accounts.map((a) => ({
        uid: a.uid,
        email: a.email,
        displayName: a.displayName,
        passwordHash: a.passwordHash,
        passwordSalt: a.passwordSalt,
        createdAt: a.createdAt,
        ...(a.lastLoginAt ? { lastLoginAt: a.lastLoginAt } : {}),
      })),
    },
    waitlist: {
      source: waitlist.source,
      count: waitlist.members.length,
      rows: waitlist.members.map((r) => ({
        id: r.id,
        email: r.email,
        ...(r.firstName ? { firstName: r.firstName } : {}),
        ...(r.country ? { country: r.country } : {}),
        ...(r.experienceLevel ? { experienceLevel: r.experienceLevel } : {}),
        ...(r.status ? { status: r.status } : {}),
        ...(r.createdAt ? { createdAt: r.createdAt } : {}),
        source: r.source,
      })),
    },
    invites: {
      source: invites.source,
      count: invites.invites.length,
      rows: invites.invites.map((inv) => ({
        email: inv.email,
        displayName: inv.displayName,
        uid: inv.uid,
        activationKey: inv.activationKey,
        ...(inv.tempPassword ? { tempPassword: inv.tempPassword } : {}),
        createdAt: inv.createdAt,
        ...(inv.waitlistSource ? { waitlistSource: inv.waitlistSource } : {}),
      })),
    },
    stripeCustomers: {
      configured: stripeConfigured(),
      count: stripeEmails.length,
      emails: stripeEmails,
    },
    storageMeta: getPrivateStorageMeta(),
  };
}

/** Persist backup JSON to Firestore so it survives Cloud Run redeploys. */
export async function persistFounderBackupSnapshot(
  pkg?: FounderBackupPackage
): Promise<{ ok: true; id: string; counts: { privateAccounts: number; waitlist: number; invites: number; stripeCustomers: number } } | { ok: false; reason: string }> {
  const db = getAdminFirestore();
  if (!db) return { ok: false, reason: 'firestore_admin_offline' };

  const backup = pkg || (await buildFounderBackupPackage());
  const id = backup.exportedAt.replace(/[:.]/g, '-');
  await db.collection(BACKUP_COLLECTION).doc(id).set(
    {
      ...backup,
      persistedAt: new Date().toISOString(),
    },
    { merge: false }
  );

  // Prune oldest beyond retention — best effort.
  try {
    const snap = await db.collection(BACKUP_COLLECTION).orderBy('exportedAt', 'desc').get();
    const extras = snap.docs.slice(MAX_REMOTE_BACKUPS);
    for (const doc of extras) {
      await doc.ref.delete();
    }
  } catch {
    /* ignore prune errors */
  }

  return {
    ok: true,
    id,
    counts: {
      privateAccounts: backup.privateAccounts.count,
      waitlist: backup.waitlist.count,
      invites: backup.invites.count,
      stripeCustomers: backup.stripeCustomers.count,
    },
  };
}

export async function restorePrivateAccountsFromBackupPackage(input: {
  accounts: Array<{
    email: string;
    displayName?: string;
    uid?: string;
    passwordHash: string;
    passwordSalt: string;
    createdAt?: string;
    lastLoginAt?: string;
  }>;
  dryRun?: boolean;
}): Promise<{
  ok: true;
  dryRun: boolean;
  restored: number;
  errors: number;
  results: Array<{ email: string; status: 'restored' | 'error' | 'dry-run'; message?: string }>;
}> {
  const rows = Array.isArray(input.accounts) ? input.accounts : [];
  if (!rows.length) throw new PrivateAuthError('accounts array required');
  const dryRun = Boolean(input.dryRun);
  let restored = 0;
  let errors = 0;
  const results: Array<{ email: string; status: 'restored' | 'error' | 'dry-run'; message?: string }> = [];

  for (const row of rows.slice(0, 5000)) {
    const email = String(row?.email || '').trim().toLowerCase();
    try {
      if (dryRun) {
        restored += 1;
        results.push({ email, status: 'dry-run' });
        continue;
      }
      await restorePrivateAccountFromBackup(row);
      restored += 1;
      results.push({ email, status: 'restored' });
    } catch (err: any) {
      errors += 1;
      results.push({ email, status: 'error', message: err?.message || 'failed' });
    }
  }

  return { ok: true, dryRun, restored, errors, results };
}

let bootSnapshotAttempted = false;

/** One-shot boot: snapshot durable members/waitlist into Firestore founder_backups. */
export async function bootPersistFounderBackupSnapshot(): Promise<{
  ran: boolean;
  id?: string;
  reason?: string;
  counts?: { privateAccounts: number; waitlist: number; invites: number; stripeCustomers: number };
}> {
  if (bootSnapshotAttempted) return { ran: false, reason: 'already_attempted' };
  bootSnapshotAttempted = true;
  const result = await persistFounderBackupSnapshot();
  if (result.ok === false) return { ran: false, reason: result.reason };
  console.log(
    `[STARTUP] Founder disaster backup snapshot → id=${result.id} private=${result.counts.privateAccounts} waitlist=${result.counts.waitlist} invites=${result.counts.invites} stripeEmails=${result.counts.stripeCustomers}`
  );
  return { ran: true, id: result.id, counts: result.counts };
}

export function _resetFounderBackupBootFlagForTests() {
  bootSnapshotAttempted = false;
}
