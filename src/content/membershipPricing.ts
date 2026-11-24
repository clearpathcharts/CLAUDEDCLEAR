export type MembershipPlanId = 'basic' | 'silver' | 'gold' | 'platinum';

export const FIRST_FREE_DAYS = 30;
export const LAUNCH_ACCESS_DAYS = 15;
export const PLAN_TRIAL_DAYS = 15;

/** Calendar year that maps to pricing year 1 on the locked ladder. */
export const MEMBERSHIP_PRICE_EPOCH_YEAR = 2026;
/** Mature list year — no automatic increases after this step. */
export const MEMBERSHIP_PRICE_YEAR_CAP = 5;

export type PaidMembershipPlanId = Exclude<MembershipPlanId, 'basic'>;

/**
 * Locked monthly list (cents) by company pricing year.
 * Year 1 uses .99 branding near the prior sheet; Platinum steps ~+$10 / year.
 * Silver / Gold stay ~40% / ~66% of Platinum so tiers never cross.
 */
export const MEMBERSHIP_PRICE_LADDER_CENTS: Record<PaidMembershipPlanId, readonly number[]> = {
  silver: [599, 999, 1399, 1799, 2199],
  gold: [999, 1649, 2299, 2999, 3649],
  platinum: [1499, 2499, 3499, 4499, 5499],
};

export function clampMembershipPricingYear(year: number): number {
  if (!Number.isFinite(year)) return 1;
  return Math.min(MEMBERSHIP_PRICE_YEAR_CAP, Math.max(1, Math.floor(year)));
}

export function membershipPricingYearForCalendarYear(calendarYear: number): number {
  return clampMembershipPricingYear(calendarYear - MEMBERSHIP_PRICE_EPOCH_YEAR + 1);
}

/** Company pricing year for new checkouts (UTC calendar year). Caps at year 5. */
export function currentMembershipPricingYear(now: Date = new Date()): number {
  return membershipPricingYearForCalendarYear(now.getUTCFullYear());
}

export function formatMembershipPrice(cents: number): string {
  return cents === 0 ? 'Free' : `$${(cents / 100).toFixed(2)}`;
}

/** Monthly amount Stripe checkout charges for a paid package at a pricing year. */
export function membershipMonthlyCents(
  planId: PaidMembershipPlanId,
  pricingYear: number = currentMembershipPricingYear(),
): number {
  const year = clampMembershipPricingYear(pricingYear);
  const ladder = MEMBERSHIP_PRICE_LADDER_CENTS[planId];
  if (!ladder) throw new Error(`Unknown package ${planId}`);
  return ladder[year - 1]!;
}

export type MembershipPlanPrice = {
  id: MembershipPlanId;
  name: string;
  /** Always reads the live company pricing year (not frozen at import). */
  readonly priceCents: number;
  readonly priceLabel: string;
  eyebrow: string;
  featured?: boolean;
  features: string[];
};

type PlanSheetBase = {
  id: MembershipPlanId;
  name: string;
  eyebrow: string;
  featured?: boolean;
  features: string[];
};

function withLiveListPrice(base: PlanSheetBase): MembershipPlanPrice {
  if (base.id === 'basic') {
    return { ...base, priceCents: 0, priceLabel: 'Free' };
  }
  const paidId = base.id;
  return {
    ...base,
    get priceCents() {
      return membershipMonthlyCents(paidId);
    },
    get priceLabel() {
      return formatMembershipPrice(membershipMonthlyCents(paidId));
    },
  };
}

