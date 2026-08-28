/**
 * Membership entitlements — single source of truth for what each plan unlocks.
 * Shared by the server (/api/membership/me) and the client (FeatureGate UI).
 *
 * Canonical plans (founder sheet, features only — no list prices):
 * Basic → Silver → Gold → Platinum.
 * Legacy Stripe ids (pro / proplus / premium / ultimate) still canonicalize onto this ladder.
 */

import {
  canonicalizePlanId,
  planOf,
  type CanonicalPlanId,
  type PlanDefinition,
  type PlanFlags,
  type PlanLimits,
} from './planCatalog';

export type PlanTier = CanonicalPlanId;

export const TIER_RANK: Record<PlanTier, number> = {
  basic: 0,
  silver: 1,
  gold: 2,
  platinum: 3,
};

export const TIER_LABEL: Record<PlanTier, string> = {
  basic: 'Basic',
  silver: 'Silver',
  gold: 'Gold',
  platinum: 'Platinum',
};

export type FeatureKey =
  | 'advancedWatchlists'
  | 'aiAnalysis'
  | 'premiumDashboards'
  | 'alerts'
  | 'multiChart'
  | 'expandedAi'
  | 'priorityRefresh'
  | 'institutional'
  | 'advancedIndicators'
  | 'aiScanner'
  | 'premiumResearch'
  | 'tierTwoAi'
  | 'workspace'
  | 'blackoutMode'
  | 'encyclopedia'
  | 'education'
  | 'affiliate'
  | 'goldBar'
  | 'indaCreator'
  | 'patternOverlay'
  | 'intradayCharts'
  | 'bots';

export const FEATURE_MIN_TIER: Record<FeatureKey, PlanTier> = {
  alerts: 'basic',
  advancedWatchlists: 'silver',
  aiAnalysis: 'gold',
  premiumDashboards: 'silver',
  multiChart: 'silver',
  expandedAi: 'gold',
  priorityRefresh: 'silver',
  institutional: 'gold',
  advancedIndicators: 'gold',
  aiScanner: 'platinum',
  premiumResearch: 'gold',
  tierTwoAi: 'platinum',
  workspace: 'platinum',
  blackoutMode: 'silver',
  encyclopedia: 'silver',
  education: 'silver',
  affiliate: 'silver',
  goldBar: 'silver',
  indaCreator: 'gold',
  patternOverlay: 'gold',
  intradayCharts: 'silver',
  bots: 'platinum',
};

export function tierRankOf(tier: string | null | undefined): number {
  return planOf(tier).rank;
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

export function entitlementsFor(tier: string | null | undefined): {
  plan: PlanDefinition;
  limits: PlanLimits;
  flags: PlanFlags;
  features: FeatureKey[];
} {
  const plan = planOf(tier);
  return {
    plan,
    limits: plan.limits,
    flags: plan.flags,
    features: unlockedFeatures(plan.id),
  };
}

export { canonicalizePlanId, planOf };
export type { CanonicalPlanId, PlanDefinition, PlanFlags, PlanLimits };
