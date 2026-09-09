/**
 * Overnight structure-review universe.
 *
 * Only existing ClearPath registry symbols are scanned. Unmapped futures
 * pit codes and extra commodities stay DATA UNAVAILABLE — no invented feeds.
 */

import { ASSET_REGISTRY, getRegistryAsset, type RegistryAsset } from "../constants/assetRegistry";

export type PatternReviewBucket = "forex" | "stocks" | "indices" | "futures" | "commodities";

export type PatternReviewTarget = {
  id: string;
  bucket: PatternReviewBucket;
  /** App symbol when mapped; null means no vendor map. */
  symbol: string | null;
  display: string;
  description: string;
  /** Honest note for cash/index proxies (not listed futures). */
  proxyNote?: string;
  unavailableReason?: "NO VENDOR MAP";
};

const FOREX_TOP_25 = [
  "EURUSD",
  "GBPUSD",
  "USDJPY",
  "AUDUSD",
  "USDCAD",
  "NZDUSD",
  "USDCHF",
  "EURGBP",
  "EURJPY",
  "GBPJPY",
  "AUDJPY",
  "EURAUD",
  "EURCAD",
  "EURCHF",
  "GBPAUD",
  "GBPCAD",
  "GBPCHF",
  "AUDNZD",
  "AUDCAD",
  "CADJPY",
  "CHFJPY",
  "NZDJPY",
  "EURNZD",
  "USDMXN",
  "USDNOK",
] as const;

/** CME-style complexes → mapped cash/index proxies already in the registry. */
const FUTURES_PROXIES: Array<{
  id: string;
  symbol: string;
  display: string;
  note: string;
}> = [
  {
    id: "es_proxy",
    symbol: "SPX",
    display: "ES cash proxy (SPX)",
    note: "S&P 500 cash/index proxy — not a listed ES futures contract.",
  },
  {
    id: "nq_proxy",
    symbol: "NDX",
    display: "NQ cash proxy (NDX)",
    note: "Nasdaq 100 cash/index proxy — not a listed NQ futures contract.",
  },
  {
    id: "ym_proxy",
    symbol: "DJI",
    display: "YM cash proxy (DJI)",
    note: "Dow cash/index proxy — not a listed YM futures contract.",
  },
  {
    id: "cl_proxy",
    symbol: "WTI",
    display: "CL cash proxy (WTI)",
    note: "WTI spot proxy — not a listed CL futures contract.",
  },
  {
    id: "bz_proxy",
    symbol: "BRENT",
    display: "BZ cash proxy (BRENT)",
    note: "Brent spot proxy — not a listed BZ futures contract.",
  },
  {
    id: "ng_proxy",
    symbol: "NATGAS",
    display: "NG cash proxy (NATGAS)",
    note: "Natural gas spot proxy — not a listed NG futures contract.",
  },
  {
    id: "gc_proxy",
    symbol: "XAUUSD",
    display: "GC cash proxy (XAU/USD)",
    note: "Gold spot proxy — not a listed GC futures contract.",
  },
  {
    id: "si_proxy",
    symbol: "XAGUSD",
    display: "SI cash proxy (XAG/USD)",
    note: "Silver spot proxy — not a listed SI futures contract.",
  },
  {
    id: "hg_proxy",
    symbol: "COPPER",
    display: "HG cash proxy (COPPER)",
    note: "Copper spot proxy — not a listed HG futures contract.",
  },
  {
    id: "zn_proxy",
    symbol: "US10Y",
    display: "ZN cash proxy (US10Y)",
    note: "10-year yield proxy — not a listed ZN futures contract.",
  },
];

const COMMODITY_UNMAPPED: Array<Pick<PatternReviewTarget, "id" | "display" | "description">> = [
  { id: "wheat", display: "Wheat", description: "CBOT wheat complex" },
  { id: "corn", display: "Corn", description: "CBOT corn complex" },
  { id: "coffee", display: "Coffee", description: "ICE coffee complex" },
  { id: "sugar", display: "Sugar", description: "ICE sugar complex" },
];

function fromAsset(asset: RegistryAsset, bucket: PatternReviewBucket, id?: string): PatternReviewTarget {
  return {
    id: id || `${bucket}:${asset.symbol}`,
    bucket,
    symbol: asset.symbol,
    display: asset.display,
    description: asset.description,
  };
}

function requireAsset(symbol: string): RegistryAsset {
  const asset = getRegistryAsset(symbol);
  if (!asset || !asset.enabled) {
    throw new Error(`dailyPatternUniverse: ${symbol} is not an enabled registry asset`);
  }
  return asset;
}

export function buildDailyPatternUniverse(): PatternReviewTarget[] {
  const forex = FOREX_TOP_25.map((sym) => fromAsset(requireAsset(sym), "forex"));

  const stocks = ASSET_REGISTRY.filter((a) => a.enabled && a.category === "stocks").map((a) =>
    fromAsset(a, "stocks"),
  );

  const indices = ASSET_REGISTRY.filter((a) => a.enabled && a.category === "indices").map((a) =>
    fromAsset(a, "indices"),
  );

  const futures: PatternReviewTarget[] = FUTURES_PROXIES.map((row) => {
    const asset = requireAsset(row.symbol);
    return {
      ...fromAsset(asset, "futures", row.id),
      display: row.display,
      proxyNote: row.note,
    };
  });

  const mappedCommodities = ASSET_REGISTRY.filter(
    (a) => a.enabled && (a.category === "commodities" || a.category === "metals"),
  ).map((a) => fromAsset(a, "commodities"));

  const unmappedCommodities: PatternReviewTarget[] = COMMODITY_UNMAPPED.map((row) => ({
    id: `commodities:${row.id}`,
    bucket: "commodities" as const,
    symbol: null,
    display: row.display,
    description: row.description,
    unavailableReason: "NO VENDOR MAP",
  }));

  return [...forex, ...stocks, ...indices, ...futures, ...mappedCommodities, ...unmappedCommodities];
}

export const DAILY_PATTERN_UNIVERSE = buildDailyPatternUniverse();

export function universeCounts(): Record<PatternReviewBucket, number> {
  const counts: Record<PatternReviewBucket, number> = {
    forex: 0,
    stocks: 0,
    indices: 0,
    futures: 0,
    commodities: 0,
  };
  for (const row of DAILY_PATTERN_UNIVERSE) counts[row.bucket] += 1;
  return counts;
}

export function mappedUniverse(): PatternReviewTarget[] {
  return DAILY_PATTERN_UNIVERSE.filter((t) => Boolean(t.symbol) && !t.unavailableReason);
}
