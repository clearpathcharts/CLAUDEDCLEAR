# AGENTS.md

## Cursor Cloud specific instructions

### What this project is
`clear-path-markets-science` (a.k.a. "ClearPath Trader") is a single-page **React 19 + Vite** financial/market-intelligence terminal served by a custom **Express** backend (`server.ts`). There is **one combined service**: in dev, `server.ts` runs the Express API and mounts Vite in middleware mode on the same port, so the frontend and backend are served together.

### Running the app (dev)
- Start with `npm run dev` (runs `tsx server.ts`). It serves at `http://localhost:3000` (override with `PORT`).
- The Express server also injects SSR SEO metadata and exposes JSON APIs (e.g. `GET /api/semantic/faqs`).
- The React entry is `src/main.tsx` / `index.html`. On first load the page briefly shows a `Loading New Architecture...` placeholder before React mounts — this is expected, not an error.
- **Black-screen prevention:** `BootErrorBoundary` + HTML boot watchdog (12s) must never leave users on a blank black loader. Firebase without `VITE_FIREBASE_*` must use safe mocks (`src/firebase.ts`); CI runs `npm run test:firebase-mock`. Do not “fix” missing Firebase by calling real Firestore APIs with a fake `db`.

### Build / lint
- Build: `npm run build` (Vite build for the client + esbuild bundle of `server.ts` → `dist/server.cjs`). `npm start` runs with `NODE_ENV=production` (`Dockerfile` also sets it).
- Lint: `npm run lint` is `tsc --noEmit` over the whole repo (client + `server.ts`).

### Environment variables
- Copy `.env.example` to `.env`. The app runs **without** any secrets set: the Postgres pool (`src/db/index.ts`) is created lazily and only connects when a DB-backed route is hit, and the market-data gateway just logs a warning when `TWELVEDATA_API_KEY` is missing (live data disabled, app still renders).
- **All vendor API keys are server-side only** (see `.env.example`). Never use `VITE_` for secrets. FRED/FMP proxies reject client-supplied keys. Diagnostics expose **boolean presence** only (`GET /api/secrets/status`, `/api/twelvedata/config`).
- Core optional secrets: `GEMINI_API_KEY`, `GROQ_API_KEY`, `TWELVEDATA_API_KEY`, `FRED_API_KEY`, `FMP_API_KEY`, `SESSION_SECRET`, `INTELLIGENCE_WEBHOOK_SECRET`, `CATALOG_ADMIN_SECRET`, and `SQL_*` Cloud SQL credentials.
- Production CORS is same-origin by default; set `CORS_ALLOWED_ORIGINS` only if a separate frontend origin must call the API.
- Firebase web client key: set `VITE_FIREBASE_API_KEY` (and related `VITE_FIREBASE_*`) in `.env` / **Cloud Run service env** — do not commit live keys into `firebase-applet-config.json`. Restrict the key by HTTP referrer in Google Cloud Console. The server injects `window.__CLEARPATH_FIREBASE_CONFIG__` at HTML serve time (`src/server/firebaseClientConfig.ts`), so production does **not** require rebuilding the Vite bundle just to add the key — set the vars on the running Cloud Run service and redeploy/restart. Missing keys must degrade to offline mocks that still render the SPA (`npm run test:firebase-mock` guards this).
- OAuth `/auth/:provider` stubs only allow relative SPA returnTo paths (open-redirect hardened).

### Startup log gotcha
- Startup runs "compliance"/"truth" audits ~10s after boot that print messages like `[TRUTH ENGINE COMPLIANCE ALERT] ... breach(es) found! Score: 67%`. These are **internal application scoring logic**, not server errors — the server is healthy.

### PR auto-updater
- Local: `npm run pr:auto-update` (merge `main` into open PR branches; conflicts are reported, not force-fixed).
- Squash-merge ready PRs: `npm run pr:auto-update:merge` (skips PRs labeled `no-automerge`).
- Skip a PR entirely: label it `no-auto-update`.
- Scheduled GitHub Action: `.github/workflows/pr-auto-updater.yml` (every 6h + manual dispatch). Report artifact: `pr-auto-updater-report`.

### App / APK auto-updater (consent-first)
- `GET /api/app-update` publishes latest web + Android versions from env (see `.env.example`).
- SPA shows `AppUpdateBanner`: web → Refresh; Android → Play Store (preferred) or APK mirror.
- **Never silent install.** APK URLs are omitted unless `APP_UPDATE_ALLOW_APK=true` **and** HTTPS allowlisted host **and** `APP_UPDATE_APK_SHA256` (64-hex) are set.
- Keep `VITE_APP_VERSION` / `VITE_ANDROID_VERSION_*` in sync with shipped builds (`android/app/build.gradle` versionCode).
- Self-test: `npm run test:app-update`.

### Host hardening (ops only)
- Optional server hardening uses [grapheneX](https://github.com/grapheneX/grapheneX) on the **VPS/Docker host**, not inside the Node app. See `docs/ops-hardening.md` and `scripts/ops/run-graphenex.sh` (localhost `:9090` + SSH tunnel). Not applicable to managed Cloud Run.
