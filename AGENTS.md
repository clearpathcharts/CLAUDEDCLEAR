# AGENTS.md

## Cursor Cloud specific instructions

### What this project is
`clear-path-markets-science` (a.k.a. "ClearPath Trader") is a single-page **React 19 + Vite** financial/market-intelligence terminal served by a custom **Express** backend (`server.ts`). There is **one combined service**: in dev, `server.ts` runs the Express API and mounts Vite in middleware mode on the same port, so the frontend and backend are served together.

### Running the app (dev)
- Start with `npm run dev` (runs `tsx server.ts`). It serves at `http://localhost:3000` (override with `PORT`).
- The Express server also injects SSR SEO metadata and exposes JSON APIs (e.g. `GET /api/semantic/faqs`).
- The React entry is `src/main.tsx` / `index.html`. On first load the page briefly shows a `Loading New Architecture...` placeholder before React mounts — this is expected, not an error.

### Build / lint
- Build: `npm run build` (Vite build for the client + esbuild bundle of `server.ts` → `dist/server.cjs`). `npm start` runs the built server (`NODE_ENV=production`).
- Lint: `npm run lint` is `tsc --noEmit` over the whole repo (client + `server.ts`).

### Environment variables
- Copy `.env.example` to `.env`. The app runs **without** any secrets set: the Postgres pool (`src/db/index.ts`) is created lazily and only connects when a DB-backed route is hit, and the market-data gateway just logs a warning when `TWELVEDATA_API_KEY` is missing (live data disabled, app still renders).
- **All vendor API keys are server-side only** (see `.env.example`). Never use `VITE_` for secrets. FRED/FMP proxies reject client-supplied keys. Diagnostics expose **boolean presence** only (`GET /api/secrets/status`, `/api/twelvedata/config`).
- Core optional secrets: `GEMINI_API_KEY`, `GROQ_API_KEY`, `TWELVEDATA_API_KEY`, `FRED_API_KEY`, `FMP_API_KEY`, `SESSION_SECRET`, `INTELLIGENCE_WEBHOOK_SECRET`, `CATALOG_ADMIN_SECRET`, and `SQL_*` Cloud SQL credentials.
- Passport OAuth packages are largely simulated stubs; private email/password login uses Express sessions.

### Startup log gotcha
- Startup runs "compliance"/"truth" audits ~10s after boot that print messages like `[TRUTH ENGINE COMPLIANCE ALERT] ... breach(es) found! Score: 67%`. These are **internal application scoring logic**, not server errors — the server is healthy.

### Host hardening (ops only)
- Optional server hardening uses [grapheneX](https://github.com/grapheneX/grapheneX) on the **VPS/Docker host**, not inside the Node app. See `docs/ops-hardening.md` and `scripts/ops/run-graphenex.sh` (localhost `:9090` + SSH tunnel). Not applicable to managed Cloud Run.
