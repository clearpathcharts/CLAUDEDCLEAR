import { useEffect, useEffectEvent, useRef, useState } from "react"
import { useVisibilityPause } from "./useVisibilityPause"

export type PageAutoUpdateOptions = {
  intervalMs: number
  /** Run once on mount / when the effect restarts (default true). */
  immediate?: boolean
  /** Disable polling without unmounting the consumer (default true). */
  enabled?: boolean
}

/**
 * Shared page auto-update: poll `onUpdate` on an interval, skip ticks while the
 * tab is hidden, never stack overlapping async runs, and clear on unmount.
 *
 * IMPORTANT: do not put the Effect Event (`runUpdate`) in the effect dependency
 * array. If it is treated as a changing identity, every completed poll can
 * remount the interval and immediately re-fetch — a ~100–200ms storm that
 * 429s /api/quote + /api/newsdata (seen in Cloud Run logs).
 */
export function usePageAutoUpdate(
  onUpdate: () => void | Promise<void>,
  { intervalMs, immediate = true, enabled = true }: PageAutoUpdateOptions
) {
  const visible = useVisibilityPause()
  const [lastUpdatedAt, setLastUpdatedAt] = useState<number | null>(null)
  const inFlight = useRef(false)
  const backoffUntil = useRef(0)
  const wasHidden = useRef(false)

  const runUpdate = useEffectEvent(async () => {
    if (inFlight.current) return
    if (Date.now() < backoffUntil.current) return
    inFlight.current = true
    try {
      await onUpdate()
      setLastUpdatedAt(Date.now())
    } finally {
      inFlight.current = false
    }
  })

  useEffect(() => {
    if (!enabled) return

    const tabVisible =
      typeof document === "undefined" || document.visibilityState === "visible"
    if (immediate && tabVisible) {
      void runUpdate()
    }

    const id = setInterval(() => {
      if (typeof document !== "undefined" && document.visibilityState !== "visible") {
        return
      }
      void runUpdate()
    }, Math.max(1000, intervalMs))

    return () => clearInterval(id)
    // `runUpdate` is an Effect Event — intentionally omitted from deps.
  }, [intervalMs, immediate, enabled])

  // Catch-up only when returning from a hidden tab (not on every mount).
  useEffect(() => {
    if (!enabled) return
    if (!visible) {
      wasHidden.current = true
      return
    }
    if (wasHidden.current) {
      wasHidden.current = false
      void runUpdate()
    }
  }, [enabled, visible])

  return {
    refresh: () => {
      void runUpdate()
    },
    /** Call from fetch handlers when the server returns 429. */
    noteRateLimited: (retryAfterMs = 60_000) => {
      backoffUntil.current = Date.now() + retryAfterMs
    },
    lastUpdatedAt,
  }
}
