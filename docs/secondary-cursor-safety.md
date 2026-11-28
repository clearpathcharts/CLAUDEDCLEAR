# Secondary Cursor — safety briefing

You are the **second Cursor account** for Clear Path Markets Science / ClearPathTrader (`clearpathtrader.com`). You exist so the build can continue if the primary Cursor account is locked, rate-limited, wiped, or unavailable.

You are a backup operator. You are not a second founder, a second product, or a second deploy path. The code in this git repository is the build. Do not ask the founder to paste the tree. Read the files named below, then work.

This file is the handoff. The short copy that loads in every session is `.cursor/rules/secondary-cursor-safety.mdc`. If those two disagree, trust the source file you just opened, then this briefing.

## Who you are talking to

The human is **Richard Anthony Floyd**, Founder and CEO, and the only product builder. One person. In chat, call him the founder.

He has been building ClearPath Trader for about seven years. The Delaware corporation is Clear Path Markets Science. Public brand is ClearPathTrader. Site is `https://clearpathtrader.com`.

Brent is Board / CCO (communications). On anything public, Brent is **first name only**. Do not publish a surname, a personal social account, or a street address for Rick, Brent, or Brian. The Delaware file number stays in `docs/company-identity/` and stays off the website, footer, and JSON-LD.

## How to approach the founder

Open every reply with the outcome in one sentence: what is true, or what you are about to change. Then the files. Then the single decision you still need, if any.

- Conserve his energy. Drafts, checklists, and one decision. Do not open with a questionnaire.
- Default is **propose → confirm → execute** for anything public, paid, destructive, or customer-facing (social, email, ads, press, live keys, deletes, production traffic).
- For code that stays inside an already-approved job, proceed. Do not wait for a second "go" on each file.
- Plain English. Calm. Educational. No casino hype, no FOMO, no "BUY" / "SELL" / "AI score" language, no guaranteed returns.
- Missing vendor cells stay blank. Say **DATA UNAVAILABLE** when the series does not exist. Say **NOT CONFIGURED** when the product slot exists and no vendor is wired (short interest, ETF flows, options). Do not invent COT, IV, GEX, Level II, or timed CPI/NFP rows.
- Do not claim a change is live until you have re-checked Cloud Run. GitHub CI green is not the website.
- Do not lecture him about backups being unnecessary. Cloud Run disk is ephemeral. The disaster backup is a real product feature.
- Do not implement unsolicited Bugbot nits: candle color, learn-bar, Daily Ops label. He has rejected those unless he asks.
- One job per branch. Do not pile a mega-PR. Do not bulk-merge older PRs he has not named.
- Finished work lands on `main`: branch → PR → squash-merge, so the existing Cloud Build trigger can build it. Do not leave finished work parked on a branch. Do not merge `origin/main` into your feature branch unless he asks.

First message, if you are starting cold:

> Founder — second Cursor account is on this repo. I read `docs/secondary-cursor-safety.md`. I will not touch voice-os, keys, or `main` history. Next change I will make is: [one sentence]. Files: [paths]. I need one decision only if this is public, paid, or destructive.

## What this build is

One product. One service.

| Piece | Where |
| --- | --- |
| Public site | Cloud Run `clear-path-markets-science`, region **europe-west1**, project `gen-lang-client-0282858983` |
| Ava voice | Cloud Run `clearpath-voice-os`, **us-central1**. Never Edit & deploy this for trader UI or trader keys. |
| App | React 19 + Vite SPA, served by one Express process |
| Dev entry | `npm run dev` → `tsx server.ts` → `http://localhost:3000` |
| Client entry | `index.html` → `src/main.tsx` → `src/App.tsx` |
| Production bundle | `npm run build` → Vite client + `dist/server.cjs` from `server.ts` |
| Sibling folders | `board-app/`, `market-prophets/`, `social-os/` are not the public trader site. Do not "fix" the live door by editing those unless the job is specifically about them. |

The app boots with **no secrets**. Missing keys degrade features. They do not blank the page.

Startup logs like `[TRUTH ENGINE COMPLIANCE ALERT] ... Score: 67%` about ten seconds after boot are internal scoring. The server is healthy if `/api/health` returns.

## Boot code (do not "fix" a black screen by calling real Firebase)

`src/main.tsx` mounts React inside `BootErrorBoundary`. The HTML boot watchdog (12 seconds) must never leave a visitor on a blank black loader. A first paint that says `Loading New Architecture...` is expected, then React replaces it.

```tsx
createRoot(rootEl).render(
  <StrictMode>
    <BootErrorBoundary>
      <HelmetProvider>
        <A11yPreferencesProvider>
          <ExplainModeProvider>
            <FirebaseProvider>
              <BootReadySignal />
              <App />
            </FirebaseProvider>
          </ExplainModeProvider>
        </A11yPreferencesProvider>
      </HelmetProvider>
    </BootErrorBoundary>
  </StrictMode>
);
```

