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
};

function requireConfig() {
  if (!projectId || projectId === 'YOUR_PROJECT_ID') {
    throw new Error(
      'Appwrite is not configured. Set VITE_APPWRITE_PROJECT_ID (and endpoint) in .env, then restart the dev server.'
    );
  }
}

function getClient() {
  requireConfig();
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
 * Soft-launch waitlist signup → Appwrite TablesDB.
 * Uses create-only permissions (no public reads) so emails stay private.
 * Duplicate emails rely on the unique index on emailAddress.
 * Country caps (15k) should be enforced later via an Appwrite Function.
 */
export async function joinWaitlist(payload: WaitlistPayload): Promise<WaitlistResult> {
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
    };
  } catch (err) {
    if (isDuplicateError(err)) {
      throw new Error('This email is already on the ClearPath waitlist.');
    }
    throw err;
  }
}

export const appwriteConfig = {
  endpoint,
  projectId,
  databaseId,
  waitlistTableId,
  countryCap: COUNTRY_CAP,
};
