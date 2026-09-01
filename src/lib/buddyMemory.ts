/** Shared C.P.T. Buddy memory helpers (client + server). */

export const MAX_CONVERSATION_BULLETS = 40;
export const MAX_BULLET_CHARS = 140;

export function sanitizeConversationBullet(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  const t = raw.trim().replace(/\s+/g, ' ').replace(/^[-•*]\s*/, '');
  if (t.length < 8) return null;
  if (t.length > MAX_BULLET_CHARS) return `${t.slice(0, MAX_BULLET_CHARS - 1)}…`;
  return t;
}

export function normalizeConversationBullets(raw: unknown, max = MAX_CONVERSATION_BULLETS): string[] {
  if (!Array.isArray(raw)) return [];
  const out: string[] = [];
  for (const item of raw) {
    const t = sanitizeConversationBullet(item);
    if (!t) continue;
    if (!out.some((y) => y.toLowerCase() === t.toLowerCase())) out.push(t);
  }
  return out.slice(-max);
}

export function mergeMemoryLines(prev: string[], extra: string[], max: number): string[] {
  return normalizeConversationBullets([...prev, ...extra], max);
}

/** Local fallback when Groq does not return a recap for this turn. */
export function fallbackConversationBullet(question: string): string | null {
  const t = sanitizeConversationBullet(question);
  if (!t) return null;
  if (/^(hi|hey|hello|ok|okay|thanks|thank you|yo)\b/i.test(t) && t.length < 18) return null;
  if (/^you (said|asked|talked)/i.test(t)) return t;
  return `You said: ${t}`;
}
