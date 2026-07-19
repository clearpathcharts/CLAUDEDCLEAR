/**
 * Crawl catalog — single source of truth for every indexable URL
 * across Encyclopedia of Finance, Encyclopedia of Indicators,
 * ClearPath Education, and neurodivergent UI profiles.
 *
 * Used by sitemap generators and SSR metadata enrichment.
 */
import {
  getProceduralStocks,
  getProceduralCrypto,
  getProceduralForex,
  getProceduralCommodities,
} from '../utils/searchEngine';
import { INDICATOR_NAMES, indicatorImageSlug, buildIndicators } from '../components/indicatorsData';
import { CURRICULUM, getSchool, getUnit } from '../education/curriculumData';
import { getLessonBody } from '../education/lessonContent';
import { advancedProfiles, type AdvancedProfileId } from '../lib/advanced/profiles';

export interface CrawlEntry {
  path: string;
  lastmod: string;
  changefreq: string;
  priority: string;
}

const TODAY = '2026-07-19';

// ---------------------------------------------------------------------------
// Economy topics (Encyclopedia of Finance — knowledge base)
// ---------------------------------------------------------------------------
export const ECONOMY_TOPICS: { slug: string; title: string; summary: string }[] = [
  {
    slug: 'inflation',
    title: 'Inflation',
    summary: 'How rising prices erode purchasing power and reshape asset valuations, rates, and FX.',
  },
  {
    slug: 'federal-reserve',
    title: 'Federal Reserve',
    summary: 'The U.S. central bank: policy rates, balance sheet tools, and how Fed decisions move markets.',
  },
  {
    slug: 'recession',
    title: 'Recession',
    summary: 'What defines a recession, how markets price one in advance, and which indicators to watch.',
  },
  {
    slug: 'gdp',
    title: 'GDP',
    summary: 'Gross Domestic Product — the headline measure of economic output and growth.',
  },
  {
    slug: 'interest-rates',
    title: 'Interest Rates',
    summary: 'How policy and market rates set the cost of money and discount future cash flows.',
  },
  {
    slug: 'banking',
    title: 'Banking',
    summary: 'How banks create credit, manage reserves, and transmit monetary policy into the real economy.',
  },
];

// ---------------------------------------------------------------------------
// Neurodivergent UI profile SEO copy
// ---------------------------------------------------------------------------
export interface ProfileSeo {
  id: AdvancedProfileId;
  slug: string;
  name: string;
  headline: string;
  summary: string;
  benefits: string[];
}

