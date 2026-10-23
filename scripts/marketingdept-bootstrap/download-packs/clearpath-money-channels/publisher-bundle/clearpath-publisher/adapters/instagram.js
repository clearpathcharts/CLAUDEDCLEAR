/**
 * Instagram (Professional / Business) — Graph Content Publishing.
 * Needs: META_IG_USER_ID + META_PAGE_ACCESS_TOKEN (Page token with IG permissions)
 * Media must be a public https URL (ClearPath /media/:id or GCS).
 *
 * Production usually needs Meta App Review: instagram_content_publish (+ related).
 */
const GRAPH = "https://graph.facebook.com/v21.0";

function clean(v) {
  return String(v || "").trim();
}

export function instagramUserId() {
  return clean(process.env.META_IG_USER_ID || process.env.INSTAGRAM_USER_ID);
}

export function instagramToken() {
  return clean(
    process.env.META_PAGE_ACCESS_TOKEN ||
      process.env.INSTAGRAM_ACCESS_TOKEN ||
      process.env.META_ACCESS_TOKEN,
  );
}

export function instagramReady() {
  return Boolean(instagramUserId() && instagramToken());
}

function publicMediaUrl(job) {
  const u = clean(job?.videoUrl || job?.gcsUrl);
  return u.startsWith("http") ? u : "";
}

async function graphPost(path, params) {
  const body = new URLSearchParams({ ...params, access_token: instagramToken() });
  const res = await fetch(`${GRAPH}${path}`, { method: "POST", body });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.error) {
    throw new Error(
      `Instagram Graph: ${data.error?.message || res.status} (${data.error?.code || "http"})`,
    );
  }
  return data;
}

async function graphGet(path, params = {}) {
  const url = new URL(`${GRAPH}${path}`);
  url.searchParams.set("access_token", instagramToken());
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, String(v));
  const res = await fetch(url);
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.error) {
    throw new Error(
      `Instagram Graph: ${data.error?.message || res.status} (${data.error?.code || "http"})`,
    );
  }
  return data;
}

async function waitForContainer(creationId, attempts = 24) {
  for (let i = 0; i < attempts; i++) {
    const st = await graphGet(`/${creationId}`, { fields: "status_code,status" });
    const code = String(st.status_code || "").toUpperCase();
    if (code === "FINISHED" || code === "PUBLISHED") return st;
    if (code === "ERROR" || code === "EXPIRED") {
      throw new Error(`Instagram container failed: ${st.status || code}`);
    }
    await new Promise((r) => setTimeout(r, 2500));
  }
  throw new Error("Instagram container still processing — retry Dispatch in a minute");
}

/**
 * @param {string} caption
 * @param {{ videoUrl?: string, mimeType?: string, fileName?: string } | null} job
 */
export async function sendInstagram(caption, job = null) {
  if (!instagramReady()) {
    throw new Error("Missing META_IG_USER_ID / META_PAGE_ACCESS_TOKEN on Cloud Run");
  }
  const mediaUrl = publicMediaUrl(job);
  if (!mediaUrl) {
    throw new Error(
      "Instagram needs a public https media URL. Upload in composer and set PUBLIC_BASE_URL=https://fuckweasel.net (or GCS).",
    );
  }

  const igUser = instagramUserId();
  const mime = clean(job?.mimeType);
  const isImage = mime.startsWith("image/") || /\.(jpe?g|png|gif|webp)$/i.test(job?.fileName || "");
  const captionText = String(caption || "").slice(0, 2200);

  let creation;
  if (isImage) {
    creation = await graphPost(`/${igUser}/media`, {
      image_url: mediaUrl,
      caption: captionText,
    });
  } else {
    // Reels / video — Meta fetches the public URL
    creation = await graphPost(`/${igUser}/media`, {
      media_type: "REELS",
      video_url: mediaUrl,
      caption: captionText,
      share_to_feed: "true",
    });
  }

  const creationId = creation.id;
  if (!creationId) throw new Error("Instagram: no creation_id from container create");
  await waitForContainer(creationId);

  const published = await graphPost(`/${igUser}/media_publish`, {
    creation_id: creationId,
  });
  return { id: published.id, creationId, mode: isImage ? "image" : "reels" };
}
