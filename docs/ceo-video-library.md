# CEO explainer-video library

Founder-only page inside the CEO Dashboard: **CEO DASHBOARD → 🎬 EXPLAINER VIDEOS**
(or open `/ceo#videos`). Upload a video, wait for the bar, tap **COPY LINK**, paste
the link wherever it belongs on the site — for example a `videoUrl` in
`src/sectionGuides/catalog.ts`.

## How it works

- `GET /api/ceo/videos` — library + honest storage state
- `POST /api/ceo/videos/upload-url` — mints a **resumable upload session URI**
- `POST /api/ceo/videos/:id/finalize` — enforces the real size/type, publishes, reports
- `DELETE /api/ceo/videos/:id`

All four are mounted in `server.ts` behind `requireFounderOrCatalogAdmin` **and**
`requireFounderActionHeader` — the same pair that guards `POST /api/admin/backup/download`.
The router adds no auth of its own and must never be mounted without those guards.

The browser `PUT`s the file straight to the bucket. Nothing is written to the
container filesystem (`src/server/ceoVideoStorage.ts` imports no `fs`), because
Cloud Run disks are ephemeral and Cloud Run caps request bodies near 32 MB.

Resumable session URIs are used instead of V4 signed URLs because they work with
the Cloud Run service account's ADC and do not need the extra
`iam.serviceAccounts.signBlob` permission.

Objects live under `ceo-videos/<id>/<sanitised-name>`; the copyable link is
`https://storage.googleapis.com/<bucket>/ceo-videos/<id>/<name>`.

## What the founder has to do once (GCP console)

1. **Make the bucket.** Cloud Storage → Create bucket. Region **europe-west1**,
   uniform access is fine. Write the name down.
2. **Let the site read the videos.** Bucket → Permissions → Grant access →
   principal `allUsers`, role **Storage Object Viewer**. Without this the link
   copies fine but visitors cannot play it — the page says so instead of pretending.
3. **Let the Cloud Run service write.** Bucket → Permissions → grant the
   `clear-path-markets-science` runtime service account **Storage Object Admin**.
4. **Allow the browser to upload (CORS).** Cloud Shell:

   ```bash
   cat > cors.json <<'JSON'
   [{
     "origin": ["https://clearpathtrader.com", "https://www.clearpathtrader.com"],
     "method": ["GET", "HEAD", "PUT", "POST"],
     "responseHeader": ["Content-Type", "Content-Range", "Range", "x-goog-resumable"],
     "maxAgeSeconds": 3600
   }]
   JSON
   gcloud storage buckets update gs://YOUR_BUCKET_NAME --cors-file=cors.json
   ```

5. **Tell the site the bucket name.** Cloud Run → `clear-path-markets-science` →
   **Edit & deploy new revision** → Variables & secrets → add
   `CEO_VIDEO_BUCKET = YOUR_BUCKET_NAME`. **Leave the container image unchanged.**
   Deploy, traffic 100% LATEST.

Keys and bucket names live on the Cloud Run service, not in git and not in the
build trigger.

## Self-test

`npm run test:ceo-videos` — proves the routes are founder-gated (401 unauthenticated,
403 without the founder action header), that the storage module has no local-disk
write path, and that filename/MIME/size validation holds.
