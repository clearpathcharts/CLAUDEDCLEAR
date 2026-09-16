export const IndicatorCategory = {
  Trend: "Trend",
  Momentum: "Momentum",
  Volatility: "Volatility",
  Volume: "Volume",
  Breadth: "Breadth",
  Cycles: "Cycles"
} as const;
export type IndicatorCategory = typeof IndicatorCategory[keyof typeof IndicatorCategory];

export const InstitutionalCategory = {
  MarketStructure: "Market Structure",
  Liquidity: "Liquidity",
  OrderFlow: "Order Flow",
  SmartMoney: "Smart Money",
  Profile: "Profile"
} as const;
export type InstitutionalCategory = typeof InstitutionalCategory[keyof typeof InstitutionalCategory];

export const FundamentalCategory = {
  Forex: "Forex",
  Stocks: "Stocks",
  Crypto: "Crypto",
  Macro: "Macro"
} as const;
export type FundamentalCategory = typeof FundamentalCategory[keyof typeof FundamentalCategory];
