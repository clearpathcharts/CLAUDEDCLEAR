import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, BookOpen, GraduationCap, ChevronLeft, Send, Sparkles, Globe, 
  HelpCircle, ChevronRight, ArrowRight, Layers, Award, Terminal, HardDrive, AlertTriangle, 
  Play, Coins, Calendar, TrendingUp, Compass, Cpu, RefreshCw, Zap, Landmark,
  Folder, FolderOpen, FileCode, CheckCircle2, Star, Smile, Sparkle, Trophy,
  Users, Home, DollarSign, Brain, Settings, Boxes, Bell
} from 'lucide-react';
import Markdown from 'react-markdown';
import GlobalAtlasView from './GlobalAtlasView';
import CivilizationEngineView from './CivilizationEngineView';
import MasterKnowledgeIndexView from './MasterKnowledgeIndexView';
import { 
  encyclopediaArticles, 
  encyclopediaCategories, 
  Article 
} from './EncyclopediaData';
import { ENCYCLOPEDIA_KNOWLEDGE_BASE } from './KnowledgeBaseData';
import KnowledgeItemViewer from './KnowledgeItemViewer';
import OrderBookSimulator from './OrderBookSimulator';
import CentralBankDashboard from './CentralBankDashboard';
import PatternVisualizer from './PatternVisualizer';
import ClearPathTraderPortal from './ClearPathTraderPortal';
import EconomicMemoryMatrix from './EconomicMemoryMatrix';
import PortfolioTracker from '../PortfolioTracker';
import WatchlistView from './WatchlistView';
import MarketPsychologyView from './MarketPsychologyView';
import StockDetailsView from './StockDetailsView';
import CompaniesDirectoryView from './CompaniesDirectoryView';
import MasterMarketExplorerView from './MasterMarketExplorerView';
import { usePageAutoUpdate } from '../../hooks/usePageAutoUpdate';
import ForexPage from '../../pages/forex';
import CryptoPage from '../../pages/crypto';
import CommoditiesPage from '../../pages/commodities';
import KidsMode from '../../pages/kids';
import ComicLibraryView from './ComicLibraryView';
import MarketsDirectory from '../../pages/markets';
import cinematicHeroBg from '../../assets/images/cinematic_hero_bg_1780502378675.png';

// Import our advanced academic blueprints
import ExchangesAtlasView from './ExchangesAtlasView';
import GoldStandardShockView from './GoldStandardShockView';
import IntermarketCorrelationsView from './IntermarketCorrelationsView';
import SoftCommoditiesLabView from './SoftCommoditiesLabView';
import PoliticalErasView from './PoliticalErasView';

// Dynamic Static Generation Pages
import DynamicStockPage from '../../pages/stocks/[symbol]';
import DynamicCryptoPage from '../../pages/crypto/[coin]';
import DynamicForexPage from '../../pages/forex/[pair]';
import DynamicCommodityPage from '../../pages/commodities/[commodity]';

interface GlossaryItem {
  term: string;
  definition: string;
}

const SECTOR_PROFILES: Record<
  'stocks' | 'forex' | 'commodities' | 'macro',
  {
    title: string;
    scale: string;
    settle: string;
    metrics: { label: string; value: string; desc: string }[];
    translations: {
      kids: string;
      highschool: string;
      college: string;
      researcher: string;
    };
    link: string;
  }
> = {
  stocks: {
    title: 'STOCKS (EQUITIES)',
    scale: '10,000+ ASSETS',
    settle: 'Deepest Tier-1',
    metrics: [
      { label: 'TOTAL GLOBAL CAPITALIZATION', value: '$115 Trillion', desc: 'Total equity of listed global corporations' },
      { label: 'HIGHEST CONCENTRATION SECTOR', value: 'Technology / AI', desc: 'Tech brands command over 30% aggregate capitalization' },
      { label: 'STANDARD VALUATION METRIC', value: 'P/E (Price-to-Earnings)', desc: 'Measures purchase price per dollar of net income' }
    ],
    translations: {
      kids: 'Like owning a tiny piece of a local toy store. If the store makes hot sales and grows, your little piece becomes more valuable!',
      highschool: 'Stocks represent fractional equity ownership in public corporations. Shareholders benefit from capital gains when share prices appreciate, and may receive periodically distributed corporate dividends.',
      college: 'Equities represent residual claims on corporate capital assets. Secondary market pricing is fundamentally driven by discounted cash flows (DCF), aggregate corporate growth projections, and equity risk premium adjustments.',
      researcher: 'Sovereign equity instruments exist as perpetual claims on corporate cash flows. Valuation is mathematically discounted via capital asset pricing models (CAPM) and weighted average cost of capital (WACC) metrics, pricing equity risk premiums dynamically.'
    },
    link: 'encyclopedia/markets/stocks.html'
  },
  forex: {
    title: 'FOREIGN EXCHANGE (FOREX)',
    scale: '1,000+ PAIRS',
    settle: 'Infinite Liquid',
    metrics: [
      { label: 'DAILY TRANSACTION VOLUMES', value: '$7.5 Trillion', desc: 'Aggregated sovereign currency trade clearance' },
      { label: 'DOMINANT RESERVE BASE', value: 'U.S. Dollar (USD)', desc: 'Settles over 85% of total bilateral foreign exchanges' },
      { label: 'TRANSMISSION CHANNEL', value: 'Interbank Network', desc: 'Over-the-counter decentralized national nodes' }
    ],
    translations: {
      kids: 'Like swapping your green crayons for blue crayons when you go to another room. Different rooms use different colors of money!',
      highschool: 'The market where sovereign national currencies are traded. Exchange ratios adjust based on the relative strength, industrial health, and inflation rates of each respective country.',
      college: 'Foreign exchange systems coordinate global credit flows and trade settlement. Valuation is determined by central bank interest differentials, purchasing power parity (PPP), and balance of payments statistics.',
      researcher: 'Forex represents the foundational multi-sovereign ledger of international liquidity. Rates clear OTC to equalize covered and uncovered interest parity (CIP/UIP), adjustments to trade balances, capital-account flows, and geopolitical reserve accumulation strategies.'
    },
    link: 'encyclopedia/markets/forex.html'
  },
  commodities: {
    title: 'COMMODITIES REAL',
    scale: '150+ COLLATERALS',
    settle: 'Hard Resource',
    metrics: [
      { label: 'REAL CORE PHYSICAL ENERGY', value: 'Crude Oil (WTI)', desc: 'The basic hydrocarbon underlying industrial production' },
      { label: 'MONETARY TRUST COLLATERAL', value: 'Gold Bullion', desc: 'Sovereign reserve anchor spanning multiple epochs' },
      { label: 'STANDARD PRICING CURVE', value: 'Backwardation & Contango', desc: 'Futures spread tracking immediate physical delivery' }
    ],
    translations: {
      kids: 'Real things you can hold and touch, like shiny gold coins, heavy metal pipes, or sacks of wheat to bake bread and cakes!',
      highschool: 'Raw materials and agricultural products used to fuel cities, feed populations, and build buildings. Prices change directly based on supply harvests and mine yields.',
      college: 'Primary natural resources acting as foundational collateral. Prices are cyclical, determined by inventory schedules, industrial demand constraints, and geopolitical transportation route bottlenecks.',
      researcher: 'Primary physical goods with high inelasticity of short-run supply. Subject to storage-cost arbitrage, convenience yield valuations, backwardated or contango futures-basis curves, and sovereign resource-nationalism margins.'
    },
    link: 'encyclopedia/markets/commodities.html'
  },
  macro: {
    title: 'MACROECONOMICS',
    scale: '40+ INDICATORS',
    settle: 'Sovereign Debt Levers',
    metrics: [
      { label: 'AGGREGATE SOVEREIGN OUTPUT', value: '$105 Trillion GDP', desc: 'Aggregated national economic industrial run rates' },
      { label: 'MONETARY BASE ADJUSTER', value: 'Federal Reserve rate', desc: 'Sets short term capital price coordinates worldwide' },
      { label: 'DEBT MULTIPLIER SLOPE', value: 'Yield Curve steepness', desc: 'Measures short versus long duration premium curves' }
    ],
    translations: {
      kids: 'Watching the entire neighborhood to see if everyone has a job, if pocket money is plenty, or if toys are getting too expensive!',
      highschool: 'The study of national economies. Covers key indicators like inflation (rising prices), gross domestic product (growth), employment indices, and central bank money supply policies.',
      college: 'Theoretical modeling of national aggregate balance sheets. Focuses on monetary transmission corridors, fiscal multiplier dynamics, business cycle phases, and currency velocity relationships.',
      researcher: 'Quantitative coordination of multi-sovereign financial regimes. Models velocity of money (V = PY/M) relationships, terminal debt-collateral ratios, debt monetization horizons, and macroeconomic balance of payments bounds.'
    },
    link: 'economy.html'
  }
};

const SOVEREIGN_REGIONS: Record<string, {
  name: string;
  code: string;
  currency: string;
  currencySymbol: string;
  gdpSize: string;
  interestRate: string;
  inflationRate: string;
  keyExports: string[];
  keyImports: string[];
  systemicHurdles: string;
  narrative: string;
  themeColor: 'cyan' | 'pink' | 'purple' | 'amber' | 'emerald';
  moneyFlowNodes: { from: string; to: string; label: string; asset: string }[];
  supplyChainNodes: { source: string; target: string; goods: string; status: string }[];
}> = {
  'us-macro': {
    name: "United States (USD Dollar Engine)",
    code: "US-FED",
    currency: "US Dollar",
    currencySymbol: "USD ($)",
    gdpSize: "$28.7 Trillion",
    interestRate: "5.25%",
    inflationRate: "2.4%",
    keyExports: ["High-tech IP & OS", "Military aerospace hardware", "Agriculture & Corn bulk", "Liquified Natural Gas (LNG)"],
    keyImports: ["Consumer retail goods", "Automotive parts", "High-nanometer GPUs", "Crude petroleum"],
    systemicHurdles: "Unprecedented sovereign debt expansion ($34T+) requiring continuous global treasury reserve bidding, combined with deep domestic wealth stratification.",
    narrative: "The US economy acts as the anchor gravity point for global credit markets. Because the US dollar operates as the dominant global reserve currency, the Federal Funds rate sets the baseline yield pricing floor for global bonds, collateral structures, and cross-border debts.",
    themeColor: 'cyan',
    moneyFlowNodes: [
      { from: "US Consumers", to: "China Manufacturers", label: "Import Purchases", asset: "USD Debit Outflow" },
      { from: "China Manufacturers", to: "Asia Chip Fabs", label: "Components Orders", asset: "CNY Converted" },
      { from: "Asia Chip Fabs", to: "ASML Cleanrooms", label: "Lithography Orders", asset: "EUR Settle" },
      { from: "Eurozone Trade", to: "US Treasuries", label: "Reserve Recycling", asset: "USD Bond Buying" },
    ],
    supplyChainNodes: [
      { source: "Saudi Wells", target: "US Refineries", goods: "Crude Hydrocarbons", status: "Active Maritime Pipelines" },
      { source: "NVIDIA Labs", target: "Taiwan Foundries", goods: "Silicon Fab Instructions", status: "Critical Air Shipments" },
      { source: "Taiwan Foundries", target: "US Assembly Lines", goods: "AI Parallel GPUs", status: "High Value Secure Transit" },
    ]
  },
  'eurozone': {
    name: "Europe (Eurozone Industrial Corridor)",
    code: "EU-ECB",
    currency: "Euro",
    currencySymbol: "EUR (€)",
    gdpSize: "$15.8 Trillion",
    interestRate: "3.75%",
    inflationRate: "2.1%",
    keyExports: ["Advanced Automobiles (Germany)", "Luxury Design Goods (France)", "Heavy Optical Tools & Machines", "Aeroespace Structures"],
    keyImports: ["Raw Hydrocarbon Fuel Pipelines", "Lithium Battery Packs", "Low-tier Assembly Retail", "Critical Microchips"],
    systemicHurdles: "Chronic structural energy vulnerability following pipeline natural gas cuts, paired with decentralized fiscal authorities under a centralized currency union.",
    narrative: "The Eurozone represents the world's largest integrated single market block. Grounded on high-precision materials engineering, advanced chemical processors, and sovereign agricultural reserves, the block remains heavily exposed to energy supply-shocks.",
    themeColor: 'pink',
    moneyFlowNodes: [
      { from: "European Citizens", to: "Middle-East Refiners", label: "Hydrocarbon Purchases", asset: "EUR Spot Sold" },
      { from: "Middle-East Refiners", to: "EU Auto Builders", label: "Capital Goods Orders", asset: "EUR Recaptured" },
      { from: "EU Auto Builders", to: "Swiss Optics Labs", label: "Precision Tool Leases", asset: "CHF Converted" },
    ],
    supplyChainNodes: [
      { source: "Norway Pipelines", target: "German Power Grid", goods: "Sovereign Natural Gas", status: "Subsea Baseline Compression" },
      { source: "German Fab Plants", target: "French Luxury Lines", goods: "Precision Leather Cutters", status: "High-speed Rail Logistical Mesh" },
      { source: "Rotterdam Docks", target: "EU Warehouses", goods: "APAC Semiconductor Parts", status: "Active Container Flows" },
    ]
  },
  'china-manufacturing': {
    name: "China (Sovereign Industrial Workbench)",
    code: "CN-PBOC",
    currency: "Yuan Renminbi",
    currencySymbol: "CNY (¥)",
    gdpSize: "$18.6 Trillion",
    interestRate: "3.45%",
    inflationRate: "0.2%",
    keyExports: ["Lithium-ion Storage Batteries", "Electric Vehicles (EVs)", "Active Solar Grids (PV)", "Assembled Telecommunication Tech"],
    keyImports: ["Iron Ore & Raw Copper", "Liquid Natural Gas (LNG)", "ASML Lithography Tools", "Advanced Server Processors"],
    systemicHurdles: "Rapidly age-shifting demographics, a severe local real-estate balance-sheet contraction, and trade restriction limits with primary Western buyers.",
    narrative: "China operates as the physical assembly workbench of the modern world. Combining centralized state bank credit corridors with high industrial clusters, China transforms raw metallurgical minerals into advanced battery and consumer electronics hardware.",
    themeColor: 'purple',
    moneyFlowNodes: [
      { from: "Western Brands", to: "Shenzhen Assemblies", label: "Logistics Assembly Out", asset: "USD Cash Flow" },
      { from: "Shenzhen Assemblies", to: "Brazil Mine Boards", label: "Copper & Iron Buying", asset: "CNY Bilateral Swap" },
      { from: "Brazil Mine Boards", to: "US Tech Software", label: "Mine Optimization Lease", asset: "USD Convert" },
    ],
    supplyChainNodes: [
      { source: "Australia Mine Hubs", target: "Shanghai Docks", goods: "Iron Ore Slurry", status: "Bulk Cargo Carrier Transit" },
      { source: "Guangdong Fabs", target: "European Markets", goods: "Lithium Storage Cells", status: "Daily Maritime Container Ships" },
      { source: "Middle-East Wells", target: "Shenzhen Refineries", goods: "Crude Petroleum", status: "Active Tanker Supply" },
    ]
  },
  'japan-carry': {
    name: "Japan (Global Carry Liquidity Engine)",
    code: "JP-BOJ",
    currency: "Japanese Yen",
    currencySymbol: "JPY (¥)",
    gdpSize: "$4.2 Trillion",
    interestRate: "0.25%",
    inflationRate: "2.5%",
    keyExports: ["Hybrid Electric Auto Frameworks", "Industrial Automation Robotics", "Semiconductor Wafer Chemicals", "High Precision Optics"],
    keyImports: ["98% of Baseline Hydrocarbons", "Supermarket Grain Stocks", "Parallel Compute Cards", "Consumer Luxury Design"],
    systemicHurdles: "Deepest national debt-to-GDP ratio (260%+) globally, combined with chronic domestic demographic contraction.",
    narrative: "Japan acts as the ultimate liquidity lender to the global economy. By maintaining multi-decade ultra-low interest rates, global funds borrow cheap Yen, sell it for currency pairs on Forex spots, and invest in higher-yield global equities.",
    themeColor: 'amber',
    moneyFlowNodes: [
      { from: "Speculative Desks", to: "BOJ Window", label: "Borrow low-yield JPY", asset: "JPY Collateral Note" },
      { from: "Speculative Desks", to: "FX Spot Desks", label: "Dump Yen, acquire USD", asset: "Yen Spot Sold" },
      { from: "FX Spot Desks", to: "US Treasuries", label: "Invest in 5% US T-Bills", asset: "USD Carry Margin" },
    ],
    supplyChainNodes: [
      { source: "Tokyo Optical Labs", target: "Taiwan Silicon Fabs", goods: "Lithography Photoresists", status: "Chilled Chemical Cargo" },
      { source: "Qatar Gas Berths", target: "Osaka LNG Terminals", goods: "Sovereign Liquified Gas", status: "Cryo-vessel Shipping Rails" },
    ]
  },
  'brics-emerging': {
    name: "BRICS Corridor (Resource Sovereignty Hub)",
    code: "BR-NDB",
    currency: "Local sovereign swap pools",
    currencySymbol: "SWAP (⇋)",
    gdpSize: "$29.1 Trillion (Aggregate)",
    interestRate: "Varies (Avg 6-12%)",
    inflationRate: "Avg 4-15%",
    keyExports: ["Crude Oil and sweet hydrocarbons (Russia/Saudi)", "Agricultural cash crop corn/soy (Brazil)", "Industrial grade steel (India)", "Rare earth oxides"],
    keyImports: ["High-end server processors", "Consumer software platforms", "Precision assembly equipment", "Advanced aviation turbines"],
    systemicHurdles: "Heterogeneous geopolitical priorities within the bloc and highly variable local currency rate stability.",
    narrative: "The expanding BRICS bloc controls a dominant percentage of global physical resources. By coordinating local billing swap lines, they aim to bypass US dollar clearances and secure direct resource exchange rails.",
    themeColor: 'emerald',
    moneyFlowNodes: [
      { from: "Indian Oil Refiners", to: "Siberian Wells", label: "Bilateral Energy Import", asset: "Rupee-to-Ruble Direct Swap" },
      { from: "Siberian Wells", to: "Chinese Equipment", label: "Drilling Parts Buy", asset: "Yuan Clearance" },
      { from: "Beijing Treasury", to: "Brazil Farm Coops", label: "Agricultural Soy buys", asset: "CNY Spot Settle" },
    ],
    supplyChainNodes: [
      { source: "Siberian Wellheads", target: "Indian Refineries", goods: "Siberian Light Crude", status: "Bypassed Maritime Tanker Fleets" },
      { source: "Brazilian Cerrado", target: "Tianjin Granaries", goods: "Soybeans & Maize", status: "Bulk Carrier Rails Active" },
      { source: "South African mining", target: "Shenzhen batteries", goods: "Manganese & Platinum", status: "Active Bulk Docks Cargo" },
    ]
  }
};

const COMPANY_RELATIONSHIPS: Record<string, {
  ticker: string;
  name: string;
  industry: string;
  sectorPath: string;
  products: string[];
  competitors: { name: string; ticker: string }[];
  exposure: string;
  macroFactors: { factor: string; description: string; path: string }[];
  marketCap: string;
  revenue: string;
  competitivenessTrend: string;
}> = {
  apple: {
    ticker: 'AAPL',
    name: 'Apple Inc.',
    industry: 'Consumer Electronics & Smart Ecosystems',
    sectorPath: 'encyclopedia/sectors/ai-sector.html',
    products: ['iPhone hardware', 'Mac operational systems', 'Subscription services', 'Wearables logic'],
    competitors: [
      { name: 'Samsung Electronics', ticker: 'SMSN' },
      { name: 'Microsoft Corp', ticker: 'MSFT' },
      { name: 'Google (Android Mobile OS)', ticker: 'GOOG' }
    ],
    exposure: 'Highly exposed to East Asian manufacturer line bottlenecks, consumer confidence drops, and retail semiconductor wafers pricing fluctuations.',
    macroFactors: [
      { factor: 'Consumer Confidence Indices', description: 'Impacts high-end discretionary smartphone upgrade loops.', path: 'encyclopedia/economy/gdp.html' },
      { factor: 'Sovereign Interest Rates', description: 'Alters corporate share-repurchasing costs.', path: 'encyclopedia/economy/interest-rates.html' },
      { factor: 'Silicon Fab Capacity Constraints', description: 'Influences chip assembly delivery timelines.', path: 'encyclopedia/sectors/semiconductor-sector.html' }
    ],
    marketCap: '$3.24 Trillion USD',
    revenue: '$383.2 Billion USD',
    competitivenessTrend: 'Stabilizing - consumer retention remains exceptional amid services expansion.'
  },
  microsoft: {
    ticker: 'MSFT',
    name: 'Microsoft Corporation',
    industry: 'Enterprise Cloud Infrastructure & OS Systems',
    sectorPath: 'encyclopedia/sectors/ai-sector.html',
    products: ['Azure Cloud Workloads', 'Office Enterprise Productivity', 'Windows OS Standard', 'AI Assistant Models'],
    competitors: [
      { name: 'Amazon (AWS Cloud Systems)', ticker: 'AMZN' },
      { name: 'Alphabet Google (Vertex Cloud)', ticker: 'GOOG' },
      { name: 'Oracle Corporation', ticker: 'ORCL' }
    ],
    exposure: 'Highly exposed to commercial IT budgets downsizing and global hyperscale raw energy baseload limits.',
    macroFactors: [
      { factor: 'Corporate CapEx Budgets', description: 'Dictates general enterprise Azure cloud workload expansion.', path: 'encyclopedia/economy/gdp.html' },
      { factor: 'Alternative Power Grids scaling', description: 'Grid energy volume constraints directly cap massive server center expansion.', path: 'encyclopedia/sectors/energy-sector.html' }
    ],
    marketCap: '$3.38 Trillion USD',
    revenue: '$227.6 Billion USD',
    competitivenessTrend: 'Bullish - dominant corporate contract streams with sovereign defense grids.'
  },
  nvidia: {
    ticker: 'NVDA',
    name: 'NVIDIA Corporation',
    industry: 'High-Performance Silicon Hardware & Compute',
    sectorPath: 'encyclopedia/sectors/semiconductor-sector.html',
    products: ['A100 and H100 Parallel compute GPUs', 'CUDA Software platforms', 'Mellanox InfiniBand networks', 'Automated drive arrays'],
    competitors: [
      { name: 'Advanced Micro Devices', ticker: 'AMD' },
      { name: 'Intel Corporation', ticker: 'INTC' },
      { name: 'Broadcom Solutions', ticker: 'AVGO' }
    ],
    exposure: 'Extremely exposed to high-nanometer extreme lithography yields, geopolitical Taiwan strait logistics risks, and tech venture funding cycles.',
    macroFactors: [
      { factor: 'EUV Lithography Machine limits', description: 'Depends exclusively on ASML precision printing units.', path: 'encyclopedia/sectors/semiconductor-sector.html' },
      { factor: 'Venture Capital Interest Loops', description: 'Venture spending directs cloud server GPU purchase frequencies.', path: 'encyclopedia/economy/interest-rates.html' }
    ],
    marketCap: '$2.98 Trillion USD',
    revenue: '$60.9 Billion USD',
    competitivenessTrend: 'Exponential - enjoys functional supply monopoly on high-bandwidth AI logic engines.'
  },
  tesla: {
    ticker: 'TSLA',
    name: 'Tesla Inc.',
    industry: 'Autonomous Electric Mobilities & Battery Reserves',
    sectorPath: 'encyclopedia/sectors/ai-sector.html',
    products: ['Electric Vehicles', 'Megapack grid backup batteries', 'Full Self-Driving neural stacks', 'Optimus robotics models'],
    competitors: [
      { name: 'BYD Auto Group', ticker: '1211.HK' },
      { name: 'Toyota Motor Corp', ticker: 'TM' },
      { name: 'Mercedes-Benz Group', ticker: 'MBG' }
    ],
    exposure: 'Exposed directly to lithium-ion processing margins, electric utility infrastructure loading capacity, and general retail car financing rates.',
    macroFactors: [
      { factor: 'Metal Alloys Spot Pricing', description: 'Lithium, cobalt, and nickel costs impact overall direct margin calculations.', path: 'encyclopedia/markets/commodities.html' },
      { factor: 'Car Financing Interest Rates', description: 'Higher loan rates raise monthly financing barriers for retail families.', path: 'encyclopedia/economy/interest-rates.html' }
    ],
    marketCap: '$580.4 Billion USD',
    revenue: '$96.7 Billion USD',
    competitivenessTrend: 'Dynamic - transitioning from raw automobile manufacturing to pure machine software margins.'
  },
  amazon: {
    ticker: 'AMZN',
    name: 'Amazon.com, Inc.',
    industry: 'Global Logistics Networks & Cloud Services',
    sectorPath: 'encyclopedia/sectors/ai-sector.html',
    products: ['E-Commerce retail pipelines', 'Amazon Web Services (AWS)', 'Prime streaming services', 'Robotic shipping systems'],
    competitors: [
      { name: 'Walmart Inc (Consumer Retail)', ticker: 'WMT' },
      { name: 'Microsoft Corp', ticker: 'MSFT' },
      { name: 'Shopify Corp (Merchant Services)', ticker: 'SHOP' }
    ],
    exposure: 'Directly exposed to commercial diesel/fuel overheads, workforce labor unions, and broad disposable client income patterns.',
    macroFactors: [
      { factor: 'Crude Oil Fuel Overheads', description: 'Skins logistics overheads across thousands of trailer routes daily.', path: 'encyclopedia/markets/commodities.html' },
      { factor: 'Disposable Retail Salaries', description: 'Broad GDP inflation forces families to focus solely on essential groceries.', path: 'encyclopedia/economy/inflation.html' }
    ],
    marketCap: '$1.86 Trillion USD',
    revenue: '$574.8 Billion USD',
    competitivenessTrend: 'Robust - cloud profits reliably defend and fund hyper-scale logistical margins.'
  }
};

const glossaryItems: GlossaryItem[] = [
  { term: 'Adverse Selection', definition: 'A scenario where a liquidity provider transacts against toxic order flow originating from highly informed institutional entities, resulting in structural losses.' },
  { term: 'Arbitrage', definition: 'The simultaneous purchasing and selling of an asset in different markets to exploit minuscule pricing discrepancies across exchanges.' },
  { term: 'Base Rate (Fed Funds)', definition: 'The benchmark target rate set by the Central Bank to determine overnight interest rates, driving the sovereign yield curve.' },
  { term: 'Backwardation', definition: 'A futures market pricing structure where near-month contracts sell at a premium compared to outer-month maturities.' },
  { term: 'Beta (Volatility Coeff)', definition: 'A measurement of an individual asset’s systematic sensitivity to broader market fluctuations.' },
  { term: 'Bear Market', definition: 'A prolonged period of systemic price contraction across a stock index, typically marked by declines exceeding 20% from peak valuation.' },
  { term: 'Balance Sheet', definition: 'A corporate ledger reporting total assets, liabilities, and shareholders\' equity at a specific point in time, showing capital health.' },
  { term: 'Contango', definition: 'The pricing structure for futures contracts where forward delivery prices trade higher than spot, representing carry costs.' },
  { term: 'Co-location', definition: 'Positioning private servers inside exchange data nodes to eliminate latency delays below single-digit microseconds.' },
  { term: 'CPI (Consumer Price Index)', definition: 'A monthly macroeconomic index measuring the average price changes of a representative basket of general consumer goods.' },
  { term: 'Capital Gains', definition: 'The taxable financial profit realized from selling a capital asset (shares, real estate) above its initial purchasing cost.' },
  { term: 'Commodities', definition: 'Physical raw resources traded globally with standardized units, ranging from sweet light crude oil to physical gold bullion.' },
  { term: 'Dark Pool', definition: 'A private alternative trading hub lacking immediate order book disclosures, allowing large block orders to transact secretly.' },
  { term: 'Duration Risk', definition: 'The measurement of a bond’s price sensitivity to sudden moves in interest rates.' },
  { term: 'Deflation', definition: 'A systemic, aggregate decline in consumer prices, which increases real debt liability values and slows purchase velocity.' },
  { term: 'Expectancy', definition: 'The statistical average of what a single trading model yields per dollar of risk: (Win Rate * Avg Win) - (Loss Rate * Avg Loss).' },
  { term: 'ETF (Exchange Traded Fund)', definition: 'A pooled investment trust traded directly on public stock exchanges, tracking a sector or index of underlying assets.' },
  { term: 'Fair Value Gap', definition: 'An unhedged single candle expansion creating buying or selling disparity; price tends to rebalance this vacuum.' },
  { term: 'Gamma Squeeze', definition: 'An options-driven buying cascade where market makers are forced to purchase shares to hedge delta reserves.' },
  { term: 'Gross Domestic Product (GDP)', definition: 'The total market valuation of all finished goods and services produced inside a nation\'s borders in a specific year.' },
  { term: 'HFT (High Frequency)', definition: 'Automated quantitative algorithms transacting thousands of limit matches per second inside localized exchange datacenters.' },
  { term: 'Inverted Yield Curve', definition: 'An abnormal credit structure where near-term maturity yields exceed long-term yields, predicting economic slowdowns.' },
  { term: 'IPO (Initial Public Offering)', definition: 'The debut transaction where a private corporation issues fractional shares to the public on an official primary exchange.' },
  { term: 'Judas Swing', definition: 'An intraday trap swing executing false session breakouts to harvest resting stop balances before running real directions.' },
  { term: 'Kelly Criterion', definition: 'A mathematical sizing formula determining the optimal fraction of capital to risk per transaction.' },
  { term: 'Liquidity Sweep', definition: 'Driving prices past structural highs or lows specifically to consume concentrated stop-loss orders to complete larger blocks.' },
  { term: 'Market Capitalization', definition: 'The total market valuation of a public firm, calculated as the current share price multiplied by outstanding share count.' },
  { term: 'Order Block', definition: 'A consolidated cluster of bulk buying or selling orders driven by institutions, leaving resting mitigation footprints.' },
  { term: 'Quantitative Easing', definition: 'An unconventional monetary policy where central banks purchase long-term sovereign bonds to inject liquid reserves.' },
  { term: 'Recession', definition: 'A significant decline in broad economic activity visible across production, employment, and sales, marked by negative real GDP.' },
  { term: 'Sharpe Ratio', definition: 'The metric dividing portfolio excess gains above risk-free rates by standard deviations of volatility.' },
  { term: 'Slippage', definition: 'The difference in pricing between order submission and final fill execution, typically caused by low book depth.' },
  { term: 'Swap Rate', definition: 'The overnight interest debit or credit resulting from leverage rollover costs between domestic currency interest curves.' },
  { term: 'Yield Curve', definition: 'A graphical plot showing interests paid by comparable bonds across multiple maturity durations, from overnight bills to 30-year notes.' }
];

interface MacroEra {
  year: string;
  eraName: string;
  tagline: string;
  summary: string;
  severity: 'Low' | 'Medium' | 'High' | 'EXTREME';
  fedFundsRate: string;
  dxyLevel: string;
  goldPricePrice: string;
  monetaryAction: string;
}

const macroEras: MacroEra[] = [
  {
    year: '1971',
    eraName: 'Nixon Shock & Fiat Dawn',
    tagline: 'The severing of Bretton Woods gold-convertibility standards.',
    summary: 'President Richard Nixon unilaterally closed the gold window, converting the US Dollar from a gold-backed security into a pure unbacked fiat benchmark. This created major volatility chains in free-floating forex channels.',
    severity: 'High',
    fedFundsRate: '5.75%',
    dxyLevel: '120.2',
    goldPricePrice: '38.00 / oz',
    monetaryAction: 'Suspended currency convertibility'
  },
  {
    year: '1979',
    eraName: 'The Volcker Rate Offense',
    tagline: 'Aggressive 20% interest rates to tame runaway consumer inflation.',
    summary: 'Federal Reserve Chairman Paul Volcker hiked the overnight funds target rate to an extraordinary 20%, triggering deep industrial recessions but successfully crushing inflation and launching the multi-decade USD bull trend.',
    severity: 'EXTREME',
    fedFundsRate: '20.00%',
    dxyLevel: '85.4',
    goldPricePrice: '307.00 / oz',
    monetaryAction: 'Severe liquidity crunch'
  },
  {
    year: '1997',
    eraName: 'East Asian Contagion',
    tagline: 'Unpegged currencies collapsed capital reserves overnight.',
    summary: 'The collapse of the Thai Baht peg trigger a destructive currency revaluation cascade across East Asia. National banks depleted USD foreign currency reserves trying to defend speculative hedge attacks.',
    severity: 'High',
    fedFundsRate: '5.50%',
    dxyLevel: '98.1',
    goldPricePrice: '287.00 / oz',
    monetaryAction: 'Emergency IMF rescue packages'
  },
  {
    year: '2008',
    eraName: 'Global Credit Implosion',
    tagline: 'Interest rates hit the Zero Bound and Quantitative Easing is born.',
    summary: 'Subprime default cascades freeze interbank shadow lending. The Federal Reserve slashes rates to 0% and begins buying trillions in long-term bonds (QE) to artificially repress commercial borrowing yields.',
    severity: 'EXTREME',
    fedFundsRate: '0.25%',
    dxyLevel: '78.5',
    goldPricePrice: '870.00 / oz',
    monetaryAction: 'Trillion-dollar QE injections'
  },
  {
    year: '2020',
    eraName: 'Pandemic Helicopter Flooding',
    tagline: 'Hyper-expansion of sovereign reserves triggers inflationary feedback.',
    summary: 'To combat systemic shutdowns, the US Fed matches aggressive rate cuts with open market purchases, expanding its balance sheet from $4T to $9T. Global liquidity reaches unprecedented historical saturation.',
    severity: 'High',
    fedFundsRate: '0.10%',
    dxyLevel: '94.2',
    goldPricePrice: '1,890.00 / oz',
    monetaryAction: 'Uncapped Quantitative Easing'
  },
  {
    year: '2022',
    eraName: 'The Great Re-Anchoring',
    tagline: 'Parabolic rate hike cycle to cool consumer indices.',
    summary: 'Faced with decades-high inflation, global central banks aggressively raised rates. Money density tightened, and market capitalizations undertook severe structural repricing as duration yields surged.',
    severity: 'High',
    fedFundsRate: '4.50%',
    dxyLevel: '114.8',
    goldPricePrice: '1,650.00 / oz',
    monetaryAction: 'Aggressive quantitative tightening (QT)'
  }
];


