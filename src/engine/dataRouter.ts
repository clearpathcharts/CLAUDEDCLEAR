import { resolveQuotePrice } from "../lib/resolveQuotePrice";

export const DataRouter = {
  async fetchQuote(resolved: any) {
    const r = await fetch(`/api/quote?symbol=${encodeURIComponent(resolved.providerSymbol)}`);
    const data = await r.json();
    if (!r.ok || data?.error) {
      throw new Error(data?.message || `Quote proxy failed with status ${r.status}`);
    }
    const last = resolveQuotePrice(data);
    if (last == null) {
      throw new Error(`Quote had no usable price for ${resolved.providerSymbol}`);
    }
    return {
      price: last,
      close: last,
      symbol: data.symbol || resolved.providerSymbol,
    };
  },

  async fetchCandles(resolved: any, interval = "5min") {
    const r = await fetch(
      `/api/candles?symbol=${encodeURIComponent(resolved.providerSymbol)}&interval=${encodeURIComponent(interval)}`
    );
    if (!r.ok) {
      throw new Error(`Candles proxy failed with status ${r.status}`);
    }
    const data = await r.json();
    return data;
  },
};
