/**
 * Public, indexable lesson pages on fuckweasel.net — this is the "launch onto the site" path.
 * No login. Education only. No flash.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, "..", "data");
const FILE = path.join(DATA_DIR, "lessons.json");
const SITE = (process.env.PUBLIC_BASE_URL || "https://fuckweasel.net").replace(/\/$/, "");

function ensureDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}

function load() {
  ensureDir();
  try {
    const parsed = JSON.parse(fs.readFileSync(FILE, "utf8"));
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function save(rows) {
  ensureDir();
  const tmp = FILE + ".tmp";
  fs.writeFileSync(tmp, JSON.stringify(rows, null, 2), "utf8");
  fs.renameSync(tmp, FILE);
}

function escapeHtml(s) {
  return String(s || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export function publishLesson(job) {
  const id = String(job?.mediaId || job?.id || `lesson_${Date.now()}`).replace(/[^a-zA-Z0-9_-]/g, "");
  const row = {
    id,
    title: String(job?.title || "ClearPath education").slice(0, 120),
    caption: String(job?.caption || "").slice(0, 4000),
    mediaId: job?.mediaId || null,
    videoUrl: job?.videoUrl || (job?.mediaId ? `${SITE}/media/${job.mediaId}` : ""),
    createdAt: new Date().toISOString(),
  };
  const rows = load().filter((r) => r.id !== id);
  row.url = `${SITE}/watch/${encodeURIComponent(id)}`;
  rows.unshift(row);
  save(rows.slice(0, 200));
  return row;
}

export function getLesson(id) {
  return load().find((r) => r.id === String(id || "")) || null;
}

export function renderLessonHtml(lesson) {
  const title = escapeHtml(lesson.title);
  const caption = escapeHtml(lesson.caption).replaceAll("\n", "<br>");
  const media = lesson.mediaId ? `/media/${encodeURIComponent(lesson.mediaId)}` : escapeHtml(lesson.videoUrl || "");
  const isVideo = /\.(mp4|webm|mov|mkv)(\?|$)/i.test(lesson.videoUrl || lesson.mediaId || "") || Boolean(lesson.mediaId);
  const player = isVideo && media
    ? `<video controls playsinline preload="metadata" src="${media}"></video>`
    : media
      ? `<img alt="${title}" src="${media}" />`
      : "";
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${title} | ClearPath Trader</title>
  <meta name="description" content="${escapeHtml(String(lesson.caption || "").slice(0, 155))}" />
  <link rel="canonical" href="${escapeHtml(lesson.url || `${SITE}/watch/${lesson.id}`)}" />
  <script type="application/ld+json">${JSON.stringify({
    "@context": "https://schema.org",
    "@type": "VideoObject",
    name: lesson.title,
    description: String(lesson.caption || "").slice(0, 400),
    thumbnailUrl: `${SITE}/watch/${lesson.id}`,
    uploadDate: lesson.createdAt,
    publisher: { "@type": "Organization", name: "ClearPath Trader", url: "https://clearpathtrader.com" },
  })}</script>
  <style>
    body { margin:0; font-family: Georgia, serif; background:#070a14; color:#f4f6ff; line-height:1.5; }
    main { max-width: 720px; margin: 0 auto; padding: 24px 16px 64px; }
    video, img { width:100%; background:#000; }
    a { color:#7ecbff; }
    .truth { color:#9aa3c2; font-size:0.9rem; }
  </style>
</head>
<body>
  <main>
    <p class="truth">ClearPath Trader — market education. Not a brokerage.</p>
    <h1>${title}</h1>
    ${player}
    <p>${caption}</p>
    <p><a href="https://clearpathtrader.com">Learn more at clearpathtrader.com</a></p>
  </main>
</body>
</html>`;
}
