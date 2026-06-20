import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Cpu, 
  Users, 
  Activity, 
  Calendar, 
  DollarSign, 
  Award, 
  BookOpen, 
  Sparkles, 
  Clock, 
  ArrowLeft, 
  AlertCircle, 
  Database, 
  Zap, 
  Play, 
  Pause, 
  HelpCircle, 
  Info, 
  Layers, 
  Globe, 
  ChevronRight,
  Sliders,
  Compass,
  ArrowUpRight,
  ArrowDownRight,
  ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import CompanyPage from '../../pages/companies/[company]';
import RelationshipGraph from '../RelationshipGraph';
import WhyItMoved from '../WhyItMoved';
import companies from '../../../data/companies/companies.json';

interface StockDetailsViewProps {
  companyKey: string;
  selectFileNode: (path: string) => void;
}

interface StockDetailsData {
  ticker: string;
  name: string;
  logo: string;
  industry: string;
  marketCap: string;
  revenue: string;
  margins: string;
  desc: string;
  basePrice: number;
  
  // WHAT THE COMPANY DOES
  operations: {
    name: string;
    description: string;
    icon: any;
    revenueShare: number;
    techStack: string;
  }[];

  // WHAT MOVES THE STOCK
  drivers: {
    factor: string;
    impact: 'High' | 'Medium' | 'Critical';
    description: string;
    activeTrend: string;
  }[];

  // RELATED INDUSTRIES
  relatedIndustries: {
    name: string;
    path: string;
    connection: string;
  }[];

  // BIGGEST COMPETITORS
  competitors: {
    name: string;
    ticker: string;
    marketCap: string;
    advantage: string;
    threatLevel: 'Low' | 'Medium' | 'Severe';
  }[];

  // HISTORY TAB
  history: {
    year: string;
    title: string;
    wallStreetImpact: string;
    story: string;
  }[];

  // NEWS IMPACT HOVER TRIGGERS
  newsImpacts: {
    id: string;
    headline: string;
    source: string;
    sentiment: 'Bullish' | 'Bearish' | 'Neutral';
    impactPct: number;
    explanation: string;
    relatedMarket: string;
  }[];

  // LEVERAGE SIMULATION (Education Tab)
  education: {
    title: string;
    question: string;
    concept: string;
    metricLabel: string;
    metricMin: number;
    metricMax: number;
    metricDefault: number;
    metricUnit: string;
    formulaExplanation: string;
    getLeverageResults: (valve: number) => {
      marginalCost: number;
      revenueGen: number;
      grossOverhead: number;
      projectedMargin: number;
      grade: string;
    };
  };
}

