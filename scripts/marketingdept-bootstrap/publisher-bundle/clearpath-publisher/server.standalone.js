/**
 * ClearPath Publisher — STANDALONE for Cloud Shell paste
 * Founder login (single owner) + treasure chest + social console
 * Set TEAM_USERS + SESSION_SECRET on Cloud Run. Never commit secrets.
 */
import "dotenv/config";
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
const CHEST_FILE = path.join(DATA_DIR, "treasure-chest.json");

const app = express();
const PORT = Number(process.env.PORT || 8787);
const HOST = process.env.HOST || "0.0.0.0";
const SESSION_SECRET = (process.env.SESSION_SECRET || "").trim();
const COOKIE = "cpac_auth";
const HOURS = 12;

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: false }));

function loadUsers() {
  const list = (process.env.TEAM_USERS || "").trim();
  if (list) {
    return list.split(",").map((p) => p.trim()).filter(Boolean).map((p) => {
      const [username, password, roleRaw] = p.split(":");
      return {
        username: (username || "").trim().toLowerCase(),
        password: password || "",
        role: roleRaw === "owner" ? "owner" : "member",
      };
    }).filter((u) => u.username && u.password);
  }
  const ownerPass = (process.env.TEAM_OWNER_PASSWORD || process.env.APP_PASSWORD || "").trim();
  if (ownerPass) return [{ username: "owner", password: ownerPass, role: "owner" }];
  return [];
}

function findUser(username, password) {
  const u = String(username || "").trim().toLowerCase();
  const p = String(password || "");
  return loadUsers().find((row) => row.username === u && row.password === p) || null;
}

function parseCookies(req) {
  const out = {};
  for (const part of String(req.headers.cookie || "").split(";")) {
    const i = part.indexOf("=");
    if (i === -1) continue;
    out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim());
  }
  return out;
}

function makeToken(username, role) {
  const expires = String(Date.now() + HOURS * 3600 * 1000);
  const payload = `${expires}|${username}|${role}`;
  const sig = crypto.createHmac("sha256", SESSION_SECRET).update(payload).digest("hex");
  return `${payload}.${sig}`;
}

function verifyToken(token) {
  if (!token || !SESSION_SECRET) return null;
  const d = token.lastIndexOf(".");
  if (d <= 0) return null;
  const payload = token.slice(0, d);
  const sig = token.slice(d + 1);
  const expected = crypto.createHmac("sha256", SESSION_SECRET).update(payload).digest("hex");
  try {
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  } catch { return null; }
  const [expires, username, role] = payload.split("|");
  if (!expires || !username || Number(expires) <= Date.now()) return null;
  return { username, role: role === "owner" ? "owner" : "member" };
}

function currentUser(req) {
  return verifyToken(parseCookies(req)[COOKIE]);
}

function setCookie(res, token) {
  res.setHeader("Set-Cookie", `${COOKIE}=${encodeURIComponent(token)}; HttpOnly; Secure; SameSite=Lax; Max-Age=${HOURS * 3600}; Path=/`);
}

function clearCookie(res) {
  res.setHeader("Set-Cookie", `${COOKIE}=; HttpOnly; Secure; SameSite=Lax; Max-Age=0; Path=/`);
}

function ensureData() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}

function loadChest() {
  ensureData();
  try {
    const parsed = JSON.parse(fs.readFileSync(CHEST_FILE, "utf8"));
    return Array.isArray(parsed) ? parsed : [];
  } catch { return []; }
}

function saveChest(items) {
  ensureData();
  const tmp = CHEST_FILE + ".tmp";
  fs.writeFileSync(tmp, JSON.stringify(items, null, 2));
  fs.renameSync(tmp, CHEST_FILE);
}

