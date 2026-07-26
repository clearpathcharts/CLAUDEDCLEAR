import {
  ASSET_REGISTRY,
  type AssetCategory,
  type RegistryAsset,
} from "../constants/assetRegistry";

export type MarketCategory = AssetCategory | "futures";

export type MarketItem = {
  symbol: string;
  display: string;
  description: string;
  category: MarketCategory;
  base?: string;
  quote?: string;
  searchable: string[];
  providerSymbol?: string;
  latencyClass?: RegistryAsset["latencyClass"];
  exchange?: string;
};

/** Searchable catalog — enabled registry rows only (no futures bangs / SEO fluff). */
export const marketCatalog: MarketItem[] = ASSET_REGISTRY.filter((a) => a.enabled).map(
  (a) => ({
    symbol: a.symbol,
    display: a.display,
    description: a.description,
    category: a.category,
    base: a.base,
    quote: a.quote,
    searchable: a.searchable,
    providerSymbol: a.providerSymbol,
    latencyClass: a.latencyClass,
    exchange: a.exchange,
  })
);
