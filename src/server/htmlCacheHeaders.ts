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
