#!/usr/bin/env bash
# Cloud Shell — from anywhere:
#   bash ~/MARKETINGDEPT/scripts/deploy-private-now.sh
set -euo pipefail

ROOT="${HOME}/MARKETINGDEPT"
if [[ ! -f "$ROOT/clearpath-publisher/package.json" ]]; then
  echo "Missing ~/MARKETINGDEPT — clone it first, then re-run."
  exit 1
fi
cd "$ROOT"

PROJECT=gen-lang-client-0282858983
REGION=europe-west1
SERVICE=clearpath-automation-console
TEAM_USERS='brent:BrentChangeMe1:member,dustin:DustinChangeMe1:member,brian:BrianChangeMe1:member,owner:OwnerChangeMe1:owner'
SESSION_SECRET="$(openssl rand -hex 32)"

echo "==> Writing Dockerfile"
cat > Dockerfile <<'EOF'
FROM node:22-slim
WORKDIR /app
COPY clearpath-publisher/package.json clearpath-publisher/package-lock.json ./clearpath-publisher/
RUN cd clearpath-publisher && npm ci --omit=dev
COPY clearpath-publisher ./clearpath-publisher
COPY dashboard-glassmorphism ./dashboard-glassmorphism
ENV NODE_ENV=production
ENV PORT=8080
ENV HOST=0.0.0.0
EXPOSE 8080
CMD ["node", "clearpath-publisher/server.js"]
EOF

