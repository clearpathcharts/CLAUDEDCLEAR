import React, { useState } from 'react';
import { 
  Globe, Shield, Cpu, Flame, Truck, HelpCircle, 
  ArrowRight, Users, ChevronRight, TrendingUp, AlertTriangle, 
  Coins, Calendar, Info, BarChart3, Clock, Zap, BookOpen
} from 'lucide-react';

interface GlobalAtlasViewProps {
  selectFileNode: (fileName: string) => void;
  askAboutTerm?: (term: any) => void;
}

export default function GlobalAtlasView({ selectFileNode }: GlobalAtlasViewProps) {
  // 1. Interactive World Map System states
  const [activeGeoRegion, setActiveGeoRegion] = useState<'us' | 'china' | 'midEast' | 'europe'>('us');
  
  // 2. Supply chain stepper item selection
  const [activeChain, setActiveChain] = useState<'smartphone' | 'bread' | 'gas'>('smartphone');
  const [chainStep, setChainStep] = useState<number>(0);

  // 3. Shock simulated states
  const [activeShock, setActiveShock] = useState<string | null>(null);

  // 4. Money Timeline Selection
  const [selectedEra, setSelectedEra] = useState<number>(0);

  // Data Definitions
  const GEO_REGIONS = {
    us: {
      name: 'United States (USD Engine)',
      flag: '🇺🇸',
      tagline: 'Sovereign Consumer Demand & High Tech Central Reserve',
      industries: ['Defense Engineering', 'SaaS & GenAI Computing', 'Investment Capital Pools', 'Advanced Semiconductor Architecture'],
      exports: ['Aerospace Systems & Weapons', 'Petroleum Products', 'Refined Soy & Raw Agriculture', 'Intellectual Property'],
      imports: ['Consumer Electronics', 'Heavy Industrial Automotives', 'Pharmaceutical Formulations', 'Battery Minerals'],
      resources: ['Shale Oil & Natural Gas reserves', 'Rich arable farmland & food aquifers', 'High-nanometer R&D engineering bases'],
      currency: 'US Dollar ($) - Globe Reserve Standard',
      affect: 'Lower fed rates reduce credit card and loan payments for standard families but fuel asset bubbles. A strong dollar makes global trips cheaper but hurts domestic factory jobs by making American exports expensive.'
    },
    china: {
      name: 'China (CNY Manufacturing Giant)',
      flag: '🇨🇳',
      tagline: 'Global Supply Chain Workbench & Lithium Processing Center',
      industries: ['Lithium-Ion Giga-Batteries', 'Consumer Telecom Assembly', 'Steel Production Mills', 'Solar Energy Arrays'],
      exports: ['Assembled Computers & Mobiles', 'Photovoltaic Solar Modules', 'Machinery & Finished Fabrics', 'Rare Earth Magnetics'],
      imports: ['Unrefined Iron Ore', 'Sovereign Debt Papers', 'Raw Crude Oil', 'Foreign Lithography Chips'],
      resources: ['90%+ Global Rare Earth processing capacity', 'Immense dense industrial automation parks', 'Dense labor infrastructure'],
      currency: 'Renminbi Yuan (¥) - Dual Trade Ledger',
      affect: 'If Chinese manufacturing indices drop, consumer shipping lags global ports. Households experience delays and sudden supply collapses in local big box department stores.'
    },
    midEast: {
      name: 'Middle East (Sovereign Energy Pivot)',
      flag: '🇸🇦',
      tagline: 'Global Crude Reserves, Petroleum Refining, & Strategic Shipping Corridors',
      industries: ['Petrochemical Refinement', 'Sovereign Wealth Megaprojects', 'Maritime Shipping Transport', 'Desalination Infrastructure'],
      exports: ['Sovereign Crude Oil', 'Natural Gas Fuels', 'Refined Plastics & Polymers', 'Fertilizer Base Salts'],
      imports: ['Advanced Defense Hardware', 'Fresh Domestic Groceries', 'Heavy Capital Machinery', 'Premium Consumer Goods'],
      resources: ['Massive easily-extracted geological sediment reservoirs', 'Strategic shipping channels (Bab-el-Mandeb, Hormuz)'],
      currency: 'Riyal, Dirham & Sovereign Dinars',
      affect: 'Any disruption in Middle East supply routes directly triggers a spikes at standard gas pumps worldwide in 48 hours, raising food transport costs and inflating the local grocery bill.'
    },
    europe: {
      name: 'Europe (EUR High-Precision Industrial Rail)',
      flag: '🇪🇺',
      tagline: 'Bilateral Trade Alliances, Automotive Engineering, & Sovereign Welfare led Liquidity',
      industries: ['Sovereign Debt Issuance', 'Bespoke Automotive Machinery', 'Pharmaceutical Packaging', 'Semiconductor Laser Optics (ASML Key Parts)'],
      exports: ['Surgical & Medical Compounds', 'Luxury Passenger Vehicles', 'Extreme Precision Lithography Spares', 'Dairy & Agricultural Reserves'],
      imports: ['Siberian Liquid Gas Equivalents', 'Overseas Digital Tech Platforms', 'Assembled Telemetry Hubs'],
      resources: ['highly educated specialist labor pools', 'Strong sovereign regulatory framework reserves'],
      currency: 'Euro (€) - Institutional Credit Reserve',
      affect: 'High energy prices in Europe force major factories to pause operations, laying off workers and boosting prices of imported performance cars or luxury goods abroad.'
    }
  };

  const SUPPLY_CHAINS = {
    smartphone: {
      title: 'Smartphone Life-Path',
      desc: 'Follow the epic voyage of rare elements and silicon processing that links multiple continents before entering your pocket.',
      steps: [
        { label: 'Rare Earth Extraction', location: 'Democratic Republic of Congo / Western Australia', detail: 'Artisanal and industrial miners extract Cobalt and Coltan under hazardous human conditions, which are then shipped overseas for chemical purification.', icon: '⛏️' },
        { label: 'Precision Semiconductor Fab', location: 'Hsinchu, Taiwan (TSMC Lithography Cleans)', detail: 'Pure Silicon ingots are bombarded by extreme ultraviolet (EUV) lasers to etch nano-transistors onto wafers at 3-nanometer scale structural precision.', icon: '⚡' },
        { label: 'Giga-Factory Assembly', location: 'Shenzhen, China (Foxconn Hubs)', detail: 'Wafers, batteries, camera sensors, and aluminum bodies converge in vast automated assembly rooms where human fingers and machines solder and packet them.', icon: '🏭' },
        { label: 'Maritime Mega-Shipping Corridor', location: 'Suez Canal / Pacific Oceans', detail: 'Billions of physical containers are stacked on diesel supertankers, traversing strategic ocean narrows to reach deepwater ports. Shipping pricing index impacts overall tech margins.', icon: '🚢' },
        { label: 'Retail Delivery & Purchase', location: 'Shopping Centers worldwide', detail: 'The consumer purchases the device, backed by local consumer credit contracts. A multi-thousand mile journey culminates in a single digital tap.', icon: '📱' }
      ]
    },
    bread: {
      title: 'A Loaf of Bread',
      desc: 'An economic pathway showing why localized conflict or fuel hikes immediately change the price of your breakfast.',
      steps: [
        { label: 'Nitrogen & Phosphate Synthesizing', location: 'Russia / Canada (Fertilizer Pools)', detail: 'Natural gas is processed at extremely high pressures to manufacture nitrogen fertilizers. Disrupting natural gas supplies causes fertilizer prices to skyrocket.', icon: '🧪' },
        { label: 'Precision Industrial Agriculture', location: 'Great Plains, USA / Steppes, Ukraine', detail: 'Mega-tractors powered by burning expensive agricultural diesel till millions of acres of fertile soil, sowing hybrid drought-resistant wheat seeds.', icon: '🚜' },
        { label: 'Silo Storage & Grain Merchandising', location: 'Regional Silos & Elevators', detail: 'Wheat grains are harvested and stored in colossal temperature-controlled silos. Global commodities traders trade these wheat futures in Chicago (CBOT).', icon: '🌾' },
        { label: 'Flour Milling & Commercial Baking', location: 'Industrial Mills & Ovens', detail: 'Grains are crushed into flour. Commercial bakers add yeast, water, and heat, turning electricity and labor costs into baked goods.', icon: '🍞' },
        { label: 'Grocery Truck Delivery', location: 'Local Distribution Parks', detail: 'Delivery trucks distribute loaves to regional grocery stores. Driver wage inflation and fuel prices are factored directly into the end price sticker.', icon: '🏪' }
      ]
    },
    gas: {
      title: 'A Gallon of Gasoline',
      desc: 'Trace the physical journey of ancient decomposed marine life from sub-ocean crusts straight to your car tank.',
      steps: [
        { label: 'Seismic Extraction', location: 'Permian Basin, Texas / North Sea Offshore', detail: 'Drills penetrate miles deep into planetary crusts. High hydraulic pressures extract thick, viscous black crude oil from ancient shale pockets.', icon: '🛢️' },
        { label: 'Pipelines & Trans-Ocean Supertankers', location: 'Sovereign Energy Pipelines', detail: 'Valves push crude across continents, or loaded into massive VLCC supertankers traversing high-seas bottlenecks like the Strait of Malacca.', icon: '🌊' },
        { label: 'Catalytic Crack Refining', location: 'Houston Ship Channel / Rotterdam Grid', detail: 'Colossal towers boil crude oil. Heat snaps molecular bonds, breaking thick crude into highly volatile gasoline fractions, asphalt, and diesel.', icon: '🔥' },
        { label: 'Wholesale Depot Terminals', location: 'Domestic Tank Farms', detail: 'Gasoline pipeline grids deliver batches to regional fuel racks, where winter/summer octane blends are mixed with ethanol.', icon: '⛽' },
        { label: 'Retail Station Pump', location: 'Your Neighborhood Outlet', detail: 'Taxes, fuel delivery transport fees, and retail margins are added. The final price tag jumps in lockstep with global crude benchmark fluctuations.', icon: '🚗' }
      ]
    }
  };

  const SHOCKS = {
    war: {
      title: 'Geopolitical War / Blockade',
      desc: 'Sovereign conflicts halt physical commodities movement and trigger severe national embargoes.',
      why: 'Key logistics routes (e.g. Red Sea or Black Sea) become military zones, forcing tankers to bypass around Africa.',
      what: 'Shipping container rates surged by 250%+; crop exports from global farm belts halted, causing panic bread buying.',
      who: 'Developing nations importing critical food suffered catastrophic famines; global consumers saw immediate energy bills rise.'
    },
    pandemic: {
      title: 'Global Pandemic Lockdown',
      desc: 'Governments mandate citizens to stay indoors, freezing service sectors and factory production.',
      why: 'Fear of viral contagion forces absolute plant lockdowns, breaking the sequential supply chain system.',
      what: 'Physical goods demand spiked while factories sat idle; extreme freight container imbalances emerged globally.',
      who: 'Hourly hospitality workers lost jobs instantly; microchip shortages halted global car factories, inflating used vehicle pricing by 40%.'
    },
    oil_crisis: {
      title: 'Oil Supply Embargo',
      desc: 'Major sovereign oil producers voluntarily choke crude flows to apply geopolitical pressure.',
      why: 'OPEC cartel votes to slash extraction quotes to force western diplomatic concessions.',
      what: 'Energy costs doubled across all manufacturing sectors, triggering 1970s style stagnant economic growth (Stagflation).',
      who: 'Surburban commuters spent significant shares of weekly paychecks just driving to work; airlines cut routes.'
    },
    housing_crash: {
      title: 'Housing & Mortgage Debt Bubble Collapse',
      desc: 'Speculative housing bubbles funded by complex subprime mortgage bundles pop.',
      why: 'Predatory lending and zero-down adjustable rate loans went into massive default when bubble growth plateaued.',
      what: 'Colossal investment banks holding bad systemic mortgage assets went bankrupt, freezing interbank lending programs.',
      who: 'Standard home buyers lost life savings in foreclosures; construction crews experienced severe multi-year unemployment.'
    },
    bank_failure: {
      title: 'Contagious Bank Run / Failure',
      desc: 'Savers panic and withdraw deposits via mobile apps faster than a bank can liquidate bond holdings.',
      why: 'Rapid interest rate rises devalued safe bank treasuries, raising questions about bank net liquidity.',
      what: 'Central banks forced emergency liquid lending windows and paper buybacks to stem panic from reaching main-street deposits.',
      who: 'Startups and mid-sized businesses found their payroll funds frozen, risking immediate operational shutdowns.'
    }
  };

  const MONEY_HISTORY = [
    {
      era: 'Barter to Sumerian Ledgers (3000 BC)',
      title: 'Pre-Coin Trade & Grain Debt',
      desc: 'Early humans traded goats for wheat directly, but physical items are seasonal and perish. To solve this, Sumerian temples wrote credit IOUs onto clay tablets using sheep and grain as accounting units. Money entered existence as a physical system of debt record!',
      highlight: 'Ledgers existed centuries before metallic coins were ever struck.'
    },
    {
      era: 'The Lydian Coinage (600 BC)',
      title: 'Sovereign Gold & Silver Minting',
      desc: 'King Croesus of Lydia began stamping uniform nuggets of gold-silver alloy (electrum) with a royal lion seal. This verified exact weight and purity instantly, eliminating scale measurements in markets. Standard trade velocities exploded.',
      highlight: 'Trust was decoupled from local merchants and moved to state seals.'
    },
    {
      era: 'The Chinese Fiat Bill (1000 AD)',
      title: 'Song Dynasty Flying Cash',
      desc: 'Carrying heavy iron coins became a logistical disaster for merchants. The government began printing light paper bank receipts called Jiaozi. For the first time, money was detached from a heavy physical medium and backed purely by imperial decree.',
      highlight: 'The birth of Fiat money—backed by belief, law, and taxation.'
    },
    {
      era: 'The Fractional Goldsmiths (1600s)',
      title: 'The Birth of Modern Banking Reserves',
      desc: 'London goldsmiths accepted physical bullion deposits for safekeeping, issuing paper warehouse receipts. Because depositors rarely came back for their physical gold at the same time, goldsmiths began loaning out more paper receipts than actual gold on deposit. This invented Fractional-Reserve Banking!',
      highlight: 'Credit expansion: banks creating new money out of thin air via debt contracts.'
    },
    {
      era: 'Bretton Woods & Flat Fiat (1971)',
      title: 'Nixon Closes the Gold Window',
      desc: 'For centuries, paper dollars were still legally tradeable for physical gold sovereign reserves. In 1971, President Nixon ended this gold convertibility entirely. The entire global financial network converted to floating fiat currencies, valued only relative to each other and backed by central bank rate management.',
      highlight: 'Human money is now 100% digital information, driven by credit trust.'
    }
  ];

  const handleNextStep = () => {
    const totalSteps = SUPPLY_CHAINS[activeChain].steps.length;
    setChainStep(prev => (prev + 1) % totalSteps);
  };

  const handlePrevStep = () => {
    const totalSteps = SUPPLY_CHAINS[activeChain].steps.length;
    setChainStep(prev => (prev - 1 + totalSteps) % totalSteps);
  };

  return (
    <div className="flex flex-col gap-8 font-sans select-none animate-fadeIn select-text pb-12 text-zinc-300">
      
      {/* 1. EPIC HERO SPLASH BANNER */}
      <section className="relative overflow-hidden border border-cyan-500/15 p-8 md:p-12 rounded-[28px] bg-gradient-to-br from-[#0c1f2c] via-black/90 to-black select-text shadow-2xl">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-400/30 to-transparent" />
        <div className="absolute top-0 right-0 p-4 text-[9px] font-mono font-bold tracking-widest text-[#00D9FF]">ATLAS GRID CODES // RUNNING</div>
        <div className="relative z-10 max-w-[780px] flex flex-col gap-4">
          <span className="inline-block px-3 py-1 bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-[10px] font-black tracking-widest uppercase font-mono rounded-full max-w-fit">
            Academic Observatory • Phase 8
          </span>
          <h1 className="text-white font-black text-2.5xl md:text-3.5xl tracking-tight leading-none uppercase">
            The Global Financial Atlas <br/>
            <span className="text-[#00D9FF] text-2xl md:text-3xl">& Human Impact Engine</span>
          </h1>
          <p className="text-zinc-400 text-xs md:text-sm leading-relaxed">
            Unpack the invisible supply lines, sovereign trade flows, and historical monetary regimes that govern human civilization. Discover how a single policy dial adjustment at a Central Bank in Washington echoes through factories in Shenzhen, energy nodes in Riyadh, and your local grocery bill.
          </p>
        </div>
      </section>

      {/* 2. THE GLOBAL ATLAS INTERACTIVE MAP PLATFORM */}
      <div className="p-6 bg-[#040915]/95 border border-white/10 rounded-3xl relative overflow-hidden flex flex-col gap-6 shadow-xl">
        <div className="absolute top-0 right-0 p-3 font-mono text-[9px] text-[#00D9FF] font-bold">SOVEREIGN_NODE_LOOKUP_V8</div>
        <div className="flex items-center gap-2 border-b border-white/5 pb-3">
          <Globe className="w-5 h-5 text-[#00D9FF]" />
          <div>
            <h3 className="text-white font-extrabold text-xs uppercase tracking-wider">A Living Map of Human Economic Geography</h3>
            <span className="text-[10px] font-mono text-zinc-500">DYNAMIC REGIONAL EXPORT, IMPORT, AND LIQUIDITY PROFILES</span>
          </div>
        </div>

        {/* Region selector bar */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
          {Object.entries(GEO_REGIONS).map(([key, reg]) => (
            <button
              key={key}
              onClick={() => setActiveGeoRegion(key as any)}
              className={`p-3.5 rounded-xl border font-mono text-[10.5px] uppercase font-bold tracking-wider transition-all flex items-center justify-between cursor-pointer ${activeGeoRegion === key ? 'bg-cyan-500/15 border-cyan-400 text-white shadow-[0_0_15px_rgba(0,217,255,0.15)] scale-[1.01]' : 'border-white/5 bg-white/[0.01] hover:bg-white/[0.04] text-zinc-400'}`}
            >
              <span>{reg.flag} {reg.name.split(' ')[0]}</span>
              <span className={`text-[9px] px-1.5 py-0.5 rounded font-black ${activeGeoRegion === key ? 'bg-cyan-400 text-black' : 'bg-white/5 text-zinc-500'}`}>
                {key.toUpperCase()}
              </span>
            </button>
          ))}
        </div>

        {/* Region Data display board */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 bg-black/40 border border-white/5 p-5 rounded-2xl">
          <div className="lg:col-span-5 flex flex-col justify-between gap-4">
            <div>
              <span className="font-mono text-[9px] uppercase tracking-widest text-[#00D9FF] font-semibold block mb-1">Active Sovereign Geo-Node</span>
              <h4 className="text-white font-black text-lg tracking-tight uppercase flex items-center gap-2">
                <span>{GEO_REGIONS[activeGeoRegion].flag}</span>
                <span>{GEO_REGIONS[activeGeoRegion].name}</span>
              </h4>
              <p className="text-zinc-400 text-[11px] leading-relaxed mt-2 italic">
                "{GEO_REGIONS[activeGeoRegion].tagline}"
              </p>
            </div>

            <div className="p-3.5 bg-cyan-950/20 border border-cyan-500/20 rounded-xl">
              <span className="font-mono text-[9px] uppercase tracking-wider text-cyan-300 font-bold block mb-1">Sovereign Currency Layer</span>
              <div className="text-white text-xs font-bold font-mono">{GEO_REGIONS[activeGeoRegion].currency}</div>
            </div>
          </div>

          <div className="lg:col-span-7 grid grid-cols-1 md:grid-cols-2 gap-4 border-l border-white/5 pl-0 lg:pl-6">
            <div className="space-y-2">
              <span className="text-[10px] text-green-400 font-mono tracking-widest font-bold block uppercase">▲ Core Industries & Exports</span>
              <ul className="text-xs space-y-1 text-zinc-300">
                {GEO_REGIONS[activeGeoRegion].industries.map((ind, i) => (
                  <li key={i} className="flex items-center gap-1.5"><span className="text-green-500 font-mono">√</span> {ind}</li>
                ))}
              </ul>
              <div className="h-px bg-white/5 my-2" />
              <div className="text-[10px] text-zinc-400 font-mono">PRIMARY EXPORT VOLUMES:</div>
              <div className="text-[11px] text-zinc-300">{GEO_REGIONS[activeGeoRegion].exports.join(' • ')}</div>
            </div>

            <div className="space-y-2 border-t md:border-t-0 md:border-l border-white/5 pt-3 md:pt-0 pl-0 md:pl-4">
              <span className="text-[10px] text-red-400 font-mono tracking-widest font-bold block uppercase">▼ Strategic Imports & Reserves</span>
              <ul className="text-xs space-y-1 text-zinc-350">
                {GEO_REGIONS[activeGeoRegion].resources.map((res, i) => (
                  <li key={i} className="flex items-center gap-1.5"><span className="text-amber-500 font-mono">♦</span> {res}</li>
                ))}
              </ul>
              <div className="h-px bg-white/5 my-2" />
              <div className="text-[10px] text-zinc-400 font-mono">CRITICAL IMPORTS:</div>
              <div className="text-[11px] text-zinc-350">{GEO_REGIONS[activeGeoRegion].imports.join(' • ')}</div>
            </div>
          </div>
        </div>

        {/* HUMAN IMPACT TRANSITION SUBSECTION */}
        <div className="bg-[#0e1627] border border-cyan-500/25 p-5 rounded-2.5xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="max-w-2xl">
            <div className="text-xs font-mono font-black text-amber-400 flex items-center gap-1 uppercase tracking-wider mb-1">
              <Info className="w-4 h-4 text-amber-400" />
              <span>Sovereign Linkage to the Citizen</span>
            </div>
            <h4 id="uh5g8x" className="text-white font-black text-xs uppercase tracking-wide">
              "How does this affect everyday human life?"
            </h4>
            <p className="text-zinc-450 text-[10.5px] leading-relaxed mt-1.5 font-mono">
              {GEO_REGIONS[activeGeoRegion].affect}
            </p>
          </div>
          <button 
            onClick={() => selectFileNode('encyclopedia/global/us-macro.html')}
            className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-[#10b981] hover:from-cyan-400 hover:to-emerald-500 text-black font-sans font-extrabold text-[10px] tracking-widest uppercase rounded-xl transition-all cursor-pointer flex items-center gap-1 max-w-fit shrink-0"
          >
            <span>Dive Deep US Macro</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 3. "WHERE THINGS COME FROM" PHYSICAL SUPPLY CHAIN SYSTEMS */}
      <div className="p-6 bg-[#040915]/95 border border-white/10 rounded-3xl relative overflow-hidden flex flex-col gap-6 shadow-xl">
        <div className="flex items-center gap-2 border-b border-white/5 pb-3">
          <Truck className="w-5 h-5 text-amber-400" />
          <div>
            <h3 className="text-white font-extrabold text-xs uppercase tracking-wider">"Where Things Come From" • Visual Supply Chains</h3>
            <span className="text-[10px] font-mono text-zinc-500">DECONSTRUCTING THE EMBODIED LABOR AND MATERIALS IN EVERYDAY CONSUMPTION</span>
          </div>
        </div>

        {/* Chain selector */}
        <div className="flex bg-neutral-900 border border-white/5 p-1 rounded-xl max-w-md">
          {Object.keys(SUPPLY_CHAINS).map((chainKey) => (
            <button
              key={chainKey}
              onClick={() => { setActiveChain(chainKey as any); setChainStep(0); }}
              className={`flex-1 py-1.5 text-center font-mono text-[10px] rounded-lg tracking-wider transition-all cursor-pointer ${activeChain === chainKey ? 'bg-amber-400 text-black font-black' : 'text-zinc-400 hover:text-white'}`}
            >
              {SUPPLY_CHAINS[chainKey as keyof typeof SUPPLY_CHAINS].title.split(' ')[1] || SUPPLY_CHAINS[chainKey as keyof typeof SUPPLY_CHAINS].title}
            </button>
          ))}
        </div>

        <p className="text-zinc-400 text-xs leading-relaxed italic">
          {SUPPLY_CHAINS[activeChain].desc}
        </p>

        {/* Interactive Step Board */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          
          {/* Progress Indicators Left */}
          <div className="lg:col-span-4 flex flex-row lg:flex-col gap-1.5 lg:border-r border-white/5 pr-0 lg:pr-4">
            {SUPPLY_CHAINS[activeChain].steps.map((st, sIdx) => (
              <button
                key={sIdx}
                onClick={() => setChainStep(sIdx)}
                className={`flex-1 flex items-center gap-3 p-3 rounded-xl border text-left transition-all cursor-pointer ${chainStep === sIdx ? 'bg-amber-500/10 border-amber-400 text-white' : 'border-white/5 bg-white/[0.005] hover:bg-white/5 text-zinc-500'}`}
              >
                <span className="text-base">{st.icon}</span>
                <div className="hidden md:block">
                  <div className="text-[10px] font-mono tracking-widest leading-none">STAGE 0{sIdx+1}</div>
                  <div className="text-[10px] font-semibold mt-1 truncate">{st.label}</div>
                </div>
              </button>
            ))}
          </div>

          {/* Stepper Detail Card Right */}
          <div className="lg:col-span-8 bg-neutral-950/60 p-6 rounded-2xl border border-white/5 flex flex-col justify-between min-h-[220px]">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-mono font-black text-amber-400 py-0.5 px-2 bg-amber-500/15 border border-amber-500/20 rounded-full">
                  STEP {chainStep + 1} OF {SUPPLY_CHAINS[activeChain].steps.length}
                </span>
                <span className="text-[10px] font-mono font-bold text-zinc-500 flex items-center gap-1">
                  <span className="inline-block w-1.5 h-1.5 bg-green-500 rounded-full animate-ping" />
                  Supply Corridance Linked
                </span>
              </div>

              <h4 className="text-white font-black text-base mt-3 flex items-center gap-2">
                <span>{SUPPLY_CHAINS[activeChain].steps[chainStep].icon}</span>
                <span>{SUPPLY_CHAINS[activeChain].steps[chainStep].label}</span>
              </h4>

              <div className="text-[10px] font-mono text-[#00D9FF] uppercase tracking-wider mt-1.5 flex items-center gap-1">
                <span>Geographic Epicenter:</span>
                <span className="text-zinc-350">{SUPPLY_CHAINS[activeChain].steps[chainStep].location}</span>
              </div>

              <p className="text-zinc-400 text-[11.5px] leading-relaxed mt-3 pt-3 border-t border-white/5">
                {SUPPLY_CHAINS[activeChain].steps[chainStep].detail}
              </p>
            </div>

            <div className="flex gap-2 mt-6 border-t border-white/5 pt-4">
              <button 
                onClick={handlePrevStep}
                className="py-1 px-3 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-lg text-[9px] uppercase font-mono tracking-[0.1em] cursor-pointer"
              >
                ◀ Previous Ship
              </button>
              <button 
                onClick={handleNextStep}
                className="py-1 px-3 bg-amber-400 hover:bg-amber-300 text-black font-extrabold rounded-lg text-[9px] uppercase font-mono tracking-[0.1em] cursor-pointer"
              >
                Next Carrier ▶
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* 4. GLOBAL TRADE FLOW & TRANSIT BOTTLENECKS */}
      <div className="p-6 bg-[#040915]/95 border border-white/10 rounded-3xl relative overflow-hidden flex flex-col gap-6 shadow-xl">
        <div className="flex items-center gap-2 border-b border-white/5 pb-3">
          <Zap className="w-5 h-5 text-cyan-400 animate-pulse" />
          <div>
            <h3 className="text-white font-extrabold text-xs uppercase tracking-wider">Systemic Global Trade Flow & Bottlenecks</h3>
            <span className="text-[10px] font-mono text-zinc-500">WHY GLOBAL CO-DEPENDENCY GUARANTEES REGIONAL PEACE & CRUISE FRICTION RISK</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              corridor: 'Strait of Malacca (The Tech Pipeline)',
              flow: '16 Million Barrels/day & 60,000 ships/year',
              desc: 'Connecting the Indian Ocean to East Asia. The primary energetic and lithium conduit feeding Chinese Gigafactories. A naval blockade here instantly freezes the electronics supply chains of advanced semiconductors produced in Taiwan.',
              impact: 'Smartphone manufacturing halts, sending prices of replacement parts skyrocketing 150%+.'
            },
            {
              corridor: 'Suez Canal & Red Sea (The Energy Canal)',
              flow: '12% of total Global Trade & 10% of oil flows',
              desc: 'The vital shortcut between Europe and APAC. When maritime vessels are forced to avoid Suez due to conflict, they must round Africa’s Cape of Good Hope, adding 10-14 travel days.',
              impact: 'Extreme diesel fuel logistics hikes, inflating final wholesale retail pricing of supermarket groceries.'
            },
            {
              corridor: 'Panama Canal (The Grain & Coal Pivot)',
              flow: '40% of all US container traffic to Asian markets',
              desc: 'Locks that lift mega-ships across continental splits. Severe droughts degrade fresh water lock feeders, forcing container volume constraints from standard 36 ships to only 18.',
              impact: 'Slower transit loops boost global commodities shipping indices (e.g. Baltic Dry Index), raising raw food prices.'
            }
          ].map((cor, i) => (
            <div key={i} className="p-5 bg-black/60 border border-white/5 rounded-2xl flex flex-col justify-between">
              <div>
                <span className="text-[9px] font-mono text-[#00D9FF] uppercase tracking-wider font-bold">Choke-Point 0{i+1}</span>
                <h4 className="text-white font-bold text-xs mt-1.5">{cor.corridor}</h4>
                <div className="text-[9.5px] font-mono text-green-400 font-bold mt-1">VOLUME STABILITY: {cor.flow}</div>
                <p className="text-zinc-400 text-[11px] leading-relaxed mt-2.5">{cor.desc}</p>
              </div>
              <div className="mt-4 p-2.5 bg-red-950/25 border border-red-900/30 rounded-lg text-[10px]">
                <span className="font-mono text-xs text-red-400 font-bold uppercase block leading-none">Main Street Human Impact:</span>
                <p className="text-zinc-300 mt-1 leading-relaxed">{cor.impact}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 5. "ECONOMIC SHOCK" VISUALIZATION CONSOLE */}
      <div className="p-6 bg-[#040915]/95 border border-white/10 rounded-3xl relative overflow-hidden flex flex-col gap-6 shadow-xl">
        <div className="flex items-center gap-2 border-b border-white/5 pb-3">
          <AlertTriangle className="w-5 h-5 text-red-500 animate-pulse" />
          <div>
            <h3 className="text-white font-extrabold text-xs uppercase tracking-wider">"Economic Shock" Simulation Terminal</h3>
            <span className="text-[10px] font-mono text-zinc-500">INTERACTIVE DAMAGE REPORT ON MAJOR CIVILIZATION CRISES</span>
          </div>
        </div>

        {/* Trigger grids */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2.5">
          {Object.entries(SHOCKS).map(([key, value]) => (
            <button
              key={key}
              onClick={() => setActiveShock(key)}
              className={`p-3 rounded-xl border font-mono text-[9.5px] uppercase font-black tracking-widest text-center cursor-pointer transition-all ${activeShock === key ? 'bg-red-500/10 border-red-500 text-red-400 scale-[1.02] shadow-[0_0_15px_rgba(239,68,68,0.15)]' : 'border-white/5 bg-white/[0.01] hover:bg-white/5 text-zinc-400'}`}
            >
              ☢ {value.title.split(' ')[0]}
            </button>
          ))}
        </div>

        {/* Shock simulation terminal panel */}
        {activeShock ? (
          <div className="bg-[#0b0303] border border-red-500/25 p-5 rounded-2xl flex flex-col gap-4 animate-fadeIn">
            <div className="flex items-center justify-between border-b border-white/5 pb-2">
              <span className="text-red-400 text-[10px] font-mono font-black uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                ACTIVE SHOCK MATRIX: {SHOCKS[activeShock as keyof typeof SHOCKS].title.toUpperCase()}
              </span>
              <button 
                onClick={() => setActiveShock(null)}
                className="text-zinc-500 hover:text-white font-mono text-[9px] uppercase font-bold"
              >
                [Clear Shock]
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-2">
              <div className="space-y-1.5">
                <span className="text-[9.5px] font-mono text-red-400 uppercase tracking-widest font-extrabold block">01 // WHY IT TRIGGERED</span>
                <p className="text-zinc-300 text-[11px] leading-relaxed">{SHOCKS[activeShock as keyof typeof SHOCKS].why}</p>
              </div>

              <div className="space-y-1.5 border-t md:border-t-0 md:border-l border-white/5 pt-3 md:pt-0 pl-0 md:pl-4">
                <span className="text-[9.5px] font-mono text-amber-400 uppercase tracking-widest font-extrabold block">02 // WHAT HAPPENED</span>
                <p className="text-zinc-300 text-[11px] leading-relaxed">{SHOCKS[activeShock as keyof typeof SHOCKS].what}</p>
              </div>

              <div className="space-y-1.5 border-t md:border-t-0 md:border-l border-white/5 pt-3 md:pt-0 pl-0 md:pl-4">
                <span className="text-[9.5px] font-mono text-green-400 uppercase tracking-widest font-extrabold block">03 // WHO SUFFERED MOST</span>
                <p className="text-zinc-300 text-[11px] leading-relaxed block">{SHOCKS[activeShock as keyof typeof SHOCKS].who}</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-8 border border-white/5 bg-black/40 rounded-2xl flex flex-col items-center justify-center text-center">
            <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Select a cellular shock option above to trigger an educational damage report</span>
          </div>
        )}
      </div>

      {/* 6. "THE HISTORY OF MONEY" TIMELINE */}
      <div className="p-6 bg-[#040915]/95 border border-white/10 rounded-3xl relative overflow-hidden flex flex-col gap-6 shadow-xl">
        <div className="flex items-center gap-2 border-b border-white/5 pb-3">
          <Coins className="w-5 h-5 text-yellow-500 animate-spin" style={{ animationDuration: '6s' }} />
          <div>
            <h3 className="text-white font-extrabold text-xs uppercase tracking-wider">The History of Money • Monetary Epochs</h3>
            <span className="text-[10px] font-mono text-zinc-500">FIVE MONUMENTAL SHIFTS IN HOW HUMANS MEASURED VALUE & TRUST OVER 5,000 YEARS</span>
          </div>
        </div>

        {/* Timeline top selector buttons */}
        <div className="relative flex flex-wrap gap-1.5 border-b border-white/5 pb-2">
          {MONEY_HISTORY.map((mh, idx) => (
            <button
              key={idx}
              onClick={() => setSelectedEra(idx)}
              className={`p-2 px-3 rounded-lg border font-mono text-[9px] uppercase tracking-wider transition-all cursor-pointer ${selectedEra === idx ? 'bg-yellow-500/10 border-yellow-400 text-yellow-400 font-bold scale-[1.01]' : 'border-white/5 bg-white/[0.005] hover:bg-white/5 text-zinc-500'}`}
            >
              {mh.era.split(' ')[0] || `Epoch ${idx+1}`}
            </button>
          ))}
        </div>

        {/* Era detail layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 bg-black/30 border border-white/5 p-6 rounded-2xl">
          <div className="lg:col-span-4 space-y-2">
            <span className="text-[9px] font-mono text-yellow-500 font-bold">{MONEY_HISTORY[selectedEra].era}</span>
            <h4 className="text-white font-black text-sm tracking-tight">{MONEY_HISTORY[selectedEra].title}</h4>
            <div className="h-0.5 w-12 bg-yellow-500/50 mt-1" />
          </div>

          <div className="lg:col-span-8 border-l border-white/5 pl-0 lg:pl-6 leading-relaxed flex flex-col justify-between">
            <p className="text-zinc-300 text-xs leading-relaxed">
              {MONEY_HISTORY[selectedEra].desc}
            </p>
            <div className="mt-4 p-3 bg-zinc-950 rounded-xl border border-white/5 text-[9.5px] font-mono tracking-wide">
              <span className="text-amber-400 font-bold uppercase block">Core Human Trust Pivot:</span>
              <span className="text-zinc-400 mt-0.5 block">{MONEY_HISTORY[selectedEra].highlight}</span>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
