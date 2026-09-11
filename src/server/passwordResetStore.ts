/**
 * One-time password-reset tokens (hashed).
 * Durable: Firestore when Admin is up + local file cache for dev / fallback.
 */
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { getAdminFirestore } from './firebaseAdmin';

export type PasswordResetRecord = {
  uid: string;
  email: string;
  tokenHash: string;
  expiresAt: string;
};

const DIR = path.join(process.cwd(), 'data', 'private_accounts');
const FILE = path.join(DIR, 'password_resets.json');
const COLLECTION = 'password_resets';
const TTL_MS = 2 * 60 * 60 * 1000;

function ensureDir() {
  if (!fs.existsSync(DIR)) fs.mkdirSync(DIR, { recursive: true });
}

function readAllLocal(): PasswordResetRecord[] {
  ensureDir();
  if (!fs.existsSync(FILE)) return [];
  try {
    const parsed = JSON.parse(fs.readFileSync(FILE, 'utf8'));
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeAllLocal(rows: PasswordResetRecord[]) {
  ensureDir();
  fs.writeFileSync(FILE, JSON.stringify(rows, null, 2));
}

export function hashResetToken(raw: string): string {
  return crypto.createHash('sha256').update(raw).digest('hex');
}

async function saveRecord(record: PasswordResetRecord): Promise<void> {
  const next = readAllLocal().filter(
    (row) => row.uid !== record.uid && Date.parse(row.expiresAt) > Date.now(),
  );
  next.push(record);
  writeAllLocal(next);

  const db = getAdminFirestore();
  if (!db) return;
  try {
    await db.collection(COLLECTION).doc(record.tokenHash).set(record);
  } catch (err) {
    console.warn('[passwordReset] Firestore write failed (local copy saved)', err);
  }
}

async function deleteByHash(tokenHash: string): Promise<void> {
  const now = Date.now();
  writeAllLocal(readAllLocal().filter((row) => row.tokenHash !== tokenHash && Date.parse(row.expiresAt) > now));

  const db = getAdminFirestore();
  if (!db) return;
  try {
    await db.collection(COLLECTION).doc(tokenHash).delete();
  } catch {
    /* ignore */
  }
}

async function findByHash(tokenHash: string): Promise<PasswordResetRecord | null> {
  const local = readAllLocal().find((row) => row.tokenHash === tokenHash);
  if (local) return local;

  const db = getAdminFirestore();
  if (!db) return null;
  try {
    const snap = await db.collection(COLLECTION).doc(tokenHash).get();
    if (!snap.exists) return null;
    const data = snap.data() as PasswordResetRecord;
    return data?.tokenHash ? data : null;
  } catch {
    return null;
  }
}

export async function mintPasswordResetToken(input: { uid: string; email: string }): Promise<{
  rawToken: string;
  record: PasswordResetRecord;
}> {
  const rawToken = crypto.randomBytes(24).toString('base64url');
  const record: PasswordResetRecord = {
    uid: input.uid,
    email: input.email,
    tokenHash: hashResetToken(rawToken),
    expiresAt: new Date(Date.now() + TTL_MS).toISOString(),
  };
  await saveRecord(record);
  return { rawToken, record };
}

export async function consumePasswordResetToken(rawToken: string): Promise<PasswordResetRecord | null> {
  const tokenHash = hashResetToken(String(rawToken || '').trim());
  if (!tokenHash || tokenHash.length < 16) return null;
  const found = await findByHash(tokenHash);
  await deleteByHash(tokenHash);
  if (!found) return null;
  if (Date.parse(found.expiresAt) <= Date.now()) return null;
  return found;
}

/** Boot hydration — pull Firestore tokens into local cache. */
export async function hydratePasswordResetsFromFirestore(): Promise<number> {
  const db = getAdminFirestore();
  if (!db) return 0;
  try {
    const snap = await db.collection(COLLECTION).limit(500).get();
    const rows = snap.docs
      .map((d) => d.data() as PasswordResetRecord)
      .filter((r) => r?.tokenHash && Date.parse(r.expiresAt) > Date.now());
    if (rows.length) writeAllLocal(rows);
    return rows.length;
  } catch {
    return 0;
  }
}