// Legacy inline PoliticalErasView replaced with imported view file

export const LANG_DICT: Record<'EN' | 'ZH' | 'ES' | 'PT' | 'KO', Record<string, string>> = {
  EN: {
    financial_encyclopedia: "ENCYCLOPEDIA OF FINANCE",
    encyclopedia_desc: "Dynamic, sovereign educational terminal built to democratize market understanding.",
    adaptive_controller: "ADAPTIVE PEDAGOGY CONTROLLER",
    re_translate: "Re-translate every explanation in the financial universe to match your specific learning level.",
    museum_lobby: "MUSEUM LOBBY",
    company_blueprints: "COMPANY BLUEPRINTS",
    economic_impact_lab: "ECONOMIC IMPACT LAB",
    certified_academy: "CERTIFIED ACADEMY",
    glossary_vault: "GLOSSARY VAULT",
    global_capital_sectors: "GLOBAL CAPITAL SECTORS",
    class_sizing_index: "CLASS SIZING INDEX",
    exit_terminal: "EXIT TO TRADING TERMINAL",
    workspace: "WORKSPACE",
    sovereign_status: "SOVEREIGN ACCESS STATUS",
    statically_scaled: "STATICALLY SCALED",
    search_placeholder: "Search markets, alliances, equations...",
    click_for_translation: "TRANSLATION ENGINE FORCE ACTIVE",
    market_integrity: "MARKETS INTEGRITY ENGINE",
    begin_mode: "BEGINNER MODE",
    trader_mode: "TRADER MODE",
    analyst_mode: "ANALYST MODE",
    economist_mode: "ECONOMIST MODE",
    role_beginner_tag: "Simple piggy bank analogies",
    role_trader_tag: "Tactical leverage & indicators",
    role_analyst_tag: "Valuation models & multiples",
    role_economist_tag: "Sovereign debt & macro flows",
  },
  ZH: {
    financial_encyclopedia: "金融百科全书",
    encyclopedia_desc: "旨在使市场理解民主化的动态主权教育终端。",
    adaptive_controller: "自适应教学控制器",
    re_translate: "重新翻译金融世界中的每一处解释，使其完美契合您的特定学习级别。",
    museum_lobby: "展览大厅",
    company_blueprints: "公司蓝图",
    economic_impact_lab: "经济影响实验室",
    certified_academy: "认证学院",
    glossary_vault: "词汇宝库",
    global_capital_sectors: "全球资本板块",
    class_sizing_index: "资产分级指数",
    exit_terminal: "返回交易终端局",
    workspace: "工作空间",
    sovereign_status: "主权准入状态",
    statically_scaled: "静态精确缩放",
    search_placeholder: "搜索市场、联盟、方程...",
    click_for_translation: "翻译引擎强制启用中",
    market_integrity: "市场完整性引擎",
    begin_mode: "新手模式",
    trader_mode: "交易员模式",
    analyst_mode: "分析师模式",
    economist_mode: "经济学家模式",
    role_beginner_tag: "简单的储蓄罐类比",
    role_trader_tag: "战术杠杆与技术指标",
    role_analyst_tag: "估值模型与财务乘数",
    role_economist_tag: "主权债务与宏观资金流",
  },
  ES: {
    financial_encyclopedia: "ENCICLOPEDIA FINANCIERA",
    encyclopedia_desc: "Terminal educativa soberana y dinámica construida para democratizar la comprensión de los mercados.",
    adaptive_controller: "CONTROLADOR DE PEDAGOGÍA ADAPTIVA",
    re_translate: "Re-traduce cada explicación en el universo financiero para que coincida con tu nivel de aprendizaje.",
    museum_lobby: "PABELLÓN DEL MUSEO",
    company_blueprints: "PLANOS DE EMPRESAS",
    economic_impact_lab: "LAB DE IMPACTO ECONÓMICO",
    certified_academy: "ACADEMIA CERTIFICADA",
    glossary_vault: "BÓVEDA DE GLOSARIO",
    global_capital_sectors: "SECTORES DE CAPITAL GLOBAL",
    class_sizing_index: "ÍNDICE DE TAMAÑO DE CLASE",
    exit_terminal: "SALIR AL TERMINAL DE TRADING",
    workspace: "PORTAFOLIO",
    sovereign_status: "ESTADO DE ACCESO SOBERANO",
    statically_scaled: "ESCALADO ESTÁTICAMENTE",
    search_placeholder: "Buscar mercados, alianzas, ecuaciones...",
    click_for_translation: "MOTOR DE TRADUCCIÓN ACTIVO",
    market_integrity: "MOTOR DE INTEGRIDAD DE MERCADOS",
    begin_mode: "MODO PRINCIPIANTE",
    trader_mode: "MODO TRADER",
    analyst_mode: "MODO ANALISTA",
    economist_mode: "MODO ECONOMISTA",
    role_beginner_tag: "Analogías simples de alcancía",
    role_trader_tag: "Apalancamiento táctico e indicadores",
    role_analyst_tag: "Modelos de valoración y múltiplos",
    role_economist_tag: "Deuda soberana y flujos macro",
  },
  PT: {
    financial_encyclopedia: "ENCICLOPÉDIA FINANCEIRA",
    encyclopedia_desc: "Terminal educacional soberano e dinâmico construído para democratizar a compreensão do mercado.",
    adaptive_controller: "CONTROLADOR PEDAGÓGICO ADAPTÁVEL",
    re_translate: "Re-traduz todas as explicações do universo financeiro para corresponder ao seu nível.",
    museum_lobby: "LOBBY GERAL DO MUSEU",
    company_blueprints: "ESBOÇOS CORPORATIVOS",
    economic_impact_lab: "LAB DE IMPACTO ECONÔMICO",
    certified_academy: "ACADEMIA CERTIFICADA",
    glossary_vault: "COFRE DE GLOSSÁRIO",
    global_capital_sectors: "SETORES DE CAPITAL GLOBAL",
    class_sizing_index: "ÍNDICE DE CLASSIFICAÇÃO",
    exit_terminal: "VOLTAR AO TERMINAL DE TRADING",
    workspace: "WORKSPACE",
    sovereign_status: "STATUS SOBERANO",
    statically_scaled: "ESCALADO ESTÁTICO",
    search_placeholder: "Pesquisar mercados, equações...",
    click_for_translation: "MOTOR DE TRADUÇÃO ATIVO",
    market_integrity: "MOTOR DE INTEGRIDADE DOS MERCADOS",
    begin_mode: "MODO PRINCIPIANTE",
    trader_mode: "MODO TRADER",
    analyst_mode: "MODO ANALISTA",
    economist_mode: "MODO ECONOMISTA",
    role_beginner_tag: "Analogias simples de cofrinho",
    role_trader_tag: "Alavancagem tática e indicadores",
    role_analyst_tag: "Estudos de valuation e múltiplos",
    role_economist_tag: "Dívida soberana e fluxos macro",
  },
  KO: {
    financial_encyclopedia: "금융 백과사전",
    encyclopedia_desc: "시장 이해를 대중화하기 위해 구축된 역동적인 주권 교육 터미널.",
    adaptive_controller: "맞춤형 교육 컨트롤러",
    re_translate: "특정 학습 수준에 맞춰 금융계 모든 번역 및 설명을 재구성합니다.",
    museum_lobby: "뮤지엄 로비",
    company_blueprints: "기업 설계도 데이터",
    economic_impact_lab: "경제 영향 실증 랩",
    certified_academy: "인증 아카데미",
    glossary_vault: "용어 사전 보관소",
    global_capital_sectors: "글로벌 자본 섹터",
    class_sizing_index: "자산 등급 지수",
    exit_terminal: "트레이딩 터미널로 복귀",
    workspace: "워크스페이스",
    sovereign_status: "주권 액세스 상태",
    statically_scaled: "정적 정밀 스케일링",
    search_placeholder: "시장, 방정식 검색...",
    click_for_translation: "실시간 번역 엔진 활성화됨",
    market_integrity: "시장 무결성 연산 엔진",
    begin_mode: "기본자 모드",
    trader_mode: "트레이더 모드",
    analyst_mode: "애널리스트 모드",
    economist_mode: "이코노미스트 모드",
    role_beginner_tag: "단순 저금통 비유법",
    role_trader_tag: "전술적 레버리지 및 차트 지표",
    role_analyst_tag: "밸류에이션 모델 및 재무 지표",
    role_economist_tag: "주권 채권 및 거시 통화 유출입",
  }
};


