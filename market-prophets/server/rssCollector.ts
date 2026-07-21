import RSSParser from "rss-parser";
import { MARKET_FEEDS, type RawFeedItem } from "./feeds";

const parser = new RSSParser({
  timeout: 10_000,
  headers: { "User-Agent": "MarketProphets/1.0 (+https://marketprophets.io)" },
});

function stripHtml(value: string | undefined): string | null {
  if (!value) return null;
  return value.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 280) || null;
}

export async function collectFeedItems(maxPerFeed = 6): Promise<RawFeedItem[]> {
  const items: RawFeedItem[] = [];

  await Promise.all(
    MARKET_FEEDS.map(async (feed) => {
      try {
        const parsed = await parser.parseURL(feed.url);
        const slice = (parsed.items ?? []).slice(0, maxPerFeed);
        for (const item of slice) {
          const title = (item.title ?? "").trim();
          const link = (item.link ?? item.guid ?? "").trim();
          if (!title || !link) continue;
          items.push({
            id: `${feed.id}-${Buffer.from(link).toString("base64url").slice(0, 16)}`,
            source: feed.name,
            sourceId: feed.id,
            category: feed.category,
            title,
            link,
            publishedAt: item.isoDate ?? item.pubDate ?? null,
            snippet: stripHtml(item.contentSnippet ?? item.content),
          });
        }
      } catch (err) {
        console.warn(`[RSS] Failed ${feed.name}:`, err instanceof Error ? err.message : err);
      }
    })
  );

  return items
    .sort((a, b) => {
      const ta = a.publishedAt ? Date.parse(a.publishedAt) : 0;
      const tb = b.publishedAt ? Date.parse(b.publishedAt) : 0;
      return tb - ta;
    })
    .slice(0, 30);
}
