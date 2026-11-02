/**
 * Marketing Department outbox — drafted posts waiting for the founder's tap.
 *
 * Nothing here posts anywhere. Outbound dispatch is off by founder order; a
 * post only becomes "posted" when the founder pastes the live URL back in.
 * Captions are built from vetted copy (tier-content-catalog promises, the
 * required disclaimer, per-platform keyword lists) — never generated claims.
 *
 * Storage: Firestore doc when Admin is up, local JSON for credential-less dev.
 * In production without Firestore the store refuses writes instead of
 * pretending to save to a disk that is wiped on the next deploy.
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import tierContentCatalog from '../../data/marketing/tier-content-catalog.json';
import searchIntelligence from '../../data/marketing/global-search-intelligence.json';
import marketingMetadata from '../../data/marketing/clearpath-marketing-metadata.json';
import { getAdminFirestore } from './firebaseAdmin';

export const OUTBOX_STATUSES = ['draft', 'approved', 'posted', 'archived'] as const;
export type OutboxStatus = (typeof OUTBOX_STATUSES)[number];

export const OUTBOX_TIERS = ['basic', 'silver', 'gold', 'platinum'] as const;
export type OutboxTier = (typeof OUTBOX_TIERS)[number];

export const MARKETING_CHANNELS: string[] = [...tierContentCatalog.channels];

export type OutboxPost = {
  id: string;
  assetId: string;
  assetKind: 'image' | 'video';
  mediaUrl: string;
  assetTitle: string;
  platform: string;
  tier: OutboxTier;
  caption: string;
  hashtags: string[];
  trackedLink: string;
  status: OutboxStatus;
  postedUrl: string | null;
  createdAt: string;
  updatedAt: string;
  approvedAt: string | null;
  postedAt: string | null;
};

export class OutboxError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code: string
  ) {
    super(message);
    this.name = 'OutboxError';
  }
}

/** Per-platform text limit and how many hashtags the platform's culture tolerates. */
const PLATFORM_RULES: Record<string, { label: string; maxChars: number; maxTags: number }> = {
  instagram: { label: 'Instagram', maxChars: 2200, maxTags: 8 },
  tiktok: { label: 'TikTok', maxChars: 2200, maxTags: 5 },
  youtube: { label: 'YouTube', maxChars: 5000, maxTags: 3 },
  facebook: { label: 'Facebook', maxChars: 5000, maxTags: 3 },
  linkedin: { label: 'LinkedIn', maxChars: 3000, maxTags: 3 },
  threads: { label: 'Threads', maxChars: 500, maxTags: 1 },
  bluesky: { label: 'Bluesky', maxChars: 300, maxTags: 2 },
  reddit: { label: 'Reddit', maxChars: 3000, maxTags: 0 },
  pinterest: { label: 'Pinterest', maxChars: 500, maxTags: 5 },
  discord: { label: 'Discord', maxChars: 2000, maxTags: 0 },
  telegram: { label: 'Telegram', maxChars: 4096, maxTags: 3 },
};

export function platformLabel(platform: string): string {
  return PLATFORM_RULES[platform]?.label || platform;
}

export function platformKeywords(platform: string): string[] {
  const row = (searchIntelligence.platforms as Array<{ platform: string; keywords: string[] }>).find(
    (p) => p.platform.toLowerCase() === platform.toLowerCase()
  );
  return row ? [...row.keywords] : [];
}

function toHashtag(phrase: string): string {
  const words = phrase.replace(/[^A-Za-z0-9 ]+/g, ' ').trim().split(/\s+/).filter(Boolean);
  if (!words.length) return '';
  return `#${words.map((w) => w[0]!.toUpperCase() + w.slice(1)).join('')}`;
}

