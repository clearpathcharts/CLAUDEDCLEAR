// ==========================================
// SERVER-RENDERED CONTENT DATA (GUIDES + GLOSSARY)
// Shared by the static content page renderer and the SEO metadata engine.
// ==========================================

export interface GuideRecord {
  id: string;
  title: string;
  summary: string;
  content: string;
  keywords: string[];
  publishDate: string;
  updatedDate: string;
  faqs: { question: string; answer: string }[];
}

export const GUIDE_RECORDS: Record<string, GuideRecord> = {
  'macro-spreads': {
    id: 'macro-spreads',
    title: 'Macro Spreads: Reading Yield Curves & Credit Spreads',
    summary:
      'A practical guide to macro spreads — the yield curve, credit spreads, and cross-market differentials — and what widening or narrowing spreads signal about growth, risk appetite, and liquidity.',
    keywords: ['yield curve', 'credit spreads', '2s10s', 'inversion', 'high yield spread', 'TED spread', 'macro trading'],
    publishDate: '2026-06-07',
    updatedDate: '2026-07-19',
    content: `### What a "spread" actually measures

A macro spread is the difference between two related interest rates or yields. Because both legs respond to the same underlying economy, the *difference* between them isolates a single signal — growth expectations, default risk, or funding stress — that neither rate shows cleanly on its own.

#### 1. The yield curve (term spreads)

The most watched spread on Earth is the term spread between long-dated and short-dated government bonds, usually quoted as the 10-year yield minus the 2-year yield ("2s10s").

*   **Steep curve (wide positive spread):** Markets expect growth and higher future rates. Banks borrow short and lend long profitably, so credit creation expands.
*   **Flat curve:** The market expects the central bank to hold policy tight relative to future growth. Late-cycle behavior.
*   **Inverted curve (negative spread):** Short rates exceed long rates. Historically the single most reliable recession warning, because it means policy is restrictive relative to long-run growth expectations.

#### 2. Credit spreads

Credit spreads measure the extra yield investors demand to hold corporate debt instead of government debt of the same maturity.

*   **Investment-grade (IG) spread:** Compensation for holding high-quality corporate bonds. Normally stable; widening here signals genuine institutional stress.
*   **High-yield (HY) spread:** Compensation for holding speculative-grade debt. This is the market's real-time default-risk gauge — HY spreads widen violently in risk-off regimes and compress during liquidity expansions.

A simple rule: equities can rally on hope, but credit spreads rarely lie. When stocks make new highs while high-yield spreads quietly widen, risk appetite is narrower than the index suggests.

#### 3. Funding and cross-market spreads

*   **Funding spreads** (historically the TED spread; today SOFR-based equivalents) measure stress in the interbank system — how much banks charge each other over the risk-free rate.
*   **Cross-country sovereign spreads** (e.g. Italian BTPs minus German Bunds) price political and fiscal risk inside a currency union.
*   **Breakeven inflation spreads** (nominal Treasury yield minus TIPS yield) extract the market's implied inflation forecast.

#### How traders use spreads in practice

1. Track the *direction and speed* of the spread, not its absolute level. A fast 50 basis-point widening in high-yield matters more than a slow 100.
2. Confirm equity signals against credit. Divergences between stock indices and credit spreads tend to resolve in credit's favor.
3. Watch curve steepening after an inversion. Historically, the recession begins not when the curve inverts but when it *re-steepens* as the central bank starts cutting.`,
    faqs: [
      {
        question: 'What does an inverted yield curve mean for traders?',
        answer:
          'An inverted curve means short-term rates exceed long-term rates, signaling that monetary policy is restrictive relative to long-run growth expectations. It has preceded most modern recessions, though the lag between inversion and downturn varies from months to over a year.',
      },
      {
        question: 'Why do credit spreads widen during market stress?',
        answer:
          'When default risk rises or liquidity dries up, investors demand more extra yield to hold corporate bonds instead of government bonds. Dealers also mark down risky debt faster than they can hedge it, so high-yield spreads widen quickly and sharply in risk-off events.',
      },
      {
        question: 'Which spread is the best single risk gauge?',
        answer:
          'Most practitioners watch the high-yield credit spread. It reacts fast, reflects real financing costs for weaker companies, and tends to lead equity drawdowns when risk appetite deteriorates.',
      },
    ],
  },
  'arbitrage-mechanics': {
    id: 'arbitrage-mechanics',
    title: 'Arbitrage Mechanics: How Price Convergence Trades Work',
    summary:
      'How arbitrage actually works: pure, statistical, and structural arbitrage, the role of funding and execution costs, and why "riskless" convergence trades still blow up when liquidity disappears.',
    keywords: ['arbitrage', 'statistical arbitrage', 'pairs trading', 'basis trade', 'convergence', 'market neutral', 'funding risk'],
    publishDate: '2026-06-07',
    updatedDate: '2026-07-19',
    content: `### The core idea: one asset, one price

Arbitrage exploits situations where the same economic exposure trades at two different prices. Buy the cheap leg, sell the expensive leg, and wait for convergence. The profit is the gap minus costs. In efficient markets those gaps are tiny and short-lived — which is exactly why understanding the mechanics matters more than spotting the gap.

#### 1. Pure (riskless) arbitrage

The textbook case: identical instruments, simultaneous execution.

*   **Exchange arbitrage:** The same asset quoted at different prices on two venues. High-frequency firms with co-located servers capture these in microseconds; retail traders essentially never see them.
*   **Triangular FX arbitrage:** Three currency pairs whose cross-rates drift out of alignment. Again, machine territory.

#### 2. Basis and carry arbitrage

Here the two legs are *related but not identical*, so the trade carries real risk until the convergence date.

*   **Cash-and-carry:** Buy the spot asset, sell the futures contract. The futures price must converge to spot at expiry, so the annualized basis is a quasi-interest rate. When crypto perpetual funding rates spike, this is the trade professionals run against them.
*   **The Treasury basis trade:** Buy cash bonds, short bond futures, lever the tiny spread. Profitable and stable — until a funding shock forces mass unwinds, as happened in March 2020.

#### 3. Statistical arbitrage

Statistical arbitrage bets on the *historical relationship* between instruments rather than a hard convergence guarantee.

*   **Pairs trading:** Long one stock, short a highly correlated peer when their spread stretches beyond historical norms. The bet is mean reversion, and it can simply be wrong when fundamentals genuinely diverge.
*   **Index arbitrage:** Trading a basket of stocks against the index future when the basket drifts from fair value.

#### Why arbitrage trades still fail

1. **Funding risk:** Convergence trades are usually levered. If your financing is pulled before the spread closes, you realize the loss even though the thesis was right. "The market can stay irrational longer than you can stay solvent" is an arbitrage epitaph.
2. **Execution slippage:** The gap must exceed both spreads, both commissions, and any borrow fees on the short leg. Most visible "arbitrage" disappears after honest cost accounting.
3. **Correlation breakdown:** Statistical relationships hold until a regime change breaks them, and the losses arrive precisely when everything else is also going wrong.`,
    faqs: [
      {
        question: 'Is true riskless arbitrage available to retail traders?',
        answer:
          'Effectively no. Pure price-gap arbitrage is captured by high-frequency firms with co-located infrastructure within microseconds. Retail-accessible strategies like pairs trading or cash-and-carry are convergence trades that carry real funding, execution, and correlation risk.',
      },
      {
        question: 'What is a basis trade?',
        answer:
          'A basis trade buys an asset in one form (like a cash bond or spot crypto) and shorts a derivative on the same asset (like a future or perpetual swap), capturing the price difference as the two converge toward expiry or through funding payments.',
      },
      {
        question: 'What is the biggest hidden risk in arbitrage strategies?',
        answer:
          'Leverage plus funding withdrawal. Because the per-trade edge is small, arbitrage is run at high leverage. When lenders pull financing during stress, positions must be unwound at the worst possible moment, converting a "sure" convergence profit into a forced-liquidation loss.',
      },
    ],
  },
  'leverage-risk': {
    id: 'leverage-risk',
    title: 'Leverage & Risk: Position Sizing, Margin, and Liquidation Math',
    summary:
      'How leverage really works: margin mechanics, liquidation math, volatility drag, and the position-sizing rules professionals use to survive losing streaks that wipe out over-levered accounts.',
    keywords: ['leverage', 'margin', 'position sizing', 'liquidation', 'risk management', 'drawdown', 'risk of ruin', 'volatility drag'],
    publishDate: '2026-06-07',
    updatedDate: '2026-07-19',
    content: `### Leverage multiplies exposure, not skill

Leverage lets you control a position larger than your capital. It scales both your profits and your losses by the same multiple — but its most dangerous property is asymmetric: losses compound against you, and a large enough loss removes you from the game entirely.

#### 1. Margin mechanics

*   **Initial margin:** The collateral required to open a levered position. At 10x leverage, a $1,000 deposit controls $10,000 of exposure.
*   **Maintenance margin:** The minimum equity you must keep. When losses push equity below this line, the broker or exchange issues a margin call — or simply liquidates you.
*   **Liquidation price:** At 10x leverage, roughly a 10% adverse move erases your equity; the exchange closes you earlier than that to protect itself. At 50x, a 2% wiggle — ordinary intraday noise — is fatal.

#### 2. The math that kills accounts

*   **Loss asymmetry:** A 50% loss requires a 100% gain to recover. Losses grow geometrically harder to reverse: down 80% means you need +400% just to get back to even.
*   **Volatility drag:** A position that gains 10% then loses 10% is not flat — it is down 1%. Levered exposure amplifies this drag, which is why levered ETFs decay in choppy markets even when the underlying finishes unchanged.
*   **Risk of ruin:** With fixed position sizing, a strategy with positive expectancy can still go bankrupt if the bet size is too large relative to the losing-streak distribution. Ten consecutive losses is not rare for a 55%-win-rate strategy; sizing must survive it.

#### 3. Position sizing rules professionals actually use

1. **Fixed fractional risk:** Risk a fixed small percentage of account equity per trade — commonly 0.5% to 2% — defined as the distance from entry to stop multiplied by position size. The leverage ratio becomes an *output* of this calculation, never an input.
2. **Volatility-adjusted sizing:** Scale positions inversely to the instrument's recent volatility (e.g. using ATR), so a wild market automatically means a smaller position.
3. **Portfolio heat limits:** Cap total simultaneous risk across all open positions (e.g. 6% of equity), because correlated trades lose together.
4. **Drawdown brakes:** Cut all position sizes after a defined equity drawdown. This directly attacks risk of ruin by making bet size shrink when the strategy is cold.

#### The honest summary

Used correctly, leverage is a capital-efficiency tool wrapped around a strict risk budget. Used as a lottery multiplier, it converts ordinary market noise into account-ending events. The market does not know or care how levered you are — but your liquidation price does.`,
    faqs: [
      {
        question: 'How much leverage is safe for a retail trader?',
        answer:
          'Frame it as risk per trade, not leverage. If your stop-loss distance and position size risk 1% of equity per trade, the implied leverage is usually modest (often 2x-5x). Fixed high leverage like 20x-100x makes routine volatility hit your liquidation price.',
      },
      {
        question: 'Why do levered positions lose money in sideways markets?',
        answer:
          'Volatility drag. Sequential gains and losses of equal percentage compound below break-even (+10% then -10% equals -1%), and leverage multiplies the effect. Choppy price action steadily erodes levered equity even with no net directional move.',
      },
      {
        question: 'What is risk of ruin?',
        answer:
          'The probability that a strategy hits an unrecoverable drawdown before its positive expectancy plays out. It rises steeply with bet size: even a winning system goes bankrupt if losing streaks — which are statistically inevitable — exceed what the position sizing can absorb.',
      },
    ],
  },
};

