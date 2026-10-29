// /src/utils/searchEngine.ts
import { REAL_GLOSSARY_TERMS } from "../components/encyclopedia/RealGlossaryData";

// [ticker, company, exchange, sector, industry] — well-known U.S. listings.
const REAL_LARGE_CAPS: Array<[string, string, string, string, string]> = [
  ["ORCL", "Oracle Corporation", "NYSE", "Technology", "Enterprise Software"],
  ["CRM", "Salesforce, Inc.", "NYSE", "Technology", "Enterprise Software"],
  ["ADBE", "Adobe Inc.", "NASDAQ", "Technology", "Software"],
  ["INTU", "Intuit Inc.", "NASDAQ", "Technology", "Software"],
  ["NOW", "ServiceNow, Inc.", "NYSE", "Technology", "Enterprise Software"],
  ["IBM", "International Business Machines Corporation", "NYSE", "Technology", "IT Services"],
  ["CSCO", "Cisco Systems, Inc.", "NASDAQ", "Technology", "Networking Equipment"],
  ["INTC", "Intel Corporation", "NASDAQ", "Technology", "Semiconductors"],
  ["AMD", "Advanced Micro Devices, Inc.", "NASDAQ", "Technology", "Semiconductors"],
  ["AVGO", "Broadcom Inc.", "NASDAQ", "Technology", "Semiconductors"],
  ["QCOM", "QUALCOMM Incorporated", "NASDAQ", "Technology", "Semiconductors"],
  ["TXN", "Texas Instruments Incorporated", "NASDAQ", "Technology", "Semiconductors"],
  ["MU", "Micron Technology, Inc.", "NASDAQ", "Technology", "Semiconductors"],
  ["AMAT", "Applied Materials, Inc.", "NASDAQ", "Technology", "Semiconductor Equipment"],
  ["BAC", "Bank of America Corporation", "NYSE", "Financials", "Banking"],
  ["WFC", "Wells Fargo & Company", "NYSE", "Financials", "Banking"],
  ["C", "Citigroup Inc.", "NYSE", "Financials", "Banking"],
  ["GS", "The Goldman Sachs Group, Inc.", "NYSE", "Financials", "Investment Banking"],
  ["MS", "Morgan Stanley", "NYSE", "Financials", "Investment Banking"],
  ["BLK", "BlackRock, Inc.", "NYSE", "Financials", "Asset Management"],
  ["SCHW", "The Charles Schwab Corporation", "NYSE", "Financials", "Brokerage"],
  ["AXP", "American Express Company", "NYSE", "Financials", "Consumer Finance"],
  ["V", "Visa Inc.", "NYSE", "Financials", "Payment Networks"],
  ["MA", "Mastercard Incorporated", "NYSE", "Financials", "Payment Networks"],
  ["JNJ", "Johnson & Johnson", "NYSE", "Healthcare", "Pharmaceuticals"],
  ["LLY", "Eli Lilly and Company", "NYSE", "Healthcare", "Pharmaceuticals"],
  ["PFE", "Pfizer Inc.", "NYSE", "Healthcare", "Pharmaceuticals"],
  ["MRK", "Merck & Co., Inc.", "NYSE", "Healthcare", "Pharmaceuticals"],
  ["ABBV", "AbbVie Inc.", "NYSE", "Healthcare", "Pharmaceuticals"],
  ["BMY", "Bristol-Myers Squibb Company", "NYSE", "Healthcare", "Pharmaceuticals"],
  ["AMGN", "Amgen Inc.", "NASDAQ", "Healthcare", "Biotechnology"],
  ["GILD", "Gilead Sciences, Inc.", "NASDAQ", "Healthcare", "Biotechnology"],
  ["UNH", "UnitedHealth Group Incorporated", "NYSE", "Healthcare", "Health Insurance"],
  ["TMO", "Thermo Fisher Scientific Inc.", "NYSE", "Healthcare", "Life Sciences Tools"],
  ["ABT", "Abbott Laboratories", "NYSE", "Healthcare", "Medical Devices"],
  ["MDT", "Medtronic plc", "NYSE", "Healthcare", "Medical Devices"],
  ["ISRG", "Intuitive Surgical, Inc.", "NASDAQ", "Healthcare", "Medical Devices"],
  ["HD", "The Home Depot, Inc.", "NYSE", "Consumer Discretionary", "Home Improvement Retail"],
  ["MCD", "McDonald's Corporation", "NYSE", "Consumer Discretionary", "Restaurants"],
  ["NKE", "NIKE, Inc.", "NYSE", "Consumer Discretionary", "Apparel"],
  ["SBUX", "Starbucks Corporation", "NASDAQ", "Consumer Discretionary", "Restaurants"],
  ["KO", "The Coca-Cola Company", "NYSE", "Consumer Staples", "Beverages"],
  ["PEP", "PepsiCo, Inc.", "NASDAQ", "Consumer Staples", "Beverages"],
  ["PG", "The Procter & Gamble Company", "NYSE", "Consumer Staples", "Household Products"],
  ["COST", "Costco Wholesale Corporation", "NASDAQ", "Consumer Staples", "Retail"],
  ["NFLX", "Netflix, Inc.", "NASDAQ", "Communication Services", "Streaming Entertainment"],
  ["DIS", "The Walt Disney Company", "NYSE", "Communication Services", "Entertainment"],
  ["CMCSA", "Comcast Corporation", "NASDAQ", "Communication Services", "Cable & Media"],
  ["T", "AT&T Inc.", "NYSE", "Communication Services", "Telecommunications"],
  ["VZ", "Verizon Communications Inc.", "NYSE", "Communication Services", "Telecommunications"],
  ["XOM", "Exxon Mobil Corporation", "NYSE", "Energy", "Integrated Oil & Gas"],
  ["CVX", "Chevron Corporation", "NYSE", "Energy", "Integrated Oil & Gas"],
  ["COP", "ConocoPhillips", "NYSE", "Energy", "Oil & Gas Exploration"],
  ["SLB", "SLB", "NYSE", "Energy", "Oilfield Services"],
  ["NEE", "NextEra Energy, Inc.", "NYSE", "Utilities", "Electric Utilities"],
  ["BA", "The Boeing Company", "NYSE", "Industrials", "Aerospace & Defense"],
  ["LMT", "Lockheed Martin Corporation", "NYSE", "Industrials", "Aerospace & Defense"],
  ["RTX", "RTX Corporation", "NYSE", "Industrials", "Aerospace & Defense"],
  ["CAT", "Caterpillar Inc.", "NYSE", "Industrials", "Machinery"],
  ["DE", "Deere & Company", "NYSE", "Industrials", "Machinery"],
  ["UPS", "United Parcel Service, Inc.", "NYSE", "Industrials", "Logistics"],
  ["UNP", "Union Pacific Corporation", "NYSE", "Industrials", "Railroads"],
  ["FCX", "Freeport-McMoRan Inc.", "NYSE", "Materials", "Copper Mining"],
  ["NEM", "Newmont Corporation", "NYSE", "Materials", "Gold Mining"],
];