/** Brand first, then vetted education/accessibility tags, then the platform's own search terms. */
export function hashtagsFor(platform: string, tier: OutboxTier): string[] {
  const rules = PLATFORM_RULES[platform];
  const limit = rules ? rules.maxTags : 3;
  if (limit <= 0) return [];
  const groups = marketingMetadata.hashtags as Record<string, string[]>;
  const pool = [
    ...(groups.brand || []),
    ...(groups.education || []),
    ...(tier === 'basic' ? groups.accessibility || [] : []),
    ...platformKeywords(platform)
      .filter((k) => !/clearpath/i.test(k))
      .map(toHashtag),
  ];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const tag of pool) {
    const key = tag.toLowerCase();
    if (!tag || tag.length < 3 || seen.has(key)) continue;
    seen.add(key);
    out.push(tag);
    if (out.length >= limit) break;
  }
  return out;
}

export function trackedLinkFor(tier: OutboxTier, platform: string, assetId: string): string {
  return `https://clearpathtrader.com/go/${tier}/${platform}/${assetId}`;
}

export function buildCaption(input: {
  platform: string;
  tier: OutboxTier;
  assetTitle: string;
  trackedLink: string;
  hashtags: string[];
}): string {
  const tier = tierContentCatalog.tiers.find((t) => t.id === input.tier) || tierContentCatalog.tiers[0]!;
  const disclaimer = tierContentCatalog.requiredDisclaimer;
  const tags = input.hashtags.join(' ');
  const maxChars = PLATFORM_RULES[input.platform]?.maxChars ?? 2200;
  const full = [input.assetTitle, tier.promise, `${tier.poster.cta}: ${input.trackedLink}`, disclaimer, tags]
    .filter(Boolean)
    .join('\n\n');
  if (full.length <= maxChars) return full;
  // Short-form platforms: keep the link and disclaimer, drop the pitch first.
  const short = [input.assetTitle, input.trackedLink, disclaimer, tags].filter(Boolean).join('\n\n');
  if (short.length <= maxChars) return short;
  return [input.trackedLink, disclaimer].join('\n');
}

// ── storage ─────────────────────────────────────────────────────────────────

const DIR = path.join(process.cwd(), 'data', 'marketing-outbox');
const FILE = path.join(DIR, 'outbox.json');
const COLLECTION = 'site_settings';
const DOC = 'marketing_outbox';
const MAX_POSTS = 600;

export type OutboxStorage = 'firestore' | 'local' | 'unavailable';

export function outboxStorageMode(): OutboxStorage {
  if (getAdminFirestore()) return 'firestore';
  return process.env.NODE_ENV === 'production' ? 'unavailable' : 'local';
}

function isPost(row: unknown): row is OutboxPost {
  if (!row || typeof row !== 'object') return false;
  const p = row as OutboxPost;
  return (
    typeof p.id === 'string' &&
    typeof p.platform === 'string' &&
    typeof p.caption === 'string' &&
    (OUTBOX_STATUSES as readonly string[]).includes(p.status)
  );
}

function sanitizeList(raw: unknown): OutboxPost[] {
  return Array.isArray(raw) ? raw.filter(isPost) : [];
}

async function readPosts(): Promise<OutboxPost[]> {
  const db = getAdminFirestore();
  if (db) {
    const snap = await db.collection(COLLECTION).doc(DOC).get();
    return sanitizeList((snap.data() as { posts?: unknown } | undefined)?.posts);
  }
  if (process.env.NODE_ENV === 'production') return [];
  try {
    if (!fs.existsSync(FILE)) return [];
    return sanitizeList(JSON.parse(fs.readFileSync(FILE, 'utf8')));
  } catch {
    return [];
  }
}

async function writePosts(posts: OutboxPost[]): Promise<void> {
  const trimmed = posts
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, MAX_POSTS);
  const db = getAdminFirestore();
  if (db) {
    await db.collection(COLLECTION).doc(DOC).set({ posts: trimmed, updatedAt: new Date().toISOString() });
    return;
  }
  if (process.env.NODE_ENV === 'production') {
    throw new OutboxError(
      'Durable storage (Firestore) is not reachable, so the outbox cannot be saved. Nothing was written.',
      503,
      'storage_unavailable'
    );
  }
  fs.mkdirSync(DIR, { recursive: true });
  fs.writeFileSync(FILE, JSON.stringify(trimmed, null, 2), 'utf8');
}

