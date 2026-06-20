import React, { useState, useEffect } from 'react';
import { KnowledgeItem } from './KnowledgeBaseData';
import { 
  HelpCircle, 
  ChevronRight, 
  Play, 
  Calendar, 
  Lightbulb, 
  Info, 
  Compass, 
  Activity, 
  Coins, 
  TrendingUp, 
  Sparkles, 
  RefreshCw, 
  Layers, 
  Award, 
  Landmark, 
  AlertTriangle, 
  ArrowRight, 
  Zap, 
  ShoppingBag, 
  Briefcase, 
  Home, 
  Shuffle, 
  GraduationCap,
  Search,
  ArrowUpRight,
  ArrowDownRight,
  Sliders,
  Globe,
  Cpu,
  Boxes,
  Users,
  ShieldAlert,
  CheckCircle2
} from 'lucide-react';
import Markdown from 'react-markdown';

interface ViewerProps {
  item: KnowledgeItem;
  onNavigate?: (path: string) => void;
  activeFile?: string;
}

// Cinematic "Discover More" continuation items (Rabbit Holes for endless exploration)
const EXPLORATION_SUGGESTIONS = [
  { title: "Why Gold Prices Matter", path: "encyclopedia/economy/inflation.html", desc: "Discover how physical precious metals hedge against aggregate currency dilution." },
  { title: "How Banks Create Money", path: "encyclopedia/economy/banking.html", desc: "Trace how modern ledgers multiply credit without loading paper presses." },
  { title: "What Causes Recessions", path: "encyclopedia/economy/recession.html", desc: "Deconstruct how speculative balance-sheet bubbles spark systemic defaults." },
  { title: "Why Interest Rates Move Markets", path: "encyclopedia/economy/interest-rates.html", desc: "Analyze how rate thermostatic dials act as the ultimate gravity for stock indices." },
  { title: "Silicon Fab Lithographies", path: "encyclopedia/sectors/semiconductor-sector.html", desc: "Explore the nanometer bottlenecks of global ASML ultraviolet cleanrooms." },
  { title: "Federal Reserve Controls", path: "encyclopedia/economy/federal-reserve.html", desc: "Analyze the open market desks and discount window credit systems." }
];

const RELATED_TOPICS_MAP: Record<string, { title: string; path: string; connection: string }[]> = {
  'What Is Inflation?': [
    { title: 'How Interest Rates Work', path: 'encyclopedia/economy/interest-rates.html', connection: 'Interest rates act as policy gravity, compressing currency velocity to cool CPI.' },
    { title: 'The Federal Reserve', path: 'encyclopedia/economy/federal-reserve.html', connection: 'The Fed manages reserve supplies, maintaining open market liquidity levels.' },
    { title: 'What Causes Recessions?', path: 'encyclopedia/economy/recession.html', connection: 'Extreme credit contraction cycles decompress consumer demand bubbles.' },
    { title: 'Banking & Reserves', path: 'encyclopedia/economy/banking.html', connection: 'Fractional lending systems multiply active customer checking balances.' },
  ],
  'How Stocks Work': [
    { title: 'Technology & AI Sector', path: 'encyclopedia/sectors/ai-sector.html', connection: 'Tech indices represent high growth multiples backed by server capex.' },
    { title: 'Semiconductors & Lithography', path: 'encyclopedia/sectors/semiconductor-sector.html', connection: 'Microchip cleanroom fabrication limits set tech company revenues.' },
    { title: 'How Forex Works', path: 'encyclopedia/markets/forex.html', connection: 'Sovereign carry spreads shift multinational equity capital distributions.' },
    { title: 'Market Assets Hub', path: 'markets.html', connection: 'Explore public listings and continuous order book simulators.' },
  ],
  'The Federal Reserve': [
    { title: 'What Is Inflation?', path: 'encyclopedia/economy/inflation.html', connection: 'Fed actions are directly calibrated to keep CPI inflation anchored at 2%.' },
    { title: 'How Interest Rates Work', path: 'encyclopedia/economy/interest-rates.html', connection: 'Setting the base federal overnight target rate resets borrow costs.' },
    { title: 'Banking & Reserves', path: 'encyclopedia/economy/banking.html', connection: 'The Fed acts as the ultimate liquidity lender of last resort.' },
    { title: 'What Causes Recessions?', path: 'encyclopedia/economy/recession.html', connection: 'Fast rate tightening cycles risk popping speculative asset bubbles.' },
  ],
  'How Forex Works': [
    { title: 'The Federal Reserve', path: 'encyclopedia/economy/federal-reserve.html', connection: 'Fed rate hikes draw global investor funds, strengthening spot USD pair rates.' },
    { title: 'How Interest Rates Work', path: 'encyclopedia/economy/interest-rates.html', connection: 'Bilateral yield differentials drive major currency arbitrage flows.' },
    { title: 'Market Assets Hub', path: 'markets.html', connection: 'Trade fiat pairs directly using continuous exchange books.' },
  ],
  'What Causes Recessions?': [
    { title: 'The Federal Reserve', path: 'encyclopedia/economy/federal-reserve.html', connection: 'Maintains emergency discount windows to salvage systemic bank runs.' },
    { title: 'What Is Inflation?', path: 'encyclopedia/economy/inflation.html', connection: 'Recession cycles freeze velocity, cooling aggregate consumer pricing.' },
    { title: 'Banking & Reserves', path: 'encyclopedia/economy/banking.html', connection: 'Banks pull active credit lines to guard balance sheet reserves.' },
  ],
  'What Is GDP?': [
    { title: 'What Is Inflation?', path: 'encyclopedia/economy/inflation.html', connection: 'Real GDP tracks aggregate physical output, discounting price inflation spikes.' },
    { title: 'What Causes Recessions?', path: 'encyclopedia/economy/recession.html', connection: 'Two successive quarters of negative real production defines a contraction.' },
  ],
  'How Interest Rates Work': [
    { title: 'The Federal Reserve', path: 'encyclopedia/economy/federal-reserve.html', connection: 'Overnight interest rates form the base price gravity anchor for capital.' },
    { title: 'What Is Inflation?', path: 'encyclopedia/economy/inflation.html', connection: 'Spiking rates pulls spending cash out, helping cool grocery prices.' },
    { title: 'Banking & Reserves', path: 'encyclopedia/economy/banking.html', connection: 'Sets the baseline yield margin commercial lenders pay physical savers.' },
    { title: 'What Causes Recessions?', path: 'encyclopedia/economy/recession.html', connection: 'High rate payments reduce corporate expansion budgets, cooling jobs.' },
  ],
  'Banking & Reserves': [
    { title: 'The Federal Reserve', path: 'encyclopedia/economy/federal-reserve.html', connection: 'Commercial clearances settle overnight using clearing accounts at the Fed.' },
    { title: 'How Interest Rates Work', path: 'encyclopedia/economy/interest-rates.html', connection: 'Dictates the spread margins banks capture when matching loans to savers.' },
    { title: 'What Causes Recessions?', path: 'encyclopedia/economy/recession.html', connection: 'Defaults devalue bank loan books, causing credit freezes.' },
  ],
  'Technology & AI': [
    { title: 'Semiconductors & Lithography', path: 'encyclopedia/sectors/semiconductor-sector.html', connection: 'EUV lithography prints the GPU machine architectures powering neural chips.' },
    { title: 'How Stocks Work', path: 'encyclopedia/markets/stocks.html', connection: 'AI breakthroughs fuel speculation, raising stock multiples and capital markets.' },
  ],
  'Semiconductors & Lithography': [
    { title: 'Technology & AI Sector', path: 'encyclopedia/sectors/ai-sector.html', connection: 'Supplies the hardware processing processing cycles necessary for training LLMs.' },
    { title: 'How Stocks Work', path: 'encyclopedia/markets/stocks.html', connection: 'Sells printed wafer assets to tech conglomerates, boosting equity floats.' },
  ],
  'Banking & Credit': [
    { title: 'Banking & Reserves', path: 'encyclopedia/economy/banking.html', connection: 'Fractional ledger limits dictate total credit lending expansions.' },
    { title: 'How Interest Rates Work', path: 'encyclopedia/economy/interest-rates.html', connection: 'Governs are cost of renting intertemporal cash from depositors.' },
  ],
  'Sovereign Energy': [
    { title: 'Commodities Real Assets', path: 'encyclopedia/markets/commodities.html', connection: 'Grude oil and natural gas trade on standardized commodity boards.' },
    { title: 'What Is Inflation?', path: 'encyclopedia/economy/inflation.html', connection: 'Fuel increases translate directly as transportation and manufacturing cost-push CPI.' },
  ]
};

