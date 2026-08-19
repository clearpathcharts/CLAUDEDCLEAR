/**
 * One-time password-reset tokens (hashed). Sidecar file so we do not reshape
 * durable Firestore/Stripe private-account docs for this flow.
 */
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

export type PasswordResetRecord = {
  uid: string;
  email: string;
  tokenHash: string;
  expiresAt: string;
};

const DIR = path.join(process.cwd(), 'data', 'private_accounts');
const FILE = path.join(DIR, 'password_resets.json');
const TTL_MS = 2 * 60 * 60 * 1000;

function ensureDir() {
  if (!fs.existsSync(DIR)) fs.mkdirSync(DIR, { recursive: true });
}

function readAll(): PasswordResetRecord[] {
  ensureDir();
  if (!fs.existsSync(FILE)) return [];
  try {
    const parsed = JSON.parse(fs.readFileSync(FILE, 'utf8'));
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeAll(rows: PasswordResetRecord[]) {
  ensureDir();
  fs.writeFileSync(FILE, JSON.stringify(rows, null, 2));
}

export function hashResetToken(raw: string): string {
  return crypto.createHash('sha256').update(raw).digest('hex');
}

export function mintPasswordResetToken(input: { uid: string; email: string }): {
  rawToken: string;
  record: PasswordResetRecord;
} {
  const rawToken = crypto.randomBytes(24).toString('base64url');
  const record: PasswordResetRecord = {
    uid: input.uid,
    email: input.email,
    tokenHash: hashResetToken(rawToken),
    expiresAt: new Date(Date.now() + TTL_MS).toISOString(),
  };
  const next = readAll().filter((row) => row.uid !== input.uid && Date.parse(row.expiresAt) > Date.now());
  next.push(record);
  writeAll(next);
  return { rawToken, record };
}

export function consumePasswordResetToken(rawToken: string): PasswordResetRecord | null {
  const tokenHash = hashResetToken(String(rawToken || '').trim());
  if (!tokenHash || tokenHash.length < 16) return null;
  const now = Date.now();
  const rows = readAll();
  const found = rows.find((row) => row.tokenHash === tokenHash);
  writeAll(rows.filter((row) => row.tokenHash !== tokenHash && Date.parse(row.expiresAt) > now));
  if (!found) return null;
  if (Date.parse(found.expiresAt) <= now) return null;
  return found;
}
