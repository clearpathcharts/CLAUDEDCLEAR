export type MembershipPlanId = 'basic' | 'silver' | 'gold' | 'platinum';

export type MembershipPlanPrice = {
  id: MembershipPlanId;
  name: string;
  priceCents: number;
  priceLabel: string;
  eyebrow: string;
  featured?: boolean;
  features: string[];
};

/** Founder-provided package sheet, uploaded 2026-09-16. */
export const MEMBERSHIP_PLANS: MembershipPlanPrice[] = [
  {
    id: 'basic',
    name: 'Basic',
    priceCents: 0,
    priceLabel: 'Free',
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
  },
  {
    id: 'silver',
    name: 'Silver',
    priceCents: 599,
    priceLabel: '$5.99',
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
  },
  {
    id: 'gold',
    name: 'Gold',
    priceCents: 999,
    priceLabel: '$9.99',
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
  },
  {
    id: 'platinum',
    name: 'Platinum',
    priceCents: 2499,
    priceLabel: '$24.99',
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
  },
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

export const SILVER_BASE_CENTS = 599;
export const ALL_ADDONS_CENTS = SILVER_ADDONS.reduce((sum, addon) => sum + addon.priceCents, 0);
export const SILVER_WITH_ALL_ADDONS_CENTS = SILVER_BASE_CENTS + ALL_ADDONS_CENTS;
export const PLATINUM_CENTS = 2499;

export function formatMembershipPrice(cents: number): string {
  return cents === 0 ? 'Free' : `$${(cents / 100).toFixed(2)}`;
}

