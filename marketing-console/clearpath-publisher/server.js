/**
 * ClearPath Publisher + Automation Console (social-only)
 * Founder login (single owner account via TEAM_USERS)
 * Shared marketing treasure chest for all authenticated users
 * No third-party automation vendors — never commit secrets
 */
import "dotenv/config";
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { loadJobs, getJob, upsertJob, patchJob, deleteJob, replaceAll } from "./lib/store.js";
import { OUTBOUND_DISABLED_ERROR, loadDispatch, loadScheduler, outboundEnabled } from "./lib/outbound.js";
import {
  COOKIE_NAME,
  clearSessionCookieHeader,
  findUser,
  listPublicRoster,
  makeSessionToken,
  parseCookies,
  sessionCookieHeader,
  teamAuthConfigured,
  verifySessionToken,
} from "./lib/teamAuth.js";
import {
  addChestItem,
  deleteChestItem,
  listChest,
  patchChestItem,
} from "./lib/treasureChest.js";
import {
  getMedia,
  listMedia,
  mediaLimits,
  saveUpload,
} from "./lib/mediaStore.js";
import {
  getRegistry,
  matchDraft,
  patchCapability,
  scanClaims,
  toCsv,
} from "./lib/marketingIntelligence.js";
import { buildBrainPack, listIntents } from "./lib/marketingBrain.js";
import { getLesson, renderLessonHtml } from "./lib/lessonPages.js";
import { indexNowKey } from "./lib/indexNow.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CONSOLE_DIR = path.resolve(__dirname, "../dashboard-glassmorphism/src");
const LOGIN_FILE = path.join(__dirname, "views", "login.html");

const app = express();
const PORT = Number(process.env.PORT || 8787);
const HOST = process.env.HOST || "0.0.0.0";
const SESSION_SECRET_MIN = 32;
const RAW_SESSION_SECRET = (process.env.SESSION_SECRET || "").trim();
const SESSION_SECRET = RAW_SESSION_SECRET.length >= SESSION_SECRET_MIN ? RAW_SESSION_SECRET : "";
if (RAW_SESSION_SECRET && !SESSION_SECRET) {
  console.error(`SESSION_SECRET is shorter than ${SESSION_SECRET_MIN} characters — logins are disabled until it is replaced.`);
}

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: false }));

const SERVER_ONLY_JOB_FIELDS = ["videoFilePath", "filePath", "storedName", "absolutePath"];
const JOB_STATUSES = new Set(["draft", "queued", "ready", "sending", "sent", "partial", "failed"]);
const CHANNEL_ID = /^[a-z0-9_-]{1,32}$/;
function stripServerFields(job) {
  if (!job || typeof job !== "object" || Array.isArray(job)) return {};
  const out = { ...job };
  for (const k of SERVER_ONLY_JOB_FIELDS) delete out[k];
  if ("status" in out && !JOB_STATUSES.has(out.status)) delete out.status;
  if ("channels" in out) {
    out.channels = Array.isArray(out.channels)
      ? [...new Set(out.channels.filter((c) => typeof c === "string" && CHANNEL_ID.test(c)))]
      : [];
  }
  return out;
}

const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const LOGIN_MAX_FAILS = 10;
const loginFails = new Map();
function loginBlocked(ip) {
  const row = loginFails.get(ip);
  if (!row) return false;
  if (Date.now() - row.first > LOGIN_WINDOW_MS) {
    loginFails.delete(ip);
    return false;
  }
  return row.count >= LOGIN_MAX_FAILS;
}
function noteLoginFail(ip) {
  const row = loginFails.get(ip);
  if (!row || Date.now() - row.first > LOGIN_WINDOW_MS) loginFails.set(ip, { first: Date.now(), count: 1 });
  else row.count += 1;
}

function currentUser(req) {
  const cookies = parseCookies(req);
  return verifySessionToken(cookies[COOKIE_NAME], SESSION_SECRET);
}

function requireAuth(req, res, next) {
  const user = currentUser(req);
  if (user) {
    req.user = user;
    return next();
  }
  if (req.path.startsWith("/api/")) {
    return res.status(401).json({ error: "login_required" });
  }
  return res.redirect("/login");
}

app.get("/login", (req, res) => {
  if (currentUser(req)) return res.redirect("/");
  res.sendFile(LOGIN_FILE);
});

