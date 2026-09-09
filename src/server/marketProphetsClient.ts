/**
 * Read-only client for the Market Prophets daily brief (marketprophets.io).
 * Wired into the CEO overnight structure review + email digest.
 */

export type MarketProphetsBriefSummary = {
  editionDate: string;
  headline: string;
  summary: string;
  bullets: string[];
  traderLens?: string;
  watchToday?: string[];
  url: string;
  source: "live" | "unavailable";
};

export function marketProphetsBaseUrl(): string {
  return (process.env.MARKET_PROPHETS_URL || "https://marketprophets.io").replace(/\/$/, "");
}

export function marketProphetsBriefUrl(editionDate: string): string {
  return `${marketProphetsBaseUrl()}/brief/${editionDate}`;
}

type BriefApiPayload = {
  editionDate?: string;
  headline?: string;
  summary?: string;
  bullets?: string[];
  traderLens?: string;
  watchToday?: string[];
};

export async function fetchMarketProphetsBrief(
  fetchImpl: typeof fetch = fetch,
): Promise<MarketProphetsBriefSummary | null> {
  const base = marketProphetsBaseUrl();
  const timeoutMs = Number(process.env.MARKET_PROPHETS_TIMEOUT_MS || 8000);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetchImpl(`${base}/api/briefs/latest`, {
      signal: controller.signal,
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return null;
    const body = (await res.json()) as BriefApiPayload;
    const editionDate = String(body.editionDate || "").trim();
    const headline = String(body.headline || "").trim();
    if (!editionDate || !headline) return null;
    return {
      editionDate,
      headline,
      summary: String(body.summary || "").trim(),
      bullets: Array.isArray(body.bullets) ? body.bullets.map(String).filter(Boolean).slice(0, 8) : [],
      traderLens: body.traderLens ? String(body.traderLens) : undefined,
      watchToday: Array.isArray(body.watchToday) ? body.watchToday.map(String).slice(0, 6) : undefined,
      url: marketProphetsBriefUrl(editionDate),
      source: "live",
    };
  } catch (err) {
    console.info(
      "[DailyPatternReview] Market Prophets brief unavailable:",
      err instanceof Error ? err.message : err,
    );
    return null;
  } finally {
    clearTimeout(timer);
  }
}
