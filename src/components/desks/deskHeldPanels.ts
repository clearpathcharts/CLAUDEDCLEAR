import { useCallback, useMemo, useState } from 'react';

export type HeldMeta = { title: string; blurb: string };

export function parseHeldIds(raw: string | null | undefined, allowed: ReadonlySet<string>): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    const seen = new Set<string>();
    const out: string[] = [];
    for (const item of parsed) {
      if (typeof item !== 'string' || !allowed.has(item) || seen.has(item)) continue;
      seen.add(item);
      out.push(item);
    }
    return out;
  } catch {
    return [];
  }
}

function writeHeld(storageKey: string, ids: string[]) {
  try {
    localStorage.setItem(storageKey, JSON.stringify(ids));
  } catch {
    /* ignore */
  }
}

function readHeld(storageKey: string, allowed: ReadonlySet<string>, defaultHeld: readonly string[]): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(storageKey);
    if (raw == null) {
      const seed = defaultHeld.filter((id) => allowed.has(id));
      if (seed.length) writeHeld(storageKey, seed);
      return seed;
    }
    return parseHeldIds(raw, allowed);
  } catch {
    return [];
  }
}

export function useDeskHeldPanels(
  storageKey: string,
  allowedIds: readonly string[],
  defaultHeld: readonly string[] = [],
) {
  const allowed = useMemo(() => new Set(allowedIds), [allowedIds]);
  const [held, setHeld] = useState<string[]>(() => readHeld(storageKey, allowed, defaultHeld));
  const [fileOpen, setFileOpen] = useState(() => readHeld(storageKey, allowed, defaultHeld).length > 0);
  const [justHeld, setJustHeld] = useState<string | null>(null);

  const hold = useCallback(
    (id: string) => {
      if (!allowed.has(id)) return;
      setHeld((prev) => {
        if (prev.includes(id)) return prev;
        const next = [...prev, id];
        writeHeld(storageKey, next);
        return next;
      });
      setJustHeld(id);
      setFileOpen(true);
    },
    [allowed, storageKey],
  );

  const restore = useCallback(
    (id: string) => {
      setHeld((prev) => {
        const next = prev.filter((x) => x !== id);
        writeHeld(storageKey, next);
        if (next.length === 0) setFileOpen(false);
        return next;
      });
      setJustHeld((cur) => (cur === id ? null : cur));
    },
    [storageKey],
  );

  const restoreAll = useCallback(() => {
    writeHeld(storageKey, []);
    setHeld([]);
    setJustHeld(null);
    setFileOpen(false);
  }, [storageKey]);

  const isHeld = useCallback((id: string) => held.includes(id), [held]);

  return { held, fileOpen, setFileOpen, justHeld, hold, restore, restoreAll, isHeld };
}
