/**
 * Membership affiliate / referral program — REMOVED.
 *
 * Not part of the ClearPath Trader business model. Former surfaces
 * (/r/:CODE cookies, signup attribution, monthly discount tiers,
 * 25% lifetime residuals, payout requests, leaderboard) are inert.
 *
 * This module remains only so boot/tests can assert the program is off
 * and that no code path can credit referrals. Historical durable state
 * at Firestore `app_state/affiliate` (and local `data/affiliate`) is
 * inspected and purged — never hydrated back into a live rewards engine.
 */

import fs from 'node:fs';
import path from 'node:path';
import { getAdminFirestore } from './firebaseAdmin';

export const AFFILIATE_PROGRAM_ENABLED = false;
export const AFFILIATE_DISABLED_MESSAGE =
  'Membership referral and affiliate rewards are not offered.';

/** Former residual rate — kept at 0 so any stray math cannot credit. */
export const AFFILIATE_RESIDUAL_RATE = 0;

/** Empty — checkout discounts must not use affiliate tier tables. */
export const TIER_PRICE_CENTS: Record<string, number> = {};

export const MIN_PAYOUT_CENTS = 0;

/** Legacy cookie name — never set by this build. */
export const AFFILIATE_COOKIE = 'cp_affiliate_ref';
export const AFFILIATE_COOKIE_MAX_AGE_MS = 0;

const DATA_DIR = path.join(process.cwd(), 'data', 'affiliate');
const STATE_FILE = 'state.json';
const DURABLE_COLLECTION = 'app_state';
const DURABLE_DOC = 'affiliate';

export type AffiliateClick = {
  id: string;
  code: string;
  referrerUid: string;
  at: string;
  ipHash?: string;
  userAgent?: string;
};

export type AffiliateLedgerEntry = {
  id: string;
  uid: string;
  type:
    | 'signup_bonus_slot'
    | 'paid_conversion_credit'
    | 'admin_adjustment'
    | 'credit_redeemed'
    | 'payout_requested';
  amountCents: number;
  note: string;
  relatedUid?: string;
  createdAt: string;
  meta?: Record<string, string | number | boolean>;
};

export type AffiliatePayoutRequest = {
  id: string;
  uid: string;
  amountCents: number;
  method: string;
  destination: string;
  status: 'requested' | 'paid' | 'rejected';
  requestedAt: string;
  resolvedAt?: string;
};

export type AffiliateMember = {
  uid: string;
  code: string;
  referredByUid?: string;
  referredByCode?: string;
  createdAt: string;
  activatedAt?: string;
  termsVersion?: string;
  successfulReferrals: number;
  creditCents: number;
  discountPercent: number;
};

function emptyMember(uid: string): AffiliateMember {
  return {
    uid,
    code: '',
    createdAt: new Date().toISOString(),
    successfulReferrals: 0,
    creditCents: 0,
    discountPercent: 0,
  };
}

export async function hydrateAffiliateFromDurableStore(): Promise<{
  source: 'disabled';
  members: number;
}> {
  return { source: 'disabled', members: 0 };
}

export type AffiliateDurableStatus = {
  localExists: boolean;
  localBytes: number;
  firestore: 'present' | 'absent' | 'no_credentials' | 'error';
  firestoreUpdatedAt: string | null;
  firestoreBytes: number;
  /** Best-effort parse of member count from leftover JSON (0 when absent/unreadable). */
  approxMembers: number;
  error?: string;
};

function summarizeLocalState(): { exists: boolean; bytes: number; approxMembers: number } {
  const fp = path.join(DATA_DIR, STATE_FILE);
  if (!fs.existsSync(fp)) return { exists: false, bytes: 0, approxMembers: 0 };
  try {
    const raw = fs.readFileSync(fp, 'utf8');
    const parsed = JSON.parse(raw) as { members?: Record<string, unknown> };
    const approxMembers =
      parsed.members && typeof parsed.members === 'object' ? Object.keys(parsed.members).length : 0;
    return { exists: true, bytes: Buffer.byteLength(raw, 'utf8'), approxMembers };
  } catch {
    try {
      return { exists: true, bytes: fs.statSync(fp).size, approxMembers: 0 };
    } catch {
      return { exists: true, bytes: 0, approxMembers: 0 };
    }
  }
}

/**
 * Read-only probe of leftover affiliate durable state.
 * Does not restore members into any live rewards path.
 */
