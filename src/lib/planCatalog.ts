/**
 * Founder sheet → machine source of truth.
 *
 * The handwritten Basic / Silver / Gold / Platinum feature matrix is the product.
 * Every limit and feature flag here is what the app is allowed to claim.
 * Pricing is intentionally omitted — list prices are not part of this catalog.
 * `accuracy` says whether we can enforce a feature today, or only advertise it.
 *
 * Twelve Data `time_series` outputsize max is 5000. "7 year" and "unlimited"
 * history are sheet claims — candles are still vendor-capped.
 */

import { SUPPORTED_CHART_INDICATORS } from '../config/tradingViewIndicators';
import type { DrawingToolId } from '../components/charts/drawings/types';

export const CANONICAL_PLANS = ['basic', 'silver', 'gold', 'platinum'] as const;
export type CanonicalPlanId = (typeof CANONICAL_PLANS)[number];

/** @deprecated legacy Stripe / UI ids — map through canonicalizePlanId() */
export type LegacyPlanId = 'pro' | 'proplus' | 'premium' | 'ultimate' | 'plus' | 'free' | 'bronze' | 'vip';

export type PlanId = CanonicalPlanId | LegacyPlanId | string;

export type FeatureAccuracy = 'enforced' | 'vendor_capped' | 'partial' | 'planned';

export const UNLIMITED = Number.POSITIVE_INFINITY;

/** Practical UI cap when the sheet says "unlimited charts". */
export const PRACTICAL_CHART_SLOT_CAP = 16;

export const BASIC_INDICATOR_ABBRS = ['SMA', 'EMA', 'RSI', 'MACD', 'VOL'] as const;
export const SILVER_INDICATOR_ABBRS = [
  'SMA',
  'EMA',
  'WMA',
  'VWMA',
  'DEMA',
  'TEMA',
  'HMA',
  'RSI',
  'MACD',
  'STOCH',
  'CCI',
  'ATR',
  'BB',
  'VWAP',
  'VOL',
] as const;

export const BASIC_DRAWING_TOOLS: DrawingToolId[] = [
  'select',
  'trend',
  'horizontal',
  'vertical',
];

export const INTRADAY_TIMEFRAMES = ['1m', '2m', '3m', '5m', '10m', '15m', '30m'] as const;

export type PlanLimits = {
  chartsPerWindow: number;
  indicators: number;
  indicatorAbbrs: readonly string[] | 'all';
  drawingTools: 'basic' | 'all';
  alerts: number;
  watchlists: number;
  /** Sheet claim in years. Null = unlimited claim. */
  historicalYearsClaim: number | null;
  /** What the candle API will actually return. */
  candleOutputsize: number;
  intradayCharts: boolean;
};

export type PlanFlags = {
  highSpeedCharting: boolean;
  highSpeedPriceAction: boolean;
  neurodivergentLayouts: boolean;
  noPlatformManipulation: boolean;
  realTimeNews: boolean;
  paperTrading: boolean;
  marketReplay: boolean;
  blackoutMode: boolean;
  noAds: boolean;
  customDashboard: boolean;
  customChartReminders: boolean;
  education: boolean;
  goldBar: boolean;
  encyclopedia: boolean;
  affiliate: boolean;
  socialHub: boolean;
  patternOverlay: boolean;
  indaCreator: boolean;
  aiPatternScanner: boolean;
  bots: boolean;
};

export type PlanDefinition = {
  id: CanonicalPlanId;
  rank: number;
  label: string;
  limits: PlanLimits;
  flags: PlanFlags;
  sheetLines: string[];
};

const TWELVEDATA_MAX_OUTPUTSIZE = 5000;

const ALL_FLAGS_OFF: PlanFlags = {
  highSpeedCharting: false,
  highSpeedPriceAction: false,
  neurodivergentLayouts: false,
  noPlatformManipulation: false,
  realTimeNews: false,
  paperTrading: false,
  marketReplay: false,
  blackoutMode: false,
  noAds: false,
  customDashboard: false,
  customChartReminders: false,
  education: false,
  goldBar: false,
  encyclopedia: false,
  affiliate: false,
  socialHub: false,
  patternOverlay: false,
  indaCreator: false,
  aiPatternScanner: false,
  bots: false,
};

const BASIC_FLAGS: PlanFlags = {
  ...ALL_FLAGS_OFF,
  highSpeedCharting: true,
  highSpeedPriceAction: true,
  neurodivergentLayouts: true,
  noPlatformManipulation: true,
  realTimeNews: true,
  paperTrading: true,
};

