/**
 * HTML / service-worker responses must never be pinned by browsers or Google Frontend.
 * Hashed JS/CSS under /assets/ can stay immutable; the shell that names them cannot.
 */

export const HTML_NO_STORE_HEADERS: Readonly<Record<string, string>> = {
  'Cache-Control': 'private, no-cache, no-store, must-revalidate, max-age=0',
  Pragma: 'no-cache',
  Expires: '0',
  'CDN-Cache-Control': 'no-store',
  'Cloudflare-CDN-Cache-Control': 'no-store',
  'Surrogate-Control': 'no-store',
};

export type HeaderWriter = {
  setHeader: (name: string, value: string) => unknown;
  removeHeader?: (name: string) => unknown;
};

export function applyHtmlNoStore(res: HeaderWriter): void {
  for (const [name, value] of Object.entries(HTML_NO_STORE_HEADERS)) {
    res.setHeader(name, value);
  }
  res.removeHeader?.('ETag');
}

type HtmlSender = HeaderWriter & {
  status: (code: number) => unknown;
  write: (chunk: string) => unknown;
  end: () => unknown;
};

/** write/end so Express cannot attach an ETag (Google Frontend 304s the old shell). */
export function sendUncachedHtml(res: HtmlSender, html: string, status = 200): void {
  applyHtmlNoStore(res);
  res.status(status);
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.removeHeader?.('ETag');
  res.write(html);
  res.end();
}

export function readLiveBuildIdentity(): {
  service: string | null;
  revision: string | null;
  gitSha: string | null;
} {
  const service = (process.env.K_SERVICE || '').trim() || null;
  const revision = (process.env.K_REVISION || '').trim() || null;
  const gitSha =
    (process.env.CLEARPATH_GIT_SHA || process.env.COMMIT_SHA || '').trim() || null;
  return { service, revision, gitSha };
}

/** View-source stamp + window.__CLEARPATH_BUILD__ so a screenshot proves the origin. */
export function injectBuildStamp(html: string): string {
  const identity = readLiveBuildIdentity();
  const json = JSON.stringify(identity).replace(/</g, '\\u003c');
  const snippet = `<script>window.__CLEARPATH_BUILD__=${json};</script><!-- clearpath-build ${identity.service || 'local'} ${identity.revision || 'dev'} -->`;
  if (html.includes('</head>')) {
    return html.replace('</head>', `${snippet}</head>`);
  }
  if (html.includes('<head>')) {
    return html.replace('<head>', `<head>${snippet}`);
  }
  return `${snippet}${html}`;
}

/** JSON inside <script> must not contain a literal `<` (`</script>` breakout). */
export function jsonForInlineScript(value: unknown): string {
  return JSON.stringify(value, null, 2).replace(/</g, '\\u003c');
}

const FIRST_PARTY_INLINE_SCRIPT = [
  /window\.__CLEARPATH_BUILD__/,
  /window\.__CLEARPATH_FIREBASE_CONFIG__/,
  /window\.__CLEARPATH_POSITION_SIZE__/,
  /cp_a11y_high_contrast/,
  /\[Purge\] Unregistered SW/,
  /window\.__CP_BOOT_OK/,
];

/**
 * Helmet prod CSP is nonce-only. Stamp first-party boot/config inline scripts
 * only — never bless unknown <script> tags that SEO/path interpolation might inject.
 */
export function applyCspNonceToScripts(html: string, nonce: string): string {
  const safe = nonce.replace(/[^A-Za-z0-9+/=_-]/g, '');
  if (!safe) return html;
  let out = html.replace(
    /<script(\s[^>]*)?>([\s\S]*?)<\/script>/gi,
    (full, rawAttrs: string | undefined, body: string) => {
      const attrs = rawAttrs || '';
      if (/\bnonce=/i.test(attrs)) return full;
      if (/\bsrc\s*=/i.test(attrs)) return full;
      if (!FIRST_PARTY_INLINE_SCRIPT.some((re) => re.test(body))) return full;
      const trimmed = attrs.trim();
      return `<script nonce="${safe}"${trimmed ? ` ${trimmed}` : ''}>${body}</script>`;
    },
  );
  out = out.replace(/<meta[^>]*http-equiv=["']Content-Security-Policy["'][^>]*>/i, '');
  return out;
}
