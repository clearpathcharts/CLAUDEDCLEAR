# CEO explainer-video library

Founder-only page inside the CEO Dashboard: **CEO DASHBOARD → 🎬 EXPLAINER VIDEOS**
(or open `/ceo#videos`).

1. **Upload** a video and wait for the bar to fill.
2. Scroll to **Where each video plays** and choose that video from the dropdown
   next to the play icon it belongs to. It is live immediately — no code, no deploy.
3. **COPY LINK** is still there for one-off placements (for example a `videoUrl`
   in `src/sectionGuides/catalog.ts`).

Choosing **Nothing yet** in a dropdown takes the video back off that icon.

## How it works

- `GET /api/ceo/videos` — library + slot assignments + honest storage state
- `POST /api/ceo/videos/upload-url` — mints a **resumable upload session URI**
- `POST /api/ceo/videos/:id/finalize` — enforces the real size/type, publishes, reports
- `DELETE /api/ceo/videos/:id` — also clears every slot that pointed at it
- `PUT /api/ceo/videos/slots/:slotId` `{ videoId }` — put a video behind one play icon
- `DELETE /api/ceo/videos/slots/:slotId` — take it back off

All of those are mounted in `server.ts` behind `requireFounderOrCatalogAdmin` **and**
`requireFounderActionHeader` — the same pair that guards `POST /api/admin/backup/download`.
The router adds no auth of its own and must never be mounted without those guards.

One route is public:

- `GET /api/videos/slots` — unauthenticated, returns **only** `{ ok, slots }` where
  `slots` is `slot id -> playable URL`. No video ids, filenames, sizes, upload
  times, bucket name or storage state. `src/server/videoSlotRoutes.ts` must never
  import founder-only storage helpers.

## Slots

`src/content/videoSlots.ts` is the single list of play icons. Each entry has a
stable `id` (`nav.charts`), a founder-facing `label`, `where` the icon sits, and
what it `explains` (which becomes the public `aria-label`). **Ids are the storage
contract — never renumber them, never key off array position or label text.**
Adopting another play icon later is one entry here plus passing its id to the player.

Assignments live in Firestore `site_settings/video_slots` with a
`data/video-slots/assignments.json` write-through copy — the same pattern as
`communityStore.ts`, so they survive a Cloud Run redeploy and still work
credential-less in dev and CI.

## When nothing is assigned

The play icon stays visible and still opens the overlay, because the overlay also
carries the written explanation and the quiz — hiding the icon would hide those
too. The video frame says *"No clip for this tab yet. The words below explain the
same thing."* A video deleted after it was assigned is unwired server-side, and
`<video onError>` falls back to the same honest frame if one ever slips through.

## Captions

`ExplainVideoStage` HEAD-probes `public/explain-videos/<id>.vtt` and adds a
`<track kind="captions">` when it finds one — this works whether the video comes
from the bucket or from `public/`. Bucket-hosted caption files are **not** possible
yet: the uploader only accepts video MIME types. Accepting `text/vtt` is the
follow-up that would let the founder upload captions from the same page.

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

`npm run test:video-slots` — proves slot ids are unique and cover every play icon,
the assignment routes stay founder-gated, the public endpoint reads without auth
and emits nothing but `slot id -> URL`, assignments survive a cold start, and a
deleted video leaves no slot behind.
