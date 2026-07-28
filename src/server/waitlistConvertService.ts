/**
 * Convert waitlist registrations → durable Private Login accounts.
 * Temp passwords live only in founder-gated `private_account_invites` (never in Members list).
 */
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { getAdminFirestore } from './firebaseAdmin';
import { generateActivationKey, normalizeEmail } from './activationKey';
import {
  findPrivateUserByEmail,
  provisionPrivateUser,
  type PublicPrivateUser,
} from './privateAuthService';

const WAITLIST_COLLECTION = 'site_registrations';
const INVITES_COLLECTION = 'private_account_invites';
const ALT_WAITLIST_DB = 'ai-studio-f544fbce-0e7e-4a8b-b7e3-6356cb380f6b';

const INVITES_DIR = path.join(process.cwd(), 'data', 'private_accounts');
const INVITES_FILE = 'founder_invites.json';

export type WaitlistCandidate = {
  email: string;
  firstName: string;
  sourceDb: 'default' | 'alt';
  docId?: string;
  status?: string;
};

export type ConvertResultRow = {
  email: string;
  status: 'created' | 'already' | 'skipped_test' | 'error';
  uid?: string;
  displayName?: string;
  message?: string;
};

export type FounderInviteSafe = {
  email: string;
  displayName: string;
  uid: string;
  activationKey: string;
  /** Present only on founder invite export — never in Members list. */
  tempPassword?: string;
  createdAt: string;
  waitlistSource?: string;
};

function isTestEmail(email: string): boolean {
  const e = normalizeEmail(email);
  return e.endsWith('@clearpath.test') || e.endsWith('.test') || e.includes('+smoke');
}

function randomTempPassword(): string {
  // 20 chars, URL-safe-ish, easy to copy; meets 8+ char private-auth rule.
  return crypto.randomBytes(15).toString('base64url').slice(0, 20);
}

function ensureInvitesDir() {
  if (!fs.existsSync(INVITES_DIR)) fs.mkdirSync(INVITES_DIR, { recursive: true });
}

function appendLocalInvite(invite: FounderInviteSafe & { tempPassword: string }) {
  ensureInvitesDir();
  const filePath = path.join(INVITES_DIR, INVITES_FILE);
  let rows: FounderInviteSafe[] = [];
  if (fs.existsSync(filePath)) {
    try {
      const parsed = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      rows = Array.isArray(parsed) ? parsed : [];
    } catch {
      rows = [];
    }
  }
  rows = rows.filter((r) => normalizeEmail(r.email) !== invite.email);
  rows.push(invite);
  fs.writeFileSync(filePath, JSON.stringify(rows, null, 2), 'utf8');
}

async function upsertInvite(invite: FounderInviteSafe & { tempPassword: string }): Promise<void> {
  appendLocalInvite(invite);
  const db = getAdminFirestore();
  if (!db) return;
  try {
    await db.collection(INVITES_COLLECTION).doc(invite.email).set(
      {
        email: invite.email,
        displayName: invite.displayName,
        uid: invite.uid,
        activationKey: invite.activationKey,
        tempPassword: invite.tempPassword,
        createdAt: invite.createdAt,
        waitlistSource: invite.waitlistSource || 'site_registrations',
      },
      { merge: true }
    );
  } catch (err) {
    console.warn('[waitlistConvert] Failed to persist invite to Firestore (local file kept).', err);
  }
}

async function markWaitlistConverted(params: {
  email: string;
  uid: string;
  docId?: string;
  sourceDb: 'default' | 'alt';
}): Promise<void> {
  const db = getAdminFirestore();
  if (!db) return;
  // Source of truth for status is always (default) site_registrations when present.
  try {
    if (params.docId && params.sourceDb === 'default') {
      await db.collection(WAITLIST_COLLECTION).doc(params.docId).set(
        {
          status: 'confirmed',
          convertedAt: new Date().toISOString(),
          convertedUid: params.uid,
        },
        { merge: true }
      );
      return;
    }
    const snap = await db
      .collection(WAITLIST_COLLECTION)
      .where('emailAddress', '==', params.email)
      .limit(5)
      .get();
    if (!snap.empty) {
      for (const doc of snap.docs) {
        await doc.ref.set(
          {
            status: 'confirmed',
            convertedAt: new Date().toISOString(),
            convertedUid: params.uid,
          },
          { merge: true }
        );
      }
      return;
    }
    // Alt-only email: create a confirmed stub on default so CEO waitlist stays complete.
    if (params.sourceDb === 'alt') {
      await db.collection(WAITLIST_COLLECTION).add({
        emailAddress: params.email,
        firstName: params.email.split('@')[0] || 'Member',
        country: 'Unknown',
        experienceLevel: 'Beginner',
        status: 'confirmed',
        registrationSource: 'Converted from legacy AI Studio waitlist',
        activationKey: generateActivationKey(),
        convertedAt: new Date().toISOString(),
        convertedUid: params.uid,
        createdAt: new Date().toISOString(),
      });
    }
  } catch (err) {
    console.warn('[waitlistConvert] Failed to mark waitlist confirmed:', err);
  }
}

