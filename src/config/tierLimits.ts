/**
 * Candle history caps. The founder sheet claims "7 year" (Basic) and
 * "unlimited" (Silver+). Twelve Data time_series outputsize max is 5000 —
 * higher values only produce HTTP 400 and blank charts.
 */
import { canonicalizePlanId, planOf } from '../lib/planCatalog';

const TWELVEDATA_MAX_OUTPUTSIZE = 5000;

/** @deprecated use planOf(tier).limits.candleOutputsize */
export const TIER_LIMITS = {
  BASIC: TWELVEDATA_MAX_OUTPUTSIZE,
  BRONZE: TWELVEDATA_MAX_OUTPUTSIZE,
  SILVER: TWELVEDATA_MAX_OUTPUTSIZE,
  GOLD: TWELVEDATA_MAX_OUTPUTSIZE,
  PLATINUM: TWELVEDATA_MAX_OUTPUTSIZE,
  VIP: TWELVEDATA_MAX_OUTPUTSIZE,
};

export const getCandleLimit = (userTier?: string): number => {
  if (!userTier) return TWELVEDATA_MAX_OUTPUTSIZE;
  const plan = planOf(canonicalizePlanId(userTier));
  return Math.min(plan.limits.candleOutputsize, TWELVEDATA_MAX_OUTPUTSIZE);
};