const LOGIN_HTML = `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Sign in — ClearPath Automation Console</title>
<style>
body{margin:0;min-height:100vh;display:grid;place-items:center;font-family:Georgia,serif;color:#f4f6ff;
background:radial-gradient(900px 500px at 15% 10%,rgba(255,43,214,.14),transparent 55%),radial-gradient(800px 480px at 85% 90%,rgba(65,105,225,.18),transparent 50%),#070a14}
.card{width:min(440px,92vw);padding:2rem 1.75rem;border:1px solid rgba(65,105,225,.35);background:rgba(14,19,36,.92)}
h1{margin:0 0 .4rem;font-size:1.35rem} .sub{color:#8b93b0;margin:0 0 1rem;line-height:1.45}
label{display:block;margin:.85rem 0 .35rem;font-family:ui-monospace,monospace;font-size:.72rem;letter-spacing:.08em;text-transform:uppercase;color:#8b93b0}
input{width:100%;padding:.85rem;border:1px solid rgba(65,105,225,.35);background:#050812;color:#f4f6ff;font-size:1rem;box-sizing:border-box}
button{margin-top:1.1rem;width:100%;padding:.9rem;border:1px solid rgba(255,43,214,.45);background:linear-gradient(135deg,rgba(255,43,214,.18),rgba(65,105,225,.22));color:#f4f6ff;font-family:ui-monospace,monospace;cursor:pointer}
.error{display:none;color:#ff8fab;margin-top:.75rem}.error.show{display:block}
.roster{margin-top:1rem;color:#8b93b0;font-family:ui-monospace,monospace;font-size:.82rem}
</style></head><body>
<div class="card">
<h1>ClearPath Automation Console</h1>
<p class="sub">Private founder login. One account unlocks the ClearPath Automation Console.</p>
<form method="POST" action="/login">
<label for="username">Username</label>
<input id="username" name="username" autocomplete="username" placeholder="owner" required/>
<label for="password">Password</label>
<input type="password" id="password" name="password" autocomplete="current-password" required/>
<p class="error" id="error-msg">Login failed.</p>
<button type="submit">Unlock console</button>
</form>
<p class="roster" id="roster">Loading roster…</p>
</div>
<script>
if(new URLSearchParams(location.search).get("error")==="1")document.getElementById("error-msg").classList.add("show");
fetch("/api/auth/roster").then(r=>r.json()).then(d=>{
  document.getElementById("roster").textContent=d.configured&&d.users?.length?"Accounts: "+d.users.join(", "):"Team not configured on server.";
}).catch(()=>{document.getElementById("roster").textContent="Could not load roster.";});
</script>
</body></html>`;

app.get("/login", (req, res) => {
  if (currentUser(req)) return res.redirect("/");
  res.type("html").send(LOGIN_HTML);
});

app.get("/api/auth/roster", (_req, res) => {
  const users = loadUsers();
  res.json({ configured: users.length > 0 && Boolean(SESSION_SECRET), users: users.map((u) => u.username) });
});

app.post("/login", (req, res) => {
  const user = findUser(req.body?.username, req.body?.password);
  if (!user || !SESSION_SECRET) return res.redirect("/login?error=1");
  setCookie(res, makeToken(user.username, user.role));
  return res.redirect("/");
});

app.get("/logout", (req, res) => {
  clearCookie(res);
  res.redirect("/login");
});

app.use((req, res, next) => {
  const user = currentUser(req);
  if (user) {
    req.user = user;
    return next();
  }
  if (req.path.startsWith("/api/")) return res.status(401).json({ error: "login_required" });
  return res.redirect("/login");
});

app.get("/api/me", (req, res) => {
  res.json({ username: req.user.username, role: req.user.role, roster: loadUsers().map((u) => ({ username: u.username, role: u.role })) });
});

app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    name: "ClearPath Publisher",
    console: "social-team-private",
    time: new Date().toISOString(),
    telegramReady: Boolean((process.env.TELEGRAM_BOT_TOKEN || "").trim() && (process.env.TELEGRAM_CHAT_ID || "").trim()),
    channels: channelStatus(),
  });
});

