/**
 * Stripe membership billing — server-side only.
 *
 * Pricing model (founder sheet):
 *   Basic     $0
 *   Pro       $9.95/mo   or $7.95/mo billed yearly
 *   Pro+      $19.95/mo  or $15.95/mo billed yearly
 *   Premium   $30.95/mo  or $25.95/mo billed yearly
 *   Ultimate  $69.95/mo  or $64.95/mo billed yearly
 *
 * Free structure:
 *   1. Launch gift — every account gets ULTIMATE features free for its first
 *      15 days (app-side entitlement, no card, tracked in the profile store).
 *   2. Stripe trial — when the member picks a paid plan, checkout starts a
 *      15-day free trial on that plan, so the first charge lands ~day 30.
 *
 * - Checkout Sessions (mode: subscription) for the paid membership tiers.
 * - Signature-verified webhook marks members paid/unpaid in the server profile
 *   store (the client can never write its own membership).
 * - Degrades gracefully: without STRIPE_SECRET_KEY the app boots and the
 *   membership page falls back to its Payment Link catalog.
 *
 * Prices: prefer Dashboard Price IDs via STRIPE_PRICE_<TIER>_<INTERVAL> env
 * vars. When unset, inline price_data is used so checkout works with zero
 * Dashboard setup.
 */
import Stripe from 'stripe';
import { getStripeSecretKey, getStripeWebhookSecret } from './secrets';
import { readProfile, writeProfile, type StoredProfile } from './profileStore';
import { markReferredPaid } from './affiliateService';

export type MembershipTierId = 'pro' | 'proplus' | 'premium' | 'ultimate';
export type BillingInterval = 'month' | 'year';

export const PLAN_TRIAL_DAYS = 15;
export const LAUNCH_TRIAL_DAYS = 15;

type TierDef = {
  name: string;
  monthlyCents: number;
  /** Full charge for a year (12 × discounted per-month rate). */
  yearlyCents: number;
  /** Discounted per-month rate when billed yearly (display only). */
  yearlyPerMonthCents: number;
  priceEnvMonthly: string;
  priceEnvYearly: string;
};

const TIER_DEFS: Record<MembershipTierId, TierDef> = {
  pro: {
    name: 'ClearPath Pro',
    monthlyCents: 995,
    yearlyCents: 9540,
    yearlyPerMonthCents: 795,
    priceEnvMonthly: 'STRIPE_PRICE_PRO_MONTHLY',
    priceEnvYearly: 'STRIPE_PRICE_PRO_YEARLY',
  },
  proplus: {
    name: 'ClearPath Pro+',
    monthlyCents: 1995,
    yearlyCents: 19140,
    yearlyPerMonthCents: 1595,
    priceEnvMonthly: 'STRIPE_PRICE_PROPLUS_MONTHLY',
    priceEnvYearly: 'STRIPE_PRICE_PROPLUS_YEARLY',
  },
  premium: {
    name: 'ClearPath Premium',
    monthlyCents: 3095,
    yearlyCents: 31140,
    yearlyPerMonthCents: 2595,
    priceEnvMonthly: 'STRIPE_PRICE_PREMIUM_MONTHLY',
    priceEnvYearly: 'STRIPE_PRICE_PREMIUM_YEARLY',
  },
  ultimate: {
    name: 'ClearPath Ultimate',
    monthlyCents: 6995,
    yearlyCents: 77940,
    yearlyPerMonthCents: 6495,
    priceEnvMonthly: 'STRIPE_PRICE_ULTIMATE_MONTHLY',
    priceEnvYearly: 'STRIPE_PRICE_ULTIMATE_YEARLY',
  },
};

export function isMembershipTier(value: unknown): value is MembershipTierId {
  return typeof value === 'string' && value in TIER_DEFS;
}

export function isBillingInterval(value: unknown): value is BillingInterval {
  return value === 'month' || value === 'year';
}

export class StripeServiceError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

let cachedClient: Stripe | null = null;
let cachedKey = '';

export function getStripeClient(): Stripe | null {
  const key = getStripeSecretKey();
  if (!key) return null;
  if (!cachedClient || cachedKey !== key) {
    cachedClient = new Stripe(key);
    cachedKey = key;
  }
  return cachedClient;
}

export function stripeConfigured(): boolean {
  return Boolean(getStripeSecretKey());
}

