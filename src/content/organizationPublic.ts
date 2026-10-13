/** Public company facts — safe for website and JSON-LD (no street address, no DE file number). */

export const ORG_BASE_URL = 'https://clearpathtrader.com';

export const ORG_LEGAL_NAME = 'Clear Path Markets Science Corp.';

export const ORG_BRAND_NAMES = [
  'ClearPathTrader',
  'Clear Path Trader',
  'ClearPath Trader',
  'ClearPathTrader.com',
] as const;

export const ORG_FOUNDING_DATE = '2026-05-12';

/** Product/build narrative (~7 years before DE incorporation). */
export const ORG_PRODUCT_HISTORY_YEARS = 7;

export const ORG_JURISDICTION_LABEL = 'Delaware corporation';

export const ORG_INSTAGRAM_URL = 'https://www.instagram.com/clearpathtrader';

export const ORG_SAME_AS = [ORG_INSTAGRAM_URL] as const;

export const COMPANY_META_DESCRIPTION =
  'Clear Path Markets Science Corp. — a Delaware corporation behind ClearPath Trader, an educational financial markets site with four trader desks. Not a broker-dealer.';
