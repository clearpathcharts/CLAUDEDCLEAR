/**
 * Independent Contractor badge grants (ClearPath Worldwide IC seal).
 * Admin grants by email; pending grants apply when the member next loads a profile.
 */
import fs from 'node:fs';
import path from 'node:path';
import { readProfile, writeProfile, type StoredProfile } from './profileStore';
import { findPrivateUserByEmail } from './privateAuthService';

export const IC_BADGE_ID = 'independent-contractor';
export const IC_BADGE_LABEL = 'ClearPath Worldwide Independent Contractor';
export const IC_BADGE_IMAGE = '/badges/independent-contractor-128.png';
export const IC_BADGE_IMAGE_FULL = '/badges/independent-contractor.png';

export type ContractorBadge = {
  id: string;
  label: string;
  imageUrl: string;
  grantedAt: string;
  grantedBy?: string;
};

type PendingGrant = {
  email: string;
  badgeId: string;
  label: string;
  imageUrl: string;
  grantedAt: string;
};

const DATA_DIR = path.join(process.cwd(), 'data', 'badges');
const PENDING_FILE = path.join(DATA_DIR, 'pending_contractor_grants.json');

/** Seed emails that should receive the IC badge (applied on grant-all or profile load). */
export const IC_BADGE_SEED_EMAILS = [
  'dawnhobson@aol.com',
  'barry.nicholl@hotmail.com',
];

function ensureDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}

function readPending(): PendingGrant[] {
  ensureDir();
  if (!fs.existsSync(PENDING_FILE)) return [];
  try {
    const parsed = JSON.parse(fs.readFileSync(PENDING_FILE, 'utf8'));
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writePending(rows: PendingGrant[]) {
  ensureDir();
  fs.writeFileSync(PENDING_FILE, JSON.stringify(rows, null, 2), 'utf8');
}

function normalizeEmail(email: string): string {
  return String(email || '')
    .trim()
    .toLowerCase();
}

function hasBadge(profile: StoredProfile | null, badgeId: string): boolean {
  return Boolean(profile?.contractorBadges?.some((b) => b.id === badgeId));
}

function upsertBadge(profile: StoredProfile, badge: ContractorBadge): StoredProfile {
  const existing = profile.contractorBadges || [];
  const next = existing.filter((b) => b.id !== badge.id);
  next.push(badge);
  return writeProfile(profile.uid, { contractorBadges: next });
}

/** Queue or apply IC badge for an email. */
export async function grantContractorBadgeByEmail(
  emailRaw: string,
  options?: { grantedBy?: string }
): Promise<{
  ok: boolean;
  status: 'applied' | 'pending' | 'already';
  email: string;
  uid?: string;
  profile?: StoredProfile;
}> {
  const email = normalizeEmail(emailRaw);
  if (!email.includes('@')) {
    throw new Error('Valid email required');
  }

  const badge: ContractorBadge = {
    id: IC_BADGE_ID,
    label: IC_BADGE_LABEL,
    imageUrl: IC_BADGE_IMAGE,
    grantedAt: new Date().toISOString(),
    grantedBy: options?.grantedBy || 'admin',
  };

  const user = await findPrivateUserByEmail(email);
  if (user?.uid) {
    const prev = readProfile(user.uid) || { uid: user.uid, displayName: user.displayName };
    if (hasBadge(prev, IC_BADGE_ID)) {
      return { ok: true, status: 'already', email, uid: user.uid, profile: prev };
    }
    const profile = upsertBadge(prev, badge);
    // Drop any pending row for this email
    writePending(readPending().filter((p) => p.email !== email));
    return { ok: true, status: 'applied', email, uid: user.uid, profile };
  }

  const pending = readPending().filter((p) => p.email !== email);
  pending.push({
    email,
    badgeId: badge.id,
    label: badge.label,
    imageUrl: badge.imageUrl,
    grantedAt: badge.grantedAt,
  });
  writePending(pending);
  return { ok: true, status: 'pending', email };
}

/** Apply any pending grants when a member loads their profile. */
export function applyPendingContractorBadges(
  uid: string,
  emailRaw?: string
): StoredProfile | null {
  const email = normalizeEmail(emailRaw || '');
  if (!uid) return readProfile(uid);

  let profile = readProfile(uid) || { uid };
  const pending = readPending();
  const mine = email ? pending.filter((p) => p.email === email) : [];
  if (mine.length === 0) return profile;

  let changed = false;
  for (const row of mine) {
    if (hasBadge(profile, row.badgeId)) continue;
    const badges = [...(profile.contractorBadges || [])];
    badges.push({
      id: row.badgeId,
      label: row.label,
      imageUrl: row.imageUrl,
      grantedAt: row.grantedAt,
      grantedBy: 'pending-grant',
    });
    profile = writeProfile(uid, { contractorBadges: badges });
    changed = true;
  }
  if (changed) {
    writePending(pending.filter((p) => p.email !== email));
  }
  return profile;
}

/** Seed Dawn + Barry (and any listed emails) — applied or pending. */
export async function seedIndependentContractorBadges(): Promise<{
  results: Awaited<ReturnType<typeof grantContractorBadgeByEmail>>[];
}> {
  const results = await Promise.all(
    IC_BADGE_SEED_EMAILS.map((email) =>
      grantContractorBadgeByEmail(email, { grantedBy: 'seed' })
    )
  );
  return { results };
}
