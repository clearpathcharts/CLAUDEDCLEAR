/**
 * Stripe membership billing — server-side only.
 *
 * Amounts come from MEMBERSHIP_PLANS (the /plans page), which must match the
 * Stripe product catalog (Silver / GOLD / PLATINUM). Checkout bills under the
 * catalog product of the same name when it exists.
 *
 * Legacy Stripe ids (pro / proplus / premium / ultimate) remain valid checkout
 * keys and charge the Silver / Gold / Platinum amount they canonicalize onto.
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
 * Prices: a recurring monthly Dashboard Price ID in STRIPE_PRICE_<TIER>_MONTHLY
 * wins. Otherwise inline price_data charges the /plans amount, attached to the
 * catalog product when one is found, so checkout works with zero env setup.
 * Billing is monthly only — the Stripe catalog has no yearly prices.
 */
import Stripe from 'stripe';
import { getStripeSecretKey, getStripeWebhookSecret } from './secrets';
import { readProfile, writeProfile, writeProfileDurable, type StoredProfile } from './profileStore';
import { markReferredPaid } from './affiliateService';
import { claimStripeWebhookEvent } from './stripeWebhookDedup';
import { membershipMonthlyCents } from '../content/membershipPricing';
import { tierRankOf } from '../lib/entitlements';

export type MembershipTierId =
  | 'silver'
  | 'gold'
  | 'platinum'
  | 'pro'
  | 'proplus'
  | 'premium'
  | 'ultimate';
export type BillingInterval = 'month' | 'year';

export const PLAN_TRIAL_DAYS = 15;
export const LAUNCH_TRIAL_DAYS = 15;

type PaidPackage = 'silver' | 'gold' | 'platinum';

type TierDef = {
  name: string;
  /** Package whose /plans amount and Stripe catalog product this tier bills under. */
  billsAs: PaidPackage;
  monthlyCents: number;
  priceEnvMonthly: string;
};

function tierDef(name: string, billsAs: PaidPackage): TierDef {
  return {
    name,
    billsAs,
    monthlyCents: membershipMonthlyCents(billsAs),
    priceEnvMonthly: `STRIPE_PRICE_${billsAs.toUpperCase()}_MONTHLY`,
  };
}

const TIER_DEFS: Record<MembershipTierId, TierDef> = {
  silver: tierDef('ClearPath Silver', 'silver'),
  gold: tierDef('ClearPath Gold', 'gold'),
  platinum: tierDef('ClearPath Platinum', 'platinum'),
  pro: tierDef('ClearPath Silver', 'silver'),
  proplus: tierDef('ClearPath Gold', 'gold'),
  premium: tierDef('ClearPath Gold', 'gold'),
  ultimate: tierDef('ClearPath Platinum', 'platinum'),
};

const catalogProductIds = new Map<PaidPackage, string | null>();

/** Active Stripe catalog product named Silver / Gold / Platinum (case-insensitive), cached per process. */
async function findCatalogProductId(stripe: Stripe, pkg: PaidPackage): Promise<string | null> {
  if (catalogProductIds.has(pkg)) return catalogProductIds.get(pkg) ?? null;
  try {
    for await (const product of stripe.products.list({ active: true, limit: 100 })) {
      const name = (product.name || '').trim().toLowerCase();
      if (!catalogProductIds.has(name as PaidPackage) && (name === 'silver' || name === 'gold' || name === 'platinum')) {
        catalogProductIds.set(name, product.id);
      }
    }
  } catch (err: any) {
    console.warn('[Stripe] catalog product lookup failed:', err?.message || err);
    return null;
  }
  for (const p of ['silver', 'gold', 'platinum'] as const) {
    if (!catalogProductIds.has(p)) catalogProductIds.set(p, null);
  }
  return catalogProductIds.get(pkg) ?? null;
}

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
      dashboardPriceConfigured: Boolean((process.env[TIER_DEFS[id].priceEnvMonthly] || '').trim()),
    })),
  };
}

