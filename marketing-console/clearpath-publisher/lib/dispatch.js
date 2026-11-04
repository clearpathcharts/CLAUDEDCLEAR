/**
 * Dispatch: YouTube + Reddit + Facebook Page, and always launch a public
 * lesson URL for Google/Bing (IndexNow). No other social networks.
 */
import { redditReady, sendReddit } from "../adapters/reddit.js";
import { youtubeReady, sendYouTube } from "../adapters/youtube.js";
import { facebookReady, sendFacebook } from "../adapters/facebook.js";
import { resolveMediaForJob } from "./mediaStore.js";
import { scanClaims } from "./marketingIntelligence.js";
import { publishLesson } from "./lessonPages.js";
import { pingIndexNow } from "./indexNow.js";

const FOOTER =
  "\n\nClearPath Trader — market education for calm learning.\nNot a brokerage. https://clearpathtrader.com";

export function channelStatus() {
  return [
    {
      id: "youtube",
      name: "YouTube",
      mode: "direct",
      ready: youtubeReady(),
      needs: "YOUTUBE_CLIENT_ID + YOUTUBE_CLIENT_SECRET + YOUTUBE_REFRESH_TOKEN + MP4 upload",
    },
    {
      id: "reddit",
      name: "Reddit",
      mode: "direct",
      ready: redditReady(),
      needs: "REDDIT_CLIENT_ID/SECRET/USERNAME/PASSWORD/SUBREDDIT",
    },
    {
      id: "facebook",
      name: "Facebook Page",
      mode: "direct",
      ready: facebookReady(),
      needs: "META_PAGE_ID + META_PAGE_ACCESS_TOKEN",
    },
    {
      id: "google",
      name: "Google (site + IndexNow)",
      mode: "direct",
      ready: true,
      needs: "Public /watch page — hardwired on Dispatch",
    },
    {
      id: "bing",
      name: "Bing (IndexNow)",
      mode: "direct",
      ready: true,
      needs: "Same public /watch page",
    },
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
  const claims = scanClaims(`${job.title || ""}\n${job.caption || ""}`);
  for (const hit of claims) {
    errors.push(`ClaimRule: ${hit.reason} (“${hit.snippet}”). Only verified first-party facts may publish.`);
  }
  return errors;
}

export async function dispatchJob(job) {
  const media = resolveMediaForJob(job);
  const enriched = { ...job, ...media };
  const textOnly = composeText(enriched, { attachUrl: true });
  const captionWithFile = composeCaption(enriched);
  const results = [];

  const startedSite = new Date().toISOString();
  try {
    const lesson = publishLesson(enriched);
    enriched.lessonUrl = lesson.url;
    const ping = await pingIndexNow(lesson.url);
    results.push({
      channel: "google",
      ok: true,
      mode: "indexnow",
      detail: { url: lesson.url, bing: ping, note: "Public lesson page live. Add fuckweasel.net in Google Search Console." },
      at: startedSite,
    });
    results.push({
      channel: "bing",
      ok: ping.ok,
      mode: "indexnow",
      detail: { url: lesson.url, ping },
      at: startedSite,
    });
  } catch (err) {
    results.push({ channel: "google", ok: false, error: String(err.message || err), at: startedSite });
  }

  const launch = [...new Set((job.channels || []).filter((id) => id === "youtube" || id === "reddit" || id === "facebook"))];
  for (const id of launch) {
    const started = new Date().toISOString();
    try {
      if (id === "reddit") {
        if (!redditReady()) {
          throw new Error("Missing REDDIT_* credentials (Cloud Run → Variables & secrets)");
        }
        const link =
          enriched.lessonUrl ||
          (enriched.videoUrl && String(enriched.videoUrl).startsWith("http") ? enriched.videoUrl : null);
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
