export const DataRouter = {
  async fetchQuote(resolved: any) {
    const r = await fetch(`/api/quote?symbol=${resolved.providerSymbol}`);
    const data = await r.json();
    return {
      price: parseFloat(data.close || data.price || 0),
      close: parseFloat(data.close || 0),
      symbol: data.symbol
    };
  },

  async fetchCandles(resolved: any) {
    const r = await fetch(`/api/candles?symbol=${resolved.providerSymbol}`);
    const data = await r.json();
    return data;
  },
};