/** Boolean-presence config for diagnostics + the membership UI. No key material. */
export function getStripeConfigReport() {
  return {
    configured: stripeConfigured(),
    webhookConfigured: Boolean(getStripeWebhookSecret()),
    planTrialDays: PLAN_TRIAL_DAYS,
    launchTrialDays: LAUNCH_TRIAL_DAYS,
    tiers: (Object.keys(TIER_DEFS) as MembershipTierId[]).map((id) => ({
      id,
      name: TIER_DEFS[id].name,
      monthlyCents: TIER_DEFS[id].monthlyCents,
      yearlyCents: TIER_DEFS[id].yearlyCents,
      yearlyPerMonthCents: TIER_DEFS[id].yearlyPerMonthCents,
      dashboardPriceConfigured:
        Boolean((process.env[TIER_DEFS[id].priceEnvMonthly] || '').trim()) ||
        Boolean((process.env[TIER_DEFS[id].priceEnvYearly] || '').trim()),
    })),
  };
}

export async function createMembershipCheckoutSession(input: {
  uid: string;
  email?: string;
  tier: MembershipTierId;
  interval: BillingInterval;
  origin: string;
}): Promise<{ url: string }> {
  const stripe = getStripeClient();
  if (!stripe) {
    throw new StripeServiceError('Stripe is not configured on this server (STRIPE_SECRET_KEY missing).', 503);
  }
  const def = TIER_DEFS[input.tier];
  if (!def) {
    throw new StripeServiceError(`Unknown membership tier "${input.tier}".`, 400);
  }
  const yearly = input.interval === 'year';
  const amountCents = yearly ? def.yearlyCents : def.monthlyCents;
  const priceEnv = yearly ? def.priceEnvYearly : def.priceEnvMonthly;

  const dashboardPriceId = (process.env[priceEnv] || '').trim();
  const lineItem: Stripe.Checkout.SessionCreateParams.LineItem = dashboardPriceId
    ? { price: dashboardPriceId, quantity: 1 }
    : {
        price_data: {
          currency: 'usd',
          unit_amount: amountCents,
          recurring: { interval: input.interval },
          product_data: {
            name: def.name,
            description: yearly
              ? `ClearPath Trader ${def.name} yearly membership ($${(def.yearlyPerMonthCents / 100).toFixed(2)}/mo billed annually)`
              : `ClearPath Trader ${def.name} monthly membership`,
          },
        },
        quantity: 1,
      };

  const params: Stripe.Checkout.SessionCreateParams = {
    mode: 'subscription',
    // Never pass payment_method_types — let Stripe pick eligible methods dynamically.
    line_items: [lineItem],
    client_reference_id: input.uid,
    metadata: { uid: input.uid, tier: input.tier, interval: input.interval },
    subscription_data: {
      // Chosen plan is free for 15 days; first charge lands after the trial.
      trial_period_days: PLAN_TRIAL_DAYS,
      metadata: { uid: input.uid, tier: input.tier, interval: input.interval },
    },
    allow_promotion_codes: true,
    success_url: `${input.origin}/?membership=success&tier=${input.tier}&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${input.origin}/?membership=cancelled`,
  };
  if (input.email) params.customer_email = input.email;

  const session = await stripe.checkout.sessions.create({
    ...params,
    // Dashboard flow-tracking label (ignored by older API versions).
    integration_identifier: 'clearpath-membership-vqxkrmwt',
  } as Stripe.Checkout.SessionCreateParams);

  if (!session.url) {
    throw new StripeServiceError('Stripe did not return a checkout URL.', 502);
  }
  return { url: session.url };
}

/** Verify webhook signature against the raw request body. Throws on failure. */
export function verifyStripeWebhook(rawBody: Buffer, signature: string): Stripe.Event {
  const stripe = getStripeClient();
  const webhookSecret = getStripeWebhookSecret();
  if (!stripe || !webhookSecret) {
    throw new StripeServiceError('Stripe webhook is not configured (STRIPE_WEBHOOK_SECRET missing).', 503);
  }
  try {
    return stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err: any) {
    throw new StripeServiceError(`Webhook signature verification failed: ${err?.message || err}`, 400);
  }
}

type MembershipRecord = NonNullable<StoredProfile['membership']>;

function saveMembership(
  uid: string,
  patch: Partial<MembershipRecord> & { tier: string; status: MembershipRecord['status'] }
): MembershipRecord {
  const prev = readProfile(uid)?.membership;
  const next: MembershipRecord = {
    ...prev,
    ...patch,
    updatedAt: new Date().toISOString(),
  };
  if ((patch.status === 'active' || patch.status === 'trialing') && !prev?.activatedAt) {
    next.activatedAt = new Date().toISOString();
  }
  writeProfile(uid, { membership: next });
  console.log(`[Stripe] membership ${patch.status} → uid=${uid} tier=${patch.tier}`);
  return next;
}

/**
 * Lifetime residual: credit the referrer 25% of every paid billing period.
 * Idempotent per period (keyed on currentPeriodEnd), so webhook retries and
 * repeated subscription.updated events never double-credit.
 */
