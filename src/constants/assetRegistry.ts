/**
 * ClearPath curated asset universe for Venture (70+ markets).
 * Source of truth for provider symbols, latency class, and chart/search enablement.
 * Encyclopedia SEO lists are NOT this registry — only enabled rows are live-chartable.
 */

export type AssetCategory =
  | "forex"
  | "crypto"
  | "metals"
  | "stocks"
  | "indices"
  | "commodities"
  | "bonds";

/** Honesty labels for TBI / neurodivergent users — never claim realtime when delayed. */
export type LatencyClass = "realtime" | "delayed" | "eod" | "derived";

export type RegistryAsset = {
  /** App symbol (no slash), e.g. EURUSD, BTCUSD, AAPL */
  symbol: string;
  /** Twelve Data request symbol */
  providerSymbol: string;
  display: string;
  description: string;
  category: AssetCategory;
  latencyClass: LatencyClass;
  exchange?: string;
  base?: string;
  quote?: string;
  searchable: string[];
  /** Deck / search / chart picker */
  enabled: boolean;
  /** Prefer in MarketTicker (still capped ≤12) */
  tickerPreferred?: boolean;
  /** Must pass dual smoke before Sunday expand */
  deckCritical?: boolean;
};

function fx(
  symbol: string,
  display: string,
  description: string,
  extras: Partial<RegistryAsset> = {}
): RegistryAsset {
  const base = symbol.slice(0, 3);
  const quote = symbol.slice(3);
  return {
    symbol,
    providerSymbol: `${base}/${quote}`,
    display,
    description,
    category: "forex",
    latencyClass: "realtime",
    base,
    quote,
    searchable: [symbol.toLowerCase(), display.toLowerCase(), "forex"],
    enabled: true,
    ...extras,
  };
}

