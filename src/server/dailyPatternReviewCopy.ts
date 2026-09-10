/** Shared copy for CEO inbox, digest email, and public newsletter framing. */

import {
  briefingDisclaimer,
  dailyBriefingProductList,
  scannerAccuracyNote,
  trainingPricingNote,
  DAILY_BRIEFING_BILLING_NOTE,
  DAILY_BRIEFING_PRODUCTS,
  PATTERN_LITERACY_TRAINING_PRICE_USD,
  PATTERN_LITERACY_TRAINING_PRICE_USD_MONTHLY,
  PATTERN_LITERACY_TRAINING_PRICE_USD_WEEKLY,
  PATTERN_LITERACY_TRAINING_PRICE_LABEL,
} from "../lib/dailyBriefingProducts";

export const BRIEFING_DISCLAIMER = briefingDisclaimer();
export const SCANNER_ACCURACY_NOTE = scannerAccuracyNote();
export const TRAINING_PRICING_NOTE = trainingPricingNote();

export {
  dailyBriefingProductList,
  DAILY_BRIEFING_BILLING_NOTE,
  DAILY_BRIEFING_PRODUCTS,
  PATTERN_LITERACY_TRAINING_PRICE_USD,
  PATTERN_LITERACY_TRAINING_PRICE_USD_MONTHLY,
  PATTERN_LITERACY_TRAINING_PRICE_USD_WEEKLY,
  PATTERN_LITERACY_TRAINING_PRICE_LABEL,
};
