/**
 * Candle history caps by membership plan.
 * Basic/Silver/Gold: one Twelve Data page (5,000).
 * Platinum / founder (Richard Anthony Floyd): up to 40,000 via paged fetches.
 */
import {
  canonicalizePlanId,
  planOf,
  PLATINUM_CANDLE_OUTPUTSIZE,
  TWELVEDATA_PAGE_OUTPUTSIZE,
} from '../lib/planCatalog';

export { TWELVEDATA_PAGE_OUTPUTSIZE, PLATINUM_CANDLE_OUTPUTSIZE };

/** @deprecated use planOf(tier).limits.candleOutputsize */
export const TIER_LIMITS = {
  BASIC: TWELVEDATA_PAGE_OUTPUTSIZE,
  BRONZE: TWELVEDATA_PAGE_OUTPUTSIZE,
  SILVER: TWELVEDATA_PAGE_OUTPUTSIZE,
  GOLD: TWELVEDATA_PAGE_OUTPUTSIZE,
  PLATINUM: PLATINUM_CANDLE_OUTPUTSIZE,
  VIP: PLATINUM_CANDLE_OUTPUTSIZE,
};

export const getCandleLimit = (userTier?: string): number => {
  if (!userTier) return TWELVEDATA_PAGE_OUTPUTSIZE;
  const plan = planOf(canonicalizePlanId(userTier));
  return Math.max(1, Math.floor(plan.limits.candleOutputsize));
};
