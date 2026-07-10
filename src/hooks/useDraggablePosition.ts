import { useCallback, useEffect, useState } from "react";

export type PanelPosition = { x: number; y: number };

export function useDraggablePosition(
  storageKey: string,
  defaultPosition: PanelPosition
): [PanelPosition, (next: PanelPosition) => void] {
  const [position, setPosition] = useState<PanelPosition>(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (typeof parsed?.x === "number" && typeof parsed?.y === "number") {
          return parsed;
        }
      }
    } catch {
      /* ignore */
    }
    return defaultPosition;
  });

  const savePosition = useCallback(
    (next: PanelPosition) => {
      setPosition(next);
      try {
        localStorage.setItem(storageKey, JSON.stringify(next));
      } catch {
        /* ignore */
      }
    },
    [storageKey]
  );

  return [position, savePosition];
}

export function usePersistedLayout<T>(
  storageKey: string,
  defaultValue: T | (() => T)
): [T, (next: T | ((prev: T) => T)) => void] {
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) return JSON.parse(raw) as T;
    } catch {
      /* ignore */
    }
    return typeof defaultValue === "function" ? (defaultValue as () => T)() : defaultValue;
  });

  const save = useCallback(
    (next: T | ((prev: T) => T)) => {
      setValue((prev) => {
        const resolved = typeof next === "function" ? (next as (p: T) => T)(prev) : next;
        try {
          localStorage.setItem(storageKey, JSON.stringify(resolved));
        } catch {
          /* ignore */
        }
        return resolved;
      });
    },
    [storageKey]
  );

  return [value, save];
}
