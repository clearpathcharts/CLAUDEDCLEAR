#!/usr/bin/env bash
set -euo pipefail
echo "=== STOP charging: cancel ongoing Cloud Builds ==="
for id in $(gcloud builds list --ongoing --format="value(id)" 2>/dev/null); do
  echo "cancel $id"; gcloud builds cancel "$id" >/dev/null || true
done
echo "If no IDs printed, nothing was running."
mkdir -p "$HOME/MARKETINGDEPT/scripts"
python3 - <<'PY'
import base64, gzip, pathlib
chunks = [
  "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",
  "2/h/l0Gv3zgrAAA=",
]
b64 = "".join(chunks)
path = pathlib.Path.home() / "MARKETINGDEPT/scripts/deploy-private-mini.sh"
path.write_bytes(gzip.decompress(base64.b64decode(b64)))
path.chmod(0o755)
print("wrote", path, path.stat().st_size, "bytes")
PY
bash "$HOME/MARKETINGDEPT/scripts/deploy-private-mini.sh"