const SECTOR_DRIVERS: Record<string, string[]> = {
  Technology: ["Earnings reports", "Enterprise IT spending", "Interest Rates"],
  Financials: ["Fed policy", "Credit quality", "Yield curve"],
  Healthcare: ["Drug approvals and trials", "Drug pricing policy", "Earnings reports"],
  "Consumer Discretionary": ["Consumer spending", "Interest Rates", "Earnings reports"],
  "Consumer Staples": ["Input costs", "Consumer demand", "USD strength"],
  "Communication Services": ["Subscriber growth", "Advertising spend", "Regulation"],
  Energy: ["Crude oil prices", "OPEC decisions", "Global demand"],
  Utilities: ["Interest Rates", "Regulated rate cases", "Power demand"],
  Industrials: ["Order backlogs", "Business investment", "Supply chains"],
  Materials: ["Commodity prices", "Global growth", "USD strength"],
};

// [root symbol, name, category, exchange] — listed futures contracts.
const REAL_COMMODITY_FUTURES: Array<[string, string, string, string]> = [
  ["NG", "Natural Gas (Henry Hub)", "Energy", "NYMEX"],
  ["HO", "Heating Oil (ULSD)", "Energy", "NYMEX"],
  ["RB", "RBOB Gasoline", "Energy", "NYMEX"],
  ["SI", "Silver", "Metals", "COMEX"],
  ["HG", "Copper", "Metals", "COMEX"],
  ["PL", "Platinum", "Metals", "NYMEX"],
  ["PA", "Palladium", "Metals", "NYMEX"],
  ["ZW", "Wheat (Chicago SRW)", "Agriculture", "CBOT"],
  ["ZC", "Corn", "Agriculture", "CBOT"],
  ["ZS", "Soybeans", "Agriculture", "CBOT"],
  ["ZO", "Oats", "Agriculture", "CBOT"],
  ["ZR", "Rough Rice", "Agriculture", "CBOT"],
  ["SB", "Sugar No. 11", "Agriculture", "ICE Futures U.S."],
  ["KC", "Coffee \"C\" (Arabica)", "Agriculture", "ICE Futures U.S."],
  ["CC", "Cocoa", "Agriculture", "ICE Futures U.S."],
  ["CT", "Cotton No. 2", "Agriculture", "ICE Futures U.S."],
  ["LE", "Live Cattle", "Livestock", "CME"],
  ["GF", "Feeder Cattle", "Livestock", "CME"],
  ["HE", "Lean Hogs", "Livestock", "CME"],
];

const COMMODITY_DRIVERS: Record<string, string[]> = {
  Energy: ["Inventories", "Weather", "OPEC and production", "Refinery demand"],
  Metals: ["Industrial demand", "USD strength", "Mine supply", "Interest Rates"],
  Agriculture: ["Weather and crop reports", "USDA WASDE", "Export demand", "USD strength"],
  Livestock: ["Feed costs", "USDA cattle and hog reports", "Consumer demand"],
};

