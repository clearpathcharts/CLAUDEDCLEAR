// /src/lib/marketEngine.ts

import stocks from "../../data/stocks/stocks.json";
import crypto from "../../data/crypto/assets.json";
import forex from "../../data/forex/pairs.json";
import commodities from "../../data/commodities/commodities.json";

export const marketEngine = {

  // =====================================================
  // SEARCH EVERYTHING
  // =====================================================

  search(query: string) {
    const q = query.toLowerCase().trim();
    if (!q) {
      return {
        stocks: [],
        crypto: [],
        forex: [],
        commodities: []
      };
    }

    const stockResults = stocks.filter((s: any) =>
      s.company.toLowerCase().includes(q) ||
      s.ticker.toLowerCase().includes(q)
    );

    const cryptoResults = crypto.filter((c: any) =>
      c.name.toLowerCase().includes(q) ||
      c.symbol.toLowerCase().includes(q)
    );

    const forexResults = forex.filter((f: any) =>
      f.pair.toLowerCase().includes(q) ||
      f.pair.toLowerCase().replace("/", "").includes(q)
    );

    const commodityResults = commodities.filter((c: any) =>
      c.name.toLowerCase().includes(q) ||
      c.symbol.toLowerCase().includes(q)
    );

    return {
      stocks: stockResults,
      crypto: cryptoResults,
      forex: forexResults,
      commodities: commodityResults
    };
  },

  // =====================================================
  // STOCK
  // =====================================================

  getStock(symbol: string) {
    if (!symbol) return undefined;
    const sNorm = symbol.toLowerCase().trim();
    return stocks.find(
      (s: any) =>
        s.ticker.toLowerCase() === sNorm
    );
  },

  // =====================================================
  // CRYPTO
  // =====================================================

  getCrypto(symbol: string) {
    if (!symbol) return undefined;
    const cNorm = symbol.toLowerCase().trim();
    return crypto.find(
      (c: any) =>
        c.symbol.toLowerCase() === cNorm ||
        c.name.toLowerCase() === cNorm
    );
  },

  // =====================================================
  // FOREX
  // =====================================================

  getForex(pair: string) {
    if (!pair) return undefined;
    const pNorm = pair.toLowerCase().trim().replace("/", "").replace("-", "");
    return forex.find(
      (f: any) =>
        f.pair.toLowerCase().replace("/", "") === pNorm
    );
  },

  // =====================================================
  // COMMODITIES
  // =====================================================

  getCommodity(symbol: string) {
    if (!symbol) return undefined;
    const cNorm = symbol.toLowerCase().trim();
    return commodities.find(
      (c: any) =>
        c.symbol.toLowerCase() === cNorm ||
        c.name.toLowerCase() === cNorm
    );
  }

};
