import type { FreeNewsItem } from "./freeFinanceNews";
import type { MarketProphetsBriefSummary } from "./marketProphetsClient";
import type { PatternReviewBucket } from "./dailyPatternUniverse";
import type { BriefingSlot } from "./dailyPatternReviewSchedule";
import {
  BRIEFING_DISCLAIMER,
  SCANNER_ACCURACY_NOTE,
  TRAINING_PRICING_NOTE,
} from "./dailyPatternReviewCopy";

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

export type PublishStatus = "draft" | "published";

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
  weeklySessionDate: string | null;
  lastClose?: number;
  weeklyPattern: PatternHitSummary | null;
  weeklySubPatterns: PatternHitSummary[];
  weeklyIndependentPatterns: PatternHitSummary[];
  weeklySummary: string;
  weeklySnapshotSvg: string;
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
  reportId: string;
  date: string;
  slot: BriefingSlot;
  ranAt: string;
  timezone: "America/New_York";
  publishStatus: PublishStatus;
  publishedAt?: string;
  unreadAlert: boolean;
  unreadCount: number;
  scanned: number;
  labeled: number;
  unavailable: number;
  disclaimer: string;
  scannerNote: string;
  trainingPricingNote: string;
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

export function defaultScannerNote(): string {
  return SCANNER_ACCURACY_NOTE;
}

export function defaultTrainingPricingNote(): string {
  return TRAINING_PRICING_NOTE;
}

export function defaultBriefingDisclaimer(): string {
  return BRIEFING_DISCLAIMER;
}