// Real listed issuers only. Never generate tickers, company names, coins, or glossary phrases:
// every symbol on the site must exist in a real market.
let cachedStocks: any[] = [];
export function getProceduralStocks(): any[] {
  if (cachedStocks.length > 0) return cachedStocks;

  const list: any[] = [];

  // Real majors first so hub pages never show a procedural name on a live ticker.
  const realMajors: any[] = [
    {
      ticker: "AAPL",
      company: "Apple Inc.",
      sector: "Technology",
      industry: "Consumer Electronics",
      exchange: "NASDAQ",
      description: "Apple designs consumer electronics, software, and AI ecosystems.",
      founded: 1976,
      headquarters: "Cupertino, California",
      tags: ["AI", "iPhone", "Cloud", "Consumer Tech"],
      relatedMarkets: ["Semiconductors", "Consumer Spending", "AI"],
      whatMoves: ["Interest Rates", "Consumer Demand", "China Production", "Earnings Reports"],
    },
    {
      ticker: "TSLA",
      company: "Tesla Inc.",
      sector: "Automotive",
      industry: "Electric Vehicles",
      exchange: "NASDAQ",
      description: "Tesla develops electric vehicles, robotics, batteries, and AI systems.",
      founded: 2003,
      headquarters: "Austin, Texas",
      tags: ["EV", "AI", "Robotics", "Energy"],
      relatedMarkets: ["Lithium", "Auto", "Solar", "Robotics"],
      whatMoves: ["EV Demand", "Battery Prices", "Interest Rates", "China Manufacturing"],
    },
    {
      ticker: "MSFT",
      company: "Microsoft Corporation",
      sector: "Technology",
      industry: "Software Infrastructure",
      exchange: "NASDAQ",
      description: "Microsoft builds cloud, productivity, and developer platforms.",
      founded: 1975,
      headquarters: "Redmond, Washington",
      tags: ["Cloud", "Software", "AI"],
      relatedMarkets: ["Cloud", "Enterprise Software"],
      whatMoves: ["Azure demand", "Enterprise IT spend", "Interest Rates"],
    },
    {
      ticker: "NVDA",
      company: "NVIDIA Corporation",
      sector: "Technology",
      industry: "Semiconductors",
      exchange: "NASDAQ",
      description: "NVIDIA designs GPUs and accelerated-computing platforms.",
      founded: 1993,
      headquarters: "Santa Clara, California",
      tags: ["AI", "Semiconductors", "Data Center"],
      relatedMarkets: ["Semiconductors", "AI"],
      whatMoves: ["GPU demand", "Data-center capex", "Export controls"],
    },
    {
      ticker: "AMZN",
      company: "Amazon.com, Inc.",
      sector: "Consumer Discretionary",
      industry: "E-Commerce",
      exchange: "NASDAQ",
      description: "Amazon operates e-commerce, logistics, and AWS cloud.",
      founded: 1994,
      headquarters: "Seattle, Washington",
      tags: ["E-Commerce", "Cloud", "Retail"],
      relatedMarkets: ["Consumer Spending", "Cloud"],
      whatMoves: ["Consumer Demand", "AWS growth", "Interest Rates"],
    },
    {
      ticker: "GOOGL",
      company: "Alphabet Inc.",
      sector: "Communication Services",
      industry: "Internet Platforms",
      exchange: "NASDAQ",
      description: "Alphabet is the parent of Google Search, YouTube, and Google Cloud.",
      founded: 1998,
      headquarters: "Mountain View, California",
      tags: ["Search", "Cloud", "Advertising"],
      relatedMarkets: ["Digital Ads", "Cloud"],
      whatMoves: ["Ad spend", "Cloud demand", "Regulation"],
    },
    {
      ticker: "META",
      company: "Meta Platforms, Inc.",
      sector: "Communication Services",
      industry: "Social Media Nets",
      exchange: "NASDAQ",
      description: "Meta operates Facebook, Instagram, WhatsApp, and Reality Labs.",
      founded: 2004,
      headquarters: "Menlo Park, California",
      tags: ["Social", "Advertising", "AI"],
      relatedMarkets: ["Digital Ads", "Consumer Tech"],
      whatMoves: ["Ad spend", "User engagement", "Regulation"],
    },
    {
      ticker: "JPM",
      company: "JPMorgan Chase & Co.",
      sector: "Financials",
      industry: "Investment Banking",
      exchange: "NYSE",
      description: "JPMorgan Chase is a systemically important U.S. bank and global markets firm.",
      founded: 1799,
      headquarters: "New York, New York",
      tags: ["Banking", "Markets", "Credit"],
      relatedMarkets: ["Interest Rates", "Credit"],
      whatMoves: ["Fed policy", "Credit spreads", "Trading revenue"],
    },
  ];
  list.push(...realMajors);
  const reservedTickers = new Set(realMajors.map((s) => s.ticker));
  for (const [ticker, company, exchange, sector, industry] of REAL_LARGE_CAPS) {
    if (reservedTickers.has(ticker)) continue;
    reservedTickers.add(ticker);
    list.push({
      ticker,
      company,
      sector,
      industry,
      exchange,
      description: `${company} (${ticker}) is a U.S.-listed ${sector.toLowerCase()} company (${industry}).`,
      tags: [sector, industry],
      relatedMarkets: [sector, industry],
      whatMoves: SECTOR_DRIVERS[sector] || ["Earnings reports", "Interest Rates"],
    });
  }

  cachedStocks = list;
  return list;
}

// 2. COMPANIES — public issuers only (no invented subsidiaries)
let cachedCompanies: any[] = [];
export function getProceduralCompanies(): any[] {
  if (cachedCompanies.length > 0) return cachedCompanies;
  cachedCompanies = getProceduralStocks().map((st) => ({
    name: st.company,
    ticker: st.ticker,
    status: "Public",
    sector: st.sector,
  }));
  return cachedCompanies;
}