export const PROFILE_SEO: ProfileSeo[] = [
  {
    id: 'calm_focus',
    slug: 'calm_focus',
    name: 'Calm Focus',
    headline: 'A quieter trading desk for sustained attention',
    summary:
      'Soft blues and reduced visual noise for traders who want a calm, readable terminal without sensory overload.',
    benefits: ['Lower contrast glare', 'Steady accent colors', 'Fewer competing highlights'],
  },
  {
    id: 'low_stim_emergency',
    slug: 'low_stim_emergency',
    name: 'Low Stimulation',
    headline: 'Minimal sensory load when the market is loud',
    summary:
      'A stripped-back interface for high-stress moments — muted chrome, restrained motion, and clear hierarchy.',
    benefits: ['Muted palette', 'Reduced animation', 'Clear primary actions'],
  },
  {
    id: 'dyslexia_readable',
    slug: 'dyslexia_readable',
    name: 'Reading Support',
    headline: 'Typography and spacing tuned for easier reading',
    summary:
      'Readable text styles and spacing choices that help dyslexic and text-sensitive traders stay oriented on the desk.',
    benefits: ['Clearer type hierarchy', 'Generous spacing', 'High-contrast readable accents'],
  },
  {
    id: 'dyscalculia_numeric_relief',
    slug: 'dyscalculia_numeric_relief',
    name: 'Numeric Relief',
    headline: 'Numbers presented with less cognitive friction',
    summary:
      'A layout that eases numeric overload — helpful for dyscalculia and anyone who wants calmer figure presentation.',
    benefits: ['Calmer numeric display', 'Reduced digit clutter', 'Stable visual anchors'],
  },
  {
    id: 'visual_processing_safe',
    slug: 'visual_processing_safe',
    name: 'Visual Ease',
    headline: 'Softer visuals for processing comfort',
    summary:
      'Gentler contrast and chart styling for visual processing sensitivity without losing chart clarity.',
    benefits: ['Softer borders', 'Balanced contrast', 'Readable chart overlays'],
  },
  {
    id: 'apd_assist',
    slug: 'apd_assist',
    name: 'Reduced Signal Load',
    headline: 'Fewer competing signals on screen',
    summary:
      'Cuts secondary noise so primary price and order context stay easier to follow for auditory/processing load relief.',
    benefits: ['Fewer simultaneous cues', 'Teal accent focus', 'Quieter secondary panels'],
  },
  {
    id: 'executive_function_support',
    slug: 'executive_function_support',
    name: 'Task Structure',
    headline: 'A desk that supports step-by-step workflows',
    summary:
      'Structured chrome and accents that help executive-function challenges keep next actions visible and ordered.',
    benefits: ['Clear action hierarchy', 'Stable panel structure', 'Predictable navigation'],
  },
  {
    id: 'motor_friendly',
    slug: 'motor_friendly',
    name: 'Large Target Mode',
    headline: 'Bigger hit targets for motor accessibility',
    summary:
      'Enlarged interactive targets and spacing for motor impairments, tremor, or anyone who prefers larger controls.',
    benefits: ['Larger click targets', 'Roomier controls', 'Lower precision demand'],
  },
  {
    id: 'adhd_dopamine_balanced',
    slug: 'adhd_dopamine_balanced',
    name: 'Balanced Energy',
    headline: 'Stimulation without chaos for ADHD focus',
    summary:
      'Cyan energy accents with enough engagement to stay present, without the noisy overstimulation of a default desk.',
    benefits: ['Engaging accents', 'Controlled stimulation', 'Readable focus states'],
  },
  {
    id: 'adhd_hyperfocus',
    slug: 'adhd_hyperfocus',
    name: 'Hyperfocus',
    headline: 'High-contrast mode for deep work sessions',
    summary:
      'Sharper neon accents and a darker field for ADHD hyperfocus stretches on charts and research.',
    benefits: ['High-contrast cues', 'Dark immersion', 'Strong focal accent'],
  },
  {
    id: 'autism_predictable',
    slug: 'autism_predictable',
    name: 'Autism — Predictable',
    headline: 'Predictable layout, consistent behavior',
    summary:
      'Stable structure and consistent visual rules designed for autistic traders who prefer predictable interfaces.',
    benefits: ['Consistent layout rules', 'Predictable accents', 'Low surprise motion'],
  },
  {
    id: 'tourette_tic_friendly',
    slug: 'tourette_tic_friendly',
    name: 'Minimal Motion',
    headline: 'Reduced motion for tic-friendly trading',
    summary:
      'Cuts unnecessary animation and flicker so the desk stays usable for Tourette and motion-sensitive users.',
    benefits: ['Minimal animation', 'Stable panels', 'Calm accent language'],
  },
  {
    id: 'focus_mode',
    slug: 'focus_mode',
    name: 'Focus Mode (Money State)',
    headline: 'Indigo focus for money-state sessions',
    summary:
      'Neon indigo and cyan focus styling for traders who want a decisive, money-first visual state.',
    benefits: ['Strong focus accent', 'Dark immersion', 'Decision-oriented chrome'],
  },
  {
    id: 'lava_hot',
    slug: 'lava_hot',
    name: 'Lava Hot (High Intensity)',
    headline: 'High-intensity desk for aggressive sessions',
    summary:
      'Magma reds and black field for traders who prefer a high-intensity visual environment.',
    benefits: ['High-energy palette', 'Aggressive accenting', 'Dark high-contrast field'],
  },
  {
    id: 'standard_red_green',
    slug: 'standard_red_green',
    name: 'Standard Chart (Red & Green)',
    headline: 'Classic red/green charting language',
    summary:
      'The familiar red-and-green trading desk for users who want industry-standard candle colors and chrome.',
    benefits: ['Classic candle colors', 'Familiar chart language', 'Industry-standard look'],
  },
];