export async function inspectAffiliateDurableStore(): Promise<AffiliateDurableStatus> {
  const local = summarizeLocalState();
  const status: AffiliateDurableStatus = {
    localExists: local.exists,
    localBytes: local.bytes,
    firestore: 'no_credentials',
    firestoreUpdatedAt: null,
    firestoreBytes: 0,
    approxMembers: local.approxMembers,
  };

  const db = getAdminFirestore();
  if (!db) return status;

  try {
    const doc = await db.collection(DURABLE_COLLECTION).doc(DURABLE_DOC).get();
    if (!doc.exists) {
      status.firestore = 'absent';
      return status;
    }
    status.firestore = 'present';
    const data = doc.data() || {};
    status.firestoreUpdatedAt =
      typeof data.updatedAt === 'string' ? data.updatedAt : null;
    const json = typeof data.json === 'string' ? data.json : '';
    status.firestoreBytes = Buffer.byteLength(json, 'utf8');
    try {
      const parsed = JSON.parse(json || '{}') as { members?: Record<string, unknown> };
      const remoteMembers =
        parsed.members && typeof parsed.members === 'object' ? Object.keys(parsed.members).length : 0;
      status.approxMembers = Math.max(status.approxMembers, remoteMembers);
    } catch {
      /* leave approxMembers as local */
    }
    return status;
  } catch (err: any) {
    status.firestore = 'error';
    status.error = err?.message || String(err);
    return status;
  }
}

export type AffiliateDurablePurgeResult = {
  ok: boolean;
  localDeleted: boolean;
  firestore: 'deleted' | 'absent' | 'no_credentials' | 'error';
  before: AffiliateDurableStatus;
  error?: string;
};

/**
 * Delete leftover affiliate durable state (local file + Firestore doc).
 * Safe to call repeatedly. Does not touch Stripe, private accounts, or profiles.
 */
export async function purgeAffiliateDurableStore(): Promise<AffiliateDurablePurgeResult> {
  const before = await inspectAffiliateDurableStore();
  let localDeleted = false;

  try {
    const fp = path.join(DATA_DIR, STATE_FILE);
    if (fs.existsSync(fp)) {
      fs.unlinkSync(fp);
      localDeleted = true;
    }
    if (fs.existsSync(DATA_DIR)) {
      try {
        fs.rmdirSync(DATA_DIR);
      } catch {
        /* non-empty or race — local state file is what mattered */
      }
    }
  } catch (err: any) {
    return {
      ok: false,
      localDeleted,
      firestore: 'error',
      before,
      error: err?.message || String(err),
    };
  }

  const db = getAdminFirestore();
  if (!db) {
    return { ok: true, localDeleted, firestore: 'no_credentials', before };
  }

  try {
    const ref = db.collection(DURABLE_COLLECTION).doc(DURABLE_DOC);
    const doc = await ref.get();
    if (!doc.exists) {
      return { ok: true, localDeleted, firestore: 'absent', before };
    }
    await ref.delete();
    return { ok: true, localDeleted, firestore: 'deleted', before };
  } catch (err: any) {
    return {
      ok: false,
      localDeleted,
      firestore: 'error',
      before,
      error: err?.message || String(err),
    };
  }
}

export function monthKey(d = new Date()): string {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}

export function discountPercentForCount(_successfulThisMonth: number): number {
  return 0;
}

export function ensureAffiliateMember(uid: string): AffiliateMember {
  return emptyMember(uid);
}

export function activateAffiliate(uid: string): AffiliateMember {
  return emptyMember(uid);
}

export function resolveCode(_code: string): AffiliateMember | null {
  return null;
}

export function recordClick(_input: {
  code: string;
  ip?: string;
  userAgent?: string;
}): { ok: false; code?: string; error: string } {
  return { ok: false, error: AFFILIATE_DISABLED_MESSAGE };
}

export function attributeSignup(_input: {
  newUid: string;
  referralCode?: string;
}): { attributed: false } {
  return { attributed: false };
}

export function markReferredPaid(_input: {
  referredUid: string;
  tier?: string;
  amountCents?: number;
  periodKey?: string;
}): { ok: false; creditCents: 0; error: string } {
  return { ok: false, creditCents: 0, error: AFFILIATE_DISABLED_MESSAGE };
}

export function requestAffiliatePayout(_input: {
  uid: string;
  method?: string;
  destination?: string;
}): { ok: false; error: string } {
  return { ok: false, error: AFFILIATE_DISABLED_MESSAGE };
}

export function adminResolvePayout(_input: {
  payoutId: string;
  action: 'paid' | 'rejected';
}): { ok: false; error: string } {
  return { ok: false, error: AFFILIATE_DISABLED_MESSAGE };
}

export function adminListPayouts(_limit = 200): AffiliatePayoutRequest[] {
  return [];
}

export function getAffiliateDashboard(_uid: string, _siteOrigin: string) {
  return {
    disabled: true,
    message: AFFILIATE_DISABLED_MESSAGE,
    code: null,
    shareUrl: null,
    activated: false,
    monthSignups: 0,
    discountPercent: 0,
    creditCents: 0,
    creditDisplay: '$0.00',
    referredByUid: null,
    tiers: [] as Array<{ min: number; discountPercent: number; label: string }>,
    paidCreditRule: AFFILIATE_DISABLED_MESSAGE,
    payout: {
      availableCents: 0,
      minPayoutCents: 0,
      enabled: false,
    },
    referrals: [] as Array<unknown>,
    ledger: [] as AffiliateLedgerEntry[],
    affiliateBadge: null,
  };
}

export function getLeaderboard(_limit = 25) {
  return {
    disabled: true,
    monthKey: monthKey(),
    leaders: [] as Array<unknown>,
  };
}

export function adminListAffiliates(_limit = 200) {
  return [];
}
