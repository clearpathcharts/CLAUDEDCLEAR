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
- Lint: `npm run lint` is `tsc --noEmit` over the whole repo. **Known pre-existing failure:** `src/qubit/**` has broken/missing imports and fails type-check. That module is orphaned (not imported anywhere else) and does not affect the app, the Vite build, or the server bundle. Treat these specific `src/qubit` errors as pre-existing noise, not something to fix during unrelated work.

### Environment variables
- Copy `.env.example` to `.env`. The app runs **without** any secrets set: the Postgres pool (`src/db/index.ts`) is created lazily and only connects when a DB-backed route is hit, and the market-data gateway just logs a warning when `TWELVEDATA_API_KEY` is missing (live data disabled, app still renders).
- Optional secrets for full functionality: `GEMINI_API_KEY`, `TWELVEDATA_API_KEY`, and the `SQL_*` Cloud SQL Postgres credentials. Passport OAuth strategies (Discord/GitHub/Twitter/etc.) are optional and only needed for social login flows.

### Startup log gotcha
- Startup runs "compliance"/"truth" audits ~10s after boot that print messages like `[TRUTH ENGINE COMPLIANCE ALERT] ... breach(es) found! Score: 67%`. These are **internal application scoring logic**, not server errors — the server is healthy.
