import type RSSParser from 'rss-parser';
import { YWC_DIGEST_CACHE_TTL_MS, YWC_FEED_SOURCES, type YwcFeedCategory } from '../data/ywcFeedSources';
import { mapRssItem, type MappedRssItem } from './rssItemMapper';

export interface YwcDigestItem extends MappedRssItem {
  source: string;
  category: YwcFeedCategory;
}

export interface YwcDigestPayload {
  refreshedAt: number;
  expiresAt: number;
  itemCount: number;
  items: YwcDigestItem[];
}

let digestCache: YwcDigestPayload | null = null;
let refreshPromise: Promise<YwcDigestPayload> | null = null;

async function fetchFeedItems(
  parser: RSSParser,
  feedUrl: string,
  source: string,
  category: YwcFeedCategory,
  limit: number,
  assertSafePublicUrl: (url: string) => Promise<unknown>
): Promise<YwcDigestItem[]> {
  await assertSafePublicUrl(feedUrl);

  const timeoutMs = 8000;
  const feed = await Promise.race([
    parser.parseURL(feedUrl),
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`RSS timeout: ${source}`)), timeoutMs)
    ),
  ]);

  return (feed.items || []).slice(0, limit).map((item, index) => {
    const mapped = mapRssItem(item as Record<string, unknown>, index);
    return { ...mapped, source, category };
  });
}

function dedupeItems(items: YwcDigestItem[]): YwcDigestItem[] {
  const seen = new Set<string>();
  const result: YwcDigestItem[] = [];

  for (const item of items) {
    const key = item.link || item.id;
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(item);
  }

  return result.sort((a, b) => b.timestamp - a.timestamp);
}

export async function buildYwcDigest(
  parser: RSSParser,
  assertSafePublicUrl: (url: string) => Promise<unknown>
): Promise<YwcDigestPayload> {
  const batches = await Promise.allSettled(
    YWC_FEED_SOURCES.map(({ url, source, category, limit }) =>
      fetchFeedItems(parser, url, source, category, limit, assertSafePublicUrl)
    )
  );

  const merged: YwcDigestItem[] = [];
  for (const batch of batches) {
    if (batch.status === 'fulfilled') {
      merged.push(...batch.value);
    }
  }

  const now = Date.now();
  const items = dedupeItems(merged);

  return {
    refreshedAt: now,
    expiresAt: now + YWC_DIGEST_CACHE_TTL_MS,
    itemCount: items.length,
    items,
  };
}

export async function getYwcDigest(
  parser: RSSParser,
  assertSafePublicUrl: (url: string) => Promise<unknown>,
  force = false
): Promise<YwcDigestPayload> {
  const now = Date.now();
  if (!force && digestCache && digestCache.expiresAt > now) {
    return digestCache;
  }

  if (!force && refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = buildYwcDigest(parser, assertSafePublicUrl)
    .then((payload) => {
      digestCache = payload;
      return payload;
    })
    .finally(() => {
      refreshPromise = null;
    });

  return refreshPromise;
}
