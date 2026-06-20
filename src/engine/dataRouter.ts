export const DataRouter = {
  async fetchQuote(resolved: any) {
    return fetch(`/api/quote?symbol=${resolved.providerSymbol}`).then(r => r.json());
  },

  async fetchCandles(resolved: any) {
    return fetch(`/api/candles?symbol=${resolved.providerSymbol}`).then(r => r.json());
  },
};
