# Page Auto Updater — Reference

## Shared hook

- `src/hooks/usePageAutoUpdate.ts` — poll + visibility pause + in-flight guard + `refresh` / `lastUpdatedAt`
- Reuses `src/hooks/useVisibilityPause.ts`

## Existing refresh surfaces

| Surface | Path | Interval | Status |
|---------|------|----------|--------|
| Market ticker quotes | `src/components/MarketTicker.tsx` | 30s | **wired** `usePageAutoUpdate` |
| Market diagnostics | `src/components/MarketDiagnostics.tsx` | 15s | **wired** (build-errors fetch once on mount) |
| Breaking news ticker | `src/components/BreakingNewsTicker.tsx` | 60s | **wired** |
| Kill zones clock | `src/components/KillZones.tsx` | 1s | **wired** |
| Trading sessions | `src/components/TradingSessionsCollapse.tsx` | 1s | **wired** |
| Terminal session clock | `src/components/widgets/TerminalConfigWidget.tsx` | 2s | **wired** (session/UTC only) |
| Twelve Data health | `src/services/dataStreamService.ts` | 4s | Service-level — leave; pages subscribe |
| Lightweight candles | `src/components/charts/LightweightCandles.tsx` | chart-specific | Already uses `useVisibilityPause`; chart tick stays local |
| Capital flow map | `src/components/CapitalFlowMap.tsx` | 200ms sim | Demo simulator — keep local |
| Market scanner | `src/components/MarketScanner.tsx` | 8s sim | Demo simulator — keep local |
| News panel | `src/components/NewsPanel.tsx` | asset + pipeline | Simulated pipeline — keep local |
| ClearPath Sentinel | `src/components/ClearPathSentinel.tsx` | scan progress | One-shot scan UX — keep local |
| Encyclopedia watchlist | `src/components/encyclopedia/WatchlistView.tsx` | 4.5s sim | Demo tick — migrate when live quotes land |
| App location poll | `src/App.tsx` | 2s | Routing helper — do not conflate |
| EurUsd sparkline widget | `TerminalConfigWidget` inner | 400ms sim | Demo sparkline — keep local |
| Yours RSS simulator | `src/components/yours/YoursPage.tsx` | 6h / 12h UI | Wire when real fetch exists |

## Shared primitives already in repo

- `src/hooks/useVisibilityPause.ts` — returns `visible` from `document.visibilityState`
- `src/services/dataStreamService.ts` — WebSocket + health polling + subscriber API
- `src/hooks/usePageAutoUpdate.ts` — canonical page poll hook

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

## River media script (different concern)

`npm run page:auto-update` → `scripts/pageAutoUpdater.ts` syncs River hero videos / manifest. Unrelated to SPA poll intervals.

## Verification

```bash
npm run lint
```

Manually: open a live page, confirm first fetch + interval fetch; background the tab and confirm polls pause; return and confirm resume; navigate away and confirm no lingering intervals in React Strict Mode double-mount.