/** Ensure a Dashboard Price ID matches the /plans catalog (amount, currency, interval). */
export async function validateConfiguredPrice(
  stripe: Stripe,
  priceId: string,
  expectedCents: number,
): Promise<void> {
  const price = await stripe.prices.retrieve(priceId);
  if (!price.active) {
    throw new StripeServiceError('Configured Stripe price is inactive.', 503);
  }
  if (price.currency !== 'usd') {
    throw new StripeServiceError('Configured Stripe price must be USD.', 503);
  }
  if (price.unit_amount !== expectedCents) {
    throw new StripeServiceError(
      `Stripe price ${priceId} is ${price.unit_amount} cents; catalog expects ${expectedCents}.`,
      503,
    );
  }
  if (price.recurring?.interval !== 'month') {
    throw new StripeServiceError('Configured Stripe price must be monthly.', 503);
  }
}

const BLOCKING_SUB_STATUSES = new Set<Stripe.Subscription.Status>([
  'active',
  'trialing',
  'past_due',
  'unpaid',
]);

export async function getOrCreateStripeCustomer(
  stripe: Stripe,
  uid: string,
  email?: string,
): Promise<string> {
  const profile = readProfile(uid);
  const stored = profile?.membership?.stripeCustomerId;
  if (stored) {
    try {
      const existing = await stripe.customers.retrieve(stored);
      if (!(existing as Stripe.DeletedCustomer).deleted) return stored;
    } catch {
      /* create or search below */
    }
  }
  try {
    const found = await stripe.customers.search({
      query: `metadata['uid']:'${uid.replace(/'/g, '')}'`,
      limit: 1,
    });
    const hit = found.data[0];
    if (hit?.id) return hit.id;
  } catch (err: any) {
    console.warn('[Stripe] customer search skipped:', err?.message || err);
  }
  const created = await stripe.customers.create({
    email: email?.trim() || undefined,
    metadata: { uid },
  });
  return created.id;
}

