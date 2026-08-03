import type { SocialPlatform, TemplateKind } from './types';

const SITE = 'https://clearpathtrader.com';

export type TemplateResult = {
  platform: SocialPlatform;
  title?: string;
  body: string;
  linkUrl: string;
  hashtags: string[];
  kind: TemplateKind;
};

type BodyMap = Partial<Record<SocialPlatform, string>> & { x: string; linkedin: string };

/** Brand-safe ClearPath templates — no price predictions, no broker claims. */
export function buildTemplate(
  kind: TemplateKind,
  platform: SocialPlatform,
  extras?: { topic?: string; feature?: string }
): TemplateResult {
  const topic = extras?.topic?.trim() || 'market clarity';
  const feature = extras?.feature?.trim() || 'chart-first terminal';
  const linkUrl = `${SITE}/?utm_source=${platform}&utm_medium=social&utm_campaign=clearpath_social_os`;

  const baseHashtags = ['ClearPathTrader', 'MarketClarity', 'TradingEducation'];

  switch (kind) {
    case 'clarity_cta':
      return {
        kind,
        platform,
        title: 'Clarity over noise',
        linkUrl,
        hashtags: baseHashtags,
        body: platformBody(platform, {
          x: `Most trading software is designed to keep you clicking.\n\nClearPath Trader is built for clarity — charts first, noise last.\n\nExplore: ${linkUrl}`,
          linkedin: `Retail trading platforms often reward attention, not understanding.\n\nClearPathTrader.com was built for the opposite: a chart-first market intelligence and education terminal with less cognitive clutter.\n\nIf you want tools that help you think instead of react — start here:\n${linkUrl}`,
          facebook: `Built for traders who want clarity, not chaos.\n\nClearPath Trader — market intelligence & education at ${SITE}\n\n${linkUrl}`,
          instagram: `Clarity over noise.\nCharts first.\nEducation that respects how your brain works.\n\nClearPath Trader → link in bio / ${SITE}\n\n#ClearPathTrader #TradingEducation`,
          tiktok: `Trading apps keep stacking alerts.\nWe built ClearPath for chart-first clarity instead.\n\nclearpathtrader.com`,
          youtube: `ClearPath Trader — clarity-first market intelligence. Learn more: ${linkUrl}`,
          reddit: `Built ClearPathTrader.com as a chart-first market intelligence / education terminal (not a broker). Focus is reducing UI noise so you can actually read price. Feedback welcome: ${SITE}`,
          discord: `**ClearPath Trader** — clarity over noise. Charts first, clutter last.\n${linkUrl}`,
          telegram: `ClearPath Trader — chart-first market intelligence.\n${linkUrl}`,
          bluesky: `Clarity over noise. ClearPath Trader is chart-first market intelligence.\n${linkUrl}`,
          threads: `Clarity over noise. Charts first.\nClearPath Trader → ${SITE}`,
        }),
      };

    case 'education_tip':
      return {
        kind,
        platform,
        title: `Education: ${topic}`,
        linkUrl,
        hashtags: [...baseHashtags, 'LearnMarkets'],
        body: platformBody(platform, {
          x: `Education tip: ${topic}.\n\nBefore adding another indicator, ask: does this help me understand structure — or just add noise?\n\nLearn more on ClearPath: ${linkUrl}`,
          linkedin: `Teaching note for ${topic}:\n\nMore indicators ≠ more edge. Clarity comes from understanding market structure, risk, and process — then choosing tools that support that.\n\nClearPath Education: ${linkUrl}`,
          facebook: `Quick education tip on ${topic}:\n\nStrip the jargon first. Add only the detail that changes how you think about risk.\n\n${linkUrl}`,
          instagram: `Tip: ${topic}\n\nStrip jargon → understand structure → then choose tools.\n\nClearPath Education\n${SITE}`,
          tiktok: `Tip on ${topic}: fewer flashing widgets, more chart reading.\nClearPath Education → clearpathtrader.com`,
          youtube: `Education focus: ${topic}. Start at ${linkUrl}`,
          reddit: `Educational angle on ${topic}: prioritize structure and risk vocabulary before stacking indicators. Resources: ${SITE}/education`,
        }),
      };

    case 'founder_story':
      return {
        kind,
        platform,
        title: 'Built from need',
        linkUrl: `${SITE}/press?utm_source=${platform}&utm_medium=social&utm_campaign=clearpath_social_os`,
        hashtags: baseHashtags,
        body: platformBody(platform, {
          x: `"What if I built the trading platform my own brain actually needed?"\n\nThat's the founding question behind ClearPath Trader — clarity for neurodivergent and focus-first traders.\n\nStory: ${SITE}/press`,
          linkedin: `ClearPath Trader started from a simple question: what if trading software adapted to how different minds process information?\n\nFounder story + press kit: ${SITE}/press`,
          facebook: `Built from necessity — not venture theater.\n\nClearPath Trader founder story: ${SITE}/press`,
          instagram: `Built for clarity.\nBuilt from need.\n\nFounder story → ${SITE}/press`,
          tiktok: `Self-taught. Chart-first. Built because existing platforms were too loud.\nClearPathTrader.com`,
          youtube: `Founder story — ClearPath Trader. ${SITE}/press`,
          reddit: `Sharing the ClearPath founder / press narrative (accessibility + chart-first design): ${SITE}/press`,
        }),
      };

    case 'feature_highlight':
      return {
        kind,
        platform,
        title: feature,
        linkUrl,
        hashtags: baseHashtags,
        body: platformBody(platform, {
          x: `Feature focus: ${feature}.\n\nClearPath keeps the chart center-stage — fewer dopamine traps, more room to analyze.\n\n${linkUrl}`,
          linkedin: `Product note: ${feature}\n\nClearPathTrader.com is a market intelligence & education terminal (not a broker). Design goal: reduce cognitive clutter around the chart.\n\n${linkUrl}`,
          facebook: `Highlighting ${feature} inside ClearPath Trader.\n\n${linkUrl}`,
          instagram: `Feature: ${feature}\nCharts stay center stage.\n\n${SITE}`,
          tiktok: `${feature} — chart-first, less clutter.\nclearpathtrader.com`,
          youtube: `Feature highlight: ${feature}. ${linkUrl}`,
          reddit: `Feature note (${feature}) on ClearPathTrader.com — chart-first UX. Demo: ${SITE}`,
        }),
      };

    case 'market_lesson':
      return {
        kind,
        platform,
        title: `Lesson: ${topic}`,
        linkUrl,
        hashtags: [...baseHashtags, 'RiskFirst'],
        body: platformBody(platform, {
          x: `Market lesson: ${topic}.\n\nNo predictions here — just process. Clarity beats reaction.\n\n${linkUrl}`,
          linkedin: `Market lesson (educational, not advice): ${topic}.\n\nClearPath focuses on literacy and structure — not hype cycles.\n\n${linkUrl}`,
          facebook: `Today's lesson: ${topic}.\nEducational content only — not trading advice.\n\n${linkUrl}`,
          instagram: `Lesson: ${topic}\nEducational · not advice\n\nClearPath Trader`,
          tiktok: `Lesson: ${topic}\nEducational only — not financial advice.\nclearpathtrader.com`,
          youtube: `Market lesson: ${topic}. Educational content: ${linkUrl}`,
          reddit: `Educational discussion prompt: ${topic}. (Not advice.) ClearPath resources: ${SITE}`,
        }),
      };

    default:
      throw new Error(`Unknown template kind: ${kind}`);
  }
}

function platformBody(platform: SocialPlatform, map: BodyMap): string {
  if (map[platform]) return map[platform]!.trim();
  // Networking / secondary channels: LinkedIn-style professional tone, else X short form.
  if (
    [
      'xing',
      'viadeo',
      'shapr',
      'lunchclub',
      'polywork',
      'wellfound',
      'fishbowl',
      'blind',
      'opportunity',
      'meetup',
      'alignable',
      'bark',
      'gust',
      'researchgate',
      'linkedin',
    ].includes(platform)
  ) {
    return map.linkedin.trim();
  }
  return map.x.trim();
}
