/**
 * Governed ClearPathTrader Marketing Intelligence registry.
 * Readiness scores measure implementation quality — not demand, rankings, or revenue.
 * AI may research, classify, and draft. It may not autonomously publish or buy ads.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, "..", "data");
const SCORES_FILE = path.join(DATA_DIR, "intelligence-scores.json");

export const SCHEMA_VERSION = 1;
export const REGISTRY_NAME = "ClearPathTrader Marketing Intelligence Capability Registry";

export const GOVERNANCE = {
  ApprovalRule:
    "Founder approval is required before publishing, advertising, metadata changes, scheduling, or spending.",
  MeasurementRule:
    "Readiness scores measure implementation quality—not demand, rankings, revenue, or market share.",
  TruthRule:
    "Only verified ClearPathTrader capabilities and measured first-party outcomes may be presented as facts.",
  AutomationRule:
    "AI may research, classify, match, and draft. It may not autonomously publish or purchase advertising.",
  ClaimRule:
    "Never invent rankings, search volume, trends, customers, testimonials, performance, or competitor claims.",
};

export const CAPABILITIES = [
  {
    ID: "SEO",
    Name: "Search Engine Optimization",
    Family: "Search Discovery",
    Maturity: "Active",
    Purpose: "Connect verified search intent to canonical, indexable ClearPathTrader pages.",
  },
  {
    ID: "GEO",
    Name: "Generative Engine Optimization",
    Family: "Search Discovery",
    Maturity: "Active",
    Purpose: "Make factual ClearPathTrader explanations retrievable and citation-ready for generative engines.",
  },
  {
    ID: "AEO",
    Name: "Answer Engine Optimization",
    Family: "Search Discovery",
    Maturity: "Active",
    Purpose: "Answer genuine product and market-education questions clearly and directly.",
  },
  {
    ID: "LLMO",
    Name: "Large Language Model Optimization",
    Family: "Search Discovery",
    Maturity: "Active",
    Purpose: "Improve factual ClearPathTrader representation in language-model retrieval.",
  },
  {
    ID: "AIO",
    Name: "AI Optimization",
    Family: "Search Discovery",
    Maturity: "Umbrella",
    Purpose: "Coordinate GEO, AEO, LLMO, AISO, and GSO through one evidence system.",
  },
  {
    ID: "AISO",
    Name: "AI Search Optimization",
    Family: "Search Discovery",
    Maturity: "Active",
    Purpose: "Prepare pages for AI-assisted search experiences combining links and generated answers.",
  },
  {
    ID: "GSO",
    Name: "Generative Search Optimization",
    Family: "Search Discovery",
    Maturity: "Active",
    Purpose: "Structure verified pages for generative search-result experiences.",
  },
  {
    ID: "SMO",
    Name: "Social Media Optimization",
    Family: "Search Discovery",
    Maturity: "Active",
    Purpose: "Adapt approved education and product demonstrations to each social network.",
  },
  {
    ID: "SSO",
    Name: "Social Search Optimization",
    Family: "Search Discovery",
    Maturity: "Active",
    Purpose: "Improve discovery inside social-network search using platform-native language.",
  },
  {
    ID: "VSO",
    Name: "Video Search Optimization",
    Family: "Search Discovery",
    Maturity: "Active",
    Purpose: "Improve discovery and understanding of approved educational videos.",
  },
  {
    ID: "HSO",
    Name: "Hashtag Search Optimization",
    Family: "Search Discovery",
    Maturity: "Supporting",
    Purpose: "Use restrained, platform-specific hashtags as supporting discovery metadata.",
  },
  {
    ID: "ASO",
    Name: "App Store Optimization",
    Family: "Search Discovery",
    Maturity: "Planned",
    Purpose: "Prepare accurate store listings and creative for released ClearPathTrader applications.",
  },
  {
    ID: "LOCAL",
    Name: "Local and Regional Search Optimization",
    Family: "Search Discovery",
    Maturity: "Active",
    Purpose: "Connect reviewed regional and translated content with geographic search contexts.",
  },
  {
    ID: "VOICE",
    Name: "Voice Search Optimization",
    Family: "Search Discovery",
    Maturity: "Planned",
    Purpose: "Structure concise, speakable answers for verified educational and product questions.",
  },
  {
    ID: "ENTITY",
    Name: "Entity Optimization",
    Family: "Knowledge and Authority",
    Maturity: "Active",
    Purpose: "Keep ClearPathTrader, its company, founder, products, and public pages unambiguous.",
  },
  {
    ID: "KGO",
    Name: "Knowledge Graph Optimization",
    Family: "Knowledge and Authority",
    Maturity: "Active",
    Purpose: "Express verified relationships among ClearPath entities, products, topics, and resources.",
  },
  {
    ID: "EEAT",
    Name: "Experience, Expertise, Authoritativeness and Trust",
    Family: "Knowledge and Authority",
    Maturity: "Active",
    Purpose: "Expose accountable authorship, first-hand experience, sources, corrections, and product truth.",
  },
  {
    ID: "CRO",
    Name: "Conversion Rate Optimization",
    Family: "Experience and Conversion",
    Maturity: "Active",
    Purpose: "Improve measured progression from qualified visits to registrations, trials, and memberships.",
  },
  {
    ID: "SXO",
    Name: "Search Experience Optimization",
    Family: "Experience and Conversion",
    Maturity: "Active",
    Purpose: "Ensure each destination satisfies the search intent that produced the visit.",
  },
  {
    ID: "AAO",
    Name: "Accessibility and Assistive Optimization",
    Family: "Experience and Conversion",
    Maturity: "Active",
    Purpose: "Make discovery and conversion journeys usable across assistive technologies and cognitive needs.",
  },
];

const DEFAULT_READINESS = {
  Active: 35,
  Supporting: 20,
  Umbrella: 40,
  Planned: 8,
};

const CLAIM_PATTERNS = [
  { re: /(#\s*1|\bnumber[\s-]one\b|\branked\s+#?\d+|\btop[\s-]?ranked\b)/i, reason: "Invented ranking" },
  { re: /\b(search volume|monthly searches|\d[\d,]+\s+searches)\b/i, reason: "Invented search volume" },
  { re: /\b(trending\s+#\d|google trend|exploding demand)\b/i, reason: "Invented trend claim" },
  { re: /\b(testimonial|customers? (say|love|rave)|as seen on)\b/i, reason: "Invented social proof" },
  { re: /\b(guaranteed (returns?|profit|income)|beat(s|ing)? (the market|tradingview|thinkorswim))\b/i, reason: "Invented performance or competitor claim" },
  { re: /\b\d{1,3}%\s+(of )?(traders|users|customers)\b/i, reason: "Invented customer statistic" },
];

function ensureDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}

function loadScores() {
  ensureDir();
  try {
    const parsed = JSON.parse(fs.readFileSync(SCORES_FILE, "utf8"));
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function saveScores(scores) {
  ensureDir();
  const tmp = SCORES_FILE + ".tmp";
  fs.writeFileSync(tmp, JSON.stringify(scores, null, 2), "utf8");
  fs.renameSync(tmp, SCORES_FILE);
}

function clampScore(n) {
  const v = Number(n);
  if (!Number.isFinite(v)) return null;
  return Math.max(0, Math.min(100, Math.round(v)));
}

export function defaultReadiness(maturity) {
  return DEFAULT_READINESS[maturity] ?? 10;
}

export function getRegistry() {
  const scores = loadScores();
  const capabilities = CAPABILITIES.map((cap) => {
    const saved = scores[cap.ID] || {};
    const readiness =
      typeof saved.readiness === "number" ? saved.readiness : defaultReadiness(cap.Maturity);
    return {
      ...cap,
      Readiness: readiness,
      ReadinessNote: saved.note || "Implementation quality on this console — not demand or rankings.",
      UpdatedAt: saved.updatedAt || null,
      UpdatedBy: saved.updatedBy || null,
    };
  });
  return {
    SchemaVersion: SCHEMA_VERSION,
    UpdatedAt: new Date().toISOString().slice(0, 10),
    Name: REGISTRY_NAME,
    Governance: GOVERNANCE,
    MeasurementDisclaimer:
      "Readiness is an internal implementation score (0–100). It is not search volume, ranking, revenue, or market share.",
    AutomationDisclaimer:
      "This desk classifies and drafts only. Dispatch still requires an explicit founder click. Nothing here buys ads.",
    Capabilities: capabilities,
  };
}

export function patchCapability(id, patch, username) {
  const cap = CAPABILITIES.find((c) => c.ID === String(id || "").toUpperCase());
  if (!cap) return null;
  const scores = loadScores();
  const prev = scores[cap.ID] || {};
  const next = {
    readiness:
      patch.readiness === undefined ? prev.readiness ?? defaultReadiness(cap.Maturity) : clampScore(patch.readiness),
    note: patch.note !== undefined ? String(patch.note).slice(0, 400) : prev.note || "",
    updatedAt: new Date().toISOString(),
    updatedBy: username || "unknown",
  };
  if (next.readiness == null) next.readiness = prev.readiness ?? defaultReadiness(cap.Maturity);
  scores[cap.ID] = next;
  saveScores(scores);
  return getRegistry().Capabilities.find((c) => c.ID === cap.ID);
}

function tokens(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2);
}

export function matchDraft(title, caption) {
  const hay = `${title || ""} ${caption || ""}`.toLowerCase();
  const words = new Set(tokens(hay));
  const scored = CAPABILITIES.map((cap) => {
    const corpus = `${cap.ID} ${cap.Name} ${cap.Purpose}`.toLowerCase();
    const keys = tokens(corpus);
    let hits = 0;
    const reasons = [];
    for (const k of keys) {
      if (k.length < 4) continue;
      if (hay.includes(k) || words.has(k)) {
        hits += 1;
        if (reasons.length < 3) reasons.push(k);
      }
    }
    if (/\b(youtube|video|caption|chapter)\b/.test(hay) && cap.ID === "VSO") hits += 4;
    if (/\b(hashtag|#)\b/.test(hay) && cap.ID === "HSO") hits += 3;
    if (/\b(faq|question|answer)\b/.test(hay) && cap.ID === "AEO") hits += 3;
    if (/\b(chatgpt|gemini|perplexity|llm)\b/.test(hay) && (cap.ID === "GEO" || cap.ID === "LLMO")) hits += 3;
    if (/\b(accessib|veteran|neurodivergent|calm|no.?flash)\b/.test(hay) && cap.ID === "AAO") hits += 4;
    if (/\b(instagram|tiktok|facebook|linkedin|social)\b/.test(hay) && (cap.ID === "SMO" || cap.ID === "SSO")) hits += 3;
    if (/\b(app store|play store|apk)\b/.test(hay) && cap.ID === "ASO") hits += 4;
    return { ...cap, score: hits, reasons };
  })
    .filter((c) => c.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 8);

  return {
    governance: GOVERNANCE,
    matched: scored,
    unmatchedNote:
      scored.length === 0
        ? "No capability matched this draft. Classify it manually in Intelligence, or keep it as a plain education post."
        : "Matches are classification only. They are not proof of demand and do not publish anything.",
  };
}

export function scanClaims(text) {
  const body = String(text || "");
  const hits = [];
  for (const { re, reason } of CLAIM_PATTERNS) {
    const m = body.match(re);
    if (m) hits.push({ reason, snippet: m[0] });
  }
  return hits;
}

export function toCsv(capabilities) {
  const rows = [["ID", "Name", "Family", "Maturity", "Purpose", "Readiness", "ReadinessNote"]];
  for (const c of capabilities) {
    const cells = [c.ID, c.Name, c.Family, c.Maturity, c.Purpose, String(c.Readiness ?? ""), c.ReadinessNote || ""].map(
      (v) => `"${String(v).replaceAll('"', '""')}"`,
    );
    rows.push(cells);
  }
  return rows.map((r) => r.join(",")).join("\n");
}
