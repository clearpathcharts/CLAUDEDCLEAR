export type MarketCategory =
  | "forex"
  | "crypto"
  | "metals"
  | "stocks"
  | "indices"
  | "futures"
  | "bonds"
  | "commodities";

export type MarketItem = {
  symbol: string;
  display: string;
  description: string;
  category: MarketCategory;
  base?: string;
  quote?: string;
  searchable: string[];
};

export const marketCatalog: MarketItem[] = [
  // FOREX
  {
    symbol: "EURUSD",
    display: "EUR/USD",
    description: "Euro vs US Dollar",
    category: "forex",
    base: "EUR",
    quote: "USD",
    searchable: ["eurusd", "eur/usd", "euro dollar", "euro vs usd", "forex"],
  },
  {
    symbol: "GBPUSD",
    display: "GBP/USD",
    description: "British Pound vs US Dollar",
    category: "forex",
    base: "GBP",
    quote: "USD",
    searchable: ["gbpusd", "gbp/usd", "pound dollar", "cable", "forex"],
  },
  {
    symbol: "USDJPY",
    display: "USD/JPY",
    description: "US Dollar vs Japanese Yen",
    category: "forex",
    base: "USD",
    quote: "JPY",
    searchable: ["usdjpy", "usd/jpy", "dollar yen", "yen", "forex"],
  },
  {
    symbol: "USDCHF",
    display: "USD/CHF",
    description: "US Dollar vs Swiss Franc",
    category: "forex",
    base: "USD",
    quote: "CHF",
    searchable: ["usdchf", "usd/chf", "dollar franc", "swissy", "forex"],
  },
  {
    symbol: "USDCAD",
    display: "USD/CAD",
    description: "US Dollar vs Canadian Dollar",
    category: "forex",
    base: "USD",
    quote: "CAD",
    searchable: ["usdcad", "usd/cad", "dollar cad", "loonie", "forex"],
  },
  {
    symbol: "AUDUSD",
    display: "AUD/USD",
    description: "Australian Dollar vs US Dollar",
    category: "forex",
    base: "AUD",
    quote: "USD",
    searchable: ["audusd", "aud/usd", "aussie", "australian dollar", "forex"],
  },
  {
    symbol: "NZDUSD",
    display: "NZD/USD",
    description: "New Zealand Dollar vs US Dollar",
    category: "forex",
    base: "NZD",
    quote: "USD",
    searchable: ["nzdusd", "nzd/usd", "kiwi", "new zealand dollar", "forex"],
  },
  {
    symbol: "EURJPY",
    display: "EUR/JPY",
    description: "Euro vs Japanese Yen",
    category: "forex",
    base: "EUR",
    quote: "JPY",
    searchable: ["eurjpy", "eur/jpy", "euro yen", "forex"],
  },
  {
    symbol: "GBPJPY",
    display: "GBP/JPY",
    description: "British Pound vs Japanese Yen",
    category: "forex",
    base: "GBP",
    quote: "JPY",
    searchable: ["gbpjpy", "gbp/jpy", "pound yen", "dragon", "forex"],
  },
  {
    symbol: "EURGBP",
    display: "EUR/GBP",
    description: "Euro vs British Pound",
    category: "forex",
    base: "EUR",
    quote: "GBP",
    searchable: ["eurgbp", "eur/gbp", "euro pound", "forex"],
  },

  // METALS
  {
    symbol: "XAUUSD",
    display: "XAU/USD",
    description: "Gold Spot",
    category: "metals",
    base: "XAU",
    quote: "USD",
    searchable: ["xauusd", "xau/usd", "gold", "gold spot", "metals"],
  },
  {
    symbol: "XAGUSD",
    display: "XAG/USD",
    description: "Silver Spot",
    category: "metals",
    base: "XAG",
    quote: "USD",
    searchable: ["xagusd", "xag/usd", "silver", "silver spot", "metals"],
  },

  // CRYPTO
  {
    symbol: "BTCUSD",
    display: "BTC/USD",
    description: "Bitcoin vs US Dollar",
    category: "crypto",
    base: "BTC",
    quote: "USD",
    searchable: ["btcusd", "btc/usd", "bitcoin", "crypto"],
  },
  {
    symbol: "BTCUSDT",
    display: "BTC/USDT",
    description: "Bitcoin vs Tether",
    category: "crypto",
    base: "BTC",
    quote: "USDT",
    searchable: ["btcusdt", "btc/usdt", "bitcoin tether", "crypto"],
  },
  {
    symbol: "ETHUSD",
    display: "ETH/USD",
    description: "Ethereum vs US Dollar",
    category: "crypto",
    base: "ETH",
    quote: "USD",
    searchable: ["ethusd", "eth/usd", "ethereum", "crypto"],
  },
  {
    symbol: "SOLUSD",
    display: "SOL/USD",
    description: "Solana vs US Dollar",
    category: "crypto",
    base: "SOL",
    quote: "USD",
    searchable: ["solusd", "sol/usd", "solana", "crypto"],
  },

  // STOCKS
  {
    symbol: "AAPL",
    display: "AAPL",
    description: "Apple Inc.",
    category: "stocks",
    searchable: ["aapl", "apple", "stocks"],
  },
  {
    symbol: "MSFT",
    display: "MSFT",
    description: "Microsoft Corp.",
    category: "stocks",
    searchable: ["msft", "microsoft", "stocks"],
  },
  {
    symbol: "NVDA",
    display: "NVDA",
    description: "NVIDIA Corp.",
    category: "stocks",
    searchable: ["nvda", "nvidia", "stocks"],
  },
  {
    symbol: "TSLA",
    display: "TSLA",
    description: "Tesla Inc.",
    category: "stocks",
    searchable: ["tsla", "tesla", "stocks"],
  },

  // INDICES
  {
    symbol: "SPX",
    display: "SPX",
    description: "S&P 500 Index",
    category: "indices",
    searchable: ["spx", "s&p", "sp500", "index", "indices"],
  },
  {
    symbol: "NDX",
    display: "NDX",
    description: "Nasdaq 100 Index",
    category: "indices",
    searchable: ["ndx", "nasdaq", "nas100", "index", "indices"],
  },
  {
    symbol: "DJI",
    display: "DJI",
    description: "Dow Jones Industrial Average",
    category: "indices",
    searchable: ["dji", "dow", "dow jones", "index", "indices"],
  },

  // FUTURES
  {
    symbol: "ES1!",
    display: "ES1!",
    description: "E-mini S&P 500 Futures",
    category: "futures",
    searchable: ["es", "sp futures", "emini", "futures"],
  },
  {
    symbol: "NQ1!",
    display: "NQ1!",
    description: "E-mini Nasdaq Futures",
    category: "futures",
    searchable: ["nq", "nasdaq futures", "emini", "futures"],
  },
  {
    symbol: "CL1!",
    display: "CL1!",
    description: "Crude Oil Futures",
    category: "futures",
    searchable: ["cl", "crude oil futures", "oil", "futures"],
  },
  {
    symbol: "GC1!",
    display: "GC1!",
    description: "Gold Futures",
    category: "futures",
    searchable: ["gc", "gold futures", "futures"],
  },

  // BONDS
  {
    symbol: "US10Y",
    display: "US10Y",
    description: "US 10-Year Treasury Yield",
    category: "bonds",
    searchable: ["us10y", "10 year", "treasury", "yield", "bonds"],
  },
  {
    symbol: "US30Y",
    display: "US30Y",
    description: "US 30-Year Treasury Yield",
    category: "bonds",
    searchable: ["us30y", "30 year", "treasury", "yield", "bonds"],
  },

  // COMMODITIES
  {
    symbol: "WTI",
    display: "WTI",
    description: "West Texas Intermediate Crude Oil",
    category: "commodities",
    searchable: ["wti", "oil", "crude", "commodities"],
  },
  {
    symbol: "BRENT",
    display: "BRENT",
    description: "Brent Crude Oil",
    category: "commodities",
    searchable: ["brent", "oil", "commodities"],
  },
  {
    symbol: "NATGAS",
    display: "NATGAS",
    description: "Natural Gas",
    category: "commodities",
    searchable: ["natgas", "natural gas", "gas", "commodities"],
  },
];
