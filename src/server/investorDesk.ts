/**
 * Investor desk — one researched VC / angel / seed fund per Pacific day.
 *
 * Research sources are public only: seed notes (ours), Wikipedia REST,
 * and the firm's own homepage title/description. Groq may summarize those
 * texts. We never invent AUM, partners, or "they are interested".
 */

import fs from "node:fs";
import path from "node:path";
import { PRODUCT_LEGAL_NAME, PRODUCT_NAME, PRODUCT_URL } from "../content/productIdentity";
import { TRADER_DESK_IDS, TRADER_DESKS, type TraderDeskId } from "../lib/traderDesks";
import { getGroqApiKey } from "./secrets";
import { pacificDateKey } from "./dailyOpsCatalog";
import { US_INVESTOR_ROSTER, type InvestorRosterRow, type RosterKind } from "./usInvestorRoster";

/** One-line desk blurbs for founder outreach. Facts only — no invented data rooms. */
const DESK_LETTER_LINES: Record<TraderDeskId, string> = {
  institutional: "Information-first market command center (charts, flow, macro, and news).",
  fundamental: "Company, statements, earnings, valuation, and macro research.",
  retail: "Chart-first educational workstation for everyday traders.",
  neurodivergent:
    "Calm workstation with sensory UI profiles — a first-class site, not a marketing afterthought.",
};

const DESK_LETTER_LABELS: Record<TraderDeskId, string> = {
  institutional: "Institutional",
  fundamental: "Fundamental",
  retail: "Retail",
  neurodivergent: "Neurodivergent",
};

export type InvestorKind = "vc" | "seed" | "angel" | "accelerator" | "ib";

export type InvestorSeed = {
  id: string;
  name: string;
  kind: InvestorKind;
  website: string;
  wikipediaTitle?: string;
  /** Public profile for founder outreach — never auto-messaged. */
  linkedin?: string;
  /** Founder-only how-to-reach. Not copied into the outbound draft. */
  outreachHint?: string;
  /** Public firm inbox only — never a harvested personal address. */
  outreachEmail?: string;
  stage: string;
  thesis: string;
  whyClearPath: string;
  suggestedAngle: string;
};

export type InvestorResearch = {
  date: string;
  investor: InvestorSeed;
  wikiExtract?: string;
  wikiUrl?: string;
  siteTitle?: string;
  siteDescription?: string;
  groqFit?: string;
  sources: string[];
  draftNote: string;
  warnings: string[];
};

export type PipelineStatus = "queued" | "contacted" | "skipped" | "followup";

export type PipelineRow = {
  investorId: string;
  status: PipelineStatus;
  lastDate?: string;
  notes?: string;
  followUpDate?: string;
};

const DIR = path.join(process.cwd(), "data", "daily-ops");
const PIPELINE_FILE = path.join(DIR, "investor-pipeline.json");

