/**
 * ClearPath-hosted media — upload once, dispatch to channels without YouTube.
 * Local disk for immediate Bot/API sends; optional GCS for Cloud Run persistence.
 */
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, "..", "data");
const UPLOAD_DIR = path.join(DATA_DIR, "uploads");
const INDEX_FILE = path.join(DATA_DIR, "media-index.json");

const ALLOWED_EXT = new Set([
  ".mp4",
  ".mov",
  ".webm",
  ".mkv",
  ".m4v",
  ".avi",
  ".jpg",
  ".jpeg",
  ".png",
  ".gif",
  ".webp",
  ".pdf",
]);

const MIME_BY_EXT = {
  ".mp4": "video/mp4",
  ".mov": "video/quicktime",
  ".webm": "video/webm",
  ".mkv": "video/x-matroska",
  ".m4v": "video/x-m4v",
  ".avi": "video/x-msvideo",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".pdf": "application/pdf",
};

function maxBytes() {
  const mb = Number(process.env.MEDIA_MAX_MB || 28);
  return Math.max(1, Math.min(mb, 512)) * 1024 * 1024;
}

function ensureDirs() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

function loadIndex() {
  ensureDirs();
  try {
    const parsed = JSON.parse(fs.readFileSync(INDEX_FILE, "utf8"));
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveIndex(items) {
  ensureDirs();
  const tmp = INDEX_FILE + ".tmp";
  fs.writeFileSync(tmp, JSON.stringify(items, null, 2), "utf8");
  fs.renameSync(tmp, INDEX_FILE);
}

function safeExt(name) {
  const ext = path.extname(String(name || "")).toLowerCase();
  return ALLOWED_EXT.has(ext) ? ext : "";
}

function guessMime(name, provided) {
  if (provided && provided !== "application/octet-stream") return provided;
  return MIME_BY_EXT[safeExt(name)] || "application/octet-stream";
}

function publicBase() {
  return String(process.env.PUBLIC_BASE_URL || "").replace(/\/$/, "");
}

async function gcsAccessToken() {
  const res = await fetch(
    "http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/token",
    { headers: { "Metadata-Flavor": "Google" } },
  );
  if (!res.ok) return null;
  const data = await res.json().catch(() => ({}));
  return data.access_token || null;
}

async function uploadToGcs(buffer, objectName, mimeType) {
  const bucket = (process.env.GCS_MEDIA_BUCKET || "").trim();
  if (!bucket) return null;
  const token = await gcsAccessToken();
  if (!token) {
    console.warn("[media] GCS_MEDIA_BUCKET set but metadata token unavailable — keeping local only");
    return null;
  }
  const url =
    `https://storage.googleapis.com/upload/storage/v1/b/${encodeURIComponent(bucket)}` +
    `/o?uploadType=media&name=${encodeURIComponent(objectName)}`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": mimeType,
    },
    body: buffer,
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`GCS upload failed: ${res.status} ${body.slice(0, 200)}`);
  }
  const publicUrl =
    (process.env.GCS_PUBLIC_BASE || "").replace(/\/$/, "") ||
    `https://storage.googleapis.com/${bucket}`;
  return `${publicUrl}/${objectName}`;
}

export function mediaLimits() {
  return {
    maxBytes: maxBytes(),
    maxMb: Math.round(maxBytes() / (1024 * 1024)),
    allowedExt: [...ALLOWED_EXT],
    gcsBucket: Boolean((process.env.GCS_MEDIA_BUCKET || "").trim()),
  };
}

export function getMedia(id) {
  const item = loadIndex().find((m) => m.id === id);
  if (!item) return null;
  const filePath = path.join(UPLOAD_DIR, item.storedName);
  if (!fs.existsSync(filePath) && !item.gcsUrl) return null;
  return {
    ...item,
    filePath: fs.existsSync(filePath) ? filePath : null,
  };
}

export function resolveMediaForJob(job) {
  if (!job?.mediaId) {
    return {
      videoFilePath: job?.videoFilePath || null,
      fileName: job?.fileName || null,
      videoUrl: job?.videoUrl || null,
      mimeType: job?.mimeType || null,
      mediaId: null,
    };
  }
  const media = getMedia(job.mediaId);
  if (!media) {
    return {
      videoFilePath: job.videoFilePath || null,
      fileName: job.fileName || null,
      videoUrl: job.videoUrl || null,
      mimeType: job.mimeType || null,
      mediaId: job.mediaId,
    };
  }
  const relativeUrl = `/media/${media.id}`;
  const absolute = media.gcsUrl || (publicBase() ? `${publicBase()}${relativeUrl}` : relativeUrl);
  return {
    mediaId: media.id,
    videoFilePath: media.filePath || job.videoFilePath || null,
    fileName: media.originalName || job.fileName || null,
    videoUrl: job.videoUrl || absolute,
    mimeType: media.mimeType || job.mimeType || null,
    size: media.size,
  };
}

export async function saveUpload({ buffer, originalName, mimeType, uploadedBy }) {
  ensureDirs();
  const ext = safeExt(originalName);
  if (!ext) {
    throw new Error(
      `Unsupported file type. Allowed: ${[...ALLOWED_EXT].join(", ")}`,
    );
  }
  if (!buffer?.length) throw new Error("Empty file");
  if (buffer.length > maxBytes()) {
    throw new Error(
      `File too large (${Math.round(buffer.length / (1024 * 1024))}MB). Max ${Math.round(maxBytes() / (1024 * 1024))}MB. Raise MEDIA_MAX_MB or use GCS for larger files.`,
    );
  }

  const id = `media_${crypto.randomBytes(8).toString("hex")}`;
  const storedName = `${id}${ext}`;
  const filePath = path.join(UPLOAD_DIR, storedName);
  fs.writeFileSync(filePath, buffer);

  const mime = guessMime(originalName, mimeType);
  let gcsUrl = null;
  try {
    gcsUrl = await uploadToGcs(buffer, `clearpath-media/${storedName}`, mime);
  } catch (err) {
    console.warn("[media]", err.message || err);
  }

  const relativeUrl = `/media/${id}`;
  const record = {
    id,
    originalName: path.basename(String(originalName || storedName)),
    storedName,
    mimeType: mime,
    size: buffer.length,
    uploadedBy: uploadedBy || "unknown",
    createdAt: new Date().toISOString(),
    gcsUrl,
    url: gcsUrl || (publicBase() ? `${publicBase()}${relativeUrl}` : relativeUrl),
  };

  const items = loadIndex();
  items.unshift(record);
  saveIndex(items.slice(0, 500));
  return record;
}

export function listMedia(limit = 50) {
  return loadIndex().slice(0, limit);
}
