# ClearPath Social OS

Site-owned social posting for **clearpathtrader.com** — **no Zapier required**.

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
               2. Publish via Buffer → X / LinkedIn / Facebook / Instagram
```

- **UI:** `/ops/social` (also the **Auto** button on the login screen)
- **API:** `/api/social-os/*` (protected by `CATALOG_ADMIN_SECRET`)

## Setup (one-time)

1. Create a [Buffer](https://buffer.com) account.
2. Connect your **X, LinkedIn, Facebook Page, Instagram** profiles in Buffer.
3. Create a Buffer access token (Buffer Developer / API settings).
4. Add to `.env`:

```bash
BUFFER_ACCESS_TOKEN=your_token_here
CATALOG_ADMIN_SECRET=your_admin_secret
SOCIAL_OS_TIMEZONE=America/New_York
SOCIAL_OS_POST_SLOTS=05:00,09:00,15:00,18:00
SOCIAL_OS_PLATFORMS=x,linkedin,facebook,instagram
SOCIAL_OS_AUTO_TEMPLATE=1
# SOCIAL_OS_DRY_RUN=1   # force dry-run even with a token
```

5. Restart `npm run dev` (or production server).

Without `BUFFER_ACCESS_TOKEN`, the OS still runs the cadence in **dry-run** mode (logs what it would post; nothing goes live).

## Ops UI

1. Open the login page → click **Auto** (top right), or go to `/ops/social`.
2. Enter your `CATALOG_ADMIN_SECRET`.
3. Generate drafts, queue posts, or click **Run next slot now** to test.

## API quick reference

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/social-os/status` | Config + cadence + counts |
| GET | `/api/social-os/posts` | List posts |
| POST | `/api/social-os/posts` | Create draft |
| POST | `/api/social-os/templates/generate` | Brand templates |
| POST | `/api/social-os/cadence/run` | Force a slot now |
| POST | `/api/social-os/scheduler/tick` | Manual scheduler tick |
| GET | `/api/social-os/buffer/profiles` | List Buffer profiles |

Header on all calls: `x-catalog-admin-secret: <CATALOG_ADMIN_SECRET>`

## Self-test

```bash
npx tsx scripts/social-os.selftest.ts
```

## Notes

- This replaces Zapier for ClearPath social posting.
- Buffer is only the **delivery pipe** to social networks (their APIs are otherwise painful).
- Optional: import CrewAI Growth OS JSON batches via `POST /api/social-os/import/growth-batch`.