export const INVESTOR_SEED: InvestorSeed[] = [
  {
    id: "kapor",
    name: "Kapor Capital",
    kind: "seed",
    website: "https://www.kaporcapital.com",
    wikipediaTitle: "Kapor_Capital",
    stage: "Pre-seed / seed",
    thesis: "Gap-closing companies that expand access and opportunity.",
    whyClearPath: "Neurodivergent accessibility is a gap-closing product, not a skin.",
    suggestedAngle: "Accessible market education + UI as civil-rights-adjacent tech, not another signal shop.",
  },
  {
    id: "precursor",
    name: "Precursor Ventures",
    kind: "seed",
    website: "https://www.precursorvc.com",
    stage: "Pre-seed",
    thesis: "Earliest checks into underestimated founders.",
    whyClearPath: "Pre-seed check size matches a live product that is not yet scaled revenue.",
    suggestedAngle: "Shipping product + accessibility thesis before a big round.",
  },
  {
    id: "harlem",
    name: "Harlem Capital",
    kind: "vc",
    website: "https://harlem.capital",
    stage: "Seed / Series A",
    thesis: "Diverse founding teams across sectors.",
    whyClearPath: "Founder-led, disability-informed product in a white-space category.",
    suggestedAngle: "Who gets to see markets clearly — and who software has historically excluded.",
  },
  {
    id: "backstage",
    name: "Backstage Capital",
    kind: "seed",
    website: "https://backstagecapital.com",
    wikipediaTitle: "Backstage_Capital",
    stage: "Pre-seed / seed",
    thesis: "Underestimated founders (women, people of color, LGBTQ+).",
    whyClearPath: "Disability / neurodivergence is an underestimated founder + user story.",
    suggestedAngle: "Build for the traders traditional terminals overload.",
  },
  {
    id: "reach",
    name: "Reach Capital",
    kind: "vc",
    website: "https://www.reachcapital.com",
    stage: "Seed / A",
    thesis: "Education technology from early childhood through workforce.",
    whyClearPath: "Encyclopedia + ClearPath Education is an education company that happens to chart.",
    suggestedAngle: "Financial literacy OS, not a brokerage.",
  },
  {
    id: "gsv",
    name: "GSV Ventures",
    kind: "vc",
    website: "https://www.gsv.ventures",
    stage: "Growth / education",
    thesis: "Learning and workforce.",
    whyClearPath: "Education-scale narrative once MAU exists; still useful for relationship building.",
    suggestedAngle: "Curriculum + charts as a learning product.",
  },
  {
    id: "learn",
    name: "Learn Capital",
    kind: "vc",
    website: "https://www.learncapital.com",
    stage: "Seed / A",
    thesis: "Global learning.",
    whyClearPath: "Same education-first framing as Reach.",
    suggestedAngle: "Adult financial education with accessibility baked in.",
  },
  {
    id: "qed",
    name: "QED Investors",
    kind: "vc",
    website: "https://qedinvestors.com",
    wikipediaTitle: "QED_Investors",
    stage: "Seed / A fintech",
    thesis: "Fintech specialists (CapOne mafia).",
    whyClearPath: "They will ask hard unit-econ questions — good pressure once Stripe is live.",
    suggestedAngle: "Educational fintech, not a lender. Be explicit about no-brokerage.",
  },
  {
    id: "nyca",
    name: "Nyca Partners",
    kind: "vc",
    website: "https://nyca.com",
    stage: "Seed / A fintech",
    thesis: "Financial services infrastructure and brands.",
    whyClearPath: "Market data + education platform sitting next to (not becoming) a broker.",
    suggestedAngle: "Front-end of market literacy; compliance-safe visualization.",
  },
  {
    id: "ftc",
    name: "FinTech Collective",
    kind: "vc",
    website: "https://www.fintech.io",
    stage: "Seed / A",
    thesis: "Global fintech.",
    whyClearPath: "Sector map fit if positioned as education + data, not prop trading.",
    suggestedAngle: "Accessible terminal for retail education.",
  },
  {
    id: "ribbit",
    name: "Ribbit Capital",
    kind: "vc",
    website: "https://ribbitcap.com",
    wikipediaTitle: "Ribbit_Capital",
    stage: "Usually later fintech",
    thesis: "Fintech winners at scale.",
    whyClearPath: "Too late-stage for a first check — relationship / future round only.",
    suggestedAngle: "Do not pitch as a seed check. Note them for later; today's send may be skip.",
  },
  {
    id: "firstround",
    name: "First Round Capital",
    kind: "seed",
    website: "https://firstround.com",
    wikipediaTitle: "First_Round_Capital",
    stage: "Seed",
    thesis: "Seed-stage product companies, strong community.",
    whyClearPath: "Product-led, design-differentiated terminal.",
    suggestedAngle: "Software craft + accessibility as the moat.",
  },
  {
    id: "initialized",
    name: "Initialized Capital",
    kind: "seed",
    website: "https://initialized.com",
    wikipediaTitle: "Initialized_Capital",
    stage: "Seed",
    thesis: "Early-stage, often technical founders.",
    whyClearPath: "Shipped product, real users, technical depth (charts, Pine, Cloud Run).",
    suggestedAngle: "Founder-built market terminal with an education layer.",
  },
  {
    id: "homebrew",
    name: "Homebrew",
    kind: "seed",
    website: "https://homebrew.co",
    stage: "Seed",
    thesis: "Bottom-up software that becomes a habit.",
    whyClearPath: "Daily terminal habit + education.",
    suggestedAngle: "The desk people actually leave open.",
  },
  {
    id: "village",
    name: "Village Global",
    kind: "seed",
    website: "https://www.villageglobal.vc",
    stage: "Seed",
    thesis: "Network of operators as scouts.",
    whyClearPath: "Warm intros matter more than cold decks here.",
    suggestedAngle: "Ask which operator in their network lives at the a11y/fintech intersection.",
  },
  {
    id: "yc",
    name: "Y Combinator",
    kind: "accelerator",
    website: "https://www.ycombinator.com",
    wikipediaTitle: "Y_Combinator",
    stage: "Batch accelerator",
    thesis: "Standardized seed + network.",
    whyClearPath: "Batch timing is the constraint — check current RFS, do not spam.",
    suggestedAngle: "Apply only in an open batch window; otherwise skip.",
  },
  {
    id: "techstars",
    name: "Techstars",
    kind: "accelerator",
    website: "https://www.techstars.com",
    wikipediaTitle: "Techstars",
    stage: "Accelerator",
    thesis: "City/vertical programs including fintech.",
    whyClearPath: "Program fit (fintech / impact) beats a random VC email.",
    suggestedAngle: "Look for a current fintech or impact program deadline.",
  },
  {
    id: "owl",
    name: "Owl Ventures",
    kind: "vc",
    website: "https://owlvc.com",
    stage: "Education growth",
    thesis: "Knowledge economy / education.",
    whyClearPath: "Later than seed; still a compass for how they talk about learning products.",
    suggestedAngle: "Education metrics (completion, quiz pass) not trade PnL.",
  },
  {
    id: "obvious",
    name: "Obvious Ventures",
    kind: "vc",
    website: "https://obvious.com",
    stage: "Seed / A",
    thesis: "World-positive companies.",
    whyClearPath: "Accessibility + financial literacy as world-positive.",
    suggestedAngle: "Inclusive markets infrastructure.",
  },
  {
    id: "collabfund",
    name: "Collaborative Fund",
    kind: "vc",
    website: "https://www.collaborativefund.com",
    stage: "Seed / A",
    thesis: "Culture, consumer, and better systems.",
    whyClearPath: "Story-driven brand + product with a values layer.",
    suggestedAngle: "Who gets a fair shot at reading a chart.",
  },
  {
    id: "nmvp",
    name: "New Markets Venture Partners",
    kind: "vc",
    website: "https://www.newmarketsvp.com",
    stage: "Education / workforce",
    thesis: "Education and workforce outcomes.",
    whyClearPath: "ClearPath Education + literacy OS is the product they would diligence.",
    suggestedAngle: "Learning outcomes, not trade calls.",
  },
  {
    id: "acrew",
    name: "Acrew Capital",
    kind: "vc",
    website: "https://www.acrewcapital.com",
    stage: "Seed / A",
    thesis: "Thematic funds including access and identity.",
    whyClearPath: "Access-to-systems framing.",
    suggestedAngle: "Access to market information without sensory/cognitive lock-out.",
  },
  {
    id: "slow",
    name: "Slow Ventures",
    kind: "seed",
    website: "https://slow.co",
    stage: "Seed",
    thesis: "Consumer and culture-aware software.",
    whyClearPath: "Design-forward terminal; founder story.",
    suggestedAngle: "The anti-bloated trading app.",
  },
  {
    id: "pipeline",
    name: "Pipeline Angels",
    kind: "angel",
    website: "https://pipelineangels.com",
    stage: "Angel",
    thesis: "Women and non-binary angel network.",
    whyClearPath: "Angel check + network; accessibility/education story travels.",
    suggestedAngle:
      "Pipeline Angels’ network of women and non-binary angels is a natural home for an educational product I built for my own nervous system, with dedicated Institutional, Fundamental, Retail, and Neurodivergent sites already live.",
  },
  {
    id: "baird_augustine",
    name: "Ryan Baird / Baird Augustine",
    kind: "ib",
    website: "https://bairdaugustine.com",
    linkedin: "https://www.linkedin.com/in/ryandbaird",
    outreachHint:
      "LinkedIn ryandbaird or the Schedule a Call form on bairdaugustine.com. This is an investment-bank / placement relationship, not a typical seed-fund email.",
    stage: "Placement / IB — not a seed-fund check",
    thesis:
      "Silicon Valley neo-investment bank (Los Gatos, founded 2023): Corporate-Development-as-a-Service, due-diligence certification, roadshow membership, and institutional fundraising. Public about page lists Ryan Baird as CEO & co-founder (Morgan Stanley PWM on Sand Hill Road, derivatives trading, Flotilla Asset Management in 2010, LYKA raise then sale) and Henry Augustine as co-founder.",
    whyClearPath:
      "Ryan’s public bio is trader-then-operator, so a charting + education terminal is legible to him. Baird Augustine is a placement/IB shop that says it connects private companies to institutional capital — useful for intros and a raise process, not as today’s seed check. Homepage stats ($700B capital-network AUM, $20B+ dry powder) are marketing claims we have not verified; do not repeat them in outreach.",
    suggestedAngle:
      "You're a trader who became an operator — this is educational charting software (not a broker), with 13 neurodivergent accessibility profiles. Looking for a conversation and possible LP/operator intros, not a fund check.",
  },
];

