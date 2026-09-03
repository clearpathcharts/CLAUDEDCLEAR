/**
 * When Cloud Run traffic actually moves, visitors must pick up the new shell
 * without clearing history. Compare /api/health revision to the last one this
 * browser saw; on change, drop Cache Storage + service workers and reload once.
 */

export const ORIGIN_REVISION_KEY = 'cp_origin_revision';
export const RELOADED_SESSION_KEY = 'cp_build_reloaded';
export const CACHE_BUST_PARAM = 'cpb';

export function shouldForceReload(args: {
  originRevision: string | null | undefined;
  seenRevision: string | null | undefined;
  alreadyReloadedFor: string | null | undefined;
}): boolean {
  const origin = String(args.originRevision || '').trim();
  if (!origin) return false;
  const seen = String(args.seenRevision || '').trim();
  if (!seen) return false;
  if (seen === origin) return false;
  const already = String(args.alreadyReloadedFor || '').trim();
  if (already === origin) return false;
  return true;
}

export function withCacheBustParam(href: string, revision: string): string {
  const url = new URL(href, 'https://clearpathtrader.com');
  url.searchParams.set(CACHE_BUST_PARAM, revision);
  return `${url.pathname}${url.search}${url.hash}`;
}

export async function nukeClientCaches(): Promise<void> {
  if (typeof navigator !== 'undefined' && navigator.serviceWorker) {
    try {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map((reg) => reg.unregister()));
    } catch {
      /* ignore */
    }
  }
  if (typeof caches !== 'undefined') {
    try {
      const keys = await caches.keys();
      await Promise.all(keys.map((key) => caches.delete(key)));
    } catch {
      /* ignore */
    }
  }
}

type HealthPayload = {
  cloudRun?: { revision?: string | null };
  build?: { gitSha?: string | null };
};

function originToken(payload: HealthPayload): string {
  return String(payload.cloudRun?.revision || payload.build?.gitSha || '').trim();
}

export async function runForceFreshBuild(opts?: {
  fetchImpl?: typeof fetch;
  reload?: (url: string) => void;
  storage?: Pick<Storage, 'getItem' | 'setItem'>;
  session?: Pick<Storage, 'getItem' | 'setItem'>;
  href?: string;
}): Promise<'skipped' | 'stored' | 'reloaded'> {
  const fetchImpl = opts?.fetchImpl || (typeof fetch === 'function' ? fetch : undefined);
  if (!fetchImpl) return 'skipped';

  let payload: HealthPayload;
  try {
    const res = await fetchImpl('/api/health', {
      cache: 'no-store',
      headers: { 'Cache-Control': 'no-store', Pragma: 'no-cache' },
    });
    if (!res.ok) return 'skipped';
    payload = (await res.json()) as HealthPayload;
  } catch {
    return 'skipped';
  }

  const origin = originToken(payload);
  if (!origin) return 'skipped';

  const storage =
    opts?.storage || (typeof localStorage !== 'undefined' ? localStorage : undefined);
  const session =
    opts?.session || (typeof sessionStorage !== 'undefined' ? sessionStorage : undefined);
  if (!storage || !session) return 'skipped';

  const seen = storage.getItem(ORIGIN_REVISION_KEY);
  storage.setItem(ORIGIN_REVISION_KEY, origin);
  if (
    !shouldForceReload({
      originRevision: origin,
      seenRevision: seen,
      alreadyReloadedFor: session.getItem(RELOADED_SESSION_KEY),
    })
  ) {
    return seen ? 'skipped' : 'stored';
  }

  session.setItem(RELOADED_SESSION_KEY, origin);
  await nukeClientCaches();
  const href = opts?.href || (typeof location !== 'undefined' ? location.href : '/');
  const next = withCacheBustParam(href, origin);
  if (opts?.reload) {
    opts.reload(next);
  } else if (typeof location !== 'undefined') {
    location.replace(next);
  }
  return 'reloaded';
}

export function scheduleForceFreshBuild(): void {
  if (typeof window === 'undefined') return;
  try {
    const cap = (window as Window & { Capacitor?: { isNativePlatform?: () => boolean } })
      .Capacitor;
    if (cap?.isNativePlatform?.()) return;
  } catch {
    /* web */
  }
  void runForceFreshBuild();
}
