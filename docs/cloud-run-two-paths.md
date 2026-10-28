# Cloud Run: two buttons, not two products

The public site is **one** service: `clear-path-markets-science` in **europe-west1**.

There are two Google buttons. They are not interchangeable. Do not add a third Cloud Build trigger for API keys.

Console: https://console.cloud.google.com/run/detail/europe-west1/clear-path-markets-science?project=gen-lang-client-0282858983

## Button A — existing Cloud Build trigger (new **code**)

Use when GitHub `main` changed and you want that build on clearpathtrader.com.

1. Cloud Build → Triggers → the trigger you already use → **Run**.
2. Wait until the build is green.
3. Cloud Run → the trader service → **Revisions** → set traffic to **100% LATEST** (not a named old revision).
4. Prove it: `https://clearpathtrader.com/api/health` — `uptime` is minutes, `cloudRun.revision` changed.
5. Prove Twelve Data image: `https://clearpathtrader.com/api/twelvedata/config` includes `activeSource` and `keyLength`.

Do **not** use this button only because you pasted a new API key.

## Button B — Edit & deploy new revision (new **keys** only)

Use when the paid Twelve Data / Groq / Firebase key changed and the **visuals are already correct**.

1. Cloud Run → `clear-path-markets-science` (europe-west1 only).
2. **Edit & deploy new revision**.
3. **Container** tab: do **not** change the image URL. It must stay the image the last **trigger** built. If you pick an older revision as the base, you put the old fingerprint back on the site with the new key (or without it).
4. **Variables & secrets**:
   - Set `TWELVEDATA_API_KEY` to the full token from twelvedata.com (not RapidAPI).
   - Delete `TWELVE_DATA_API_KEY` if it exists and differs.
5. Deploy.
6. **Revisions** → **100% LATEST**. Env vars are per-revision. A new revision at 0% traffic does nothing for visitors.
7. Prove it: health `uptime` is minutes, then `https://clearpathtrader.com/api/quote?symbol=BTC/USD` returns a price.

## Why “I updated the key and the old site came back”

Edit & deploy **clones the revision you started from**. Starting from an old row copies old JS/CSS (old fingerprint) and then maybe your new env. The trigger is the only path that rebuilds from GitHub `main`.

If traffic is pinned to a named revision, **both** buttons mint a new revision that nobody hits. Always finish with **LATEST**.

## Need new code **and** a new key (today’s charts-empty case)

1. Button B first (keys on the service, image unchanged) **or** put the key in Secret Manager and reference it on the service.
2. Button A (trigger) so `main` including the Twelve Data 401 fix is the container.
3. Traffic **100% LATEST**.
4. Check health uptime + `/api/twelvedata/config` + BTC quote.

## Do not

- Create another trigger “for keys.”
- **Edit & deploy** `clearpath-voice-os` (Ava, us-central1) for the website.
- Assume GitHub CI deploy the site. CI does not ship to Cloud Run.

Cloud Shell, traffic only:

```bash
gcloud run services update-traffic clear-path-markets-science \
  --region=europe-west1 --project=gen-lang-client-0282858983 --to-latest
```

## The world still sees the old site — do not ask them to clear history

If **you** see the new charts after a trigger or Edit & deploy, and people in other countries send photos of the old UI, they are not failing to refresh. Do not tell customers to wipe Google history or reinstall the browser.

Two different things can pin the old product:

1. **The public hostname is still on an old Cloud Run revision.** The newest row in Revisions can be 0% traffic. You are looking at that row (or a `*.run.app` preview). Australia / China / Canada hitting `clearpathtrader.com` still get the named revision that owns 100% traffic. Fix: Revisions → **100% LATEST**, then `GET https://clearpathtrader.com/api/health` — `cloudRun.revision` must match the newest ready revision and `uptime` must be minutes. View-source on the homepage must contain `<!-- clearpath-build clear-path-markets-science <that-revision> -->`.
2. **A leftover service worker or Google Frontend cache of the HTML shell.** Older `/learn/` and `/tv/` workers cache-first'd HTML on `clearpathtrader.com` while skipping `*.run.app` (so founder previews looked new). The site now serves kill-switch workers at the same URLs, sends `CDN-Cache-Control: no-store` on HTML, and reloads **once** when `/api/health` reports a new revision. Visitors do not need to clear anything.

Prove the public origin, not the console preview:

```bash
curl -sS https://clearpathtrader.com/api/health
curl -sS https://clearpathtrader.com/ | grep -o 'clearpath-build[^<]*'
```

If that revision is old, moving traffic to LATEST is the only fix. Cache-busting cannot change an origin that is still serving yesterday's container.

## Daily timeframe verify when min instances = 0

The swap-hour accuracy sweep runs inside the Node process. If Cloud Run scales to zero during **02:00–02:59 America/New_York**, that day’s run may never fire.

Optional fix (no second deploy trigger):

1. Cloud Run → **Variables** → set `TIMEFRAME_VERIFY_CRON_SECRET` to a long random string.
2. Cloud Scheduler → daily job (~**02:30 America/New_York**) → HTTP **POST** `https://clearpathtrader.com/api/cron/timeframe-verify` with header `x-timeframe-verify-cron-secret: <same secret>`.

That wakes the service and runs the same suite as CEO **Run now**. Site Doctor will warn if an instance has been up ~30h with no verify report on disk.

## Site Doctor / TF verify reports after redeploy

Latest hourly Site Doctor and daily timeframe-verify JSON also sync to Firestore collection **`ops_diagnostics`** (`site_doctor_latest`, `timeframe_verify_latest`) when Firebase Admin is configured on Cloud Run. On boot, the server hydrates local cache from Firestore if the remote report is newer — CEO Dashboard should not show “pending first sweep” solely because a new revision replaced ephemeral disk.
