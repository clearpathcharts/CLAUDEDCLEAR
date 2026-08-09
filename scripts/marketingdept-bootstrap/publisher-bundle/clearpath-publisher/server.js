/**
 * ClearPath Publisher + Automation Console (social-only)
 * Founder login (single owner account via TEAM_USERS)
 * Shared marketing treasure chest for all authenticated users
 * NO Zapier / Buffer / Make / CrewAI — never commit secrets
 */
import "dotenv/config";
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { loadJobs, getJob, upsertJob, patchJob, deleteJob, replaceAll } from "./lib/store.js";
import { dispatchJob, guardrailErrors, channelStatus } from "./lib/dispatch.js";
import { telegramReady, telegramBotToken, telegramChatId } from "./adapters/telegram.js";
import { startScheduler } from "./lib/scheduler.js";
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

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CONSOLE_DIR = path.resolve(__dirname, "../dashboard-glassmorphism/src");
const LOGIN_FILE = path.join(__dirname, "views", "login.html");

const app = express();
const PORT = Number(process.env.PORT || 8787);
const HOST = process.env.HOST || "0.0.0.0";
const SESSION_SECRET = (process.env.SESSION_SECRET || "").trim();

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: false }));

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

app.get("/api/auth/roster", (_req, res) => {
  res.json({
    configured: teamAuthConfigured(),
    users: listPublicRoster().map((u) => u.username),
  });
});

app.post("/login", (req, res) => {
  const username = String(req.body?.username || "");
  const password = String(req.body?.password || "");
  const user = findUser(username, password);
  if (!user || !SESSION_SECRET) {
    return res.redirect("/login?error=1");
  }
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
    telegramReady: telegramReady(),
    channels: channelStatus(),
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
      SESSION_SECRET: envPresent("SESSION_SECRET"),
      TEAM_USERS: envPresent("TEAM_USERS"),
    },
    resolved: {
      telegramReady: telegramReady(),
      telegramTokenFound: Boolean(telegramBotToken()),
      telegramChatFound: Boolean(telegramChatId()),
      discordReady: Boolean(String(process.env.DISCORD_WEBHOOK_URL || process.env.SOCIAL_DISCORD_WEBHOOK_URL || "").trim()),
    },
  });
});

app.use(requireAuth);

app.get("/api/me", (req, res) => {
  res.json({
    username: req.user.username,
    role: req.user.role,
    roster: listPublicRoster(),
  });
});

app.get("/api/channels", (_req, res) => res.json(channelStatus()));
app.get("/api/queue", (_req, res) => res.json(loadJobs()));

// ClearPath-hosted media — binary body (not multipart). Headers: X-Filename, Content-Type.
app.get("/api/media", (_req, res) => {
  res.json({ items: listMedia(40), limits: mediaLimits() });
});

app.post(
  "/api/upload",
  express.raw({ type: () => true, limit: `${mediaLimits().maxMb + 2}mb` }),
  async (req, res) => {
    try {
      const buf = Buffer.isBuffer(req.body) ? req.body : Buffer.from(req.body || []);
      const originalName =
        req.get("x-filename") ||
        req.query?.filename ||
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

app.get("/media/:id", (req, res) => {
  const media = getMedia(req.params.id);
  if (!media) return res.status(404).json({ error: "media not found" });
  if (media.gcsUrl && !media.filePath) return res.redirect(media.gcsUrl);
  if (!media.filePath) return res.status(404).json({ error: "media file missing" });
  res.setHeader("Content-Type", media.mimeType || "application/octet-stream");
  res.setHeader(
    "Content-Disposition",
    `inline; filename="${encodeURIComponent(media.originalName || "media")}"`,
  );
  res.sendFile(media.filePath);
});

app.post("/api/queue", (req, res) => {
  const job = req.body;
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
  const incoming = Array.isArray(req.body?.jobs) ? req.body.jobs : null;
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
  const job = patchJob(req.params.id, req.body || {});
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
      : "Team auth LOCKED — set TEAM_USERS (or TEAM_OWNER_PASSWORD) + SESSION_SECRET",
  );
  const ready = channelStatus()
    .filter((c) => c.ready)
    .map((c) => c.name);
  console.log(
    ready.length
      ? `Direct channels ready: ${ready.join(", ")}`
      : "No direct channels configured yet.",
  );
  startScheduler();
});