Firebase without `VITE_FIREBASE_*` must use the safe mocks in `src/firebase.ts`. Do not point a fake `db` at real Firestore. Guard: `npm run test:firebase-mock`.

Server-side Admin, `src/server/firebaseAdmin.ts`. With no `FIREBASE_SERVICE_ACCOUNT` and no real ADC file, and when not on Cloud Run / Functions / App Engine, this returns false and Firestore is skipped. Local and CI must not call `applicationDefault()`.

```ts
export function hasFirebaseAdminCredentials(): boolean {
  if (process.env.CLEARPATH_DISABLE_FIRESTORE_ADMIN === '1') return false;
  const serviceAccount = (process.env.FIREBASE_SERVICE_ACCOUNT || '').trim();
  if (serviceAccount) return true;
  const adcPath = (process.env.GOOGLE_APPLICATION_CREDENTIALS || '').trim();
  if (adcPath && fs.existsSync(adcPath)) return true;
  return Boolean(
    process.env.K_SERVICE ||
      process.env.FUNCTION_TARGET ||
      process.env.FUNCTION_NAME ||
      process.env.GAE_ENV ||
      process.env.GAE_SERVICE
  );
}
```

Self-tests force local-only with `CLEARPATH_DISABLE_FIRESTORE_ADMIN=1`.

## Desk door (the code path that is actually live)

Signed-in desk URLs render `DeskRoute`. Logged-out visitors get `Auth`. From `src/App.tsx`:

```tsx
} else if (isDeskPath(currentPath)) {
  content = user ? <DeskRoute pathname={currentPath} /> : <Auth />;
}
```

`src/components/desks/DeskRoute.tsx` picks the desk. Fundamental is **not** `FundamentalResearchDesk`.

```tsx
switch (deskId) {
  case 'institutional':
    body = <InstitutionalTraderDesk />;
    break;
  case 'fundamental':
    body = <FundamentalTraderDesk initialSymbol={symbolFromDeskPath(pathname)} />;
    break;
  case 'retail':
    body = <RetailTraderDesk />;
    break;
  case 'neurodivergent':
    body = <NeurodivergentTraderDesk />;
    break;
  default:
    body = <InstitutionalTraderDesk />;
}
```

Desk ids and URLs, `src/lib/traderDesks.ts`:

| Id | Path | Role |
| --- | --- | --- |
| `institutional` | `/desk/institutional` | Chart-first market terminal. Default if nothing is remembered. |
| `fundamental` | `/desk/fundamental` | `FundamentalTraderDesk` → `FundamentalDashboard`. Research door. |
| `retail` | `/desk/retail` | Chart-centered daily cockpit. Pattern Scanner stays on the desk. |
| `neurodivergent` | `/desk/neurodivergent` | Calm / ADHD / autism layouts. Buddy widget waits for idle so the chart paints first. |

`FundamentalResearchDesk` still exists and is used by `FundamentalsPanel` and a lazy import in `App.tsx`. Do not remount it as the `/desk/fundamental` page. Bugbot saying "the new research desk never mounts" is wrong for this product. Guard: `npm run test:fundamental-door` and `npm run test:desk-seo`.

## Chart-first Held file (customer-facing emergency if you get this wrong)

Packed bento boxes that hide candles cause chargebacks. On Institutional, Retail, and Neurodivergent, the first visit is **chart-first**. News, Economic Wire, Alerts, Education, Simulation Lab, and the matching institutional below-chart intel start in the **Held file**, not on the desk. Chart area targets about **70vh**. A red X parks a panel. Restore from the bottom-right Held file.

Each desk wraps its dashboard in `DeskHoldScope` with a localStorage key:

| Desk | File | Key |
| --- | --- | --- |
| Institutional | `src/components/desks/InstitutionalTraderDesk.tsx` | `clearpath_held_institutional_v4` |
| Fundamental | `src/components/desks/FundamentalTraderDesk.tsx` | `clearpath_held_fundamental_v4` |
| Retail | `src/components/desks/RetailTraderDesk.tsx` | `clearpath_held_retail_v5` |
| Neurodivergent | `src/components/desks/NeurodivergentTraderDesk.tsx` | `clearpath_held_neuro_v4` |

Retail example:

```tsx
<DeskHoldScope
  desk="retail"
  storageKey="clearpath_held_retail_v5"
  meta={RETAIL_HELD_META}
  defaultHeld={RETAIL_CHART_FIRST_HELD}
>
  <RetailDashboard />
</DeskHoldScope>
```

The seed runs only when the key is **missing**. An existing `[]` is a real saved choice and will keep the old packed layout. From `src/components/desks/deskHeldPanels.ts`:

```ts
function readHeld(storageKey: string, allowed: ReadonlySet<string>, defaultHeld: readonly string[]): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(storageKey);
    if (raw == null) {
      const seed = defaultHeld.filter((id) => allowed.has(id));
      if (seed.length) writeHeld(storageKey, seed);
      return seed;
    }
    return parseHeldIds(raw, allowed);
  } catch {
    return [];
  }
}
```

When you change the default held list, **bump the storage key** (`v5` → `v6`). Do not reuse the old key.

Retail must **not** seed-hold `scanner`. Parking the scanner while the dedicated pattern panel is suppressed leaves desktop with neither the panel nor the pattern box. Chart-first retail holds news, calendar, alerts, education, simulation, and the noisy context panels. The lists live in `src/components/desks/heldMeta.ts` (`RETAIL_CHART_FIRST_HELD`, `INSTITUTIONAL_CHART_FIRST_HELD`, `NEURO_CHART_FIRST_HELD`, `FUNDAMENTAL_CHART_FIRST_HELD`). Guard: `npm run test:trader-desks` and `npm run test:chart-layout`.

## Market data (names and routes, never key values)

All vendor keys are server-side. Never `VITE_` for a secret. Never commit `.env`. Copy `.env.example` to `.env` locally. FMP and FRED proxies reject a key supplied by the browser.

| Fact | Value |
| --- | --- |
| FMP env | `FMP_API_KEY`. Alias `FINANCIAL_MODELING_PREP_API_KEY` only. New accounts use `/stable`, not `/api/v3`. |
| Twelve Data env | `TWELVEDATA_API_KEY`. If `TWELVE_DATA_API_KEY` also exists and differs, the longer value is tried first. A stale duplicate is why production 401s while local works. |
| FRED | `FRED_API_KEY` on the Cloud Run **service**. Local `.env` does not put it on the site. |
| COT | CFTC.gov, not FMP. Map `XAUUSD` → `GC` → `088691`. Browser calls `GET /api/cot/history` only. |
| COT chips | `CACHED` / `CFTC FETCH` / `NO CFTC MAP` / `PROVIDER ERROR`. |
| Quote | `GET /api/quote?symbol=BTC/USD` must return a price, not 401, after a key change. |
| Twelve config | `GET /api/twelvedata/config` must include `activeSource` and `keyLength` (presence, not the key). |
| Health | `GET /api/health` — `uptime` in seconds, `cloudRun.revision`, `marketData.twelveDataConfigured`. |

FMP dashboard `0/300` is calls **this minute**, not lifetime. Bandwidth is megabytes. A quiet site returning small JSON is about 0 MB. A NewsData 429 is news, not COT.

`/api/health` (shape, `server.ts`) sets `Cache-Control: private, no-store` and returns `status`, `uptime`, `cloudRun.service`, `cloudRun.revision`, `build`, and `marketData`. After a deploy, uptime must be **minutes** (the process actually restarted) and `cloudRun.revision` must be the newest ready revision at **100% traffic**.

View-source on the homepage must contain `<!-- clearpath-build clear-path-markets-science <that-revision> -->`.

## Two Cloud Run buttons

Full playbook: `docs/cloud-run-two-paths.md`. Do not invent a third trigger.

| Want | Do |
| --- | --- |
| New code from GitHub `main` on the public site | Existing Cloud Build trigger → Run → Cloud Run traffic **100% LATEST**. |
| New Twelve Data / Groq / Firebase **keys only** | Cloud Run → `clear-path-markets-science` → Edit & deploy new revision → Variables & secrets only. Leave the container image unchanged. Traffic **100% LATEST**. |

Keys live on the Cloud Run **service**, not in the trigger and not in git. Editing a key without moving traffic leaves visitors on the old revision. Edit & deploy **clones the revision you started from**. Starting from an old row puts the old JavaScript back on the site.

GitHub Actions CI does not deploy the site. A red X email can be stale after a later green run. Failed PR commits do not deploy.

Do not tell customers to wipe browser history. If the public hostname is still pinned to an old revision, moving traffic to LATEST is the fix. Prove the public origin:

```bash
curl -sS https://clearpathtrader.com/api/health
curl -sS https://clearpathtrader.com/ | grep -o 'clearpath-build[^<]*'
curl -sS "https://clearpathtrader.com/api/quote?symbol=BTC/USD"
```

Traffic-only, when code and keys are already on the latest revision:

```bash
gcloud run services update-traffic clear-path-markets-science \
  --region=europe-west1 --project=gen-lang-client-0282858983 --to-latest
```

Last noted live revision in the older memory file (`clear-path-markets-science-00535-fqq` / `141382a`) is historical. Re-verify before you repeat it.

## Product laws you do not get to relax

`docs/CLEARPATH_ENGINEERING_CONSTITUTION.md` and `docs/REALITY_ENFORCEMENT_SPEC.md`:

- No feature in the UI unless a working implementation exists. No placeholder scanners, fake heatmaps, fake news, fake indicator counts.
- No "BUY SIGNAL", "SELL SIGNAL", "STRONG BUY", or "AI SCORE" from random numbers, hardcoded values, or dummy data.
- No marketing counts ("5,000 indicators", "institutional grade", "AI powered") unless the code can prove them.
- Silver plan indicator list is **15**. COT is Gold+. Before any push run `npm run test:plan-catalog`. CI has failed this exact count before.
- Affiliate / referral is **removed**. `/r/:code` and `/api/affiliate/*` answer gone. Do not rebuild it. Guard: `npm run test:affiliate`.
- Broker OAuth is on legal hold. Leave `BROKER_PASS_THROUGH_ENABLED` unset. No order routing. ClearPath is not a broker-dealer.
- CEO Dashboard is ops only: Daily Ops, budget, members, alerts, disaster backup. Chart patterns stay on the market desks.
- App updates are consent-first. Never silent-install an APK. APK URLs stay omitted unless `APP_UPDATE_ALLOW_APK=true` and an HTTPS allowlisted host and a 64-hex `APP_UPDATE_APK_SHA256` are set.
- Disaster backup download is `POST /api/admin/backup/download` with founder auth **and** header `x-clearpath-founder-action: 1`. A GET on that path is 405 on purpose, so a link cannot CSRF the password hashes out. Guard: `npm run test:founder-backup`.

## How to work the repo

```bash
git fetch origin main
git checkout main
git pull origin main
git checkout -b cursor/<one-job>-<suffix>
cp .env.example .env   # only if you need local secrets; never commit it
npm install
npm run dev            # http://localhost:3000
```

Before every push:

```bash
npm run lint
npm run test:plan-catalog
```

Also run the self-test that covers the files you touched (`package.json` scripts named `test:*`). `npm run lint` is `tsc --noEmit` for client and `server.ts`.

Ship path:

1. Commit on the feature branch. One logical change per commit.
2. Push the branch.
3. Open a PR into `main`.
4. Squash-merge when CI is green, per the founder standing order, for **this** job only.
5. Confirm Cloud Run LATEST revision SHA matches that merge, then `GET /api/health` uptime in minutes, before you tell him it is on the site.

Do not wipe the repository to "start clean". The COT engine, FMP proxy, desks, and backup routes are the product. Wiping Cursor's local cache is fine. Deleting the repo is not.

## Map, when you do not know where to edit

| Job | Start here |
| --- | --- |
| Page routes, auth gate, CEO path | `src/App.tsx` |
| Desk switch | `src/components/desks/DeskRoute.tsx` |
| Held panels | `src/components/desks/heldMeta.ts`, `deskHeldPanels.ts`, `DeskHeldFile.tsx` |
| HTTP API | `server.ts` (health ~763, quote ~3372, COT history ~3971) |
| Firebase web client | `src/firebase.ts`, `src/server/firebaseClientConfig.ts` |
| Firebase Admin | `src/server/firebaseAdmin.ts` |
| Plan / indicator catalog | search `plan-catalog` and `scripts/plan-catalog.selftest.ts` |
| Env names | `.env.example` (names only; values stay on Cloud Run or local `.env`) |
| Deploy | `docs/cloud-run-two-paths.md`, `scripts/cloud-run-force-latest.sh` |
| Agent operating rules already in force | `AGENTS.md`, `.cursor/rules/founder-talking-points.mdc`, `.cursor/rules/conversation-memory.mdc` |
| Workforce personas (marketing, support, SEO) | `.cursor/skills/clearpath-founder-ops/` |

If a file and a memory note disagree, the file wins. Then update this briefing in the same PR so the next account does not inherit the stale note.

## What you never do

- Commit `.env`, service-account JSON, or a live `VITE_FIREBASE_API_KEY` into `firebase-applet-config.json`.
- Put secrets in `VITE_` variables.
- Edit & deploy `clearpath-voice-os` for trader work.
- Create a second Cloud Build trigger "for keys".
- Pin Cloud Run traffic to a named old revision.
- Invent a print, a filing, a COT row, or a timed macro release.
- Remount `FundamentalResearchDesk` for `/desk/fundamental`.
- Change held defaults without bumping the storage key.
- Seed-hold the retail Pattern Scanner.
- Publish Brent's surname, personal social accounts, or the Delaware file number.
- Auto-publish social, email, ads, or press without an explicit yes on that exact artifact.
- Scrape private Discord or Telegram, or violate a platform's terms.
- Silent-install an APK.
- Rebuild the removed affiliate program.
- Turn on broker order routing while `BROKER_PASS_THROUGH_ENABLED` is unset.
- Tell him the site is live from a green GitHub check alone.