const DxyObservatoryView: React.FC<{ selectFileNode: (f: string) => void }> = ({ selectFileNode }) => {
  return (
    <div className="flex flex-col gap-6 font-sans select-none animate-fadeIn">
      <div className="p-8 bg-gradient-to-r from-indigo-950/20 to-black/80 border border-indigo-500/20 rounded-3xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-indigo-500/5 rounded-full blur-[100px] pointer-events-none" />
        <div className="relative z-10 flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-indigo-400 rounded-full animate-ping" />
            <span className="text-[10px] font-mono tracking-widest text-indigo-400 font-black uppercase">RESERVE CURRENCY OBSERVATORY</span>
          </div>
          <h2 className="text-2xl font-black text-white uppercase tracking-tight">DXY ATOM LIGHT-INTENSITY MATRIX</h2>
          <p className="text-zinc-400 text-xs leading-relaxed max-w-3xl font-medium">
            Monitor the U.S. Dollar Strength Index (DXY). Since 1971, the dollar serves as the absolute global liquidity accumulator. All other values are priced inside its deficit shadow.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="col-span-1 md:col-span-2 p-6 bg-black/60 border border-white/5 rounded-3xl flex flex-col gap-4">
          <span className="font-mono text-[10px] text-indigo-400 font-black uppercase tracking-wider">DXY Currency Weights Matrix</span>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {[
              { code: 'EUR', label: 'Eurozone Single Currency', weight: '57.6%', color: 'from-blue-500/10' },
              { code: 'JPY', label: 'Japanese Yen', weight: '13.6%', color: 'from-pink-500/10' },
              { code: 'GBP', label: 'British Pound Sterling', weight: '11.9%', color: 'from-emerald-500/10' },
              { code: 'CAD', label: 'Canadian Dollar', weight: '9.1%', color: 'from-purple-500/10' },
              { code: 'SEK', label: 'Swedish Krona', weight: '4.2%', color: 'from-amber-500/10' },
              { code: 'CHF', label: 'Swiss Franc', weight: '3.6%', color: 'from-cyan-500/10' },
            ].map((cc) => (
              <div key={cc.code} className={`p-4 rounded-2xl bg-gradient-to-b ${cc.color} to-transparent border border-white/5 flex flex-col gap-1 hover:border-white/10 transition-all`}>
                <span className="text-xl font-bold font-mono text-white leading-none">{cc.code}</span>
                <span className="text-[10px] font-mono font-black text-[#00f2ff]">{cc.weight}</span>
                <span className="text-[8.5px] text-zinc-500 leading-tight mt-1">{cc.label}</span>
              </div>
            ))}
          </div>

          <div className="p-4 bg-[#070b16] rounded-xl border border-white/5 text-xs text-zinc-400 leading-relaxed">
            <strong className="text-white">Observation Note:</strong> When the Federal Reserve contracts its balance sheet via Quantitative Tightening (QT) or hikes its base interest rates, it creates a global dollar scarcity choke. This drains capital from emerging markets and triggers global safe-haven flows back to USD, hiking the DXY.
          </div>
        </div>

        <div className="p-6 bg-black/60 border border-indigo-500/20 bg-gradient-to-b from-indigo-500/10 to-transparent rounded-3xl flex flex-col gap-6 items-center justify-center text-center">
          <span className="font-mono text-[9px] text-indigo-400 uppercase tracking-widest font-black">Simulated Live Matrix Dial</span>
          <div className="w-36 h-36 rounded-full border border-indigo-500/30 flex flex-col items-center justify-center relative bg-black/50 shadow-[0_0_30px_rgba(99,102,241,0.15)]">
            <div className="absolute inset-2 rounded-full border border-dashed border-indigo-500/10 animate-spin" style={{ animationDuration: '40s' }} />
            <span className="font-mono text-2xl font-black text-white">103.85</span>
            <span className="text-[8px] font-mono text-emerald-400 font-extrabold mt-1">▲ STRONG • ADVANCING</span>
          </div>
          <div className="flex flex-col gap-1 text-center">
            <span className="text-xs font-black text-white uppercase tracking-tight">System Liquidity Index</span>
            <span className="text-[10.5px] text-zinc-500 leading-normal px-2">High DXY signals severe collateral squeezing across offshore dollar networks.</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const GlobalCrisisArchiveView: React.FC<{ selectFileNode: (f: string) => void }> = ({ selectFileNode }) => {
  return (
    <div className="flex flex-col gap-6 font-sans select-none animate-fadeIn">
      <div className="p-8 bg-gradient-to-r from-red-950/20 to-black/80 border border-red-500/20 rounded-3xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-red-500/5 rounded-full blur-[100px] pointer-events-none" />
        <div className="relative z-10 flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-red-500 rounded-full animate-ping" />
            <span className="text-[10px] font-mono tracking-widest text-red-400 font-black uppercase">SYSTEMIC CRISIS LIBRARY</span>
          </div>
          <h2 className="text-2xl font-black text-white uppercase tracking-tight">GLOBAL SYSTEMIC SHOCKS ARCHIVE</h2>
          <p className="text-zinc-400 text-xs leading-relaxed max-w-3xl font-medium">
            Analyze critical historical moments when international financial liquidity networks suffered catastrophic failures, the structural triggers, and central bank monetary interventions.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {[
          {
            year: '2000 - 2001',
            title: 'The Dot-Com Speculative Drainage',
            trigger: 'Unchecked technology sector overvaluation & extreme capital allocation mismatch.',
            fedResponse: 'Rapid interest rate cuts from 6.5% down to 1.0% (fueling the subsequent housing collateral bubble).',
            lessons: 'Financial markets require raw cash flow generation; visual metrics or portal index hits do not substitute for margin yields.',
            fxComm: 'Severe capital flight from technology equities into physical gold; USD remained relatively stable but yields plummeted.'
          },
          {
            year: '2001 - 2003',
            title: 'Geopolitical Panic & Oil price Shocks',
            trigger: '9/11 attacks, airline insurance insolvencies, and the invasion of Iraq.',
            fedResponse: 'Prolonged accommodative base rate cycles, keeping rates at 1.0% for an extended 12-month window.',
            lessons: 'Geopolitical supply chokes require physical asset protection and premium sovereign security hedges.',
            fxComm: 'Crude Oil prices doubled from $18 up to $38/bbl; safe-haven gold rallied to end a 20-year bear market.'
          },
          {
            year: '2007 - 2009',
            title: 'The Subprime & Great Financial Crisis',
            trigger: 'Catastrophic collateral failure of complex mortgage-backed securitizations and Lehman Brothers bankruptcy.',
            fedResponse: 'Broke interest rate bounds to 0%, created massive swap facilities, and launched the historic Quantitative Easing (QE1) program.',
            lessons: 'Interconnected global banking counterparties cannot survive if core tier-one liquid collateral defaults.',
            fxComm: 'Catastrophic liquidity shortage; DXY surged as foreign institutions rushed for dollars to cover toxic debt sheets.'
          },
          {
            year: '2020',
            title: 'COVID-19 Financial Freeze Waterfall',
            trigger: 'Sudden, systemic stoppage of global industrial workflows and supply chain corridors.',
            fedResponse: 'Emergency 100bps rate slice in one Sunday afternoon, infinite QE operations, and direct corporate purchase program funding.',
            lessons: 'Direct state fiscal stimulus combined with supply reductions guarantees massive currency devaluation inflation cycles.',
            fxComm: 'S&P 500 slumped 30% in weeks; US Dollar skyrocketed temporarily during scarcity, then plunged on multi-trillion dollar M2 expansion.'
          },
          {
            year: '2022 - 2024',
            title: 'Great Inflation Shock & Rate Tightening Campaign',
            trigger: 'Parabolic post-COVID M2 money supply inflation coupled with direct geopolitcal energy chokes in Eastern Europe.',
            fedResponse: 'Fastest interest rate hiking campaign in 40 years, lifting base fed funds rates from 0% straight to 5.25%.',
            lessons: 'Bilateral monetary integrity must eventually be defended, even at the cost of global sovereign bond depreciation.',
            fxComm: 'DXY advanced to a 20-year high of 114; global sovereign bond portfolios suffered their worst destruction in modern financial history.'
          }
        ].map((cris, idx) => (
          <div key={idx} className="p-6 bg-black/60 border border-[#EF4444]/15 hover:border-[#EF4444]/35 bg-gradient-to-r from-red-950/5 to-transparent rounded-3xl flex flex-col gap-4 transition-all">
            <div className="flex items-center justify-between border-b border-white/5 pb-2">
              <span className="font-mono text-[10.5px] font-black text-red-400">{cris.year}</span>
              <span className="text-[8px] font-mono text-zinc-500 font-bold uppercase tracking-widest">SYSTEM LEVEL COMPLIANCE COMPLETE • HIGH CRITICAL</span>
            </div>
            
            <h3 className="text-md font-black text-white uppercase tracking-tight">{cris.title}</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs mt-1">
              <div className="flex flex-col gap-1.5 p-3.5 bg-black/45 rounded-2xl border border-white/5">
                <span className="text-[9.5px] font-mono text-zinc-500 font-extrabold uppercase tracking-wide">Primary Triggering Source</span>
                <p className="text-zinc-300 leading-relaxed">{cris.trigger}</p>
              </div>

              <div className="flex flex-col gap-1.5 p-3.5 bg-black/45 rounded-2xl border border-white/5">
                <span className="text-[9.5px] font-mono text-emerald-400 font-extrabold uppercase tracking-wide">Central Bank Emergency Strategy</span>
                <p className="text-zinc-300 leading-relaxed">{cris.fedResponse}</p>
              </div>

              <div className="flex flex-col gap-1.5 p-3.5 bg-black/45 rounded-2xl border border-white/5">
                <span className="text-[9.5px] font-mono text-indigo-400 font-extrabold uppercase tracking-wide">Bilateral Forex & Commodity Impact</span>
                <p className="text-zinc-300 leading-relaxed">{cris.fxComm}</p>
              </div>

              <div className="flex flex-col gap-1.5 p-3.5 bg-black/45 rounded-2xl border border-white/5">
                <span className="text-[9.5px] font-mono text-amber-400 font-extrabold uppercase tracking-wide">Systemic Academic Lesson</span>
                <p className="text-zinc-300 leading-relaxed font-bold italic">{cris.lessons}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default function EncyclopediaLayout() {
  const [activeFile, setActiveFile] = useState<string>('index.html');
  const [userFontSize, setUserFontSize] = useState<'normal' | 'large' | 'xl'>('large');
  const [viewMode, setViewMode] = useState<'preview' | 'code'>('preview');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [activeArticle, setActiveArticle] = useState<Article>(encyclopediaArticles[0]);
  const [selectedTerm, setSelectedTerm] = useState<GlossaryItem | null>(null);
  const [activeLetter, setActiveLetter] = useState<string>('all');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
  const [learningMode, setLearningMode] = useState<'beginner' | 'trader' | 'analyst' | 'economist'>('trader');
  const [allocation, setAllocation] = useState({
    equities: 40,
    bonds: 20,
    gold: 15,
    crypto: 10,
    cash: 15
  });
  const [glowIntensity, setGlowIntensity] = useState<number>(60);
  const [gridOpacity, setGridOpacity] = useState<number>(35);
  const [particleSpeed, setParticleSpeed] = useState<'slow' | 'normal' | 'fast'>('normal');
  
  // Interactive knowledge map sidebar states
  const [sidebarTab, setSidebarTab] = useState<'map' | 'files'>('map');
  const [mapExpanded, setMapExpanded] = useState<Record<string, boolean>>({
    'markets': true,
    'economy': true,
    'sectors': true,
    'learning': true,
    'glossary': true,
  });
  
  // Interactive simulator configurations
  const [policyDial, setPolicyDial] = useState<number>(80); // 0-100 (QE-QT scale)
  const [activeSovereign, setActiveSovereign] = useState<'USD' | 'EUR' | 'JPY' | 'CNY'>('USD');
  const [activeMarketTab, setActiveMarketTab] = useState<'stocks' | 'forex' | 'commodities'>('stocks');
  const [isTutorOpen, setIsTutorOpen] = useState<boolean>(false);
  const [lightMode, setLightMode] = useState<boolean>(false);

  // User custom interactive states for ChatGPT wireframe alignment
  const [cognitionPersona, setCognitionPersona] = useState<'BEGINNER' | 'TRADER' | 'ANALYST' | 'ECONOMIST'>('BEGINNER');
  const [pedagogyMode, setPedagogyMode] = useState<'kids' | 'highschool' | 'college' | 'researcher'>('kids');
  const [activeLanguage, setActiveLanguage] = useState<'EN' | 'ZH' | 'ES' | 'PT' | 'KO'>('EN');

  // Translation helper function
  const t = (key: string, defaultText: string) => {
    return LANG_DICT[activeLanguage]?.[key] || defaultText;
  };

  const [activeSector, setActiveSector] = useState<'stocks' | 'forex' | 'commodities' | 'macro'>('stocks');
  const [indexSubTab, setIndexSubTab] = useState<'museum-lobby' | 'company-blueprints' | 'economic-impact' | 'certified-academy' | 'glossary-vault'>('museum-lobby');
  const [aiChatQuery, setAiChatQuery] = useState<string>('');
  const [aiChatResponses, setAiChatResponses] = useState<{ sender: 'user' | 'assistant', text: string }[]>([
    { sender: 'assistant', text: "Welcome scholar. I am ClearPath AI. Ask me about Stocks, Crypto, Forex, Inflation or Yield Curves to scan my financial science neural net!" }
  ]);
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);

  // Living Financial Observatory Cockpit Simulator
  const [simProfile, setSimProfile] = useState<'normal' | 'expansion' | 'inflation' | 'panic'>('normal');
  const [simSentiment, setSimSentiment] = useState<number>(72); // 0-100 Greed indicator
  const [simPrices, setSimPrices] = useState({
    sp500: { val: 5278.40, change: 1.82 },
    nasdaq: { val: 16735.02, change: 2.35 },
    dow: { val: 39872.99, change: 1.42 },
    gold: { val: 2387.41, change: 0.76 },
    bitcoin: { val: 66540.21, change: 2.91 },
    oil: { val: 78.62, change: -0.38 },
    vix: { val: 14.32, change: -4.21 }
  });

  usePageAutoUpdate(() => {
    setSimPrices(prev => {
      const drift = (min: number, max: number) => Math.random() * (max - min) + min;
      const applyDrift = (curr: number, scale: number) => {
        const changePct = drift(-0.04, 0.04) * scale;
        return +(curr * (1 + changePct / 100)).toFixed(2);
      };
      return {
        sp500: { val: applyDrift(prev.sp500.val, 1), change: +(prev.sp500.change + drift(-0.02, 0.02)).toFixed(2) },
        nasdaq: { val: applyDrift(prev.nasdaq.val, 1.5), change: +(prev.nasdaq.change + drift(-0.03, 0.03)).toFixed(2) },
        dow: { val: applyDrift(prev.dow.val, 0.8), change: +(prev.dow.change + drift(-0.01, 0.01)).toFixed(2) },
        gold: { val: applyDrift(prev.gold.val, 0.5), change: +(prev.gold.change + drift(-0.015, 0.015)).toFixed(2) },
        bitcoin: { val: applyDrift(prev.bitcoin.val, 4), change: +(prev.bitcoin.change + drift(-0.08, 0.08)).toFixed(2) },
        oil: { val: applyDrift(prev.oil.val, 1.1), change: +(prev.oil.change + drift(-0.04, 0.04)).toFixed(2) },
        vix: { val: Math.max(8.5, +(prev.vix.val + drift(-0.1, 0.1)).toFixed(2)), change: +(prev.vix.change + drift(-0.1, 0.1)).toFixed(2) }
      };
    });
  }, { intervalMs: 4_500, immediate: false });

  useEffect(() => {
    const handleUrlRouting = () => {
      const path = window.location.pathname.toLowerCase().trim();
      if (path === '/' || path === '') return;
      
      if (path.startsWith('/stocks/')) {
        const symbol = path.replace('/stocks/', '');
        if (symbol === 'aapl' || symbol === 'apple') {
          setActiveFile('encyclopedia/stocks/apple.html');
        } else if (symbol === 'tsla' || symbol === 'tesla') {
          setActiveFile('encyclopedia/stocks/tesla.html');
        } else if (symbol === 'nvda' || symbol === 'nvidia') {
          setActiveFile('encyclopedia/stocks/nvidia.html');
        } else if (symbol === 'msft' || symbol === 'microsoft') {
          setActiveFile('encyclopedia/stocks/microsoft.html');
        } else if (symbol === 'amzn' || symbol === 'amazon') {
          setActiveFile('encyclopedia/stocks/amazon.html');
        } else {
          setActiveFile(`encyclopedia/stocks/${symbol}.html`);
        }
      } else if (path.startsWith('/companies/')) {
        const comp = path.replace('/companies/', '');
        let symbolMapped = comp;
        if (comp === 'apple') symbolMapped = 'apple';
        else if (comp === 'tesla') symbolMapped = 'tesla';
        else if (comp === 'nvidia') symbolMapped = 'nvidia';
        else if (comp === 'microsoft') symbolMapped = 'microsoft';
        else if (comp === 'amazon') symbolMapped = 'amazon';
        setActiveFile(`encyclopedia/stocks/${symbolMapped}.html`);
      } else if (path.startsWith('/crypto/')) {
        const coin = path.replace('/crypto/', '');
        setActiveFile(`encyclopedia/crypto/${coin}.html`);
      } else if (path.startsWith('/forex/')) {
        const pair = path.replace('/forex/', '');
        setActiveFile(`encyclopedia/forex/${pair}.html`);
      } else if (path.startsWith('/commodities/')) {
        const commodity = path.replace('/commodities/', '');
        setActiveFile(`encyclopedia/commodities/${commodity}.html`);
      } else if (path.startsWith('/economy/')) {
        const topic = path.replace('/economy/', '');
        setActiveFile(`encyclopedia/economy/${topic}.html`);
      } else if (path === '/crypto') {
        setActiveFile('encyclopedia/markets/crypto.html');
      } else if (path === '/companies' || path === '/companies/') {
        setActiveFile('encyclopedia/companies/directory.html');
      } else if (path === '/forex') {
        setActiveFile('encyclopedia/markets/forex.html');
      } else if (path === '/commodities') {
        setActiveFile('encyclopedia/markets/commodities.html');
      } else if (path === '/financial-encyclopedia' || path === '/encyclopedia') {
        setActiveFile('index.html');
      }
    };
    
    handleUrlRouting();
    window.addEventListener('popstate', handleUrlRouting);
    return () => window.removeEventListener('popstate', handleUrlRouting);
  }, []);

  const handleProfileChange = (profile: 'normal' | 'expansion' | 'inflation' | 'panic') => {
    setSimProfile(profile);
    switch (profile) {
      case 'expansion':
        setSimSentiment(88); // Hyper Greed
        setSimPrices({
          sp500: { val: 5490.15, change: 3.12 },
          nasdaq: { val: 17560.80, change: 4.88 },
          dow: { val: 40720.50, change: 1.95 },
          gold: { val: 2120.40, change: -1.25 },
          bitcoin: { val: 78430.50, change: 8.42 },
          oil: { val: 68.30, change: -2.35 },
          vix: { val: 10.45, change: -12.4 }
        });
        break;
      case 'inflation':
        setSimSentiment(58); // Uneasy Greed
        setSimPrices({
          sp500: { val: 4950.40, change: -1.15 },
          nasdaq: { val: 15410.20, change: -2.05 },
          dow: { val: 38240.10, change: -0.65 },
          gold: { val: 2680.50, change: 4.82 },
          bitcoin: { val: 58900.00, change: -3.15 },
          oil: { val: 114.20, change: 6.85 },
          vix: { val: 19.80, change: 14.5 }
        });
        break;
      case 'panic':
        setSimSentiment(12); // Extreme Fear
        setSimPrices({
          sp500: { val: 4520.30, change: -4.85 },
          nasdaq: { val: 13950.40, change: -6.92 },
          dow: { val: 35100.80, change: -3.45 },
          gold: { val: 2490.10, change: 2.15 },
          bitcoin: { val: 42100.00, change: -12.80 },
          oil: { val: 56.40, change: -5.12 },
          vix: { val: 34.60, change: 42.1 }
        });
        break;
      case 'normal':
      default:
        setSimSentiment(72); // Baseline Greed
        setSimPrices({
          sp500: { val: 5278.40, change: 1.82 },
          nasdaq: { val: 16735.02, change: 2.35 },
          dow: { val: 39872.99, change: 1.42 },
          gold: { val: 2387.41, change: 0.76 },
          bitcoin: { val: 66540.21, change: 2.91 },
          oil: { val: 78.62, change: -0.38 },
          vix: { val: 14.32, change: -4.21 }
        });
        break;
    }
  };

  // Holographic parallax & historical macro era states
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [selectedEraIdx, setSelectedEraIdx] = useState<number>(3); // Default to 2008 Credit Crisis epoch

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      // Scale coordinates (-10px to +10px offsets for gentle visual breathing)
      const x = (e.clientX / window.innerWidth - 0.5) * 20;
      const y = (e.clientY / window.innerHeight - 0.5) * 20;
      setMousePos({ x, y });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Kids Mode State
  const [kidsCoins, setKidsCoins] = useState<number>(() => {
    const saved = localStorage.getItem('cp_kids_coins');
    return saved ? parseInt(saved) : 0;
  });
  const [activeKidsQuestionIdx, setActiveKidsQuestionIdx] = useState<number>(0);
  const [kidsQuizSelectedOpt, setKidsQuizSelectedOpt] = useState<number | null>(null);
  const [kidsQuizAnswered, setKidsQuizAnswered] = useState<boolean>(false);
  const [showConfetti, setShowConfetti] = useState<boolean>(false);

  // File explorer node visibility states
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({
    'encyclopedia': true,
    'stocks': false,
    'economy': false,
    'forex': false,
    'commodities': false,
    'sectors': false,
    'glossary': false,
    'data': false,
    'themes': false,
    'legal': false,
  });

  // Quiz states
  const [quizAnswer, setQuizAnswer] = useState<number | null>(null);
  const [quizSubmitted, setQuizSubmitted] = useState<boolean>(false);

  // AI Tutor states
  const [aiQuestion, setAiQuestion] = useState<string>('');
  const [aiAnswer, setAiAnswer] = useState<string>('');
  const [aiLoading, setAiLoading] = useState<boolean>(false);

  useEffect(() => {
    localStorage.setItem('cp_kids_coins', kidsCoins.toString());
  }, [kidsCoins]);

  useEffect(() => {
    setQuizAnswer(null);
    setQuizSubmitted(false);
  }, [activeArticle]);

  // Handle AI Academic Query
  const handleAskTutor = async (e?: React.FormEvent, customQuery?: string) => {
    if (e) e.preventDefault();
    const queryToSend = customQuery || aiQuestion;
    if (!queryToSend.trim()) return;

    setAiLoading(true);
    setAiQuestion('');
    setIsTutorOpen(true);
    setAiAnswer('Dialing into the ClearPath academic intelligence core...');

    try {
      const response = await fetch('/api/encyclopedia/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ question: queryToSend })
      });

      if (!response.ok) {
        throw new Error('API server was unable to fulfill request parameters');
      }

      const resData = await response.json();
      setAiAnswer(resData.answer || 'No transmission returned from study core.');
    } catch (err: any) {
      console.error('[AI Scholar Request Error]', err);
      setAiAnswer(`**Network Disruption**: Unable to reach remote intelligence node.\n\n${err.message || 'Demonstration placeholder mode loaded.'}`);
    } finally {
      setAiLoading(false);
    }
  };

  const [encyclopediaHistory, setEncyclopediaHistory] = useState<string[]>(['index.html']);
  const [greedSurge, setGreedSurge] = useState<boolean>(false);
  const [fearRipple, setFearRipple] = useState<boolean>(false);

  const askAboutTerm = (term: GlossaryItem) => {
    setSelectedTerm(term);
    handleAskTutor(undefined, `Explain the macroeconomic significance of "${term.term}" and how it relates to domestic market liquidity or Central Banking.`);
  };

  const returnToTerminal = () => {
    localStorage.setItem('cp_dismissed_encyclopedia', 'true');
    window.history.pushState(null, '', '/');
    window.dispatchEvent(new Event('popstate'));
  };

  const toggleFolder = (key: string) => {
    setExpandedFolders(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const selectFileNode = (fileName: string) => {
    setActiveFile(fileName);
    setViewMode('preview');
    setEncyclopediaHistory(prev => {
      if (prev[prev.length - 1] === fileName) return prev;
      return [...prev, fileName];
    });

    if (fileName === 'index.html') {
      window.history.pushState({}, '', '/financial-encyclopedia');
    } else if (fileName === 'encyclopedia/companies/directory.html') {
      window.history.pushState({}, '', '/companies');
    } else if (fileName.startsWith('encyclopedia/stocks/')) {
      const sym = fileName.replace('encyclopedia/stocks/', '').replace('.html', '');
      let mappedSym = sym;
      if (sym === 'apple') mappedSym = 'aapl';
      else if (sym === 'tesla') mappedSym = 'tsla';
      else if (sym === 'nvidia') mappedSym = 'nvda';
      else if (sym === 'microsoft') mappedSym = 'msft';
      else if (sym === 'amazon') mappedSym = 'amzn';
      window.history.pushState({}, '', `/stocks/${mappedSym}`);
    } else if (fileName.startsWith('encyclopedia/crypto/')) {
      const coin = fileName.replace('encyclopedia/crypto/', '').replace('.html', '');
      window.history.pushState({}, '', `/crypto/${coin}`);
    } else if (fileName.startsWith('encyclopedia/forex/')) {
      const pair = fileName.replace('encyclopedia/forex/', '').replace('.html', '');
      window.history.pushState({}, '', `/forex/${pair}`);
    } else if (fileName.startsWith('encyclopedia/commodities/')) {
      const commodity = fileName.replace('encyclopedia/commodities/', '').replace('.html', '');
      window.history.pushState({}, '', `/commodities/${commodity}`);
    } else if (fileName.startsWith('encyclopedia/economy/')) {
      const topic = fileName.replace('encyclopedia/economy/', '').replace('.html', '');
      window.history.pushState({}, '', `/economy/${topic}`);
    } else if (fileName === 'encyclopedia/markets/stocks.html') {
      window.history.pushState({}, '', '/stocks');
    } else if (fileName === 'encyclopedia/markets/crypto.html') {
      window.history.pushState({}, '', '/crypto');
    } else if (fileName === 'encyclopedia/markets/forex.html') {
      window.history.pushState({}, '', '/forex');
    } else if (fileName === 'encyclopedia/markets/commodities.html') {
      window.history.pushState({}, '', '/commodities');
    }
  };

  const handleGoBack = () => {
    if (encyclopediaHistory.length > 1) {
      setEncyclopediaHistory(prev => {
        const nextHist = [...prev];
        nextHist.pop(); // remove current
        const prevPage = nextHist[nextHist.length - 1] || 'index.html';
        setActiveFile(prevPage);
        return nextHist;
      });
    } else {
      setActiveFile('index.html');
    }
  };

  // Raw file content mapping to act as a real browser IDE source view
  const getRawFileContent = (path: string): string => {
    switch (path) {
      case 'index.html':
        return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Encyclopedia of Finance</title>
  <link rel="stylesheet" href="assets/css/style.css">
  <link rel="stylesheet" href="assets/css/encyclopedia-theme.css">
</head>
<body class="encyclopedia-root">
  <!-- CodePen Master UI framework header -->
  <header class="header">
    <div class="logo">CLEARPATH ENCYCLOPEDIA v0.1</div>
    <div class="subtitle">Academic Discovery Hub</div>
  </header>

  <!-- MAIN HERO TITLE -->
  <section class="hero">
    <div class="hero-overlay"></div>
    <div class="hero-content">
      <h1>ENCYCLOPEDIA OF FINANCE</h1>
      <p>
        Learn how the economy actually works.
        From stocks and inflation to global markets
        and economic systems.
      </p>
      <div class="hero-buttons">
        <button onclick="location.href='markets.html'">Explore Markets</button>
        <button onclick="location.href='economy.html'">Learn Economics</button>
      </div>
    </div>
  </section>

  <!-- KEY DISCOVERY MODULES -->
  <div class="featured-grid">
    <div class="market-card">
      <div class="card-glow"></div>
      <h2>What Is Inflation?</h2>
      <p>
        Learn how inflation impacts
        groceries, gas prices, housing,
        stocks, and the global economy.
      </p>
      <button onclick="location.href='encyclopedia/economy/inflation.html'">Explore</button>
    </div>
  </div>
</body>
</html>`;
      case 'markets.html':
        return `<!-- CLEARPATH ENCYCLOPEDIA V0.1 — MARKETS HUD -->
<!DOCTYPE html>
<html lang="en">
<head>
  <title>Markets & Credit Ecosystem</title>
  <link rel="stylesheet" href="assets/css/style.css">
</head>
<body>
  <h1>Asset Markets Explorer</h1>
  <p>Educational indexes covering stocks, foreign currencies, and precious metals.</p>
  
  <div class="market-card">
    <h2>Market Liquidity & Spread Mechanics</h2>
    <p>Limit order books aggregate bid/ask depth continuously. Spreads width compensates market makers.</p>
    <button onclick="loadOrderBook()">Launch Simulator</button>
  </div>
</body>
</html>`;
      case 'economy.html':
        return `<!-- CLEARPATH MACROECONOMICS COMPONENT -->
<!DOCTYPE html>
<html lang="en">
<head>
  <title>Central Banking & Monetary Policy</title>
</head>
<body>
  <div class="market-card">
    <h2>Federal Reserve Control Terminal</h2>
    <p>Simulate interest changes to see sovereign carry spreads dynamic transmission.</p>
  </div>
</body>
</html>`;
      case 'education.html':
        return `<!-- ACADEMIC DISSERTATIONS & TESTING MATRIX -->
<!DOCTYPE html>
<html lang="en">
<body>
  <section class="dissertation">
    <h2>Order Book Depth and Mechanics of Bid-Ask Spread</h2>
    <p>At the core of electronic financial exchanges sits the Limit Order Book...</p>
  </section>
</body>
</html>`;
      case 'sectors.html':
        return `<!-- THEMATIC ECONOMIC SECTOR GRID -->
<div class="sectors-grid">
  <div class="market-card">
    <h2>AI & Silicon Machinery</h2>
  </div>
  <div class="market-card">
    <h2>Sovereign Banking Institutions</h2>
  </div>
</div>`;
      case 'glossary.html':
        return `<!-- ACADEMIC STUDY INDEX AND DEFINITIONS -->
<div class="glossary-wrapper">
  <h2>A-Z Macroeconomics Vocabulary</h2>
  <input type="text" placeholder="Search dictionary...">
</div>`;
      case 'kids-mode.html':
        return `<!-- GAMIFIED FINANCIAL KIDS CLASSROOM -->
<div class="kids-mode-card">
  <h2>Bubblegum Inflation Center 🎈</h2>
  <p>Learn why prices go sky high when too many dollars chase gum!</p>
</div>`;
      case 'global-atlas.html':
        return `<!-- GLOBAL FINANCIAL ATLAS & HUMAN IMPACT ENGINE -->
<div class="financial-atlas-interactive">
  <h2>The Global Financial Atlas</h2>
  <p>How the entire world relates economically: raw resources, labor structures, and transport choke points.</p>
  <h3>Sovereign Regions</h3>
  <ul>
    <li>United States (USD Currency Anchor)</li>
    <li>China (Sovereign Manufacturing Workbench)</li>
    <li>Middle East (Strategic Energy Conduit)</li>
    <li>Eurozone (High-Precision Industrial Guilds)</li>
  </ul>
</div>`;
      case 'civilization-engine.html':
        return `<!-- THE CIVILIZATION ENGINE & DEEP SYLLABUS -->
<div class="civilization-engine">
  <h2>The Civilization Engine</h2>
  <p>Interactive guides deconstructing societal systems: Food, Energy, Logistics, and monetary liquidity corridors.</p>
</div>`;
      case 'master-index.html':
        return `<!-- THE DIGITAL LIBRARY OF HUMAN SYSTEMS -->
<div class="master-index-engine">
  <h2>The Master Knowledge Index & Corporate Atlas</h2>
  <p>Our permanent digital memory infrastructure hosting thousands of concepts, public companies, and global histories.</p>
</div>`;
      case 'data/stocks.json':
        return `[
  { "symbol": "AAPL", "name": "Apple Inc.", "sector": "Technology", "industry": "Consumer Tech", "cap": "$3.1T" },
  { "symbol": "MSFT", "name": "Microsoft Corp", "sector": "Technology", "industry": "Software / AI", "cap": "$3.2T" },
  { "symbol": "NVDA", "name": "NVIDIA Corporation", "sector": "Technology", "industry": "AI Hardware", "cap": "$2.8T" },
  { "symbol": "TSLA", "name": "Tesla Motors", "sector": "Automotive", "industry": "EV & Robotics", "cap": "$620B" },
  { "symbol": "AMZN", "name": "Amazon.com Inc.", "sector": "Consumer", "industry": "Ecommerce / Cloud", "cap": "$1.8T" }
]`;
      case 'data/economy.json':
        return `{
  "policy_rates": { "USD": "5.25%", "EUR": "4.00%", "JPY": "-0.1%" },
  "cpi_weights": { "Housing": 34.4, "Transportation": 16.7, "Food": 13.4, "Medical": 8.1 }
}`;
      case 'themes/dark-neon.css':
        return `:root {
  --neon-pink: #FF00C8;
  --electric-blue: #00D9FF;
  --deep-purple: #7A3BFF;
  --hot-pink: #FF00AA;
  --market-blue: #0047FF;
  --cyan-glow: #00FFFF;
  --sunset-orange: #FF5E00;
  --space-blue: #0B0E54;
}`;
      case 'legal/MIT-LICENSE.txt':
        return `MIT License
Copyright (c) 2026 ClearPath Academy

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "The Software")...`;
      default:
        if (path.endsWith('.html')) {
          return `<!-- Simulated static asset for ${path} -->
<div class="market-card">
  <h2>Preview Source of ${path.substring(path.lastIndexOf('/') + 1)}</h2>
  <p>Classified under ClearPath Academic Syllabus v0.1</p>
</div>`;
        }
        return `// Raw study data segment\n{\n  "path": "${path}",\n  "status": "authenticated",\n  "academic_index": "CPM-Science-900"\n}`;
    }
  };

  const getDxyLiquidityProperties = () => {
    if (policyDial < 30) {
      return {
        label: 'LIQUIDITY FLOODING CYCLE (QUANTITATIVE EASING)',
        desc: 'Asset valuations inflation triggers high-beta buying across equity indexes and digital option targets as dollar scarcity reaches low percentiles.',
        color: '#FF00C8',
        waveSpeed: '25s',
        multiplier: '1.8'
      };
    } else if (policyDial < 70) {
      return {
        label: 'EQUILIBRIUM MACRO PLATFORM',
        desc: 'Reserve metrics align with economic output indices, establishing steady sovereign borrowing rates and carry trading parameters.',
        color: '#7A3BFF',
        waveSpeed: '12s',
        multiplier: '1.0'
      };
    } else {
      return {
        label: 'LIQUIDITY CRUNCH MATRIX (QUANTITATIVE TIGHTENING)',
        desc: 'The US Dollar index enters a steep upward breakout, draining banking cash reserves globally and causing collateral costs to surge under duration shocks.',
        color: '#00D9FF',
        waveSpeed: '4s',
        multiplier: '0.4'
      };
    }
  };

  const currentLiquidityProps = getDxyLiquidityProperties();

  // Highlight styling helper for code preview
  const highlightHtmlSource = (code: string) => {
    return code.split('\n').map((line, i) => {
      let styled = line
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/(&lt;\/?[a-zA-Z1-6]+[^&]*&gt;)/g, '<span style="color: #FF00AA;">$1</span>')
        .replace(/(class="[^"]*")/g, '<span style="color: #00D9FF;">$1</span>')
        .replace(/(onclick="[^"]*")/g, '<span style="color: #FF5E00;">$1</span>')
        .replace(/({[^}]*})/g, '<span style="color: #7A3BFF;">$1</span>')
        .replace(/(&lt;!--[^&]*--&gt;)/g, '<span style="color: #555577; font-style: italic;">$1</span>');
      return (
        <div key={i} className="flex text-[11px] font-mono leading-relaxed select-text">
          <span className="text-zinc-700 w-8 inline-block select-none text-right pr-2 mr-3 border-r border-zinc-800/60">{i + 1}</span>
          <span className="text-zinc-300" dangerouslySetInnerHTML={{ __html: styled || '&nbsp;' }} />
        </div>
      );
    });
  };

  // Kids mode questions
  const kidsTrivia = [
    {
      q: "If you borrow a chocolate chip cookie 🍪 from your friend's jar, and promise to give back the cookie tomorrow PLUS a tiny sweet candy, that extra candy is called:",
      opts: ["A Penalty Tag", "Interest Rate (Cookie Rent!) 📈", "A Free Cookie Pass", "Slippage"],
      correct: 1,
      exp: "Interest is like 'rent' you pay to use something that belongs to someone else for a little while! In the adult world, banks do this with money."
    },
    {
      q: "When a single pack of bubblegum goes from costing 1 shiny coin to 5 shiny coins because paper money loses its superpowers, it is called: 🎈",
      opts: ["A Rollercoaster Loop", "Liquidity", "Inflation! 💸", "A Stock Share"],
      correct: 2,
      exp: "Inflation is when prices of everything we buy go up and up, making each coin less powerful than it used to be!"
    },
    {
      q: "A single 'Share' of stocks in a company (like Apple 🍎 or Nintendo) means:",
      opts: ["You own a tiny physical brick of their factory! 🧱", "You own the entire company by yourself", "You get free toys every Friday", "A contract saying they are borrowing your video game"],
      correct: 0,
      exp: "A stock is like a puzzle piece! Buying a share means you own a tiny piece of the company puzzle, making you a part-owner!"
    },
    {
      q: "Who is the principal teacher of the entire Money High School who decides how many dollars are printed?",
      opts: ["The Local Post Office", "A Local Store Clerk", "The Toy Shop Owner", "The Fed (Federal Reserve)! 🏦"],
      correct: 3,
      exp: "The Federal Reserve (the Fed) acts as the big principal bank. They set the rules for all other student banks and try to keep school economics safe!"
    }
  ];

  const handleKidsAnswer = (idx: number) => {
    if (kidsQuizAnswered) return;
    setKidsQuizSelectedOpt(idx);
    setKidsQuizAnswered(true);
    
    if (idx === kidsTrivia[activeKidsQuestionIdx].correct) {
      setKidsCoins(prev => prev + 50);
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 3000);
    }
  };

  const nextKidsQuestion = () => {
    setKidsQuizSelectedOpt(null);
    setKidsQuizAnswered(false);
    setActiveKidsQuestionIdx((prev) => (prev + 1) % kidsTrivia.length);
  };

  // Article categories matching
  const filteredArticles = encyclopediaArticles.filter(art => {
    const matchesCategory = selectedCategory === 'all' || art.category === selectedCategory;
    const matchesSearch = searchQuery.trim() === '' || 
      art.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      art.summary.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const getEnvThemeConfig = () => {
    if (activeFile.includes('inflation.html')) {
      return {
        type: 'inflation',
        ambientGlow: 'rgba(249,115,22,0.18)',
        gridColor: 'rgba(249,115,22,0.04)',
        bgGradient: 'linear-gradient(to bottom, #070312, #290f05, #1d0701)',
        particleColor: 'text-orange-500/20',
        title: 'INFLATION SIMULATION ENVIRONMENT',
        tag: 'DANGER • POWER EROSION CRITICAL',
        logo: '🔥',
        primaryColor: '#F97316',
        secondaryColor: '#EF4444',
        aurora1: 'rgba(249, 115, 22, 0.18)',
        aurora2: 'rgba(185, 28, 28, 0.15)'
      };
    } else if (activeFile.includes('ai-sector.html') || activeFile.includes('semiconductor-sector.html') || activeFile.includes('nvidia.html') || activeFile.includes('apple.html')) {
      return {
        type: 'cognitive-ai',
        ambientGlow: 'rgba(6,182,212,0.20)',
        gridColor: 'rgba(6,182,212,0.04)',
        bgGradient: 'linear-gradient(to bottom, #060215, #08212e, #03151b)',
        particleColor: 'text-cyan-400/20',
        title: 'SILICON MACHINE COGNITION',
        tag: 'COGNITIVE • MASSIVE SCALING LAW ACTIVE',
        logo: '🧠',
        primaryColor: '#06B6D4',
        secondaryColor: '#3B82F6',
        aurora1: 'rgba(6, 182, 212, 0.22)',
        aurora2: 'rgba(59, 130, 246, 0.15)'
      };
    } else if (activeFile.includes('commodities') || activeFile.includes('oil.html') || activeFile.includes('gold.html')) {
      return {
        type: 'commodities',
        ambientGlow: 'rgba(234,179,8,0.16)',
        gridColor: 'rgba(234,179,8,0.03)',
        bgGradient: 'linear-gradient(to bottom, #080314, #261f05, #191202)',
        particleColor: 'text-yellow-500/20',
        title: 'HARD COMMODITIES PHYSICAL LEDGER',
        tag: 'METALLIC • RESOURCE BALANCES RAW STATE',
        logo: '🪙',
        primaryColor: '#EAB308',
        secondaryColor: '#F97316',
        aurora1: 'rgba(234, 179, 8, 0.18)',
        aurora2: 'rgba(217, 119, 6, 0.13)'
      };
    } else if (activeFile.includes('federal-reserve.html') || activeFile.includes('interest-rates.html') || activeFile.includes('banking.html')) {
      return {
        type: 'fed-sovereign',
        ambientGlow: 'rgba(99,102,241,0.18)',
        gridColor: 'rgba(99,102,241,0.04)',
        bgGradient: 'linear-gradient(to bottom, #050212, #171542, #0b0c22)',
        particleColor: 'text-indigo-400/20',
        title: 'SOVEREIGN AUTHORITY BANKING FRAME',
        tag: 'RESERVES • LIQUIDITY INJECTION FLOWS',
        logo: '🏛️',
        primaryColor: '#6366F1',
        secondaryColor: '#4F46E5',
        aurora1: 'rgba(99, 102, 241, 0.18)',
        aurora2: 'rgba(79, 70, 229, 0.15)'
      };
    } else if (activeFile.includes('recession.html') || activeFile.includes('gdp.html')) {
      return {
        type: 'crash-depression',
        ambientGlow: 'rgba(239,68,68,0.18)',
        gridColor: 'rgba(239,68,68,0.04)',
        bgGradient: 'linear-gradient(to bottom, #060210, #240c0c, #140505)',
        particleColor: 'text-red-500/20',
        title: 'CIVILIZATION CONTRACTION REGISTRY',
        tag: 'CRITICAL • DEBT CORRIDOR CONTRACTION',
        logo: '⚠️',
        primaryColor: '#EF4444',
        secondaryColor: '#991B1B',
        aurora1: 'rgba(239, 68, 68, 0.18)',
        aurora2: 'rgba(153, 27, 27, 0.15)'
      };
    } else if (activeFile.includes('economic-memory-matrix.html')) {
      return {
        type: 'economic-time-machine',
        ambientGlow: 'rgba(168,85,247,0.20)',
        gridColor: 'rgba(168,85,247,0.03)',
        bgGradient: 'linear-gradient(to bottom, #050214, #1a0b36, #0e041d)',
        particleColor: 'text-purple-400/20',
        title: 'ECONOMIC MEMORY ARCHIVE MATRIX',
        tag: 'TIME ENGINE • MATRIX CONNECTORS STABLE',
        logo: '⏳',
        primaryColor: '#A855F7',
        secondaryColor: '#F59E0B',
        aurora1: 'rgba(168, 85, 247, 0.25)',
        aurora2: 'rgba(245, 158, 11, 0.18)'
      };
    } else if (activeFile.includes('index.html') || activeFile === '') {
      return {
        type: 'index-observatory',
        ambientGlow: 'rgba(0,217,255,0.22)',
        gridColor: 'rgba(0,217,255,0.04)',
        bgGradient: 'linear-gradient(to bottom, #040212, #041033, #060e28)',
        particleColor: 'text-[#00D9FF]/20',
        title: 'GLOBAL COG ARCHIVE WORKPLACE',
        tag: 'CIVILIZATION EMULATOR • CHANNELS STABLE',
        logo: '🛰️',
        primaryColor: '#00D9FF',
        secondaryColor: '#FF00C8',
        aurora1: 'rgba(0, 217, 255, 0.24)',
        aurora2: 'rgba(255, 0, 200, 0.15)'
      };
    } else {
      return {
        type: 'default-cosmic',
        ambientGlow: 'rgba(124,58,237,0.15)',
        gridColor: 'rgba(124,58,237,0.02)',
        bgGradient: 'linear-gradient(to bottom, #050212, #0d0630, #170d4f)',
        particleColor: 'text-purple-500/20',
        title: 'CLEARPATH FINANCIAL MAP CORE',
        tag: 'EMULATOR ACTIVE • DATA STABLE',
        logo: '⚛️',
        primaryColor: '#7C3AED',
        secondaryColor: '#C084FC',
        aurora1: 'rgba(124, 58, 237, 0.18)',
        aurora2: 'rgba(192, 132, 252, 0.15)'
      };
    }
  };

  const renderCenterpiece = () => {
    const isMarkets = activeFile === 'markets.html' || activeFile.startsWith('encyclopedia/stocks/') || activeFile.startsWith('encyclopedia/markets/') || activeFile === 'market-psychology.html';
    const isEconomy = activeFile === 'economy.html' || activeFile.includes('inflation') || activeFile.includes('recession') || activeFile.includes('interest-rates') || activeFile.includes('banking');
    const isSectors = activeFile === 'sectors.html' || activeFile.includes('ai-sector') || activeFile.includes('semiconductor');
    const isKids = activeFile === 'kids-mode.html';
    const isPortfolio = activeFile === 'portfolio.html' || activeFile === 'watchlists.html';
    
    // 1. HOME SCREEN CENTERPIECE (Cyberpunk Bull-Bear Constellation, Wall Street Columns & rotating Globe)
    if (activeFile === 'index.html') {
      return (
        <div key="home-centerpiece" className="w-full h-full flex flex-col items-center justify-center relative animate-fadeIn select-none overflow-hidden bg-black/45 rounded-2xl p-4">
          {/* Holographic Watermark Indicator */}
          <div className="absolute top-4 left-4 font-mono text-[10.5px] tracking-widest text-[#FF00C8] bg-[#FF00C8]/10 border border-[#FF00C8]/20 px-3 py-1.5 rounded-full uppercase flex items-center gap-1.5">
            <span className="w-2 h-2 bg-[#FF00C8] rounded-full animate-ping" />
            CONSTELLATION RADAR ACTIVE
          </div>

          {/* Holographic Charging Bull Constellation (Cyan wireframe on left index space) */}
          <div className="absolute left-[8%] top-[25%] opacity-25 pointer-events-none select-none z-0 transform -rotate-12 scale-110">
            <svg width="150" height="150" viewBox="0 0 100 100" className="text-cyan-400">
              <polygon points="40,50 30,35 45,30 55,42" fill="none" stroke="#00D9FF" strokeWidth="1" strokeDasharray="2,2" />
              <path d="M 30,35 Q 20,20 15,25 Q 25,32 30,35" fill="none" stroke="#00D9FF" strokeWidth="1.5" />
              <path d="M 45,30 Q 42,12 36,15 Q 40,24 45,30" fill="none" stroke="#00D9FF" strokeWidth="1.5" />
              <polygon points="45,30 75,25 90,45 70,65 50,55" fill="none" stroke="#00D9FF" strokeWidth="1.2" />
              <line x1="50" y1="55" x2="40" y2="75" stroke="#00D9FF" strokeWidth="1.2" />
              <line x1="70" y1="65" x2="68" y2="82" stroke="#00D9FF" strokeWidth="1.2" />
              <line x1="90" y1="45" x2="95" y2="70" stroke="#00D9FF" strokeWidth="1" />
              <circle cx="30" cy="35" r="2" fill="#00D9FF" className="animate-pulse" />
              <text x="12" y="92" fill="#00D9FF" className="text-[7.5px] font-mono font-black" letterSpacing="0.1em">TAURUS ENGINE</text>
            </svg>
          </div>

          {/* Holographic Roaring Bear Constellation (Pink wireframe on right index space) */}
          <div className="absolute right-[8%] top-[25%] opacity-25 pointer-events-none select-none z-0 transform rotate-12 scale-110">
            <svg width="150" height="150" viewBox="0 0 100 100" className="text-pink-500">
              <polygon points="65,40 75,32 82,42 70,50" fill="none" stroke="#FF00C8" strokeWidth="1" strokeDasharray="2,2" />
              <polygon points="75,32 85,34 82,42" fill="none" stroke="#FF00C8" strokeWidth="1.2" />
              <polygon points="65,40 40,30 15,48 25,68 55,62" fill="none" stroke="#FF00C8" strokeWidth="1.2" />
              <line x1="25" y1="68" x2="20" y2="85" stroke="#FF00C8" strokeWidth="1.2" />
              <line x1="55" y1="62" x2="58" y2="84" stroke="#FF00C8" strokeWidth="1.2" />
              <line x1="15" y1="48" x2="8" y2="72" stroke="#FF00C8" strokeWidth="1" />
              <circle cx="82" cy="42" r="2" fill="#FF00C8" className="animate-pulse" />
              <text x="18" y="92" fill="#FF00C8" className="text-[7.5px] font-mono font-black" letterSpacing="0.1em">URSUS SENSOR</text>
            </svg>
          </div>

          {/* Wall Street Front Stairs & Grand Neoclassical Columns outline at base */}
          <div className="absolute bottom-1 w-full h-[155px] pointer-events-none select-none z-10 opacity-70">
            <svg viewBox="0 0 400 200" className="w-full h-full">
              <defs>
                <linearGradient id="wallStreetGlow" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#00D9FF" stopOpacity="0.85" />
                  <stop offset="50%" stopColor="#818CF8" stopOpacity="0.5" />
                  <stop offset="100%" stopColor="#FF00C8" stopOpacity="0.85" />
                </linearGradient>
              </defs>
              <polygon points="40,55 360,55 200,15" fill="none" stroke="url(#wallStreetGlow)" strokeWidth="1.5" strokeLinejoin="round" />
              <line x1="50" y1="55" x2="350" y2="55" stroke="url(#wallStreetGlow)" strokeWidth="3" />
              <rect x="50" y="60" width="300" height="10" fill="none" stroke="url(#wallStreetGlow)" strokeWidth="1.2" />
              {[80, 128, 176, 224, 272, 320].map((cx, i) => (
                <g key={i}>
                  <line x1={cx} y1="70" x2={cx} y2="135" stroke="url(#wallStreetGlow)" strokeWidth="2.5" />
                  <rect x={cx-6} y="70" width="12" height="3.5" fill="none" stroke="url(#wallStreetGlow)" strokeWidth="1.2" />
                  <rect x={cx-6} y="131" width="12" height="3.5" fill="none" stroke="url(#wallStreetGlow)" strokeWidth="1.2" />
                </g>
              ))}
              <line x1="30" y1="135" x2="370" y2="135" stroke="url(#wallStreetGlow)" strokeWidth="3" />
              <polygon points="20,138 380,138 380,143 20,143" fill="none" stroke="url(#wallStreetGlow)" strokeWidth="1" />
              <polygon points="10,143 390,143 390,149 10,149" fill="none" stroke="url(#wallStreetGlow)" strokeWidth="1.2" />
              <polygon points="0,149 400,149 400,156 0,156" fill="none" stroke="url(#wallStreetGlow)" strokeWidth="1.5" />
              <polygon points="-10,156 410,156 410,165 -10,165" fill="none" stroke="url(#wallStreetGlow)" strokeWidth="2" />
              <circle cx="100" cy="156" r="2.5" fill="#00D9FF" className="animate-ping" />
              <circle cx="200" cy="165" r="3" fill="#FF00C8" className="animate-ping" />
              <circle cx="300" cy="149" r="2" fill="#34D399" className="animate-ping" />
            </svg>
          </div>

          {/* Central Rotating Globe */}
          <div className="relative w-[280px] h-[280px] md:w-[380px] md:h-[380px] flex items-center justify-center transition-all duration-[2000ms] hover:scale-105 z-10 bg-[radial-gradient(circle_at_center,rgba(0,217,255,0.06)_0%,transparent_70%)] rounded-full">
            <svg viewBox="0 0 200 200" className="w-full h-full animate-spin" style={{ animationDuration: '240s' }}>
              <defs>
                <radialGradient id="globeGlow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#00D9FF" stopOpacity="0.25" />
                  <stop offset="70%" stopColor="#7A3BFF" stopOpacity="0.05" />
                  <stop offset="100%" stopColor="#000000" stopOpacity="0" />
                </radialGradient>
              </defs>
              <circle cx="100" cy="100" r="80" fill="url(#globeGlow)" />
              <circle cx="100" cy="100" r="78" fill="none" stroke="#00D9FF" strokeWidth="0.3" strokeDasharray="3,6" opacity="0.5" />
              <ellipse cx="100" cy="100" rx="78" ry="22" fill="none" stroke="#00D9FF" strokeWidth="0.2" opacity="0.3" />
              <ellipse cx="100" cy="100" rx="78" ry="46" fill="none" stroke="#7A3BFF" strokeWidth="0.25" opacity="0.35" strokeDasharray="4,2" />
              <ellipse cx="100" cy="100" rx="78" ry="10" fill="none" stroke="#2563EB" strokeWidth="0.25" opacity="0.35" />
              <ellipse cx="100" cy="100" rx="22" ry="78" fill="none" stroke="#00D9FF" strokeWidth="0.2" opacity="0.3" />
              <ellipse cx="100" cy="100" rx="46" ry="78" fill="none" stroke="#7A3BFF" strokeWidth="0.25" opacity="0.35" />
              <path d="M 60,65 Q 85,40 105,50" fill="none" stroke="#00D9FF" strokeWidth="0.5" strokeDasharray="1.5,4" className="animate-pulse" opacity="0.8" />
              <path d="M 105,50 Q 125,70 145,75" fill="none" stroke="#FF00C8" strokeWidth="0.5" strokeDasharray="1,2" opacity="0.75" />
              <path d="M 145,75 Q 155,70 160,65" fill="none" stroke="#F59E0B" strokeWidth="0.4" strokeDasharray="2,5" opacity="0.85" />
              <path d="M 160,65 Q 140,90 120,110" fill="none" stroke="#059669" strokeWidth="0.5" strokeDasharray="1.5,3" opacity="0.8" />
              <path d="M 120,110 Q 90,95 60,65" fill="none" stroke="#3B82F6" strokeWidth="0.5" strokeDasharray="2,2" opacity="0.8" />
            </svg>
          </div>

          {/* Floating Data Point Tags around the Globe (Fulfill required data indices) */}
          <div className="absolute top-[18%] left-[24%] bg-black/85 border border-[#00D9FF]/40 px-3 py-1.5 rounded-xl flex items-center gap-2 shadow-[0_5px_15px_rgba(0,0,0,0.7)] z-20 animate-bounce select-none pointer-events-auto" style={{ animationDuration: '4s' }}>
            <span className="w-1.5 h-1.5 bg-[#00D9FF] rounded-full" />
            <span className="font-mono text-[9.5px] text-[#00D9FF] font-black uppercase">S&P 500</span>
            <span className="font-mono text-[9.5px] text-emerald-400 font-extrabold">+{simPrices.sp500.change}%</span>
          </div>

          <div className="absolute top-[58%] left-[16%] bg-black/85 border border-amber-500/40 px-3 py-1.5 rounded-xl flex items-center gap-2 shadow-[0_5px_15px_rgba(0,0,0,0.7)] z-20 animate-bounce select-none pointer-events-auto" style={{ animationDuration: '4.5s' }}>
            <span className="w-1.5 h-1.5 bg-yellow-500 rounded-full" />
            <span className="font-mono text-[9.5px] text-amber-300 font-black uppercase">GOLD</span>
            <span className="font-mono text-[9.5px] text-amber-400 font-extrabold">${simPrices.gold.val.toLocaleString()}</span>
          </div>

          <div className="absolute top-[15%] right-[20%] bg-black/85 border border-purple-500/40 px-3 py-1.5 rounded-xl flex items-center gap-2 shadow-[0_5px_15px_rgba(0,0,0,0.7)] z-20 animate-bounce select-none pointer-events-auto" style={{ animationDuration: '5.2s' }}>
            <span className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-ping" style={{ animationDuration: '2s' }} />
            <span className="font-mono text-[9.5px] text-purple-300 font-black uppercase">₿ BITCOIN</span>
            <span className="font-mono text-[9.5px] text-emerald-400 font-extrabold">+{simPrices.bitcoin.change}%</span>
          </div>

          <div className="absolute top-[62%] right-[16%] bg-black/85 border border-red-500/40 px-3 py-1.5 rounded-xl flex items-center gap-2 shadow-[0_5px_15px_rgba(0,0,0,0.7)] z-20 animate-bounce select-none pointer-events-auto" style={{ animationDuration: '5.8s' }}>
            <span className="w-1.5 h-1.5 bg-red-500 rounded-full" />
            <span className="font-mono text-[9.5px] text-red-300 font-black uppercase">INFLATION</span>
            <span className="font-mono text-[9.5px] text-red-400 font-extrabold">{(policyDial / 25).toFixed(1)}%</span>
          </div>

          <div className="absolute top-[40%] left-[8%] bg-black/85 border border-indigo-500/40 px-3 py-1.5 rounded-xl flex items-center gap-2 shadow-[0_5px_15px_rgba(0,0,0,0.7)] z-20 animate-bounce select-none pointer-events-auto" style={{ animationDuration: '6.4s' }}>
            <span className="w-1.5 h-1.5 bg-indigo-500 opacity-85" />
            <span className="font-mono text-[9.5px] text-indigo-300 font-black uppercase">DOW JONES</span>
            <span className="font-mono text-[9.5px] text-rose-450 font-extrabold">{simPrices.dow.change}%</span>
          </div>
        </div>
      );
    }

    // 1b. GLOB-ATLAS VIEWPORT GRAPH (Standard Rotating Sovereign Grid)
    if (activeFile === 'global-atlas.html' || activeFile.startsWith('encyclopedia/global/')) {
      return (
        <div key="globe-centerpiece" className="w-full h-full flex flex-col items-center justify-center relative animate-fadeIn select-none shadow-inner p-4">
          <div className="absolute top-6 left-6 font-mono text-[10px] tracking-widest text-[#00D9FF] bg-[#00D9FF]/10 border border-[#00D9FF]/20 px-3 py-1 rounded-full uppercase">
            Holographic Planetary Grid
          </div>
          
          <div className="relative w-[340px] h-[340px] md:w-[500px] md:h-[500px] flex items-center justify-center transition-transform hover:scale-105 duration-[2000ms]">
            {/* Spinning background nebula glow */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,217,255,0.08)_0%,transparent_70%)] animate-pulse" />
            <div className="absolute inset-4 rounded-full border border-[#00D9FF]/5 animate-ping opacity-45" style={{ animationDuration: '4s' }} />
            
            {/* SVG Globe */}
            <svg viewBox="0 0 200 200" className="w-full h-full animate-spin" style={{ animationDuration: '160s' }}>
              <defs>
                <radialGradient id="globeGlow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#00D9FF" stopOpacity="0.22" />
                  <stop offset="75%" stopColor="#7A3BFF" stopOpacity="0.04" />
                  <stop offset="100%" stopColor="#000000" stopOpacity="0" />
                </radialGradient>
              </defs>
              
              <circle cx="100" cy="100" r="85" fill="url(#globeGlow)" />
              <circle cx="100" cy="100" r="82" fill="none" stroke="#00D9FF" strokeWidth="0.25" strokeDasharray="3,6" opacity="0.4" />
              <ellipse cx="100" cy="100" rx="82" ry="24" fill="none" stroke="#00D9FF" strokeWidth="0.15" opacity="0.25" />
              <ellipse cx="100" cy="100" rx="82" ry="50" fill="none" stroke="#7A3BFF" strokeWidth="0.2" opacity="0.3" strokeDasharray="4,2" />
              <ellipse cx="100" cy="100" rx="82" ry="12" fill="none" stroke="#2563EB" strokeWidth="0.2" opacity="0.3" />
              <ellipse cx="100" cy="100" rx="24" ry="82" fill="none" stroke="#00D9FF" strokeWidth="0.15" opacity="0.25" />
              <ellipse cx="100" cy="100" rx="50" ry="82" fill="none" stroke="#7A3BFF" strokeWidth="0.2" opacity="0.3" />
              
              {/* Curved Animated Trade Routes */}
              <path d="M 60,65 Q 85,40 105,50" fill="none" stroke="#00D9FF" strokeWidth="0.4" strokeDasharray="1.5,4" className="animate-pulse" opacity="0.7" />
              <path d="M 105,50 Q 125,70 145,75" fill="none" stroke="#FF00C8" strokeWidth="0.4" strokeDasharray="1,2" opacity="0.6" />
              <path d="M 145,75 Q 155,70 160,65" fill="none" stroke="#F59E0B" strokeWidth="0.3" strokeDasharray="2,5" opacity="0.8" />
              <path d="M 160,65 Q 140,90 120,110" fill="none" stroke="#059669" strokeWidth="0.4" strokeDasharray="1.5,3" opacity="0.75" />
              <path d="M 120,110 Q 90,95 60,65" fill="none" stroke="#3B82F6" strokeWidth="0.4" strokeDasharray="2,2" opacity="0.7" />
            </svg>
            
            {/* Absolutely positioned glowing clickable node tags floating over the globe! */}
            {/* Node 1: US */}
            <div 
              onClick={() => selectFileNode('encyclopedia/global/us-macro.html')}
              className={`absolute cursor-pointer p-2.5 rounded-xl border flex flex-col items-center gap-1 transition-all duration-300 shadow-[0_10px_25px_rgba(0,0,0,0.8)] backdrop-blur-md group hover:scale-110 select-none ${
                activeFile === 'encyclopedia/global/us-macro.html'
                  ? 'bg-cyan-500/15 border-cyan-400 text-cyan-300'
                  : 'bg-black/60 border-white/5 text-zinc-400 hover:border-cyan-500/40 hover:text-cyan-300'
              }`}
              style={{ top: '35%', left: '15%' }}
            >
              <span className="text-[10px] uppercase font-bold tracking-wider font-sans">UNITED STATES</span>
              <span className="text-[8px] font-mono text-zinc-500 group-hover:text-cyan-400">Anchor Reserve • USD</span>
              <div className="w-2 h-2 bg-cyan-400 rounded-full animate-ping mt-1" />
            </div>

            {/* Node 2: Eurozone */}
            <div 
              onClick={() => selectFileNode('encyclopedia/global/eurozone.html')}
              className={`absolute cursor-pointer p-2.5 rounded-xl border flex flex-col items-center gap-1 transition-all duration-300 shadow-[0_10px_25px_rgba(0,0,0,0.8)] backdrop-blur-md group hover:scale-110 select-none ${
                activeFile === 'encyclopedia/global/eurozone.html'
                  ? 'bg-pink-500/15 border-pink-400 text-pink-300'
                  : 'bg-black/60 border-white/5 text-zinc-400 hover:border-pink-500/40 hover:text-pink-300'
              }`}
              style={{ top: '22%', right: '35%' }}
            >
              <span className="text-[10px] uppercase font-bold tracking-wider font-sans">EURO CORRIDOR</span>
              <span className="text-[8px] font-mono text-zinc-500 group-hover:text-pink-300">Precision Industrial</span>
              <div className="w-2 h-2 bg-pink-500 rounded-full animate-ping mt-1" />
            </div>

            {/* Node 3: China */}
            <div 
              onClick={() => selectFileNode('encyclopedia/global/china-manufacturing.html')}
              className={`absolute cursor-pointer p-2.5 rounded-xl border flex flex-col items-center gap-1 transition-all duration-300 shadow-[0_10px_25px_rgba(0,0,0,0.8)] backdrop-blur-md group hover:scale-110 select-none ${
                activeFile === 'encyclopedia/global/china-manufacturing.html'
                  ? 'bg-purple-500/15 border-purple-400 text-purple-300'
                  : 'bg-black/60 border-white/5 text-zinc-400 hover:border-purple-500/40 hover:text-purple-300'
              }`}
              style={{ bottom: '26%', right: '15%' }}
            >
              <span className="text-[10px] uppercase font-bold tracking-wider font-sans">SOVEREIGN WORKBENCH</span>
              <span className="text-[8px] font-mono text-zinc-500 group-hover:text-purple-400">Manufacturing Gigalith</span>
              <div className="w-2 h-2 bg-purple-400 rounded-full animate-ping mt-1" />
            </div>

            {/* Node 4: Japan */}
            <div 
              onClick={() => selectFileNode('encyclopedia/global/japan-carry.html')}
              className={`absolute cursor-pointer p-2.5 rounded-xl border flex flex-col items-center gap-1 transition-all duration-300 shadow-[0_10px_25px_rgba(0,0,0,0.8)] backdrop-blur-md group hover:scale-110 select-none ${
                activeFile === 'encyclopedia/global/japan-carry.html'
                  ? 'bg-amber-500/15 border-amber-400 text-amber-300'
                  : 'bg-black/60 border-white/5 text-zinc-400 hover:border-amber-500/40 hover:text-amber-300'
              }`}
              style={{ top: '38%', right: '12%' }}
            >
              <span className="text-[10px] uppercase font-bold tracking-wider font-sans">YEN CARRY ENGINE</span>
              <span className="text-[8px] font-mono text-zinc-500 group-hover:text-amber-400">Global Liquidity Source</span>
              <div className="w-2 h-2 bg-amber-400 rounded-full animate-ping mt-1" />
            </div>

            {/* Node 5: BRICS */}
            <div 
              onClick={() => selectFileNode('encyclopedia/global/brics-emerging.html')}
              className={`absolute cursor-pointer p-2.5 rounded-xl border flex flex-col items-center gap-1 transition-all duration-300 shadow-[0_10px_25px_rgba(0,0,0,0.8)] backdrop-blur-md group hover:scale-110 select-none ${
                activeFile === 'encyclopedia/global/brics-emerging.html'
                  ? 'bg-emerald-500/15 border-emerald-400 text-emerald-300'
                  : 'bg-black/60 border-white/5 text-zinc-400 hover:border-emerald-500/40 hover:text-emerald-300'
              }`}
              style={{ bottom: '15%', left: '33%' }}
            >
              <span className="text-[10px] uppercase font-bold tracking-wider font-sans">BRICS SWAPS</span>
              <span className="text-[8px] font-mono text-zinc-500 group-hover:text-emerald-400">Resource Sovereignty</span>
              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-ping mt-1" />
            </div>
          </div>
          
          <div className="absolute bottom-6 font-mono text-[9.5px] text-zinc-500 text-center leading-relaxed">
            Click on any sovereign node to warp the educational data tablet
          </div>
        </div>
      );
    }
    
    // 2. CELESTIAL BULL VS BEAR ARENA
    if (isMarkets) {
      return (
        <div key="markets-centerpiece" className="w-full h-full flex flex-col items-center justify-center relative animate-fadeIn select-none overflow-hidden">
          <div className="absolute top-6 left-6 font-mono text-[10px] tracking-widest text-[#FF00C8] bg-[#FF00C8]/10 border border-[#FF00C8]/20 px-3 py-1 rounded-full uppercase flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-[#FF00C8] rounded-full animate-ping" />
            Celestial Arena of Market Forces
          </div>
          
          {/* Interactive Modifiers Floating Control in Space */}
          <div className="absolute top-6 right-6 flex items-center gap-3 z-20">
            <button 
              onClick={() => { setGreedSurge(!greedSurge); if(fearRipple) setFearRipple(false); }}
              className={`py-1.5 px-3 rounded-lg text-[9px] uppercase font-black font-sans border tracking-wider transition-all cursor-pointer ${
                greedSurge
                  ? 'bg-amber-500/20 border-amber-400 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.2)]'
                  : 'bg-black/40 border-white/5 text-zinc-500 hover:text-zinc-300 hover:border-white/20'
              }`}
            >
              🚀 Inject Greed Surge
            </button>
            <button 
              onClick={() => { setFearRipple(!fearRipple); if(greedSurge) setGreedSurge(false); }}
              className={`py-1.5 px-3 rounded-lg text-[9px] uppercase font-black font-sans border tracking-wider transition-all cursor-pointer ${
                fearRipple
                  ? 'bg-red-500/20 border-red-500 text-red-400 shadow-[0_0_15px_rgba(239,68,68,0.2)]'
                  : 'bg-black/40 border-white/5 text-zinc-500 hover:text-zinc-300 hover:border-white/20'
              }`}
            >
              ⛈️ Trigger Fear Ripple
            </button>
          </div>
          
          <div className={`relative w-[340px] h-[340px] md:w-[480px] md:h-[480px] flex items-center justify-center transition-all duration-700 ${fearRipple ? 'scale-95' : greedSurge ? 'scale-105' : 'scale-100'}`}>
            {/* Dynamic atmosphere nebulae */}
            <div className={`absolute inset-0 rounded-full transition-all duration-[2000ms] ${
              greedSurge 
                ? 'bg-[radial-gradient(circle_at_center,rgba(245,158,11,0.08)_0%,transparent_70%)]'
                : fearRipple
                  ? 'bg-[radial-gradient(circle_at_center,rgba(239,68,68,0.08)_0%,transparent_70%)]'
                  : 'bg-[radial-gradient(circle_at_center,rgba(0,217,255,0.05)_0%,transparent_65%)]'
            }`} />
            
            {/* Interactive Coordinate Axis */}
            <svg viewBox="0 0 200 200" className={`w-full h-full`} style={{ animationDuration: fearRipple ? '220s' : greedSurge ? '40s' : '110s' }}>
              <defs>
                <radialGradient id="marketCoreGlow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor={fearRipple ? '#ef4444' : greedSurge ? '#f59e0b' : '#00D9FF'} stopOpacity="0.25" />
                  <stop offset="80%" stopColor="#7a3bed" stopOpacity="0" />
                </radialGradient>
              </defs>
              
              {/* Target Price Star Core */}
              <circle cx="100" cy="100" r="10" fill="url(#marketCoreGlow)" className="animate-pulse" />
              
              {/* Concentric Coordinate orbits */}
              <circle cx="100" cy="100" r="85" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="0.3" />
              <circle cx="100" cy="100" r="60" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="0.4" strokeDasharray="2,3" />
              <circle cx="100" cy="100" r="35" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="0.3" strokeDasharray="5,5" />
              
              {/* Taurus Bull Constellation Lines (Gold/Green) */}
              <g id="bull-stars" className="transition-opacity duration-500" opacity={fearRipple ? 0.2 : 0.85}>
                <line x1="30" y1="50" x2="60" y2="40" stroke="#FBBF24" strokeWidth="0.45" />
                <line x1="60" y1="40" x2="80" y2="65" stroke="#FBBF24" strokeWidth="0.4" />
                <line x1="80" y1="65" x2="55" y2="85" stroke="#10B981" strokeWidth="0.4" />
                <line x1="55" y1="85" x2="30" y2="50" stroke="#10B981" strokeWidth="0.35" />
                
                <circle cx="30" cy="50" r="1.5" fill="#FBBF24" />
                <circle cx="60" cy="40" r="2.5" fill="#34D399" className="animate-pulse" />
                <circle cx="80" cy="65" r="1.5" fill="#FBBF24" />
                <circle cx="55" cy="85" r="2" fill="#10B981" />
              </g>
              
              {/* Ursus Bear Constellation Lines (Magenta) */}
              <g id="bear-stars" className="transition-opacity duration-500" opacity={greedSurge ? 0.2 : 0.85}>
                <line x1="170" y1="150" x2="140" y2="160" stroke="#EC4899" strokeWidth="0.45" />
                <line x1="140" y1="160" x2="120" y2="135" stroke="#EC4899" strokeWidth="0.4" />
                <line x1="120" y1="135" x2="145" y2="115" stroke="#EF4444" strokeWidth="0.4" />
                <line x1="145" y1="115" x2="170" y2="150" stroke="#EF4444" strokeWidth="0.35" />
                
                <circle cx="170" cy="150" r="1.5" fill="#EC4899" />
                <circle cx="140" cy="160" r="2.5" fill="#F43F5E" className="animate-pulse" />
                <circle cx="120" cy="135" r="1.5" fill="#EC4899" />
                <circle cx="145" cy="115" r="2" fill="#EF4444" />
              </g>
              
              {/* Orbiting Stardust stock ticker moons */}
              <g transform="translate(100,100)">
                <g className="animate-spin" style={{ animationDuration: '14s' }}>
                  <text x="60" y="0" fill="#00D9FF" fontSize="3" fontFamily="sans-serif" fontWeight="900" opacity="0.8">AAPL</text>
                  <circle cx="55" cy="0" r="1" fill="#00D9FF" />
                </g>
                <g className="animate-spin" style={{ animationDuration: '22s', animationDirection: 'reverse' }}>
                  <text x="45" y="0" fill="#A855F7" fontSize="3" fontFamily="sans-serif" fontWeight="900" opacity="0.8">MSFT</text>
                  <circle cx="40" cy="0" r="0.8" fill="#A855F7" />
                </g>
                <g className="animate-spin" style={{ animationDuration: '18s' }}>
                  <text x="-65" y="0" fill="#F59E0B" fontSize="2.8" fontFamily="sans-serif" fontWeight="900" opacity="0.8">NVDA</text>
                  <circle cx="-58" cy="0" r="1.2" fill="#F59E0B" className="animate-pulse" />
                </g>
              </g>
            </svg>
            
            {/* Realtime Constellation labels inside the visual dome */}
            <div className="absolute flex flex-col items-center font-mono select-none pointer-events-none text-center">
              <span className={`text-[13px] font-black tracking-widest ${fearRipple ? 'text-rose-400' : greedSurge ? 'text-amber-400' : 'text-cyan-300'}`}>
                {fearRipple ? 'URSUS DOMINANCE' : greedSurge ? 'TAURUS SURGE' : 'COGNITIVE EQUILIBRIUM'}
              </span>
              <span className="text-[8.5px] text-zinc-500 mt-1 uppercase tracking-widest">
                Target Index Yield: {(100 + (greedSurge ? 35 : fearRipple ? -42 : 0) + Math.sin(Date.now() / 1000) * 2).toFixed(2)} pts
              </span>
            </div>
          </div>
          
          <div className="absolute bottom-6 font-mono text-[9.5px] text-zinc-500 text-center max-w-[420px] leading-relaxed">
            {fearRipple 
              ? 'Deep magenta Ursus stars dominate. Risk premiums expand, contracting interbank options collateral.'
              : greedSurge
                ? 'High-beta Taurus stars flare. Speculative leverage flows directly, compressing volatility curves.'
                : 'Balanced constellation orbits. Bid/ask spreads rest structurally relative to standard core limits.'
            }
          </div>
        </div>
      );
    }
    
    // 3. RIVERS OF LIQUID GOLD (Federal reserve, economy, inflation, interest-rates)
    if (isEconomy) {
      return (
        <div key="economy-centerpiece" className="w-full h-full flex flex-col items-center justify-center relative animate-fadeIn select-none overflow-hidden">
          <div className="absolute top-6 left-6 font-mono text-[10px] tracking-widest text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 px-3 py-1 rounded-full uppercase flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping" />
            Liquid Rivers of Macroeconomic Fuel
          </div>
          
          <div className="relative w-full max-w-[500px] h-[340px] md:h-[480px] flex flex-col items-center justify-center">
            {/* The Ancient Federal Reserve Pillar Sanctuary */}
            <div className="bg-neutral-900/80 backdrop-blur-md border border-zinc-700/30 p-6 rounded-2xl flex flex-col items-center gap-2 text-center shadow-2xl relative z-10 w-[240px] transform hover:translate-y-[-4px] transition-transform duration-500">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-indigo-600 border border-indigo-400 text-white font-sans text-[8px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                Systemic Core
              </div>
              <span className="text-3xl animate-bounce">🏛️</span>
              <span className="font-sans font-black text-white text-[11px] uppercase tracking-wider">FEDERAL BENCHMARK RATE</span>
              <span className="text-[20px] font-mono font-black text-amber-400 underline decoration-indigo-500/50">
                {policyDial.toFixed(2)}%
              </span>
              <span className="text-[8px] font-mono text-zinc-500 uppercase leading-none">
                Stance: {policyDial < 30 ? 'Eased Expansion' : policyDial < 70 ? 'Neutral Orbit' : 'Hawk Restrictive'}
              </span>
            </div>
            
            {/* Sinuous Neon Golden Rivers flowing beneath! */}
            <div className="absolute inset-0 z-0 flex items-center justify-center">
              <svg viewBox="0 0 400 300" className="w-full h-full opacity-60">
                {/* Horizontal Wave Rivers of Light */}
                <path 
                  d="M 0,150 Q 100,260 200,150 T 400,150" 
                  fill="none" 
                  stroke={policyDial < 35 ? '#FF00C8' : policyDial < 70 ? '#7A3BFF' : '#00D9FF'} 
                  strokeWidth={policyDial < 35 ? '3' : policyDial < 70 ? '1.5' : '0.8'} 
                  strokeDasharray={policyDial < 35 ? '8,4' : '4,8'} 
                  className="animate-pulse"
                  style={{ transition: 'stroke 1s, stroke-width 1s' }}
                />
                
                <path 
                  d="M 0,200 Q 120,80 240,200 T 400,200" 
                  fill="none" 
                  stroke={policyDial < 35 ? '#FBBF24' : policyDial < 70 ? '#4F46E5' : '#3B82F6'} 
                  strokeWidth={policyDial < 35 ? '2.5' : policyDial < 70 ? '1.2' : '0.6'} 
                  strokeDasharray="1,5"
                  style={{ transition: 'stroke 1s, stroke-width 1s' }}
                />
              </svg>
            </div>
            
            {/* Dynamic visual indicator labels for Liquid Flow rates */}
            <div className="absolute top-[15%] left-[10%] border border-zinc-800 bg-black/75 p-2 rounded-xl text-[8.5px] font-mono text-zinc-400">
              <div className="text-[#00D9FF] font-black">DXY INDEX: {(80 + policyDial * 3.5).toFixed(1)}</div>
              <div>scarcity tier: {policyDial > 65 ? 'HIGH SURGE' : 'STABILIZED'}</div>
            </div>
            
            <div className="absolute bottom-[12%] right-[10%] border border-zinc-800 bg-black/75 p-2 rounded-xl text-[8.5px] font-mono text-zinc-400">
              <div className="text-pink-400 font-black">M2 VELOCITY: {(0.8 + (10 - policyDial) * 0.15).toFixed(2)}x</div>
              <div>reserve liquidity flows</div>
            </div>
          </div>
          
          <div className="absolute bottom-6 font-mono text-[9.5px] text-zinc-500 text-center max-w-[420px] leading-relaxed">
            Move the interest dial on the right side card on the fly. The neon Golden Rivers immediately restrict width on high rates, representing carry drain.
          </div>
        </div>
      );
    }
    
    // 4. SILICON SKYLINE CITY (Sectors, AI)
    if (isSectors) {
      return (
        <div key="sectors-centerpiece" className="w-full h-full flex flex-col items-center justify-center relative animate-fadeIn select-none overflow-hidden">
          <div className="absolute top-6 left-6 font-mono text-[10px] tracking-widest text-[#00FFFF] bg-[#00FFFF]/10 border border-[#00FFFF]/20 px-3 py-1 rounded-full uppercase flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-[#00FFFF] rounded-full animate-ping" />
            Silicon Neotropolis Towers
          </div>
          
          <div className="relative w-full max-w-[450px] h-[340px] md:h-[450px] flex items-end justify-center gap-4 border-b border-[#00FFFF]/10 pb-2">
            {/* Tower 1: AI Hardware Compute */}
            <div 
              onClick={() => selectFileNode('encyclopedia/stocks/nvidia.html')}
              className="w-16 md:w-20 bg-gradient-to-t from-emerald-950/40 to-emerald-800/80 border border-emerald-500/30 rounded-t-2xl flex flex-col items-center justify-end p-3 hover:scale-105 transition-all duration-305 cursor-pointer text-center group h-[180px] md:h-[220px]"
            >
              <Cpu className="w-4 h-4 text-emerald-400 group-hover:scale-110 mb-2" />
              <span className="text-[9px] font-sans font-bold text-white uppercase truncate text-ellipsis">AI FAB</span>
              <span className="text-[7.5px] font-mono text-zinc-550 mt-1">NVDA • Active</span>
              <div className="w-1 h-8 bg-emerald-400/20 rounded mt-2 overflow-hidden relative">
                <div className="absolute top-0 left-0 bg-emerald-400 w-full h-[85%] animate-pulse" />
              </div>
            </div>

            {/* Tower 2: Software Framework Core */}
            <div 
              onClick={() => selectFileNode('encyclopedia/stocks/microsoft.html')}
              className="w-16 md:w-20 bg-gradient-to-t from-blue-950/40 to-blue-800/80 border border-blue-500/30 rounded-t-2xl flex flex-col items-center justify-end p-3 hover:scale-105 transition-all duration-305 cursor-pointer text-center group h-[220px] md:h-[290px]"
            >
              <Cpu className="w-4 h-4 text-blue-400 group-hover:scale-110 mb-2" />
              <span className="text-[9px] font-sans font-bold text-white uppercase truncate text-ellipsis">COGNITIVE</span>
              <span className="text-[7.5px] font-mono text-zinc-550 mt-1">MSFT • Stable</span>
              <div className="w-1 h-8 bg-blue-400/20 rounded mt-2 overflow-hidden relative">
                <div className="absolute top-0 left-0 bg-blue-400 w-full h-[95%] animate-pulse" />
              </div>
            </div>

            {/* Tower 3: Mobile Ecosystem Net */}
            <div 
              onClick={() => selectFileNode('encyclopedia/stocks/apple.html')}
              className="w-16 md:w-20 bg-gradient-to-t from-cyan-950/40 to-cyan-800/80 border border-cyan-500/30 rounded-t-2xl flex flex-col items-center justify-end p-3 hover:scale-105 transition-all duration-305 cursor-pointer text-center group h-[200px] md:h-[250px]"
            >
              <Cpu className="w-4 h-4 text-cyan-400 group-hover:scale-110 mb-2" />
              <span className="text-[9px] font-sans font-bold text-white uppercase truncate text-ellipsis">COMM DEVICE</span>
              <span className="text-[7.5px] font-mono text-zinc-550 mt-1">AAPL • High Cap</span>
              <div className="w-1 h-8 bg-cyan-400/20 rounded mt-2 overflow-hidden relative">
                <div className="absolute top-0 left-0 bg-cyan-400 w-full h-[70%] animate-pulse" />
              </div>
            </div>

            {/* Tower 4: Logistics Server Web */}
            <div 
              onClick={() => selectFileNode('encyclopedia/stocks/amazon.html')}
              className="w-16 md:w-20 bg-gradient-to-t from-amber-950/40 to-amber-800/80 border border-amber-500/30 rounded-t-2xl flex flex-col items-center justify-end p-3 hover:scale-105 transition-all duration-305 cursor-pointer text-center group h-[160px] md:h-[190px]"
            >
              <Cpu className="w-4 h-4 text-amber-400 group-hover:scale-110 mb-2" />
              <span className="text-[9px] font-sans font-bold text-white uppercase truncate text-ellipsis">LOGISTICS</span>
              <span className="text-[7.5px] font-mono text-zinc-550 mt-1">AMZN • Exp</span>
              <div className="w-1 h-8 bg-amber-400/20 rounded mt-2 overflow-hidden relative">
                <div className="absolute top-0 left-0 bg-amber-400 w-full h-[78%] animate-pulse" />
              </div>
            </div>
            
            {/* Sinuous fiber optical laser beams rising from the ground */}
            <div className="absolute top-[10%] left-1/2 -translate-x-1/2 flex gap-12 select-none pointer-events-none opacity-30">
              <div className="w-1.5 h-48 bg-gradient-to-t from-transparent via-[#00FFFF] to-transparent animate-pulse filter blur-sm" />
              <div className="w-1 h-56 bg-gradient-to-t from-transparent via-[#FF00C8] to-transparent animate-pulse filter blur-sm" style={{ animationDelay: '1s' }} />
            </div>
          </div>
          
          <div className="absolute bottom-6 font-mono text-[9.5px] text-zinc-500 text-center">
            Click on any Silicon Neotropolis column to profile the respective asset node.
          </div>
        </div>
      );
    }
    
    // 5. BUBBLEGUM PLAYGROUND (Kids mode)
    if (isKids) {
      return (
        <div key="kids-centerpiece" className="w-full h-full flex flex-col items-center justify-center relative animate-fadeIn select-none overflow-hidden">
          <div className="absolute top-6 left-6 font-mono text-[10px] tracking-widest text-[#FF00C8] bg-[#FF00C8]/10 border border-[#FF00C8]/20 px-3 py-1 rounded-full uppercase flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-[#FF00C8] rounded-full animate-pulse" />
            Bubblegum Inflation Playground
          </div>
          
          {/* Glowing Candy Counter */}
          <div className="absolute top-6 right-6 flex items-center gap-2 bg-gradient-to-r from-amber-400/25 to-pink-500/20 border border-pink-400/30 px-3 py-1.5 rounded-full select-none shadow-lg">
            <span className="text-base text-pink-400">🪙</span>
            <span className="font-mono text-[11px] font-black tracking-wide text-white">
              Coins Collected: {kidsCoins}
            </span>
          </div>
          
          {/* Gigantic bouncing candy sphere loops */}
          <div className="grid grid-cols-2 gap-8 relative max-w-[340px] items-center">
            {/* Balloon 1: Groceries */}
            <div 
              onClick={() => { setKidsCoins(prev => prev + 5); }}
              className="w-24 h-24 rounded-full bg-gradient-to-b from-pink-400 to-[#FF00AA] border border-pink-300 flex flex-col items-center justify-center text-center shadow-xl hover:scale-110 active:scale-95 transition-all duration-300 cursor-pointer relative group"
            >
              <span className="text-2xl mt-1">🍎</span>
              <span className="text-[10px] font-bold text-white uppercase mt-1 leading-none">Apple Gums</span>
              <span className="text-[8px] font-mono text-zinc-200 mt-1 select-none">+5 Coins</span>
              <div className="absolute -bottom-2 w-1.5 h-8 bg-zinc-400 opacity-40 mx-auto rounded-full" />
            </div>

            {/* Balloon 2: Houses */}
            <div 
              onClick={() => { setKidsCoins(prev => prev + 10); }}
              className="w-24 h-24 rounded-full bg-gradient-to-b from-purple-400 to-indigo-600 border border-purple-300 flex flex-col items-center justify-center text-center shadow-xl hover:scale-110 active:scale-95 transition-all duration-300 cursor-pointer relative group"
            >
              <span className="text-2xl mt-1">🏠</span>
              <span className="text-[10px] font-bold text-white uppercase mt-1 leading-none">Candy House</span>
              <span className="text-[8px] font-mono text-zinc-200 mt-1 select-none">+10 Coins</span>
              <div className="absolute -bottom-2 w-1.5 h-8 bg-zinc-400 opacity-40 mx-auto rounded-full" />
            </div>
          </div>
          
          <div className="absolute bottom-6 font-mono text-[9.5px] text-zinc-500 text-center max-w-[380px] leading-relaxed">
            Poke the huge bubblegum balloons to pop them and collect gold currency coins directly!
          </div>
        </div>
      );
    }
    
    // 6. PORTFOLIO ORBIT (Allocation model)
    if (isPortfolio) {
      return (
        <div key="portfolio-centerpiece" className="w-full h-full flex flex-col items-center justify-center relative animate-fadeIn select-none overflow-hidden">
          <div className="absolute top-6 left-6 font-mono text-[10px] tracking-widest text-[#00FFFF] bg-[#00FFFF]/10 border border-[#00FFFF]/20 px-3 py-1 rounded-full uppercase flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-[#00FFFF] rounded-full animate-ping" />
            Capital Distribution Gravity Center
          </div>
          
          <div className="relative w-[340px] h-[340px] md:w-[460px] md:h-[460px] flex items-center justify-center">
            {/* The base nuclear client nucleus representing base Cash capital */}
            <div className="w-24 h-24 bg-gradient-to-b from-yellow-300 to-amber-500 border border-amber-300 rounded-full flex flex-col items-center justify-center text-center shadow-2xl relative z-10 select-none">
              <span className="text-lg">💰</span>
              <span className="text-[10px] font-bold text-black uppercase mt-1 leading-none">Capital Base</span>
              <span className="text-[9px] font-mono text-black font-semibold mt-1">Nucleus</span>
            </div>
            
            {/* Rotating asset planets corresponding to actual asset sliders */}
            {/* Planet 1: Equities (Stellar gas giant) */}
            <div 
              className="absolute w-12 h-12 bg-gradient-to-b from-cyan-400 to-blue-600 border border-cyan-300 rounded-full flex flex-col items-center justify-center text-center shadow-lg select-none"
              style={{
                transform: `rotate(${Date.now() / 4000}deg) translate(110px) rotate(-${Date.now() / 4000}deg)`,
                transition: 'transform 0.1s linear'
              }}
            >
              <span className="text-xs">📈</span>
              <span className="text-[7.5px] font-black text-white uppercase mt-0.5 leading-none">EQUITIES</span>
            </div>

            {/* Planet 2: Bonds (Sovereign water giant) */}
            <div 
              className="absolute w-10 h-10 bg-gradient-to-b from-indigo-500 to-blue-800 border border-indigo-300 rounded-full flex flex-col items-center justify-center text-center shadow-lg select-none"
              style={{
                transform: `rotate(${Date.now() / 6200}deg) translate(160px) rotate(-${Date.now() / 6200}deg)`,
                transition: 'transform 0.1s linear'
              }}
            >
              <span className="text-xs">📜</span>
              <span className="text-[7px] font-black text-white uppercase mt-0.5 leading-none">BONDS</span>
            </div>

            {/* Planet 3: Gold (Blazing sun star) */}
            <div 
              className="absolute w-8 h-8 bg-gradient-to-b from-amber-400 to-yellow-600 border border-amber-300 rounded-full flex flex-col items-center justify-center text-center shadow-lg select-none"
              style={{
                transform: `rotate(${Date.now() / 3100}deg) translate(-130px) rotate(-${Date.now() / 3100}deg)`,
                transition: 'transform 0.1s linear'
              }}
            >
              <span className="text-[10px]">✨</span>
              <span className="text-[7px] font-black text-white uppercase mt-0.5 leading-none">METALS</span>
            </div>
          </div>
          
          <div className="absolute bottom-6 font-mono text-[9.5px] text-zinc-500 text-center">
            Portfolio Allocation Concentric Sphere Map spinning dynamically.
          </div>
        </div>
      );
    }
    
    // Default cosmic constellation fog
    return (
      <div key="default-centerpiece" className="w-full h-full flex flex-col items-center justify-center relative animate-fadeIn select-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(124,58,237,0.06)_0%,transparent_65%)] animate-pulse" />
        <svg viewBox="0 0 200 200" className="w-[300px] h-[300px] md:w-[400px] md:h-[400px] opacity-40 animate-spin" style={{ animationDuration: '240s' }}>
          <circle cx="100" cy="100" r="80" fill="none" stroke="#7A3BFF" strokeWidth="0.2" strokeDasharray="3,6" />
          <line x1="20" y1="100" x2="180" y2="100" stroke="#7A3BFF" strokeWidth="0.1" strokeDasharray="1,2" />
          <line x1="100" y1="20" x2="100" y2="180" stroke="#7A3BFF" strokeWidth="0.1" strokeDasharray="1,2" />
        </svg>
        <span className="text-zinc-500 font-mono text-center text-[10px] uppercase tracking-widest mt-4">
          ClearPath System Constellation Map
        </span>
      </div>
    );
  };

  const currentTheme = getEnvThemeConfig();

  return (
    <div className={`clearpath-glass-root ${lightMode ? 'light-mode' : ''} ${
      userFontSize === 'large' ? 'encyclopedia-font-large' : userFontSize === 'xl' ? 'encyclopedia-font-xl' : ''
    } selection:bg-[#00f2ff]/20 selection:text-white relative overflow-hidden min-h-screen`}>
      
      {/* Cinematic Custom Animations Block */}
      <style>{`
        @keyframes auroraDriftA {
          0% { transform: translate(0px, 0px) scale(1) rotate(0deg); opacity: 0.35; }
          33% { transform: translate(120px, -80px) scale(1.3) rotate(120deg); opacity: 0.55; }
          66% { transform: translate(-80px, 90px) scale(0.9) rotate(240deg); opacity: 0.25; }
          100% { transform: translate(0px, 0px) scale(1) rotate(360deg); opacity: 0.35; }
        }
        @keyframes auroraDriftB {
          0% { transform: translate(0px, 0px) scale(1.2) rotate(180deg); opacity: 0.25; }
          50% { transform: translate(-100px, 110px) scale(0.85) rotate(30deg); opacity: 0.45; }
          100% { transform: translate(0px, 0px) scale(1.2) rotate(180deg); opacity: 0.25; }
        }
        @keyframes holographicGridFlux {
          0% { background-position: 0px 0px; }
          100% { background-position: 40px 40px; }
        }
        @keyframes edgeLightpulse {
          0%, 100% { box-shadow: 0 0 15px rgba(0, 217, 255, 0.05), inset 0 0 10px rgba(0, 217, 255, 0.02); }
          50% { box-shadow: 0 0 35px rgba(0, 217, 255, 0.18), inset 0 0 25px rgba(0, 217, 255, 0.08); }
        }
        .cinematic-aurora-1 {
          animation: auroraDriftA 30s ease-in-out infinite;
          background-image: radial-gradient(circle at 45% 45%, var(--theme-aurora-1) 0%, transparent 70%);
        }
        .cinematic-aurora-2 {
          animation: auroraDriftB 35s ease-in-out infinite;
          background-image: radial-gradient(circle at 55% 55%, var(--theme-aurora-2) 0%, transparent 65%);
        }
        .holographic-grid-backdrop {
          background-size: 50px 50px;
          background-image: 
            linear-gradient(to right, var(--theme-grid) 1px, transparent 1px),
            linear-gradient(to bottom, var(--theme-grid) 1px, transparent 1px);
          animation: holographicGridFlux 20s linear infinite;
        }
        .card-custom-shadow {
          box-shadow: 0 30px 70px rgba(0, 0, 0, 0.75), inset 0 1px 0 rgba(255, 255, 255, 0.08);
        }
        .neon-border-glowing {
          border-color: var(--theme-primary-transparent);
          box-shadow: 0 0 15px var(--theme-primary-glow);
        }
        .holographic-card {
          position: relative;
          background: rgba(3, 7, 18, 0.75);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.07);
          transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .holographic-card:hover {
          transform: translateY(-2px) scale(1.005);
          border-color: var(--theme-primary);
          box-shadow: 0 15px 40px rgba(0, 0, 0, 0.6), 0 0 20px var(--theme-primary-glow);
        }
      `}</style>

      {/* CSS custom variables injector */}
      <div 
        style={{
          display: 'none',
          '--theme-aurora-1': currentTheme.aurora1 || 'rgba(0, 217, 255, 0.15)',
          '--theme-aurora-2': currentTheme.aurora2 || 'rgba(255, 0, 200, 0.12)',
          '--theme-grid': currentTheme.gridColor || 'rgba(0,217,255,0.03)',
          '--theme-primary': currentTheme.primaryColor || '#00D9FF',
          '--theme-primary-glow': `rgba(${currentTheme.primaryColor === '#F97316' ? '249,115,22' : currentTheme.primaryColor === '#EF4444' ? '239,68,68' : currentTheme.primaryColor === '#6866F1' ? '99,102,241' : '0,217,255'}, 0.08)`,
          '--theme-primary-transparent': `${currentTheme.primaryColor}20`
        } as any}
      />

      {/* Drifting Cinematic Auroras Skybox */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none select-none" style={{ zIndex: -8.5 }}>
        <div className="absolute top-[-20%] left-[-10%] w-[120%] h-[120%] cinematic-aurora-1 opacity-40 blur-[130px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-15%] w-[110%] h-[110%] cinematic-aurora-2 opacity-35 blur-[120px] rounded-full" />
      </div>

      {/* Holographic grid alignment structure */}
      <div className="absolute inset-0 holographic-grid-backdrop pointer-events-none opacity-40" style={{ zIndex: -8.1 }} />

      {/* Immersive layered cosmic lighting backgrounds */}
      <div className="absolute inset-0 bg-[#000109]" style={{ zIndex: -10 }} />
      <div className="absolute inset-0 opacity-95 transition-all duration-1000" style={{ zIndex: -9, backgroundImage: currentTheme.bgGradient }} />
      <div className="absolute inset-0 pointer-events-none transition-all duration-1000" style={{ zIndex: -8, backgroundImage: `radial-gradient(circle at 50% 50%, ${currentTheme.ambientGlow} 0%, transparent 65%)` }} />
      
      {/* Parallax Holographic Earth Planet & Micro Wind Orbits */}
      <div 
        className="absolute right-[-150px] md:right-4 top-[10%] w-[580px] h-[580px] pointer-events-none select-none transition-all duration-300 ease-out opacity-[0.22] mix-blend-screen overflow-visible"
        style={{ 
          zIndex: -7,
          transform: `translate(${mousePos.x * 0.4}px, ${mousePos.y * 0.4}px) scale(1.1)`,
          filter: 'drop-shadow(0 0 60px rgba(0, 217, 255, 0.2))'
        }}
      >
        <svg viewBox="0 0 200 200" className="w-full h-full animate-spin" style={{ animationDuration: '140s' }}>
          <defs>
            <radialGradient id="hologramGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#00D9FF" stopOpacity="0.15" />
              <stop offset="70%" stopColor="#7A3BFF" stopOpacity="0.03" />
              <stop offset="100%" stopColor="#000000" stopOpacity="0" />
            </radialGradient>
          </defs>
          
          {/* Inner spherical glow */}
          <circle cx="100" cy="100" r="85" fill="url(#hologramGlow)" />
          
          {/* Latitudes & Longitudes */}
          <circle cx="100" cy="100" r="85" fill="none" stroke="#00D9FF" strokeWidth="0.3" strokeDasharray="3,6" opacity="0.4" />
          <circle cx="100" cy="100" r="72" fill="none" stroke="#7A3BFF" strokeWidth="0.25" strokeDasharray="5,2" opacity="0.3" />
          <ellipse cx="100" cy="100" rx="85" ry="25" fill="none" stroke="#00D9FF" strokeWidth="0.2" opacity="0.25" />
          <ellipse cx="100" cy="100" rx="85" ry="55" fill="none" stroke="#00D9FF" strokeWidth="0.15" opacity="0.2" />
          <ellipse cx="100" cy="100" rx="85" ry="10" fill="none" stroke="#00D9FF" strokeWidth="0.25" opacity="0.25" />
          <ellipse cx="100" cy="100" rx="25" ry="85" fill="none" stroke="#00D9FF" strokeWidth="0.2" opacity="0.2" />
          <ellipse cx="100" cy="100" rx="55" ry="85" fill="none" stroke="#00D9FF" strokeWidth="0.15" opacity="0.15" />
          <ellipse cx="100" cy="100" rx="10" ry="85" fill="none" stroke="#00D9FF" strokeWidth="0.25" opacity="0.25" />

          {/* Glowing Constellations Connections */}
          <line x1="45" y1="55" x2="155" y2="145" stroke="#00D9FF" strokeWidth="0.25" opacity="0.35" strokeDasharray="4,4" />
          <line x1="30" y1="120" x2="170" y2="80" stroke="#FF00C8" strokeWidth="0.2" opacity="0.3" />
          <line x1="100" y1="15" x2="100" y2="185" stroke="#7A3BFF" strokeWidth="0.2" opacity="0.3" />
          
          {/* Main Street Trade nodes */}
          <circle cx="45" cy="55" r="1.5" fill="#00D9FF" />
          <circle cx="155" cy="145" r="1.5" fill="#00D9FF" />
          <circle cx="30" cy="120" r="2.5" fill="#FF00C8" className="animate-pulse" />
          <circle cx="170" cy="80" r="2" fill="#FBBF24" />
          <circle cx="100" cy="15" r="1.5" fill="#7A3BFF" />
        </svg>
      </div>

      {/* Floating Constellation Data Panels in Margins */}
      <div 
        className="absolute left-6 top-[25%] select-none pointer-events-none hidden xl:flex flex-col gap-6 font-mono text-[9px] text-[#00D9FF]/40 z-0 transition-transform duration-300 ease-out"
        style={{ transform: `translate(${mousePos.x * 0.15}px, ${mousePos.y * 0.15}px)` }}
      >
        {/* Panel 1 */}
        <div className="border border-[#00D9FF]/10 bg-black/55 backdrop-blur-md p-4 rounded-2xl max-w-[220px] flex flex-col gap-1.5 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
          <div className="flex justify-between items-center text-[#00D9FF] font-black tracking-widest text-[8.5px]">
            <span>SYSTEM CONSTELLATION</span>
            <span className="w-1.5 h-1.5 bg-[#00D9FF] rounded-full animate-ping" />
          </div>
          <span className="text-zinc-500 font-bold uppercase text-[7.5px] block border-b border-white/5 pb-1 mt-0.5">Syllabus Instrument Matrix</span>
          <span className="opacity-75 text-[8px] leading-tight block">M2 Money Pools: $104.2T (+3.8% MoM)</span>
          <span className="opacity-75 text-[8px] leading-tight block">Carry Trading Index: 4.85% (STABLE)</span>
          <div className="w-full bg-[#00D9FF]/5 h-[2px] mt-1 overflow-hidden rounded relative">
            <div className="absolute top-0 left-0 bg-[#00D9FF]/50 h-full w-[68%] animate-pulse" />
          </div>
        </div>

        {/* Panel 2 */}
        <div className="border border-[#FF00C8]/10 bg-black/55 backdrop-blur-md p-4 rounded-2xl max-w-[220px] flex flex-col gap-1.5 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
          <div className="flex justify-between items-center text-[#FF00C8] font-black tracking-widest text-[8.5px]">
            <span>CIVILIZATION MATRIX</span>
            <span className="text-rose-500 font-bold font-sans">98.4%</span>
          </div>
          <span className="opacity-80 text-[8.5px] leading-relaxed text-zinc-300 block italic">"This is the operating system of civilization."</span>
          <span className="opacity-40 text-[7px] text-zinc-500 block">NODE: NY-LQD-CORRIDOR-7A</span>
        </div>
      </div>

      {/* Background Bull & Bear Constellation Overlays */}
      <div className="absolute left-[5%] bottom-[10%] select-none pointer-events-none opacity-[0.04] text-[#00D9FF] z-0 hidden lg:block transition-all duration-1000" style={{ transform: `scale(${policyDial < 50 ? 1.15 : 0.85})` }}>
        <span className="font-sans font-black text-[12vw] tracking-tighter leading-none select-none uppercase block">BULL</span>
      </div>
      <div className="absolute right-[5%] bottom-[10%] select-none pointer-events-none opacity-[0.04] text-[#FF00C8] z-0 hidden lg:block transition-all duration-1000" style={{ transform: `scale(${policyDial >= 50 ? 1.15 : 0.85})` }}>
        <span className="font-sans font-black text-[12vw] tracking-tighter leading-none select-none uppercase block">BEAR</span>
      </div>

      {/* Holographic watermark background text */}
      <div className="absolute left-8 bottom-8 select-none pointer-events-none font-mono text-[9px] text-white/[0.015] tracking-[0.4em] uppercase z-0 font-bold leading-normal">
        CLEARPATH INSTRUMENT ARCHIVE • ENVIRONMENTAL: {activeFile.toUpperCase()} • AUTH: {currentTheme.tag}
      </div>

      {/* Floating financial cosmic particles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden select-none" style={{ zIndex: -4 }}>
        {['▲', '▼', '$', '€', '₿', '¥'].map((char, index) => {
          const delays = ['0s', '3s', '6s', '1.5s', '4.5s', '7.5s'];
          const offsets = ['left-[10%]', 'left-[25%]', 'left-[45%]', 'left-[65%]', 'left-[80%]', 'left-[92%]'];
          const scales = ['scale-75', 'scale-100', 'scale-90', 'scale-110', 'scale-75', 'scale-125'];
          return (
            <div 
              key={index}
              className={`absolute top-full font-mono text-xs select-none pointer-events-none animate-bounce opacity-[0.08] ${currentTheme.particleColor} ${offsets[index]} ${scales[index]}`}
              style={{
                animationDuration: `${12 + (index * 4)}s`,
                animationDelay: delays[index],
                animationIterationCount: 'infinite',
                transform: `translateY(-120vh)`
              }}
            >
              {char}
            </div>
          );
        })}
      </div>

      {/* Volumetric Neon Fog floating nodes */}
      <div className="absolute bottom-12 left-12 w-[400px] h-[400px] bg-[#00D9FF]/2 rounded-full blur-[130px] pointer-events-none transition-all duration-1000" style={{ zIndex: -5, backgroundColor: currentTheme.type === 'inflation' ? 'rgba(249,115,22,0.03)' : currentTheme.type === 'cognitive-ai' ? 'rgba(6,182,212,0.04)' : undefined }} />
      <div className="absolute top-12 right-12 w-[400px] h-[400px] bg-[#FF00C8]/2 rounded-full blur-[130px] pointer-events-none transition-all duration-1000" style={{ zIndex: -5, backgroundColor: currentTheme.type === 'commodities' ? 'rgba(234,179,8,0.03)' : undefined }} />

      {/* Ambient background original loops */}
      <div className="video-bg opacity-35">
        <video width="320" height="240" autoPlay loop muted playsInline>
          <source src="https://assets.codepen.io/3364143/7btrrd.mp4" type="video/mp4" />
        </video>
      </div>

      {/* Starfield overlay indicator */}
      <div className="absolute top-4 right-4 z-40 flex items-center gap-2">
        <div className="dark-light md:translate-x-0 translate-x-4 cursor-pointer p-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10" onClick={() => setLightMode(!lightMode)} title="Toggle ambient filters">
          <svg viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-[#00D9FF]">
            <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
          </svg>
        </div>
      </div>

      {/* CODEPEN GLASSMORPHIC APP WINDOW CONTAINER CONTAINER */}
      <div className="app">

        {/* PERSISTENT GLOBAL HEADER BAR */}
        <div className="header bg-black/40 border-b border-white/5 flex items-center justify-between px-6 z-30 shadow-[0_2px_15px_rgba(0,0,0,0.35)]">
          {/* Mac-style Window Menu Spheres: click red closes/returns to trading portal */}
          <div className="menu-circle transition-all hover:scale-105" onClick={returnToTerminal} style={{ cursor: 'pointer' }} title="Exit Encyclopedia to Trading Portal" />

          {/* BRAND PLATFORM LOGO BLOCK */}
          <div className="flex items-center gap-2.5 w-auto mr-3 md:mr-5 lg:mr-8 xl:mr-10 select-none shrink-0 cursor-pointer" onClick={() => selectFileNode('index.html')}>
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-400 to-[#FF00C8] border border-cyan-300/30 flex items-center justify-center shadow-[0_0_15px_rgba(0,217,255,0.25)] relative overflow-hidden group">
              <span className="text-[14px] text-black font-black font-mono animate-pulse">☯</span>
            </div>
            <div className="flex flex-col">
              <span className="font-sans font-black text-[13px] text-white uppercase tracking-wider leading-none">CLEAR PATH</span>
              <span className="font-mono text-[#00f2ff] text-[8px] font-black tracking-widest uppercase mt-0.5">MARKETS SCIENCE</span>
            </div>
          </div>

          {/* Central Cognition Persona segment tabs */}
          <div className="hidden md:flex bg-[#070b16] p-1 rounded-xl border border-white/5 shrink-0">
            {(['BEGINNER', 'TRADER', 'ANALYST', 'ECONOMIST'] as const).map((tab) => {
              const isSelected = cognitionPersona === tab;
              return (
                <button
                  key={tab}
                  onClick={() => {
                    setCognitionPersona(tab);
                    const map: Record<'BEGINNER' | 'TRADER' | 'ANALYST' | 'ECONOMIST', 'kids' | 'highschool' | 'college' | 'researcher'> = {
                      'BEGINNER': 'kids',
                      'TRADER': 'highschool',
                      'ANALYST': 'college',
                      'ECONOMIST': 'researcher'
                    };
                    setPedagogyMode(map[tab]);
                  }}
                  className={`cursor-pointer px-2 lg:px-3.5 py-1.5 rounded-xl text-[10px] lg:text-[10.5px] font-black tracking-wider lg:tracking-widest transition-all duration-300 ${
                    isSelected 
                      ? 'bg-gradient-to-r from-purple-600 to-[#FF00C8] text-white shadow-[0_0_10px_rgba(255,0,200,0.25)]' 
                      : 'text-zinc-400 hover:text-white hover:bg-white/[0.02]'
                  }`}
                >
                  {tab}
                </button>
              );
            })}
          </div>

          {/* Search bar + Profile actions */}
          <div className="flex items-center gap-2.5 shrink-0">
            {/* Real-time Sovereign Language Engine Switcher */}
            <div className="hidden xl:flex items-center bg-[#070b16] border border-white/5 rounded-xl p-0.5" title="Sovereign Translation Engine">
              <span className="text-[8.5px] font-mono font-black text-zinc-500 px-2 select-none uppercase">LANG:</span>
              {(['EN', 'ZH', 'ES', 'PT', 'KO'] as const).map((lang) => {
                const isActive = activeLanguage === lang;
                const flagMap = { EN: '🇺🇸', ZH: '🇨🇳', ES: '🇪🇸', PT: '🇵🇹', KO: '🇰🇷' };
                return (
                  <button
                    key={lang}
                    onClick={() => setActiveLanguage(lang)}
                    className={`px-2 py-1 rounded-lg text-[10px] font-black cursor-pointer transition-all ${
                      isActive 
                        ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold shadow-[0_0_8px_rgba(0,217,255,0.3)]' 
                        : 'text-zinc-400 hover:text-white hover:bg-white/5'
                    }`}
                    title={lang === 'EN' ? 'English' : lang === 'ZH' ? 'Mandarin Chinese' : lang === 'ES' ? 'Spanish' : lang === 'PT' ? 'Portuguese' : 'Korean'}
                  >
                    <span className="mr-0.5">{flagMap[lang]}</span>{lang}
                  </button>
                );
              })}
            </div>

            <div className="relative w-[120px] xs:w-[150px] sm:w-[180px] md:w-[240px]">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-zinc-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('search_placeholder', 'Search markets, equations...')}
                className="w-full bg-[#070b16] border border-white/10 focus:border-cyan-400 rounded-xl py-2 pl-9 pr-8 text-xs font-semibold text-white placeholder-zinc-500 focus:outline-none transition-all"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="absolute right-3 top-2.5 text-zinc-500 hover:text-white text-xs">✕</button>
              )}
            </div>

            {/* INLINE CORE FONT CONTROL DECK */}
            <div className="hidden xl:flex items-center bg-[#070b16] border border-white/10 rounded-xl p-0.5" title="Interactive System Font Scale">
              <span className="text-[8px] font-mono font-black text-zinc-500 px-2 select-none uppercase">FONT:</span>
              {(['normal', 'large', 'xl'] as const).map((sz) => {
                const isActive = userFontSize === sz;
                return (
                  <button
                    key={sz}
                    onClick={() => setUserFontSize(sz)}
                    className={`px-2 py-1 rounded-lg text-[9px] font-extrabold uppercase tracking-wide cursor-pointer transition-all ${
                      isActive 
                        ? 'bg-[#00D9FF] text-black font-black shadow-[0_0_10px_rgba(0,217,255,0.4)]' 
                        : 'text-zinc-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    {sz === 'normal' ? 'A' : sz === 'large' ? 'A+' : 'A++'}
                  </button>
                );
              })}
            </div>

            <button onClick={() => selectFileNode('global-atlas.html')} className="p-2 bg-[#0a0f21] border border-white/10 hover:border-cyan-400 rounded-xl text-zinc-400 hover:text-cyan-400 transition-all cursor-pointer" title="Global Atlas map">
              <Globe className="w-4 h-4" />
            </button>

            <div className="relative">
              <button className="p-2 bg-[#0a0f21] border border-white/10 hover:border-[#FF00C8] rounded-xl text-zinc-400 hover:text-[#FF00C8] transition-all cursor-pointer">
                <Bell className="w-4 h-4" />
              </button>
              <span className="absolute -top-1 -right-1 bg-[#FF00C8] text-neutral-950 font-black text-[8px] w-4.5 h-4.5 rounded-full flex items-center justify-center border border-black animate-pulse">
                7
              </span>
            </div>

            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-400 to-[#FF00C8] p-[1.5px] select-none shrink-0">
              <div className="w-full h-full bg-[#030712] rounded-[10px] flex items-center justify-center">
                <span className="text-[10px] font-black text-cyan-400 uppercase tracking-widest font-mono">CP</span>
              </div>
            </div>
          </div>
        </div>

        <div className="wrapper">
          {/* COLUMN 1: LEFT VERTICAL SIDEBAR NAVIGATION */}
          <div className="left-side custom-scrollbar overflow-y-auto flex flex-col p-5 gap-5 z-20">
            
            {/* 1. BRAND PLATFORM LOGO BLOCK */}
            <div className="flex flex-col gap-1.5 border-b border-white/5 pb-4 select-none shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-400 to-[#FF00C8] border border-cyan-300/30 flex items-center justify-center shadow-[0_0_15px_rgba(0,217,255,0.25)] relative overflow-hidden group">
                  <span className="text-[14px] text-black font-black font-mono animate-pulse">☯</span>
                </div>
                <div className="flex flex-col">
                  <span className="font-sans font-black text-[13px] text-white uppercase tracking-wider leading-none">CLEAR PATH</span>
                  <span className="font-mono text-[#00f2ff] text-[8px] font-black tracking-widest uppercase mt-0.5">MARKETS SCIENCE</span>
                </div>
              </div>
            </div>

            {/* 2. PREMIUM CINEMATIC VERTICAL NEON NAVIGATION */}
            <div className="flex flex-col gap-1 py-1 pr-1 border-b border-white/5 mb-3 select-none">
              <span className="font-mono text-[8.5px] text-zinc-500 font-extrabold tracking-widest uppercase mb-2 px-1 pb-1 border-b border-zinc-900 leading-none">NEON PORTALS</span>
              {[
                { file: 'encyclopedia/markets/forex.html', label: 'FOREX', desc: 'Sovereign Reserves Matrix', icon: DollarSign, color: '#FF00C8', glow: 'rgba(255, 0, 200, 0.25)' },
                { file: 'encyclopedia/markets/crypto.html', label: 'CRYPTO', desc: 'Digital Asset Networks', icon: Coins, color: '#FF5E00', glow: 'rgba(255, 94, 0, 0.25)' },
                { file: 'encyclopedia/markets/stocks.html', label: 'STOCKS', desc: '10,000+ Corporate Equities', icon: TrendingUp, color: '#00D9FF', glow: 'rgba(0, 217, 255, 0.25)' }
              ].map((neonItem) => {
                const isSelected = activeFile === neonItem.file;
                const IconComp = neonItem.icon;
                return (
                  <button
                    key={neonItem.file}
                    onClick={() => selectFileNode(neonItem.file)}
                    style={{
                      borderColor: isSelected ? neonItem.color : 'transparent',
                      boxShadow: isSelected ? `0 0 15px ${neonItem.glow}, inset 0 0 8px ${neonItem.glow}` : 'none'
                    }}
                    className={`group w-full flex items-center gap-3 py-2 px-3.5 rounded-xl text-left transition-all duration-300 relative overflow-hidden border cursor-pointer ${
                      isSelected 
                        ? 'bg-black/80 font-black text-white' 
                        : 'bg-transparent border-transparent hover:bg-white/[0.03] text-zinc-400 hover:text-white'
                    }`}
                  >
                    <div className="absolute left-0 top-1/4 bottom-1/4 w-1 bg-current rounded-r" style={{ color: neonItem.color, opacity: isSelected ? 1 : 0 }} />
                    <IconComp className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110" style={{ color: isSelected ? '#fff' : neonItem.color }} />
                    <div className="flex flex-col min-w-0">
                      <span className="text-[11.5px] font-mono tracking-wider font-extrabold leading-none" style={{ color: isSelected ? '#fff' : neonItem.color }}>
                        {neonItem.label}
                      </span>
                      <span className="text-[8px] text-zinc-500 font-mono mt-1 truncate leading-none group-hover:text-zinc-400">
                        {neonItem.desc}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* 3. CATEGORIES NAVIGATION STACK */}
            <div className="flex flex-col gap-1 flex-1 py-1 pr-1">
              <span className="font-mono text-[8.5px] text-zinc-500 font-extrabold tracking-widest uppercase select-none mb-2 px-1 pb-1 border-b border-zinc-900 leading-none">CORE INSTRUMENTS</span>
              {[
                { file: 'index.html', label: 'HOME', desc: 'Global Financial Observatory', icon: Home, highlight: false },
                { file: 'markets.html', label: 'MARKETS', desc: 'World Market Systems', icon: Globe, highlight: false },
                { file: 'encyclopedia/markets/stocks.html', label: 'STOCKS', desc: '10,000+ Publicly Traded Stocks', icon: TrendingUp, highlight: false },
                { file: 'encyclopedia/companies/directory.html', label: 'COMPANIES', desc: '60,000+ Corporations Directory', icon: Users, highlight: false },
                { file: 'encyclopedia/markets/forex.html', label: 'FOREX', desc: 'Global Currency Systems', icon: DollarSign, highlight: false },
                { file: 'encyclopedia/markets/crypto.html', label: 'CRYPTO', desc: 'Digital Asset Ecosystems', icon: Coins, highlight: false },
                { file: 'encyclopedia/markets/commodities.html', label: 'COMMODITIES', desc: 'Energy, Metals, Agriculture', icon: Boxes, highlight: false },
                { file: 'encyclopedia/global/world-map.html', label: 'BONDS', desc: 'Global Sovereign Debt Markets', icon: Landmark, highlight: false },
                { file: 'economy.html', label: 'ECONOMY', desc: 'Macroeconomic Intelligence', icon: Landmark, highlight: false },
                { file: 'encyclopedia/economy/federal-reserve.html', label: 'FEDERAL RESERVE', desc: 'Monetary Policy Systems', icon: Settings, highlight: false },
                { file: 'civilization-engine.html', label: 'TREASURY SYSTEM', desc: 'Debt Issuance & Yield Curves', icon: Layers, highlight: false },
                { file: 'encyclopedia/economy/inflation.html', label: 'INFLATION LAB', desc: 'Purchasing Power Analysis', icon: AlertTriangle, highlight: false },
                { file: 'market-psychology.html', label: 'MARKET PSYCHOLOGY', desc: 'Fear, Greed & Volatility Cycles', icon: Brain, highlight: false },
                { file: 'sectors.html', label: 'SECTOR INTELLIGENCE', desc: 'Sectors & Capital Rotation', icon: Cpu, highlight: false },
                { file: 'economic-memory-matrix.html', label: 'ECONOMIC EVENTS', desc: 'Historical Financial Timeline', icon: Calendar, highlight: false },
                { file: 'political-eras.html', label: 'POLITICAL ERAS', desc: 'Presidential Administrations', icon: Award, highlight: false },
                { file: 'dxy-observatory.html', label: 'DXY OBSERVATORY', desc: 'U.S. Dollar Strength Analysis', icon: Compass, highlight: false },
                { file: 'global-crisis-archive.html', label: 'GLOBAL CRISIS ARCHIVE', desc: 'Dot-Com, 2008, COVID Shocks', icon: AlertTriangle, highlight: false },
                { file: 'watchlists.html', label: 'WATCHLISTS', desc: 'Saved Market Intelligence', icon: Star, highlight: false },
                { file: 'portfolio.html', label: 'PORTFOLIO LAB', desc: 'Allocation & Risk Analysis', icon: FolderOpen, highlight: false },
                { file: 'education.html', label: 'EDUCATION CENTER', desc: 'Beginner to PhD Curriculum', icon: GraduationCap, highlight: false },
                { file: 'kids-mode.html', label: 'KIDS MODE', desc: 'Gamified Economic Learning', icon: Trophy, highlight: false },
                { file: 'comic-library.html', label: 'COMIC LIBRARY', desc: 'Sovereign Debt Comic Book Series', icon: Smile, highlight: true },
                { file: 'glossary.html', label: 'GLOSSARY', desc: 'Dictionary of Financial Terms', icon: BookOpen, highlight: false },
                { file: 'encyclopedia/blueprints/exchanges.html', label: 'EXCHANGES ATLAS', desc: 'World Markets Directory', icon: Globe, highlight: true },
                { file: 'encyclopedia/blueprints/gold-shock.html', label: 'NIXON GOLD SHOCK', desc: '1971 Gold Standard Break', icon: Landmark, highlight: true },
                { file: 'encyclopedia/blueprints/commodity-correlations.html', label: 'CORRELATIONS ENGINE', desc: 'Gold, Silver, Oil & Currencies', icon: TrendingUp, highlight: true },
                { file: 'encyclopedia/blueprints/soft-commodities.html', label: 'GRAINS LAB', desc: 'Wheat vs. Soy Analysis', icon: Boxes, highlight: true },
                { file: 'master-index.html', label: 'SYMBOL DATABASE', desc: 'Interactive Stock Search Tool', icon: Search, highlight: false }
              ].map((navItem) => {
                const isSelected = activeFile === navItem.file;
                const IconComp = navItem.icon;
                return (
                  <button
                    key={navItem.file}
                    onClick={() => selectFileNode(navItem.file)}
                    className={`group w-full flex items-center gap-3 py-2 px-3.5 rounded-xl text-left transition-all duration-300 relative overflow-hidden border cursor-pointer ${
                      isSelected 
                        ? 'bg-gradient-to-r from-[#00D9FF]/10 to-[#00D9FF]/5 border-[#00D9FF]/30 text-white shadow-[0_0_15px_rgba(0,217,255,0.05)]' 
                        : 'border-transparent bg-transparent hover:bg-white/[0.02] text-zinc-400 hover:text-white hover:border-white/5'
                    }`}
                  >
                    {/* Glowing highlight indicator */}
                    {isSelected && <div className="absolute left-0 top-1/4 bottom-1/4 w-0.5 bg-[#00D9FF] rounded-r" />}
                    
                    <IconComp className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-110 ${
                      isSelected ? 'text-[#00D9FF]' : 'text-zinc-500 group-hover:text-[#00D9FF]'
                    } ${navItem.highlight ? 'animate-pulse text-purple-400' : ''}`} />
                    
                    <div className="flex flex-col min-w-0">
                      <span className={`text-[11.5px] font-semibold leading-none ${isSelected ? 'text-[#00D9FF] font-black' : 'text-zinc-300 font-medium'}`}>
                        {navItem.label}
                      </span>
                      <span className="text-[8px] text-zinc-500 font-mono mt-0.5 truncate group-hover:text-zinc-400 leading-none">
                        {navItem.desc}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="mt-auto shrink-0 select-none">
              <ClearPathTraderPortal variant="sidebar" />
            </div>
          </div>

          {/* COLUMN 2: CENTER FRACTIONAL FLUID SCROLLABLE MAIN CONTENT AREA */}
          <div className="main-container custom-scrollbar overflow-y-auto p-6 md:p-8 flex flex-col gap-6 z-20" id="main-scroll-viewport">
            
            {/* GIANT DOMINANT MULTI-ACTION SYSTEM NAVIGATION & DISMISSAL HUD BAR */}
            <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-4 p-4.5 bg-black/85 border border-[#00f2ff]/25 rounded-2xl relative overflow-hidden select-none mb-1 shadow-[0_8px_30px_rgba(0,0,0,0.85)] shrink-0 z-30">
              <div className="absolute inset-x-0 top-0 h-[1.5px] bg-gradient-to-r from-cyan-400 via-[#00f2ff] to-[#FF00C8]" />
              
              <div className="flex items-center gap-3">
                <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_10px_#00f2ff]" />
                <div className="flex flex-col text-left">
                  <span className="font-mono text-[9px] text-[#00f2ff] tracking-[0.25em] font-black uppercase leading-none">SYSTEM SERVICE</span>
                  <span className="text-[12px] font-sans font-black text-white uppercase tracking-tight mt-1">ACTIVE FILE: {activeFile.toUpperCase()}</span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                {/* 1. SOLID PROMINENT BACK BUTTON */}
                <button
                  type="button"
                  onClick={handleGoBack}
                  id="nav-back-button"
                  className={`flex-1 sm:flex-initial py-2.5 px-4 border rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer text-[10px] uppercase font-bold tracking-wider font-sans group ${
                    encyclopediaHistory.length > 1 || activeFile !== 'index.html'
                      ? 'bg-[#06182c] border-[#00f2ff]/50 text-[#00f2ff] hover:bg-[#00f2ff]/20 hover:text-white hover:border-[#00f2ff] shadow-[0_0_15px_rgba(0,242,255,0.15)]'
                      : 'bg-zinc-900/40 border-zinc-800 text-zinc-650 cursor-not-allowed opacity-60'
                  }`}
                  disabled={encyclopediaHistory.length <= 1 && activeFile === 'index.html'}
                >
                  <span className="transition-transform group-hover:-translate-x-1 font-mono text-xs leading-none">←</span>
                  <span>PREV PAGE</span>
                </button>

                {/* 2. DIRECT HUB SHORTCUTS */}
                {activeFile !== 'index.html' && (
                  <button
                    type="button"
                    onClick={() => selectFileNode('index.html')}
                    id="hub-encyclopedia-button"
                    className="flex-1 sm:flex-initial py-2.5 px-4 bg-zinc-950 border border-cyan-500/40 text-cyan-400 hover:bg-cyan-500/20 hover:text-white hover:border-cyan-400 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer text-[10px] uppercase font-bold tracking-wider font-sans shadow-[0_0_12px_rgba(6,182,212,0.1)]"
                  >
                    <span>ENCYCLOPEDIA HOME</span>
                  </button>
                )}

                {activeFile !== 'markets.html' && (
                  <button
                    type="button"
                    onClick={() => selectFileNode('markets.html')}
                    id="hub-markets-button"
                    className="flex-1 sm:flex-initial py-2.5 px-4 bg-zinc-950 border border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/20 hover:text-white hover:border-emerald-400 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer text-[10px] uppercase font-bold tracking-wider font-sans shadow-[0_0_12px_rgba(16,185,129,0.1)]"
                  >
                    <span>MARKETS DATA</span>
                  </button>
                )}

                {/* 3. SOLID INSTANT EXIT BUTTON */}
                <button
                  type="button"
                  onClick={returnToTerminal}
                  id="nav-exit-button"
                  className="flex-1 sm:flex-initial py-2.5 px-4 bg-[#1f0514] border border-[#ff00c8]/50 text-[#ff00c8] hover:bg-[#ff00c8]/20 hover:text-white hover:border-[#ff00c8] rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer text-[10px] uppercase font-bold tracking-wider font-sans group shadow-[0_0_15px_rgba(255,0,200,0.15)]"
                >
                  <span className="font-mono text-xs leading-none">✕</span>
                  <span>{t('exit_terminal', 'EXIT TO TRADING TERMINAL')}</span>
                </button>
              </div>
            </div>

            {/* Micro Workspace Breadcrumb Bar */}
            <div className="w-full flex items-center justify-between pb-3 border-b border-zinc-900 select-none shrink-0 font-mono text-[10px] text-zinc-500 z-10">
              <div className="flex items-center gap-2">
                <Terminal className="w-3.5 h-3.5 text-[#00D9FF]" />
                <span className="text-zinc-650">{t('workspace', 'WORKSPACE')}:</span>
                <span className="text-zinc-400">ClearPath-Encyclopedia / {activeFile}</span>
                <span className="text-zinc-700">|</span>
                <span className="text-cyan-400 font-extrabold uppercase tracking-widest leading-none">
                  {t('market_integrity', 'MARKETS INTEGRITY ENGINE')}
                </span>
              </div>
            </div>

            {/* GIANT DOMINANT MASTER HERO SYSTEM */}
            {activeFile === 'index.html' ? (
              <div 
                id="central-observation-deck" 
                className="relative overflow-hidden border border-[#FF00C8]/25 bg-black/85 rounded-[32px] p-6 md:p-10 shadow-[0_30px_100px_rgba(0,0,0,0.95)] z-10 flex flex-col gap-6 shrink-0 min-h-[700px] animate-fadeIn"
                style={{
                  backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.8), rgba(6, 10, 20, 0.95)), url(${cinematicHeroBg})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'right center',
                  backgroundBlendMode: 'overlay'
                }}
              >
                {/* 1. CINEMATIC TOP HEADER & HUD STATUS */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-4 select-none relative z-10">
                  <div className="flex flex-col text-left">
                    <span className="font-mono text-[9px] text-[#FF00C8] tracking-[0.25em] font-black uppercase mb-1.5">CLEARPATH INTELLIGENCE NODE</span>
                    <h1 className="font-sans font-black text-white text-[28px] lg:text-[38px] tracking-tight leading-none uppercase select-none flex items-center gap-2">
                      <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00D9FF] via-purple-400 to-[#FF00C8] filter drop-shadow-[0_0_15px_rgba(0,217,255,0.3)]">
                        {t('financial_encyclopedia', 'ENCYCLOPEDIA OF FINANCE')}
                      </span>
                    </h1>
                    <p className="text-zinc-400 text-xs mt-2 font-medium">
                      {t('encyclopedia_desc', 'Dynamic, sovereign educational terminal built to democratize market understanding.')}
                    </p>
                  </div>
                  
                  {/* Top Right HUD panel */}
                  <div className="self-start md:self-center bg-black/85 border border-[#00D9FF]/30 p-2.5 px-4 rounded-xl flex items-center gap-3 shadow-[0_4px_20px_rgba(0,0,0,0.8)]">
                    <div className="w-2 h-2 rounded-full bg-[#00D9FF] animate-pulse" />
                    <div className="flex flex-col text-left font-mono text-[8.5px]">
                      <span className="text-zinc-500 font-extrabold">{t('sovereign_status', 'SOVEREIGN ACCESS STATUS')}</span>
                      <span className="text-cyan-400 font-black tracking-widest mt-0.5">{t('statically_scaled', 'STATICALLY SCALED')}</span>
                    </div>
                  </div>
                </div>

                {/* 2. ADAPTIVE PEDAGOGY CONTROLLER HUD BLOCK */}
                <div className="w-full bg-black/60 border border-[#FF00C8]/25 p-5 rounded-2xl relative overflow-hidden select-none z-10 shadow-lg flex flex-col md:flex-row items-center justify-between gap-6">
                  {/* Decorative background grid line */}
                  <div className="absolute inset-x-0 top-0 h-[1.5px] bg-gradient-to-r from-[#00D9FF] via-[#7B3BFF] to-[#FF00C8]" />
                  
                  <div className="flex flex-col text-left max-w-xl">
                    <div className="flex items-center gap-2">
                      <GraduationCap className="w-4 h-4 text-[#FF00C8]" />
                      <span className="font-mono text-[9.5px] text-[#FF00C8] tracking-[0.2em] font-black uppercase">
                        {t('adaptive_controller', 'ADAPTIVE PEDAGOGY CONTROLLER')}
                      </span>
                    </div>
                    <p className="text-zinc-350 text-xs font-bold leading-normal uppercase mt-1.5">
                      {t('re_translate', 'Re-translate every explanation in the financial universe to match your specific learning level.')}
                    </p>
                  </div>

                  {/* 4 Category Selection Pills */}
                  <div className="flex flex-wrap gap-2 w-full md:w-auto shrink-0 justify-end">
                    {[
                      { id: 'kids', label: t('begin_mode', 'BEGINNER MODE'), tag: t('role_beginner_tag', 'Simple piggy bank analogies') },
                      { id: 'highschool', label: t('trader_mode', 'TRADER MODE'), tag: t('role_trader_tag', 'Tactical leverage & indicators') },
                      { id: 'college', label: t('analyst_mode', 'ANALYST MODE'), tag: t('role_analyst_tag', 'Valuation models & multiples') },
                      { id: 'researcher', label: t('economist_mode', 'ECONOMIST MODE'), tag: t('role_economist_tag', 'Sovereign debt & macro flows') }
                    ].map((mode) => {
                      const isActive = pedagogyMode === mode.id;
                      return (
                        <button
                          key={mode.id}
                          onClick={() => {
                            const newMode = mode.id as 'kids' | 'highschool' | 'college' | 'researcher';
                            setPedagogyMode(newMode);
                            const map: Record<'kids' | 'highschool' | 'college' | 'researcher', 'BEGINNER' | 'TRADER' | 'ANALYST' | 'ECONOMIST'> = {
                              'kids': 'BEGINNER',
                              'highschool': 'TRADER',
                              'college': 'ANALYST',
                              'researcher': 'ECONOMIST'
                            };
                            setCognitionPersona(map[newMode]);
                          }}
                          style={{
                            boxShadow: isActive ? '0 0 15px rgba(255, 0, 200, 0.3)' : 'none'
                          }}
                          className={`flex-1 md:flex-initial py-2 px-3.5 border rounded-xl flex flex-col text-left cursor-pointer transition-all duration-300 ${
                            isActive 
                              ? 'bg-black border-[#FF00C8] text-white font-black' 
                              : 'bg-white/[0.01] border-white/5 text-zinc-550 hover:text-zinc-300 hover:border-white/15'
                          }`}
                          title={mode.tag}
                        >
                          <span className="text-[10px] font-mono font-black tracking-wide leading-none">{mode.label}</span>
                          <span className={`text-[7.5px] font-sans mt-0.5 leading-none ${isActive ? 'text-[#FF00C8] font-bold' : 'text-zinc-550 font-medium'}`}>{mode.tag}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 3. CENTER SUB-NAVIGATION TABS BAR */}
                <div className="flex flex-wrap gap-1.5 p-1 bg-[#050912]/90 border border-white/5 rounded-2xl select-none z-10">
                  {[
                    { id: 'museum-lobby', label: 'MUSEUM LOBBY', desc: 'Sovereign Sectors Hub', icon: Home },
                    { id: 'company-blueprints', label: 'COMPANY BLUEPRINTS', desc: '10,000+ Stocks Database', icon: TrendingUp },
                    { id: 'economic-impact', label: 'ECONOMIC IMPACT LAB', desc: 'National Simulators Cockpits', icon: Layers },
                    { id: 'certified-academy', label: 'CERTIFIED ACADEMY', desc: 'Quizzes & Curriculums', icon: GraduationCap },
                    { id: 'glossary-vault', label: 'GLOSSARY VAULT', desc: 'Dictionary of Finance Terms', icon: BookOpen }
                  ].map((subTab) => {
                    const isSelected = indexSubTab === subTab.id;
                    const SubIcon = subTab.icon;
                    return (
                      <button
                        key={subTab.id}
                        onClick={() => setIndexSubTab(subTab.id as any)}
                        className={`flex-1 min-w-[130px] p-2.5 rounded-xl text-left flex items-center gap-3 transition-all cursor-pointer ${
                          isSelected 
                            ? 'bg-gradient-to-r from-purple-950/40 via-[#FF00C8]/10 to-transparent border border-[#FF00C8]/40 shadow-[0_0_12px_rgba(255,0,200,0.1)] text-white font-bold' 
                            : 'text-zinc-455 hover:text-white hover:bg-white/[0.01]'
                        }`}
                      >
                        <div className={`p-1.5 border rounded-lg ${isSelected ? 'border-[#FF00C8]/30 bg-black/40 text-[#FF00C8]' : 'border-transparent text-zinc-500'}`}>
                          <SubIcon className="w-3.5 h-3.5" />
                        </div>
                        <div className="flex flex-col leading-none">
                          <span className="text-[10px] font-mono font-black tracking-wider uppercase">{subTab.label}</span>
                          <span className="text-[8px] text-zinc-500 font-sans mt-0.5 font-medium">{subTab.desc}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* 4. DYNAMIC SUB-TAB CONTENT RENDER MATRIX */}
                {indexSubTab === 'museum-lobby' && (
                  <div className="grid grid-cols-1 lg:grid-cols-10 gap-6 select-none z-10 w-full animate-fadeIn mt-1">
                    
                    {/* Left Column: Category selector list (width 4/10) */}
                    <div className="lg:col-span-4 flex flex-col gap-4 text-left">
                      <div className="flex flex-col">
                        <span className="font-mono text-[9px] text-[#A3E635] tracking-[0.2em] font-extrabold uppercase leading-none mb-1.5">CLASS SIZING INDEX</span>
                        <h3 className="text-white font-black text-[18px] lg:text-[22px] tracking-tight leading-none uppercase">GLOBAL CAPITAL SECTORS</h3>
                      </div>

                      {/* Four deep select cards */}
                      <div className="flex flex-col gap-3">
                        {(['stocks', 'forex', 'commodities', 'macro'] as const).map((secKey) => {
                          const profile = SECTOR_PROFILES[secKey];
                          const isActive = activeSector === secKey;
                          return (
                            <div
                              key={secKey}
                              onClick={() => {
                                setActiveSector(secKey);
                              }}
                              style={{
                                borderColor: isActive ? '#FF00C8' : 'rgba(255, 255, 255, 0.05)',
                                boxShadow: isActive ? '0 0 15px rgba(255, 0, 200, 0.15)' : 'none'
                              }}
                              className="group p-4 bg-black/60 border rounded-2xl cursor-pointer hover:bg-black/80 hover:border-[#FF00C8]/50 transition-all duration-300 relative overflow-hidden"
                            >
                              <div className="absolute -right-8 -bottom-8 w-16 h-16 rounded-full blur-xl bg-[#FF00C8]/5" />
                              
                              <div className="flex items-center justify-between">
                                <span className={`text-[12.5px] font-sans font-black tracking-tight ${isActive ? 'text-[#FF00C8]' : 'text-white'}`}>
                                  {profile.title}
                                </span>
                                <span className="font-mono text-[8.5px] text-zinc-500 font-extrabold">TIER: {profile.scale.split('+')[0]}</span>
                              </div>

                              <div className="flex items-center justify-between mt-1 pt-1.5 border-t border-white/5">
                                <span className="text-[10px] text-zinc-450 font-sans font-semibold">
                                  {profile.settle}
                                </span>
                                <span className={`font-mono text-[9px] font-black ${isActive ? 'text-[#FF00C8] animate-pulse' : 'text-zinc-650'}`}>
                                  {isActive ? '● VIEW PROFILE ACTIVE' : 'SELECT ENGINE ➔'}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Right Column: Active Profile Detailed Panel (width 6/10) */}
                    <div className="lg:col-span-6 bg-black/85 border border-white/10 rounded-2xl p-5 hover:border-cyan-400/30 transition-all duration-500 flex flex-col gap-5 text-left relative overflow-hidden shadow-2xl">
                      
                      {/* Top bar indicators */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/5 pb-3">
                        <div className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 bg-[#FF00C8] rounded-full animate-ping" />
                          <span className="font-mono text-[9px] text-[#FF00C8] font-black tracking-[0.2em]">ACTIVE MARKET PROFILE</span>
                        </div>

                        <div className="flex gap-2 font-mono text-[8.5px]">
                          <span className="bg-white/5 border border-white/10 p-1 px-2.5 rounded-lg text-zinc-400 font-bold">SCALE: {SECTOR_PROFILES[activeSector].scale}</span>
                          <span className="bg-white/5 border border-white/10 p-1 px-2.5 rounded-lg text-cyan-400 font-black">SETTLE: {SECTOR_PROFILES[activeSector].settle}</span>
                        </div>
                      </div>

                      {/* Display Selected Title & jump-off button */}
                      <div className="flex items-center justify-between gap-3">
                        <h2 className="text-white text-xl lg:text-2xl font-black uppercase tracking-tight font-sans">
                          {SECTOR_PROFILES[activeSector].title}
                        </h2>
                        
                        <button
                          onClick={() => selectFileNode(SECTOR_PROFILES[activeSector].link)}
                          className="py-1 px-3 bg-[#0c223c] hover:bg-[#00D9FF] hover:text-black text-[#00D9FF] border border-[#00D9FF]/40 rounded-xl text-[9px] font-mono tracking-wider font-extrabold cursor-pointer transition-all"
                        >
                          LAUNCH FILE VIEWER ➔
                        </button>
                      </div>

                      {/* Translation Block with dynamic content */}
                      <div className="w-full bg-gradient-to-tr from-indigo-950/15 via-black/80 to-purple-950/10 p-4 rounded-xl border border-[#FF00C8]/20 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-1 bg-[#1f0514] border-l border-b border-[#FF00C8]/20 text-[7.5px] rounded-bl text-[#FF00C8] font-mono font-black tracking-wider uppercase select-none">
                          PÆDAGOGIK TRANSLATION • {pedagogyMode.toUpperCase()} MODE
                        </div>
                        
                        <span className="text-[12px] leading-relaxed font-sans text-zinc-100 font-semibold tracking-wide block mt-2">
                          {SECTOR_PROFILES[activeSector].translations[pedagogyMode]}
                        </span>
                      </div>

                      {/* 3 Metrics Cards Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {SECTOR_PROFILES[activeSector].metrics.map((metItem, idx) => (
                          <div key={idx} className="p-3 bg-white/[0.02] border border-white/5 rounded-xl flex flex-col gap-1 hover:border-cyan-500/10 hover:bg-white/[0.04] transition-all">
                            <span className="font-mono text-[8px] text-zinc-500 font-extrabold uppercase leading-none tracking-wide">{metItem.label}</span>
                            <span className="text-[13.5px] text-[#00D9FF] font-sans font-black tracking-tight leading-none uppercase mt-1">
                              {metItem.value}
                            </span>
                            <span className="text-[9px] text-zinc-400 font-sans mt-0.5 leading-tight font-medium">
                              {metItem.desc}
                            </span>
                          </div>
                        ))}
                      </div>

                    </div>
                  </div>
                )}

                {/* If indexSubTab === 'company-blueprints' (Render BENTO GRID) */}
                {indexSubTab === 'company-blueprints' && (
                  <div className="flex flex-col gap-6 w-full animate-fadeIn mt-1 text-left">
                    <div className="flex flex-col text-left mb-1">
                      <span className="font-mono text-[9px] text-zinc-500 font-black tracking-wider uppercase mb-1.5">Syllabus Index Portals</span>
                      <h4 className="text-white text-lg font-black uppercase">THE CORE FILE STRUCTURE BENTO</h4>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                      {[
                        { id: 'stocks', name: 'Stocks Directory', icon: TrendingUp, desc: 'Analyze blue chip corporate equities, stock indexes, indices volatility, and global capital indices.', link: 'encyclopedia/markets/stocks.html', cta: 'EXPLORE STOCKS ➔', color: 'text-cyan-400', isRow1: true },
                        { id: 'crypto', name: 'Crypto Ecosystems', icon: Coins, desc: 'Track decentralized trust currencies, trust-less tokens, cryptographic coins, and digital protocols.', link: 'encyclopedia/markets/crypto.html', cta: 'EXPLORE CRYPTO ➔', color: 'text-cyan-400', isRow1: true },
                        { id: 'forex', name: 'Forex Reservoirs', icon: DollarSign, desc: 'Scan bilateral sovereign reserve currencies, carry currency trades, and central bank asset swap channels.', link: 'encyclopedia/markets/forex.html', cta: 'EXPLORE FOREX ➔', color: 'text-cyan-400', isRow1: true },
                        { id: 'commodities', name: 'Commodities Real', icon: Boxes, desc: 'Assess hard real physical reserves, precious metals bullion, crude oil volumes, and vital grains.', link: 'encyclopedia/markets/commodities.html', cta: 'EXPLORE COMMODITIES ➔', color: 'text-cyan-400', isRow1: true },
                        { id: 'economy', name: 'Macro Economy', icon: Landmark, desc: 'Examine central banks, debt currency systems, interest rates matrix, and national inflation prints.', link: 'economy.html', cta: 'EXPLORE ECONOMY ➔', color: 'text-cyan-400', isRow1: true },
                        { id: 'education', name: 'Education Center', icon: GraduationCap, desc: 'Warp through collegiate syllabus, math macro formulas, micro trivia, and intellectual memory study.', link: 'education.html', cta: 'START LEARNING ➔', color: 'text-pink-500', isRow1: false },
                        { id: 'sectors', name: 'Sector Intelligence', icon: Cpu, desc: 'Explore extreme ultraviolet lithography, silicon compute hardware, technology hubs, and bank cycles.', link: 'sectors.html', cta: 'EXPLORE SECTORS ➔', color: 'text-pink-500', isRow1: false },
                        { id: 'calendar', name: 'Economic Calendar', icon: Calendar, desc: 'Scan historical macroeconomic triggers, interest meetings schedules, US labor reports, and CPI prints.', link: 'economic-memory-matrix.html', cta: 'VIEW CALENDAR ➔', color: 'text-pink-500', isRow1: false },
                        { id: 'psychology', name: 'Market Psychology', icon: Brain, desc: 'Unlock structural crowd indices tracking extreme greed peaks, deep cascade panics, and margin runs.', link: 'market-psychology.html', cta: 'EXPLORE SENTIMENT ➔', color: 'text-pink-500', isRow1: false }
                      ].filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase())).map((card) => {
                        const IconComponent = card.icon;
                        return (
                          <div
                            key={card.id}
                            onClick={() => selectFileNode(card.link)}
                            className={`group flex flex-col justify-between p-4 bg-gradient-to-br from-neutral-950/90 to-neutral-800/20 border ${
                              card.isRow1 
                                ? 'border-cyan-500/20 hover:border-cyan-400/70 hover:shadow-[0_0_20px_rgba(0,217,255,0.12)]' 
                                : 'border-pink-500/20 hover:border-pink-500/70 hover:shadow-[0_0_20px_rgba(255,0,200,0.12)]'
                            } rounded-2xl cursor-pointer transition-all duration-300 transform hover:-translate-y-1 relative overflow-hidden min-h-[180px] text-left`}
                          >
                            <div className="absolute -right-8 -bottom-8 w-16 h-16 rounded-full blur-2xl bg-white/[0.01]" />
                            <div className="space-y-3 relative z-10 leading-normal">
                              <div className="flex items-center justify-between">
                                <div className={`p-2 bg-neutral-950 border ${card.isRow1 ? 'border-cyan-500/30' : 'border-pink-500/30'} rounded-xl`}>
                                  <IconComponent className={`w-4 h-4 ${card.color}`} />
                                </div>
                                <span className="text-[8.5px] font-mono text-zinc-550 leading-none font-bold">ID: {card.id.toUpperCase()}</span>
                              </div>
                              <div className="space-y-1 leading-normal">
                                <h3 className={`font-sans font-extrabold text-[13.5px] tracking-tight leading-none ${card.id === 'crypto' ? 'text-[#ff5a1f] drop-shadow-[0_0_8px_rgba(255,90,31,0.5)]' : 'text-white'}`}>{card.name}</h3>
                                <p className="text-zinc-400 text-[10.5px] leading-tight line-clamp-3 font-semibold">{card.desc}</p>
                              </div>
                            </div>
                            <div className="flex items-center justify-between pt-2 relative z-10 border-t border-white/5 mt-2 font-mono text-[10px] font-black uppercase tracking-wider">
                              <span className={`${card.color} group-hover:translate-x-1.5 transition-transform duration-300`}>
                                {card.cta}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* If indexSubTab === 'economic-impact' (Interactive Simulators jump) */}
                {indexSubTab === 'economic-impact' && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5 select-none z-10 w-full animate-fadeIn mt-1 text-left">
                    <div className="col-span-full mb-1">
                      <span className="font-mono text-[9px] text-[#A3E635] tracking-wider uppercase mb-1.5 block">Experimental Lab</span>
                      <h4 className="text-white text-lg font-black uppercase">MACROECONOMIC VOLUMETRIC SYSTEMS</h4>
                    </div>
                    {[
                      { title: 'FEDERAL RES RESERVES COCKPIT', desc: 'Sovereign interest adjustment nodes, Quantitative Easing policy matrices, and currency liquidity flows.', file: 'encyclopedia/economy/federal-reserve.html', icon: Settings, color: 'text-cyan-400' },
                      { title: 'CIVILIZATION TREASURY HARBOUR', desc: 'National debt cycles, sovereign bond yields, yield curve slopes, and central bank asset swap lines.', file: 'civilization-engine.html', icon: Layers, color: 'text-purple-400' },
                      { title: 'INFLATION SIMULATION LAB', desc: 'Global currency dilution mechanics, historical inflation spikes, and purchasing power erosion matrices.', file: 'encyclopedia/economy/inflation.html', icon: AlertTriangle, color: 'text-amber-400' }
                    ].map((simLink, idx) => {
                      const LinkIcon = simLink.icon;
                      return (
                        <div
                          key={idx}
                          onClick={() => selectFileNode(simLink.file)}
                          className="p-5 bg-black/60 border border-white/10 hover:border-cyan-400/50 rounded-2xl cursor-pointer hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between gap-4"
                        >
                          <div className="flex flex-col gap-2">
                            <div className="p-2 w-fit bg-neutral-900 border border-white/10 rounded-xl">
                              <LinkIcon className={`w-5 h-5 ${simLink.color}`} />
                            </div>
                            <span className="font-mono text-[11px] font-black uppercase tracking-tight text-white mt-1">{simLink.title}</span>
                            <span className="text-[11px] text-zinc-400 leading-relaxed font-semibold">{simLink.desc}</span>
                          </div>
                          <span className={`${simLink.color} font-mono text-[9.5px] font-black uppercase mt-3`}>LAUNCH COMPONENT ➔</span>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* If indexSubTab === 'certified-academy' */}
                {indexSubTab === 'certified-academy' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 select-none z-10 w-full animate-fadeIn mt-1 text-left">
                    <div className="col-span-full mb-1">
                      <span className="font-mono text-[9px] text-[#FF00C8] tracking-wider uppercase mb-1.5 block">Academic Portal</span>
                      <h4 className="text-white text-lg font-black uppercase">FINANCIAL STUDY CORRIDOR</h4>
                    </div>
                    {[
                      { title: 'COLLEGIATE EDUCATION MATRIX', desc: 'Step-by-step rigorous curriculum from beginner basics up to post-doctoral economics modeling.', file: 'education.html', icon: GraduationCap, color: 'text-pink-500' },
                      { title: 'KIDS MODE ECONOMIC APPRENTICESHIP', desc: 'Simple interactive piggy bank, supply store, and candy shop models designed for easy comprehension.', file: 'kids-mode.html', icon: Trophy, color: 'text-yellow-500' }
                    ].map((acadLink, idx) => {
                      const AcadIcon = acadLink.icon;
                      return (
                        <div
                          key={idx}
                          onClick={() => selectFileNode(acadLink.file)}
                          className="p-5 bg-black/60 border border-white/10 hover:border-[#FF00C8]/50 rounded-2xl cursor-pointer hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between gap-4"
                        >
                          <div className="flex flex-col gap-2">
                            <div className="p-2 w-fit bg-neutral-900 border border-white/10 rounded-xl">
                              <AcadIcon className={`w-5 h-5 ${acadLink.color}`} />
                            </div>
                            <span className="font-mono text-[11px] font-black uppercase tracking-tight text-white mt-1">{acadLink.title}</span>
                            <span className="text-[11px] text-zinc-400 leading-relaxed font-semibold">{acadLink.desc}</span>
                          </div>
                          <span className={`${acadLink.color} font-mono text-[9.5px] font-black uppercase mt-3`}>LAUNCH COMPONENT ➔</span>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* If indexSubTab === 'glossary-vault' */}
                {indexSubTab === 'glossary-vault' && (
                  <div className="flex flex-col gap-5 select-none z-10 w-full animate-fadeIn mt-1 text-left bg-black/60 border border-white/10 rounded-2xl p-5">
                    <div className="flex flex-col">
                      <span className="font-mono text-[9px] text-[#00D9FF] tracking-wider uppercase mb-1.5">Dictionary Index</span>
                      <h4 className="text-white text-lg font-black uppercase">THE DICTIONARY SECURE VAULT</h4>
                    </div>
                    <p className="text-zinc-400 text-xs leading-relaxed font-semibold max-w-xl">
                      Access a massive interactive definitions catalog of core financial words, math equations, and regulatory concepts. Fully searchable with swift response times.
                    </p>
                    <div className="flex flex-wrap gap-3 mt-2">
                      <button
                        onClick={() => selectFileNode('glossary.html')}
                        className="py-2.5 px-5 bg-[#00D9FF] hover:bg-[#00b2ff] text-neutral-950 rounded-xl font-mono text-[10.5px] font-black uppercase cursor-pointer transition-all"
                      >
                        SEARCH THE DICTIONARY GLOSSARY ➔
                      </button>
                      <button
                        onClick={() => selectFileNode('master-index.html')}
                        className="py-2.5 px-5 bg-black/40 border border-white/15 text-white hover:border-cyan-400 rounded-xl font-mono text-[10.5px] font-bold uppercase cursor-pointer transition-all"
                      >
                        BROWSE STOCK SYMBOLS DATABASE ➔
                      </button>
                    </div>
                  </div>
                )}

                {/* 5. PERMANENT GRAND ACADEMIC BLUEPRINTS ROW */}
                <div className="col-span-full mt-8 border-t border-white/5 pt-8 select-none z-10 w-full text-left">
                  <div className="flex flex-col mb-5">
                    <span className="font-mono text-[9px] text-[#FF00C8] tracking-[0.25em] font-black uppercase mb-1 animate-pulse">
                      ★ ADVANCED SYSTEMS RESEARCH SERIES
                    </span>
                    <h3 className="text-white font-black text-xl tracking-tight uppercase leading-none">
                      THE FOUR ACADEMIC CHASSIS BLUEPRINTS
                    </h3>
                    <p className="text-zinc-400 text-xs mt-2 max-w-3xl leading-relaxed font-semibold">
                      Unlock full systemic blueprints built by the primary educator. Dive deep into global exchanges, Nixon-era paper monetary shocks, cross-asset correlation loops, and soft agricultural grains head-to-head biomes.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                      {
                        file: 'encyclopedia/blueprints/exchanges.html',
                        title: '1. EXCHANGES ATLAS',
                        desc: 'Map 20+ active international matching rings (WSE, NYSE, CME vs. Nasdaq) with transaction models and pedagogical translations.',
                        accent: 'border-cyan-500/20 text-cyan-400 hover:border-cyan-400',
                        badge: 'Exchanges Atlas'
                      },
                      {
                        file: 'encyclopedia/blueprints/gold-shock.html',
                        title: '2. NIXON GOLD STANDARD SHOCK',
                        desc: 'The August 1971 gold peg suspension chronology. Features gold-depletion simulation & real fiat inflation calculator.',
                        accent: 'border-yellow-500/20 text-yellow-500 hover:border-yellow-400',
                        badge: 'Bretton Woods 1971'
                      },
                      {
                        file: 'encyclopedia/blueprints/commodity-correlations.html',
                        title: '3. INTERMARKET CORRELATIONS',
                        desc: 'Interact with mathematical price models of gold, silver, oil & national trading currencies to see cost overhead multipliers.',
                        accent: 'border-emerald-500/20 text-emerald-400 hover:border-emerald-400',
                        badge: 'Pricing Organism'
                      },
                      {
                        file: 'encyclopedia/blueprints/soft-commodities.html',
                        title: '4. SOFT GRAINS BIOMELAB',
                        desc: 'Contrast wheat and soybeans head-to-head across protein counts, nitrogen Rhizobia fixation, El Niño droughts & CME specs.',
                        accent: 'border-lime-500/20 text-lime-400 hover:border-lime-400',
                        badge: 'Wheat vs. Soy'
                      }
                    ].map((bp, i) => (
                      <div 
                        key={i}
                        onClick={() => selectFileNode(bp.file)}
                        className={`p-5 bg-neutral-950/60 border ${bp.accent.split(' ')[0]} rounded-2xl hover:bg-black hover:border-white/20 transition-all duration-300 flex flex-col justify-between items-start cursor-pointer group shrink-0 relative overflow-hidden`}
                      >
                        <div className="space-y-2">
                          <span className="font-mono text-[8.5px] px-2 py-0.5 bg-zinc-800/80 rounded text-zinc-300 uppercase font-black tracking-wider group-hover:text-white transition-colors">{bp.badge}</span>
                          <h4 className="text-white font-black text-sm uppercase tracking-tight group-hover:text-[#FFAAFF] transition-colors">{bp.title}</h4>
                          <p className="text-zinc-400 text-[11px] leading-relaxed font-semibold">{bp.desc}</p>
                        </div>
                        <span className="font-mono text-[9px] font-black uppercase mt-4 text-[#FF00C8] group-hover:translate-x-1 transition-transform block">LAUNCH BLUEPRINT ➔</span>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            ) : null}

            {/* 2. MIDDLE VIEWPORT: IMMERSIVE LEARNING CONTENT & SELECTION DECKS (Gets full widescreen prominence!) */}
            <div className="w-full max-w-7xl mx-auto flex-1 flex flex-col gap-6 z-10" id="middle-content">
              
              {/* IF VIEWMODE EQUALS SOURCE VIEW (MONOSPACE MOCK CODE EDITOR) (Gets beautiful broad space!) */}
              {viewMode === 'code' ? (
                <div className="bg-[#02040b]/90 border border-white/10 rounded-2xl p-5 shadow-2xl relative overflow-hidden font-mono text-zinc-350">
                  <div className="absolute top-0 right-0 p-2 bg-neutral-900 border-l border-b border-white/15 text-[8.5px] rounded-bl-lg text-zinc-500 font-bold tracking-wider uppercase select-none">ASCII Source View</div>
                  {/* Styled Scrollable HTML markup block */}
                  <div className="custom-scrollbar overflow-x-auto max-h-[550px] pr-2 text-xs leading-relaxed">
                    {highlightHtmlSource(getRawFileContent(activeFile))}
                  </div>
                </div>
              ) : (
                /* RENDERS THE DETAILED LEARNING VIEW SYSTEM */
                <div className="flex flex-col gap-6">
                  {/* IF NOT index.html, we optionally show a breadcrumb strip */}
                  {activeFile !== 'index.html' && (
                    <div className="flex items-center justify-between pb-3 border-b border-white/5 mb-2 shrink-0 font-mono text-[10px] text-zinc-500 uppercase select-none">
                      <span className="text-[#00D9FF] font-extrabold">Active Node:</span>
                      <span className="text-zinc-400">{activeFile}</span>
                    </div>
                  )}

                  {/* 1. index.html (CLEAN PORTAL LAYOUT FULLY EMBEDDED ABOVE) */}
                  {activeFile === 'index.html' && false && (() => {
                    // Filter the 10 requested bento grid cards based on searchQuery
                    const allCards = [
                      { id: 'stocks', name: 'Stocks Directory', icon: TrendingUp, desc: 'Analyze blue chip corporate equities, stock indexes, indices volatility, and global capital indices.', link: 'encyclopedia/markets/stocks.html', cta: 'EXPLORE STOCKS ➔', color: 'text-cyan-450', glow: 'shadow-[0_0_15px_rgba(0,217,255,0.15)]', isRow1: true },
                      { id: 'crypto', name: 'Crypto Ecosystems', icon: Coins, desc: 'Track decentralized trust currencies, trust-less tokens, cryptographic coins, and digital protocols.', link: 'encyclopedia/markets/crypto.html', cta: 'EXPLORE CRYPTO ➔', color: 'text-cyan-450', glow: 'shadow-[0_0_15px_rgba(0,217,255,0.15)]', isRow1: true },
                      { id: 'forex', name: 'Forex Reservoirs', icon: DollarSign, desc: 'Scan bilateral sovereign reserve currencies, carry currency trades, and central bank asset swap channels.', link: 'encyclopedia/markets/forex.html', cta: 'EXPLORE FOREX ➔', color: 'text-cyan-450', glow: 'shadow-[0_0_15px_rgba(0,217,255,0.15)]', isRow1: true },
                      { id: 'commodities', name: 'Commodities Real', icon: Boxes, desc: 'Assess hard real physical reserves, precious metals bullion, crude oil volumes, and vital grains.', link: 'encyclopedia/markets/commodities.html', cta: 'EXPLORE COMMODITIES ➔', color: 'text-cyan-450', glow: 'shadow-[0_0_15px_rgba(0,217,255,0.15)]', isRow1: true },
                      { id: 'economy', name: 'Macro Economy', icon: Landmark, desc: 'Examine central banks, debt currency systems, interest rates matrix, and national inflation prints.', link: 'economy.html', cta: 'EXPLORE ECONOMY ➔', color: 'text-cyan-450', glow: 'shadow-[0_0_15px_rgba(0,217,255,0.15)]', isRow1: true },
                      { id: 'education', name: 'Education Center', icon: GraduationCap, desc: 'Warp through collegiate syllabus, math macro formulas, micro trivia, and intellectual memory study.', link: 'education.html', cta: 'START LEARNING ➔', color: 'text-pink-450', glow: 'shadow-[0_0_15px_rgba(255,0,200,0.15)]', isRow1: false },
                      { id: 'sectors', name: 'Sector Intelligence', icon: Cpu, desc: 'Explore extreme ultraviolet lithography, silicon compute hardware, technology hubs, and bank cycles.', link: 'sectors.html', cta: 'EXPLORE SECTORS ➔', color: 'text-pink-450', glow: 'shadow-[0_0_15px_rgba(255,0,200,0.15)]', isRow1: false },
                      { id: 'calendar', name: 'Economic Calendar', icon: Calendar, desc: 'Scan historical macroeconomic triggers, interest meetings schedules, US labor reports, and CPI prints.', link: 'economic-memory-matrix.html', cta: 'VIEW CALENDAR ➔', color: 'text-pink-450', glow: 'shadow-[0_0_15px_rgba(255,0,200,0.15)]', isRow1: false },
                      { id: 'psychology', name: 'Market Psychology', icon: Brain, desc: 'Unlock structural crowd indices tracking extreme greed peaks, deep cascade panics, and margin runs.', link: 'market-psychology.html', cta: 'EXPLORE SENTIMENT ➔', color: 'text-pink-450', glow: 'shadow-[0_0_15px_rgba(255,0,200,0.15)]', isRow1: false }
                    ];

                    const filteredCards = allCards.filter(card => 
                      card.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                      card.desc.toLowerCase().includes(searchQuery.toLowerCase())
                    );

                    // Inline simulation helper for Chat
                    const handleAskAi = () => {
                      if (!aiChatQuery.trim()) return;
                      const userMsg = aiChatQuery;
                      const updatedChat = [...aiChatResponses, { sender: 'user' as const, text: userMsg }];
                      setAiChatResponses(updatedChat);
                      setAiChatQuery('');
                      setIsAiLoading(true);
                      
                      setTimeout(() => {
                        let aiResponse = "Fascinating financial inquiry! I recommend navigating to the corresponding module in the main encyclopedia grid to study these asset relationships.";
                        const q = userMsg.toLowerCase();
                        if (q.includes('stock') || q.includes('share') || q.includes('equity') || q.includes('nvidia') || q.includes('apple')) {
                          aiResponse = "Equities represent fractional claims on productive corporate capital. In high-liquidity regimes, they expand rapidly. Open the 'Stocks Directory' plate to access the Order Book simulator.";
                        } else if (q.includes('crypto') || q.includes('bitcoin') || q.includes('btc') || q.includes('eth')) {
                          aiResponse = "Cryptocurrencies act as high-leverage beta liquidity multipliers. When the global credit system expands, they capture disproportionate asset inflows. Click 'Explore Crypto' to view the digital protocols database.";
                        } else if (q.includes('forex') || q.includes('currency') || q.includes('yen') || q.includes('carry')) {
                          aiResponse = "The Foreign Exchange network coordinates global savings flows. Use the 'Forex Reservoirs' tab to evaluate interest rate differentials and sovereign carrying rates.";
                        } else if (q.includes('gold') || q.includes('oil') || q.includes('wheat') || q.includes('commodity')) {
                          aiResponse = "Hard commodities provide tangible collateral. During inflationary spirals and central bank expansion, gold and crude oil appreciate relative to paper currencies. Open the 'Commodities Real' block.";
                        } else if (q.includes('interest') || q.includes('rate') || q.includes('inflation') || q.includes('fed') || q.includes('tightening')) {
                          aiResponse = "Interest rate policies set the cost of capital. Try toggling our 'Observer Cockpit Simulator' between 'Expansion', 'Inflation', and 'Panic' to watch real-time assets react instantly!";
                        } else if (q.includes('ai') || q.includes('formula') || q.includes('equation') || q.includes('learn')) {
                          aiResponse = "ClearPath represents an educational sanctuary. Open the 'AI Study Center' or 'Education Center' to study collegiate-level mathematical models of macroeconomics.";
                        }
                        
                        setAiChatResponses(prev => [...prev, { sender: 'assistant' as const, text: aiResponse }]);
                        setIsAiLoading(false);
                      }, 900);
                    };

                    return (
                      <div className="flex flex-col gap-6 w-full animate-fadeIn">
                        
                        {/* BENTO GRID (10 custom-styled slots, matching rows) */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                            {filteredCards.length > 0 ? (
                              filteredCards.map((card) => {
                                const IconComponent = card.icon;
                                return (
                                  <div
                                    key={card.id}
                                    onClick={() => selectFileNode(card.link)}
                                    className={`group flex flex-col justify-between p-5 bg-gradient-to-br from-neutral-950/90 to-neutral-900/60 border ${
                                      card.isRow1 
                                        ? 'border-cyan-500/20 hover:border-cyan-400/70 hover:shadow-[0_0_20px_rgba(0,217,255,0.12)]' 
                                        : 'border-pink-500/20 hover:border-pink-500/70 hover:shadow-[0_0_20px_rgba(255,0,200,0.12)]'
                                    } rounded-2xl cursor-pointer transition-all duration-300 transform hover:-translate-y-1 relative overflow-hidden min-h-[185px]`}
                                  >
                                    {/* Accent radial backing light */}
                                    <div className={`absolute -right-8 -bottom-8 w-16 h-16 rounded-full blur-2xl ${
                                      card.isRow1 ? 'bg-[#00D9FF]/10' : 'bg-[#FF00C8]/10'
                                    }`} />

                                    <div className="space-y-3 relative z-10">
                                      <div className="flex items-center justify-between">
                                        <div className={`p-2 bg-neutral-950 border ${
                                          card.isRow1 ? 'border-cyan-500/30' : 'border-pink-500/30'
                                        } rounded-xl`}>
                                          <IconComponent className={`w-4.5 h-4.5 ${card.color}`} />
                                        </div>
                                        <span className="text-[8.5px] font-mono text-zinc-550 leading-none font-bold">ID: {card.id.toUpperCase()}</span>
                                      </div>
                                      <div className="space-y-1">
                                        <h3 className="font-sans font-extrabold text-[14.5px] text-white tracking-tight leading-none group-hover:text-white transition-colors">{card.name}</h3>
                                        <p className="text-zinc-400 text-[11.5px] leading-normal line-clamp-3 font-semibold font-sans">{card.desc}</p>
                                      </div>
                                    </div>

                                    <div className="flex items-center justify-between pt-2.5 relative z-10 border-t border-white/5 mt-2.5">
                                      <span className={`font-mono text-[10.5px] font-black uppercase tracking-wider ${card.color} group-hover:translate-x-1.5 transition-transform duration-300 flex items-center gap-1`}>
                                        {card.cta}
                                      </span>
                                    </div>
                                  </div>
                                );
                              })
                            ) : (
                              <div className="col-span-full border border-dashed border-white/15 p-12 text-center rounded-2xl bg-[#02050e]/60">
                                <HelpCircle className="w-10 h-10 text-zinc-500 mx-auto mb-3 animate-bounce" />
                                <span className="font-sans text-sm text-zinc-450 block font-bold">No database nodes matched your filter</span>
                                <button onClick={() => setSearchQuery('')} className="mt-2 text-xs text-cyan-400 hover:underline">Clear Search Filter</button>
                              </div>
                            )}
                          </div>

                          {/* THE FIVE PILLARS FOOTER STRIP */}
                          <div className="mt-4 bg-[#02050e]/95 border border-white/10 rounded-2xl py-4.5 px-6 grid grid-cols-2 md:grid-cols-5 gap-4 shadow-lg select-none">
                            {[
                              { label: 'BUILT FOR EVERYONE', desc: 'Traders, Economists, Scholars', icon: Users, color: 'text-cyan-400' },
                              { label: 'ALL COGNITIVE LEVELS', desc: 'Beginner to Collegiate Matrix', icon: Award, color: 'text-pink-500' },
                              { label: 'QUANT ANALYTICS ENGINE', desc: 'Scientific Asset Research', icon: Sparkles, color: 'text-purple-400' },
                              { label: 'SYSTEMATIC WRITING', desc: 'Comprehensive Real Coverage', icon: BookOpen, color: 'text-emerald-400' },
                              { label: 'DYNAMIC SIMULATORS', desc: 'Live Physics Orderbooks', icon: Compass, color: 'text-amber-400' }
                            ].map((pillar, i) => {
                              const PilIcon = pillar.icon;
                              return (
                                <div key={i} className="flex flex-col gap-1 text-center md:text-left">
                                  <div className="flex items-center gap-1.5 justify-center md:justify-start">
                                    <PilIcon className={`w-3.5 h-3.5 ${pillar.color}`} />
                                    <span className="font-mono text-[9.5px] font-black tracking-wider text-white leading-none">{pillar.label}</span>
                                  </div>
                                  <span className="text-zinc-400 text-[10.5px] font-sans font-semibold leading-normal">{pillar.desc}</span>
                                </div>
                              );
                            })}
                          </div>

                        </div>
                      );
                    })()}
                    <div className="mt-2">
                      <ClearPathTraderPortal variant="banner" />
                    </div>

                  {/* 2. markets.html (MARKETS HUB WITH STOCKS, FOREX, COMMODITIES OVERVIEWS) */}
                  {activeFile === 'markets.html' && (
                    <MarketsDirectory onSelectFile={selectFileNode} />
                  )}

                  {/* 3. economy.html (CINEMATIC HISTORICAL CORE & CENTRAL BANK SIMULATOR) */}
                  {activeFile === 'economy.html' && (
                    <div className="flex flex-col gap-6 font-sans select-text">
                      
                      {/* IMMERSIVE EXHIBIT BANNER */}
                      <div className="p-6 bg-gradient-to-r from-indigo-950/40 via-[#00051e]/65 to-black/40 border border-[#00D9FF]/20 rounded-3xl relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div className="absolute top-0 right-0 w-[300px] h-full bg-gradient-to-l from-[#00D9FF]/5 to-transparent pointer-events-none" />
                        <div>
                          <span className="text-[9.5px] font-mono text-[#00D9FF] font-black uppercase tracking-[0.25em] block mb-1">Interactive Exhibition Hall</span>
                          <h3 className="text-white font-extrabold text-lg flex items-center gap-2">
                            <Landmark className="text-[#00D9FF] w-5 h-5 animate-pulse" />
                            The Cinematic Civilization Timeline & Monetary Exhibit
                          </h3>
                          <p className="text-zinc-400 text-xs mt-1">Immerse yourself inside seven decades of sovereign currency indices, interest rate shocks, and global liquidity tides.</p>
                        </div>
                        <div className="flex gap-2 shrink-0 select-none">
                          <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-full font-mono text-[9px] text-zinc-400 tracking-wider">MUSEUM DESK_B</span>
                          <span className="px-3 py-1 bg-[#FF00C8]/10 border border-[#FF00C8]/20 rounded-full font-mono text-[9px] text-[#FF00C8] tracking-wider animate-pulse">LIVE EXPOSITION</span>
                        </div>
                      </div>

                      {/* CINEMATIC TIMELINE CONTROLS AND DETAILS */}
                      <div className="p-8 bg-black/65 border border-white/10 rounded-4xl relative overflow-hidden flex flex-col gap-6" style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.6)' }}>
                        
                        {/* Timeline Header nodes */}
                        <div className="flex flex-col gap-4 border-b border-white/5 pb-6">
                          <div className="flex justify-between items-center">
                            <span className="text-[10px] font-mono text-zinc-500 font-bold tracking-widest uppercase">Select historical epoch matrix:</span>
                            <span className="text-[10px] font-mono text-[#00D9FF] font-bold uppercase tracking-wider bg-[#00D9FF]/10 px-2.5 py-0.5 rounded-md">Epoch 0{selectedEraIdx + 1} of 0{macroEras.length}</span>
                          </div>
                          
                          {/* Chronological Grid buttons */}
                          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 select-none">
                            {macroEras.map((era, index) => {
                              const isActive = selectedEraIdx === index;
                              return (
                                <button
                                  key={era.year}
                                  onClick={() => setSelectedEraIdx(index)}
                                  className={`p-3.5 rounded-xl border text-left transition-all relative flex flex-col gap-1 cursor-pointer group ${isActive ? 'bg-[#00D9FF]/10 border-[#00D9FF] text-white shadow-[0_0_15px_rgba(0,217,255,0.15)]' : 'border-white/5 bg-white/[0.01] hover:bg-white/[0.04] text-zinc-400 hover:text-zinc-200'}`}
                                >
                                  <span className="font-mono text-xs font-black tracking-widest leading-none block">{era.year}</span>
                                  <span className="text-[9.5px] truncate font-semibold block mt-0.5">{era.eraName.split('&')[0].split(' ')[0]}</span>
                                  {isActive && <div className="absolute bottom-1.5 right-2 w-1 h-1 bg-[#00D9FF] rounded-full" />}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* Immersive Exhibit Board Grid */}
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch relative">
                          
                          {/* Left Panel: Historical Context data and metrics */}
                          <div className="lg:col-span-7 flex flex-col gap-6 justify-between">
                            <div className="flex flex-col gap-4">
                              <div className="flex items-center gap-2">
                                <span className="p-1 px-2.5 bg-zinc-800 border border-zinc-700 text-amber-500 font-mono text-[9px] font-black rounded-lg uppercase tracking-wider">
                                  Year {macroEras[selectedEraIdx].year}
                                </span>
                                <span className={`text-[9px] font-mono font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${macroEras[selectedEraIdx].severity === 'EXTREME' ? 'bg-red-500/10 text-red-400 border border-red-500/25 animate-pulse' : 'bg-amber-500/10 text-amber-400 border border-amber-500/25'}`}>
                                  Stress: {macroEras[selectedEraIdx].severity}
                                </span>
                              </div>

                              <h4 className="text-white font-black text-xl leading-snug tracking-tight">
                                {macroEras[selectedEraIdx].eraName}
                              </h4>

                              <p className="text-zinc-400 font-mono text-[10.5px] leading-relaxed tracking-wide italic border-l-2 border-[#00D9FF]/40 pl-3">
                                "{macroEras[selectedEraIdx].tagline}"
                              </p>

                              <p className="text-zinc-300 text-xs leading-relaxed mt-2 pl-1">
                                {macroEras[selectedEraIdx].summary}
                              </p>
                            </div>

                            {/* Gauges indicators */}
                            <div className="grid grid-cols-3 gap-3 border-t border-white/5 pt-6 select-none">
                              {/* Gauge 1 */}
                              <div className="p-3 bg-black/40 border border-white/5 rounded-xl flex flex-col justify-between">
                                <span className="text-[8px] font-mono text-zinc-500 font-black uppercase block tracking-wider">FED RATE</span>
                                <span className="text-white font-mono text-sm font-black mt-2 block">{macroEras[selectedEraIdx].fedFundsRate}</span>
                                <div className="w-full bg-neutral-900 h-1 rounded overflow-hidden mt-2">
                                  <div className="bg-[#00D9FF] h-full" style={{ width: `${Math.min(parseInt(macroEras[selectedEraIdx].fedFundsRate) * 5, 100)}%` }} />
                                </div>
                              </div>
                              {/* Gauge 2 */}
                              <div className="p-3 bg-black/40 border border-white/5 rounded-xl flex flex-col justify-between">
                                <span className="text-[8px] font-mono text-zinc-500 font-black uppercase block tracking-wider">USD INDEX (DXY)</span>
                                <span className="text-[#FF00C8] font-mono text-sm font-black mt-2 block">{macroEras[selectedEraIdx].dxyLevel}</span>
                                <div className="w-full bg-neutral-900 h-1 rounded overflow-hidden mt-2">
                                  <div className="bg-[#FF00C8] h-full" style={{ width: `${Math.max(20, (parseFloat(macroEras[selectedEraIdx].dxyLevel) - 70) * 2)}%` }} />
                                </div>
                              </div>
                              {/* Gauge 3 */}
                              <div className="p-3 bg-black/40 border border-white/5 rounded-xl flex flex-col justify-between">
                                <span className="text-[8px] font-mono text-zinc-500 font-black uppercase block tracking-wider font-bold">GOLD PRICE</span>
                                <span className="text-amber-400 font-mono text-[11px] font-black mt-2 block truncate">{macroEras[selectedEraIdx].goldPricePrice}</span>
                                <div className="w-full bg-neutral-900 h-1 rounded overflow-hidden mt-2">
                                  <div className="bg-amber-400 h-full" style={{ width: '45%' }} />
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Right Panel: Interactive Era Catalyst Graphical Canvas */}
                          <div className="lg:col-span-5 bg-gradient-to-b from-[#050b18]/60 to-black/60 border border-white/5 rounded-3xl p-6 flex flex-col justify-between items-stretch overflow-hidden relative min-h-[300px]">
                            
                            {/* Cosmic background mesh */}
                            <div className="absolute inset-0 bg-grid-[#00D9FF]/[0.01] pointer-events-none" />
                            
                            {/* Selected Era Atmospheric Glow */}
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 rounded-full blur-[80px] pointer-events-none opacity-40 transition-all duration-1000"
                              style={{
                                backgroundColor: selectedEraIdx === 0 ? '#EAB308' : selectedEraIdx === 1 ? '#EF4444' : selectedEraIdx === 2 ? '#EC4899' : selectedEraIdx === 3 ? '#22C55E' : selectedEraIdx === 4 ? '#A855F7' : '#06B6D4'
                              }}
                            />

                            <div className="relative z-10">
                              <span className="text-[8.5px] font-mono text-zinc-400 font-black tracking-widest uppercase block border-b border-white/5 pb-2">DYNAMIC CATALYST EMULATOR</span>
                              
                              {/* Era Specific Graphics */}
                              <div className="h-32 my-6 flex items-center justify-center relative">
                                
                                {/* 1971: Gold unpegging */}
                                {selectedEraIdx === 0 && (
                                  <div className="flex flex-col items-center gap-2 animate-fadeIn uppercase select-none">
                                    <div className="text-4xl text-amber-400 font-black tracking-tighter drop-shadow-[0_0_20px_rgba(234,179,8,0.4)]">GOLD PEAK</div>
                                    <span className="font-mono text-[9px] text-[#00D9FF]">BUSD Standards Severed</span>
                                    {/* Unlinking link lines */}
                                    <div className="flex gap-4 mt-2 text-xs">
                                      <span className="text-amber-500 font-bold border border-amber-500/20 px-2 py-0.5 rounded">GOLD</span>
                                      <span className="text-red-500 font-bold">≠</span>
                                      <span className="text-indigo-400 font-bold border border-indigo-500/20 px-2 py-0.5 rounded">USD</span>
                                    </div>
                                  </div>
                                )}

                                {/* 1979: High-voltage Volcker rates */}
                                {selectedEraIdx === 1 && (
                                  <div className="w-full flex flex-col items-center gap-1.5 animate-fadeIn">
                                    <span className="text-2xl text-red-500 font-extrabold uppercase tracking-tight drop-shadow-[0_0_15px_rgba(239,68,68,0.3)]">20.00% VOLCKER SHIFT</span>
                                    <span className="font-mono text-[9px] text-zinc-400 uppercase text-center max-w-[200px]">Hyper-tight Overnight rate destroys industrial money demand.</span>
                                    <div className="flex items-end gap-1.5 h-10 mt-2">
                                      {[4, 10, 18, 30, 48, 75, 98, 5].map((h, i) => (
                                        <div key={i} className={`w-1.5 rounded-t ${i === 6 ? 'bg-red-500 animate-pulse' : 'bg-red-500/30'}`} style={{ height: `${h}%` }} />
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {/* 1997: Depleted FX reserves */}
                                {selectedEraIdx === 2 && (
                                  <div className="flex flex-col items-center gap-3 animate-fadeIn">
                                    <div className="w-16 h-16 rounded-full border border-pink-500/30 flex items-center justify-center animate-spin relative" style={{ animationDuration: '6s' }}>
                                      <div className="absolute top-0 w-3 h-3 bg-pink-500 rounded-full blur-[2px]" />
                                      <span className="font-mono text-[10px] text-pink-500 font-bold">FX CHOKE</span>
                                    </div>
                                    <span className="font-mono text-[9px] text-zinc-400 uppercase text-center max-w-[220px]">Offshore pegs revalued down by speculative attacks.</span>
                                  </div>
                                )}

                                {/* 2008: Credit freeze layout */}
                                {selectedEraIdx === 3 && (
                                  <div className="w-full flex flex-col items-center gap-2 animate-fadeIn">
                                    <span className="text-[10px] font-mono text-[#00D9FF] tracking-wider uppercase">SUBPRIME CASCADE COLLAPSE</span>
                                    <div className="flex gap-2.5 mt-2 h-10 items-end">
                                      <div className="h-full w-4 bg-red-500/20 border border-red-500/35 rounded flex items-center justify-center font-mono text-[7px] text-red-400">LIQUIDITY</div>
                                      <div className="h-[40%] w-4 bg-[#00D9FF]/20 border border-[#00D9FF]/35 rounded flex items-center justify-center font-mono text-[7px] text-[#00D9FF]">ASSET</div>
                                      <div className="h-[10%] w-4 bg-purple-500/20 border border-purple-500/35 rounded flex text-[7px] text-purple-400 items-center justify-center">CREDIT</div>
                                    </div>
                                    <span className="font-mono text-[8px] text-red-400 uppercase mt-1 animate-pulse">SYSTEMIC INTERBANK CONTAGION ACTIVE</span>
                                  </div>
                                )}

                                {/* 2020: Helicopter drop liquidity ballooning */}
                                {selectedEraIdx === 4 && (
                                  <div className="flex flex-col items-center gap-2 animate-fadeIn text-center">
                                    <span className="text-3xl text-purple-400 font-black drop-shadow-[0_0_20px_rgba(168,85,247,0.35)]">$9T BALANCE SHEET</span>
                                    <span className="font-mono text-[9px] text-zinc-400 max-w-[200px]">Federal Reserve open-market operations flood offshore swap corridors.</span>
                                    <div className="w-32 bg-purple-500/5 border border-purple-500/20 h-1 px-1 mt-1 rounded relative overflow-hidden">
                                      <div className="absolute top-0 left-0 bg-purple-500 h-full w-[88%] animate-pulse" />
                                    </div>
                                  </div>
                                )}

                                {/* 2022: Great QT rate hike */}
                                {selectedEraIdx === 5 && (
                                  <div className="w-full flex flex-col items-center gap-2 animate-fadeIn">
                                    <span className="text-xl text-[#00D9FF] font-black drop-shadow-[0_0_15px_rgba(0,217,255,0.3)]">THE RE-ANCHORING MOVEMENT</span>
                                    <span className="font-mono text-[9px] text-zinc-400 max-w-[220px] text-center">Central banks globally undertake the sharpest tightening duration shocks.</span>
                                    <div className="flex gap-2 text-[10px] mt-2">
                                      <div className="px-2 py-0.5 border border-red-500/20 text-red-400 font-semibold bg-red-500/5">CPI DOWN</div>
                                      <div className="px-2 py-0.5 border border-[#00D9FF]/20 text-[#00D9FF] font-semibold bg-[#00D9FF]/5">YIELDS SURGE</div>
                                    </div>
                                  </div>
                                )}

                              </div>
                            </div>

                            <div className="p-4 bg-black/40 rounded-2xl border border-white/5 flex flex-col gap-1.5 relative z-10 select-none">
                              <span className="text-[9px] font-mono text-zinc-400 font-black uppercase tracking-wider block">ERA DECISION & REGIME ACTION:</span>
                              <span className="text-xs font-semibold text-white block">{macroEras[selectedEraIdx].monetaryAction}</span>
                              <span className="text-[8px] font-mono text-zinc-500 mt-1 block">AUTHORIZED INSTRUCTION SET BY CENTRAL COMMITTEE</span>
                            </div>

                          </div>

                        </div>

                      </div>

                      {/* ACTIVE POLICY SIMULATOR & INFLATION CONTROL PANELS (Tied to state) */}
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-2">
                        
                        {/* Simulation controls panel */}
                        <div className="p-6 bg-[#040815]/90 border border-white/10 rounded-3xl relative overflow-hidden flex flex-col gap-4">
                          <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/2 rounded-full blur-[40px] pointer-events-none" />
                          <h4 className="text-zinc-200 text-xs font-mono font-bold uppercase tracking-widest border-b border-white/5 pb-2">Active Federal Fund System simulator</h4>
                          <p className="text-zinc-400 text-[11px] leading-relaxed">
                            Fine-tune Benchmark target interest parameters manually using the Dial Slider. Notice how it rebalances index and gold spot values dynamically.
                          </p>

                          <div className="my-3 flex flex-col gap-2 select-none">
                            <input
                              type="range"
                              min="0"
                              max="100"
                              value={policyDial}
                              onChange={(e) => setPolicyDial(parseInt(e.target.value))}
                              className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-ew-resize accent-[#00D9FF]"
                            />
                            <div className="flex justify-between font-mono text-[9.5px] text-zinc-500">
                              <span>0% (Hyper QE Floor)</span>
                              <span>{policyDial}% (ACTIVE)</span>
                              <span>100% (Hyper QT Ceiling)</span>
                            </div>
                          </div>

                          <div className="p-4 rounded-xl font-sans" style={{ backgroundColor: `${currentLiquidityProps.color}10`, border: `1px solid ${currentLiquidityProps.color}25` }}>
                            <span className="text-[10px] font-mono font-bold uppercase tracking-wide block" style={{ color: currentLiquidityProps.color }}>{currentLiquidityProps.label}</span>
                            <p className="text-[11px] text-zinc-300 leading-normal mt-1.5">{currentLiquidityProps.desc}</p>
                          </div>
                        </div>

                        {/* Interactive Inflation Center info block */}
                        <div className="market-card p-6 flex flex-col justify-between">
                          <div className="card-glow" />
                          <div>
                            <h4 className="text-white font-bold text-xs tracking-wider uppercase mb-3">Consumer inflation Center</h4>
                            <p className="text-zinc-400 text-[11px] leading-relaxed mb-4">
                              Inflation triggers when aggregate money supply exceeds industrial output volumes, making cash lose its purchasing power. Central banks counteract inflation spikes by raising target rates to constrict borrowing channels.
                            </p>
                            <div className="flex gap-2 text-xs">
                              <button onClick={() => selectFileNode('encyclopedia/economy/inflation.html')} className="py-2.5 px-4 bg-[#00D9FF]/10 hover:bg-[#00D9FF]/20 border border-[#00D9FF]/30 font-bold text-[10px] text-[#00D9FF] tracking-wider uppercase rounded-xl cursor-pointer transition-all">Inflation dossier</button>
                              <button onClick={() => selectFileNode('encyclopedia/economy/federal-reserve.html')} className="py-2.5 px-4 bg-white/5 hover:bg-white/10 border border-white/10 font-bold text-[10px] text-white tracking-wider uppercase rounded-xl cursor-pointer">Federal reserve profile</button>
                            </div>
                          </div>
                        </div>

                      </div>

                      {/* INTEREST REGIME INVITATION GATEWAY */}
                      <div className="mt-4">
                        <ClearPathTraderPortal variant="interactive" />
                      </div>
                    </div>
                  )}

                  {/* 4. education.html (ACADEMIC RESOURCE ARTICLES & FORMULAS) */}
                  {activeFile === 'education.html' && (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 select-text font-sans">
                      
                      {/* Left list of dissertations */}
                      <div className="lg:col-span-4 flex flex-col gap-3">
                        <div className="text-[10px] font-mono font-black uppercase text-[#FF00C8] tracking-widest border-b border-white/5 pb-2 mb-2">Core academic treatises</div>
                        {encyclopediaArticles.map((art) => (
                          <button
                            key={art.id}
                            onClick={() => setActiveArticle(art)}
                            className={`p-3 rounded-xl border text-left flex flex-col gap-1 transition-all cursor-pointer ${activeArticle.id === art.id ? 'border-[#FF00C8] bg-[#FF00C8]/5 text-white' : 'border-white/5 bg-white/[0.01] text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.03]'}`}
                          >
                            <span className="text-[11px] font-bold tracking-wide leading-snug line-clamp-2">{art.title}</span>
                            <span className="text-[8px] font-mono font-bold text-zinc-500 uppercase">Field: {art.category}</span>
                          </button>
                        ))}
                      </div>

                      {/* Right active paper display */}
                      <div className="lg:col-span-8 flex flex-col gap-6">
                        <div className="bg-[#040815]/80 p-6 md:p-8 rounded-2xl border border-white/5 shadow-2xl relative overflow-hidden">
                          <div className="flex justify-between items-center text-[10px] font-mono tracking-widest text-[#FF00C8] border-b border-white/5 pb-3 mb-6">
                            <span>MODULE: {activeArticle.id.toUpperCase()}</span>
                            <span className="bg-[#FF00C8]/10 text-[#FF00C8] p-0.5 px-2 rounded font-bold uppercase">{activeArticle.difficulty} LEVEL</span>
                          </div>
                          
                          <div className="prose prose-invert max-w-none text-zinc-300 font-sans text-xs leading-relaxed">
                            <Markdown>{activeArticle.content}</Markdown>
                          </div>

                          {/* Calculated equations block */}
                          {activeArticle.formulas && activeArticle.formulas.length > 0 && (
                            <div className="mt-6 border-t border-white/5 pt-4">
                              <span className="text-[10px] font-mono text-indigo-400 uppercase tracking-widest block font-bold mb-3">Dynamic Calculus equations:</span>
                              <div className="flex flex-col gap-2">
                                {activeArticle.formulas.map((eq, i) => (
                                  <div key={i} className="p-3 rounded-lg bg-black/40 border border-[#00e1ff]/10 text-[11px] font-mono text-[#00e1ff] flex items-center gap-2">
                                    <span className="text-zinc-600 font-black">{i + 1}.</span>
                                    <span>{eq}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Interactive testing block */}
                        {activeArticle.quiz && (
                          <div className="p-6 bg-gradient-to-r from-indigo-950/20 to-black/40 border border-indigo-500/25 rounded-3xl flex flex-col gap-4">
                            <div className="flex items-center gap-2 font-mono text-[10px] text-indigo-400 uppercase tracking-widest font-bold">
                              <Award className="w-5 h-5 text-indigo-400" />
                              <span>Certification Checkpoint</span>
                            </div>
                            <h4 className="text-white font-bold text-xs">{activeArticle.quiz.question}</h4>
                            
                            <div className="flex flex-col gap-2">
                              {activeArticle.quiz.options.map((opt, oIdx) => {
                                const isSelected = quizAnswer === oIdx;
                                const isCorrect = oIdx === activeArticle.quiz?.correctIndex;
                                return (
                                  <button
                                    key={oIdx}
                                    onClick={() => !quizSubmitted && setQuizAnswer(oIdx)}
                                    className={`p-3 text-left text-xs rounded-xl border transition-all cursor-pointer ${quizSubmitted ? (isCorrect ? 'border-green-500/50 bg-green-500/10 text-green-300' : (isSelected ? 'border-red-500/50 bg-red-500/10 text-red-300' : 'opacity-40 border-white/5')) : (isSelected ? 'border-[#00D9FF] bg-[#00D9FF]/5 text-white' : 'border-white/5 bg-white/[0.01] hover:bg-white/[0.03]')}`}
                                  >
                                    {opt}
                                  </button>
                                );
                              })}
                            </div>

                            {!quizSubmitted ? (
                              <button
                                onClick={() => quizAnswer !== null && setQuizSubmitted(true)}
                                disabled={quizAnswer === null}
                                className={`py-2.5 rounded-xl font-bold text-[10px] tracking-widest uppercase transition-all border cursor-pointer ${quizAnswer === null ? 'border-white/5 bg-white/[0.01] text-zinc-600' : 'border-[#00D9FF] bg-[#00D9FF] text-black hover:bg-[#00ffff] shadow-[0_0_15px_rgba(0,217,255,0.35)]'}`}
                              >
                                Certify comprehension
                              </button>
                            ) : (
                              <div className="p-4 bg-black/60 rounded-xl border border-white/5 text-[11px] text-zinc-300 leading-relaxed flex flex-col gap-2">
                                <span className={`font-mono text-[10px] font-black uppercase ${quizAnswer === activeArticle.quiz.correctIndex ? 'text-green-400' : 'text-red-400'}`}>{quizAnswer === activeArticle.quiz.correctIndex ? 'Pass Grade Verified ✓' : 'Revision Required ✗'}</span>
                                <p>{activeArticle.quiz.explanation}</p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                    </div>
                  )}

                  {/* 5. sectors.html (SECTORS grid representation) */}
                  {activeFile === 'sectors.html' && (
                    <div className="flex flex-col gap-6 font-sans">
                      <div className="p-6 bg-gradient-to-r from-pink-950/20 to-black/30 border border-[#FF00C8]/20 rounded-2xl">
                        <h3 className="text-white font-bold text-lg flex items-center gap-2">
                          <Layers className="text-[#FF00C8] w-5 h-5" />
                          Economic Sectors Matrix
                        </h3>
                        <p className="text-zinc-400 text-xs mt-1">Discover structural sector breakdowns matching technological, credit and energy pipelines.</p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[
                          { title: 'AI & Silicon Logic Machine', color: 'hover:border-[#FF00AA]', tag: 'ai-sector.html', content: 'Advanced graphics chip architecture, deep machine computing limits, lithography machinery bottlenecks, and venture growth scaling metrics.' },
                          { title: 'Sovereign Banking Reserves', color: 'hover:border-[#00D9FF]', tag: 'banking-sector.html', content: 'Balance sheet reserves leverage limits, overnight clearing sweep models, and central discount windows.' },
                          { title: 'Sovereign Volatile Energy', color: 'hover:border-amber-400', tag: 'energy-sector.html', content: 'Hydrocarbon output pipelines, OPEC production quotas, electrical grid loading parameters, and nuclear fission output baselines.' },
                          { title: 'Biotech Venture Trials', color: 'hover:border-emerald-400', tag: 'biotech-sector.html', content: 'Pre-clinical drug Discovery phases, FDA double-blind trial approvals, patent duration lines, and clinical venture outcomes.' },
                          { title: 'Lithography & Silicon hardware', color: 'hover:border-purple-400', tag: 'semiconductor-sector.html', content: 'Extreme Ultraviolet (EUV) manufacturing machine parameters, localized supply chains, wafers silicon thickness limits.' },
                        ].map(sec => (
                          <div key={sec.title} className="market-card p-5 group flex flex-col justify-between" style={{ transition: 'all 0.4s ease' }}>
                            <div className="card-glow" />
                            <div>
                              <h4 className="text-white font-bold text-sm tracking-wide mb-3">{sec.title}</h4>
                              <p className="text-zinc-400 text-xs leading-relaxed mb-4">{sec.content}</p>
                            </div>
                            <button onClick={() => selectFileNode(`encyclopedia/sectors/${sec.tag}`)} className="w-full py-2 border border-white/5 bg-white/[0.01] group-hover:bg-white/5 text-[10px] text-zinc-400 hover:text-white uppercase font-bold tracking-wider rounded-xl cursor-pointer">Explore Sector Dossier</button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 6. glossary.html (A-Z SEARCHABLE DICTIONARY & COMPREHENSIVE LIST) */}
                  {activeFile === 'glossary.html' && (
                    <MasterMarketExplorerView 
                      explorerType="glossary"
                      selectFileNode={selectFileNode}
                      askAboutTerm={askAboutTerm}
                    />
                  )}

                  {/* 7. kids-mode.html (GAMIFIED BINDING ENVIRONMENT FOR YOUNGER SCHOLARS) */}
                  {activeFile === 'kids-mode.html' && (
                    <div className="flex flex-col gap-6 font-sans select-none relative">
                      
                      {/* Kids Mode Dashboard Header */}
                      <div className="p-6 bg-gradient-to-r from-emerald-950/20 to-lime-950/15 border border-green-500/25 rounded-3xl flex justify-between items-center relative overflow-hidden">
                        <div>
                          <div className="flex items-center gap-2">
                            <Smile className="text-green-400 w-6 h-6 animate-bounce" />
                            <h3 className="text-white font-bold text-lg font-sans">ClearPath Junior Academy</h3>
                          </div>
                          <p className="text-zinc-400 text-xs mt-1">Fun bubblegum-styled explanations and questions to earn academic gold coins!</p>
                        </div>

                        {/* Persistent score counter */}
                        <div className="bg-green-500/10 border border-green-500/30 p-2 px-5 rounded-2xl flex items-center gap-2 text-green-300 font-mono font-bold animate-pulse text-xs">
                          <Trophy className="w-4 h-4 text-yellow-400" />
                          <span>COIN STASH:</span>
                          <span className="text-yellow-400">{kidsCoins} 🪙</span>
                        </div>
                      </div>

                      {/* Playful Cards */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 text-center">
                        {[
                          { title: 'The Toy Card market (Stocks) 🍎', desc: 'A Stock share is like a puzzle piece! Buying a share means you own a tiny piece of Apple or Lego, making you a proud part-owner!' },
                          { title: 'Bubblegum Inflation 🎈', desc: 'When bubblegum goes from 1 coin to 3 coins because paper dollars lose their superpowers! The money deflates like an old balloon.' },
                          { title: 'The Cookie Jar (Interest Rates) 📈', desc: 'Interest is cookie rent! If you borrow your buddy’s cookie, you promise to return the cookie tomorrow, PLUS a chocolate chip as cookie rent!' },
                          { title: 'The School Principal (The Fed) 🏦', desc: 'The Federal Reserve is like the money school principal! They print school dollars, set rates, and try to keep local student banks completely safe!' }
                        ].map((kid, i) => (
                          <div key={i} className="p-6 bg-[#0a0f05]/60 hover:bg-[#0d1c07]/80 border border-green-500/15 rounded-3xl transition-all shadow-xl flex flex-col justify-between">
                            <h4 className="text-green-300 font-bold text-xs leading-normal mb-3">{kid.title}</h4>
                            <p className="text-zinc-400 text-[11px] leading-relaxed mb-4">{kid.desc}</p>
                            <span className="text-[10px] uppercase font-mono tracking-widest text-[#FF00C8] font-bold">Concept #{i+1}</span>
                          </div>
                        ))}
                      </div>

                      {/* Capital Quest interactive quiz game */}
                      <div className="p-8 bg-[#020612]/90 border border-white/10 rounded-[32px] flex flex-col gap-6 relative shadow-2xl overflow-hidden mt-2">
                        {showConfetti && (
                          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,255,100,0.12)_0%,transparent_60%)] animate-ping pointer-events-none" />
                        )}

                        <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#00D9FF]">
                          <Sparkle className="w-5 h-5 text-yellow-400 animate-spin" />
                          <span>RESERVES CONQUEST TRIVIA</span>
                        </div>

                        <div>
                          <span className="text-[10px] font-mono tracking-wider text-zinc-500 block">CHECKPOINT {activeKidsQuestionIdx + 1} OF {kidsTrivia.length}:</span>
                          <h4 className="text-white font-bold text-sm leading-normal mt-1">{kidsTrivia[activeKidsQuestionIdx].q}</h4>
                        </div>

                        {/* Interactive options */}
                        <div className="flex flex-col gap-2.5">
                          {kidsTrivia[activeKidsQuestionIdx].opts.map((opt, oIdx) => {
                            const isSelected = kidsQuizSelectedOpt === oIdx;
                            const isCorrect = oIdx === kidsTrivia[activeKidsQuestionIdx].correct;
                            return (
                              <button
                                key={oIdx}
                                disabled={kidsQuizAnswered}
                                onClick={() => handleKidsAnswer(oIdx)}
                                className={`p-4 text-left text-xs rounded-2xl border transition-all cursor-pointer ${kidsQuizAnswered ? (isCorrect ? 'border-green-500 bg-green-500/10 text-green-300 font-black scale-102 shadow-[0_0_15px_rgba(34,197,94,0.2)]' : (isSelected ? 'border-red-500 bg-red-500/10 text-red-300 scale-98' : 'opacity-40 border-white/5')) : (isSelected ? 'border-yellow-400 bg-yellow-400/5 text-white' : 'border-white/5 bg-white/[0.01] hover:bg-white/[0.03]')}`}
                              >
                                {opt}
                              </button>
                            );
                          })}
                        </div>

                        {/* grading feedback */}
                        {kidsQuizAnswered && (
                          <div className="p-4 bg-black/60 rounded-2xl border border-white/5 text-[11px] text-zinc-300 leading-normal flex flex-col gap-2 animate-fade-in">
                            <div className="flex items-center gap-2">
                              {kidsQuizSelectedOpt === kidsTrivia[activeKidsQuestionIdx].correct ? (
                                <span className="font-mono text-xs font-black text-green-400 uppercase tracking-widest">★ MATCH EXCELLENT (+50 COINS CRITICAL STASH!)</span>
                              ) : (
                                <span className="font-mono text-xs font-black text-red-400 uppercase tracking-widest">★ TRIVIA GAP DETECTED</span>
                              )}
                            </div>
                            <p className="text-zinc-400 leading-relaxed">{kidsTrivia[activeKidsQuestionIdx].exp}</p>
                            <button
                              onClick={nextKidsQuestion}
                              className="mt-3 py-2 px-6 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 text-black font-sans text-[10px] font-black uppercase tracking-wider transition-all max-w-fit block cursor-pointer"
                            >
                              Next Level
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Global Financial Atlas View */}
                  {activeFile === 'global-atlas.html' && (
                    <GlobalAtlasView selectFileNode={selectFileNode} askAboutTerm={askAboutTerm} />
                  )}

                  {/* Blueprint 1: Global Exchanges Atlas */}
                  {activeFile === 'encyclopedia/blueprints/exchanges.html' && (
                    <ExchangesAtlasView selectFileNode={selectFileNode} pedagogyMode={pedagogyMode} activeLanguage={activeLanguage} />
                  )}

                  {/* Blueprint 2: Gold Shock Standard Break */}
                  {activeFile === 'encyclopedia/blueprints/gold-shock.html' && (
                    <GoldStandardShockView selectFileNode={selectFileNode} pedagogyMode={pedagogyMode} activeLanguage={activeLanguage} />
                  )}

                  {/* Blueprint 3: Intermarket Correlations */}
                  {activeFile === 'encyclopedia/blueprints/commodity-correlations.html' && (
                    <IntermarketCorrelationsView selectFileNode={selectFileNode} pedagogyMode={pedagogyMode} activeLanguage={activeLanguage} />
                  )}

                  {/* Blueprint 4: Agricultural Soft Grains */}
                  {activeFile === 'encyclopedia/blueprints/soft-commodities.html' && (
                    <SoftCommoditiesLabView selectFileNode={selectFileNode} pedagogyMode={pedagogyMode} activeLanguage={activeLanguage} />
                  )}

                  {/* Political Eras Custom Macro Dashboard View */}
                  {activeFile === 'political-eras.html' && (
                    <PoliticalErasView selectFileNode={selectFileNode} pedagogyMode={pedagogyMode} activeLanguage={activeLanguage} />
                  )}

                  {/* DXY Dollar Intensity Observatory View */}
                  {activeFile === 'dxy-observatory.html' && (
                    <DxyObservatoryView selectFileNode={selectFileNode} />
                  )}

                  {/* Global Systemic Crisis Archive View */}
                  {activeFile === 'global-crisis-archive.html' && (
                    <GlobalCrisisArchiveView selectFileNode={selectFileNode} />
                  )}

                  {/* Civilization Engine View */}
                  {activeFile === 'civilization-engine.html' && (
                    <CivilizationEngineView selectFileNode={selectFileNode} />
                  )}

                  {/* Economic Memory Matrix & Living Archive */}
                  {activeFile === 'economic-memory-matrix.html' && (
                    <EconomicMemoryMatrix selectFileNode={selectFileNode} />
                  )}

                  {/* Master Knowledge Index View */}
                  {activeFile === 'master-index.html' && (
                    <MasterKnowledgeIndexView selectFileNode={selectFileNode} askAboutTerm={askAboutTerm} />
                  )}

                  {/* Companies Directory View (60,000+ corporations) */}
                  {activeFile === 'encyclopedia/companies/directory.html' && (
                    <CompaniesDirectoryView selectFileNode={selectFileNode} />
                  )}

                  {/* Portfolio Lab View */}
                  {activeFile === 'portfolio.html' && (
                    <PortfolioTracker />
                  )}

                  {/* Watchlist View */}
                  {activeFile === 'watchlists.html' && (
                    <WatchlistView selectFileNode={selectFileNode} />
                  )}

                  {/* Market Psychology View */}
                  {activeFile === 'market-psychology.html' && (
                    <MarketPsychologyView selectFileNode={selectFileNode} />
                  )}

                  {/* Forex Learning View */}
                  {activeFile === 'forex.html' && (
                    <ForexPage />
                  )}

                  {/* Crypto Learning View */}
                  {activeFile === 'crypto.html' && (
                    <CryptoPage />
                  )}

                  {/* Commodities Learning View */}
                  {activeFile === 'commodities.html' && (
                    <CommoditiesPage />
                  )}

                  {/* Kids Learning View */}
                  {activeFile === 'kids-mode.html' && (
                    <KidsMode />
                  )}

                  {/* Comic Library View */}
                  {activeFile === 'comic-library.html' && (
                    <ComicLibraryView />
                  )}

                  {/* Sovereign Regions Observatory Custom Viewer */}
                  {activeFile.startsWith('encyclopedia/global/') && (() => {
                    const regionKey = activeFile.split('/').pop()?.replace('.html', '') || 'us-macro';
                    
                    if (regionKey === 'world-map') {
                      return (
                        <div className="flex flex-col gap-6 font-sans select-none animate-fadeIn">
                          {/* Title block */}
                          <div className="p-8 bg-gradient-to-r from-amber-950/30 to-black/80 border border-amber-500/25 rounded-3xl relative overflow-hidden">
                            <div className="absolute inset-0 bg-[#FF00C8]/[0.015] pointer-events-none" />
                            <span className="font-mono text-[9px] uppercase tracking-[0.25em] text-amber-400 font-bold block mb-1">
                              SOVEREIGN INTERCONNECTED OBSERVATORY • MAP MODULE
                            </span>
                            <h2 className="text-white font-black text-2xl tracking-tight uppercase">
                              Explore the Global Sovereign Economy
                            </h2>
                            <p className="text-zinc-400 text-xs mt-2 max-w-2xl leading-relaxed">
                              Sovereign nations represent deep closed-loop trade cylinders. Select any of the major core corridors below to inspect its unique monetary parameters, resource pipelines, and systemic risks.
                            </p>
                          </div>

                          {/* World Map stylised grid representation */}
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {Object.entries(SOVEREIGN_REGIONS).map(([key, reg]) => {
                              const borderHoverColors = {
                                cyan: 'hover:border-cyan-400',
                                pink: 'hover:border-pink-400',
                                purple: 'hover:border-purple-400',
                                amber: 'hover:border-amber-400',
                                emerald: 'hover:border-emerald-400',
                              }[reg.themeColor];

                              const textColors = {
                                cyan: 'text-cyan-400',
                                pink: 'text-pink-400',
                                purple: 'text-purple-400',
                                amber: 'text-amber-400',
                                emerald: 'text-emerald-400',
                              }[reg.themeColor];

                              return (
                                <div 
                                  key={key}
                                  onClick={() => selectFileNode(`encyclopedia/global/${key}.html`)}
                                  className={`p-6 bg-gradient-to-br from-neutral-950/90 to-[#02040c] border border-white/5 ${borderHoverColors} transition-all rounded-3xl cursor-pointer text-left group relative overflow-hidden flex flex-col justify-between`}
                                  style={{ minHeight: '220px' }}
                                >
                                  <div className="absolute top-0 right-0 p-3 font-mono text-[9px] text-zinc-500 tracking-widest font-black uppercase">
                                    {reg.code}
                                  </div>
                                  <div>
                                    <span className={`font-mono text-[8.5px] uppercase tracking-wider ${textColors} font-extrabold block mb-2`}>
                                      CURRENCY: {reg.currencySymbol}
                                    </span>
                                    <h3 className="text-white font-black text-[14px] leading-tight uppercase group-hover:text-white transition-colors">{reg.name}</h3>
                                    <p className="text-zinc-400 text-[11px] leading-relaxed mt-2 line-clamp-3 font-medium">{reg.narrative}</p>
                                  </div>

                                  <div className="mt-5 pt-3 border-t border-white/5 flex justify-between items-center text-[10px] font-mono">
                                    <span className="text-zinc-500">GDP: <b className="text-white font-bold">{reg.gdpSize}</b></span>
                                    <span className={`${textColors} font-black tracking-wider uppercase flex items-center gap-1 group-hover:translate-x-1 transition-transform`}>
                                      INSPECT DECK <ChevronRight className="w-3.5 h-3.5" />
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    }

                    const region = SOVEREIGN_REGIONS[regionKey] || SOVEREIGN_REGIONS['us-macro'];

                    const themeStyles = {
                      cyan: {
                        gradient: 'from-cyan-950/25',
                        border: 'border-cyan-500/20',
                        text: 'text-cyan-400',
                        bgGlow: 'bg-cyan-500/10'
                      },
                      pink: {
                        gradient: 'from-pink-950/25',
                        border: 'border-pink-500/20',
                        text: 'text-pink-400',
                        bgGlow: 'bg-pink-500/10'
                      },
                      purple: {
                        gradient: 'from-purple-950/25',
                        border: 'border-purple-500/20',
                        text: 'text-purple-400',
                        bgGlow: 'bg-purple-500/10'
                      },
                      amber: {
                        gradient: 'from-amber-950/25',
                        border: 'border-amber-500/20',
                        text: 'text-amber-400',
                        bgGlow: 'bg-amber-500/10'
                      },
                      emerald: {
                        gradient: 'from-emerald-950/25',
                        border: 'border-emerald-500/20',
                        text: 'text-emerald-400',
                        bgGlow: 'bg-emerald-500/10'
                      }
                    }[region.themeColor];

                    return (
                      <div className="flex flex-col gap-6 font-sans select-none animate-fadeIn">
                        
                        {/* Title block banner */}
                        <div className={`p-8 bg-gradient-to-r ${themeStyles.gradient} to-transparent border ${themeStyles.border} rounded-3xl relative overflow-hidden shadow-md`}>
                          <div className="absolute inset-0 bg-white/[0.015] pointer-events-none" />
                          <div className="flex justify-between items-start gap-4">
                            <div>
                              <span className="font-mono text-[9px] uppercase tracking-[0.25em] text-zinc-550 font-bold block mb-1">
                                SOVEREIGN MACRO ANATOMY DECK • SYSTEM CORE
                              </span>
                              <h2 className="text-white font-black text-2xl tracking-tight uppercase">
                                {region.name}
                              </h2>
                              <span className={`inline-block mt-2 font-bold text-[9.5px] px-3 py-1 rounded-full ${themeStyles.bgGlow} border border-white/5 ${themeStyles.text}`}>
                                SOVEREIGN CODE: {region.code}
                              </span>
                            </div>
                            <button 
                              onClick={() => selectFileNode('encyclopedia/global/world-map.html')}
                              className="py-2.5 px-4 bg-white/5 border border-white/10 hover:bg-white/10 text-white rounded-xl font-mono text-[10px] font-black uppercase tracking-widest cursor-pointer"
                            >
                              World Map
                            </button>
                          </div>
                        </div>

                        {/* Interactive sovereign stats indicators */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                          {[
                            { label: 'SOVEREIGN GDP', value: region.gdpSize, detail: 'Real output volume scale' },
                            { label: 'BASE BANK RATE', value: region.interestRate, detail: 'Thermostatic price of credit' },
                            { label: 'CPI INFLATION', value: region.inflationRate, detail: 'Purchasing degradation rate' },
                            { label: 'PRIMARY CURRENCY', value: region.currencySymbol, detail: region.currency },
                          ].map((stat, i) => (
                            <div key={i} className="p-4 bg-neutral-950/90 border border-white/5 rounded-2xl text-left shadow-sm">
                              <span className="text-[9px] font-mono font-bold text-zinc-500 block tracking-wider mb-1">{stat.label}</span>
                              <div className={`text-[18px] font-black font-mono tracking-tight ${themeStyles.text}`}>{stat.value}</div>
                              <span className="text-[9px] text-zinc-500 font-mono block mt-1.5">{stat.detail}</span>
                            </div>
                          ))}
                        </div>

                        {/* Money Loop diagram and physical supply chain rails */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          
                          {/* "HOW MONEY MOVES" GLOBAL CASH LOOPS */}
                          <div className="p-6 bg-[#030612]/95 border border-white/5 rounded-3xl flex flex-col gap-4">
                            <div className="flex items-center gap-2 border-b border-white/5 pb-2.5 mb-1">
                              <Coins className={`w-4 h-4 ${themeStyles.text}`} />
                              <h3 className="text-white font-black text-[11px] uppercase tracking-wider font-sans">How Money Moves (Capital Currency Flows)</h3>
                            </div>
                            
                            <div className="flex flex-col gap-3">
                              {region.moneyFlowNodes.map((flow, i) => (
                                <div key={i} className="p-3.5 bg-black/40 rounded-xl border border-white/[0.02] flex items-center justify-between text-left relative overflow-hidden group">
                                  <div className="flex flex-col">
                                    <span className="text-[8px] font-mono text-zinc-655">TRANSMISSION LINK 0{i + 1}</span>
                                    <div className="text-white text-xs font-extrabold mt-1 uppercase flex items-center gap-2">
                                      <span>{flow.from}</span>
                                      <ArrowRight className="w-3.5 h-3.5 text-zinc-650 group-hover:translate-x-1 transition-transform" />
                                      <span className="text-[#00D9FF]">{flow.to}</span>
                                    </div>
                                    <span className="text-[10px] text-zinc-400 mt-1 font-mono">{flow.label}</span>
                                  </div>
                                  <div className="text-right">
                                    <span className={`text-[9.5px] font-mono font-black py-1 px-2.5 bg-white/5 rounded border border-white/5 ${themeStyles.text}`}>
                                      {flow.asset}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* "CRITICAL SUPPLY CHAIN RAILS" MAP */}
                          <div className="p-6 bg-[#030612]/95 border border-white/5 rounded-3xl flex flex-col gap-4">
                            <div className="flex items-center gap-2 border-b border-white/5 pb-2.5 mb-1">
                              <Cpu className={`w-4 h-4 ${themeStyles.text}`} />
                              <h3 className="text-white font-black text-[11px] uppercase tracking-wider font-sans">Sovereign Supply Chain Visualisation</h3>
                            </div>

                            <div className="flex flex-col gap-3">
                              {region.supplyChainNodes.map((chain, i) => (
                                <div key={i} className="p-3.5 bg-neutral-900/40 rounded-xl border border-white/[0.02] text-left">
                                  <div className="flex justify-between items-center border-b border-white/5 pb-1.5 mb-2 text-[8.5px] font-mono">
                                    <span className="text-zinc-600">RAIL FLOW 0{i+1}</span>
                                    <span className="text-amber-400 font-bold block uppercase">{chain.status}</span>
                                  </div>
                                  
                                  <div className="flex items-center justify-between text-zinc-400 text-xs">
                                    <span>SOURCE: <b className="text-white font-bold">{chain.source}</b></span>
                                    <ChevronRight className="w-4 h-4 text-zinc-500" />
                                    <span>TARGET: <b className="text-white font-bold">{chain.target}</b></span>
                                  </div>

                                  <div className="mt-2.5 flex items-center justify-between gap-2">
                                    <span className="text-[10.5px] font-semibold text-zinc-200">📦 Transporting: <span className="text-[#00ffff] font-mono">{chain.goods}</span></span>
                                    <span className="relative flex h-2 w-2">
                                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                        </div>

                        {/* Underwriting narrative section */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                          
                          {/* Narrative explanation */}
                          <div className="p-6 bg-neutral-950/95 border border-white/5 rounded-3xl lg:col-span-2">
                            <h4 className="text-white font-black text-xs uppercase tracking-wider border-b border-white/5 pb-2 mb-3">Sovereign Macro Structure Narrative</h4>
                            <p className="text-zinc-300 text-xs leading-relaxed font-sans select-text">
                              {region.narrative}
                            </p>
                          </div>

                          {/* Critical Systemic Vulnerabilities / Debt warning */}
                          <div className="p-6 bg-[#0c0303]/95 border border-red-500/10 rounded-3xl flex flex-col justify-between">
                            <div>
                              <h4 className="text-red-400 font-black text-xs uppercase tracking-wider border-b border-red-500/10 pb-2 mb-3 flex items-center gap-1.5 font-mono">
                                <AlertTriangle className="w-4.5 h-4.5 text-red-500 animate-pulse" />
                                SYSTEMIC RISK ALERT
                              </h4>
                              <p className="text-zinc-400 text-[10.5px] leading-relaxed select-text font-mono">
                                {region.systemicHurdles}
                              </p>
                            </div>
                            <div className="text-[8.5px] font-mono text-red-500/70 font-black tracking-widest uppercase mt-4">
                              RADAR OBSERVATORY WARNING //
                            </div>
                          </div>

                        </div>

                        {/* Back navigation actions */}
                        <div className="flex gap-4 items-center">
                          <button 
                            onClick={() => selectFileNode('encyclopedia/global/world-map.html')} 
                            className="py-3 px-6 bg-white/5 hover:bg-white/10 uppercase tracking-widest text-[10px] font-black border border-white/10 rounded-xl transition-all text-center cursor-pointer text-white flex items-center gap-2"
                          >
                            <ChevronLeft className="w-4 h-4 text-zinc-400" />
                            Return to sovereign Map
                          </button>
                        </div>

                      </div>
                    );
                  })()}

                  {/* 8. Deep Individual Stocks files (Apple, Microsoft, Nvidia, Tesla, Amazon, and dynamic ones) */}
                  {activeFile.startsWith('encyclopedia/stocks/') && (() => {
                    const companyKey = activeFile.split('/').pop()?.replace('.html', '').toLowerCase() || '';
                    const mainKeys = ['apple', 'tesla', 'nvidia', 'microsoft', 'amazon', 'aapl', 'tsla', 'nvda', 'msft', 'amzn'];
                    if (mainKeys.includes(companyKey)) {
                      return (
                        <StockDetailsView 
                          companyKey={companyKey === 'aapl' ? 'apple' : companyKey === 'tsla' ? 'tesla' : companyKey === 'nvda' ? 'nvidia' : companyKey === 'msft' ? 'microsoft' : companyKey === 'amzn' ? 'amazon' : companyKey} 
                          selectFileNode={selectFileNode} 
                        />
                      );
                    } else {
                      return (
                        <DynamicStockPage />
                      );
                    }
                  })()}

                  {/* 8.1 Rich Dynamic Crypto Profiles */}
                  {activeFile.startsWith('encyclopedia/crypto/') && !activeFile.endsWith('crypto.html') && (() => {
                    return (
                      <DynamicCryptoPage />
                    );
                  })()}

                  {/* 8.2 Rich Dynamic Forex Profiles */}
                  {activeFile.startsWith('encyclopedia/forex/') && !activeFile.endsWith('forex.html') && (() => {
                    return (
                      <DynamicForexPage />
                    );
                  })()}

                  {/* 8.3 Rich Dynamic Commodities Profiles */}
                  {activeFile.startsWith('encyclopedia/commodities/') && !activeFile.endsWith('commodities.html') && (() => {
                    return (
                      <DynamicCommodityPage />
                    );
                  })()}

                  {/* 8.5 Master scale market directories (10k Stocks, 20k Crypto, Forex, Commodities) */}
                  {['encyclopedia/markets/stocks.html', 'encyclopedia/markets/crypto.html', 'encyclopedia/markets/forex.html', 'encyclopedia/markets/commodities.html'].includes(activeFile) && (() => {
                    const typeMap: Record<string, 'stocks' | 'crypto' | 'forex' | 'commodities'> = {
                      'encyclopedia/markets/stocks.html': 'stocks',
                      'encyclopedia/markets/crypto.html': 'crypto',
                      'encyclopedia/markets/forex.html': 'forex',
                      'encyclopedia/markets/commodities.html': 'commodities'
                    };
                    const type = typeMap[activeFile];
                    return (
                      <MasterMarketExplorerView 
                        explorerType={type}
                        selectFileNode={selectFileNode}
                        askAboutTerm={askAboutTerm}
                      />
                    );
                  })()}

                  {/* Web Page Knowledge Item Custom Viewer */}
                  {ENCYCLOPEDIA_KNOWLEDGE_BASE[activeFile] && (
                    <KnowledgeItemViewer 
                      item={ENCYCLOPEDIA_KNOWLEDGE_BASE[activeFile]} 
                      onNavigate={selectFileNode}
                      activeFile={activeFile}
                    />
                  )}

                  {/* Fallback for other deep articles */}
                  {!['index.html', 'master-index.html', 'encyclopedia/companies/directory.html', 'global-atlas.html', 'civilization-engine.html', 'markets.html', 'economy.html', 'education.html', 'sectors.html', 'glossary.html', 'kids-mode.html', 'comic-library.html', 'political-eras.html', 'dxy-observatory.html', 'global-crisis-archive.html', 'economic-memory-matrix.html', 'portfolio.html', 'watchlists.html', 'market-psychology.html', 'forex.html', 'crypto.html', 'commodities.html'].includes(activeFile) && !activeFile.startsWith('encyclopedia/stocks/') && !activeFile.startsWith('encyclopedia/global/') && !activeFile.startsWith('encyclopedia/blueprints/') && !ENCYCLOPEDIA_KNOWLEDGE_BASE[activeFile] && (
                    <div className="p-6 bg-[#040815]/95 border border-white/10 rounded-3xl select-text flex flex-col gap-6">
                      <div className="flex justify-between border-b border-white/5 pb-2 mb-2 font-mono text-[10px] text-zinc-500 uppercase">
                        <span>Academic File Path: /root/{activeFile}</span>
                        <span className="text-zinc-600">Static Indexing node</span>
                      </div>
                      <h3 className="text-white font-bold text-lg uppercase tracking-wide">{activeFile.substring(activeFile.lastIndexOf('/') + 1)}</h3>
                      
                      <div className="p-4 bg-black/40 rounded-xl border border-white/5 text-xs text-zinc-300 leading-relaxed font-sans">
                        <Markdown>{`
### Study Reference Segment

You are browsing the static content file of **${activeFile}**. This file segments critical formulas, data indices, or CSS configurations directly related to the ClearPath Financial Academic Course.

*   Select **Source View (Source tab)** in the top bar to inspect the raw structured markup encoding.
*   Use the left folder tree to explore other directories.
                        `}</Markdown>
                      </div>
                    </div>
                  )}

                </div>
              )}

            </div>
          </div> {/* Close main-container */}
        </div> {/* Close wrapper */}
      </div> {/* Close app */}

        {/* MOCK BACKDROP GLASS OVERLAYS */}
        <div className={`overlay-app ${isTutorOpen ? 'is-active' : ''}`} onClick={() => setIsTutorOpen(false)}></div>
        
        {/* UPPER DRAWER OVERLAYS (AI Scholar Tutor Slideout Drawer) */}
        <div 
          className={`pop-up ${isTutorOpen ? 'visible' : ''}`}
          style={{ 
            right: isTutorOpen ? '30px' : '-520px', 
            left: 'auto', 
            transform: 'translateY(-50%)', 
            transition: 'all 0.5s cubic-bezier(0.16, 1, 0.3, 1)' 
          }}
        >
          <div className="pop-up__title flex items-center justify-between border-b border-white/5 pb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#00f2ff] animate-pulse" />
              <span className="font-bold text-white tracking-wide font-sans text-sm">ClearPath Scholar Tutor</span>
            </div>
            <span className="close text-[10px] text-zinc-500 hover:text-white uppercase font-black tracking-widest cursor-pointer font-mono p-1 px-3 bg-white/5 rounded-lg border border-white/5" onClick={() => setIsTutorOpen(false)}>DISMISS</span>
          </div>
          
          <p className="pop-up__subtitle text-zinc-400 font-sans text-xs leading-normal my-4">Query our dedicated educational intelligence node directly. Explanations are compiled server-side using systematic academic references.</p>
          
          {/* Chat scrolling log */}
          <div className="my-4 overflow-y-auto max-h-[380px] pr-1 flex flex-col gap-3 custom-scrollbar text-xs leading-relaxed font-sans">
            {aiAnswer ? (
              <div className="bg-indigo-600/10 p-4 rounded-xl border border-indigo-500/20 text-zinc-200">
                <span className="text-[9.5px] text-[#00f2ff] uppercase tracking-wider block border-b border-[#00f2ff]/10 pb-1 mb-2 font-bold font-mono">Tutor Transmission:</span>
                <div className="chat-markdown prose prose-invert font-sans leading-normal">
                  <Markdown>{aiAnswer}</Markdown>
                </div>
              </div>
            ) : (
              <div className="text-center py-16 flex flex-col items-center justify-center gap-3 select-none">
                <HelpCircle className="w-8 h-8 text-zinc-600 animate-bounce" />
                <span className="text-zinc-500 font-medium font-sans">Scholar terminal idle. Choose a term, or submit an academic question.</span>
              </div>
            )}
            
            {aiLoading && (
              <div className="flex items-center gap-2.5 p-3.5 bg-white/[0.02] border border-white/5 rounded-xl animate-pulse">
                <div className="w-2.5 h-2.5 bg-[#00f2ff] rounded-full animate-ping" />
                <span className="text-[10px] font-mono text-zinc-405 font-bold uppercase tracking-wide">Consulting archives...</span>
              </div>
            )}
          </div>

          {/* Chat inquiry inputs */}
          <form onSubmit={handleAskTutor} className="flex flex-col gap-3 mt-auto border-t border-white/5 pt-4 font-sans text-xs select-none">
            <input
              type="text"
              value={aiQuestion}
              disabled={aiLoading}
              onChange={(e) => setAiQuestion(e.target.value)}
              placeholder="Ask an educational or macro-economic question..."
              className="p-3 bg-black/60 border border-white/10 rounded-xl text-xs text-white placeholder-zinc-500 outline-none focus:border-[#00f2ff]"
            />
            <div className="flex items-center justify-between gap-2 mt-1">
              <button 
                type="button" 
                onClick={() => handleAskTutor(undefined, `Explain the macroeconomic significance of "${activeArticle.title}" and what formulas we use to calculate its yield parameters.`)} 
                className="text-[9.5px] text-[#00f2ff] bg-white/[0.01] hover:bg-white/[0.04] border border-white/5 p-1.5 px-3 rounded-xl transition-all cursor-pointer font-bold"
              >
                Explain active calculus
              </button>
              <button 
                type="submit" 
                disabled={aiLoading || !aiQuestion.trim()} 
                className="content-button ml-auto cursor-pointer" 
                style={{ marginTop: 0, padding: '6px 18px' }}
              >
                Inquire Node
              </button>
            </div>
          </form>
        </div>

      </div>
  );
}
