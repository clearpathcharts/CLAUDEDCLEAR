export const TIER_LIMITS = {
  BRONZE: 5000,
  SILVER: 10000,
  GOLD: 20000,
  VIP: 40000,
};

export const getCandleLimit = (userTier?: string): number => {
  if (!userTier) return 5000;
  const normalized = userTier.toUpperCase();
  return TIER_LIMITS[normalized as keyof typeof TIER_LIMITS] || 1000;
};
