/**
 * IndexNow — tell Bing / Yandex / participating engines a URL is live.
 * Google still wants Search Console; this is the free ping we can hardwire.
 */
const KEY = String(process.env.INDEXNOW_KEY || "clearpath-fw-indexnow-01").replace(/[^a-zA-Z0-9-]/g, "");
const HOST = String(process.env.PUBLIC_BASE_URL || "https://fuckweasel.net").replace(/^https?:\/\//, "").replace(/\/$/, "");

export function indexNowKey() {
  return KEY;
}

export async function pingIndexNow(url) {
  const target = String(url || "").trim();
  if (!target.startsWith("http")) return { ok: false, error: "no url" };
  const body = {
    host: HOST,
    key: KEY,
    keyLocation: `https://${HOST}/${KEY}.txt`,
    urlList: [target],
  };
  try {
    const res = await fetch("https://api.indexnow.org/indexnow", {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify(body),
    });
    return { ok: res.ok || res.status === 202, status: res.status };
  } catch (err) {
    return { ok: false, error: String(err.message || err) };
  }
}
