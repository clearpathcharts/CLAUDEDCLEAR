import { format } from "date-fns";
import { collectFeedItems } from "./rssCollector";
import { saveBrief, type BriefSource, type MarketBrief } from "./briefStore";
import type { RawFeedItem } from "./feeds";

export type GenerateResult =
  | { ok: true; brief: MarketBrief }
  | { ok: false; error: string; demo?: MarketBrief };

function editionDateNow(): string {
  return format(new Date(), "yyyy-MM-dd");
}

function buildDemoBrief(items: RawFeedItem[]): MarketBrief {
  const editionDate = editionDateNow();
  const sources: BriefSource[] = items.slice(0, 8).map((i) => ({
    title: i.title,
    url: i.link,
    source: i.source,
  }));

  return {
    id: `demo-${editionDate}`,
    editionDate,
    headline: "Market Prophets — demo edition (add GEMINI_API_KEY for live AI writing)",
    summary:
      "This demo brief was built from today's public RSS headlines. Configure GEMINI_API_KEY to enable full AI-assisted narrative generation.",
    bullets: items.slice(0, 5).map((i) => `${i.source}: ${i.title}`),
    traderLens:
      "Markets are digesting cross-asset headlines from macro, policy, and crypto feeds. Treat this demo as a layout preview — not trading advice.",
    watchToday: ["Fed speakers", "Earnings after the bell", "FX liquidity into London open"],
    sources,
    generatedAt: new Date().toISOString(),
    aiAssisted: true,
  };
}

function parseBriefJson(text: string): Omit<MarketBrief, "id" | "editionDate" | "generatedAt" | "aiAssisted" | "sources"> & {
  sources?: BriefSource[];
} {
  const cleaned = text.replace(/^```json\s*/i, "").replace(/```\s*$/i, "").trim();
  return JSON.parse(cleaned);
}

export async function generateDailyBrief(): Promise<GenerateResult> {
  const items = await collectFeedItems();
  if (!items.length) {
    return { ok: false, error: "No feed items collected from public RSS sources." };
  }

  const editionDate = editionDateNow();
  const apiKey = process.env.GEMINI_API_KEY?.trim();

  const sourcePayload = items.map((i) => ({
    source: i.source,
    category: i.category,
    title: i.title,
    url: i.link,
    publishedAt: i.publishedAt,
    snippet: i.snippet,
  }));

  if (!apiKey) {
    const demo = buildDemoBrief(items);
    saveBrief(demo);
    return { ok: true, brief: demo };
  }

  try {
    const { GoogleGenAI } = await import("@google/genai");
    const ai = new GoogleGenAI({ apiKey });

    const prompt = `You are the lead editor of "Market Prophets", a calm daily fintech brief for traders.

Using ONLY the feed items below, write today's market brief as JSON (no markdown fences).

Rules:
- Do NOT invent prices, percentages, or quotes not present in the inputs.
- Every bullet must reflect a real item from the feed list.
- Tone: clear, calm, professional — not hype or buy/sell calls.
- Include educational framing, not investment advice.

Return JSON with exactly these keys:
{
  "headline": "string, compelling but factual",
  "summary": "string, 2-3 sentences",
  "bullets": ["string", ...], // 4-6 bullets
  "traderLens": "string, one paragraph on what active traders might watch",
  "watchToday": ["string", ...] // 2-4 calendar-style items inferred from headlines
}

FEED ITEMS:
${JSON.stringify(sourcePayload, null, 2)}`;

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: prompt,
    });

    const text = response.text?.trim();
    if (!text) {
      return { ok: false, error: "Gemini returned an empty response." };
    }

    const parsed = parseBriefJson(text);
    const sources: BriefSource[] = items.slice(0, 12).map((i) => ({
      title: i.title,
      url: i.link,
      source: i.source,
    }));

    const brief: MarketBrief = {
      id: `brief-${editionDate}`,
      editionDate,
      headline: parsed.headline,
      summary: parsed.summary,
      bullets: parsed.bullets ?? [],
      traderLens: parsed.traderLens,
      watchToday: parsed.watchToday ?? [],
      sources,
      generatedAt: new Date().toISOString(),
      aiAssisted: true,
    };

    saveBrief(brief);
    return { ok: true, brief };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Brief generation failed";
    console.error("[Brief Generator]", err);
    return { ok: false, error: message };
  }
}
