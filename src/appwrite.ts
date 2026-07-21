import { Client, TablesDB, ID } from 'appwrite';

const endpoint =
  import.meta.env.VITE_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1';
const projectId = import.meta.env.VITE_APPWRITE_PROJECT_ID || '';
const databaseId = import.meta.env.VITE_APPWRITE_DATABASE_ID || 'clearpath';
const waitlistTableId = import.meta.env.VITE_APPWRITE_WAITLIST_TABLE_ID || 'waitlist';

const COUNTRY_CAP = 15_000;

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
  backend: 'appwrite' | 'api';
};

function isAppwriteConfigured(): boolean {
  return Boolean(projectId && projectId !== 'YOUR_PROJECT_ID' && !endpoint.includes('<REGION>'));
}

function getClient() {
  return new Client().setEndpoint(endpoint).setProject(projectId);
}

function getTables() {
  return new TablesDB(getClient());
}

function makePasscode(): string {
  const part = () => Math.random().toString(36).slice(2, 6).toUpperCase();
  return `CP-${part()}-${part()}`;
}

function isDuplicateError(err: unknown): boolean {
  const message = String((err as { message?: string })?.message ?? err ?? '').toLowerCase();
  const code = (err as { code?: number })?.code;
  return code === 409 || message.includes('unique') || message.includes('duplicate') || message.includes('already exists');
}

/**
 * Server fallback: Express /api/registrations/waitlist
 * (Firebase Admin when credentials exist, else local JSON under data/registrations).
 */
async function joinWaitlistViaApi(payload: WaitlistPayload): Promise<WaitlistResult> {
  const res = await fetch('/api/registrations/waitlist', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const body = await res.json().catch(() => ({} as Record<string, unknown>));
  if (!res.ok) {
    throw new Error(
      String(body.error || body.message || `Waitlist registration failed (${res.status})`)
    );
  }

  return {
    rowId: String(body.registrationId || ''),
    passcode: String(body.activationKey || ''),
    emailSent: Boolean(body.emailSent),
    backend: 'api',
  };
}

async function joinWaitlistViaAppwrite(payload: WaitlistPayload): Promise<WaitlistResult> {
  const tables = getTables();
  const passcode = makePasscode();

  try {
    const row = await tables.createRow({
      databaseId,
      tableId: waitlistTableId,
      rowId: ID.unique(),
      data: {
        firstName: payload.firstName,
        emailAddress: payload.emailAddress,
        country: payload.country,
        experienceLevel: payload.experienceLevel,
        status: 'pending',
        tier: 'tier1',
        passcode,
        registrationSource: 'ClearPath Soft Launch Waitlist Portal',
      },
    });

    return {
      rowId: row.$id,
      passcode,
      emailSent: false,
      backend: 'appwrite',
    };
  } catch (err) {
    if (isDuplicateError(err)) {
      throw new Error('This email is already on the ClearPath waitlist.');
    }
    throw err;
  }
}

/**
 * Soft-launch waitlist signup.
 * Prefers Appwrite TablesDB when configured; otherwise uses the ClearPath API
 * (Firestore Admin / local file) so the landing page still works.
 */
export async function joinWaitlist(payload: WaitlistPayload): Promise<WaitlistResult> {
  if (!isAppwriteConfigured()) {
    return joinWaitlistViaApi(payload);
  }

  try {
    return await joinWaitlistViaAppwrite(payload);
  } catch (err) {
    // Config present but cloud call failed — keep soft-launch alive via API.
    if (isDuplicateError(err) || String((err as Error)?.message || '').includes('already on the ClearPath')) {
      throw err;
    }
    console.warn('[waitlist] Appwrite failed, falling back to /api/registrations/waitlist:', err);
    return joinWaitlistViaApi(payload);
  }
}

export const appwriteConfig = {
  endpoint,
  projectId,
  databaseId,
  waitlistTableId,
  countryCap: COUNTRY_CAP,
  configured: isAppwriteConfigured(),
};
