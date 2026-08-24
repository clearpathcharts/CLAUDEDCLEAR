/**
 * Client-side membership status with a module-level cache so every component
 * shares one fetch of /api/membership/me (which also starts the 15-day
 * Ultimate launch gift server-side on first call).
 *
 * UI gating only — the server remains the source of truth for anything paid.
 */
import { useEffect, useState } from 'react';
import { tierRankOf, hasFeatureForRank, type FeatureKey } from '../lib/entitlements';
import { PAYMENTS_ENABLED } from '../lib/paymentsEnabled';

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

const PAYMENTS_OFF: MembershipInfo = {
  active: true,
  tier: 'free',
  status: 'payments_disabled',
  tierRank: 4,
};

let cache: MembershipInfo | null = null;
let inflight: Promise<MembershipInfo> | null = null;
const listeners = new Set<(m: MembershipInfo) => void>();

async function fetchMembershipOnce(force = false): Promise<MembershipInfo> {
  if (!PAYMENTS_ENABLED) return PAYMENTS_OFF;
  if (cache && !force) return cache;
  if (inflight && !force) return inflight;
  inflight = (async () => {
    try {
      const res = await fetch('/api/membership/me', { credentials: 'include' });
      if (!res.ok) return OFFLINE_BASIC;
      const data = await res.json();
      const m = data?.membership;
      if (!m) return OFFLINE_BASIC;
      return {
        active: Boolean(m.active),
        tier: m.tier ?? null,
        status: m.status ?? null,
        tierRank: typeof m.tierRank === 'number' ? m.tierRank : m.active ? tierRankOf(m.tier) : 0,
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
    return () => {
      mounted = false;
      listeners.delete(onUpdate);
    };
  }, []);

  // Paid rank comes only from /api/membership/me. When billing is off, every
  // desk feature is open. Client vipStatus must never grant Ultimate.
  const tierRank = PAYMENTS_ENABLED ? membership?.tierRank ?? 0 : 4;

  return {
    membership,
    loading: membership === null,
    tierRank,
    hasFeature: (feature: FeatureKey) => hasFeatureForRank(tierRank, feature),
  };
}
