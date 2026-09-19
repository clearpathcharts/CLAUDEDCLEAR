/**
 * Redirect-free text fetch for caller-supplied feed URLs.
 *
 * assertSafePublicUrl (server.ts) validates the URL the caller passed, but any
 * client that follows redirects re-opens the SSRF hole: a public URL can 302 to
 * 169.254.169.254 / RFC1918 targets after validation. rss-parser's parseURL
 * follows redirects, so feed routes must fetch with `redirect: 'error'` first
 * and hand the body to parseString instead.
 */
export async function fetchPublicTextNoRedirect(
  url: string,
  { timeoutMs = 8000, maxBytes = 4 * 1024 * 1024 }: { timeoutMs?: number; maxBytes?: number } = {}
): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      redirect: 'error',
      signal: controller.signal,
      headers: { 'User-Agent': 'ClearPathTrader/1.0 (+https://clearpathtrader.com)' },
    });
    if (!response.ok) {
      throw new Error(`Upstream returned ${response.status}`);
    }
    const contentLength = Number(response.headers.get('content-length') || 0);
    if (contentLength > maxBytes) {
      throw new Error('Upstream payload too large');
    }
    const text = await response.text();
    if (text.length > maxBytes) {
      throw new Error('Upstream payload too large');
    }
    return text;
  } finally {
    clearTimeout(timeout);
  }
}