echo "==> Writing private server.js"
python3 - <<'PY'
from pathlib import Path
Path("clearpath-publisher/server.js").write_text(r'''import "dotenv/config";
import crypto from "crypto";
import fs from "fs";
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { loadJobs, getJob, upsertJob, patchJob, deleteJob, replaceAll } from "./lib/store.js";
import { dispatchJob, guardrailErrors, channelStatus } from "./lib/dispatch.js";
import { startScheduler } from "./lib/scheduler.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CONSOLE_DIR = path.resolve(__dirname, "../dashboard-glassmorphism/src");
const DATA_DIR = path.join(__dirname, "data");
const CHEST = path.join(DATA_DIR, "treasure-chest.json");
const app = express();
const PORT = Number(process.env.PORT || 8080);
const SECRET = (process.env.SESSION_SECRET || "").trim();
const COOKIE = "cpac_auth";

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: false }));

function users() {
  return (process.env.TEAM_USERS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => {
      const [username, password, role] = s.split(":");
      return {
        username: (username || "").toLowerCase(),
        password: password || "",
        role: role === "owner" ? "owner" : "member",
      };
    })
    .filter((u) => u.username && u.password);
}

function cookies(req) {
  const o = {};
  for (const part of String(req.headers.cookie || "").split(";")) {
    const i = part.indexOf("=");
    if (i > 0) o[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim());
  }
  return o;
}

function mint(u, r) {
  const e = String(Date.now() + 12 * 3600e3);
  const payload = `${e}|${u}|${r}`;
  return payload + "." + crypto.createHmac("sha256", SECRET).update(payload).digest("hex");
}

function verify(t) {
  if (!t || !SECRET) return null;
  const d = t.lastIndexOf(".");
  if (d <= 0) return null;
  const payload = t.slice(0, d);
  const sig = t.slice(d + 1);
  const expect = crypto.createHmac("sha256", SECRET).update(payload).digest("hex");
  try {
    const a = Buffer.from(sig);
    const b = Buffer.from(expect);
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  } catch {
    return null;
  }
  const [e, u, r] = payload.split("|");
  if (!e || !u || Number(e) <= Date.now()) return null;
  return { username: u, role: r === "owner" ? "owner" : "member" };
}

function me(req) {
  return verify(cookies(req)[COOKIE]);
}

function setC(res, t) {
  res.setHeader(
    "Set-Cookie",
    `${COOKIE}=${encodeURIComponent(t)}; HttpOnly; Secure; SameSite=Lax; Max-Age=${12 * 3600}; Path=/`,
  );
}

function loadChest() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  try {
    const j = JSON.parse(fs.readFileSync(CHEST, "utf8"));
    return Array.isArray(j) ? j : [];
  } catch {
    return [];
  }
}

function saveChest(a) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  const t = CHEST + ".tmp";
  fs.writeFileSync(t, JSON.stringify(a, null, 2));
  fs.renameSync(t, CHEST);
}

const LOGIN = `<!DOCTYPE html><html><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>Sign in — ClearPath</title>
<style>body{margin:0;min-height:100vh;display:grid;place-items:center;background:#070a14;color:#f4f6ff;font-family:Georgia,serif}
.card{width:min(420px,92vw);padding:2rem;border:1px solid #4169e155;background:#0e1324ee}
label{display:block;margin:.8rem 0 .3rem;font-family:monospace;font-size:.75rem;color:#8b93b0}
input{width:100%;padding:.8rem;box-sizing:border-box;background:#050812;border:1px solid #4169e155;color:#fff}
button{margin-top:1rem;width:100%;padding:.9rem;background:#ff2bd622;border:1px solid #ff2bd6;color:#fff;cursor:pointer}
.err{display:none;color:#ff8fab}.err.show{display:block}</style></head><body><div class="card">
<h1>ClearPath Automation</h1><p>Private team login — Brent, Dustin, Brian, owner</p>
<form method="POST" action="/login"><label>Username</label><input name="username" required/>
<label>Password</label><input type="password" name="password" required/>
<p class="err" id="e">Login failed</p><button type="submit">Unlock</button></form>
<p id="r" style="color:#8b93b0;font-family:monospace;font-size:.8rem"></p></div>
<script>if(new URLSearchParams(location.search).get("error"))document.getElementById("e").classList.add("show");
fetch("/api/auth/roster").then(r=>r.json()).then(d=>{document.getElementById("r").textContent=d.configured?("Accounts: "+(d.users||[]).join(", ")):"LOCKED: TEAM_USERS / SESSION_SECRET missing"});</script>
</body></html>`;

app.get("/login", (req, res) => {
  if (me(req)) return res.redirect("/");
  res.type("html").send(LOGIN);
});

app.get("/api/auth/roster", (_req, res) => {
  res.json({ configured: users().length > 0 && !!SECRET, users: users().map((u) => u.username) });
});

app.post("/login", (req, res) => {
  const u = users().find(
    (x) =>
      x.username === String(req.body?.username || "").toLowerCase() &&
      x.password === String(req.body?.password || ""),
  );
  if (!u || !SECRET) return res.redirect("/login?error=1");
  setC(res, mint(u.username, u.role));
  res.redirect("/");
});

app.get("/logout", (_req, res) => {
  res.setHeader("Set-Cookie", `${COOKIE}=; Max-Age=0; Path=/; HttpOnly; Secure; SameSite=Lax`);
  res.redirect("/login");
});

app.use((req, res, next) => {
  const u = me(req);
  if (u) {
    req.user = u;
    return next();
  }
  if (req.path === "/api/health" || req.path === "/api/auth/roster") return next();
  if (req.path.startsWith("/api/")) return res.status(401).json({ error: "login_required" });
  return res.redirect("/login");
});

app.get("/api/me", (req, res) => res.json({ username: req.user.username, role: req.user.role }));

app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    name: "ClearPath Publisher",
    console: "social-team-private",
    time: new Date().toISOString(),
    teamConfigured: users().length > 0 && !!SECRET,
    channels: channelStatus(),
  });
});

app.get("/api/channels", (_req, res) => res.json(channelStatus()));
app.get("/api/queue", (_req, res) => res.json(loadJobs()));

app.post("/api/queue", (req, res) => {
  const j = req.body;
  if (!j?.id || !j?.title) return res.status(400).json({ error: "id and title required" });
  res.status(201).json(upsertJob({ approved: false, ...j, createdBy: req.user.username }));
});

app.post("/api/queue/sync", (req, res) => {
  const incoming = Array.isArray(req.body?.jobs) ? req.body.jobs : null;
  if (!incoming) return res.status(400).json({ error: "jobs array required" });
  const existing = new Map(loadJobs().map((j) => [j.id, j]));
  res.json(
    replaceAll(
      incoming.map((j) => {
        const p = existing.get(j.id);
        return p
          ? {
              ...j,
              approved: p.approved,
              results: p.results,
              sentAt: p.sentAt,
              status: p.status === "sent" || p.status === "partial" ? p.status : j.status,
            }
          : { approved: false, createdBy: req.user.username, ...j };
      }),
    ),
  );
});

app.patch("/api/queue/:id", (req, res) => {
  const j = patchJob(req.params.id, req.body || {});
  if (!j) return res.status(404).json({ error: "not found" });
  res.json(j);
});

app.delete("/api/queue/:id", (req, res) => res.json({ deleted: deleteJob(req.params.id) }));

app.post("/api/queue/:id/approve", (req, res) => {
  const j = patchJob(req.params.id, { approved: true, approvedBy: req.user.username });
  if (!j) return res.status(404).json({ error: "not found" });
  res.json(j);
});

app.post("/api/queue/:id/dispatch", async (req, res) => {
  const job = getJob(req.params.id);
  if (!job) return res.status(404).json({ error: "not found" });
  const errors = guardrailErrors(job);
  if (errors.length) return res.status(422).json({ error: "guardrails", details: errors });
  patchJob(job.id, { approved: true, status: "sending", approvedBy: req.user.username });
  const out = await dispatchJob(job);
  res.json(
    patchJob(job.id, {
      status: out.status,
      results: out.results,
      sentAt: new Date().toISOString(),
      dispatchedBy: req.user.username,
    }),
  );
});

app.get("/api/treasure", (_req, res) => res.json(loadChest()));
app.post("/api/treasure", (req, res) => {
  const now = new Date().toISOString();
  const item = {
    id: "chest_" + crypto.randomBytes(6).toString("hex"),
    title: String(req.body?.title || "Untitled").trim(),
    body: String(req.body?.body || ""),
    tags: [],
    status: "open",
    createdBy: req.user.username,
    updatedBy: req.user.username,
    createdAt: now,
    updatedAt: now,
  };
  const a = loadChest();
  a.push(item);
  saveChest(a);
  res.status(201).json(item);
});
app.patch("/api/treasure/:id", (req, res) => {
  const a = loadChest();
  const i = a.findIndex((x) => x.id === req.params.id);
  if (i < 0) return res.status(404).json({ error: "not found" });
  a[i] = {
    ...a[i],
    status: ["open", "shipped", "archived"].includes(req.body?.status) ? req.body.status : a[i].status,
    updatedBy: req.user.username,
    updatedAt: new Date().toISOString(),
  };
  saveChest(a);
  res.json(a[i]);
});
app.delete("/api/treasure/:id", (req, res) => {
  const a = loadChest();
  const n = a.filter((x) => x.id !== req.params.id);
  saveChest(n);
  res.json({ deleted: n.length !== a.length });
});

app.use(express.static(CONSOLE_DIR));
app.get("*", (req, res, next) => {
  if (req.path.startsWith("/api/")) return next();
  res.sendFile(path.join(CONSOLE_DIR, "index.html"));
});

app.listen(PORT, "0.0.0.0", () => {
  console.log("PRIVATE team console", PORT, users().map((u) => u.username));
  startScheduler();
});
''')
assert "social-team-private" in Path("clearpath-publisher/server.js").read_text()
print("OK private server.js")
PY

