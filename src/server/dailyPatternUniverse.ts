/**
 * Overnight structure-review universe.
 *
 * Top 25 forex · top 25 commodities (mapped + honest NO VENDOR MAP) · indices
 * (DXY, DJI pinned) · futures proxies · metals · crude · top stocks.
 */

import { ASSET_REGISTRY, getRegistryAsset, type RegistryAsset } from "../constants/assetRegistry";

export type PatternReviewBucket = "forex" | "stocks" | "indices" | "futures" | "commodities";

export type PatternReviewTarget = {
  id: string;
  bucket: PatternReviewBucket;
  symbol: string | null;
  display: string;
  description: string;
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

/** DXY + Dow Jones Industrial + other major indices. */
const INDICES_PINNED = ["DXY", "DJI", "SPX", "NDX", "VIX"] as const;

const FUTURES_PROXIES: Array<{
  id: string;
  symbol: string;
  display: string;
  note: string;
}> = [
  { id: "es_proxy", symbol: "SPX", display: "ES cash proxy (SPX)", note: "S&P 500 cash/index proxy — not a listed ES futures contract." },
  { id: "nq_proxy", symbol: "NDX", display: "NQ cash proxy (NDX)", note: "Nasdaq 100 cash/index proxy — not a listed NQ futures contract." },
  { id: "ym_proxy", symbol: "DJI", display: "YM cash proxy (DJI / Dow)", note: "Dow Jones Industrial cash proxy — not a listed YM futures contract." },
  { id: "cl_proxy", symbol: "WTI", display: "CL cash proxy (WTI crude)", note: "WTI spot proxy — not a listed CL futures contract." },
  { id: "bz_proxy", symbol: "BRENT", display: "BZ cash proxy (BRENT)", note: "Brent spot proxy — not a listed BZ futures contract." },
  { id: "ng_proxy", symbol: "NATGAS", display: "NG cash proxy (NATGAS)", note: "Natural gas spot proxy — not a listed NG futures contract." },
  { id: "gc_proxy", symbol: "XAUUSD", display: "GC cash proxy (Gold)", note: "Gold spot proxy — not a listed GC futures contract." },
  { id: "si_proxy", symbol: "XAGUSD", display: "SI cash proxy (Silver)", note: "Silver spot proxy — not a listed SI futures contract." },
  { id: "hg_proxy", symbol: "COPPER", display: "HG cash proxy (COPPER)", note: "Copper spot proxy — not a listed HG futures contract." },
  { id: "zn_proxy", symbol: "US10Y", display: "ZN cash proxy (US10Y)", note: "10-year yield proxy — not a listed ZN futures contract." },
];

/** Top 25 commodity complexes — mapped registry symbols first, then honest unmapped slots. */
const COMMODITY_MAPPED_SYMBOLS = ["XAUUSD", "XAGUSD", "WTI", "BRENT", "NATGAS", "COPPER"] as const;

const COMMODITY_UNMAPPED: Array<Pick<PatternReviewTarget, "id" | "display" | "description">> = [
  { id: "wheat", display: "Wheat (CBOT)", description: "CBOT wheat complex" },
  { id: "corn", display: "Corn (CBOT)", description: "CBOT corn complex" },
  { id: "soybeans", display: "Soybeans (CBOT)", description: "CBOT soybeans complex" },
  { id: "coffee", display: "Coffee (ICE)", description: "ICE coffee complex" },
  { id: "sugar", display: "Sugar (ICE)", description: "ICE sugar complex" },
  { id: "cotton", display: "Cotton (ICE)", description: "ICE cotton complex" },
  { id: "cocoa", display: "Cocoa (ICE)", description: "ICE cocoa complex" },
  { id: "platinum", display: "Platinum", description: "NYMEX platinum complex" },
  { id: "palladium", display: "Palladium", description: "NYMEX palladium complex" },
  { id: "lumber", display: "Lumber (CME)", description: "CME lumber complex" },
  { id: "rice", display: "Rough rice (CBOT)", description: "CBOT rough rice complex" },
  { id: "lean_hogs", display: "Lean hogs (CME)", description: "CME lean hogs complex" },
  { id: "live_cattle", display: "Live cattle (CME)", description: "CME live cattle complex" },
  { id: "heating_oil", display: "Heating oil (NYMEX)", description: "NYMEX heating oil complex" },
  { id: "gasoline", display: "RBOB gasoline (NYMEX)", description: "NYMEX RBOB gasoline complex" },
  { id: "aluminum", display: "Aluminum (LME)", description: "LME aluminum complex" },
  { id: "zinc", display: "Zinc (LME)", description: "LME zinc complex" },
  { id: "nickel", display: "Nickel (LME)", description: "LME nickel complex" },
  { id: "orange_juice", display: "Orange juice (ICE)", description: "ICE frozen OJ complex" },
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

  const indices = INDICES_PINNED.map((sym) => fromAsset(requireAsset(sym), "indices"));

  const futures: PatternReviewTarget[] = FUTURES_PROXIES.map((row) => {
    const asset = requireAsset(row.symbol);
    return {
      ...fromAsset(asset, "futures", row.id),
      display: row.display,
      proxyNote: row.note,
    };
  });

  const mappedCommodities = COMMODITY_MAPPED_SYMBOLS.map((sym) => fromAsset(requireAsset(sym), "commodities"));

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