app.get("/api/channels", (_req, res) => res.json(channelStatus()));
app.get("/api/queue", (_req, res) => res.json(loadJobs()));
app.post("/api/queue", (req, res) => {
  const job = req.body;
  if (!job?.id || !job?.title) return res.status(400).json({ error: "id and title required" });
  res.status(201).json(upsertJob({ approved: false, ...job, createdBy: req.user.username }));
});
app.post("/api/queue/sync", (req, res) => {
  const incoming = Array.isArray(req.body?.jobs) ? req.body.jobs : null;
  if (!incoming) return res.status(400).json({ error: "jobs array required" });
  const existing = new Map(loadJobs().map((j) => [j.id, j]));
  const merged = incoming.map((j) => {
    const prev = existing.get(j.id);
    return prev
      ? { ...j, approved: prev.approved, results: prev.results, sentAt: prev.sentAt, status: prev.status === "sent" || prev.status === "partial" ? prev.status : j.status }
      : { approved: false, createdBy: req.user.username, ...j };
  });
  res.json(replaceAll(merged));
});
app.patch("/api/queue/:id", (req, res) => {
  const job = patchJob(req.params.id, req.body || {});
  if (!job) return res.status(404).json({ error: "not found" });
  res.json(job);
});
app.delete("/api/queue/:id", (req, res) => res.json({ deleted: deleteJob(req.params.id) }));
app.post("/api/queue/:id/approve", (req, res) => {
  const job = patchJob(req.params.id, { approved: true, approvedBy: req.user.username });
  if (!job) return res.status(404).json({ error: "not found" });
  res.json(job);
});
app.post("/api/queue/:id/dispatch", async (req, res) => {
  const job = getJob(req.params.id);
  if (!job) return res.status(404).json({ error: "not found" });
  const errors = guardrailErrors(job);
  if (errors.length) return res.status(422).json({ error: "guardrails", details: errors });
  patchJob(job.id, { approved: true, status: "sending", approvedBy: req.user.username });
  const { status, results } = await dispatchJob(job);
  res.json(patchJob(job.id, { status, results, sentAt: new Date().toISOString(), dispatchedBy: req.user.username }));
});

app.get("/api/treasure", (_req, res) => res.json(loadChest().sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)))));
app.post("/api/treasure", (req, res) => {
  const now = new Date().toISOString();
  const item = {
    id: `chest_${crypto.randomBytes(6).toString("hex")}`,
    title: String(req.body?.title || "").trim() || "Untitled",
    body: String(req.body?.body || "").trim(),
    channels: Array.isArray(req.body?.channels) ? req.body.channels.map(String) : [],
    tags: Array.isArray(req.body?.tags) ? req.body.tags.map(String) : [],
    status: "open",
    createdBy: req.user.username,
    updatedBy: req.user.username,
    createdAt: now,
    updatedAt: now,
  };
  const items = loadChest();
  items.push(item);
  saveChest(items);
  res.status(201).json(item);
});
app.patch("/api/treasure/:id", (req, res) => {
  const items = loadChest();
  const idx = items.findIndex((i) => i.id === req.params.id);
  if (idx < 0) return res.status(404).json({ error: "not found" });
  const prev = items[idx];
  items[idx] = {
    ...prev,
    ...(["title", "body"].includes("title") ? {} : {}),
    title: req.body?.title !== undefined ? String(req.body.title).trim() : prev.title,
    body: req.body?.body !== undefined ? String(req.body.body) : prev.body,
    status: ["open", "shipped", "archived"].includes(req.body?.status) ? req.body.status : prev.status,
    updatedBy: req.user.username,
    updatedAt: new Date().toISOString(),
  };
  saveChest(items);
  res.json(items[idx]);
});
app.delete("/api/treasure/:id", (req, res) => {
  const items = loadChest();
  const next = items.filter((i) => i.id !== req.params.id);
  saveChest(next);
  res.json({ deleted: next.length !== items.length });
});

app.use(express.static(CONSOLE_DIR));
app.get("*", (req, res, next) => {
  if (req.path.startsWith("/api/")) return next();
  res.sendFile(path.join(CONSOLE_DIR, "index.html"));
});

app.listen(PORT, HOST, () => {
  const users = loadUsers().map((u) => u.username);
  console.log(`ClearPath private team console on ${HOST}:${PORT}`);
  console.log(users.length && SESSION_SECRET ? `Team auth ON: ${users.join(", ")}` : "Team auth LOCKED — set TEAM_USERS + SESSION_SECRET");
  startScheduler();
});
