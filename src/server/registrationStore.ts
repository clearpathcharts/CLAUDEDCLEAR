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
    const docRef = await db.collection('site_registrations').add(record);
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
    const docRef = await db.collection('identity_preregistrations').add(record);
    return docRef.id;
  }

  const records = readLocalCollection<IdentityPreregistration & { id: string }>('identity.json');
  const id = `local_${Date.now()}`;
  records.push({ ...record, id });
  writeLocalCollection('identity.json', records);
  return id;
}
