/**
 * Telegram — direct Bot API. No middleman.
 * Needs: TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID (channel like @clearpathtraderfreeaccount or numeric id)
 * Sends ClearPath-hosted video/image files when videoFilePath is present — no YouTube required.
 */
import fs from "fs";

export function telegramReady() {
  return Boolean(process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID);
}

async function sendTelegramText(token, chatId, text) {
  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text: text.slice(0, 4096),
      disable_web_page_preview: false,
    }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok || body.ok === false) {
    throw new Error(`Telegram: ${body.description || res.status}`);
  }
  return { messageId: body.result?.message_id, mode: "text" };
}

/**
 * @param {string} text caption / message
 * @param {{ videoFilePath?: string, fileName?: string, mimeType?: string } | null} media
 */
export async function sendTelegram(text, media = null) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  const filePath = media?.videoFilePath;
  if (!filePath || !fs.existsSync(filePath)) {
    return sendTelegramText(token, chatId, text);
  }

  const buf = fs.readFileSync(filePath);
  const name = media.fileName || "clearpath-media.bin";
  const mime = media.mimeType || "application/octet-stream";
  const isVideo = mime.startsWith("video/") || /\.(mp4|mov|webm|mkv|m4v)$/i.test(name);
  const isPhoto = mime.startsWith("image/") || /\.(jpg|jpeg|png|gif|webp)$/i.test(name);
  // Bot API: sendVideo ~50MB practical; larger files go as document
  const method = isPhoto ? "sendPhoto" : isVideo && buf.length < 49 * 1024 * 1024 ? "sendVideo" : "sendDocument";
  const field = method === "sendPhoto" ? "photo" : method === "sendVideo" ? "video" : "document";

  const form = new FormData();
  form.append("chat_id", chatId);
  form.append("caption", text.slice(0, 1024));
  form.append(field, new Blob([buf], { type: mime }), name);

  const res = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: "POST",
    body: form,
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok || body.ok === false) {
    throw new Error(`Telegram ${method}: ${body.description || res.status}`);
  }
  return { messageId: body.result?.message_id, mode: method };
}
