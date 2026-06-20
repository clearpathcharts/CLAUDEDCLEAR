import { marketCatalog } from "./marketCatalog";

export const SymbolResolver = {
  resolve(symbol: string) {
    const item = marketCatalog.find(
      m => m.symbol.toLowerCase() === symbol.toLowerCase()
    );

    if (!item) {
      return {
        providerSymbol: symbol,
        category: "unknown",
      };
    }

    // TwelveData formatting
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
