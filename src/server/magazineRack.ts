/**
 * Your World Connected magazine rack.
 * Server-only allowlisted RSS → headlines. Clicks go to the publisher
 * (Motorsport, MotorTrend, …) so people can subscribe there.
 * ClearPath does not sell these magazines and is not their partner.
 */
import RSSParser from 'rss-parser';
import type {
  MagazineCategory,
  MagazineRackPayload,
  MagazineStory,
} from '../lib/ywc/magazineTypes';

export type { MagazineCategory, MagazineRackPayload, MagazineStory };

export type MagazinePublication = {
  id: string;
  name: string;
  /** Publisher homepage — subscribe / browse on THEIR site. */
  homepage: string;
  feedUrl: string;
  category: MagazineCategory;
  /** Hosts allowed on article links (not image CDNs). */
  articleHosts: string[];
};

export const MAGAZINE_PUBLICATIONS: MagazinePublication[] = [
  {
    id: 'motorsport-f1',
    name: 'Motorsport',
    homepage: 'https://www.motorsport.com/',
    feedUrl: 'https://www.motorsport.com/rss/f1/news/',
    category: 'automotive',
    articleHosts: ['motorsport.com'],
  },
  {
    id: 'motorsport-motogp',
    name: 'Motorsport — MotoGP',
    homepage: 'https://www.motorsport.com/motogp/',
    feedUrl: 'https://www.motorsport.com/rss/motogp/news/',
    category: 'automotive',
    articleHosts: ['motorsport.com'],
  },
  {
    id: 'autosport',
    name: 'Autosport',
    homepage: 'https://www.autosport.com/',
    feedUrl: 'https://www.autosport.com/rss/feed/news',
    category: 'automotive',
    articleHosts: ['autosport.com'],
  },
  {
    id: 'motortrend',
    name: 'MotorTrend',
    homepage: 'https://www.motortrend.com/',
    feedUrl: 'https://www.motortrend.com/news/rss',
    category: 'automotive',
    articleHosts: ['motortrend.com'],
  },
  {
    id: 'caranddriver',
    name: 'Car and Driver',
    homepage: 'https://www.caranddriver.com/',
    feedUrl: 'https://www.caranddriver.com/rss/all.xml',
    category: 'automotive',
    articleHosts: ['caranddriver.com'],
  },
  {
    id: 'roadandtrack',
    name: 'Road & Track',
    homepage: 'https://www.roadandtrack.com/',
    feedUrl: 'https://www.roadandtrack.com/rss/all.xml/',
    category: 'automotive',
    articleHosts: ['roadandtrack.com'],
  },
  {
    id: 'popularmechanics',
    name: 'Popular Mechanics',
    homepage: 'https://www.popularmechanics.com/',
    feedUrl: 'https://www.popularmechanics.com/rss/all.xml/',
    category: 'tech',
    articleHosts: ['popularmechanics.com'],
  },
  {
    id: 'wired',
    name: 'WIRED',
    homepage: 'https://www.wired.com/',
    feedUrl: 'https://www.wired.com/feed/rss',
    category: 'tech',
    articleHosts: ['wired.com'],
  },
  {
    id: 'gq',
    name: 'GQ',
    homepage: 'https://www.gq.com/',
    feedUrl: 'https://www.gq.com/feed/rss',
    category: 'lifestyle',
    articleHosts: ['gq.com'],
  },
  {
    id: 'esquire',
    name: 'Esquire',
    homepage: 'https://www.esquire.com/',
    feedUrl: 'https://www.esquire.com/rss/all.xml/',
    category: 'lifestyle',
    articleHosts: ['esquire.com'],
  },
  {
    id: 'bbc-f1',
    name: 'BBC Sport — F1',
    homepage: 'https://www.bbc.com/sport/formula1',
    feedUrl: 'https://feeds.bbci.co.uk/sport/formula1/rss.xml',
    category: 'automotive',
    articleHosts: ['bbc.co.uk', 'bbc.com'],
  },
  {
    id: 'smithsonian',
    name: 'Smithsonian Magazine',
    homepage: 'https://www.smithsonianmag.com/',
    feedUrl: 'https://www.smithsonianmag.com/rss/latest_articles/',
    category: 'science',
    articleHosts: ['smithsonianmag.com'],
  },
  {
    id: 'popsci',
    name: 'Popular Science',
    homepage: 'https://www.popsci.com/',
    feedUrl: 'https://www.popsci.com/feed/',
    category: 'science',
    articleHosts: ['popsci.com'],
  },
];