app.get("/login-art.jpg", (_req, res) => {
  res.sendFile(path.join(__dirname, "views", "login-art.jpg"));
});

app.get("/api/auth/roster", (_req, res) => {
  res.json({ configured: teamAuthConfigured() });
});

app.post("/login", (req, res) => {
  const ip = String(req.headers["x-forwarded-for"] || req.socket.remoteAddress || "").split(",")[0].trim();
  if (loginBlocked(ip)) return res.status(429).send("Too many login attempts. Try again in 15 minutes.");
  const username = String(req.body?.username || "");
  const password = String(req.body?.password || "");
  const user = findUser(username, password);
  if (!user || !SESSION_SECRET) {
    noteLoginFail(ip);
    return res.redirect("/login?error=1");
  }
  loginFails.delete(ip);
  const token = makeSessionToken(user.username, user.role, SESSION_SECRET);
  res.setHeader("Set-Cookie", sessionCookieHeader(token));
  return res.redirect("/");
});

app.get("/logout", (req, res) => {
  res.setHeader("Set-Cookie", clearSessionCookieHeader());
  res.redirect("/login");
});

function envPresent(...names) {
  return names.some((n) => Boolean(String(process.env[n] || "").trim()));
}

// Public health (must stay BEFORE requireAuth — Cloud Shell / uptime probes are unauthenticated)
app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    name: "ClearPath Publisher",
    console: "social-team-private",
    time: new Date().toISOString(),
    teamConfigured: teamAuthConfigured(),
    mediaUpload: true,
    media: mediaLimits(),
    outboundEnabled: outboundEnabled(),
    channels: [],
  });
});

/** Boolean presence only — never returns secret values */
app.get("/api/secrets/status", (_req, res) => {
  res.json({
    service: "clearpath-automation-console",
    note: "true = env name has a value on this running revision. false = missing/empty.",
    secrets: {
      TELEGRAM_BOT_TOKEN: envPresent("TELEGRAM_BOT_TOKEN", "TELEGRAM_TOKEN", "BOT_TOKEN", "SOCIAL_TELEGRAM_BOT_TOKEN"),
      TELEGRAM_CHAT_ID: envPresent(
        "TELEGRAM_CHAT_ID",
        "TELEGRAM_CHAT_TOKEN",
        "TELEGRAM_CHANNEL_ID",
        "TELEGRAM_CHANNEL",
        "CHAT_ID",
        "SOCIAL_TELEGRAM_CHAT_ID",
      ),
      DISCORD_WEBHOOK_URL: envPresent("DISCORD_WEBHOOK_URL", "SOCIAL_DISCORD_WEBHOOK_URL"),
      YOUTUBE_CLIENT_ID: envPresent("YOUTUBE_CLIENT_ID"),
      YOUTUBE_CLIENT_SECRET: envPresent("YOUTUBE_CLIENT_SECRET"),
      YOUTUBE_REFRESH_TOKEN: envPresent("YOUTUBE_REFRESH_TOKEN"),
      META_PAGE_ID: envPresent("META_PAGE_ID", "FACEBOOK_PAGE_ID"),
      META_PAGE_ACCESS_TOKEN: envPresent("META_PAGE_ACCESS_TOKEN", "FACEBOOK_PAGE_ACCESS_TOKEN", "META_ACCESS_TOKEN"),
      META_IG_USER_ID: envPresent("META_IG_USER_ID", "INSTAGRAM_USER_ID"),
      TIKTOK_ACCESS_TOKEN: envPresent("TIKTOK_ACCESS_TOKEN", "TIKTOK_USER_ACCESS_TOKEN"),
      PUBLIC_BASE_URL: envPresent("PUBLIC_BASE_URL"),
      REDDIT_CLIENT_ID: envPresent("REDDIT_CLIENT_ID"),
      REDDIT_SUBREDDIT: envPresent("REDDIT_SUBREDDIT"),
      SESSION_SECRET: envPresent("SESSION_SECRET"),
      TEAM_USERS: envPresent("TEAM_USERS"),
    },
    outboundEnabled: outboundEnabled(),
  });
});

