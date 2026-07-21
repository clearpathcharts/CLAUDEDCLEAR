import { useCallback, useEffect, useRef, useState } from "react";
import { useVisibilityPause } from "./useVisibilityPause";

type Options = {
  intervalMs: number;
  immediate?: boolean;
  enabled?: boolean;
};

/**
 * Shared page auto-update hook: immediate fetch on mount, interval polling,
 * visibility pause for intervals ≥ 2s, resume on tab focus, in-flight guard.
 */
export function usePageAutoUpdate(
  onUpdate: () => void | Promise<void>,
  { intervalMs, immediate = true, enabled = true }: Options
) {
  const visible = useVisibilityPause();
  const [lastUpdatedAt, setLastUpdatedAt] = useState<number | null>(null);
  const inFlight = useRef(false);
  const onUpdateRef = useRef(onUpdate);
  const wasVisibleRef = useRef(visible);
  onUpdateRef.current = onUpdate;

  const run = useCallback(async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    try {
      await onUpdateRef.current();
      setLastUpdatedAt(Date.now());
    } catch (err) {
      console.error("[usePageAutoUpdate]", err);
    } finally {
      inFlight.current = false;
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;
    if (immediate) void run();

    const id = setInterval(() => {
      if (document.visibilityState !== "visible") return;
      void run();
    }, intervalMs);

    return () => clearInterval(id);
  }, [intervalMs, immediate, enabled, run]);

  // Resume one fetch when the tab becomes visible again.
  useEffect(() => {
    if (enabled && visible && !wasVisibleRef.current) {
      void run();
    }
    wasVisibleRef.current = visible;
  }, [enabled, visible, run]);

  return { refresh: run, lastUpdatedAt };
}