// Rich dynamic datasets mapping all central encyclopedia topics to high-fidelity interactive sections
const ENRICHED_DATA: Record<string, {
  beginnerText: string;
  intermediateText: string;
  advancedText: string;
  connections: { title: string; desc: string; type: 'grocery' | 'job' | 'rent' }[];
  causalFlow: { step: string; effect: string; direction: 'up' | 'down' | 'neutral' }[];
  precedents: { year: string; name: string; impact: string; lesson: string }[];
}> = {
  'What Is Inflation?': {
    beginnerText: "Imagine your school has a small store that sells bubblegum for tokens. If the teacher suddenly prints and hands every student 1,000 extra free tokens but doesn't add any more bubblegum to the shelves, everyone will offer more tokens for the remaining pieces. The bubblegum didn't get any bigger or tastier—your tokens just lost some of their purchasing power. That's inflation! 🎈",
    intermediateText: "Inflation represents a steady rise in retail prices across the general economy (groceries, gasoline, milk, rent). It occurs when the quantity of cash circulating grows faster than the physical items or services businesses can put on shelves. As product stickers go up, your weekly paycheck buys fewer goods, representing a drop in your 'purchasing power.'",
    advancedText: "Inflation is analyzed as a multi-variable macroeconomic monetary vector modeled through Demand-Pull (aggregate public demand outrunning physical production curves) and Cost-Push (surging raw fuel, metal, or trade labor tariffs pushing margins upstream). Central banks aim for hard 2% targets using core deflators (Core PCE) to adjust the monetary supply base.",
    connections: [
      { title: "Groceries & Gasoline", desc: "Energy prices spike, directly transferring fuel shipping transport costs onto the supermarket tags of your milk, bread, and fruits.", type: 'grocery' },
      { title: "Weekly Wages & Savings", desc: "If your employer doesn't adjust your wage to match inflation, you take an index wage-cut. Savings left in low-interest checking accounts slow lose purchasing value.", type: 'job' },
      { title: "Mortgages & Monthly Rent", desc: "Landlords lift rental agreements to preserve their yield against currency dilution. Real-estate values tend to increase as hard assets tracking currency base.", type: 'rent' }
    ],
    causalFlow: [
      { step: "Reserve Injection", effect: "Central Bank buys sovereign bonds, flooding bank vault slots with reserves.", direction: 'up' },
      { step: "Credit Expansion", effect: "Middleman commercial banks issue cheaper credit card limits and mortgages.", direction: 'up' },
      { step: "Demand Spurr", effect: "Aggregate citizens use available credit tag to bid for items and cars.", direction: 'up' },
      { step: "Supply Bottleneck", effect: "Seas ports, manufacturing fab plants and truck drivers max out capacity.", direction: 'neutral' },
      { step: "Retail Price Spike", effect: "Store managers raise nominal sticker tags to clear out limited inventory slots.", direction: 'up' },
      { step: "Underwriting Hike", effect: "Federal Reserve lifts benchmark interest targets, cooling borrowing lines.", direction: 'up' }
    ],
    precedents: [
      { year: "1946", name: "Hungarian Hyperinflation", impact: "Household prices doubled every 15 hours after war damage collapsed factories.", lesson: "Injecting printed currency notes during absolute productivity collapse destroys the currency." },
      { year: "1973", name: "The OPEC Oil Embargo Shock", impact: "Middle-East export caps spiked crude transport fuel, sending inflation to 12%.", lesson: "Real physical resource scarcity can instantly push prices up, even with tight money." },
      { year: "2022", name: "Post-Pandemic Helicopters Boost", impact: "Generous household stimulus cash matched with clogged ocean freight sent CPI to 9.1%.", lesson: "Expanding currency pools during global supply chain contractions guarantees aggregate price surges." }
    ]
  },
  'How Stocks Work': {
    beginnerText: "Think of a stock like a ticket to a private treehouse club. If 100 kids put in candy to build the club, each kid gets 1 ticket representing 1/100th of the treehouse. If the club sells successful cups of lemonade to others, the club gets popular. Now, other children will offer 10 candy bars to buy your single ticket! You can trade it and profit. 📊",
    intermediateText: "Public stocks are fractional ownership shares of corporations. Buying a share of stock makes you a tiny owner. If the firm design successful apps, generates high sales, or distributes profits (dividends), your share value increases. If the business falls behind competitors or files for bankruptcy, your shares can lose most of their value.",
    advancedText: "Equities act as perpetual call options on corporate residual capital. Under standard Discounted Cash Flow (DCF) templates, the share price represents the sum of future enterprise free cash flows discounted to present value through risk-weighted hurdle rates. Firms utilize public equity floats to secure capital without committing to bankruptcy-risk debt service.",
    connections: [
      { title: "Brand Spending", desc: "Allows consumers to capture financial appreciation from the exact retail brands they buy items from (like Apple or Amazon).", type: 'grocery' },
      { title: "Tech Compensation Options", desc: "Corporate giants pay key engineers inside restricted stock units (RSUs), aligning wage labor directly with shareholder asset valuation.", type: 'job' },
      { title: "Family Retirement Accounts", desc: "Retirement savings portfolios (401ks, pension pots) are invested inside S&P index trackers to outpace currency inflation rules.", type: 'rent' }
    ],
    causalFlow: [
      { step: "Secure Venture IPO", effect: "Operating firm issues fractional shares to public broker accounts to secure cash.", direction: 'up' },
      { step: "Quarterly Gains Peak", effect: "Earnings sheets outperform street expectations, inflating cash margins.", direction: 'up' },
      { step: "Treasury Buyback wave", effect: "Company buys back its own stock, shrinking outstanding float coordinates.", direction: 'up' },
      { step: "Yield Multiplier Lift", effect: "Discount DCF models calculate higher present value limits.", direction: 'up' },
      { step: "Global Index Tracker Inflow", effect: "Traders and pension boards rebalance capital directly into the stock.", direction: 'up' }
    ],
    precedents: [
      { year: "1602", name: "Amsterdam VOC Incorporation", impact: "Dutch East India Company pioneers public shares to fund international cargo fleets.", lesson: "Fractional risk-sharing is the ultimate engine allowing societies to pool capital for global trade." },
      { year: "1929", name: "The Buttonwood Wall Crash", impact: "Speculators buying stocks on unchecked 90% margin collapsed bank systems.", lesson: "Highly leveraged asset purchases create severe systemic margin call liquidations." },
      { year: "2000", name: "The Dot-Com Valuation Pop", impact: "Speculative startups with zero cash sales crashed 80% once capital locked.", lesson: "Corporate value must always relate to true net margins; speculative hype has a firm limit." }
    ]
  },
  'The Federal Reserve': {
    beginnerText: "The Federal Reserve is like the principal of all the banks. Normal families cannot bank there. Instead, the Fed watches the bank playground, prints the paper dollars, sets the rules for teacher banks (like Chase or Wells Fargo), and makes sure banks don't run completely out of cash during high-lunch holiday rushes! 🏦",
    intermediateText: "The Federal Reserve is the sovereign central bank of the United States. Its job is to maintain standard price bounds and maximize employment. It acts as an economic thermostat: if the economy slows down, the Fed lowers interest rates to spur credit. If inflation spikes, the Fed hikes rates to cool corporate borrow schemes.",
    advancedText: "The Fed regulates monetary policy. The Federal Open Market Committee (FOMC) manages reserve supplies by setting Interest on Reserve Balances (IORB) to anchor overnight reserve rates, executing Open Market Operations (bonds swaps), and supplying emergency Discount Window emergency collateral lending.",
    connections: [
      { title: "Stable Price Goals", desc: "Actions dictate currency supply, deciding whether gas and grocery prices remain stable or spiral.", type: 'grocery' },
      { title: "Company Job Markets", desc: "When the Fed lowers rates, cheap business credit lines expand, prompting companies to launch hiring pipelines.", type: 'job' },
      { title: "Bank Mortgage Interest", desc: "Rate benchmark hikes directly increase bank credit card interest rates, car payments, and 30-year home mortgages.", type: 'rent' }
    ],
    causalFlow: [
      { step: "Underlying CPI Runaway", effect: "Consumer index indicators expand past the target stable boundary.", direction: 'up' },
      { step: "FOMC Policy Vote", effect: "Fed Governors shift interest target corridors upward on trading desks.", direction: 'up' },
      { step: "Overnight Reserves Surge", effect: "Reserve borrow rates spike between depository clearing banks.", direction: 'up' },
      { step: "Harden Bank Policy", effect: "Lenders elevate the interest rate quotes offered to developers and home buyers.", direction: 'up' },
      { step: "Dampen Public Credit", effect: "M2 expansion slows as home buyers and business credit requests drop off.", direction: 'down' },
      { step: "Price Benchmark Recovery", effect: "Inflation pressures cool down toward standard equilibrium paths.", direction: 'down' }
    ],
    precedents: [
      { year: "1913", name: "Federal Reserve Act Formation", impact: "President Wilson signs central bank board to halt seasonal bank-run panics.", lesson: "Elastic currency supplies and a secure lender of last resort prevent complete credit freezes." },
      { year: "1979", name: "The Volcker Rate Shocks", impact: "Volcker raised target funds rates to 20%, halting runaways at the expense of a sharp recession.", lesson: "Anchoring long-term price targets requires rigid short-term policy determination." },
      { year: "2020", name: "Uncapped Asset Buying", impact: "Fed purchased trillions in corporate and sovereign debt to cushion lockdowns.", lesson: "Emergency liquidity saves systems nearterm but expands long-term wealth assets bubbles." }
    ]
  },
  'How Forex Works': {
    beginnerText: "Before you fly overseas, you have to trade your home dollar paper for local cash. Foreign Exchange (Forex) is like a gigantic global swap playground where banks trade Japanese Yen, British Pounds, and US Dollars all day, arguing over how many Yen match a single gold dollar! 💵",
    intermediateText: "Forex is the global marketplace where sovereign national currencies are swapped continuously. Conversion values move based on export stability, national trade balances, and central bank interest rates. High interest payouts attract global funds, driving up spot exchange auctions for that nation's currency.",
    advancedText: "Forex functions over decentralized global OTC networks. Valuation settles around Purchasing Power Parity (PPP—relative goods index basket parity) and Interest Rate Parity (IRP—ensuring yield differentials match forward swap spreads, preventing risk-free cross-border carry trades on treasury bonds).",
    connections: [
      { title: "Import Goods Checkout", desc: "A strong domestic currency makes imported cheeses, cars, and overseas vacation flights highly affordable for citizens.", type: 'grocery' },
      { title: "Factory Export Payrolls", desc: "If your currency becomes overly strong, foreign buyers find your exports expensive. That dampens local assembly jobs.", type: 'job' },
      { title: "Energy Import Logistics", desc: "Bilateral conversion moves dictate if your fuel refineries import crude energy barrels on favorable or inflated terms.", type: 'rent' }
    ],
    causalFlow: [
      { step: "Yield Spread expansion", effect: "Domestic interest curves elevated above global neighbor rates.", direction: 'up' },
      { step: "Bond SpecDesk Demand", effect: "Multinational desks dump zero-yield foreign bills to acquire local treasury notes.", direction: 'up' },
      { step: "Spot converted Auctions", effect: "Large volume sells of JPY or EUR clear on OTC desks to secure domestic currency.", direction: 'up' },
      { step: "Settle bilat Spot rate", effect: "The fiat currency pair adjusts, strengthening the domestic exchange parity.", direction: 'up' },
      { step: "Import Cost Drop", effect: "Cheaper overseas logistics filter into consumer indices, softening domestic CPI.", direction: 'down' }
    ],
    precedents: [
      { year: "1944", name: "The Bretton Woods Standard", impact: "Global boards align currencies to USD, which pegs to physical gold reserves.", lesson: "International trade stabilizes when anchored to a single highly liquid reserve custodian." },
      { year: "1971", name: "Nixon Shock Pure Floating", impact: "Gold convertibility dissolved, starting the modern era of pure free-floating fiat assets.", lesson: "Sovereign exchange coordinates adjust entirely on trade deficits and central deposit rates." },
      { year: "1992", name: "Black Wednesday George Soros", impact: "Speculative desk shorted British Pound ERM pegs, forcing a sudden devaluing.", lesson: "Central banks cannot defend an artificial currency peg when base reserves are exhausted." }
    ]
  },
  'What Causes Recessions?': {
    beginnerText: "Imagine your neighborhood is playing a huge, fast game of spending tag. As long as children spend tokens, the game runs fast. But if key players get scared about their credit card debts, they suddenly stop playing. Lemonade stands close, parents cut allowances, and everyone sits very quiet in their rooms! 🪂",
    intermediateText: "Recessions are dramatic slowdowns in the economic system lasting several quarters. They are triggered when bubbles (like tech hype or over-leveraged housing loans) pop. To recover, household focus on paying down credit card balances instead of shopping. Businesses sell fewer items, prompting layoffs and a hiring freeze.",
    advancedText: "Recessions occur when balance-sheet repair cycles invoke systemic GDP contractions. Triggered by Irving Fisher's Debt-Deflation mechanics: as over-leveraged agents cut spending to pay obligations, aggregate spending tracks down, which means aggregate corporate revenues sink. Money velocity contracts as commercial bank reserves freeze.",
    connections: [
      { title: "Budget Food Baskets", desc: "Supermarket receipts tilt towards discount grocery item catalogs as household budgets contract to defend cash.", type: 'grocery' },
      { title: "Corporate Hires Freeze", desc: "Corporate margin contractions trigger staff layoffs. New job posts freeze, making job search highly competitive.", type: 'job' },
      { title: "Rent Adjustments Down", desc: "Rental vacancies expand, forcing landlords to lower monthly rental quotes to secure liquid, safe checking tenants.", type: 'rent' }
    ],
    causalFlow: [
      { step: "Speculative multi Pop", effect: "Over-valued housing or stock asset pools suffer quick repricing.", direction: 'down' },
      { step: "Margin Default Cascades", effect: "Sovereign borrowers fail to support aggregate interest bills.", direction: 'up' },
      { step: "Commercial Loan Lock", effect: "Bank panels restrict borrowing guidelines to preserve base liquid asset boxes.", direction: 'down' },
      { step: "Slash discretionary buys", effect: "Families stop purchasing non-essentials in order to build savings.", direction: 'down' },
      { step: "Layoffs in Heavy Industry", effect: "Sales drops force corporate downsizing, raising nationwide jobless claims.", direction: 'up' },
      { step: "GDP Multiplier contraction", effect: "Systemic economic activity contracts, starting defensive downcycles.", direction: 'down' }
    ],
    precedents: [
      { year: "1929", name: "The Great Depression", impact: "Deprived of deposit insurance, 9,000 banks folded, halting 25% of jobs.", lesson: "Guarding depository trust is absolutely necessary to prevent severe economic collapse." },
      { year: "2008", name: "The Subprime Housing Deflation", impact: "Complex mortgage derivatives defaulted, locking interbank credit networks worldwide.", lesson: "Shattered bank asset sheets freeze credit and real-world trade instantly." },
      { year: "2020", name: "The COVID Lockdowns Shock", impact: "Immediate physical boundary closures created the sharpest, quickest GDP contraction.", lesson: "Economic status requires continuous movement; shutting transactions forces instant recession." }
    ]
  },
  'What Is GDP?': {
    beginnerText: "GDP is like the master scoreboard for our national team's output. If you add up the value of every single slice of pizza, physical car built, video game coded, haircut given, and house constructed in our country this year—that total price tag is our GDP! 🏆",
    intermediateText: "GDP (Gross Domestic Product) is the standard metric to track if an economy is growing or shrinking. It represents the total dollar card of all physical items and services sold inside a nation's borders in a year. Expanded GDP translates to corporate sales gains, hiring loops, and strong tax reserves.",
    advancedText: "GDP is tracked under standard national accounts via the formula GDP = C (Consumer Spending) + I (Business Capital Investment) + G (Government Spending) + Net Exports (Exports minus Imports). Real GDP adjusts nominal statistics for inflation, isolating actual production volume changes.",
    connections: [
      { title: "Product Abundance", desc: "High-producing GDP tracks ensure your retail shelves are filled with diverse food, tech, and healthcare choices.", type: 'grocery' },
      { title: "Competitive Salary Growth", desc: "When real GDP climbs, companies compete for engineers and professionals, raising baseline worker pay grades.", type: 'job' },
      { title: "Infrastructure & Parks", desc: "Strong GDP generation produces reliable public taxes, funding highways, high-speed rail, clean water, and city libraries.", type: 'rent' }
    ],
    causalFlow: [
      { step: "Household Wage gains", effect: "Full employment elevates household disposable bank balances.", direction: 'up' },
      { step: "Consumer Shopping boost", effect: "Families spend cash at checkout lanes, dealerships, and tourism spots.", direction: 'up' },
      { step: "Corporate Capex expand", effect: "Firms purchase logistical trucks, assembly robots, and servers.", direction: 'up' },
      { step: "Trade Net Additions", effect: "Local high-tech and agricultural export orders surpass foreign imports.", direction: 'up' },
      { step: "Output Scale Peak", effect: "Real Gross Domestic Product reports strong, compounding macro growth.", direction: 'up' }
    ],
    precedents: [
      { year: "1934", name: "Kuznets National Accounting", impact: "Simon Kuznets outlines unified accounting matrices for the US Congress.", lesson: "Without a standard output metric, a nation cannot gauge economic success." },
      { year: "1944", name: "Bretton Woods Adoption", impact: "Agencies select real GDP as the core benchmark to rank global weight.", lesson: "Macro capacity and industrial assembly define sovereign strength, surpassing raw land size." }
    ]
  },
  'How Interest Rates Work': {
    beginnerText: "Interest rates are like the rental fee for a suitcase of money. If you borrow money to build a cool treehouse, the bank doesn't lend for free. They charge a fee, say $5 extra on a $100 loan. If that rental fee is high, you'll wait on buying wood or building that slides system! ⚡",
    intermediateText: "Interest rates represent the baseline price of renting money. Low interest rates make car loans, college credit, and home mortgages cheap, encouraging shopping. High interest rates make borrowing expensive, cooling spending, but pay savings accounts well, prompting citizens to conserve cash.",
    advancedText: "Interest rates balance intertemporal capital pricing. Rate changes transmit directly onto asset valuations. When risk-free treasuries pay a high yield, investors exit speculative equity shares or real estate, establishing asset gravity bounds.",
    connections: [
      { title: "Supermarket Prices", desc: "Elevated rates choke credit velocity, helping grocery stickers cool back to standard, stable trends.", type: 'grocery' },
      { title: "Hiring Budgets", desc: "Prudent corporations freeze expansion hiring as credit costs spike, cooling worker bidding wars.", type: 'job' },
      { title: "Home Buyer Mortgages", desc: "Spiking mortgage interest rates can double monthly payments, cooling bidding wars and flatlining home prices.", type: 'rent' }
    ],
    causalFlow: [
      { step: "Central policy adjustment", effect: "The Fed lifts target overnight rate benchmarks to combat high CPI.", direction: 'up' },
      { step: "Middleman rate elevation", effect: "Banks raise corporate loan quotes and household credit rates.", direction: 'up' },
      { step: "Borrowing slows down", effect: "Firms freeze logistics expansions and buyers postpone 30-year mortgages.", direction: 'down' },
      { step: "Saver checking surge", effect: "Deposit accounts pay 5%, taking liquid consumer cash out of active stores.", direction: 'up' },
      { step: "Asset Bubble Cool", effect: "With treasuries paying guaranteed returns, tech multiples and stock prices drop.", direction: 'down' }
    ],
    precedents: [
      { year: "BC-1750", name: "The Babylonian Hammurabi Code", impact: "Early laws set maximum interest limits (grain loans capped at 33.3%).", lesson: "Human civilizations have always restricted moneylenders to preserve borrower stability." },
      { year: "2016", name: "European Negative Interest Rates", impact: "ECB charged savers storage fees (-0.50%) to force reserves out into the economy.", lesson: "Monetary extremes can swap traditional rules, penalizing depositors to force credit allocation." },
      { year: "2022", name: "The Post-Pandemic Rate Hikes", impact: "Fed completed the quickest hike cycle on record, moving rates from 0% to 5.25%.", lesson: "Thermostatic rate hikes remain the ultimate tool to arrest runaway asset price bubbles." }
    ]
  },
  'Banking & Reserves': {
    beginnerText: "If you deposit $10 in a bank checking card, they do not hold your exact paper bill in a vault. They set aside $1 for safety and rent out the other $9 to a builder. Now, your account says $10, and the builder's account says $9. The bank created digital coins out of thin air! 🏦",
    intermediateText: "Commercial banks create most of our money supply. Under fractional reserve Plumbings, whenever a bank issues a mortgage or business credit lines, they don't locate existing savings. Instead, they write digital dollars into the borrower's account, expanding M2 money balances instantly.",
    advancedText: "Commercial banks are endogenous cash creators. Public loans originate deposits, not the other way around. Lenders utilize reserve balances exclusively on overnight interbank clearance systems (like Fedwire) to settle daily balances.",
    connections: [
      { title: "Credit Card Checkout", desc: "Commercial banking card processors clear retail purchases instantly, keeping checkout lines fast.", type: 'grocery' },
      { title: "Hiring cash Flow lines", desc: "Corporate working capital credit lines support staff payrolls before client invoice checks settle.", type: 'job' },
      { title: "Home buy Loans", desc: "Supplies the massive mortgage leverage required to acquire property, defining neighborhood home pricing.", type: 'rent' }
    ],
    causalFlow: [
      { step: "Log customer deposit", effect: "Saver places cash notes inside bank checking ledgers.", direction: 'up' },
      { step: "Secure Reserve Margin", effect: "Central Bank holds a fraction of reserves for overnight interbank security.", direction: 'neutral' },
      { step: "Draw digital Credits", effect: "Bank credits corporate borrower files with $9,000 for server upgrades.", direction: 'up' },
      { step: "Broad M2 Multiplication", effect: "Systemic circulating money expands without printing physical sheets.", direction: 'up' },
      { step: "Overnight settlement check", effect: "Middleman nodes settle daily changes using reserve accounts.", direction: 'neutral' }
    ],
    precedents: [
      { year: "1397", name: "Medici Bank Double Entry", impact: "Italian network standardizes ledger books, launching Renaissance trading loops.", lesson: "Standard bookkeeping ledger structures form the software code of capitalism." },
      { year: "1694", name: "Bank of England Crown Bills", impact: "First joint-stock central bank issues public debt notes to fund royal defense.", lesson: "Central banks and sovereign liability emissions are historically intertwined." },
      { year: "2023", name: "Silicon Valley Bank run", impact: "Digital balance transfers triggered a $42B run in 10 hours, collapsing SVB.", lesson: "Instant tech transfers compress panic windows, requiring instant reserve defenses." }
    ]
  },
  'Commodities Real Assets': {
    beginnerText: "Commodities are hard physical things you can kick: sticky black oil, gold bricks, and massive trucks of yellow wheat. While a politician can print billions of paper dollars in seconds, they cannot print a single barrel of energy or a single ounce of gold! 🪙",
    intermediateText: "Commodities are raw global resources (crude oil, natural gas, gold, copper, corn) traded on standard boards. Since their volume is constrained by geography, mining limits, and weather, shortages spike energy pricing, transferring directly to groceries and gas.",
    advancedText: "Commodity pricing correlates with actual supply scrap margins and physical capex cycles. Value schedules trade under Contango (forward futures cost exceed spot, tracking storage fees) or Backwardation (spot premiums surge, indicating near-term physical depletion).",
    connections: [
      { title: "Gas Station Gas costs", desc: "Decide daily crude benchmark pricing, dictating if families pay $3 or $5 a gallon for commute trips.", type: 'grocery' },
      { title: "Raw Material Overhead", desc: "Steel and copper prices set assembly costs, forcing builders to adjust staff hiring slots.", type: 'job' },
      { title: "Utility Heating Fees", desc: "Natural gas pipeline supplies determine monthly household utility grids heating rate bills.", type: 'rent' }
    ],
    causalFlow: [
      { step: "Supply pipeline block", effect: "Geopolitical tensions lock shipping canals or fuel pipeline networks.", direction: 'down' },
      { step: "Storage stock depletion", effect: "Physical commodity stockpiles slip beneath moving averages.", direction: 'down' },
      { step: "futures auction spikes", effect: "Commodity desk traders bid up near-term physical delivery certificates.", direction: 'up' },
      { step: "Gas station Stick Shock", effect: "Energy costs increase shipping container rates, raising supermarket prices.", direction: 'up' },
      { step: "Cost push inflation peak", effect: "Consumers spend extra on base necessities, compressing discretionary margins.", direction: 'up' }
    ],
    precedents: [
      { year: "1730s", name: "Dojima Rice Derivatives", impact: "Osaka samurai design cash-settled futures to guard crop prices.", lesson: "Forward contracts stabilize crop pricing against volatile autumn typhoons." },
      { year: "1973", name: "Sovereign OPEC Embargo", impact: "Hydrocarbon embargo spiked crude 400%, creating fuel queues globally.", lesson: "Thermodynamic input control remains the ultimate geopolitical card in macroeconomics." }
    ]
  },
  'Crypto Ecosystems': {
    beginnerText: "Imagine a big notebook where everyone writes who owns what chocolate bar. Instead of letting one person keep the notebook (who could cheat or erase it), every kid keeps an exact copy in their backpack. If a kid tries to cheat, everyone's copies prove him wrong instantly! 💻",
    intermediateText: "Cryptocurrencies are digital money registries operating on global computer networks (blockchains). They eliminate central banks and paper records, relying instead on cryptographic math to secure currency supplies (like Bitcoin's 21 million limit) from inflation.",
    advancedText: "Cryp assets run peer-to-peer consensus ledgers. Proof-of-Work (PoW) locks transactions via energy-burning computations, while Proof-of-Stake (PoS) locks validation via capital stake margins, allowing smart contracts to compile trustless terms.",
    connections: [
      { title: "Borderless Payments", desc: "Gig platform developers and designers accept global freelance payouts instantly with zero bank delays.", type: 'grocery' },
      { title: "Smart Contract Career", desc: "Thousands of tech team engineers focus on compiling Solidity code networks, creating parallel finance rules.", type: 'job' },
      { title: "Inflation hedging asset", desc: "Citizens tracking hyperinflating fiat regimes swap wages into dollar-pegged stablecoins to protect purchasing power.", type: 'rent' }
    ],
    causalFlow: [
      { step: "Cryptographic work solve", effect: "Parallel chips guesses randomized hash sequences to validate blocks.", direction: 'neutral' },
      { step: "Decentralized state updates", effect: "All nodes synchronize ledger records simultaneously.", direction: 'up' },
      { step: "Local cash fleeing", effect: "Inflation-strained households swap paper currency for borderless tokens.", direction: 'up' },
      { step: "Automatic code settlements", effect: "DeFi liquidity pools execute programmatic token loans without banks.", direction: 'up' },
      { step: "Regulatory Auditing", effect: "National boards track transactions, requiring full USD stablecoin reserves.", direction: 'neutral' }
    ],
    precedents: [
      { year: "2008", name: "Satoshi Bitcoin Release", impact: "An anonymous author introduces cryptographic un-inflatable peer ledger code.", lesson: "Absolute digital scarcity can be maintained purely through decentralized consensus code." },
      { year: "2015", name: "Ethereum State Turing launch", impact: "Vitalik Buterin enables self-executing software inside host ledgers, making DeFi active.", lesson: "Lenders and developers can write software agreements on borderless databases with zero corporate gates." }
    ]
  }
};