/** Curated ClearPath 70 — Venture-safe; no unmapped futures bangs; no ASX equities without license. */
export const ASSET_REGISTRY: RegistryAsset[] = [
  // --- FX majors ---
  fx("EURUSD", "EUR/USD", "Euro vs US Dollar", { tickerPreferred: true, deckCritical: true }),
  fx("GBPUSD", "GBP/USD", "British Pound vs US Dollar", { tickerPreferred: true, deckCritical: true, searchable: ["gbpusd", "gbp/usd", "cable", "forex"] }),
  fx("USDJPY", "USD/JPY", "US Dollar vs Japanese Yen", { tickerPreferred: true, deckCritical: true }),
  fx("AUDUSD", "AUD/USD", "Australian Dollar vs US Dollar", { tickerPreferred: true, deckCritical: true, searchable: ["audusd", "aud/usd", "aussie", "forex"] }),
  fx("USDCAD", "USD/CAD", "US Dollar vs Canadian Dollar", { deckCritical: true }),
  fx("NZDUSD", "NZD/USD", "New Zealand Dollar vs US Dollar", { deckCritical: true }),
  fx("USDCHF", "USD/CHF", "US Dollar vs Swiss Franc"),

  // --- FX crosses (AUD / GBP / EUR / JPY) ---
  fx("EURGBP", "EUR/GBP", "Euro vs British Pound"),
  fx("EURJPY", "EUR/JPY", "Euro vs Japanese Yen"),
  fx("GBPJPY", "GBP/JPY", "British Pound vs Japanese Yen", { searchable: ["gbpjpy", "gbp/jpy", "dragon", "forex"] }),
  fx("AUDJPY", "AUD/JPY", "Australian Dollar vs Japanese Yen"),
  fx("AUDCAD", "AUD/CAD", "Australian Dollar vs Canadian Dollar"),
  fx("AUDNZD", "AUD/NZD", "Australian Dollar vs New Zealand Dollar"),
  fx("AUDCHF", "AUD/CHF", "Australian Dollar vs Swiss Franc"),
  fx("EURAUD", "EUR/AUD", "Euro vs Australian Dollar"),
  fx("EURCAD", "EUR/CAD", "Euro vs Canadian Dollar"),
  fx("EURCHF", "EUR/CHF", "Euro vs Swiss Franc"),
  fx("EURNZD", "EUR/NZD", "Euro vs New Zealand Dollar"),
  fx("GBPAUD", "GBP/AUD", "British Pound vs Australian Dollar"),
  fx("GBPCAD", "GBP/CAD", "British Pound vs Canadian Dollar"),
  fx("GBPCHF", "GBP/CHF", "British Pound vs Swiss Franc"),
  fx("GBPNZD", "GBP/NZD", "British Pound vs New Zealand Dollar"),
  fx("CADJPY", "CAD/JPY", "Canadian Dollar vs Japanese Yen"),
  fx("CHFJPY", "CHF/JPY", "Swiss Franc vs Japanese Yen"),
  fx("NZDJPY", "NZD/JPY", "New Zealand Dollar vs Japanese Yen"),
  fx("CADCHF", "CAD/CHF", "Canadian Dollar vs Swiss Franc"),
  fx("NZDCAD", "NZD/CAD", "New Zealand Dollar vs Canadian Dollar"),
  fx("NZDCHF", "NZD/CHF", "New Zealand Dollar vs Swiss Franc"),

  // --- Metals ---
  {
    symbol: "XAUUSD",
    providerSymbol: "XAU/USD",
    display: "XAU/USD",
    description: "Gold Spot",
    category: "metals",
    latencyClass: "realtime",
    base: "XAU",
    quote: "USD",
    searchable: ["xauusd", "xau/usd", "gold", "metals"],
    enabled: true,
    tickerPreferred: true,
    deckCritical: true,
  },
  {
    symbol: "XAGUSD",
    providerSymbol: "XAG/USD",
    display: "XAG/USD",
    description: "Silver Spot",
    category: "metals",
    latencyClass: "realtime",
    base: "XAG",
    quote: "USD",
    searchable: ["xagusd", "xag/usd", "silver", "metals"],
    enabled: true,
    deckCritical: true,
  },

  // --- Crypto ---
  {
    symbol: "BTCUSD",
    providerSymbol: "BTC/USD",
    display: "BTC/USD",
    description: "Bitcoin vs US Dollar",
    category: "crypto",
    latencyClass: "realtime",
    base: "BTC",
    quote: "USD",
    searchable: ["btcusd", "btc/usd", "bitcoin", "crypto"],
    enabled: true,
    tickerPreferred: true,
    deckCritical: true,
  },
  {
    symbol: "BTCUSDT",
    providerSymbol: "BTC/USDT",
    display: "BTC/USDT",
    description: "Bitcoin vs Tether",
    category: "crypto",
    latencyClass: "realtime",
    base: "BTC",
    quote: "USDT",
    searchable: ["btcusdt", "btc/usdt", "bitcoin", "crypto"],
    enabled: true,
  },
  {
    symbol: "ETHUSD",
    providerSymbol: "ETH/USD",
    display: "ETH/USD",
    description: "Ethereum vs US Dollar",
    category: "crypto",
    latencyClass: "realtime",
    base: "ETH",
    quote: "USD",
    searchable: ["ethusd", "eth/usd", "ethereum", "crypto"],
    enabled: true,
    deckCritical: true,
  },
  {
    symbol: "ETHUSDT",
    providerSymbol: "ETH/USDT",
    display: "ETH/USDT",
    description: "Ethereum vs Tether",
    category: "crypto",
    latencyClass: "realtime",
    base: "ETH",
    quote: "USDT",
    searchable: ["ethusdt", "eth/usdt", "ethereum", "crypto"],
    enabled: true,
  },
  {
    symbol: "SOLUSD",
    providerSymbol: "SOL/USD",
    display: "SOL/USD",
    description: "Solana vs US Dollar",
    category: "crypto",
    latencyClass: "realtime",
    base: "SOL",
    quote: "USD",
    searchable: ["solusd", "sol/usd", "solana", "crypto"],
    enabled: true,
    deckCritical: true,
  },
  {
    symbol: "ADAUSD",
    providerSymbol: "ADA/USD",
    display: "ADA/USD",
    description: "Cardano vs US Dollar",
    category: "crypto",
    latencyClass: "realtime",
    base: "ADA",
    quote: "USD",
    searchable: ["adausd", "ada/usd", "cardano", "crypto"],
    enabled: true,
  },
  {
    symbol: "XRPUSD",
    providerSymbol: "XRP/USD",
    display: "XRP/USD",
    description: "XRP vs US Dollar",
    category: "crypto",
    latencyClass: "realtime",
    base: "XRP",
    quote: "USD",
    searchable: ["xrpusd", "xrp/usd", "ripple", "crypto"],
    enabled: true,
  },
  {
    symbol: "DOGEUSD",
    providerSymbol: "DOGE/USD",
    display: "DOGE/USD",
    description: "Dogecoin vs US Dollar",
    category: "crypto",
    latencyClass: "realtime",
    base: "DOGE",
    quote: "USD",
    searchable: ["dogeusd", "doge/usd", "dogecoin", "crypto"],
    enabled: true,
  },
  {
    symbol: "LINKUSD",
    providerSymbol: "LINK/USD",
    display: "LINK/USD",
    description: "Chainlink vs US Dollar",
    category: "crypto",
    latencyClass: "realtime",
    base: "LINK",
    quote: "USD",
    searchable: ["linkusd", "link/usd", "chainlink", "crypto"],
    enabled: true,
  },
  {
    symbol: "AVAXUSD",
    providerSymbol: "AVAX/USD",
    display: "AVAX/USD",
    description: "Avalanche vs US Dollar",
    category: "crypto",
    latencyClass: "realtime",
    base: "AVAX",
    quote: "USD",
    searchable: ["avaxusd", "avax/usd", "avalanche", "crypto"],
    enabled: true,
  },
  {
    symbol: "DOTUSD",
    providerSymbol: "DOT/USD",
    display: "DOT/USD",
    description: "Polkadot vs US Dollar",
    category: "crypto",
    latencyClass: "realtime",
    base: "DOT",
    quote: "USD",
    searchable: ["dotusd", "dot/usd", "polkadot", "crypto"],
    enabled: true,
  },
  {
    symbol: "MATICUSD",
    providerSymbol: "MATIC/USD",
    display: "MATIC/USD",
    description: "Polygon vs US Dollar",
    category: "crypto",
    latencyClass: "realtime",
    base: "MATIC",
    quote: "USD",
    searchable: ["maticusd", "matic/usd", "polygon", "crypto"],
    enabled: true,
  },

  // --- US stocks (Venture realtime) ---
  {
    symbol: "AAPL",
    providerSymbol: "AAPL",
    display: "AAPL",
    description: "Apple Inc.",
    category: "stocks",
    latencyClass: "realtime",
    exchange: "NASDAQ",
    searchable: ["aapl", "apple", "stocks"],
    enabled: true,
    deckCritical: true,
  },
  {
    symbol: "MSFT",
    providerSymbol: "MSFT",
    display: "MSFT",
    description: "Microsoft Corp.",
    category: "stocks",
    latencyClass: "realtime",
    exchange: "NASDAQ",
    searchable: ["msft", "microsoft", "stocks"],
    enabled: true,
  },
  {
    symbol: "NVDA",
    providerSymbol: "NVDA",
    display: "NVDA",
    description: "NVIDIA Corp.",
    category: "stocks",
    latencyClass: "realtime",
    exchange: "NASDAQ",
    searchable: ["nvda", "nvidia", "stocks"],
    enabled: true,
  },
  {
    symbol: "TSLA",
    providerSymbol: "TSLA",
    display: "TSLA",
    description: "Tesla Inc.",
    category: "stocks",
    latencyClass: "realtime",
    exchange: "NASDAQ",
    searchable: ["tsla", "tesla", "stocks"],
    enabled: true,
  },
  {
    symbol: "AMZN",
    providerSymbol: "AMZN",
    display: "AMZN",
    description: "Amazon.com Inc.",
    category: "stocks",
    latencyClass: "realtime",
    exchange: "NASDAQ",
    searchable: ["amzn", "amazon", "stocks"],
    enabled: true,
  },
  {
    symbol: "GOOGL",
    providerSymbol: "GOOGL",
    display: "GOOGL",
    description: "Alphabet Inc. Class A",
    category: "stocks",
    latencyClass: "realtime",
    exchange: "NASDAQ",
    searchable: ["googl", "google", "alphabet", "stocks"],
    enabled: true,
  },
  {
    symbol: "META",
    providerSymbol: "META",
    display: "META",
    description: "Meta Platforms Inc.",
    category: "stocks",
    latencyClass: "realtime",
    exchange: "NASDAQ",
    searchable: ["meta", "facebook", "stocks"],
    enabled: true,
  },
  {
    symbol: "JPM",
    providerSymbol: "JPM",
    display: "JPM",
    description: "JPMorgan Chase & Co.",
    category: "stocks",
    latencyClass: "realtime",
    exchange: "NYSE",
    searchable: ["jpm", "jpmorgan", "stocks"],
    enabled: true,
  },

  // --- EU stocks (Venture realtime; exchange explicit) ---
  {
    symbol: "SAP",
    providerSymbol: "SAP",
    display: "SAP",
    description: "SAP SE",
    category: "stocks",
    latencyClass: "realtime",
    exchange: "XETR",
    searchable: ["sap", "europe", "stocks"],
    enabled: true,
  },
  {
    symbol: "ASML",
    providerSymbol: "ASML",
    display: "ASML",
    description: "ASML Holding NV",
    category: "stocks",
    latencyClass: "realtime",
    exchange: "XAMS",
    searchable: ["asml", "europe", "stocks"],
    enabled: true,
  },

  // --- Indices ---
  {
    symbol: "SPX",
    providerSymbol: "SPX",
    display: "SPX",
    description: "S&P 500 Index",
    category: "indices",
    latencyClass: "realtime",
    searchable: ["spx", "s&p", "sp500", "index"],
    enabled: true,
    deckCritical: true,
  },
  {
    symbol: "NDX",
    providerSymbol: "NDX",
    display: "NDX",
    description: "Nasdaq 100 Index",
    category: "indices",
    latencyClass: "realtime",
    searchable: ["ndx", "nasdaq", "nas100", "index"],
    enabled: true,
  },
  {
    symbol: "DJI",
    providerSymbol: "DJI",
    display: "DJI",
    description: "Dow Jones Industrial Average",
    category: "indices",
    latencyClass: "realtime",
    searchable: ["dji", "dow", "index"],
    enabled: true,
  },
  {
    symbol: "DXY",
    providerSymbol: "DX-Y.F",
    display: "DXY",
    description: "US Dollar Index (FX-basket derived)",
    category: "indices",
    latencyClass: "derived",
    searchable: ["dxy", "usdx", "dollar index"],
    enabled: true,
    tickerPreferred: true,
    deckCritical: true,
  },

  // --- Commodities ---
  {
    symbol: "WTI",
    providerSymbol: "WTI/USD",
    display: "WTI",
    description: "West Texas Intermediate Crude Oil",
    category: "commodities",
    latencyClass: "realtime",
    searchable: ["wti", "oil", "crude", "commodities"],
    enabled: true,
  },
  {
    symbol: "BRENT",
    providerSymbol: "BRN/USD",
    display: "BRENT",
    description: "Brent Crude Oil",
    category: "commodities",
    latencyClass: "realtime",
    searchable: ["brent", "oil", "commodities"],
    enabled: true,
  },
  {
    symbol: "NATGAS",
    providerSymbol: "NG/USD",
    display: "NATGAS",
    description: "Natural Gas",
    category: "commodities",
    latencyClass: "realtime",
    searchable: ["natgas", "natural gas", "gas", "commodities"],
    enabled: true,
  },
  {
    symbol: "COPPER",
    providerSymbol: "HG/USD",
    display: "COPPER",
    description: "Copper",
    category: "commodities",
    latencyClass: "realtime",
    searchable: ["copper", "commodities"],
    enabled: true,
  },

  // --- Bonds / yields (often EOD-ish vs spot FX) ---
  {
    symbol: "US10Y",
    providerSymbol: "US10Y",
    display: "US10Y",
    description: "US 10-Year Treasury Yield",
    category: "bonds",
    latencyClass: "delayed",
    searchable: ["us10y", "10 year", "treasury", "yield", "bonds"],
    enabled: true,
  },
  {
    symbol: "US30Y",
    providerSymbol: "US30Y",
    display: "US30Y",
    description: "US 30-Year Treasury Yield",
    category: "bonds",
    latencyClass: "delayed",
    searchable: ["us30y", "30 year", "treasury", "yield", "bonds"],
    enabled: true,
  },

  // --- Extra liquid FX for Venture breadth ---
  fx("USDSEK", "USD/SEK", "US Dollar vs Swedish Krona"),
  fx("USDNOK", "USD/NOK", "US Dollar vs Norwegian Krone"),
  fx("USDSGD", "USD/SGD", "US Dollar vs Singapore Dollar"),
  fx("USDHKD", "USD/HKD", "US Dollar vs Hong Kong Dollar"),
  fx("USDMXN", "USD/MXN", "US Dollar vs Mexican Peso"),
  fx("USDZAR", "USD/ZAR", "US Dollar vs South African Rand"),
  fx("EURSEK", "EUR/SEK", "Euro vs Swedish Krona"),
  fx("EURNOK", "EUR/NOK", "Euro vs Norwegian Krone"),
];

