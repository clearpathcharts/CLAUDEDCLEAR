/**
 * Which explainer video plays behind which play icon.
 *
 * Firestore when Admin is up, local JSON file when it is not — the same
 * write-through shape as `communityStore.ts`, because Cloud Run disk is wiped
 * on every redeploy and these assignments must survive one.
 *
 * Only slot ids that exist in the registry are ever stored, and only absolute
 * https URLs are ever handed back, so a bad write cannot turn into a bad
 * `<video src>` on the public site.
 */
import fs from 'node:fs';
import path from 'node:path';
import { getAdminFirestore } from './firebaseAdmin';
import { isVideoSlotId } from '../content/videoSlots';

export type VideoSlotAssignment = {
  /** Which play icon. Always a registry id. */
  slotId: string;
  /** Library video id, kept so deleting a video can prune its slots. */
  videoId: string;
  /** Playable URL. Absolute https only. */
  url: string;
  assignedAt: string;
};

export type VideoSlotAssignmentMap = Record<string, VideoSlotAssignment>;

const DIR = path.join(process.cwd(), 'data', 'video-slots');
const FILE = path.join(DIR, 'assignments.json');
const COLLECTION = 'site_settings';
const DOC = 'video_slots';

/** In-memory copy so the public endpoint never waits on Firestore per request. */
let cache: VideoSlotAssignmentMap | null = null;

function isAssignment(row: unknown): row is VideoSlotAssignment {
  if (!row || typeof row !== 'object') return false;
  const a = row as VideoSlotAssignment;
  return (
    isVideoSlotId(a.slotId) &&
    typeof a.videoId === 'string' &&
    a.videoId.length > 0 &&
    typeof a.url === 'string' &&
    /^https:\/\/[^\s]+$/i.test(a.url)
  );
}

/** Drop anything unrecognised rather than trusting whatever is on disk. */
function sanitize(raw: unknown): VideoSlotAssignmentMap {
  const out: VideoSlotAssignmentMap = {};
  if (!raw || typeof raw !== 'object') return out;
  for (const [slotId, value] of Object.entries(raw as Record<string, unknown>)) {
    if (!isVideoSlotId(slotId)) continue;
    const row = { ...(value as object), slotId } as VideoSlotAssignment;
    if (!isAssignment(row)) continue;
    out[slotId] = {
      slotId,
      videoId: row.videoId,
      url: row.url,
      assignedAt: typeof row.assignedAt === 'string' ? row.assignedAt : new Date().toISOString(),
    };
  }
  return out;
}

function readDisk(): VideoSlotAssignmentMap {
  try {
    if (!fs.existsSync(FILE)) return {};
    return sanitize(JSON.parse(fs.readFileSync(FILE, 'utf8')));
  } catch {
    return {};
  }
}

function writeDisk(map: VideoSlotAssignmentMap): void {
  try {
    if (!fs.existsSync(DIR)) fs.mkdirSync(DIR, { recursive: true });
    fs.writeFileSync(FILE, JSON.stringify(map, null, 2), 'utf8');
  } catch (err) {
    console.warn('[VideoSlots] local file write failed', err instanceof Error ? err.message : err);
  }
}

async function readFirestore(): Promise<VideoSlotAssignmentMap | null> {
  const db = getAdminFirestore();
  if (!db) return null;
  try {
    const snap = await db.collection(COLLECTION).doc(DOC).get();
    if (!snap.exists) return {};
    return sanitize((snap.data() as { assignments?: unknown } | undefined)?.assignments);
  } catch (err) {
    console.warn('[VideoSlots] Firestore load failed', err instanceof Error ? err.message : err);
    return null;
  }
}

async function writeFirestore(map: VideoSlotAssignmentMap): Promise<void> {
  const db = getAdminFirestore();
  if (!db) return;
  try {
    await db
      .collection(COLLECTION)
      .doc(DOC)
      .set({ assignments: map, updatedAt: new Date().toISOString() }, { merge: true });
  } catch (err) {
    console.warn(
      '[VideoSlots] Firestore write failed (local file copy kept)',
      err instanceof Error ? err.message : err
    );
  }
}

/**
 * Durable copy wins when Firestore answers; the local file is the credential-less
 * dev/CI path and the warm cache for the public endpoint.
 */
export async function loadVideoSlotAssignments(): Promise<VideoSlotAssignmentMap> {
  const remote = await readFirestore();
  cache = remote ?? readDisk();
  if (remote) writeDisk(remote);
  return cache;
}

/** Non-blocking read for the public endpoint. Hydrates once, then serves memory. */
export async function getVideoSlotAssignments(): Promise<VideoSlotAssignmentMap> {
  if (cache) return cache;
  return loadVideoSlotAssignments();
}

export async function setVideoSlotAssignment(input: {
  slotId: string;
  videoId: string;
  url: string;
}): Promise<VideoSlotAssignment> {
  const row: VideoSlotAssignment = {
    slotId: input.slotId,
    videoId: input.videoId,
    url: input.url,
    assignedAt: new Date().toISOString(),
  };
  if (!isAssignment(row)) {
    throw new Error('Refusing to store an unknown slot or a non-https video URL.');
  }
  const next = { ...(await getVideoSlotAssignments()), [row.slotId]: row };
  cache = next;
  writeDisk(next);
  await writeFirestore(next);
  return row;
}

export async function clearVideoSlotAssignment(slotId: string): Promise<boolean> {
  const current = await getVideoSlotAssignments();
  if (!current[slotId]) return false;
  const next = { ...current };
  delete next[slotId];
  cache = next;
  writeDisk(next);
  await writeFirestore(next);
  return true;
}

/**
 * Called when a video leaves the library. Without this a deleted video would
 * stay wired to a play icon and visitors would get a dead `<video>`.
 */
export async function clearAssignmentsForVideo(videoId: string): Promise<string[]> {
  const current = await getVideoSlotAssignments();
  const orphaned = Object.values(current)
    .filter((a) => a.videoId === videoId)
    .map((a) => a.slotId);
  if (!orphaned.length) return [];
  const next = { ...current };
  for (const slotId of orphaned) delete next[slotId];
  cache = next;
  writeDisk(next);
  await writeFirestore(next);
  return orphaned;
}

/**
 * Drop assignments whose video is no longer in the bucket. Belt and braces for
 * objects removed outside the CEO page.
 */
export async function pruneVideoSlotAssignments(liveVideoIds: string[]): Promise<string[]> {
  const live = new Set(liveVideoIds);
  const current = await getVideoSlotAssignments();
  const stale = Object.values(current)
    .filter((a) => !live.has(a.videoId))
    .map((a) => a.slotId);
  if (!stale.length) return [];
  const next = { ...current };
  for (const slotId of stale) delete next[slotId];
  cache = next;
  writeDisk(next);
  await writeFirestore(next);
  return stale;
}

/** The only shape the public endpoint is allowed to emit: slot id → URL. */
export function toPublicSlotUrlMap(map: VideoSlotAssignmentMap): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [slotId, assignment] of Object.entries(map)) {
    if (!isVideoSlotId(slotId)) continue;
    out[slotId] = assignment.url;
  }
  return out;
}

/** Test-only: forget the warm cache so a fresh read hits disk/Firestore again. */
export function __resetVideoSlotCacheForTests(): void {
  cache = null;
}