node --check clearpath-publisher/server.js
echo "==> Syntax OK"

cat > /tmp/cpac-env.yaml <<EOF
SESSION_SECRET: "${SESSION_SECRET}"
TEAM_USERS: "${TEAM_USERS}"
PUBLIC_BASE_URL: "https://fuckweasel.net"
EOF

echo "==> Deploying — wait for Cloud Build (do not Ctrl+C)"
gcloud config set project "$PROJECT"
gcloud run deploy "$SERVICE" \
  --source "$ROOT" \
  --region "$REGION" \
  --allow-unauthenticated \
  --port 8080 \
  --env-vars-file=/tmp/cpac-env.yaml \
  --quiet

echo "==> Health check loop"
for i in $(seq 1 15); do
  sleep 4
  H="$(curl -sS https://fuckweasel.net/api/health || true)"
  C="$(echo "$H" | tr ',' '\n' | grep console || echo missing)"
  echo "try $i: $C"
  if echo "$H" | grep -q social-team-private; then
    echo "SUCCESS — Incognito https://fuckweasel.net"
    echo "brent/dustin/brian/owner — BrentChangeMe1 / DustinChangeMe1 / BrianChangeMe1 / OwnerChangeMe1"
    exit 0
  fi
done
echo "FAIL — still social-only. Scroll up for deploy errors."
exit 1
