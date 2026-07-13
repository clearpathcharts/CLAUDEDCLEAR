export type YwcFeedCategory =
  | 'sports'
  | 'news'
  | 'finance'
  | 'crypto'
  | 'politics'
  | 'tech'
  | 'magazine'
  | 'relief';

export interface YwcFeedSource {
  url: string;
  source: string;
  category: YwcFeedCategory;
  limit: number;
}

/** Curated RSS endpoints refreshed server-side every 6 hours. */
export const YWC_FEED_SOURCES: YwcFeedSource[] = [
  { url: 'https://www.espn.com/espn/rss/news', source: 'ESPN', category: 'sports', limit: 5 },
  { url: 'https://www.formula1.com/en/latest/all.xml', source: 'Formula 1', category: 'sports', limit: 4 },
  { url: 'https://www.nascar.com/feed/', source: 'NASCAR', category: 'sports', limit: 3 },
  { url: 'https://feeds.bbci.co.uk/news/world/rss.xml', source: 'BBC World', category: 'news', limit: 6 },
  { url: 'https://rss.nytimes.com/services/xml/rss/nyt/HomePage.xml', source: 'NY Times', category: 'news', limit: 5 },
  { url: 'http://rss.cnn.com/rss/cnn_topstories.rss', source: 'CNN', category: 'news', limit: 5 },
  { url: 'https://feeds.bloomberg.com/markets/news.rss', source: 'Bloomberg', category: 'finance', limit: 6 },
  { url: 'https://feeds.a.dj.com/rss/RSSMarketsMain.xml', source: 'WSJ Markets', category: 'finance', limit: 5 },
  { url: 'https://www.coindesk.com/arc/outboundfeeds/rss/', source: 'CoinDesk', category: 'crypto', limit: 6 },
  { url: 'https://rss.nytimes.com/services/xml/rss/nyt/Politics.xml', source: 'NY Times Politics', category: 'politics', limit: 5 },
  { url: 'http://feeds.foxnews.com/foxnews/politics', source: 'Fox Politics', category: 'politics', limit: 4 },
  { url: 'https://www.wired.com/feed/rss', source: 'Wired', category: 'tech', limit: 5 },
  { url: 'https://www.theverge.com/rss/index.xml', source: 'The Verge', category: 'tech', limit: 5 },
  { url: 'https://www.caranddriver.com/rss/all.xml/', source: 'Car & Driver', category: 'magazine', limit: 5 },
  { url: 'https://www.motortrend.com/rss/', source: 'Motor Trend', category: 'magazine', limit: 4 },
  { url: 'https://reliefweb.int/updates/rss.xml', source: 'ReliefWeb', category: 'relief', limit: 8 },
];

export const YWC_DIGEST_CACHE_TTL_MS = 6 * 60 * 60 * 1000; // refresh at most every 6 hours
