import type { LiteracyStore, WikiNode } from "./types";
import { SEED_WIKI } from "./data/conceptSeed";

export const LITERACY_STORAGE_KEY = "clearpath_literacy_os_v1";

export function emptyLiteracyStore(): LiteracyStore {
  return {
    vault: [],
    wiki: SEED_WIKI.map((n) => ({ ...n })),
    sentinel: {},
    pins: [],
    coachSessions: [],
    trust: [],
    progress: { passedLessonIds: [] },
    pantryFeedUrls: [],
    listenQueue: [],
  };
}

export function loadLiteracyStore(): LiteracyStore {
  try {
    if (typeof localStorage === "undefined") return emptyLiteracyStore();
    const raw = localStorage.getItem(LITERACY_STORAGE_KEY);
    if (!raw) return emptyLiteracyStore();
    const parsed = JSON.parse(raw) as Partial<LiteracyStore>;
    const base = emptyLiteracyStore();
    return {
      ...base,
      ...parsed,
      vault: Array.isArray(parsed.vault) ? parsed.vault : base.vault,
      wiki: mergeWiki(base.wiki, parsed.wiki),
      sentinel: parsed.sentinel && typeof parsed.sentinel === "object" ? parsed.sentinel : {},
      pins: Array.isArray(parsed.pins) ? parsed.pins : [],
      coachSessions: Array.isArray(parsed.coachSessions) ? parsed.coachSessions : [],
      trust: Array.isArray(parsed.trust) ? parsed.trust : [],
      progress: {
        passedLessonIds: Array.isArray(parsed.progress?.passedLessonIds)
          ? parsed.progress!.passedLessonIds
          : [],
        preferredNeuroProfileId: parsed.progress?.preferredNeuroProfileId,
      },
      pantryFeedUrls: Array.isArray(parsed.pantryFeedUrls) ? parsed.pantryFeedUrls : [],
      listenQueue: Array.isArray(parsed.listenQueue) ? parsed.listenQueue : [],
    };
  } catch (e) {
    console.warn("[literacy] failed to load store", e);
    return emptyLiteracyStore();
  }
}

function mergeWiki(seed: WikiNode[], saved?: WikiNode[]): WikiNode[] {
  if (!Array.isArray(saved) || saved.length === 0) return seed;
  const byId = new Map<string, WikiNode>();
  for (const n of seed) byId.set(n.id, n);
  for (const n of saved) byId.set(n.id, n);
  return Array.from(byId.values());
}

export function saveLiteracyStore(store: LiteracyStore): void {
  try {
    if (typeof localStorage === "undefined") return;
    localStorage.setItem(LITERACY_STORAGE_KEY, JSON.stringify(store));
  } catch (e) {
    console.warn("[literacy] failed to save store", e);
  }
}

export function newId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}
