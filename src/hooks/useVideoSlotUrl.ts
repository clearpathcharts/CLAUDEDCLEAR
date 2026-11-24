/**
 * Reads the public slot map (`slot id -> playable URL`) once per page load and
 * shares it across every play icon. The endpoint is unauthenticated and returns
 * nothing but URLs, so there is no session or secret involved here.
 *
 * A failed fetch resolves to an empty map rather than rejecting: no assigned
 * video and an unreachable endpoint look the same to a visitor, and the player
 * falls back to the written explanation either way.
 *
 * After the founder assigns a clip on the CEO page, call
 * {@link notifyVideoSlotAssignmentsChanged} so explain overlays pick up the new
 * URL without a full reload (the in-memory cache used to stick forever).
 */
import { useEffect, useState } from 'react';

export type VideoSlotUrlMap = Record<string, string>;

export const VIDEO_SLOT_URLS_CHANGED = 'clearpath-video-slot-urls-changed';

let inflight: Promise<VideoSlotUrlMap> | null = null;
let resolved: VideoSlotUrlMap | null = null;

function parseSlotResponse(body: { slots?: unknown }): VideoSlotUrlMap {
  const out: VideoSlotUrlMap = {};
  const raw = body?.slots;
  if (raw && typeof raw === 'object') {
    for (const [slotId, url] of Object.entries(raw as Record<string, unknown>)) {
      if (typeof url === 'string' && /^https:\/\//i.test(url)) out[slotId] = url;
    }
  }
  return out;
}

export function fetchVideoSlotUrls(force = false): Promise<VideoSlotUrlMap> {
  if (!force && resolved) return Promise.resolve(resolved);
  if (!force && inflight) return inflight;
  inflight = fetch(`/api/videos/slots?_=${Date.now()}`, { cache: 'no-store' })
    .then((res) => (res.ok ? res.json() : { slots: {} }))
    .then((body: { slots?: unknown }) => {
      const out = parseSlotResponse(body);
      resolved = out;
      return out;
    })
    .catch(() => {
      resolved = {};
      return resolved;
    })
    .finally(() => {
      inflight = null;
    });
  return inflight;
}

/** Founder saved or cleared a slot — refetch everywhere that uses {@link useVideoSlotUrl}. */
export function notifyVideoSlotAssignmentsChanged(): void {
  resolved = null;
  inflight = null;
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(VIDEO_SLOT_URLS_CHANGED));
  }
}

export type VideoSlotLookup = {
  /** Assigned URL, or null when the founder has not put a video here yet. */
  url: string | null;
  /** True until the map has been read once. */
  loading: boolean;
};

const EMPTY_MAP: VideoSlotUrlMap = {};

/**
 * The whole map at once. A section walkthrough resolves seven clips in one
 * render, which rules out calling {@link useVideoSlotUrl} in a loop.
 */
export function useVideoSlotUrls(): { urls: VideoSlotUrlMap; loading: boolean } {
  const [map, setMap] = useState<VideoSlotUrlMap | null>(resolved);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const onChange = () => setTick((n) => n + 1);
    window.addEventListener(VIDEO_SLOT_URLS_CHANGED, onChange);
    return () => window.removeEventListener(VIDEO_SLOT_URLS_CHANGED, onChange);
  }, []);

  useEffect(() => {
    let active = true;
    const force = tick > 0;
    void fetchVideoSlotUrls(force).then((next) => {
      if (active) setMap(next);
    });
    return () => {
      active = false;
    };
  }, [tick]);

  return { urls: map ?? EMPTY_MAP, loading: map === null };
}

export function useVideoSlotUrl(slotId: string): VideoSlotLookup {
  const { urls, loading } = useVideoSlotUrls();
  return { url: loading ? null : (urls[slotId] ?? null), loading };
}

/** Test-only: forget the shared map between cases. */
export function __resetVideoSlotUrlCacheForTests(): void {
  resolved = null;
  inflight = null;
}
