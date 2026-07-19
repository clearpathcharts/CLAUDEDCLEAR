/**
 * ClearPath Trader — Private account auth (email + password).
 * Each member gets an isolated login desk and session.
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { promisify } from 'node:util';

const scrypt = promisify(crypto.scrypt);

export type PrivateUserRecord = {
  uid: string;
  email: string;
  displayName: string;
  passwordHash: string;
  passwordSalt: string;
  createdAt: string;
  lastLoginAt?: string;
};

export type PublicPrivateUser = {
  uid: string;
  email: string;
  displayName: string;
};

export class PrivateAuthError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

const DATA_DIR = path.join(process.cwd(), 'data', 'private_accounts');
const USERS_FILE = 'users.json';

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function normalizeEmail(email: string): string {
  return (email || '').trim().toLowerCase();
}

function readUsers(): PrivateUserRecord[] {
  ensureDataDir();
  const filePath = path.join(DATA_DIR, USERS_FILE);
  if (!fs.existsSync(filePath)) return [];
  try {
    const parsed = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeUsers(users: PrivateUserRecord[]) {
  ensureDataDir();
  fs.writeFileSync(path.join(DATA_DIR, USERS_FILE), JSON.stringify(users, null, 2));
}

async function hashPassword(password: string, salt?: string): Promise<{ hash: string; salt: string }> {
  const useSalt = salt || crypto.randomBytes(16).toString('hex');
  const derived = (await scrypt(password, useSalt, 64)) as Buffer;
  return { hash: derived.toString('hex'), salt: useSalt };
}

function toPublic(user: PrivateUserRecord): PublicPrivateUser {
  return {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
  };
}

/** Existence check only — never leak displayName (email enumeration hardening). */
export async function lookupPrivateUser(email: string): Promise<{
  exists: boolean;
}> {
  const normalized = normalizeEmail(email);
  if (!normalized || !normalized.includes('@')) {
    throw new PrivateAuthError('Enter a valid email address.');
  }
  const users = readUsers();
  const found = users.find((u) => u.email === normalized);
  return { exists: Boolean(found) };
}

export async function registerPrivateUser(input: {
  email: string;
  password: string;
  displayName: string;
}): Promise<PublicPrivateUser> {
  const email = normalizeEmail(input.email);
  const displayName = (input.displayName || '').trim();
  const password = input.password || '';

  if (!email.includes('@')) throw new PrivateAuthError('Enter a valid email address.');
  if (displayName.length < 2) throw new PrivateAuthError('Display name must be at least 2 characters.');
  if (password.length < 8) throw new PrivateAuthError('Password must be at least 8 characters.');

  const users = readUsers();
  if (users.some((u) => u.email === email)) {
    throw new PrivateAuthError('An account with this email already exists. Use Private Login.', 409);
  }

  const { hash, salt } = await hashPassword(password);
  const record: PrivateUserRecord = {
    uid: `cpt_${crypto.randomBytes(12).toString('hex')}`,
    email,
    displayName,
    passwordHash: hash,
    passwordSalt: salt,
    createdAt: new Date().toISOString(),
  };
  users.push(record);
  writeUsers(users);
  return toPublic(record);
}

export async function loginPrivateUser(input: {
  email: string;
  password: string;
}): Promise<PublicPrivateUser> {
  const email = normalizeEmail(input.email);
  const password = input.password || '';
  if (!email.includes('@') || !password) {
    throw new PrivateAuthError('Email and password are required.');
  }

  const users = readUsers();
  const found = users.find((u) => u.email === email);
  if (!found) throw new PrivateAuthError('No private account found for that email.', 404);

  const { hash } = await hashPassword(password, found.passwordSalt);
  const a = Buffer.from(hash, 'hex');
  const b = Buffer.from(found.passwordHash, 'hex');
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    throw new PrivateAuthError('Incorrect password for this private account.', 401);
  }

  found.lastLoginAt = new Date().toISOString();
  writeUsers(users);
  return toPublic(found);
}

/** Client-facing session payload stored in localStorage + mirrored in Express session */
export function buildClientSessionUser(user: PublicPrivateUser) {
  return {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
    isAnonymous: false,
    emailVerified: true,
    privateAccount: true,
  };
}
