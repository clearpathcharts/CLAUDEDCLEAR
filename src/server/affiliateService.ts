/**
 * ClearPath Trader — Affiliate / referral rewards.
 * File-backed store (same pattern as private accounts + profiles).
 *
 * Rewards (honest, membership-linked):
 * - Unique share link per member: /r/:CODE
 * - Successful referred signup → counts toward monthly discount tier
 * - Discount tiers: 1→10%, 3→20%, 5→30%, 10→50% off next paid month
 * - Lifetime residual: referrer earns 25% of EVERY membership payment from
 *   members they brought in, for as long as those members stay active.
 *   Single-level only — no legs, no downline; credits stop with the referrer.
 * - Leaderboard ranks by successful referrals this calendar month
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { getAdminFirestore } from './firebaseAdmin';
import {
  AFFILIATE_BADGE_ID,
  AFFILIATE_BADGE_LABEL,
  AFFILIATE_BADGE_IMAGE,
  AFFILIATE_BADGE_THRESHOLD,
  grantAffiliateBadgeByUid,
} from './contractorBadges';
import { AFFILIATE_TERMS_VERSION } from '../content/affiliateTerms';

const DATA_DIR = path.join(process.cwd(), 'data', 'affiliate');
const STATE_FILE = 'state.json';
const DURABLE_COLLECTION = 'app_state';
const DURABLE_DOC = 'affiliate';
const COOKIE_NAME = 'cp_affiliate_ref';
const COOKIE_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

/** Residual rate: 25% of every membership payment, single-level, lifetime while active. */
export const AFFILIATE_RESIDUAL_RATE = 0.25;

/** First-month prices in cents (matches MembershipTab marketing tiers). */
export const TIER_PRICE_CENTS: Record<string, number> = {
  pro: 995,
  proplus: 1995,
  premium: 3095,
  ultimate: 6995,
  /** Legacy alias for the retired "Plus" tier — keeps old ledger entries/tools valid. */
  plus: 995,
};

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

/** Minimum accumulated credit before a cash payout can be requested. */
export const MIN_PAYOUT_CENTS = 2500;

export type AffiliateMember = {
  uid: string;
  code: string;
  referredByUid?: string;
  referredByCode?: string;
  createdAt: string;
  /** Set when the member accepts the Affiliate Agreement — the link is dormant until then. */
  activatedAt?: string;
  /** Version of the Affiliate Agreement accepted at activation. */
  termsVersion?: string;
  /** Successful referred signups (lifetime) */
  successfulReferrals: number;
  /** Account credit in cents toward membership */
  creditCents: number;
  /** Cached discount % for next paid month (from successful referrals this month) */
  discountPercent: number;
};

type AffiliateState = {
  members: Record<string, AffiliateMember>;
  codeToUid: Record<string, string>;
  clicks: AffiliateClick[];
  ledger: AffiliateLedgerEntry[];
  payouts: AffiliatePayoutRequest[];
};

function ensureDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}

function readState(): AffiliateState {
  ensureDir();
  const fp = path.join(DATA_DIR, STATE_FILE);
  if (!fs.existsSync(fp)) {
    return { members: {}, codeToUid: {}, clicks: [], ledger: [], payouts: [] };
  }
  try {
    const parsed = JSON.parse(fs.readFileSync(fp, 'utf8'));
    return {
      members: parsed.members && typeof parsed.members === 'object' ? parsed.members : {},
      codeToUid: parsed.codeToUid && typeof parsed.codeToUid === 'object' ? parsed.codeToUid : {},
      clicks: Array.isArray(parsed.clicks) ? parsed.clicks : [],
      ledger: Array.isArray(parsed.ledger) ? parsed.ledger : [],
      payouts: Array.isArray(parsed.payouts) ? parsed.payouts : [],
    };
  } catch {
    return { members: {}, codeToUid: {}, clicks: [], ledger: [], payouts: [] };
  }
}

