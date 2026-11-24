/**
 * Facebook Page — Graph API direct post (money channel).
 * Needs: META_PAGE_ID + META_PAGE_ACCESS_TOKEN
 * Optional: META_APP_ID (for resumable upload path)
 *
 * Production posting usually needs Meta App Review:
 * pages_manage_posts, pages_read_engagement, pages_show_list (+ publish_video for video).
 */
import fs from "fs";

const GRAPH = "https://graph.facebook.com/v21.0";

function clean(v) {
  return String(v || "").trim();
}

export function facebookPageId() {
  return clean(process.env.META_PAGE_ID || process.env.FACEBOOK_PAGE_ID);
}

export function facebookPageToken() {
  return clean(
    process.env.META_PAGE_ACCESS_TOKEN ||
      process.env.FACEBOOK_PAGE_ACCESS_TOKEN ||
      process.env.META_ACCESS_TOKEN,
  );
}

export function facebookReady() {
  return Boolean(facebookPageId() && facebookPageToken());
}

function publicMediaUrl(job) {
  const u = clean(job?.videoUrl || job?.gcsUrl);
  return u.startsWith("http") ? u : "";
}

async function graphPost(path, params) {
  const url = new URL(`${GRAPH}${path}`);
  const body = new URLSearchParams({ ...params, access_token: facebookPageToken() });
  const res = await fetch(url, { method: "POST", body });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.error) {
    throw new Error(
      `Facebook Graph: ${data.error?.message || res.status} (${data.error?.code || "http"})`,
    );
  }
  return data;
}

/**
 * @param {string} text
 * @param {{ videoFilePath?: string, fileName?: string, mimeType?: string, videoUrl?: string, title?: string } | null} job
 */
export async function sendFacebook(text, job = null) {
  if (!facebookReady()) {
    throw new Error("Missing META_PAGE_ID / META_PAGE_ACCESS_TOKEN on Cloud Run");
  }

  const pageId = facebookPageId();
  const filePath = job?.videoFilePath || "";
  const mime = clean(job?.mimeType);
  const isImage = mime.startsWith("image/");
  const isVideo = mime.startsWith("video/") || /\.(mp4|mov|webm|mkv)$/i.test(job?.fileName || "");
  const mediaUrl = publicMediaUrl(job);
  const message = String(text || "").slice(0, 8000);
  const title = String(job?.title || "").slice(0, 255);

  if (isImage && mediaUrl) {
    const data = await graphPost(`/${pageId}/photos`, { url: mediaUrl, caption: message });
    return { id: data.id || data.post_id, mode: "photo_url" };
  }

  if (isVideo && mediaUrl) {
    const data = await graphPost(`/${pageId}/videos`, {
      file_url: mediaUrl,
      title: title || "ClearPath education",
      description: message,
    });
    return { id: data.id, mode: "video_url" };
  }

  if (isVideo && filePath && fs.existsSync(filePath)) {
    // Chunked upload fallback when no public URL (Cloud Run disk only).
    const buf = fs.readFileSync(filePath);
    const start = await graphPost(`/${pageId}/videos`, {
      upload_phase: "start",
      file_size: String(buf.length),
    });
    const uploadSessionId = start.upload_session_id;
    if (!uploadSessionId) throw new Error("Facebook video: no upload_session_id");

    const form = new FormData();
    form.append("access_token", facebookPageToken());
    form.append("upload_phase", "transfer");
    form.append("upload_session_id", String(uploadSessionId));
    form.append("start_offset", "0");
    form.append(
      "video_file_chunk",
      new Blob([buf], { type: mime || "video/mp4" }),
      job?.fileName || "clearpath.mp4",
    );
    const transferRes = await fetch(`${GRAPH}/${pageId}/videos`, { method: "POST", body: form });
    const transferData = await transferRes.json().catch(() => ({}));
    if (!transferRes.ok || transferData.error) {
      throw new Error(
        `Facebook video transfer: ${transferData.error?.message || transferRes.status}`,
      );
    }

    const finish = await graphPost(`/${pageId}/videos`, {
      upload_phase: "finish",
      upload_session_id: String(uploadSessionId),
      title: title || "ClearPath education",
      description: message,
    });
    return { id: finish.id || uploadSessionId, mode: "video_chunk" };
  }

  // Text / link post
  const params = { message };
  if (mediaUrl) params.link = mediaUrl;
  const data = await graphPost(`/${pageId}/feed`, params);
  return { id: data.id, mode: mediaUrl ? "link" : "text" };
}