const SILVER_FLAGS: PlanFlags = {
  ...BASIC_FLAGS,
  marketReplay: true,
  blackoutMode: true,
  noAds: true,
  customDashboard: true,
  customChartReminders: true,
  education: true,
  goldBar: true,
  encyclopedia: true,
  affiliate: true,
  socialHub: true,
};

const GOLD_FLAGS: PlanFlags = {
  ...SILVER_FLAGS,
  patternOverlay: true,
  indaCreator: true,
};

const PLATINUM_FLAGS: PlanFlags = {
  ...GOLD_FLAGS,
  aiPatternScanner: true,
  bots: true,
};

export const PLAN_CATALOG: Record<CanonicalPlanId, PlanDefinition> = {
  basic: {
    id: 'basic',
    rank: 0,
    label: 'Basic',
    limits: {
      chartsPerWindow: 1,
      indicators: 5,
      indicatorAbbrs: BASIC_INDICATOR_ABBRS,
      drawingTools: 'basic',
      alerts: 3,
      watchlists: 3,
      historicalYearsClaim: 7,
      candleOutputsize: TWELVEDATA_MAX_OUTPUTSIZE,
      intradayCharts: false,
    },
    flags: BASIC_FLAGS,
    sheetLines: [
      '1 chart per window',
      'High Speed Charting',
      '5 Basic Indicators',
      'Basic Drawing Tools',
      'Alerts (up to 3)',
      'Watchlist (up to 3)',
      'High Speed Price Action',
      '7 Year Historical Data',
      'Neuro-Divergent layouts',
      'No Platform Manipulation',
      'Real Time News',
      'Paper Trading',
    ],
  },
  silver: {
    id: 'silver',
    rank: 1,
    label: 'Silver',
    limits: {
      chartsPerWindow: 4,
      indicators: 15,
      indicatorAbbrs: SILVER_INDICATOR_ABBRS,
      drawingTools: 'all',
      alerts: UNLIMITED,
      watchlists: 8,
      historicalYearsClaim: null,
      candleOutputsize: TWELVEDATA_MAX_OUTPUTSIZE,
      intradayCharts: true,
    },
    flags: SILVER_FLAGS,
    sheetLines: [
      '4 charts per window',
      '15 Basic Indicators',
      'All Drawing Tools',
      'Unlimited Alerts',
      'Watchlist (up to 8)',
      'Unlimited Historical Data',
      'Market Replay',
      'Intraday Charts',
      'Black Out Mode',
      'No Ads',
      'Custom Dashboard',
      'Custom Chart Reminders',
      'Education',
      'Gold Bar',
      'Encyclopedia of Finance',
      'Affiliate Links/Codes',
      'Social Media Hub',
      'Paper Trading',
    ],
  },
  gold: {
    id: 'gold',
    rank: 2,
    label: 'Gold',
    limits: {
      chartsPerWindow: 10,
      indicators: SUPPORTED_CHART_INDICATORS.length,
      indicatorAbbrs: 'all',
      drawingTools: 'all',
      alerts: UNLIMITED,
      watchlists: 15,
      historicalYearsClaim: null,
      candleOutputsize: TWELVEDATA_MAX_OUTPUTSIZE,
      intradayCharts: true,
    },
    flags: GOLD_FLAGS,
    sheetLines: [
      '10 charts per window',
      'All Indicators',
      'Watchlist (up to 15)',
      'Pattern Overlay',
      'IndaCreator',
    ],
  },
  platinum: {
    id: 'platinum',
    rank: 3,
    label: 'Platinum',
    limits: {
      chartsPerWindow: UNLIMITED,
      indicators: SUPPORTED_CHART_INDICATORS.length,
      indicatorAbbrs: 'all',
      drawingTools: 'all',
      alerts: UNLIMITED,
      watchlists: UNLIMITED,
      historicalYearsClaim: null,
      candleOutputsize: TWELVEDATA_MAX_OUTPUTSIZE,
      intradayCharts: true,
    },
    flags: PLATINUM_FLAGS,
    sheetLines: [
      'Unlimited Charts',
      'Watchlist Unlimited',
      'AI Pattern Scanner',
      'Addition of Bots',
    ],
  },
};

