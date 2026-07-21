import crypto from 'node:crypto';
import RSSParser from 'rss-parser';
import { getPodcastIndexCredentials } from './secrets';

const podcastParser = new RSSParser({
  customFields: {
    item: ['itunes:duration', 'itunes:image'],
  },
});

export interface PodcastEpisode {
  id: string;
  title: string;
  description: string;
  audioUrl: string;
  publishedAt: string;
  duration?: string;
  imageUrl?: string;
  showTitle?: string;
  feedUrl: string;
}

export interface PodcastSearchHit {
  id: number;
  title: string;
  author?: string;
  description?: string;
  feedUrl: string;
  image?: string;
}

function podcastIndexHeaders(): Record<string, string> | null {
  const { key: apiKey, secret: apiSecret } = getPodcastIndexCredentials();
  if (!apiKey || !apiSecret) return null;

  const apiHeaderTime = Math.floor(Date.now() / 1000);
  const hash = crypto.createHash('sha1').update(`${apiKey}${apiSecret}${apiHeaderTime}`).digest('hex');

  return {
    'X-Auth-Date': String(apiHeaderTime),
    'X-Auth-Key': apiKey,
    Authorization: hash,
    'User-Agent': 'ClearPathTrader/1.0',
  };
}

export async function fetchEpisodesFromFeed(feedUrl: string, limit = 12): Promise<PodcastEpisode[]> {
  const feed = await podcastParser.parseURL(feedUrl);
  const items = (feed.items ?? []).slice(0, limit);

  return items
    .map((item, index) => {
      const enclosure = item.enclosure;
      const audioUrl = enclosure?.url;
      if (!audioUrl || !audioUrl.startsWith('http')) return null;

      const itunesImage = (item as { itunes?: { image?: string }; 'itunes:image'?: string })['itunes:image']
        || (item as { itunes?: { image?: string } }).itunes?.image;

      return {
        id: item.guid || item.link || `${feedUrl}-${index}`,
        title: item.title || 'Untitled episode',
        description: item.contentSnippet || item.content || '',
        audioUrl,
        publishedAt: item.pubDate || new Date().toISOString(),
        duration: (item as { itunes?: { duration?: string }; 'itunes:duration'?: string })['itunes:duration'],
        imageUrl: itunesImage || feed.image?.url,
        showTitle: feed.title,
        feedUrl,
      } as PodcastEpisode;
    })
    .filter((ep): ep is PodcastEpisode => ep !== null);
}

export type PodcastSearchSource = 'podcastindex' | 'itunes';

async function searchPodcastsViaItunes(term: string, max = 20): Promise<PodcastSearchHit[]> {
  const url = `https://itunes.apple.com/search?term=${encodeURIComponent(term)}&media=podcast&entity=podcast&limit=${max}`;
  const res = await fetch(url, { headers: { 'User-Agent': 'ClearPathTrader/1.0' } });
  if (!res.ok) {
    throw new Error(`Apple podcast search failed (${res.status})`);
  }

  const data = (await res.json()) as {
    results?: Array<{
      collectionId: number;
      collectionName?: string;
      artistName?: string;
      feedUrl?: string;
      artworkUrl600?: string;
      artworkUrl100?: string;
    }>;
  };

  return (data.results ?? [])
    .filter((r) => r.feedUrl?.startsWith('http'))
    .map((r) => ({
      id: r.collectionId,
      title: r.collectionName || 'Untitled podcast',
      author: r.artistName,
      feedUrl: r.feedUrl!,
      image: r.artworkUrl600 || r.artworkUrl100,
    }));
}

async function searchPodcastsViaIndex(term: string, max = 20): Promise<PodcastSearchHit[]> {
  const headers = podcastIndexHeaders();
  if (!headers) {
    return [];
  }

  const url = `https://api.podcastindex.org/api/1.0/search/byterm?q=${encodeURIComponent(term)}&max=${max}`;
  const res = await fetch(url, { headers });
  if (!res.ok) {
    throw new Error(`Podcast Index search failed (${res.status})`);
  }

  const data = (await res.json()) as {
    feeds?: Array<{
      id: number;
      title: string;
      author?: string;
      description?: string;
      url: string;
      image?: string;
    }>;
  };

  return (data.feeds ?? []).map((f) => ({
    id: f.id,
    title: f.title,
    author: f.author,
    description: f.description,
    feedUrl: f.url,
    image: f.image,
  }));
}

export async function searchPodcastsByTerm(
  term: string,
  max = 20
): Promise<{ results: PodcastSearchHit[]; source: PodcastSearchSource }> {
  if (podcastIndexConfigured()) {
    const results = await searchPodcastsViaIndex(term, max);
    return { results, source: 'podcastindex' };
  }

  const results = await searchPodcastsViaItunes(term, max);
  return { results, source: 'itunes' };
}

export function podcastIndexConfigured(): boolean {
  const { key, secret } = getPodcastIndexCredentials();
  return Boolean(key && secret);
}
