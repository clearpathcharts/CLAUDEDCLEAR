/**
 * Founder recovery paths for private accounts after Cloud Run redeploys wiped
 * ephemeral local users.json — import JSON members or rebuild from Stripe customers
 * once durable Firestore is available.
 */
import { generateActivationKey, normalizeEmail } from './activationKey';
import {
  assertDurablePrivateWritesAllowed,
  findPrivateUserByEmail,
  PrivateAuthError,
  provisionPrivateUser,
  type PublicPrivateUser,
} from './privateAuthService';
import { listStripeCustomerEmails, stripeConfigured } from './stripeService';
import { generateTempPassword, recordFounderInvite } from './waitlistConvertService';

export type ImportMemberInput = {
  email: string;
  displayName?: string;
  /** Optional; when omitted a temp password is generated and stored in founder invites. */
  password?: string;
};

export type RecoveryResultRow = {
  email: string;
  status: 'created' | 'already' | 'skipped' | 'error';
  uid?: string;
  displayName?: string;
  message?: string;
  tempPasswordGenerated?: boolean;
};

function isTestEmail(email: string): boolean {
  const e = normalizeEmail(email);
  return e.endsWith('@clearpath.test') || e.endsWith('.test') || e.includes('+smoke');
}

async function provisionWithInvite(input: {
  email: string;
  displayName: string;
  password?: string;
  waitlistSource: string;
  dryRun: boolean;
}): Promise<RecoveryResultRow> {
  const email = normalizeEmail(input.email);
  if (!email.includes('@')) {
    return { email: input.email, status: 'error', message: 'Invalid email' };
  }
  if (isTestEmail(email)) {
    return { email, status: 'skipped', message: 'test email' };
  }

  const existing = await findPrivateUserByEmail(email);
  if (existing) {
    return {
      email,
      status: 'already',
      uid: existing.uid,
      displayName: existing.displayName,
    };
  }

  const displayName =
    (input.displayName || '').trim() || email.split('@')[0] || 'Member';
  const password = (input.password || '').trim() || generateTempPassword();
  const generated = !(input.password || '').trim();

  if (input.dryRun) {
    return {
      email,
      status: 'created',
      displayName: displayName.slice(0, 80),
      message: 'dry-run',
      tempPasswordGenerated: generated,
    };
  }

  const user: PublicPrivateUser = await provisionPrivateUser({
    email,
    password,
    displayName: displayName.slice(0, 80),
  });

  if (generated) {
    await recordFounderInvite({
      email: user.email,
      displayName: user.displayName,
      uid: user.uid,
      activationKey: generateActivationKey(),
      tempPassword: password,
      createdAt: new Date().toISOString(),
      waitlistSource: input.waitlistSource,
    });
  }

  return {
    email: user.email,
    status: 'created',
    uid: user.uid,
    displayName: user.displayName,
    tempPasswordGenerated: generated,
  };
}

/**
 * Founder/catalog-admin bulk import.
 * Body members may include passwords; omitted passwords become founder invites.
 */
export async function importPrivateMembers(options: {
  members: ImportMemberInput[];
  dryRun?: boolean;
}): Promise<{
  ok: true;
  dryRun: boolean;
  candidates: number;
  created: number;
  already: number;
  skipped: number;
  errors: number;
  invitesCreated: number;
  results: RecoveryResultRow[];
}> {
  const dryRun = Boolean(options.dryRun);
  if (!dryRun) assertDurablePrivateWritesAllowed();

  const members = Array.isArray(options.members) ? options.members : [];
  if (members.length > 2000) {
    throw new PrivateAuthError('Import capped at 2000 members per request.', 400);
  }

  const results: RecoveryResultRow[] = [];
  let created = 0;
  let already = 0;
  let skipped = 0;
  let errors = 0;
  let invitesCreated = 0;

  for (const row of members) {
    try {
      const result = await provisionWithInvite({
        email: String(row.email || ''),
        displayName: row.displayName,
        password: row.password,
        waitlistSource: 'founder_import',
        dryRun,
      });
      results.push(result);
      if (result.status === 'created') {
        created += 1;
        if (result.tempPasswordGenerated) invitesCreated += 1;
      } else if (result.status === 'already') already += 1;
      else if (result.status === 'skipped') skipped += 1;
      else errors += 1;
    } catch (err: any) {
      errors += 1;
      results.push({
        email: normalizeEmail(String(row.email || '')) || String(row.email || ''),
        status: 'error',
        message: err?.message || 'import failed',
      });
    }
  }

  return {
    ok: true,
    dryRun,
    candidates: members.length,
    created,
    already,
    skipped,
    errors,
    invitesCreated,
    results,
  };
}