export interface GlossaryTerm {
  term: string;
  definition: string;
}

export const GLOSSARY_TERMS: GlossaryTerm[] = [
  { term: 'Ask', definition: 'The lowest price a seller is currently willing to accept for an asset. Market buy orders execute against the ask.' },
  { term: 'ATR (Average True Range)', definition: 'A volatility indicator measuring the average size of price ranges over a lookback period, commonly used to set stop distances and size positions.' },
  { term: 'Basis', definition: 'The price difference between a derivative (such as a future) and its underlying spot asset. Converges toward zero at contract expiry.' },
  { term: 'Bear Market', definition: 'A sustained decline in prices, conventionally defined as a fall of 20% or more from a recent high, accompanied by pessimistic sentiment.' },
  { term: 'Beta', definition: 'A measure of how much an asset moves relative to the overall market. Beta above 1.0 means larger swings than the index; below 1.0 means smaller.' },
  { term: 'Bid', definition: 'The highest price a buyer is currently willing to pay for an asset. Market sell orders execute against the bid.' },
  { term: 'Bid-Ask Spread', definition: 'The gap between the best bid and best ask. A core transaction cost and a real-time gauge of liquidity — spreads widen when liquidity is scarce.' },
  { term: 'Breakout', definition: 'A price move beyond a defined support or resistance level, often accompanied by increased volume, signaling potential trend continuation or initiation.' },
  { term: 'Bull Market', definition: 'A sustained rise in prices, typically driven by expanding liquidity, earnings growth, or improving sentiment.' },
  { term: 'Candlestick', definition: 'A chart element encoding open, high, low, and close for a time period. The body shows open-to-close range; wicks show the extremes.' },
  { term: 'Carry Trade', definition: 'Borrowing in a low-yield currency or instrument to invest in a higher-yielding one, profiting from the rate differential while accepting exchange-rate or price risk.' },
  { term: 'Correlation', definition: 'A statistical measure (-1 to +1) of how two assets move together. Diversification depends on holding assets with low or negative correlation.' },
  { term: 'Credit Spread', definition: 'The extra yield corporate bonds pay over government bonds of the same maturity, compensating investors for default risk. A key risk-appetite gauge.' },
  { term: 'DCF (Discounted Cash Flow)', definition: 'A valuation method that estimates intrinsic value by projecting future free cash flows and discounting them to the present using a required rate of return.' },
  { term: 'Drawdown', definition: 'The peak-to-trough decline in account equity or asset price, expressed as a percentage. Maximum drawdown measures the worst such decline historically.' },
  { term: 'Fibonacci Retracement', definition: 'Horizontal levels drawn at key ratios (38.2%, 50%, 61.8%) of a prior price move, used to anticipate where pullbacks may find support or resistance.' },
  { term: 'Funding Rate', definition: 'The periodic payment between long and short holders of perpetual futures that tethers the contract price to spot. Positive funding means longs pay shorts.' },
  { term: 'Hedge', definition: 'A position taken specifically to offset the risk of another position, such as shorting index futures against a stock portfolio.' },
  { term: 'Inflation', definition: 'A sustained rise in the general price level, diminishing the purchasing power of money. Measured by indices such as CPI and PCE.' },
  { term: 'Leverage', definition: 'Controlling a position larger than posted capital by borrowing or using derivatives. Multiplies both gains and losses relative to account equity.' },
  { term: 'Limit Order', definition: 'An order to buy or sell at a specified price or better. Rests in the order book supplying liquidity until filled or cancelled.' },
  { term: 'Liquidation', definition: 'The forced closure of a levered position by a broker or exchange when account equity falls below maintenance margin requirements.' },
  { term: 'Liquidity', definition: 'The ease of transacting in size without moving the price. Deep order books and tight spreads indicate high liquidity.' },
  { term: 'MACD', definition: 'Moving Average Convergence Divergence — a momentum indicator comparing two exponential moving averages, with a signal line and histogram showing momentum shifts.' },
  { term: 'Margin', definition: 'Collateral posted to open and maintain a levered position. Initial margin opens the trade; maintenance margin is the minimum to keep it alive.' },
  { term: 'Market Maker', definition: 'A participant that continuously quotes both bid and ask prices, earning the spread while providing liquidity to the market.' },
  { term: 'Market Order', definition: 'An order to buy or sell immediately at the best available price, consuming liquidity from the order book and guaranteeing execution but not price.' },
  { term: 'Moving Average', definition: 'The average price over a rolling lookback window, used to smooth noise and define trend direction. Common variants include simple (SMA) and exponential (EMA).' },
  { term: 'Order Book', definition: 'The live ledger of resting buy (bid) and sell (ask) limit orders at each price level, showing available liquidity and market depth.' },
  { term: 'P/E Ratio', definition: 'Price-to-earnings ratio — share price divided by earnings per share. A common shorthand for how expensively the market values a company\u2019s profits.' },
  { term: 'Pip', definition: 'The smallest standard price increment in forex quoting, typically 0.0001 for most currency pairs. Used to express spreads and price moves.' },
  { term: 'Position Sizing', definition: 'Determining how much capital to allocate to a trade, typically by fixing the percentage of equity at risk between entry and stop-loss.' },
  { term: 'Resistance', definition: 'A price zone where selling interest has repeatedly halted advances. Breaks above resistance often precede continuation moves.' },
  { term: 'Risk-Reward Ratio', definition: 'The ratio of potential loss (entry to stop) versus potential gain (entry to target). A 1:3 ratio risks one unit to make three.' },
  { term: 'RSI (Relative Strength Index)', definition: 'A momentum oscillator (0-100) measuring the speed of recent price changes. Readings above 70 suggest overbought conditions; below 30, oversold.' },
  { term: 'Short Selling', definition: 'Selling a borrowed asset to profit from a price decline, buying it back later at a lower price. Losses are theoretically unlimited as prices can rise indefinitely.' },
  { term: 'Slippage', definition: 'The difference between the expected execution price and the actual fill price, caused by market movement or insufficient liquidity at the quoted level.' },
  { term: 'Stop-Loss', definition: 'A pre-placed order that closes a position when price reaches a defined loss threshold, converting an open-ended risk into a bounded one.' },
  { term: 'Support', definition: 'A price zone where buying interest has repeatedly halted declines. Breaks below support often accelerate selling.' },
  { term: 'Volatility', definition: 'The magnitude of price fluctuations over time, measured by standard deviation or ATR. Higher volatility means wider price swings and larger position risk.' },
  { term: 'Volume', definition: 'The number of shares, contracts, or units traded in a period. Confirms the conviction behind price moves — breakouts on high volume carry more weight.' },
  { term: 'WACC', definition: 'Weighted Average Cost of Capital — the blended required return across a company\u2019s debt and equity financing, used as the discount rate in DCF valuation.' },
  { term: 'Yield Curve', definition: 'The plot of government bond yields across maturities. Steep curves signal growth expectations; inverted curves (short rates above long) historically precede recessions.' },
];
