import { useCallback, useEffect, useState } from "react";
import { loadLiteracyStore, newId, saveLiteracyStore } from "../storage";
import type {
  CoachSession,
  IdeaPin,
  LiteracyStore,
  SentinelSnapshot,
  TrustRecord,
  VaultItem,
  WikiNode,
} from "../types";

export function useLiteracyStore() {
  const [store, setStore] = useState<LiteracyStore>(() => loadLiteracyStore());

  useEffect(() => {
    saveLiteracyStore(store);
  }, [store]);

  const update = useCallback((fn: (prev: LiteracyStore) => LiteracyStore) => {
    setStore((prev) => fn(prev));
  }, []);

  const addVaultItem = useCallback(
    (input: Omit<VaultItem, "id" | "createdAt" | "updatedAt">) => {
      const now = Date.now();
      const item: VaultItem = { ...input, id: newId("vault"), createdAt: now, updatedAt: now };
      update((s) => ({ ...s, vault: [item, ...s.vault].slice(0, 500) }));
      return item;
    },
    [update]
  );

  const upsertWiki = useCallback(
    (node: Omit<WikiNode, "updatedAt"> & { updatedAt?: number }) => {
      const next: WikiNode = { ...node, updatedAt: Date.now() };
      update((s) => {
        const idx = s.wiki.findIndex((w) => w.id === next.id);
        if (idx === -1) return { ...s, wiki: [next, ...s.wiki] };
        const wiki = [...s.wiki];
        wiki[idx] = next;
        return { ...s, wiki };
      });
      return next;
    },
    [update]
  );

  const setSentinelSnapshot = useCallback(
    (snap: SentinelSnapshot) => {
      update((s) => ({
        ...s,
        sentinel: { ...s.sentinel, [snap.sourceId]: snap },
      }));
    },
    [update]
  );

  const addPin = useCallback(
    (input: { title: string; note: string; relatedSymbol?: string; ttlHours?: number }) => {
      const now = Date.now();
      const hours = input.ttlHours ?? 72;
      const pin: IdeaPin = {
        id: newId("pin"),
        title: input.title,
        note: input.note,
        relatedSymbol: input.relatedSymbol,
        createdAt: now,
        expiresAt: now + hours * 3600_000,
        verified: false,
      };
      update((s) => ({ ...s, pins: [pin, ...s.pins] }));
      return pin;
    },
    [update]
  );

  const verifyPin = useCallback(
    (id: string) => {
      const now = Date.now();
      update((s) => ({
        ...s,
        pins: s.pins.map((p) =>
          p.id === id
            ? { ...p, verified: true, lastVerifiedAt: now, expiresAt: now + 72 * 3600_000 }
            : p
        ),
      }));
    },
    [update]
  );

  const startCoachSession = useCallback(
    (stimLoad: CoachSession["stimLoad"]) => {
      const session: CoachSession = {
        id: newId("coach"),
        startedAt: Date.now(),
        stimLoad,
        focusMinutes: 0,
        notes: "",
      };
      update((s) => ({ ...s, coachSessions: [session, ...s.coachSessions].slice(0, 100) }));
      return session;
    },
    [update]
  );

  const endCoachSession = useCallback(
    (id: string, focusMinutes: number, notes: string) => {
      update((s) => ({
        ...s,
        coachSessions: s.coachSessions.map((c) =>
          c.id === id ? { ...c, endedAt: Date.now(), focusMinutes, notes } : c
        ),
      }));
    },
    [update]
  );

  const addTrust = useCallback(
    (rec: Omit<TrustRecord, "id" | "createdAt">) => {
      const row: TrustRecord = { ...rec, id: newId("trust"), createdAt: Date.now() };
      update((s) => ({ ...s, trust: [row, ...s.trust].slice(0, 200) }));
      return row;
    },
    [update]
  );

  const markLessonPassed = useCallback(
    (lessonId: string) => {
      update((s) => {
        if (s.progress.passedLessonIds.includes(lessonId)) return s;
        return {
          ...s,
          progress: {
            ...s.progress,
            passedLessonIds: [...s.progress.passedLessonIds, lessonId],
          },
        };
      });
    },
    [update]
  );

  const setPreferredNeuro = useCallback(
    (profileId: string) => {
      update((s) => ({
        ...s,
        progress: { ...s.progress, preferredNeuroProfileId: profileId },
      }));
    },
    [update]
  );

  const setPantryFeeds = useCallback(
    (urls: string[]) => update((s) => ({ ...s, pantryFeedUrls: urls })),
    [update]
  );

  const addListenItem = useCallback(
    (item: { title: string; audioUrl?: string; notes: string; concepts: string[] }) => {
      const row = { ...item, id: newId("listen") };
      update((s) => ({ ...s, listenQueue: [row, ...s.listenQueue].slice(0, 100) }));
      return row;
    },
    [update]
  );

  return {
    store,
    addVaultItem,
    upsertWiki,
    setSentinelSnapshot,
    addPin,
    verifyPin,
    startCoachSession,
    endCoachSession,
    addTrust,
    markLessonPassed,
    setPreferredNeuro,
    setPantryFeeds,
    addListenItem,
  };
}
