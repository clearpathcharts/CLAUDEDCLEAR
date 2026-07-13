import { useCallback, useEffect, useRef, useState } from 'react';
import type { YwcDigestApiItem } from '../lib/ywc/feedMappers';

export interface YwcDigestState {
  items: YwcDigestApiItem[];
  refreshedAt: number | null;
  loading: boolean;
  error: string | null;
  refresh: (force?: boolean) => Promise<YwcDigestApiItem[]>;
  getByCategory: (category: import('../data/ywcFeedSources').YwcFeedCategory) => YwcDigestApiItem[];
}

const shared: {
  items: YwcDigestApiItem[];
  refreshedAt: number | null;
  inflight: Promise<YwcDigestApiItem[]> | null;
} = {
  items: [],
  refreshedAt: null,
  inflight: null,
};

async function fetchDigest(force = false): Promise<YwcDigestApiItem[]> {
  if (!force && shared.inflight) return shared.inflight;

  shared.inflight = (async () => {
    const url = force ? '/api/ywc/digest?refresh=1' : '/api/ywc/digest';
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Digest fetch failed (${response.status})`);
    const payload = await response.json();
    const nextItems: YwcDigestApiItem[] = payload.items || [];
    shared.items = nextItems;
    shared.refreshedAt = payload.refreshedAt ?? Date.now();
    return nextItems;
  })();

  try {
    return await shared.inflight;
  } finally {
    shared.inflight = null;
  }
}

export function useYwcDigest(pollHours: 6 | 12 = 6): YwcDigestState {
  const [items, setItems] = useState<YwcDigestApiItem[]>(shared.items);
  const [refreshedAt, setRefreshedAt] = useState<number | null>(shared.refreshedAt);
  const [loading, setLoading] = useState(shared.items.length === 0);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  const refresh = useCallback(async (force = false) => {
    setLoading(true);
    setError(null);
    try {
      const nextItems = await fetchDigest(force);
      if (mountedRef.current) {
        setItems(nextItems);
        setRefreshedAt(shared.refreshedAt);
      }
      return nextItems;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load live feeds';
      if (mountedRef.current) setError(message);
      return shared.items;
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    if (!shared.items.length) {
      void refresh();
    }
    const intervalMs = pollHours * 60 * 60 * 1000;
    const timer = window.setInterval(() => void refresh(), intervalMs);
    return () => {
      mountedRef.current = false;
      window.clearInterval(timer);
    };
  }, [pollHours, refresh]);

  const getByCategory = useCallback(
    (category: import('../data/ywcFeedSources').YwcFeedCategory) =>
      items.filter((item) => item.category === category),
    [items]
  );

  return { items, refreshedAt, loading, error, refresh, getByCategory };
}
