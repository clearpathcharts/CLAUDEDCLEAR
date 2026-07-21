import fs from "fs";
import path from "path";

const DATA_DIR = path.resolve(process.cwd(), "data/briefs");

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

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function briefPath(editionDate: string) {
  return path.join(DATA_DIR, `${editionDate}.json`);
}

export function listBriefDates(): string[] {
  ensureDataDir();
  return fs
    .readdirSync(DATA_DIR)
    .filter((f) => f.endsWith(".json"))
    .map((f) => f.replace(/\.json$/, ""))
    .sort((a, b) => b.localeCompare(a));
}

export function loadBrief(editionDate: string): MarketBrief | null {
  const file = briefPath(editionDate);
  if (!fs.existsSync(file)) return null;
  try {
    return JSON.parse(fs.readFileSync(file, "utf8")) as MarketBrief;
  } catch {
    return null;
  }
}

export function loadLatestBrief(): MarketBrief | null {
  const dates = listBriefDates();
  if (!dates.length) return null;
  return loadBrief(dates[0]);
}

export function saveBrief(brief: MarketBrief): void {
  ensureDataDir();
  fs.writeFileSync(briefPath(brief.editionDate), JSON.stringify(brief, null, 2), "utf8");
}

export function listBriefs(limit = 30): MarketBrief[] {
  return listBriefDates()
    .slice(0, limit)
    .map((d) => loadBrief(d))
    .filter((b): b is MarketBrief => b !== null);
}
