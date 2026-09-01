/**
 * First-party encyclopedia search for C.P.T. Buddy.
 * Finance knowledge base + glossary + indicator encyclopedia. No live prices.
 */
import { ENCYCLOPEDIA_KNOWLEDGE_BASE } from '../components/encyclopedia/KnowledgeBaseData';
import { REAL_GLOSSARY_TERMS } from '../components/encyclopedia/RealGlossaryData';
import { INDICATOR_DESCRIPTIONS } from '../components/indicatorDescriptions';

export type EncyclopediaHit = {
  source: 'finance' | 'glossary' | 'indicator';
  title: string;
  snippet: string;
  path?: string;
};

const MAX_HITS = 4;
const SNIPPET = 280;

function tokens(q: string): string[] {
  return q
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .map((t) => t.trim())
    .filter((t) => t.length >= 2)
    .slice(0, 8);
}

function score(hay: string, needles: string[]): number {
  const h = hay.toLowerCase();
  let s = 0;
  for (const n of needles) {
    if (h.includes(n)) s += n.length >= 4 ? 4 : 2;
    if (h.startsWith(n) || h.includes(` ${n} `)) s += 2;
  }
  return s;
}

function clip(text: string): string {
  const t = text.replace(/\s+/g, ' ').trim();
  if (t.length <= SNIPPET) return t;
  return `${t.slice(0, SNIPPET - 1)}…`;
}

export function searchEncyclopedia(query: string): EncyclopediaHit[] {
  const needles = tokens(query);
  if (!needles.length) return [];

  const ranked: { hit: EncyclopediaHit; s: number }[] = [];

  for (const [path, item] of Object.entries(ENCYCLOPEDIA_KNOWLEDGE_BASE)) {
    const hay = `${item.title} ${item.tagline} ${item.definition} ${item.simplifiedExplanation} ${item.keyTakeaway}`;
    const s = score(hay, needles);
    if (s <= 0) continue;
    ranked.push({
      s,
      hit: {
        source: 'finance',
        title: item.title,
        snippet: clip(item.simplifiedExplanation || item.definition),
        path: `/${path.replace(/\.html$/, '')}`,
      },
    });
  }

  for (const term of REAL_GLOSSARY_TERMS) {
    const hay = `${term.term} ${term.definition} ${term.category} ${(term.related || []).join(' ')}`;
    const s = score(hay, needles);
    if (s <= 0) continue;
    ranked.push({
      s: s + (term.term.toLowerCase() === needles.join(' ') ? 8 : 0),
      hit: {
        source: 'glossary',
        title: term.term,
        snippet: clip(term.definition),
        path: '/encyclopedia',
      },
    });
  }

  for (const [name, desc] of Object.entries(INDICATOR_DESCRIPTIONS)) {
    const hay = `${name} ${desc}`;
    const s = score(hay, needles);
    if (s <= 0) continue;
    ranked.push({
      s,
      hit: {
        source: 'indicator',
        title: name,
        snippet: clip(desc),
        path: '/indicators',
      },
    });
  }

  ranked.sort((a, b) => b.s - a.s);
  const out: EncyclopediaHit[] = [];
  const seen = new Set<string>();
  for (const row of ranked) {
    const key = `${row.hit.source}:${row.hit.title.toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(row.hit);
    if (out.length >= MAX_HITS) break;
  }
  return out;
}
