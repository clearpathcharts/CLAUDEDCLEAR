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
      'Dense institutional trader UI: live chart, watchlist, FX sessions, market structure (BOS, CHoCH, FVG, order blocks, liquidity sweeps), volume profile, and CVD. Analytics only — not a brokerage.',
    h1: 'Institutional Trader Desk',
    lead: 'Information-first terminal: live candles, session clock, structure readouts, and a compact news wire. Study tools only — not execution or advice.',
  },
  fundamental: {
    title: 'Fundamental Market Intelligence | ClearPathTrader',
    description:
      'Fundamental research workstation: financial statements, earnings, valuation, peers, industry, macro, filings, and risk. Educational analysis only — not a brokerage and not investment advice.',
    h1: 'Fundamental Market Intelligence',
    lead: 'Investigate the economic, corporate, and financial condition of an asset: business, financials, earnings, cash flow, valuation, peers, industry, macro, and risk. Research only — no trade execution.',
  },
  retail: {
    title: 'Retail Trader Desk | ClearPathTrader',
    description:
      'Retail trader UI that keeps the chart large and the language plain. Search a market, pick a timeframe, and open education when you want it.',
    h1: 'Retail Trader Desk',
    lead: 'One chart, one search box, plain-language study links. Made to be understandable.',
  },
  neurodivergent: {
    title: 'Neurodivergent Trader Desk | ClearPathTrader',
    description:
      'Neurodivergent trader UI with calm, predictable chrome and links into ClearPath accessible UI modes (calm focus, ADHD, autism-predictable, and more).',
    h1: 'Neurodivergent Trader Desk',
    lead: 'Built for different minds. Pick a sensory profile, keep motion low, and open the chart when you are ready.',
  },
};
