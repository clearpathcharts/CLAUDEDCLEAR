export const TIER_LIMITS = {
  // Twelve Data time_series outputsize max is 5000. Higher values only
  // produce HTTP 400 and blank charts — keep all tiers within the provider cap.
  BRONZE: 5000,
  SILVER: 5000,
  GOLD: 5000,
  VIP: 5000,
};

export const getCandleLimit = (userTier?: string): number => {
  if (!userTier) return 5000;
  const normalized = userTier.toUpperCase();
  return TIER_LIMITS[normalized as keyof typeof TIER_LIMITS] || 1000;
};