/**
 * Rebuild missing private accounts from Stripe customer emails.
 * Safe to run on every boot when durable store is up — skips existing emails.
 */
export async function recoverPrivateAccountsFromStripe(options?: {
  dryRun?: boolean;
  max?: number;
}): Promise<{
  ok: true;
  dryRun: boolean;
  stripeConfigured: boolean;
  candidates: number;
  created: number;
  already: number;
  skipped: number;
  errors: number;
  invitesCreated: number;
  results: RecoveryResultRow[];
}> {
  const dryRun = Boolean(options?.dryRun);
  if (!stripeConfigured()) {
    return {
      ok: true,
      dryRun,
      stripeConfigured: false,
      candidates: 0,
      created: 0,
      already: 0,
      skipped: 0,
      errors: 0,
      invitesCreated: 0,
      results: [],
    };
  }

  if (!dryRun) assertDurablePrivateWritesAllowed();

  const customers = await listStripeCustomerEmails({ max: options?.max });
  const results: RecoveryResultRow[] = [];
  let created = 0;
  let already = 0;
  let skipped = 0;
  let errors = 0;
  let invitesCreated = 0;

  for (const customer of customers) {
    try {
      const result = await provisionWithInvite({
        email: customer.email,
        displayName: customer.name || customer.email.split('@')[0] || 'Member',
        waitlistSource: 'stripe_customer',
        dryRun,
      });
      results.push({
        ...result,
        message: result.message || `stripe:${customer.stripeCustomerId}`,
      });
      if (result.status === 'created') {
        created += 1;
        if (result.tempPasswordGenerated) invitesCreated += 1;
      } else if (result.status === 'already') already += 1;
      else if (result.status === 'skipped') skipped += 1;
      else errors += 1;
    } catch (err: any) {
      errors += 1;
      results.push({
        email: customer.email,
        status: 'error',
        message: err?.message || 'stripe recover failed',
      });
    }
  }

  return {
    ok: true,
    dryRun,
    stripeConfigured: true,
    candidates: customers.length,
    created,
    already,
    skipped,
    errors,
    invitesCreated,
    results,
  };
}

/** One-shot boot guard so we do not hammer Stripe on every hot reload in the same process. */
let stripeRecoverAttempted = false;

export async function bootRecoverPrivateAccountsFromStripe(): Promise<{
  ran: boolean;
  created: number;
  already: number;
  candidates: number;
  skippedReason?: string;
}> {
  if (stripeRecoverAttempted) {
    return { ran: false, created: 0, already: 0, candidates: 0, skippedReason: 'already_attempted' };
  }
  stripeRecoverAttempted = true;

  try {
    assertDurablePrivateWritesAllowed();
  } catch {
    return {
      ran: false,
      created: 0,
      already: 0,
      candidates: 0,
      skippedReason: 'durable_store_offline',
    };
  }

  if (!stripeConfigured()) {
    return { ran: false, created: 0, already: 0, candidates: 0, skippedReason: 'stripe_not_configured' };
  }

  const result = await recoverPrivateAccountsFromStripe({ dryRun: false });
  console.log(
    `[STARTUP] Stripe→private accounts recover → candidates=${result.candidates} created=${result.created} already=${result.already} invites=${result.invitesCreated} errors=${result.errors}`
  );
  return {
    ran: true,
    created: result.created,
    already: result.already,
    candidates: result.candidates,
  };
}

/** Test helper — not used in production paths. */
export function _resetStripeRecoverAttemptForTests() {
  stripeRecoverAttempted = false;
}
