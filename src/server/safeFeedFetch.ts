import { safePublicFetch } from './safePublicFetch';

/**
 * Text fetch for caller-supplied feed URLs. Goes through safePublicFetch, which
 * refuses redirects and private addresses at connect time. rss-parser's parseURL
 * follows redirects, so feed routes fetch here and hand the body to parseString.
 */
export async function fetchPublicTextNoRedirect(
  url: string,
  { timeoutMs = 8000, maxBytes = 4 * 1024 * 1024 }: { timeoutMs?: number; maxBytes?: number } = {}
): Promise<string> {
  const res = await safePublicFetch(url, { timeoutMs, maxBytes });
  if (res.status < 200 || res.status >= 300) {
    throw new Error(`Upstream returned ${res.status}`);
  }
  return res.body.toString('utf8');
}