const OVERLAY_FILE = path.join(DIR, "investor-catalog-overlay.json");

let catalogCache: InvestorSeed[] | null = null;

/** LinkedIn / Wellfound profiles must not collapse to one host. */
export function catalogIdentityKey(url: string): string {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./i, "").toLowerCase();
    if (
      host === "linkedin.com" ||
      host.endsWith(".linkedin.com") ||
      host === "angel.co" ||
      host === "wellfound.com" ||
      host === "x.com" ||
      host === "twitter.com"
    ) {
      return `${host}${parsed.pathname.replace(/\/$/, "").toLowerCase()}`;
    }
    return host;
  } catch {
    return url.trim().toLowerCase();
  }
}

function stageForKind(kind: RosterKind): string {
  if (kind === "ib") return "Investment bank / placement";
  if (kind === "angel") return "Angel / angel network";
  if (kind === "accelerator") return "Accelerator";
  if (kind === "seed") return "Pre-seed / seed";
  return "Venture capital";
}

export function rosterRowToSeed(row: InvestorRosterRow): InvestorSeed {
  return {
    id: row.id,
    name: row.name,
    kind: row.kind,
    website: row.website,
    linkedin: row.linkedin,
    outreachEmail: row.outreachEmail,
    outreachHint: row.outreachEmail
      ? `Public inbox ${row.outreachEmail}`
      : row.linkedin
        ? `Public LinkedIn ${row.linkedin}`
        : undefined,
    stage: stageForKind(row.kind),
    thesis: `US ${stageForKind(row.kind).toLowerCase()} with a public firm page. We do not invent AUM, partners, or interest.`,
    whyClearPath:
      "Educational market-intelligence terminal with four live desks (institutional, fundamental, retail, neurodivergent). Not a brokerage.",
    suggestedAngle:
      "ClearPath Trader is live educational software with dedicated Institutional, Fundamental, Retail, and Neurodivergent sites — not a brokerage and not trade advice.",
  };
}

