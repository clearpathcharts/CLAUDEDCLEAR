import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import type { CreatePostInput, SocialPost } from './types';

const DATA_DIR = path.join(process.cwd(), 'data', 'social-os');
const POSTS_FILE = path.join(DATA_DIR, 'posts.json');

type StoreShape = {
  version: 1;
  posts: SocialPost[];
};

function ensureStore(): void {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(POSTS_FILE)) {
    const empty: StoreShape = { version: 1, posts: [] };
    fs.writeFileSync(POSTS_FILE, JSON.stringify(empty, null, 2), 'utf8');
  }
}

function readStore(): StoreShape {
  ensureStore();
  try {
    const raw = fs.readFileSync(POSTS_FILE, 'utf8');
    const parsed = JSON.parse(raw) as StoreShape;
    if (!parsed || !Array.isArray(parsed.posts)) {
      return { version: 1, posts: [] };
    }
    return { version: 1, posts: parsed.posts };
  } catch {
    return { version: 1, posts: [] };
  }
}

function writeStore(store: StoreShape): void {
  ensureStore();
  const tmp = `${POSTS_FILE}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(store, null, 2), 'utf8');
  fs.renameSync(tmp, POSTS_FILE);
}

function nowIso(): string {
  return new Date().toISOString();
}

export function listPosts(filter?: {
  status?: SocialPost['status'];
  platform?: SocialPost['platform'];
}): SocialPost[] {
  let posts = readStore().posts;
  if (filter?.status) posts = posts.filter((p) => p.status === filter.status);
  if (filter?.platform) posts = posts.filter((p) => p.platform === filter.platform);
  return posts.sort((a, b) => {
    const aTime = a.scheduledAt || a.createdAt;
    const bTime = b.scheduledAt || b.createdAt;
    return aTime.localeCompare(bTime);
  });
}

export function getPost(id: string): SocialPost | null {
  return readStore().posts.find((p) => p.id === id) || null;
}

export function createPost(input: CreatePostInput): SocialPost {
  const ts = nowIso();
  const post: SocialPost = {
    id: `sos_${crypto.randomBytes(8).toString('hex')}`,
    createdAt: ts,
    updatedAt: ts,
    platform: input.platform,
    title: input.title?.trim() || undefined,
    body: input.body.trim(),
    linkUrl: input.linkUrl?.trim() || undefined,
    mediaUrls: input.mediaUrls?.filter(Boolean),
    hashtags: input.hashtags?.filter(Boolean),
    scheduledAt: input.scheduledAt || undefined,
    status: input.status || (input.scheduledAt ? 'queued' : 'draft'),
    publishMode: input.publishMode || 'direct',
    source: input.source || 'manual',
    meta: input.meta,
  };

  if (!post.body) {
    throw new Error('Post body is required.');
  }

  const store = readStore();
  store.posts.push(post);
  writeStore(store);
  return post;
}

export function updatePost(
  id: string,
  patch: Partial<
    Pick<
      SocialPost,
      | 'body'
      | 'title'
      | 'linkUrl'
      | 'mediaUrls'
      | 'hashtags'
      | 'scheduledAt'
      | 'status'
      | 'publishMode'
      | 'lastError'
      | 'publishedAt'
      | 'externalIds'
      | 'meta'
    >
  >
): SocialPost | null {
  const store = readStore();
  const idx = store.posts.findIndex((p) => p.id === id);
  if (idx < 0) return null;
  const current = store.posts[idx];
  const next: SocialPost = {
    ...current,
    ...patch,
    updatedAt: nowIso(),
    externalIds: patch.externalIds
      ? { ...current.externalIds, ...patch.externalIds }
      : current.externalIds,
  };
  store.posts[idx] = next;
  writeStore(store);
  return next;
}

export function deletePost(id: string): boolean {
  const store = readStore();
  const before = store.posts.length;
  store.posts = store.posts.filter((p) => p.id !== id);
  if (store.posts.length === before) return false;
  writeStore(store);
  return true;
}

/** Due queued posts whose scheduledAt is now or in the past (or missing scheduledAt). */
export function listDueQueuedPosts(now = new Date()): SocialPost[] {
  const nowMs = now.getTime();
  return listPosts({ status: 'queued' }).filter((p) => {
    if (!p.scheduledAt) return true;
    const t = Date.parse(p.scheduledAt);
    return Number.isFinite(t) && t <= nowMs;
  });
}
