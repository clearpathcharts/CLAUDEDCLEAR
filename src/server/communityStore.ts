/**
 * Community posts. Firestore when Admin is up, local file when it is not.
 * Cloud Run disk is ephemeral — Firestore is the durable copy.
 */
import fs from 'node:fs';
import path from 'node:path';
import { getAdminFirestore } from './firebaseAdmin';

export type CommunityPost = {
  id: string;
  roomId: string;
  authorUid: string;
  authorName: string;
  text: string;
  createdAt: number;
};

const DIR = path.join(process.cwd(), 'data', 'communities');
const FILE = path.join(DIR, 'posts.json');
const COLLECTION = 'community_rooms';
const MAX_PER_ROOM = 150;

function readDisk(): CommunityPost[] {
  try {
    if (!fs.existsSync(FILE)) return [];
    const parsed = JSON.parse(fs.readFileSync(FILE, 'utf8'));
    return Array.isArray(parsed) ? parsed.filter(isPost) : [];
  } catch {
    return [];
  }
}

function writeDisk(posts: CommunityPost[]) {
  if (!fs.existsSync(DIR)) fs.mkdirSync(DIR, { recursive: true });
  fs.writeFileSync(FILE, JSON.stringify(posts), 'utf8');
}

function isPost(row: unknown): row is CommunityPost {
  if (!row || typeof row !== 'object') return false;
  const p = row as CommunityPost;
  return Boolean(p.id && p.roomId && p.authorUid && p.text && p.createdAt);
}

function trimRoom(posts: CommunityPost[], roomId: string): CommunityPost[] {
  const mine = posts.filter((p) => p.roomId === roomId).sort((a, b) => a.createdAt - b.createdAt);
  const keep = new Set(mine.slice(-MAX_PER_ROOM).map((p) => p.id));
  return posts.filter((p) => p.roomId !== roomId || keep.has(p.id));
}

async function loadRoomFromFirestore(roomId: string): Promise<CommunityPost[] | null> {
  const db = getAdminFirestore();
  if (!db) return null;
  try {
    const snap = await db.collection(COLLECTION).doc(roomId).collection('posts').orderBy('createdAt', 'asc').limit(MAX_PER_ROOM).get();
    return snap.docs.map((d) => d.data() as CommunityPost).filter(isPost);
  } catch (err) {
    console.warn('[Community] Firestore load failed', err instanceof Error ? err.message : err);
    return null;
  }
}

export async function listCommunityPosts(roomId: string): Promise<CommunityPost[]> {
  const remote = await loadRoomFromFirestore(roomId);
  if (remote) return remote.slice(-MAX_PER_ROOM);
  return readDisk().filter((p) => p.roomId === roomId).slice(-MAX_PER_ROOM);
}

export async function addCommunityPost(post: CommunityPost): Promise<CommunityPost> {
  const disk = trimRoom([...readDisk(), post], post.roomId);
  writeDisk(disk);
  const db = getAdminFirestore();
  if (db) {
    try {
      await db.collection(COLLECTION).doc(post.roomId).collection('posts').doc(post.id).set(post);
    } catch (err) {
      console.warn('[Community] Firestore append failed (file copy kept)', err instanceof Error ? err.message : err);
    }
  }
  return post;
}

export async function deleteCommunityPost(roomId: string, postId: string, authorUid: string, founder: boolean): Promise<boolean> {
  const disk = readDisk();
  const target = disk.find((p) => p.id === postId && p.roomId === roomId);
  const remote = target ? null : await loadRoomFromFirestore(roomId);
  const found = target || remote?.find((p) => p.id === postId);
  if (!found) return false;
  if (!founder && found.authorUid !== authorUid) return false;
  writeDisk(disk.filter((p) => p.id !== postId));
  const db = getAdminFirestore();
  if (db) {
    try {
      await db.collection(COLLECTION).doc(roomId).collection('posts').doc(postId).delete();
    } catch (err) {
      console.warn('[Community] Firestore delete failed', err instanceof Error ? err.message : err);
    }
  }
  return true;
}
