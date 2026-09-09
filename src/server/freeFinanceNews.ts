/**
 * Basic overnight headlines from free public RSS + optional FMP wire.
 * Never invents titles. A dead feed stays empty.
 */

import RSSParser from "rss-parser";
import { fetchFmpDeskNews, type DeskWireItem } from "./fmpNewsWire";

export type FreeNewsItem = {
  title: string;
  source: string;
  link?: string;
  pubDate?: string;
};

export type FreeNewsFeed = {
  id: string;
  name: string;
  url: string;
};

/** Allowlisted HTTPS RSS only — publisher feeds, not scraping. */
export const FREE_FINANCE_NEWS_FEEDS: FreeNewsFeed[] = [
  {
    id: "bbc-business",
    name: "BBC Business",
    url: "https://feeds.bbci.co.uk/news/business/rss.xml",
  },
  {
    id: "wsj-markets",
    name: "WSJ Markets",
    url: "https://feeds.a.dj.com/rss/RSSMarketsMain.xml",
  },
  {
    id: "bloomberg-markets",
    name: "Bloomberg Markets",
    url: "https://feeds.bloomberg.com/markets/news.rss",
  },
  {
    id: "business-insider",
    name: "Business Insider Markets",
    url: "https://markets.businessinsider.com/rss/news",
  },
  {
    id: "cnbc-top",
    name: "CNBC Top News",
    url: "https://search.cnbc.com/rs/search/combinedcms/view.xml?partnerId=wrss01&id=100003114",
  },
  {
    id: "fed-press",
    name: "Federal Reserve Press",
    url: "https://www.federalreserve.gov/feeds/press_all.xml",
  },
];

const parser = new RSSParser({ timeout: 7000 });
const FETCH_MS = 7000;
const PER_FEED = 4;
const MAX_ITEMS = 24;

function isHttps(url: string): boolean {
  try {
    return new URL(url).protocol === "https:";
  } catch {
    return false;
  }
}

async function fetchFeedXml(url: string): Promise<string> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), FETCH_MS);
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: {
        "User-Agent": "ClearPathTrader/1.0 (+https://clearpathtrader.com)",
        Accept: "application/rss+xml, application/atom+xml, application/xml, text/xml",
      },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const xml = await res.text();
    if (/^\s*<!DOCTYPE html/i.test(xml) || /^\s*<html/i.test(xml)) {
      throw new Error("feed returned HTML");
    }
    return xml;
  } finally {
    clearTimeout(timer);
  }
}

function itemsFromParsed(
  source: string,
  items: Array<Record<string, unknown>>,
): FreeNewsItem[] {
  const out: FreeNewsItem[] = [];
  for (const row of items) {
    const title = String(row.title ?? "").trim();
    if (!title) continue;
    const link = String(row.link ?? "").trim();
    const pub = String(row.pubDate ?? row.isoDate ?? "").trim();
    out.push({
      title,
      source,
      link: link && /^https?:\/\//i.test(link) ? link : undefined,
      pubDate: pub || undefined,
    });
    if (out.length >= PER_FEED) break;
  }
  return out;
}

async function fetchOneFeed(feed: FreeNewsFeed): Promise<FreeNewsItem[]> {
  if (!isHttps(feed.url)) return [];
  try {
    const xml = await fetchFeedXml(feed.url);
    const parsed = await parser.parseString(xml);
    return itemsFromParsed(feed.name, (parsed.items || []) as Array<Record<string, unknown>>);
  } catch (err) {
    console.info(
      `[DailyPatternReview] news ${feed.id} unavailable:`,
      err instanceof Error ? err.message : err,
    );
    return [];
  }
}

function fromFmp(rows: DeskWireItem[]): FreeNewsItem[] {
  return rows
    .filter((r) => r.title)
    .slice(0, 8)
    .map((r) => ({
      title: r.title,
      source: r.source || "FMP",
      link: r.link,
      pubDate: r.pubDate,
    }));
}

export async function fetchFreeFinanceNews(): Promise<{
  items: FreeNewsItem[];
  sourcesTried: string[];
  sourcesOk: string[];
}> {
  const sourcesTried = FREE_FINANCE_NEWS_FEEDS.map((f) => f.name);
  const groups = await Promise.all(FREE_FINANCE_NEWS_FEEDS.map((f) => fetchOneFeed(f)));
  const sourcesOk = FREE_FINANCE_NEWS_FEEDS.filter((_, i) => groups[i].length > 0).map((f) => f.name);

  let fmp: FreeNewsItem[] = [];
  try {
    fmp = fromFmp(await fetchFmpDeskNews());
    if (fmp.length) {
      sourcesTried.push("FMP");
      sourcesOk.push("FMP");
    }
  } catch {
    /* FMP optional */
  }

  const seen = new Set<string>();
  const items: FreeNewsItem[] = [];
  for (const item of [...groups.flat(), ...fmp]) {
    const key = item.title.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    items.push(item);
    if (items.length >= MAX_ITEMS) break;
  }

  return { items, sourcesTried, sourcesOk };
}
