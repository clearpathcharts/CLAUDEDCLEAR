/**
 * Daily structure briefing product tiers — price points live in code.
 * Billing/checkout (Stripe or otherwise) is wired later by the founder.
 */

export type BriefingProductTier = "free" | "paid_add_on";

export type DailyBriefingProduct = {
  id: string;
  title: string;
  description: string;
  tier: BriefingProductTier;
  /** USD per week (paid add-ons with weekly billing). 0 when not offered. */
  priceUsdWeekly: number;
  /** USD per month (paid add-ons with monthly billing). 0 = free or weekly-only. */
  priceUsdMonthly: number;
  /** Human label, e.g. "$7.99/wk or $15.75/mo" */
  priceLabel: string;
};

export const PATTERN_LITERACY_TRAINING_PRICE_USD_WEEKLY = 7.99;
export const PATTERN_LITERACY_TRAINING_PRICE_USD_MONTHLY = 15.75;

/** @deprecated Use PATTERN_LITERACY_TRAINING_PRICE_USD_MONTHLY */
export const PATTERN_LITERACY_TRAINING_PRICE_USD = PATTERN_LITERACY_TRAINING_PRICE_USD_MONTHLY;

function formatUsd(amount: number): string {
  return `$${amount.toFixed(2)}`;
}

export const PATTERN_LITERACY_TRAINING_PRICE_LABEL = `${formatUsd(PATTERN_LITERACY_TRAINING_PRICE_USD_WEEKLY)}/wk or ${formatUsd(PATTERN_LITERACY_TRAINING_PRICE_USD_MONTHLY)}/mo`;

export const DAILY_BRIEFING_PRODUCTS = {
  marketProphetsMedia: {
    id: "market_prophets_media",
    title: "Market Prophets media & daily newsletter",
    description: "Daily market brief, headlines, and structure newspaper — free for everyone.",
    tier: "free",
    priceUsdWeekly: 0,
    priceUsdMonthly: 0,
    priceLabel: "Free",
  },
  patternLiteracyTraining: {
    id: "pattern_literacy_training",
    title: "Pattern literacy training",
    description:
      "Learn how to read each AI pattern label on the exact chart in your daily paper — weekly, daily, and in-between prints.",
    tier: "paid_add_on",
    priceUsdWeekly: PATTERN_LITERACY_TRAINING_PRICE_USD_WEEKLY,
    priceUsdMonthly: PATTERN_LITERACY_TRAINING_PRICE_USD_MONTHLY,
    priceLabel: PATTERN_LITERACY_TRAINING_PRICE_LABEL,
  },
} as const satisfies Record<string, DailyBriefingProduct>;

export type DailyBriefingProductId = keyof typeof DAILY_BRIEFING_PRODUCTS;

/** Checkout is intentionally not wired — founder picks billing provider later. */
export const DAILY_BRIEFING_BILLING_NOTE =
  "Checkout not live yet — price is locked in code until billing is connected.";

export function formatTrainingPriceLabel(): string {
  return PATTERN_LITERACY_TRAINING_PRICE_LABEL;
}

export function trainingPricingNote(): string {
  const free = DAILY_BRIEFING_PRODUCTS.marketProphetsMedia;
  const training = DAILY_BRIEFING_PRODUCTS.patternLiteracyTraining;
  return `${free.title}: free. ${training.title} (how to read each label on the exact chart in your daily paper): ${training.priceLabel} add-on.`;
}

export function dailyBriefingProductList(): DailyBriefingProduct[] {
  return Object.values(DAILY_BRIEFING_PRODUCTS);
}

export function scannerAccuracyNote(): string {
  return "Our AI pattern scanner is mathematically sound on completed OHLC geometry. It can still mis-label structure — the CEO reviews every briefing before it goes out.";
}

export function briefingDisclaimer(): string {
  return "Educational geometry on completed daily & weekly bars. Possible / forming — never a confirmed signal. Full live overlays stay on MARKETS/CHARTS.";
}
