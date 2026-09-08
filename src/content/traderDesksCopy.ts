import type { TraderDeskId } from '../lib/traderDesks';

export const DESK_DISCLAIMER =
  'Educational market structure and data visualization only. ClearPath does not evaluate, alter, or advise on financial decisions.';

export type DeskFaq = { question: string; answer: string };

export type DeskSeoCopy = {
  title: string;
  description: string;
  h1: string;
  lead: string;
  keywords: string;
  faqs: DeskFaq[];
};

export const DESK_INDEX_SEO = {
  title: 'Trader Desks | ClearPathTrader',
  description:
    'Four ClearPath Trader desks for Institutional, Fundamental, Retail, and Neurodivergent traders. Chart-first educational terminals — not a brokerage.',
  h1: 'ClearPath Trader desks',
  keywords:
    'ClearPath Trader desks, Institutional Trader, Fundamental Trader, Retail Trader, Neurodivergent Trader, market intelligence terminal',
} as const;

export const DESK_SEO: Record<TraderDeskId, DeskSeoCopy> = {
  institutional: {
    title: 'Institutional Trader Desk | ClearPathTrader',
    description:
      'Institutional trader desk: chart-first command center with flow, liquidity, options, macro, and news. ClearPath Trader analytics only — not a brokerage.',
    h1: 'Institutional Trader Desk',
    lead: 'Market command center: global context, flow, liquidity, cross-asset, macro, and news around a multi-chart workspace. Study tools only — not execution or advice.',
    keywords:
      'Institutional Trader, institutional trading desk, market intelligence terminal, flow liquidity options macro, ClearPath Trader, not a brokerage',
    faqs: [
      {
        question: 'What is the ClearPath Institutional Trader desk?',
        answer:
          'An educational market-intelligence workstation at /desk/institutional: multi-chart workspace, flow, liquidity, time and sales, volatility, options, correlation, macro, calendar, news, positioning, earnings, and risk. Information-first — no order tickets.',
      },
      {
        question: 'Is the Institutional Trader desk a brokerage?',
        answer:
          'No. ClearPath Trader is analytics and education only. The Institutional desk does not accept deposits, route orders, or give investment advice.',
      },
    ],
  },
  fundamental: {
    title: 'Fundamental Trader Desk | ClearPathTrader',
    description:
      'Fundamental trader desk: statements, earnings, valuation, peers, filings, and FRED macro around the research chart. Analysis only — not investment advice.',
    h1: 'Fundamental Trader Desk',
    lead: 'Equity-research workstation: company, business model, revenue, profitability, cash flow, balance sheet, capital allocation, valuation, earnings, peers, geography, macro, filings, and news. Research only — no trade execution.',
    keywords:
      'Fundamental Trader, fundamental analysis desk, earnings valuation, financial statements, FRED macro, ClearPath Trader',
    faqs: [
      {
        question: 'What is the ClearPath Fundamental Trader desk?',
        answer:
          'A research workstation at /desk/fundamental: company search, financial statements, earnings, valuation, peers, industry, FRED macro, filings, and notes. Educational analysis only — not a brokerage.',
      },
      {
        question: 'Does the Fundamental Trader desk give buy or sell ratings?',
        answer:
          'No. Missing vendor cells stay blank (DATA UNAVAILABLE). ClearPath does not invent valuations, COT, or timed event rows, and does not issue buy/sell advice.',
      },
    ],
  },
  retail: {
    title: 'Retail Trader Desk | ClearPathTrader',
    description:
      'Retail trader desk: large chart, watchlist, news, economic wire, and plain-English education. ClearPath Trader analytics only — not a brokerage.',
    h1: 'Retail Trader Desk',
    lead: 'Everyday retail trader workstation: markets, chart, price, volume, context, news, calendar, and education in one screen. Information only — not execution or advice.',
    keywords:
      'Retail Trader, retail trading desk, beginner trading charts, economic wire, ClearPath Trader, not a brokerage',
    faqs: [
      {
        question: 'What is the ClearPath Retail Trader desk?',
        answer:
          'A chart-first educational workstation at /desk/retail: large chart, watchlist, snapshot, news, economic wire, alerts, and education. News and calendar start in the Held file so candles stay readable.',
      },
      {
        question: 'Can I place trades from the Retail Trader desk?',
        answer:
          'No. ClearPath Trader is not a brokerage. The Retail desk visualizes markets and teaching copy only — it does not execute orders or manage accounts.',
      },
    ],
  },
  neurodivergent: {
    title: 'Neurodivergent Trader Desk | ClearPathTrader',
    description:
      'Neurodivergent trader desk with calm-focus, ADHD, autism-predictable, and low-stim profiles around a large chart. Education terminal — not a brokerage.',
    h1: 'Neurodivergent Trader Desk',
    lead: 'Built for different minds. Sensory profiles change the look; the market data stays the same. Calm retail + crypto workstation — information only.',
    keywords:
      'Neurodivergent Trader, ADHD trading UI, autism-friendly charts, accessible trading desk, calm focus, ClearPath Trader',
    faqs: [
      {
        question: 'What is the ClearPath Neurodivergent Trader desk?',
        answer:
          'A calm chart-first workstation at /desk/neurodivergent with pre-built sensory UI profiles (calm focus, ADHD, autism-predictable, low-stim, and more). Profiles change look, not market data. The full UI catalog is also at /ui.',
      },
      {
        question: 'Is the Neurodivergent Trader desk a different data feed?',
        answer:
          'No. The same educational market data is shown with a quieter interface. ClearPath is analytics and education — not a brokerage and not investment advice.',
      },
    ],
  },
};
