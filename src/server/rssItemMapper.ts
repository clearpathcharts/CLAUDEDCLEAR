export interface MappedRssItem {
  id: string;
  text: string;
  link: string;
  description: string;
  timestamp: number;
  image: string | null;
  author?: string;
}

const IMG_SRC_RE = /<img[^>]+src=["']([^"']+)["']/i;

export function extractRssImage(item: Record<string, unknown>): string | null {
  const enclosure = item.enclosure as { url?: string; type?: string } | undefined;
  if (enclosure?.url && (!enclosure.type || enclosure.type.startsWith('image'))) {
    return enclosure.url;
  }

  const mediaContent = item['media:content'] as { $?: { url?: string } } | undefined;
  if (mediaContent?.$?.url) return mediaContent.$.url;

  const mediaThumbnail = item['media:thumbnail'] as { $?: { url?: string } } | undefined;
  if (mediaThumbnail?.$?.url) return mediaThumbnail.$.url;

  const content =
    (item['content:encoded'] as string | undefined) ||
    (item.content as string | undefined) ||
    (item.summary as string | undefined) ||
    '';
  const match = content.match(IMG_SRC_RE);
  return match?.[1] ?? null;
}

export function mapRssItem(item: Record<string, unknown>, index: number): MappedRssItem {
  const pubDate = item.pubDate || item.isoDate;
  const timestamp = pubDate ? new Date(String(pubDate)).getTime() : Date.now();
  const link = String(item.link || item.guid || '#');
  const id = String(item.guid || item.id || link || index);

  return {
    id,
    text: String(item.title || 'Untitled'),
    link,
    description: String(
      item.contentSnippet || item.summary || item.description || 'Live RSS intelligence stream.'
    ),
    timestamp: Number.isFinite(timestamp) ? timestamp : Date.now(),
    image: extractRssImage(item),
    author: item.creator ? String(item.creator) : item.author ? String(item.author) : undefined,
  };
}