function writeState(state: AffiliateState) {
  ensureDir();
  fs.writeFileSync(path.join(DATA_DIR, STATE_FILE), JSON.stringify(state, null, 2));
  // Write-through to Firestore so referral codes/credits survive redeploys.
  void pushStateToFirestore(state);
}

async function pushStateToFirestore(state: AffiliateState): Promise<boolean> {
  const db = getAdminFirestore();
  if (!db) return false;
  try {
    let json = JSON.stringify(state);
    if (json.length > 900_000) {
      // Trim history to stay under the 1MB Firestore doc limit; full copy stays local.
      json = JSON.stringify({
        ...state,
        clicks: state.clicks.slice(0, 500),
        ledger: state.ledger.slice(0, 2000),
      });
    }
    await db
      .collection(DURABLE_COLLECTION)
      .doc(DURABLE_DOC)
      .set({ json, updatedAt: new Date().toISOString() });
    return true;
  } catch (err) {
    console.warn('[affiliate] Firestore write-through failed (local copy saved):', err);
    return false;
  }
}

/**
 * Boot hydration: restore affiliate state from Firestore on a fresh container.
 * If Firestore is empty but this instance has local data, push it up instead.
 */
export async function hydrateAffiliateFromDurableStore(): Promise<{
  source: 'firestore' | 'local';
  members: number;
}> {
  const db = getAdminFirestore();
  const local = readState();
  if (!db) return { source: 'local', members: Object.keys(local.members).length };

  try {
    const doc = await db.collection(DURABLE_COLLECTION).doc(DURABLE_DOC).get();
    if (doc.exists) {
      const parsed = JSON.parse(String(doc.data()?.json || '{}')) as Partial<AffiliateState>;
      const remote: AffiliateState = {
        members: parsed.members && typeof parsed.members === 'object' ? parsed.members : {},
        codeToUid: parsed.codeToUid && typeof parsed.codeToUid === 'object' ? parsed.codeToUid : {},
        clicks: Array.isArray(parsed.clicks) ? parsed.clicks : [],
        ledger: Array.isArray(parsed.ledger) ? parsed.ledger : [],
        payouts: Array.isArray(parsed.payouts) ? parsed.payouts : [],
      };
      const remoteCount = Object.keys(remote.members).length;
      if (remoteCount >= Object.keys(local.members).length) {
        ensureDir();
        fs.writeFileSync(path.join(DATA_DIR, STATE_FILE), JSON.stringify(remote, null, 2));
        return { source: 'firestore', members: remoteCount };
      }
    }
  } catch (err) {
    console.warn('[affiliate] Firestore hydrate failed; keeping local state.', err);
    return { source: 'local', members: Object.keys(local.members).length };
  }

  // Firestore missing/behind → migrate this instance's state up.
  await pushStateToFirestore(local);
  return { source: 'local', members: Object.keys(local.members).length };
}

