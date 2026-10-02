/**
 * Client-side membership status with a module-level cache so every component
 * shares one fetch of /api/membership/me (which also starts the 15-day
 * Ultimate launch gift server-side on first call).
 *
 * UI gating only — the server remains the source of truth for anything paid.
 */
import { useEffect, useState } from 'react';
import { auth } from '../firebase';
import { tierRankOf, hasFeatureForRank, type FeatureKey } from '../lib/entitlements';
import {
  canonicalizePlanId,
  planOf,
  practicalChartSlots,
  readPlanPreview,
  type CanonicalPlanId,
  type PlanLimits,
  type PlanFlags,
} from '../lib/planCatalog';

export type MembershipInfo = {
  active: boolean;
  tier: string | null;
  status: string | null;
  tierRank: number;
  currentPeriodEnd?: string;
  launchTrialEndsAt?: string;
  launchTrialDaysLeft?: number;
};

const OFFLINE_BASIC: MembershipInfo = {
  active: false,
  tier: null,
  status: null,
  tierRank: 0,
};

let cache: MembershipInfo | null = null;
let inflight: Promise<MembershipInfo> | null = null;
const listeners = new Set<(m: MembershipInfo) => void>();

export async function membershipAuthHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = { Accept: 'application/json' };
  try {
    const current = auth.currentUser;
    if (current && typeof current.getIdToken === 'function') {
      const token = await current.getIdToken();
      if (token) headers.Authorization = `Bearer ${token}`;
    }
  } catch {
    /* cookie session still authorizes /api/membership/me */
  }
  return headers;
}

async function fetchMembershipOnce(force = false): Promise<MembershipInfo> {
  const preview = readPlanPreview();
  if (preview) {
    const plan = planOf(preview);
    return {
      active: true,
      tier: plan.id,
      status: 'plan_preview',
      tierRank: plan.rank,
    };
  }
  if (cache && !force) return cache;
  if (inflight && !force) return inflight;
  inflight = (async () => {
    try {
      const res = await fetch('/api/membership/me', {
        credentials: 'include',
        headers: await membershipAuthHeaders(),
      });
      if (!res.ok) return OFFLINE_BASIC;
      const data = await res.json();
      const m = data?.membership;
      if (!m) return OFFLINE_BASIC;
      const canonical = canonicalizePlanId(m.tier);
      return {
        active: Boolean(m.active),
        tier: m.tier ?? null,
        status: m.status ?? null,
        tierRank: typeof m.tierRank === 'number' ? m.tierRank : m.active ? tierRankOf(canonical) : 0,
        currentPeriodEnd: m.currentPeriodEnd,
        launchTrialEndsAt: m.launchTrialEndsAt,
        launchTrialDaysLeft: m.launchTrialDaysLeft,
      } satisfies MembershipInfo;
    } catch {
      return OFFLINE_BASIC;
    }
  })();
  cache = await inflight;
  inflight = null;
  listeners.forEach((fn) => fn(cache as MembershipInfo));
  return cache;
}

/** Call after a checkout redirect to refresh everyone's gates. */
export function refreshMembership(): Promise<MembershipInfo> {
  cache = null;
  return fetchMembershipOnce(true);
}

export function useMembership(_legacyProfile?: { vipStatus?: string; subscriptionActive?: boolean } | null) {
  const [membership, setMembership] = useState<MembershipInfo | null>(cache);

  useEffect(() => {
    let mounted = true;
    const onUpdate = (m: MembershipInfo) => {
      if (mounted) setMembership(m);
    };
    listeners.add(onUpdate);
    void fetchMembershipOnce().then(onUpdate);
    let retryA = 0;
    let retryB = 0;
    if (typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('membership') === 'success') {
      retryA = window.setTimeout(() => void refreshMembership(), 2000);
      retryB = window.setTimeout(() => void refreshMembership(), 8000);
    }
    return () => {
      mounted = false;
      listeners.delete(onUpdate);
      if (retryA) window.clearTimeout(retryA);
      if (retryB) window.clearTimeout(retryB);
    };
  }, []);

  const preview = readPlanPreview();
  const effectiveTier: CanonicalPlanId = preview
    ? preview
    : canonicalizePlanId(membership?.active ? membership.tier : 'basic');
  const plan = planOf(effectiveTier);
  const tierRank = plan.rank;

  return {
    membership,
    loading: membership === null && !preview,
    tierRank,
    planId: plan.id,
    limits: plan.limits as PlanLimits,
    flags: plan.flags as PlanFlags,
    chartSlots: practicalChartSlots(plan.id),
    hasFeature: (feature: FeatureKey) => hasFeatureForRank(tierRank, feature),
  };
}
