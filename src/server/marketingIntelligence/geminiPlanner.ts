import { GoogleGenAI } from '@google/genai';
import { getGeminiApiKey } from '../secrets';
import { createMarketingContentBrief } from './intelligenceEngine';

type GeminiMarketingPlan = {
  executiveSummary?: string;
  audienceIntent?: string;
  contentOutline?: string[];
  channelAdaptations?: Array<{
    channel?: string;
    hook?: string;
    format?: string;
    callToAction?: string;
  }>;
  measurementPlan?: string[];
  claimReview?: string[];
};

function cleanPlatform(value: unknown): string {
  return String(value || '')
    .trim()
    .replace(/[^a-zA-Z0-9 _-]/g, '')
    .slice(0, 40);
}

export function getGeminiPlannerStatus() {
  return {
    configured: Boolean(getGeminiApiKey()),
    model:
      process.env.GEMINI_MARKETING_MODEL ||
      process.env.GEMINI_MODEL ||
      'gemini-2.5-flash',
    publishingEnabled: false,
    approvalRequired: true,
  };
}

export async function createGeminiMarketingPlan(input: {
  canonicalPath: string;
  platform?: string;
}) {
  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured on the server.');
  }

  const platform = cleanPlatform(input.platform);
  const brief = createMarketingContentBrief({
    canonicalPath: input.canonicalPath,
    platform: platform || undefined,
  });
  const model =
    process.env.GEMINI_MARKETING_MODEL ||
    process.env.GEMINI_MODEL ||
    'gemini-2.5-flash';
  const ai = new GoogleGenAI({ apiKey });
  const prompt = [
    'You are the private ClearPath Trader marketing planning assistant.',
    'Return JSON only. Build a precise draft plan from the verified brief below.',
    'Never invent search volume, rankings, trends, customer counts, testimonials, product behavior, investment performance, or competitor facts.',
    'Never describe ClearPath as a broker, fiduciary, execution venue, signal service, or guarantee of returns.',
    'Do not publish, schedule, buy media, or imply that approval has occurred.',
    'The output must remain a draft requiring founder approval.',
    'Use these JSON keys: executiveSummary, audienceIntent, contentOutline, channelAdaptations, measurementPlan, claimReview.',
    JSON.stringify(brief),
  ].join('\n\n');

  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: {
      temperature: 0.2,
      maxOutputTokens: 3000,
      responseMimeType: 'application/json',
    },
  });
  const text = String(response.text || '').trim();
  if (!text) throw new Error('Gemini returned an empty marketing plan.');

  let plan: GeminiMarketingPlan;
  try {
    plan = JSON.parse(text) as GeminiMarketingPlan;
  } catch {
    throw new Error('Gemini returned a marketing plan that was not valid JSON.');
  }

  return {
    ok: true as const,
    generatedAt: new Date().toISOString(),
    model,
    approvalStatus: 'DRAFT_REQUIRES_FOUNDER_APPROVAL' as const,
    publishingEnabled: false,
    sourceBrief: brief,
    plan,
  };
}
