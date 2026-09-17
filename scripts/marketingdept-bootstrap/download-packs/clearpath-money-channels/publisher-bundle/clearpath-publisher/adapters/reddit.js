/**
 * Reddit — direct API with a free "script" app (reddit.com/prefs/apps).
 * Needs: REDDIT_CLIENT_ID, REDDIT_CLIENT_SECRET, REDDIT_USERNAME, REDDIT_PASSWORD, REDDIT_SUBREDDIT
 */
const USER_AGENT = "clearpath-publisher/1.0 (education posts; by u/clearpathtrader)";

export function redditReady() {
  return Boolean(
    process.env.REDDIT_CLIENT_ID &&
      process.env.REDDIT_CLIENT_SECRET &&
      process.env.REDDIT_USERNAME &&
      process.env.REDDIT_PASSWORD &&
      process.env.REDDIT_SUBREDDIT,
  );
}

async function getToken() {
  const auth = Buffer.from(
    `${process.env.REDDIT_CLIENT_ID}:${process.env.REDDIT_CLIENT_SECRET}`,
  ).toString("base64");
  const body = new URLSearchParams({
    grant_type: "password",
    username: process.env.REDDIT_USERNAME,
    password: process.env.REDDIT_PASSWORD,
  });
  const res = await fetch("https://www.reddit.com/api/v1/access_token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent": USER_AGENT,
    },
    body,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.access_token) {
    throw new Error(`Reddit auth: ${data.error || res.status}`);
  }
  return data.access_token;
}

export async function sendReddit(title, text, videoUrl) {
  const token = await getToken();
  const isLink = Boolean(videoUrl);
  const body = new URLSearchParams({
    sr: process.env.REDDIT_SUBREDDIT,
    title: title.slice(0, 300),
    kind: isLink ? "link" : "self",
    api_type: "json",
    ...(isLink ? { url: videoUrl } : { text }),
  });
  const res = await fetch("https://oauth.reddit.com/api/submit", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent": USER_AGENT,
    },
    body,
  });
  const data = await res.json().catch(() => ({}));
  const errors = data?.json?.errors;
  if (!res.ok || (Array.isArray(errors) && errors.length)) {
    throw new Error(`Reddit submit: ${JSON.stringify(errors || res.status)}`);
  }
  return { url: data?.json?.data?.url || null };
}