// Public media bytes — Meta/TikTok/Instagram servers must fetch these without a login cookie.
app.get("/media/:id", (req, res) => {
  const media = getMedia(req.params.id);
  if (!media) return res.status(404).json({ error: "media not found" });
  if (media.gcsUrl && !media.filePath) return res.redirect(media.gcsUrl);
  if (!media.filePath) return res.status(404).json({ error: "media file missing" });
  const mime = String(media.mimeType || "");
  const inlineSafe = /^(video|image)\//.test(mime) && mime !== "image/svg+xml";
  res.setHeader("Content-Type", inlineSafe ? mime : "application/octet-stream");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Content-Security-Policy", "sandbox; default-src 'none'");
  res.setHeader(
    "Content-Disposition",
    `${inlineSafe ? "inline" : "attachment"}; filename="${encodeURIComponent(media.originalName || "media")}"`,
  );
  res.sendFile(media.filePath);
});

app.get(`/${indexNowKey()}.txt`, (_req, res) => {
  res.type("text/plain").send(indexNowKey());
});

app.get("/watch/:id", (req, res) => {
  const lesson = getLesson(req.params.id);
  if (!lesson) return res.status(404).type("html").send("<p>Lesson not found.</p>");
  res.type("html").send(renderLessonHtml(lesson));
});

app.use(requireAuth);

app.get("/api/me", (req, res) => {
  res.json({
    username: req.user.username,
    role: req.user.role,
    roster: listPublicRoster(),
  });
});

app.get("/api/channels", async (_req, res) => {
  const dispatch = await loadDispatch();
  res.json(dispatch ? dispatch.channelStatus() : []);
});
app.get("/api/queue", (_req, res) => res.json(loadJobs()));

// ClearPath-hosted media — binary body (not multipart). Headers: X-Filename, Content-Type.
app.get("/api/media", (_req, res) => {
  res.json({ items: listMedia(40), limits: mediaLimits() });
});

function decodeUploadFilename(raw) {
  const s = String(raw || "").trim();
  if (!s) return "";
  try {
    return decodeURIComponent(s);
  } catch {
    return s;
  }
}

app.post(
  "/api/upload",
  express.raw({ type: () => true, limit: `${mediaLimits().maxMb + 2}mb` }),
  async (req, res) => {
    try {
      const buf = Buffer.isBuffer(req.body) ? req.body : Buffer.from(req.body || []);
      const originalName =
        decodeUploadFilename(req.get("x-filename")) ||
        decodeUploadFilename(req.query?.filename) ||
        `upload-${Date.now()}.mp4`;
      const mimeType = req.get("content-type") || "application/octet-stream";
      const record = await saveUpload({
        buffer: buf,
        originalName: String(originalName),
        mimeType,
        uploadedBy: req.user.username,
      });
      res.status(201).json({
        mediaId: record.id,
        fileName: record.originalName,
        videoFilePath: null, // server-internal; resolved at dispatch via mediaId
        videoUrl: record.url,
        mimeType: record.mimeType,
        size: record.size,
        gcsUrl: record.gcsUrl,
      });
    } catch (err) {
      res.status(400).json({ error: String(err.message || err) });
    }
  },
);

app.post("/api/queue", (req, res) => {
  const job = stripServerFields(req.body);
  if (!job?.id || !job?.title) return res.status(400).json({ error: "id and title required" });
  res.status(201).json(
    upsertJob({
      approved: false,
      ...job,
      createdBy: req.user.username,
    }),
  );
});

app.post("/api/queue/sync", (req, res) => {
  const incoming = Array.isArray(req.body?.jobs) ? req.body.jobs.map(stripServerFields) : null;
  if (!incoming) return res.status(400).json({ error: "jobs array required" });
  const existing = new Map(loadJobs().map((j) => [j.id, j]));
  const merged = incoming.map((j) => {
    const prev = existing.get(j.id);
    return prev
      ? {
          ...j,
          approved: prev.approved,
          results: prev.results,
          sentAt: prev.sentAt,
          createdBy: prev.createdBy || j.createdBy,
          status: prev.status === "sent" || prev.status === "partial" ? prev.status : j.status,
        }
      : { approved: false, createdBy: req.user.username, ...j };
  });
  res.json(replaceAll(merged));
});

app.patch("/api/queue/:id", (req, res) => {
  const job = patchJob(req.params.id, stripServerFields(req.body || {}));
  if (!job) return res.status(404).json({ error: "job not found" });
  res.json(job);
});

app.delete("/api/queue/:id", (req, res) => {
  res.json({ deleted: deleteJob(req.params.id) });
});

app.post("/api/queue/:id/approve", (req, res) => {
  const job = patchJob(req.params.id, {
    approved: true,
    approvedBy: req.user.username,
  });
  if (!job) return res.status(404).json({ error: "job not found" });
  res.json(job);
});

