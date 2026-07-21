import { useEffect, useRef, useState } from "react"
import { useVisibilityPause } from "./useVisibilityPause"

export type PageAutoUpdateOptions = {
  /** Poll period in milliseconds. */
  intervalMs: number
  /** Run `onUpdate` once when the effect arms. Default true. */
  immediate?: boolean
  /** When false, no interval and no immediate run. Default true. */
  enabled?: boolean
}

/**
 * Shared page/panel auto-refresh: immediate run, interval poll, visibility pause,
 * in-flight guard, and unmount cleanup. Prefer this over ad-hoc `setInterval` in pages.
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

    // Refresh when the effect arms and the tab is visible (incl. return-to-tab).
    if (immediate && visible) {
      void run()
    }

    const id = setInterval(() => {
      if (document.visibilityState !== "visible") return
      void run()
    }, intervalMs)

    return () => clearInterval(id)
    // `visible` in deps: pause ownership resets on hide/show and re-runs immediate on return.
  }, [intervalMs, immediate, enabled, visible])

  return { refresh: run, lastUpdatedAt }
}