const bySymbol = new Map<string, RegistryAsset>();
const byProvider = new Map<string, RegistryAsset>();

for (const asset of ASSET_REGISTRY) {
  bySymbol.set(asset.symbol.toUpperCase(), asset);
  byProvider.set(asset.providerSymbol.toUpperCase(), asset);
  if (asset.display.includes("/")) {
    bySymbol.set(asset.display.replace(/\//g, "").toUpperCase(), asset);
  }
}

export function normalizeAppSymbol(symbol: string): string {
  return symbol.trim().toUpperCase().replace(/\s+/g, "").replace(/\//g, "");
}

export function getRegistryAsset(symbol: string): RegistryAsset | undefined {
  const raw = symbol.trim().toUpperCase().replace(/\s+/g, "");
  if (!raw) return undefined;
  return bySymbol.get(raw.replace(/\//g, "")) || byProvider.get(raw) || bySymbol.get(raw);
}

export function getEnabledAssets(): RegistryAsset[] {
  return ASSET_REGISTRY.filter((a) => a.enabled);
}

/** Retail / search: match symbol, display, description, or searchable aliases. */
export function searchEnabledAssets(query: string, limit = 12): RegistryAsset[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const hits: RegistryAsset[] = [];
  for (const asset of ASSET_REGISTRY) {
    if (!asset.enabled) continue;
    const blob = [
      asset.symbol,
      asset.display,
      asset.description,
      asset.category,
      asset.exchange ?? "",
      ...(asset.searchable ?? []),
    ]
      .join(" ")
      .toLowerCase();
    if (blob.includes(q)) hits.push(asset);
    if (hits.length >= limit) break;
  }
  return hits;
}

export function getDeckCriticalAssets(): RegistryAsset[] {
  return ASSET_REGISTRY.filter((a) => a.enabled && a.deckCritical);
}

export function getTickerAssets(limit = 8): RegistryAsset[] {
  const preferred = ASSET_REGISTRY.filter((a) => a.enabled && a.tickerPreferred);
  const rest = ASSET_REGISTRY.filter((a) => a.enabled && !a.tickerPreferred);
  return [...preferred, ...rest].slice(0, Math.min(limit, 12));
}

export function resolveProviderSymbol(symbol: string): string | null {
  const asset = getRegistryAsset(symbol);
  return asset?.providerSymbol ?? null;
}

export function getLatencyClass(symbol: string): LatencyClass | null {
  return getRegistryAsset(symbol)?.latencyClass ?? null;
}

export const LATENCY_LABEL: Record<LatencyClass, string> = {
  realtime: "Realtime",
  delayed: "Delayed",
  eod: "End of day",
  derived: "Derived",
};

/** Count of enabled chartable symbols (target ~70). */
export const ENABLED_ASSET_COUNT = ASSET_REGISTRY.filter((a) => a.enabled).length;
