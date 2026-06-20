export interface Article {
  id: string;
  title: string;
  category: 'Microstructure' | 'Central Banking' | 'Quantitative Systems' | 'Technical Science' | 'Risk Dynamics' | 'Founders Perspective';
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  summary: string;
  content: string; // supports rich Markdown
  formulas?: string[];
  vocabulary?: { term: string; definition: string }[];
  quiz?: {
    question: string;
    options: string[];
    correctIndex: number;
    explanation: string;
  };
}

export const encyclopediaCategories = [
  { id: 'all', label: 'All Fields' },
  { id: 'Microstructure', label: 'Market Microstructure' },
  { id: 'Central Banking', label: 'Central Banking & Macro' },
  { id: 'Quantitative Systems', label: 'Quantitative & Algorithmic Systems' },
  { id: 'Technical Science', label: 'Technical & Structural Chart Science' },
  { id: 'Risk Dynamics', label: 'Risk Dynamics & Capital Flow' },
  { id: 'Founders Perspective', label: 'Founders Perspective' },
];

export const encyclopediaArticles: Article[] = [
  {
    id: 'founders-perspective-nano-banana',
    title: 'This is how the market works as seen by the founders',
    category: 'Founders Perspective',
    difficulty: 'Advanced',
    summary: 'Structured Pattern Videos created by Nano Banana explaining the underlying market mechanisms and our core philosophy.',
    content: `
### Disclamer: This is how we see the market.
It's not strictly right or wrong, but this represents the core structured pattern philosophy under which ClearPath Trader was established. 

The market is an aggregate of liquidity and human behavior. By visualizing the structural patterns below—developed specifically by **Nano Banana**—you can begin to see alternative geometries inside charts that most standard indicators fail to recognize.

*(Structured Pattern Videos by Nano Banana)*

<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 1rem; margin-top: 2rem;">
  <div style="padding: 1rem; border: 1px solid #36E6FF; border-radius: 12px; background: rgba(54, 230, 255, 0.05);">
    <h4 style="color: #36E6FF; text-transform: uppercase; font-weight: bold; margin-bottom: 0.5rem; font-size: 0.9rem;">Structural Sweep Dynamics</h4>
    <div style="width: 100%; aspect-ratio: 16/9; background: #000; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-family: monospace; color: #888; border: 1px solid #222;">
      [ NANO BANANA VIDEO FEED 1 ]<br/>*Offline / Secure Encrypted*
    </div>
  </div>
  <div style="padding: 1rem; border: 1px solid #FF00C8; border-radius: 12px; background: rgba(255, 0, 200, 0.05);">
    <h4 style="color: #FF00C8; text-transform: uppercase; font-weight: bold; margin-bottom: 0.5rem; font-size: 0.9rem;">Liquidity Void Refill</h4>
    <div style="width: 100%; aspect-ratio: 16/9; background: #000; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-family: monospace; color: #888; border: 1px solid #222;">
      [ NANO BANANA VIDEO FEED 2 ]<br/>*Offline / Secure Encrypted*
    </div>
  </div>
</div>
`
  },
  {
    id: 'bid-ask-spread-microstructure',
    title: 'Order Book Depth and the Mechanics of Bid-Ask Spread',
    category: 'Microstructure',
    difficulty: 'Beginner',
    summary: 'Analyze how market makers aggregate orders to form bid/ask prices, how spreads widen during low-liquidity cycles, and the mechanics of limit versus market orders.',
    content: `
### What is the Bid-Ask Spread?

At the core of all modern electronic exchanges lies the **Limit Order Book (LOB)**. Asset exchange doesn't happen at a single "ideal" price; instead, it is driven by the dynamic matching of participants willing to buy at specified price points (**bids**) and participants willing to sell at specified price points (**asks**).

*   **Bid Price (Demand):** The highest price a buyer is willing to pay for an asset.
*   **Ask Price (Supply):** The lowest price a seller is willing to accept for an asset.
*   **The Spread:** The difference between the highest bid and lowest ask.

$$Spread = Ask_{lowest} - Bid_{highest}$$

The spread is the primary transaction cost incurred by urgent market participants, and it functions as the primary risk premium compensation for liquidity providers (market makers).

---

### How Market Makers Structure Liquidity

Market makers operate continuously in the order book, simultaneously posting limit buy orders and limit sell orders. Their revenue model is built on capturing the spread. However, they face **Adverse Selection Risk**: the danger of trading against someone with superior, non-public information (toxic order flow).

When toxicity increases (such as before major interest rate releases), market makers widen their spreads or pull their bids and asks entirely to avoid being run over by institutional block trades. This causes a phenomenon known as **Liquidity Blackouts**.

---

### Order Types and Execution Mechanics

Trading in modern environments is split into two behavioral profiles:

1.  **Liquidity Takers (Market Orders):** Traders who demand immediate execution. A buy market order is instantly matched against the lowest available Sell Limit (Ask). A sell market order matches against the highest Buy Limit (Bid). Market orders cross the spread, paying the premium.
2.  **Liquidity Providers (Limit Orders):** Traders who prioritize price precision over execution certainty. They place orders inside the book and wait for market orders to match them. They do not cross the spread; they negotiate the price.
`,
    formulas: [
      'Spread = Best Ask - Best Bid',
      'Effective Roll Spread = 2 * sqrt(-Cov(ΔP_t, ΔP_{t-1}))',
      'Slippage = Execution Price - Initial Midpoint Price'
    ],
    vocabulary: [
      { term: 'Toxic Flow', definition: 'Order flow originating from highly informed participants likely to result in immediate adverse price shifts for the market maker.' },
      { term: 'Slippage', definition: 'The difference between the expected price of a market order and the actual execution price due to lack of order book depth.' },
      { term: 'Midpoint', definition: 'The exact mathematical center of the current spread: (Best Bid + Best Ask) / 2.' }
    ],
    quiz: {
      question: 'Which action will a market maker most likely take inside the order book right before a high-volatility news dispatch to defend against toxicology?',
      options: [
        'Contract spreads to match maximum retail orders',
        'Widen bid-ask spreads or withdraw bid levels to reduce risk exposure',
        'Submit massive market orders to establish momentum',
        'Peg limit orders to a static historical price center'
      ],
      correctIndex: 1,
      explanation: 'To guard against toxic order flow and extreme pricing shifts, market makers widen spreads or pull liquidity, requiring greater margins to offset risk.'
    }
  },
  {
    id: 'interest-rates-monetary-policy',
    title: 'Central Banking: Monetary Policy Transmission & Yield Curve Mechanics',
    category: 'Central Banking',
    difficulty: 'Intermediate',
    summary: 'Deconstruct how central banks adjust base interest rates, utilize open market operations, and how these forces transmit into forex pricing, sovereign bond yields, and capital allocation.',
    content: `
### The Mandate of Central Banks

Central banks (such as the Federal Reserve, European Central Bank, and Bank of Japan) manipulate the supply and cost of money in an economy to achieve specific policy mandates, typically **price stability (inflation target of 2%)** and **maximum sustainable employment**.

---

### Transmission Mechanism: From Base Rates to Global Forex

How does a benchmark rate hike in Washington or Frankfurt affect a trader's screen in Tokyo? Through the **Monetary Transmission Mechanism**:

1.  **The Floor Rate:** Central banks adjust the overnight interbank rate (e.g., Federal Funds Rate).
2.  **Yield Curves:** This rate shift travels up the sovereign bond spectrum (2-Year, 5-Year, 10-Year Treasury Yields).
3.  **Forex Yield Differential:** Foreign capital flows toward sovereign bounds paying the highest risk-adjusted yield. When the Fed hikes rates relative to the ECB, global desks buy US Treasuries, requiring them to convert Euros to US Dollars ($EUR/USD$ falls).

---

### Quantitative Easing (QE) and Tightening (QT)

When base interest rates reach the **Zero Lower Bound (ZLB)**, central banks turn to unconventional policy tools:

*   **Quantitative Easing (QE):** The central bank purchases long-term treasury bounds and mortgage securities from senior commercial institutions, injecting liquidity directly into corporate reserves to force credit yield curves down. This inflates asset prices (stocks/commodities) and weakens the domestic currency.
*   **Quantitative Tightening (QT):** The inverse. The central bank lets assets roll off its balance sheet or actively sells holdings, withdrawing capital from the system. This increases cash scarcity, increases yield premiums, and deflates asset prices.
`,
    formulas: [
      'Fisher Equation: Nominal Rate = Real Rate + Expected Inflation',
      'Fed Funds Rate Target = Neutral Rate + 0.5 * (Inflation - Target) + 0.5 * (Output Gap)',
      'Bond Price = Sum( Coupon_t / (1 + r)^t ) + Face Value / (1 + r)^n'
    ],
    vocabulary: [
      { term: 'Yield Curve', definition: 'A graphical plotting of yields on bonds of similar credit quality but differing maturity terms.' },
      { term: 'Inverted Yield Curve', definition: 'An abnormal yield structure where short-term debt instruments pay higher interest than long-term ones, historically a reliable precursor of macroeconomic recessions.' },
      { term: 'Zero Lower Bound', definition: 'The threshold where standard central banking interest rates cannot be cut lower than zero without destabilizing banking systems.' }
    ],
    quiz: {
      question: 'What is the immediate capital-flow consequence of an inverted yield curve where 2-Year bond yields surpass 10-Year bond yields?',
      options: [
        'A system-wide flight to high-beta venture stock options',
        'An indicator of expected monetary accommodation and near-term economic contraction risk',
        'An immediate weakening of the domestic currency due to structural risk adjustments',
        'Direct expansion of bank credit lending pipelines'
      ],
      correctIndex: 1,
      explanation: 'An inverted yield curve signifies that short-term capital is in extremely tight supply or presents higher perceived near-term volatility risk, indicating market expectations of a recession and subsequent interest rate cuts.'
    }
  },
  {
    id: 'algorithmic-latency-high-frequency-trading',
    title: 'High-Frequency Trading (HFT) and Execution Latency Dynamics',
    category: 'Quantitative Systems',
    difficulty: 'Advanced',
    summary: 'Examine the architecture of algorithmic execution, microwave network co-location, and how algorithmic entities exploit arbitrage gaps in milliseconds.',
    content: `
### The Millisecond War: High Frequency Mechanics

In the 1990s, trading execution times were measured in seconds and minutes. Today, the institutional frontier is measured in **microseconds (one millionth of a second)** and **nanoseconds (one billionth of a second)**.

**High-Frequency Trading (HFT)** represents automated algorithmic market making and statistical arbitrage that executes thousands of orders within fractions of a second, relying on extreme infrastructure speed.

---

### Hardware Co-Location and Fiber Optic Routes

When trading at millisecond scales, the speed of light through cables becomes the absolute speed limit:

*   **Co-Location:** Institutional desks position their physical server racks directly inside the exchange's data center (e.g., in Carteret, New Jersey for NASDAQ, or Secaucus, New Jersey for BATS). By eliminating miles of physical cable, they reduce latency down to single-digit microseconds.
*   **Microwave Networks:** Instead of underground fiber optics, HFT funds deploy direct-sight line microwave transmitter dishes between critical exchanges (Chicago to New York). Microwave air transmission is ~30% faster than transmission through fiber optic silica cores.

---

### Algorithmic Exploitations: Latency Arbitrage

In a multi-hub market, price discovery occurs across physically separate servers. For instance, if the price of $S&P 500$ futures spikes in Chicago (CME), it takes approximately 4 milliseconds for that price information to travel to New Jersey (NASDAQ).

A latency arbitrageur spots the price change in Chicago, races the message through ultra-speed microwave networks, and buys equity products in New York *before* local market participants can adjust their stale quotes.
`,
    formulas: [
      'Latency Δt = Physical Distance (meters) / (Velocity of Light in Medium)',
      'Velocity of Light in Fiber = c / Refractive Index ≈ 200,000 km/s',
      'Velocity of Light in Air (Microwave) ≈ 299,700 km/s (approx. c)'
    ],
    vocabulary: [
      { term: 'Co-location', definition: 'The physical placement of private trading servers inside the exchange’s server facility to achieve near-zero hardware transit delay.' },
      { term: 'Dark Pool', definition: 'Private institutional alternative trading matches with hidden order books to execute immense blocked prints without immediate public impact.' },
      { term: 'Order Book Spoofing', definition: 'The dynamic, illegal practice of posting large limit orders with no execution intent to manipulate retail sentiment, pulling them before execution.' }
    ],
    quiz: {
      question: 'Why do microwave lines outperform fiber optic cables in algorithmic arbitrage across physical exchanges, despite similar hardware connections?',
      options: [
        'Microwaves carry double the packet size per byte',
        'The refractive index of air is approximately 1.0, letting light waves travel nearly 50% faster than in physical glass fiber lines',
        'Microwaves operate independent of solar flare magnetic distortions',
        'Exchanges charge half the port price for microwave infrastructure'
      ],
      correctIndex: 1,
      explanation: 'In vacuum or air, light speeds forward at ~299,700 km/s. Over fiber optic glass, the refractive index (1.5) restricts speed to ~200,000 km/s. This 30%-45% differential is the difference between victory and bankruptcy in latency arbitrage.'
    }
  },
  {
    id: 'technical-science-liquidity-pools',
    title: 'Chart Science: Internal Range Liquidity & Session Manipulation Cycles',
    category: 'Technical Science',
    difficulty: 'Intermediate',
    summary: 'Deconstruct internal price ranges, fair value gaps, and London/New York session liquidity sweeps using institutional market-maker models.',
    content: `
### Rethinking Lines: The Liquidity Paradigm

Retail chart theory teaches "support and resistance lines." Institutional algorithms, however, do not read lines; they read **liquidity concentrations (resting stop orders)**.

*   **Buy-Side Liquidity (BSL):** Concentrated buy-stop orders sitting right above swing highs (typically consisting of short-seller buy-to-cover risk caps and buy-breakout momentum triggers).
*   **Sell-Side Liquidity (SSL):** Concentrated sell-stop orders sitting right below swing lows (comprising long-position stop-losses and breakdown capitulants).

To match massive blocks of buying demand, institutional algorithms must drive prices *below* swing lows into Sell-Side Liquidity Pools, effectively buying from panicked sellers closing their positions under stop-loss parameters (a **stop-hunt** or **liquidity sweep**).

---

### Session Manipulation: The London Judas Swing

A hallmark structural pattern of global markets is the **Session Sweep Framework (ICT Sovereign Footprints)**:

1.  **Asian Consolidation:** The Asian session (Tokyo/Sydney) is thin and range-bound, accumulating resting buy and sell orders above and below its boundaries.
2.  **London Judas Swing (The Trap):** At London open, European market makers drive the price aggressively in one direction (usually violating the Asian session peak) to absorb buy-side resting liquidity and trap breakout retail traders.
3.  **New Directional Expansion:** Once the liquidity is captured to offset institutional sell blocks, the real directional movement of the day commences, running downstream through London and New York.
`,
    formulas: [
      'Fair Value Gap (FVG) Size = | Low_Bar1 - High_Bar3 | (where Low_Bar1 > High_Bar3)',
      'Average Daily Range (ADR) = Average( High_t - Low_t ) over n days',
      'Discount Pricing Zone = Price < Midpoint of Premium-to-Discount Range'
    ],
    vocabulary: [
      { term: 'Judas Swing', definition: 'A false breakout swing executed during London or New York openings designed to trap retail participants before the real market expansion.' },
      { term: 'Fair Value Gap', definition: 'An imbalance in price delivery where a single candle expands rapidly, leaving price action unhedged and causing a vacuum that price often retreads to fill.' },
      { term: 'Order Block', definition: 'A specific candle or cluster of buying/selling where institutional desks previously injected heavy capital, creating structural pivots.' }
    ],
    quiz: {
      question: 'In institutional market delivery, why will an algorithm purposefully push price past a major resistance point if the high-timeframe outlook is heavily bearish?',
      options: [
        'To help retail traders lock in profits on breakouts',
        'To cross a premium threshold and run buy-stops (Buy-side Liquidity) to offset major institutional sell blocks',
        'To minimize capital reserve rates on central bank accounts',
        'To trigger automated margin additions in public savings funds'
      ],
      correctIndex: 1,
      explanation: 'To trigger major short-selling executions, big financial actors need to match their sells against buy orders. Pushing the price past resistance triggers short stop-losses (which are buy orders) and breakout buyers, creating the necessary buying liquidity to absorb the institution\'s massive short interest.'
    }
  },
  {
    id: 'risk-dynamics-drawdown-management',
    title: 'The Mathematics of Portfolio Drawdown and Risk Adjustments',
    category: 'Risk Dynamics',
    difficulty: 'Advanced',
    summary: 'Master the non-linear relationship of drawdown recovery metrics, position sizing, and how expectancy models regulate survival.',
    content: `
### The Non-Linear Mathematics of Drawdown

Most retail practitioners look at risk as a simple percentage. However, the mathematics of capital recovery are **highly non-linear**.

If a fund loses 10% of its capital, it does not need a 10% gain to return to breakeven; it needs 11.1%. If a fund suffers a 50% drawdown, it needs a **100% gain** just to return to parity.

The recovery requirement accelerates exponentially:

| Capital Loss (Drawdown) | Required Gain to Breakeven |
| :---------------------- | :------------------------- |
| **5%**                  | 5.26%                      |
| **10%**                 | 11.11%                     |
| **20%**                 | 25.00%                     |
| **30%**                 | 42.86%                     |
| **50%**                 | 100.00%                    |
| **80%**                 | 400.00%                    |
| **90%**                 | 900.00%                    |

This mathematical asymmetric drag is why preserving capital is infinitely more critical than catching the absolute top of a trend.

---

### Position Sizing and the Kelly Criterion

To avoid the **Risk of Ruin**, institutional risk engines utilize Kelly or fixed-fraction sizing protocols:

$$Position\\ Size \\% = \\frac{Win\\ Rate \\times (Risk\\-Reward\\ Ratio + 1) - 1}{Risk\\-Reward\\ Ratio}$$

If an expectancy is negative or sizing is overly aggressive, the probability of hitting a margin-call threshold approaches 100% over a series of independent trials, even with positive expectancy.
`,
    formulas: [
      'Required Gain = Drawdown_Rate / (1 - Drawdown_Rate)',
      'Sharp Ratio = (R_p - R_f) / σ_p',
      'Kelly Fraction f* = p - (1 - p) / b (where p is probability of win, b is odds ratio)'
    ],
    vocabulary: [
      { term: 'Risk of Ruin', definition: 'The probability that a trading account will encounter a drawdown of such magnitude that it is mathematically unable to continue trading.' },
      { term: 'Expectancy', definition: 'The average amount a trader expects to make (or lose) per dollar risked: (Win Rate * Avg Win) - (Loss Rate * Avg Loss).' },
      { term: 'Sharpe Ratio', definition: 'A metric measuring risk-adjusted return, calculated by dividing the excess portfolio return by its standard deviation of volatility.' }
    ],
    quiz: {
      question: 'A trader has an account of $10,000 and suffers a major 40% margin draw down on a series of aggressive trades. What exact percentage gain is now required to reach breakeven?',
      options: [
        '40.00%',
        '50.00%',
        '66.67%',
        '80.00%'
      ],
      correctIndex: 2,
      explanation: 'Using the formula Required Gain = D / (1 - D): 0.40 / (1 - 0.40) = 0.40 / 0.60 = 0.6667, or 66.67% gain required.'
    }
  }
];
