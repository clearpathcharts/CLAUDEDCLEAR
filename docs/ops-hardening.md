# ClearPath backend hardening with grapheneX

ClearPath Trader’s app code (`server.ts` / Docker image) stays unchanged.  
**[grapheneX](https://github.com/grapheneX/grapheneX)** hardens the **Linux (or Windows) host** that runs the backend — firewall, users, services, kernel, filesystem.

> Educational ops note: this reduces the host attack surface. It is not a product feature inside the ClearPath UI.

## When to use this

| Hosting | Use grapheneX? |
|---------|----------------|
| VPS / bare metal / self-managed VM | **Yes** — primary target |
| Self-managed Docker host (Compose / Swarm) | **Yes** — harden the host |
| Google Cloud Run / fully managed PaaS | **No** — no privileged host access; use cloud IAM, VPC, Cloud Armor instead |

ClearPath production Docker image listens on **`PORT` (default `8080` on Cloud Run)**. grapheneX’s web UI also defaults to `8080` — always bind grapheneX to **localhost on another port** (this repo’s helper uses `127.0.0.1:9090`).

## Quick start (Docker — recommended)

From a shell **on the ClearPath server**:

```bash
# Snapshot / backup the VM first.
cd /path/to/CLAUDEDCLEAR
chmod +x scripts/ops/run-graphenex.sh
./scripts/ops/run-graphenex.sh
```

Then open an SSH tunnel from your laptop:

```bash
ssh -L 9090:127.0.0.1:9090 user@your-clearpath-host
```

Browse to `http://127.0.0.1:9090` and paste the access token printed in the grapheneX shell.

**Do not** publish grapheneX on a public IP.

### Pip alternative (host Python)

```bash
python3 -m pip install graphenex
# Listen only on localhost, avoid clashing with ClearPath :8080
python3 -m graphenex -w 127.0.0.1:9090
```

## Safe ClearPath-oriented order

Apply modules **one at a time** (grapheneX “ask between steps” / avoid blind full presets).

1. **Snapshot** the VM.
2. Confirm you can SSH and that ClearPath responds (`curl -I http://127.0.0.1:$PORT` or via your reverse proxy).
3. Start with low-risk modules (unnecessary services off, basic filesystem/kernel hardening that does not touch SSH).
4. Review **Firewall** last — allow:
   - SSH (your port)
   - HTTP/HTTPS (`80`/`443`) if Nginx/Caddy terminates TLS
   - ClearPath app port only on localhost if behind a reverse proxy
5. Re-test SSH + site after each firewall change.

See `scripts/ops/clearpath-harden.preset.json` for a **suggested** module list to import/adapt inside grapheneX (`modules.json` presets). Names must match modules available in your grapheneX version — verify with `list` / the web UI before running.

## ClearPath ports to keep open

| Port | Role |
|------|------|
| `22` (or custom SSH) | Admin access |
| `80` / `443` | Public reverse proxy |
| `3000` or `$PORT` | ClearPath Node process — prefer **localhost only** behind the proxy |
| `9090` (grapheneX helper) | **localhost / SSH tunnel only** — never public |

## What not to do

- Do not add grapheneX as an npm dependency or import it from `server.ts`.
- Do not run `--privileged` grapheneX in CI against production without a maintenance window.
- Do not enable firewall modules that drop SSH before you have console/serial access.
- Do not expose the grapheneX web UI on `0.0.0.0` in production.

## After hardening

- Restart ClearPath if a module required reboot (`require_restart`).
- Confirm `npm start` / Docker container still healthy.
- Confirm OAuth callbacks and WebSockets (`ws`/`wss`) still work through the proxy.

## References

- Upstream: https://github.com/grapheneX/grapheneX  
- Helper script: `scripts/ops/run-graphenex.sh`  
- Suggested preset sketch: `scripts/ops/clearpath-harden.preset.json`
