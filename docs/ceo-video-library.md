# CEO explainer-video library

Founder-only page inside the CEO Dashboard: **CEO DASHBOARD → 🎬 EXPLAINER VIDEOS**
(or open `/ceo#videos`).

1. **Upload** a video and wait for the bar to fill.
2. Scroll to **Where each video plays**. The sixteen **Nav play icons** are open at
   the top. Every section walkthrough below is folded up with a `3 of 7 filled`
   count on its heading — tap a heading to open it.
3. Choose the video from the dropdown next to the place it belongs. It is live
   immediately — no code, no deploy.
4. **COPY LINK** is still there for one-off placements.

Choosing **Nothing yet** in a dropdown takes the video back off that place.

Two shortcuts for the long list: type in **Find a place by name** to filter every
group at once, or tick **Show only empty ones** to see just what is left to fill.
Either one opens the matching groups for you.

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

`src/content/videoSlots.ts` is the single list of places a video can play. Each
entry has a stable `id`, a `groupId`, a founder-facing `label`, `where` it sits,
and what it `explains` (which becomes the public `aria-label`). **Ids are the
storage contract — never renumber them, never key off array position or label text.**

Two families, in two kinds of group:

| Family | Id | Group | Count |
|---|---|---|---|
| Nav play icons | `nav.charts` | `nav`, pinned first and open by default | 16, hand-written |
| Section walkthrough clips | `guide.StrictlyCharts.02-neuro-profiles` | `guide.<section>`, one per section, collapsed | 84, derived |

The walkthrough rows are generated from `src/sectionGuides/catalog.ts`
(12 sections × 7 beats), so renaming a beat there can never leave a stale row
here — `npm run test:video-slots` fails if the two lists drift in either direction.
Adopting another nav play icon is one entry in `NAV_VIDEO_SLOTS` plus passing its
id to the player; a new walkthrough beat needs no entry at all.

### Which file a walkthrough clip plays

`resolveGuideBeatVideoUrl()` decides, in this order:

1. The founder's assignment for that slot, if it is an absolute `https` URL.
2. The beat's own `videoUrl` in `catalog.ts`.
3. Nothing — the player shows its honest “coming soon” frame.

Today all 84 catalog `videoUrl`s are empty placeholders, so in practice the CEO
page is the only thing that can light a clip up.

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

`npm run test:video-slots` — proves slot ids are unique across both families and
cover every play icon, every `guide.*` id maps to a real section and beat and
every catalog beat has a slot (no orphans in either direction), the assignment
routes stay founder-gated, the public endpoint reads without auth and emits
nothing but `slot id -> URL`, a founder assignment beats the catalog URL,
assignments survive a cold start, and a deleted video leaves no slot behind.
