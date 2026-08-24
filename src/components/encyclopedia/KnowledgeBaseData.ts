export interface KnowledgeItem {
  title: string;
  tagline: string;
  conceptColor: 'indigo' | 'cyan' | 'yellow' | 'red' | 'purple' | 'emerald';
  definition: string;
  simplifiedExplanation: string;
  academicDeconstruction: string;
  relationshipDiagram: { label: string; explanation: string }[];
  timeline: { year: string; title: string; desc: string }[];
  keyTakeaway: string;
  detailsDisclosures: { q: string; a: string }[];
  
  // NEW ENHANCEMENTS FOR SYSTEMIC DISCOVERY CYCLES
  beginnerExplanation?: string;
  intermediateExplanation?: string;
  advancedExplanation?: string;
  everydayConnections?: { title: string; desc: string; iconName: string }[];
  causalFlowSteps?: { step: string; effect: string; direction: 'up' | 'down' | 'neutral' }[];
  historicalPrecedents?: { crisis: string; year: string; impact: string; lesson: string }[];
}

export const ENCYCLOPEDIA_KNOWLEDGE_BASE: Record<string, KnowledgeItem> = {
  'encyclopedia/economy/inflation.html': {
    title: 'What Is Inflation?',
    tagline: 'MONETARY PRESSURE & CURRENCY DILUTION',
    conceptColor: 'indigo',
    definition: 'Inflation is the steady, aggregate rising trend of general consumer prices across an economy, representing the mathematical decline in purchasing power of a single sovereign fiat unit.',
    simplifiedExplanation: 'Think of a grand cookie market. If the cookie baker creates twice as many gold coins but makes the same number of cookies, people will bid more gold coins per cookie. The cookie didn\'t become larger; your coins just lost some power.',
    academicDeconstruction: 'Macroeconomists separate inflation into Demand-Pull (aggregate public demand outstripping resource capacity) and Cost-Push (rising material, wage, or fuel overheads forcing seller prices upstream). Central banks aim for 2% price-index targets to oil transaction gears without triggering spiral loops.',
    relationshipDiagram: [
      { label: 'Fiat Money Supply Expansion', explanation: 'Central banks buy sovereign bonds to ease commercial reserves.' },
      { label: 'Increased Public Demand Spark', explanation: 'Cheap credit-grade availability lowers barriers to consumer spending.' },
      { label: 'Industrial Resource Bottleneck', explanation: 'Raw supplies, shipping, and labor cannot scale to match consumer velocity.' },
      { label: 'Sellers Raise Pricing Benchmarks', explanation: 'Systemic imbalances force aggregate price indices upward.' },
      { label: 'Aggressive Policy Rate Tightening', explanation: 'Central banks hike interest rates to depress the aggregate debt volume.' }
    ],
    timeline: [
      { year: '1913', title: 'The Fed Birth', desc: 'Sovereign Federal Reserve is born to steady bank reserve allocations.' },
      { year: '1971', title: 'The Nixon Shock', desc: 'USD breaks gold-backing links, initiating pure fiat floats.' },
      { year: '1979', title: 'The Volcker Rate Spikes', desc: 'Volcker raises funds rates to 20% to break runaway inflation.' },
      { year: '2020', title: 'QE Helicopter Waves', desc: 'Aggressive asset buying pumps global reserves into high-gear.' },
      { year: '2022', title: 'The Re-Anchoring Hikes', desc: 'Parabolic policy tightening rate cycle launches to cool CPI.' }
    ],
    keyTakeaway: 'Inflation acts as a shadow tax on pure cash savers while benefiting debtors who repay obligations with depreciated dollars.',
    detailsDisclosures: [
      { q: 'How is CPI (Consumer Price Index) computed?', a: 'Statistical agencies track a basket of goods (food, shelter, fuel). Average price changes are weighted against household budget shares to track core CPI versus volatile food/energy indices.' },
      { q: 'Hungarian Hyperinflation (1946)', a: 'In 1946, Hungary suffered the worst hyperinflation on record. Prices doubled every 15.6 hours. It required the issue of the Tax Pengő voucher before the currency was completely replaced by the Forint.' }
    ]
  },
  'encyclopedia/markets/stocks.html': {
    title: 'How Stocks Work',
    tagline: 'FRACTIONAL CAPITAL OWNERSHIP & EQUITY FLOAT',
    conceptColor: 'cyan',
    definition: 'Stocks are fractional legal equity shares of a public corporation, representing a proportional claim on the enterprise\'s residual capital assets and quarterly net profit earnings.',
    simplifiedExplanation: 'Imagine a giant sandbox where a group builds cool toys. Instead of one person buying everything, everyone buys little sandbox tickets. When the toy sales grow, each sandbox ticket can be sold to other students for more candy!',
    academicDeconstruction: 'Equities let businesses secure capital without taking on bankruptcy risk because they do not commit to fixed interest repayments. Under standard discounted cash flow (DCF) models, the valuation multiple represents the sum of expected infinite future dividends discounted to present value through hurdle rates.',
    relationshipDiagram: [
      { label: 'Corporate Capital Need', explanation: 'Firm issues fractional shares (IPO) to fund new capital expenditures.' },
      { label: 'Secondary Exchange Listing', explanation: 'Outstanding shares float on liquid public order books with active market-makers.' },
      { label: 'Earnings Performance Growth', explanation: 'Quarterly sales margins surpass investor forecasts and revenue estimates.' },
      { label: 'Residual Capital Appreciates', explanation: 'Discounted present value of dividends scales higher across sovereign indices.' },
      { label: 'Wealth Accumulation Flows', explanation: 'Index trackers and institutional reserves reweight portfolios upward.' }
    ],
    timeline: [
      { year: '1602', title: 'The Amsterdam VOC Origin', desc: 'Dutch East India Company pioneers the first public stock listings.' },
      { year: '1792', title: 'The Buttonwood Agreement', desc: 'Brokers sign pact under a New York sycamore tree, forming early NYSE.' },
      { year: '1929', title: 'The Great Crash', desc: 'Leveraged margin speculation collapses, instigating credit reforms.' },
      { year: '1971', title: 'NASDAQ Digitalization', desc: 'First electronic order matching system launches, democratizing access.' },
      { year: '2020', title: 'Retail Wave Boom', desc: 'Mobile trading applications eliminate commissions, expanding public access.' }
    ],
    keyTakeaway: 'Investing in equities shifts your financial status from a pure labor wage earner to a compounding capital asset owner.',
    detailsDisclosures: [
      { q: 'What is EPS (Earnings Per Share)?', a: 'EPS is calculated as Net Corporate Income divided by total outstanding shares. It represents the residual margin allocated to each share of ownership.' },
      { q: 'Dividends versus Buybacks', a: 'Sellers can distribute profits directly via cold cash (dividends) or buy back their own shares on secondary markets, reducing outstanding share counts and increasing the residual value of remaining holdings.' }
    ]
  },
  'encyclopedia/economy/federal-reserve.html': {
    title: 'The Federal Reserve',
    tagline: 'Sovereign Central Banking System',
    conceptColor: 'indigo',
    definition: 'The Federal Reserve is the independent central banking system of the United States, managing monetary policy, setting deposit interest rates, and stabilizing commercial banking systems.',
    simplifiedExplanation: 'The Fed is like the money school principal. They don\'t give change to students directly; they look after the teacher banks, print paper dollars, and make sure bank buildings don\'t run out of money during active lunch hours.',
    academicDeconstruction: 'The Fed triggers monetary changes via three policy levers: Open Market Operations (buying/selling bills to regulate reserve volumes), Interest on Reserve Balances (IORB - setting the absolute floor rate), and Discount Window emergency lending.',
    relationshipDiagram: [
      { label: 'FOMC Target Assessment', explanation: 'Federal Committee meets to analyze CPI and labor statistics.' },
      { label: 'Policy Rate Targets Shift', explanation: 'Committee adjusts benchmark fed funds target boundaries.' },
      { label: 'Open Market Interventions', explanation: 'Trading desks swap cash for treasuries with prime brokers.' },
      { label: 'Commercial Lending Adjusts', explanation: 'Banks align credit prices to preserve reserve cushions.' },
      { label: 'Macro Economy Stabilizes', explanation: 'Slowing credit balances inflation metrics to target lines.' }
    ],
    timeline: [
      { year: '1907', title: 'The Knickerbocker Crisis', desc: 'Systemic trust collapse forces J.P. Morgan to personally salvage banks.' },
      { year: '1913', title: 'Federal Reserve Act', desc: 'President Wilson signs law establishing the multi-tiered Reserve System.' },
      { year: '1977', title: 'The Dual Mandate', desc: 'Congress commits Fed to target maximum employment and stable 2% inflation.' },
      { year: '2008', title: 'The Uncapped QE Shift', desc: 'Fed expands policy from adjusting base interest rates to active assets buying.' },
      { year: '2023', title: 'BTFP Bank Defenses', desc: 'Emergency credit lines open to defend commercial deposit safety.' }
    ],
    keyTakeaway: 'The Federal Reserve acts as the ultimate liquidity gatekeeper whose decisions alter the systemic price of debt globally.',
    detailsDisclosures: [
      { q: 'What is the FOMC?', a: 'The Federal Open Market Committee is a 12-member panel of regional presidents and board governors who vote on rate adjustments eight times a year.' },
      { q: 'What is the Discount Window?', a: 'An active lending facility that lets commercial banks borrow reserves directly from the central node, typically to prove safety when short-term credit lines lock.' }
    ]
  },
  'encyclopedia/markets/forex.html': {
    title: 'How Forex Works',
    tagline: 'BILATERAL FIAT EXCHANGE SWAPS',
    conceptColor: 'yellow',
    definition: 'The Foreign Exchange (Forex) market is the global decentralized over-the-counter pricing network that matches national fiat currencies against one another continuously.',
    simplifiedExplanation: 'Before boarding a plane to another country, you swap your home coins for local currency. Forex is the giant international swap machine where banks around the world trade billions in paper currencies every single second.',
    academicDeconstruction: 'Forex is priced through bilateral pairs (EUR/USD, USD/JPY). Prices float based on Purchasing Power Parity (long-term goods pricing baskets alignment) and Interest Rate Parity (interest yield spreads driving portfolio adjustments).',
    relationshipDiagram: [
      { label: 'Sovereign Interest Rate Shift', explanation: 'Federal Reserve raises base rates relative to European Central Bank.' },
      { label: 'Portfolio Allocations Adjust', explanation: 'Bond desks sell low-yield European bonds, demanding USD.' },
      { label: 'Bilateral Spot Exchanges', explanation: 'High volumes of Euros are auctioned to purchase US Dollars.' },
      { label: 'Pair Conversion Shift', explanation: 'Spot EUR/USD exchange price settles to lower levels.' },
      { label: 'Trade Balance Adjustment', explanation: 'Cheaper domestic imports boost international export revenues.' }
    ],
    timeline: [
      { year: '1870', title: 'The Gold Standard Dawn', desc: 'Major nations link currency values directly to fixed weights of gold.' },
      { year: '1944', title: 'Bretton Woods Agreement', desc: 'Global currencies peg to USD, which pegs to gold, establishing hegemony.' },
      { year: '1971', title: 'The Nixon Fiat Float', desc: 'The gold backing collapses; free-floating fiat currency regimes arise.' },
      { year: '1992', title: 'Black Wednesday Clash', desc: 'George Soros breaks the British Pound peg against European standards.' },
      { year: '1999', title: 'The Euro Launch', desc: 'Twelve European nations merge currencies, establishing a massive USD challenger.' }
    ],
    keyTakeaway: 'Currencies represent the relative credit and productivity health of a nation compared to other global sovereigns.',
    detailsDisclosures: [
      { q: 'What is a Pips value?', a: 'A \'Percentage in Point\' represents the smallest normal movement a currency makes, typically the fourth decimal place (0.0001).' },
      { q: 'Currency Pegs and Breaks', a: 'Sovereigns occasionally peg currency values to the USD or Euro to stabilize trade, but speculators can attack pegs if domestic monetary metrics diverge too far.' }
    ]
  },
  'encyclopedia/economy/recession.html': {
    title: 'What Causes Recessions?',
    tagline: 'THE DEBT-DEFLATION CONTRACTION CYCLE',
    conceptColor: 'red',
    definition: 'A recession is a significant, systemic decline in economic activity across an economy, typically defined by consecutive quarters of negative real GDP growth.',
    simplifiedExplanation: 'Imagine a community game of credit tag. When everyone spends money, the game runs fast. If a few players get scared of their debts, they stop playing. Then businesses sell less, cut allowances, and everyone sits quietly.',
    academicDeconstruction: 'Recessions occur when the credit multiplier reverses. As families or corporations trim spending to repair leveraged balance sheets, one person\'s spend cut becomes another worker\'s wage cut, instigating a contraction spiral.',
    relationshipDiagram: [
      { label: 'Leveraged Asset Bubble Peaks', explanation: 'Excessive credit drives speculative asset values beyond cash flow support.' },
      { label: 'Default Rates Creep Upwards', explanation: 'Marginal borrowers fail to make loan payments as interest rates hike.' },
      { label: 'Bank Liquidity Tightens', explanation: 'Underfunded banks raise lending bars and pull active credit lines.' },
      { label: 'Consumer Purchases Retract', explanation: 'Families downsize spending to build cash safety reserves.' },
      { label: 'Industrial Staff Layoffs', explanation: 'Fewer sales trigger company downsizing, raising job claims.' }
    ],
    timeline: [
      { year: '1929', title: 'The Great Depression', desc: 'Unchecked stock speculation collapses banking reserves worldwide.' },
      { year: '1973', title: 'The OPEC Oil Shock', desc: 'Resource embargo spikes fuel input price points, triggering stagflation.' },
      { year: '2000', title: 'Dot-Com Crash', desc: 'Speculative tech bubble collapses, wiping capital gains off balance sheets.' },
      { year: '2008', title: 'The Housing Deflation', desc: 'Subprime mortgage credit cascades freeze the global shadow banking grid.' },
      { year: '2020', title: 'Sovereign Lockdowns', desc: 'Physical business locks trigger instant, massive contraction cycles.' }
    ],
    keyTakeaway: 'Recessions are painful, necessary corrections that purge speculative leverage to re-establish sound capital bases.',
    detailsDisclosures: [
      { q: 'What is an inverted yield curve?', a: 'When 2-Year bond yields pay better than 10-Year bond yields, it proves investors demand premium safety near-term, historically predicting slowdowns 12 months ahead.' },
      { q: 'NBER Recession Dating', a: 'The National Bureau of Economic Research analyzes monthly payroll indices, wholesale-retail sales, and production trends to declare recessions.' }
    ]
  },
  'encyclopedia/economy/gdp.html': {
    title: 'What Is GDP?',
    tagline: 'GROSS DOMESTIC PRODUCT METRIC',
    conceptColor: 'purple',
    definition: 'Gross Domestic Product (GDP) is the total monetary or market value of all finished goods and services produced within a country\'s borders in a specific time period.',
    simplifiedExplanation: 'GDP is like a scorecard for a country\'s output. If you add up the value of every single toy, haircut, video game, and house built inside our zip codes this year, that giant sum is our GDP.',
    academicDeconstruction: 'GDP is computed using either the Expenditure Approach (GDP = Consumer Spending + Business Investment + Government Spending + Net Exports) or the Income Approach. Real GDP adjusts nominal pricing for inflation.',
    relationshipDiagram: [
      { label: 'Consumer Income Rises', explanation: 'Employment gains boost overall disposable income.' },
      { label: 'Increased Purchase Volumes', explanation: 'Wages flow back to retail registers and home building sites.' },
      { label: 'Corporate Expansion Hires', explanation: 'Retail demand forces firms to invest in logistics and production machines.' },
      { label: 'Sovereign Output Scales Up', explanation: 'Aggregate physical output numbers increase across the board.' },
      { label: 'Economic Status Boosted', explanation: 'Higher living standards and tax balances stabilize national services.' }
    ],
    timeline: [
      { year: '1934', title: 'Kuznets Formula', desc: 'Simon Kuznets develops early national accounting metrics for US Congress.' },
      { year: '1944', title: 'Bretton Woods Sync', desc: 'Sovereigns choose GDP as the core yardstick to rank global economic weights.' },
      { year: '1991', title: 'GNP to GDP Shift', desc: 'Focus shifts from global citizen output (GNP) to localized boundary output (GDP).' }
    ],
    keyTakeaway: 'GDP measures active economic velocity, though it tracks raw spending volume rather than ultimate societal well-being.',
    detailsDisclosures: [
      { q: 'Nominal vs Real GDP', a: 'Nominal GDP uses current prices. Real GDP uses a fixed base year price set, preventing rising prices (inflation) from faking real production expansion.' },
      { q: 'Limitations of GDP', a: 'It completely ignores household labor, black-market exchanges, environmental wear, and wealth distribution balance.' }
    ]
  },
  'encyclopedia/economy/interest-rates.html': {
    title: 'How Interest Rates Work',
    tagline: 'THE REAL PRICE OF INTERTEMPORAL DEBT',
    conceptColor: 'indigo',
    definition: 'Interest rates represent the cost of borrowing capital or the fee earned for lending assets, acting as the equilibrium anchor driving intertemporal credit markets.',
    simplifiedExplanation: 'Interest rates are the cost of renting capital. If you borrow $100 to design a treehouse, the landlord bank asks you to return the $100 plus $5 extra. That $5 fee is the rate of interest.',
    academicDeconstruction: 'Interest rates balance present-consumption bias against future-consumption savings. Lowering nominal rates below currency inflation (negative real rates) forces capital into speculative asset classes to preserve value.',
    relationshipDiagram: [
      { label: 'Federal Reserve Policy Slashes', explanation: 'Central bank drives overnight funds rate close to the zero bound.' },
      { label: 'Commercial Reserve Floods', explanation: 'Commercial banks clear loans cheaply to capture marginal debt seekers.' },
      { label: 'Corporate Capital Borrowing', explanation: 'Firms take massive loans to build server hubs and warehouse complexes.' },
      { label: 'Liquidity Levels Overflow', explanation: 'Consumer bidding pushes tech indices and real-estate metrics higher.' },
      { label: 'Subsequent Tightening Phase', explanation: 'Rising prices force rate hikes to arrest the credit expansion.' }
    ],
    timeline: [
      { year: 'Hammurabi Code', title: 'Babylon Limit', desc: 'Early legal codes establish strict caps on grain loan rates (33%).' },
      { year: '2009', title: 'The Zero Bound', desc: 'Post-crisis central bank policy drives overnight yields into decimal points.' },
      { year: '2016', title: 'Negative Rates Dawn', desc: 'Banks in Swiss nodes charge depositors storage fees to force credit out.' }
    ],
    keyTakeaway: 'Interest rates act as gravity for asset valuations; when rates rise, asset prices tend to fall.',
    detailsDisclosures: [
      { q: 'What is the Real Interest Rate?', a: 'Real Rate = Nominal Interest Rate minus Sovereign inflation. If your savings account pays 4% but inflation is 6%, your real purchasing rate is -2%.' }
    ]
  },
  'encyclopedia/economy/banking.html': {
    title: 'Banking & Reserves',
    tagline: 'FRACTIONAL LIQUIDITY CREATION SYSTEMS',
    conceptColor: 'purple',
    definition: 'Commercial banking systems act as credit conduits, utilizing fractional reserve mechanisms to create digital deposit money out of thin air via loan issuance.',
    simplifiedExplanation: 'If you deposit $10 in a bank, they do not lock it in a treasure chest. They keep $1 in the vault as safety and rent out the other $9 to a neighbor. Now, both you and your neighbor think you have money!',
    academicDeconstruction: 'Under modern plumbing, reserves are not strictly lent out. Rather, loans create new commercial deposits, and the bank subsequently secures reserve matching benchmarks after the fact, backed by Central discount lines.',
    relationshipDiagram: [
      { label: 'Primary Deposit Logged', explanation: 'Saver places $100,000 cash in checking accounts.' },
      { label: 'Reserves Allocation', explanation: 'Bank sets aside a core percentage in central bank vault slots.' },
      { label: 'Corporate Loan Created', explanation: 'Bank ledger credits a business account with $90,000 to purchase inventory.' },
      { label: 'Systemic Money Supply Expands', explanation: 'The digital broad supply grows without physically printing paper notes.' },
      { label: 'Interbank Settlement Clearings', explanation: 'Overnight desks settle imbalances using Fedwire clearing accounts.' }
    ],
    timeline: [
      { year: '1397', title: 'The Medici Network', desc: 'Italian merchant networks establish early double-entry ledgers across Europe.' },
      { year: '1694', title: 'Bank of England Paradigm', desc: 'First joint-stock central bank arises to purchase crown debt via note creation.' },
      { year: '2563', title: 'Reserve Requirements Slid', desc: 'The Federal Reserve drops reserve requirements to zero percent.' }
    ],
    keyTakeaway: 'Modern money is not gold coins; it is the commercial liabilities generated whenever banks issue new credit.',
    detailsDisclosures: [
      { q: 'What are reserves?', a: 'Digital cash tokens held by commercial banks exclusively at the Central Bank, used only to settle transactions between financial nodes.' }
    ]
  },
  'encyclopedia/markets/commodities.html': {
    title: 'Commodities Real Assets',
    tagline: 'HARD ASSETS & SUPPLY CONSTRAINTS',
    conceptColor: 'yellow',
    definition: 'Commodities are physical raw resources (energy, metals, agricultural staples) traded globally in structured futures markets with standardized delivery weights.',
    simplifiedExplanation: 'These are the real things you can kick: barrels of gooey black oil, solid gold bars, and giant bushels of yellow corn. Standard markets let farmers sell their crops before they are even picked!',
    academicDeconstruction: 'Commodity values align with aggregate global production cycles. Futures curves trade in Contango (forward costs higher) or Backwardation (near-term immediate demand pays a premium, proving physical scarcity).',
    relationshipDiagram: [
      { label: 'Geopolitical Grid Deficits', explanation: 'Pipeline issues restrict global crude distribution ports.' },
      { label: 'Physical Reserves Decline', explanation: 'Global inventories slide below seasonal moving benchmarks.' },
      { label: 'Futures Speculators Bid', explanation: 'DESK operators secure forward delivery rights to capture upside.' },
      { label: 'Margin Adjustments Imposed', explanation: 'Chamber exchanges raise cash margin terms to buffer rapid daily swings.' },
      { label: 'Sovereign Inflation Feeds', explanation: 'Surging fuel overheads lift shipping costs for all consumer goods.' }
    ],
    timeline: [
      { year: 'y1730', title: 'Dojima Rice Exchange', desc: 'Osaka samurais design the worlds first derivatives to manage crops.' },
      { year: '1848', title: 'CBOT Organized', desc: 'Chicago Board of Trade opens to standardize wheat grain trading weights.' },
      { year: '1970s', title: 'The Stagflation Peak', desc: 'Commodities surge as gold convertibility ends and energy spikes occur.' }
    ],
    keyTakeaway: 'While paper currencies can be printed without limit, physical commodities are strictly bounded by mining limits and geology.',
    detailsDisclosures: [
      { q: 'What is Contango?', a: 'When futures contracts are more expensive than spot prices, typically reflecting warehouse storage fees and insurance costs.' }
    ]
  },
  'encyclopedia/markets/crypto.html': {
    title: 'Crypto Ecosystems',
    tagline: 'ALGORITHMIC TRUST & CONSENSUS LEDGERS',
    conceptColor: 'cyan',
    definition: 'Cryptocurrencies are digital decentralized assets leveraging cryptographic consensus mechanisms to sustain permissionless monetary Ledgers.',
    simplifiedExplanation: 'Instead of one big bank ledger keeping track of who owns what, thousands of computers write the receipts at the same time. No single computer can lie or erase what\'s been written.',
    academicDeconstruction: 'Proof of Work (PoW) secures ledger states via thermodynamic capital expenditure (mining). Proof of Stake (PoS) switches security to capital staking, eliminating energy overheads but creating governance alignment questions.',
    relationshipDiagram: [
      { label: 'Algorithmic Block Solved', explanation: 'Computers guess randomized cryptographic hashes to secure transaction bundles.' },
      { label: 'Decentralized Syncing', explanation: 'All network nodes update database states to reflect the newest block.' },
      { label: 'Sovereign Currency Hedge', explanation: 'Citizens in inflationary regimes swap fiat for borderless tokens.' },
      { label: 'Liquidity Pools Active', explanation: 'DeFi protocols execute currency changes automatically using smart code.' },
      { label: 'National Regulations Step', explanation: 'Agencies write tax disclosures and audit reserve stablecoins.' }
    ],
    timeline: [
      { year: '2008', title: 'Satoshi Whitepaper', desc: 'Satoshi Nakamoto publishes the Bitcoin peer-to-peer ledger design.' },
      { year: '2015', title: 'Ethereum Launch', desc: 'Vitalik Buterin pioneers Turing-complete smart contracts, initiating DeFi.' },
      { year: '2024', title: 'Sovereign Spot ETFs', desc: 'Regulators authorize Bitcoin spot exchange trusts, merging old and new.' }
    ],
    keyTakeaway: 'Cryptocurrencies substitute institutional trust for cryptographic math, establishing permissionless transaction rails.',
    detailsDisclosures: [
      { q: 'What is a Smart Contract?', a: 'A self-executing software script hosted directly on a blockchain ledger that moves assets automatically when programmed parameters are satisfied.' }
    ]
  },
  'encyclopedia/sectors/ai-sector.html': {
    title: 'Technology & AI',
    tagline: 'SILICON HARDWARE PARALLEL NETWORKS',
    conceptColor: 'emerald',
    definition: 'The Artificial Intelligence sector encapsulates advanced computing architectures, parallel silicon processing cores, large-scale deep learning models, and automated software workflows.',
    simplifiedExplanation: 'This is the fast-paced computer world where companies build digital brains! Instead of typing individual lines of code, scientists build massive networks that can learn patterns, draw pictures, and write reports.',
    academicDeconstruction: 'The AI economy relies on compute scaling laws. Progress is bounded by parallel processing bandwidth (floating-point operations per second), power infrastructure access, and dataset quality markers.',
    relationshipDiagram: [
      { label: 'Algorithm Advancements', explanation: 'Publishing of transformer architectures boosts generative capacities.' },
      { label: 'Compute Infrastructure Swells', explanation: 'Tech giants buy millions of high-bandwidth AI silicon cores.' },
      { label: 'Software Implementations', explanation: 'Businesses swap manual work for automated quantitative workflows.' },
      { label: 'Electric Grid Overheads', explanation: 'Server complexes draw massive power, bottlenecking local utilities.' },
      { label: 'Regulatory Guardrails Drafted', explanation: 'Agencies weigh security risks, copyright terms, and computing caps.' }
    ],
    timeline: [
      { year: '1956', title: 'Dartmouth Workshop', desc: 'John McCarthy coins the term Artificial Intelligence, launching study.' },
      { year: '2012', title: 'AlexNet Breakthrough', desc: 'GPU-accelerated neural networks win computer vision contests.' },
      { year: '2017', title: 'Transformer Paper', desc: '"Attention Is All You Need" is published, paving the way for LLMs.' },
      { year: '2022', title: 'Public LLM Surge', desc: 'Generative conversational models reach mass public adoption overnight.' }
    ],
    keyTakeaway: 'The AI sector shifts software from a simple deterministic processing box to an active pattern-learning asset.',
    detailsDisclosures: [
      { q: 'What are GPUs?', a: 'Graphics Processing Units excel at executing thousands of simple mathematical calculations at once, making them ideal for training deep neural networks.' }
    ]
  },
  'encyclopedia/sectors/banking-sector.html': {
    title: 'Banking & Credit',
    tagline: 'RESYNCING THE FINANCIAL MIDDLEMAN SYSTEM',
    conceptColor: 'purple',
    definition: 'The Banking Sector manages credit generation, capital underwriting, and regional deposit services, acting as the bloodline for domestic macro economies.',
    simplifiedExplanation: 'These are the financial helper firms that match people who have extra money with people who need to borrow it to build companies, houses, or high-tech server networks.',
    academicDeconstruction: 'Commercial banks operate under asset-liability mismatch risk. Their retail deposits are immediate liabilities, while their corporate loan files are long-duration assets, exposed to run hazards if rate changes devalue holdings.',
    relationshipDiagram: [
      { label: 'Central Banks Raise Rates', explanation: 'Monetary desks lift overnight borrowing costs.' },
      { label: 'Commercial Margins Squeeze', explanation: 'Depositors demand better bond yields, forcing banks to pay more for assets.' },
      { label: 'Credit Sizing Contracted', explanation: 'To defend balance sheets, credit analysts decline high-risk applications.' },
      { label: 'Local Business Slump', explanation: 'Sectors requiring loans to function experience output drops.' },
      { label: 'Central Financial Interventions', explanation: 'Emergency facilities provide backup cash to calm bank deposit panics.' }
    ],
    timeline: [
      { year: '1397', title: 'Medici Rise', desc: 'The Medici Bank establishes Italian city-state merchant credit frameworks.' },
      { year: '1933', title: 'Glass-Steagall Split', desc: 'US reforms separate highly secure deposit saving nodes from riskier investment lines.' },
      { year: '1999', title: 'Act Deregulations', desc: 'Glass-Steagall is repealed, initiating massive multi-service conglomerates.' }
    ],
    keyTakeaway: 'The banking sector controls economic oxygen; credit expansion fuels output while contraction halts activities.',
    detailsDisclosures: [
      { q: 'What is Net Interest Margin?', a: 'The difference between the interest income banks make on outstanding loans and the interest payouts they distribute to depositors.' }
    ]
  },
  'encyclopedia/sectors/energy-sector.html': {
    title: 'Sovereign Energy',
    tagline: 'OPEC GRIDS & HYDROCARBON CHAINS',
    conceptColor: 'yellow',
    definition: 'The Energy Sector encompasses crude hydrocarbon extraction, electrical utility transmission, nuclear power grids, and renewable generation assets.',
    simplifiedExplanation: 'This is the brute-force sector that keeps the lights on! It tracks how black oil is pumped from underground, how massive coal furnaces spin electrical wires, and how glowing solar panels capture sunlight.',
    academicDeconstruction: 'Sovereign systems are bound by energy density laws. Hydrocarbons afford unparalleled thermodynamic density, making renewable switches complex since grid safety requires stable electrical baseload supplies.',
    relationshipDiagram: [
      { label: 'Production Caps Negotiated', explanation: 'OPEC members vote to curb crude extraction quotas.' },
      { label: 'Spot Hydrocarbon Spikes', explanation: 'Global buyers bid up immediate physical shipments.' },
      { label: 'Electrical Overhead Surge', explanation: 'Power plants pass rising fuel costs down to consumer utility grids.' },
      { label: 'Manufacturing Slowdown', explanation: 'Heavy industrial facilities pare output due to surging electricity premiums.' },
      { label: 'Alternative Energy Pivot', explanation: 'High energy prices foster rapid investments in solar and wind farms.' }
    ],
    timeline: [
      { year: '1859', title: 'Drake Well Strike', desc: 'First commercial oil well drilled in Pennsylvania, launching petroleum era.' },
      { year: '1960', title: 'OPEC Founded', desc: 'Resource-rich sovereigns pool quotas to coordinate global crude supply weights.' },
      { year: '1973', title: 'Middle-East Embargo', desc: 'Political curbs trigger severe western shortages and oil queue lines.' }
    ],
    keyTakeaway: 'Economic expansion requires physical energy; monetary growth is useless without underlying electricity to fuel physical machines.',
    detailsDisclosures: [
      { q: 'What is Baseload Power?', a: 'The minimum amount of continuous electricity a utility node must deliver to keep the grid from collapsing.' }
    ]
  },
  'encyclopedia/sectors/biotech-sector.html': {
    title: 'Venture Biotech',
    tagline: 'FDA CLINICAL DRUG PIPELINES',
    conceptColor: 'purple',
    definition: 'The Biotech sector focuses on developing advanced molecular structures, gene therapeutic vectors, and pharmacologic therapies, relying heavily on capital markets to fund speculative research.',
    simplifiedExplanation: 'These are the high-tech wizard labs that design medicine! Instead of standard retail, they spend years trying to cure biological ailments, presenting their research to medical examiners for approval.',
    academicDeconstruction: 'Biotech investing behaves like out-of-the-money option contracts. Firms run thin operational balance sheets, burning venture capital while their entire valuation rests on Phase I-III clinical trial safety benchmarks.',
    relationshipDiagram: [
      { label: 'Genetic Vector Isolated', explanation: 'Lab techs construct novel therapeutic molecular structures.' },
      { label: 'Phase I Safety Checks', explanation: 'Early human cohorts show minimal metabolic toxicity.' },
      { label: 'Phase II/III Trial Waves', explanation: 'Tests track efficacy and safety profiles against double-blind placebos.' },
      { label: 'FDA Panel Ruling', explanation: 'Examiners check data and decide on commercial approval permissions.' },
      { label: 'Sovereign Patent Scale', explanation: 'Firms build manufacturing lines or sell files to pharma giants.' }
    ],
    timeline: [
      { year: '1953', title: 'Double Helix Decoded', desc: 'Watson & Crick map DNA structures, launching modern genetics.' },
      { year: '1976', title: 'Genentech Founded', desc: 'First dedicated biotech organization applies recombinant DNA tech.' },
      { year: '2003', title: 'Genome Project Done', desc: 'International researchers map the complete human physical code.' }
    ],
    keyTakeaway: 'The biotech sector is characterized by binary clinical trials; results either produce massive payouts or zero wealth.',
    detailsDisclosures: [
      { q: 'What is Phase III?', a: 'The largest pre-approval testing round, matching thousands of patients to confirm safety margins before commercial sale.' }
    ]
  },
  'encyclopedia/sectors/semiconductor-sector.html': {
    title: 'Semiconductors & Lithography',
    tagline: 'EXTREME ULTRAVIOLET LITHOGRAPHY',
    conceptColor: 'emerald',
    definition: 'The Semiconductor sector manufactures silicon chips that power computing hardware, depending on high capital barriers and precision lithography machines.',
    simplifiedExplanation: 'This is the physical microchip sector. They use powerful laser beams to etch electric path mazes onto flat slices of glass, creating the brains for phones, laptops, and spacecraft.',
    academicDeconstruction: 'Chip fabrication relies on Extreme Ultraviolet (EUV) light. High lithography machinery costs (upwards of $350M each) limit the sector to a tiny handful of specialized fabrication cleanrooms globally.',
    relationshipDiagram: [
      { label: 'R&D Micro-Path Designs', explanation: 'Circuit architects scale path widths down to single-digit nanometers.' },
      { label: 'Silicon Wafer Printing', explanation: 'Huge EUV lithography machines etch designs using ultraviolet light.' },
      { label: 'Cleanroom Processing', explanation: 'Fabs place circuits into protective packages under strict particulate filters.' },
      { label: 'Global Assembly Transit', explanation: 'Finished chips move to high-tech manufacturing assembly terminals.' },
      { label: 'Enterprise Hardware Distribution', explanation: 'Sectors receive chips to build vehicles, cloud nodes, and personal servers.' }
    ],
    timeline: [
      { year: '1947', title: 'Bell Labs Transistor', desc: 'Scientists build the first physical transistor, replacing bulky vacuum tubes.' },
      { year: '1965', title: 'Moores Law Formulation', desc: 'Gordon Moore notes transistor density doubles every 24 months.' },
      { year: '1987', title: 'TSMC Emerges', desc: 'Taiwan fab specializes entirely in production, launching the foundry model.' }
    ],
    keyTakeaway: 'Modern technology is completely reliant on chips; whoever controls cleanroom fabrication controls global computing capabilities.',
    detailsDisclosures: [
      { q: 'What is a Fab?', a: 'A multi-billion dollar cleanroom factory where silicon wafers are printed under clean rooms with zero dust particles.' }
    ]
  },
  'encyclopedia/markets/bonds.html': {
    title: 'How Sovereign Bonds Work',
    tagline: 'DURATION, YIELDS & THE RISK-FREE ANCHOR',
    conceptColor: 'purple',
    definition: 'A sovereign bond is a loan to a government: the issuer pays coupons and returns face value at maturity. The yield is the market’s required return; bond prices move inversely with yields.',
    simplifiedExplanation: 'A government IOU. You lend money, they pay you interest, and later they give the original amount back. If new bonds start paying higher interest, older bonds become less attractive and their market price falls.',
    academicDeconstruction: 'Bond prices are the discounted present value of coupons plus principal. Duration estimates percent price change for a 1% yield move. The Treasury curve (2s, 10s, 30s) is the risk-free reference that prices credit spreads, mortgages, and equity discount rates.',
    relationshipDiagram: [
      { label: 'Treasury Auction', explanation: 'Sovereign desks issue bills, notes, and bonds to fund deficits.' },
      { label: 'Secondary Curve Pricing', explanation: 'Dealers quote yields across maturities; the curve is the policy-and-growth thermometer.' },
      { label: 'Duration Shock', explanation: 'A rate hike lifts yields and marks down existing bond prices.' },
      { label: 'Portfolio Rebalancing', explanation: 'Pension and bank books reweight duration versus equities and credit.' },
      { label: 'Risk-Asset Transmission', explanation: 'Higher real yields raise equity discount rates and tighten financial conditions.' }
    ],
    timeline: [
      { year: '1694', title: 'Bank of England Debt', desc: 'Perpetual government debt markets form around wartime finance.' },
      { year: '1790', title: 'Hamilton Assumption', desc: 'U.S. federal assumption of state debts seeds a national Treasury market.' },
      { year: '1971', title: 'Fiat Curve Era', desc: 'After gold convertibility ends, nominal yields become a pure policy-and-inflation instrument.' },
      { year: '2022', title: 'Duration Massacre', desc: 'Fastest hiking cycle in decades produces historic mark-to-market losses on long bonds.' }
    ],
    keyTakeaway: 'Bond yields are the gravity of modern markets: they set the discount rate for almost every other asset.',
    detailsDisclosures: [
      { q: 'What is duration?', a: 'A weighted average time-to-cash-flows. Roughly, a 7-year duration bond loses about 7% of price if yields rise 1%, all else equal.' },
      { q: 'What is an inverted curve?', a: 'When short-term yields exceed long-term yields. Historically associated with tighter policy and elevated recession odds — not a guarantee.' }
    ]
  }
};
