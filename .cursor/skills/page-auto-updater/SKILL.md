---
name: page-auto-updater
description: Create or extend a shared auto-updater so all ClearPath Trader pages refresh live data on a schedule. Use when the user asks to add auto update / auto-refresh / polling / cron sync across pages, "auto updater for all pages", or to unify ad-hoc setInterval refresh logic.
---

# Page Auto Updater

Implement one shared page auto-update pattern and wire it into every page/panel that shows live or periodically refreshed data. Do not invent per-page one-off timers when a shared hook/service already fits.

## Scope

**In scope:** client-side refresh for SPA pages/panels (quotes, diagnostics, news/RSS, calendars, tickers, health).

**Out of scope:** GitHub PR auto-updater (`scripts/pr-auto-updater.sh`, `npm run pr:auto-update`). That keeps PR branches current with `main` — unrelated to page data refresh.

## Workflow

Copy and track:

```
Page Auto Updater:
- [ ] 1. Inventory pages/panels with live or staleable data
- [ ] 2. Choose shared mechanism (prefer hook over new service)
- [ ] 3. Implement or extend shared auto-update API
- [ ] 4. Wire every inventoried page to the shared API
- [ ] 5. Pause when tab hidden; clear intervals on unmount
- [ ] 6. Verify no duplicate timers / fake micro-ticks
```

### 1. Inventory

Search for ad-hoc refresh:

- `setInterval(` in `src/components/**`, `src/literacy/**`, `src/App.tsx`
- Existing shared pieces: `src/hooks/useVisibilityPause.ts`, `src/services/dataStreamService.ts`

List each page/panel, what it refreshes, and current interval (if any).

### 2. Shared mechanism

Prefer a React hook (e.g. `src/hooks/usePageAutoUpdate.ts`) over scattering `setInterval` in components.

Required behavior:

1. Run `onUpdate` immediately on mount (unless `immediate: false`)
2. Poll on a configurable interval
3. Skip ticks while `document.visibilityState !== "visible"` — reuse `useVisibilityPause`
4. Always `clearInterval` / remove listeners on unmount
5. Support optional manual `refresh()` for force-update UI (RSS/console panels)

Default interval guidance (override only with a reason):

| Data kind | Default interval |
|-----------|------------------|
| Market quotes / tickers | 30s |
| Diagnostics / API health | 4–15s |
| News / RSS / editorial feeds | 6h or 12h (or user-selectable) |
| Clocks / session timers | 1s |
| Simulated / demo-only UIs | keep local; do not hit live APIs |

### 3. Hook shape (canonical)

```ts
// src/hooks/usePageAutoUpdate.ts
usePageAutoUpdate(onUpdate, {
  intervalMs: 30_000,
  immediate?: boolean, // default true
  enabled?: boolean,   // default true
})
// returns { refresh, lastUpdatedAt }
```

- `onUpdate` may be async; do not stack overlapping runs (guard with an in-flight flag or AbortController).
- Prefer real server/API data. Do not reintroduce fake “micro-tick” price simulators.
- Vendor secrets stay server-side; pages call same-origin `/api/*` only.

### 4. Wire all pages

For each inventoried surface:

1. Replace local `setInterval` refresh with `usePageAutoUpdate`
2. Keep page-specific fetch logic in the page/service; pass it as `onUpdate`
3. Show last-updated time only when the UI already has that pattern (e.g. Yours RSS console)
4. Leave pure static/marketing pages alone (`ExternalAboutPage`, `PressKitPage`, legal) unless they already poll

### 5. Hard rules

- One timer ownership path per concern — no page + parent both polling the same endpoint
- Visibility pause is mandatory for intervals ≥ 2s
- Fail soft: log errors; keep last good data; mark stale if the page already supports that
- Respect anti-scraping / auth rules in `legal/anti-scraping-policy.md` for external feeds
- Do not commit secrets or `VITE_` vendor API keys for server proxies

### 6. Done when

- Shared hook (or documented shared service) exists
- Live pages use it instead of one-off intervals where practical
- Hidden-tab pause + unmount cleanup verified
- `npm run lint` passes for touched files

## Additional resources

- Interval and file map details: [reference.md](reference.md)
