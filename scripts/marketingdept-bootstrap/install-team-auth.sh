#!/usr/bin/env bash
# RETIRED 2026-11-01 (security). This script wrote an old, vulnerable copy of the
# marketing console (default team passwords, public roster, client file paths).
# The deployable console now lives in marketing-console/ at the repo root:
#   gcloud run deploy clearpath-automation-console --source marketing-console --region=europe-west1
# Team logins come from Secret Manager (MARKETING_CONSOLE_TEAM_USERS / MARKETING_CONSOLE_SESSION_SECRET).
echo "install-team-auth.sh is retired. Deploy marketing-console/ instead (see header of this file)." >&2
exit 1
