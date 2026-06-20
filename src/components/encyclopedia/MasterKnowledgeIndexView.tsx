import React, { useState } from 'react';
import { 
  Library, Compass, Search, ChevronRight, ArrowRight, Share2, 
  Layers, Database, Landmark, Globe, Coins, ShieldAlert, Cpu, 
  Flame, Leaf, HeartPulse, Building2, Truck, Info, Lightbulb, 
  Activity, Users, Zap, Calendar, History, TrendingUp, Sparkles, BookOpen
} from 'lucide-react';

interface MasterKnowledgeIndexViewProps {
  selectFileNode: (fileName: string) => void;
  askAboutTerm?: (term: any) => void;
}

export default function MasterKnowledgeIndexView({ selectFileNode, askAboutTerm }: MasterKnowledgeIndexViewProps) {
  // Navigation tabs for the library
  // TABS: INDEX, ATLAS, INDUSTRIES, TIMELINE, KNOWLEDGE_GRAPH, HUMAN_NEEDS, FUTURE
  const [activeSegment, setActiveSegment] = useState<'INDEX' | 'ATLAS' | 'INDUSTRIES' | 'TIMELINE' | 'KNOWLEDGE_GRAPH' | 'HUMAN_NEEDS' | 'FUTURE'>('INDEX');

  // Search state inside indices
  const [searchTerm, setSearchTerm] = useState('');
  const [indexCategory, setIndexCategory] = useState<'ALL' | 'TERMS' | 'COMPANIES' | 'CONCEPTS' | 'COUNTRIES' | 'EVENTS'>('ALL');

  // Interactive Company Atlas states
  const [selectedAtlasCompany, setSelectedAtlasCompany] = useState<string>('NVDA');

  // Knowledge Graph active path multiplier
  const [activeGraphRoute, setActiveGraphRoute] = useState<'semis' | 'blockade' | 'rates'>('semis');
  const [activeGraphStep, setActiveGraphStep] = useState<number>(0);

  // Explore by Human Need active filter
  const [selectedHumanNeed, setSelectedHumanNeed] = useState<string>('energy');

  // World economy timeline active event index
  const [selectedTimelineIndex, setSelectedTimelineIndex] = useState<number>(0);

  // A-Z Master Data definitions in the Memory Infrastructure
  const MASTER_TERMS = [
    { id: 't_arb', char: 'A', term: 'Arbitrage', category: 'TERMS', tag: 'Microstructure', desc: 'The simultaneous purchase and sale of an asset in different markets to exploit pricing discrepancies, driving markets toward single-price efficiency.' },
    { id: 't_asml', char: 'A', term: 'ASML', category: 'COMPANIES', tag: 'Semiconductors', desc: 'The Dutch monopoly manufacturer of Extreme Ultraviolet (EUV) photolithography machines, essential for printing transistors beneath 5nm.' },
    { id: 't_bop', char: 'B', term: 'Balance of Payments (BOP)', category: 'CONCEPTS', tag: 'Macroeconomics', desc: 'A statement of all transactions made between entities in one country and the rest of the world over a defined period.' },
    { id: 't_b2', char: 'B', term: 'Basel III Accord', category: 'EVENTS', tag: 'Banking Regulation', desc: 'A global regulatory framework on bank capital adequacy, stress testing, and market liquidity risk introduced after the 2008 crisis.' },
    { id: 't_cb', char: 'C', term: 'Central Bank Swap Lines', category: 'CONCEPTS', tag: 'Monetary Systems', desc: 'Emergency bilateral agreements where central banks supply native liquidity (typically USD) to foreign central banks to mitigate offshore funding collapses.' },
    { id: 't_cac', char: 'C', term: 'Cost of Capital (WACC)', category: 'TERMS', tag: 'Corporate Finance', desc: 'The average rate a business pays to finance its assets, determined as a weighted blend of its equity demand expectations and debt interest yields.' },
    { id: 't_dcf', char: 'D', term: 'Discounted Cash Flow (DCF)', category: 'CONCEPTS', tag: 'Valuation Science', desc: 'An analytical model calculating present valuation of an asset based on expectations of infinite future cash streams discounted by risk coefficients.' },
    { id: 't_did', char: 'D', term: 'Debt-Service Coverage Ratio', category: 'TERMS', tag: 'Risk Metrics', desc: 'A credit metric measuring a borrower\'s available operating cash flows against their active principal and interest repayment requirements.' },
    { id: 't_ela', char: 'E', term: 'Elasticity of Demand', category: 'CONCEPTS', tag: 'Microeconomics', desc: 'A coefficient measuring consumer sensitivity to price movements; highly inelastic goods (like gasoline or insulin) maintain demand despite price spikes.' },
    { id: 't_emp', char: 'E', term: 'Empire State Manufacturing Index', category: 'TERMS', tag: 'Indices', desc: 'A regional economic indicator tracking monthly industrial sentiment and production volumes across New York State mills.' },
    { id: 't_fis', char: 'F', term: 'Fiscal Dominance', category: 'CONCEPTS', tag: 'Monetary Regimes', desc: 'A structural condition where sovereign deficit deficits force the central bank to maintain negative real interest rates to inflate debt obligations away.' },
    { id: 't_frb', char: 'F', term: 'Fractional-Reserve Banking', category: 'CONCEPTS', tag: 'Financial Architecture', desc: 'The banking mechanism where credit institutions hold only a small fraction of customer checking balances as reserves, loaning out the remainder.' },
    { id: 't_gam', char: 'G', term: 'Gamma Squeeze', category: 'TERMS', tag: 'Microstructure', desc: 'A rapid price accentuation driven by wholesale market-makers purchasing underlying stock to hedge options contracts as stock values rise close to strike limits.' },
    { id: 't_gdp', char: 'G', term: 'Gross Domestic Product (GDP)', category: 'CONCEPTS', tag: 'Productivity Science', desc: 'The aggregated monetary value representing all finished physical goods and active service transactions produced within a sovereign border in one year.' },
    { id: 't_hed', char: 'H', term: 'Hedging', category: 'TERMS', tag: 'Risk Dynamics', desc: 'The process of executing counter-balancing securities investments (like options or derivatives) to cushion portfolios from adverse market shocks.' },
    { id: 't_hyn', char: 'H', term: 'Hyperinflation', category: 'EVENTS', tag: 'Monetary Panics', desc: 'Runaway, compound price rises exceeding 50% monthly, typically triggered when a government prints cash to service massive unprovable sovereign debt obligations.' },
    { id: 't_int', char: 'I', term: 'Interest Rate Transmission', category: 'CONCEPTS', tag: 'Central Banking', desc: 'The sequential mechanism through which central bank overnight discount hikes trickle into retail interest rates, consumer mortgages, and workforce layoffs.' },
    { id: 't_jpm', char: 'J', term: 'JPMorgan Chase', category: 'COMPANIES', tag: 'Global Banking', desc: 'The largest banking institution in the West, serving as a critical private deposit anchor and global system operator of dollar-clearing accounts.' },
    { id: 't_key', char: 'K', term: 'Keynesian Multiplier', category: 'CONCEPTS', tag: 'Fiscal Policy', desc: 'An economic model stating that initial government injection spend trickles down as cascading consumer payrolls, magnifying total GDP output.' },
    { id: 't_lev', char: 'L', term: 'Leverage Coefficient', category: 'TERMS', tag: 'Capital Structure', desc: 'The mathematical multiplier representing the ratio of debt-financed assets relative to shareholder-capital cushions.' },
    { id: 't_m1', char: 'M', term: 'M2 Money Stock', category: 'CONCEPTS', tag: 'Liquidity Pools', desc: 'A broad metric tracking liquid money, including physical notes, checking records, retail money funds, and small time deposits.' },
    { id: 't_nvda', char: 'N', term: 'NVIDIA', category: 'COMPANIES', tag: 'Technology Science', desc: 'The leading provider of tensor-core GPU microprocessors, organizing global cloud data systems for artificial intelligence training cycles.' },
    { id: 't_ope', char: 'O', term: 'OPEC Cartel', category: 'CONCEPTS', tag: 'Sovereign Energy', desc: 'An intergovernmental organization of oil producers managing extraction targets to restrict supply pipelines and maintain global crude valuations.' },
    { id: 't_ptb', char: 'P', term: 'Petrodollar Recycling', category: 'EVENTS', tag: 'Geopolitical Systems', desc: 'An historical framework where international crude trades are invoiced solely in USD, recycling export revenues directly into safe US Treasuries.' },
    { id: 't_qe', char: 'Q', term: 'Quantitative Easing (QE)', category: 'CONCEPTS', tag: 'Monetary Science', desc: 'An unconventional central bank purchase program where the central body prints electronic reserves to acquire commercial bank bonds and depress long-term yields.' },
    { id: 't_rb', char: 'R', term: 'Regional Bank Run', category: 'CONCEPTS', tag: 'Liquidity Shocks', desc: 'A panicking deposit flight where online savers use mobile devices to drain liabilities, forcing banks to liquidate devalued assets to settle claims.' },
    { id: 't_sta', char: 'S', term: 'Stagflation', category: 'CONCEPTS', tag: 'Macroeconomics', desc: 'A toxic combination of stagnant economic expansion, high unemployment rates, and persistent price inflation.' },
    { id: 't_tsm', char: 'T', term: 'TSMC', category: 'COMPANIES', tag: 'Semiconductors', desc: 'Taiwan Semiconductor Manufacturing Co, producing 90%+ of global extreme-nanometer lithography chips used in smartphone cores and AI arrays.' },
    { id: 't_us', char: 'U', term: 'US Treasury Bonds', category: 'TERMS', tag: 'Sovereign Debt', desc: 'Debt notes backed by the full faith, tax-levying powers, and dollar-printing capability of the United States federal government.' },
    { id: 't_vol', char: 'V', term: 'Volcker Spike Cycle', category: 'EVENTS', tag: 'Monetary History', desc: 'The aggressive 1979-1981 Federal Reserve monetary cycle that raised lending rates to 20% to choke economic demand and squash runaway inflation.' }
  ];

  // 10,000 Company Atlas Data (Core Corporate Profiles)
  const ATLAS_COMPANIES: Record<string, {
    name: string;
    ticker: string;
    industry: string;
    metrics: { cap: string; revenue: string; employees: string; margin: string };
    products: string[];
    competitors: string[];
    supplyChain: string;
    exposure: string;
    historySignificance: string;
    globalInfluence: string;
    description: string;
  }> = {
    NVDA: {
      name: 'NVIDIA Corporation',
      ticker: 'NVDA',
      industry: 'Semiconductor Logic & AI Processing Platforms',
      metrics: { cap: '$3.2 Trillion', revenue: '$60.9 Billion', employees: '29,600', margin: '57.1%' },
      products: ['H100 Tensor-Core AI GPUs', 'Blackwell Computing Systems', 'GeForce Gaming Processors', 'CUDA AI Programming Platform'],
      competitors: ['AMD', 'Intel', 'Google TPU custom silicon', 'Amazon Trainium ASIC chips'],
      supplyChain: 'Relies exhaustively on Taiwan (TSMC) for actual extreme ultraviolet lithography printing and advanced packaging, making its entire market capitalisation highly vulnerable to South China Sea logistics lanes.',
      exposure: 'Highly exposed to global cloud data investment cycles (Capex) and regional power grid limitations needed to run thermal logic farms.',
      historySignificance: 'Transitioned from rendering video game triangles in 1993 to single-handedly creating the hardware foundations of generative artificial intelligence through specialized mathematical kernels.',
      globalInfluence: 'NVIDIA silicon is effectively a national security asset, locked behind strategic export bans to ensure Western superpowers maintain advanced logic hegemony.',
      description: 'The computational powerhouse of the 21st century. By developing CUDA, NVIDIA locked global data researchers into their hardware ecosystems, capturing a virtual monopoly on computational intelligence training grids.'
    },
    AAPL: {
      name: 'Apple Inc.',
      ticker: 'AAPL',
      industry: 'Consumer Technology & Sovereign Software Pipelines',
      metrics: { cap: '$3.1 Trillion', revenue: '$385.7 Billion', employees: '161,000', margin: '25.8%' },
      products: ['iPhones', 'MacBook silicon computing systems', 'iOS Subscription Services', 'App Store digital gates'],
      competitors: ['Samsung Electronics', 'Huawei Technologies', 'Google Mobile Platform', 'Microsoft (Office Ecosystem)'],
      supplyChain: 'Historically dependent on massive private worker corridors (Foxconn) in Shenzhen and Henan, China. Actively trying to diversify assembly nodes to India and Vietnam as geopolitical frictions increase.',
      exposure: 'Directly linked to consumer credit availability, middle-class surplus disposable incomes, and sovereign app store regulatory fees.',
      historySignificance: 'Redefined how humans interact with digital information through the 2007 iPhone, locking billions into high-margin consumer subscriptions.',
      globalInfluence: 'Apple represents the anchor demand driver of the electronic logistics pipeline. A drop in Apple demand slows factories across Korea, Japan, and Taiwan.' ,
      description: 'The master of consumer ecosystem design. Apple uses its massive mobile hardware footprints to capture consistent service revenues, acting effectively as a private tax collector on digital communications.'
    },
    TSLA: {
      name: 'Tesla, Inc.',
      ticker: 'TSLA',
      industry: 'Electric Vehicles, Energy Cells, & Kinetic Autonomy',
      metrics: { cap: '$750 Billion', revenue: '$96.7 Billion', employees: '140,000', margin: '15.5%' },
      products: ['Model Y/3/S/X electric motors', 'Megapack Industrial Energy Grids', 'Full Self-Driving neural pathing software', 'Optimus Humanoid Robotics'],
      competitors: ['BYD China', 'General Motors', 'Volkswagen Group', 'CATL Battery Processing'],
      supplyChain: 'Dependent on lithium supply chains, cobalt mines in central Africa, and massive processing facilities in Shanghai and Berlin. Critical reliance on rare earth battery chemicals.',
      exposure: 'Highly sensitive to sovereign battery subsidies, consumer car loan interest rates, and global lithium carbonate pricing indices.',
      historySignificance: 'Forced the entire global automotive industry to abandon the 100-year internal combustion engine, proving mass-market electric transit was capital feasible.',
      globalInfluence: 'Tesla is driving massive battery cell manufacturing expansion inside North America, reshaping local industrial geography.',
      description: 'An autonomous robotics conglomerate masquerading as a car manufacturer. By deploying millions of visual navigation cameras, Tesla gathers real-world training inputs to solve general-purpose kinetic robotics and autonomous transport.'
    },
    TSMC: {
      name: 'Taiwan Semiconductor Manufacturing Co.',
      ticker: 'TSM',
      industry: 'Extreme-Precision Semiconductor Lithography Foundry',
      metrics: { cap: '$940 Billion', revenue: '$69.3 Billion', employees: '73,000', margin: '43.2%' },
      products: ['3-nanometer N3 Silicon Wafers', '5-nanometer logical chip processors', 'Advanced CoWoS 2.5D logic packaging'],
      competitors: ['Samsung Foundry', 'Intel Foundry Services (IFS)'],
      supplyChain: 'Extreme reliance on ASML for photolithography machines, raw wafer supplies from Japan, and massive electricity reserves inside Taiwan.',
      exposure: 'Highly exposed to regional maritime disruptions, tectonic seismic activity, and geopolitical military maneuvers out of mainland China.',
      historySignificance: 'Invented the dedicated contract silicon foundry model in 1987, decoupling logic design from heavy capital wafer manufacture overheads.',
      globalInfluence: 'TSMC is the absolute bottleneck of global advanced computing. If TSMC ceases operations for 90 days, smartphone and server production halts worldwide, shrinking global GDP by an estimated 10%.',
      description: 'The physical backbone of advanced human logical architecture. TSMC operates the ultimate cleanrooms on earth, mastering sub-nanometer chip fabrication tolerances so logic designers can scale computing engines.'
    },
    ASML: {
      name: 'ASML Holding N.V.',
      ticker: 'ASML',
      industry: 'Extreme Ultraviolet Photolithography Manufacturing',
      metrics: { cap: '$410 Billion', revenue: '$27.5 Billion', employees: '42,000', margin: '32.1%' },
      products: ['EUV Lithography Systems', 'DUV Deep Ultraviolet scanners', 'Yieldstar Metrology measuring arrays'],
      competitors: ['Nikon Corporation (duv-era only)', 'Canon (nanoimprint research)'],
      supplyChain: 'Assembles thousands of bespoke components, including extremely pure mirrors polished to molecular accuracy by Carl Zeiss inside Germany.',
      exposure: 'Highly sensitive to international export blockades, Western defensive tech licensing agreements, and capital investment budgets of foundries like TSMC, Intel, and Samsung.',
      historySignificance: 'Solved the physical light-diffraction barrier by using 13.5-nanometer wavelength ultraviolet lasers reflected off state-of-the-art multi-layer mirrors.',
      globalInfluence: 'Sovereign nations lobby intense political pressure to block ASML from shipping high-end machines to rival territories, using export permits as defense shields.',
      description: 'The sole gatekeeper of advanced physical logic. ASML manufactures the machines that make modern chips possible. A single ASML EUV system contains over 100,000 parts, takes three Boeing 747s to transport, and costs $300 million.'
    },
    JPM: {
      name: 'JPMorgan Chase & Co.',
      ticker: 'JPM',
      industry: 'Systemic West Financial Banking Core',
      metrics: { cap: '$580 Billion', revenue: '$158.1 Billion', employees: '310,000', margin: '30.1%' },
      products: ['Treasury Payment Services', 'Investment Capital Syndication', 'Commercial Credit Lines', 'Wealth Asset Preservation'],
      competitors: ['Bank of America', 'Citigroup', 'Goldman Sachs', 'Morgan Stanley'],
      supplyChain: 'Draws core liquidity direct from federal money reserves and checking deposits of retail consumers. Completely dependent on central bank clearing systems.',
      exposure: 'Exposed to yield curve spreads, systemic credit defaults, sovereign interest rate margins, and federal financial capital mandates.',
      historySignificance: 'Friction-tested through centuries of panics. Acquired Bear Stearns, Washington Mutual, and First Republic during critical bank collapses, stabilizing market infrastructure.',
      globalInfluence: 'Maintains critical interbank dollar payment processing hubs that clear trillions in cross-border settlements every business day.',
      description: 'The fortress balance sheet of Western capital. JPMorgan serves as the primary system-critical bank, linking Federal liquidity conduits directly down to main street retail balance sheets and institutional debt pools.'
    },
    XOM: {
      name: 'Exxon Mobil Corporation',
      ticker: 'XOM',
      industry: 'Sovereign Petrochemical Exploration & Refining',
      metrics: { cap: '$480 Billion', revenue: '$344.5 Billion', employees: '62,000', margin: '10.5%' },
      products: ['Raw Brent & WTI Crude Oil', 'Aviation and Highway Diesel fuels', 'Synthetic Polymers & Refined Plastics', 'Nitrogen Fertilizer foundations'],
      competitors: ['Chevron (CVX)', 'Shell PLC', 'Saudi Aramco', 'BP (British Petroleum)'],
      supplyChain: 'Dependent on drill permits, maritime safety, state land grants, deep sediment drilling vessels, and trans-ocean energy pipe valves.',
      exposure: 'Directly linked to geopolitical oil cartel volumes (OPEC), general shipping lane security, and renewable carbon regulatory frameworks.',
      historySignificance: 'The largest direct descendant of Rockefeller\'s Standard Oil monopoly, driving fossil fuel expansion throughout the entire 20th century.',
      globalInfluence: 'Supplies raw energy fuel variables that run container supertankers, agriculture tractors, and aviation corridors, affecting prices of everyday goods.',
      description: 'The ultimate energetic anchor of heavy industrial trade. Exxon Mobil is an economic titan because it converts raw geological Carbon sediments into high-torque physical horsepower, propelling physical materials across the planet.'
    }
  };

  // Global Industry Archive Data (How Infrastructure Works)
  const GLOBAL_INDUSTRIES = [
    {
      id: 'energy',
      name: 'Energy & Petrochemicals',
      icon: <Flame className="w-5 h-5 text-amber-500 animate-pulse" />,
      howItWorks: 'Fossil thermal reserves (coal, gas, oil) and nuclear/renewables are converted into high-watt electric grids and dense hydrocarbon transport fuels.',
      controls: 'Managed by state-owned cartels (OPEC, Saudi Aramco) and multinational exploration giants (Exxon, Chevron).',
      dependencies: 'Vulnerable to shipping corridors (Strait of Malacca, Suez Canal, Strait of Hormuz) and infrastructure weather constraints.',
      impact: 'The ultimate base variable of all human action. If energy costs double, the cost of processing water, trucking grain, and fabbing microchips rises in lockstep.',
      history: 'Transitioned from biological muscle and wood power in 1700 to coal-fired high pressures in 1800, and fully liquid crude in 1900.'
    },
    {
      id: 'semis',
      name: 'Semiconductors & Lithography',
      icon: <Cpu className="w-5 h-5 text-cyan-400" />,
      howItWorks: 'Transistors smaller than a strand of DNA are etched onto silicon wafers using ultra-precise Extreme Ultraviolet (EUV) light reflections.',
      controls: 'Dominated by ASML (printing machines), TSMC (contract manufacturing), and NVIDIA/Intel (logic architecture designing).',
      dependencies: 'Highly concentrated geographic bottlenecks in Hsinchu (Taiwan), Eindhoven (Netherlands), and Carl Zeiss glass labs in Germany.',
      impact: 'Allows human cognitive operations to be calculated on synthetic silicon pathways, scaling digital machinery and AI logic systems.',
      history: 'Born with the 1947 Bell Labs solid-state transistor; scaled under Moore\'s law down to three-nanometer atomic thresholds.'
    },
    {
      id: 'agriculture',
      name: 'Food & Agriculture',
      icon: <Leaf className="w-5 h-5 text-green-405 text-green-400" />,
      howItWorks: 'Combining nitrogen fertilizer synth (Haber-Bosch protocol), hybrid seed genetics, high-torque tractor automation, and temperature-controlled storage.',
      controls: 'Managed by global grain trading conglomerates (ABCD traders: ADM, Bunge, Cargill, Dreyfus) and farm machinery providers (John Deere).',
      dependencies: 'Requires massive phosphorus inputs (Morocco), potassium deposits (Canada), and stable fuel pricing index for transport fleets.',
      impact: 'Sustains the caloric requirements of 8 billion human lives, preventing immediate societal decay and civil revolutions.',
      history: 'Shifted from manual ox till lines to chemical-synthed nitrogen fertilizers and GPS-guided heavy automated tractors.'
    },
    {
      id: 'banking',
      name: 'Banking & Liquidity',
      icon: <Landmark className="w-5 h-5 text-[#FF00C8]" style={{ filter: 'drop-shadow(0 0 5px rgba(255,0,200,0.3))' }} />,
      howItWorks: 'Commercial deposit intake is amplified via fractional credit expansion, transforming future interest pay promises into active current cash supplies.',
      controls: 'Under geopolitical oversight from central banks (Federal Reserve, ECB) and system-critical private banks (JPMorgan Chase).',
      dependencies: 'Backed by public trust, state balance sheet asset security guarantees, and interbank transaction clearing hubs (SWIFT/Fedwire).',
      impact: 'Directly adjusts the money supply velocity. Expansion fuels stock bubbles and real estate booms; sudden ledger contractions trigger immediate economic collapse.',
      history: 'Evolved from ancient Sumerian clay debt receipts to Italian ledger desks, fractional warehouse receipts, and floating digital cash.'
    },
    {
      id: 'logistics',
      name: 'Transport & Logistics',
      icon: <Truck className="w-5 h-5 text-purple-400" />,
      howItWorks: 'A multi-modal coordination system utilizing mega diesel containerships, cargo flight cells, heavy commercial trucks, and rail routes.',
      controls: 'Managed by massive shipping empires (Maersk, MSC) and package transport systems (FedEx, United Parcel Service).',
      dependencies: 'Exposed to naval choke routes, regional port crane capacity, and diesel warehouse energy grid utilities.',
      impact: 'Removes spatial price friction, enabling factories in China to assemble parts manufactured in Europe for purchase in America.',
      history: 'Revolutionized by standard box containerisation in 1956, eliminating manual port stevedore loading down into standard containers.'
    }
  ];

  // Global Timeline dataset with clean narrative nodes
  const WORLD_TIMELINE = [
    {
      year: '1780',
      title: 'The Coal & Steam Shift',
      desc: 'James Watt\'s high-torque steam engine decouples human kinetics from biological muscle, starting the First Industrial Revolution. Factories replace agricultural fields, and urban centers emerge as the center of global wealth production.',
      impact: 'Global population capacity surges; carbon emissions begin their exponential ascent.',
      icon: '⚙️'
    },
    {
      year: '1870',
      title: 'The Great Gold Standard Era',
      desc: 'Nations fix local paper currencies to specific physical gold reserves. A unified currency language emerges, dropping transaction risks and boosting international investments across borders.',
      impact: 'Price stability reigns; sovereign inflation is virtually non-existent for 40 years, keeping investment horizons secure.',
      icon: '🪙'
    },
    {
      year: '1944',
      title: 'The Bretton Woods Sovereign Pact',
      desc: 'Sovereign delegations meet in New Hampshire, positioning the USD as the supreme global reserve currency, backed by gold assets, with other currencies pegged to the dollar.',
      impact: 'The IMF and World Bank are born; the US dollar takes supreme administrative control of global trade.',
      icon: '🏦'
    },
    {
      year: '1971',
      title: 'Nixon Pops The Gold Window',
      desc: 'Faced with rising war debts and international run on gold reserves, President Nixon ends USD-to-gold convertibility. The world converts to floating fiat money, managed by interest rate dials.',
      impact: 'High inflation spikes in 1970s; debt limits are completely removed, and sovereign cash printing expands.',
      icon: '💥'
    },
    {
      year: '2008',
      title: 'The Great Financial Recession & QE',
      desc: 'Exploding mortgage debt defaults destabilize Wall Street giant investment banks. The Federal Reserve launches Quantitative Easing (QE), creating digital bank reserves to bail out bonds.',
      impact: 'Interest rates drop close to zero; asset prices soar, starting a massive transfer of wealth to asset owners.',
      icon: '📉'
    },
    {
      year: '2020',
      title: 'COVID Handouts & Supply Collapse',
      desc: 'Lockdowns halt factories as governments send trillions in relief checks straight to citizen phones, pumping massive liquidity into consumer checking indices.',
      impact: 'Intense microchip, cargo, and labor bottlenecks trigger the highest general consumer price inflation in 40 years.',
      icon: '🦠'
    },
    {
      year: '2023',
      title: 'Generative AI & Transistor Warfare',
      desc: 'Artificial intelligence logic scales on specialized silicon arrays. Inter-nation-state competition converts into high-stakes semiconductor export restrictions and subsidization.',
      impact: 'Mental tasks scale to marginal cost zero; energy demand surge patterns emerge across global datacenter grids.',
      icon: '🧠'
    }
  ];

  // Interactive Knowledge Graph Connections
  const GRAPH_ROUTES = {
    semis: {
      name: 'Advanced Computation Pipeline',
      desc: 'Trace how Dutch lithography systems ultimately spark consumer digital processing power.',
      steps: [
        { label: 'ASML EUV Machinery', content: 'Zeiss optics project extreme ultraviolet lasers at molecular tolerances onto raw silicon.' },
        { label: 'TSMC Clean Fabrication', content: 'Pure wafer inputs printed in cleanrooms to produce billions of nanometer transistors.' },
        { label: 'NVIDIA GPU Assemblage', content: 'Silicon dies matched with high-speed memory cells to compile high-capacity parallel logic processors.' },
        { label: 'Hyperscaler Datacenters', content: 'Wholesale cloud aggregators plug megawatt logic packs into regional energy grids.' },
        { label: 'High-Performance Computing', content: 'Distributed clusters execute parallel mathematical commands to resolve complex simulations at modular scale.' }
      ]
    },
    blockade: {
      name: 'Geopolitical Supply Shock',
      desc: 'Trace how localized maritime naval blockades result in price spikes on main street supermarket shelves.',
      steps: [
        { label: 'Naval Bottle Blockade', content: 'Military operations blockade strategic coordinates like the Suez Canal or Strait of Malacca.' },
        { label: 'Maritime Logistics Reroute', content: 'Container supertankers bypass around Africa, consuming millions of barrels of expensive marine diesel.' },
        { label: 'Energy Commodity Spikes', content: 'Freight indices jump; Brent crude barrels gain value under global supply panic.' },
        { label: 'Fertilizer Production Pause', content: 'Natural gas prices surge, halting chemical synthesis processing centers of crop nutrients.' },
        { label: 'Supermarket Grocery Inflation', content: 'Higher shipping costs, machine fuels, and crop inputs hit retail, inflating family food bills.' }
      ]
    },
    rates: {
      name: 'Monetary Policy Cascade',
      desc: 'Analyze how central bank rate dial adjustments trigger banking sector liquidity shocks.',
      steps: [
        { label: 'Federal Reserve Rate Hike', content: 'Central bank raises overnight discount target rates to tighten available system liquidity.' },
        { label: 'Bond Value Depreciation', content: 'Existing fixed-income sovereign bonds drop in value as new bonds issue with higher yields.' },
        { label: 'Commercial Balance Sheet Depressions', content: 'Deposit banks hold large volumes of devaluing bonds, impacting liquid assets.' },
        { label: 'Mobile Savings Bank Run', content: 'Digital clients panic under solvency rumors, draining retail deposit reserves instantly.' },
        { label: 'Emergency Emergency Liquidity Bailout', content: 'Monetary authorities activate special loans to prevent bank failures from spreading.' }
      ]
    }
  };

  // Human Needs categorization dictionary
  const HUMAN_NEEDS = {
    food: {
      title: 'Nutrients and Crop Science',
      concept: 'Econ exists to feed 8 billion human bellies every single morning.',
      detail: 'A complex web of fossil sower, global silo trades, and diesel deliveries ensures calories are distributed reliably. Local crop disruptions or fuel spikes directly threaten human nutrition.',
      fact: 'Without industrial fertilizers synthesized from natural gas, global farmland could sustain only half of the current world population.'
    },
    energy: {
      title: 'Power and Horsepower',
      concept: 'The absolute physical energy consumption running heavy metropolitan areas.',
      detail: 'Every elevator, hospital, sewer filter, and phone relies on stable electric current stepdowns and fossil power. If energy grids go dark, metropolitan cities survive for only 72 hours.',
      fact: 'One barrel of raw crude oil contains the energy density equivalent of 25,000 hours of manual human biological labor.'
    },
    shelter: {
      title: 'Housing and Mortgages',
      concept: 'Providing safe environments for families while serving as human wealth engines.',
      detail: 'Modern homes require substantial investment capital. Interest rate shifts directly impact housing costs. High rates suppress home purchases, forcing families into expensive rental markets.',
      fact: 'Raising a 30-year mortgage interest rate from 3% to 7% doubles the total lifetime cost of the home in interest fees.'
    },
    labor: {
      title: 'Wages and Human Time',
      concept: 'Exchanging human cognitive and biological time for monetary ledger deposits.',
      detail: 'Workers provide labor in return for liquid currency. If inflation devalues the currency faster than bosses raise salaries, real wages contract, lowering standard of living.',
      fact: 'If groceries rise by 8% and your hourly paycheck grows by only 2%, your real wage was effectively lowered by 6%.'
    }
  };

  const handleNextTimeline = () => {
    setSelectedTimelineIndex(prev => (prev + 1) % WORLD_TIMELINE.length);
  };

  const handlePrevTimeline = () => {
    setSelectedTimelineIndex(prev => (prev - 1 + WORLD_TIMELINE.length) % WORLD_TIMELINE.length);
  };

  return (
    <div className="flex flex-col gap-6 font-sans select-none animate-fadeIn select-text pb-12 text-zinc-300">
      
      {/* 1. MASTER SPECTRAL HERO SPLASH */}
      <section className="relative overflow-hidden border border-[#00D9FF]/20 p-8 md:p-12 rounded-[28px] bg-gradient-to-br from-[#02131C] via-black/95 to-black select-text shadow-2xl">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#00D9FF]/40 to-transparent" />
        <div className="absolute top-0 right-0 p-4 text-[9px] font-mono font-black tracking-widest text-[#00D9FF] uppercase">
          PERMANENT_MEMORY_GRID // ACTIVE
        </div>
        <div className="relative z-10 max-w-[800px] flex flex-col gap-4">
          <span className="inline-block px-3 py-1 bg-[#00D9FF]/10 border border-[#00D9FF]/30 text-[#00D9FF] text-[9.5px] font-black tracking-widest uppercase font-mono rounded-full max-w-fit">
            The Digital Library of Human Systems • Phase 11
          </span>
          <h1 className="text-white font-black text-2.5xl md:text-3.5xl tracking-tight leading-none uppercase">
            The Permanent Knowledge <br/>
            <span className="text-[#00D9FF] text-2xl md:text-3xl">& Economic Infrastructure</span>
          </h1>
          <p className="text-zinc-400 text-xs md:text-sm leading-relaxed">
            Welcome to the centralized historical archives of civilization. Explore public companies, economic systems, historical frameworks, and industrial dependencies that shape human life.
          </p>
        </div>
      </section>

      {/* 2. CORE SEGMENT SWITCHER TABS */}
      <div className="flex flex-wrap gap-2 p-1.5 bg-[#03060f] border border-white/10 rounded-2.5xl shadow-xl">
        {[
          { id: 'INDEX', label: 'A-Z Master Index', icon: <Library className="w-4 h-4" /> },
          { id: 'ATLAS', label: 'Company Atlas', icon: <Building2 className="w-4 h-4" /> },
          { id: 'INDUSTRIES', label: 'Industry Archive', icon: <Layers className="w-4 h-4" /> },
          { id: 'TIMELINE', label: 'World Economical Time', icon: <History className="w-4 h-4" /> },
          { id: 'KNOWLEDGE_GRAPH', label: 'Systemic Graph', icon: <Share2 className="w-4 h-4" /> },
          { id: 'HUMAN_NEEDS', label: 'Survive Needs Focus', icon: <Users className="w-4 h-4" /> },
          { id: 'FUTURE', label: 'Future Horizon', icon: <Sparkles className="w-4 h-4" /> },
        ].map((seg) => (
          <button
            key={seg.id}
            onClick={() => setActiveSegment(seg.id as any)}
            className={`flex-1 min-w-[120px] p-2.5 rounded-xl border font-mono text-[9.5px] uppercase font-black tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer ${activeSegment === seg.id ? 'bg-[#00D9FF]/15 border-[#00D9FF] text-white shadow-[0_0_15px_rgba(0,217,255,0.15)] scale-[1.01]' : 'border-white/5 bg-white/[0.01] hover:bg-white/[0.04] text-zinc-500'}`}
          >
            {seg.icon}
            <span>{seg.label}</span>
          </button>
        ))}
      </div>

      {/* 3. DYNAMIC SEGMENT RENDER PORTALS */}
      
      {/* 3A. INDEX SEGMENT */}
      {activeSegment === 'INDEX' && (
        <div className="p-6 bg-[#040915]/95 border border-white/10 rounded-3xl flex flex-col gap-6 shadow-xl animate-fadeIn">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-4">
            <div className="flex items-center gap-2">
              <Library className="w-5 h-5 text-[#00D9FF]" />
              <div>
                <h3 className="text-white font-extrabold text-xs uppercase tracking-wider">The Mass Organized Knowledge Index</h3>
                <span className="text-[9px] font-mono text-zinc-500">CENTRALIZED GLOSSARY RETRIEVAL PLATFORM</span>
              </div>
            </div>

            {/* Index Categories Filter */}
            <div className="flex flex-wrap bg-neutral-900 border border-white/5 p-1 rounded-xl">
              {(['ALL', 'TERMS', 'COMPANIES', 'CONCEPTS', 'EVENTS'] as const).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setIndexCategory(cat)}
                  className={`py-1 px-2.5 rounded-lg font-mono text-[8.5px] uppercase font-bold tracking-wider transition-all cursor-pointer ${indexCategory === cat ? 'bg-[#00D9FF] text-black font-black' : 'text-zinc-500 hover:text-zinc-300'}`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-3.5 top-3 w-4 h-4 text-zinc-500" />
            <input
              type="text"
              placeholder="Search by term (e.g. inflation, arbitrage, ASML, Basel)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-black/60 border border-white/10 p-3 pl-10 rounded-xl text-xs font-mono text-white placeholder-zinc-500 focus:outline-none focus:border-[#00D9FF] transition-all"
            />
          </div>

          {/* Grid display */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {MASTER_TERMS.filter(item => {
              const matchesSearch = item.term.toLowerCase().includes(searchTerm.toLowerCase()) || 
                                    item.desc.toLowerCase().includes(searchTerm.toLowerCase());
              const matchesCat = indexCategory === 'ALL' || item.category === indexCategory;
              return matchesSearch && matchesCat;
            }).map((item) => (
              <div 
                key={item.id} 
                className="p-4 bg-neutral-950/80 border border-white/5 hover:border-[#00D9FF]/20 transition-all rounded-xl relative overflow-hidden flex flex-col justify-between group"
              >
                <div className="absolute top-0 right-0 p-3 font-mono text-[36px] font-black text-white/[0.015] select-none pointer-events-none">
                  {item.char}
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[9px] font-mono bg-white/[0.04] px-1.5 py-0.5 rounded text-zinc-400 font-bold">
                      {item.tag}
                    </span>
                  </div>
                  <h4 className="text-white font-extrabold text-[12px] uppercase mt-2 group-hover:text-[#00D9FF] transition-colors">
                    {item.term}
                  </h4>
                  <p className="text-zinc-450 text-[10.5px] mt-1.5 leading-relaxed font-medium">
                    {item.desc}
                  </p>
                </div>
                {askAboutTerm && (
                  <button 
                    onClick={() => askAboutTerm({ term: item.term })}
                    className="mt-4 pt-2.5 border-t border-white/5 text-[9.5px] font-mono text-zinc-500 group-hover:text-[#00D9FF] transition-colors text-left font-bold cursor-pointer flex items-center gap-1"
                  >
                    <span>Query System Academic AI Scholar</span>
                    <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3B. ATLAS SEGMENT (10,000 COMPANY ATLAS) */}
      {activeSegment === 'ATLAS' && (
        <div className="p-6 bg-[#040915]/95 border border-white/10 rounded-3xl flex flex-col gap-6 shadow-xl animate-fadeIn">
          <div className="flex items-center gap-2 border-b border-white/5 pb-3">
            <Building2 className="w-5 h-5 text-[#00D9FF]" />
            <div>
              <h3 className="text-white font-extrabold text-xs uppercase tracking-wider">The 10,000 Corporation Systemic Atlas</h3>
              <span className="text-[10px] font-mono text-zinc-500">WHY MEGA PUBLIC COMPANIES GOVERN LANDSCAPE CIVILIZATION</span>
            </div>
          </div>

          {/* Quick Select Buttons */}
          <div className="flex flex-wrap gap-2">
            {Object.entries(ATLAS_COMPANIES).map(([ticker, comp]) => (
              <button
                key={ticker}
                onClick={() => setSelectedAtlasCompany(ticker)}
                className={`py-2 px-3.5 rounded-xl border font-mono text-[9.5px] uppercase font-black transition-all cursor-pointer ${selectedAtlasCompany === ticker ? 'bg-[#00D9FF]/10 border-[#00D9FF] text-white shadow-[0_0_10px_rgba(0,217,255,0.15)] scale-[1.01]' : 'border-white/5 bg-white/[0.01] hover:bg-white/[0.04] text-zinc-400'}`}
              >
                ${ticker} • {comp.name.split(' ')[0]}
              </button>
            ))}
          </div>

          {/* Corporate Profile Card */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 bg-black/40 border border-white/5 p-6 rounded-2.5xl">
            <div className="lg:col-span-5 flex flex-col justify-between gap-4">
              <div>
                <span className="font-mono text-[9px] uppercase tracking-widest text-[#00D9FF] font-black block mb-1">Atlas Registered Corporate Anchor</span>
                <h4 className="text-white font-black text-lg tracking-tight uppercase">
                  {ATLAS_COMPANIES[selectedAtlasCompany].name} (${ATLAS_COMPANIES[selectedAtlasCompany].ticker})
                </h4>
                <div className="text-[#00D9FF] text-[10.5px] font-mono font-bold mt-1 uppercase">
                  {ATLAS_COMPANIES[selectedAtlasCompany].industry}
                </div>
                <p className="text-zinc-405 text-xs text-zinc-405 mt-3 leading-relaxed leading-normal bg-[#040915] p-3 border border-[#00eaff]/10 rounded-xl">
                  {ATLAS_COMPANIES[selectedAtlasCompany].description}
                </p>
              </div>

              {/* Financial Specs */}
              <div className="grid grid-cols-2 gap-2 bg-neutral-950 p-4 border border-white/5 rounded-xl text-center font-mono py-3">
                <div>
                  <div className="text-[8.5px] text-zinc-500 font-bold uppercase">Market Value</div>
                  <div className="text-xs text-white font-black leading-none mt-1">{ATLAS_COMPANIES[selectedAtlasCompany].metrics.cap}</div>
                </div>
                <div>
                  <div className="text-[8.5px] text-zinc-500 font-bold uppercase">Est. Revenue</div>
                  <div className="text-xs text-white font-black leading-none mt-1">{ATLAS_COMPANIES[selectedAtlasCompany].metrics.revenue}</div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-7 border-l border-white/5 pl-0 lg:pl-6 space-y-4">
              {/* Products/Services */}
              <div>
                <span className="text-[9.5px] text-cyan-400 font-mono tracking-widest font-black block uppercase">PRODUCTS AND INFRASTRUCTURE OFFERINGS:</span>
                <div className="flex flex-wrap gap-2 mt-1.5">
                  {ATLAS_COMPANIES[selectedAtlasCompany].products.map((p, idx) => (
                    <span key={idx} className="bg-white/5 border border-white/10 text-zinc-300 text-[10px] font-mono py-1 px-2.5 rounded-lg">
                      {p}
                    </span>
                  ))}
                </div>
              </div>

              {/* Supply chain dependencies */}
              <div className="p-3.5 bg-yellow-950/20 border border-yellow-500/20 rounded-xl">
                <span className="text-[9.5px] text-yellow-400 font-mono tracking-widest font-black block uppercase flex items-center gap-1">
                  <Info className="w-3.5 h-3.5" />
                  Supply Chain Bottleneck Risk
                </span>
                <p className="text-zinc-300 text-[11px] leading-relaxed mt-1">{ATLAS_COMPANIES[selectedAtlasCompany].supplyChain}</p>
              </div>

              {/* Geographic exposure */}
              <div className="p-3.5 bg-purple-950/20 border border-purple-500/20 rounded-xl">
                <span className="text-[9.5px] text-purple-300 font-mono tracking-widest font-black block uppercase flex items-center gap-1">
                  <Activity className="w-3.5 h-3.5" />
                  Sovereign Macro Exposure Parameters
                </span>
                <p className="text-zinc-300 text-[11px] leading-relaxed mt-1">{ATLAS_COMPANIES[selectedAtlasCompany].exposure}</p>
              </div>

              {/* Critical Global Significance */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div className="p-3.5 bg-neutral-950/60 border border-white/5 rounded-xl">
                  <span className="text-[9px] text-zinc-550 font-mono uppercase block">Historical Context</span>
                  <p className="text-zinc-400 text-[10.5px] leading-relaxed mt-1">{ATLAS_COMPANIES[selectedAtlasCompany].historySignificance}</p>
                </div>
                <div className="p-3.5 bg-neutral-950/60 border border-white/5 rounded-xl">
                  <span className="text-[9px] text-[#00D9FF] font-mono uppercase block">Sovereign Hegemony Impact</span>
                  <p className="text-zinc-400 text-[10.5px] leading-relaxed mt-1">{ATLAS_COMPANIES[selectedAtlasCompany].globalInfluence}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3C. INDUSTRIES SEGMENT */}
      {activeSegment === 'INDUSTRIES' && (
        <div className="p-6 bg-[#040915]/95 border border-white/10 rounded-3xl flex flex-col gap-6 shadow-xl animate-fadeIn">
          <div className="flex items-center gap-2 border-b border-white/5 pb-3">
            <Layers className="w-5 h-5 text-purple-400 animate-pulse" />
            <div>
              <h3 className="text-white font-extrabold text-xs uppercase tracking-wider">The Global Industry Archive</h3>
              <span className="text-[10px] font-mono text-zinc-500">DECONSTRUCTING THE ESSENTIAL MECHANICAL PILOTS OF MODERN NATION-STATES</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
            {GLOBAL_INDUSTRIES.map((ind) => (
              <div key={ind.id} className="p-4 bg-neutral-950 border border-white/5 rounded-2xl flex flex-col gap-3 justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="p-2 bg-white/[0.04] border border-white/10 rounded-xl">{ind.icon}</span>
                    <span className="text-[9px] font-mono text-zinc-500 font-bold">ACTIVE REGIME</span>
                  </div>
                  <h4 className="text-white font-black text-xs uppercase tracking-wide mt-3">{ind.name}</h4>
                  <p className="text-zinc-450 text-[10.5px] leading-relaxed mt-1.5">{ind.howItWorks}</p>
                </div>

                <div className="space-y-2 mt-4 pt-3 border-t border-white/5">
                  <div className="text-[9px] font-mono text-zinc-500">WHO MOUNT CONTROL LAYER:</div>
                  <div className="text-[10px] text-zinc-300 leading-normal">{ind.controls}</div>
                  
                  <div className="text-[9px] font-mono text-cyan-400">KEY SYSTEM IMPORTANCE:</div>
                  <div className="text-[10.5px] text-zinc-350 leading-relaxed font-mono">{ind.impact}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3D. TIMELINE SEGMENT */}
      {activeSegment === 'TIMELINE' && (
        <div className="p-6 bg-[#040915]/95 border border-white/10 rounded-3xl relative overflow-hidden flex flex-col gap-6 shadow-xl animate-fadeIn">
          <div className="flex items-center gap-2 border-b border-white/5 pb-3">
            <Calendar className="w-5 h-5 text-amber-500 animate-spin" style={{ animationDuration: '10s' }} />
            <div>
              <h3 className="text-white font-extrabold text-xs uppercase tracking-wider">A Continuous History of the World Economy</h3>
              <span className="text-[10px] font-mono text-zinc-500">SEVEN HISTORICAL SHIFTS THAT REDEFINED HUMAN CIVILIZATION</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            {/* Left selector dots */}
            <div className="md:col-span-4 flex flex-row md:flex-col gap-1.5 md:border-r border-white/5 pr-0 md:pr-4">
              {WORLD_TIMELINE.map((time, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedTimelineIndex(idx)}
                  className={`flex-1 flex items-center gap-3 p-3.5 rounded-xl border text-left transition-all cursor-pointer ${selectedTimelineIndex === idx ? 'bg-amber-500/10 border-amber-400 text-white' : 'border-white/5 bg-white/[0.005] hover:bg-white/5 text-zinc-500'}`}
                >
                  <span className="text-base">{time.icon}</span>
                  <div className="hidden md:block">
                    <div className="text-[10.5px] font-mono tracking-widest leading-none">YEAR {time.year}</div>
                    <div className="text-[11px] font-semibold mt-1 truncate">{time.title}</div>
                  </div>
                </button>
              ))}
            </div>

            {/* Detail terminal display card */}
            <div className="md:col-span-8 bg-black/60 p-6 rounded-2.5xl border border-white/5 flex flex-col justify-between min-h-[300px]">
              <div>
                <div className="flex items-center justify-between border-b border-white/5 pb-2.5">
                  <span className="text-[10px] font-mono text-amber-500 font-black uppercase tracking-wider">
                    EPOCH INDEX CODE 0{selectedTimelineIndex + 1}
                  </span>
                  <span className="text-[10.5px] font-mono text-zinc-500 font-bold block bg-amber-500/10 px-2.5 py-0.5 border border-amber-500/20 rounded-full text-[9px] uppercase tracking-wider">
                    YEAR {WORLD_TIMELINE[selectedTimelineIndex].year}
                  </span>
                </div>

                <h4 className="text-white font-black text-base mt-4 flex items-center gap-2">
                  <span>{WORLD_TIMELINE[selectedTimelineIndex].icon}</span>
                  <span>{WORLD_TIMELINE[selectedTimelineIndex].title}</span>
                </h4>

                <p className="text-zinc-300 text-xs leading-relaxed mt-3.5">
                  {WORLD_TIMELINE[selectedTimelineIndex].desc}
                </p>

                <div className="mt-4 p-3 bg-[#0d0a04] border border-amber-500/25 rounded-xl">
                  <span className="text-[9.5px] font-mono text-amber-400 font-black uppercase block">Main Street Human Impact:</span>
                  <p className="text-zinc-400 text-[11px] mt-0.5 leading-relaxed leading-normal">{WORLD_TIMELINE[selectedTimelineIndex].impact}</p>
                </div>
              </div>

              <div className="flex gap-2 mt-6 border-t border-white/5 pt-4">
                <button 
                  onClick={handlePrevTimeline}
                  className="py-1 px-3 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-lg text-[9px] uppercase font-mono tracking-[0.1em] cursor-pointer"
                >
                  ◀ Backward Journey
                </button>
                <button 
                  onClick={handleNextTimeline}
                  className="py-1 px-3 bg-amber-400 hover:bg-amber-300 text-black font-extrabold rounded-lg text-[9px] uppercase font-mono tracking-[0.1em] cursor-pointer"
                >
                  Forward Journey ▶
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3E. KNOWLEDGE GRAPH */}
      {activeSegment === 'KNOWLEDGE_GRAPH' && (
        <div className="p-6 bg-[#040915]/95 border border-white/10 rounded-3xl flex flex-col gap-6 shadow-xl animate-fadeIn">
          <div className="flex items-center gap-2 border-b border-white/5 pb-3">
            <Share2 className="w-5 h-5 text-cyan-400 animate-pulse" />
            <div>
              <h3 className="text-white font-extrabold text-xs uppercase tracking-wider">Interconnected Knowledge Graph Systems</h3>
              <span className="text-[10px] font-mono text-zinc-500">REVEAL THE HIDDEN RELATIONSHIPS AND FEEDBACK CASCADES GOVERNING ECONOMIES</span>
            </div>
          </div>

          <div className="flex bg-neutral-900 border border-white/5 p-1 rounded-xl max-w-lg">
            {[
              { id: 'semis', label: 'Advanced Logic Grid' },
              { id: 'blockade', label: 'Commodity Blockade Cascade' },
              { id: 'rates', label: 'Reserve Rates Tightening' }
            ].map((route) => (
              <button
                key={route.id}
                onClick={() => { setActiveGraphRoute(route.id as any); setActiveGraphStep(0); }}
                className={`flex-1 py-1 text-center font-mono text-[9.5px] uppercase font-black rounded-lg transition-all cursor-pointer ${activeGraphRoute === route.id ? 'bg-[#00D9FF] text-black font-black font-semibold' : 'text-zinc-500 hover:text-zinc-305'}`}
              >
                {route.label}
              </button>
            ))}
          </div>

          <p className="text-zinc-400 text-xs italic">
            "{GRAPH_ROUTES[activeGraphRoute].desc}"
          </p>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            {/* Steps map indicators */}
            <div className="lg:col-span-5 space-y-1.5 border-r border-white/5 pr-0 lg:pr-6">
              {GRAPH_ROUTES[activeGraphRoute].steps.map((st, i) => (
                <button
                  key={i}
                  onClick={() => setActiveGraphStep(i)}
                  className={`w-full text-left p-3 rounded-xl border font-mono transition-all cursor-pointer flex justify-between items-center ${activeGraphStep === i ? 'bg-cyan-500/10 border-cyan-400 text-white' : 'border-white/5 bg-white/[0.005] hover:bg-white/5 text-zinc-500'}`}
                >
                  <div className="flex items-center gap-2">
                    <span className={`w-5 h-5 rounded-full text-[10px] font-black flex items-center justify-center ${activeGraphStep === i ? 'bg-[#22D3EE] text-black' : 'bg-white/10 text-zinc-400'}`}>
                      0{i+1}
                    </span>
                    <span className="text-[11px] font-extrabold uppercase">{st.label}</span>
                  </div>
                  <ChevronRight className={`w-4 h-4 transition-transform ${activeGraphStep === i ? 'translate-x-1 text-cyan-400' : 'text-zinc-650 opacity-10'}`} />
                </button>
              ))}
            </div>

            {/* Interactive explanation viewport */}
            <div className="lg:col-span-7 bg-neutral-950/60 p-6 rounded-2.5xl border border-white/5 min-h-[200px] flex flex-col justify-between">
              <div>
                <span className="text-[9.5px] font-mono tracking-widest text-[#00D9FF] uppercase font-black block">Active Cascade Node Detail</span>
                <h4 className="text-white font-extrabold uppercase text-xs tracking-wider mt-1 pb-2 border-b border-white/5">
                  {GRAPH_ROUTES[activeGraphRoute].steps[activeGraphStep].label}
                </h4>
                <p className="text-zinc-300 text-xs leading-relaxed mt-3.5">
                  {GRAPH_ROUTES[activeGraphRoute].steps[activeGraphStep].content}
                </p>
              </div>

              <div className="mt-4 p-3 bg-cyan-950/20 border border-cyan-500/25 rounded-xl text-[9px] font-mono">
                <span className="text-[#00D9FF] font-extrabold uppercase block">Systemic Lesson:</span>
                Everything in human society is fully linked. Micro developments in Dutch lenses create cascading triggers that alter modern software valuations.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3F. HUMAN NEEDS SEGMENT */}
      {activeSegment === 'HUMAN_NEEDS' && (
        <div className="p-6 bg-[#040915]/95 border border-white/10 rounded-3xl flex flex-col gap-6 shadow-xl animate-fadeIn">
          <div className="flex items-center gap-2 border-b border-white/5 pb-3">
            <Users className="w-5 h-5 text-green-400 animate-pulse" />
            <div>
              <h3 className="text-white font-extrabold text-xs uppercase tracking-wider">Explore by Human Need Focus</h3>
              <span className="text-[10px] font-mono text-zinc-500">WHY ECONOMIC STRUCTURES CONCURRENTLY EXIST ONLY TO SUPPORT BIOLOGICAL HUMAN SURVIVAL</span>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
            {Object.entries(HUMAN_NEEDS).map(([key, val]) => (
              <button
                key={key}
                onClick={() => setSelectedHumanNeed(key)}
                className={`p-3.5 rounded-xl border font-mono text-[10px] uppercase font-black tracking-widest text-center cursor-pointer transition-all ${selectedHumanNeed === key ? 'bg-green-500/10 border-green-500 text-green-400 scale-[1.02] shadow-[0_0_15px_rgba(34,197,94,0.15)]' : 'border-white/5 bg-white/[0.01] hover:bg-white/5 text-zinc-500'}`}
              >
                ● {key} // {val.title.split(' ')[0]}
              </button>
            ))}
          </div>

          {/* Display viewport */}
          <div className="bg-neutral-950/60 p-6 rounded-2.5xl border border-white/5">
            <div className="border-b border-white/5 pb-2.5 mb-3.5 flex items-center justify-between">
              <div>
                <span className="text-[9.5px] font-mono text-green-400 font-black uppercase tracking-wider">CONSTRUCTION SECTOR PIPELINE</span>
                <h4 className="text-white font-black text-sm tracking-wide mt-1 uppercase">
                  {HUMAN_NEEDS[selectedHumanNeed as keyof typeof HUMAN_NEEDS].title}
                </h4>
              </div>
              <span className="text-[10px] font-mono text-zinc-505 block">CORE SURVIVAL ANCHOR</span>
            </div>

            <p className="text-zinc-300 text-xs italic leading-relaxed">
              "{HUMAN_NEEDS[selectedHumanNeed as keyof typeof HUMAN_NEEDS].concept}"
            </p>

            <p className="text-zinc-400 text-[11.5px] leading-relaxed mt-3.5 bg-black/40 p-4 border border-white/5 rounded-xl">
              {HUMAN_NEEDS[selectedHumanNeed as keyof typeof HUMAN_NEEDS].detail}
            </p>

            <div className="mt-4 p-3 bg-green-950/20 border border-green-500/25 rounded-md flex items-center gap-3">
              <Lightbulb className="w-5 h-5 text-green-400" />
              <div className="text-[10px] font-mono text-zinc-300 leading-normal">
                <span className="text-green-400 font-bold block">Scientific Micro-Fact:</span>
                {HUMAN_NEEDS[selectedHumanNeed as keyof typeof HUMAN_NEEDS].fact}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3G. FUTURE HORIZON */}
      {activeSegment === 'FUTURE' && (
        <div className="p-6 bg-[#040915]/95 border border-white/10 rounded-3xl flex flex-col gap-6 shadow-xl animate-fadeIn">
          <div className="flex items-center gap-2 border-b border-white/5 pb-3">
            <Sparkles className="w-5 h-5 text-yellow-500 animate-bounce" />
            <div>
              <h3 className="text-white font-extrabold text-xs uppercase tracking-wider">The Future Systems Archive</h3>
              <span className="text-[10px] font-mono text-zinc-500">AN EDUCATIONAL ROADMAP LOOKING AT THE STRATEGIC FRONTIERS OF HUMAN CIVILIZATION</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {[
              {
                title: 'The AI Marginal Logic Economy',
                effect: 'Mental productivity decoupled from biology hours',
                desc: 'By translating rational tasks onto high-performance silicon chips, the marginal cost of computer logic will slide close to virtual zero. Industries like coding, medical analysis, and legal drafting will see massive productivity surges, completely reshaping traditional office employment.',
                fact: 'Calculated global computational logic pipelines are scaling by 10x every two years, putting massive energy strain on physical local electrical grids.'
              },
              {
                title: 'General-Purpose Humanoid Robotics',
                effect: 'The automation of raw thermodynamic manual labor',
                desc: 'By marrying complex machine vision with precise mechanical joint actuators, autonomous workers will run physical tasks inside warehouse sorting blocks, farming fields, and manufacturing corridors, bypassing physical human kinetic limits.',
                fact: 'Eliminating manual factory bottlenecks allows high-capital nations to relocate heavy production back to domestic industrial grids.'
              },
              {
                title: 'Nuclear Fusion and Megawatt Grids',
                effect: 'Infinite clean thermodynamic fuel availability',
                desc: 'The transition from burning Carbon sediments to clean nuclear fission and eventual thermal fusion will supply humanity with limitless energetic yields without carbon emissions.',
                fact: 'Unlocking fusion energy collapses the base cost of water desalination, allowing dry deserts to be synthetically irrigated as lush arable farms.'
              },
              {
                title: 'Space Logistics and Satellite Gantry Networks',
                effect: 'Expanding commercial supply trades beyond orbital limits',
                desc: 'Low-earth orbital rocket launches and private launch arrays are converting space from physical military areas into rich raw mining sectors. Early developers target asteroid belts containing quadrillions in rare minerals.',
                fact: 'A single medium-sized platinum-rich space asteroid holds more raw material reserves than humanity has extracted in centuries.'
              }
            ].map((f, idx) => (
              <div key={idx} className="p-5 bg-neutral-950 border border-white/5 rounded-2.5xl flex flex-col justify-between">
                <div>
                  <span className="text-[9px] font-mono font-black text-amber-500 bg-amber-500/10 px-2 py-0.5 border border-amber-500/20 rounded-full">
                    HORIZON 0{idx+1}
                  </span>
                  <h4 className="text-white font-black text-sm mt-3 uppercase tracking-tight">{f.title}</h4>
                  <div className="text-[10px] font-mono text-zinc-500 uppercase mt-0.5">EST EFFECT: {f.effect}</div>
                  <p className="text-zinc-400 text-xs leading-relaxed mt-3 bg-black/40 p-3.5 border border-white/5 rounded-xl">
                    {f.desc}
                  </p>
                </div>
                <div className="mt-4 pt-3.5 border-t border-white/5 text-[10px] font-mono text-cyan-405 text-cyan-400 flex items-center gap-1.5">
                  <span className="inline-block w-1.5 h-1.5 bg-green-500 rounded-full animate-ping" />
                  <span>Metric Parameter: {f.fact}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
