/**
 * TikTok — Content Posting API (direct post when app audit approved).
 * Needs: TIKTOK_ACCESS_TOKEN
 * Optional: TIKTOK_PRIVACY_LEVEL (default SELF_ONLY until audit / PUBLIC_TO_EVERYONE)
 *
 * Prefers FILE_UPLOAD from ClearPath disk (no domain verify).
 * PULL_FROM_URL needs verified domain on TikTok developer portal + public https URL.
 */
import fs from "fs";

const API = "https://open.tiktokapis.com";

function clean(v) {
  return String(v || "").trim();
}

export function tiktokAccessToken() {
  return clean(
    process.env.TIKTOK_ACCESS_TOKEN ||
      process.env.TIKTOK_USER_ACCESS_TOKEN ||
      process.env.SOCIAL_TIKTOK_ACCESS_TOKEN,
  );
}

export function tiktokReady() {
  return Boolean(tiktokAccessToken());
}

function privacyLevel() {
  return clean(process.env.TIKTOK_PRIVACY_LEVEL) || "SELF_ONLY";
}

function publicMediaUrl(job) {
  const u = clean(job?.videoUrl || job?.gcsUrl);
  return u.startsWith("http") ? u : "";
}

async function tiktokJson(path, body) {
  const res = await fetch(`${API}${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${tiktokAccessToken()}`,
      "Content-Type": "application/json; charset=UTF-8",
    },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  const err = data.error || {};
  if (!res.ok || (err.code && err.code !== "ok")) {
    throw new Error(
      `TikTok API: ${err.message || res.status} (${err.code || "http"})`,
    );
  }
  return data.data || data;
}

/**
 * @param {string} caption
 * @param {{ videoFilePath?: string, videoUrl?: string, fileName?: string, mimeType?: string } | null} job
 */
export async function sendTikTok(caption, job = null) {
  if (!tiktokReady()) {
    throw new Error("Missing TIKTOK_ACCESS_TOKEN on Cloud Run");
  }

  const title = String(caption || "").slice(0, 2200);
  const filePath = job?.videoFilePath || "";
  const mediaUrl = publicMediaUrl(job);
  const preferPull = clean(process.env.TIKTOK_USE_PULL_URL).toLowerCase() === "true";

  const postInfo = {
    title,
    privacy_level: privacyLevel(),
    disable_duet: false,
    disable_stitch: false,
    disable_comment: false,
  };

  // FILE_UPLOAD — works without domain verification
  if (filePath && fs.existsSync(filePath) && !preferPull) {
    const buf = fs.readFileSync(filePath);
    const videoSize = buf.length;
    const chunkSize = videoSize;
    const init = await tiktokJson("/v2/post/publish/video/init/", {
      post_info: postInfo,
      source_info: {
        source: "FILE_UPLOAD",
        video_size: videoSize,
        chunk_size: chunkSize,
        total_chunk_count: 1,
      },
    });
    const uploadUrl = init.upload_url;
    const publishId = init.publish_id;
    if (!uploadUrl) throw new Error("TikTok: no upload_url from init");

    const put = await fetch(uploadUrl, {
      method: "PUT",
      headers: {
        "Content-Type": "video/mp4",
        "Content-Range": `bytes 0-${videoSize - 1}/${videoSize}`,
      },
      body: buf,
    });
    if (!put.ok) {
      const t = await put.text().catch(() => "");
      throw new Error(`TikTok upload PUT: ${put.status} ${t.slice(0, 200)}`);
    }
    return { publishId, mode: "file_upload", privacy: privacyLevel() };
  }

  if (mediaUrl) {
    const init = await tiktokJson("/v2/post/publish/video/init/", {
      post_info: postInfo,
      source_info: {
        source: "PULL_FROM_URL",
        video_url: mediaUrl,
      },
    });
    return {
      publishId: init.publish_id,
      mode: "pull_url",
      privacy: privacyLevel(),
      note: "Verify fuckweasel.net URL prefix in TikTok developer portal for PULL_FROM_URL",
    };
  }

  throw new Error(
    "TikTok needs a ClearPath-hosted video file (composer upload) or a public https video URL",
  );
}
