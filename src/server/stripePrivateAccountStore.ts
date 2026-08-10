/**
 * Stripe-backed durable private accounts.
 *
 * Production already has STRIPE_SECRET_KEY. When Firebase Admin/Firestore is
 * offline, store password hashes on Stripe Customer metadata so Cloud Run
 * redeploys cannot wipe the member list.
 *
 * Metadata keys are ClearPath-owned; never stores raw card data.
 */
import { getStripeClient, stripeConfigured } from './stripeService';

export type StripePrivateUserRecord = {
  uid: string;
  email: string;
  displayName: string;
  passwordHash: string;
  passwordSalt: string;
  createdAt: string;
  lastLoginAt?: string;
  stripeCustomerId?: string;
  tempPassword?: string;
  identityStatus?: string;
  identityRiskReasons?: string[];
  identityChallengeTokenHash?: string;
  identityChallengeExpiresAt?: string;
  identityDeclinedAt?: string;
  identityConfirmedAt?: string;
  identityEmailWasSuspect?: boolean;
  passwordResetTokenHash?: string;
  passwordResetExpiresAt?: string;
};

const META = {
  uid: 'cp_priv_uid',
  display: 'cp_priv_display',
  hash: 'cp_priv_hash',
  salt: 'cp_priv_salt',
  created: 'cp_priv_created',
  lastLogin: 'cp_priv_last_login',
  tempPassword: 'cp_temp_password',
  /** Compact JSON blob for identity quarantine fields (Stripe metadata value ≤500 chars). */
  identity: 'cp_priv_identity',
  /** Compact JSON blob for self-serve password reset token (≤200 chars). */
  pwreset: 'cp_priv_pwreset',
} as const;

function normalizeEmail(email: string): string {
  return (email || '').trim().toLowerCase();
}

function metaGet(meta: Record<string, string> | null | undefined, key: string): string {
  return String(meta?.[key] || '').trim();
}

function recordFromCustomer(customer: {
  id: string;
  email?: string | null;
  name?: string | null;
  metadata?: Record<string, string> | null;
}): StripePrivateUserRecord | null {
  const email = normalizeEmail(String(customer.email || ''));
  const uid = metaGet(customer.metadata, META.uid);
  const hash = metaGet(customer.metadata, META.hash);
  const salt = metaGet(customer.metadata, META.salt);
  if (!email.includes('@') || !uid || !hash || !salt) return null;
  const displayName =
    metaGet(customer.metadata, META.display) ||
    String(customer.name || '').trim() ||
    email.split('@')[0] ||
    'Member';
  const record: StripePrivateUserRecord = {
    uid,
    email,
    displayName: displayName.slice(0, 80),
    passwordHash: hash,
    passwordSalt: salt,
    createdAt: metaGet(customer.metadata, META.created) || new Date().toISOString(),
    stripeCustomerId: customer.id,
  };
  const lastLogin = metaGet(customer.metadata, META.lastLogin);
  if (lastLogin) record.lastLoginAt = lastLogin;
  const temp = metaGet(customer.metadata, META.tempPassword);
  if (temp) record.tempPassword = temp;
  const identityRaw = metaGet(customer.metadata, META.identity);
  if (identityRaw) {
    try {
      const parsed = JSON.parse(identityRaw) as Record<string, unknown>;
      if (typeof parsed.status === 'string') record.identityStatus = parsed.status;
      if (Array.isArray(parsed.reasons)) record.identityRiskReasons = parsed.reasons.map(String);
      if (typeof parsed.chal === 'string') record.identityChallengeTokenHash = parsed.chal;
      if (typeof parsed.exp === 'string') record.identityChallengeExpiresAt = parsed.exp;
      if (typeof parsed.declined === 'string') record.identityDeclinedAt = parsed.declined;
      if (typeof parsed.confirmed === 'string') record.identityConfirmedAt = parsed.confirmed;
      if (typeof parsed.emailSuspect === 'boolean') record.identityEmailWasSuspect = parsed.emailSuspect;
    } catch {
      /* ignore corrupt identity blob */
    }
  }
  const pwresetRaw = metaGet(customer.metadata, META.pwreset);
  if (pwresetRaw) {
    try {
      const parsed = JSON.parse(pwresetRaw) as Record<string, unknown>;
      if (typeof parsed.chal === 'string' && parsed.chal.trim()) {
        record.passwordResetTokenHash = parsed.chal.trim();
      }
      if (typeof parsed.exp === 'string' && parsed.exp.trim()) {
        record.passwordResetExpiresAt = parsed.exp.trim();
      }
    } catch {
      /* ignore corrupt pwreset blob */
    }
  }
  return record;
}

export function stripePrivateStoreConfigured(): boolean {
  return stripeConfigured();
}

async function findCustomerByEmail(email: string) {
  const stripe = getStripeClient();
  if (!stripe) return null;
  const normalized = normalizeEmail(email);
  const found = await stripe.customers.list({ email: normalized, limit: 5 });
  for (const customer of found.data) {
    if ((customer as unknown as { deleted?: boolean }).deleted) continue;
    if (normalizeEmail(String(customer.email || '')) === normalized) return customer;
  }
  return null;
}