const ITEMS_PER_FEED = 4;
const MAX_RACK_ITEMS = 28;
const CACHE_MS = 15 * 60 * 1000;
const FETCH_TIMEOUT_MS = 8000;

const parser = new RSSParser({
  timeout: FETCH_TIMEOUT_MS,
  headers: {
    'User-Agent': 'ClearPathTrader/1.0 (+https://clearpathtrader.com)',
    Accept: 'application/rss+xml, application/atom+xml, application/xml, text/xml',
  },
  customFields: {
    item: [
      ['media:content', 'mediaContent'],
      ['media:thumbnail', 'mediaThumbnail'],
    ],
  },
});

let cache: { at: number; payload: MagazineRackPayload } | null = null;

export function hostMatchesAllowlist(hostname: string, allowed: string[]): boolean {
  const host = hostname.replace(/^www\./i, '').toLowerCase();
  return allowed.some((raw) => {
    const allow = raw.replace(/^www\./i, '').toLowerCase();
    return host === allow || host.endsWith(`.${allow}`);
  });
}

export function isHttpsHttpUrl(raw: string): URL | null {
  try {
    const url = new URL(raw);
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return null;
    if (url.username || url.password) return null;
    if (!url.hostname || url.hostname === 'localhost' || url.hostname.endsWith('.localhost')) {
      return null;
    }
    return url;
  } catch {
    return null;
  }
}

/** Article must land on the publisher we listed — not a random RSS hijack. */
export function isPublisherArticleUrl(raw: string, articleHosts: string[]): boolean {
  const url = isHttpsHttpUrl(raw);
  if (!url) return false;
  if (url.protocol !== 'https:') return false;
  return hostMatchesAllowlist(url.hostname, articleHosts);
}

export function isSafeImageUrl(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const url = isHttpsHttpUrl(raw);
  if (!url || url.protocol !== 'https:') return null;
  return url.href;
}

