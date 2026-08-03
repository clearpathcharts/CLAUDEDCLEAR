export interface EducationalFeed {
  id: string;
  label: string;
  url: string;
  topics: string[];
}

/** Education-oriented public RSS feeds (not trade signal services). */
export const EDUCATIONAL_FEEDS: EducationalFeed[] = [
  {
    id: "npr_business",
    label: "NPR Business",
    url: "https://feeds.npr.org/1006/rss.xml",
    topics: ["macro", "explainers"],
  },
  {
    id: "bbc_business",
    label: "BBC Business",
    url: "https://feeds.bbci.co.uk/news/business/rss.xml",
    topics: ["world", "economy"],
  },
];

export const LISTEN_CONCEPT_HINTS: Record<string, string[]> = {
  inflation: ["wiki_psychology", "wiki_risk_language"],
  rates: ["wiki_timeframes", "wiki_structure"],
  market: ["wiki_candles", "wiki_structure"],
  bank: ["wiki_risk_language"],
  economy: ["wiki_psychology", "wiki_risk_language"],
  chart: ["wiki_candles", "wiki_patterns"],
  indicator: ["wiki_indicators"],
};
