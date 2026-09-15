/**
 * Browser-side inflight + TTL cache so desks, ticker, and chart don't
 * stampede /api/market/history and /api/quotes with identical keys.
 */
import { LruMap } from './lruMap';

type Hit<T> = { at: number; value: T };

export function createSharedFetcher<T>(opts: { ttlMs: number; max: number }) {
  const cache = new LruMap<string, Hit<T>>(opts.max);
  const inflight = new Map<string, Promise<T>>();

  return async function shared(key: string, run: () => Promise<T>): Promise<T> {
    const hit = cache.get(key);
    if (hit && Date.now() - hit.at < opts.ttlMs) return hit.value;
    const pending = inflight.get(key);
    if (pending) return pending;
    const p = run().then(
      (value) => {
        cache.set(key, { at: Date.now(), value });
        inflight.delete(key);
        return value;
      },
      (err) => {
        inflight.delete(key);
        throw err;
      },
    );
    inflight.set(key, p);
    return p;
  };
}

const sharedQuotes = createSharedFetcher<Record<string, unknown>>({ ttlMs: 4_000, max: 48 });

/** One inflight request per symbol set; 4s TTL matches server quote cache. */
export async function fetchQuotesMap(symbols: string[]): Promise<Record<string, unknown>> {
  const unique = [...new Set(symbols.map((s) => s.trim().toUpperCase()).filter(Boolean))].slice(0, 80);
  unique.sort();
  if (unique.length === 0) return {};
  const key = unique.join(',');
  return sharedQuotes(key, async () => {
    const res = await fetch(`/api/quotes?symbols=${encodeURIComponent(key)}`);
    if (!res.ok) throw new Error(`Quotes HTTP ${res.status}`);
    const body = await res.json();
    return (body?.quotes || {}) as Record<string, unknown>;
  });
}
