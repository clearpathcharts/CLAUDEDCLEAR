# Page Auto Updater — Reference

## Existing refresh surfaces (inventory + migration status)

| Surface | Path | Typical interval | Status |
|---------|------|------------------|--------|
| Market ticker quotes | `src/components/MarketTicker.tsx` | 30s | **Wired** → `usePageAutoUpdate` |
| Market diagnostics | `src/components/MarketDiagnostics.tsx` | 15s | **Wired** → `usePageAutoUpdate` (build errors: mount-only) |
| Breaking news ticker | `src/components/BreakingNewsTicker.tsx` | 60s | **Wired** → `usePageAutoUpdate` (ticker cadence; not editorial 6h) |
| Kill zones clock | `src/components/KillZones.tsx` | 1s | **Wired** → `usePageAutoUpdate` |
| Trading sessions | `src/components/TradingSessionsCollapse.tsx` | 1s | **Wired** → `usePageAutoUpdate` |
| Terminal session clock | `src/components/widgets/TerminalConfigWidget.tsx` | 2s | **Wired** → `usePageAutoUpdate` (session/UTC only) |
| Lightweight candles | `src/components/charts/LightweightCandles.tsx` | chart-specific | **Visibility guard** inside existing tick loop |
| Twelve Data health | `src/services/dataStreamService.ts` | 4s | Service-level; prefer subscribe — leave as service |
| App location poll | `src/App.tsx` | 2s | Routing helper — do not conflate |
| Capital flow map | `src/components/CapitalFlowMap.tsx` | 200ms sim | Simulated — keep local |
| ClearPath Sentinel | `src/components/ClearPathSentinel.tsx` | scan progress | Simulated one-shot — keep local |
| News panel | `src/components/NewsPanel.tsx` | asset + pipeline | Simulated — keep local |
| Market scanner | `src/components/MarketScanner.tsx` | 8s sim | Simulated — keep local |
| Yours RSS console | `src/components/yours/YoursPage.tsx` | 6h / 12h UI | Manual force fetch / sim — leave until real feed |
| Encyclopedia views | `src/components/encyclopedia/*` | various sims | Keep local until real data; migrate when touching |
| EurUsd sparkline widget | `TerminalConfigWidget` inner | 400ms sim | Simulated — keep local |
| Affiliate / Auth / Membership timers | various | UI timers | Not page data refresh — leave |

## Shared primitives

- `src/hooks/usePageAutoUpdate.ts` — canonical page poll hook
- `src/hooks/useVisibilityPause.ts` — `document.visibilityState`
- `src/services/dataStreamService.ts` — WebSocket + health polling + subscriber API

## Hook API

```ts
import { usePageAutoUpdate } from "../hooks/usePageAutoUpdate"

const { refresh, lastUpdatedAt } = usePageAutoUpdate(fetchQuotes, {
  intervalMs: 30_000,
  immediate: true, // default
  enabled: true,   // default
})
```

Behavior: immediate run when enabled+visible; interval ticks skip when tab hidden; no overlapping in-flight runs; clears interval on unmount.

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
