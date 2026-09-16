/** Economic news item from the live wire (not fabricated calendar rows). */
export interface EconomicNewsItem {
  title: string;
  source: string;
  category?: string;
  pubDate?: string;
  link?: string;
  description?: string;
}

/**
 * Economic news — real headlines only via `/api/economic/news`.
 * Never invents CPI/NFP/Fed calendar rows or confidence scores.
 */
export async function fetchEconomicNews(): Promise<EconomicNewsItem[]> {
  try {
    const res = await fetch('/api/economic/news');
    if (!res.ok) return [];
    const data = await res.json();
    if (!Array.isArray(data)) return [];
    return data
      .map((item: Record<string, unknown>) => ({
        title: String(item.title ?? ''),
        source: String(item.source ?? item.source_id ?? 'Wire'),
        category: item.category ? String(item.category) : undefined,
        pubDate: item.pubDate
          ? String(item.pubDate)
          : item.published_at
            ? String(item.published_at)
            : undefined,
        link: item.link ? String(item.link) : item.url ? String(item.url) : undefined,
        description: item.description ? String(item.description) : undefined,
      }))
      .filter((n) => n.title.trim().length > 0);
  } catch {
    return [];
  }
}

/** @deprecated Prefer fetchEconomicNews — kept for call sites that still import the old name. */
export async function fetchEconomicCalendar(): Promise<EconomicNewsItem[]> {
  return fetchEconomicNews();
}
