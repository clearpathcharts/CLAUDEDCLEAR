import fs from 'node:fs';
import path from 'node:path';
import { getAdminFirestore } from './firebaseAdmin';
import { normalizeEmail } from './activationKey';

export type WaitlistRegistration = {
  firstName: string;
  emailAddress: string;
  country: string;
  experienceLevel: string;
  status: 'pending' | 'confirmed';
  registrationSource: string;
  activationKey: string;
  uid?: string;
  createdAt: string;
};

export type IdentityPreregistration = {
  emailAddress: string;
  tierId: 'blue' | 'green' | 'gold';
  tierName: string;
  displayName?: string;
  uid?: string;
  status: 'pending_payment' | 'confirmed';
  activationKey: string;
  registrationSource: string;
  createdAt: string;
};

const DATA_DIR = path.join(process.cwd(), 'data', 'registrations');

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function readLocalCollection<T>(filename: string): T[] {
  ensureDataDir();
  const filePath = path.join(DATA_DIR, filename);
  if (!fs.existsSync(filePath)) return [];
  try {
    const parsed = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeLocalCollection<T>(filename: string, records: T[]) {
  ensureDataDir();
  fs.writeFileSync(path.join(DATA_DIR, filename), JSON.stringify(records, null, 2));
}

async function findByEmail(collection: string, emailField: string, email: string): Promise<boolean> {
  const normalized = normalizeEmail(email);
  const db = getAdminFirestore();

  if (db) {
    const snapshot = await db
      .collection(collection)
      .where(emailField, '==', normalized)
      .limit(1)
      .get();
    if (!snapshot.empty) return true;
  }

  const localFile = collection === 'site_registrations' ? 'waitlist.json' : 'identity.json';
  const localRecords = readLocalCollection<Record<string, string>>(localFile);
  return localRecords.some((record) => normalizeEmail(record[emailField] || '') === normalized);
}

export async function emailExistsInWaitlist(email: string): Promise<boolean> {
  return findByEmail('site_registrations', 'emailAddress', email);
}

export async function emailExistsInIdentity(email: string): Promise<boolean> {
  return findByEmail('identity_preregistrations', 'emailAddress', email);
}

export async function saveWaitlistRegistration(record: WaitlistRegistration): Promise<string> {
  const db = getAdminFirestore();
  if (db) {
    const payload = Object.fromEntries(
      Object.entries(record).filter(([, value]) => value !== undefined)
    );
    const docRef = await db.collection('site_registrations').add(payload);
    return docRef.id;
  }

  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      'Waitlist registration unavailable: durable Firestore is offline in production (Cloud Run disk is ephemeral).'
    );
  }

  const records = readLocalCollection<WaitlistRegistration & { id: string }>('waitlist.json');
  const id = `local_${Date.now()}`;
  records.push({ ...record, id });
  writeLocalCollection('waitlist.json', records);
  return id;
}

export async function saveIdentityPreregistration(record: IdentityPreregistration): Promise<string> {
  const db = getAdminFirestore();
  if (db) {
    const payload = Object.fromEntries(
      Object.entries(record).filter(([, value]) => value !== undefined)
    );
    const docRef = await db.collection('identity_preregistrations').add(payload);
    return docRef.id;
  }

  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      'Identity pre-registration unavailable: durable Firestore is offline in production (Cloud Run disk is ephemeral).'
    );
  }

  const records = readLocalCollection<IdentityPreregistration & { id: string }>('identity.json');
  const id = `local_${Date.now()}`;
  records.push({ ...record, id });
  writeLocalCollection('identity.json', records);
  return id;
}

/** Founder/admin-only safe waitlist row — never includes activationKey or secrets. */
export type SafeWaitlistMember = {
  id: string;
  email: string;
  firstName?: string;
  country?: string;
  experienceLevel?: string;
  status?: string;
  createdAt?: string;
  source: 'firestore' | 'local';
};

export type ListWaitlistOptions = {
  /**
   * When true (default), hide converted/released rows and smoke-test emails.
   * Pass false for disaster backups that need full leftover waitlist history.
   */
  activeOnly?: boolean;
};

