import type { TraderDeskId } from '../lib/traderDesks';

export const DESK_DISCLAIMER =
  'Educational market structure and data visualization only. ClearPath does not evaluate, alter, or advise on financial decisions.';

export const DESK_SEO: Record<
  TraderDeskId,
  { title: string; description: string; h1: string; lead: string }
> = {
  institutional: {
    title: 'Institutional Trader Desk | ClearPathTrader',
    description:
      'Institutional market-intelligence terminal: global ribbon, market universe, multi-chart workspace, flow, liquidity, volatility, options, cross-asset correlation, macro, news, positioning, and risk. Analytics only — not a brokerage.',
    h1: 'Institutional Trader Desk',
    lead: 'Market command center: global context, flow, liquidity, cross-asset, macro, and news around a multi-chart workspace. Study tools only — not execution or advice.',
  },
  fundamental: {
    title: 'Fundamental Market Intelligence | ClearPathTrader',
    description:
      'Fundamental research workstation: financial statements, earnings, valuation, peers, industry, macro, filings, and risk. Educational analysis only — not a brokerage and not investment advice.',
    h1: 'Fundamental Market Intelligence',
    lead: 'Bento equity-research workstation: company, business model, revenue, profitability, cash flow, balance sheet, capital allocation, valuation, earnings, peers, geography, macro, filings, and news. Research only — no trade execution.',
  },
  retail: {
    title: 'Retail Market Workstation | ClearPathTrader',
    description:
      'Retail market cockpit: watchlist, chart, snapshot, volume, movers, news, economic wire, alerts, education, and simulation entry. Analytics only — not a brokerage.',
    h1: 'Retail Market',
    lead: 'Everyday retail trader workstation: markets, chart, price, volume, context, news, calendar, and education in one screen. Information only — not execution or advice.',
  },
  neurodivergent: {
    title: 'Neurodivergent Market Workstation | ClearPathTrader',
    description:
      'Neurodivergent retail + crypto cockpit with pre-built sensory UI profiles (calm focus, ADHD, autism-predictable, low-stim, and more): watchlist, chart, snapshot, news, alerts, and education. Analytics only — not a brokerage.',
    h1: 'Neurodivergent Market',
    lead: 'Built for different minds. Sensory profiles change the look; the market data stays the same. Calm retail + crypto workstation — information only.',
  },
};
