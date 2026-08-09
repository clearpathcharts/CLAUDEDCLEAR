import { generateActivationKey, normalizeEmail } from './activationKey';
import { getAdminFirestore } from './firebaseAdmin';
import {
  emailExistsInIdentity,
  emailExistsInWaitlist,
  saveIdentityPreregistration,
  saveWaitlistRegistration,
} from './registrationStore';
import {
  notifyAdminNewRegistration,
  sendIdentityPreregistrationEmail,
  sendWaitlistConfirmationEmail,
} from './registrationEmail';
import {
  assertRegistrationEmailAllowedAsync,
  getRegistrationNameBlock,
} from './identityRisk';
import { isFounderEmail } from '../lib/founder';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function assertEmailAllowed(email: string): Promise<void> {
  if (isFounderEmail(email)) {
    throw new RegistrationError('This email is reserved.', 403);
  }
  try {
    await assertRegistrationEmailAllowedAsync(email);
  } catch (err) {
    const e = err as Error & { status?: number };
    throw new RegistrationError(e.message || 'This email is not allowed for registration.', e.status || 400);
  }
}

function assertNameAllowed(name: string): void {
  const block = getRegistrationNameBlock(name);
  if (block.blocked) {
    throw new RegistrationError(block.reason || 'This name is not allowed for registration.', 400);
  }
}

const IDENTITY_TIERS: Record<string, { name: string }> = {
  blue: { name: 'Retail Trader' },
  green: { name: 'Professional Analyst' },
  gold: { name: 'Market Desk' },
};

export type WaitlistInput = {
  firstName: string;
  emailAddress: string;
  country: string;
  experienceLevel: string;
  uid?: string;
};

export type IdentityInput = {
  emailAddress: string;
  tierId: string;
  displayName?: string;
  uid?: string;
};

export type RegistrationResult = {
  success: true;
  activationKey: string;
  emailSent: boolean;
  registrationId: string;
};

export class RegistrationError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

export async function registerWaitlist(input: WaitlistInput): Promise<RegistrationResult> {
  const firstName = input.firstName?.trim();
  const emailAddress = normalizeEmail(input.emailAddress || '');
  const country = input.country?.trim();
  const experienceLevel = input.experienceLevel?.trim() || 'Beginner';

  if (!firstName || firstName.length > 200) {
    throw new RegistrationError('A valid first name is required.');
  }
  assertNameAllowed(firstName);
  if (!emailAddress || !EMAIL_RE.test(emailAddress) || emailAddress.length > 320) {
    throw new RegistrationError('A valid email address is required.');
  }
  await assertEmailAllowed(emailAddress);
  if (!country) {
    throw new RegistrationError('Country of residence is required.');
  }

  if (await emailExistsInWaitlist(emailAddress)) {
    throw new RegistrationError('This email is already registered on the waitlist.', 409);
  }

  if (!getAdminFirestore() && process.env.NODE_ENV === 'production') {
    throw new RegistrationError(
      'Waitlist registration unavailable: durable Firestore is offline in production (Cloud Run disk is ephemeral).',
      503
    );
  }

  const activationKey = generateActivationKey();
  const createdAt = new Date().toISOString();

  const registrationId = await saveWaitlistRegistration({
    firstName,
    emailAddress,
    country,
    experienceLevel,
    status: 'pending',
    registrationSource: 'ClearPath Soft Launch Waitlist Portal',
    activationKey,
    uid: input.uid,
    createdAt,
  });

  const emailSent = await sendWaitlistConfirmationEmail({
    to: emailAddress,
    firstName,
    activationKey,
    country,
  });

  await notifyAdminNewRegistration({
    type: 'waitlist',
    email: emailAddress,
    details: `Name: ${firstName}\nCountry: ${country}\nKey: ${activationKey}`,
  });

  return { success: true, activationKey, emailSent, registrationId };
}

export async function registerIdentity(input: IdentityInput): Promise<RegistrationResult> {
  const emailAddress = normalizeEmail(input.emailAddress || '');
  const tierId = input.tierId as 'blue' | 'green' | 'gold';
  const tier = IDENTITY_TIERS[tierId];

  if (!tier) {
    throw new RegistrationError('A valid verification tier must be selected.');
  }
  if (!emailAddress || !EMAIL_RE.test(emailAddress) || emailAddress.length > 320) {
    throw new RegistrationError('A valid email address is required.');
  }
  await assertEmailAllowed(emailAddress);
  if (input.displayName?.trim()) {
    assertNameAllowed(input.displayName.trim());
  }

  if (await emailExistsInIdentity(emailAddress)) {
    throw new RegistrationError('This email already has an identity pre-registration.', 409);
  }

  if (!getAdminFirestore() && process.env.NODE_ENV === 'production') {
    throw new RegistrationError(
      'Identity pre-registration unavailable: durable Firestore is offline in production (Cloud Run disk is ephemeral).',
      503
    );
  }

  const activationKey = generateActivationKey();
  const createdAt = new Date().toISOString();

  const registrationId = await saveIdentityPreregistration({
    emailAddress,
    tierId,
    tierName: tier.name,
    displayName: input.displayName?.trim() || undefined,
    uid: input.uid,
    status: 'pending_payment',
    activationKey,
    registrationSource: 'ClearPath Identity Verification Portal',
    createdAt,
  });

  const emailSent = await sendIdentityPreregistrationEmail({
    to: emailAddress,
    displayName: input.displayName,
    tierName: tier.name,
    activationKey,
  });

  await notifyAdminNewRegistration({
    type: 'identity',
    email: emailAddress,
    details: `Tier: ${tier.name}\nKey: ${activationKey}`,
  });

  return { success: true, activationKey, emailSent, registrationId };
}