const STOCK_PROFILES_DATABASE: Record<string, StockDetailsData> = {
  tesla: {
    ticker: 'TSLA',
    name: 'Tesla, Inc.',
    logo: '⚡',
    industry: 'Autonomous EV & Ecosystem Energy',
    marketCap: '$580.4 B',
    revenue: '$96.7 B',
    margins: '15.5%',
    basePrice: 175.40,
    desc: 'Tesla pioneers clean electric mobility networks, high-output grid backup batteries, and distributed robotics stacks powered by end-to-end vision AI.',
    operations: [
      { name: 'Electric mobility (EV)', description: 'Mass production of Model 3/Y/S/X and upcoming next-gen platform.', icon: Cpu, revenueShare: 82, techStack: 'Structural cast chassis, 4680 cells' },
      { name: 'Energy Generation & Storage', description: 'Industrial Megapack grid units and home Powerwall backups clearing utility caps.', icon: Zap, revenueShare: 11, techStack: 'LFP chemistry, Powerhub energy bidding software' },
      { name: 'Self-Driving & FSD Neural Nets', description: 'Supercomputing pipelines (Dojo) trading neural weights for autonomous driving.', icon: Database, revenueShare: 4, techStack: 'PyTorch, custom AI inference silicon' },
      { name: 'Optimus Robotics & AI Kinetic', description: 'Humanoid automation agents designed to replace high-danger warehouse manual operations.', icon: Layers, revenueShare: 3, techStack: 'Actuators telemetry, spatial pathing' }
    ],
    drivers: [
      { factor: 'Sovereign EV Subsidy Policy', impact: 'Critical', description: 'Direct government tax credits significantly reduce purchasing barriers for household buyers.', activeTrend: 'Fluctuating as regulatory regimes shift.' },
      { factor: 'Lithium & Mineral Spot Prices', impact: 'High', description: 'Underlying raw cell input overheads dictate gross manufacturing margins.', activeTrend: 'Softening commodities easing production costs.' },
      { factor: 'Elon Musk Publicity Vectors', impact: 'Critical', description: 'Sovereign board focus and high-velocity news cycles trigger retail speculation.', activeTrend: 'Highly volatile, driving short-term trading volume.' },
      { factor: 'China Manufacturing Efficiency', description: 'Shanghai gigafactory local yields determine corporate delivery speeds in EU and East Asia.', impact: 'High', activeTrend: 'Consistently strong output margins.' }
    ],
    relatedIndustries: [
      { name: 'Commodities (Lithium & Battery Metals)', path: 'encyclopedia/markets/commodities.html', connection: 'Battery capacity scalability matches global mining rates.' },
      { name: 'AI & Neural Systems', path: 'ai-intelligence.html', connection: 'FSD visual navigation represents real-time spatial neural networks.' },
      { name: 'Semiconductor Fabrication', path: 'encyclopedia/sectors/semiconductor-sector.html', connection: 'Bespoke vehicle inference silicons require extreme nanometer yields.' }
    ],
    competitors: [
      { name: 'BYD Auto Group', ticker: '1211.HK', marketCap: '$98.5 B', advantage: 'Absolute vertical control over cheap local battery cells.', threatLevel: 'Severe' },
      { name: 'Rivian Automotive', ticker: 'RIVN', marketCap: '$11.2 B', advantage: 'Strong organic capture of the premium consumer adventure vehicle tier.', threatLevel: 'Medium' },
      { name: 'Toyota Motor', ticker: 'TM', marketCap: '$320 B', advantage: 'Ultimate global dealer networks with hybrid vehicle transition margins.', threatLevel: 'Medium' }
    ],
    history: [
      { year: '2010', title: 'The Risky Initial Float', wallStreetImpact: 'Pioneered pure venture green energy stocks.', story: 'Tesla went public at $17.00 per share. Critics laughed, betting heavily on bankruptcies as the carmaker burned capital to craft early Roadsters.' },
      { year: '2012', title: 'Model S Debuts', wallStreetImpact: 'Proved EV viability to traditional auto giants.', story: 'Introduced the first grounds-up high-performance luxury electric sedan, winning highest safety scores ever recorded.' },
      { year: '2020', title: 'S&P 500 Entry & Parabola', wallStreetImpact: 'Triggered the largest options-driven retail short squeeze in history.', story: 'After 5 profitable quarters, Tesla joined the S&P 500, sparking a monumental valuation hike past $1 Trillion.' },
      { year: '2024', title: 'The FSD End-to-End Shift', wallStreetImpact: 'Re-rated company from an auto maker to an AI robotics play.', story: 'Removed hand-coded behavioral rules for driving, replacing them with end-to-end neural network video planners.' }
    ],
    newsImpacts: [
      { id: 'ev_drop', headline: 'Federal Reserve Holds Rates High, Straining Vehicle Financing Lines', source: 'Bloomberg Terminal', sentiment: 'Bearish', impactPct: -6.4, explanation: 'High retail loan quotes force consumers to postpone luxury upgrades. Monthly car lease barriers spike, depressing car deliveries.', relatedMarket: 'US 10-Yr Treasury Yield up' },
      { id: 'opt_launch', headline: 'CEO Musk Discloses 1,000 Optimus Robots Active on Gigafactory Assembly Lines', source: 'ClearPath Alert Tracker', sentiment: 'Bullish', impactPct: 8.5, explanation: 'Automation reduces warehouse operational labor overheads, suggesting historic profit margin expansions upstream.', relatedMarket: 'NASDAQ Tech Index rises' },
      { id: 'lith_crash', headline: 'Sovereign Lithium Spot Pricing Collapses 18% as New Salt Flats Open', source: 'Commodity Board Feed', sentiment: 'Bullish', impactPct: 4.2, explanation: 'Input chemical costs drop instantly, widening gross assembly profit capture margins on Model Y vehicles.', relatedMarket: 'Spot Lithium soft' }
    ],
    education: {
      title: 'What Is a Growth Stock & Operating Leverage?',
      question: 'How do production volumes drive extreme profit scaling?',
      concept: 'Growth stocks carry steep valuation multiples because their business models possess massive Operating Leverage. Once fixed startup costs (gigafactories) are paid, each incremental unit sold produces pure cash flows with negligible marginal cost.',
      metricLabel: 'Gigafactory Battery Volume Output',
      metricMin: 10000,
      metricMax: 500000,
      metricDefault: 80000,
      metricUnit: 'packs/yr',
      formulaExplanation: 'Operating Leverage Index = (Volume * Price - Variable Costs) / (Volume * Price - Variable Costs - Fixed Gigafactory Overhead)',
      getLeverageResults: (volume: number) => {
        const marginalCost = Math.max(120, 310 - (volume / 2000)); // lower cell price with volume scale
        const revenueGen = volume * 420;
        const grossOverhead = 12000000; // $12M fixed gigafactory cost
        const variableExpense = volume * marginalCost;
        const profit = revenueGen - variableExpense - grossOverhead;
        const projectedMargin = (profit / revenueGen) * 100;
        
        let grade = 'UNPROFITABLE • HIGH DEBT DANGER';
        if (projectedMargin > 20) {
          grade = 'EFFICIENT • SCALE MONOPOLY CHANNELS';
        } else if (projectedMargin > 0) {
          grade = 'MODERATE YIELDS • STABILIZED CAPITAL';
        }

        return { marginalCost, revenueGen, grossOverhead, projectedMargin, grade };
      }
    }
  },
  apple: {
    ticker: 'AAPL',
    name: 'Apple Inc.',
    logo: '🍎',
    industry: 'Consumer Electronics & Locked Ecosystems',
    marketCap: '$3.24 T',
    revenue: '$383.2 B',
    margins: '26.1%',
    basePrice: 184.25,
    desc: 'Apple manages the world’s most profitable consumer electronics ecosystem, locking worldwide customers via iOS hardware synergy and services.',
    operations: [
      { name: 'iPhone & Hardware', description: 'Engineering premium devices (iPhone, iPad, Mac) carrying high markup tags.', icon: Cpu, revenueShare: 58, techStack: 'A-series silicon processors, premium titanium hulls' },
      { name: 'App Store & Services subscription', description: 'Capturing 15-30% licensing margins on digital software sales, iCloud, and music.', icon: Database, revenueShare: 26, techStack: 'App Store rules, digital safety checks' },
      { name: 'Wearables & Home Ecosystem', description: 'Apple Watch, AirPods, and Vision Pro spatial headsets driving product lock-in.', icon: Layers, revenueShare: 11, techStack: 'H1 audio chips, custom spatial micro-displays' },
      { name: 'Fintech & Cards payment', description: 'Apple Pay pipeline settlements and localized cash deposit products.', icon: DollarSign, revenueShare: 5, techStack: 'NFC encryption, banking clearing partners' }
    ],
    drivers: [
      { factor: 'Hardware Upgrade Cycles', impact: 'Critical', description: 'Whether customers replace smartphones every 2 years or delay upgrades.', activeTrend: 'Slightly extending as devices remain durable.' },
      { factor: 'Sovereign Antimonopoly Lawsuits', impact: 'Critical', description: 'Regulatory attacks against Apple’s 30% App Store cut threaten services margins.', activeTrend: 'High pressure across EU and US courts.' },
      { factor: 'East Asian Fab Bottlenecks', impact: 'High', description: 'Relies on physical assembly grids in Shenzhen and India.', activeTrend: 'Diversifying assembly nodes downstream.' }
    ],
    relatedIndustries: [
      { name: 'Semiconductors & Foundry', path: 'encyclopedia/sectors/semiconductor-sector.html', connection: 'Apple is the largest customer of ASML-based microchip outputs.' },
      { name: 'Telecom Networks & GDP', path: 'encyclopedia/economy/gdp.html', connection: 'High 5G coverage expansions stimulate smartphone demand waves.' }
    ],
    competitors: [
      { name: 'Samsung Electronics', ticker: 'SMSN.IL', marketCap: '$360 B', advantage: 'Global scale across both high-end and entry-level phone classes.', threatLevel: 'Medium' },
      { name: 'Alphabet Inc.', ticker: 'GOOGL', marketCap: '$1.89 T', advantage: 'Android Mobile OS commands 70% share of global users.', threatLevel: 'Severe' },
      { name: 'Huawei Solutions', ticker: 'HUA.UL', marketCap: 'Private', advantage: 'Strong nationalist product capture inside massive Chinese retail markets.', threatLevel: 'Severe' }
    ],
    history: [
      { year: '1980', title: 'The Initial Public Float', wallStreetImpact: 'Set base computing standards.', story: 'Went public making thousands of early investors rich overnight; Steve Jobs was booted shortly after.' },
      { year: '1997', title: 'Steve Jobs Returns', wallStreetImpact: 'The most legendary corporate salvage ever executed.', story: 'On the verge of bankruptcy, Jobs returned, trimmed product bloat, and secured $150M from Microsoft.' },
      { year: '2007', title: 'The iPhone Unveiling', wallStreetImpact: 'Created the modern consumer digital era.', story: 'Combined a touch iPod, telephone, and internet communicator into one device, reshaping society.' },
      { year: '2018', title: 'Passing $1 Trillion Cap', wallStreetImpact: 'Proved the compounding force of dividend buyback engines.', story: 'Transitioned from raw product device sales to high-margin subscription service monetization.' }
    ],
    newsImpacts: [
      { id: 'anti_trust', headline: 'European Commission Imposes $2.1B Fine, Ordering Apple to Open Alternative App Stores', source: 'Wall Street Journal', sentiment: 'Bearish', impactPct: -4.8, explanation: 'Order breaks App Store absolute distribution dominance inside European borders, risking core service fee revenues.', relatedMarket: 'EUR/USD conversion rises' },
      { id: 'ai_chip', headline: 'Apple Unveils Private Spatial Apple Intelligence Stacks on Advanced TSMC 3nm Wafers', source: 'TechCrunch Feed', sentiment: 'Bullish', impactPct: 6.2, explanation: 'Creates direct demand for consumers to purchase new iPhone upgrades to access hardware-locked AI systems.', relatedMarket: 'TSMC stock surges' }
    ],
    education: {
      title: 'What Is a Premium Ecosystem Lock-In?',
      question: 'How do service margins defend corporate returns?',
      concept: 'Apple generates an ultra-stable Return on Equity because it charges a subscription toll on the digital lives of users. Once a consumer owns the device and stores photos in iCloud, exit costs are too painful to switch.',
      metricLabel: 'Active Global iCloud Subscribers',
      metricMin: 50000000,
      metricMax: 900000000,
      metricDefault: 200000000,
      metricUnit: 'users',
      formulaExplanation: 'Services Segment Profit = (Users * Monthly Fee) - Server Cloud Cost. Services margins approach 70% vs hardware margins at 35%.',
      getLeverageResults: (users: number) => {
        const monthlyFee = 2.99;
        const yearlyRevenue = users * monthlyFee * 12;
        const serverSupportCost = users * 0.40 * 12; // 40 cents a user
        const fixedAppleHQOverhead = 150000000; // $150M engineering
        const netProfit = yearlyRevenue - serverSupportCost - fixedAppleHQOverhead;
        const projectedMargin = (netProfit / yearlyRevenue) * 100;
        
        let grade = 'LOW USER UTILIZATION • CASH BURN';
        if (projectedMargin > 60) {
          grade = 'ELITE LOCK-IN • RENT-SEEKING TOLL GRID';
        } else if (projectedMargin > 30) {
          grade = 'STABILIZED CLOUD CASH ENGINES';
        }

        return { marginalCost: 0.40 * 12, revenueGen: yearlyRevenue, grossOverhead: fixedAppleHQOverhead, projectedMargin, grade };
      }
    }
  },
  nvidia: {
    ticker: 'NVDA',
    name: 'NVIDIA Corporation',
    logo: '💚',
    industry: 'High-Performance Semiconductor Systems',
    marketCap: '$2.98 T',
    revenue: '$60.9 B',
    margins: '57.1%',
    basePrice: 875.12,
    desc: 'NVIDIA prints the high-bandwidth parallel processing Tensor-Core GPUs and CUDA compiler ecosystems that form the physical bedrock of AI.',
    operations: [
      { name: 'Datacenter Server AI (HGX)', description: 'Selling giant H100/H200/Blackwell processing nodes to hyperscaler clouds.', icon: Cpu, revenueShare: 85, techStack: 'Tensor-core matrices, TSMC CoWoS packaging' },
      { name: 'Gaming & RTX Graphics', description: 'Consumer PC 3D graphics boards for digital gaming and raytracing software.', icon: Layers, revenueShare: 10, techStack: 'Ada Lovelace, DLSS upscaling logic' },
      { name: 'Enterprise Visualizations', description: 'Bespoke metaverse omniverse development and industrial digital twin models.', icon: Database, revenueShare: 3, techStack: 'USD architecture, ray tracing' },
      { name: 'Automotive Kinetic Drive', description: 'Onborn autonomous visual processing chips for robotic taxi fleets.', icon: Activity, revenueShare: 2, techStack: 'Orin system-on-chip' }
    ],
    drivers: [
      { factor: 'Hyperscaler AI Capital Expenditure', impact: 'Critical', description: 'Cloud giants (Microsoft, Amazon, Google) buying processing boards to build data centers.', activeTrend: 'Consistently rising to massive records.' },
      { factor: 'Taiwan Strait Geopolitics', impact: 'Critical', description: 'Exclusive dependence on TSMC’s advanced Hsinchu foundries exposes them to military blocking risks.', activeTrend: 'High sovereign defense friction.' },
      { factor: 'CUDA Programming Monopoly', impact: 'High', description: 'Developers run software solely on NVDA silicon because of forty-thousand proprietary libraries.', activeTrend: 'Extremely strong developer lock.' }
    ],
    relatedIndustries: [
      { name: 'Semiconductors & EUV Lithography', path: 'encyclopedia/sectors/semiconductor-sector.html', connection: 'Prints silicon wafers using extreme neon-arc laser systems.' },
      { name: 'AI & Neural Systems', path: 'ai-intelligence.html', connection: 'Provides the parallel hardware processors to train and infer LLMs.' }
    ],
    competitors: [
      { name: 'Advanced Micro Devices', ticker: 'AMD', marketCap: '$285 B', advantage: 'Open-source software stacks with comparative hardware price-to-performance.', threatLevel: 'Severe' },
      { name: 'Intel Corporation', ticker: 'INTC', marketCap: '$140 B', advantage: 'Large domestic fabs being built to construct chips independently of Taiwan.', threatLevel: 'Medium' },
      { name: 'Google (Custom TPU Silicon)', ticker: 'GOOG', marketCap: '$1.89 T', advantage: 'Builds internal tensor units explicitly optimized to skip retail margins.', threatLevel: 'Medium' }
    ],
    history: [
      { year: '1999', title: 'Invented the Modern GPU', wallStreetImpact: 'Unlocked real-time 3D computer graphics.', story: 'Introduced the GeForce 256, offloading mathematical visuals from standard central computer processors.' },
      { year: '2006', title: 'CUDA Software Debuts', wallStreetImpact: 'Turned graphic cards into general-purpose supercomputers.', story: 'CEO Jensen Huang spent billions building software allowing scientists to write standard C++ code on GPUs.' },
      { year: '2012', title: 'AlexNet Wins ImageNet', wallStreetImpact: 'Sparked the modern deep learning revolution.', story: 'An early neural network ran on two NVIDIA GeForce cards, crushing standard programmatic vision databases.' },
      { year: '2023', title: 'The Generative AI Boom', wallStreetImpact: 'The fastest valuation growth past $2 Trillion ever witnessed.', story: 'ChatGPT launched on ten-thousand A100 chips, prompting every corporate entity to buy computing nodes.' }
    ],
    newsImpacts: [
      { id: 'chip_ban', headline: 'US Commerce Department Announces Complete Export Block on Blackwell Chips to Non-Allied Tech Hubs', source: 'Financial Times', sentiment: 'Bearish', impactPct: -8.1, explanation: 'Export rules trim addressable server market size, cutting billions in immediate backlog delivery orders.', relatedMarket: 'USD Index jumps' },
      { id: 'msft_buy', headline: 'Microsoft Azure Discloses $15B Order for NVIDIA Blackwell Units to Power Open AI v5 Launch', source: 'ClearPath Terminal', sentiment: 'Bullish', impactPct: 9.4, explanation: 'Proves cloud server companies haven\'t finished capex pipelines, maintaining massive backlogs.', relatedMarket: 'MSFT stock up' }
    ],
    education: {
      title: 'What Is a Supply-Chain Bottleneck & Monopoly Pricing?',
      question: 'How do chip yields drive explosive net income?',
      concept: 'NVIDIA commands unprecedented margins (exceeding 55%) because they possess a functional monopoly on AI hardware computation. Hyperscalers cannot easily swap to competitors because standard software runs exclusively on CUDA.',
      metricLabel: 'TSMC CoWoS Advanced Wafer Allocation',
      metricMin: 5000,
      metricMax: 120000,
      metricDefault: 20000,
      metricUnit: 'wafers/mo',
      formulaExplanation: 'Profit Generated = (Wafer Allocation * Chips Per Wafer * Selling Price) - R&D Costs. Each wafer produces roughly 60 Blackwell GPUs.',
      getLeverageResults: (wafers: number) => {
        const chipsPerWafer = 58;
        const pricePerChip = 32000; // Blackwell selling price
        const yearlyRevenue = wafers * 12 * chipsPerWafer * pricePerChip;
        const costToPrintWafer = 18000; // paid to TSMC
        const directFrictionCosts = wafers * 12 * costToPrintWafer;
        const R_and_D_Fixed = 2400000000; // $2.4B fixed graphics research
        const netProfit = yearlyRevenue - directFrictionCosts - R_and_D_Fixed;
        const projectedMargin = (netProfit / yearlyRevenue) * 100;
        
        let grade = 'GPU ALLOCATION DROPS • UNPROFITABLE CORES';
        if (projectedMargin > 50) {
          grade = 'ELITE MONOPOLY SCALING • HIGH COMPUTE TOLL';
        } else if (projectedMargin > 15) {
          grade = 'STABLE FOUNDRY RETENTION CORES';
        }

        return { marginalCost: costToPrintWafer, revenueGen: yearlyRevenue, grossOverhead: R_and_D_Fixed, projectedMargin, grade };
      }
    }
  },
  microsoft: {
    ticker: 'MSFT',
    name: 'Microsoft Corporation',
    logo: '🟦',
    industry: 'Enterprise Cloud Infrastructure & Software',
    marketCap: '$3.38 T',
    revenue: '$227.6 B',
    margins: '35.3%',
    basePrice: 415.50,
    desc: 'Microsoft anchors global enterprises via Windows OS, Azure cloud infrastructure, and leading generative AI copilots inside corporate data.',
    operations: [
      { name: 'Azure Cloud Platform', description: 'Hosting virtual enterprise servers, massive datacenters, and AI model backends.', icon: Cpu, revenueShare: 43, techStack: 'Hyper-V, Azure Resource Manager' },
      { name: 'Office & Enterprise SaaS', description: 'Software suites (Office 365, Teams, Dynamic CRM) charging per-user subscription fees.', icon: Database, revenueShare: 31, techStack: 'SaaS cloud syncing calendars' },
      { name: 'Personal Computing & Windows', description: 'Windows OS licensing tags, Surface notebooks, and consumer electronics.', icon: Layers, revenueShare: 14, techStack: 'Win32 architecture, hardware interfaces' },
      { name: 'Gaming & Xbox Systems', description: 'Publishing major game franchises and hosting multi-user online gaming subscriptions.', icon: Activity, revenueShare: 12, techStack: 'DirectX, Game Pass cloud streaming' }
    ],
    drivers: [
      { factor: 'Corporate Cloud IT Spending', impact: 'Critical', description: 'Enterprise budgets shifting from physical servers to recurring Azure configurations.', activeTrend: 'Healthy growth tracking software automation.' },
      { factor: 'OpenAI Integration Leadership', impact: 'Critical', description: 'First-mover capture of LLM capabilities via exclusive multi-billion partnership integration.', activeTrend: 'Copilot products actively scaling users.' },
      { factor: 'Datacenter Power Grid Limits', impact: 'High', description: 'Requires massive continuous electric baseload grid setups to cool hyper-scale clusters.', activeTrend: 'Investing in private nuclear reactor plans.' }
    ],
    relatedIndustries: [
      { name: 'AI & Neural Systems', path: 'ai-intelligence.html', connection: 'Microsoft operates the core server clouds for top international AI labs.' },
      { name: 'Sovereign Energy Grid', path: 'encyclopedia/markets/commodities.html', connection: 'Server energy demands require extensive direct power allocations.' }
    ],
    competitors: [
      { name: 'Amazon (AWS)', ticker: 'AMZN', marketCap: '$1.86 T', advantage: 'Created the early cloud market; commands highest developer share.', threatLevel: 'Severe' },
      { name: 'Alphabet Inc. (Google GCP)', ticker: 'GOOGL', marketCap: '$1.89 T', advantage: 'Deep internal data structures with advanced TPUs for machine training.', threatLevel: 'Severe' },
      { name: 'Salesforce Solutions', ticker: 'CRM', marketCap: '$260 B', advantage: 'Dominates enterprise relationship databases with thick corporate ties.', threatLevel: 'Medium' }
    ],
    history: [
      { year: '1986', title: 'The Desktop Initial Float', wallStreetImpact: 'Launches the PC software era.', story: 'Went public at $21.00. Co-founder Bill Gates became a billionaire within a year, enforcing licensing standardizations.' },
      { year: '1998', title: 'Federal Antitrust Battles', wallStreetImpact: 'Exposed the perils of anti-competitive software models.', story: 'US sued Microsoft for forcing Internet Explorer onto systems, slowing corporate dominance loops for a decade.' },
      { year: '2014', title: 'Satya Nadella Appointed', wallStreetImpact: 'Flipped company focus from legacy Windows to Azure cloud.', story: 'Nadella launched the Cloud-First era, buying GitHub, LinkedIn, and building the premium Azure ecosystem.' },
      { year: '2023', title: 'The $13B OpenAI Investment', wallStreetImpact: 'Captured the global pole position in artificial intelligence.', story: 'Locked in early access to high-end GPT models, deploying Copilot across enterprise clients instantly.' }
    ],
    newsImpacts: [
      { id: 'aws_deal', headline: 'Azure Wins Multi-Year $8B Sovereign Defense Cloud Security Contract Over Peers', source: 'ClearPath Defense Tracker', sentiment: 'Bullish', impactPct: 5.4, explanation: 'Validates Azure security protocols, guaranteeing multi-decade cloud resource billing backlogs.', relatedMarket: 'US Bond Yields flat' },
      { id: 'grid_short', headline: 'Power Utility Caps Force Delays on Three Microsoft Server Sites in Virginia', source: 'Reuters Business Desk', sentiment: 'Bearish', impactPct: -3.8, explanation: 'Local electric grids cannot support high server loads, dragging near-term AI scale speed bounds.', relatedMarket: 'Natural Gas prices uptick' }
    ],
    education: {
      title: 'What Is SaaS & Dynamic Expansion Multipliers?',
      question: 'How do seat licensing metrics amplify software capital?',
      concept: 'Microsoft enjoys legendary capital security because its software forms the baseline operating system of civilization. A firm cannot run spreadsheets or messaging without licensing Office seats, creating high-margin recurring annuities.',
      metricLabel: 'Enterprise Co-Pilot Seat Licenses',
      metricMin: 500000,
      metricMax: 50000000,
      metricDefault: 4000000,
      metricUnit: 'seats',
      formulaExplanation: 'Annuity Cash Flows = (Seats * Monthly Copilot Fee) - Hardware Compute Server Costs.',
      getLeverageResults: (seats: number) => {
        const copilotPrice = 30.00; // $30 user/mo
        const yearlyRevenue = seats * copilotPrice * 12;
        const datacenterHostingExpense = seats * 6.50 * 12; // cost of servers
        const fixedAIResearchHQ = 320000000; // $320M fixed models
        const netProfit = yearlyRevenue - datacenterHostingExpense - fixedAIResearchHQ;
        const projectedMargin = (netProfit / yearlyRevenue) * 100;
        
        let grade = 'LOW COPILOT SEATS • UNRECOVERABLE COMPUTE EXPENSE';
        if (projectedMargin > 50) {
          grade = 'ELITE SaaS SEAT LIFT • EXPONENTIAL ARPU LIFT';
        } else if (projectedMargin > 10) {
          grade = 'MODERATE SOFTWARE RETENTION RATIOS';
        }

        return { marginalCost: 6.50 * 12, revenueGen: yearlyRevenue, grossOverhead: fixedAIResearchHQ, projectedMargin, grade };
      }
    }
  },
  amazon: {
    ticker: 'AMZN',
    name: 'Amazon.com, Inc.',
    logo: '📦',
    industry: 'Logistics Pipelines & Global Web Services',
    marketCap: '$1.85 T',
    revenue: '$574.8 B',
    margins: '5.3%',
    basePrice: 178.15,
    desc: 'Amazon manages the leading transactional e-commerce pipeline alongside AWS, the virtual compute hub hosting the internet’s infrastructure.',
    operations: [
      { name: 'AWS Cloud Hosting', description: 'Providing virtualized computing, data storage, and server clusters to top governments.', icon: Cpu, revenueShare: 16, techStack: 'AWS EC2, S3 structures, custom Graviton silicon' },
      { name: 'Product Store Retail', description: 'Matching buyers with physical products from fulfillment complexes internationally.', icon: Layers, revenueShare: 46, techStack: 'Automated fulfillment, complex regional delivery networks' },
      { name: 'Third Party Seller toll', description: 'Toll fees on external sellers utilizing warehouses, labels, and delivery slots.', icon: Database, revenueShare: 24, techStack: 'Merchant seller APIs' },
      { name: 'Ad networks & Premium Video', description: 'Displaying contextual ads across products, Prime videos, and Twitch systems.', icon: DollarSign, revenueShare: 14, techStack: 'Bid click auction engines' }
    ],
    drivers: [
      { factor: 'Global Consumer Liquidity', impact: 'Critical', description: 'Families keeping disposable income reserves to purchase non-essential books, games, or clothes.', activeTrend: 'Squeezed as rental inflation ticks up.' },
      { factor: 'Commercial Fuel & Transport Overhead', impact: 'High', description: 'Crude and logistics transportation diesel prices impact overall shipping and fulfillment margins.', activeTrend: 'Relatively stable, tracking global crude export bounds.' },
      { factor: 'Hyperscaler AWS Workloads', impact: 'Critical', description: 'Traders and startups scaling internet apps directly boosts billing meters on AWS servers.', activeTrend: 'Strong data growth across all nodes.' }
    ],
    relatedIndustries: [
      { name: 'Sovereign Energy Grid', path: 'encyclopedia/markets/commodities.html', connection: 'Fulfillment fleets consume massive daily transport fuels.' },
      { name: 'AI & Neural Systems', path: 'ai-intelligence.html', connection: 'AWS acts as the underlying database layer for top software companies.' }
    ],
    competitors: [
      { name: 'Walmart Inc.', ticker: 'WMT', marketCap: '$495 B', advantage: 'Unparalleled local grocery logistics networks with physical store pickup sites.', threatLevel: 'Severe' },
      { name: 'Shopify Corporation', ticker: 'SHOP', marketCap: '$105 B', advantage: 'Empowers independent merchants to bypass Amazon’s locked platform rules.', threatLevel: 'Severe' },
      { name: 'Microsoft (Azure Cloud)', ticker: 'MSFT', marketCap: '$3.38 T', advantage: 'Deep integration inside legacy enterprise corporate software agreements.', threatLevel: 'Severe' }
    ],
    history: [
      { year: '1997', title: 'The Bookstore IPO Float', wallStreetImpact: 'Redefined venture scale concepts.', story: 'Went public at $18.00 per share. Jeff Bezos emphasized long-term market dominance over near-term profit metrics.' },
      { year: '2000', title: 'The Dot-Com Lockout', wallStreetImpact: 'Survival of structural models.', story: 'Amazon shares crashed 90% as capital locked up; Bezos secured critical bond funding to keep fulfillment facilities open.' },
      { year: '2006', title: 'AWS Cloud Launches', wallStreetImpact: 'Pioneered the modern cloud hosting economy.', story: 'Amazon rented out extra computer server space, creating high-margin digital cloud hosting models.' },
      { year: '2521', title: 'Pass $1.5 Trillion Cap', wallStreetImpact: 'Proved the compounding force of subscription Prime ecosystems.', story: 'Constructed an unparalleled global shipping framework with robotically driven centers.' }
    ],
    newsImpacts: [
      { id: 'fuel_spike', headline: 'OPEC Announces Unexpected 1.5M Barrel Fuel Export Cut, Spiking Diesel Overhead Costs', source: 'Commodity Monitor Alerts', sentiment: 'Bearish', impactPct: -4.3, explanation: 'Shipping fuels represent high fulfillment expenditures. Fuel spikes drag down slim direct e-commerce margins.', relatedMarket: 'Brent Crude spikes to $88' },
      { id: 'aws_ai', headline: 'Amazon Announces Unveiling of Anthropic AI Models Run Scalably on Custom AWS Trainium Silicon', source: 'ClearPath Tech Feed', sentiment: 'Bullish', impactPct: 6.8, explanation: 'Hyperscalers buying custom AWS trainium nodes bypass expensive external margins, locking client clouds.', relatedMarket: 'ASML foundries flat' }
    ],
    education: {
      title: 'What Is Capital Reinvestment & Cloud Subsidies?',
      question: 'How do cloud profits feed logistical scale?',
      concept: 'Amazon possesses a beautiful anti-competitive shield: high-margin software revenues from AWS subsidize a low-margin physical shipping network, allowing Amazon to undercut competitors on price and delivery speed.',
      metricLabel: 'Monthly AWS Active Cloud Workloads',
      metricMin: 10000,
      metricMax: 300000,
      metricDefault: 60000,
      metricUnit: 'containers',
      formulaExplanation: 'Logistics Subsidization Pool = AWS Profit - Shipping Fleet Cost. Low prices clear out local store competitors.',
      getLeverageResults: (containers: number) => {
        const pricePerContainer = 450.00;
        const cloudRevenue = containers * pricePerContainer * 12;
        const hardwareServerCost = containers * 85 * 12;
        const logisticalExpansionOverhead = 1400000000; // $1.4B fixed distribution expansion
        const cloudMargin = cloudRevenue - hardwareServerCost;
        const netCoreYield = cloudMargin - logisticalExpansionOverhead;
        const projectedMargin = (netCoreYield / cloudRevenue) * 100;
        
        let grade = 'LOW CLOUD DENSITY • LOGISTICS CRIPPLED BY ENGINES';
        if (projectedMargin > 40) {
          grade = 'ELITE CLOUD REVENUE • LOGISTICAL MONOPOLY EXPANSION ACTIVE';
        } else if (projectedMargin > 5) {
          grade = 'MODERATE SHIFT • BALANCED CAPITAL';
        }

        return { marginalCost: 85 * 12, revenueGen: cloudRevenue, grossOverhead: logisticalExpansionOverhead, projectedMargin, grade };
      }
    }
  }
};

