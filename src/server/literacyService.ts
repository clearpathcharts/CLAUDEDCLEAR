import crypto from "crypto";

const MAX_BYTES = 1_500_000;
const FETCH_TIMEOUT_MS = 10_000;

function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

function extractTitle(html: string): string {
  const m = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return m ? stripHtml(m[1]).slice(0, 200) : "Untitled page";
}

export async function fetchPageFingerprint(url: string): Promise<{
  url: string;
  hash: string;
  title: string;
  excerpt: string;
  byteLength: number;
  fetchedAt: number;
}> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "ClearPathLiteracyOS/1.0 (+https://clearpathtrader.com; education research)",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
      redirect: "error",
    });
    if (!res.ok) {
      throw new Error(`Upstream returned ${res.status}`);
    }
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.byteLength > MAX_BYTES) {
      throw new Error("Page exceeds size limit");
    }
    const html = buf.toString("utf8");
    const text = stripHtml(html);
    const normalized = text.toLowerCase().replace(/\s+/g, " ").trim();
    const hash = crypto.createHash("sha256").update(normalized).digest("hex");
    return {
      url,
      hash,
      title: extractTitle(html),
      excerpt: text.slice(0, 480),
      byteLength: buf.byteLength,
      fetchedAt: Date.now(),
    };
  } finally {
    clearTimeout(timer);
  }
}

function tokenize(s: string): string[] {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 2);
}

function scoreText(queryTokens: string[], text: string): number {
  if (!queryTokens.length) return 0;
  const hay = new Set(tokenize(text));
  let hits = 0;
  for (const t of queryTokens) if (hay.has(t)) hits += 1;
  return hits / queryTokens.length;
}

export function runTruthSearch(input: {
  query: string;
  vault: Array<{ id: string; title: string; body: string; tags?: string[] }>;
  wiki: Array<{ id: string; title: string; summary: string; body: string; tags?: string[] }>;
  marketNote?: string;
}): {
  hits: Array<{ id: string; title: string; snippet: string; source: "vault" | "wiki" | "market"; score: number }>;
  marketNote?: string;
} {
  const q = tokenize(input.query);
  const hits: Array<{
    id: string;
    title: string;
    snippet: string;
    source: "vault" | "wiki" | "market";
    score: number;
  }> = [];

  for (const v of input.vault || []) {
    const blob = `${v.title} ${v.body} ${(v.tags || []).join(" ")}`;
    const score = scoreText(q, blob);
    if (score > 0) {
      hits.push({
        id: v.id,
        title: v.title,
        snippet: v.body.slice(0, 220),
        source: "vault",
        score,
      });
    }
  }
  for (const w of input.wiki || []) {
    const blob = `${w.title} ${w.summary} ${w.body} ${(w.tags || []).join(" ")}`;
    const score = scoreText(q, blob);
    if (score > 0) {
      hits.push({
        id: w.id,
        title: w.title,
        snippet: (w.summary || w.body).slice(0, 220),
        source: "wiki",
        score,
      });
    }
  }
  if (input.marketNote) {
    const score = scoreText(q, input.marketNote);
    if (score > 0 || q.some((t) => input.marketNote!.toLowerCase().includes(t))) {
      hits.push({
        id: "market_live",
        title: "Verified market data context",
        snippet: input.marketNote.slice(0, 220),
        source: "market",
        score: Math.max(score, 0.35),
      });
    }
  }

  hits.sort((a, b) => b.score - a.score);
  return { hits: hits.slice(0, 24), marketNote: input.marketNote };
}

export function scoreMentorAnswer(input: {
  question: string;
  answer: string;
  vaultNotes: string[];
  marketContext?: string;
}): { score: number; reasons: string[] } {
  const answer = (input.answer || "").trim();
  const reasons: string[] = [];
  let score = 40;

  if (answer.length < 40) {
    score -= 15;
    reasons.push("Answer is very short — thin for a study tutor.");
  } else {
    score += 10;
    reasons.push("Answer has enough length to teach.");
  }

  const uncertainty = /(may|might|uncertain|depends|unknown|not sure|evidence|condition)/i.test(answer);
  if (uncertainty) {
    score += 15;
    reasons.push("Uses uncertainty language instead of false certainty.");
  } else {
    score -= 10;
    reasons.push("Little uncertainty language — risk of overconfidence.");
  }

  const adviceLike = /\b(buy|sell|long|short|enter|exit|leverage|guaranteed)\b/i.test(answer);
  if (adviceLike) {
    score -= 35;
    reasons.push("Contains action/advice language — penalized for literacy mode.");
  } else {
    score += 10;
    reasons.push("Stays clear of buy/sell advice language.");
  }

  const notes = (input.vaultNotes || []).join(" ").toLowerCase();
  const answerTokens = tokenize(answer).slice(0, 40);
  let overlap = 0;
  if (notes) {
    for (const t of answerTokens) if (notes.includes(t)) overlap += 1;
  }
  if (notes && overlap >= 3) {
    score += 15;
    reasons.push("Overlaps with your vault notes (grounded in your study archive).");
  } else if (notes) {
    reasons.push("Weak overlap with vault notes — consider archiving better evidence.");
  }

  if (input.marketContext) {
    const m = input.marketContext.toLowerCase();
    const mHits = answerTokens.filter((t) => m.includes(t)).length;
    if (mHits >= 2) {
      score += 10;
      reasons.push("Touches live market context tokens.");
    }
  }

  score = Math.max(0, Math.min(100, Math.round(score)));
  return { score, reasons };
}
