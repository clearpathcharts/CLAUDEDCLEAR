export interface TerminalNewsItem {
  id?: string;
  title: string;
  link: string;
  category: string;
  image: string;
  timestamp: string;
  description: string;
  author: string;
  readTime: string;
  impactScore?: number;
}

export const magazineFeeds = {
  men: [
    "https://www.gq.com/feed/rss",
    "https://www.esquire.com/rss/all.xml/",
    "https://www.maxim.com/feed/"
  ],
  women: [
    "https://www.vogue.com/feed/rss",
    "https://www.elle.com/rss/all.xml/",
    "https://www.cosmopolitan.com/rss/all.xml/"
  ],
  children: [
    "https://kids.nationalgeographic.com/feed/rss",
    "https://kids.scholastic.com/kidspress/feed/"
  ],
  automotive: [
    "https://www.motorsport.com/rss/f1/news/",
    "https://www.motortrend.com/news/rss",
    "https://www.caranddriver.com/rss/all.xml"
  ],
  tech: [
    "https://www.wired.com/feed/rss",
    "https://www.theverge.com/rss/index.xml"
  ]
};

export const globalFinanceFeeds = [
  "https://www.gfmag.com/feed/",
  "https://www.economist.com/rss.xml",
  "https://www.ft.com/rss/home",
  "https://feeds.a.dj.com/rss/RSSMarketsMain.xml",
  "https://feeds.bloomberg.com/markets/news.rss",
  "https://fortune.com/feed/",
  "https://www.institutionalinvestor.com/feed",
  "https://markets.businessinsider.com/rss/news",
  "https://www.worldfinance.com/feed"
];

export const worldFeeds = {
  northAmerica: [
    "https://rss.nytimes.com/services/xml/rss/nyt/HomePage.xml",
    "http://rss.cnn.com/rss/cnn_topstories.rss"
  ],
  europe: [
    "http://feeds.bbci.co.uk/news/rss.xml",
    "https://www.spiegel.de/international/index.rss"
  ],
  asia: [
    "https://www.japantimes.co.jp/feed/",
    "https://www.scmp.com/rss/91/feed"
  ],
  lgbtq: [
    "https://www.out.com/rss.xml",
    "https://www.advocate.com/rss.xml",
    "https://www.thepinknews.com/feed/"
  ]
};

export const politicalFeeds = {
  democrat: [
    "https://rss.nytimes.com/services/xml/rss/nyt/Politics.xml",
    "https://www.msnbc.com/feeds/latest",
    "https://www.theguardian.com/us-news/rss"
  ],
  republican: [
    "http://feeds.foxnews.com/foxnews/politics",
    "https://www.washingtonexaminer.com/tag/politics.rss",
    "https://townhall.com/rss/news"
  ],
  independent: [
    "https://reason.com/feed/",
    "https://www.realclearpolitics.com/index.xml",
    "https://www.reutersagency.com/feed/"
  ]
};

/**
 * RSSService handles market-grade RSS feed ingestion.
 */
export class RSSService {
  /**
   * Fetches an RSS feed.
   */
  static async fetchAndAnalyze(feedUrl: string): Promise<any[]> {
    try {
      const response = await fetch(`/api/rss?url=${encodeURIComponent(feedUrl)}`);
      if (!response.ok) throw new Error('Failed to fetch RSS feed');
      const rawItems = await response.json();

      return rawItems.map((item: any) => ({
        title: item.text || item.title || 'Dynamic Intelligence Signal',
        link: item.link || '#',
        category: 'RSS',
        image: item.image || '',
        timestamp: new Date(item.timestamp || Date.now()).toLocaleTimeString(),
        description: item.description || 'Live RSS intelligence stream.',
        author: item.author || 'System Intel',
        readTime: '3 min'
      }));
    } catch (error: any) {
      console.warn(`[RSS Service] Failed to fetch feed ${feedUrl}:`, error.message || error);
      return [];
    }
  }
}