export default function StockDetailsView({ companyKey, selectFileNode }: StockDetailsViewProps) {
  const profile = STOCK_PROFILES_DATABASE[companyKey] || STOCK_PROFILES_DATABASE['tesla'];
  
  // TABS STATE
  const [activeTab, setActiveTab] = useState<'does' | 'moves' | 'comps' | 'history' | 'news' | 'moved_today' | 'edu' | 'profile'>('does');
  
  // DYNAMIC PRICE SIMULATOR
  const [simulatedPrice, setSimulatedPrice] = useState(profile.basePrice);
  const [priceHistory, setPriceHistory] = useState<number[]>([]);
  const [activeFactors, setActiveFactors] = useState<Record<string, 'neutral' | 'bullish' | 'bearish'>>({});
  const [lastPriceUpdate, setLastPriceUpdate] = useState<'none' | 'up' | 'down'>('none');
  const [tappedMetricValue, setTappedMetricValue] = useState(profile.education.metricDefault);
  const [selectedNewsId, setSelectedNewsId] = useState<string | null>(null);

  // Restart settings when profile transitions
  useEffect(() => {
    setSimulatedPrice(profile.basePrice);
    setPriceHistory(Array.from({ length: 15 }, (_, i) => {
      const noise = (Math.random() - 0.5) * (profile.basePrice * 0.05);
      return profile.basePrice + noise;
    }));
    
    // Default neutral factors
    const initFactors: Record<string, 'neutral' | 'bullish' | 'bearish'> = {};
    profile.drivers.forEach(d => {
      initFactors[d.factor] = 'neutral';
    });
    setActiveFactors(initFactors);
    setTappedMetricValue(profile.education.metricDefault);
    setSelectedNewsId(null);
    setActiveTab('does');
  }, [companyKey, profile]);

  const toggleFactor = (factor: string) => {
    setActiveFactors(prev => {
      const current = prev[factor] || 'neutral';
      let next: 'neutral' | 'bullish' | 'bearish' = 'neutral';
      if (current === 'neutral') next = 'bullish';
      else if (current === 'bullish') next = 'bearish';
      else next = 'neutral';
      
      const newFactors = { ...prev, [factor]: next };
      
      // Calculate new pricing
      let multiplier = 1.0;
      Object.entries(newFactors).forEach(([f, state]) => {
        if (state === 'bullish') multiplier += 0.045;
        if (state === 'bearish') multiplier -= 0.05;
      });

      const nextPrice = Math.max(10, profile.basePrice * multiplier);
      setLastPriceUpdate(nextPrice > simulatedPrice ? 'up' : (nextPrice < simulatedPrice ? 'down' : 'none'));
      setSimulatedPrice(nextPrice);
      setPriceHistory(history => [...history.slice(1), nextPrice]);

      return newFactors;
    });
  };

  const triggerNewsImpact = (newsId: string, pct: number) => {
    setSelectedNewsId(newsId);
    
    const nextPrice = Math.max(10, simulatedPrice * (1 + pct / 100));
    setLastPriceUpdate(nextPrice > simulatedPrice ? 'up' : 'down');
    setSimulatedPrice(nextPrice);
    setPriceHistory(history => [...history.slice(1), nextPrice]);
    
    setTimeout(() => {
      setLastPriceUpdate('none');
    }, 1500);
  };

  const currentPriceChangePct = ((simulatedPrice - profile.basePrice) / profile.basePrice) * 100;
  const isUp = simulatedPrice >= profile.basePrice;

  // Render operating metrics calculations
  const eduResults = profile.education.getLeverageResults(tappedMetricValue);

  return (
    <div className="flex flex-col gap-6 animate-fadeIn text-left select-text max-w-7xl mx-auto w-full">
      
      {/* CINEMATIC APP HERO BAR COMPONENT */}
      <div className="relative p-6 md:p-8 bg-gradient-to-r from-neutral-950 via-[#030612]/95 to-neutral-500/5 border border-cyan-500/20 rounded-[32px] shadow-2xl overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(0,217,255,0.04)_0%,transparent_60%)] pointer-events-none" />
        
        {/* UPPER ROW DESCRIPTION */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4 select-none">
          <div className="flex items-center gap-3">
            <span className="text-3xl filter drop-shadow-[0_0_8px_rgba(0,217,255,0.3)]">{profile.logo}</span>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-[9px] uppercase tracking-[0.25em] text-[#00D9FF] font-black">SYLLABUS SECURED COMPANY</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              </div>
              <h1 className="text-white font-black text-xl md:text-3xl tracking-tight leading-none uppercase mt-0.5">
                {profile.name} (TICKER: {profile.ticker})
              </h1>
            </div>
          </div>

          {/* DYNAMIC REAL-TIME TICKS INDICATOR */}
          <div className="flex items-center gap-3 bg-black/45 border border-white/5 p-3 rounded-2xl shrink-0">
            <div className="flex flex-col text-right">
              <span className="font-mono text-[8px] text-zinc-500 uppercase font-black tracking-widest leading-none">Simulated Market Feed</span>
              <span className={`font-mono text-base font-black leading-none mt-1 transition-all duration-300 ${lastPriceUpdate === 'up' ? 'text-emerald-400 scale-105' : (lastPriceUpdate === 'down' ? 'text-rose-400 scale-105' : 'text-white')}`}>
                ${simulatedPrice.toFixed(2)}
              </span>
            </div>
            
            <div className={`p-1.5 px-2.5 rounded-lg text-[9px] font-mono font-black flex items-center gap-0.5 ${currentPriceChangePct >= 0 ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/25' : 'bg-rose-500/10 text-rose-450 border border-rose-500/25'}`}>
              {currentPriceChangePct >= 0 ? '+' : ''}{currentPriceChangePct.toFixed(2)}%
            </div>
          </div>
        </div>

        <div className="w-full h-px bg-white/5 my-4" />

        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
          <p className="md:col-span-8 text-zinc-300 text-xs md:text-sm leading-relaxed font-sans font-medium text-left">
            {profile.desc}
          </p>
          
          <div className="md:col-span-4 grid grid-cols-3 gap-2 shrink-0">
            <div className="p-2.5 bg-black/55 border border-white/[0.03] rounded-xl text-left select-noneHome">
              <span className="text-[7.5px] font-mono uppercase text-zinc-500 block leading-none">Market Cap</span>
              <span className="text-white font-black text-[10.5px] tracking-wide block truncate mt-1 leading-none">{profile.marketCap}</span>
            </div>
            <div className="p-2.5 bg-black/55 border border-white/[0.03] rounded-xl text-left select-noneHome">
              <span className="text-[7.5px] font-mono uppercase text-zinc-500 block leading-none">Net Revenue</span>
              <span className="text-white font-black text-[10.5px] tracking-wide block truncate mt-1 leading-none">{profile.revenue}</span>
            </div>
            <div className="p-2.5 bg-black/55 border border-white/[0.03] rounded-xl text-left select-noneHome">
              <span className="text-[7.5px] font-mono uppercase text-zinc-500 block leading-none">Net Profit</span>
              <span className="text-[#00D9FF] font-black text-[10.5px] tracking-wide block truncate mt-1 leading-none">{profile.margins}</span>
            </div>
          </div>
        </div>
      </div>

      {/* SYLLABUS CONTROLLER DECK TAB NAVIGATION ROW */}
      <div className="bg-black/60 border border-white/5 p-1.5 rounded-2xl flex flex-wrap gap-1 w-full select-none justify-start relative z-10 overflow-x-auto custom-scrollbar">
        {[
          { id: 'does', label: 'Ecosystem Operations 🧩', desc: 'Syllabus core layers' },
          { id: 'profile', label: 'Profile Engine 🏢', desc: 'Dossier & Sensitivity' },
          { id: 'moves', label: 'Value Drivers 🌀', desc: 'Gravity & mineral limits' },
          { id: 'comps', label: 'Biggest Peers ⚔️', desc: 'Moat comparisons' },
          { id: 'news', label: 'News Impact Feed 📡', desc: 'Simulate headline spikes' },
          { id: 'moved_today', label: 'Why It Moved Today 📈', desc: 'Interactive pricing engine' },
          { id: 'edu', label: 'Education tab 🎓', desc: 'Growth margins tool' },
          { id: 'history', label: 'History Wall 🕰️', desc: 'Interstellar Wall Street story' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`py-2 px-3.5 rounded-xl transition-all cursor-pointer text-left flex flex-col gap-0.5 shrink-0 ${activeTab === tab.id ? 'bg-[#00D9FF]/10 border border-[#00D9FF]/35 text-white font-bold' : 'hover:bg-white/5 border border-transparent text-zinc-450 hover:text-zinc-200'}`}
          >
            <span className="text-[10px] tracking-wide uppercase font-black">{tab.label}</span>
            <span className="text-[8px] font-mono font-medium text-zinc-500 block leading-none mt-0.5">{tab.desc}</span>
          </button>
        ))}
      </div>

      {/* ACTIVE SCREENER TAB VIEWPORTS */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="w-full"
        >

          {/* PROFILE ENGINE VIEWPORT */}
          {activeTab === 'profile' && (() => {
            const matchedComp = companies.find((c: any) => c.ticker === profile.ticker) || companies[0];
            return (
              <div className="w-full">
                <CompanyPage company={matchedComp} />
              </div>
            );
          })()}

          {/* 1. ECOSYSTEM OPERATIONS (WHAT THE COMPANY DOES) */}
          {activeTab === 'does' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
              
              {/* Product cards grid */}
              <div className="lg:col-span-7 flex flex-col gap-4">
                <div className="p-5 bg-black/40 border border-white/5 rounded-3xl flex flex-col gap-1.5">
                  <span className="font-mono text-[9px] uppercase text-cyan-400 font-extrabold tracking-wider">Ecosystem Architecture Blueprint</span>
                  <h3 className="text-white font-black text-sm uppercase tracking-tight">How {profile.name} Generates Value</h3>
                  <p className="text-zinc-450 text-[11px] leading-relaxed">
                    Unlike standard single-channel car or phone makers, {profile.ticker} functions as an interconnected cycle. Hover or tap each product sector to inspect internal technical configurations.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {profile.operations.map((op, idx) => {
                    const OpIcon = op.icon;
                    return (
                      <div 
                        key={idx} 
                        className="p-5 bg-gradient-to-b from-[#02040b]/95 to-[#050917]/90 border border-white/5 hover:border-cyan-500/20 rounded-2xl transition-all text-left flex flex-col justify-between group"
                      >
                        <div>
                          <div className="flex justify-between items-center mb-3">
                            <div className="p-1.5 px-2.5 bg-[#00D9FF]/10 rounded-lg text-cyan-400 font-mono text-[10px] font-bold uppercase leading-none">
                              {op.revenueShare}% Share
                            </div>
                            <div className="p-2 bg-neutral-900 border border-white/5 rounded-lg text-zinc-400 group-hover:text-cyan-400 group-hover:border-cyan-500/10 transition-all">
                              <OpIcon className="w-4 h-4" />
                            </div>
                          </div>
                          
                          <h4 className="text-white font-extrabold text-xs uppercase tracking-wide leading-tight group-hover:text-[#00D9FF] transition-colors">{op.name}</h4>
                          <p className="text-zinc-400 text-[10.5px] leading-normal mt-2 font-medium">{op.description}</p>
                        </div>

                        <div className="pt-3 border-t border-white/5 mt-4 text-[8px] font-mono text-zinc-550 flex items-center justify-between">
                          <span>CORE TELEMETRY:</span>
                          <span className="text-zinc-400 font-black tracking-wide uppercase">{op.techStack}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Interstellar Visual Blueprint Block */}
              <div className="lg:col-span-5 p-6 bg-radial-at-t from-[#02081c] to-[#01040a] border border-cyan-500/20 rounded-[32px] flex flex-col justify-between shadow-lg relative overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,217,255,0.015)_0%,transparent_70%)] pointer-events-none" />
                <div className="absolute top-0 right-0 p-3 flex items-center gap-1 font-mono text-[8px] text-cyan-400 font-extrabold uppercase">
                  <span>ACTIVE KINETIC DEFUNS REGISTERED</span>
                </div>

                <div className="flex flex-col gap-1.5">
                  <h4 className="text-white font-extrabold text-[10.5px] tracking-widest font-mono border-b border-white/5 pb-2 mb-4 flex items-center gap-1.5 uppercase">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#00D9FF] animate-ping" />
                    Interstellar Operation Loop Hub
                  </h4>

                  {/* Flow chart diagram illustrating network synergy */}
                  <div className="flex flex-col gap-4 py-4 relative">
                    <div className="absolute left-[20px] top-[20px] bottom-[20px] w-0.5 bg-gradient-to-b from-cyan-500 via-[#FF00C8]/40 to-emerald-400/45" />
                    
                    {profile.operations.map((op, i) => (
                      <div key={i} className="flex gap-4 items-center pl-1 relative z-10">
                        <div className="w-9 h-9 rounded-full bg-neutral-900 border-2 border-cyan-500/20 text-white flex items-center justify-center font-black font-mono text-[10.5px] shadow-[0_0_15px_rgba(0,217,255,0.05)]">
                          0{i+1}
                        </div>
                        <div className="p-3 bg-[#010309]/95 border border-white/5 rounded-xl flex-1 text-left">
                          <span className="text-zinc-500 font-mono text-[7.5px] block leading-none mb-0.5">SYNERGY STEP 0{i+1}: COMPILING CORES</span>
                          <span className="text-white font-bold text-[10.5px] tracking-wide leading-none uppercase">{op.name}</span>
                          <p className="text-zinc-500 font-sans text-[8.5px] leading-tight mt-1 truncate">Provides core capabilities and capital to expand downstream products</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-4 bg-[#010309]/80 border border-white/5 rounded-2xl text-[9px] text-zinc-400 leading-normal font-sans mt-4">
                  <strong className="text-white uppercase font-black font-mono text-[8px] block mb-0.5">ACADEMIC LESSON:</strong>
                  Public stock prices model the cumulative cash flows generated by ALL nodes simultaneously, discounting structural single-product substitution risks.
                </div>
              </div>

            </div>
          )}


          {/* 2. VALUE DRIVERS (WHAT MOVES THE STOCK & RELATED INDUSTRIES) */}
          {activeTab === 'moves' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
              
              {/* Factor cards */}
              <div className="lg:col-span-7 flex flex-col gap-4">
                <div className="p-5 bg-black/40 border border-white/5 rounded-3xl flex flex-col gap-1.5">
                  <span className="font-mono text-[9px] uppercase text-amber-400 font-extrabold tracking-wider">Gravitational Driver Fields</span>
                  <h3 className="text-white font-black text-sm uppercase tracking-tight">Gravity Forces Driving {profile.ticker} Valuation</h3>
                  <p className="text-zinc-450 text-[11px] leading-relaxed">
                    Sovereign stocks do not float in a vacuum. They exist inside a tight framework of credit prices (interest rates), resource limits, and trade regulations. Tap any driver to inspect its dynamic transmission path.
                  </p>
                </div>

                <div className="flex flex-col gap-2.5">
                  {profile.drivers.map((drv, idx) => (
                    <div 
                      key={idx} 
                      className="p-4 bg-[#030612]/95 border border-white/5 hover:border-amber-500/10 rounded-2xl flex items-start gap-4 transition-all"
                    >
                      <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 mt-1 shrink-0">
                        <Sliders className="w-4.5 h-4.5" />
                      </div>
                      <div className="flex flex-col text-left">
                        <div className="flex items-center gap-2">
                          <h4 className="text-white font-extrabold text-[12px] uppercase tracking-wide">{drv.factor}</h4>
                          <span className={`py-0.5 px-2 rounded font-mono text-[8.5px] font-black uppercase ${drv.impact === 'Critical' ? 'bg-rose-500/10 text-rose-455 border border-rose-500/25' : 'bg-amber-500/10 text-amber-400 border border-amber-500/25'}`}>
                            {drv.impact} Impact
                          </span>
                        </div>
                        <p className="text-zinc-400 text-xs mt-1.5 leading-relaxed font-sans">{drv.description}</p>
                        <span className="text-[8.5px] font-mono text-zinc-550 block mt-2">
                          <strong className="text-zinc-400 font-bold">CURRENT SYLLABUS TREND:</strong> {drv.activeTrend}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Related industries loops */}
              <div className="lg:col-span-5 p-6 bg-gradient-to-br from-neutral-950 to-[#02050e] border border-white/5 rounded-3xl flex flex-col justify-between shadow-xl">
                <div>
                  <h4 className="text-white font-extrabold text-[10.5px] tracking-widest font-mono border-b border-white/5 pb-2 mb-4 flex items-center gap-1.5">
                    <Compass className="w-4 h-4 text-[#00D9FF] animate-spin" style={{ animationDuration: '24s' }} />
                    RELATED INDUSTRIES & MACRO SYLLABI
                  </h4>
                  <p className="text-zinc-400 text-[11px] leading-relaxed mb-4">
                    Tapping the links below navigates you into relevant encyclopedia indices to understand auxiliary supplies that limit or drive {profile.name} performance.
                  </p>

                  <div className="flex flex-col gap-3">
                    {profile.relatedIndustries.map((ind, i) => (
                      <button
                        key={i}
                        onClick={() => selectFileNode(ind.path)}
                        className="p-4 bg-black/60 hover:bg-[#00D9FF]/5 border border-white/5 hover:border-[#00D9FF]/20 rounded-2xl text-left transition-all group flex flex-col justify-between cursor-pointer"
                        style={{ minHeight: '110px' }}
                      >
                        <div>
                          <div className="flex justify-between items-center mb-1 select-none">
                            <span className="font-mono text-[8px] text-zinc-550 uppercase font-black">Syllabus Node 0{i+1}</span>
                            <ArrowRight className="w-3.5 h-3.5 text-zinc-500 group-hover:translate-x-1.5 transition-transform" />
                          </div>
                          <h5 className="text-white text-xs font-bold uppercase tracking-wide group-hover:text-[#00D9FF] transition-colors">{ind.name}</h5>
                          <p className="text-zinc-400 text-[9.5px] mt-1.5 leading-normal">{ind.connection}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="p-4 bg-[#00D9FF]/5 border border-cyan-500/10 rounded-2xl text-[9px] text-[#00D9FF] leading-normal font-sans mt-4">
                  <strong className="text-white uppercase font-black font-mono text-[8px] block mb-0.5">INTERSTELLAR INSIGHT:</strong>
                  Equities represent high-beta expressions of underlying physical commodity and energy networks. If physical cell lithium inputs lock, auto multiples must fall.
                </div>
              </div>

            </div>
          )}


          {/* 3. PEER ECOSYSTEM (BIGGEST COMPETITORS) */}
          {activeTab === 'comps' && (
            <div className="flex flex-col gap-6 w-full">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 block">
              {profile.competitors.map((comp, idx) => (
                <div 
                  key={idx} 
                  className="p-6 bg-gradient-to-b from-[#02040c]/98 via-[#040816]/95 to-neutral-950/80 border border-white/5 hover:border-pink-500/10 rounded-3xl flex flex-col justify-between transition-all group relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 p-3 font-mono font-black text-pink-500/10 text-[32px] select-none group-hover:text-pink-500/15 transition-all">
                    0{idx+1}
                  </div>
                  
                  <div>
                    <span className="font-mono text-[7.5px] text-zinc-550 block uppercase leading-none">PRIME SECTOR PEER COMPETITOR</span>
                    <h4 className="text-white font-extrabold text-sm uppercase tracking-wide mt-2.5 leading-none">
                      {comp.name}
                    </h4>
                    <span className="inline-block mt-1.5 font-mono text-[9px] py-0.5 px-2 bg-pink-500/10 border border-pink-500/25 rounded font-black text-pink-400">
                      TICKER: {comp.ticker}
                    </span>

                    <div className="w-10 h-0.5 bg-pink-500/20 my-4" />

                    <div className="grid grid-cols-2 gap-2.5 mb-4 text-left">
                      <div className="p-2.5 bg-black/45 border border-white/[0.02] rounded-xl">
                        <span className="text-[7.5px] font-mono uppercase text-zinc-500 block leading-none">Market Cap</span>
                        <span className="text-zinc-200 font-bold text-[10.5px] block truncate mt-1 leading-none">{comp.marketCap}</span>
                      </div>
                      <div className="p-2.5 bg-black/45 border border-white/[0.02] rounded-xl">
                        <span className="text-[7.5px] font-mono uppercase text-zinc-500 block leading-none">Syllabus Threat</span>
                        <span className={`font-black text-[10.5px] block truncate mt-1 leading-none ${comp.threatLevel === 'Severe' ? 'text-rose-450 animate-pulse' : 'text-amber-400'}`}>{comp.threatLevel}</span>
                      </div>
                    </div>

                    <div className="text-left">
                      <span className="text-[7.5px] font-mono uppercase text-zinc-550 block font-bold">Moat Advantage Override:</span>
                      <p className="text-zinc-450 text-[10.5px] leading-relaxed mt-1 font-sans">{comp.advantage}</p>
                    </div>
                  </div>

                  <div className="pt-4 mt-6 border-t border-white/5">
                    <button 
                      onClick={() => {
                        const fileMap: Record<string, string> = {
                          'byd': 'encyclopedia/stocks/tesla.html', // fallbacks
                          'rivian': 'encyclopedia/stocks/tesla.html',
                          'samsung': 'encyclopedia/stocks/apple.html',
                          'alphabet': 'encyclopedia/stocks/amazon.html',
                          'microsoft': 'encyclopedia/stocks/microsoft.html',
                          'amazon': 'encyclopedia/stocks/amazon.html'
                        };
                        const key = Object.keys(fileMap).find(k => comp.name.toLowerCase().includes(k));
                        if (key) selectFileNode(fileMap[key]);
                      }}
                      className="w-full text-center py-2.5 border border-pink-500/20 hover:border-pink-500 text-[10px] text-zinc-400 hover:text-white uppercase font-black font-mono tracking-widest rounded-xl transition-all cursor-pointer select-none"
                    >
                      Compare Core Sheets
                    </button>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-6">
              <RelationshipGraph 
                title={`${profile.name} Interactive Relationship & Competitor Network`}
                relationships={[
                  ...profile.competitors.map(c => c.name),
                  "Strategic Manufacturing Partners",
                  "Overnight Logistics Carriers",
                  "Venture Incubation Hubs",
                  "Market Makers & Clearing Houses"
                ]}
              />
            </div>
          </div>
          )}


          {/* 4. HISTORY WALL */}
          {activeTab === 'history' && (
            <div className="p-6 md:p-8 bg-black/40 border border-white/5 rounded-3xl flex flex-col gap-6 text-left">
              <div className="flex flex-col gap-1.5 border-b border-white/5 pb-4 select-none">
                <span className="font-mono text-[9px] uppercase text-[#00D9FF] font-black leading-none">Interstellar Chronicles</span>
                <h3 className="text-white font-black text-sm uppercase tracking-tight">How This Corp Changed Wall Street Structures</h3>
                <p className="text-zinc-450 text-[11px] leading-relaxed mt-1">
                  Pivotal moments where pricing paradigms were completely rewritten, proving why equities act as the final custodian of modern consumer capital.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 relative">
                {profile.history.map((hist, idx) => (
                  <div key={idx} className="p-5 bg-neutral-950/90 border border-white/5 hover:border-cyan-500/10 rounded-2xl flex flex-col justify-between relative overflow-hidden transition-all group">
                    <div className="absolute top-0 right-0 p-3 font-mono font-black text-cyan-450/5 text-[42px] select-none">{idx + 1}</div>
                    
                    <div>
                      <span className="font-mono font-black text-[12px] tracking-wider py-1 px-2 pb-0.5 bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 rounded inline-block mb-3.5 leading-none">
                        {hist.year}
                      </span>
                      <h4 className="text-white font-extrabold text-[12px] uppercase tracking-wide leading-tight mb-2 group-hover:text-cyan-400 transition-colors">{hist.title}</h4>
                      <p className="text-zinc-450 text-[10px] leading-relaxed mb-4">{hist.story}</p>
                    </div>

                    <div className="pt-3 border-t border-white/5 mt-auto text-left">
                      <span className="text-[7.5px] font-mono uppercase tracking-widest text-[#00D9FF] block font-black mb-1">WALL STREET SHOCK:</span>
                      <p className="text-zinc-300 text-[10.5px] leading-relaxed font-sans font-medium">{hist.wallStreetImpact}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}


          {/* 5. NEWS IMPACT DECK (SIMULATE HEADLINE SPIKES) */}
          {activeTab === 'news' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
              
              {/* Headline list */}
              <div className="lg:col-span-7 flex flex-col gap-4">
                <div className="p-5 bg-black/40 border border-white/5 rounded-3xl flex flex-col gap-1.5">
                  <span className="font-mono text-[9px] uppercase text-[#FF00C8] font-extrabold tracking-wider">Dynamic Sentiment Injector</span>
                  <h3 className="text-white font-black text-sm uppercase tracking-tight">Simulate Active Market Headline Shocks</h3>
                  <p className="text-zinc-450 text-[11px] leading-relaxed">
                    Trigger any simulated news event below to inject a sudden shock into the order book, watching the live simulated price feed adapt in real time as the news processes.
                  </p>
                </div>

                <div className="flex flex-col gap-2.5">
                  {profile.newsImpacts.map((news) => {
                    const isSelected = selectedNewsId === news.id;
                    return (
                      <button
                        key={news.id}
                        onClick={() => triggerNewsImpact(news.id, news.impactPct)}
                        className={`p-4 rounded-2xl border text-left transition-all flex flex-col justify-between cursor-pointer group ${isSelected ? 'bg-[#FF00C8]/10 border-[#FF00C8]/40 shadow-[0_0_15px_rgba(255,0,200,0.06)]' : 'bg-black/60 border-white/5 hover:border-[#FF00C8]/25'}`}
                      >
                        <div className="flex justify-between items-center w-full mb-2">
                          <span className="font-mono text-[8px] text-zinc-550 uppercase font-black">SOURCE: {news.source}</span>
                          <span className={`py-0.5 px-2.5 rounded font-mono text-[9px] font-black uppercase ${news.sentiment === 'Bullish' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-455 border border-rose-500/20'}`}>
                            {news.impactPct > 0 ? '+' : ''}{news.impactPct}% Implied Impact
                          </span>
                        </div>

                        <h4 className="text-white font-extrabold text-[12px] uppercase tracking-wide leading-snug group-hover:text-[#FF00C8] transition-colors">{news.headline}</h4>
                        <p className="text-zinc-400 text-[10.5px] mt-2 leading-relaxed font-sans font-medium">{news.explanation}</p>
                        
                        <div className="pt-2.5 mt-3 border-t border-white/5 flex items-center justify-between text-[8px] font-mono text-zinc-600">
                          <span>TRIGGER EVENT SEED</span>
                          <span className="text-[#FF00C8] font-black uppercase">{news.relatedMarket}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Sentiment dashboard */}
              <div className="lg:col-span-5 p-6 bg-gradient-to-t from-[#02050c] to-[#12031c]/50 border border-[#FF00C8]/10 rounded-3xl flex flex-col justify-between shadow-lg relative overflow-hidden">
                <div className="absolute inset-0 bg-[#FF00C8]/[0.01] pointer-events-none" />
                
                <div>
                  <h4 className="text-white font-extrabold text-[10.5px] tracking-widest font-mono border-b border-white/5 pb-2 mb-4 flex items-center gap-1.5 uppercase">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#FF00C8] animate-ping" />
                    Interactive Sentimental Thermostat
                  </h4>
                  <p className="text-zinc-400 text-[11px] leading-relaxed mb-4">
                    In modern electronic trading, algorithmic sentiment scanners analyze words in milliseconds to execute giant block trades, preceding human logic entirely.
                  </p>

                  <div className="flex flex-col gap-4 py-4">
                    
                    <div className="p-4 bg-black/60 border border-white/5 rounded-2xl">
                      <span className="text-zinc-550 font-mono text-[8px] uppercase block mb-1">AGGREGATE SENTIMENT RATING</span>
                      <div className="flex justify-between items-end">
                        <span className="text-white font-black text-xl uppercase font-sans">
                          {selectedNewsId ? (profile.newsImpacts.find(n => n.id === selectedNewsId)?.sentiment === 'Bullish' ? 'BULLISH OPTIMISM 🚀' : 'BEARISH CONTRAL 🩸') : 'STABLE NEUTRAL 🧊'}
                        </span>
                        <span className="font-mono text-zinc-500 text-[10.5px]">Index: 50/100</span>
                      </div>
                      
                      {/* Interactive visual slider bar representing rating */}
                      <div className="w-full h-1.5 bg-neutral-900 rounded-full mt-3 overflow-hidden">
                        <div 
                          className={`h-full transition-all duration-700 rounded-full ${selectedNewsId ? (profile.newsImpacts.find(n => n.id === selectedNewsId)?.sentiment === 'Bullish' ? 'bg-gradient-to-r from-emerald-500 to-cyan-400 w-[85%]' : 'bg-gradient-to-r from-rose-500 to-pink-500 w-[20%]') : 'bg-cyan-500/20 w-[50%]'}`} 
                        />
                      </div>
                    </div>

                    <div className="p-4 bg-neutral-950/70 border border-white/5 rounded-2xl text-left select-noneHome">
                      <span className="text-zinc-550 font-mono text-[8px] uppercase block mb-1">IMMEDIATE ORDER BOOK REACTIONS</span>
                      <ul className="flex flex-col gap-1.5 mt-2 font-mono text-[9px] text-zinc-400 leading-normal">
                        <li className="flex justify-between">
                          <span>Scanning headlines...</span>
                          <span className="text-emerald-400 font-bold">ONLINE</span>
                        </li>
                        <li className="flex justify-between">
                          <span>Retail volume multipliers:</span>
                          <span className="text-white font-bold">{selectedNewsId ? '4.8x Active SPIKES' : '1.2x Ambient'}</span>
                        </li>
                        <li className="flex justify-between">
                          <span>Institutional absorption:</span>
                          <span className="text-[#FF00C8] font-bold">{selectedNewsId ? 'DEFENSIVE ROLLOVERS' : 'ABSORBED'}</span>
                        </li>
                      </ul>
                    </div>

                  </div>
                </div>

                <div className="p-4 bg-[#FF00C8]/5 border border-[#FF00C8]/10 rounded-2xl text-[9px] text-[#FF00C8] leading-normal font-sans mt-4">
                  <strong className="text-white uppercase font-black font-mono text-[8.5px] block mb-0.5">ACADEMIC EXPOSURE RULE:</strong>
                  Sentiment acts as short-term price fuel. However, if quarterly cold cash revenues do not justify the buzz, options multiples collapse back to core cash values.
                </div>
              </div>

            </div>
          )}


          {/* 6. WHY IT MOVED TODAY (INTERACTIVE PRICING ENGINE) */}
          {activeTab === 'moved_today' && (
            <div className="flex flex-col gap-6 w-full">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
              
              {/* Variable controllers */}
              <div className="lg:col-span-7 flex flex-col gap-4">
                <div className="p-5 bg-[#030612]/95 border border-cyan-500/25 rounded-3xl flex flex-col gap-1.5 select-none">
                  <span className="font-mono text-[9px] uppercase text-[#00D9FF] font-black">Active Ticks Matrix</span>
                  <h3 className="text-white font-black text-sm uppercase tracking-tight">The "Why It Moved" Kinetic Factor Engine</h3>
                  <p className="text-zinc-400 text-[11px] leading-relaxed">
                    Underneath a stock price are discrete variables. Tap each toggle below to shift variables from **Neutral** to **Bullish** (Demand/Yield Up) or **Bearish** (Deficit/Rates Hike) and watch the simulated order book re-calculate target price!
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {profile.drivers.map((drv, idx) => {
                    const state = activeFactors[drv.factor] || 'neutral';
                    return (
                      <div 
                        key={idx}
                        onClick={() => toggleFactor(drv.factor)}
                        className={`p-4 rounded-2xl border text-left flex flex-col justify-between cursor-pointer transition-all ${
                          state === 'bullish' 
                            ? 'bg-emerald-500/10 border-emerald-500/40 text-white' 
                            : (state === 'bearish' ? 'bg-rose-500/10 border-rose-500/40 text-white' : 'bg-black/60 border-white/5 hover:border-white/10 text-zinc-400')
                        }`}
                      >
                        <div className="flex justify-between items-center w-full mb-3 select-none">
                          <span className="font-mono text-[8px] text-zinc-650 uppercase font-black">TRANSMISSION PATHWAY 0{idx+1}</span>
                          <span className={`py-0.5 px-2 rounded-md font-mono text-[8.5px] font-black uppercase ${
                            state === 'bullish' ? 'bg-emerald-500/20 text-emerald-400' : (state === 'bearish' ? 'bg-rose-500/20 text-rose-400' : 'bg-neutral-800 text-zinc-500')
                          }`}>
                            {state.toUpperCase()}
                          </span>
                        </div>

                        <h4 className="text-white font-extrabold text-[12px] uppercase tracking-wide leading-tight">{drv.factor}</h4>
                        <p className="text-zinc-400 text-[10px] my-2 leading-relaxed font-sans">{drv.description}</p>
                        
                        <div className="pt-2 border-t border-white/5 mt-2 flex justify-between items-center text-[7.5px] font-mono text-zinc-550 select-none">
                          <span>TAP TO SHIFT</span>
                          <span className={`${state === 'bullish' ? 'text-emerald-400 font-bold' : (state === 'bearish' ? 'text-rose-400 font-bold' : 'text-zinc-500')}`}>
                            {state === 'neutral' ? 'NEUTRAL 🧊' : (state === 'bullish' ? 'UPWARD MOMENTUM 🚀' : 'DOWNWARD GRAVITY 🩸')}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Dynamic Live Chart and Indicators */}
              <div className="lg:col-span-5 p-6 bg-[#01040a]/90 border border-white/5 rounded-3xl flex flex-col justify-between shadow-xl">
                <div>
                  <h4 className="text-white font-extrabold text-[10.5px] tracking-widest font-mono border-b border-white/5 pb-2 mb-4 uppercase">
                    Order Book Ticks Output
                  </h4>
                  <p className="text-zinc-400 text-[11px] leading-relaxed mb-4">
                    The chart below records instant price adjustments requested by index brokers as simulation parameters change:
                  </p>

                  <div className="p-4 bg-black/50 border border-white/5 rounded-2xl text-left select-none mb-4">
                    <span className="text-zinc-550 font-mono text-[8px] uppercase block">ACTIVE MATRIX SEED VALUE</span>
                    <div className="flex justify-between items-end mt-1">
                      <span className="text-white text-lg font-mono font-black">${simulatedPrice.toFixed(2)}</span>
                      <span className={`text-xs font-mono font-black ${isUp ? 'text-emerald-400' : 'text-rose-450'}`}>
                        {currentPriceChangePct >= 0 ? '▲' : '▼'} {currentPriceChangePct >= 0 ? '+' : ''}{currentPriceChangePct.toFixed(1)}%
                      </span>
                    </div>
                  </div>

                  {/* Micro sparkline diagram */}
                  <div className="h-[100px] w-full bg-neutral-950/60 rounded-xl p-3 border border-white/5 flex items-end gap-1 select-none">
                    {priceHistory.map((pt, i) => {
                      const max = Math.max(...priceHistory, profile.basePrice * 1.5);
                      const min = Math.min(...priceHistory, profile.basePrice * 0.5);
                      const heightPct = ((pt - min) / (max - min)) * 100;
                      return (
                        <div 
                          key={i}
                          className={`flex-1 rounded-t-sm transition-all duration-500 ${isUp ? 'bg-emerald-400/20 group-hover:bg-emerald-400' : 'bg-rose-400/20 group-hover:bg-rose-450'}`}
                          style={{ height: `${Math.max(5, heightPct)}%` }}
                        />
                      );
                    })}
                  </div>
                </div>

                <div className="p-4 bg-amber-500/5 border border-amber-500/10 rounded-2xl text-[9px] text-amber-400 leading-normal font-sans mt-4">
                  <strong className="text-white uppercase font-black font-mono text-[8px] block mb-0.5">ACADEMIC MATRIX EXPLAINER:</strong>
                  USD cash strength serves as absolute gravitational resistance against stocks. When cash pays higher risk-free yields, stock multiples adjust downwards to compensate.
                </div>
              </div>

            </div>

            <div className="mt-6">
              <WhyItMoved 
                asset={profile.name}
                reasons={profile.drivers.map((d: any) => `${d.factor}: ${d.description}`)}
                related={profile.relatedIndustries ? profile.relatedIndustries.map(i => i.name) : ['Equities', 'Commodities', 'Central Bank Sovereign Rates']}
              />
            </div>
          </div>
          )}


          {/* 7. EDUCATION TAB (OPERATING LEVERAGE SLIDER TOOL) */}
          {activeTab === 'edu' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
              
              {/* Interactive sliders */}
              <div className="lg:col-span-7 p-6 bg-black/40 border border-white/5 rounded-3xl flex flex-col gap-6 text-left">
                <div className="flex flex-col gap-1.5 border-b border-white/5 pb-4 select-none">
                  <span className="font-mono text-[9px] uppercase text-[#00D9FF] font-black leading-none">Interactive Lesson Matrix</span>
                  <h3 className="text-white font-black text-sm uppercase tracking-tight">{profile.education.title}</h3>
                  <h4 className="text-zinc-400 text-xs font-semibold uppercase">{profile.education.question}</h4>
                  <p className="text-zinc-450 text-[11px] leading-relaxed mt-2">
                    {profile.education.concept} Use the slider below to scale operations and watch unit costs dilute as production margins expand.
                  </p>
                </div>

                <div className="flex flex-col gap-4">
                  <div className="flex justify-between items-center font-mono text-[10.5px]">
                    <span className="text-zinc-530 font-bold uppercase">{profile.education.metricLabel}:</span>
                    <span className="text-[#00D9FF] font-black">{tappedMetricValue.toLocaleString()} {profile.education.metricUnit}</span>
                  </div>

                  {/* HTML Input Slider Range */}
                  <input
                    type="range"
                    min={profile.education.metricMin}
                    max={profile.education.metricMax}
                    step={Math.round((profile.education.metricMax - profile.education.metricMin) / 100)}
                    value={tappedMetricValue}
                    onChange={(e) => setTappedMetricValue(Number(e.target.value))}
                    className="w-full bg-neutral-900 h-1 rounded-lg appearance-none cursor-pointer accent-[#00D9FF] focus:outline-none"
                  />

                  <div className="flex justify-between text-[8px] font-mono text-zinc-550 select-none">
                    <span>MIN: {profile.education.metricMin.toLocaleString()}</span>
                    <span>ADJUST SLIDER</span>
                    <span>MAX: {profile.education.metricMax.toLocaleString()}</span>
                  </div>
                </div>

                <div className="p-4 bg-neutral-950/80 border border-white/5 rounded-xl text-[9px] leading-relaxed text-zinc-400 font-mono">
                  <strong className="text-white uppercase font-black text-[8px] block mb-1">Leverage Formula plumbing:</strong>
                  {profile.education.formulaExplanation}
                </div>
              </div>

              {/* Real-time Math Outputs */}
              <div className="lg:col-span-5 p-6 bg-radial-at-b from-[#040f21] via-neutral-950 to-[#02040b] border border-cyan-500/20 rounded-[32px] flex flex-col justify-between shadow-xl">
                <div>
                  <h4 className="text-white font-extrabold text-[10.5px] tracking-widest font-mono border-b border-white/5 pb-2 mb-4 uppercase text-left">
                    Unit Margin Calculation Sheet
                  </h4>
                  
                  <div className="flex flex-col gap-3 py-3 text-left font-mono text-[10.5px]">
                    <div className="flex justify-between border-b border-white/5 pb-2">
                      <span className="text-zinc-500">PROJECTED VALUE SEEDS</span>
                      <span className="text-white font-black">${eduResults.revenueGen.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                    </div>

                    <div className="flex justify-between border-b border-white/5 pb-2">
                      <span className="text-zinc-500">FIXED FACTORY OVERHEAD</span>
                      <span className="text-white">${eduResults.grossOverhead.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                    </div>

                    <div className="flex justify-between border-b border-white/5 pb-2">
                      <span className="text-zinc-500">UNIT DIRECT COST CAP</span>
                      <span className="text-zinc-300">${eduResults.marginalCost.toFixed(2)}</span>
                    </div>

                    <div className="flex justify-between items-end border-b border-white/5 pb-2">
                      <span className="text-zinc-500">PROJECTED GROSS MARGIN</span>
                      <span className={`text-sm font-black ${eduResults.projectedMargin >= 20 ? 'text-emerald-400' : (eduResults.projectedMargin > 0 ? 'text-amber-400' : 'text-rose-455')}`}>
                        {eduResults.projectedMargin.toFixed(1)}%
                      </span>
                    </div>
                  </div>

                  <div className="p-4 bg-black/70 border border-white/5 rounded-2xl text-left font-sans mt-4">
                    <span className="text-zinc-550 font-mono text-[8px] uppercase block">SYLLABUS SYSTEM COGNITIVE GRADE</span>
                    <span className="text-white font-bold tracking-tight text-xs mt-1 block uppercase">
                      {eduResults.grade}
                    </span>
                  </div>
                </div>

                <div className="p-4 bg-cyan-500/5 border border-cyan-500/10 rounded-2xl text-[9.5px] text-[#00D9FF] leading-normal font-sans mt-4">
                  <strong className="text-white uppercase font-black font-mono text-[8px] block mb-0.5">ACADEMIC MULTIPLIER CORE:</strong>
                  SaaS cloud software has highest operating leverage: incremental cost of distributing a copy is near $0. This is why software giants trade at elite premiums over physical manufacturers.
                </div>
              </div>

            </div>
          )}

        </motion.div>
      </AnimatePresence>

      {/* DISCRETIONARY RETURN BUTTONS BLOCK */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-4 border-t border-white/10 pt-6">
        <button 
          onClick={() => selectFileNode('markets.html')} 
          className="w-full sm:w-auto py-3 px-6 bg-white/5 hover:bg-white/10 text-[10px] font-black uppercase tracking-widest border border-white/10 rounded-xl cursor-pointer hover:shadow-lg transition-all text-center flex items-center justify-center gap-2 text-white"
        >
          <ArrowLeft className="w-4 h-4 text-zinc-400" />
          Back to Asset Directories
        </button>

        <span className="text-[9.5px] font-mono text-zinc-650 uppercase font-black tracking-widest select-none">
          ClearPath Financial Syllabus System Node: {profile.ticker}
        </span>
      </div>

    </div>
  );
}