export async function findStripePrivateUserByEmail(
  email: string
): Promise<StripePrivateUserRecord | null> {
  if (!stripePrivateStoreConfigured()) return null;
  try {
    const customer = await findCustomerByEmail(email);
    if (!customer) return null;
    return recordFromCustomer(customer);
  } catch (err) {
    console.warn('[stripePrivateStore] find by email failed:', err);
    return null;
  }
}

export async function upsertStripePrivateUser(
  user: StripePrivateUserRecord & { tempPassword?: string }
): Promise<boolean> {
  const stripe = getStripeClient();
  if (!stripe) return false;
  const email = normalizeEmail(user.email);
  if (!email.includes('@') || !user.uid || !user.passwordHash || !user.passwordSalt) return false;

  try {
    let customer = await findCustomerByEmail(email);
    const metadata: Record<string, string> = {
      ...(customer?.metadata || {}),
      [META.uid]: user.uid,
      [META.display]: (user.displayName || email.split('@')[0] || 'Member').slice(0, 80),
      [META.hash]: user.passwordHash,
      [META.salt]: user.passwordSalt,
      [META.created]: user.createdAt || new Date().toISOString(),
    };
    if (user.lastLoginAt) metadata[META.lastLogin] = user.lastLoginAt;
    if (user.tempPassword) metadata[META.tempPassword] = user.tempPassword.slice(0, 64);
    else if (customer?.metadata?.[META.tempPassword]) {
      // Clear temp password once replaced by a real login path if explicitly empty string passed — keep otherwise.
    }
    if (user.identityStatus) {
      const blob = JSON.stringify({
        status: user.identityStatus,
        reasons: (user.identityRiskReasons || []).slice(0, 8),
        ...(user.identityChallengeTokenHash ? { chal: user.identityChallengeTokenHash } : {}),
        ...(user.identityChallengeExpiresAt ? { exp: user.identityChallengeExpiresAt } : {}),
        ...(user.identityDeclinedAt ? { declined: user.identityDeclinedAt } : {}),
        ...(user.identityConfirmedAt ? { confirmed: user.identityConfirmedAt } : {}),
        ...(typeof user.identityEmailWasSuspect === 'boolean'
          ? { emailSuspect: user.identityEmailWasSuspect }
          : {}),
      }).slice(0, 500);
      metadata[META.identity] = blob;
    }

    if (user.passwordResetTokenHash && user.passwordResetExpiresAt) {
      metadata[META.pwreset] = JSON.stringify({
        chal: user.passwordResetTokenHash,
        exp: user.passwordResetExpiresAt,
      }).slice(0, 200);
    } else {
      // Explicit clear so consumed tokens do not survive on Stripe metadata.
      metadata[META.pwreset] = '';
    }

    if (customer) {
      await stripe.customers.update(customer.id, {
        name: metadata[META.display],
        metadata,
      });
    } else {
      await stripe.customers.create({
        email,
        name: metadata[META.display],
        metadata,
      });
    }
    return true;
  } catch (err) {
    console.warn('[stripePrivateStore] upsert failed:', err);
    return false;
  }
}

export async function listStripePrivateUsers(options?: {
  max?: number;
}): Promise<StripePrivateUserRecord[]> {
  const stripe = getStripeClient();
  if (!stripe) return [];
  const max = Math.min(Math.max(1, options?.max ?? 2000), 5000);
  const out: StripePrivateUserRecord[] = [];
  let startingAfter: string | undefined;

  try {
    while (out.length < max) {
      const page = await stripe.customers.list({
        limit: Math.min(100, max - out.length),
        ...(startingAfter ? { starting_after: startingAfter } : {}),
      });
      for (const customer of page.data) {
        if ((customer as unknown as { deleted?: boolean }).deleted) continue;
        const record = recordFromCustomer(customer);
        if (record) out.push(record);
      }
      if (!page.has_more || page.data.length === 0) break;
      startingAfter = page.data[page.data.length - 1]?.id;
      if (!startingAfter) break;
    }
  } catch (err) {
    console.warn('[stripePrivateStore] list failed:', err);
  }

  const byEmail = new Map<string, StripePrivateUserRecord>();
  for (const row of out) byEmail.set(row.email, row);
  return [...byEmail.values()].sort((a, b) => a.email.localeCompare(b.email));
}

/** Clear one-time temp password from Stripe after founder has exported it (optional). */
export async function clearStripeTempPassword(email: string): Promise<void> {
  const stripe = getStripeClient();
  if (!stripe) return;
  try {
    const customer = await findCustomerByEmail(email);
    if (!customer?.metadata?.[META.tempPassword]) return;
    await stripe.customers.update(customer.id, {
      metadata: { ...customer.metadata, [META.tempPassword]: '' },
    });
  } catch (err) {
    console.warn('[stripePrivateStore] clear temp password failed:', err);
  }
}
