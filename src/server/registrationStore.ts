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
  if (typeof raw.country === 'string' && raw.country.trim()) row.country = raw.country.trim();
  if (typeof raw.experienceLevel === 'string' && raw.experienceLevel.trim()) {
    row.experienceLevel = raw.experienceLevel.trim();
  }
  if (typeof raw.status === 'string' && raw.status.trim()) row.status = raw.status.trim();
  if (typeof raw.createdAt === 'string' && raw.createdAt.trim()) row.createdAt = raw.createdAt.trim();
  return row;
}

/**
 * Read-only waitlist for CEO Dashboard.
 * Prefers Firestore `site_registrations`, falls back to local `waitlist.json`.
 * Never returns activationKey or other secrets.
 */
export function listLocalWaitlistSafe(limit = 500): SafeWaitlistMember[] {
  const capped = Math.min(Math.max(1, limit), 2000);
  const local = readLocalCollection<Record<string, unknown> & { id?: string }>('waitlist.json');
  return local
    .map((raw, i) => toSafeWaitlistRow(String(raw.id || `local_${i}`), raw, 'local'))
    .filter((m) => Boolean(m.email))
    .sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')))
    .slice(0, capped);
}

export async function listWaitlistRegistrationsSafe(limit = 500): Promise<{
  members: SafeWaitlistMember[];
  source: 'firestore' | 'local' | 'none';
}> {
  const capped = Math.min(Math.max(1, limit), 2000);
  const db = getAdminFirestore();

  if (db) {
    try {
      const snapshot = await db.collection('site_registrations').limit(capped).get();
      const members = snapshot.docs
        .map((doc) => toSafeWaitlistRow(doc.id, doc.data() as Record<string, unknown>, 'firestore'))
        .filter((m) => Boolean(m.email))
        .sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')));
      return { members, source: 'firestore' };
    } catch (err) {
      console.warn('[registrations] Firestore waitlist list failed; trying local file.', err);
    }
  }

  const members = listLocalWaitlistSafe(capped);
  return { members, source: members.length ? 'local' : 'none' };
}
