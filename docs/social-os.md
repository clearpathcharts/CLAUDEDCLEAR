# ClearPath Social OS

Site-owned **direct** social publishing for **clearpathtrader.com**.

**No Buffer. No Zapier. No Make. No Hootsuite.** ClearPath adapters post to each network.

Posts automatically **4 times per day**:

| Slot | Local time (default) |
|------|----------------------|
| Morning | **5:00 AM** |
| Mid-morning | **9:00 AM** |
| Afternoon | **3:00 PM** |
| Evening | **6:00 PM** |

Timezone default: `America/New_York` (`SOCIAL_OS_TIMEZONE`).

## How it works

```
ClearPath server (server.ts)
   └─ Social OS scheduler (every minute)
         └─ At 5am / 9am / 3pm / 6pm:
               1. Pull next queued draft per platform
                  (or auto-generate a ClearPath template)
               2. Publish via ClearPath adapter:
                    • Official platform API (when credentials set)
                    • ClearPath-owned webhook (SOCIAL_WEBHOOK_<PLATFORM>)
                    • Else package under data/social-os/packages/ (still ClearPath-owned)
```

- **UI:** `/ops/social` (also `/social-os`)
- **API:** `/api/social-os/*` (protected by `CATALOG_ADMIN_SECRET`)

## Supported channels

### Top social / video
Facebook · Instagram · X · TikTok · YouTube · LinkedIn · Reddit · Snapchat · Pinterest · Discord · Threads · Telegram · WhatsApp · Twitch · Bluesky

### Professional / networking
Xing · Viadeo · Shapr · Lunchclub · Polywork · Wellfound · Fishbowl · Blind · Opportunity · Meetup · Alignable · Bark · Gust · ResearchGate

## Setup (one-time)

1. Create developer apps / bot tokens **on each network you want live** (Meta, X, LinkedIn, etc.). Those are the destination platforms — not middlemen.
2. Paste credentials into `.env` (see `.env.example` `SOCIAL_*` keys).
3. Optional: set `SOCIAL_WEBHOOK_<PLATFORM>` or `SOCIAL_DIRECT_WEBHOOK_URL` to a ClearPath-owned endpoint for networks without a public post API.
4. Set cadence:

```bash
CATALOG_ADMIN_SECRET=your_admin_secret
SOCIAL_OS_TIMEZONE=America/New_York
SOCIAL_OS_POST_SLOTS=05:00,09:00,15:00,18:00
SOCIAL_OS_PLATFORMS=facebook,instagram,x,linkedin,youtube,tiktok,reddit,discord,telegram,bluesky,threads
# SOCIAL_OS_PLATFORMS=all
SOCIAL_OS_AUTO_TEMPLATE=1
# SOCIAL_OS_DRY_RUN=1   # force dry-run
```

5. Restart `npm run dev` (or production server).

Without platform credentials, the OS still runs: posts are **packaged** under `data/social-os/packages/` for founder confirm. Nothing is sent through Buffer/Zapier.

## Ops UI

1. Open `/ops/social`.
2. Enter your `CATALOG_ADMIN_SECRET`.
3. Toggle channels, generate drafts, queue posts, or click **Run next slot now**.

## API quick reference

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/social-os/status` | Config + cadence + counts + platform readiness |
| GET | `/api/social-os/platforms` | Full channel catalog + credential hints |
| GET | `/api/social-os/posts` | List posts |
| POST | `/api/social-os/posts` | Create draft |
| POST | `/api/social-os/templates/generate` | Brand templates |
| POST | `/api/social-os/cadence/run` | Force a slot now |
| POST | `/api/social-os/scheduler/tick` | Manual scheduler tick |

Header on all calls: `x-catalog-admin-secret: <CATALOG_ADMIN_SECRET>`

## Self-test

```bash
npx tsx scripts/social-os.selftest.ts
# or
npm run test:social-os
```

## Notes

- This **replaces** Buffer/Zapier for ClearPath social posting.
- Platform OAuth/API keys are unavoidable (Facebook requires Meta tokens, etc.) — ClearPath talks to those APIs **directly**.
- Optional: import CrewAI Growth OS JSON batches via `POST /api/social-os/import/growth-batch`.
