# MARKETINGDEPT team-auth + media-upload bootstrap (Cloud Shell)

Use when `clearpathcharts/MARKETINGDEPT` cannot receive pushes, but you need
private login + Brent/Dustin/Brian accounts on Cloud Run, and/or **ClearPath-hosted
full file upload** (so posts do not require YouTube).

## Live console source (use this)

The deployable console is `marketing-console/` at the repo root. Deploy:

```bash
gcloud run deploy clearpath-automation-console --source marketing-console --region=europe-west1
```

- Team logins: Secret Manager `MARKETING_CONSOLE_TEAM_USERS` and `MARKETING_CONSOLE_SESSION_SECRET` (32+ chars).
- Outbound sends are **off** unless `ALLOW_OUTBOUND_DISPATCH=true` is set on the service. While off,
  `POST /api/queue/:id/dispatch` returns 503 and the scheduler does not start.

## Team auth (retired)

`install-team-auth.sh` and `cloud-shell-private-fix.sh` are retired: they wrote default passwords and an
old login module. They now exit with an error.

## Full file upload (no YouTube required)

From a Cloud Shell clone of CLAUDEDCLEAR (this repo) and MARKETINGDEPT:

```bash
# Apply media upload files into MARKETINGDEPT and redeploy europe-west1
DEPLOY=1 REGION=europe-west1 \
  bash scripts/marketingdept-bootstrap/install-media-upload.sh ~/MARKETINGDEPT
```

After deploy, `/api/health` should include `"mediaUpload":true`. In the console:
**Publish → choose an MP4 → Add to queue**. Dispatch stays disabled until the founder sets
`ALLOW_OUTBOUND_DISPATCH=true`.
