/**
 * Pattern literacy training add-on — entitlement check only (no Stripe).
 * When billing goes live, set `patternLiteracyTraining` on the member profile
 * via whatever webhook/admin path the founder chooses.
 */

import { DAILY_BRIEFING_PRODUCTS } from "./dailyBriefingProducts";

export type PatternLiteracyEntitlementSource = "none" | "profile" | "founder_override";

export type PatternLiteracyAccess = {
  entitled: boolean;
  productId: string;
  priceLabel: string;
  source: PatternLiteracyEntitlementSource;
};

export function patternLiteracyFromProfile(
  profile?: { addOns?: { patternLiteracyTraining?: boolean } } | null,
): PatternLiteracyAccess {
  const product = DAILY_BRIEFING_PRODUCTS.patternLiteracyTraining;
  const entitled = profile?.addOns?.patternLiteracyTraining === true;
  return {
    entitled,
    productId: product.id,
    priceLabel: product.priceLabel,
    source: entitled ? "profile" : "none",
  };
}

/** Public/marketing view — training exists at listed price; checkout deferred. */
export function patternLiteracyCatalogCard(): {
  title: string;
  description: string;
  priceLabel: string;
  checkoutLive: false;
} {
  const product = DAILY_BRIEFING_PRODUCTS.patternLiteracyTraining;
  return {
    title: product.title,
    description: product.description,
    priceLabel: product.priceLabel,
    checkoutLive: false,
  };
}