app.post("/api/queue/:id/dispatch", async (req, res) => {
  const dispatch = await loadDispatch();
  if (!dispatch) return res.status(503).json({ error: OUTBOUND_DISABLED_ERROR });
  const { dispatchJob, guardrailErrors } = dispatch;
  const job = getJob(req.params.id);
  if (!job) return res.status(404).json({ error: "job not found" });
  const errors = guardrailErrors(job);
  if (errors.length) return res.status(422).json({ error: "guardrails", details: errors });
  patchJob(job.id, { approved: true, status: "sending", approvedBy: req.user.username });
  const { status, results } = await dispatchJob(job);
  res.json(
    patchJob(job.id, {
      status,
      results,
      sentAt: new Date().toISOString(),
      dispatchedBy: req.user.username,
    }),
  );
});

// Shared marketing treasure chest
app.get("/api/treasure", (_req, res) => {
  res.json(listChest());
});

app.post("/api/treasure", (req, res) => {
  if (!String(req.body?.title || "").trim() && !String(req.body?.body || "").trim()) {
    return res.status(400).json({ error: "title or body required" });
  }
  res.status(201).json(addChestItem(req.body || {}, req.user.username));
});

app.patch("/api/treasure/:id", (req, res) => {
  const item = patchChestItem(req.params.id, req.body || {}, req.user.username);
  if (!item) return res.status(404).json({ error: "not found" });
  res.json(item);
});

app.delete("/api/treasure/:id", (req, res) => {
  res.json({ deleted: deleteChestItem(req.params.id) });
});

app.get("/api/intelligence", (_req, res) => {
  res.json(getRegistry());
});

app.patch("/api/intelligence/capabilities/:id", (req, res) => {
  const row = patchCapability(req.params.id, req.body || {}, req.user.username);
  if (!row) return res.status(404).json({ error: "unknown capability" });
  res.json(row);
});

app.post("/api/intelligence/match", (req, res) => {
  const title = String(req.body?.title || "");
  const caption = String(req.body?.caption || "");
  const claims = scanClaims(`${title}\n${caption}`);
  res.json({ ...matchDraft(title, caption), claims });
});

app.get("/api/intelligence/export.json", (_req, res) => {
  const registry = getRegistry();
  res.setHeader("Content-Disposition", "attachment; filename=ClearPathTrader_Marketing_Capabilities.json");
  res.json(registry);
});

app.get("/api/intelligence/export.csv", (_req, res) => {
  const registry = getRegistry();
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", "attachment; filename=ClearPathTrader_Marketing_Capabilities.csv");
  res.send(toCsv(registry.Capabilities));
});

app.get("/api/intelligence/governance.json", (_req, res) => {
  const registry = getRegistry();
  res.setHeader("Content-Disposition", "attachment; filename=ClearPathTrader_Marketing_Governance.json");
  res.json(registry.Governance);
});

app.get("/api/intelligence/brain/intents", (_req, res) => {
  res.json({ intents: listIntents() });
});

app.post("/api/intelligence/brain", (req, res) => {
  const result = buildBrainPack({
    topic: req.body?.topic,
    lesson: req.body?.lesson,
    intent: req.body?.intent,
    mediaKind: req.body?.mediaKind,
  });
  if (!result.ok) {
    return res.status(422).json({ error: "guardrails", claims: result.claims });
  }
  res.json(result.pack);
});

app.use(express.static(CONSOLE_DIR));
app.get("*", (req, res, next) => {
  if (req.path.startsWith("/api/")) return next();
  res.sendFile(path.join(CONSOLE_DIR, "index.html"));
});

app.listen(PORT, HOST, () => {
  console.log(`ClearPath team social console → http://${HOST}:${PORT}`);
  console.log(
    teamAuthConfigured()
      ? `Team auth ON — users: ${listPublicRoster()
          .map((u) => u.username)
          .join(", ")}`
      : "Team auth LOCKED — set TEAM_USERS (or TEAM_OWNER_PASSWORD) + SESSION_SECRET (32+ chars)",
  );
  if (!outboundEnabled()) {
    console.log("Outbound dispatch OFF (ALLOW_OUTBOUND_DISPATCH is not true). Upload and queue only.");
    return;
  }
  loadScheduler().then((scheduler) => scheduler?.startScheduler());
});
