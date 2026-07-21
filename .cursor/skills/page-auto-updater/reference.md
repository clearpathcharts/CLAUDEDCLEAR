# Page Auto Updater — Reference

## Shared API

- Hook: `src/hooks/usePageAutoUpdate.ts`
- Visibility: reuses `src/hooks/useVisibilityPause.ts`
- PR branch sync (unrelated): `npm run pr:auto-update` → `scripts/pr-auto-updater.sh`

```ts
usePageAutoUpdate(onUpdate, {
  intervalMs: 30_000,
  immediate?: boolean, // default true
  enabled?: boolean,   // default true
})
// returns { refresh, lastUpdatedAt }
```

## Wired surfaces

| Surface | Path | Interval | Notes |
|---------|------|----------|-------|
| Market ticker quotes | `src/components/MarketTicker.tsx` | 30s | Real `/api/quote`; no fake micro-ticks |
| Market diagnostics | `src/components/MarketDiagnostics.tsx` | 15s | `/api/status`; build errors once on mount |
| Breaking news ticker | `src/components/BreakingNewsTicker.tsx` | 60s | `/api/newsdata/latest` |
| Kill zones clock | `src/components/KillZones.tsx` | 1s | UTC clock |
| Trading sessions | `src/components/TradingSessionsCollapse.tsx` | 1s | UTC clock |
| Terminal session widget | `src/components/widgets/TerminalConfigWidget.tsx` | 2s | Session/UTC; sparkline demo ticks stay local |
| Market scanner | `src/components/MarketScanner.tsx` | 8s | Demo synthetic scores |
| Capital flow map | `src/components/CapitalFlowMap.tsx` | 200ms | Demo ingest; stream subscribe separate |
| News panel | `src/components/NewsPanel.tsx` | 4.5s / 18s | Demo asset + pipeline; `enabled` for pipeline |
| Watchlist | `src/components/encyclopedia/WatchlistView.tsx` | 4.5s | Demo tick |
| Order book simulator | `src/components/encyclopedia/OrderBookSimulator.tsx` | 4.5s | Demo MM fills |
| Encyclopedia cockpit | `src/components/encyclopedia/EncyclopediaLayout.tsx` | 4.5s | Demo sim prices |
| Civilization engine | `src/components/encyclopedia/CivilizationEngineView.tsx` | 10s | Weather cycle; `enabled: isPlayingWeather` |

## Intentionally not migrated (this pass)

| Surface | Path | Reason |
|---------|------|--------|
| Twelve Data health | `src/services/dataStreamService.ts` | Service-level poll + subscriber API |
| Lightweight candles | `src/components/charts/LightweightCandles.tsx` | Nested chart tick loop; avoid refetch loops |
| App location poll | `src/App.tsx` | Routing helper, not data refresh |
| ClearPath Sentinel | `src/components/ClearPathSentinel.tsx` | One-shot scan animation |
| EurUsd sparkline | `TerminalConfigWidget` inner | Sub-second demo micro-ticks |
| Auth / affiliate / membership timers | various | UI/recording countdowns, not page data |
| Economic memory / knowledge cascade | encyclopedia | One-shot documentary / cascade animations |
| Literacy elapsed | `src/literacy/panels.tsx` | Session elapsed clock |

## PR auto-updater (do not mix)

| Concern | Command / path |
|---------|----------------|
| Sync open PR branches with `main` | `npm run pr:auto-update` |
| Squash-merge ready PRs | `npm run pr:auto-update:merge` |
| Skip a PR | label `no-auto-update` |
| CI schedule | `.github/workflows/pr-auto-updater.yml` |

## Verification

```bash
npm run lint
```

Manually: open a live page, confirm first fetch + interval; background the tab and confirm polls pause; return and confirm resume; navigate away and confirm cleanup.
