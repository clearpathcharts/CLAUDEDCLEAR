# ClearPath Social OS

**Own domain. Disconnected from clearpathtrader.com.**

Site-owned **direct** social publishing. ClearPath adapters only.

## Architecture

| Host | Role |
|------|------|
| **Social OS domain** (this service) | UI + `/api/social-os/*` + scheduler |
| clearpathtrader.com | Marketing / terminal only — `/ops/social` returns gone or redirects |

```
social-os/server.ts   → Express API + SPA
src/server/socialOs/  → adapters, cadence, store
Dockerfile.social-os  → deploy image for the Social OS domain
```

## Local

```bash
# Dedicated publisher (port 3010)
npm run dev:social-os

# Main ClearPath site (Social OS API/UI NOT mounted)
npm run dev
```

## Deploy on its own domain

1. Pick a domain / subdomain (example: `publish.yourdomain.com`).
2. Build & run the Social OS image:

```bash
docker build -f Dockerfile.social-os -t clearpath-social-os .
docker run -p 8080:8080 \
  -e SOCIAL_OS_PUBLIC_URL=https://publish.yourdomain.com \
  -e CATALOG_ADMIN_SECRET=... \
  -e SOCIAL_X_BEARER_TOKEN=... \
  clearpath-social-os
```

Or Cloud Run: deploy `Dockerfile.social-os`, map custom domain, set env.

3. On the **main** clearpathtrader.com service, set:

```bash
SOCIAL_OS_PUBLIC_URL=https://publish.yourdomain.com
VITE_SOCIAL_OS_PUBLIC_URL=https://publish.yourdomain.com   # optional “Open Social OS” link
```

Old paths `/ops/social` and `/api/social-os/*` on clearpathtrader.com then **redirect** to the Social OS host (or return 410 if unset).

## Cadence

| Slot | Local time (default) |
|------|----------------------|
| Morning | **5:00 AM** |
| Mid-morning | **9:00 AM** |
| Afternoon | **3:00 PM** |
| Evening | **6:00 PM** |

Timezone: `SOCIAL_OS_TIMEZONE` (default `America/New_York`).

## Delivery

1. Official platform API when `SOCIAL_*` credentials are set  
2. ClearPath-owned webhook (`SOCIAL_WEBHOOK_<PLATFORM>` / `SOCIAL_DIRECT_WEBHOOK_URL`)  
3. Else package under `data/social-os/packages/`

## Channels (29)

Facebook · Instagram · X · TikTok · YouTube · LinkedIn · Reddit · Snapchat · Pinterest · Discord · Threads · Telegram · WhatsApp · Twitch · Bluesky · Xing · Viadeo · Shapr · Lunchclub · Polywork · Wellfound · Fishbowl · Blind · Opportunity · Meetup · Alignable · Bark · Gust · ResearchGate

## Env (Social OS host)

See `.env.example` (`SOCIAL_*`, `SOCIAL_OS_*`, `CATALOG_ADMIN_SECRET`).

```bash
SOCIAL_OS_PUBLIC_URL=https://publish.yourdomain.com
SOCIAL_OS_BRAND_SITE_URL=https://clearpathtrader.com
SOCIAL_OS_PORT=3010
CATALOG_ADMIN_SECRET=...
```

## API (on Social OS domain only)

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/social-os/status` | Config + cadence + platform readiness |
| GET | `/api/social-os/platforms` | Catalog + credential hints |
| GET/POST | `/api/social-os/posts` | List / create |
| POST | `/api/social-os/cadence/run` | Force a slot |
| GET | `/healthz` | Liveness |

Header: `x-catalog-admin-secret: <CATALOG_ADMIN_SECRET>`

## Self-test

```bash
npm run test:social-os
```
