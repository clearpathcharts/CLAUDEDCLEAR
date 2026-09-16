import { getRegistryAsset } from "../constants/assetRegistry";
import { marketCatalog } from "./marketCatalog";

export const SymbolResolver = {
  resolve(symbol: string) {
    const registry = getRegistryAsset(symbol);
    if (registry) {
      return {
        providerSymbol: registry.providerSymbol,
        category: registry.category,
        latencyClass: registry.latencyClass,
        exchange: registry.exchange,
      };
    }

    const item = marketCatalog.find(
      (m) => m.symbol.toLowerCase() === symbol.toLowerCase()
    );

    if (!item) {
      return {
        providerSymbol: symbol,
        category: "unknown" as const,
      };
    }

    if (item.providerSymbol) {
      return {
        providerSymbol: item.providerSymbol,
        category: item.category,
        latencyClass: item.latencyClass,
        exchange: item.exchange,
      };
    }

    if (item.base && item.quote) {
      return {
        providerSymbol: `${item.base}/${item.quote}`,
        category: item.category,
      };
    }

    return {
      providerSymbol: item.symbol,
      category: item.category,
    };
  },
};