async function collectFromDb(
  dbId: 'default' | typeof ALT_WAITLIST_DB
): Promise<WaitlistCandidate[]> {
  const appDb = getAdminFirestore();
  if (!appDb) return [];
  const { getFirestore } = await import('firebase-admin/firestore');
  const { ensureAdminApp } = await import('./firebaseAdmin');
  const app = ensureAdminApp();
  if (!app) return [];
  const db = dbId === 'default' ? appDb : getFirestore(app, dbId);
  const snap = await db.collection(WAITLIST_COLLECTION).limit(2000).get();
  const out: WaitlistCandidate[] = [];
  for (const doc of snap.docs) {
    const d = doc.data() as Record<string, unknown>;
    const email = normalizeEmail(String(d.emailAddress || d.email || ''));
    if (!email.includes('@')) continue;
    out.push({
      email,
      firstName: String(d.firstName || '').trim() || email.split('@')[0] || 'Member',
      sourceDb: dbId === 'default' ? 'default' : 'alt',
      docId: doc.id,
      status: String(d.status || ''),
    });
  }
  return out;
}

/** Merge unique real waitlist emails from default + alt AI Studio DB. Skip test domains. */
export async function listWaitlistConversionCandidates(): Promise<WaitlistCandidate[]> {
  const defaultRows = await collectFromDb('default');
  let altRows: WaitlistCandidate[] = [];
  try {
    altRows = await collectFromDb(ALT_WAITLIST_DB);
  } catch (err) {
    console.warn('[waitlistConvert] Alt waitlist DB unavailable:', err);
  }

  const byEmail = new Map<string, WaitlistCandidate>();
  // Prefer default DB docs when duplicate.
  for (const row of [...altRows, ...defaultRows]) {
    if (isTestEmail(row.email)) continue;
    const prev = byEmail.get(row.email);
    if (!prev || row.sourceDb === 'default') byEmail.set(row.email, row);
  }
  return [...byEmail.values()].sort((a, b) => a.email.localeCompare(b.email));
}

export async function convertWaitlistToPrivateAccounts(options?: {
  dryRun?: boolean;
}): Promise<{
  ok: true;
  dryRun: boolean;
  candidates: number;
  created: number;
  already: number;
  skippedTest: number;
  errors: number;
  results: ConvertResultRow[];
  invitesCreated: number;
}> {
  const dryRun = Boolean(options?.dryRun);
  const candidates = await listWaitlistConversionCandidates();
  const results: ConvertResultRow[] = [];
  let created = 0;
  let already = 0;
  let skippedTest = 0;
  let errors = 0;
  let invitesCreated = 0;

  for (const row of candidates) {
    if (isTestEmail(row.email)) {
      skippedTest += 1;
      results.push({ email: row.email, status: 'skipped_test' });
      continue;
    }

    try {
      const existing = await findPrivateUserByEmail(row.email);
      if (existing) {
        already += 1;
        results.push({
          email: row.email,
          status: 'already',
          uid: existing.uid,
          displayName: existing.displayName,
        });
        if (!dryRun) {
          await markWaitlistConverted({
            email: row.email,
            uid: existing.uid,
            docId: row.docId,
            sourceDb: row.sourceDb,
          });
        }
        continue;
      }

      if (dryRun) {
        created += 1;
        results.push({
          email: row.email,
          status: 'created',
          displayName: row.firstName,
          message: 'dry-run',
        });
        continue;
      }

      const tempPassword = randomTempPassword();
      const activationKey = generateActivationKey();
      const user: PublicPrivateUser = await provisionPrivateUser({
        email: row.email,
        password: tempPassword,
        displayName: row.firstName.slice(0, 80),
      });

      await upsertInvite({
        email: user.email,
        displayName: user.displayName,
        uid: user.uid,
        activationKey,
        tempPassword,
        createdAt: new Date().toISOString(),
        waitlistSource: row.sourceDb,
      });
      await markWaitlistConverted({
        email: user.email,
        uid: user.uid,
        docId: row.docId,
        sourceDb: row.sourceDb,
      });

      created += 1;
      invitesCreated += 1;
      results.push({
        email: user.email,
        status: 'created',
        uid: user.uid,
        displayName: user.displayName,
      });
    } catch (err: any) {
      errors += 1;
      results.push({
        email: row.email,
        status: 'error',
        message: err?.message || 'convert failed',
      });
    }
  }

  return {
    ok: true,
    dryRun,
    candidates: candidates.length,
    created,
    already,
    skippedTest,
    errors,
    results,
    invitesCreated,
  };
}

/** Founder-only: list invite credentials so Richard can send access. */
export async function listFounderInvites(): Promise<{
  invites: FounderInviteSafe[];
  source: 'firestore' | 'local' | 'none';
}> {
  const db = getAdminFirestore();
  if (db) {
    try {
      const snap = await db.collection(INVITES_COLLECTION).limit(2000).get();
      const invites: FounderInviteSafe[] = snap.docs.map((doc) => {
        const d = doc.data() as Record<string, unknown>;
        return {
          email: normalizeEmail(String(d.email || doc.id)),
          displayName: String(d.displayName || ''),
          uid: String(d.uid || ''),
          activationKey: String(d.activationKey || ''),
          tempPassword: typeof d.tempPassword === 'string' ? d.tempPassword : undefined,
          createdAt: String(d.createdAt || ''),
          waitlistSource: typeof d.waitlistSource === 'string' ? d.waitlistSource : undefined,
        };
      });
      if (invites.length) return { invites, source: 'firestore' };
    } catch (err) {
      console.warn('[waitlistConvert] Invite list from Firestore failed:', err);
    }
  }

  const filePath = path.join(INVITES_DIR, INVITES_FILE);
  if (fs.existsSync(filePath)) {
    try {
      const parsed = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      const invites = (Array.isArray(parsed) ? parsed : []) as FounderInviteSafe[];
      return { invites, source: invites.length ? 'local' : 'none' };
    } catch {
      /* fall through */
    }
  }
  return { invites: [], source: 'none' };
}