// ---------------------------------------------------------------------------
// Cached lookups for SSR meta (built once per process)
// ---------------------------------------------------------------------------
let stockByTicker: Map<string, any> | null = null;
let cryptoBySymbol: Map<string, any> | null = null;
let forexByPair: Map<string, any> | null = null;
let commodityBySymbol: Map<string, any> | null = null;
let indicatorBySlug: Map<string, ReturnType<typeof buildIndicators>[number]> | null = null;

function ensureLookups() {
  if (!stockByTicker) {
    stockByTicker = new Map();
    for (const s of getProceduralStocks()) {
      stockByTicker.set(String(s.ticker).toLowerCase(), s);
    }
  }
  if (!cryptoBySymbol) {
    cryptoBySymbol = new Map();
    for (const c of getProceduralCrypto()) {
      cryptoBySymbol.set(String(c.symbol).toLowerCase(), c);
    }
  }
  if (!forexByPair) {
    forexByPair = new Map();
    for (const f of getProceduralForex()) {
      const key = String(f.pair).toLowerCase().replace('/', '');
      forexByPair.set(key, f);
    }
  }
  if (!commodityBySymbol) {
    commodityBySymbol = new Map();
    for (const c of getProceduralCommodities()) {
      commodityBySymbol.set(String(c.symbol).toLowerCase(), c);
    }
  }
  if (!indicatorBySlug) {
    indicatorBySlug = new Map();
    for (const ind of buildIndicators()) {
      indicatorBySlug.set(indicatorImageSlug(ind.name), ind);
    }
  }
}

export function lookupStock(symbol: string) {
  ensureLookups();
  return stockByTicker!.get(symbol.toLowerCase()) || null;
}
export function lookupCrypto(symbol: string) {
  ensureLookups();
  return cryptoBySymbol!.get(symbol.toLowerCase()) || null;
}
export function lookupForex(pairKey: string) {
  ensureLookups();
  return forexByPair!.get(pairKey.toLowerCase().replace('/', '')) || null;
}
export function lookupCommodity(symbol: string) {
  ensureLookups();
  return commodityBySymbol!.get(symbol.toLowerCase()) || null;
}
export function lookupIndicator(slug: string) {
  ensureLookups();
  return indicatorBySlug!.get(slug.toLowerCase()) || null;
}
export function lookupProfile(slug: string) {
  return PROFILE_SEO.find((p) => p.slug === slug || p.id === slug) || null;
}
export function lookupEconomy(slug: string) {
  return ECONOMY_TOPICS.find((t) => t.slug === slug) || null;
}

export function getLessonSeo(schoolId: string, unitId: string, lessonId: string) {
  const school = getSchool(schoolId);
  const unit = getUnit(schoolId, unitId);
  const lesson = unit?.lessons.find((l) => l.id === lessonId);
  if (!school || !unit || !lesson) return null;
  const body = getLessonBody(lesson.id, lesson.title, school.name, unit.title);
  return { school, unit, lesson, summary: body.summary };
}

// ---------------------------------------------------------------------------
// Sitemap entry builders
// ---------------------------------------------------------------------------
function dedupeEntries(entries: CrawlEntry[]): CrawlEntry[] {
  const seen = new Set<string>();
  const out: CrawlEntry[] = [];
  for (const e of entries) {
    if (seen.has(e.path)) continue;
    seen.add(e.path);
    out.push(e);
  }
  return out;
}

export function stockEntries(): CrawlEntry[] {
  ensureLookups();
  return dedupeEntries(
    [...stockByTicker!.entries()].map(([ticker, s]) => ({
      path: `/stocks/${ticker}`,
      lastmod: TODAY,
      changefreq: 'weekly',
      priority: s.ticker === 'AAPL' || s.ticker === 'TSLA' ? '0.85' : '0.7',
    }))
  );
}

