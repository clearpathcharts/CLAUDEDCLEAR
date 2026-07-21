import { useEffect, useRef, useState } from "react"
import { useVisibilityPause } from "./useVisibilityPause"

export type PageAutoUpdateOptions = {
  intervalMs: number
  /** Run once on mount / when enabled+visible becomes true. Default true. */
  immediate?: boolean
  /** When false, no polling and no immediate run. Default true. */
  enabled?: boolean
}

/**
 * Shared page auto-update: interval poll + visibility pause + unmount cleanup.
 * Prefer this over ad-hoc setInterval in SPA pages/panels.
 */
export function usePageAutoUpdate(
  onUpdate: () => void | Promise<void>,
  { intervalMs, immediate = true, enabled = true }: PageAutoUpdateOptions
) {
  const visible = useVisibilityPause()
  const [lastUpdatedAt, setLastUpdatedAt] = useState<number | null>(null)
  const inFlight = useRef(false)
  const onUpdateRef = useRef(onUpdate)
  onUpdateRef.current = onUpdate

  const run = async () => {
    if (inFlight.current) return
    inFlight.current = true
    try {
      await onUpdateRef.current()
      setLastUpdatedAt(Date.now())
    } finally {
      inFlight.current = false
    }
  }

  useEffect(() => {
    if (!enabled) return

    if (immediate && visible) {
      void run()
    }

    const id = setInterval(() => {
      if (document.visibilityState !== "visible") return
      void run()
    }, intervalMs)

    return () => clearInterval(id)
  }, [intervalMs, immediate, enabled, visible])

  return { refresh: run, lastUpdatedAt }
}
