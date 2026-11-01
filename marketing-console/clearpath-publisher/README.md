# ClearPath Publisher — backend

Your own publishing engine. No Zapier. No Buffer.

- **Phase 2**: persistent queue (survives browser/PC restarts), scheduler that auto-sends approved posts at their scheduled time
- **Phase 3**: direct platform APIs — Telegram, Discord, Reddit, YouTube today; Facebook/Instagram/LinkedIn stay on the Cursor bridge until Meta/LinkedIn approve direct API access

## Start it

```powershell
cd "c:\Users\forex\Downloads\ALL EYES OS\clearpath-publisher"
npm install          # first time only
copy .env.example .env    # first time only — then fill in credentials
npm start
```

Server runs at `http://127.0.0.1:8787`. Open the glass console (`dashboard-glassmorphism/src/index.html`) — it detects the backend automatically and switches from copy-paste mode to live Dispatch buttons.

## How posting works

1. **Upload the lesson file** in the composer (ClearPath hosts it — YouTube is optional)
2. Compose caption → Add to queue (saved on the server, not just the browser)
3. Click **Dispatch now** on a job — that click is your founder approval
4. Telegram / Discord receive the **actual file**; Reddit can use the hosted URL; YouTube uses the same upload if OAuth is configured
5. Bridge channels (Facebook/Instagram/LinkedIn) still produce a copy-package for Cursor until their APIs are approved
6. Scheduled posts: approve the job and the scheduler sends at the scheduled time — server must stay running. On Cloud Run, set `GCS_MEDIA_BUCKET` so uploads survive new revisions.

### Media upload API

- `POST /api/upload` — raw binary body, headers `X-Filename` + `Content-Type`
- `GET /api/media` — recent uploads + size limits
- `GET /media/:id` — serve hosted file (team session required)

## Guardrails (enforced server-side)

- Calm / no-flash confirmation required
- Education-only confirmation required
- Nothing dispatches without explicit approval
- YouTube uploads default to **unlisted** for review before going public

## Credentials

See `.env.example` — each block has step-by-step instructions. Fill in only what you have; everything else shows "needs credentials" honestly in the console.
