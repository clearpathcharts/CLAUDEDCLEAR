/**
 * Server-side profile store for private-session users.
 * Avoids Firebase client permission failures when request.auth is null.
 *
 * Durability: local files are the fast working copy; every write is mirrored
 * to Firestore `member_profiles` (write-through), and the local cache is
 * hydrated from Firestore at boot so Cloud Run redeploys never lose
 * memberships, badges, or launch-trial clocks.
 */
import fs from 'fs';
import path from 'path';
import { getAdminFirestore } from './firebaseAdmin';

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
  /** Admin-granted seals (e.g. Independent Contractor). Not writable via /api/profile/me. */
  contractorBadges?: {
    id: string;
    label: string;
    imageUrl: string;
    grantedAt: string;
    grantedBy?: string;
  }[];
  /** Stripe-managed membership. Set ONLY by the Stripe webhook — never writable via /api/profile/me. */
  membership?: {
    tier: string;
    status: 'active' | 'trialing' | 'past_due' | 'canceled';
    stripeCustomerId?: string;
    stripeSubscriptionId?: string;
    currentPeriodEnd?: string;
    activatedAt?: string;
    updatedAt?: string;
    /** Referrer credited on first real (post-trial) payment. */
    affiliateCredited?: boolean;
  };
  /** Launch gift: every account gets Ultimate free for its first 15 days. Server-set only. */
  launchTrial?: { startedAt: string };
  updatedAt?: string;
};

const DIR = path.join(process.cwd(), 'data', 'profiles');
const COLLECTION = 'member_profiles';

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
  // Write-through to Firestore (fire-and-forget; local file already saved).
  void pushProfileToFirestore(JSON.parse(serialized) as StoredProfile);
  return next;
}

/** Raw local write that does NOT bump updatedAt or re-trigger a Firestore push. */
function writeLocalRaw(profile: StoredProfile) {
  const id = safeUid(profile.uid);
  if (!id) return;
  ensureDir();
  fs.writeFileSync(fileFor(id), JSON.stringify(profile), 'utf8');
}

async function pushProfileToFirestore(profile: StoredProfile): Promise<boolean> {
  const db = getAdminFirestore();
  if (!db) return false;
  try {
    await db.collection(COLLECTION).doc(profile.uid).set(profile);
    return true;
  } catch (err) {
    console.warn('[profileStore] Firestore write-through failed (local copy saved):', err);
    return false;
  }
}

function isRemoteNewer(remote: StoredProfile, local: StoredProfile | null): boolean {
  if (!local) return true;
  const r = String(remote.updatedAt || '');
  const l = String(local.updatedAt || '');
  return r > l;
}

/**
 * Pull one profile from Firestore into the local cache when the remote copy
 * is newer (e.g. a Stripe webhook landed on another Cloud Run instance).
 * Safe to call on hot paths — no-op when Firestore is unavailable.
 */
export async function refreshProfileFromDurable(uid: string): Promise<StoredProfile | null> {
  const id = safeUid(uid);
  if (!id) return null;
  const db = getAdminFirestore();
  if (!db) return readProfile(id);
  try {
    const doc = await db.collection(COLLECTION).doc(id).get();
    if (doc.exists) {
      const remote = doc.data() as StoredProfile;
      if (remote?.uid && isRemoteNewer(remote, readProfile(id))) {
        writeLocalRaw(remote);
        return remote;
      }
    }
  } catch (err) {
    console.warn('[profileStore] Firestore refresh failed; using local copy.', err);
  }
  return readProfile(id);
}

/**
 * Boot hydration: pull every durable profile into the local cache, then push
 * any local-only profiles up (one-time migration for existing deployments).
 */
export async function hydrateProfilesFromDurableStore(): Promise<{
  source: 'firestore' | 'local';
  pulled: number;
  pushed: number;
}> {
  const db = getAdminFirestore();
  if (!db) return { source: 'local', pulled: 0, pushed: 0 };

  let pulled = 0;
  let pushed = 0;
  const remoteUids = new Set<string>();
  try {
    const snapshot = await db.collection(COLLECTION).limit(5000).get();
    for (const doc of snapshot.docs) {
      const remote = doc.data() as StoredProfile;
      if (!remote?.uid) continue;
      remoteUids.add(safeUid(remote.uid));
      if (isRemoteNewer(remote, readProfile(remote.uid))) {
        writeLocalRaw(remote);
        pulled += 1;
      }
    }
  } catch (err) {
    console.warn('[profileStore] Firestore hydrate failed; keeping local files.', err);
    return { source: 'local', pulled, pushed };
  }

  // Push local-only profiles up so nothing is stranded on this instance.
  try {
    ensureDir();
    for (const file of fs.readdirSync(DIR)) {
      if (!file.endsWith('.json')) continue;
      const uid = safeUid(file.slice(0, -'.json'.length));
      if (!uid || remoteUids.has(uid)) continue;
      const local = readProfile(uid);
      if (local && (await pushProfileToFirestore(local))) pushed += 1;
    }
  } catch (err) {
    console.warn('[profileStore] Local→Firestore push skipped:', err);
  }

  return { source: 'firestore', pulled, pushed };
}