/** Statuses that mean the person was released into Private Login. */
const RELEASED_WAITLIST_STATUSES = new Set(['converted', 'released', 'private', 'active']);

function isReleasedWaitlistStatus(status?: string): boolean {
  return RELEASED_WAITLIST_STATUSES.has(String(status || '').toLowerCase().trim());
}

function isTestWaitlistEmail(email: string): boolean {
  const e = normalizeEmail(email);
  return e.endsWith('@clearpath.test') || e.endsWith('.test') || e.includes('+smoke');
}

function toSafeWaitlistRow(
  id: string,
  raw: Record<string, unknown>,
  source: 'firestore' | 'local'
): SafeWaitlistMember {
  const email =
    String(raw.emailAddress || raw.email || '')
      .trim()
      .toLowerCase() || '';
  const row: SafeWaitlistMember = { id, email, source };
  if (typeof raw.firstName === 'string' && raw.firstName.trim()) row.firstName = raw.firstName.trim();
  else if (typeof raw.name === 'string' && raw.name.trim()) row.firstName = raw.name.trim();
  if (typeof raw.country === 'string' && raw.country.trim()) row.country = raw.country.trim();
  if (typeof raw.experienceLevel === 'string' && raw.experienceLevel.trim()) {
    row.experienceLevel = raw.experienceLevel.trim();
  }
  if (typeof raw.status === 'string' && raw.status.trim()) row.status = raw.status.trim();
  if (typeof raw.createdAt === 'string' && raw.createdAt.trim()) row.createdAt = raw.createdAt.trim();
  return row;
}

function filterActiveWaitlistRows(
  members: SafeWaitlistMember[],
  activeOnly: boolean
): SafeWaitlistMember[] {
  if (!activeOnly) return members.filter((m) => Boolean(m.email));
  return members.filter((m) => {
    if (!m.email) return false;
    if (isReleasedWaitlistStatus(m.status)) return false;
    if (isTestWaitlistEmail(m.email)) return false;
    return true;
  });
}

/**
 * Read-only waitlist for CEO Dashboard.
 * Prefers Firestore `site_registrations`, falls back to local `waitlist.json`.
 * Never returns activationKey or other secrets.
 */
export function listLocalWaitlistSafe(
  limit = 500,
  options?: ListWaitlistOptions
): SafeWaitlistMember[] {
  const capped = Math.min(Math.max(1, limit), 2000);
  const activeOnly = options?.activeOnly !== false;
  const local = readLocalCollection<Record<string, unknown> & { id?: string }>('waitlist.json');
  return filterActiveWaitlistRows(
    local.map((raw, i) => toSafeWaitlistRow(String(raw.id || `local_${i}`), raw, 'local')),
    activeOnly
  )
    .sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')))
    .slice(0, capped);
}

export async function listWaitlistRegistrationsSafe(
  limit = 500,
  options?: ListWaitlistOptions
): Promise<{
  members: SafeWaitlistMember[];
  source: 'firestore' | 'local' | 'none';
}> {
  const capped = Math.min(Math.max(1, limit), 2000);
  const activeOnly = options?.activeOnly !== false;
  const db = getAdminFirestore();

  if (db) {
    try {
      // Fetch extra when activeOnly so released/test rows do not starve the active list.
      const fetchLimit = activeOnly ? Math.min(2000, Math.max(capped * 3, capped)) : capped;
      const snapshot = await db.collection('site_registrations').limit(fetchLimit).get();
      const members = filterActiveWaitlistRows(
        snapshot.docs.map((doc) =>
          toSafeWaitlistRow(doc.id, doc.data() as Record<string, unknown>, 'firestore')
        ),
        activeOnly
      )
        .sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')))
        .slice(0, capped);
      return { members, source: 'firestore' };
    } catch (err) {
      console.warn('[registrations] Firestore waitlist list failed; trying local file.', err);
    }
  }

  // Production: never present ephemeral disk waitlist as the member source of truth.
  if (process.env.NODE_ENV === 'production') {
    return { members: [], source: 'none' };
  }

  const members = listLocalWaitlistSafe(capped, { activeOnly });
  return { members, source: members.length ? 'local' : 'none' };
}
