/**
 * C.P.T. Buddy mentor orchestration: affect classify + growth fact extract.
 */
import {
  AFFECT_CLASSIFIER_SYSTEM,
  emptyAffectReading,
  heuristicAffectReading,
  normalizeAffectReading,
  type AffectReading,
  type BuddyBondProfile,
} from './buddyAffect';
import { normalizeConversationBullets } from '../lib/buddyMemory';

async function groqJsonChat(params: {
  apiKey: string;
  model: string;
  system: string;
  user: string;
  maxTokens?: number;
}): Promise<string | null> {
  try {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${params.apiKey}`,
      },
      body: JSON.stringify({
        model: params.model,
        temperature: 0,
        max_tokens: params.maxTokens ?? 280,
        messages: [
          { role: 'system', content: params.system },
          { role: 'user', content: params.user },
        ],
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return String(data?.choices?.[0]?.message?.content || '').trim() || null;
  } catch {
    return null;
  }
}

function parseJsonObject(raw: string): unknown {
  const cleaned = raw.replace(/```json|```/g, '').trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    const start = cleaned.indexOf('{');
    const end = cleaned.lastIndexOf('}');
    if (start >= 0 && end > start) {
      try {
        return JSON.parse(cleaned.slice(start, end + 1));
      } catch {
        return null;
      }
    }
    return null;
  }
}

export async function classifyBuddyAffect(params: {
  apiKey: string | null | undefined;
  question: string;
  recentUserLines?: string[];
}): Promise<AffectReading> {
  const heuristic = heuristicAffectReading(params.question);
  if (!params.apiKey) return heuristic;

  const recent = (params.recentUserLines || [])
    .filter((l) => typeof l === 'string' && l.trim())
    .slice(-4)
    .join('\n- ');

  const raw = await groqJsonChat({
    apiKey: params.apiKey,
    model: 'llama-3.1-8b-instant',
    system: AFFECT_CLASSIFIER_SYSTEM,
    maxTokens: 220,
    user: `Recent user lines (optional):\n- ${recent || '(none)'}\n\nLatest message:\n${params.question}`,
  });

  if (!raw) return heuristic;
  const parsed = parseJsonObject(raw);
  if (!parsed) return heuristic;
  const reading = normalizeAffectReading(parsed);
  // Prefer crisis=true from either path.
  if (heuristic.crisis) reading.crisis = true;
  if (reading.primary === 'unknown' && heuristic.primary !== 'unknown') {
    return { ...heuristic, confidence: Math.max(heuristic.confidence, reading.confidence) };
  }
  return reading;
}

export type GrowthExtract = {
  newFacts: string[];
  conversationBullets: string[];
  bondPatch: Partial<BuddyBondProfile>;
};

export async function extractBuddyGrowth(params: {
  apiKey: string;
  displayName: string;
  question: string;
  affect: AffectReading;
}): Promise<GrowthExtract> {
  const empty: GrowthExtract = { newFacts: [], conversationBullets: [], bondPatch: {} };
  const raw = await groqJsonChat({
    apiKey: params.apiKey,
    model: 'llama-3.1-8b-instant',
    maxTokens: 400,
    system: `You extract lasting growth signals for a platonic AI buddy.
Return ONLY JSON:
{"facts":["short plain facts about the user"],"conversationBullets":["one short recap of THIS turn"],"knownNeuro":["only if user self-disclosed"],"emotionalThemes":["loss","fear",...],"preferredPace":"short|warm|deep|null","likesDayCheckIn":true|false|null,"growthNotes":["short note for future continuity"]}
Rules:
- facts: lasting personal details, goals, preferences, life context they want remembered. Max 8.
- conversationBullets: 0–2 third-person bullets of what this turn was about (e.g. "Asked how COT works on the institutional desk"). Skip empty greetings like hi/ok. Max 140 chars each.
- knownNeuro: ONLY explicit self-disclosure (e.g. "I have ADHD"). Never invent.
- emotionalThemes: stable themes (grief_loss, fear, loneliness, love_care, frustration with learning, etc.)
- preferredPace / likesDayCheckIn: only if clearly implied or stated; else null
- Ignore one-off questions with no personal content for facts — still add a conversation bullet if they asked something real.
- No sexuality. If user asked for sexual content, note fact "Asked for romantic/sexual chat — declined; keep platonic." only if that happened.`,
    user: `User (${params.displayName}) said: "${params.question}"
Affect read: ${params.affect.primary} @ ${params.affect.intensity}/5 crisis=${params.affect.crisis}`,
  });

  if (!raw) return empty;
  const parsed = parseJsonObject(raw);
  if (!parsed || typeof parsed !== 'object') return empty;
  const o = parsed as Record<string, unknown>;

  const facts = Array.isArray(o.facts)
    ? o.facts.filter((f): f is string => typeof f === 'string' && f.trim().length > 0).map((f) => f.trim()).slice(0, 8)
    : [];

  const conversationBullets = normalizeConversationBullets(o.conversationBullets, 2);

  const bondPatch: Partial<BuddyBondProfile> = {};
  if (Array.isArray(o.knownNeuro)) {
    const knownNeuro = o.knownNeuro
      .filter((x): x is string => typeof x === 'string' && x.trim().length > 0)
      .map((s) => s.trim().slice(0, 40))
      .slice(0, 8);
    if (knownNeuro.length) bondPatch.knownNeuro = knownNeuro;
  }
  if (Array.isArray(o.emotionalThemes)) {
    const emotionalThemes = o.emotionalThemes
      .filter((x): x is string => typeof x === 'string' && x.trim().length > 0)
      .map((s) => s.trim().slice(0, 40))
      .slice(0, 8);
    if (emotionalThemes.length) bondPatch.emotionalThemes = emotionalThemes;
  }
  if (o.preferredPace === 'short' || o.preferredPace === 'warm' || o.preferredPace === 'deep') {
    bondPatch.preferredPace = o.preferredPace;
  }
  if (typeof o.likesDayCheckIn === 'boolean') {
    bondPatch.likesDayCheckIn = o.likesDayCheckIn;
  }
  if (Array.isArray(o.growthNotes)) {
    const growthNotes = o.growthNotes
      .filter((x): x is string => typeof x === 'string' && x.trim().length > 0)
      .map((s) => s.trim().slice(0, 100))
      .slice(0, 6);
    if (growthNotes.length) bondPatch.growthNotes = growthNotes;
  }

  // Always stamp last mood from affect when we have signal.
  if (params.affect.primary !== 'unknown' || params.affect.intensity > 0) {
    bondPatch.lastMood = {
      primary: params.affect.primary,
      intensity: params.affect.intensity,
      at: Date.now(),
      ...(params.affect.evidence[0] ? { note: params.affect.evidence[0] } : {}),
    };
  }

  return { newFacts: facts, conversationBullets, bondPatch };
}

export function mergeBondProfile(
  prev: BuddyBondProfile,
  patch: Partial<BuddyBondProfile>
): BuddyBondProfile {
  const uniq = (arr: string[] | undefined, extra: string[] | undefined, max: number) => {
    const out: string[] = [];
    for (const x of [...(arr || []), ...(extra || [])]) {
      const t = x.trim();
      if (!t) continue;
      if (!out.some((y) => y.toLowerCase() === t.toLowerCase())) out.push(t);
    }
    return out.slice(-max);
  };

  return {
    ...prev,
    ...patch,
    knownNeuro: uniq(prev.knownNeuro, patch.knownNeuro, 12),
    emotionalThemes: uniq(prev.emotionalThemes, patch.emotionalThemes, 16),
    growthNotes: uniq(prev.growthNotes, patch.growthNotes, 20),
    conversationDepth:
      typeof patch.conversationDepth === 'number'
        ? patch.conversationDepth
        : typeof prev.conversationDepth === 'number'
          ? prev.conversationDepth + 1
          : 1,
    lastMood: patch.lastMood || prev.lastMood,
    preferredPace: patch.preferredPace || prev.preferredPace,
    likesDayCheckIn:
      typeof patch.likesDayCheckIn === 'boolean' ? patch.likesDayCheckIn : prev.likesDayCheckIn,
  };
}

export function offlineCompanionAnswer(params: {
  question: string;
  displayName: string;
  affect: AffectReading;
}): string | null {
  const q = params.question.toLowerCase();
  if (params.affect.crisis) {
    return `I'm really glad you told me, ${params.displayName}. You matter. I'm not a crisis service, but please reach out to someone you trust right now — in the US you can call or text 988 anytime. I can stay here and talk gently about whatever feels safe.`;
  }
  if (
    /\b(how are you|how'?s it going|good day|bad day|rough day|feeling)\b/i.test(params.question) ||
    params.affect.intensity >= 2
  ) {
    const feel =
      params.affect.primary === 'unknown' ? 'what you shared' : params.affect.primary.replace(/_/g, ' ');
    return `Thank you for telling me, ${params.displayName}. I'm hearing ${feel}. I'm here with you — we can go slow.\n\nWould you like to talk about your day a bit more, or take one tiny ClearPath step together (like switching to a calmer chart profile)? Live AI replies need GROQ_API_KEY for fuller conversation, but I still care how you're doing.`;
  }
  if (/\b(lonely|alone|nobody)\b/.test(q)) {
    return `That sounds lonely, ${params.displayName}. I'm glad you're here with me. We don't have to fix everything tonight — want to share what's been heavy, or look at one gentle thing on ClearPath together?`;
  }
  return null;
}

export { emptyAffectReading };
