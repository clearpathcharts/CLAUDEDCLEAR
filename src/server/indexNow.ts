/**
 * IndexNow — instant URL notification for Bing, Yandex, Seznam, Naver, etc.
 * Google does NOT consume IndexNow; keep Search Console / sitemaps for Google.
 *
 * Spec: https://www.indexnow.org/documentation.html
 */
import crypto from 'node:crypto';

export const INDEXNOW_HOST = 'clearpathtrader.com';
export const INDEXNOW_SITE = `https://${INDEXNOW_HOST}`;

/** Participating endpoints (one notify fans out via the protocol hub + direct Yandex). */
const INDEXNOW_ENDPOINTS = [
  'https://api.indexnow.org/indexnow',
  'https://yandex.com/indexnow',
] as const;

export type IndexNowResult = {
  ok: boolean;
  submitted: number;
  keyLocation: string;
  results: { endpoint: string; status: number; body: string }[];
  skipped?: string;
};

/**
 * Prefer INDEXNOW_KEY from env; otherwise derive a stable non-secret-looking
 * key from SESSION_SECRET / CATALOG_ADMIN_SECRET so deploys stay consistent.
 * Final fallback: public site key (IndexNow keys are meant to be public files).
 */
export const DEFAULT_PUBLIC_INDEXNOW_KEY = 'clearpath-trader-indexnow-01';

export function resolveIndexNowKey(): string | null {
  const fromEnv = (process.env.INDEXNOW_KEY || '').trim();
  // Bing/Yandex reject underscore in practice — allow only a-z A-Z 0-9 and hyphen.
  if (fromEnv && /^[a-zA-Z0-9-]{8,128}$/.test(fromEnv)) return fromEnv;

  const seed =
    process.env.SESSION_SECRET?.trim() ||
    process.env.CATALOG_ADMIN_SECRET?.trim() ||
    '';
  if (seed) {
    // hex digest is always IndexNow-safe (no underscore)
    const digest = crypto.createHash('sha256').update(`indexnow:${seed}`).digest('hex');
    return digest.slice(0, 32);
  }

  return DEFAULT_PUBLIC_INDEXNOW_KEY;
}

export function indexNowKeyLocation(key: string): string {
  return `${INDEXNOW_SITE}/${key}.txt`;
}

export function normalizeIndexNowUrls(urls: string[]): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const raw of urls) {
    if (typeof raw !== 'string') continue;
    let u: URL;
    try {
      u = new URL(raw.trim());
    } catch {
      // Allow path-only inputs
      try {
        u = new URL(raw.trim().startsWith('/') ? raw.trim() : `/${raw.trim()}`, INDEXNOW_SITE);
      } catch {
        continue;
      }
    }
    if (u.protocol !== 'https:' && u.protocol !== 'http:') continue;
    if (u.hostname.replace(/^www\./, '') !== INDEXNOW_HOST) continue;
    u.hash = '';
    const href = u.toString().replace(/\/$/, u.pathname === '/' ? '/' : '');
    if (seen.has(href)) continue;
    seen.add(href);
    out.push(href);
    if (out.length >= 10000) break;
  }
  return out;
}

export async function submitIndexNow(urls: string[]): Promise<IndexNowResult> {
  const key = resolveIndexNowKey();
  if (!key) {
    return {
      ok: false,
      submitted: 0,
      keyLocation: '',
      results: [],
      skipped: 'INDEXNOW_KEY (or SESSION_SECRET / CATALOG_ADMIN_SECRET) not configured',
    };
  }

  const urlList = normalizeIndexNowUrls(urls);
  if (urlList.length === 0) {
    return {
      ok: false,
      submitted: 0,
      keyLocation: indexNowKeyLocation(key),
      results: [],
      skipped: 'No valid clearpathtrader.com URLs to submit',
    };
  }

  const keyLocation = indexNowKeyLocation(key);
  const payload = {
    host: INDEXNOW_HOST,
    key,
    keyLocation,
    urlList,
  };

  const results: IndexNowResult['results'] = [];
  for (const endpoint of INDEXNOW_ENDPOINTS) {
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
        body: JSON.stringify(payload),
      });
      const body = (await res.text()).slice(0, 500);
      results.push({ endpoint, status: res.status, body });
    } catch (err: any) {
      results.push({
        endpoint,
        status: 0,
        body: err?.message || 'fetch failed',
      });
    }
  }

  const ok = results.some((r) => r.status === 200 || r.status === 202);
  return { ok, submitted: urlList.length, keyLocation, results };
}
