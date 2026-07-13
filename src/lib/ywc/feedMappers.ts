import type { YwcFeedCategory } from '../../data/ywcFeedSources';

export interface YwcNewsCard {
  id: string;
  category: YwcFeedCategory | string;
  subcategory: string;
  title: string;
  premium: boolean;
  source: string;
  image: string;
  time: string;
  desc: string;
  longText: string;
  link?: string;
}

export interface YwcDigestApiItem {
  id: string;
  text: string;
  link: string;
  description: string;
  timestamp: number;
  image: string | null;
  source: string;
  category: YwcFeedCategory;
  author?: string;
}

const CATEGORY_LABELS: Record<YwcFeedCategory, string> = {
  sports: 'Sports Desk',
  news: 'World Desk',
  finance: 'Markets Desk',
  crypto: 'Digital Assets',
  politics: 'Policy Desk',
  tech: 'Technology',
  magazine: 'Magazine Edit',
  relief: 'Humanitarian',
};

const FALLBACK_IMAGES: Record<YwcFeedCategory, string> = {
  sports: 'https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&q=80&w=600',
  news: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&q=80&w=600',
  finance: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&q=80&w=600',
  crypto: 'https://images.unsplash.com/photo-1516245834210-c4c142787335?auto=format&fit=crop&q=80&w=600',
  politics: 'https://images.unsplash.com/photo-1541872703-74c5e44368f9?auto=format&fit=crop&q=80&w=600',
  tech: 'https://images.unsplash.com/photo-1593508512255-86ab42a8e620?auto=format&fit=crop&q=80&w=600',
  magazine: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&q=80&w=600',
  relief: 'https://images.unsplash.com/photo-1469571486040-0b3b279a74dd?auto=format&fit=crop&q=80&w=600',
};

function formatFeedTime(timestamp: number): string {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return 'Just now';

  const diffMs = Date.now() - date.getTime();
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  if (hours < 1) return 'Just now';
  if (hours < 24) return `${hours}h ago`;
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

export function digestItemToNewsCard(item: YwcDigestApiItem): YwcNewsCard {
  const category = item.category;
  return {
    id: `rss-${item.id}`,
    category,
    subcategory: CATEGORY_LABELS[category] || 'Live Feed',
    title: item.text,
    premium: category === 'finance' || category === 'crypto',
    source: item.source,
    image: item.image || FALLBACK_IMAGES[category],
    time: formatFeedTime(item.timestamp),
    desc: item.description.slice(0, 220),
    longText: item.description,
    link: item.link,
  };
}

export function pickDigestItem(
  items: YwcDigestApiItem[],
  category?: YwcFeedCategory,
  sourceIncludes?: string
): YwcDigestApiItem | null {
  const filtered = items.filter((item) => {
    if (category && item.category !== category) return false;
    if (sourceIncludes && !item.source.toLowerCase().includes(sourceIncludes.toLowerCase())) {
      return false;
    }
    return true;
  });
  return filtered[0] ?? null;
}
