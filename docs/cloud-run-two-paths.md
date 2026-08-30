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