export async function listOutbox(): Promise<OutboxPost[]> {
  const posts = await readPosts();
  return posts.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function planOutboxPosts(input: {
  asset: { id: string; kind: 'image' | 'video'; url: string; title: string };
  platforms: unknown;
  tier: unknown;
}): Promise<OutboxPost[]> {
  const tier = (OUTBOX_TIERS as readonly string[]).includes(String(input.tier)) ? (String(input.tier) as OutboxTier) : 'basic';
  const requested = Array.isArray(input.platforms) ? input.platforms.map((p) => String(p).toLowerCase()) : [];
  const platforms = [...new Set(requested)].filter((p) => MARKETING_CHANNELS.includes(p));
  if (!platforms.length) {
    throw new OutboxError('Pick at least one destination platform.', 400, 'no_platforms');
  }
  const now = new Date().toISOString();
  const created = platforms.map<OutboxPost>((platform) => {
    const hashtags = hashtagsFor(platform, tier);
    const trackedLink = trackedLinkFor(tier, platform, input.asset.id);
    return {
      id: crypto.randomBytes(8).toString('hex'),
      assetId: input.asset.id,
      assetKind: input.asset.kind,
      mediaUrl: input.asset.url,
      assetTitle: input.asset.title,
      platform,
      tier,
      caption: buildCaption({ platform, tier, assetTitle: input.asset.title, trackedLink, hashtags }),
      hashtags,
      trackedLink,
      status: 'draft',
      postedUrl: null,
      createdAt: now,
      updatedAt: now,
      approvedAt: null,
      postedAt: null,
    };
  });
  const posts = await readPosts();
  await writePosts([...created, ...posts]);
  return created;
}

export async function updateOutboxPost(
  id: string,
  patch: { status?: unknown; caption?: unknown; postedUrl?: unknown }
): Promise<OutboxPost> {
  const posts = await readPosts();
  const post = posts.find((p) => p.id === id);
  if (!post) throw new OutboxError('That post is not in the outbox.', 404, 'not_found');
  const now = new Date().toISOString();

  if (patch.caption !== undefined) {
    const caption = String(patch.caption).slice(0, 5000);
    if (!caption.includes(tierContentCatalog.requiredDisclaimer)) {
      throw new OutboxError('The caption must keep the required disclaimer.', 400, 'missing_disclaimer');
    }
    post.caption = caption;
  }
  if (patch.postedUrl !== undefined) {
    const url = String(patch.postedUrl || '').trim();
    if (url && !/^https:\/\/[^\s]+$/i.test(url)) {
      throw new OutboxError('The live post link must start with https://', 400, 'bad_url');
    }
    post.postedUrl = url || null;
  }
  if (patch.status !== undefined) {
    const status = String(patch.status) as OutboxStatus;
    if (!(OUTBOX_STATUSES as readonly string[]).includes(status)) {
      throw new OutboxError('Unknown status.', 400, 'bad_status');
    }
    if (status === 'posted' && !post.postedUrl) {
      throw new OutboxError('Paste the live post link before marking it posted.', 400, 'posted_url_required');
    }
    if (status === 'approved' && !post.approvedAt) post.approvedAt = now;
    if (status === 'posted' && !post.postedAt) post.postedAt = now;
    post.status = status;
  }
  post.updatedAt = now;
  await writePosts(posts);
  return post;
}

export async function deleteOutboxPost(id: string): Promise<boolean> {
  const posts = await readPosts();
  const next = posts.filter((p) => p.id !== id);
  if (next.length === posts.length) return false;
  await writePosts(next);
  return true;
}

export async function deleteOutboxPostsForAsset(assetId: string): Promise<number> {
  const posts = await readPosts();
  const next = posts.filter((p) => p.assetId !== assetId || p.status === 'posted');
  const removed = posts.length - next.length;
  if (removed) await writePosts(next);
  return removed;
}
