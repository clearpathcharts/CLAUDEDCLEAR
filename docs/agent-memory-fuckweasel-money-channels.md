# Agent memory — fuckweasel / money channels (saved 2026-09-01)

**Founder:** Rick Floyd (`forexanarchy`) — TBI + broken fingers. Keep instructions minimal: one next action only.  
**Product:** ClearPath Automation Console at **https://fuckweasel.net**  
**Cloud Run:** `clearpath-automation-console` · project `gen-lang-client-0282858983` · region `europe-west1`  
**Not this app:** `clear-path-markets-science` (ClearPath Trader) · `clearpath-voice-os` (Ava)  
**Repo / PR:** CLAUDEDCLEAR · branch `cursor/marketing-team-auth-bootstrap-2373` · PR https://github.com/clearpathcharts/CLAUDEDCLEAR/pull/167  
**Agent run:** https://cursor.com/agents/bc-dcdb84f2-a278-40d4-a4e6-bbdf6af62373

---

## Hard truths (do not contradict)

1. **Discord is closed-circuit.** It will not acquire paying students. Money channels = **YouTube, Facebook, Instagram, TikTok**.
2. **Same GCP project**, service name is `clearpath-automation-console` (not a separate “fuckweasel” project).
3. **Never paste giant scripts** into Cloud Shell. Clone-and-run or upload the download pack zip.
4. Keys live on **Cloud Run Variables & secrets**. Use `--update-env-vars` so other secrets are not wiped.
5. Founder needs **one login only** (`owner`). Remove brent / brian / dustin from `TEAM_USERS`.

---

## What already shipped in code (PR #167)

- Private login + Dispatch UI (no “Paste into Cursor” / mission checkboxes)
- Single-owner auth fallbacks (`ONE-LOGIN-OWNER.sh`)
- Public `/api/health` + `/api/secrets/status` (must stay **before** `requireAuth`)
- Unicode filename upload fix (`encodeURIComponent` on `X-Filename`)
- Direct adapters: **YouTube, Facebook, Instagram, TikTok** (wired in `dispatch.js`)
- Public `GET /media/:id` for Meta/TikTok pull
- Download pack: `scripts/marketingdept-bootstrap/download-packs/clearpath-money-channels.zip`
- Helpers: `SET-YOUTUBE.sh`, `SET-META.sh`, `SET-TIKTOK.sh`, `FIX-CONTAINER-START.sh`, `MONEY-CHANNELS.txt`

---

## Live site status (last known — re-verify; may have drifted)

| Check | Last known |
|-------|------------|
| Health public | Was OK on rev `00007`; later probe showed `401 login_required` again → **redeploy may have reverted** |
| Roster | Was `["owner"]`; later probe showed brent/dustin/brian/owner again → **re-run ONE-LOGIN-OWNER** |
| Discord | Ready (`DISCORD_WEBHOOK_URL` present) |
| Telegram | Token present, **CHAT_ID missing** → not ready |
| YouTube / FB / IG / TikTok | Code ready; **Cloud Run keys incomplete** |

Always re-check:
```bash
curl -sS https://fuckweasel.net/api/health
curl -sS https://fuckweasel.net/api/auth/roster
curl -sS https://fuckweasel.net/api/secrets/status
```

---

## YouTube OAuth (founder mid-flow)

**Wrong:** API key `youtubeapistater` / YouTube Embedded Player API — embed only, cannot upload.  
**Right:** YouTube Data API v3 + **OAuth client** (not API key).

Env names on Cloud Run:
- `YOUTUBE_CLIENT_ID`
- `YOUTUBE_CLIENT_SECRET`
- `YOUTUBE_REFRESH_TOKEN`
- optional `YOUTUBE_PRIVACY=unlisted`

Scope: `https://www.googleapis.com/auth/youtube.upload`

Links (project-scoped):
- Enable API: https://console.cloud.google.com/apis/library/youtube.googleapis.com?project=gen-lang-client-0282858983
- Credentials: https://console.cloud.google.com/apis/credentials?project=gen-lang-client-0282858983
- Consent: https://console.cloud.google.com/apis/credentials/consent?project=gen-lang-client-0282858983
- Playground: https://developers.google.com/oauthplayground/

Playground must use **founder’s own** Client ID/Secret (gear ⚙). Google’s default Playground client (`407408718192...`) refresh tokens will **not** work on Cloud Run.

Local IDE on founder PC ran a localhost OAuth helper (`127.0.0.1:8765`) and showed **“YouTube connected. You can close this tab.”** — confirm whether those three env vars were actually written to Cloud Run.

---

## Meta / TikTok (next after YouTube)

| Channel | Env | Platform gate |
|---------|-----|----------------|
| Facebook | `META_PAGE_ID`, `META_PAGE_ACCESS_TOKEN` | App Review (`pages_manage_posts`, etc.) |
| Instagram | `META_IG_USER_ID` + same Page token | App Review (`instagram_content_publish`) + public media URL |
| TikTok | `TIKTOK_ACCESS_TOKEN` | Content Posting API audit; default privacy `SELF_ONLY` |

Also set `PUBLIC_BASE_URL=https://fuckweasel.net`.

---

## Download pack / Cloud Shell (minimal)

Zip:  
https://github.com/clearpathcharts/CLAUDEDCLEAR/raw/cursor/marketing-team-auth-bootstrap-2373/scripts/marketingdept-bootstrap/download-packs/clearpath-money-channels.zip

```bash
cd ~
unzip -o clearpath-money-channels.zip -d ~/clearpath-money-channels
bash ~/clearpath-money-channels/RUN-REDEPLOY.sh
# then fill env-templates and SET-YOUTUBE / SET-META / SET-TIKTOK
```

Or clone branch and run `FIX-CONTAINER-START.sh` + `ONE-LOGIN-OWNER.sh`.

---

## Open work (next agent)

- [ ] Confirm live revision has public health + money-channel adapters (redeploy if 401 on `/api/health`)
- [ ] Collapse roster to `owner` only again if multi-user returned
- [ ] Confirm YouTube three env vars on Cloud Run; test Dispatch YouTube with ClearPath-hosted MP4
- [ ] Set `TELEGRAM_CHAT_ID` if Telegram still needed
- [ ] Meta + TikTok keys after YouTube works
- [ ] Do not Edit & deploy `clearpath-voice-os` for trader/automation keys

---

## Communication rules with founder

- One next click / one paste block.
- No long numbered essays.
- Never claim Discord = growth.
- Never say backups are unnecessary (separate CPT rule; still respect).
