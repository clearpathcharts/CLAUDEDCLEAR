/**
 * ClearPath Trader — Affiliate / referral rewards.
 * File-backed store (same pattern as private accounts + profiles).
 *
 * Rewards (honest, membership-linked):
 * - Unique share link per member: /r/:CODE
 * - Successful referred signup → counts toward monthly discount tier
 * - Discount tiers: 1→10%, 3→20%, 5→30%, 10→50% off next paid month
 * - When a referred member is marked paid → referrer earns 20% of that tier’s
 *   first-month price as account credit (cents)
 * - Leaderboard ranks by successful referrals this calendar month
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { getAdminFirestore } from './firebaseAdmin';

const DATA_DIR = path.join(process.cwd(), 'data', 'affiliate');
const STATE_FILE = 'state.json';
const DURABLE_COLLECTION = 'app_state';
const DURABLE_DOC = 'affiliate';
const COOKIE_NAME = 'cp_affiliate_ref';
const COOKIE_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

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
  type: 'signup_bonus_slot' | 'paid_conversion_credit' | 'admin_adjustment' | 'credit_redeemed';
  amountCents: number;
  note: string;
  relatedUid?: string;
  createdAt: string;
  meta?: Record<string, string | number | boolean>;
};

export type AffiliateMember = {
  uid: string;
  code: string;
  referredByUid?: string;
  referredByCode?: string;
  createdAt: string;
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
};

function ensureDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}

function readState(): AffiliateState {
  ensureDir();
  const fp = path.join(DATA_DIR, STATE_FILE);
  if (!fs.existsSync(fp)) {
    return { members: {}, codeToUid: {}, clicks: [], ledger: [] };
  }
  try {
    const parsed = JSON.parse(fs.readFileSync(fp, 'utf8'));
    return {
      members: parsed.members && typeof parsed.members === 'object' ? parsed.members : {},
      codeToUid: parsed.codeToUid && typeof parsed.codeToUid === 'object' ? parsed.codeToUid : {},
      clicks: Array.isArray(parsed.clicks) ? parsed.clicks : [],
      ledger: Array.isArray(parsed.ledger) ? parsed.ledger : [],
    };
  } catch {
    return { members: {}, codeToUid: {}, clicks: [], ledger: [] };
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

export function resolveCode(code: string): AffiliateMember | null {
  const normalized = String(code || '')
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '');
  if (!normalized) return null;
  const state = readState();
  const uid = state.codeToUid[normalized];
  if (!uid) return null;
  return state.members[uid] || null;
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
  return {
    attributed: true,
    referrerUid,
    discountPercent: fresh.members[referrerUid]?.discountPercent || 0,
  };
}

/** Mark a referred user as paid → credit referrer 20% of first month. Idempotent per referredUid+tier. */
export function markReferredPaid(input: {
  referredUid: string;
  tier: keyof typeof TIER_PRICE_CENTS;
}): { ok: boolean; creditCents?: number; referrerUid?: string; error?: string } {
  const tier = input.tier;
  const price = TIER_PRICE_CENTS[tier];
  if (!price) return { ok: false, error: 'Invalid tier' };

  const state = readState();
  const referred = state.members[input.referredUid];
  if (!referred?.referredByUid) {
    return { ok: false, error: 'User has no referrer' };
  }
  const referrerUid = referred.referredByUid;
  const idempotencyKey = `paid:${input.referredUid}:${tier}`;
  if (state.ledger.some((e) => e.meta?.idempotencyKey === idempotencyKey)) {
    return { ok: true, creditCents: 0, referrerUid };
  }

  const creditCents = Math.round(price * 0.2);
  const referrer = state.members[referrerUid];
  if (!referrer) return { ok: false, error: 'Referrer missing' };

  referrer.creditCents = (referrer.creditCents || 0) + creditCents;
  state.ledger.unshift({
    id: `led_${crypto.randomBytes(8).toString('hex')}`,
    uid: referrerUid,
    type: 'paid_conversion_credit',
    amountCents: creditCents,
    note: `20% first-month credit from ${tier} referral`,
    relatedUid: input.referredUid,
    createdAt: new Date().toISOString(),
    meta: { idempotencyKey, tier },
  });
  state.ledger = state.ledger.slice(0, 10000);
  refreshDiscount(state, referrerUid);
  writeState(state);
  return { ok: true, creditCents, referrerUid };
}

export function getAffiliateDashboard(uid: string, siteOrigin: string) {
  const member = ensureAffiliateMember(uid);
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
    paidCreditRule: 'When a referred friend upgrades to a paid plan, you earn 20% of their first month as account credit.',
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
