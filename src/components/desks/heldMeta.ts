import type { HeldMeta } from './deskHeldPanels';

export const INSTITUTIONAL_HELD_META: Record<string, HeldMeta> = {
  ribbon: { title: 'Global Markets', blurb: 'Index and commodity ribbon' },
  universe: { title: 'Market Universe', blurb: 'Asset list by sleeve' },
  flow: { title: 'Market Flow', blurb: 'Buy/sell split of bar volume' },
  liq: { title: 'Liquidity', blurb: 'Spread, bid/ask, POC' },
  tape: { title: 'Time & Sales', blurb: 'Reconstructed bar tape' },
  structure: { title: 'Market Structure', blurb: 'BOS, CHoCH, FVG, order blocks' },
  volume: { title: 'Volume Analytics', blurb: 'Volume profile bins' },
  vol: { title: 'Volatility', blurb: 'VIX, RV, ATR, percentile' },
  options: { title: 'Options Intelligence', blurb: 'Listed chain when a vendor exists' },
  corr: { title: 'Cross-Asset Correlation', blurb: 'Pearson of daily closes' },
  macro: { title: 'Macro Intelligence', blurb: 'FRED policy and inflation series' },
  news: { title: 'News Intelligence', blurb: 'Live wire headlines' },
  calendar: { title: 'Economic Calendar', blurb: 'Economic wire — not timed rows' },
  positioning: { title: 'Positioning', blurb: 'COT, float, institutional %' },
  risk: { title: 'Risk Environment', blurb: 'Beta, corr, drawdown, scenarios' },
  earnings: { title: 'Earnings', blurb: 'FMP surprises' },
};

export const FUNDAMENTAL_HELD_META: Record<string, HeldMeta> = {
  company: { title: 'Identity', blurb: 'Employees, revenue, earnings' },
  business: { title: 'Business model', blurb: 'Disclosed revenue mix' },
  valuation: { title: 'Market multiples', blurb: 'PE and related multiples' },
  revenue: { title: 'Revenue engine', blurb: 'Filed revenue series' },
  profitability: { title: 'Profitability', blurb: 'Margins and returns' },
  cashflow: { title: 'Cash flow', blurb: 'FCF and operating cash' },
  balancesheet: { title: 'Balance sheet', blurb: 'Debt, cash, leverage' },
  earnings: { title: 'Earnings', blurb: 'Estimate vs actual' },
  capital: { title: 'Capital allocation', blurb: 'Buybacks, dividends, capex' },
  industry: { title: 'Industry / peers', blurb: 'Peer multiples' },
  geo: { title: 'Geographic exposure', blurb: 'Filed geo mix' },
  macro: { title: 'Macro exposure', blurb: 'Rate and inflation mapping' },
  risk: { title: 'Risk factors', blurb: 'Filed / mapped risks' },
  filings: { title: 'Filings', blurb: '10-K / 10-Q / 8-K' },
  news: { title: 'Company news', blurb: 'Filtered live wire' },
  management: { title: 'Management', blurb: 'CEO and officers' },
};

export const RETAIL_HELD_META: Record<string, HeldMeta> = {
  ribbon: { title: 'Global Market Ribbon', blurb: 'Majors and index tape' },
  watchlist: { title: 'My Watchlist', blurb: 'Saved symbols' },
  scanner: { title: 'Pattern Scanner', blurb: 'Live pattern scan' },
  snapshot: { title: 'Market Snapshot', blurb: 'OHLC and session stats' },
  context: { title: 'Market Context', blurb: 'Session and structure context' },
  volume: { title: 'Volume / Price', blurb: 'Volume and price study' },
  movers: { title: 'Market Movers', blurb: 'Session movers' },
  news: { title: 'News', blurb: 'Live wire headlines' },
  calendar: { title: 'Economic Calendar', blurb: 'Economic wire' },
  alerts: { title: 'Alerts / Events', blurb: 'User-controlled alerts' },
  changed: { title: 'What Changed?', blurb: 'Since last view' },
  education: { title: 'Education', blurb: 'BOS, CHoCH, FVG glossary' },
  fundamental: { title: 'Fundamental Snapshot', blurb: 'Equity statement snapshot' },
  simulation: { title: 'Simulation Lab', blurb: 'Hypothetical practice only' },
};

export const NEURO_HELD_META: Record<string, HeldMeta> = {
  profiles: { title: 'Sensory profiles', blurb: 'Calm / ADHD / autism layouts' },
  ribbon: { title: 'Market Ribbon', blurb: 'Crypto and majors tape' },
  watchlist: { title: 'Watchlist', blurb: 'Saved symbols' },
  snapshot: { title: 'Market Snapshot', blurb: 'OHLC session stats' },
  news: { title: 'News', blurb: 'Live wire headlines' },
  calendar: { title: 'Economic Wire', blurb: 'Economic headlines' },
  alerts: { title: 'Alerts', blurb: 'User-controlled alerts' },
  education: { title: 'Education', blurb: 'BOS, CHoCH, FVG glossary' },
  simulation: { title: 'Simulation Lab', blurb: 'Hypothetical practice only' },
};

/** First visit: park intel so the chart is the desk. Restore from the held file. */
export const INSTITUTIONAL_CHART_FIRST_HELD = Object.keys(INSTITUTIONAL_HELD_META).filter((id) => id !== 'ribbon');

export const RETAIL_CHART_FIRST_HELD = Object.keys(RETAIL_HELD_META).filter((id) => id !== 'ribbon');

export const NEURO_CHART_FIRST_HELD = Object.keys(NEURO_HELD_META).filter((id) => id !== 'ribbon');

export const FUNDAMENTAL_CHART_FIRST_HELD = Object.keys(FUNDAMENTAL_HELD_META).filter((id) => id !== 'company');
