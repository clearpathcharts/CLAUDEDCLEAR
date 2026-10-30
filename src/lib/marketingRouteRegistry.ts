import searchIntelligence from '../../data/marketing/global-search-intelligence.json';
import routeRegistry from '../../data/marketing/keyword-route-registry.json';

export type KeywordRouteStatus = 'approved' | 'research_only';

export interface KeywordRouteAssignment {
  keyword: string;
  normalizedKeyword: string;
  canonicalPath: string | null;
  absoluteUrl: string | null;
  status: KeywordRouteStatus;
  publicMeta: boolean;
  source: 'master' | 'platform' | 'brand_acquisition' | 'official_brand' | 'neurodivergent';
  sourceGroup: string;
  audience: string;
  platform?: string;
  language: string;
  reason?: string;
}

export interface MarketingKeywordSourceRecord {
  keyword: string;
  source: KeywordRouteAssignment['source'];
  sourceGroup: string;
  audience: string;
  platform?: string;
  language: string;
}

const normalizeKeyword = (keyword: string) =>
  keyword
    .trim()
    .replace(/^#/, '')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/\s+/g, ' ')
    .toLowerCase();

const allowedPaths = new Set(routeRegistry.allowedCanonicalPaths);
const researchOnly = new Map(
  searchIntelligence.researchOnlyTerms.map((item) => [normalizeKeyword(item.term), item.reason]),
);
const highPriority = new Set(
  searchIntelligence.highPriorityTerms.map((term) => normalizeKeyword(term)),
);

const explicitRoutes = new Map<
  string,
  { canonicalPath: string; publicMeta: boolean }
>();
for (const rule of routeRegistry.routeRules) {
  for (const keyword of rule.keywords) {
    const normalized = normalizeKeyword(keyword);
    if (!explicitRoutes.has(normalized)) {
      explicitRoutes.set(normalized, {
        canonicalPath: rule.canonicalPath,
        publicMeta: rule.publicMeta !== false,
      });
    }
  }
}

function inferPlatformPath(keyword: string, language: string): string {
  const normalized = normalizeKeyword(keyword);
  if (language === 'Russian' || /[А-Яа-яЁё]/.test(keyword)) return '/regions/ru';
  if (/clear\s*path/.test(normalized)) return '/';
  if (/neuro|adhd|autis|dyslex|accessible|accessibility/.test(normalized)) {
    return /accessible|accessibility|dyslex/.test(normalized)
      ? '/accessibility'
      : '/desk/neurodivergent';
  }
  if (/forex/.test(normalized)) return '/forex';
  if (/crypto/.test(normalized)) return '/crypto';
  if (/stock/.test(normalized)) return '/stocks';
  if (/commodity/.test(normalized)) return '/commodities';
  if (/fundamental|valuation|earnings|company analysis/.test(normalized)) {
    return '/desk/fundamental';
  }
  if (/technical|indicator|candlestick|chart pattern|chart analysis|chart reading/.test(normalized)) {
    return '/indicators';
  }
  if (/literacy/.test(normalized)) return '/literacy';
  if (/education|beginner|learn|trading tips|psychology/.test(normalized)) return '/education';
  if (/institutional|quant|market data|financial analytics|market intelligence/.test(normalized)) {
    return '/desk/institutional';
  }
  if (/glossary|terminology/.test(normalized)) return '/glossary';
  if (/chart|trading platform|trading software|finance|investing|trader|trading/.test(normalized)) {
    return '/';
  }
  return '/encyclopedia';
}

function routeForSource(record: MarketingKeywordSourceRecord): { canonicalPath: string; publicMeta: boolean } {
  const normalized = normalizeKeyword(record.keyword);
  const explicit = explicitRoutes.get(normalized);
  if (explicit) return explicit;

  if (record.source === 'master') {
    const canonicalPath =
      routeRegistry.groupDefaults[
        record.sourceGroup as keyof typeof routeRegistry.groupDefaults
      ] || '/encyclopedia';
    return {
      canonicalPath,
      publicMeta: record.sourceGroup !== 'Brokerage and Hedge Fund Technology',
    };
  }
  if (record.source === 'brand_acquisition' || record.source === 'official_brand') {
    return { canonicalPath: '/', publicMeta: !record.keyword.startsWith('#') };
  }
  if (record.source === 'neurodivergent') {
    return { canonicalPath: '/desk/neurodivergent', publicMeta: true };
  }
  return {
    canonicalPath: inferPlatformPath(record.keyword, record.language),
    publicMeta: false,
  };
}

export function resolveKeywordRoute(record: MarketingKeywordSourceRecord): KeywordRouteAssignment {
  const normalizedKeyword = normalizeKeyword(record.keyword);
  const researchReason = researchOnly.get(normalizedKeyword);
  if (researchReason) {
    return {
      ...record,
      normalizedKeyword,
      canonicalPath: null,
      absoluteUrl: null,
      status: 'research_only',
      publicMeta: false,
      reason: researchReason,
    };
  }

  const route = routeForSource(record);
  const canonicalPath =
    routeRegistry.aliases[route.canonicalPath as keyof typeof routeRegistry.aliases] ||
    route.canonicalPath;
  return {
    ...record,
    normalizedKeyword,
    canonicalPath,
    absoluteUrl: `${routeRegistry.baseUrl}${canonicalPath === '/' ? '' : canonicalPath}`,
    status: 'approved',
    publicMeta: route.publicMeta,
  };
}

function sourceRecords(): MarketingKeywordSourceRecord[] {
  const master: MarketingKeywordSourceRecord[] = searchIntelligence.masterGroups.flatMap((group) =>
    group.keywords.map((keyword) => ({
      keyword,
      source: 'master',
      sourceGroup: group.category,
      audience: group.audience,
      language: 'English',
    })),
  );
  const platform: MarketingKeywordSourceRecord[] = searchIntelligence.platforms.flatMap((channel) =>
    channel.keywords.map((keyword) => ({
      keyword,
      source: 'platform',
      sourceGroup: channel.type,
      audience: 'Platform audience',
      platform: channel.platform,
      language: channel.language,
    })),
  );
  const brandAcquisition: MarketingKeywordSourceRecord[] = searchIntelligence.brandAcquisitionTerms.map(
    (keyword) => ({
      keyword,
      source: 'brand_acquisition',
      sourceGroup: 'Product acquisition',
      audience: 'Prospective customers',
      language: 'English',
    }),
  );
  const officialBrand: MarketingKeywordSourceRecord[] = searchIntelligence.officialBrandTerms.map((keyword) => ({
    keyword,
    source: 'official_brand',
    sourceGroup: 'Official brand term',
    audience: 'All audiences',
    language: 'English',
  }));
  const neurodivergent: MarketingKeywordSourceRecord[] = searchIntelligence.neurodivergentTerms.map((keyword) => ({
    keyword,
    source: 'neurodivergent',
    sourceGroup: 'Neurodivergent trading',
    audience: 'Neurodivergent traders and learners',
    language: 'English',
  }));
  return [...master, ...platform, ...brandAcquisition, ...officialBrand, ...neurodivergent];
}

const allAssignments = sourceRecords().map(resolveKeywordRoute);

export function getAllKeywordRouteAssignments(): KeywordRouteAssignment[] {
  return allAssignments;
}

export function getApprovedKeywordsForPath(pathname: string): string[] {
  const normalizedPath = pathname.toLowerCase().replace(/\/$/, '') || '/';
  const canonicalPath =
    routeRegistry.aliases[normalizedPath as keyof typeof routeRegistry.aliases] || normalizedPath;
  const seen = new Set<string>();
  return allAssignments
    .filter(
      (assignment) =>
        assignment.status === 'approved' &&
        assignment.publicMeta &&
        assignment.canonicalPath === canonicalPath,
    )
    .sort((left, right) => {
      const leftPriority = highPriority.has(left.normalizedKeyword) ? 0 : 1;
      const rightPriority = highPriority.has(right.normalizedKeyword) ? 0 : 1;
      return leftPriority - rightPriority || left.keyword.length - right.keyword.length;
    })
    .filter((assignment) => {
      if (seen.has(assignment.normalizedKeyword)) return false;
      seen.add(assignment.normalizedKeyword);
      return true;
    })
    .slice(0, routeRegistry.registryKeywordLimitPerPath)
    .map((assignment) => assignment.keyword);
}

export function mergeApprovedMarketingKeywords(pathname: string, existing: string): string {
  const seen = new Set<string>();
  const merged = [
    ...existing.split(',').map((keyword) => keyword.trim()),
    ...getApprovedKeywordsForPath(pathname),
  ].filter((keyword) => {
    if (!keyword || keyword.startsWith('#')) return false;
    const normalized = normalizeKeyword(keyword);
    if (seen.has(normalized) || researchOnly.has(normalized)) return false;
    seen.add(normalized);
    return true;
  });
  return merged.slice(0, routeRegistry.publicMetaKeywordLimit).join(', ');
}

export function assertMarketingRouteRegistryIntegrity() {
  const duplicateExplicitTerms = new Set<string>();
  const seenExplicitTerms = new Map<string, string>();
  for (const rule of routeRegistry.routeRules) {
    if (!allowedPaths.has(rule.canonicalPath)) {
      throw new Error(`Marketing route is not allowlisted: ${rule.canonicalPath}`);
    }
    for (const keyword of rule.keywords) {
      const normalized = normalizeKeyword(keyword);
      const existingPath = seenExplicitTerms.get(normalized);
      if (existingPath && existingPath !== rule.canonicalPath) {
        duplicateExplicitTerms.add(normalized);
      }
      seenExplicitTerms.set(normalized, rule.canonicalPath);
    }
  }
  if (duplicateExplicitTerms.size > 0) {
    throw new Error(
      `Marketing route keywords have conflicting rules: ${[...duplicateExplicitTerms].join(', ')}`,
    );
  }

  for (const assignment of allAssignments) {
    if (assignment.status === 'approved') {
      if (!assignment.canonicalPath || !allowedPaths.has(assignment.canonicalPath)) {
        throw new Error(`Approved keyword has invalid route: ${assignment.keyword}`);
      }
      if (
        routeRegistry.forbiddenDestinationPrefixes.some(
          (prefix) =>
            assignment.canonicalPath === prefix || assignment.canonicalPath?.startsWith(prefix),
        )
      ) {
        throw new Error(`Approved keyword targets a forbidden route: ${assignment.keyword}`);
      }
    } else if (assignment.canonicalPath || assignment.publicMeta) {
      throw new Error(`Research-only keyword leaked into public routing: ${assignment.keyword}`);
    }
  }
}
