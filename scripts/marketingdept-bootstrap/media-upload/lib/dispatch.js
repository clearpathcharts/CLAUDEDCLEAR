/**
 * Fan-out dispatch: sends one job to every selected channel using direct APIs.
 * Channels without direct API access yet (Meta review, LinkedIn approval) are
 * reported as "bridge" — they still go out via the Cursor confirmation flow.
 * ClearPath-hosted media (mediaId / videoFilePath) is preferred over YouTube links.
 */
import { telegramReady, sendTelegram } from "../adapters/telegram.js";
import { discordReady, sendDiscord } from "../adapters/discord.js";
import { redditReady, sendReddit } from "../adapters/reddit.js";
import { youtubeReady, sendYouTube } from "../adapters/youtube.js";
import { resolveMediaForJob } from "./mediaStore.js";

const FOOTER =
  "\n\nClearPath Trader — market education for calm learning.\nNot a brokerage. https://clearpathtrader.com";

// Direct API pending platform approval — until then these ship via Cursor bridge.
const BRIDGE_CHANNELS = new Set([
  "facebook",
  "instagram",
  "linkedin",
  "whatsapp",
  "wechat",
  "tiktok",
  "douyin",
  "snapchat",
  "lemon8",
  "mastodon",
]);

export function channelStatus() {
  return [
    { id: "telegram", name: "Telegram", mode: "direct", ready: telegramReady(), needs: "TELEGRAM_BOT_TOKEN + TELEGRAM_CHAT_ID" },
    { id: "discord", name: "Discord", mode: "direct", ready: discordReady(), needs: "DISCORD_WEBHOOK_URL" },
    { id: "reddit", name: "Reddit", mode: "direct", ready: redditReady(), needs: "REDDIT_CLIENT_ID/SECRET/USERNAME/PASSWORD/SUBREDDIT" },
    { id: "youtube", name: "YouTube", mode: "direct", ready: youtubeReady(), needs: "YOUTUBE_CLIENT_ID/SECRET/REFRESH_TOKEN + ClearPath file upload" },
    { id: "facebook", name: "Facebook", mode: "bridge", ready: false, needs: "Meta Graph API app review (bridge via Cursor until then)" },
    { id: "instagram", name: "Instagram", mode: "bridge", ready: false, needs: "Meta Graph API app review (bridge via Cursor until then)" },
    { id: "linkedin", name: "LinkedIn", mode: "bridge", ready: false, needs: "LinkedIn API approval (bridge via Cursor until then)" },
    { id: "whatsapp", name: "WhatsApp", mode: "bridge", ready: false, needs: "WhatsApp Business API" },
    { id: "wechat", name: "WeChat", mode: "bridge", ready: false, needs: "WeChat Official Account" },
    { id: "tiktok", name: "TikTok", mode: "bridge", ready: false, needs: "TikTok Content Posting API" },
    { id: "douyin", name: "Douyin", mode: "bridge", ready: false, needs: "Douyin Open Platform" },
    { id: "snapchat", name: "Snapchat", mode: "bridge", ready: false, needs: "Snap Kit" },
    { id: "lemon8", name: "Lemon8", mode: "bridge", ready: false, needs: "No public API yet" },
    { id: "mastodon", name: "Mastodon", mode: "bridge", ready: false, needs: "MASTODON_INSTANCE + ACCESS_TOKEN (easy add)" },
  ];
}

function composeText(job, { attachUrl = true } = {}) {
  const parts = [job.title, "", job.caption];
  if (attachUrl && job.videoUrl && !job.videoFilePath) parts.push("", job.videoUrl);
  else if (attachUrl && job.videoUrl && job.videoUrl.startsWith("http")) parts.push("", job.videoUrl);
  parts.push(FOOTER.trimEnd());
  return parts.join("\n");
}

function composeCaption(job) {
  // Used when the platform gets the file as an attachment — skip duplicating a bare path URL.
  const parts = [job.title, "", job.caption];
  if (job.videoUrl && String(job.videoUrl).startsWith("http")) parts.push("", job.videoUrl);
  parts.push(FOOTER.trimEnd());
  return parts.join("\n");
}

export function guardrailErrors(job) {
  const errors = [];
  const calm = job.calm ?? job.calmConfirmed;
  const edu = job.educationOnly ?? job.educationOnlyConfirmed;
  if (!calm) errors.push("Calm/no-flash check not confirmed");
  if (!edu) errors.push("Education-only check not confirmed");
  if (!job.title?.trim() || !job.caption?.trim()) errors.push("Title and caption required");
  if (!Array.isArray(job.channels) || !job.channels.length) errors.push("No channels selected");
  return errors;
}

export async function dispatchJob(job) {
  const media = resolveMediaForJob(job);
  const enriched = { ...job, ...media };
  const textOnly = composeText(enriched, { attachUrl: true });
  const captionWithFile = composeCaption(enriched);
  const results = [];

  for (const id of job.channels) {
    const started = new Date().toISOString();
    try {
      if (id === "telegram") {
        if (!telegramReady()) throw new Error("Missing TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID in .env");
        const r = await sendTelegram(
          enriched.videoFilePath ? captionWithFile : textOnly,
          enriched.videoFilePath ? enriched : null,
        );
        results.push({ channel: id, ok: true, mode: "direct", detail: r, at: started });
      } else if (id === "discord") {
        if (!discordReady()) throw new Error("Missing DISCORD_WEBHOOK_URL in .env");
        const r = await sendDiscord(
          enriched.videoFilePath ? captionWithFile : textOnly,
          enriched.videoFilePath ? enriched : null,
        );
        results.push({ channel: id, ok: true, mode: "direct", detail: r, at: started });
      } else if (id === "reddit") {
        if (!redditReady()) throw new Error("Missing REDDIT_* credentials in .env");
        const link =
          enriched.videoUrl && String(enriched.videoUrl).startsWith("http")
            ? enriched.videoUrl
            : null;
        const r = await sendReddit(enriched.title, `${enriched.caption}${FOOTER}`, link);
        results.push({ channel: id, ok: true, mode: "direct", detail: r, at: started });
      } else if (id === "youtube") {
        if (!youtubeReady()) throw new Error("Missing YOUTUBE_* credentials in .env");
        const r = await sendYouTube(enriched, `${enriched.caption}${FOOTER}`);
        results.push({ channel: id, ok: true, mode: "direct", detail: r, at: started });
      } else if (BRIDGE_CHANNELS.has(id)) {
        results.push({
          channel: id,
          ok: false,
          mode: "bridge",
          skipped: true,
          error: "Direct API pending platform approval — send via Cursor bridge package",
          at: started,
        });
      } else {
        results.push({ channel: id, ok: false, skipped: true, error: "Unknown channel", at: started });
      }
    } catch (err) {
      results.push({ channel: id, ok: false, mode: "direct", error: String(err.message || err), at: started });
    }
  }

  const sent = results.filter((r) => r.ok).length;
  const attempted = results.filter((r) => !r.skipped).length;
  let status = "failed";
  if (sent > 0 && sent === results.length) status = "sent";
  else if (sent > 0) status = "partial";
  else if (attempted === 0) status = "ready"; // everything was bridge-only

  return { status, results };
}