/** Public /plans sheet — amounts follow the live company pricing year via getters. */
export const MEMBERSHIP_PLANS: MembershipPlanPrice[] = [
  withLiveListPrice({
    id: 'basic',
    name: 'Basic',
    eyebrow: 'Start here',
    features: [
      '1 chart/window',
      'High Speed Charting',
      '5 Basic Indicators',
      'Basic Drawing Tools',
      'Alerts (up to 3)',
      'Watchlist (up to 5)',
      'High Speed Price Action',
      '7 Year Historical Data',
      'Neuro-Divergent layouts',
      'No Platform Manipulation',
      'Real Time News',
    ],
  }),
  withLiveListPrice({
    id: 'silver',
    name: 'Silver',
    eyebrow: 'Build your workspace',
    features: [
      '4 chart/window',
      'High Speed Charting',
      '15 Basic Indicators',
      'All Drawing Tools',
      'Alerts (unlimited)',
      'Watchlist (Unlimited)',
      'High Speed Price Action',
      'Unlimited Historical Data',
      'Neuro-Divergent layouts',
      'No Platform Manipulation',
      'Real Time News',
      'Market Replay',
      'Intraday Charts',
      'Black Out Mode',
      'No Ads',
      'Education',
      'Gold Bar',
      'Custom Dashboard',
      'Custom Chart Reminders',
      'Encyclopedia of Finance',
      'Affiliate Links/Codes',
      'Social Media Hub',
    ],
  }),
  withLiveListPrice({
    id: 'gold',
    name: 'Gold',
    eyebrow: 'Create and replay',
    features: [
      '10 chart/window',
      'High Speed Charting',
      'All Indicators',
      'All Drawing Tools',
      'Alerts (unlimited)',
      'Watchlist (Unlimited)',
      'High Speed Price Action',
      'Unlimited Historical Data',
      'Neuro-Divergent layouts',
      'No Platform Manipulation',
      'Real Time News',
      'Market Replay',
      'Intraday Charts',
      'Black Out Mode',
      'No Ads',
      'Education',
      'Gold Bar',
      'Custom Dashboard',
      'Custom Chart Reminders',
      'Encyclopedia of Finance',
      'Affiliate Links/Codes',
      'Social Media Hub',
      'Pattern Overlay',
      'IndaCreator',
    ],
  }),
  withLiveListPrice({
    id: 'platinum',
    name: 'Platinum',
    eyebrow: 'Everything together',
    featured: true,
    features: [
      'Unlimited Charts',
      'High Speed Charting',
      'All Indicators',
      'All Drawing Tools',
      'Alerts (Unlimited)',
      'Watchlist (Unlimited)',
      'High Speed Price Action',
      'Unlimited Historical Data',
      'Neuro-Divergent layouts',
      'No Platform Manipulation',
      'Real Time News',
      'Market Replay',
      'Intraday Charts',
      'Black Out Mode',
      'No Ads',
      'Education',
      'Gold Bar',
      'Custom Dashboard',
      'Custom Chart Reminders',
      'Encyclopedia of Finance',
      'Affiliate Links/Codes',
      'Social Media Hub',
      'Pattern Overlay',
      'IndaCreator',
      'AI Pattern Scanner',
      'Addition of Bots',
    ],
  }),
];

export type MembershipAddon = {
  id: string;
  name: string;
  priceCents: number;
  priceLabel: string;
};

export const SILVER_ADDONS: MembershipAddon[] = [
  { id: 'unlimited-charts', name: 'Unlimited Charts', priceCents: 299, priceLabel: '$2.99' },
  { id: 'unlimited-indicators', name: 'Unlimited Indicators', priceCents: 399, priceLabel: '$3.99' },
  { id: 'market-replay', name: 'Market Replay', priceCents: 299, priceLabel: '$2.99' },
  { id: 'inda-creator', name: 'IndaCreator', priceCents: 399, priceLabel: '$3.99' },
  { id: 'pattern-overlay', name: 'Pattern Overlay', priceCents: 999, priceLabel: '$9.99' },
  { id: 'ai-pattern-scanner', name: 'AI Pattern Scanner', priceCents: 1499, priceLabel: '$14.99' },
  { id: 'bots', name: 'Ability to add Bots', priceCents: 599, priceLabel: '$5.99' },
];

export const ALL_ADDONS_CENTS = SILVER_ADDONS.reduce((sum, addon) => sum + addon.priceCents, 0);

/** Live Silver list cents for the current company pricing year. */
export function silverBaseCents(): number {
  return membershipMonthlyCents('silver');
}

/** Live Platinum list cents for the current company pricing year. */
export function platinumCents(): number {
  return membershipMonthlyCents('platinum');
}

export function silverWithAllAddonsCents(): number {
  return silverBaseCents() + ALL_ADDONS_CENTS;
}

/** Live aliases — prefer the function forms in new code. */
export const SILVER_BASE_CENTS = silverBaseCents;
export const PLATINUM_CENTS = platinumCents;
export const SILVER_WITH_ALL_ADDONS_CENTS = silverWithAllAddonsCents;

/** Public schedule rows for /plans (grandfather: continuous subscribers keep join-year rate). */
export function membershipPriceLadderRows(): Array<{
  year: number;
  silverLabel: string;
  goldLabel: string;
  platinumLabel: string;
  isCurrent: boolean;
  isCap: boolean;
}> {
  const current = currentMembershipPricingYear();
  return Array.from({ length: MEMBERSHIP_PRICE_YEAR_CAP }, (_, idx) => {
    const year = idx + 1;
    return {
      year,
      silverLabel: formatMembershipPrice(membershipMonthlyCents('silver', year)),
      goldLabel: formatMembershipPrice(membershipMonthlyCents('gold', year)),
      platinumLabel: formatMembershipPrice(membershipMonthlyCents('platinum', year)),
      isCurrent: year === current,
      isCap: year === MEMBERSHIP_PRICE_YEAR_CAP,
    };
  });
}