function creditAffiliateResidual(uid: string, record: MembershipRecord, interval?: string) {
  if (record.status !== 'active') return;
  const def = TIER_DEFS[record.tier as MembershipTierId];
  const amountCents = def
    ? (interval === 'year' ? def.yearlyCents : def.monthlyCents)
    : undefined;
  try {
    markReferredPaid({
      referredUid: uid,
      tier: record.tier,
      amountCents,
      periodKey: record.currentPeriodEnd || 'first',
    });
  } catch (err: any) {
    console.warn('[Stripe] affiliate residual credit skipped:', err?.message || err);
  }
}

function mapSubscriptionStatus(status: Stripe.Subscription.Status): MembershipRecord['status'] {
  if (status === 'active') return 'active';
  if (status === 'trialing') return 'trialing';
  if (status === 'past_due' || status === 'unpaid') return 'past_due';
  return 'canceled';
}

function subscriptionPeriodEnd(sub: Stripe.Subscription): string | undefined {
  // current_period_end moved from the subscription to its items on newer API versions.
  const raw =
    (sub as unknown as { current_period_end?: number }).current_period_end ??
    sub.items?.data?.[0]?.current_period_end;
  return typeof raw === 'number' ? new Date(raw * 1000).toISOString() : undefined;
}

/** Process a verified Stripe event. Idempotent — safe on webhook retries. */
export async function handleStripeEvent(event: Stripe.Event): Promise<{ handled: boolean }> {
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.mode !== 'subscription') return { handled: false };
      const uid = String(session.client_reference_id || session.metadata?.uid || '').trim();
      const tier = String(session.metadata?.tier || '').trim();
      if (!uid || !isMembershipTier(tier)) {
        console.warn('[Stripe] checkout.session.completed missing uid/tier metadata — skipped.');
        return { handled: false };
      }
      // Every new subscription starts in its 15-day free trial.
      saveMembership(uid, {
        tier,
        status: 'trialing',
        stripeCustomerId: typeof session.customer === 'string' ? session.customer : session.customer?.id,
        stripeSubscriptionId:
          typeof session.subscription === 'string' ? session.subscription : session.subscription?.id,
      });
      return { handled: true };
    }
    case 'customer.subscription.updated':
    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription;
      const uid = String(sub.metadata?.uid || '').trim();
      if (!uid) return { handled: false };
      const tier = String(sub.metadata?.tier || '').trim() || 'pro';
      const status =
        event.type === 'customer.subscription.deleted' ? 'canceled' : mapSubscriptionStatus(sub.status);
      const record = saveMembership(uid, {
        tier,
        status,
        stripeCustomerId: typeof sub.customer === 'string' ? sub.customer : sub.customer?.id,
        stripeSubscriptionId: sub.id,
        currentPeriodEnd: subscriptionPeriodEnd(sub),
      });
      creditAffiliateResidual(uid, record, String(sub.metadata?.interval || 'month'));
      return { handled: true };
    }
    default:
      return { handled: false };
  }
}

export type MembershipStatusReport = {
  active: boolean;
  tier: string | null;
  /** 'active' | 'trialing' | 'past_due' | 'canceled' | 'launch_trial' | null */
  status: string | null;
  currentPeriodEnd?: string;
  /** Launch-gift countdown (Ultimate free for the first 15 days). */
  launchTrialEndsAt?: string;
  launchTrialDaysLeft?: number;
};

/**
 * Server-trusted membership status for the signed-in user.
 * Starts the 15-day Ultimate launch gift on first read if the user has no
 * Stripe membership yet.
 */
export function getMembershipStatus(uid: string): MembershipStatusReport {
  const profile = readProfile(uid);
  const membership = profile?.membership;

  // A Stripe subscription (any state except canceled) always wins over the launch gift.
  if (membership && membership.status !== 'canceled') {
    return {
      active: membership.status === 'active' || membership.status === 'trialing',
      tier: membership.tier,
      status: membership.status,
      currentPeriodEnd: membership.currentPeriodEnd,
    };
  }

  let launchTrial = profile?.launchTrial;
  if (!launchTrial?.startedAt) {
    launchTrial = { startedAt: new Date().toISOString() };
    try {
      writeProfile(uid, { launchTrial });
    } catch (err) {
      console.warn('[Stripe] could not persist launch trial start:', err);
    }
  }
  const endsAt = new Date(launchTrial.startedAt).getTime() + LAUNCH_TRIAL_DAYS * 24 * 60 * 60 * 1000;
  const msLeft = endsAt - Date.now();
  if (msLeft > 0) {
    return {
      active: true,
      tier: 'ultimate',
      status: 'launch_trial',
      launchTrialEndsAt: new Date(endsAt).toISOString(),
      launchTrialDaysLeft: Math.max(1, Math.ceil(msLeft / (24 * 60 * 60 * 1000))),
    };
  }

  return {
    active: false,
    tier: membership?.tier || null,
    status: membership?.status || null,
  };
}
