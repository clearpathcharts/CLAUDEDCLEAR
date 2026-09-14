/**
 * Leftover waitlist helper. Public signup is Private Login only.
 * Any leftover caller posts to Express, which creates a Firestore
 * `private_accounts` row (not Appwrite, not site_registrations).
 */
const endpoint =
  import.meta.env.VITE_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1';
const projectId = import.meta.env.VITE_APPWRITE_PROJECT_ID || '';
const databaseId = import.meta.env.VITE_APPWRITE_DATABASE_ID || 'clearpath';

export type WaitlistPayload = {
  firstName: string;
  emailAddress: string;
  country: string;
  experienceLevel: string;
};

export type WaitlistResult = {
  rowId: string;
  passcode: string;
  emailSent?: boolean;
  backend: 'api';
};

/**
 * Server: Express /api/registrations/waitlist → Firestore private_accounts.
 */
export async function joinWaitlist(payload: WaitlistPayload): Promise<WaitlistResult> {
  const res = await fetch('/api/registrations/waitlist', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const body = await res.json().catch(() => ({} as Record<string, unknown>));
  if (!res.ok) {
    throw new Error(
      String(body.error || body.message || `Private Login registration failed (${res.status})`)
    );
  }

  return {
    rowId: String(body.registrationId || ''),
    passcode: String(body.activationKey || ''),
    emailSent: Boolean(body.emailSent),
    backend: 'api',
  };
}

export const appwriteConfig = {
  endpoint,
  projectId,
  databaseId,
  waitlistTableId: '',
  countryCap: 15_000,
  configured: false,
};
