# Market Prophets

Standalone daily fintech newsletter site — **completely separate** from ClearPathTrader.

- **Domain:** [marketprophets.io](https://marketprophets.io)
- **Stack:** React 19 + Vite + Express + Gemini + public RSS feeds

## Quick start

```bash
cd market-prophets
cp .env.example .env
# Add GEMINI_API_KEY and BRIEF_CRON_SECRET
npm install
npm run dev
```

Open http://localhost:3001

## Generate first edition

```bash
curl -X POST http://localhost:3001/api/brief/generate \
  -H "X-Brief-Secret: YOUR_SECRET_FROM_ENV"
```

Without `GEMINI_API_KEY`, a **demo brief** is saved from live RSS headlines (layout preview).

## Daily automation

### Option A — Google Cloud Scheduler (recommended)

1. Deploy to Cloud Run (see below)
2. Create a job:
   - **URL:** `POST https://marketprophets.io/api/brief/generate`
   - **Schedule:** `0 11 * * *` (6:00 AM US/Eastern)
   - **Header:** `X-Brief-Secret: <BRIEF_CRON_SECRET>`

### Option B — Built-in cron

Set `BRIEF_INTERNAL_CRON=true` in env. Server runs generation at 6 AM ET.

## Deploy to Cloud Run

```bash
cd market-prophets
gcloud run deploy market-prophets \
  --source . \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars "SITE_URL=https://marketprophets.io,BRIEF_INTERNAL_CRON=true" \
  --set-secrets "GEMINI_API_KEY=GEMINI_API_KEY:latest,BRIEF_CRON_SECRET=BRIEF_CRON_SECRET:latest"
```

Map custom domain `marketprophets.io` in Cloud Run → Domain mappings.

## Routes

| Path | Purpose |
|------|---------|
| `/` | Home + latest teaser |
| `/brief/latest` | Today's edition |
| `/brief/YYYY-MM-DD` | Archive edition |
| `/archive` | All editions |
| `POST /api/brief/generate` | Cron trigger (secret header) |
| `/sitemap.xml` | SEO sitemap |

## Data storage

Briefs are stored as JSON in `data/briefs/`. On Cloud Run this is **ephemeral** unless you mount a volume or move to Cloud Storage (v2).

## Email subscribe

Paste a Buttondown or Beehiiv embed into `src/components/SubscribeBlock.tsx` when DNS is live.

## Disclaimer

AI-assisted summaries from public sources. **Not investment advice.**