export function loadOverlayRows(): InvestorRosterRow[] {
  try {
    if (!fs.existsSync(OVERLAY_FILE)) return [];
    const raw = JSON.parse(fs.readFileSync(OVERLAY_FILE, "utf8"));
    return Array.isArray(raw) ? raw : [];
  } catch {
    return [];
  }
}

export function saveOverlayRows(rows: InvestorRosterRow[]): void {
  if (!fs.existsSync(DIR)) fs.mkdirSync(DIR, { recursive: true });
  fs.writeFileSync(OVERLAY_FILE, JSON.stringify(rows, null, 2), "utf8");
  catalogCache = null;
}

export function resetInvestorCatalogCache(): void {
  catalogCache = null;
}

function normalizeFirmName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function mergeIntoExisting(existing: InvestorSeed, incoming: InvestorSeed): void {
  if (!existing.outreachEmail && incoming.outreachEmail) {
    existing.outreachEmail = incoming.outreachEmail;
    existing.outreachHint = existing.outreachHint || incoming.outreachHint;
  }
  if (!existing.linkedin && incoming.linkedin) existing.linkedin = incoming.linkedin;
}

/** Hand-tuned seeds first, then the public US roster, then founder overlay. A–Z by name. Identical name/site listings collapse; public email is kept. */
export function getInvestorCatalog(): InvestorSeed[] {
  if (catalogCache) return catalogCache;
  const out: InvestorSeed[] = [];
  const add = (seed: InvestorSeed) => {
    const id = seed.id.toLowerCase();
    const site = catalogIdentityKey(seed.linkedin || seed.website);
    const nameKey = normalizeFirmName(seed.name);
    const existing = out.find(
      (row) =>
        row.id.toLowerCase() === id ||
        (site && catalogIdentityKey(row.linkedin || row.website) === site) ||
        (nameKey && normalizeFirmName(row.name) === nameKey)
    );
    if (existing) {
      mergeIntoExisting(existing, seed);
      return;
    }
    out.push({ ...seed });
  };
  for (const seed of INVESTOR_SEED) add(seed);
  for (const row of US_INVESTOR_ROSTER) add(rosterRowToSeed(row));
  for (const row of loadOverlayRows()) add(rosterRowToSeed(row));
  out.sort((a, b) => a.name.localeCompare(b.name, "en", { sensitivity: "base" }));
  catalogCache = out;
  return out;
}

