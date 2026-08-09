/**
 * Fan-out dispatch: sends one job to every selected channel using direct APIs.
 * Money channels (YouTube / Facebook / Instagram / TikTok) are wired when Cloud Run
 * credentials are present. Remaining platforms stay bridge until approved + keyed.
 * ClearPath-hosted media (mediaId / videoFilePath) is preferred over external links.
 */
import { telegramReady, sendTelegram } from "../adapters/telegram.js";
import { discordReady, sendDiscord } from "../adapters/discord.js";
import { redditReady, sendReddit } from "../adapters/reddit.js";
import { youtubeReady, sendYouTube } from "../adapters/youtube.js";
import { facebookReady, sendFacebook } from "../adapters/facebook.js";
import { instagramReady, sendInstagram } from "../adapters/instagram.js";
import { tiktokReady, sendTikTok } from "../adapters/tiktok.js";
import { resolveMediaForJob } from "./mediaStore.js";

const FOOTER =
  "\n\nClearPath Trader — market education for calm learning.\nNot a brokerage. https://clearpathtrader.com";

// Still waiting on platform API / partnership — not coded as direct send yet.
const BRIDGE_CHANNELS = new Set([
  "linkedin",
  "whatsapp",
  "wechat",
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
    {
      id: "youtube",
      name: "YouTube",
      mode: "direct",
      ready: youtubeReady(),
      needs: "YOUTUBE_CLIENT_ID + YOUTUBE_CLIENT_SECRET + YOUTUBE_REFRESH_TOKEN + ClearPath file upload",
    },
    {
      id: "facebook",
      name: "Facebook",
      mode: "direct",
      ready: facebookReady(),
      needs: "META_PAGE_ID + META_PAGE_ACCESS_TOKEN (App Review: pages_manage_posts)",
    },
    {
      id: "instagram",
      name: "Instagram",
      mode: "direct",
      ready: instagramReady(),
      needs: "META_IG_USER_ID + META_PAGE_ACCESS_TOKEN + PUBLIC_BASE_URL (App Review: instagram_content_publish)",
    },
    {
      id: "tiktok",
      name: "TikTok",
      mode: "direct",
      ready: tiktokReady(),
      needs: "TIKTOK_ACCESS_TOKEN (Content Posting API audit) + ClearPath file upload",
    },
    { id: "linkedin", name: "LinkedIn", mode: "bridge", ready: false, needs: "LinkedIn API approval (pending — not Dispatch-ready yet)" },
    { id: "whatsapp", name: "WhatsApp", mode: "bridge", ready: false, needs: "WhatsApp Business API" },
    { id: "wechat", name: "WeChat", mode: "bridge", ready: false, needs: "WeChat Official Account" },
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
        if (!telegramReady()) {
          throw new Error("Missing TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID (Cloud Run → Variables & secrets)");
        }
        const r = await sendTelegram(
          enriched.videoFilePath ? captionWithFile : textOnly,
          enriched.videoFilePath ? enriched : null,
        );
        results.push({ channel: id, ok: true, mode: "direct", detail: r, at: started });
      } else if (id === "discord") {
        if (!discordReady()) {
          throw new Error("Missing DISCORD_WEBHOOK_URL (Cloud Run → Variables & secrets)");
        }
        const r = await sendDiscord(
          enriched.videoFilePath ? captionWithFile : textOnly,
          enriched.videoFilePath ? enriched : null,
        );
        results.push({ channel: id, ok: true, mode: "direct", detail: r, at: started });
      } else if (id === "reddit") {
        if (!redditReady()) {
          throw new Error("Missing REDDIT_* credentials (Cloud Run → Variables & secrets)");
        }
        const link =
          enriched.videoUrl && String(enriched.videoUrl).startsWith("http")
            ? enriched.videoUrl
            : null;
        const r = await sendReddit(enriched.title, `${enriched.caption}${FOOTER}`, link);
        results.push({ channel: id, ok: true, mode: "direct", detail: r, at: started });
      } else if (id === "youtube") {
        if (!youtubeReady()) {
          throw new Error("Missing YOUTUBE_* credentials (Cloud Run → Variables & secrets)");
        }
        const r = await sendYouTube(enriched, `${enriched.caption}${FOOTER}`);
        results.push({ channel: id, ok: true, mode: "direct", detail: r, at: started });
      } else if (id === "facebook") {
        if (!facebookReady()) {
          throw new Error("Missing META_PAGE_ID / META_PAGE_ACCESS_TOKEN (Cloud Run → Variables & secrets)");
        }
        const r = await sendFacebook(
          enriched.videoFilePath || enriched.videoUrl ? captionWithFile : textOnly,
          enriched,
        );
        results.push({ channel: id, ok: true, mode: "direct", detail: r, at: started });
      } else if (id === "instagram") {
        if (!instagramReady()) {
          throw new Error("Missing META_IG_USER_ID / META_PAGE_ACCESS_TOKEN (Cloud Run → Variables & secrets)");
        }
        const r = await sendInstagram(captionWithFile, enriched);
        results.push({ channel: id, ok: true, mode: "direct", detail: r, at: started });
      } else if (id === "tiktok") {
        if (!tiktokReady()) {
          throw new Error("Missing TIKTOK_ACCESS_TOKEN (Cloud Run → Variables & secrets)");
        }
        const r = await sendTikTok(captionWithFile, enriched);
        results.push({ channel: id, ok: true, mode: "direct", detail: r, at: started });
      } else if (BRIDGE_CHANNELS.has(id)) {
        results.push({
          channel: id,
          ok: false,
          mode: "bridge",
          skipped: true,
          error: "Direct API pending platform approval — keep queued until this channel is wired in ClearPath Publisher",
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