// 3. CRYPTO — real coins and historical digital-cash projects only
let cachedCrypto: any[] = [];
export function getProceduralCrypto(): any[] {
  if (cachedCrypto.length > 0) return cachedCrypto;

  const list: any[] = [];
  
  // High-fidelity list of real-world cryptocurrencies, tokens, and digital predecessors from early 2000s to 2026
  const realCoins = [
    {
      "symbol": "AAVE",
      "name": "Aave",
      "category": "DeFi Protocol",
      "description": "Aave is an open-source, non-custodial decentralized liquidity protocol where users can participate as depositors, lenders, or borrowers to yield capital efficiencies.",
      "founded": 2017,
      "creator": "Stani Kulechov",
      "whatMoves": ["TVL Volatility", "Interest Protocol Swaps", "DeFi Collateral Inflows"],
      "relatedTopics": ["Liquidity Pools", "Flash Loans", "Over-collateralization"]
    },
    {
      "symbol": "ALGO",
      "name": "Algorand",
      "category": "Layer 1 Ledger",
      "description": "Algorand is a green, pure proof-of-stake (PPoS) Layer 1 blockchain framework engineered for high processing speeds, instant finality, and enterprise compliance.",
      "founded": 2019,
      "creator": "Silvio Micali",
      "whatMoves": ["Transaction Fees", "Green Web3 Allocations", "Developer Grants"],
      "relatedTopics": ["Pure Proof of Stake", "Silvio Micali", "Carbon-Neutral Ledgers"]
    },
    {
      "symbol": "APT",
      "name": "Aptos",
      "category": "Layer 1 Ledger",
      "description": "Aptos is a high-concurrency, scalable Layer 1 platform leveraging the Move programming language for secure, parallel transaction pipelines.",
      "founded": 2022,
      "creator": "Mo Shaikh & Avery Ching",
      "whatMoves": ["Move Upgrades", "Institutional Staking Pools", "Web3 Game Projects"],
      "relatedTopics": ["Move Language", "Parallel Execution", "Aptos Labs"]
    },
    {
      "symbol": "ARB",
      "name": "Arbitrum",
      "category": "Utility Engine Token",
      "description": "Arbitrum is a premier optimistic rollup Layer 2 network for Ethereum, delivering massive gas savings and high throughput while remaining anchored to L1 security.",
      "founded": 2021,
      "creator": "Offchain Labs",
      "whatMoves": ["Bridge Inflows", "L2 Arbitrage Speed", "Optimistic Rollup Fees"],
      "relatedTopics": ["Layer 2 Scaling", "Optimistic Rollups", "DApp Ecosystems"]
    },
    {
      "symbol": "AVAX",
      "name": "Avalanche",
      "category": "Layer 1 Ledger",
      "description": "Avalanche is an open-source smart contract database featuring rapid sub-second finality, custom validator subnets, and multi-chain consensus architectures.",
      "founded": 2020,
      "creator": "Emin Gün Sirer / Ava Labs",
      "whatMoves": ["Subnet Allocations", "Avalanche Rush Inflows", "Validator Staking Bounds"],
      "relatedTopics": ["Subnets", "Consensus Engine", "Ava Labs"]
    },
    {
      "symbol": "BMONEY",
      "name": "b-money",
      "category": "Store of Value",
      "description": "b-money is a major pre-Bitcoin digital cash proposal defining a decentralized network using proof-of-work puzzles to secure transaction states.",
      "founded": 1998,
      "creator": "Wei Dai",
      "whatMoves": ["Cypherpunk Archiving", "Mathematical Citations"],
      "relatedTopics": ["Wei Dai", "Pre-Bitcoin Cash", "Scarcity Concepts"]
    },
    {
      "symbol": "BNB",
      "name": "Binance Coin",
      "category": "Utility Engine Token",
      "description": "Binance Coin is the native gas, settlement, and utility asset powers the BNB Chain, decentralized exchange pools, and launchpad allocations.",
      "founded": 2017,
      "creator": "Changpeng Zhao",
      "whatMoves": ["Central Exchange Trading Volume", "Automated Coin Burns", "Regulatory Audits"],
      "relatedTopics": ["Binance Smart Chain", "Exchange Gas", "Settle Assets"]
    },
    {
      "symbol": "BITGOLD",
      "name": "Bit Gold",
      "category": "Store of Value",
      "description": "Bit Gold is an un-implemented decentralized proof-of-work registry design proposing reusable math puzzles, forming the foundational template for Bitcoin.",
      "founded": 1998,
      "creator": "Nick Szabo",
      "whatMoves": ["Consensus Research History", "Szabo Lectures"],
      "relatedTopics": ["Nick Szabo", "Smart Contract Origins", "Reusable Proof of Work"]
    },
    {
      "symbol": "BTC",
      "name": "Bitcoin",
      "category": "Store of Value",
      "description": "Bitcoin is the premier peer-to-peer decentralized transaction system, establishing absolute digital security, censorship resistance, and mathematical scarcity.",
      "founded": 2009,
      "creator": "Satoshi Nakamoto",
      "whatMoves": ["Institutional ETF Flows", "Halving Cycles", "Central Bank Liquidity Curves"],
      "relatedTopics": ["Mining", "SHA-256 Consensus", "Absolute Digital Gold"]
    },
    {
      "symbol": "BCH",
      "name": "Bitcoin Cash",
      "category": "Store of Value",
      "description": "Bitcoin Cash is a high-volume block-size scaling fork of Bitcoin constructed to enable fast peer-to-peer payments.",
      "founded": 2017,
      "creator": "Amaury Séchet / Community",
      "whatMoves": ["Block Size Disputes", "Retail Merchant Integrations"],
      "relatedTopics": ["Hard Forks", "Scalable Cash", "On-chain Settlement"]
    },
    {
      "symbol": "ADA",
      "name": "Cardano",
      "category": "Layer 1 Ledger",
      "description": "Cardano is an academic, peer-reviewed Proof-of-Stake smart contract platform engineering high structural certifiability and secure multi-tier transaction chains.",
      "founded": 2017,
      "creator": "Charles Hoskinson",
      "whatMoves": ["Hard Fork Protocols", "Sovereign Web3 Treaties", "Staking Volatility"],
      "relatedTopics": ["Ouroboros", "Haskell", "Peer-Reviewed Architecture"]
    },
    {
      "symbol": "LINK",
      "name": "Chainlink",
      "category": "DeFi Protocol",
      "description": "Chainlink is a decentralized oracle platform connecting off-chain application APIs, credit records, and smart math metrics securely to blockchain ledgers.",
      "founded": 2017,
      "creator": "Sergey Nazarov",
      "whatMoves": ["Oracle Price Data Feeds", "Cross-Chain CCIP Volumes", "Enterprise Bank Hubs"],
      "relatedTopics": ["Decentralized Oracles", "CCIP Protocols", "Secure Data Ingress"]
    },
    {
      "symbol": "ATOM",
      "name": "Cosmos",
      "category": "Layer 1 Ledger",
      "description": "Cosmos is an interoperability network connecting sovereign parallel databases together using the Tendermint core and Inter-Blockchain Communication (IBC) protocol.",
      "founded": 2019,
      "creator": "Jae Kwon & Ethan Buchman",
      "whatMoves": ["IBC Relay Actions", "Tendermint Upgrades", "Airdrop Pools"],
      "relatedTopics": ["IBC Protocol", "Interoperability Hub", "Cosmos SDK"]
    },
    {
      "symbol": "MANA",
      "name": "Decentraland",
      "category": "Metaverse Asset",
      "description": "Decentraland is an Ethereum-based virtual reality platform allowing explorers to buy, curate, and scale digital land parcels and user experiences.",
      "founded": 2017,
      "creator": "Ariel Meilich & Esteban Ordano",
      "whatMoves": ["Virtual property sweeps", "Corporate space activations", "User Metaspace Index"],
      "relatedTopics": ["Metaverse Lands", "ERC-721 Property", "Spatial VR Asset"]
    },
    {
      "symbol": "DIGICASH",
      "name": "DigiCash",
      "category": "Store of Value",
      "description": "DigiCash is a historic blind-signature digital payment infrastructure designed to enable cryptographically private e-cash transactions through traditional banks.",
      "founded": 1989,
      "creator": "David Chaum",
      "whatMoves": ["Cryptographic Archiving History", "Chaum Lectures"],
      "relatedTopics": ["David Chaum", "Blind Signatures", "Early Cryptographic Cash"]
    },
    {
      "symbol": "DOGE",
      "name": "Dogecoin",
      "category": "Store of Value",
      "description": "Dogecoin is a Scrypt-based proof-of-work coin that evolved from a lighthearted meme asset into a globally liquid checkout, tipping, and payment node.",
      "founded": 2013,
      "creator": "Billy Markus & Jackson Palmer",
      "whatMoves": ["Meme Momentum Cycle", "Social Network Narratives", "Scrypt Miner Pools"],
      "relatedTopics": ["Scrypt Mining", "Community Meme Ledger", "Digital Microtips"]
    },
    {
      "symbol": "EGOLD",
      "name": "e-Gold",
      "category": "Store of Value",
      "description": "e-Gold was an early centralized physical gold-backed internet money project, facilitating millions of safe, instantaneous precious metal exchanges.",
      "founded": 1996,
      "creator": "Douglas Jackson / Barry Downey",
      "whatMoves": ["Pre-blockchain Digital Ledger History", "Regulatory Audits"],
      "relatedTopics": ["Centralized Ledger", "Physical Gold backing", "Internet Currency Origins"]
    },
    {
      "symbol": "ENA",
      "name": "Ethena",
      "category": "DeFi Protocol",
      "description": "Ethena is a synthetic dollar protocol constructed on Ethereum, offering USDe savings backed by active delta-hedging arbitrage configurations.",
      "founded": 2024,
      "creator": "Guy Young",
      "whatMoves": ["USDe Funding Yield Spread", "Airdrop Claim Waves", "Ethereum Staking Ingress"],
      "relatedTopics": ["Synthetic Dollars", "Delta-Hedging Yields", "USDe Collateral"]
    },
    {
      "symbol": "ETH",
      "name": "Ethereum",
      "category": "Smart Contract Platform",
      "description": "Ethereum is the world's premier Turing-complete smart-contract execution engine, securing decentralized collateral markets, layer-2 rollups, and Web3 assets.",
      "founded": 2015,
      "creator": "Vitalik Buterin",
      "whatMoves": ["EIP Fee Burns", "PoS Staking Rates", "L2 Execution Gas Limits"],
      "relatedTopics": ["EVM Engine", "Smart Contracts", "Proof of Stake 전환"]
    },
    {
      "symbol": "ETC",
      "name": "Ethereum Classic",
      "category": "Smart Contract Platform",
      "description": "Ethereum Classic preserves the unforked, original cryptographic history of Ethereum, sticking strictly to the immutability axiom 'Code is Law'.",
      "founded": 2016,
      "creator": "Unforked Ethereum Community",
      "whatMoves": ["GPU Hashrate Migrations", "Immutability Debates"],
      "relatedTopics": ["Immutability Axioms", "Original Ethereum", "Classic Mining"]
    },
    {
      "symbol": "FTM",
      "name": "Fantom",
      "category": "Layer 1 Ledger",
      "description": "Fantom is an ultra-fast Directed Acyclic Graph (DAG) platform providing sub-second finality and EVM execution paths for decentralized apps.",
      "founded": 2018,
      "creator": "Dr. Ahn Byung Ik / Fantom Foundation",
      "whatMoves": ["Sonic Upgrade Rollouts", "DeFi Liquidity Pools", "Gas Burn Rates"],
      "relatedTopics": ["Lachesis Consensus", "DAG Platforms", "Sonic Nodes"]
    },
    {
      "symbol": "FET",
      "name": "Fetch.ai (ASI)",
      "category": "Utility Engine Token",
      "description": "Fetch.ai is a decentralized machine learning network, coordinating autonomous digital agents to perform micro-economic tasks.",
      "founded": 2018,
      "creator": "Humayun Sheikh / Toby Simpson",
      "whatMoves": ["AI Compute Narrative Cycles", "Agent Network adoption", "ASI Token Mergers"],
      "relatedTopics": ["Autonomous Agents", "Artificial Intelligence Infrastructure", "ASI Alliance"]
    },
    {
      "symbol": "FIL",
      "name": "Filecoin",
      "category": "Utility Engine Token",
      "description": "Filecoin is a decentralized file storage protocol, paying miners to host secure space validated by cryptographic data proofs.",
      "founded": 2020,
      "creator": "Juan Benet / Protocol Labs",
      "whatMoves": ["Data Volume Stored", "Mining Contract Pricing", "FVM Deployments"],
      "relatedTopics": ["Decentralized Storage Hub", "FVM Virtual Machine", "PoRep proofs"]
    },
    {
      "symbol": "HASHCASH",
      "name": "Hashcash",
      "category": "Store of Value",
      "description": "Hashcash is a pre-blockchain cryptographic proof-of-work mechanism designed to block spam by requiring small CPU puzzles.",
      "founded": 1997,
      "creator": "Adam Back",
      "whatMoves": ["Proof-of-work Early Research", "Academic Citations"],
      "relatedTopics": ["Adam Back", "Proof of Work Inception", "Anti-Spam Puzzles"]
    },
    {
      "symbol": "HBAR",
      "name": "Hedera Hashgraph",
      "category": "Layer 1 Ledger",
      "description": "Hedera is an enterprise-oriented distributed ledger utilizing hashgraph consensus to process massive, low-fee micropayments.",
      "founded": 2018,
      "creator": "Leemon Baird",
      "whatMoves": ["Enterprise Governing Board", "Micropayment Scaling Volumes"],
      "relatedTopics": ["Hashgraph Consensus", "Asynchronous Byzantine Fault Tolerance", "Enterprise Nodes"]
    },
    {
      "symbol": "ICP",
      "name": "Internet Computer",
      "category": "Layer 1 Ledger",
      "description": "The Internet Computer is a blockchain framework hosting sovereign web services and dApps at native web speeds.",
      "founded": 2021,
      "creator": "Dominic Williams",
      "whatMoves": ["Canister Smart Upgrades", "Web-Speed Computes"],
      "relatedTopics": ["Canister Smart Contracts", "DFINITY Foundation", "Web Speed Nodes"]
    },
    {
      "symbol": "JUP",
      "name": "Jupiter",
      "category": "DeFi Protocol",
      "description": "Jupiter is the core liquidity and perpetual swaps aggregator on Solana, coordinating token routing.",
      "founded": 2024,
      "creator": "Meow / Ben Chow",
      "whatMoves": ["Solana DEX Volume Spikes", "LFG Launchpad Debuts"],
      "relatedTopics": ["Solana Liquidity Aggregator", "Eecosystem Launches", "Dapp Swaps"]
    },
    {
      "symbol": "LTC",
      "name": "Litecoin",
      "category": "Store of Value",
      "description": "Litecoin is a peer-to-peer Scrypt PoW ledger engineered as a lighter, faster transaction companion to Bitcoin.",
      "founded": 2011,
      "creator": "Charlie Lee",
      "whatMoves": ["Scrypt Hashrates", "MWEB Privacy Flows", "Halving Margins"],
      "relatedTopics": ["Scrypt Mining", "Confidential Mimblewimble Transactions", "Silver to Bitcoin Gold"]
    },
    {
      "symbol": "MKR",
      "name": "Maker (Sky)",
      "category": "DeFi Protocol",
      "description": "Maker manages DAI/USDS decentralized dollar stablecoins through collateral risk parameters.",
      "founded": 2017,
      "creator": "Rune Christensen",
      "whatMoves": ["RWA Yield Spreads", "Collateral Pools", "Sky Token Migrations"],
      "relatedTopics": ["Dai Stablecoin", "Collateralized Debt Positions", "Decentralized Governance"]
    },
    {
      "symbol": "XMR",
      "name": "Monero",
      "category": "Store of Value",
      "description": "Monero is a privacy-focused PoW digital coin utilizing Ring Signatures and stealth addresses to secure complete anonymity.",
      "founded": 2014,
      "creator": "Nicolas van Saberhagen / Community",
      "whatMoves": ["Privacy Regulations", "Stealth Address Audits", "Exchange Delist Waves"],
      "relatedTopics": ["Confidential Ring Signatures", "Privacy Coin", "CryptoNote Protocols"]
    },
    {
      "symbol": "NEAR",
      "name": "Near Protocol",
      "category": "Layer 1 Ledger",
      "description": "Near Protocol is a sharded, user-centric layer 1 framework utilizing Nightshade to scale computing tasks.",
      "founded": 2020,
      "creator": "Illia Polosukhin & Alex Skidanov",
      "whatMoves": ["AI AI Model Hubs", "Nightshade Sharding", "User Onboarding"],
      "relatedTopics": ["Nightshade", "Scale dApps", "AI Integrations"]
    },
    {
      "symbol": "OP",
      "name": "Optimism",
      "category": "Utility Engine Token",
      "description": "Optimism is a low-fee optimistic rollup rollup framework that hosts the collaborative Superchain standard.",
      "founded": 2021,
      "creator": "Jinglan Wang / OP Labs",
      "whatMoves": ["L2 Superchain Bridges", "Retroactive Grants", "Bedrock Upgrades"],
      "relatedTopics": ["Superchain", "L2 Rollups", "Optimism Collective"]
    },
    {
      "symbol": "DOT",
      "name": "Polkadot",
      "category": "Layer 1 Ledger",
      "description": "Polkadot is a multi-chain platform linking specialized parachains together under a shared Relay Chain consensus.",
      "founded": 2020,
      "creator": "Gavin Wood",
      "whatMoves": ["Parachain Slot Auctions", "Agile Coretime Upgrades", "SDK Frameworks"],
      "relatedTopics": ["Relay Chain", "Parachains", "Web3 Foundation"]
    },
    {
      "symbol": "POL",
      "name": "Polygon (POL/MATIC)",
      "category": "Utility Engine Token",
      "description": "Polygon offers a flexible set of Layer 2 and sidechain systems to scale Ethereum dApps with minimal gas fees.",
      "founded": 2017,
      "creator": "Sandeep Nailwal & Jaynti Kanani",
      "whatMoves": ["POL Token Transitions", "AggLayer Integrations", "EVM Gas Spikes"],
      "relatedTopics": ["Polygon Sidechains", "zkEVM", "POL Migrtions"]
    },
    {
      "symbol": "XRP",
      "name": "Ripple",
      "category": "Layer 1 Ledger",
      "description": "XRP Ledger is an open-source consensus blockchain optimized for rapid, cost-efficient international currency settlements.",
      "founded": 2012,
      "creator": "Chris Larsen & Jed McCaleb",
      "whatMoves": ["SEC Regulatory Updates", "Bank Custody Contracts", "ODL Settlement Corridors"],
      "relatedTopics": ["Bilateral Liquidity Settlement", "RippleNet", "Consensus Protocol Ledger"]
    },
    {
      "symbol": "SHIB",
      "name": "Shiba Inu",
      "category": "Metaverse Asset",
      "description": "Shiba Inu is a community-driven cryptocurrency that expanded from zero-utility memecoin into a rich ecosystem with its own L2.",
      "founded": 2020,
      "creator": "Ryoshi",
      "whatMoves": ["Shibarium L2 Activity", "ShibaSwap Liquidity", "Community Burns"],
      "relatedTopics": ["MEME Token Ecosystems", "Shibarium", "ShibaSwap AMM"]
    },
    {
      "symbol": "SOL",
      "name": "Solana",
      "category": "Layer 1 Ledger",
      "description": "Solana is a high-performance Layer 1 using Proof of History to execute transactions in parallel with sub-second finality.",
      "founded": 2020,
      "creator": "Anatoly Yakovenko",
      "whatMoves": ["Meme Token Runs", "DEX Settlement Volume", "Firedancer Client Updates"],
      "relatedTopics": ["Proof of History", "Sealevel parallel EVM", "High Frequency Trading"]
    },
    {
      "symbol": "STX",
      "name": "Stacks",
      "category": "Layer 1 Ledger",
      "description": "Stacks is a layer that introduces smart contracts, decentralized apps, and custom digital assets anchored directly to Bitcoin.",
      "founded": 2018,
      "creator": "Muneeb Ali & Ryan Shea",
      "whatMoves": ["Nakamoto Release Upgrades", "sBTC Bitcoin Bridges", "Bitcoin NFT Activity"],
      "relatedTopics": ["Proof of Transfer", "Bitcoin Smart Layer", "Clarity Contracts"]
    },
    {
      "symbol": "XLM",
      "name": "Stellar",
      "category": "Layer 1 Ledger",
      "description": "Stellar is an open economic protocol supporting fast, low-fee digital representations of global currencies.",
      "founded": 2014,
      "creator": "Jed McCaleb",
      "whatMoves": ["Remittance Corridors", "Soroban Smart Contracts", "DeFi Anchors"],
      "relatedTopics": ["Federated Consensus", "Anchor Integrations", "Global Remittances"]
    },
    {
      "symbol": "SUI",
      "name": "Sui",
      "category": "Layer 1 Ledger",
      "description": "Sui is a high-throughput smart contract platform based on Move, managing transactions in parallel for lightning-fast speeds.",
      "founded": 2023,
      "creator": "Mysten Labs",
      "whatMoves": ["Move Lang Upgrades", "Cetus DEX Inflows", "Dynamic NFT Minting"],
      "relatedTopics": ["Object Model Move", "Mysten Labs", "High Speed Game Ledgers"]
    },
    {
      "symbol": "USDT",
      "name": "Tether",
      "category": "Store of Value",
      "description": "Tether issues USDT, a pioneer dollar-pegged stablecoin backing billions in collateralized global transaction pipelines.",
      "founded": 2014,
      "creator": "Brock Pierce & Reeve Collins",
      "whatMoves": ["US Treasury Reserves", "Stablecoin Mint Volume", "Global Arbitrage Demands"],
      "relatedTopics": ["Collateralized Stablecoins", "Omni Protocols", "Tether Reserves"]
    },
    {
      "symbol": "TON",
      "name": "Toncoin",
      "category": "Layer 1 Ledger",
      "description": "Toncoin is the native gas and settlement currency of The Open Network, natively integrated into Telegram messaging.",
      "founded": 2018,
      "creator": "Nikolai & Pavel Durov",
      "whatMoves": ["Telegram Mini-App Activity", "User Base Conversion", "Sovereign Web3 Ecosystems"],
      "relatedTopics": ["Telegram Wallet", "Squeeth-scale Parachain", "The Open Network"]
    },
    {
      "symbol": "TRX",
      "name": "TRON",
      "category": "Layer 1 Ledger",
      "description": "TRON is a high-throughput blockchain ecosystem supporting fast, cheap stablecoin (USDT) transfers globally.",
      "founded": 2017,
      "creator": "Justin Sun",
      "whatMoves": ["USDT Circulation Volumes", "DApp Smart Gas", "JustLend Defi Supply"],
      "relatedTopics": ["Delegated Proof of Stake", "USDT Transit Rail", "TRON Network"]
    },
    {
      "symbol": "UNI",
      "name": "Uniswap",
      "category": "DeFi Protocol",
      "description": "Uniswap is the largest decentralized exchange protocol, allowing automated market-maker trading of digital assets.",
      "founded": 2018,
      "creator": "Hayden Adams",
      "whatMoves": ["UNI Fee Switch Proposals", "DEX Volume Competitions", "Uniswap v4 Hooks"],
      "relatedTopics": ["Automated Market Makers", "Constant Product Formula", "DeFi Liquidity pools"]
    },
    {
      "symbol": "USDC",
      "name": "USD Coin",
      "category": "Store of Value",
      "description": "USDC is a fully reserve-backed, compliant digital dollar stablecoin audited monthly to ensure safe dollar-to-token transactions.",
      "founded": 2018,
      "creator": "Circle & Coinbase",
      "whatMoves": ["US Regulatory Guidance", "Multi-Chain Bridging", "Auditing Attestations"],
      "relatedTopics": ["Circle dollar peg", "Regulated stablecoins", "Ecosystem cross-bridges"]
    },
    {
      "symbol": "VET",
      "name": "Vechain",
      "category": "Utility Engine Token",
      "description": "Vechain Tor conducts secure IoT and supply-chain logistics records using smart smart ledger designs.",
      "founded": 2015,
      "creator": "Sunny Lu",
      "whatMoves": ["Enterprise Supply Proofs", "Global Green Incentives"],
      "relatedTopics": ["Supply Chain Blockchain", "NFC tag hardware integration", "Vechain Toolchain"]
    },
    {
      "symbol": "WLD",
      "name": "Worldcoin",
      "category": "Utility Engine Token",
      "description": "Worldcoin issues WLD utility tokens alongside biometric eye scans (Orb) to prove unique human identity online.",
      "founded": 2023,
      "creator": "Sam Altman & Alex Blania",
      "whatMoves": ["Biometric Verification Rates", "Orb Regulatory Audits"],
      "relatedTopics": ["World ID", "Proof of Personhood", "The Orb biometrics"]
    },
    {
      "symbol": "ZEC",
      "name": "Zcash",
      "category": "Store of Value",
      "description": "Zcash is a decentralized cryptography network utilizing zero-knowledge proofs to secure private, shielded transfers.",
      "founded": 2016,
      "creator": "Zooko Wilcox",
      "whatMoves": ["Shielded Transaction Volume", "Zcash halving adjustments"],
      "relatedTopics": ["zk-SNARKs", "Shielded Transactions", "Zero-Knowledge Cryptography"]
    }
  ];

  // Set to keep track of real symbols to avoid duplicates in dynamic generation
  const realSymbols = new Set(realCoins.map(coin => coin.symbol.toLowerCase()));

  // Add the high-fidelity real coins to our master list
  list.push(...realCoins);

  // ALPHABETIZE absolute database by name!
  list.sort((a, b) => a.name.localeCompare(b.name));

  cachedCrypto = list;
  return list;
}

