/**
 * Founder-issued complimentary memberships, keyed by email so they apply to
 * every sign-in method (private password account or Google).
 * Firestore `membership_grants/{email}` is authoritative; data/membership-grants.json is the local/dev fallback.
 * A grant never blocks Stripe checkout: a paid plan or launch gift that ranks higher still wins.
 */
import fs from 'node:fs';
import path from 'node:path';
import { canonicalizePlanId, CANONICAL_PLANS } from '../lib/planCatalog';
import { tierRankOf } from '../lib/entitlements';
import { getAdminFirestore } from './firebaseAdmin';
import type { MembershipStatusReport } from './stripeService';

export type MembershipGrant = {
  email: string;
  tier: string;
  /** ISO end date, or null for lifetime. */
  expiresAt: string | null;
  reason: string;
  grantedAt: string;
  grantedBy: string;
};

const COLLECTION = 'membership_grants';
const LOCAL_FILE = path.join(process.cwd(), 'data', 'membership-grants.json');
const CACHE_MS = 60_000;
const cache = new Map<string, { at: number; grant: MembershipGrant | null }>();

function normalizeEmail(raw: unknown): string {
  return String(raw || '').trim().toLowerCase();
}

function readLocal(): Record<string, MembershipGrant> {
  try {
    return JSON.parse(fs.readFileSync(LOCAL_FILE, 'utf8')) as Record<string, MembershipGrant>;
  } catch {
    return {};
  }
}

function writeLocal(all: Record<string, MembershipGrant>): void {
  fs.mkdirSync(path.dirname(LOCAL_FILE), { recursive: true });
  const tmp = `${LOCAL_FILE}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(all, null, 2), 'utf8');
  fs.renameSync(tmp, LOCAL_FILE);
}

function isLive(grant: MembershipGrant | null | undefined, now = Date.now()): grant is MembershipGrant {
  if (!grant?.tier) return false;
  return !grant.expiresAt || new Date(grant.expiresAt).getTime() > now;
}

export async function getMembershipGrant(rawEmail: unknown): Promise<MembershipGrant | null> {
  const email = normalizeEmail(rawEmail);
  if (!email) return null;
  const hit = cache.get(email);
  if (hit && Date.now() - hit.at < CACHE_MS) return hit.grant;
  let grant: MembershipGrant | null = null;
  const db = getAdminFirestore();
  if (db) {
    try {
      const snap = await db.collection(COLLECTION).doc(email).get();
      grant = snap.exists ? (snap.data() as MembershipGrant) : null;
    } catch (err) {
      console.warn('[membershipGrants] Firestore read failed, using local copy:', err);
      grant = readLocal()[email] || null;
    }
  } else {
    grant = readLocal()[email] || null;
  }
  cache.set(email, { at: Date.now(), grant });
  return grant;
}

/** Report for the best live grant across the signed-in member's emails, or null. */
export async function grantReportForEmails(emails: Iterable<string>): Promise<MembershipStatusReport | null> {
  let best: MembershipStatusReport | null = null;
  for (const email of new Set([...emails].map(normalizeEmail).filter(Boolean))) {
    const grant = await getMembershipGrant(email);
    if (!isLive(grant)) continue;
    const tier = canonicalizePlanId(grant.tier);
    if (!best || tierRankOf(tier) > tierRankOf(best.tier)) {
      best = {
        active: true,
        tier,
        status: 'complimentary',
        ...(grant.expiresAt ? { currentPeriodEnd: grant.expiresAt } : {}),
      };
    }
  }
  return best;
}

export async function saveMembershipGrants(
  rawEmails: unknown[],
  input: { tier: string; reason: string; expiresAt?: string | null; grantedBy: string },
): Promise<string[]> {
  const tier = String(input.tier || '').toLowerCase();
  if (!(CANONICAL_PLANS as readonly string[]).includes(tier) || tier === 'basic') {
    throw new Error(`Unknown paid tier: ${input.tier}`);
  }
  const emails = [...new Set(rawEmails.map(normalizeEmail))].filter((e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e));
  const grantedAt = new Date().toISOString();
  const db = getAdminFirestore();
  const local = readLocal();
  for (const email of emails) {
    const grant: MembershipGrant = {
      email,
      tier,
      expiresAt: input.expiresAt || null,
      reason: String(input.reason || '').slice(0, 200),
      grantedAt,
      grantedBy: input.grantedBy || 'founder',
    };
    if (db) await db.collection(COLLECTION).doc(email).set(grant);
    local[email] = grant;
    cache.delete(email);
  }
  writeLocal(local);
  return emails;
}

export async function revokeMembershipGrant(rawEmail: unknown): Promise<boolean> {
  const email = normalizeEmail(rawEmail);
  if (!email) return false;
  const db = getAdminFirestore();
  if (db) await db.collection(COLLECTION).doc(email).delete();
  const local = readLocal();
  const had = Boolean(local[email]);
  delete local[email];
  writeLocal(local);
  cache.delete(email);
  return had || Boolean(db);
}

export async function listMembershipGrants(): Promise<MembershipGrant[]> {
  const db = getAdminFirestore();
  if (db) {
    const snap = await db.collection(COLLECTION).limit(1000).get();
    return snap.docs.map((d) => d.data() as MembershipGrant);
  }
  return Object.values(readLocal());
}

/**
 * Board complimentary seats — lifetime Platinum for officers who are not the founder.
 * Founder already bypasses gates via Google founder token. Upsert on boot so Cloud Run
 * Firestore gets the grant without a manual CEO click after each revision.
 */
export const BOARD_COMPLIMENTARY_PLATINUM: ReadonlyArray<{
  email: string;
  reason: string;
}> = [
  {
    email: 'clearpath.brent@gmail.com',
    reason: 'Board CCO — lifetime ClearPath Platinum ($14.99 / AI Pattern Scanner seat)',
  },
];

export async function ensureBoardComplimentaryGrants(): Promise<string[]> {
  const touched: string[] = [];
  for (const seat of BOARD_COMPLIMENTARY_PLATINUM) {
    const email = normalizeEmail(seat.email);
    if (!email) continue;
    const existing = await getMembershipGrant(email);
    const existingTier = existing && isLive(existing) ? canonicalizePlanId(existing.tier) : 'basic';
    if (existing && isLive(existing) && tierRankOf(existingTier) >= tierRankOf('platinum') && !existing.expiresAt) {
      continue;
    }
    await saveMembershipGrants([email], {
      tier: 'platinum',
      reason: seat.reason,
      expiresAt: null,
      grantedBy: 'board-seed',
    });
    touched.push(email);
  }
  return touched;
}
