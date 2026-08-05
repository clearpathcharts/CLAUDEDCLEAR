# MARKETINGDEPT team-auth + media-upload bootstrap (Cloud Shell)

Use when `clearpathcharts/MARKETINGDEPT` cannot receive pushes, but you need
private login + Brent/Dustin/Brian accounts on Cloud Run, and/or **ClearPath-hosted
full file upload** (so posts do not require YouTube).

## Team auth (private login)

```bash
bash scripts/marketingdept-bootstrap/install-team-auth.sh ~/MARKETINGDEPT
# or one-shot private fix:
bash scripts/marketingdept-bootstrap/cloud-shell-private-fix.sh
```

Set `TEAM_USERS` (or `TEAM_*_PASSWORD`) and `SESSION_SECRET` on Cloud Run.

## Full file upload (no YouTube required)

From a Cloud Shell clone of CLAUDEDCLEAR (this repo) and MARKETINGDEPT:

```bash
# Apply media upload files into MARKETINGDEPT and redeploy europe-west1
DEPLOY=1 REGION=europe-west1 \
  bash scripts/marketingdept-bootstrap/install-media-upload.sh ~/MARKETINGDEPT
```

After deploy, `/api/health` should include `"mediaUpload":true`. In the console:
**Publish → choose an MP4 → Add to queue → Dispatch**. Telegram/Discord send the
real file. YouTube remains optional if OAuth is configured.