/** Hearst / Motorsport feeds sometimes emit bare `&` which xml2js rejects. */
export function sanitizeRssXml(xml: string): string {
  return String(xml || '').replace(/&(?![#a-zA-Z0-9]+;)/g, '&amp;');
}

export function stripHtmlSnippet(raw: string | null | undefined, max = 220): string {
  const text = String(raw || '')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/\s+/g, ' ')
    .trim();
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1).trim()}…`;
}

function pickImage(item: Record<string, unknown>): string | null {
  const enclosure = item.enclosure as { url?: string } | undefined;
  const mediaContent = item.mediaContent as { $?: { url?: string }; url?: string } | undefined;
  const mediaThumb = item.mediaThumbnail as { $?: { url?: string }; url?: string } | undefined;
  const candidates = [
    enclosure?.url,
    mediaContent?.$?.url,
    mediaContent?.url,
    mediaThumb?.$?.url,
    mediaThumb?.url,
  ];
  const html = String(item['content:encoded'] || item.content || item.description || '');
  const img = html.match(/<img[^>]+src=["']([^"']+)["']/i);
  if (img?.[1]) candidates.push(img[1]);
  for (const c of candidates) {
    const safe = isSafeImageUrl(c);
    if (safe) return safe;
  }
  return null;
}

function storiesFromFeed(
  pub: MagazinePublication,
  items: Array<Record<string, unknown>>,
): MagazineStory[] {
  const out: MagazineStory[] = [];
  for (const item of items) {
    const title = stripHtmlSnippet(String(item.title || ''), 140);
    const articleUrl = String(item.link || '').trim();
    if (!title || !isPublisherArticleUrl(articleUrl, pub.articleHosts)) continue;
    const publishedRaw = item.isoDate || item.pubDate;
    const publishedAt = publishedRaw ? new Date(String(publishedRaw)).toISOString() : new Date().toISOString();
    out.push({
      id: `${pub.id}:${String(item.guid || articleUrl).slice(0, 80)}`,
      title,
      snippet: stripHtmlSnippet(
        String(item.contentSnippet || item.description || ''),
        220,
      ),
      image: pickImage(item),
      publishedAt: Number.isNaN(Date.parse(publishedAt)) ? new Date().toISOString() : publishedAt,
      source: pub.name,
      sourceId: pub.id,
      category: pub.category,
      homepage: pub.homepage,
      articleUrl,
    });
    if (out.length >= ITEMS_PER_FEED) break;
  }
  return out;
}

function interleave(groups: MagazineStory[][]): MagazineStory[] {
  const mixed: MagazineStory[] = [];
  const seen = new Set<string>();
  let i = 0;
  let progressed = true;
  while (progressed && mixed.length < MAX_RACK_ITEMS) {
    progressed = false;
    for (const group of groups) {
      const story = group[i];
      if (!story) continue;
      progressed = true;
      if (seen.has(story.articleUrl)) continue;
      seen.add(story.articleUrl);
      mixed.push(story);
      if (mixed.length >= MAX_RACK_ITEMS) break;
    }
    i += 1;
  }
  return mixed;
}

async function fetchFeedXml(feedUrl: string): Promise<string> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(feedUrl, {
      signal: ctrl.signal,
      headers: {
        'User-Agent': 'ClearPathTrader/1.0 (+https://clearpathtrader.com)',
        Accept: 'application/rss+xml, application/atom+xml, application/xml, text/xml',
      },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const xml = await res.text();
    if (/^\s*<!DOCTYPE html/i.test(xml) || /^\s*<html/i.test(xml)) {
      throw new Error('feed returned HTML, not RSS');
    }
    return xml;
  } finally {
    clearTimeout(timer);
  }
}

async function fetchOneFeed(pub: MagazinePublication): Promise<MagazineStory[]> {
  const xml = await fetchFeedXml(pub.feedUrl);
  const feed = await parser.parseString(sanitizeRssXml(xml));
  return storiesFromFeed(pub, (feed.items || []) as Array<Record<string, unknown>>);
}

export async function getMagazineRack(force = false): Promise<MagazineRackPayload> {
  if (!force && cache && Date.now() - cache.at < CACHE_MS) {
    return cache.payload;
  }

  const groups = await Promise.all(
    MAGAZINE_PUBLICATIONS.map(async (pub) => {
      try {
        return await fetchOneFeed(pub);
      } catch (err) {
        console.warn(`[magazine-rack] ${pub.id} failed:`, err instanceof Error ? err.message : err);
        return [] as MagazineStory[];
      }
    }),
  );

  const payload: MagazineRackPayload = {
    fetchedAt: new Date().toISOString(),
    publications: MAGAZINE_PUBLICATIONS.map((p) => ({
      id: p.id,
      name: p.name,
      homepage: p.homepage,
      category: p.category,
    })),
    items: interleave(groups),
  };
  cache = { at: Date.now(), payload };
  return payload;
}

/** Test helper — parse a local RSS string against one publication. */
export async function parseMagazineFeedXml(
  pub: MagazinePublication,
  xml: string,
): Promise<MagazineStory[]> {
  const feed = await parser.parseString(sanitizeRssXml(xml));
  return storiesFromFeed(pub, (feed.items || []) as Array<Record<string, unknown>>);
}
