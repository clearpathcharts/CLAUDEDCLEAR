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
 */
export function usePageAutoUpdate(
  onUpdate: () => void | Promise<void>,
  { intervalMs, immediate = true, enabled = true }: PageAutoUpdateOptions
) {
  const visible = useVisibilityPause()
  const [lastUpdatedAt, setLastUpdatedAt] = useState<number | null>(null)
  const inFlight = useRef(false)

  const runUpdate = useEffectEvent(async () => {
    if (inFlight.current) return
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

    // Resume / mount: only fire immediately when the tab is visible.
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
    }, intervalMs)

    return () => clearInterval(id)
  }, [intervalMs, immediate, enabled, visible, runUpdate])

  return {
    refresh: () => {
      void runUpdate()
    },
    lastUpdatedAt,
  }
}