// 4. FOREX — crosses of real ISO currencies
let cachedForex: any[] = [];
export function getProceduralForex(): any[] {
  if (cachedForex.length > 0) return cachedForex;

  const baseCurrencies = ["USD", "EUR", "GBP", "JPY", "AUD", "CAD", "CHF", "NZD", "SEK", "NOK", "MXN", "SGD", "HKD", "KRW", "TRY", "INR", "BRL", "ZAR", "CNY", "AED", "SAR", "PLN", "DKK", "TWD", "THB", "RUB", "ILS", "CLP", "PEN", "COP", "IDR", "MYR", "VND", "CZK", "HUF", "RON", "PHP"];
  const list: any[] = [];

  // EUR/USD and USD/JPY first
  list.push({
    "pair": "EUR/USD",
    "type": "Major",
    "description": "Euro versus U.S. Dollar.",
    "countries": ["European Union", "United States"],
    "affectedBy": ["ECB", "Federal Reserve", "Inflation", "Interest Rates"],
    "education": {
      "whatMovesThis": ["Rate Differentials", "GDP", "War", "Inflation"],
      "relatedAssets": ["Gold", "DXY", "Bonds"]
    }
  });

  list.push({
    "pair": "USD/JPY",
    "type": "Major",
    "description": "U.S. Dollar versus Japanese Yen.",
    "affectedBy": ["Bank of Japan", "Federal Reserve", "Bond Yields"]
  });

  // Generate systematically to get 1,000+ distinct pairs
  let id = 0;
  for (let i = 0; i < baseCurrencies.length; i++) {
    for (let j = 0; j < baseCurrencies.length; j++) {
      if (i === j) continue;
      const c1 = baseCurrencies[i];
      const c2 = baseCurrencies[j];
      const pair = `${c1}/${c2}`;

      if (pair === "EUR/USD" || pair === "USD/JPY") continue;

      id++;
      list.push({
        pair,
        type: (c1 === "USD" || c1 === "EUR" || c2 === "USD" || c2 === "EUR") ? "Cross" : "Exotic",
        description: `${c1} versus ${c2} exchange rate.`,
        affectedBy: [`${c1} central bank policy`, `${c2} central bank policy`, "Interest-rate differentials"]
      });
      if (list.length >= 1200) break;
    }
    if (list.length >= 1200) break;
  }

  cachedForex = list;
  return list;
}

