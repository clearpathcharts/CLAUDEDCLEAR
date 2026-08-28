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
    title: 'Retail Market Workspace | ClearPathTrader',
    description:
      'Retail market workspace: watchlist, chart, price snapshot, market context, news, and education. Analytics and education only — not a brokerage.',
    h1: 'Retail Market',
    lead: 'See the market clearly. Chart first; education is a supporting module, not the whole desk.',
  },
  neurodivergent: {
    title: 'Neurodivergent Trader Desk | ClearPathTrader',
    description:
      'Neurodivergent trader desk: pick a sensory profile and keep the trading chart on this desk (calm focus, ADHD, autism-predictable, and more). Information only — no trade execution.',
    h1: 'Neurodivergent Trader Desk',
    lead: 'Built for different minds. Pick a sensory profile; the trading chart stays on this desk with that look.',
  },
};
