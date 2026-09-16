/**
 * Homepage → candidate RSS URLs. Used by the ingest script when the founder
 * pastes a domain list. We never scrape getrssfeed.com; we hit the publisher.
 */

function asHttpsUrl(raw: string): URL | null {
  try {
    const url = new URL(raw);
    if (url.protocol !== 'https:') return null;
    if (url.username || url.password) return null;
    if (!url.hostname || url.hostname === 'localhost') return null;
    return url;
  } catch {
    return null;
  }
}

export const COMMON_FEED_PATHS = [
  '/feed',
  '/rss',
  '/feed.xml',
  '/rss.xml',
  '/atom.xml',
  '/index.xml',
  '/news/rss',
  '/rss/all.xml',
  '/rss/all.xml/',
];

/** e.g. cdn-5.motorsport.com → motorsport.com */
export function registrableHost(hostname: string): string {
  const host = hostname.replace(/^www\./i, '').toLowerCase();
  const parts = host.split('.').filter(Boolean);
  if (parts.length < 2) return host;
  const last = parts[parts.length - 1];
  const second = parts[parts.length - 2];
  const twoLevel = new Set(['co', 'com', 'net', 'org', 'gov', 'ac']);
  if (parts.length >= 3 && twoLevel.has(second) && last.length === 2) {
    return parts.slice(-3).join('.');
  }
  return `${second}.${last}`;
}

export function feedLinksFromHtml(html: string, pageUrl: string): string[] {
  const base = asHttpsUrl(pageUrl);
  if (!base) return [];
  const found: string[] = [];
  const re = /<link\b[^>]*rel=["'][^"']*alternate[^"']*["'][^>]*>/gi;
  const tags = html.match(re) || [];
  for (const tag of tags) {
    const type = /type=["']([^"']+)["']/i.exec(tag)?.[1] || '';
    if (!/rss|atom|xml/i.test(type) && !/rss|atom|xml/i.test(tag)) continue;
    const href = /href=["']([^"']+)["']/i.exec(tag)?.[1];
    if (!href) continue;
    try {
      const abs = new URL(href, base).href;
      if (asHttpsUrl(abs)) found.push(abs);
    } catch {
      /* skip */
    }
  }
  return [...new Set(found)];
}

export function candidateFeedUrls(homepage: string, html?: string): string[] {
  const page = asHttpsUrl(homepage);
  if (!page) return [];
  const origin = `${page.protocol}//${page.host}`;
  const fromHtml = html ? feedLinksFromHtml(html, page.href) : [];
  const fromPaths = COMMON_FEED_PATHS.map((p) => `${origin}${p}`);
  return [...new Set([...fromHtml, ...fromPaths])];
}

export function homepageFromDomain(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed || trimmed.startsWith('#')) return null;
  const withProto = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  const url = asHttpsUrl(withProto);
  if (!url) return null;
  return `${url.protocol}//${url.host}/`;
}
