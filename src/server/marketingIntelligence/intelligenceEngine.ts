import capabilitiesData from '../../../data/marketing/marketing-capabilities.json';
import searchIntelligence from '../../../data/marketing/global-search-intelligence.json';
import {
  getAllKeywordRouteAssignments,
  type KeywordRouteAssignment,
} from '../../lib/marketingRouteRegistry';

export type MarketingCapabilityId =
  | 'SEO'
  | 'GEO'
  | 'AEO'
  | 'LLMO'
  | 'AIO'
  | 'AISO'
  | 'GSO'
  | 'SMO'
  | 'SSO'
  | 'VSO'
  | 'HSO'
  | 'ENTITY'
  | 'KGO'
  | 'CRO'
  | 'SXO'
  | 'ASO'
  | 'LOCAL'
  | 'VOICE'
  | 'AAO'
  | 'EEAT';

export type MarketingCapability = {
  id: MarketingCapabilityId;
  name: string;
  family: 'search' | 'knowledge' | 'experience';
  maturity: 'active' | 'supporting' | 'planned' | 'umbrella';
  purpose: string;
  outputs: string[];
  evidenceRequired: string[];
};

export type MarketingOpportunity = {
  id: string;
  keyword: string;
  normalizedKeyword: string;
  canonicalPath: string | null;
  absoluteUrl: string | null;
  audience: string;
  platform?: string;
  language: string;
  status: 'activate' | 'optimize' | 'hold';
  readinessScore: number;
  scoreMeaning: string;
  capabilities: MarketingCapabilityId[];
  rationale: string[];
  evidenceNeeded: string[];
  reviewReason?: string;
};

const capabilityRegistry = capabilitiesData.capabilities as MarketingCapability[];
const capabilityById = new Map(capabilityRegistry.map((capability) => [capability.id, capability]));
const highPriority = new Set(
  searchIntelligence.highPriorityTerms.map((term) => normalize(term)),
);
const audienceAllocation = new Map(
  searchIntelligence.audienceAllocation.map((record) => [
    normalize(record.audience),
    record.allocationPercent,
  ]),
);
const VIDEO_PLATFORMS = new Set(['youtube', 'tiktok', 'instagram']);
const QUESTION_PATTERN = /^(how|what|why|when|where|which|can|does|is|are)\b/i;
const ACCESSIBILITY_PATTERN = /neuro|adhd|autis|dyslex|accessib|cognitive|focus|learning style/i;
const PRODUCT_INTENT_PATTERN = /platform|software|dashboard|tool|chart|indicator|analytics/i;

