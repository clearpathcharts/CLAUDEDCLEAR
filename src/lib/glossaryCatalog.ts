/**
 * Educational glossary catalog — core practitioner terms + seed dictionary +
 * unique procedural vocabulary nodes. Missing vendor cells stay DATA UNAVAILABLE.
 */
import { REAL_GLOSSARY_TERMS } from '../components/encyclopedia/RealGlossaryData';
import { GLOSSARY_TERMS as CORE_GLOSSARY_TERMS } from '../server/contentData';
import { getProceduralGlossary } from '../utils/searchEngine';

export const GLOSSARY_DISCLAIMER =
  'Educational glossary. Not a live data feed, not a brokerage, and not investment advice. Missing market cells stay DATA UNAVAILABLE.';

export type GlossarySource = 'core' | 'seed' | 'procedural';

export type GlossaryRecord = {
  slug: string;
  term: string;
  definition: string;
  category: string;
  source: GlossarySource;
  related: string[];
  seoTitle: string;
  seoDescription: string;
  letter: string;
};

const PREFIX_SENSE: Record<string, string> = {
  Bilateral: 'a two-sided relationship',
  Leveraged: 'amplified exposure relative to posted capital',
  Sovereign: 'a government or central-bank constraint',
  Quantitative: 'a measured, model-driven view',
  Systemic: 'a market-wide rather than single-name effect',
  Dynamic: 'a quantity that changes as conditions change',
  Structural: 'the lasting layout of a market, not a one-day print',
  Asymmetric: 'uneven upside versus downside',
  Macro: 'economy-wide forces',
  Micro: 'instrument-level detail',
  Algorithmic: 'rules a machine can execute',
  Consolidated: 'many positions or prices treated as one book',
  Amortized: 'cost or risk spread across time',
  Stochastic: 'a process with randomness',
  Arbitrage: 'a gap between related prices',
  Deleveraged: 'reduced borrowed exposure',
  'High-Velocity': 'fast turnover of orders or capital',
  Collateralized: 'credit backed by pledged assets',
  Hedging: 'an offset built to cut a named risk',
  Liquidity: 'the ability to transact without moving price much',
  Inverted: 'a usual ranking that has flipped',
  Disinflationary: 'prices still rising, but more slowly',
  'Yield-Weighted': 'a mix that favors higher-yielding legs',
  Baseload: 'the persistent core of demand or supply',
  Frictionless: 'a textbook case that ignores costs',
  Bespoke: 'a custom contract, not a listed standard',
  Locked: 'capital or inventory that cannot move freely',
  'EUV-Wiped': 'a supply shock in advanced chipmaking kit',
  Synthetic: 'exposure built from derivatives rather than the cash asset',
  Annuity: 'a stream of payments over time',
  Hyper: 'an extreme, usually unstable, magnitude',
  Implied: 'a value the market prices in rather than measures in cash',
  Realized: 'a value measured from history, not from a model’s forecast',
  Overnight: 'a risk or rate that lives from one session close to the next open',
  Intraday: 'a quantity that only exists inside a single session',
  'Cross-Asset': 'a relationship that spans more than one asset class',
  Idiosyncratic: 'a name-specific effect, not a market-wide factor',
  Seasonal: 'a pattern that repeats with the calendar',
  Unsecured: 'credit with no pledged collateral',
  Callable: 'a contract the issuer can end early',
  Convertible: 'a claim that can change into another claim',
  Contingent: 'a payoff that depends on a defined event',
  Net: 'a figure after offsets',
  Gross: 'a figure before offsets',
};