export function catalogKindCounts(list = getInvestorCatalog()): {
  vc: number;
  seed: number;
  angel: number;
  accelerator: number;
  ib: number;
  linkedin: number;
  withEmail: number;
  total: number;
} {
  const counts = {
    vc: 0,
    seed: 0,
    angel: 0,
    accelerator: 0,
    ib: 0,
    linkedin: 0,
    withEmail: 0,
    total: list.length,
  };
  for (const seed of list) {
    counts[seed.kind] += 1;
    if (seed.linkedin) counts.linkedin += 1;
    if (seed.outreachEmail) counts.withEmail += 1;
  }
  return counts;
}

export function findInvestorSeed(query: string): InvestorSeed | undefined {
  const q = query.trim().toLowerCase();
  if (!q) return undefined;
  const catalog = getInvestorCatalog();
  const exact = catalog.find((s) => s.id.toLowerCase() === q);
  if (exact) return exact;
  const handTuned = new Set(INVESTOR_SEED.map((s) => s.id));
  let best: InvestorSeed | undefined;
  let bestScore = 0;
  for (const seed of catalog) {
    const name = seed.name.toLowerCase();
    const id = seed.id.replace(/_/g, " ");
    let score = 0;
    if (name === q || id === q) score = 100;
    else if (name.startsWith(q) || id.startsWith(q)) score = 80;
    else if (name.includes(q) || id.includes(q)) score = 40;
    else if (seed.linkedin && seed.linkedin.toLowerCase().includes(q)) score = 20;
    else continue;
    if (handTuned.has(seed.id)) score += 10;
    if (score > bestScore) {
      bestScore = score;
      best = seed;
    }
  }
  return best;
}

type PipelineFile = { rows: PipelineRow[] };

function ensureDir() {
  if (!fs.existsSync(DIR)) fs.mkdirSync(DIR, { recursive: true });
}

export function readPipeline(): PipelineRow[] {
  try {
    if (!fs.existsSync(PIPELINE_FILE)) return [];
    const raw = JSON.parse(fs.readFileSync(PIPELINE_FILE, "utf8")) as PipelineFile;
    return Array.isArray(raw.rows) ? raw.rows : [];
  } catch {
    return [];
  }
}

