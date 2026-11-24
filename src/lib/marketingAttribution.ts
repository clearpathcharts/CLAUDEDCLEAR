import type { MembershipPlanId } from '../content/membershipPricing';

type ClientAttribution = {
  source: string;
  medium: string;
  campaign: string;
  content: string;
  targetTier: MembershipPlanId;
  landingPath: string;
};

const ATTRIBUTION_KEY = 'cp_marketing_attribution_client';

function clean(value: string | null, fallback: string): string {
  return (value || fallback).trim().toLowerCase().slice(0, 80);
}

function readStoredAttribution(): ClientAttribution | null {
  try {
    const parsed = JSON.parse(sessionStorage.getItem(ATTRIBUTION_KEY) || 'null');
    return parsed && typeof parsed === 'object' ? (parsed as ClientAttribution) : null;
  } catch {
    return null;
  }
}

function readAttributionFromLocation(): ClientAttribution {
  const params = new URLSearchParams(window.location.search);
  const requestedTier = clean(params.get('offer') || params.get('tier'), 'basic');
  const targetTier: MembershipPlanId = ['basic', 'silver', 'gold', 'platinum'].includes(requestedTier)
    ? (requestedTier as MembershipPlanId)
    : 'basic';
  const stored = readStoredAttribution();
  return {
    source: clean(params.get('utm_source'), stored?.source || 'direct'),
    medium: clean(params.get('utm_medium'), stored?.medium || 'none'),
    campaign: clean(params.get('utm_campaign'), stored?.campaign || 'unattributed'),
    content: clean(params.get('utm_content'), stored?.content || 'unspecified'),
    targetTier,
    landingPath: `${window.location.pathname}${window.location.search}`.slice(0, 200),
  };
}

async function sendMarketingEvent(event: 'visit' | 'cta', attribution: ClientAttribution) {
  try {
    await fetch('/api/marketing/event', {
      method: 'POST',
      credentials: 'include',
      keepalive: true,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event, ...attribution }),
    });
  } catch {
    // Analytics must never block navigation, registration, or checkout.
  }
}

export function trackMarketingCta(targetTier: MembershipPlanId, content?: string) {
  if (typeof window === 'undefined') return;
  const current = readAttributionFromLocation();
  const attribution = {
    ...current,
    targetTier,
    content: clean(content || current.content, 'plan_cta'),
  };
  try {
    sessionStorage.setItem(ATTRIBUTION_KEY, JSON.stringify(attribution));
  } catch {
    // Cookie attribution still works after the visit beacon.
  }
  void sendMarketingEvent('cta', attribution);
}

export function trackMarketingVisit() {
  if (typeof window === 'undefined') return;
  const attribution = readAttributionFromLocation();
  try {
    sessionStorage.setItem(ATTRIBUTION_KEY, JSON.stringify(attribution));
    const visitKey = [
      'cp_marketing_visit',
      window.location.pathname,
      attribution.campaign,
      attribution.content,
      attribution.targetTier,
    ].join(':');
    if (sessionStorage.getItem(visitKey)) return;
    sessionStorage.setItem(visitKey, '1');
  } catch {
    // Continue with a best-effort beacon when storage is unavailable.
  }
  void sendMarketingEvent('visit', attribution);
}