const CORE_SENSE: Record<string, string> = {
  Easing: 'policy or credit conditions becoming looser',
  Tightening: 'policy or credit conditions becoming stricter',
  'Cap Rate': 'the yield used to translate income into asset value',
  Indexation: 'tying a payment or contract to a published index',
  Velocity: 'how quickly money or inventory turns over',
  Spread: 'the gap between two related prices or yields',
  'Bond Duration': 'how sensitive a bond’s price is to rate moves',
  'Glow-Weight': 'an informal weight on a factor that currently dominates attention',
  Collateral: 'assets pledged against a loan or derivative',
  'Options Delta': 'how much an option’s price moves when the underlying moves',
  'Gamma Squeeze': 'dealers hedging option gamma in a way that accelerates the underlying',
  'Carry Trade': 'borrowing a cheap funding leg to hold a higher-yielding one',
  'BPS Interval': 'a move or spread counted in hundredths of a percent',
  'Refinement Layer': 'an extra filter applied after a first-pass model',
  'Asset Exposure': 'how much wealth is tied to a named risk',
  'Toll Capture': 'extracting a fee or rent from a bottleneck',
  'Hedge Ratio': 'the size of the offset relative to the original risk',
  'Market Ingress': 'the path and cost of entering a venue or position',
  'Premium Lock': 'fixing an option or insurance premium in advance',
  'Mining Halving': 'a scheduled cut in block-reward issuance on a proof-of-work chain',
  'Gas Burn Rate': 'how quickly a blockchain consumes fees for block space',
  'Spot Premium': 'how far cash/spot trades versus a related forward or derivative',
  'Volatility Skew': 'implied vol that is not the same across strikes',
  'Black-Scholes Wave': 'a textbook options-pricing frame, not a live implied surface',
  'Yield Curve Flip': 'a change in the shape of rates across maturities',
  'Credit Facility': 'a committed line a borrower can draw',
  'Liquidation Threshold': 'the equity level that forces a levered book closed',
  'Margin Sweep': 'a broker or CCP pulling extra collateral after a move',
  'T-Bill Bidding': 'the auction process for short-term Treasury bills',
  'Repo Auction': 'the market that finances bonds overnight against collateral',
  Convexity: 'how duration itself changes as yields move',
  'Open Interest': 'the number of derivative contracts still outstanding',
  'Free Float': 'shares that can actually trade, not the whole share count',
  'Sharpe Ratio': 'excess return per unit of volatility — a study statistic, not a promise',
  'Max Drawdown': 'the worst peak-to-trough decline in a path of returns',
  Contango: 'a forward curve where later dates are richer than spot',
  Backwardation: 'a forward curve where later dates are cheaper than spot',
  'Basis Point': 'one hundredth of a percent',
  Rollover: 'closing a near contract and opening a later one',
  Settlement: 'the process that actually exchanges cash or the asset',
};

const CATEGORY_FRAME: Record<string, string> = {
  Macroeconomics: 'macro and policy vocabulary',
  'Corporate Finance': 'firm financing and statements vocabulary',
  'Forex Mechanisms': 'currency-market vocabulary',
  'Algorithmic Arbitrage': 'systematic trading vocabulary',
  'Options Derivatives': 'options and payoff vocabulary',
  'Bond Physics': 'rates and fixed-income vocabulary',
  'Crypto Mathematics': 'digital-asset vocabulary',
  'Venture Portfolios': 'private-market vocabulary',
  'Ecosystem Strategy': 'platform and network vocabulary',
  Stocks: 'equity-market vocabulary',
};

export function slugifyGlossaryTerm(raw: string): string {
  const slug = raw
    .toLowerCase()
    .replace(/%/g, ' percent ')
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
  return slug || 'term';
}

function letterOf(term: string): string {
  const ch = term.trim().charAt(0).toUpperCase();
  return ch >= 'A' && ch <= 'Z' ? ch.toLowerCase() : '0';
}

function fitTitle(preferred: string, fallback: string, max = 70): string {
  if (preferred.length <= max) return preferred;
  return fallback.length <= max ? fallback : fallback.slice(0, max);
}

/** Sentence-aware meta description: ≤160 chars, no ellipsis, no mid-word cut. */
export function fitMetaDescription(raw: string, max = 160): string {
  const t = raw.replace(/\s+/g, ' ').trim();
  if (t.length <= max) return t;
  const cut = t.slice(0, max);
  const sp = cut.lastIndexOf(' ');
  return (sp > 80 ? cut.slice(0, sp) : cut).trimEnd();
}

function fitDesc(raw: string, max = 160): string {
  return fitMetaDescription(raw, max);
}

export function uniqueProceduralDefinition(term: string, prefix: string, core: string, category: string): string {
  const p = PREFIX_SENSE[prefix] || `the “${prefix}” qualifier`;
  const c = CORE_SENSE[core] || `the “${core}” mechanism`;
  const frame = CATEGORY_FRAME[category] || 'market vocabulary';
  return `${term} is ${p} applied to ${c}. ClearPath files it under ${frame} so you can practice the phrase, not as a live vendor print. Missing quotes stay DATA UNAVAILABLE.`;
}

function parseProceduralParts(term: string): { prefix: string; core: string } | null {
  const prefixes = Object.keys(PREFIX_SENSE).sort((a, b) => b.length - a.length);
  for (const prefix of prefixes) {
    if (term === prefix) continue;
    if (term.startsWith(`${prefix} `)) {
      return { prefix, core: term.slice(prefix.length + 1) };
    }
  }
  return null;
}

let cached: GlossaryRecord[] | null = null;
let bySlug: Map<string, GlossaryRecord> | null = null;
let byLetter: Map<string, GlossaryRecord[]> | null = null;