export const FEATURE_ACCURACY: Record<keyof PlanFlags | keyof PlanLimits, FeatureAccuracy> = {
  chartsPerWindow: 'enforced',
  indicators: 'enforced',
  indicatorAbbrs: 'enforced',
  drawingTools: 'enforced',
  alerts: 'enforced',
  watchlists: 'enforced',
  historicalYearsClaim: 'vendor_capped',
  candleOutputsize: 'vendor_capped',
  intradayCharts: 'enforced',
  highSpeedCharting: 'partial',
  highSpeedPriceAction: 'partial',
  neurodivergentLayouts: 'enforced',
  noPlatformManipulation: 'enforced',
  realTimeNews: 'partial',
  paperTrading: 'partial',
  marketReplay: 'partial',
  blackoutMode: 'enforced',
  noAds: 'enforced',
  customDashboard: 'partial',
  customChartReminders: 'planned',
  education: 'enforced',
  goldBar: 'enforced',
  encyclopedia: 'enforced',
  affiliate: 'enforced',
  socialHub: 'partial',
  patternOverlay: 'enforced',
  indaCreator: 'enforced',
  aiPatternScanner: 'partial',
  bots: 'partial',
};

const LEGACY_PLAN_MAP: Record<string, CanonicalPlanId> = {
  basic: 'basic',
  silver: 'silver',
  gold: 'gold',
  platinum: 'platinum',
  pro: 'silver',
  plus: 'silver',
  proplus: 'gold',
  premium: 'gold',
  ultimate: 'platinum',
  free: 'basic',
  bronze: 'basic',
  vip: 'platinum',
};

export function canonicalizePlanId(tier: PlanId | null | undefined): CanonicalPlanId {
  if (!tier) return 'basic';
  const key = String(tier).trim().toLowerCase();
  return LEGACY_PLAN_MAP[key] ?? 'basic';
}

export function planOf(tier: PlanId | null | undefined): PlanDefinition {
  return PLAN_CATALOG[canonicalizePlanId(tier)];
}

export function isUnlimited(n: number): boolean {
  return !Number.isFinite(n) || n >= UNLIMITED;
}

export function formatLimit(n: number): string {
  return isUnlimited(n) ? 'Unlimited' : String(n);
}

export function practicalChartSlots(tier: PlanId | null | undefined): number {
  const n = planOf(tier).limits.chartsPerWindow;
  if (isUnlimited(n)) return PRACTICAL_CHART_SLOT_CAP;
  return Math.max(1, Math.floor(n));
}

export function allowedIndicatorAbbrs(tier: PlanId | null | undefined): Set<string> | 'all' {
  const list = planOf(tier).limits.indicatorAbbrs;
  if (list === 'all') return 'all';
  return new Set(list);
}

export function isIndicatorAllowed(tier: PlanId | null | undefined, abbr: string): boolean {
  const allowed = allowedIndicatorAbbrs(tier);
  if (allowed === 'all') return true;
  return allowed.has(abbr);
}

export function isDrawingToolAllowed(tier: PlanId | null | undefined, tool: DrawingToolId): boolean {
  if (planOf(tier).limits.drawingTools === 'all') return true;
  return BASIC_DRAWING_TOOLS.includes(tool);
}

export function isIntradayTimeframe(tf: string): boolean {
  return (INTRADAY_TIMEFRAMES as readonly string[]).includes(tf);
}

export function withinLimit(count: number, max: number): boolean {
  if (isUnlimited(max)) return true;
  return count <= max;
}

export const PAID_CANONICAL_PLANS = CANONICAL_PLANS.filter((id) => id !== 'basic');

export function jsonSafeLimit(n: number): number | null {
  return Number.isFinite(n) ? n : null;
}

export function jsonSafeLimits(limits: PlanLimits) {
  return {
    ...limits,
    chartsPerWindow: jsonSafeLimit(limits.chartsPerWindow),
    alerts: jsonSafeLimit(limits.alerts),
    watchlists: jsonSafeLimit(limits.watchlists),
  };
}

/** URL `?planPreview=basic|silver|gold|platinum` — lets us verify gates with billing off. */
export function readPlanPreview(): CanonicalPlanId | null {
  if (typeof window === 'undefined') return null;
  try {
    const q = new URLSearchParams(window.location.search).get('planPreview');
    if (q && (CANONICAL_PLANS as readonly string[]).includes(q)) return q as CanonicalPlanId;
  } catch {
    /* ignore */
  }
  return null;
}
