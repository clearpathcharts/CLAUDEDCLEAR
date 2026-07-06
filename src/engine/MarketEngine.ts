import { DataRouter } from "./dataRouter";
import { CacheLayer } from "./cacheLayer";
import { SymbolResolver } from "./symbolResolver";

export const MarketEngine = {
  async getQuote(symbol: string) {
    const resolved = SymbolResolver.resolve(symbol);

    const cacheKey = `quote:${resolved.providerSymbol}`;
    const cached = CacheLayer.get(cacheKey);
    if (cached) return cached;

    const data = await DataRouter.fetchQuote(resolved);

    CacheLayer.set(cacheKey, data, 3000);

    return data;
  },

  async getCandles(symbol: string, interval = "5min") {
    const resolved = SymbolResolver.resolve(symbol);

    const cacheKey = `candles:${resolved.providerSymbol}:${interval}`;
    const cached = CacheLayer.get(cacheKey);
    if (cached) return cached;

    const data = await DataRouter.fetchCandles(resolved, interval);

    CacheLayer.set(cacheKey, data, 5000);

    return data;
  },
};