function generateCode(state: AffiliateState): string {
  for (let attempt = 0; attempt < 40; attempt++) {
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += CODE_ALPHABET[crypto.randomInt(0, CODE_ALPHABET.length)];
    }
    if (!state.codeToUid[code]) return code;
  }
  return `CP${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
}

export function monthKey(d = new Date()): string {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}

export function discountPercentForCount(successfulThisMonth: number): number {
  if (successfulThisMonth >= 10) return 50;
  if (successfulThisMonth >= 5) return 30;
  if (successfulThisMonth >= 3) return 20;
  if (successfulThisMonth >= 1) return 10;
  return 0;
}

function countSuccessfulReferralsInMonth(state: AffiliateState, uid: string, key: string): number {
  return state.ledger.filter(
    (e) =>
      e.uid === uid &&
      e.type === 'signup_bonus_slot' &&
      typeof e.meta?.month === 'string' &&
      e.meta.month === key
  ).length;
}

function refreshDiscount(state: AffiliateState, uid: string) {
  const member = state.members[uid];
  if (!member) return;
  const n = countSuccessfulReferralsInMonth(state, uid, monthKey());
  member.discountPercent = discountPercentForCount(n);
}

/** Ensure member has an affiliate code (idempotent). */
export function ensureAffiliateMember(uid: string): AffiliateMember {
  const state = readState();
  if (state.members[uid]) {
    refreshDiscount(state, uid);
    writeState(state);
    return state.members[uid];
  }
  const code = generateCode(state);
  const member: AffiliateMember = {
    uid,
    code,
    createdAt: new Date().toISOString(),
    successfulReferrals: 0,
    creditCents: 0,
    discountPercent: 0,
  };
  state.members[uid] = member;
  state.codeToUid[code] = uid;
  writeState(state);
  return member;
}

/**
 * Accept the Affiliate Agreement and switch the member's link live.
 * Idempotent — re-activating just refreshes the accepted terms version.
 */
export function activateAffiliate(uid: string): AffiliateMember {
  ensureAffiliateMember(uid);
  const state = readState();
  const member = state.members[uid]!;
  if (!member.activatedAt) member.activatedAt = new Date().toISOString();
  member.termsVersion = AFFILIATE_TERMS_VERSION;
  writeState(state);
  return member;
}

export function resolveCode(code: string): AffiliateMember | null {
  const normalized = String(code || '')
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '');
  if (!normalized) return null;
  const state = readState();
  const uid = state.codeToUid[normalized];
  if (!uid) return null;
  const member = state.members[uid] || null;
  // Dormant links don't attract clicks or attribution until the owner activates.
  if (!member?.activatedAt) return null;
  return member;
}

export function recordClick(input: {
  code: string;
  ip?: string;
  userAgent?: string;
}): { ok: boolean; referrerUid?: string; code?: string; error?: string } {
  const member = resolveCode(input.code);
  if (!member) return { ok: false, error: 'Unknown referral code' };
  const state = readState();
  const click: AffiliateClick = {
    id: `clk_${crypto.randomBytes(8).toString('hex')}`,
    code: member.code,
    referrerUid: member.uid,
    at: new Date().toISOString(),
    ipHash: input.ip
      ? crypto.createHash('sha256').update(input.ip).digest('hex').slice(0, 16)
      : undefined,
    userAgent: input.userAgent ? String(input.userAgent).slice(0, 180) : undefined,
  };
  state.clicks.unshift(click);
  state.clicks = state.clicks.slice(0, 5000);
  writeState(state);
  return { ok: true, referrerUid: member.uid, code: member.code };
}

/**
 * Attribute a new signup to a referrer (from cookie/code).
 * Cannot self-refer. First attribution wins.
 */
export function attributeSignup(input: {
  newUid: string;
  referralCode?: string | null;
}): { attributed: boolean; referrerUid?: string; discountPercent?: number } {
  const state = readState();
  ensureAffiliateMember(input.newUid);
  const fresh = readState();
  const newbie = fresh.members[input.newUid];
  if (!newbie) return { attributed: false };
  if (newbie.referredByUid) {
    return { attributed: true, referrerUid: newbie.referredByUid };
  }

  const code = String(input.referralCode || '')
    .trim()
    .toUpperCase();
  if (!code) return { attributed: false };

  const referrerUid = fresh.codeToUid[code];
  if (!referrerUid || referrerUid === input.newUid) return { attributed: false };
  const referrer = fresh.members[referrerUid];
  if (!referrer) return { attributed: false };
  // Only activated affiliates (accepted Agreement) earn referrals.
  if (!referrer.activatedAt) return { attributed: false };

  newbie.referredByUid = referrerUid;
  newbie.referredByCode = code;

  referrer.successfulReferrals = (referrer.successfulReferrals || 0) + 1;
  const key = monthKey();
  fresh.ledger.unshift({
    id: `led_${crypto.randomBytes(8).toString('hex')}`,
    uid: referrerUid,
    type: 'signup_bonus_slot',
    amountCents: 0,
    note: `Successful referral signup (${code})`,
    relatedUid: input.newUid,
    createdAt: new Date().toISOString(),
    meta: { month: key },
  });
  fresh.ledger = fresh.ledger.slice(0, 10000);
  refreshDiscount(fresh, referrerUid);
  writeState(fresh);

  // Certified Affiliate badge unlocks at the lifetime referral threshold.
  if ((referrer.successfulReferrals || 0) >= AFFILIATE_BADGE_THRESHOLD) {
    try {
      const grant = grantAffiliateBadgeByUid(referrerUid);
      if (grant.granted) {
        console.log(
          `[affiliate] Certified Affiliate badge granted to ${referrerUid} (${referrer.successfulReferrals} referrals)`
        );
      }
    } catch (err) {
      console.warn('[affiliate] Badge grant failed (will retry on dashboard load):', err);
    }
  }

  return {
    attributed: true,
    referrerUid,
    discountPercent: fresh.members[referrerUid]?.discountPercent || 0,
  };
}

/**
 * Credit the referrer 25% of a referred member's membership payment.
 * Lifetime residual: call once per billing period (pass `periodKey`, e.g. the
 * period end date) — each period credits once, forever, while they stay active.
 * Single-level: only the direct referrer earns; there are no legs.
 */
export function markReferredPaid(input: {
  referredUid: string;
  tier: keyof typeof TIER_PRICE_CENTS;
  /** Billing-period identifier for residuals (defaults to 'first' = one-time). */
  periodKey?: string;
  /** Actual payment amount in cents (e.g. yearly price); defaults to the tier's monthly price. */
  amountCents?: number;
}): { ok: boolean; creditCents?: number; referrerUid?: string; error?: string } {
  const tier = input.tier;
  const price = input.amountCents || TIER_PRICE_CENTS[tier];
  if (!price) return { ok: false, error: 'Invalid tier' };

  const state = readState();
  const referred = state.members[input.referredUid];
  if (!referred?.referredByUid) {
    return { ok: false, error: 'User has no referrer' };
  }
  const referrerUid = referred.referredByUid;
  const periodKey = String(input.periodKey || 'first').replace(/[^a-zA-Z0-9:_-]/g, '').slice(0, 64);
  const idempotencyKey = `paid:${input.referredUid}:${tier}:${periodKey}`;
  const legacyKey = `paid:${input.referredUid}:${tier}`;
  if (
    state.ledger.some(
      (e) => e.meta?.idempotencyKey === idempotencyKey ||
        (periodKey === 'first' && e.meta?.idempotencyKey === legacyKey)
    )
  ) {
    return { ok: true, creditCents: 0, referrerUid };
  }

  const creditCents = Math.round(price * AFFILIATE_RESIDUAL_RATE);
  const referrer = state.members[referrerUid];
  if (!referrer) return { ok: false, error: 'Referrer missing' };

  referrer.creditCents = (referrer.creditCents || 0) + creditCents;
  state.ledger.unshift({
    id: `led_${crypto.randomBytes(8).toString('hex')}`,
    uid: referrerUid,
    type: 'paid_conversion_credit',
    amountCents: creditCents,
    note: `25% residual from ${tier} referral (period ${periodKey})`,
    relatedUid: input.referredUid,
    createdAt: new Date().toISOString(),
    meta: { idempotencyKey, tier, periodKey },
  });
  state.ledger = state.ledger.slice(0, 10000);
  refreshDiscount(state, referrerUid);
  writeState(state);
  return { ok: true, creditCents, referrerUid };
}

function pendingPayoutCents(state: AffiliateState, uid: string): number {
  return state.payouts
    .filter((p) => p.uid === uid && p.status === 'requested')
    .reduce((sum, p) => sum + p.amountCents, 0);
}

/**
 * Member requests a cash payout of their available credit ($25 minimum).
 * The amount is reserved until an admin marks it paid (or rejects it).
 */
export function requestAffiliatePayout(input: {
  uid: string;
  method: string;
  destination: string;
}): { ok: boolean; payout?: AffiliatePayoutRequest; error?: string } {
  const method = String(input.method || 'paypal').trim().slice(0, 40);
  const destination = String(input.destination || '').trim().slice(0, 160);
  if (!destination) {
    return { ok: false, error: 'Payout destination required (e.g. your PayPal email).' };
  }

  const state = readState();
  const member = state.members[input.uid];
  if (!member) return { ok: false, error: 'No affiliate record for this member.' };

  const available = (member.creditCents || 0) - pendingPayoutCents(state, input.uid);
  if (available < MIN_PAYOUT_CENTS) {
    return {
      ok: false,
      error: `Minimum payout is $${(MIN_PAYOUT_CENTS / 100).toFixed(2)}. Available: $${(Math.max(0, available) / 100).toFixed(2)}.`,
    };
  }

  const payout: AffiliatePayoutRequest = {
    id: `pay_${crypto.randomBytes(8).toString('hex')}`,
    uid: input.uid,
    amountCents: available,
    method,
    destination,
    status: 'requested',
    requestedAt: new Date().toISOString(),
  };
  state.payouts.unshift(payout);
  state.payouts = state.payouts.slice(0, 2000);
  state.ledger.unshift({
    id: `led_${crypto.randomBytes(8).toString('hex')}`,
    uid: input.uid,
    type: 'payout_requested',
    amountCents: available,
    note: `Payout requested via ${method}`,
    createdAt: payout.requestedAt,
    meta: { payoutId: payout.id },
  });
  state.ledger = state.ledger.slice(0, 10000);
  writeState(state);
  return { ok: true, payout };
}

/** Admin settles (or rejects) a payout request. Paid → credit is deducted. */
export function adminResolvePayout(input: {
  payoutId: string;
  action: 'paid' | 'rejected';
}): { ok: boolean; payout?: AffiliatePayoutRequest; error?: string } {
  const state = readState();
  const payout = state.payouts.find((p) => p.id === input.payoutId);
  if (!payout) return { ok: false, error: 'Payout request not found' };
  if (payout.status !== 'requested') {
    return { ok: false, error: `Payout already ${payout.status}` };
  }

  payout.status = input.action;
  payout.resolvedAt = new Date().toISOString();

  if (input.action === 'paid') {
    const member = state.members[payout.uid];
    if (member) {
      member.creditCents = Math.max(0, (member.creditCents || 0) - payout.amountCents);
    }
    state.ledger.unshift({
      id: `led_${crypto.randomBytes(8).toString('hex')}`,
      uid: payout.uid,
      type: 'credit_redeemed',
      amountCents: -payout.amountCents,
      note: `Payout sent via ${payout.method} to ${payout.destination}`,
      createdAt: payout.resolvedAt,
      meta: { payoutId: payout.id },
    });
    state.ledger = state.ledger.slice(0, 10000);
  }

  writeState(state);
  return { ok: true, payout };
}

/** Admin: all payout requests, newest first. */
export function adminListPayouts(limit = 200): AffiliatePayoutRequest[] {
  return readState().payouts.slice(0, limit);
}

export function getAffiliateDashboard(uid: string, siteOrigin: string) {
  const member = ensureAffiliateMember(uid);

  // Retroactive badge check — covers referrals earned before this feature shipped.
  let badgeEarned = false;
  if ((member.successfulReferrals || 0) >= AFFILIATE_BADGE_THRESHOLD) {
    try {
      const grant = grantAffiliateBadgeByUid(uid);
      badgeEarned = grant.granted || grant.already;
    } catch {
      badgeEarned = true; // threshold met; grant retries next load
    }
  }

  const state = readState();
  const key = monthKey();
  const monthSignups = countSuccessfulReferralsInMonth(state, uid, key);
  const shareUrl = `${siteOrigin.replace(/\/$/, '')}/r/${member.code}`;
  const ledger = state.ledger.filter((e) => e.uid === uid).slice(0, 50);
  const recentClicks = state.clicks.filter((c) => c.referrerUid === uid).slice(0, 30);
  const referred = Object.values(state.members)
    .filter((m) => m.referredByUid === uid)
    .map((m) => ({
      uid: m.uid,
      joinedAt: m.createdAt,
      codeUsed: m.referredByCode,
    }))
    .sort((a, b) => (a.joinedAt < b.joinedAt ? 1 : -1))
    .slice(0, 100);

  return {
    code: member.code,
    shareUrl,
    activated: Boolean(member.activatedAt),
    activatedAt: member.activatedAt || null,
    termsVersion: member.termsVersion || null,
    termsCurrentVersion: AFFILIATE_TERMS_VERSION,
    successfulReferrals: member.successfulReferrals,
    monthSignups,
    discountPercent: discountPercentForCount(monthSignups),
    creditCents: member.creditCents || 0,
    creditDisplay: `$${((member.creditCents || 0) / 100).toFixed(2)}`,
    referredByUid: member.referredByUid || null,
    rewardTiers: [
      { min: 1, discountPercent: 10, label: '1 friend this month → 10% off' },
      { min: 3, discountPercent: 20, label: '3 friends this month → 20% off' },
      { min: 5, discountPercent: 30, label: '5 friends this month → 30% off' },
      { min: 10, discountPercent: 50, label: '10 friends this month → 50% off' },
    ],
    paidCreditRule: 'Earn a 25% residual on every membership payment from members you bring in — for life, as long as they stay active. Single-level only: your affiliate number starts and stops with you. No legs, no downline, not an MLM.',
    payout: {
      minimumCents: MIN_PAYOUT_CENTS,
      minimumDisplay: `$${(MIN_PAYOUT_CENTS / 100).toFixed(2)}`,
      availableCents: Math.max(0, (member.creditCents || 0) - pendingPayoutCents(state, uid)),
      pending: state.payouts.filter((p) => p.uid === uid && p.status === 'requested').slice(0, 10),
      history: state.payouts.filter((p) => p.uid === uid && p.status !== 'requested').slice(0, 10),
      rule: `Once your credit reaches $${(MIN_PAYOUT_CENTS / 100).toFixed(2)}, request a payout from your Affiliate Network tab — sent within 5 business days — or apply the credit to your own membership anytime.`,
    },
    affiliateBadge: {
      id: AFFILIATE_BADGE_ID,
      label: AFFILIATE_BADGE_LABEL,
      imageUrl: AFFILIATE_BADGE_IMAGE,
      threshold: AFFILIATE_BADGE_THRESHOLD,
      progress: Math.min(member.successfulReferrals || 0, AFFILIATE_BADGE_THRESHOLD),
      remaining: Math.max(0, AFFILIATE_BADGE_THRESHOLD - (member.successfulReferrals || 0)),
      earned: badgeEarned,
      rule: `Bring ${AFFILIATE_BADGE_THRESHOLD} members to ClearPath and the Certified Affiliate badge is added to your profile automatically.`,
    },
    ledger,
    recentClicks,
    referred,
    monthKey: key,
  };
}

export function getLeaderboard(limit = 25) {
  const state = readState();
  const key = monthKey();
  const rows = Object.values(state.members).map((m) => {
    const monthSignups = countSuccessfulReferralsInMonth(state, m.uid, key);
    return {
      uid: m.uid,
      code: m.code,
      monthSignups,
      lifetimeReferrals: m.successfulReferrals,
      discountPercent: discountPercentForCount(monthSignups),
      creditCents: m.creditCents || 0,
    };
  });
  rows.sort((a, b) => b.monthSignups - a.monthSignups || b.lifetimeReferrals - a.lifetimeReferrals);
  return {
    monthKey: key,
    leaders: rows.filter((r) => r.monthSignups > 0 || r.lifetimeReferrals > 0).slice(0, limit),
  };
}

export function adminListAffiliates(limit = 200) {
  const state = readState();
  return Object.values(state.members)
    .sort((a, b) => b.successfulReferrals - a.successfulReferrals)
    .slice(0, limit);
}

export const AFFILIATE_COOKIE = COOKIE_NAME;
export const AFFILIATE_COOKIE_MAX_AGE_MS = COOKIE_MAX_AGE_MS;
