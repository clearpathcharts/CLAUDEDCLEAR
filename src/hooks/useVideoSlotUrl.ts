/**
 * Reads the public slot map (`slot id -> playable URL`) once per page load and
 * shares it across every play icon. The endpoint is unauthenticated and returns
 * nothing but URLs, so there is no session or secret involved here.
 *
 * A failed fetch resolves to an empty map rather than rejecting: no assigned
 * video and an unreachable endpoint look the same to a visitor, and the player
 * falls back to the written explanation either way.
 */
import { useEffect, useState } from 'react';

export type VideoSlotUrlMap = Record<string, string>;

let inflight: Promise<VideoSlotUrlMap> | null = null;
let resolved: VideoSlotUrlMap | null = null;

export function fetchVideoSlotUrls(): Promise<VideoSlotUrlMap> {
  if (resolved) return Promise.resolve(resolved);
  if (inflight) return inflight;
  inflight = fetch('/api/videos/slots')
    .then((res) => (res.ok ? res.json() : { slots: {} }))
    .then((body: { slots?: unknown }) => {
      const out: VideoSlotUrlMap = {};
      const raw = body?.slots;
      if (raw && typeof raw === 'object') {
        for (const [slotId, url] of Object.entries(raw as Record<string, unknown>)) {
          if (typeof url === 'string' && /^https:\/\//i.test(url)) out[slotId] = url;
        }
      }
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

export type VideoSlotLookup = {
  /** Assigned URL, or null when the founder has not put a video here yet. */
  url: string | null;
  /** True until the map has been read once. */
  loading: boolean;
};

export function useVideoSlotUrl(slotId: string): VideoSlotLookup {
  const [map, setMap] = useState<VideoSlotUrlMap | null>(resolved);

  useEffect(() => {
    if (map) return;
    let active = true;
    void fetchVideoSlotUrls().then((next) => {
      if (active) setMap(next);
    });
    return () => {
      active = false;
    };
  }, [map]);

  return { url: map?.[slotId] ?? null, loading: map === null };
}

/** Test-only: forget the shared map between cases. */
export function __resetVideoSlotUrlCacheForTests(): void {
  resolved = null;
  inflight = null;
}
