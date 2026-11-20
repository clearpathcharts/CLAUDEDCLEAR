export type AssetClass = "stocks" | "forex" | "crypto" | "commodities";

export type SymbolInfo = {
  symbol: string;
  name: string;
  assetClass: AssetClass;
  basePrice: number;
};

export type Candle = {
  t: number;
  o: number;
  h: number;
  l: number;
  c: number;
};

export const SYMBOLS: SymbolInfo[] = [
  { symbol: "AAPL", name: "Apple Inc.", assetClass: "stocks", basePrice: 228.4 },
  { symbol: "MSFT", name: "Microsoft Corp.", assetClass: "stocks", basePrice: 415.2 },
  { symbol: "NVDA", name: "NVIDIA Corp.", assetClass: "stocks", basePrice: 138.6 },
  { symbol: "EUR/USD", name: "Euro / US Dollar", assetClass: "forex", basePrice: 1.0842 },
  { symbol: "GBP/USD", name: "British Pound / US Dollar", assetClass: "forex", basePrice: 1.3125 },
  { symbol: "USD/JPY", name: "US Dollar / Japanese Yen", assetClass: "forex", basePrice: 149.85 },
  { symbol: "BTC/USD", name: "Bitcoin / US Dollar", assetClass: "crypto", basePrice: 97250 },
  { symbol: "ETH/USD", name: "Ethereum / US Dollar", assetClass: "crypto", basePrice: 3620 },
  { symbol: "XAU/USD", name: "Gold Spot", assetClass: "commodities", basePrice: 2685.4 },
  { symbol: "WTI", name: "WTI Crude Oil", assetClass: "commodities", basePrice: 72.15 },
  { symbol: "GC", name: "Gold Futures (mapped)", assetClass: "commodities", basePrice: 2688.1 },
  { symbol: "SPY", name: "S&P 500 ETF", assetClass: "stocks", basePrice: 582.3 },
];

function hashSeed(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed: number) {
  return () => {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function findSymbol(query: string): SymbolInfo | undefined {
  const q = query.trim().toUpperCase();
  return SYMBOLS.find(
    (s) => s.symbol.toUpperCase() === q || s.name.toUpperCase().includes(q),
  );
}

export function searchSymbols(query: string, limit = 8): SymbolInfo[] {
  const q = query.trim().toLowerCase();
  if (!q) return SYMBOLS.slice(0, limit);
  return SYMBOLS.filter(
    (s) =>
      s.symbol.toLowerCase().includes(q) ||
      s.name.toLowerCase().includes(q) ||
      s.assetClass.includes(q),
  ).slice(0, limit);
}

export function generateCandles(symbol: string, count = 80): Candle[] {
  const info = findSymbol(symbol) ?? SYMBOLS[0];
  const rand = mulberry32(hashSeed(info.symbol));
  const candles: Candle[] = [];
  let price = info.basePrice;
  const vol =
    info.assetClass === "forex"
      ? 0.0012
      : info.assetClass === "crypto"
        ? 0.018
        : info.assetClass === "commodities"
          ? 0.008
          : 0.012;
  const now = Date.now();
  const step = 15 * 60 * 1000;

  for (let i = count; i > 0; i--) {
    const drift = (rand() - 0.48) * vol * price;
    const open = price;
    const close = Math.max(price * 0.2, open + drift);
    const wick = Math.abs(drift) * (0.4 + rand());
    const high = Math.max(open, close) + wick * rand();
    const low = Math.min(open, close) - wick * rand();
    candles.push({
      t: now - i * step,
      o: open,
      h: high,
      l: Math.max(low, 0.01),
      c: close,
    });
    price = close;
  }
  return candles;
}

export function lastQuote(symbol: string) {
  const candles = generateCandles(symbol, 40);
  const last = candles[candles.length - 1];
  const prev = candles[candles.length - 2];
  const change = last.c - prev.c;
  const changePct = (change / prev.c) * 100;
  return {
    symbol: findSymbol(symbol)?.symbol ?? symbol,
    name: findSymbol(symbol)?.name ?? symbol,
    price: last.c,
    change,
    changePct,
    candles,
    source: "board-demo-paper" as const,
  };
}
