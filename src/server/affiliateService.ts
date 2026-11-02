/**
 * Membership affiliate / referral program — REMOVED.
 *
 * Not part of the ClearPath Trader business model. Former surfaces
 * (/r/:CODE cookies, signup attribution, monthly discount tiers,
 * 25% lifetime residuals, payout requests, leaderboard) are inert.
 *
 * This module remains only so boot/tests can assert the program is off
 * and that no code path can credit referrals or write affiliate state.
 * Durable store `app_state/affiliate` is never read or written.
 */

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
