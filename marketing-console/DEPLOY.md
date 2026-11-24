# fuckweasel.net (ClearPath Automation Console)

**Live URL:** https://fuckweasel.net  
**Cloud Run:** `clearpath-automation-console` · **Region:** `europe-west1` · **Project:** `gen-lang-client-0282858983`

## What it does (not Metricool)

- **Upload MP4/posters** → hosted at `PUBLIC_BASE_URL` (default `https://fuckweasel.net`)
- **Queue + founder approve** → **Dispatch** to YouTube, Reddit, Facebook Page
- **Google/Bing:** public `/watch/:id` lesson pages + IndexNow on every dispatch
- **Marketing brain + capability registry** under `/api/intelligence/*` (authenticated)

## Deploy (code only — does not wipe secrets)

From repo root:

```bash
gcloud run deploy clearpath-automation-console \
  --source marketing-console \
  --region europe-west1 \
  --project gen-lang-client-0282858983
```

Keep traffic on **LATEST**. Secrets (`TEAM_USERS`, `SESSION_SECRET`, YouTube/Meta/Reddit keys) live on the **service**, not in git.

## Smoke checks

- `GET https://fuckweasel.net/api/health` → `ok: true`
- `GET https://fuckweasel.net/api/secrets/status` → booleans only (no values)
- Login → `/api/channels` shows YouTube / Reddit / Facebook / Google / Bing readiness
