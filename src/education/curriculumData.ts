// ============================================================================
// ClearPath Education — Curriculum Data (Layer 1)
// Single source of truth for all schools, units, and lessons.
// Quizzes (Layer 2) attach by referencing schoolId + unitId, so adding the
// quiz layer later requires NO changes to this file.
// ============================================================================

export type Lesson = {
  id: string;        // stable id, e.g. "crypto-u1-l1"
  title: string;
};

export type Unit = {
  id: string;        // stable id, e.g. "crypto-u1"
  title: string;     // e.g. "Unit 1 — Before You Touch Crypto"
  lessons: Lesson[];
};

export type School = {
  id: string;        // stable id, e.g. "crypto"
  name: string;      // e.g. "Crypto"
  tagline: string;
  // Per-school neon palette (hex, dark-bg legible) — matches the curriculum doc.
  colors: {
    head: string;    // school title
    unit: string;    // unit headings
    lesson: string;  // lesson text
  };
  units: Unit[];
};

// --- Neon palette (matches platform Color Usage Guide, brightened for dark bg) ---
export const NEON = {
  violet: "#B57EFF",
  blue: "#22D3EE",
  teal: "#00F5D4",
  lime: "#A3FF12",
  yellow: "#FFE600",
  orange: "#FF8A33",
  pink: "#FF2D95",
  magenta: "#E879F9",
} as const;

// Helper to build lessons quickly from titles.
const L = (schoolId: string, unitNum: number, titles: string[]): Lesson[] =>
  titles.map((title, i) => ({ id: `${schoolId}-u${unitNum}-l${i + 1}`, title }));

