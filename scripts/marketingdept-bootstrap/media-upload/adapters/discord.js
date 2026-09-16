/**
 * Discord — direct webhook. No middleman.
 * Needs: DISCORD_WEBHOOK_URL (Server Settings → Integrations → Webhooks)
 * Attaches ClearPath-hosted files when videoFilePath is present — no YouTube required.
 */
import fs from "fs";

export function discordReady() {
  return Boolean(process.env.DISCORD_WEBHOOK_URL);
}

/**
 * @param {string} text
 * @param {{ videoFilePath?: string, fileName?: string, mimeType?: string } | null} media
 */
export async function sendDiscord(text, media = null) {
  const url = process.env.DISCORD_WEBHOOK_URL;
  const filePath = media?.videoFilePath;
  if (filePath && fs.existsSync(filePath)) {
    const buf = fs.readFileSync(filePath);
    // Discord webhook attachment soft limit ~8–25MB depending on server boost; fail clearly.
    if (buf.length > 24 * 1024 * 1024) {
      throw new Error(
        "Discord attachment too large (>24MB). Host on ClearPath media URL in caption, or compress the file.",
      );
    }
    const form = new FormData();
    form.append("content", text.slice(0, 2000));
    form.append(
      "files[0]",
      new Blob([buf], { type: media.mimeType || "application/octet-stream" }),
      media.fileName || "clearpath-media.bin",
    );
    const res = await fetch(url, { method: "POST", body: form });
    if (!res.ok && res.status !== 204) {
      const body = await res.text().catch(() => "");
      throw new Error(`Discord webhook file: ${res.status} ${body.slice(0, 200)}`);
    }
    return { delivered: true, mode: "file" };
  }

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content: text.slice(0, 2000) }),
  });
  if (!res.ok && res.status !== 204) {
    const body = await res.text().catch(() => "");
    throw new Error(`Discord webhook: ${res.status} ${body.slice(0, 200)}`);
  }
  return { delivered: true, mode: "text" };
}