async function assertNoConflictingSubscription(stripe: Stripe, uid: string, customerId: string): Promise<void> {
  const mem = readProfile(uid)?.membership;
  if (mem && membershipGrantsAccess(mem.status) && mem.stripeSubscriptionId) {
    throw new StripeServiceError(
      'You already have an active membership. Open Manage billing to change or cancel your plan.',
      409,
    );
  }
  const subs = await stripe.subscriptions.list({ customer: customerId, status: 'all', limit: 20 });
  for (const sub of subs.data) {
    if (BLOCKING_SUB_STATUSES.has(sub.status)) {
      throw new StripeServiceError(
        'You already have a Stripe subscription on this account. Use Manage billing instead of starting a second checkout.',
        409,
      );
    }
  }
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
  if (input.interval !== 'month') {
    throw new StripeServiceError('Packages are billed monthly only.', 400);
  }

  const customerId = await getOrCreateStripeCustomer(stripe, input.uid, input.email);
  await assertNoConflictingSubscription(stripe, input.uid, customerId);

  const dashboardPriceId = (process.env[def.priceEnvMonthly] || '').trim();
  if (dashboardPriceId) {
    await validateConfiguredPrice(stripe, dashboardPriceId, def.monthlyCents);
  }
  const catalogProductId = dashboardPriceId ? null : await findCatalogProductId(stripe, def.billsAs);
  const lineItem: Stripe.Checkout.SessionCreateParams.LineItem = dashboardPriceId
    ? { price: dashboardPriceId, quantity: 1 }
    : catalogProductId
      ? {
          price_data: {
            currency: 'usd',
            unit_amount: def.monthlyCents,
            recurring: { interval: 'month' },
            product: catalogProductId,
          },
          quantity: 1,
        }
      : {
          price_data: {
            currency: 'usd',
            unit_amount: def.monthlyCents,
            recurring: { interval: 'month' },
            product_data: {
              name: def.name,
              description: `ClearPath Trader ${def.name} monthly membership`,
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
    customer: customerId,
    customer_update: input.email ? { name: 'auto', address: 'auto' } : undefined,
  };

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

export async function createMembershipPortalSession(input: {
  uid: string;
  origin: string;
}): Promise<{ url: string }> {
  const stripe = getStripeClient();
  if (!stripe) {
    throw new StripeServiceError('Stripe is not configured on this server (STRIPE_SECRET_KEY missing).', 503);
  }
  const customerId = readProfile(input.uid)?.membership?.stripeCustomerId;
  if (!customerId) {
    throw new StripeServiceError('No billing profile yet — subscribe first, then manage billing here.', 404);
  }
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${input.origin.replace(/\/$/, '')}/plans?billing=return`,
  });
  if (!session.url) {
    throw new StripeServiceError('Stripe did not return a billing portal URL.', 502);
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

async function saveMembershipDurable(
  uid: string,
  patch: Partial<MembershipRecord> & { tier: string; status: MembershipRecord['status'] },
): Promise<MembershipRecord> {
  const prev = readProfile(uid)?.membership;
  const next: MembershipRecord = {
    ...prev,
    ...patch,
    updatedAt: new Date().toISOString(),
  };
  if ((patch.status === 'active' || patch.status === 'trialing') && !prev?.activatedAt) {
    next.activatedAt = new Date().toISOString();
  }
  await writeProfileDurable(uid, { membership: next });
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
  const amountCents = def && interval !== 'year' ? def.monthlyCents : undefined;
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

/** Paid access while Stripe is current — past_due/unpaid do not grant features. */
const LIVE_MEMBERSHIP_STATUS = new Set<MembershipRecord['status']>(['active', 'trialing']);

export type MembershipWrite = {
  tier: string;
  status: MembershipRecord['status'];
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  currentPeriodEnd?: string;
};

/**
 * A different subscription must not downgrade a higher live plan, and canceling
 * a different subscription must not wipe the plan the member still has.
 * Missing tier metadata on the same subscription keeps the stored tier.
 * Returns null when the incoming event should not be written.
 */
export function resolveSubscriptionMembershipWrite(
  prev: { tier: string; status: MembershipRecord['status']; stripeSubscriptionId?: string } | null | undefined,
  incoming: MembershipWrite,
): MembershipWrite | null {
  const rawTier = incoming.tier.trim();
  const sameSub = Boolean(
    prev?.stripeSubscriptionId &&
      incoming.stripeSubscriptionId &&
      prev.stripeSubscriptionId === incoming.stripeSubscriptionId,
  );
  const tier = rawTier || (sameSub && prev?.tier ? prev.tier : '');
  if (!tier) return null;
  const next: MembershipWrite = { ...incoming, tier };
  if (!prev) return next;
  const prevLive = LIVE_MEMBERSHIP_STATUS.has(prev.status);
  const nextLive = LIVE_MEMBERSHIP_STATUS.has(next.status);
  const prevSub = prev.stripeSubscriptionId;
  const nextSub = next.stripeSubscriptionId;
  const differentSub = Boolean(prevSub && nextSub && prevSub !== nextSub);
  const unlabeledDowngrade = Boolean(prevSub && !nextSub && prevLive && nextLive && tierRankOf(next.tier) < tierRankOf(prev.tier));
  if (differentSub && prevLive && next.status === 'canceled') return null;
  if ((differentSub || unlabeledDowngrade) && prevLive && nextLive && tierRankOf(next.tier) < tierRankOf(prev.tier)) {
    return null;
  }
  return next;
}

export function membershipGrantsAccess(status: string | null | undefined): boolean {
  return status === 'active' || status === 'trialing';
}

async function expandMembershipUids(primaryUid: string, email?: string | null): Promise<string[]> {
  const ids = new Set<string>();
  if (primaryUid) ids.add(primaryUid);
  const normalized = String(email || '').trim().toLowerCase();
  if (normalized.includes('@')) {
    try {
      const { findPrivateUserByEmail } = await import('./privateAuthService');
      const user = await findPrivateUserByEmail(normalized);
      if (user?.uid) ids.add(user.uid);
    } catch (err) {
      console.warn('[Stripe] private-account membership link skipped:', err);
    }
  }
  for (const id of [...ids]) {
    for (const extra of readProfile(id)?.membershipLinkedUids || []) {
      if (extra) ids.add(extra);
    }
  }
  return [...ids];
}

function rememberMembershipLinks(ids: string[]) {
  if (ids.length < 2) return;
  for (const id of ids) {
    const others = ids.filter((uid) => uid !== id);
    const prev = readProfile(id)?.membershipLinkedUids || [];
    const merged = [...new Set([...prev, ...others])];
    if (merged.length === prev.length && merged.every((uid, index) => uid === prev[index])) continue;
    writeProfile(id, { membershipLinkedUids: merged });
  }
}

async function saveMembershipFanout(
  primaryUid: string,
  incoming: MembershipWrite,
  email?: string | null,
): Promise<'wrote' | 'kept' | 'skipped'> {
  const ids = await expandMembershipUids(primaryUid, email);
  rememberMembershipLinks(ids);
  let wrote = false;
  let kept = false;
  for (const id of ids) {
    const decision = resolveSubscriptionMembershipWrite(readProfile(id)?.membership, incoming);
    if (!decision) {
      kept = true;
      continue;
    }
    await saveMembershipDurable(id, decision);
    wrote = true;
  }
  if (wrote) return 'wrote';
  if (kept) return 'kept';
  return 'skipped';
}

async function uidFromStripeCustomer(stripe: Stripe, customerId: string): Promise<string | null> {
  try {
    const customer = await stripe.customers.retrieve(customerId);
    if ((customer as Stripe.DeletedCustomer).deleted) return null;
    const uid = String((customer as Stripe.Customer).metadata?.uid || '').trim();
    if (uid) return uid;
  } catch {
    /* fall through */
  }
  return null;
}

async function membershipFromSubscription(sub: Stripe.Subscription): Promise<{
  uid: string;
  tier: string;
  write: MembershipWrite;
} | null> {
  const uid = String(sub.metadata?.uid || '').trim();
  if (!uid) return null;
  const rawTier = String(sub.metadata?.tier || '').trim();
  const stored = readProfile(uid)?.membership;
  const tier = rawTier || (stored?.stripeSubscriptionId === sub.id ? stored.tier : '');
  if (!tier) return null;
  return {
    uid,
    tier,
    write: {
      tier,
      status: mapSubscriptionStatus(sub.status),
      stripeCustomerId: typeof sub.customer === 'string' ? sub.customer : sub.customer?.id,
      stripeSubscriptionId: sub.id,
      currentPeriodEnd: subscriptionPeriodEnd(sub),
    },
  };
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
  const claimed = await claimStripeWebhookEvent(event.id);
  if (!claimed) {
    console.log(`[Stripe] duplicate webhook ${event.id} (${event.type}) — skipped.`);
    return { handled: true };
  }

  const stripe = getStripeClient();

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      const uid = String(session.metadata?.uid || session.client_reference_id || '').trim();
      const tier = String(session.metadata?.tier || '').trim();
      if (!uid || !isMembershipTier(tier)) {
        console.warn('[Stripe] checkout.session.completed missing uid/tier metadata — skipped.');
        return { handled: false };
      }
      const subscribed = session.mode === 'subscription';
      const email = session.customer_details?.email || session.customer_email || null;
      const outcome = await saveMembershipFanout(
        uid,
        {
          tier,
          status: subscribed ? 'trialing' : 'active',
          stripeCustomerId: typeof session.customer === 'string' ? session.customer : session.customer?.id,
          stripeSubscriptionId:
            typeof session.subscription === 'string' ? session.subscription : session.subscription?.id,
        },
        email,
      );
      return { handled: outcome !== 'skipped' };
    }
    case 'customer.subscription.updated':
    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription;
      const parsed =
        (await membershipFromSubscription(sub)) ||
        (stripe && typeof sub.customer === 'string'
          ? await (async () => {
              const uid = await uidFromStripeCustomer(stripe, sub.customer as string);
              if (!uid) return null;
              const stored = readProfile(uid)?.membership;
              const tier =
                String(sub.metadata?.tier || '').trim() ||
                (stored?.stripeSubscriptionId === sub.id ? stored.tier : '');
              if (!tier) return null;
              return {
                uid,
                tier,
                write: {
                  tier,
                  status:
                    event.type === 'customer.subscription.deleted'
                      ? ('canceled' as const)
                      : mapSubscriptionStatus(sub.status),
                  stripeCustomerId: sub.customer as string,
                  stripeSubscriptionId: sub.id,
                  currentPeriodEnd: subscriptionPeriodEnd(sub),
                },
              };
            })()
          : null);
      if (!parsed) return { handled: false };
      const outcome = await saveMembershipFanout(parsed.uid, parsed.write, null);
      return { handled: outcome !== 'skipped' };
    }
    case 'invoice.paid': {
      const invoice = event.data.object as Stripe.Invoice;
      if (invoice.status !== 'paid') return { handled: false };
      const subId =
        typeof invoice.subscription === 'string' ? invoice.subscription : invoice.subscription?.id;
      if (!subId || !stripe) return { handled: false };
      const sub = await stripe.subscriptions.retrieve(subId);
      const parsed = await membershipFromSubscription(sub);
      if (!parsed) return { handled: false };
      const activeWrite: MembershipWrite = { ...parsed.write, status: 'active' };
      const outcome = await saveMembershipFanout(parsed.uid, activeWrite, null);
      if (outcome !== 'skipped' && invoice.amount_paid > 0) {
        const record = readProfile(parsed.uid)?.membership;
        if (record) {
          creditAffiliateResidual(parsed.uid, { ...record, status: 'active' }, String(sub.metadata?.interval || 'month'));
        }
      }
      return { handled: outcome !== 'skipped' };
    }
    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice;
      const subId =
        typeof invoice.subscription === 'string' ? invoice.subscription : invoice.subscription?.id;
      if (!subId || !stripe) return { handled: false };
      const sub = await stripe.subscriptions.retrieve(subId);
      const parsed = await membershipFromSubscription(sub);
      if (!parsed) return { handled: false };
      const outcome = await saveMembershipFanout(
        parsed.uid,
        { ...parsed.write, status: 'past_due' },
        null,
      );
      return { handled: outcome !== 'skipped' };
    }
    case 'charge.refunded': {
      const charge = event.data.object as Stripe.Charge;
      const customerId = typeof charge.customer === 'string' ? charge.customer : charge.customer?.id;
      if (!customerId || !stripe) return { handled: false };
      const uid = await uidFromStripeCustomer(stripe, customerId);
      if (!uid) return { handled: false };
      const mem = readProfile(uid)?.membership;
      if (!mem?.tier) return { handled: false };
      const outcome = await saveMembershipFanout(
        uid,
        {
          tier: mem.tier,
          status: 'canceled',
          stripeCustomerId: customerId,
          stripeSubscriptionId: mem.stripeSubscriptionId,
        },
        null,
      );
      return { handled: outcome !== 'skipped' };
    }
    case 'charge.dispute.created': {
      const dispute = event.data.object as Stripe.Dispute;
      const chargeId = typeof dispute.charge === 'string' ? dispute.charge : dispute.charge?.id;
      if (!chargeId || !stripe) return { handled: false };
      const charge = await stripe.charges.retrieve(chargeId);
      const customerId = typeof charge.customer === 'string' ? charge.customer : charge.customer?.id;
      if (!customerId) return { handled: false };
      const uid = await uidFromStripeCustomer(stripe, customerId);
      if (!uid) return { handled: false };
      const mem = readProfile(uid)?.membership;
      if (!mem?.tier) return { handled: false };
      const outcome = await saveMembershipFanout(
        uid,
        {
          tier: mem.tier,
          status: 'canceled',
          stripeCustomerId: customerId,
          stripeSubscriptionId: mem.stripeSubscriptionId,
        },
        null,
      );
      return { handled: outcome !== 'skipped' };
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
export type StripeCustomerEmailRow = {
  email: string;
  stripeCustomerId: string;
  name?: string;
  /** ClearPath uid when checkout stored it on the customer/subscription metadata. */
  uid?: string;
};

/**
 * Paginate Stripe customers for boot/founder recovery of private accounts.
 * Emails only — never card data. Caps at 2000 to bound boot time.
 */
export async function listStripeCustomerEmails(options?: {
  max?: number;
}): Promise<StripeCustomerEmailRow[]> {
  const stripe = getStripeClient();
  if (!stripe) {
    throw new StripeServiceError('Stripe is not configured on this server (STRIPE_SECRET_KEY missing).', 503);
  }
  const max = Math.min(Math.max(1, options?.max ?? 2000), 5000);
  const out: StripeCustomerEmailRow[] = [];
  let startingAfter: string | undefined;

  while (out.length < max) {
    const page = await stripe.customers.list({
      limit: Math.min(100, max - out.length),
      ...(startingAfter ? { starting_after: startingAfter } : {}),
    });
    for (const customer of page.data) {
      // Customer.list omits deleted tombstones; skip any odd deleted-shaped rows.
      if ((customer as unknown as { deleted?: boolean }).deleted === true) continue;
      const email = String(customer.email || '').trim().toLowerCase();
      if (!email.includes('@')) continue;
      const metaUid = String(customer.metadata?.uid || '').trim();
      const row: StripeCustomerEmailRow = {
        email,
        stripeCustomerId: customer.id,
      };
      if (customer.name && String(customer.name).trim()) {
        row.name = String(customer.name).trim().slice(0, 80);
      }
      if (metaUid) row.uid = metaUid;
      out.push(row);
      if (out.length >= max) break;
    }
    if (!page.has_more || page.data.length === 0) break;
    startingAfter = page.data[page.data.length - 1]?.id;
    if (!startingAfter) break;
  }

  // Dedupe by email (prefer row that carries a uid).
  const byEmail = new Map<string, StripeCustomerEmailRow>();
  for (const row of out) {
    const prev = byEmail.get(row.email);
    if (!prev || (!prev.uid && row.uid)) byEmail.set(row.email, row);
  }
  return [...byEmail.values()].sort((a, b) => a.email.localeCompare(b.email));
}

/** Prefer the highest live plan when private-session and Firebase profiles disagree. */
export function pickRicherMembershipReport(reports: MembershipStatusReport[]): MembershipStatusReport {
  if (reports.length === 0) return { active: false, tier: null, status: null };
  return reports.reduce((best, row) => {
    const bestRank = best.active ? tierRankOf(best.tier) : -1;
    const rowRank = row.active ? tierRankOf(row.tier) : -1;
    return rowRank > bestRank ? row : best;
  });
}

export function getMembershipStatus(uid: string): MembershipStatusReport {
  const profile = readProfile(uid);
  const membership = profile?.membership;

  // A Stripe subscription (any state except canceled) always wins over the launch gift.
  if (membership && membership.status !== 'canceled') {
    return {
      active: membershipGrantsAccess(membership.status),
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
      tier: 'platinum',
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
