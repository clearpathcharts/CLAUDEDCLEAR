/**
 * Server-side profile store for private-session users.
 * Avoids Firebase client permission failures when request.auth is null.
 */
import fs from 'fs';
import path from 'path';

export type StoredProfile = {
  uid: string;
  displayName?: string;
  username?: string;
  bio?: string;
  avatarUrl?: string;
  coverUrl?: string;
  photoURL?: string;
  coverURL?: string;
  instagramType?: string;
  publishStatus?: string;
  updatedAt?: string;
};

const DIR = path.join(process.cwd(), 'data', 'profiles');

function ensureDir() {
  if (!fs.existsSync(DIR)) {
    fs.mkdirSync(DIR, { recursive: true });
  }
}

function safeUid(uid: string): string {
  return String(uid || '').replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 128);
}

function fileFor(uid: string) {
  return path.join(DIR, `${safeUid(uid)}.json`);
}

export function readProfile(uid: string): StoredProfile | null {
  const id = safeUid(uid);
  if (!id) return null;
  try {
    ensureDir();
    const fp = fileFor(id);
    if (!fs.existsSync(fp)) return null;
    return JSON.parse(fs.readFileSync(fp, 'utf8')) as StoredProfile;
  } catch (err) {
    console.error('[profileStore] read failed:', err);
    return null;
  }
}

export function writeProfile(uid: string, patch: Partial<StoredProfile>): StoredProfile {
  const id = safeUid(uid);
  if (!id) throw new Error('Invalid profile uid');
  ensureDir();
  const prev = readProfile(id) || { uid: id };
  const next: StoredProfile = {
    ...prev,
    ...patch,
    uid: id,
    updatedAt: new Date().toISOString(),
  };
  // Keep both naming styles in sync
  if (patch.avatarUrl !== undefined) next.photoURL = patch.avatarUrl;
  if (patch.photoURL !== undefined) next.avatarUrl = patch.photoURL;
  if (patch.coverUrl !== undefined) next.coverURL = patch.coverUrl;
  if (patch.coverURL !== undefined) next.coverUrl = patch.coverURL;

  // Guard against runaway payloads (Firestore 1MB analog)
  const serialized = JSON.stringify(next);
  if (serialized.length > 900_000) {
    throw new Error('Profile payload too large. Use a smaller image (under ~600KB).');
  }
  fs.writeFileSync(fileFor(id), serialized, 'utf8');
  return next;
}
