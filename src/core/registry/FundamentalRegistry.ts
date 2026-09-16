import { FundamentalCategory } from "./CategoryRegistry";

export interface FundamentalDefinition {
  id: string;
  name: string;
  abbr: string;
  category: FundamentalCategory;
  description: string;
  unit: string;
  sourceFile: string;
}

export const FundamentalRegistry: FundamentalDefinition[] = [
  {
    id: "gdp",
    name: "Gross Domestic Product (GDP)",
    abbr: "GDP",
    category: FundamentalCategory.Forex,
    description: "Annualized rate of economic growth and domestic product.",
    unit: "% Growth",
    sourceFile: "fundamentals/forex/GDP.ts"
  },
  {
    id: "cpi",
    name: "Consumer Price Index (CPI Inflation)",
    abbr: "CPI",
    category: FundamentalCategory.Forex,
    description: "Measure of price changes for consumer goods and core consumer products.",
    unit: "% YoY",
    sourceFile: "fundamentals/forex/CPI.ts"
  },
  {
    id: "rates",
    name: "Central Bank Base Interest Rates",
    abbr: "RATES",
    category: FundamentalCategory.Forex,
    description: "Overnight lending and discount rates established by major central banks (Fed, ECB, etc.).",
    unit: "% yield",
    sourceFile: "fundamentals/forex/InterestRates.ts"
  },
  {
    id: "pe",
    name: "Price-to-Earnings Ratio (P/E)",
    abbr: "PE",
    category: FundamentalCategory.Stocks,
    description: "Stock valuation metric comparing current share price to EPS metrics.",
    unit: "Multiple",
    sourceFile: "fundamentals/stocks/PE.ts"
  },
  {
    id: "eps",
    name: "Earnings Per Share (EPS)",
    abbr: "EPS",
    category: FundamentalCategory.Stocks,
    description: "Portion of a company's profit allocated to each outstanding share of common stock.",
    unit: "USD",
    sourceFile: "fundamentals/stocks/EPS.ts"
  },
  {
    id: "mcap",
    name: "Market Capitalization",
    abbr: "MCAP",
    category: FundamentalCategory.Stocks,
    description: "Total market value of a company's outstanding shares.",
    unit: "Billions USD",
    sourceFile: "fundamentals/stocks/MarketCap.ts"
  },
  {
    id: "oi",
    name: "Open Interest",
    abbr: "OI",
    category: FundamentalCategory.Crypto,
    description: "Aggregate value of active outstanding derivatives contracts (futures/options).",
    unit: "Contracts / USD",
    sourceFile: "fundamentals/crypto/OpenInterest.ts"
  },
  {
    id: "funding",
    name: "Perpetual Funding Rates",
    abbr: "FUNDING",
    category: FundamentalCategory.Crypto,
    description: "Periodic payments exchanged between long and short contract holders in crypto exchanges.",
    unit: "% per 8h",
    sourceFile: "fundamentals/crypto/FundingRate.ts"
  },
  {
    id: "hashrate",
    name: "Bitcoin Network Hash Rate",
    abbr: "HASHRATE",
    category: FundamentalCategory.Crypto,
    description: "Measures computational effort committed to securing blockchain networks.",
    unit: "EH/s",
    sourceFile: "fundamentals/crypto/HashRate.ts"
  },
  {
    id: "dxy",
    name: "US Dollar Index",
    abbr: "DXY",
    category: FundamentalCategory.Macro,
    description: "Relative strength indexing of USD against basket of major global reserve assets.",
    unit: "Index Points",
    sourceFile: "fundamentals/macro/DollarIndex.ts"
  }
];
