/**
 * YouTube — direct Data API v3 upload with your own OAuth app.
 * Needs: YOUTUBE_CLIENT_ID, YOUTUBE_CLIENT_SECRET, YOUTUBE_REFRESH_TOKEN
 * Job must include a real local file path in videoFilePath (or fileName that exists on disk).
 * Uploads default to UNLISTED so you can review before making public.
 */
import fs from "fs";

export function youtubeReady() {
  return Boolean(
    process.env.YOUTUBE_CLIENT_ID &&
      process.env.YOUTUBE_CLIENT_SECRET &&
      process.env.YOUTUBE_REFRESH_TOKEN,
  );
}

async function getAccessToken() {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.YOUTUBE_CLIENT_ID,
      client_secret: process.env.YOUTUBE_CLIENT_SECRET,
      refresh_token: process.env.YOUTUBE_REFRESH_TOKEN,
      grant_type: "refresh_token",
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.access_token) {
    throw new Error(`YouTube auth: ${data.error_description || data.error || res.status}`);
  }
  return data.access_token;
}

export async function sendYouTube(job, description) {
  const filePath = job.videoFilePath || "";
  if (!filePath || !fs.existsSync(filePath)) {
    throw new Error(
      "YouTube needs a ClearPath-hosted upload — use the composer file picker (or set videoFilePath to a server path).",
    );
  }

  const token = await getAccessToken();
  const metadata = {
    snippet: {
      title: job.title.slice(0, 100),
      description: description.slice(0, 4900),
      categoryId: "27", // Education
    },
    status: {
      privacyStatus: process.env.YOUTUBE_PRIVACY || "unlisted",
      selfDeclaredMadeForKids: false,
    },
  };

  const startRes = await fetch(
    "https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json; charset=UTF-8",
      },
      body: JSON.stringify(metadata),
    },
  );
  if (!startRes.ok) {
    const body = await startRes.text().catch(() => "");
    throw new Error(`YouTube upload init: ${startRes.status} ${body.slice(0, 300)}`);
  }
  const uploadUrl = startRes.headers.get("location");
  if (!uploadUrl) throw new Error("YouTube upload init: no upload URL returned");

  const fileBuffer = fs.readFileSync(filePath);
  const uploadRes = await fetch(uploadUrl, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "video/*",
      "Content-Length": String(fileBuffer.length),
    },
    body: fileBuffer,
  });
  const data = await uploadRes.json().catch(() => ({}));
  if (!uploadRes.ok || !data.id) {
    throw new Error(`YouTube upload: ${data.error?.message || uploadRes.status}`);
  }
  return { videoId: data.id, url: `https://youtu.be/${data.id}`, privacy: metadata.status.privacyStatus };
}