function writePipeline(rows: PipelineRow[]) {
  ensureDir();
  fs.writeFileSync(PIPELINE_FILE, JSON.stringify({ rows }, null, 2), "utf8");
}

export function updatePipeline(
  investorId: string,
  patch: Partial<PipelineRow>
): PipelineRow[] {
  const rows = readPipeline();
  const i = rows.findIndex((r) => r.investorId === investorId);
  const next: PipelineRow = {
    investorId,
    status: patch.status || rows[i]?.status || "queued",
    lastDate: patch.lastDate ?? rows[i]?.lastDate,
    notes: patch.notes ?? rows[i]?.notes,
    followUpDate: patch.followUpDate ?? rows[i]?.followUpDate,
  };
  if (i >= 0) rows[i] = { ...rows[i], ...next };
  else rows.push(next);
  writePipeline(rows);
  return rows;
}

function pickInvestor(dateKey: string, investorId?: string): InvestorSeed {
  if (investorId) {
    const named = findInvestorSeed(investorId);
    if (named) return named;
    throw new Error(`Unknown investor: ${investorId}`);
  }
  const pipeline = readPipeline();
  const contacted = new Set(
    pipeline.filter((r) => r.status === "contacted" || r.status === "skipped").map((r) => r.investorId)
  );
  const catalog = getInvestorCatalog();
  const remaining = catalog.filter((s) => !contacted.has(s.id));
  const pool = remaining.length ? remaining : catalog;
  const n = dateKey.split("-").reduce((a, p) => a + Number(p), 0);
  return pool[n % pool.length];
}

async function fetchText(url: string, timeoutMs: number): Promise<string> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: {
        "User-Agent": "ClearPathTraderDailyOps/1.0 (founder ops; https://clearpathtrader.com)",
        Accept: "text/html,application/json",
      },
      redirect: "follow",
    });
    if (!res.ok) throw new Error(`${res.status}`);
    return await res.text();
  } finally {
    clearTimeout(t);
  }
}

function extractHtmlMeta(html: string): { title?: string; description?: string } {
  const slice = html.slice(0, 80_000);
  const title = slice.match(/<title[^>]*>([^<]+)/i)?.[1]?.replace(/\s+/g, " ").trim();
  const description =
    slice.match(
      /<meta[^>]+(?:name|property)=["'](?:description|og:description)["'][^>]+content=["']([^"']+)/i
    )?.[1]?.replace(/\s+/g, " ").trim() ||
    slice.match(
      /<meta[^>]+content=["']([^"']+)["'][^>]+(?:name|property)=["'](?:description|og:description)["']/i
    )?.[1]?.replace(/\s+/g, " ").trim();
  return { title, description };
}

async function wikiSummary(title: string): Promise<{ extract?: string; url?: string }> {
  const encoded = encodeURIComponent(title);
  const raw = await fetchText(
    `https://en.wikipedia.org/api/rest_v1/page/summary/${encoded}`,
    6000
  );
  const json = JSON.parse(raw) as { extract?: string; content_urls?: { desktop?: { page?: string } } };
  return {
    extract: json.extract?.slice(0, 1200),
    url: json.content_urls?.desktop?.page,
  };
}

async function groqFit(inv: InvestorSeed, corpus: string): Promise<string | undefined> {
  const key = getGroqApiKey();
  if (!key || !corpus.trim()) return undefined;
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "llama-3.1-8b-instant",
      temperature: 0.2,
      max_tokens: 280,
      messages: [
        {
          role: "system",
          content:
            "You help a founder prep investor outreach. Use ONLY the provided source text. If sources are thin, say so. Never invent AUM, partners, check sizes, or interest. Two short paragraphs: (1) what the firm says it does, (2) one honest fit/risk note for an accessible trading-education product that is NOT a broker.",
        },
        {
          role: "user",
          content: `Firm: ${inv.name}\nOur note: ${inv.whyClearPath}\n\nSources:\n${corpus.slice(0, 4000)}`,
        },
      ],
    }),
  });
  if (!res.ok) return undefined;
  const data = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
  return data.choices?.[0]?.message?.content?.trim();
}

