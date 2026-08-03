export type FeedSource = {
  id: string;
  name: string;
  url: string;
  category: "macro" | "markets" | "crypto" | "policy";
};

/** Public RSS feeds — summarize + link only; do not republish full article text. */
export const MARKET_FEEDS: FeedSource[] = [
  {
    id: "fed",
    name: "Federal Reserve",
    url: "https://www.federalreserve.gov/feeds/press_all.xml",
    category: "macro",
  },
  {
    id: "sec",
    name: "SEC Press Releases",
    url: "https://www.sec.gov/news/pressreleases.rss",
    category: "policy",
  },
  {
    id: "coindesk",
    name: "CoinDesk",
    url: "https://www.coindesk.com/arc/outboundfeeds/rss/",
    category: "crypto",
  },
  {
    id: "investing",
    name: "Investing.com News",
    url: "https://www.investing.com/rss/news.rss",
    category: "markets",
  },
];

export type RawFeedItem = {
  id: string;
  source: string;
  sourceId: string;
  category: FeedSource["category"];
  title: string;
  link: string;
  publishedAt: string | null;
  snippet: string | null;
};