// Default rich mapping for industry sectors
const SECTOR_FALLBACK_INFO: Record<string, typeof ENRICHED_DATA['What Is Inflation?']> = {
  'Technology & AI': {
    beginnerText: "Think of AI like designing a virtual brain. Instead of typing individual rules, we feed the computer millions of examples, and it learns to spot patterns—writing essays, coding games, and drawing images in seconds! 🧠",
    intermediateText: "The technology and AI sector is the fastest-growing part of the digital economy. It focuses on large machine learning models, cloud computing infrastructure, and automation of office workflows, transforming how businesses operate.",
    advancedText: "Modern AI systems scale through compute laws. Advancements correspond to parallel floating-point operations (FLOPs), high-bandwidth memory (HBM), and power grid allocations, shifting standard software from deterministic logic to probabilistic induction models.",
    connections: [
      { title: "Daily Tech Apps", desc: "Smart AI assistants speed up draft writing, code searches, and creative imagery downloads for everyone.", type: 'grocery' },
      { title: "Model Training Jobs", desc: "Tech corporations hire millions of cleanroom silicon engineers, quantitative model builders, and data labelers.", type: 'job' },
      { title: "Cloud Server Landlords", desc: "Enterprise datacenters rent compute arrays to startups on multi-year lease plans, inflating local server space rates.", type: 'rent' }
    ],
    causalFlow: [
      { step: "Model Architecture Debut", effect: "AI researchers design parallel transformer configurations.", direction: 'up' },
      { step: "Compute Infrastructure Boom", effect: "Cloud giants buy advanced processing units to assemble data farms.", direction: 'up' },
      { step: "Enterprise Implementation", effect: "Sectors run automatic scripts to trim database labor overheads.", direction: 'up' },
      { step: "Electricity Demands Spike", effect: "Datacenter server complexes draw high voltage grids power, taxing utilities.", direction: 'up' },
      { step: "Sovereign Security Guards", effect: "Agencies compile copyright rules and draft chip export bounds.", direction: 'neutral' }
    ],
    precedents: [
      { year: "1956", name: "Dartmouth Workshop", impact: "Computer scientists establish the term 'Artificial Intelligence,' launching standard research.", lesson: "Logical pattern modeling was foreseen decades before physical processing chips could host it." },
      { year: "2017", name: "The Transformer Paper", impact: "Researchers launch parallel computing attention networks, sparking modern LLMs.", lesson: "Structural software breakthroughs scale exponentially when matched with parallel silicon chips." }
    ]
  },
  'Semiconductors & Lithography': {
    beginnerText: "Imagine printing a micro-maze that is thousands of times thinner than a single hair onto flat glass plates using a highly advanced laser beam. That's a microchip cleanroom! ⚡",
    intermediateText: "Every phone, car, and neural cluster runs on silicon microchips. Advanced fabrications utilize Extreme Ultraviolet (EUV) lithography machines to print circuits, requiring massive cleanrooms and clean environments.",
    advancedText: "Semiconductor cleanliness is governed by Extreme Ultraviolet (EUV) light wavelengths. The steep capital barriers (lithography tools exceed $350M each) limit the foundry supply chain to a tiny handful of regional foundries.",
    connections: [
      { title: "Phone & Computer cost", desc: "Determined by nanometer silicon wafer yields, fluctuating retail prices during chip deficits.", type: 'grocery' },
      { title: "Wafer Engineering Careers", desc: "Cleanroom material scientists and precision circuit optics engineers command premium corporate pays.", type: 'job' },
      { title: "Local cleanroom real estate", desc: "Gigafactories absorb massive acres, boosting surrounding commercial property valuations.", type: 'rent' }
    ],
    causalFlow: [
      { step: "Lithography circuit shrink", effect: "Architects design paths approaching single-digit nanometer bounds.", direction: 'neutral' },
      { step: "EUV Laser Exposure", effect: "Ultra-precise lithography tools etch mazy silicon configurations under vacuum chambers.", direction: 'up' },
      { step: "Cleanroom validation", effect: "Wafers are sliced, polished and packed under strict aerosol air filtration.", direction: 'neutral' },
      { step: "Supply transit allocation", effect: "Chips flow to auto assemblies, server datacenters, and phone builders.", direction: 'up' },
      { step: "Macro computing gains", effect: "Sectors receive physical compute assets to scale model operations.", direction: 'up' }
    ],
    precedents: [
      { year: "1947", name: "Bell Labs Transistor Strike", impact: "Solid-state silicon switches replace warm vacuum tubes, launching microcomputing.", lesson: "Physical base material switches drive all downstream software and economic scale." },
      { year: "1987", name: "TSMC Foundry Model", impact: "Taiwan semiconductor fab opens, letting designers outsource hardware printing.", lesson: "Specialized fabrication cleanrooms create massive economies of scale and geopolitical hubs." }
    ]
  }
};

