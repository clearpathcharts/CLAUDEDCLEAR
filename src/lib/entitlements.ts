/**
 * Membership entitlements — single source of truth for what each plan unlocks.
 * Shared by the server (/api/membership/me) and the client (FeatureGate UI).
 *
 * Plans: Basic (free) → Pro → Pro+ → Premium → Ultimate.
 * Higher plans include everything below them.
 */

export type PlanTier = 'basic' | 'pro' | 'proplus' | 'premium' | 'ultimate';

export const TIER_RANK: Record<PlanTier, number> = {
  basic: 0,
  pro: 1,
  proplus: 2,
  premium: 3,
  ultimate: 4,
};

export const TIER_LABEL: Record<PlanTier, string> = {
  basic: 'Basic',
  pro: 'Pro',
  proplus: 'Pro+',
  premium: 'Premium',
  ultimate: 'Ultimate',
};

export type FeatureKey =
  // Pro
  | 'advancedWatchlists'
  | 'aiAnalysis'
  | 'premiumDashboards'
  | 'alerts'
  // Pro+
  | 'multiChart'
  | 'expandedAi'
  | 'priorityRefresh'
  // Premium
  | 'institutional'
  | 'advancedIndicators'
  | 'aiScanner'
  | 'premiumResearch'
  // Ultimate
  | 'tierTwoAi'
  | 'workspace';

export const FEATURE_MIN_TIER: Record<FeatureKey, PlanTier> = {
  advancedWatchlists: 'pro',
  aiAnalysis: 'pro',
  premiumDashboards: 'pro',
  alerts: 'pro',
  multiChart: 'proplus',
  expandedAi: 'proplus',
  priorityRefresh: 'proplus',
  institutional: 'premium',
  advancedIndicators: 'premium',
  aiScanner: 'premium',
  premiumResearch: 'premium',
  tierTwoAi: 'ultimate',
  workspace: 'ultimate',
};

export function tierRankOf(tier: string | null | undefined): number {
  return TIER_RANK[(tier || 'basic') as PlanTier] ?? 0;
}

export function hasFeatureForRank(rank: number, feature: FeatureKey): boolean {
  return rank >= TIER_RANK[FEATURE_MIN_TIER[feature]];
}

export function unlockedFeatures(tier: string | null | undefined): FeatureKey[] {
  const rank = tierRankOf(tier);
  return (Object.keys(FEATURE_MIN_TIER) as FeatureKey[]).filter((f) =>
    hasFeatureForRank(rank, f)
  );
}
