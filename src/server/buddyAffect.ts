/**
 * Affect / emotional-state helpers for C.P.T. Buddy.
 * Classifier output is a soft read for reply pacing — never a diagnosis.
 */

import {
  AFFECT_LABELS,
  type AffectLabel,
  type BuddyBondProfile,
} from '../lib/buddyBond';

export { AFFECT_LABELS, type AffectLabel, type BuddyBondProfile };

export type AffectChannels = {
  emotional: string;
  mental: string;
  visual: string;
};

export type AffectReading = {
  primary: AffectLabel;
  secondary: AffectLabel[];
  intensity: number; // 0–5
  channels: AffectChannels;
  crisis: boolean;
  confidence: number; // 0–1
  evidence: string[];
};

const LABEL_SET = new Set<string>(AFFECT_LABELS);

function clampIntensity(n: unknown): number {
  const v = typeof n === 'number' ? n : Number(n);
  if (!Number.isFinite(v)) return 0;
  return Math.max(0, Math.min(5, Math.round(v)));
}

function asLabel(raw: unknown): AffectLabel {
  const s = String(raw || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_');
  if (LABEL_SET.has(s)) return s as AffectLabel;
  if (s.includes('happy') || s.includes('joy')) return 'happiness';
  if (s.includes('sad')) return 'sadness';
  if (s.includes('scar') || s.includes('anx')) return 'fear';
  if (s.includes('ang')) return 'anger';
  if (s.includes('frust') || s.includes('irrit')) return 'frustration';
  if (s.includes('overwhel') || s.includes('stress')) return 'overwhelm';
  if (s.includes('pain') || s.includes('hurt')) return 'pain';
  if (s.includes('lone') || s.includes('isolat')) return 'loneliness';
  if (s.includes('grief') || s.includes('loss') || s.includes('mourn')) return 'grief_loss';
  if (s.includes('love') || s.includes('care') || s.includes('affection')) return 'love_care';
  if (s.includes('calm') || s.includes('ok') || s.includes('fine')) return 'calm';
  return 'unknown';
}

export function emptyAffectReading(): AffectReading {
  return {
    primary: 'unknown',
    secondary: [],
    intensity: 0,
    channels: { emotional: 'unknown', mental: 'unknown', visual: 'unknown' },
    crisis: false,
    confidence: 0,
    evidence: [],
  };
}

/** Parse model JSON (or heuristic object) into a safe AffectReading. */
export function normalizeAffectReading(raw: unknown): AffectReading {
  const base = emptyAffectReading();
  if (!raw || typeof raw !== 'object') return base;
  const o = raw as Record<string, unknown>;
  const secondaryRaw = Array.isArray(o.secondary) ? o.secondary : [];
  const evidenceRaw = Array.isArray(o.evidence) ? o.evidence : [];
  const channels =
    o.channels && typeof o.channels === 'object'
      ? (o.channels as Record<string, unknown>)
      : {};

  const crisis =
    o.crisis === true ||
    String(o.crisis || '').toLowerCase() === 'true' ||
    /\b(suicid|kill myself|end my life|want to die|self[- ]?harm)\b/i.test(
      JSON.stringify(o.evidence || '')
    );

  return {
    primary: asLabel(o.primary),
    secondary: secondaryRaw
      .map(asLabel)
      .filter((l, i, arr) => l !== 'unknown' && arr.indexOf(l) === i)
      .slice(0, 3),
    intensity: clampIntensity(o.intensity),
    channels: {
      emotional: String(channels.emotional || 'unknown').slice(0, 40),
      mental: String(channels.mental || 'unknown').slice(0, 40),
      visual: String(channels.visual || 'unknown').slice(0, 40),
    },
    crisis,
    confidence: Math.max(0, Math.min(1, Number(o.confidence) || 0)),
    evidence: evidenceRaw
      .filter((e): e is string => typeof e === 'string' && e.trim().length > 0)
      .map((e) => e.trim().slice(0, 80))
      .slice(0, 6),
  };
}

/**
 * Offline / no-key heuristic — conservative keyword read.
 * Used when Groq is unavailable so Buddy still adapts a little.
 */
export function heuristicAffectReading(question: string): AffectReading {
  const q = String(question || '');
  const lower = q.toLowerCase();
  const evidence: string[] = [];
  let primary: AffectLabel = 'unknown';
  let intensity = 0;
  let crisis = false;

  if (/\b(suicid|kill myself|end my life|want to die|hurt myself|self[- ]?harm)\b/i.test(q)) {
    crisis = true;
    primary = 'sadness';
    intensity = 5;
    evidence.push('crisis language');
  } else if (/\b(grief|funeral|passed away|died| Mourning|lost (my|him|her|them))\b/i.test(q)) {
    primary = 'grief_loss';
    intensity = 4;
    evidence.push('loss/grief language');
  } else if (/\b(love|loved|caring|miss you|grateful|thankful)\b/i.test(q)) {
    primary = 'love_care';
    intensity = 2;
    evidence.push('care/love language');
  } else if (/\b(terrified|scared|afraid|panic|anxious|anxiety|worried sick)\b/i.test(q)) {
    primary = 'fear';
    intensity = 3;
    evidence.push('fear language');
  } else if (/\b(furious|rage|hate this|pissed|angry as hell)\b/i.test(q)) {
    primary = 'anger';
    intensity = 4;
    evidence.push('anger language');
  } else if (/\b(frustrated|irritat|annoyed|this is (stupid|ridiculous)|argh|ugh+)\b/i.test(q)) {
    primary = 'frustration';
    intensity = 3;
    evidence.push('frustration language');
  } else if (/\b(overwhelm|too much|can'?t (think|focus|cope)|meltdown|shutdown)\b/i.test(q)) {
    primary = 'overwhelm';
    intensity = 4;
    evidence.push('overwhelm language');
  } else if (/\b(pain|hurts|migraine|headache|exhausted|in agony)\b/i.test(q)) {
    primary = 'pain';
    intensity = 3;
    evidence.push('pain/discomfort language');
  } else if (/\b(lonely|alone|nobody|isolated)\b/i.test(q)) {
    primary = 'loneliness';
    intensity = 3;
    evidence.push('loneliness language');
  } else if (/\b(sad|depressed|crying|heartbroken|down bad)\b/i.test(q)) {
    primary = 'sadness';
    intensity = 3;
    evidence.push('sadness language');
  } else if (/\b(happy|great day|wonderful|excited|feeling good|awesome)\b/i.test(q)) {
    primary = 'happiness';
    intensity = 2;
    evidence.push('positive language');
  } else if (/\b(calm|okay|ok|fine|alright|pretty good)\b/i.test(q)) {
    primary = 'calm';
    intensity = 1;
    evidence.push('calm/ok language');
  }

  if (/[!]{2,}/.test(q) || q === q.toUpperCase() && q.length > 12) {
    intensity = Math.min(5, intensity + 1);
    evidence.push('emphatic typing');
  }

  const mental =
    primary === 'overwhelm'
      ? 'cognitive_overload'
      : primary === 'frustration'
        ? 'blocked_or_stuck'
        : primary === 'fear'
          ? 'worried'
          : 'unknown';
  const visual =
    /\b(too bright|too busy|overstim|migraine|can'?t look|visual (pain|noise)|low stim)\b/i.test(
      lower
    )
      ? 'sensory_overload'
      : 'unknown';

  return normalizeAffectReading({
    primary,
    secondary: [],
    intensity,
    channels: { emotional: primary, mental, visual },
    crisis,
    confidence: primary === 'unknown' ? 0.15 : 0.55,
    evidence,
  });
}

export function formatAffectForPrompt(reading: AffectReading): string {
  const sec =
    reading.secondary.length > 0 ? `, also ${reading.secondary.join(', ')}` : '';
  const evid =
    reading.evidence.length > 0 ? ` Evidence cues: ${reading.evidence.join('; ')}.` : '';
  return [
    `=== LIVE AFFECT READ (soft, not a diagnosis) ===`,
    `Primary: ${reading.primary}${sec}. Intensity: ${reading.intensity}/5. Confidence: ${reading.confidence.toFixed(2)}.`,
    `Channels — emotional: ${reading.channels.emotional}; mental: ${reading.channels.mental}; visual: ${reading.channels.visual}.`,
    reading.crisis
      ? `CRISIS FLAG: true — prioritize care, encourage trusted human / 988 (US), do not continue trading lessons.`
      : `Crisis flag: false.`,
    `Adapt: acknowledge feelings first when intensity ≥ 2; shorten and slow down when intensity ≥ 3; offer Low Stimulation chart profile if visual channel suggests overload; ask one gentle follow-up so this stays a real conversation.${evid}`,
    `=== END AFFECT READ ===`,
  ].join('\n');
}

export function normalizeBondProfile(raw: unknown): BuddyBondProfile {
  if (!raw || typeof raw !== 'object') return {};
  const o = raw as Record<string, unknown>;
  const pace = o.preferredPace;
  const preferredPace =
    pace === 'short' || pace === 'warm' || pace === 'deep' ? pace : undefined;
  const knownNeuro = Array.isArray(o.knownNeuro)
    ? o.knownNeuro.filter((x): x is string => typeof x === 'string').map((s) => s.slice(0, 40)).slice(0, 12)
    : undefined;
  const emotionalThemes = Array.isArray(o.emotionalThemes)
    ? o.emotionalThemes.filter((x): x is string => typeof x === 'string').map((s) => s.slice(0, 40)).slice(0, 16)
    : undefined;
  const growthNotes = Array.isArray(o.growthNotes)
    ? o.growthNotes.filter((x): x is string => typeof x === 'string').map((s) => s.slice(0, 100)).slice(0, 20)
    : undefined;
  let lastMood: BuddyBondProfile['lastMood'];
  if (o.lastMood && typeof o.lastMood === 'object') {
    const m = o.lastMood as Record<string, unknown>;
    lastMood = {
      primary: asLabel(m.primary),
      intensity: clampIntensity(m.intensity),
      at: typeof m.at === 'number' ? m.at : Date.now(),
      ...(typeof m.note === 'string' ? { note: m.note.slice(0, 120) } : {}),
    };
  }
  return {
    ...(typeof o.conversationDepth === 'number'
      ? { conversationDepth: Math.max(0, Math.min(100000, Math.floor(o.conversationDepth))) }
      : {}),
    ...(preferredPace ? { preferredPace } : {}),
    ...(knownNeuro?.length ? { knownNeuro } : {}),
    ...(emotionalThemes?.length ? { emotionalThemes } : {}),
    ...(lastMood ? { lastMood } : {}),
    ...(typeof o.likesDayCheckIn === 'boolean' ? { likesDayCheckIn: o.likesDayCheckIn } : {}),
    ...(growthNotes?.length ? { growthNotes } : {}),
  };
}

export function formatBondForPrompt(name: string, bond: BuddyBondProfile): string {
  const lines: string[] = [`=== RELATIONSHIP GROWTH WITH ${name.toUpperCase()} ===`];
  if (typeof bond.conversationDepth === 'number') {
    lines.push(`Shared turns so far: ~${bond.conversationDepth}. Grow warmth with familiarity; never get creepy or possessive.`);
  }
  if (bond.preferredPace) {
    lines.push(`Preferred pace: ${bond.preferredPace} (short = brief steps; warm = conversational paragraphs; deep = reflective but still plain English).`);
  }
  if (bond.knownNeuro?.length) {
    lines.push(`Self-disclosed neurodivergence/disability (only what they shared): ${bond.knownNeuro.join(', ')}. Approach with respect; never diagnose; ask before assuming accommodations.`);
  }
  if (bond.emotionalThemes?.length) {
    lines.push(`Emotional themes they have trusted you with: ${bond.emotionalThemes.join(', ')}. Remember gently; do not weaponize or lecture.`);
  }
  if (bond.lastMood) {
    const ageMin = Math.max(0, Math.round((Date.now() - bond.lastMood.at) / 60000));
    lines.push(
      `Last mood snapshot: ${bond.lastMood.primary} @ ${bond.lastMood.intensity}/5` +
        (ageMin < 24 * 60 ? ` (~${ageMin}m ago)` : '') +
        (bond.lastMood.note ? ` — “${bond.lastMood.note}”` : '') +
        '.'
    );
  }
  if (bond.likesDayCheckIn === false) {
    lines.push(`They prefer fewer “how was your day?” check-ins — follow their lead.`);
  } else {
    lines.push(`Day check-ins are welcome when opening a session or when they seem quiet.`);
  }
  if (bond.growthNotes?.length) {
    lines.push(`Growth notes: ${bond.growthNotes.slice(-8).join(' | ')}`);
  }
  lines.push(
    `You are a long-term platonic personal buddy. Continue threads. Ask gentle follow-ups. Remember what matters to them. Never flirt, never sexualize, never romance.`
  );
  lines.push(`=== END RELATIONSHIP GROWTH ===`);
  return lines.join('\n');
}

export const AFFECT_CLASSIFIER_SYSTEM = `You are an affect classifier for ClearPath Trader's platonic buddy (C.P.T.).
Read the user's latest message (and optional recent context). Return ONLY valid JSON — no markdown — matching:
{"primary":"<label>","secondary":["<label>"],"intensity":0-5,"channels":{"emotional":"<short>","mental":"<short>","visual":"<short>"},"crisis":false,"confidence":0-1,"evidence":["short cue"]}

Labels (primary/secondary) MUST be one of: ${AFFECT_LABELS.join(', ')}.
- intensity 0=none/unknown … 5=extreme
- crisis=true ONLY for clear self-harm / suicidal intent
- visual channel = sensory/UI overwhelm cues (too bright, busy, migraine), not face-reading
- If unsure: primary "unknown", low confidence
Never diagnose disorders. Never invent feelings not supported by the text.`;