// ==========================================
// INTERACTIVE FINANCIAL DIRECTORY DATA DECK
// ==========================================
const DIRECTORIES_DATA_MAP = {
  stocks: [
    { id: 'AAPL', name: 'Apple Inc.', ticker: 'AAPL', price: 184.25, change: 1.15, cap: '$2.88 T', rev: '$383 B', employees: '161,000', margin: '26.1%', sector: 'Technology', desc: 'Directs global consumer iOS software and hardware ecosystems.', history: 'Transformed user computing with the iPhone, creating the global mobile software economy.' },
    { id: 'MSFT', name: 'Microsoft Corporation', ticker: 'MSFT', price: 415.50, change: -0.42, cap: '$3.09 T', rev: '$227 B', employees: '221,005', margin: '35.3%', sector: 'Technology & Cloud', desc: 'Sells corporate enterprise software, cloud computing platforms, and leading AI capabilities.', history: 'Pioneered desktop software computing in the 1980s; now leads enterprise cloud systems.' },
    { id: 'NVDA', name: 'NVIDIA Corporation', ticker: 'NVDA', price: 875.12, change: 4.85, cap: '$2.19 T', rev: '$60.9 B', employees: '29,600', margin: '57.1%', sector: 'Semiconductors', desc: 'Produces critical Tensor-Core GPUs that power deep artificial intelligence networks.', history: 'Expanded from video game 3D GPUs to master mathematical deep learning microprocessors.' },
    { id: 'TSLA', name: 'Tesla Inc.', ticker: 'TSLA', price: 175.40, change: -2.31, cap: '$558 B', rev: '$96.7 B', employees: '140,000', margin: '15.5%', sector: 'Automotive & Energy', desc: 'Deploys clean energy, premium electric models, and humanoid kinetics guided by visual AI.', history: 'Pioneered scalable high-performance electric cars and massive gigafactory battery networks.' },
    { id: 'AMZN', name: 'Amazon.com Inc.', ticker: 'AMZN', price: 178.15, change: 0.85, cap: '$1.85 T', rev: '$574 B', employees: '1,540,500', margin: '5.3%', sector: 'Consumer Services & Cloud', desc: 'Operates key e-commerce pipelines and the world\'s largest cloud computing system (AWS).', history: 'Began as a simple digital bookstore in 1994; expanded to dominate Western cloud.' },
    { id: 'GOOGL', name: 'Alphabet Inc.', ticker: 'GOOGL', price: 151.60, change: 1.22, cap: '$1.89 T', rev: '$307 B', employees: '182,000', margin: '24.0%', sector: 'Technology & Search', desc: 'Organizes global information via search engines, ad grids, and mobile android systems.', history: 'Invented PageRank, cataloging world info; now trains complex Gemini AI modules.' },
    { id: 'META', name: 'Meta Platforms Inc.', ticker: 'META', price: 505.30, change: -1.75, cap: '$1.29 T', rev: '$134 B', employees: '67,000', margin: '28.9%', sector: 'Social Media', desc: 'Coordinates digital attention spans via Facebook, Instagram, and WhatsApp apps.', history: 'Pioneered modern web social networking; now building spatial VR virtual devices.' },
    { id: 'JPM', name: 'JPMorgan Chase & Co.', ticker: 'JPM', price: 194.80, change: 0.35, cap: '$565 B', rev: '$158 B', employees: '310,000', margin: '30.1%', sector: 'Banking & Liquidity', desc: 'Acts as fortress clearing banking node of the Western financial systems.', history: 'Formed via centuries of mergers, saving financial systems during severe runs.' },
    { id: 'XOM', name: 'Exxon Mobil Corporation', ticker: 'XOM', price: 118.90, change: 0.12, cap: '$471 B', rev: '$344 B', employees: '62,000', margin: '10.5%', sector: 'Energy & Petrochemicals', desc: 'Extracts deep carbon sediments to fuel transport corridors and factories.', history: 'Direct descendant of Standard Oil, fueling the rise of internal combustion.' }
  ],
  forex: [
    { id: 'EUR_USD', name: 'Euro / US Dollar', ticker: 'EUR/USD', price: 1.0854, change: 0.15, bid: 1.0853, ask: 1.0855, region: 'Eurozone / USA', desc: 'The most heavily traded liquid currency pair in the world, linking European credit yields with safe spot USD assets.', history: 'Created alongside the Euro currency in 1999 to balance transatlantic trade volumes.' },
    { id: 'GBP_USD', name: 'British Pound / US Dollar', ticker: 'GBP/USD', price: 1.2642, change: -0.22, bid: 1.2641, ask: 1.2643, region: 'United Kingdom / USA', desc: 'Known as "Cable", tracing the historical transatlantic telegraph links between London and New York credit books.', history: 'Dates back to the 19th century when the telegraph cable connected the two powerhouse markets.' },
    { id: 'USD_JPY', name: 'US Dollar / Japanese Yen', ticker: 'USD/JPY', price: 151.35, change: 0.42, bid: 151.34, ask: 151.36, region: 'USA / Japan', desc: 'A major funding pair driven by Japan\'s historic zero-interest carry trade policies and bilateral capital outflows.', history: 'Developed into a dominant Asian trading corridor during Japan\'s late-century manufacturing boom.' },
    { id: 'AUD_USD', name: 'Australian Dollar / US Dollar', ticker: 'AUD/USD', price: 0.6521, change: -0.65, bid: 0.6520, ask: 0.6522, region: 'Australia / USA', desc: 'Often treated as a liquid proxy for global commodity demand, energy exports, and metal pricing cycles.', history: 'Tied heavily to the mining and crop boom cycle in East Asia and Australia.' },
    { id: 'USD_CAD', name: 'US Dollar / Canadian Dollar', ticker: 'USD/CAD', price: 1.3562, change: 0.18, bid: 1.3561, ask: 1.3563, region: 'USA / Canada', desc: 'Intimately tied to crude energy flows between Canada\'s oil sands and massive refinery grids in the US.', history: 'Stabilized by decades of direct bilateral border trade agreement packages.' },
    { id: 'USD_CHF', name: 'US Dollar / Swiss Franc', ticker: 'USD/CHF', price: 0.9015, change: -0.11, bid: 0.9014, ask: 0.9016, region: 'USA / Switzerland', desc: 'Representing the pre-eminent safe-haven European fiat reserve asset backed by Switzerland\'s asset security records.', history: 'Supported by Switzerland\'s centuries of sovereign military neutrality and secure private banks.' },
    { id: 'NZD_USD', name: 'New Zealand Dollar / US Dollar', ticker: 'NZD/USD', price: 0.5985, change: -0.45, bid: 0.5984, ask: 0.5986, region: 'New Zealand / USA', desc: 'Known as the "Kiwi", influenced heavily by trans-oceanic agricultural exports and carry-yield adjustments.', history: 'Refined alongside New Zealand\'s structural currency liberalization policies in the 1980s.' }
  ],
  crypto: [
    { id: 'AAVE', name: 'Aave', ticker: 'AAVE', price: 92.50, change: 1.45, cap: '$1.35 B', supply: '16.0 M', protocol: 'DeFi (Ethereum PoS)', desc: 'An open-source non-custodial decentralized liquidity protocol.', history: 'Created as ETHLend in 2017 by Stani Kulechov; rebranded to Aave to focus on shared liquidity pools.' },
    { id: 'ALGO', name: 'Algorand', ticker: 'ALGO', price: 0.18, change: 0.85, cap: '$1.45 B', supply: '10.0 B', protocol: 'Pure Proof of Stake', desc: 'Secure, green carbon-neutral Layer 1 database engineered for scale.', history: 'Founded in 2019 by Turing Award winner Silvio Micali to solve the blockchain scalability trilemma.' },
    { id: 'APT', name: 'Aptos', ticker: 'APT', price: 9.35, change: 2.12, cap: '$4.12 B', supply: '1.09 B', protocol: 'AptosBFT (Move language)', desc: 'A scalable Layer 1 ledger exploiting parallel transactional architectures.', history: 'Launched in 2022 by ex-Diem engineers seeking high-scale concurrent transaction execution.' },
    { id: 'ARB', name: 'Arbitrum', ticker: 'ARB', price: 1.15, change: -1.05, cap: '$3.02 B', supply: '10.0 B', protocol: 'Optimistic Rollup', desc: 'A Layer 2 scaling rolling system for the Ethereum virtual ecosystem.', history: 'Unveiled in 2021 by Offchain Labs; quickly became the leader in Layer 2 roll-up TVL.' },
    { id: 'AVAX', name: 'Avalanche', ticker: 'AVAX', price: 42.15, change: 3.42, cap: '$15.8 B', supply: '436.5 M', protocol: 'Avalanche Consensus (PoS)', desc: 'An open-source decentralized smart execution database featuring rapid sub-second finality and subnets.', history: 'Bootstrapped in 2020 by Emin Gün Sirer to achieve near-instant transactional execution.' },
    { id: 'BMONEY', name: 'b-money', ticker: 'BMONEY', price: 0.00, change: 0.0, cap: 'N/A', supply: 'N/A', protocol: 'Proof-of-Work (Concept)', desc: 'A major pre-Bitcoin digital cash framework proposing untraceable transactions.', history: 'Designed in 1998 by Wei Dai, defining foundational mechanics for decentralized ledgers.' },
    { id: 'BNB', name: 'Binance Coin', ticker: 'BNB', price: 585.30, change: 0.12, cap: '$87 B', supply: '147.5 M', protocol: 'BFT Delegated Stake', desc: 'The native gas and settlement coin powering high-volume chain systems and smart-chain pools.', history: 'Launched as an Ethereum token in 2017; evolved into an independent high-speed sovereign network.' },
    { id: 'BITGOLD', name: 'Bit Gold', ticker: 'BITGOLD', price: 0.00, change: 0.0, cap: 'N/A', supply: 'N/A', protocol: 'Re-usable Proof of Work', desc: 'Nick Szabos unbuilt decentralized puzzle-registry designing digital cash.', history: 'Written in 1998; integrated PoW puzzles to prevent double-spending without central roots.' },
    { id: 'BTC', name: 'Bitcoin', ticker: 'BTC', price: 68450.00, change: 1.85, cap: '$1.34 T', supply: '19.6 M', protocol: 'Proof of Work (SHA-256)', desc: 'The sovereign decentralized ledger acting as synthetic digital gold with restricted absolute supply mechanics.', history: 'Created in 2009 by the anonymous mathematician Satoshi Nakamoto as a trustless peer-to-peer cash system.' },
    { id: 'BCH', name: 'Bitcoin Cash', ticker: 'BCH', price: 420.50, change: 0.85, cap: '$8.2 B', supply: '19.6 M', protocol: 'Proof of Work (SHA-256)', desc: 'A block-size scaling fork of Bitcoin engineered for fast peer-to-peer checkouts.', history: 'Split from Bitcoin in 2017 over block size constraints to enhance daily payment speeds.' },
    { id: 'ADA', name: 'Cardano', ticker: 'ADA', price: 0.5750, change: -2.15, cap: '$20 B', supply: '35.6 B', protocol: 'Ouroboros Proof of Stake', desc: 'A peer-reviewed algorithmic ledger designed for long-term secure smart agreements and tracking.', history: 'Designed by Charles Hoskinson to bring strict formal verification to smart contract ledgers.' },
    { id: 'LINK', name: 'Chainlink', ticker: 'LINK', price: 18.15, change: 1.22, cap: '$10.6 B', supply: '587.0 M', protocol: 'Oracle Services Network', desc: 'Decentralized oracle infrastructure feeding secure realworld data to smart contracts.', history: 'Bootsrapped in 2017 by Sergey Nazarov, solving the oracle isolation barrier.' },
    { id: 'ATOM', name: 'Cosmos', ticker: 'ATOM', price: 9.12, change: 0.45, cap: '$3.5 B', supply: '390.9 M', protocol: 'Tendermint BFT PoS', desc: 'The Cosmos network enables sovereign blockchains to interact via the Inter-Blockchain Communication (IBC) protocol.', history: 'Proposed in 2014 by Jae Kwon, initiating the multi-chain interoperability ecosystem.' },
    { id: 'MANA', name: 'Decentraland', ticker: 'MANA', price: 0.65, change: -1.75, cap: '$1.25 B', supply: '1.8 B', protocol: 'Metaverse Space Token', desc: 'Virtual property landscape hosting user experiences, lands, and visual creations.', history: 'Bootsrapped in 2017 by Ariel Meilich, helping define early spatial digital lands.' },
    { id: 'DIGICASH', name: 'DigiCash', ticker: 'DIGICASH', price: 0.00, change: 0.0, cap: 'N/A', supply: 'N/A', protocol: 'Cryptographic Blind Signatures', desc: 'Historic pioneering electronic money system implementing private digital currency backings.', history: 'Invented in 1989 by David Chaum; served as the first true functional e-cash model.' },
    { id: 'DOGE', name: 'Dogecoin', ticker: 'DOGE', price: 0.1650, change: 0.42, cap: '$23.6 B', supply: '144.1 B', protocol: 'Scrypt Proof of Work', desc: 'A Scrypt-based meme currency built for tipping, micro-purchases, and community microtrading.', history: 'Created in 2013 as a joke by Billy Markus & Jackson Palmer; grew to achieve huge liquidity status.' },
    { id: 'EGOLD', name: 'e-Gold', ticker: 'EGOLD', price: 0.00, change: 0.0, cap: 'N/A', supply: 'N/A', protocol: 'Centralized Metal Ledger', desc: 'Early centralized internet metallic currency facilitating gold trades.', history: 'Founded in 1996 by Douglas Jackson; closed down due to regulatory compliance changes.' },
    { id: 'ENA', name: 'Ethena', ticker: 'ENA', price: 0.82, change: 1.12, cap: '$1.25 B', supply: '1.5 B', protocol: 'Synthetic Dollar Delta-Hedging', desc: 'Ethereum-based yield builder issuing USDe synthetic dollar pegs.', history: 'Launched in 2024 to create stable internet bonds driven by derivatives hedging.' },
    { id: 'ETH', name: 'Ethereum', ticker: 'ETH', price: 3485.50, change: -0.75, cap: '$418 B', supply: '120.1 M', protocol: 'Proof of Stake (EVM)', desc: 'The global Turing-complete computing network supporting programmatic contracts and collateral markets.', history: 'Proposed by Vitalik Buterin in 2013 and booted in 2015 to support decentralized programmable assets.' },
    { id: 'ETC', name: 'Ethereum Classic', ticker: 'ETC', price: 29.35, change: -0.42, cap: '$4.2 B', supply: '146.5 M', protocol: 'Ethash Proof of Work', desc: 'Preserves the original classic Ethereum transaction ledger, sticking to the code-is-law concept.', history: 'Formed in 2016 following the DAO hard fork split to stick strictly to immutability.' },
    { id: 'FTM', name: 'Fantom', ticker: 'FTM', price: 0.95, change: 4.85, cap: '$2.6 B', supply: '2.8 B', protocol: 'Lachesis DAG Consensus', desc: 'An ultra-fast, highly scalable smart contract ledger optimized for DeFi apps.', history: 'Founded in 2018 by Dr. Ahn Byung Ik; upgraded to the high-efficiency Sonic platform in 2024/2026.' },
    { id: 'FET', name: 'Fetch.ai (ASI)', ticker: 'FET', price: 2.15, change: 5.12, cap: '$5.2 B', supply: '2.5 B', protocol: 'Machine Learning Agent Nodes', desc: 'Autonomous intelligence framework organizing cooperative micro-economic agents.', history: 'Bootsrapped in 2018; integrated into the Artificial Superintelligence Alliance (ASI) in 2024.' },
    { id: 'FIL', name: 'Filecoin', ticker: 'FIL', price: 6.12, change: 0.85, cap: '$3.2 B', supply: '540.2 M', protocol: 'PoRep Data Storage Claims', desc: 'A decentralized marketplace linking physical computer storage miners with customers.', history: 'Designed in 2017/2020 by Juan Benet to construct a durable cloud repository alternative.' },
    { id: 'HASHCASH', name: 'Hashcash', ticker: 'HASHCASH', price: 0.00, change: 0.0, cap: 'N/A', supply: 'N/A', protocol: 'Proof of Work Hash puzzle', desc: 'Pioneering pre-blockchain puzzle mechanism to eliminate web email spam.', history: 'Designed in 1997 by Adam Back, helping inspire the consensus algorithm of Bitcoin.' },
    { id: 'HBAR', name: 'Hedera Hashgraph', ticker: 'HBAR', price: 0.11, change: -0.15, cap: '$3.8 B', supply: '35.7 B', protocol: 'Hashgraph Gossip Consensus', desc: 'High-speed enterprise-governed consensus ledger for rapid private transfers.', history: 'Architected by Leemon Baird in 2018; powered by a governing board of multi-national enterprise firms.' },
    { id: 'ICP', name: 'Internet Computer', ticker: 'ICP', price: 12.35, change: 0.42, cap: '$5.7 B', supply: '462.2 M', protocol: 'Threshold Relay Engine', desc: 'Hosting sovereign web software and canisters directly at local server speeds.', history: 'Developed in 2021 by the DFINITY Foundation to serve as public internet hosting.' },
    { id: 'JUP', name: 'Jupiter', ticker: 'JUP', price: 1.12, change: 3.42, cap: '$1.4 B', supply: '10.0 B', protocol: 'Solana Dex Routing Agent', desc: 'The core liquid swap router and launch mechanism on the Solana chain.', history: 'Debuted in 2024 by creator Meow to aggregate all Solana liquid trade routes.' },
    { id: 'LTC', name: 'Litecoin', ticker: 'LTC', price: 82.15, change: 0.85, cap: '$6.1 B', supply: '74.2 M', protocol: 'Scrypt Proof of Work', desc: 'Lightweight payments alternative to Bitcoin with rapid transaction windows.', history: 'Eclipsed from Bitcoin codebase in 2011 by Charlie Lee as silver to Bitcoins gold.' },
    { id: 'MKR', name: 'Maker (Sky)', ticker: 'MKR', price: 2845.00, change: 1.12, cap: '$2.5 B', supply: '920 K', protocol: 'Maker DAO Governance', desc: 'Collateral governing token backing DAI and USDS internet decentralized dollars.', history: 'Formed in 2017 by Rune Christensen; expanded into the Sky system in 2024.' },
    { id: 'XMR', name: 'Monero', ticker: 'XMR', price: 142.15, change: -1.25, cap: '$2.6 B', supply: '18.4 M', protocol: 'CryptoNote Privacy PoW', desc: 'Strictly secure, untraceable currency ledger using ring stealth shielding.', history: 'Launched in 2014 to ensure secure financial privacy on public networks.' },
    { id: 'NEAR', name: 'Near Protocol', ticker: 'NEAR', price: 6.85, change: 3.12, cap: '$7.2 B', supply: '1.05 B', protocol: 'Doomslug PoS Sharding', desc: 'User friendly sharded layer-1 database designed to scale decentralized web systems.', history: 'Bootsrapped in 2020 to host simple, fast web apps under native web security.' },
    { id: 'OP', name: 'Optimism', ticker: 'OP', price: 2.85, change: -1.22, cap: '$3.5 B', supply: '4.2 B', protocol: 'Optimistic Rollup Engine', desc: 'Ethereum scaling Layer 2 that coordinates the collaborative Superchain architecture.', history: 'Unveiled in 2021 by Jinglan Wang; developed the OP Stack engine used by Base and others.' },
    { id: 'DOT', name: 'Polkadot', ticker: 'DOT', price: 6.85, change: -0.42, cap: '$9.2 B', supply: '1.4 B', protocol: 'Nominated Proof of Stake', desc: 'Connects a network of customized sovereign parachains underneath a core Relay Chain.', history: 'Created in 2020 by Ethereum co-founder Gavin Wood to support multi-chain frameworks.' },
    { id: 'POL', name: 'Polygon (POL)', ticker: 'POL', price: 0.68, change: 0.12, cap: '$6.2 B', supply: '9.9 B', protocol: 'POS Sidechain / ZK-Rollup', desc: 'A powerful sandbox of scaling channels and sidechains for Ethereum applications.', history: 'Founded as Matic in 2017; revamped to POL to drive collaborative multi-chain pools.' },
    { id: 'XRP', name: 'Ripple', ticker: 'XRP', price: 0.5840, change: -1.21, cap: '$32 B', supply: '55.0 B', protocol: 'Consensus Ledger', desc: 'A real-time settlements network designed to proxy interbank sovereign transfer corridors.', history: 'Created in 2012 to bypass interbank SWIFT transfer clearing speeds.' },
    { id: 'SHIB', name: 'Shiba Inu', ticker: 'SHIB', price: 0.000021, change: 4.85, cap: '$12.5 B', supply: '589 T', protocol: 'Shibarium L2 Proof of Stake', desc: 'The popular community-centered token transitioning to an active L2 ecosystem.', history: 'Introduced in 2020 by Ryoshi as an experiment in organic community growth.' },
    { id: 'SOL', name: 'Solana', ticker: 'SOL', price: 182.15, change: 5.42, cap: '$81 B', supply: '446.5 M', protocol: 'Proof of History (SVM)', desc: 'A high-throughput, low-latency transaction engine optimized for rapid asset swaps and scale micro-orders.', history: 'Invented by Anatoly Yakovenko in 2017 with high clock speed synchronizations.' },
    { id: 'STX', name: 'Stacks', ticker: 'STX', price: 2.15, change: 3.12, cap: '$3.1 B', supply: '1.4 B', protocol: 'Proof of Transfer (PoX)', desc: 'Smart layer and transaction builder anchored directly onto Bitcoin.', history: 'Founded in 2018 by Muneeb Ali to incorporate smart contracts on Bitcoin core.' },
    { id: 'XLM', name: 'Stellar', ticker: 'XLM', price: 0.12, change: -0.45, cap: '$3.5 B', supply: '28.9 B', protocol: 'Stellar Consensus Protocol', desc: 'Remittance transactions pipeline for cheap international credit and currency exchange.', history: 'Created in 2014 by Jed McCaleb to enable rapid retail micro-settlements globally.' },
    { id: 'SUI', name: 'Sui', ticker: 'SUI', price: 1.62, change: 3.82, cap: '$3.8 B', supply: '10.0 B', protocol: 'Narwhal & Tusk DAG PoS', desc: 'High concurrency Layer 1 operating on secure object-based Move program tracks.', history: 'Unveiled in 2023 by Mysten Labs to achieve parallel scale for high speed web apps.' },
    { id: 'USDT', name: 'Tether', ticker: 'USDT', price: 1.00, change: 0.0, cap: '$110 B', supply: '110 B', protocol: 'Multi-chain Collateral Peg', desc: 'Pre-eminent physical asset-backed dynamic dollar stablecoin.', history: 'Booted in 2014 as Realcoin; serves as the absolute baseline trade asset for digital exchanges.' },
    { id: 'TON', name: 'Toncoin', ticker: 'TON', price: 6.85, change: 4.12, cap: '$17.2 B', supply: '5.1 B', protocol: 'Byzantine Fault Tolerant PoS', desc: 'Gas and transactional network natively integrated into the Telegram messaging platform.', history: 'Designed by Pavel Durov in 2018; completed and deployed by the TON open community.' },
    { id: 'TRX', name: 'TRON', ticker: 'TRX', price: 0.11, change: 0.22, cap: '$10.2 B', supply: '87.5 B', protocol: 'Delegated Proof of Stake', desc: 'Fast, cheap decentralized ledger mostly used for global USDT transactions.', history: 'Bootsrapped in 2017 by Justin Sun, quickly becoming a leading stablecoin corridor.' },
    { id: 'UNI', name: 'Uniswap', ticker: 'UNI', price: 7.85, change: 2.15, cap: '$4.8 B', supply: '1.0 B', protocol: 'Automated Market Maker (AMM)', desc: 'The worlds largest autonomous token exchange protocol, using mathematical pools.', history: 'Written in 2018 by Hayden Adams to prove the viability of constant-product liquidity AMMs.' },
    { id: 'USDC', name: 'USD Coin', ticker: 'USDC', price: 1.00, change: 0.0, cap: '$32 B', supply: '32 B', protocol: 'Regulated Custody Peg', desc: 'Reserve-audited, fully compliant digital dollar stablecoin.', history: 'Debuted in 2018 by Circle to form a regulated, transparent dollar payment alternative.' },
    { id: 'VET', name: 'Vechain', ticker: 'VET', price: 0.035, change: -0.15, cap: '$2.5 B', supply: '72.7 B', protocol: 'Proof of Authority', desc: 'Enterprise IoT ledger tracking cargo transport lists with NFC hardware tags.', history: 'Pioneered in 2015 by Sunny Lu to secure absolute supply proof integrity.' },
    { id: 'WLD', name: 'Worldcoin', ticker: 'WLD', price: 4.85, change: -2.31, cap: '$1.0 B', supply: '10.0 B', protocol: 'Id Verification Proof of Personhood', desc: 'Biometric global identity network verifying humans via eye scanning.', history: 'Co-created in 2023 by Sam Altman to differentiate humans from bots.' },
    { id: 'ZEC', name: 'Zcash', ticker: 'ZEC', price: 29.85, change: -0.42, cap: '$480 M', supply: '16.3 M', protocol: 'Zero-Knowledge Proofs (SNARKs)', desc: 'Privacy-oriented payment blockchain allowing users to encrypt transaction data.', history: 'Launched in 2016 from cryptographic research into zero-knowledge privacy.' }
  ],
  commodities: [
    { id: 'GLD', name: 'Gold Bullion', ticker: 'GOLD', price: 2280.50, change: 0.85, unit: 'troy oz', contract: 'COMEX GC Daily', region: 'Underground Reserves / Central Banks', desc: 'The ultimate physical monetary asset with five millennia of zero-party counterparty reserve records.', history: 'Has served as the universal tangible store of value across all human civilizations for over 5,000 years.' },
    { id: 'SLV', name: 'Silver Bullion', ticker: 'SILVER', price: 26.42, change: 1.15, unit: 'troy oz', contract: 'COMEX SI Daily', region: 'Industrial & Specialty Reserves', desc: 'Bimetallic monetary metal with critical applications in extreme-precision photolithography and solar cell grids.', history: 'Used as standard coin currency alongside gold, acting as the foundation of early monetary systems.' },
    { id: 'WTI', name: 'Crude Oil (West Texas Intermediate)', ticker: 'CRUDE_OIL', price: 85.30, change: 1.45, unit: 'barrel', contract: 'NYMEX CL Month', region: 'Permian Basin / Cushing Hub', desc: 'The essential carbon fuel source providing high-horsepower energy output for factories, container trucks and farms.', history: 'Propelled the aggregate material surge of the 20th century, becoming the master political raw energy asset.' },
    { id: 'NG', name: 'Natural Gas', ticker: 'NAT_GAS', price: 1.78, change: -2.31, unit: 'MMBtu', contract: 'NYMEX NG Month', region: 'Henry Hub Pipelines', desc: 'Underground hydrocarbon gas feeding massive heating networks and power grids across whole regions.', history: 'Transitioned from a waste byproduct of oil drills to a premium low-carbon power grid base.' },
    { id: 'COP', name: 'Copper Premium', ticker: 'COPPER', price: 4.15, change: 0.35, unit: 'lb', contract: 'COMEX HG Daily', region: 'Chilean and North-American Mines', desc: 'Known as "Dr. Copper", a industrial metal acting as a direct physical dial for aggregate electric infrastructure buildouts.', history: 'The oldest metal smelted by mankind; now fundamental to all electric vehicle and modern wire installations.' },
    { id: 'WHT', name: 'Hard Red Winter Wheat', ticker: 'WHEAT', price: 542.50, change: -0.12, unit: 'bushel', contract: 'CBOT W Daily', region: 'Aero grain elevators', desc: 'The foundational human caloric crop sustainment, critical for national food supplies and avoiding supply collapses.', history: 'Supported the rise of early civilizations in the Fertile Crescent, continuing to feed billions today.' }
  ]
};

