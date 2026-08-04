/**
 * Disposable / throwaway email domains from:
 * https://github.com/disposable/disposable-email-domains
 *
 * Vendored at data/disposable-email-domains.txt
 * Refresh: npm run update:disposable-domains
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SOURCE_URL =
  'https://raw.githubusercontent.com/disposable/disposable-email-domains/master/domains.txt';

/** Always merged on top of the vendored list (aliases / gaps). */
const EXTRA_DISPOSABLE = [
  'tempmail.com',
  'tempmailo.com',
  'throwaway.email',
  'discard.email',
  'grr.la',
  'guerrillamailblock.com',
  'guerrillamail.biz',
  'moakt.cc',
];

/** Small bootstrap if the vendored file is missing (dev/partial checkouts). */
const BOOTSTRAP_DISPOSABLE = [
  'mailinator.com',
  'guerrillamail.com',
  'guerrillamail.org',
  '10minutemail.com',
  'tempmail.com',
  'temp-mail.org',
  'trashmail.com',
  'yopmail.com',
  'sharklasers.com',
  'maildrop.cc',
  'getnada.com',
  'throwawaymail.com',
  'dispostable.com',
  'mintemail.com',
  'spamgourmet.com',
  'emailondeck.com',
  'moakt.com',
  'mailnesia.com',
  'fakeinbox.com',
  ...EXTRA_DISPOSABLE,
];

let cached: Set<string> | null = null;
let loadInfo: { path: string | null; count: number; source: 'file' | 'bootstrap' } | null = null;

function candidatePaths(): string[] {
  const cwd = process.cwd();
  const paths = [
    path.join(cwd, 'data', 'disposable-email-domains.txt'),
    // Bundled server may run with cwd=dist/
    path.join(cwd, '..', 'data', 'disposable-email-domains.txt'),
  ];
  try {
    // ESM (tsx) → src/server/… ; CJS bundle → dist/server.cjs
    const here = path.dirname(fileURLToPath(import.meta.url));
    paths.push(
      path.resolve(here, '..', '..', 'data', 'disposable-email-domains.txt'),
      path.resolve(here, '..', 'data', 'disposable-email-domains.txt')
    );
  } catch {
    // ignore
  }
  return paths;
}

function loadSet(): Set<string> {
  if (cached) return cached;

  for (const filePath of candidatePaths()) {
    try {
      if (!fs.existsSync(filePath)) continue;
      const text = fs.readFileSync(filePath, 'utf8');
      const set = new Set<string>();
      for (const line of text.split(/\r?\n/)) {
        const d = line.trim().toLowerCase();
        if (!d || d.startsWith('#')) continue;
        set.add(d);
      }
      if (set.size > 0) {
        for (const d of EXTRA_DISPOSABLE) set.add(d);
        cached = set;
        loadInfo = { path: filePath, count: set.size, source: 'file' };
        return cached;
      }
    } catch {
      // try next path
    }
  }

  cached = new Set(BOOTSTRAP_DISPOSABLE);
  loadInfo = { path: null, count: cached.size, source: 'bootstrap' };
  console.warn(
    `[identityRisk] disposable-email-domains.txt missing — using ${cached.size}-domain bootstrap. ` +
      `Run: npm run update:disposable-domains (source: ${SOURCE_URL})`
  );
  return cached;
}

/** For diagnostics / health. */
export function getDisposableDomainListStatus(): {
  loaded: boolean;
  count: number;
  source: 'file' | 'bootstrap' | 'unloaded';
  path: string | null;
  upstream: string;
} {
  if (!loadInfo) {
    loadSet();
  }
  return {
    loaded: Boolean(cached),
    count: loadInfo?.count || 0,
    source: loadInfo?.source || 'unloaded',
    path: loadInfo?.path || null,
    upstream: SOURCE_URL,
  };
}

/** Exact domain or any parent domain on the disposable list. */
export function isDisposableEmailDomain(domainRaw: string): boolean {
  const domain = (domainRaw || '').trim().toLowerCase();
  if (!domain) return false;
  const set = loadSet();
  let d = domain;
  while (d) {
    if (set.has(d)) return true;
    const i = d.indexOf('.');
    if (i < 0) break;
    d = d.slice(i + 1);
    // Never treat a bare public suffix / TLD as disposable.
    if (!d.includes('.')) break;
  }
  return false;
}

/** Test helper — clear cache so a new file can be loaded. */
export function _resetDisposableDomainCacheForTests(): void {
  cached = null;
  loadInfo = null;
}

export const DISPOSABLE_DOMAINS_SOURCE_URL = SOURCE_URL;