function letterGreeting(inv: InvestorSeed): string {
  if (inv.id === "baird_augustine") return "Dear Ryan,";
  return `Dear ${inv.name},`;
}

function deskLetterBlock(): string {
  return TRADER_DESK_IDS.map((id) => {
    const href = `${PRODUCT_URL}${TRADER_DESKS[id].href}`;
    return [`${DESK_LETTER_LABELS[id]}`, href, DESK_LETTER_LINES[id]].join("\n");
  }).join("\n\n");
}

/** Copy-ready outreach letter. Never auto-sent. */
export function buildInvestorDraftLetter(inv: InvestorSeed): string {
  return [
    letterGreeting(inv),
    ``,
    `I am Richard A. Floyd, founder of ${PRODUCT_LEGAL_NAME} (${PRODUCT_NAME}).`,
    ``,
    `I am writing to introduce our live educational market-intelligence platform:`,
    ``,
    PRODUCT_URL,
    ``,
    `${PRODUCT_NAME} is charting and financial-education software. We are not a brokerage, and we do not provide trade advice.`,
    ``,
    `The product is four dedicated desks — each a first-class site on its own URL:`,
    ``,
    deskLetterBlock(),
    ``,
    `${inv.suggestedAngle.replace(/[.!?]*$/, "")}.`,
    ``,
    ...(inv.linkedin ? [`Public profile: ${inv.linkedin}`, ``] : []),
    `If a brief conversation would be useful, I would be glad to walk through all four desks in about ten minutes.`,
    ``,
    `Sincerely,`,
    ``,
    `Richard A. Floyd`,
    `Founder, ${PRODUCT_LEGAL_NAME}`,
    PRODUCT_URL,
  ].join("\n");
}

export async function researchInvestorForDate(
  at: Date = new Date(),
  investorId?: string
): Promise<InvestorResearch> {
  const date = pacificDateKey(at);
  const investor = pickInvestor(date, investorId);
  const sources: string[] = ["seed_catalog"];
  const warnings: string[] = [];
  let wikiExtract: string | undefined;
  let wikiUrl: string | undefined;
  let siteTitle: string | undefined;
  let siteDescription: string | undefined;

  if (investor.wikipediaTitle) {
    try {
      const w = await wikiSummary(investor.wikipediaTitle);
      wikiExtract = w.extract;
      wikiUrl = w.url;
      if (wikiExtract) sources.push("wikipedia");
    } catch (e: any) {
      warnings.push(`Wikipedia unavailable (${e?.message || e})`);
    }
  }

  try {
    const html = await fetchText(investor.website, 7000);
    const meta = extractHtmlMeta(html);
    siteTitle = meta.title;
    siteDescription = meta.description;
    if (siteTitle || siteDescription) sources.push("firm_homepage");
  } catch (e: any) {
    warnings.push(`Homepage fetch failed (${e?.message || e})`);
  }

  const corpus = [
    wikiExtract ? `Wikipedia: ${wikiExtract}` : "",
    siteTitle ? `Homepage title: ${siteTitle}` : "",
    siteDescription ? `Homepage description: ${siteDescription}` : "",
    `Seed thesis: ${investor.thesis}`,
  ]
    .filter(Boolean)
    .join("\n");

  let groqSummary: string | undefined;
  try {
    groqSummary = await groqFit(investor, corpus);
    if (groqSummary) sources.push("groq_summary_of_sources");
  } catch (e: any) {
    warnings.push(`Groq summary skipped (${e?.message || e})`);
  }

  if (sources.length === 1) {
    warnings.push("No live public page retrieved — using only our seed notes. Do not treat this as diligence.");
  }
  if (investor.kind === "ib") {
    warnings.push(
      "Investment bank / placement shop, not a seed VC. Do not treat homepage AUM or dry-powder figures as verified."
    );
  }

  return {
    date,
    investor,
    wikiExtract,
    wikiUrl,
    siteTitle,
    siteDescription,
    groqFit: groqSummary,
    sources,
    draftNote: buildInvestorDraftLetter(investor),
    warnings,
  };
}