export default function KnowledgeItemViewer({ item, onNavigate, activeFile }: ViewerProps) {
  // State for scale calibration (beginner, intermediate, advanced)
  const [learningDepth, setLearningDepth] = useState<'beginner' | 'intermediate' | 'advanced'>('beginner');
  const [expandedDisclosures, setExpandedDisclosures] = useState<Record<number, boolean>>({});
  
  // Custom interactive tab for 2026 Crypto Sector Intelligence
  const [cryptoTab, setCryptoTab] = useState<'sectors' | 'security' | 'stablecoins_ai' | 'pizza_day' | 'glossary'>('sectors');
  
  // Interactive Causal Cascade states
  const [currentCascadeIndex, setCurrentCascadeIndex] = useState<number>(-1);
  const [isCascadeRunning, setIsCascadeRunning] = useState<boolean>(false);

  // New States for Interactive Asset Directories lookup
  const [assetSearchQuery, setAssetSearchQuery] = useState('');
  const [selectedAssetId, setSelectedAssetId] = useState<string>('');
  const [simulatedPrices, setSimulatedPrices] = useState<number[]>([]);
  const [hoveredPricePoint, setHoveredPricePoint] = useState<{ x: number, price: number, day: number } | null>(null);

  // Retrieve enriched data or use sector fallbacks or defaults
  const normalizedTitle = item.title;
  const isCrypto = activeFile === 'encyclopedia/markets/crypto.html' || 
                   activeFile?.startsWith('encyclopedia/crypto/') || 
                   item.title?.toLowerCase().includes('crypto') || 
                   item.title === 'Crypto Ecosystems';
  const rawEnriched = ENRICHED_DATA[normalizedTitle] || SECTOR_FALLBACK_INFO[normalizedTitle] || SECTOR_FALLBACK_INFO['Technology & AI'];

  // Clear cascade when item changes, select initial asset for directory
  useEffect(() => {
    setCurrentCascadeIndex(-1);
    setIsCascadeRunning(false);
    
    // Choose appropriate initial asset when directory changes
    let defaultId = '';
    if (activeFile === 'encyclopedia/markets/stocks.html' || activeFile?.startsWith('encyclopedia/stocks/') || item.title === 'How Stocks Work') {
      defaultId = 'AAPL';
    } else if (activeFile === 'encyclopedia/markets/forex.html' || item.title === 'How Forex Works') {
      defaultId = 'EUR_USD';
    } else if (activeFile === 'encyclopedia/markets/crypto.html' || item.title === 'How Crypto Works') {
      defaultId = 'BTC';
    } else if (activeFile === 'encyclopedia/markets/commodities.html' || item.title === 'How Commodities Work') {
      defaultId = 'GLD';
    }
    setSelectedAssetId(defaultId);
    setAssetSearchQuery('');
  }, [item, activeFile]);

  // Generate simulated chart prices when selected asset changes
  useEffect(() => {
    if (!selectedAssetId) return;
    
    // Find active asset to get baseline rate
    let baseline = 100;
    const allAssets = [
      ...DIRECTORIES_DATA_MAP.stocks,
      ...DIRECTORIES_DATA_MAP.forex,
      ...DIRECTORIES_DATA_MAP.crypto,
      ...DIRECTORIES_DATA_MAP.commodities
    ];
    const match = allAssets.find(a => a.id === selectedAssetId);
    if (match) baseline = match.price;

    // Generate 30 days of realistic trending price movements
    const pts: number[] = [];
    let current = baseline * 0.94; // start slightly lower
    const trendDirection = (selectedAssetId === 'NVDA' || selectedAssetId === 'SOL' || selectedAssetId === 'GLD') ? 0.005 : -0.001; 
    
    for (let i = 0; i < 30; i++) {
      const cycle = Math.sin(i * 0.3) * (baseline * 0.02);
      const randFactor = (Math.random() - 0.48) * (baseline * 0.03);
      current = current * (1 + trendDirection) + randFactor + (i === 29 ? 0 : cycle * 0.1);
      // Bound it safely
      if (current < 0.01) current = 0.01;
      pts.push(Number(current.toFixed(selectedAssetId.includes('_') || match?.price && match.price < 50 ? 4 : 2)));
    }
    // Make sure final element is exactly current spot rate
    pts[29] = baseline;
    setSimulatedPrices(pts);
    setHoveredPricePoint(null);
  }, [selectedAssetId]);

  const colorClasses = {
    indigo: {
      from: 'from-indigo-600/20',
      border: 'border-indigo-500/20',
      borderActive: 'border-indigo-400',
      text: 'text-indigo-400',
      bgGlow: 'bg-indigo-500/10',
      nodeActive: 'bg-indigo-950/80 border-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.25)] text-indigo-100',
      glowClasses: 'shadow-[0_0_30px_rgba(99,102,241,0.15)] bg-indigo-950/50'
    },
    cyan: {
      from: 'from-cyan-600/20',
      border: 'border-cyan-500/20',
      borderActive: 'border-cyan-400',
      text: 'text-cyan-400',
      bgGlow: 'bg-cyan-500/10',
      nodeActive: 'bg-cyan-950/80 border-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.25)] text-cyan-100',
      glowClasses: 'shadow-[0_0_30px_rgba(6,182,212,0.15)] bg-cyan-950/50'
    },
    yellow: {
      from: 'from-yellow-600/20',
      border: 'border-yellow-500/20',
      borderActive: 'border-yellow-400',
      text: 'text-yellow-400',
      bgGlow: 'bg-yellow-500/10',
      nodeActive: 'bg-yellow-950/80 border-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.25)] text-yellow-105',
      glowClasses: 'shadow-[0_0_30px_rgba(234,179,8,0.15)] bg-yellow-950/50'
    },
    red: {
      from: 'from-red-600/20',
      border: 'border-red-500/20',
      borderActive: 'border-red-400',
      text: 'text-red-400',
      bgGlow: 'bg-red-500/10',
      nodeActive: 'bg-red-950/80 border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.25)] text-red-101',
      glowClasses: 'shadow-[0_0_30px_rgba(239,68,68,0.15)] bg-red-950/50'
    },
    purple: {
      from: 'from-purple-600/20',
      border: 'border-purple-500/20',
      borderActive: 'border-purple-400',
      text: 'text-purple-400',
      bgGlow: 'bg-purple-500/10',
      nodeActive: 'bg-purple-950/80 border-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.25)] text-purple-101',
      glowClasses: 'shadow-[0_0_30px_rgba(168,85,247,0.15)] bg-purple-950/50'
    },
    emerald: {
      from: 'from-emerald-600/20',
      border: 'border-emerald-500/20',
      borderActive: 'border-emerald-400',
      text: 'text-emerald-400',
      bgGlow: 'bg-emerald-500/10',
      nodeActive: 'bg-emerald-950/80 border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.25)] text-emerald-100',
      glowClasses: 'shadow-[0_0_30px_rgba(16,185,129,0.15)] bg-emerald-950/50'
    }
  }[item.conceptColor || 'indigo'];

  const toggleDisclosure = (idx: number) => {
    setExpandedDisclosures(prev => ({
      ...prev,
      [idx]: !prev[idx]
    }));
  };

  // Run systemic cascade simulation
  const runCausalSimulation = () => {
    if (isCascadeRunning) return;
    setIsCascadeRunning(true);
    setCurrentCascadeIndex(0);

    const stepsCount = rawEnriched.causalFlow.length;
    let index = 0;
    
    const interval = setInterval(() => {
      index++;
      if (index < stepsCount) {
        setCurrentCascadeIndex(index);
      } else {
        clearInterval(interval);
        setIsCascadeRunning(false);
      }
    }, 1800);
  };

  const getActiveDepthText = () => {
    if (learningDepth === 'beginner') return rawEnriched.beginnerText || item.simplifiedExplanation;
    if (learningDepth === 'intermediate') return rawEnriched.intermediateText || item.definition;
    return rawEnriched.advancedText || item.academicDeconstruction;
  };

  const getDepthIcon = (type: string) => {
    if (type === 'grocery') return <ShoppingBag className="w-4.5 h-4.5 text-amber-400" />;
    if (type === 'job') return <Briefcase className="w-4.5 h-4.5 text-emerald-400" />;
    return <Home className="w-4.5 h-4.5 text-sky-400" />;
  };

  // Determine if we should display the interactive directory board
  let directoryType: 'stocks' | 'forex' | 'crypto' | 'commodities' | null = null;
  if (activeFile === 'encyclopedia/markets/stocks.html' || activeFile?.startsWith('encyclopedia/stocks/') || item.title === 'How Stocks Work') {
    directoryType = 'stocks';
  } else if (activeFile === 'encyclopedia/markets/forex.html' || item.title === 'How Forex Works') {
    directoryType = 'forex';
  } else if (activeFile === 'encyclopedia/markets/crypto.html' || item.title === 'How Crypto Works') {
    directoryType = 'crypto';
  } else if (activeFile === 'encyclopedia/markets/commodities.html' || item.title === 'How Commodities Work') {
    directoryType = 'commodities';
  }

  const activeDirectoryList = directoryType ? DIRECTORIES_DATA_MAP[directoryType] : [];
  
  // Filter candidates based on search
  const filteredAssets = activeDirectoryList.filter((asset: any) => 
    asset.name.toLowerCase().includes(assetSearchQuery.toLowerCase()) || 
    asset.ticker.toLowerCase().includes(assetSearchQuery.toLowerCase())
  );

  // Active selected asset details
  const activeAssetDetails = activeDirectoryList.find((a: any) => a.id === selectedAssetId) || activeDirectoryList[0];

  // Interactive mini price line SVG builder
  const renderInteractiveChart = () => {
    if (simulatedPrices.length === 0) return null;
    
    const width = 500;
    const height = 180;
    const padding = 20;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;
    
    const minVal = Math.min(...simulatedPrices);
    const maxVal = Math.max(...simulatedPrices);
    const valRange = maxVal - minVal || 1;
    
    // Convert index, value to X, Y
    const points = simulatedPrices.map((val, idx) => {
      const x = padding + (idx / 29) * chartWidth;
      // Invert Y because SVG coordinates start from top-left
      const y = padding + chartHeight - ((val - minVal) / valRange) * chartHeight;
      return { x, y, price: val, day: idx + 1 };
    });

    // Build the SVG path
    let d = '';
    points.forEach((pt, idx) => {
      if (idx === 0) {
        d += `M ${pt.x} ${pt.y}`;
      } else {
        d += ` L ${pt.x} ${pt.y}`;
      }
    });

    // Build filled area path
    const fillPath = `${d} L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z`;

    const handleMouseMove = (e: React.MouseEvent<SVGSVGElement, MouseEvent>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const xMouse = e.clientX - rect.left;
      
      // Map xMouse to closest index in prices (30 elements)
      const relativeX = (xMouse - padding) / (rect.width - padding * 2);
      let idx = Math.round(relativeX * 29);
      if (idx < 0) idx = 0;
      if (idx > 29) idx = 29;
      
      const pt = points[idx];
      setHoveredPricePoint({
        x: pt.x,
        price: pt.price,
        day: pt.day
      });
    };

    const isUp = (simulatedPrices[simulatedPrices.length - 1] >= simulatedPrices[0]);
    const strokeColor = isUp ? '#10b981' : '#f43f5e';
    const glowColor = isUp ? 'rgba(16,185,129,0.3)' : 'rgba(244,63,94,0.3)';

    return (
      <div className="flex flex-col gap-2 bg-[#02050b]/90 border border-white/5 rounded-2xl p-4">
        <div className="flex justify-between items-center text-left font-mono text-[9px] uppercase tracking-wider text-zinc-500 border-b border-white/5 pb-2">
          <span>Relative Trajectory (Continuous Simulator Feed)</span>
          <span className="text-zinc-500 font-bold">30-Day continuous tick history</span>
        </div>
        <div className="relative h-[130px] w-full">
          <svg 
            viewBox={`0 0 ${width} ${height}`} 
            className="w-full h-full cursor-crosshair overflow-visible"
            onMouseMove={handleMouseMove}
            onMouseLeave={() => setHoveredPricePoint(null)}
          >
            <defs>
              <linearGradient id="chartFillGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={strokeColor} stopOpacity="0.15" />
                <stop offset="100%" stopColor={strokeColor} stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Grid Lines */}
            <line x1={padding} y1={padding} x2={width - padding} y2={padding} stroke="rgba(255,255,255,0.02)" strokeWidth="1" strokeDasharray="3,3" />
            <line x1={padding} y1={height / 2} x2={width - padding} y2={height / 2} stroke="rgba(255,255,255,0.02)" strokeWidth="1" strokeDasharray="3,3" />
            <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="rgba(255,255,255,0.02)" strokeWidth="1" strokeDasharray="3,3" />

            {/* Line Fill Area */}
            <path d={fillPath} fill="url(#chartFillGradient)" />

            {/* Price Line */}
            <path
              d={d}
              fill="none"
              stroke={strokeColor}
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ filter: `drop-shadow(0 0 4px ${glowColor})` }}
            />

            {/* Hover Vertical Guide Line */}
            {hoveredPricePoint && (
              <line
                x1={hoveredPricePoint.x}
                y1={padding}
                x2={hoveredPricePoint.x}
                y2={height - padding}
                stroke="white"
                strokeWidth="0.5"
                strokeOpacity="0.3"
                strokeDasharray="2,2"
              />
            )}

            {/* Hover and endpoint micro indicators */}
            {hoveredPricePoint ? (
              <circle
                cx={hoveredPricePoint.x}
                cy={points[hoveredPricePoint.day - 1].y}
                r="4.5"
                fill="white"
                stroke={strokeColor}
                strokeWidth="1.5"
              />
            ) : (
              <circle
                cx={points[points.length - 1].x}
                cy={points[points.length - 1].y}
                r="4"
                fill={strokeColor}
                className="animate-pulse"
              />
            )}
          </svg>

          {/* Hover interactive card bubble overlay */}
          {hoveredPricePoint && (
            <div 
              className="absolute bg-[#030816]/95 border border-white/10 px-2 py-1 rounded-lg text-left shadow-lg pointer-events-none z-10 text-[9px] font-mono flex flex-col gap-0.5"
              style={{
                left: `${(hoveredPricePoint.x / width) * 100}%`,
                top: `${(points[hoveredPricePoint.day - 1].y / height) * 105 - 25}%`,
                transform: 'translateX(-50%)'
              }}
            >
              <span className="text-zinc-500 uppercase font-black">DAY {hoveredPricePoint.day}:</span>
              <span className="text-white font-extrabold">${hoveredPricePoint.price.toLocaleString(undefined, { minimumFractionDigits: selectedAssetId.includes('_') ? 4 : 2 })}</span>
            </div>
          )}
        </div>
        <div className="flex justify-between items-center text-[9px] text-zinc-500 font-mono mt-1">
          <span>Day 1: ${simulatedPrices[0]?.toLocaleString(undefined, { minimumFractionDigits: selectedAssetId.includes('_') ? 4 : 2 })}</span>
          <span className={`font-bold flex items-center gap-0.5 ${isUp ? 'text-emerald-400' : 'text-rose-400'}`}>
            {isUp ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
            {isUp ? '+' : ''}{((simulatedPrices[simulatedPrices.length - 1] - simulatedPrices[0]) / simulatedPrices[0] * 100).toFixed(2)}%
          </span>
          <span>Day 30: ${simulatedPrices[simulatedPrices.length - 1]?.toLocaleString(undefined, { minimumFractionDigits: selectedAssetId.includes('_') ? 4 : 2 })}</span>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-8 font-sans select-text">
      
      {/* ========================================== */}
      {/* 0. INTERACTIVE ASSET DIRECTORY LOOKUP BOARD */}
      {/* ========================================== */}
      {directoryType && (
        <section className="p-6 bg-[#040815]/95 border border-white/10 rounded-3xl flex flex-col gap-6 relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 p-3 flex items-center gap-1.5 text-[8.5px] font-mono uppercase text-[#00D9FF] tracking-wider">
            <Sliders className="w-3.5 h-3.5 text-[#00D9FF] animate-pulse" />
            <span>Interactive Database Connected</span>
          </div>

          <div className="flex flex-col gap-1.5 text-left select-none">
            <span className={`font-mono text-[9px] uppercase tracking-widest ${isCrypto ? 'text-[#ff5a1f]' : 'text-[#00D9FF]'} font-black`}>Interactive Intelligence Feed</span>
            <h3 className={`${isCrypto ? 'text-[#ff5a1f] drop-shadow-[0_0_8px_rgba(255,90,31,0.5)]' : 'text-white'} font-black text-xs uppercase tracking-wider`}>
              {directoryType.toUpperCase()} DIRECTORY SEARCH & ANALYSIS MODULE
            </h3>
          </div>

          {/* Search tool block */}
          <div className="relative w-full">
            <input 
              type="text" 
              placeholder={`Search ${directoryType} symbols, names, tickers or indices...`} 
              value={assetSearchQuery}
              onChange={(e) => setAssetSearchQuery(e.target.value)}
              className="w-full bg-[#030612]/95 border border-white/10 hover:border-white/20 focus:border-[#00D9FF]/40 outline-none text-white text-xs py-3 pl-10 pr-4 rounded-xl transition-all"
            />
            <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          </div>

          {/* Asset selectors list row */}
          <div className="flex flex-wrap gap-2 max-h-[140px] overflow-y-auto custom-scrollbar p-1">
            {filteredAssets.length > 0 ? (
              filteredAssets.map((asset: any) => {
                const isSelected = selectedAssetId === asset.id;
                const isUp = asset.change >= 0;
                return (
                  <button
                    key={asset.id}
                    onClick={() => setSelectedAssetId(asset.id)}
                    className={`py-2 px-3.5 rounded-xl border transition-all text-left flex items-center justify-between gap-4 cursor-pointer min-w-[150px] flex-1 ${
                      isSelected 
                        ? 'bg-[#00D9FF]/10 border-[#00D9FF]/40 text-white shadow-[0_0_15px_rgba(0,217,255,0.08)]' 
                        : 'bg-[#01040a]/80 border-white/5 hover:border-white/15 text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    <div className="flex flex-col">
                      <span className="text-[10px] uppercase font-mono tracking-widest font-black leading-none">{asset.ticker}</span>
                      <span className="text-[9.5px] font-sans truncate max-w-[100px] mt-0.5 leading-none">{asset.name}</span>
                    </div>

                    <div className="flex flex-col items-end shrink-0">
                      <span className="text-[10.5px] font-mono leading-none font-bold text-white">
                        ${asset.price.toLocaleString(undefined, { minimumFractionDigits: directoryType === 'forex' ? 4 : 2 })}
                      </span>
                      <span className={`text-[8.5px] font-mono leading-none mt-1 font-bold ${isUp ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {isUp ? '▲' : '▼'} {isUp ? '+' : ''}{asset.change}%
                      </span>
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="text-zinc-550 font-mono text-center text-[10px] w-full py-4">
                No indexed symbols match your search query in this syllabus ledger
              </div>
            )}
          </div>

          {/* Expanded Selected Asset Metrics and Micro Chart */}
          {activeAssetDetails && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch border-t border-white/5 pt-6 select-text">
              {/* Left Column: Price Action Chart */}
              <div className="lg:col-span-7 flex flex-col justify-between">
                <div className="flex justify-between items-center mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="text-xs font-black text-white uppercase tracking-tight">{activeAssetDetails.ticker}</div>
                    <span className="text-zinc-650 font-mono text-xs">|</span>
                    <div className="text-[10px] text-zinc-400 font-sans tracking-tight">{activeAssetDetails.name}</div>
                  </div>
                  <div className="text-right flex items-center gap-2 font-mono">
                    <span className="text-[11px] font-black text-white">
                      ${activeAssetDetails.price.toLocaleString(undefined, { minimumFractionDigits: directoryType === 'forex' ? 4 : 2 })}
                    </span>
                    <span className={`text-[8.5px] py-0.5 px-2 rounded font-extrabold ${activeAssetDetails.change >= 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                      {activeAssetDetails.change >= 0 ? '+' : ''}{activeAssetDetails.change}%
                    </span>
                  </div>
                </div>

                {renderInteractiveChart()}
              </div>

              {/* Right Column: Custom Attribute Information Grid */}
              <div className="lg:col-span-12 xl:col-span-5 p-5 bg-[#01040a]/90 border border-white/5 rounded-2xl flex flex-col justify-between text-left">
                <div className="flex flex-col gap-3.5">
                  <h4 className="text-white font-extrabold text-[9.5px] uppercase tracking-widest font-mono border-b border-white/5 pb-2 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#00D9FF]" />
                    SYLLABUS DATA PROFILE
                  </h4>

                  {/* Stock/Company Custom Attribute cards */}
                  {directoryType === 'stocks' && (
                    <div className="grid grid-cols-2 gap-2.5">
                      <div className="p-2.5 bg-black/45 border border-white/[0.02] rounded-xl">
                        <span className="text-[8px] font-mono uppercase text-zinc-500 block">Market Cap</span>
                        <span className="text-zinc-200 font-bold text-[10.5px] tracking-wide block truncate mt-0.5">{(activeAssetDetails as any).cap}</span>
                      </div>
                      <div className="p-2.5 bg-black/45 border border-white/[0.02] rounded-xl">
                        <span className="text-[8px] font-mono uppercase text-zinc-500 block">Annual Revenue</span>
                        <span className="text-zinc-200 font-bold text-[10.5px] tracking-wide block truncate mt-0.5">{(activeAssetDetails as any).rev}</span>
                      </div>
                      <div className="p-2.5 bg-black/45 border border-white/[0.02] rounded-xl">
                        <span className="text-[8px] font-mono uppercase text-zinc-500 block">Employees</span>
                        <span className="text-zinc-200 font-bold text-[10.5px] tracking-wide block truncate mt-0.5">{(activeAssetDetails as any).employees}</span>
                      </div>
                      <div className="p-2.5 bg-black/45 border border-white/[0.02] rounded-xl">
                        <span className="text-[8px] font-mono uppercase text-zinc-500 block">Profit Margin</span>
                        <span className="text-zinc-200 font-bold text-[10.5px] tracking-wide block truncate mt-0.5">{(activeAssetDetails as any).margin}</span>
                      </div>
                    </div>
                  )}

                  {/* Forex Custom Attribute cards */}
                  {directoryType === 'forex' && (
                    <div className="grid grid-cols-2 gap-2.5">
                      <div className="p-2.5 bg-black/45 border border-white/[0.02] rounded-xl">
                        <span className="text-[8px] font-mono uppercase text-zinc-500 block">Bid Price</span>
                        <span className="text-zinc-200 font-bold text-[10.5px] tracking-wide block mt-0.5">{(activeAssetDetails as any).bid}</span>
                      </div>
                      <div className="p-2.5 bg-black/45 border border-white/[0.02] rounded-xl">
                        <span className="text-[8px] font-mono uppercase text-zinc-500 block">Ask Price</span>
                        <span className="text-zinc-200 font-bold text-[10.5px] tracking-wide block mt-0.5">{(activeAssetDetails as any).ask}</span>
                      </div>
                      <div className="p-2.5 bg-black/45 border border-white/[0.02] rounded-xl col-span-2">
                        <span className="text-[8px] font-mono uppercase text-zinc-500 block">Sovereign Region</span>
                        <span className="text-zinc-200 font-bold text-[10.5px] tracking-wide block mt-0.5">{(activeAssetDetails as any).region}</span>
                      </div>
                    </div>
                  )}

                  {/* Crypto Custom Attribute cards */}
                  {directoryType === 'crypto' && (
                    <div className="grid grid-cols-2 gap-2.5">
                      <div className="p-2.5 bg-black/45 border border-white/[0.02] rounded-xl">
                        <span className="text-[8px] font-mono uppercase text-zinc-500 block">Market Cap</span>
                        <span className="text-zinc-200 font-bold text-[10.5px] tracking-wide block mt-0.5">{(activeAssetDetails as any).cap}</span>
                      </div>
                      <div className="p-2.5 bg-black/45 border border-white/[0.02] rounded-xl">
                        <span className="text-[8px] font-mono uppercase text-zinc-500 block">Circulating Supply</span>
                        <span className="text-zinc-200 font-bold text-[10.5px] tracking-wide block mt-0.5">{(activeAssetDetails as any).supply}</span>
                      </div>
                      <div className="p-2.5 bg-black/45 border border-white/[0.02] rounded-xl col-span-2">
                        <span className="text-[8px] font-mono uppercase text-zinc-500 block">Consensus Protocol</span>
                        <span className="text-zinc-300 text-[10px] break-keep font-sans block mt-0.5">{(activeAssetDetails as any).protocol}</span>
                      </div>
                    </div>
                  )}

                  {/* Commodities Custom Attribute cards */}
                  {directoryType === 'commodities' && (
                    <div className="grid grid-cols-2 gap-2.5">
                      <div className="p-2.5 bg-black/45 border border-white/[0.02] rounded-xl">
                        <span className="text-[8px] font-mono uppercase text-zinc-500 block">Price Unit</span>
                        <span className="text-zinc-200 font-bold text-[10.5px] tracking-wide block mt-0.5">{(activeAssetDetails as any).unit}</span>
                      </div>
                      <div className="p-2.5 bg-black/45 border border-white/[0.02] rounded-xl">
                        <span className="text-[8px] font-mono uppercase text-zinc-500 block">Active Contract</span>
                        <span className="text-zinc-200 font-bold text-[10.5px] tracking-wide block shrink-0 mt-0.5 truncate">{(activeAssetDetails as any).contract}</span>
                      </div>
                      <div className="p-2.5 bg-black/45 border border-white/[0.02] rounded-xl col-span-2">
                        <span className="text-[8px] font-mono uppercase text-zinc-500 block">Primary Resource Base</span>
                        <span className="text-zinc-300 text-[10px] break-keep font-sans block mt-0.5">{(activeAssetDetails as any).region}</span>
                      </div>
                    </div>
                  )}

                  {/* Text descriptions */}
                  <div className="flex flex-col gap-1.5 text-xs text-zinc-300 leading-relaxed font-sans">
                    <p className="border-t border-white/5 pt-3 text-[10.5px] pr-1 leading-normal italic text-zinc-400">
                      "{activeAssetDetails.desc}"
                    </p>
                    <p className="text-[9.5px] border-t border-white/5 pt-2 text-zinc-500 leading-normal">
                      <strong className="text-zinc-400 font-bold block mb-0.5 font-mono text-[8px] uppercase">HISTORICAL ROOT:</strong>
                      {activeAssetDetails.history}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>
      )}

      {/* 1. CINEMATIC GRADIENT HEADER */}
      <section className={`p-8 bg-gradient-to-r ${isCrypto ? 'from-[#ff5a1f]/15' : colorClasses.from} via-neutral-950 to-neutral-950 border ${isCrypto ? 'border-[#ff5a1f]/30' : colorClasses.border} rounded-3xl relative overflow-hidden shadow-xl`}>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.015)_0%,transparent_60%)] pointer-events-none" />
        <div className="flex items-center gap-2 mb-2 font-mono text-[9px] uppercase tracking-[0.25em]">
          <span className={`${isCrypto ? 'text-[#ff5a1f] drop-shadow-[0_0_6px_rgba(255,90,31,0.4)]' : colorClasses.text} font-black`}>{item.tagline}</span>
          <span className="text-zinc-650">•</span>
          <span className="text-zinc-400">ACTIVE INTELLECTUAL DOSSIER</span>
        </div>
        <h2 className={`${isCrypto ? 'text-[#ff5a1f] drop-shadow-[0_0_12px_rgba(255,90,31,0.65)]' : 'text-white'} font-black text-2xl lg:text-3.5xl tracking-tight leading-none uppercase`}>
          {item.title}
        </h2>
        <div className="w-12 h-1 bg-white/10 rounded-full mt-4 mb-3.5" />
        <p className="text-zinc-300 text-xs md:text-sm leading-relaxed max-w-3xl font-medium">
          {item.definition}
        </p>
      </section>

      {/* 2. INTELLECTUAL DEPTH SELECTOR (BEGINNER TO EXPERT DYNAMIC THERMOSTAT) */}
      <section className="p-6 bg-black/40 border border-white/5 rounded-3xl flex flex-col gap-5 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-3 flex items-center gap-1.5 text-[8px] font-mono uppercase text-zinc-500 tracking-wider">
          <GraduationCap className="w-3.5 h-3.5 text-[#00D9FF]" />
          <span>Syllabus calibrator working</span>
        </div>
        
        <div className="flex flex-col gap-1.5 text-left">
          <span className={`font-mono text-[9px] uppercase tracking-wider ${colorClasses.text} font-bold`}>Scale cognitive calibration</span>
          <h3 className="text-white font-extrabold text-xs uppercase tracking-wide">Adjust Learning Depth Target</h3>
        </div>

        {/* Depth Thermostat Slider/Bar */}
        <div className="bg-neutral-950/80 border border-white/5 p-1 rounded-2xl flex w-full md:w-max gap-1">
          {[
            { id: 'beginner', label: 'Beginner 🎈', desc: 'Ages 10+ analogies' },
            { id: 'intermediate', label: 'Intermediate 🏠', desc: 'Everyday cash connections' },
            { id: 'advanced', label: 'Advanced Scholar 🎓', desc: 'Macro equations & frameworks' },
          ].map((depth) => (
            <button
              key={depth.id}
              onClick={() => setLearningDepth(depth.id as any)}
              className={`flex-1 md:flex-none py-2.5 px-5 rounded-xl transition-all cursor-pointer text-left flex flex-col gap-0.5 ${learningDepth === depth.id ? `${colorClasses.bgGlow} border ${colorClasses.borderActive} text-white font-bold` : 'hover:bg-white/5 border border-transparent text-zinc-500'}`}
            >
              <span className="text-[10.5px] uppercase tracking-wider font-extrabold">{depth.label}</span>
              <span className="text-[8.5px] font-mono font-medium text-zinc-500 block truncate max-w-[130px]">{depth.desc}</span>
            </button>
          ))}
        </div>

        {/* Active Depth Material Card */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          
          {/* Main text box */}
          <div className="lg:col-span-7 p-6 bg-[#030612]/95 border border-white/5 rounded-2xl shadow-inner relative flex flex-col justify-between">
            <div className={`absolute top-0 left-0 h-full w-1 ${colorClasses.text === 'text-indigo-400' ? 'bg-indigo-500' : 'bg-current'}`} />
            <div>
              <span className="text-[8.5px] font-mono uppercase tracking-widest text-zinc-500 block mb-2">CALIBRATION READOUT:</span>
              <p className="text-zinc-200 text-xs leading-relaxed font-sans font-medium transition-all duration-350 select-text">
                {getActiveDepthText()}
              </p>
            </div>
            
            {/* Context tag lines */}
            <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-[8px] font-mono text-zinc-500">
              <span>INTELLECT: {learningDepth.toUpperCase()} MODE ACTIVE</span>
              <span className={`${colorClasses.text} font-black`}>COGNITIVE GRADES ACCELERATED</span>
            </div>
          </div>

          {/* Everyday Life Connections Panel */}
          <div className="lg:col-span-5 p-5 bg-[#01040a]/90 border border-white/5 rounded-2xl flex flex-col gap-3.5 justify-between">
            <div>
              <h4 className="text-white font-extrabold text-[10px] uppercase tracking-widest font-mono border-b border-white/5 pb-2 mb-3 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#00D9FF] animate-ping" />
                EVERYDAY ECONOMIC TRANSMISSION
              </h4>
              <div className="flex flex-col gap-3">
                {rawEnriched.connections.map((conn, idx) => (
                  <div key={idx} className="flex gap-2.5 items-start bg-black/35 p-2.5 rounded-xl border border-white/[0.02]">
                    <div className="p-2 bg-neutral-900 border border-white/5 rounded-lg shrink-0">
                      {getDepthIcon(conn.type)}
                    </div>
                    <div>
                      <h5 className="text-[10.5px] font-bold tracking-wide text-white font-sans uppercase leading-none">{conn.title}</h5>
                      <p className="text-zinc-400 text-[9px] leading-relaxed mt-0.5 font-mono">{conn.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* 3. THE "HOW EVERYTHING CONNECTS" LIVE CAUSAL SIMULATOR */}
      <section className="p-6 bg-black/45 border border-white/5 rounded-3xl flex flex-col gap-5 relative overflow-hidden shadow-lg">
        <div className="absolute top-0 right-0 p-3 text-[8.5px] font-mono uppercase text-zinc-500 tracking-wider flex items-center gap-1">
          <Activity className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
          <span>Event simulation deck loaded</span>
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between items-start gap-4">
          <div className="flex flex-col gap-1 text-left max-w-2xl">
            <span className={`font-mono text-[9px] uppercase tracking-wider ${colorClasses.text} font-black`}>Systemic Transmission Plumbings</span>
            <h3 className="text-white font-black text-xs uppercase tracking-wider">How This Concepts Flows Through the World</h3>
            <p className="text-zinc-400 text-[10.5px] leading-relaxed">
              Every economic action triggers a wave of upstream and downstream ripples. Trigger the simulation below to watch cause-and-effect transitions light up as variables settle.
            </p>
          </div>

          <button
            onClick={runCausalSimulation}
            disabled={isCascadeRunning}
            className={`py-3 px-5 border rounded-xl flex items-center gap-2.5 text-[10.5px] font-black uppercase font-mono tracking-widest shrink-0 transition-all cursor-pointer ${isCascadeRunning ? 'border-[#00D9FF]/20 bg-[#00D9FF]/5 text-zinc-500 cursor-not-allowed' : 'border-[#00D9FF] bg-[#00D9FF]/10 text-[#00D9FF] hover:bg-[#00d9ff] hover:text-black hover:shadow-[0_0_15px_rgba(0,217,255,0.4)]'}`}
          >
            {isCascadeRunning ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-[#00D9FF]" />
                Simulating Ripple...
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                Run Causal Cascade
              </>
            )}
          </button>
        </div>

        {/* Dynamic Causal Chain Nodes */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 mt-3 relative">
          {rawEnriched.causalFlow.map((node, i) => {
            const isCleared = i < currentCascadeIndex;
            const isActive = i === currentCascadeIndex;
            const isPending = i > currentCascadeIndex && currentCascadeIndex !== -1;
            const isIdle = currentCascadeIndex === -1;

            let borderStyle = 'border-white/5 bg-[#030612]/30 text-zinc-505 opacity-65';
            if (isIdle) {
              borderStyle = 'border-white/5 bg-[#030612]/60 text-zinc-400 hover:border-white/15';
            } else if (isActive) {
              borderStyle = colorClasses.nodeActive;
            } else if (isCleared) {
              borderStyle = 'border-emerald-500/30 bg-emerald-950/20 text-emerald-200 shadow-[0_0_10px_rgba(16,185,129,0.05)]';
            } else if (isPending) {
              borderStyle = 'border-white/5 bg-black/60 text-zinc-700 opacity-25';
            }

            return (
              <div 
                key={i}
                className={`p-4 rounded-2xl border transition-all duration-500 ease-out text-left relative flex flex-col justify-between ${borderStyle}`}
                style={{ minHeight: '120px' }}
              >
                <div>
                  <div className="flex items-center justify-between border-b border-white/5 pb-1.5 mb-2 font-mono text-[8.5px]">
                    <span className={isActive ? 'text-[#00D9FF] font-black' : (isCleared ? 'text-emerald-400 font-bold' : 'text-zinc-500')}>
                      STEP 0{i + 1}
                    </span>
                    
                    {node.direction === 'up' && <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />}
                    {node.direction === 'down' && <TrendingUp className="w-3.5 h-3.5 text-red-400 rotate-180" />}
                    {node.direction === 'neutral' && <Activity className="w-3.5 h-3.5 text-zinc-500" />}
                  </div>

                  <h5 className={`${(() => {
                    const normalized = (node.step || '').toLowerCase();
                    const isLava = normalized.includes("cryptographic work solve") ||
                                   normalized.includes("decentralized state") ||
                                   normalized.includes("local cash fleeing") ||
                                   normalized.includes("automatic code") ||
                                   normalized.includes("regulatory auditing");
                    return isLava ? "text-[#FF4500] drop-shadow-[0_0_8px_rgba(255,69,0,0.85)] font-black" : "text-white";
                  })()} font-extrabold text-[10px] leading-tight tracking-wide uppercase line-clamp-2`}>{node.step}</h5>
                </div>

                <p className="text-zinc-450 text-[8.5px] leading-relaxed mt-2 font-mono">{node.effect}</p>

                {/* Animated status tag */}
                {isActive && (
                  <span className="absolute bottom-2 right-2 flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00D9FF] opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00D9FF]"></span>
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* 4. CHRONICLED TIMELINE HISTORY & CRISES */}
      <section className="p-6 bg-black/20 border border-white/5 rounded-3xl flex flex-col gap-5">
        <div className="flex flex-col gap-1">
          <span className={`font-mono text-[9px] uppercase tracking-wider ${colorClasses.text} font-bold`}>Why History Matters</span>
          <h3 className="text-[#FF4500] drop-shadow-[0_0_8px_rgba(255,69,0,0.85)] font-black text-xs uppercase tracking-wider">Historical Precedents & Market Panics</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {rawEnriched.precedents.map((prec, idx) => (
            <div 
              key={idx} 
              className="p-5 rounded-2xl bg-gradient-to-br from-neutral-950 to-[#02040c] border border-white/5 hover:border-white/10 transition-all flex flex-col justify-between text-left relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-3 font-mono font-black text-zinc-700 text-[16px] select-none">{idx + 1}</div>
              <div>
                <span className={`font-mono font-black text-[10.5px] tracking-wider py-1 px-2.5 bg-white/5 border border-white/5 rounded ${colorClasses.text} inline-block mb-3.5`}>
                  {prec.year}
                </span>
                <h4 className={`${(() => {
                  const normalized = (prec.name || '').toLowerCase();
                  const isLava = normalized.includes("satoshi bitcoin release") ||
                                 normalized.includes("ethereum state") ||
                                 normalized.includes("turing launch");
                  return isLava ? "text-[#FF4500] drop-shadow-[0_0_8px_rgba(255,69,0,0.85)] font-black" : "text-white";
                })()} font-extrabold text-[11.5px] uppercase tracking-wide leading-tight mb-2`}>{prec.name}</h4>
                <p className="text-zinc-400 text-[10.5px] leading-relaxed mb-4">{prec.impact}</p>
              </div>
              
              <div className="pt-3 border-t border-white/5 mt-auto">
                <span className="text-[7.5px] font-mono uppercase tracking-widest text-zinc-500 block font-bold mb-1">CORE ECONOMIC LESSON:</span>
                <p className="text-zinc-300 text-[9.5px] font-medium leading-relaxed font-sans">{prec.lesson}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 5. VISUAL TAKEAWAY DECK */}
      <div className={`p-6 bg-gradient-to-r ${colorClasses.bgGlow} to-transparent border border-white/5 rounded-3xl flex items-start gap-3 shadow-sm`}>
        <div className={`p-2 rounded-xl bg-white/5 border border-white/10 shrink-0 ${colorClasses.text}`}>
          <Lightbulb className="w-4.5 h-4.5 animate-bounce" />
        </div>
        <div>
          <span className="text-[9.5px] font-mono tracking-wider text-zinc-450 font-bold block uppercase">Core Takeaway</span>
          <p className="text-white font-extrabold text-xs mt-1 leading-normal">
            {item.keyTakeaway}
          </p>
        </div>
      </div>

      {/* 6. EXPANDABLE DISCLOSURES DEEP-DIVES */}
      <section className="flex flex-col gap-3">
        <h3 className="text-white font-black text-xs uppercase tracking-wider pl-1 font-mono">Academic Disclosures</h3>
        <div className="flex flex-col gap-2.5">
          {item.detailsDisclosures.map((disclosure, i) => {
            const isExpanded = !!expandedDisclosures[i];
            return (
              <div 
                key={i} 
                className="border border-white/5 bg-[#030612]/75 hover:bg-[#050b1d]/80 rounded-2xl overflow-hidden transition-all duration-300"
              >
                <button
                  onClick={() => toggleDisclosure(i)}
                  className="w-full p-4 text-left flex items-center justify-between text-xs font-semibold text-white uppercase tracking-wider cursor-pointer"
                >
                  <span className="flex items-center gap-2 select-none">
                    <HelpCircle className={`w-4 h-4 ${colorClasses.text}`} />
                    {disclosure.q}
                  </span>
                  <ChevronRight className={`w-4 h-4 text-zinc-500 transition-transform duration-300 ${isExpanded ? 'rotate-90' : ''}`} />
                </button>
                <div 
                  className={`transition-all duration-350 ease-in-out ${isExpanded ? 'max-h-[500px] border-t border-white/5 opacity-100 p-4' : 'max-h-0 opacity-0 overflow-hidden'}`}
                >
                  <p className="text-zinc-300 text-[11px] leading-relaxed">
                    {disclosure.a}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 7. INTERACTIVE RELATED SYSTEMS EXPLORER (EDUCATIONAL LOOPS & RELATED RABBIT HOLES) */}
      {(() => {
        const related = RELATED_TOPICS_MAP[item.title];
        if (!related || related.length === 0) return null;
        return (
          <section className="p-6 bg-gradient-to-r from-white/[0.01] via-white/[0.03] to-transparent border border-white/5 rounded-3xl flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <Compass className="w-5 h-5 text-[#00D9FF] animate-spin" style={{ animationDuration: '16s' }} />
              <div>
                <span className="text-[9px] font-mono tracking-wider text-zinc-500 font-bold block uppercase">Knowledge Rabbit Holes</span>
                <h3 className="text-white font-black text-xs uppercase tracking-wider">Explore Related Financial Nodes</h3>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3.5">
              {related.map((rel, idx) => (
                <button
                  key={idx}
                  onClick={() => onNavigate && onNavigate(rel.path)}
                  className="p-4 bg-black/60 hover:bg-neutral-900/60 border border-white/5 hover:border-white/20 rounded-2xl text-left transition-all duration-305 group cursor-pointer flex flex-col justify-between"
                  style={{ minHeight: '140px' }}
                >
                  <div>
                    <div className="text-[8px] uppercase font-mono text-zinc-500 font-black mb-1.5 flex items-center justify-between">
                      <span>LOOP DIRECTIVE 0{idx + 1}</span>
                      <ChevronRight className="w-3 h-3 text-zinc-650 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <h4 className="text-white text-xs font-black leading-tight uppercase group-hover:text-[#00D9FF] transition-colors">{rel.title}</h4>
                    <p className="text-[9px] leading-relaxed text-zinc-450 mt-1.5 font-mono group-hover:text-zinc-300 truncate-3-lines">{rel.connection}</p>
                  </div>
                  
                  <div className="text-[8.5px] font-mono text-[#00D9FF]/70 tracking-widest uppercase mt-3.5 flex items-center gap-1.5 font-bold">
                    <span>EXPLORE PATHWAY</span>
                    <ArrowRight className="w-3 h-3 group-hover:translate-x-1.5 transition-transform" />
                  </div>
                </button>
              ))}
            </div>
          </section>
        );
      })()}

      {/* ========================================================= */}
      {/* 7.5 CORE SPECIALIZED CRYPTO INTELLIGENCE DIRECTIVE (2026) */}
      {/* ========================================================= */}
      {isCrypto && (
        <section className="p-6 bg-[#040815]/95 border border-[#ff5a1f]/30 rounded-3xl flex flex-col gap-6 relative overflow-hidden shadow-[0_0_25px_rgba(255,90,31,0.08)]">
          <div className="absolute top-0 right-0 p-3.5 flex items-center gap-2 text-[8.5px] font-mono uppercase text-[#ff5a1f] tracking-widest font-black">
            <span className="w-1.5 h-1.5 bg-[#ff5a1f] rounded-full animate-ping" />
            <span>Sector Systems Intel Node (2026)</span>
          </div>

          <div className="flex flex-col gap-1.5 text-left select-none">
            <span className="font-mono text-[9px] uppercase tracking-widest text-[#ff5a1f] font-black">
              ★ PEDAGOGICAL DEEP RESEARCH CYCLE
            </span>
            <h3 className="text-white font-black text-xl tracking-tight uppercase leading-none">
              CRYPTO SYSTEMS INTELLIGENCE BOARD
            </h3>
            <p className="text-zinc-400 text-xs mt-2 max-w-4xl leading-relaxed font-semibold">
              Explore dynamic multi-dimensional breakdowns of contemporary digital asset structures, sovereign reserves stablecoin collateral flows, network vulnerability vectors, and banking rail adoptions.
            </p>
          </div>

          {/* Tab Selection Row */}
          <div className="flex flex-wrap gap-1.5 border-b border-white/5 pb-2.5">
            {[
              { id: 'sectors', label: 'SECTOR INTEL & ADOPTION' },
              { id: 'security', label: 'BLOCKCHAIN SCAMS AUDIT' },
              { id: 'stablecoins_ai', label: 'STABLECOINS & AI ASSETS' },
              { id: 'pizza_day', label: 'BITCOIN PIZZA DAY CHRONO' },
              { id: 'glossary', label: 'CRYPTO GLOSSARY 2026' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setCryptoTab(tab.id as any)}
                className={`py-1.5 px-3 rounded-lg font-mono text-[9px] font-extrabold uppercase transition-all tracking-wider cursor-pointer ${
                  cryptoTab === tab.id
                    ? 'bg-[#ff5a1f] text-neutral-950 shadow-[0_0_12px_rgba(255,90,31,0.3)]'
                    : 'bg-white/5 hover:bg-white/10 text-zinc-450 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Sub-tab Rendering Logic */}
          <div className="text-left font-sans text-xs">
            
            {/* SUB-TAB 1: SECTORS & ADOPTION */}
            {cryptoTab === 'sectors' && (
              <div className="flex flex-col gap-6 animate-fadeIn">
                
                {/* Largest Crypto Categories Table */}
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-[#ff5a1f]" />
                    <h4 className="text-white font-black text-xs uppercase tracking-wider">
                      Largest Crypto Categories Index (2026 Coordinates)
                    </h4>
                  </div>
                  <p className="text-zinc-450 text-[10.5px] leading-normal font-semibold">
                    Aggregate size, core assets, and estimated institutional builder momentum compiled across public RPC nodes.
                  </p>

                  <div className="border border-white/5 rounded-2xl overflow-hidden bg-black/40">
                    <table className="w-full font-mono text-[10px] text-left">
                      <thead>
                        <tr className="bg-white/[0.02] border-b border-white/5 text-zinc-450 font-black">
                          <th className="p-3">CATEGORY NAME</th>
                          <th className="p-3">EST. MARKET RES.</th>
                          <th className="p-3">KEY PROTOCOLS / ASSETS</th>
                          <th className="p-3">MOMENTUM (2026)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5 text-zinc-350">
                        <tr>
                          <td className="p-3 font-bold text-white">Layer 1 Base Ledgers</td>
                          <td className="p-3">$1.20 Trillion</td>
                          <td className="p-3">Bitcoin (BTC), Ethereum (ETH), Solana (SOL)</td>
                          <td className="p-3 text-emerald-400 font-bold">▲ +18% Moderate</td>
                        </tr>
                        <tr>
                          <td className="p-3 font-bold text-white">Real World Assets (RWA)</td>
                          <td className="p-3">$120 Billion</td>
                          <td className="p-3">BlackRock BUIDL, Securitized Treasuries, Ondo (OUSG)</td>
                          <td className="p-3 text-emerald-400 font-bold">▲ +82% Parabolic</td>
                        </tr>
                        <tr>
                          <td className="p-3 font-bold text-white">Liquidity Staking (LST/LRT)</td>
                          <td className="p-3">$80 Billion</td>
                          <td className="p-3">Lido (stETH), Ether.fi (eETH), Jito (JitoSOL)</td>
                          <td className="p-3 text-emerald-400 font-bold">▲ +35% Stable</td>
                        </tr>
                        <tr>
                          <td className="p-3 font-bold text-white">Layer 2 (Rollup Scaling)</td>
                          <td className="p-3">$65 Billion</td>
                          <td className="p-3">Arbitrum (ARB), Base Network, Optimism (OP)</td>
                          <td className="p-3 text-emerald-400 font-bold">▲ +28% Regular</td>
                        </tr>
                        <tr>
                          <td className="p-3 font-bold text-white">Quantitative Computing Networks</td>
                          <td className="p-3">$52 Billion</td>
                          <td className="p-3">Virtuals Protocol, Spectral (SPEC), Bittensor (TAO)</td>
                          <td className="p-3 text-emerald-400 font-bold">▲ +115% Hyper-scale</td>
                        </tr>
                        <tr>
                          <td className="p-3 font-bold text-white">DePIN (Hardware Infrastructure)</td>
                          <td className="p-3">$38 Billion</td>
                          <td className="p-3">Helium (HNT), Render Network (RENDER), Filecoin (FIL)</td>
                          <td className="p-3 text-emerald-400 font-bold">▲ +60% Accelerated</td>
                        </tr>
                        <tr>
                          <td className="p-3 font-bold text-white">Modular Data Availability</td>
                          <td className="p-3">$25 Billion</td>
                          <td className="p-3">Celestia (TIA), EigenDA, Avail</td>
                          <td className="p-3 text-emerald-400 font-bold">▲ +45% Strong</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Grow vs Dying */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-emerald-950/10 border border-emerald-500/20 rounded-2xl flex flex-col gap-3">
                    <span className="font-mono text-[9px] text-emerald-400 font-black tracking-widest uppercase">
                      ▲ GROWING CRITICAL SECTORS
                    </span>
                    <ul className="flex flex-col gap-3 leading-relaxed text-zinc-300">
                      <li>
                        <strong className="text-white block text-[11px] uppercase">Quantitative Algorithmic Pipelines (+115%)</strong>
                        Tokens designed to optimize capital allocation and execute math-defined algorithmic operations with minimized operational friction.
                      </li>
                      <li>
                        <strong className="text-white block text-[11px] uppercase">Tokenized US Treasuries (RWA) (+82%)</strong>
                        TradFi assets brought on-chain. Sovereign short-term paper yields are directly embedded as collateral in decentralized protocols.
                      </li>
                      <li>
                        <strong className="text-white block text-[11px] uppercase">Parallel Move Virtual Machines (+75%)</strong>
                        Sui and Aptos non-EVM concurrency networks proving resilient against standard gas price wars and smart-contract sandwich loops.
                      </li>
                    </ul>
                  </div>

                  <div className="p-4 bg-rose-950/10 border border-rose-500/20 rounded-2xl flex flex-col gap-3">
                    <span className="font-mono text-[9px] text-rose-400 font-black tracking-widest uppercase">
                      ▼ STAGNANT / DYING SECTORS
                    </span>
                    <ul className="flex flex-col gap-3 leading-relaxed text-zinc-300">
                      <li>
                        <strong className="text-white block text-[11px] uppercase">Copycat EVM Alt-L1s (-42%)</strong>
                        Generic single-ledger forks that offer redundant consensus networks without any organic builder adoption or distinct tech stack.
                      </li>
                      <li>
                        <strong className="text-white block text-[11px] uppercase">Metaverse Virtual Real Estate (-85%)</strong>
                        Empty pixel land parcels lacking real game-loops, and struggling to retain active active user counts post-hyped cycles.
                      </li>
                      <li>
                        <strong className="text-white block text-[11px] uppercase">Under-Collateralized Algorithmic Pegs (-92%)</strong>
                        Stablecoins backed primarily by native synthetic assets, proving highly prone to catastrophic arbitrage death-spins.
                      </li>
                    </ul>
                  </div>
                </div>

                {/* Banker & Institutional Adoption */}
                <div className="p-4 bg-neutral-905/60 border border-white/5 rounded-2xl flex flex-col gap-3">
                  <strong className="text-white uppercase text-[11px] block">
                    Institutional Cleared & Banker Settlement Corridors (2026)
                  </strong>
                  <p className="text-zinc-400 leading-relaxed text-[10.5px]">
                    Mainstream financial institutions have abandoned sandbox mock testing, deploying massive live funds onto stable clearing pathways:
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-1 font-mono text-[10px]">
                    <div className="p-3 bg-black/40 rounded-xl border border-white/5">
                      <span className="text-[#ff5a1f] font-black uppercase">1. ETHEREUM FUNDS (ERC-3643)</span>
                      <p className="text-zinc-400 text-[9.5px] mt-1 leading-normal font-sans">
                        Dominates tokenized capital markets. Funds like BlackRock's BUIDL utilize Ethereum standard ERC-3643 to clear institutional cash flows 24/7.
                      </p>
                    </div>
                    <div className="p-3 bg-black/40 rounded-xl border border-white/5">
                      <span className="text-yellow-400 font-black uppercase">2. JP MORGAN ONYX LEDGER</span>
                      <p className="text-zinc-400 text-[9.5px] mt-1 leading-normal font-sans">
                        A private, highly-compliant EVM subnet clearing more than $1 Trillion in daily corporate transaction sweeps and interbank swaps.
                      </p>
                    </div>
                    <div className="p-3 bg-black/40 rounded-xl border border-white/5">
                      <span className="text-cyan-400 font-black uppercase">3. RIPPLE CORRIDORS (XRP)</span>
                      <p className="text-zinc-400 text-[9.5px] mt-1 leading-normal font-sans">
                        Utilized by regional Asian and Middle-Eastern bank nodes to route cross-border retail payments, bypassing traditional SWIFT multi-day logs.
                      </p>
                    </div>
                    <div className="p-3 bg-black/40 rounded-xl border border-white/5">
                      <span className="text-emerald-400 font-black uppercase">4. STELLAR REMITTANCE (XLM)</span>
                      <p className="text-zinc-400 text-[9.5px] mt-1 leading-normal font-sans">
                        Handles micro-remittance channels, allowing global corridors to settle physical currency equivalents for under 1/10th of a cent in seconds.
                      </p>
                    </div>
                  </div>
                </div>

              </div>
            )}

            {/* SUB-TAB 2: BLOCKCHAIN SCAMS AUDIT */}
            {cryptoTab === 'security' && (
              <div className="flex flex-col gap-6 animate-fadeIn text-zinc-300 leading-relaxed">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-rose-500 animate-pulse" />
                  <h4 className="text-white font-black text-xs uppercase tracking-wider">
                    Sovereign Blockchains Ledger Vulnerability Audit
                  </h4>
                </div>
                <p className="text-zinc-400 text-[10.5px]">
                  Unbiased quantitative review of smart-contract risks, transaction hijackings, and rug rate events compiled across ecosystem monitoring agencies.
                </p>

                <div className="border border-white/5 rounded-2xl overflow-hidden bg-black/40">
                  <table className="w-full font-mono text-[10px] text-left">
                    <thead>
                      <tr className="bg-white/[0.02] border-b border-white/5 text-zinc-450 font-black">
                        <th className="p-3">BLOCKCHAIN LEDGER</th>
                        <th className="p-3 text-center">RUG / SCAM INCIDENCE</th>
                        <th className="p-3">PRIMARY THREAT PROFILE</th>
                        <th className="p-3">REASON FOR RESILIENCE HOLES</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-zinc-350">
                      <tr>
                        <td className="p-3 font-bold text-white">Base Network</td>
                        <td className="p-3 text-center text-rose-400 hover:scale-105 transition-transform">38% Rug-Pull rate</td>
                        <td className="p-3">Meme-token launchpads, fast liquidity drain pools</td>
                        <td className="p-3">Sub-cent gas fees and instant deploy scripts enable rapid scam cycles.</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-bold text-white">Binance Smart Chain (BSC)</td>
                        <td className="p-3 text-center text-rose-450">24% Honeypot rate</td>
                        <td className="p-3">Locked contract withdrawal parameters, proxy re-routes</td>
                        <td className="p-3">EVM copy-paste contracts often contain hidden "mint" or "disable swap" backdoors.</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-bold text-white">Ethereum Mainnet</td>
                        <td className="p-3 text-center text-amber-400">18% Phishing / Drainers</td>
                        <td className="p-3">Signature approval hijack structures (permit, setApprovalForAll)</td>
                        <td className="p-3">Complex vault approvals combined with human wallet fatigue results in drained assets.</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-bold text-white">Solana</td>
                        <td className="p-3 text-center text-amber-500">8% Authority Locks</td>
                        <td className="p-3">Freeze-authority abuses, raydium LP pool locks, pump drainers</td>
                        <td className="p-3">Mass deployer bots auto-launching highly volatile micro-cap tokens hourly.</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-bold text-white">Tron Network</td>
                        <td className="p-3 text-center text-[#ff5a1f]">12% Multi-sig hijacking</td>
                        <td className="p-3">Unauthorized ownership switches, proxy permission swaps</td>
                        <td className="p-3">Remittance users signing offline approval scripts to bypass TRX gas limits.</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="p-4 bg-rose-950/10 border border-rose-500/20 rounded-2xl flex flex-col gap-2">
                  <span className="font-mono text-[9px] text-rose-400 font-extrabold uppercase tracking-widest block">
                    ★ CRITICAL CYBER-DEFUSE ADVISORY for TRADERS
                  </span>
                  <p className="text-[10.5px] leading-relaxed">
                    Always audit smart-contract addresses on trusted explorer nodes like Etherscan or Solscan. Check for (1) **Renounced Ownership** (verifying dev accounts cannot change rules), (2) **Locked Liquidity Pools** (meaning LP tokens are stored in un-executable time-lock vaults rather than designer wallets), and (3) **Verified Source Code** compilation signatures.
                  </p>
                </div>
              </div>
            )}

            {/* SUB-TAB 3: STABLECOINS & AI ASSETS */}
            {cryptoTab === 'stablecoins_ai' && (
              <div className="flex flex-col gap-6 animate-fadeIn">
                
                {/* How stablecoins work */}
                <div className="p-5 bg-neutral-950/80 border border-white/5 rounded-2xl flex flex-col gap-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4.5 h-4.5 text-cyan-400" />
                    <h4 className="text-white font-black text-xs uppercase tracking-wider leading-none">
                      How Stablecoins Actually Work (Reserves & Redemptions)
                    </h4>
                  </div>
                  <p className="text-zinc-400 leading-normal text-[10.5px]">
                    Stablecoins are not magic digital tokens; they are tokenized balance sheets. Let's deconstruct the core collateral backing model:
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 font-mono text-[9.5px] text-left mt-1">
                    <div className="p-3.5 bg-black/50 border border-white/5 rounded-xl flex flex-col gap-1.5">
                      <span className="text-cyan-400 font-black">1. REGISTERED USD INTAKE</span>
                      <p className="text-zinc-500 text-[9px] leading-relaxed font-sans">
                        An institutional trader deposits $100 Million fiat USD directly with Circle or Tether's designated bank account.
                      </p>
                    </div>
                    <div className="p-3.5 bg-black/50 border border-white/5 rounded-xl flex flex-col gap-1.5">
                      <span className="text-purple-400 font-black">2. TOKEN MINT & ROUTING</span>
                      <p className="text-zinc-500 text-[9px] leading-relaxed font-sans">
                        The smart contract mints 100M ERC-20 stablecoin units to the trader's public ledger address, adding to the circulating supply.
                      </p>
                    </div>
                    <div className="p-3.5 bg-black/50 border border-white/5 rounded-xl flex flex-col gap-1.5">
                      <span className="text-[#ff5a1f] font-black">3. 1:1 REDEMPTION CYCLE</span>
                      <p className="text-zinc-500 text-[9px] leading-relaxed font-sans">
                        The trader can return digital tokens to receive physical fiat. The returned tokens are burned (destroyed), and USD is wired.
                      </p>
                    </div>
                  </div>

                  <div className="p-4 bg-cyan-950/10 border border-cyan-500/20 rounded-xl leading-relaxed text-zinc-300 text-[10.5px]">
                    <strong className="text-white block uppercase mb-1">
                      Where is the Collateral Stored? (US Treasuries Connection)
                    </strong>
                    Stablecoin giants like **Tether (USDT)** and **Circle (USDC)** do not keep bulk paper cash in bank vaults. Instead, they purchase billions of dollars in ultra-short-term **US Treasury Bills (T-Bills)** and cash equivalents. Tether alone is now one of the top 20 holders of US debt globally, capturing billions of dollars in risk-free interest yields annually while transferring immediate digital dollar access worldwide.
                  </div>
                </div>

                {/* AI Coins Tokenization */}
                <div className="p-4 bg-[#ff5a1f]/5 border border-[#ff5a1f]/20 rounded-2xl flex flex-col gap-3">
                  <span className="font-mono text-[9px] text-[#ff5a1f] font-black tracking-widest uppercase">
                    🤖 EXTREME DATA SHOCK: THE AI-GENERATED COIN CENSUS
                  </span>
                  <div className="flex flex-col gap-2 leading-relaxed text-zinc-300">
                    <p className="text-white font-extrabold text-[12px] leading-tight">
                      Systemic Estimates: Over 3.2 Million Tokens are currently AI-Automated
                    </p>
                    <p className="text-zinc-405 text-[10.5px]">
                      The emergence of AI token launchpads and algorithmic agents (like virtuals.io, spectral ecosystem, and automated pump bots) has led to an explosion of tokenization. AI agents are now operating autonomous on-chain wallets, writing smart contracts, and acting as decentralized liquidity providers. This has initiated a brand-new frontier where autonomous, software-driven micro-entities trade resources automatically.
                    </p>
                  </div>
                </div>

              </div>
            )}

            {/* SUB-TAB 4: BITCOIN PIZZA DAY CHRONOLOGY */}
            {cryptoTab === 'pizza_day' && (
              <div className="flex flex-col gap-5 animate-fadeIn text-zinc-300">
                <div className="flex items-center gap-2">
                  <Activity className="w-4.5 h-4.5 text-yellow-400" />
                  <h4 className="text-white font-black text-xs uppercase tracking-wider leading-none">
                    Historical Flashback: The Bitcoin Pizza Day Chronology (May 22, 2010)
                  </h4>
                </div>
                <p className="text-zinc-400 text-[10.5px]">
                  Tracing the absolute first physical transaction of a decentralized cryptographic code unit for material real-world goods.
                </p>

                {/* Chronology Steps */}
                <div className="relative border-l border-white/5 pl-4 ml-2 flex flex-col gap-6">
                  
                  <div className="relative">
                    <span className="absolute -left-6 top-1.5 w-3 h-3 rounded-full bg-yellow-405 border-4 border-neutral-950" />
                    <span className="font-mono text-[9px] text-yellow-400 font-bold uppercase py-0.5 px-2 bg-yellow-500/10 rounded-md border border-yellow-500/10 inline-block mb-1">
                      MAY 18, 2010 • THE FORUM OFFER
                    </span>
                    <p className="text-zinc-400 text-[10px] leading-relaxed font-sans mt-1">
                      <strong>Laszlo Hanyecz</strong>, an early Bitcoin developer and GPU mining pioneer, publishes an offer on the BitcoinTalk forum under username <em>'laszlo'</em>: "I'll pay 10,000 Bitcoins for a couple of pizzas... maybe 2 large ones so I have some left over for the next day."
                    </p>
                  </div>

                  <div className="relative">
                    <span className="absolute -left-6 top-1.5 w-3 h-3 rounded-full bg-yellow-405 border-4 border-neutral-950" />
                    <span className="font-mono text-[9px] text-yellow-400 font-bold uppercase py-0.5 px-2 bg-yellow-500/10 rounded-md border border-yellow-500/10 inline-block mb-1">
                      MAY 22, 2010 • THE TRANSACTION RESOLVED
                    </span>
                    <p className="text-zinc-400 text-[10px] leading-relaxed font-sans mt-1">
                      A 19-year-old developer named <strong>Jeremy Sturdivant</strong> (username <em>'jercos'</em>) accepts the deal. He orders <strong>two large Papa John's Pizzas</strong> to Laszlo's doorstep using credit, and Laszlo transfers the exactly agreed <strong>10,050 BTC</strong> (including fee) to Jeremy's wallet addresses.
                    </p>
                  </div>

                  <div className="relative">
                    <span className="absolute -left-6 top-1.5 w-3 h-3 rounded-full bg-[#ff5a1f] border-4 border-neutral-950" />
                    <span className="font-mono text-[9px] text-[#ff5a1f] font-bold uppercase py-0.5 px-2 bg-[#ff5a1f]/10 rounded-md border border-[#ff5a1f]/10 inline-block mb-1">
                      LEDGER COORDINATES & TX HASH
                    </span>
                    <div className="bg-black/60 border border-white/5 p-3 rounded-xl mt-1.5">
                      <span className="text-[9px] text-zinc-500 uppercase tracking-wide block font-mono">Official Blockchain Transaction Hash Identifier:</span>
                      <code className="text-white text-[8.5px] font-mono break-all font-bold block mt-1 hover:text-cyan-400 transition-colors cursor-pointer p-1 bg-white/5 rounded-md border border-white/5">
                        a1075db55d416d3ca199f55b6084e2115b9345e16c5cf302fc80e9d5fbf5d48d
                      </code>
                    </div>
                  </div>

                </div>

                {/* Comparative Analytics visual box */}
                <div className="p-4 bg-yellow-950/10 border border-yellow-500/20 rounded-2xl flex flex-col gap-3">
                  <span className="font-mono text-[9px] text-yellow-500 font-black tracking-widest uppercase block mb-1">
                    📊 THE VALUE SCALE EXPANSION (COMPARATIVE LEDGER GRID)
                  </span>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-1 font-mono text-[10px]">
                    <div className="p-3 bg-black/40 rounded-xl border border-white/5 flex flex-col gap-1 text-zinc-450 leading-relaxed">
                      <span className="text-zinc-400 font-extrabold uppercase">1. INITIAL DOLLAR PEG (2010 COST)</span>
                      <div className="text-white text-[12px] font-black font-mono mt-1">$41 USD total</div>
                      <p className="text-zinc-450 text-[9px] leading-normal font-sans mt-1">
                        Jeremy paid $41 out of pocket to purchase two standard medium/large pepperoni-and-cheese pizzas from a local Papa John's retailer.
                      </p>
                    </div>

                    <div className="p-3 bg-[#ff5a1f]/5 border border-[#ff5a1f]/20 rounded-xl flex flex-col gap-1 text-zinc-450 leading-relaxed">
                      <span className="text-[#ff5a1f] font-black uppercase">2. MODERN VALUE (2026 INDEX)</span>
                      <div className="text-white text-[12px] font-black font-mono mt-1">Over $1,100,000,000 USD</div>
                      <p className="text-zinc-450 text-[9px] leading-normal font-sans mt-1">
                        With spot Bitcoin trading at high sovereign baseline ranges, the same 10,000 Bitcoins represent over $1.1 Billion in currency.
                      </p>
                    </div>
                  </div>

                  {/* Creative scaling comparison */}
                  <div className="p-3 bg-black/50 border border-white/5 rounded-xl text-[10px] flex flex-col sm:flex-row gap-4 justify-between items-center mt-1 text-left">
                    <div className="flex-1">
                      <span className="text-white font-black uppercase text-[9px] block mb-0.5">Physical Scalability Comparison:</span>
                      <p className="text-zinc-400 text-[9.5px]">
                        What <strong>$41</strong> buys: A family dinner with pizza, garlic bread, and soda.
                        <br />
                        What <strong>$1.1 Billion</strong> buys: A complete sovereign fleet of **35 private G700 intercontinental jets** with private hangar slots.
                      </p>
                    </div>
                  </div>
                </div>

              </div>
            )}

            {/* SUB-TAB 5: GLOSSARY OF ENHANCED SYSTEMS */}
            {cryptoTab === 'glossary' && (
              <div className="flex flex-col gap-5 animate-fadeIn">
                <div className="flex items-center gap-2">
                  <Compass className="w-4.5 h-4.5 text-cyan-400 animate-spin" style={{ animationDuration: '20s' }} />
                  <h4 className="text-white font-black text-xs uppercase tracking-wider leading-none font-sans">
                    Crypto Industry Systemic glossary (2026 Edition)
                  </h4>
                </div>
                <p className="text-zinc-450 text-[10.5px]">
                  Click on any listed terminology below to reveal the structural mechanics and modern academic applications.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-1 text-left">
                  {[
                    {
                      term: 'EIP-4844 (Proto-Danksharding)',
                      def: 'A core Ethereum consensus update that introduces dynamic "Data Blobs", allowing Layer 2 rollups to store heavy data packets off-chain at a fraction of standard gas fees, dropping L2 costs below 90% instantly.'
                    },
                    {
                      term: 'Account Abstraction (ERC-4337)',
                      def: 'A vital cryptographic interface converting external user keys into full programmable smart-contracts, enabling social key recoveries, automated batch processes, gas sponsorships and seamless multi-device access.'
                    },
                    {
                      term: 'DePIN (Decentralized Physical Networks)',
                      def: 'Tokens utilized as global capital incentive systems to crowdsource the hosting of real physical computing hardware: distributed cloud servers, decentralized GPU rendering pools and local mesh WiFi hotspots.'
                    },
                    {
                      term: 'Real World Asset Tokenization (RWA)',
                      def: 'The mathematical bridging of traditional physical value items (sovereign bonds, real-estate land deeds, cargo titles, fine art) onto decentralized ledger layers as transparently redeemable ERC-20 security items.'
                    },
                    {
                      term: 'ZK-Coprocessors (Zero Knowledge)',
                      def: 'Specialized computing architectures designed to resolve heavy database lookups and computations off-chain, translating complex multi-block states into single, lightweight proofs written back to parent consensus nodes.'
                    }
                  ].map((gl, i) => (
                    <div 
                      key={i}
                      className="p-4 bg-neutral-950/80 hover:bg-neutral-900 border border-white/5 rounded-2xl flex flex-col gap-2 transition-all"
                    >
                      <strong className="text-white select-none block uppercase text-[10px] tracking-wider border-b border-white/5 pb-1 mb-1 font-mono hover:text-[#ff5a1f] transition-colors">
                        {gl.term}
                      </strong>
                      <p className="text-zinc-400 text-[10px] leading-relaxed">
                        {gl.def}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>

          {/* Border grid line background elements for obsidian dashboard styling */}
          <div className="absolute inset-0 max-h-[1px] bg-gradient-to-r from-transparent via-[#ff5a1f]/15 to-transparent top-0" />
          <div className="absolute inset-0 max-h-[1px] bg-gradient-to-r from-transparent via-white/5 to-transparent bottom-0" />
        </section>
      )}

      {/* 8. INFINITE DISCOVERY CONTINUATION SYSTEM */}
      <section className="p-6 bg-gradient-to-br from-[#FF00C8]/5 to-transparent border border-[#FF00C8]/10 rounded-3xl flex flex-col gap-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-[#FF00C8]/[0.015] pointer-events-none" />
        <div className="absolute top-0 right-0 p-3 text-[8.5px] font-mono uppercase text-[#FF00C8] font-black">
          Infinite Discovery Engine Running
        </div>

        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-[#FF00C8] animate-pulse" />
          <div>
            <span className="text-[9px] font-mono tracking-wider text-zinc-550 font-bold block uppercase">Curiosity Contributor</span>
            <h3 className="text-white font-black text-xs uppercase tracking-wider font-sans">Continue Exploring the Global Matrix</h3>
          </div>
        </div>

        <p className="text-zinc-400 text-xs leading-relaxed max-w-2xl">
          Don't stop learning here! Economic systems are infinite closed-loops. Tap any of the dynamic rabbit holes below to continue tracing the flows.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-2">
          {EXPLORATION_SUGGESTIONS.filter(item => item.title !== normalizedTitle).slice(0, 3).map((sugg, idx) => (
            <div 
              key={idx}
              onClick={() => onNavigate && onNavigate(sugg.path)}
              className="p-4 bg-neutral-950/80 hover:bg-[#FF00C8]/10 border border-white/5 hover:border-[#FF00C8]/30 transition-all rounded-2xl text-left cursor-pointer group flex flex-col justify-between"
            >
              <div>
                <span className="text-[8.5px] font-mono text-zinc-500 block uppercase mb-1">RABBIT HOLE 0{idx + 1}</span>
                <h4 className="text-white text-xs font-bold uppercase tracking-wide group-hover:text-[#FF00C8] transition-colors">{sugg.title}</h4>
                <p className="text-zinc-400 text-[10px] leading-relaxed mt-1 font-sans">{sugg.desc}</p>
              </div>
              <div className="text-[8.5px] font-mono text-[#FF00C8] tracking-widest uppercase mt-3.5 flex items-center gap-1 font-bold">
                <span>DIVE DEEP</span>
                <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
}
