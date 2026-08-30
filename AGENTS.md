# AGENTS.md

## Cursor Cloud specific instructions

### What this project is
`clear-path-markets-science` (a.k.a. "ClearPath Trader") is a single-page **React 19 + Vite** financial/market-intelligence terminal served by a custom **Express** backend (`server.ts`). There is **one combined service**: in dev, `server.ts` runs the Express API and mounts Vite in middleware mode on the same port, so the frontend and backend are served together.

### One live founder screen / one deploy path
- **Website:** Cloud Run service `clear-path-markets-science` in **europe-west1** (Belgium). Console: `https://console.cloud.google.com/run/detail/europe-west1/clear-path-markets-science?project=gen-lang-client-0282858983`
- **Ava voice:** `clearpath-voice-os` in **us-central1**. Never hit **Edit & deploy** on voice-os unless you mean Ava.
- Keep Cloud Run traffic on **LATEST**. A named-revision pin is how GitHub “deploys” while the public site stays old.
- Trader work belongs in `clearpath-COMPLETE-tonight`. Do not fetch dead Cursor workspace branches from ALL EYES OS.
- After every `main` push, confirm the live Cloud Run revision SHA (or live CEO JS) before telling the founder it is on the site.
- CEO Dashboard is ops-only: Daily Ops + budget + members/alerts. Chart patterns stay on MARKETS/CHARTS.

### Two Cloud Run buttons (do not invent a third trigger)
The founder already has **one** Cloud Build trigger for **new website code**. Do **not** create another trigger for API keys. The two buttons do different jobs:

| Want | Use | Do not |
|------|-----|--------|
| New visuals / merged `main` on the public site | Cloud Build → the **existing** trigger → Run. Then Cloud Run traffic **100% LATEST**. | Edit & deploy from an old revision (that clones the old fingerprint). |
| New Twelve Data / Groq / Firebase **keys only** | Cloud Run → `clear-path-markets-science` → **Edit & deploy new revision** → **Variables & secrets** only. Leave the **container image unchanged** (same image the last trigger built). Deploy. Traffic **100% LATEST**. | Run the code trigger “to refresh keys.” That rebuilds from git; if the trigger’s env list is stale it can wipe the new key. |

- Keys live on the **Cloud Run service**, not inside the trigger and not in GitHub. Changing a key without moving traffic still leaves visitors on the old revision (old key + old fingerprint).
- After either button: `GET https://clearpathtrader.com/api/health` uptime must be minutes (process actually bounced) and `GET /api/twelvedata/config` must include `activeSource` / `keyLength` (proves the post-#213 image). Then `GET /api/quote?symbol=BTC/USD` must return a price, not 401.
- Playbook: `docs/cloud-run-two-paths.md`. Shell: `scripts/cloud-run-force-latest.sh`.
- Never **Edit & deploy** `clearpath-voice-os` (Ava) for trader keys or trader UI.

### Running the app (dev)
- Start with `npm run dev` (runs `tsx server.ts`). It serves at `http://localhost:3000` (override with `PORT`).
- **Credential-less boot (no Firebase Admin creds):** with no `FIREBASE_SERVICE_ACCOUNT` / ADC (the default in this VM and in CI), `hasFirebaseAdminCredentials()` in `src/server/firebaseAdmin.ts` short-circuits so `applicationDefault()` is never called and `getAdminFirestore()` returns `null`. The server boots and serves normally — you'll see `[Firebase Admin] No credentials configured (…). Using local file fallback.` and Firestore write-through is skipped (local-file fallback only). No `NODE_OPTIONS` flag is needed. Credentials are only used when explicitly provided (`FIREBASE_SERVICE_ACCOUNT` / a real `GOOGLE_APPLICATION_CREDENTIALS` file) or on GCP runtimes (Cloud Run/Functions/App Engine, detected via `K_SERVICE`/`GAE_*`). Self-tests/CI can force local-only mode with `CLEARPATH_DISABLE_FIRESTORE_ADMIN=1`.
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
- Affiliate / referral rewards: every private account gets `/r/:CODE`; cookie attribution on register; discounts + account credit via `src/server/affiliateService.ts` and `GET /api/affiliate/me`. UI: Affiliate Network tab. Admin mark-paid: `POST /api/admin/affiliate/mark-paid` (`CATALOG_ADMIN_SECRET`). Self-test: `npm run test:affiliate`.
- Firebase web client key: set `VITE_FIREBASE_API_KEY` (and related `VITE_FIREBASE_*`) in `.env` / **Cloud Run service env** — do not commit live keys into `firebase-applet-config.json`. Restrict the key by HTTP referrer in Google Cloud Console. The server injects `window.__CLEARPATH_FIREBASE_CONFIG__` at HTML serve time (`src/server/firebaseClientConfig.ts`), so production does **not** require rebuilding the Vite bundle just to add the key — set the vars on the running Cloud Run service and redeploy/restart. Missing keys must degrade to offline mocks that still render the SPA (`npm run test:firebase-mock` guards this).
- OAuth `/auth/:provider` stubs only allow relative SPA returnTo paths (open-redirect hardened).

### Backups (non-negotiable)
- **Never tell the founder backups are unnecessary.** Cloud Run disk is ephemeral; durable Firestore/Stripe still needs founder-owned JSON exports.
- CEO Dashboard → **Download disaster backup** (`GET /api/admin/backup/download`) saves private accounts (with hashes), waitlist, invites, and Stripe customer emails. Also snapshots to Firestore `founder_backups` on boot / `POST /api/admin/backup/snapshot`.
- Restore: `POST /api/admin/backup/restore` with a backup's `privateAccounts.accounts` (or `{ accounts: [...] }`).
- Self-test: `npm run test:founder-backup`.

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