export const CURRICULUM: School[] = [
  // ==========================================================================
  // 0. CHART SHAPES  — visual ID lab (wedges vs triangles)
  // First school on purpose: this is the mix-up that fools almost everyone.
  // One open unit so the pictures are not locked behind quizzes.
  // ==========================================================================
  {
    id: "shapes",
    name: "Chart Shapes",
    tagline:
      "Wedge or triangle? Look at two lines. If you can tell a ramp from a wall, you can name the pattern.",
    colors: { head: NEON.pink, unit: NEON.violet, lesson: NEON.teal },
    units: [
      {
        id: "shapes-u1",
        title: "Unit 1 — Wedges vs Triangles",
        lessons: L("shapes", 1, [
          "The Only Question: Ramp or Wall?",
          "A Wedge Comes to a Point",
          "A Triangle Hits a Wall",
          "Rising Wedge — Looks Up, Usually Goes Down",
          "Falling Wedge — Looks Down, Usually Goes Up",
          "Ascending Triangle — Ramp Into a Ceiling",
          "Descending Triangle — Ramp Into a Floor",
          "The Mix-Up: Falling Wedge vs Descending Triangle",
          "The Mix-Up: Rising Wedge vs Ascending Triangle",
          "Practice: Name the Picture",
        ]),
      },
    ],
  },

  // ==========================================================================
  // 1. CRYPTO  (full template — all units built out)
  // ==========================================================================
  {
    id: "crypto",
    name: "Crypto",
    tagline: "From \u201Cwhat even is a blockchain\u201D to running your own on-chain analysis.",
    colors: { head: NEON.blue, unit: NEON.violet, lesson: NEON.teal },
    units: [
      {
        id: "crypto-u1",
        title: "Unit 1 — Before You Touch Crypto",
        lessons: L("crypto", 1, [
          "What Crypto Actually Is (and What It Isn't)",
          "Why Bitcoin Was Invented: The 2008 Problem",
          "Money, Trust, and Why a Ledger Matters",
          "The Honest Risk Talk: Volatility, Scams, and Total Loss",
          "What You Need Before Your First Satoshi",
        ]),
      },
      {
        id: "crypto-u2",
        title: "Unit 2 — How Blockchains Work (Plain English)",
        lessons: L("crypto", 2, [
          "A Blockchain Is Just a Shared Notebook",
          "Blocks, Hashes, and Why Tampering Fails",
          "Consensus: How Strangers Agree Without a Boss",
          "Public and Private Keys: Your Money's Password",
          "Wallets Explained: Hot, Cold, and Custodial",
          "Gas Fees and Why Transactions Cost Money",
        ]),
      },
      {
        id: "crypto-u3",
        title: "Unit 3 — Mining: How New Coins Are Born",
        lessons: L("crypto", 3, [
          "What Mining Actually Is (Solving a Puzzle to Earn the Right to Add a Block)",
          "Proof of Work in Plain English: Why Spending Energy Creates Trust",
          "Why People Mine: The Block Reward, Transaction Fees, and the Risk of Loss",
          "The Difficulty Adjustment: Why Mining Gets Harder as More People Join",
          "CPU Mining — The Original Method and Why It's Mostly Obsolete (with the Monero Exception)",
          "GPU Mining — Graphics Cards, the Flexible Middle Ground",
          "ASIC Mining — Purpose-Built Machines, Maximum Power, One Job Only",
          "Why Monero (XMR) Fights to Stay CPU-Mineable: ASIC-Resistance and Keeping Mining Fair",
          "Solo Mining vs. Mining Pools: Why Most Miners Team Up",
          "The Real Costs: Electricity, Heat, Hardware Wear, and Break-Even Math",
          "Cooling It Down: Air Cooling, Water Cooling, and Immersion Cooling",
          "From One Rig to a Farm: How Crypto Mining Farms Are Built and Run",
          "The Honest Mining Risk Talk: Profitability Swings, Noise, Fire Risk, and E-Waste",
          "How the World Views Mining: Why Some Countries Welcome It and Others Ban It",
          "The Four Legal Categories: Legal & Regulated, Legal but Restricted, Implicitly Restricted, and Banned",
          "Where Mining Is Allowed in 2026 (USA, Canada, Russia, Australia, UAE) — and Why Energy Policy Decides It",
          "Where Mining Is Banned or Restricted in 2026 (China, Algeria, Egypt, Afghanistan) — and Why",
          "Checking Your Own Country or State Before You Plug In",
          "Mining vs. Staking: Two Different Ways a Network Agrees",
        ]),
      },
      {
        id: "crypto-u4",
        title: "Unit 4 — The Coins and Tokens: A Complete Taxonomy",
        lessons: L("crypto", 4, [
          "Coins vs. Tokens: The Distinction That Matters",
          "Bitcoin — Store of Value: Digital Gold, Fixed Supply",
          "Ethereum & Smart-Contract Platforms — Programmable Money (ETH, SOL, ADA, AVAX)",
          "Stablecoins — Pegged: A Dollar That Lives On-Chain (USDT, USDC, DAI)",
          "Utility Tokens — Access: Fuel for a Specific Platform (LINK, FIL, RNDR)",
          "Governance Tokens — Voting: Ownership Without a Company (UNI, AAVE, MKR)",
          "Exchange Tokens — Platform: Fee Discounts and Perks (BNB, CRO)",
          "Privacy Coins — Anonymous: Financial Privacy and Controversy (XMR, ZEC)",
          "Wrapped & Bridged Tokens — Crossing Blockchains (WBTC, wETH)",
          "Memecoins — Speculative: The Honest Truth About Pump and Dump (DOGE, SHIB)",
          "Real-World Asset (RWA) Tokens — Bringing Offline Value On-Chain",
          "NFTs as a Token Type — Provable Ownership of One Unique Item",
          "Layer 2 & Scaling Tokens — Faster and Cheaper (ARB, OP, MATIC)",
          "How to Research Any Coin Before You Buy (Tokenomics 101)",
        ]),
      },
      {
        id: "crypto-u5",
        title: "Unit 5 — Buying, Storing, Securing, and Funding",
        lessons: L("crypto", 5, [
          "Choosing an Exchange Without Getting Burned",
          "Your First Buy: Orders, Spreads, and Slippage",
          "Choosing a Wallet: A Framework, Not a Recommendation",
          "Matching a Wallet to Your Needs (Holder, Trader, Accessibility-First)",
          "Checking What's Allowed Where You Live",
          "Self-Custody: Setting Up a Real Wallet",
          "Seed Phrases: The 12 Words That Are Your Money",
          "Security Hygiene: Phishing, Approvals, and Drainers",
          "Funding a Trading Account With Crypto: How It Works and What's Gated by Where You Live",
          "Why Stablecoins (USDT/USDC) Are Preferred for Funding Over Bitcoin",
          "The Irreversibility Rule: Check the Address, Network, and Coin Before You Send",
          "Regulated Brokers vs. Offshore Brokers: The Most Important Distinction in Retail Trading",
          "What 'Regulated' Actually Means (FCA, ASIC, CySEC, SEC/FINRA, MiCA)",
          "Why Crypto Deposits Are Often Offshore-Only — and the Tradeoff",
          "What to Do If You Get Hacked",
        ]),
      },
      {
        id: "crypto-u6",
        title: "Unit 6 — Reading the Crypto Market",
        lessons: L("crypto", 6, [
          "Market Cap, Supply, and Why Price Alone Lies",
          "Trading Volume and Liquidity",
          "Crypto Candlesticks: Same Chart, Faster Market",
          "Support, Resistance, and Round Numbers",
          "On-Chain Data: Reading the Blockchain Itself",
          "Funding Rates and the Perpetuals Market",
        ]),
      },
      {
        id: "crypto-u7",
        title: "Unit 7 — Crypto Trading Strategies",
        lessons: L("crypto", 7, [
          "Spot vs. Derivatives: Know Which You're In",
          "Dollar-Cost Averaging: The Boring Winner",
          "Swing Trading the Crypto Cycle",
          "The Halving and the Four-Year Narrative",
          "Leverage in Crypto: How People Get Liquidated",
          "Position Sizing When the Asset Can Drop 80%",
        ]),
      },
      {
        id: "crypto-u8",
        title: "Unit 8 — DeFi, NFTs, and the Wider Ecosystem",
        lessons: L("crypto", 8, [
          "Decentralized Finance: Banking Without Banks",
          "Lending, Borrowing, and Yield (and the Catch)",
          "Liquidity Pools and Impermanent Loss",
          "NFTs: Beyond the Hype",
          "Bridges, Layer 2s, and Scaling",
          "Spotting a Rug Pull Before It Pulls",
        ]),
      },
      {
        id: "crypto-u9",
        title: "Unit 9 — Risk, Tax, and Staying Sane",
        lessons: L("crypto", 9, [
          "Crypto Risk Management Rules That Save Accounts",
          "The Tax Reality of Every Trade and Swap",
          "Trading Psychology in a 24/7 Market",
          "Building a Crypto Plan You'll Actually Follow",
          "When to Walk Away From the Screen",
        ]),
      },
    ],
  },

  // ==========================================================================
  // 2. STOCKS
  // ==========================================================================
  {
    id: "stocks",
    name: "Stocks",
    tagline: "Owning a piece of a company — from your first share to reading a balance sheet.",
    colors: { head: NEON.teal, unit: NEON.lime, lesson: NEON.blue },
    units: [
      { id: "stocks-u1", title: "Unit 1 — What a Stock Really Is", lessons: L("stocks", 1, ["A Share Is a Slice of a Business", "Why Companies Sell Stock at All", "Common vs. Preferred Shares", "How You Actually Make (or Lose) Money", "The Honest Risk Talk for Stocks"]) },
      { id: "stocks-u2", title: "Unit 2 — The Market and Its Plumbing", lessons: L("stocks", 2, ["Exchanges: NYSE, Nasdaq, and the Rest", "Market Hours, Pre-Market, and After-Hours", "Brokers, Order Types, and the Bid-Ask Spread", "Market Makers and How Orders Get Filled", "Tickers, Lots, and Settlement"]) },
      { id: "stocks-u3", title: "Unit 3 — Fundamental Analysis", lessons: L("stocks", 3, ["Reading an Income Statement", "The Balance Sheet in Plain English", "Cash Flow: The Number That's Hard to Fake", "Key Ratios: P/E, EPS, ROE, and Friends", "Valuation: Is This Stock Cheap or Expensive?", "Reading an Earnings Report Without Panic"]) },
      { id: "stocks-u4", title: "Unit 4 — Technical Analysis", lessons: L("stocks", 4, ["Candlesticks and What They Tell You", "Trends, Support, and Resistance", "Moving Averages and Crossovers", "Volume: Confirming the Move", "Common Chart Patterns", "Indicators Without the Overload"]) },
      { id: "stocks-u5", title: "Unit 5 — Strategies and Styles", lessons: L("stocks", 5, ["Investing vs. Trading: Pick Your Game", "Buy and Hold and the Power of Time", "Dividend Investing for Income", "Growth vs. Value", "Swing Trading Basics", "Day Trading: The Hard Truth"]) },
      { id: "stocks-u6", title: "Unit 6 — Risk and Mindset", lessons: L("stocks", 6, ["Position Sizing and the 1% Rule", "Stop-Losses and Where to Place Them", "Diversification That Actually Works", "The Psychology of Holding and Selling", "Building Your Stock Trading Plan"]) },
    ],
  },

  // ==========================================================================
  // 3. FOREX
  // ==========================================================================
  {
    id: "forex",
    name: "Forex",
    tagline: "The world's largest market — currencies, pips, and the 24-hour clock.",
    colors: { head: NEON.violet, unit: NEON.pink, lesson: NEON.teal },
    units: [
      { id: "forex-u1", title: "Unit 1 — Welcome to Currencies", lessons: L("forex", 1, ["What Forex Is and Who Trades It", "Currency Pairs: Base and Quote", "Majors, Minors, and Exotics", "Pips, Lots, and Position Size", "The Honest Risk Talk for Forex"]) },
      { id: "forex-u2", title: "Unit 2 — How the Forex Market Moves", lessons: L("forex", 2, ["The 24-Hour Market and Trading Sessions", "Spreads, Commissions, and the Real Cost", "Leverage and Margin: The Double-Edged Sword", "What Moves Exchange Rates", "Liquidity and Why Timing Matters"]) },
      { id: "forex-u3", title: "Unit 3 — Fundamental Analysis", lessons: L("forex", 3, ["Interest Rates and Central Banks", "Inflation, Employment, and Growth Data", "Reading an Economic Calendar", "Risk-On and Risk-Off Sentiment", "Carry Trades Explained"]) },
      { id: "forex-u4", title: "Unit 4 — Technical Analysis", lessons: L("forex", 4, ["Reading the Forex Chart", "Support, Resistance, and Trendlines", "Moving Averages and Momentum", "Fibonacci in Forex", "Chart Patterns for Currencies", "Multi-Timeframe Analysis"]) },
      { id: "forex-u5", title: "Unit 5 — Strategies", lessons: L("forex", 5, ["Trend Following", "Range Trading", "Breakout Trading", "Scalping vs. Swing", "News Trading and Its Dangers"]) },
      { id: "forex-u6", title: "Unit 6 — Risk and Mindset", lessons: L("forex", 6, ["Risk Per Trade and Lot Sizing", "Stop-Loss and Take-Profit Placement", "Managing Leverage Responsibly", "The Psychology of Forex Trading", "Building Your Forex Trading Plan"]) },
    ],
  },

  // ==========================================================================
  // 4. FUTURES
  // ==========================================================================
  {
    id: "futures",
    name: "Futures",
    tagline: "Contracts on tomorrow's price — leverage, expiry, and the markets that move the world.",
    colors: { head: NEON.orange, unit: NEON.yellow, lesson: NEON.lime },
    units: [
      { id: "futures-u1", title: "Unit 1 — What a Futures Contract Is", lessons: L("futures", 1, ["A Promise to Buy or Sell Later", "Why Futures Exist: Hedgers and Speculators", "Contract Specs: Size, Tick, and Expiry", "Going Long and Going Short", "The Honest Risk Talk for Futures"]) },
      { id: "futures-u2", title: "Unit 2 — The Mechanics", lessons: L("futures", 2, ["Margin: Initial, Maintenance, and Calls", "Mark-to-Market and Daily Settlement", "Expiration, Rollover, and Contango/Backwardation", "Physical vs. Cash Settlement", "The Clearinghouse and Counterparty Risk"]) },
      { id: "futures-u3", title: "Unit 3 — The Major Futures Markets", lessons: L("futures", 3, ["Equity Index Futures (S&P, Nasdaq)", "Energy: Crude Oil and Natural Gas", "Metals: Gold, Silver, Copper", "Agricultural Futures", "Interest Rate and Bond Futures", "Micro and Mini Contracts for Smaller Accounts"]) },
      { id: "futures-u4", title: "Unit 4 — Analysis", lessons: L("futures", 4, ["Reading Futures Charts", "Volume and Open Interest", "The Commitments of Traders (COT) Report", "Seasonality in Commodities", "Spreads Between Contracts"]) },
      { id: "futures-u5", title: "Unit 5 — Strategies and Risk", lessons: L("futures", 5, ["Trend and Momentum in Futures", "Hedging an Existing Position", "Spread Trading", "Position Sizing With High Leverage", "The Psychology of Leveraged Trading", "Building Your Futures Trading Plan"]) },
    ],
  },

  // ==========================================================================
  // 5. COMMODITIES
  // ==========================================================================
  {
    id: "commodities",
    name: "Commodities",
    tagline: "The raw materials of the economy — metals, energy, and the things you can actually hold.",
    colors: { head: NEON.lime, unit: NEON.teal, lesson: NEON.yellow },
    units: [
      { id: "commodities-u1", title: "Unit 1 — What Commodities Are", lessons: L("commodities", 1, ["Hard vs. Soft Commodities", "Why Commodity Prices Matter to Everyone", "How People Actually Trade Commodities", "Spot, Futures, ETFs, and Physical", "The Honest Risk Talk for Commodities"]) },
      { id: "commodities-u2", title: "Unit 2 — Energy", lessons: L("commodities", 2, ["Crude Oil: The World's Most Watched Price", "WTI vs. Brent", "Natural Gas and Seasonality", "OPEC and Supply Shocks"]) },
      { id: "commodities-u3", title: "Unit 3 — Metals", lessons: L("commodities", 3, ["Gold: Safe Haven and Inflation Hedge", "Silver: The Volatile Cousin", "Industrial Metals: Copper as Dr. Copper", "Platinum and Palladium"]) },
      { id: "commodities-u4", title: "Unit 4 — Agriculture", lessons: L("commodities", 4, ["Grains: Corn, Wheat, Soybeans", "Softs: Coffee, Sugar, Cotton", "Livestock Markets", "Weather, Harvests, and Price"]) },
      { id: "commodities-u5", title: "Unit 5 — Analysis, Strategy, and Risk", lessons: L("commodities", 5, ["Supply and Demand Fundamentals", "Reading Commodity Charts", "Seasonality and Cycles", "Diversifying With Commodities", "Risk in a Volatile Asset Class", "Building Your Commodity Trading Plan"]) },
    ],
  },

  // ==========================================================================
  // 6. BONDS
  // ==========================================================================
  {
    id: "bonds",
    name: "Bonds & Fixed Income",
    tagline: "Lending money and getting paid for it — the quiet market that drives everything else.",
    colors: { head: NEON.blue, unit: NEON.teal, lesson: NEON.violet },
    units: [
      { id: "bonds-u1", title: "Unit 1 — What a Bond Is", lessons: L("bonds", 1, ["You Are the Lender Now", "Face Value, Coupon, and Maturity", "Why Governments and Companies Issue Bonds", "How You Make Money From Bonds", "The Honest Risk Talk for Bonds"]) },
      { id: "bonds-u2", title: "Unit 2 — Price, Yield, and the Relationship That Confuses Everyone", lessons: L("bonds", 2, ["Why Price and Yield Move Opposite", "Yield to Maturity Explained", "The Yield Curve and What It Predicts", "Duration and Interest Rate Risk", "Credit Risk and Default"]) },
      { id: "bonds-u3", title: "Unit 3 — The Types of Bonds", lessons: L("bonds", 3, ["Government Bonds and Treasuries", "Municipal Bonds", "Corporate Bonds: Investment Grade vs. Junk", "Inflation-Protected Bonds (TIPS)", "International and Emerging Market Debt"]) },
      { id: "bonds-u4", title: "Unit 4 — How Bonds Fit a Portfolio", lessons: L("bonds", 4, ["Bonds as Ballast", "Bond Ladders and Income Planning", "Bond ETFs and Funds", "Reading a Credit Rating", "Building Your Fixed-Income Plan"]) },
    ],
  },

  // ==========================================================================
  // 7. OPTIONS
  // ==========================================================================
  {
    id: "options",
    name: "Options",
    tagline: "The right, not the obligation — the most powerful and most misunderstood instrument in the market.",
    colors: { head: NEON.pink, unit: NEON.magenta, lesson: NEON.yellow },
    units: [
      { id: "options-u1", title: "Unit 1 — The Foundation", lessons: L("options", 1, ["Calls and Puts in Plain English", "The Right vs. the Obligation", "Strike Price, Premium, and Expiration", "In, At, and Out of the Money", "The Honest Risk Talk for Options"]) },
      { id: "options-u2", title: "Unit 2 — What Drives an Option's Price", lessons: L("options", 2, ["Intrinsic vs. Extrinsic Value", "Time Decay (Theta): Your Daily Cost", "Implied Volatility: The Fear Gauge", "The Greeks: Delta, Gamma, Theta, Vega", "Why Options Can Expire Worthless"]) },
      { id: "options-u3", title: "Unit 3 — Basic Strategies", lessons: L("options", 3, ["Buying Calls and Puts", "Covered Calls for Income", "Cash-Secured Puts", "Protective Puts as Insurance", "Choosing a Strike and Expiration"]) },
      { id: "options-u4", title: "Unit 4 — Spreads and Combinations", lessons: L("options", 4, ["Vertical Spreads", "Iron Condors and Range Trading", "Straddles and Strangles", "Calendar Spreads", "Defined Risk vs. Undefined Risk"]) },
      { id: "options-u5", title: "Unit 5 — Risk and Mindset", lessons: L("options", 5, ["Why Most Option Buyers Lose", "Position Sizing With Leverage", "Assignment and Early Exercise", "Managing a Trade That Goes Wrong", "Building Your Options Trading Plan"]) },
    ],
  },

  // ==========================================================================
  // 8. FUNDS
  // ==========================================================================
  {
    id: "funds",
    name: "Funds — ETFs & Mutual Funds",
    tagline: "Buying the whole basket — the simplest path to a diversified portfolio.",
    colors: { head: NEON.magenta, unit: NEON.violet, lesson: NEON.teal },
    units: [
      { id: "funds-u1", title: "Unit 1 — The Basket Idea", lessons: L("funds", 1, ["What a Fund Actually Holds", "Mutual Funds vs. ETFs", "Index Funds and Passive Investing", "Active Management and Its Cost", "The Honest Risk Talk for Funds"]) },
      { id: "funds-u2", title: "Unit 2 — How Funds Work", lessons: L("funds", 2, ["NAV, Share Price, and Premiums", "Expense Ratios: The Silent Fee", "How ETFs Trade Like Stocks", "Dividends, Distributions, and Reinvestment", "Tracking Error Explained"]) },
      { id: "funds-u3", title: "Unit 3 — The Types of Funds", lessons: L("funds", 3, ["Broad Market Index Funds", "Sector and Thematic ETFs", "Bond Funds", "International and Emerging Market Funds", "Leveraged and Inverse ETFs: Read the Warning Label", "Target-Date and All-in-One Funds"]) },
      { id: "funds-u4", title: "Unit 4 — Building a Portfolio", lessons: L("funds", 4, ["Asset Allocation Basics", "Diversification Done Right", "Rebalancing Over Time", "Dollar-Cost Averaging Into Funds", "Building Your Fund Portfolio Plan"]) },
    ],
  },

  // ==========================================================================
  // 9. INDICES
  // ==========================================================================
  {
    id: "indices",
    name: "Indices",
    tagline: "The market's scoreboard — what the S&P, Nasdaq, and Dow actually measure.",
    colors: { head: NEON.yellow, unit: NEON.orange, lesson: NEON.lime },
    units: [
      { id: "indices-u1", title: "Unit 1 — What an Index Is", lessons: L("indices", 1, ["A Number That Summarizes a Market", "Price-Weighted vs. Market-Cap-Weighted", "Why You Can't Buy an Index Directly", "Index Funds, ETFs, and Futures", "The Honest Risk Talk for Index Trading"]) },
      { id: "indices-u2", title: "Unit 2 — The Major Indices", lessons: L("indices", 2, ["The S&P 500: America's Benchmark", "The Nasdaq and the Tech Tilt", "The Dow Jones: The Old Guard", "The Russell 2000 and Small Caps", "Global Indices: FTSE, DAX, Nikkei, Hang Seng"]) },
      { id: "indices-u3", title: "Unit 3 — Trading and Investing With Indices", lessons: L("indices", 3, ["How Indices Get Rebalanced", "Reading Index Charts and Breadth", "Index Futures and CFDs", "Sector Indices and Rotation", "Volatility Indices: Understanding the VIX"]) },
      { id: "indices-u4", title: "Unit 4 — Strategy and Risk", lessons: L("indices", 4, ["Passive Index Investing", "Trading Index Trends", "Hedging With Index Products", "Risk in Leveraged Index Products", "Building Your Index Plan"]) },
    ],
  },

  // ==========================================================================
  // 10. ECONOMIC INDICATORS
  // ==========================================================================
  {
    id: "econ",
    name: "Economic Indicators",
    tagline: "The data that moves every market — learning to read the economy before it reacts.",
    colors: { head: NEON.teal, unit: NEON.blue, lesson: NEON.magenta },
    units: [
      { id: "econ-u1", title: "Unit 1 — Why the Data Matters", lessons: L("econ", 1, ["Markets Trade the Future, Data Reveals the Present", "Leading, Lagging, and Coincident Indicators", "The Economic Calendar as a Trading Tool", "Expectations vs. Actual: Why the Surprise Moves Price", "How to Read a Data Release Without Overreacting"]) },
      { id: "econ-u2", title: "Unit 2 — Growth and Output", lessons: L("econ", 2, ["GDP: The Big Picture", "Manufacturing and Services PMIs", "Retail Sales and the Consumer", "Industrial Production", "Housing Data"]) },
      { id: "econ-u3", title: "Unit 3 — Jobs and Inflation", lessons: L("econ", 3, ["The Monthly Jobs Report (Nonfarm Payrolls)", "Unemployment and Wage Growth", "CPI: Measuring Inflation", "PPI and Producer Prices", "The Fed's Preferred Gauge (PCE)"]) },
      { id: "econ-u4", title: "Unit 4 — Central Banks and Sentiment", lessons: L("econ", 4, ["Interest Rate Decisions and Statements", "Reading Central Bank Language", "Consumer Confidence and Sentiment Surveys", "The Yield Curve as a Recession Signal", "Putting It Together: A Macro Dashboard"]) },
    ],
  },
];

// Convenience lookups (used by the component and, later, the quiz layer).
export const getSchool = (id: string) => CURRICULUM.find((s) => s.id === id);
export const getUnit = (schoolId: string, unitId: string) =>
  getSchool(schoolId)?.units.find((u) => u.id === unitId);