function normalize(value: string): string {
  return value.trim().replace(/^#/, '').replace(/\s+/g, ' ').toLowerCase();
}

function stableId(value: string): string {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return `mkt_${(hash >>> 0).toString(36)}`;
}

function capabilityIdsFor(assignment: KeywordRouteAssignment): MarketingCapabilityId[] {
  if (assignment.status === 'research_only') return ['EEAT'];

  const ids = new Set<MarketingCapabilityId>(['SEO', 'SXO', 'EEAT']);
  const keyword = assignment.normalizedKeyword;
  const path = assignment.canonicalPath || '/';
  const platform = normalize(assignment.platform || '');

  if (assignment.publicMeta) {
    ['AEO', 'GEO', 'LLMO', 'AIO', 'AISO', 'GSO', 'KGO'].forEach((id) =>
      ids.add(id as MarketingCapabilityId),
    );
  }
  if (
    assignment.source === 'official_brand' ||
    path === '/' ||
    ['/about', '/company'].includes(path)
  ) {
    ids.add('ENTITY');
  }
  if (assignment.source === 'platform') {
    ids.add('SMO');
    ids.add('SSO');
    if (VIDEO_PLATFORMS.has(platform)) ids.add('VSO');
    if (assignment.keyword.trim().startsWith('#')) ids.add('HSO');
  }
  if (
    assignment.source === 'brand_acquisition' ||
    PRODUCT_INTENT_PATTERN.test(keyword) ||
    path === '/plans'
  ) {
    ids.add('CRO');
  }
  if (
    assignment.language !== 'English' ||
    path.startsWith('/regions/')
  ) {
    ids.add('LOCAL');
  }
  if (QUESTION_PATTERN.test(keyword)) ids.add('VOICE');
  if (ACCESSIBILITY_PATTERN.test(keyword) || path.includes('neurodivergent') || path === '/accessibility') {
    ids.add('AAO');
  }

  return [...ids];
}

function allocationFor(audience: string): number {
  const normalizedAudience = normalize(audience);
  const direct = audienceAllocation.get(normalizedAudience);
  if (direct !== undefined) return direct;
  for (const [knownAudience, allocation] of audienceAllocation) {
    if (
      normalizedAudience.includes(knownAudience.split(' ')[0]) ||
      knownAudience.includes(normalizedAudience.split(' ')[0])
    ) {
      return allocation;
    }
  }
  return 0;
}

function opportunityFor(assignment: KeywordRouteAssignment): MarketingOpportunity {
  if (assignment.status === 'research_only') {
    return {
      id: stableId(`${assignment.source}:${assignment.normalizedKeyword}:hold`),
      keyword: assignment.keyword,
      normalizedKeyword: assignment.normalizedKeyword,
      canonicalPath: null,
      absoluteUrl: null,
      audience: assignment.audience,
      platform: assignment.platform,
      language: assignment.language,
      status: 'hold',
      readinessScore: 0,
      scoreMeaning: 'Implementation readiness only; this is not a demand or ranking score.',
      capabilities: ['EEAT'],
      rationale: ['The term is held because publishing it could create an unsupported product claim.'],
      evidenceNeeded: ['Founder claim review', assignment.reason || 'Verified product evidence'],
      reviewReason: assignment.reason,
    };
  }

  const capabilities = capabilityIdsFor(assignment);
  const rationale: string[] = ['Mapped to an allowlisted, canonical ClearPath destination.'];
  let score = 35;

  if (assignment.publicMeta) {
    score += 15;
    rationale.push('Approved for bounded route metadata and on-page planning.');
  }
  if (highPriority.has(assignment.normalizedKeyword)) {
    score += 20;
    rationale.push('Marked high priority in the founder search strategy.');
  }
  if (assignment.canonicalPath && assignment.canonicalPath !== '/') {
    score += 10;
    rationale.push('Uses a specific destination rather than the homepage.');
  }
  if (assignment.source === 'official_brand') {
    score += 10;
    rationale.push('Strengthens consistent ClearPath entity recognition.');
  }
  const allocation = allocationFor(assignment.audience);
  if (allocation > 0) {
    score += Math.min(10, Math.round(allocation / 2.5));
    rationale.push(`Aligned with a ${allocation}% founder-defined audience allocation hypothesis.`);
  }
  if (assignment.source === 'platform') {
    score -= 5;
    rationale.push('Platform language requires channel-specific validation before activation.');
  }

  const readinessScore = Math.max(0, Math.min(100, score));
  return {
    id: stableId(`${assignment.source}:${assignment.normalizedKeyword}:${assignment.platform || ''}`),
    keyword: assignment.keyword,
    normalizedKeyword: assignment.normalizedKeyword,
    canonicalPath: assignment.canonicalPath,
    absoluteUrl: assignment.absoluteUrl,
    audience: assignment.audience,
    platform: assignment.platform,
    language: assignment.language,
    status: readinessScore >= 70 ? 'activate' : 'optimize',
    readinessScore,
    scoreMeaning: 'Implementation readiness only; this is not a demand or ranking score.',
    capabilities,
    rationale,
    evidenceNeeded: [
      'Current impressions or discovery observations',
      'Qualified destination visits',
      ...(capabilities.includes('CRO') ? ['Registrations, trials, and paid conversions'] : []),
      ...(assignment.platform ? [`Measured ${assignment.platform} engagement`] : []),
    ],
  };
}

function deduplicateOpportunities(opportunities: MarketingOpportunity[]): MarketingOpportunity[] {
  const selected = new Map<string, MarketingOpportunity>();
  for (const opportunity of opportunities) {
    const key = `${opportunity.normalizedKeyword}|${opportunity.canonicalPath || 'hold'}`;
    const existing = selected.get(key);
    if (
      !existing ||
      opportunity.readinessScore > existing.readinessScore ||
      (!existing.platform && Boolean(opportunity.platform))
    ) {
      selected.set(key, opportunity);
    }
  }
  return [...selected.values()].sort(
    (left, right) =>
      right.readinessScore - left.readinessScore ||
      left.keyword.localeCompare(right.keyword),
  );
}

export function getMarketingCapabilities() {
  return {
    ...capabilitiesData,
    capabilities: capabilityRegistry,
  };
}

export function getMarketingIntelligenceReport(filters?: {
  capability?: string;
  canonicalPath?: string;
  platform?: string;
  limit?: number;
}) {
  const assignments = getAllKeywordRouteAssignments();
  let opportunities = deduplicateOpportunities(assignments.map(opportunityFor));
  const requestedCapability = String(filters?.capability || '').toUpperCase();
  const requestedPath = String(filters?.canonicalPath || '').trim();
  const requestedPlatform = normalize(String(filters?.platform || ''));

  if (requestedCapability && capabilityById.has(requestedCapability as MarketingCapabilityId)) {
    opportunities = opportunities.filter((item) =>
      item.capabilities.includes(requestedCapability as MarketingCapabilityId),
    );
  }
  if (requestedPath) {
    opportunities = opportunities.filter((item) => item.canonicalPath === requestedPath);
  }
  if (requestedPlatform) {
    opportunities = opportunities.filter(
      (item) => normalize(item.platform || '') === requestedPlatform,
    );
  }

  const allOpportunities = deduplicateOpportunities(assignments.map(opportunityFor));
  const capabilityCoverage = capabilityRegistry.map((capability) => {
    const matching = allOpportunities.filter((item) => item.capabilities.includes(capability.id));
    return {
      id: capability.id,
      name: capability.name,
      family: capability.family,
      maturity: capability.maturity,
      opportunityCount: matching.length,
      activateCount: matching.filter((item) => item.status === 'activate').length,
      holdCount: matching.filter((item) => item.status === 'hold').length,
      evidenceRequired: capability.evidenceRequired,
    };
  });
  const uniqueRoutes = new Set(
    allOpportunities.map((item) => item.canonicalPath).filter(Boolean),
  );
  const safeLimit = Math.max(1, Math.min(200, Number(filters?.limit) || 50));

  return {
    ok: true as const,
    generatedAt: new Date().toISOString(),
    methodology: {
      score: 'Readiness evaluates mapping, claim approval, route specificity, founder priority, and audience alignment.',
      exclusions: 'No search volume, ranking, competitor, impression, or revenue value is inferred.',
      approval: capabilitiesData.operatingModel.approvalRule,
    },
    summary: {
      sourceRecords: assignments.length,
      uniqueOpportunities: allOpportunities.length,
      activate: allOpportunities.filter((item) => item.status === 'activate').length,
      optimize: allOpportunities.filter((item) => item.status === 'optimize').length,
      heldForReview: allOpportunities.filter((item) => item.status === 'hold').length,
      canonicalRoutes: uniqueRoutes.size,
      capabilities: capabilityRegistry.length,
    },
    capabilityCoverage,
    filters: {
      capability: requestedCapability || null,
      canonicalPath: requestedPath || null,
      platform: requestedPlatform || null,
    },
    totalMatching: opportunities.length,
    opportunities: opportunities.slice(0, safeLimit),
    reviewQueue: allOpportunities.filter((item) => item.status === 'hold'),
  };
}

function structuredDataFor(path: string): string[] {
  if (path === '/glossary') return ['DefinedTermSet', 'BreadcrumbList'];
  if (path === '/education' || path === '/learn' || path.startsWith('/learn/')) {
    return ['Article', 'BreadcrumbList', 'FAQPage only when visible questions and answers exist'];
  }
  if (path === '/about' || path === '/company') return ['Organization', 'Person where verified'];
  if (path.startsWith('/regions/')) return ['CollectionPage', 'BreadcrumbList'];
  return ['WebPage', 'BreadcrumbList'];
}

export function createMarketingContentBrief(input: {
  canonicalPath: string;
  platform?: string;
}) {
  const path = String(input.canonicalPath || '').trim();
  const platform = String(input.platform || '').trim();
  const report = getMarketingIntelligenceReport({
    canonicalPath: path,
    limit: 30,
  });
  if (!path.startsWith('/') || report.totalMatching === 0) {
    throw new Error('canonicalPath must be an allowlisted route with approved keyword assignments');
  }

  const approved = report.opportunities.filter((item) => item.status !== 'hold');
  const primary = approved.slice(0, 3);
  const secondary = approved.slice(3, 10);
  const capabilities = [
    ...new Set(approved.flatMap((item) => item.capabilities)),
  ] as MarketingCapabilityId[];

  return {
    ok: true as const,
    generatedAt: new Date().toISOString(),
    approvalStatus: 'DRAFT_REQUIRES_FOUNDER_APPROVAL' as const,
    canonicalPath: path,
    platform: platform || null,
    audience: [...new Set(approved.map((item) => item.audience))].slice(0, 4),
    primaryTerms: primary.map((item) => item.keyword),
    secondaryTerms: secondary.map((item) => item.keyword),
    capabilities,
    contentArchitecture: [
      `Open by satisfying the intent behind “${primary[0]?.keyword || 'the selected topic'}” without promotional padding.`,
      'Demonstrate the relevant ClearPath workflow using only currently verified product behavior.',
      'Add source-backed educational context, a clear limitation statement, and one useful next step.',
      'Connect to the canonical destination and measure the approved CTA with first-party attribution.',
    ],
    structuredDataCandidates: structuredDataFor(path),
    evidenceChecklist: [
      'Verify every product statement against the live ClearPath experience.',
      'Cite primary or authoritative sources for financial and market-structure explanations.',
      'Confirm visible copy supports every proposed structured-data field.',
      'Record current baseline metrics before testing a change.',
      'Require founder approval before publishing or spending.',
    ],
    prohibitedShortcuts: [
      'No invented search volume, ranking, trend, customer, or performance claims.',
      'No keyword stuffing, doorway pages, mass-generated near-duplicate pages, or hidden text.',
      'No autonomous social publishing or paid-media activation.',
      'No implication that ClearPath is a broker, execution venue, fiduciary, or source of guaranteed returns.',
    ],
  };
}