function buildCatalog(): void {
  const list: GlossaryRecord[] = [];
  const slugs = new Set<string>();
  const terms = new Set<string>();

  const takeSlug = (preferred: string): string => {
    let slug = preferred || 'term';
    let n = 2;
    while (slugs.has(slug)) {
      slug = `${preferred}-${n}`;
      n += 1;
    }
    slugs.add(slug);
    return slug;
  };

  const push = (
    term: string,
    definition: string,
    category: string,
    source: GlossarySource,
    related: string[] = [],
  ) => {
    const key = term.toLowerCase();
    if (terms.has(key)) return;
    terms.add(key);
    const slug = takeSlug(slugifyGlossaryTerm(term));
    const seoDescription = fitDesc(
      source === 'procedural'
        ? `${term}: educational ${category.toLowerCase()} glossary entry. Not a live vendor field — DATA UNAVAILABLE for missing quotes.`
        : `${term} — ${definition}`,
    );
    list.push({
      slug,
      term,
      definition,
      category: category || 'Markets',
      source,
      related: related.filter(Boolean).slice(0, 4),
      seoTitle: fitTitle(`${term} | ClearPathTrader Glossary`, `${term} | Glossary`),
      seoDescription,
      letter: letterOf(term),
    });
  };

  for (const t of CORE_GLOSSARY_TERMS) {
    push(t.term, t.definition, 'Markets', 'core');
  }
  for (const t of REAL_GLOSSARY_TERMS) {
    push(t.term, t.definition, t.category || 'Markets', 'seed', t.related || []);
  }
  for (const t of getProceduralGlossary()) {
    const term = String(t.term || '').trim();
    if (!term) continue;
    const parts = parseProceduralParts(term);
    const category = String(t.category || 'Markets');
    const definition = parts
      ? uniqueProceduralDefinition(term, parts.prefix, parts.core, category)
      : String(t.definition || '');
    if (!definition || /high-altitude operational environments/i.test(definition)) {
      const fallback = `${term} is an educational glossary node in ${category}. Practice the vocabulary; do not treat it as a live quote. Missing cells stay DATA UNAVAILABLE.`;
      push(term, fallback, category, 'procedural', Array.isArray(t.related) ? t.related : []);
      continue;
    }
    push(term, definition, category, parts ? 'procedural' : 'seed', Array.isArray(t.related) ? t.related : []);
  }

  cached = list;
  bySlug = new Map();
  byLetter = new Map();
  for (const rec of list) {
    bySlug.set(rec.slug, rec);
    const bucket = byLetter.get(rec.letter) || [];
    bucket.push(rec);
    byLetter.set(rec.letter, bucket);
  }
}

function ensureCatalog(): void {
  if (!cached) buildCatalog();
}

export function getGlossaryCatalog(): GlossaryRecord[] {
  ensureCatalog();
  return cached!;
}

export function lookupGlossary(slug: string): GlossaryRecord | null {
  ensureCatalog();
  const key = slug.toLowerCase().replace(/^\/glossary\//, '').replace(/\/$/, '');
  return bySlug!.get(key) || null;
}

export function glossaryLetterEntries(letter: string): GlossaryRecord[] {
  ensureCatalog();
  const key = letter.toLowerCase() === '0' || letter === '#' ? '0' : letter.toLowerCase().slice(0, 1);
  return byLetter!.get(key) || [];
}

export function glossaryLetters(): { letter: string; count: number }[] {
  ensureCatalog();
  const keys = [...byLetter!.keys()].sort((a, b) => (a === '0' ? -1 : b === '0' ? 1 : a.localeCompare(b)));
  return keys.map((letter) => ({ letter, count: byLetter!.get(letter)!.length }));
}

export function glossaryCatalogCounts() {
  ensureCatalog();
  let core = 0;
  let seed = 0;
  let procedural = 0;
  for (const rec of cached!) {
    if (rec.source === 'core') core += 1;
    else if (rec.source === 'seed') seed += 1;
    else procedural += 1;
  }
  return { total: cached!.length, core, seed, procedural, letters: byLetter!.size };
}

export function relatedGlossary(rec: GlossaryRecord, limit = 4): GlossaryRecord[] {
  ensureCatalog();
  const out: GlossaryRecord[] = [];
  const want = new Set(rec.related.map((r) => slugifyGlossaryTerm(r)));
  for (const other of cached!) {
    if (other.slug === rec.slug) continue;
    if (want.has(other.slug) || rec.related.some((r) => r.toLowerCase() === other.term.toLowerCase())) {
      out.push(other);
      if (out.length >= limit) return out;
    }
  }
  for (const other of cached!) {
    if (out.length >= limit) break;
    if (other.slug === rec.slug) continue;
    if (other.category !== rec.category) continue;
    if (other.source === 'procedural' && rec.source !== 'procedural') continue;
    out.push(other);
  }
  return out;
}