export function cryptoEntries(): CrawlEntry[] {
  ensureLookups();
  return dedupeEntries(
    [...cryptoBySymbol!.entries()].map(([symbol, c]) => ({
      path: `/crypto/${symbol}`,
      lastmod: TODAY,
      changefreq: 'weekly',
      priority: symbol === 'btc' || symbol === 'eth' ? '0.85' : '0.7',
    }))
  );
}

export function forexEntries(): CrawlEntry[] {
  ensureLookups();
  return dedupeEntries(
    [...forexByPair!.entries()].map(([pairKey]) => ({
      path: `/forex/${pairKey}`,
      lastmod: TODAY,
      changefreq: 'weekly',
      priority: pairKey === 'eurusd' || pairKey === 'usdjpy' ? '0.8' : '0.65',
    }))
  );
}

export function commodityEntries(): CrawlEntry[] {
  ensureLookups();
  return dedupeEntries(
    [...commodityBySymbol!.entries()].map(([symbol]) => ({
      path: `/commodities/${symbol}`,
      lastmod: TODAY,
      changefreq: 'weekly',
      priority: symbol === 'xauusd' ? '0.8' : '0.65',
    }))
  );
}

export function economyEntries(): CrawlEntry[] {
  return ECONOMY_TOPICS.map((t) => ({
    path: `/economy/${t.slug}`,
    lastmod: TODAY,
    changefreq: 'monthly',
    priority: '0.8',
  }));
}

export function indicatorEntries(): CrawlEntry[] {
  return INDICATOR_NAMES.map((name) => ({
    path: `/indicators/${indicatorImageSlug(name)}`,
    lastmod: TODAY,
    changefreq: 'monthly',
    priority: '0.75',
  }));
}

export function educationEntries(): CrawlEntry[] {
  const entries: CrawlEntry[] = [];
  for (const school of CURRICULUM) {
    entries.push({
      path: `/education/${school.id}`,
      lastmod: TODAY,
      changefreq: 'monthly',
      priority: '0.8',
    });
    for (const unit of school.units) {
      entries.push({
        path: `/education/${school.id}/${unit.id}`,
        lastmod: TODAY,
        changefreq: 'monthly',
        priority: '0.75',
      });
      for (const lesson of unit.lessons) {
        entries.push({
          path: `/education/${school.id}/${unit.id}/${lesson.id}`,
          lastmod: TODAY,
          changefreq: 'monthly',
          priority: '0.7',
        });
      }
    }
  }
  return entries;
}

export function uiProfileEntries(): CrawlEntry[] {
  const hub: CrawlEntry = {
    path: '/ui',
    lastmod: TODAY,
    changefreq: 'monthly',
    priority: '0.85',
  };
  return [
    hub,
    ...PROFILE_SEO.map((p) => ({
      path: `/ui/${p.slug}`,
      lastmod: TODAY,
      changefreq: 'monthly',
      priority: '0.8',
    })),
  ];
}

/** Hub pages that belong in sitemap-pages (in addition to existing content hubs). */
export function encyclopediaHubEntries(): CrawlEntry[] {
  return [
    { path: '/stocks', lastmod: TODAY, changefreq: 'daily', priority: '0.85' },
    { path: '/crypto', lastmod: TODAY, changefreq: 'daily', priority: '0.85' },
    { path: '/forex', lastmod: TODAY, changefreq: 'weekly', priority: '0.8' },
    { path: '/commodities', lastmod: TODAY, changefreq: 'weekly', priority: '0.8' },
    { path: '/companies', lastmod: TODAY, changefreq: 'weekly', priority: '0.8' },
  ];
}

export function catalogCounts() {
  ensureLookups();
  return {
    stocks: stockByTicker!.size,
    crypto: cryptoBySymbol!.size,
    forex: forexByPair!.size,
    commodities: commodityBySymbol!.size,
    economy: ECONOMY_TOPICS.length,
    indicators: INDICATOR_NAMES.length,
    education: educationEntries().length,
    uiProfiles: PROFILE_SEO.length,
  };
}
