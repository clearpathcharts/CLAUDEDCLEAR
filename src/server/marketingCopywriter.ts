/**
 * Marketing copywriter: every draft gets its own wording.
 *
 * Platforms quietly bury accounts that post identical text everywhere, so each
 * platform's caption body is written separately — by Groq when the key is set,
 * otherwise by recombining vetted sentences — and then measured against every
 * other draft in the batch and the recent outbox. Anything too similar is
 * rewritten or rejected.
 *
 * Truth guard: the writer only gets approved facts (tier catalog copy, the
 * founder's plan sheet, the asset title). Output that adds performance claims,
 * prices or numbers not in those facts is thrown away, never published.
 * The tracked link, disclaimer and hashtags are appended by the outbox, not
 * written by the model, so they cannot be dropped or altered.
 */
import tierContentCatalog from '../../data/marketing/tier-content-catalog.json';
import { MEMBERSHIP_PLANS } from '../content/membershipPricing';
import { getGroqApiKey } from './secrets';

export type CopyFacts = {
  title: string;
  tierLabel: string;
  priceLine: string;
  promise: string;
  cta: string;
  lines: string[];
  features: string[];
};

export type CopySource = 'ai' | 'template';

export type WrittenCopy = { body: string; source: CopySource; similarity: number };

export type AiWriter = (input: {
  platform: string;
  voice: PlatformVoice;
  facts: CopyFacts;
  avoid: string[];
}) => Promise<string | null>;

export type PlatformVoice = { label: string; style: string; maxBodyChars: number };

/** Highest allowed word-trigram overlap with any other draft or recent post. */
export const MAX_SIMILARITY = 0.35;

export const PLATFORM_VOICES: Record<string, PlatformVoice> = {
  instagram: { label: 'Instagram', style: 'Warm visual storytelling. Hook line, 2-3 short lines with line breaks, one emoji at most.', maxBodyChars: 900 },
  tiktok: { label: 'TikTok', style: 'Punchy, casual, first person. One quick hook and one sentence of payoff.', maxBodyChars: 300 },
  youtube: { label: 'YouTube', style: 'Descriptive video description. What the viewer will learn, in 2-3 plain sentences.', maxBodyChars: 900 },
  facebook: { label: 'Facebook', style: 'Friendly conversational post that asks the reader a simple question.', maxBodyChars: 700 },
  linkedin: { label: 'LinkedIn', style: 'Professional and plain. Frame it as tooling and education for traders, no hype.', maxBodyChars: 900 },
  threads: { label: 'Threads', style: 'One or two short conversational sentences.', maxBodyChars: 260 },
  bluesky: { label: 'Bluesky', style: 'One short, plain sentence. No hype.', maxBodyChars: 120 },
  reddit: { label: 'Reddit', style: 'Humble, transparent maker post. Say what it is and invite feedback. No marketing tone, no emoji.', maxBodyChars: 900 },
  pinterest: { label: 'Pinterest', style: 'Keyword-rich descriptive pin text about learning to read charts.', maxBodyChars: 320 },
  discord: { label: 'Discord', style: 'Casual community message, like sharing something useful with friends.', maxBodyChars: 600 },
  telegram: { label: 'Telegram', style: 'Short announcement with one bold-feeling first line and a plain second line.', maxBodyChars: 600 },
};

