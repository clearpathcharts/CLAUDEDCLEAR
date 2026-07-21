# Page Auto Updater — Reference

## Existing refresh surfaces (starting inventory)

Update this list when wiring the shared hook.

| Surface | Path | Typical interval | Notes |
|---------|------|------------------|-------|
| Market ticker quotes | `src/components/MarketTicker.tsx` | 30s | Real quotes only; no fake micro-ticks |
| Market diagnostics | `src/components/MarketDiagnostics.tsx` | 15s | `/api` diagnostics + build errors |
| Twelve Data health | `src/services/dataStreamService.ts` | 4s | Service-level poll; prefer subscribe over duplicate page timers |
| Lightweight candles | `src/components/charts/LightweightCandles.tsx` | chart-specific | Avoid refetch loops on error state |
| Breaking news ticker | `src/components/BreakingNewsTicker.tsx` | local interval | |
| News panel | `src/components/NewsPanel.tsx` | asset + pipeline timers | |
| Capital flow map | `src/components/CapitalFlowMap.tsx` | local interval | |
| ClearPath Sentinel | `src/components/ClearPathSentinel.tsx` | local interval | |
| Kill zones clock | `src/components/KillZones.tsx` | 1s | Clock-style; visibility pause optional but still clear on unmount |
| Trading sessions | `src/components/TradingSessionsCollapse.tsx` | 1s | |
| Yours RSS simulator | `src/components/yours/YoursPage.tsx` | 6h / 12h UI | Currently simulated cron; real fetch should use long interval + force refresh |
| App location poll | `src/App.tsx` | 2s | Routing helper — do not conflate with data refresh |
| Encyclopedia views | `src/components/encyclopedia/*` | various | Several `setInterval` UIs; migrate when touching those files |
| Terminal config widget | `src/components/widgets/TerminalConfigWidget.tsx` | 2s | Emits `market-telemetry-refetched` |

## Shared primitives already in repo

- `src/hooks/useVisibilityPause.ts` — returns `visible` from `document.visibilityState`
- `src/services/dataStreamService.ts` — WebSocket + health polling + subscriber API

## Suggested `usePageAutoUpdate` implementation sketch

```ts
import { useEffect, useRef, useState } from "react"
import { useVisibilityPause } from "./useVisibilityPause"

type Options = {
  intervalMs: number
  immediate?: boolean
  enabled?: boolean
}

export function usePageAutoUpdate(
  onUpdate: () => void | Promise<void>,
  { intervalMs, immediate = true, enabled = true }: Options
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
    if (immediate) void run()
    const id = setInterval(() => {
      if (document.visibilityState !== "visible") return
      void run()
    }, intervalMs)
    return () => clearInterval(id)
  }, [intervalMs, immediate, enabled, visible])

  return { refresh: run, lastUpdatedAt }
}
```

Adjust deps carefully: avoid resetting the interval every render; keep `onUpdate` in a ref as shown.

## Migration pattern

**Before:**

```tsx
useEffect(() => {
  fetchQuotes()
  const id = setInterval(fetchQuotes, 30000)
  return () => clearInterval(id)
}, [])
```

**After:**

```tsx
const { refresh, lastUpdatedAt } = usePageAutoUpdate(fetchQuotes, {
  intervalMs: 30_000,
})
```

## PR auto-updater (do not mix)

| Concern | Command / path |
|---------|----------------|
| Sync open PR branches with `main` | `npm run pr:auto-update` → `scripts/pr-auto-updater.sh` |
| Squash-merge ready PRs | `npm run pr:auto-update:merge` |
| Skip a PR | label `no-auto-update` |
| CI schedule | `.github/workflows/pr-auto-updater.yml` |

Never rename or overload those scripts for SPA page refresh.

## Verification

```bash
npm run lint
```

Manually: open a live page, confirm first fetch + interval fetch; background the tab and confirm polls pause; return and confirm resume; navigate away and confirm no lingering intervals in React Strict Mode double-mount.