// 5. COMMODITIES — real exchange-traded futures only
let cachedCommodities: any[] = [];
export function getProceduralCommodities(): any[] {
  if (cachedCommodities.length > 0) return cachedCommodities;

  const list: any[] = [];
  list.push({
    "symbol": "XAUUSD",
    "name": "Gold",
    "category": "Precious Metals",
    "description": "Gold is a monetary reserve asset and inflation hedge.",
    "affectedBy": ["Inflation", "War", "USD Weakness", "Interest Rates"]
  });

  list.push({
    "symbol": "CL",
    "name": "Crude Oil",
    "category": "Energy",
    "description": "Oil powers transportation and industrial economies.",
    "affectedBy": ["OPEC", "Wars", "Supply Chains", "Demand"]
  });

  for (const [symbol, name, category, exchange] of REAL_COMMODITY_FUTURES) {
    list.push({
      symbol,
      name,
      category,
      description: `${name} futures (root symbol ${symbol}) trade on ${exchange}.`,
      affectedBy: COMMODITY_DRIVERS[category] || ["Supply", "Demand", "USD strength"],
    });
  }

  cachedCommodities = list;
  return list;
}

// 6. GLOSSARY — authored terms only (no generated prefix+core phrases)
let cachedGlossary: any[] = [];
export function getProceduralGlossary(): any[] {
  if (cachedGlossary.length > 0) return cachedGlossary;

  const list: any[] = [];
  const existingTermsSet = new Set<string>();

  // Add real academic/financial terms first from RealGlossaryData.ts
  for (const item of REAL_GLOSSARY_TERMS) {
    list.push(item);
    existingTermsSet.add(item.term.toLowerCase());
  }

  // Standard core definitions to preserve
  const standardTerms = [
    {
      "term": "Inflation",
      "definition": "The increase in prices over time reducing purchasing power.",
      "category": "Macroeconomics",
      "related": ["Federal Reserve", "Money Supply", "Interest Rates"]
    },
    {
      "term": "Market Capitalization",
      "definition": "The total value of a company’s shares outstanding.",
      "category": "Stocks"
    }
  ];

  for (const item of standardTerms) {
    if (!existingTermsSet.has(item.term.toLowerCase())) {
      list.push(item);
      existingTermsSet.add(item.term.toLowerCase());
    }
  }

  cachedGlossary = list;
  return list;
}

// 8. MASTER SEARCH ENGINE FUNCTION
export function searchAllData(query: string, datasets: any[]) {
  const lower = query.toLowerCase();

  return datasets.filter((item) => {
    return JSON.stringify(item)
      .toLowerCase()
      .includes(lower);
  });
}
