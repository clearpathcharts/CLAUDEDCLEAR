export const DataRouter = {
  async fetchQuote(resolved: any) {
    const r = await fetch(`/api/quote?symbol=${encodeURIComponent(resolved.providerSymbol)}`);
    const data = await r.json();
    return {
      price: parseFloat(data.close || data.price || 0),
      close: parseFloat(data.close || 0),
      symbol: data.symbol
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
