export type BriefSource = {
  title: string;
  url: string;
  source: string;
};

export type MarketBrief = {
  id: string;
  editionDate: string;
  headline: string;
  summary: string;
  bullets: string[];
  traderLens: string;
  watchToday: string[];
  sources: BriefSource[];
  generatedAt: string;
  aiAssisted: true;
};

export type BriefSummary = Pick<MarketBrief, "editionDate" | "headline" | "summary" | "generatedAt">;