const BANNED_CLAIMS =
  /\b(guarantee[ds]?|profit(s|able)?|get rich|risk[- ]free|passive income|financial freedom|win rate|winning trades?|returns?|never lose|sure thing|millionaire|beat the market|make money|earn money|10x|100x|to the moon|financial advice from|best (trading )?platform|#1)\b/i;

export function factsFor(tierId: string, title: string): CopyFacts {
  const tier = tierContentCatalog.tiers.find((t) => t.id === tierId) || tierContentCatalog.tiers[0]!;
  const plan = MEMBERSHIP_PLANS.find((p) => p.id === tier.id);
  const priceLine = plan ? (plan.priceCents === 0 ? `${plan.name} is free` : `${plan.name} is ${plan.priceLabel}/mo`) : '';
  return {
    title: title.trim(),
    tierLabel: plan?.name || tier.label,
    priceLine,
    promise: tier.promise,
    cta: tier.poster.cta,
    lines: tier.videos.flatMap((v) => [v.hook, v.voiceover]),
    features: (plan?.features || []).slice(0, 6),
  };
}

function normalize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/https?:\/\/\S+/g, ' ')
    .replace(/#\w+/g, ' ')
    .replace(/[^a-z0-9$ ]+/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
}

function trigrams(text: string): Set<string> {
  const words = normalize(text);
  const out = new Set<string>();
  for (let i = 0; i + 2 < words.length; i += 1) out.add(`${words[i]} ${words[i + 1]} ${words[i + 2]}`);
  return out;
}

/** Jaccard overlap of word trigrams: 0 = nothing shared, 1 = identical. */
export function similarity(a: string, b: string): number {
  const A = trigrams(a);
  const B = trigrams(b);
  if (!A.size || !B.size) return 0;
  let shared = 0;
  for (const g of A) if (B.has(g)) shared += 1;
  return shared / (A.size + B.size - shared);
}

export function maxSimilarity(text: string, others: string[]): number {
  return others.reduce((max, o) => Math.max(max, similarity(text, o)), 0);
}

/** Reason the body cannot ship, or null when it is clean. */
export function validateBody(body: string, facts: CopyFacts, voice: PlatformVoice): string | null {
  const text = body.trim();
  if (text.length < 15) return 'too short';
  if (text.length > voice.maxBodyChars) return 'too long';
  if (BANNED_CLAIMS.test(text)) return 'performance or hype claim';
  if (/https?:\/\/|www\./i.test(text)) return 'contains a link';
  if (/#\w/.test(text)) return 'contains hashtags';
  const factText = [facts.title, facts.priceLine, facts.promise, facts.cta, ...facts.lines, ...facts.features].join(' ');
  for (const money of text.match(/\$\s?\d[\d.,]*/g) || []) {
    if (!factText.includes(money.replace(/\s/g, ''))) return `price not in facts (${money})`;
  }
  for (const num of text.match(/\b\d[\d.,]*\b/g) || []) {
    if (!factText.includes(num)) return `number not in facts (${num})`;
  }
  return null;
}

// ── template writer (no AI key, or AI output rejected) ─────────────────────

const OPENERS: Array<(f: CopyFacts) => string> = [
  (f) => f.title,
  (f) => `New from ClearPath Trader: ${f.title}`,
  (f) => `For anyone learning to read charts: ${f.title.toLowerCase()}`,
  (f) => `Something we built for calmer chart study: ${f.title}`,
  () => 'Built for people learning to read charts.',
  () => 'Charts first, clutter last.',
  () => 'A quieter way to study price action.',
  () => 'Made for traders who are still learning.',
];

const QUESTIONS = [
  'What part of reading charts trips you up most?',
  'Which indicator did you learn first?',
  'How do you like to study a chart: one screen or several?',
  'What would make chart study easier for you?',
];

function sentence(text: string): string {
  const t = text.trim();
  return /[.!?…]$/.test(t) ? t : `${t}.`;
}

function pickFeatures(f: CopyFacts, offset: number, count: number): string[] {
  if (!f.features.length) return [];
  const out: string[] = [];
  for (let i = 0; i < count && i < f.features.length; i += 1) out.push(f.features[(offset + i) % f.features.length]!);
  return out;
}

const FEATURE_FRAMES: Array<(tier: string, a: string[]) => string> = [
  (t, a) => `${t} includes ${a.join(', ')}.`,
  (t, a) => `On ${t}: ${a.join(' · ')}`,
  (t, a) => `${a.slice(0, -1).join(', ')} and ${a[a.length - 1]} come with ${t}.`,
  (t, a) => `What you get on ${t}: ${a.join(', ')}.`,
];

function featureLines(f: CopyFacts): string[] {
  const out: string[] = [];
  FEATURE_FRAMES.forEach((frame, fi) => {
    for (let offset = 0; offset < f.features.length; offset += 2) {
      const picked = pickFeatures(f, offset + fi, 2 + (fi % 2));
      if (picked.length >= 2) out.push(frame(f.tierLabel, picked));
    }
  });
  return out;
}

/** Combinations of approved sentences, phrased several ways, in a stable order. */
function templateCandidates(facts: CopyFacts, platform: string): string[] {
  const voice = PLATFORM_VOICES[platform];
  const short = (voice?.maxBodyChars ?? 900) <= 320;
  const support = [facts.promise, ...facts.lines].map(sentence);
  const features = featureLines(facts);
  const closers = [
    facts.priceLine ? sentence(facts.priceLine) : '',
    sentence(facts.cta),
    ...QUESTIONS,
    ...features,
  ].filter(Boolean);
  const out: string[] = [];
  if (short) {
    for (const line of support) {
      out.push(line);
      for (const q of QUESTIONS) out.push(`${line} ${q}`);
      for (const open of OPENERS) out.push(`${sentence(open(facts))} ${line}`);
    }
    for (const feat of features) {
      out.push(feat);
      for (const open of OPENERS.slice(4)) out.push(`${open(facts)} ${feat}`);
    }
    return [...new Set(out)];
  }
  const joiner = platform === 'linkedin' || platform === 'youtube' ? ' ' : '\n';
  for (const open of OPENERS) {
    for (const line of support) {
      for (const close of closers) {
        const lines =
          platform === 'reddit'
            ? [`I'm the founder of ClearPath Trader. ${line}`, close, 'Feedback welcome, especially on what feels confusing.']
            : [sentence(open(facts)), line, close];
        out.push(lines.join(joiner));
      }
    }
  }
  return [...new Set(out)];
}

export function templateBody(platform: string, facts: CopyFacts, avoid: string[], seed: number): WrittenCopy {
  const voice = PLATFORM_VOICES[platform] || PLATFORM_VOICES.instagram!;
  const candidates = templateCandidates(facts, platform).filter((c) => !validateBody(c, facts, voice));
  if (!candidates.length) {
    const body = sentence(facts.promise).slice(0, voice.maxBodyChars);
    return { body, source: 'template', similarity: maxSimilarity(body, avoid) };
  }
  let best = candidates[seed % candidates.length]!;
  let bestScore = maxSimilarity(best, avoid);
  for (let i = 0; i < candidates.length && bestScore > 0; i += 1) {
    const c = candidates[(seed + i) % candidates.length]!;
    const score = maxSimilarity(c, avoid);
    if (score < bestScore) {
      best = c;
      bestScore = score;
    }
  }
  return { body: best, source: 'template', similarity: bestScore };
}

// ── AI writer ─────────────────────────────────────────────────────────────

export function groqWriter(apiKey: string): AiWriter {
  return async ({ platform, voice, facts, avoid }) => {
    const system = [
      'You write one social media caption body for ClearPath Trader, an educational charting platform.',
      'Use ONLY the facts provided. Never add performance claims, profits, returns, guarantees, win rates, prices or numbers that are not in the facts.',
      'Do not include links, hashtags, or a disclaimer; those are added separately.',
      `Platform: ${voice.label}. Style: ${voice.style} Keep it under ${voice.maxBodyChars} characters.`,
      'Write it in fresh words. Do not reuse phrasing from the "already used" list.',
      'Reply with the caption body only.',
    ].join('\n');
    const user = [
      `Asset title: ${facts.title}`,
      `Plan: ${facts.tierLabel}. ${facts.priceLine}`,
      `Approved pitch: ${facts.promise}`,
      `Approved lines: ${facts.lines.join(' | ')}`,
      `Plan features: ${facts.features.join(', ')}`,
      `Call to action idea: ${facts.cta}`,
      avoid.length ? `Already used (do not echo):\n- ${avoid.slice(-8).map((a) => a.slice(0, 200)).join('\n- ')}` : '',
    ].join('\n');
    try {
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [
            { role: 'system', content: system },
            { role: 'user', content: user },
          ],
          temperature: 0.9,
          max_tokens: 400,
        }),
        signal: AbortSignal.timeout(15_000),
      });
      if (!res.ok) {
        console.warn('[marketing copywriter] Groq', res.status);
        return null;
      }
      const data = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
      const text = String(data?.choices?.[0]?.message?.content || '')
        .trim()
        .replace(/^["“]|["”]$/g, '');
      return text || null;
    } catch (err) {
      console.warn('[marketing copywriter] Groq failed', err instanceof Error ? err.message : err);
      return null;
    }
  };
}

