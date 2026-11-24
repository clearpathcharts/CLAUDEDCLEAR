/**
 * Telegram — direct Bot API. No middleman.
 * Canonical: TELEGRAM_BOT_TOKEN + TELEGRAM_CHAT_ID
 * Also accepts common aliases founders type in Cloud Run by mistake.
 */
import fs from "fs";

function firstEnv(...names) {
  for (const name of names) {
    const v = String(process.env[name] || "").trim();
    if (v) return v;
  }
  return "";
}

/** Bot token — several names people use in Cloud Run UI */
export function telegramBotToken() {
  return firstEnv(
    "TELEGRAM_BOT_TOKEN",
    "TELEGRAM_TOKEN",
    "BOT_TOKEN",
    "SOCIAL_TELEGRAM_BOT_TOKEN",
  );
}

/** Chat/channel id — CHAT_TOKEN is a common mis-name for CHAT_ID */
export function telegramChatId() {
  return firstEnv(
    "TELEGRAM_CHAT_ID",
    "TELEGRAM_CHAT_TOKEN",
    "TELEGRAM_CHANNEL_ID",
    "TELEGRAM_CHANNEL",
    "CHAT_ID",
    "SOCIAL_TELEGRAM_CHAT_ID",
  );
}

export function telegramReady() {
  return Boolean(telegramBotToken() && telegramChatId());
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
  const token = telegramBotToken();
  const chatId = telegramChatId();
  if (!token || !chatId) {
    throw new Error(
      "Missing Telegram credentials on Cloud Run (need bot token + chat id). Check Variables & secrets names.",
    );
  }
  const filePath = media?.videoFilePath;
  if (!filePath || !fs.existsSync(filePath)) {
    return sendTelegramText(token, chatId, text);
  }

  const buf = fs.readFileSync(filePath);
  const name = media.fileName || "clearpath-media.bin";
  const mime = media.mimeType || "application/octet-stream";
  const isVideo = mime.startsWith("video/") || /\.(mp4|mov|webm|mkv|m4v)$/i.test(name);
  const isPhoto = mime.startsWith("image/") || /\.(jpg|jpeg|png|gif|webp)$/i.test(name);
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
