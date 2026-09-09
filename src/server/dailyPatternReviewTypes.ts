import type { FreeNewsItem } from "./freeFinanceNews";
import type { MarketProphetsBriefSummary } from "./marketProphetsClient";
import type { PatternReviewBucket } from "./dailyPatternUniverse";

export type PatternHitSummary = {
  id: string;
  label: string;
  direction: "bullish" | "bearish" | "neutral";
  scale?: "major" | "nested";
  category: string;
  confidence: number;
  startIndex: number;
  endIndex: number;
  detail?: string;
};

export type SymbolReviewRow = {
  id: string;
  bucket: PatternReviewBucket;
  symbol: string | null;
  display: string;
  description: string;
  proxyNote?: string;
  status: "ok" | "unavailable";
  unavailableReason?: string;
  sessionDate: string | null;
  lastClose?: number;
  dailyPattern: PatternHitSummary | null;
  subPatterns: PatternHitSummary[];
  independentPatterns: PatternHitSummary[];
  summary: string;
  snapshotSvg: string;
  reviewed: boolean;
  reviewNote?: string;
  reviewedAt?: string;
};

export type DailyPatternReviewReport = {
  date: string;
  ranAt: string;
  timezone: "America/Los_Angeles";
  unreadAlert: boolean;
  unreadCount: number;
  scanned: number;
  labeled: number;
  unavailable: number;
  disclaimer: string;
  nextDueHint: string;
  news: {
    items: FreeNewsItem[];
    sourcesTried: string[];
    sourcesOk: string[];
  };
  marketProphets: MarketProphetsBriefSummary | null;
  digestEmailSentAt?: string;
  digestEmailTo?: string;
  storage?: "disk" | "both";
  rows: SymbolReviewRow[];
};
