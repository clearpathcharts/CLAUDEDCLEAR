# Venture env parity — local + Cloud Run

Same codebase, two environments. Confirm **presence** of the same keys before Sunday expand.
Never commit secret values.

## Same build path

```bash
npm run build   # Vite client + esbuild → dist/server.cjs
npm start       # NODE_ENV=production node dist/server.cjs
```

Cloud Run should run the **same** image/`dist/server.cjs` produced by that build (Dockerfile), not a divergent tree.

## Checklist (local `.env` ↔ Cloud Run service env)

| Variable | Local | Cloud Run | Notes |
|----------|-------|-----------|--------|
| `TWELVEDATA_API_KEY` | `.env` | Service env / Secret Manager | Venture key after flip. Also accepts `TWELVE_DATA_API_KEY`. If both exist and differ, the live site 401s until the stale duplicate is deleted. |
| `SESSION_SECRET` | `.env` | Service env | Required in production |
| `VITE_FIREBASE_*` / Firebase inject | `.env` | Service env | Injected at HTML serve time |
| `PORT` | optional (3000) | Cloud Run sets `PORT` | App listens on `$PORT` |
| `NODE_ENV` | `development` via `npm run dev` | `production` | Dockerfile sets production |
| `CORS_ALLOWED_ORIGINS` | usually empty | only if separate FE origin | Same-origin preferred |
| `SQL_*` | optional | Cloud SQL if used | Lazy connect |

Diagnostics (boolean presence only): `GET /api/secrets/status`, `GET /api/twelvedata/config`.
Live process identity: `GET /api/health` → `cloudRun.revision` (must change after a real deploy).
Keys vs code: `docs/cloud-run-two-paths.md` — do not run the Cloud Build trigger only to rotate an API key, and do not Edit & deploy from an old revision (that restores the old fingerprint).

## Dual smoke

```bash
# Local (dev server running)
npx tsx scripts/smoke-venture70.mjs

# Cloud / staging
CLEARPATH_API_BASE=https://clearpathtrader.com npx tsx scripts/smoke-venture70.mjs
```

Ship gate: deck-critical symbols PASS on **both** when the target is reachable and the key is set.

## Credit safety (Venture ~1597/min)

- Ticker uses `/api/quotes` batch (≤8–12 symbols), never polls all 70.
- Chart slots stay ≤3; DXY costs ~6 credits per cache miss — keep it out of “poll everything”.
- Gateway concurrency cap + rate-limit cooldown apply in **both** local and cloud.

## Prefer staging for cloud smoke

If available, smoke a staging Cloud Run service with the same image before promoting to the live homepage. If no staging, run cloud smoke off-peak (script is serial + 350ms delay).