export function defaultAiWriter(): AiWriter | null {
  const key = getGroqApiKey();
  return key ? groqWriter(key) : null;
}

function seedFrom(text: string): number {
  let h = 0;
  for (let i = 0; i < text.length; i += 1) h = (h * 31 + text.charCodeAt(i)) >>> 0;
  return h;
}

/**
 * One unique body per platform. Each new body is compared with the recent
 * outbox and with every body already written in this batch.
 */
export async function writeUniqueBodies(input: {
  platforms: string[];
  facts: CopyFacts;
  recent: string[];
  ai?: AiWriter | null;
  attempts?: number;
}): Promise<Record<string, WrittenCopy>> {
  const out: Record<string, WrittenCopy> = {};
  const written: string[] = [];
  const attempts = input.attempts ?? 2;
  for (const platform of input.platforms) {
    const voice = PLATFORM_VOICES[platform] || PLATFORM_VOICES.instagram!;
    const avoid = [...input.recent, ...written];
    let result: WrittenCopy | null = null;
    if (input.ai) {
      for (let i = 0; i < attempts && !result; i += 1) {
        const text = await input.ai({ platform, voice, facts: input.facts, avoid });
        if (!text || validateBody(text, input.facts, voice)) continue;
        const score = maxSimilarity(text, avoid);
        if (score <= MAX_SIMILARITY) result = { body: text, source: 'ai', similarity: score };
      }
    }
    if (!result) result = templateBody(platform, input.facts, avoid, seedFrom(`${platform}:${input.facts.title}:${avoid.length}`));
    out[platform] = result;
    written.push(result.body);
  }
  return out;
}
