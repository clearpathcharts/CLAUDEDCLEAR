import stocks from "../../data/stocks/stocks.json";
import crypto from "../../data/crypto/assets.json";
import forex from "../../data/forex/pairs.json";

export function symbolLookup(symbol: string) {
  if (!symbol) return null;
  const query = symbol.toLowerCase().trim();

  const stock = stocks.find(
    (s) =>
      s.ticker.toLowerCase() === query ||
      s.company.toLowerCase().includes(query)
  );

  if (stock) {
    return {
      type: "stock",
      data: stock
    };
  }

  const coin = crypto.find(
    (c) =>
      c.symbol.toLowerCase() === query ||
      c.name.toLowerCase().includes(query)
  );

  if (coin) {
    return {
      type: "crypto",
      data: coin
    };
  }

  const pair = forex.find(
    (f) =>
      f.pair.toLowerCase() === query ||
      f.pair.toLowerCase().replace("/", "").includes(query)
  );

  if (pair) {
    return {
      type: "forex",
      data: pair
    };
  }

  return null;
}
