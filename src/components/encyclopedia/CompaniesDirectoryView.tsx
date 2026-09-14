// /src/components/encyclopedia/CompaniesDirectoryView.tsx
import React, { useState, useMemo } from 'react';
import { 
  Building2, Search, Filter, Globe, Landmark, ChevronRight, 
  ArrowRight, Activity, Award, Cpu, ShieldCheck, Database, FileText
} from 'lucide-react';
import { getCompanyCatalog, companyCatalogCounts } from '../../lib/companyCatalog';

interface CompaniesDirectoryViewProps {
  selectFileNode: (fileName: string) => void;
}

interface Corporation {
  id: string;
  ticker: string;
  companyName: string;
  industry: string;
  sector: string;
  country: string;
  exchange: string;
  founded: string;
  founders: string[];
  ipoYear: string;
  marketCapRank: string;
  marketCap: string;
  products: string[];
  overview: string;
  history: string;
  educationalContext: string;
  keyMoves: string[];
}

// Comprehensive initial list simulating the global register of 60,000+ companies
const REGISTERED_CORPORATIONS: Corporation[] = [
  {
    id: 'aapl',
    ticker: 'AAPL',
    companyName: 'Apple Inc.',
    industry: 'Consumer Tech & Hardware Logic Platforms',
    sector: 'Technology',
    country: 'United States',
    exchange: 'NASDAQ',
    founded: '1976',
    founders: ['Steve Jobs', 'Steve Wozniak', 'Ronald Wayne'],
    ipoYear: '1980',
    marketCapRank: '#1 Globally',
    marketCap: '$3.2 Trillion',
    products: ['iPhones', 'MacBook computing arrays', 'iOS ecosystem core', 'App Store gatekeeping systems'],
    overview: 'Apple is the leading consumer technologies ecosystem provider, combining highly curated proprietary hardware with closed-loop software systems.',
    history: 'Starting in a garage in Palo Alto, Apple revolutionized human personal computing in the late 1970s, survived near-bankruptcy in the 1990s through Steve Jobs\' reinstatement, and launched the iPhone in 2007, redefining cellular connectivity.',
    educationalContext: 'Apple serves as the classic study of "network effects" and customer switching costs. By linking hardware products to private operating system accounts, they capture consistent high-margin software revenues.',
    keyMoves: ['Consumer spending levels', 'Silicon chip supply chains in East Asia', 'China assembly hubs productivity', 'Sovereign anti-trust fees']
  },
  {
    id: 'tsla',
    ticker: 'TSLA',
    companyName: 'Tesla, Inc.',
    industry: 'Autonomic Electric Motion & Renewable Grids',
    sector: 'Automotive',
    country: 'United States',
    exchange: 'NASDAQ',
    founded: '2003',
    founders: ['Martin Eberhard', 'Marc Tarpenning', 'Elon Musk (early investor)'],
    ipoYear: '2010',
    marketCapRank: '#8 Globally',
    marketCap: '$950 Billion',
    products: ['Model Y/3/S/X electric motors', 'Industrial power Megapacks', 'Full Self-Driving neural path software', 'Optimus Humanoid Robotics'],
    overview: 'Tesla designs electric passenger transport, battery storage architecture, solar collectors, and computational vision-based AI robotics.',
    history: 'Founded to prove electric vehicles could exceed combustion standards, Tesla grew exponentially under Elon Musk, scaling production in Nevada, Shanghai, Berlin, and Texas to lead the global EV transition.',
    educationalContext: 'Tesla exemplifies the convergence of hardware, chemical commodities (lithium, cobalt, nickel), and artificial intelligence (kinematic model pathing and data pipelines).',
    keyMoves: ['National interest rates', 'Global lithium carbonate pricing', 'Sovereign EV assembly credit subsidies', 'CEO-related news feeds']
  },
  {
    id: 'nvda',
    ticker: 'NVDA',
    companyName: 'NVIDIA Corporation',
    industry: 'Accelerated Computational Processing Solutions',
    sector: 'Semiconductors',
    country: 'United States',
    exchange: 'NASDAQ',
    founded: '1993',
    founders: ['Jensen Huang', 'Chris Malachowsky', 'Curtis Priem'],
    ipoYear: '1999',
    marketCapRank: '#2 Globally',
    marketCap: '$3.0 Trillion',
    products: ['H100/H200 Tensor-Core GPUs', 'Blackwell Supercomputer systems', 'CUDA programming software', 'GeForce Graphic architectures'],
    overview: 'NVIDIA is the pioneer of GPU computing, creating the absolute logical foundation for neural network training and advanced Artificial Intelligence grids.',
    history: 'Established originally to process real-time 3D gaming graphics, NVIDIA found their parallel processing chips were highly adapted for deep learning algorithms, allowing them to capture a virtual monopoly in modern compute farms.',
    educationalContext: 'NVIDIA demonstrates the extreme leverage of software ecosystems (CUDA) over physical chips. Competitors cannot easily displace the hardware because developers are integrated into NVIDIA software compilers.',
    keyMoves: ['Hyperscaler capital budgets', 'East-Asia maritime logistics routes', 'Taiwan semiconductor foundry outputs', 'Strategic compute hardware export bans']
  },
  {
    id: 'msft',
    ticker: 'MSFT',
    companyName: 'Microsoft Corporation',
    industry: 'Enterprise Software & Cloud Virtual Assets',
    sector: 'Technology',
    country: 'United States',
    exchange: 'NASDAQ',
    founded: '1975',
    founders: ['Bill Gates', 'Paul Allen'],
    ipoYear: '1986',
    marketCapRank: '#3 Globally',
    marketCap: '$3.1 Trillion',
    products: ['Azure Cloud Services', 'Windows OS layers', 'Office Productivity Suite', 'OpenAI application integrations'],
    overview: 'Microsoft is a global powerhouse spanning enterprise cloud networks, computer operating platforms, enterprise softwares, and gaming systems.',
    history: 'Microsoft dominated personal computer operating software in the 1980s and 1990s. Under Satya Nadella (appointed 2014), the company successfully shifted to cloud computing (Azure) and secured a monumental partnership with OpenAI.',
    educationalContext: 'Microsoft represents the "multi-tenant enterprise lock-in" case study. Their business products are deeply woven within global corporate workflows, giving them unmatched pricing power.',
    keyMoves: ['Enterprise IT capital spend', 'Azure cloud customer inflow indices', 'AI productivity tool adoption rates', 'Global commercial office health']
  },
  {
    id: 'amzn',
    ticker: 'AMZN',
    companyName: 'Amazon.com, Inc.',
    industry: 'Logistics Distribution & Hyperscaled Cloud Arrays',
    sector: 'Consumer Discretionary',
    country: 'United States',
    exchange: 'NASDAQ',
    founded: '1994',
    founders: ['Jeff Bezos'],
    ipoYear: '1997',
    marketCapRank: '#5 Globally',
    marketCap: '$1.9 Trillion',
    products: ['AWS Cloud infrastructure', 'Amazon retail distribution pipeline', 'Prime subscription systems', 'Digital advertising spaces'],
    overview: 'Amazon is a global titan in digital retail logistics and cloud infrastructure hosting (AWS).',
    history: 'Starting as an online bookstore, Amazon pioneered commercial web infrastructure, reinvested early operating margins to build delivery hubs, and established Amazon Web Services (AWS) in 2006 to host the modern internet.',
    educationalContext: 'Amazon teaches "economies of scale" and capital-intensive barriers to entry. No rival can easily build a logistics system matching theirs without investing hundreds of billions.',
    keyMoves: ['Core consumer confidence index', 'Commercial energy grid pricing', 'AWS cloud adoption indices', 'Diesel and transport fuel prices']
  },
  {
    id: 'asml',
    ticker: 'ASML',
    companyName: 'ASML Holding N.V.',
    industry: 'Extreme Ultraviolet Micro-Lithography Platforms',
    sector: 'Semiconductors',
    country: 'Netherlands',
    exchange: 'EURONEXT',
    founded: '1984',
    founders: ['Philips (co-founder)', 'ASM International (co-founder)'],
    ipoYear: '1995',
    marketCapRank: '#12 Globally',
    marketCap: '$410 Billion',
    products: ['EUV Photolithography machines', 'DUV Laser systems', 'Yieldstar metrology tools'],
    overview: 'ASML holds a absolute global monopoly on extreme ultraviolet projection technology required to print microprocessors below 5 nanometers.',
    history: 'Born as an experimental joint venture, ASML weathered decades of capital-intensive engineering research to solve light refraction limitations, eventually mastering EUV technology and blocking any competitors.',
    educationalContext: 'ASML represents a "bottleneck monopoly." The entire global digitization roadmap hinges entirely on ASML delivering and maintaining less than 100 high-end machines every year.',
    keyMoves: ['Global semiconductor wafer demand', 'ASML export safety permit licenses', 'Sovereign fab sub-construction programs', 'EUV mirror production bottlenecks']
  },
  {
    id: 'tsm',
    ticker: 'TSM',
    companyName: 'Taiwan Semiconductor Manufacturing Co.',
    industry: 'Extreme Precision Contract Silicon Cleanrooms',
    sector: 'Semiconductors',
    country: 'Taiwan',
    exchange: 'NYSE / SIX',
    founded: '1987',
    founders: ['Morris Chang'],
    ipoYear: '1997',
    marketCapRank: '#6 Globally',
    marketCap: '$940 Billion',
    products: ['Sub-3nm logic silicon wafers', 'Advanced CoWoS 2.5D physical packaging', 'Embedded microelectronic designs'],
    overview: 'TSMC is the worlds premier contract semiconductor foundry, manufacturing the majority of advanced chips designed globally.',
    history: 'Founded by Morris Chang in Hsinchu Science Park, TSMC invented the purecontract foundry model, freeing designers from building expensive foundries and concentrating advanced fabrication expertise in Taiwan.',
    educationalContext: 'TSMC represents "operational mastery." Operating global cleanrooms with sub-nanometer tolerances is incredibly complex, creating a insurmountable barrier of physical manufacturing wisdom.',
    keyMoves: ['Global consumer computer demand', 'South China Sea geopolitical drills', 'Extreme electrical power reserves in Taiwan', 'International lithography equipment imports']
  },
  {
    id: 'jpm',
    ticker: 'JPM',
    companyName: 'JPMorgan Chase & Co.',
    industry: 'Systemic Clearing Banks & Financial Asset Clearing',
    sector: 'Financials',
    country: 'United States',
    exchange: 'NYSE',
    founded: '1799 (Predecessors)',
    founders: ['John Pierpont Morgan', 'Aaron Burr'],
    ipoYear: '1969',
    marketCapRank: '#15 Globally',
    marketCap: '$600 Billion',
    products: ['Investment Banking services', 'Global Payment clearing networks', 'Corporate Commercial loans', 'Private Banking reserves'],
    overview: 'JPMorgan Chase is the largest bank in the Western world, serving as a critical deposit anchor and custodian of liquid capital.',
    history: 'Evolving through monumental mergers (including Chase Manhattan, Chemical Bank, and Bank One), JPM became the primary stabilizer of global finance, stepping in during historical crises (1907, 2008, 2023 bank runs).',
    educationalContext: 'JPMorgan Chase is a study in "scale-driven risk management." They maintain a highly protected balance sheet that allows them to acquire distressed rivals during economic downturns, expanding their footprint.',
    keyMoves: ['Federal Reserve discount rates', 'Net Interest Margin (NIM) yields', 'Commercial loan defaults indices', 'Capital treasury reserves requirements']
  },
  {
    id: 'xom',
    ticker: 'XOM',
    companyName: 'Exxon Mobil Corporation',
    industry: 'Petrochemical Extraction & Global Refiner Matrix',
    sector: 'Energy',
    country: 'United States',
    exchange: 'NYSE',
    founded: '1882 (Standard Oil)',
    founders: ['John D. Rockefeller'],
    ipoYear: '1920',
    marketCapRank: '#18 Globally',
    marketCap: '$520 Billion',
    products: ['Refined petroleum combustibles', 'Liquid Natural Gas exports', 'Industrial synthetic plastics', 'Lubricating chemical feedstocks'],
    overview: 'ExxonMobil is an international oil and gas conglomerate engaged in drilling, refining, shipping, and chemical fabrication of petrochemical assets.',
    history: 'Descended directly from John D. Rockefeller\'s Standard Oil Trust (broken up in 1911), Exxon and Mobil merged in 1999 to re-establish the largest Western oil giant, adapting to deepsea drilling and shale extraction.',
    educationalContext: 'ExxonMobil shows the direct connection between real geology, global geopolitics, and inflationary pricing indices.',
    keyMoves: ['Crude Oil benchmark indices (Brent/WTI)', 'OPEC+ extraction target policies', 'National oil supply drilling licenses', 'Environmental decarbonization penalties']
  },
  {
    id: 'brk',
    ticker: 'BRK.A',
    companyName: 'Berkshire Hathaway Inc.',
    industry: 'Multi-Sector Corporate Asset Allocations',
    sector: 'Financials',
    country: 'United States',
    exchange: 'NYSE',
    founded: '1839 (As textile mill)',
    founders: ['Oliver Chace', 'Warren Buffett (reorganized 1965)'],
    ipoYear: '1965',
    marketCapRank: '#7 Globally',
    marketCap: '$980 Billion',
    products: ['Insurance float systems (GEICO)', 'BNSF Railroad transit', 'Berkshire Energy systems', 'Massive equity portfolio blocks'],
    overview: 'Berkshire Hathaway is a diversified holding company acquiring entire businesses and major equity positions, led for decades by Warren Buffett.',
    history: 'Originally a dying New England textile mill, Berkshire was acquired by Warren Buffett in 1965. He redirected the cash flows to purchase high-quality insurance companies, using their premium "float" to acquire compounding cash cow corporations.',
    educationalContext: 'Berkshire demonstrates the "capital allocation engine" model. By investing insurance premiums that don\'t carry interest into active businesses, they generate unmatched long-term compound growth.',
    keyMoves: ['Equity market valuations index', 'Insurance premium loss ratios', 'US consumer spending levels', 'Capital cash interest returns']
  },
  {
    id: 'lly',
    ticker: 'LLY',
    companyName: 'Eli Lilly and Company',
    industry: 'Bio-Molecular Synthesis & Endocrine Therapeutics',
    sector: 'Healthcare',
    country: 'United States',
    exchange: 'NYSE',
    founded: '1876',
    founders: ['Col. Eli Lilly'],
    ipoYear: '1952',
    marketCapRank: '#9 Globally',
    marketCap: '$840 Billion',
    products: ['Mounjaro peptide therapies', 'Zepbound weight regulators', 'Humalog synthetic insulins', 'Jardiance cardiovascular solutions'],
    overview: 'Eli Lilly discovers, manufactures, and distributes breakthrough clinical pharmaceuticals globally, particularly in endocrinology and oncology.',
    history: 'The first company to mass-produce insulin in the 1920s, Lilly has been a pioneer in metabolic health. They transitioned to modern synthetic biotechnology, launching revolutionary GLP-1 agonists that surged their market value in the 2020s.',
    educationalContext: 'Eli Lilly is the ultimate study of "pharmaceutical patent moats" and biological pipeline scale. Developing drug therapies requires a decade of clinical trials, making successful patents highly lucrative.',
    keyMoves: ['Sovereign health insurance drug coverage', 'Clinical peptide factory throughputs', 'Patent protection timeline maturities', 'Global obesity therapy demand trends']
  },
  {
    id: 'nvo',
    ticker: 'NVO',
    companyName: 'Novo Nordisk A/S',
    industry: 'Peptide Biomaterials & Diabetes Interventions',
    sector: 'Healthcare',
    country: 'Denmark',
    exchange: 'EURONEXT',
    founded: '1923',
    founders: ['August Krogh', 'Marie Krogh', 'Hans Christian Hagedorn'],
    ipoYear: '1974',
    marketCapRank: '#10 Globally',
    marketCap: '$580 Billion',
    products: ['Ozempic diabetes peptide vectors', 'Wegovy weight-loss injection kits', 'Victoza diabetic controllers', 'Insuman delivery pens'],
    overview: 'Novo Nordisk is a global healthcare giant leading diabetic care and chronic endocrine disease solutions using biochemical peptide engineering.',
    history: 'Created in Denmark to deliver newly discovered insulin therapies to Europe, Novo Nordisk spent its entire existence refining protein extraction and delivery, resulting in the groundbreaking discovery of GLP-1 weight regulators.',
    educationalContext: 'Novo Nordisk displays "geographical corporate scaling." Their corporate market cap grew to exceed the entire annual GDP of Denmark, illustrating how specialized global firms interact with local host economies.',
    keyMoves: ['EU manufacturing regulatory approvals', 'Weight-loss therapy competition', 'Raw biologic compound supply chains', 'Global healthcare pricing limits']
  }
];

// Interactive mock to reach the "60,000+ corporations" directory feel
const SIMULATED_EXCHANGE_INDEX = [
  { name: "NASDAQ", country: "United States", listed: "3,554" },
  { name: "NYSE", country: "United States", listed: "2,400" },
  { name: "LSE (London)", country: "United Kingdom", listed: "1,950" },
  { name: "EURONEXT", country: "Europe", listed: "1,530" },
  { name: "JPX (Tokyo)", country: "Japan", listed: "3,890" },
  { name: "SSE (Shanghai)", country: "China", listed: "2,208" },
  { name: "ASX (Sydney)", country: "Australia", listed: "2,192" },
  { name: "HKEX", country: "Hong Kong", listed: "2,600" },
  { name: "TSX (Toronto)", country: "Canada", listed: "1,601" },
  { name: "ADX (Abu Dhabi)", country: "UAE", listed: "155" },
  { name: "NSE (Mumbai)", country: "India", listed: "1,920" },
  { name: "B3 (São Paulo)", country: "Brazil", listed: "450" }
];

export default function CompaniesDirectoryView({ selectFileNode }: CompaniesDirectoryViewProps) {
  const [search, setSearch] = useState('');
  const [selectedSector, setSelectedSector] = useState<string>('ALL');
  const [selectedCountry, setSelectedCountry] = useState<string>('ALL');
  const [activeLetter, setActiveLetter] = useState<string>('ALL');
  const [selectedCorp, setSelectedCorp] = useState<Corporation | null>(REGISTERED_CORPORATIONS[0]);
  const [catalogQuery, setCatalogQuery] = useState('');
  const [catalogPage, setCatalogPage] = useState(0);
  const catalog = useMemo(() => getCompanyCatalog(), []);
  const catalogTotals = useMemo(() => companyCatalogCounts(), []);
  const PAGE = 40;

  // Available filters
  const sectors = useMemo(() => {
    const list = new Set(REGISTERED_CORPORATIONS.map(c => c.sector));
    return ['ALL', ...Array.from(list)];
  }, []);

  const countries = useMemo(() => {
    const list = new Set(REGISTERED_CORPORATIONS.map(c => c.country));
    return ['ALL', ...Array.from(list)];
  }, []);

  // Filter corporations list
  const filteredCorporations = useMemo(() => {
    return REGISTERED_CORPORATIONS.filter(corp => {
      const matchSearch = corp.companyName.toLowerCase().includes(search.toLowerCase()) || 
                          corp.ticker.toLowerCase().includes(search.toLowerCase()) ||
                          corp.industry.toLowerCase().includes(search.toLowerCase());
      
      const matchSector = selectedSector === 'ALL' || corp.sector === selectedSector;
      const matchCountry = selectedCountry === 'ALL' || corp.country === selectedCountry;
      const matchLetter = activeLetter === 'ALL' || corp.companyName.toUpperCase().startsWith(activeLetter);

      return matchSearch && matchSector && matchCountry && matchLetter;
    });
  }, [search, selectedSector, selectedCountry, activeLetter]);

  const catalogHits = useMemo(() => {
    const q = catalogQuery.trim().toLowerCase();
    if (!q) return catalog;
    return catalog.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.ticker || '').toLowerCase().includes(q) ||
        (c.parentTicker || '').toLowerCase().includes(q) ||
        (c.unitLabel || '').toLowerCase().includes(q),
    );
  }, [catalog, catalogQuery]);
  const catalogPageCount = Math.max(1, Math.ceil(catalogHits.length / PAGE));
  const safePage = Math.min(catalogPage, catalogPageCount - 1);
  const pageRows = catalogHits.slice(safePage * PAGE, safePage * PAGE + PAGE);

  return (
    <div className="companies-directory-layout flex flex-col gap-6 animate-fadeIn min-h-screen text-white text-left selection:bg-cyan-500/30">
      
      {/* HEADER HERO AREA */}
      <div className="p-6 md:p-8 bg-gradient-to-br from-[#020510] via-black/90 to-neutral-500/5 border border-cyan-500/25 rounded-3xl relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none select-none">
          <Building2 className="w-64 h-64 text-[#00D9FF]" />
        </div>
        
        <div className="space-y-3.5">
          <span className="font-mono text-xs sm:text-sm uppercase tracking-[0.25em] text-[#00D9FF] font-black block">
            MASTER CORPORATE ARCHIVE // CIVILIZATION LEVEL CAPITAL REGISTER
          </span>
          <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tight text-white font-sans">
            Global Corporations Directory
          </h1>
          <p className="text-zinc-300 text-sm sm:text-base max-w-4xl leading-relaxed">
            The Library of Alexandria for corporate blueprints. This sector acts as a searchable matrix cataloging 
            more than <strong className="text-[#00D9FF] font-bold">{catalogTotals.total.toLocaleString()} educational listings</strong>
            {' '}({catalogTotals.publicIssuers.toLocaleString()} public issuers on stock profiles, {catalogTotals.subsidiaries.toLocaleString()} subsidiary study pages).
            Not a live filing database.
          </p>
        </div>

        {/* METRICS ROW */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-8 pt-8 border-t border-white/10 font-mono text-xs sm:text-sm">
          <div className="p-4 bg-white/[0.02] border border-white/10 rounded-2xl">
            <span className="text-zinc-400 block uppercase text-[10px] sm:text-xs tracking-wider">Catalog Entries</span>
            <span className="text-white font-black text-sm sm:text-base mt-1.5 block">{catalogTotals.total.toLocaleString()} listings</span>
          </div>
          <div className="p-4 bg-white/[0.02] border border-white/10 rounded-2xl">
            <span className="text-zinc-400 block uppercase text-[10px] sm:text-xs tracking-wider">Public issuers</span>
            <span className="text-white font-black text-sm sm:text-base mt-1.5 block">{catalogTotals.publicIssuers.toLocaleString()} on /stocks</span>
          </div>
          <div className="p-4 bg-white/[0.02] border border-white/10 rounded-2xl">
            <span className="text-zinc-400 block uppercase text-[10px] sm:text-xs tracking-wider">Study pages</span>
            <span className="text-[#00D9FF] font-black text-sm sm:text-base mt-1.5 block">{catalogTotals.subsidiaries.toLocaleString()} crawlable</span>
          </div>
          <div className="p-4 bg-white/[0.02] border border-white/10 rounded-2xl">
            <span className="text-zinc-400 block uppercase text-[10px] sm:text-xs tracking-wider">Data Source Toggles</span>
            <span className="text-purple-400 font-black text-sm sm:text-base mt-1.5 block">Educational directory</span>
          </div>
        </div>
      </div>

      {/* FILTER CONTROLS & BROWSER */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* LEFT COLUMN: SEACH & DIRECTORY LIST (7/12) */}
        <div className="lg:col-span-7 bg-[#030612]/98 border border-white/15 rounded-3xl p-6 flex flex-col gap-6 relative">
          
          {/* SEARCH DECK */}
          <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-3.5 w-5 h-5 text-zinc-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Query Intel, Tesla, ASML, Founders, Sectors..."
                className="w-full bg-[#050916] border border-white/15 focus:border-[#00D9FF] rounded-xl py-3 pl-12 pr-10 text-sm text-white placeholder-zinc-500 font-medium focus:outline-none focus:ring-1 focus:ring-[#00D9FF] transition-all"
              />
              {search && (
                <button onClick={() => setSearch('')} className="absolute right-4 top-3.5 text-zinc-400 hover:text-white text-sm">✕</button>
              )}
            </div>

            {/* SECTOR SELECT */}
            <div className="relative shrink-0">
              <select
                value={selectedSector}
                onChange={(e) => setSelectedSector(e.target.value)}
                className="w-full sm:w-auto bg-[#050916] border border-white/15 focus:border-[#00D9FF] rounded-xl py-3 pl-4 pr-10 text-sm text-white uppercase font-mono font-bold appearance-none cursor-pointer focus:outline-none"
              >
                <option value="ALL">SECTORS (ALL)</option>
                {sectors.filter(s => s !== 'ALL').map(sec => (
                  <option key={sec} value={sec}>{sec.toUpperCase()}</option>
                ))}
              </select>
              <Filter className="absolute right-4 top-4 w-4 h-4 text-zinc-400 pointer-events-none" />
            </div>
          </div>

          {/* ALPHABETICAL A-Z STRIP */}
          <div className="flex flex-wrap items-center gap-2 pb-3 border-b border-white/10">
            <button
              onClick={() => setActiveLetter('ALL')}
              className={`px-3 py-1.5 rounded font-mono text-xs font-black tracking-wider cursor-pointer transition-all ${
                activeLetter === 'ALL' 
                  ? 'bg-[#00D9FF] text-black shadow-[0_0_12px_rgba(0,217,255,0.5)]' 
                  : 'bg-white/5 text-zinc-300 hover:self-start hover:text-white hover:bg-white/10'
              }`}
            >
              ALL
            </button>
            {Array.from('ABCDEFGHIJKLMNOPQRSTUVWXYZ').map(l => (
              <button
                key={l}
                onClick={() => setActiveLetter(l)}
                className={`w-6.5 h-6.5 rounded flex items-center justify-center font-mono text-xs font-black cursor-pointer transition-all ${
                  activeLetter === l 
                    ? 'bg-[#00D9FF] text-black shadow-[0_0_12px_rgba(0,217,255,0.5)]' 
                    : 'bg-white/5 text-zinc-300 hover:text-white hover:bg-white/10'
                }`}
              >
                {l}
              </button>
            ))}
          </div>

          {/* ACTIVE COUNT INDICATOR - HIGH CONTRAST DOMINANT FLUORESCENT PINK AS REQUESTED */}
          <div className="flex items-center justify-between font-mono text-xs sm:text-sm text-[#FF00C8] font-black tracking-wider bg-[#FF00C8]/5 p-3.5 rounded-2xl border border-[#FF00C8]/20 shadow-[0_0_20px_rgba(255,0,200,0.06)]">
            <span>SHOWING {filteredCorporations.length} SECURE RECORDS // CHANNELS LIVE</span>
            <span className="text-emerald-400 font-black animate-pulse flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" /> DATABASE ONLINE
            </span>
          </div>

          {/* CORE DIRECTORY LIST CONTROLS SCROLLBAR */}
          <div className="flex-1 overflow-y-auto max-h-[580px] pr-2 custom-scrollbar flex flex-col gap-3 min-h-[400px]">
            {filteredCorporations.length === 0 ? (
              <div className="p-10 text-center border border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center gap-3">
                <Database className="w-10 h-10 text-zinc-500 animate-bounce" />
                <span className="font-mono text-sm text-zinc-400 uppercase">Search mismatch in current quadrant</span>
                <p className="text-zinc-550 text-xs">No active corporate registries match your filter parameters.</p>
              </div>
            ) : (
              filteredCorporations.map((corp) => {
                const isSelected = selectedCorp?.id === corp.id;
                return (
                  <div
                    key={corp.id}
                    onClick={() => setSelectedCorp(corp)}
                    className={`p-5 rounded-2xl border transition-all duration-300 cursor-pointer relative overflow-hidden flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 ${
                      isSelected 
                        ? 'bg-gradient-to-r from-cyan-950/50 via-cyan-900/15 to-transparent border-cyan-400/60 shadow-[0_4px_25px_rgba(0,217,255,0.1)]' 
                        : 'bg-black/40 border-white/5 hover:bg-neutral-900/50 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-start gap-4 min-w-0">
                      {/* Company logo mock index */}
                      <div className="w-11 h-11 rounded-xl bg-neutral-950 border border-white/10 flex items-center justify-center shrink-0">
                        <span className="font-mono text-sm text-zinc-300 font-extrabold">{corp.ticker.slice(0, 2)}</span>
                      </div>

                      <div className="flex flex-col min-w-0 leading-relaxed">
                        <div className="flex items-center gap-3.5 flex-wrap">
                          <h4 className={`font-sans font-black text-base sm:text-lg uppercase truncate ${isSelected ? 'text-[#00D9FF]' : 'text-white'}`}>
                            {corp.companyName}
                          </h4>
                          <span className="px-2 py-0.5 bg-white/10 border border-white/15 rounded text-xs font-mono text-zinc-300 font-bold">
                            {corp.ticker}
                          </span>
                        </div>
                        <span className="text-xs sm:text-sm text-zinc-300 mt-1.5 truncate font-semibold font-sans">{corp.industry}</span>
                        
                        <div className="flex items-center gap-4 mt-2.5 text-xs text-zinc-400 font-mono">
                          <span>FOUNDATION: {corp.founded}</span>
                          <span>IPO: {corp.ipoYear}</span>
                          <span className="text-[#00D9FF]/90 font-bold">{corp.country}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 self-stretch sm:self-auto justify-end pt-3 sm:pt-0 border-t sm:border-t-0 border-white/10 shrink-0">
                      <div className="flex flex-col items-end leading-none">
                        <span className="font-mono text-xs sm:text-sm text-white font-extrabold">DATA UNAVAILABLE</span>
                        <span className="font-mono text-[9px] sm:text-[10px] text-zinc-400 uppercase mt-1">Educational listing</span>
                      </div>
                      <ChevronRight className={`w-5 h-5 transition-transform ${isSelected ? 'text-cyan-400 translate-x-1.5' : 'text-zinc-500'}`} />
                    </div>
                  </div>
                );
              })
            )}

            {/* FULL EDUCATIONAL CATALOG (paginated — do not mount 60k DOM nodes) */}
            <div className="p-5 rounded-2xl border border-white/15 bg-white/[0.02] flex flex-col gap-3.5 font-mono leading-relaxed">
              <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
                <span className="text-zinc-200 font-bold text-xs uppercase">Full educational catalog</span>
                <span className="text-zinc-500 text-[9px]">{catalogHits.length.toLocaleString()} matches</span>
              </div>
              <input
                type="text"
                value={catalogQuery}
                onChange={(e) => {
                  setCatalogQuery(e.target.value);
                  setCatalogPage(0);
                }}
                placeholder="Search all issuers and study nodes…"
                className="w-full bg-[#050916] border border-white/15 rounded-xl py-2 px-3 text-xs text-white placeholder-zinc-500"
              />
              <ul className="flex flex-col gap-1 max-h-[240px] overflow-y-auto">
                {pageRows.map((row) => (
                  <li key={row.slug}>
                    <button
                      type="button"
                      onClick={() => {
                        if (row.status === 'Public' && row.ticker) {
                          const t = row.ticker.toLowerCase();
                          selectFileNode(
                            `encyclopedia/stocks/${t === 'aapl' ? 'apple' : t === 'tsla' ? 'tesla' : t === 'nvda' ? 'nvidia' : t === 'msft' ? 'microsoft' : t === 'amzn' ? 'amazon' : t}.html`,
                          );
                        } else {
                          selectFileNode(`encyclopedia/companies/${row.slug}.html`);
                        }
                      }}
                      className="w-full text-left px-2 py-1.5 rounded hover:bg-white/10 text-xs text-zinc-200"
                    >
                      <span className="text-white font-bold">{row.name}</span>
                      <span className="text-zinc-500"> · {row.status}{row.ticker ? ` ${row.ticker}` : ''}{row.parentTicker ? ` / ${row.parentTicker}` : ''}</span>
                    </button>
                  </li>
                ))}
              </ul>
              <div className="flex items-center justify-between text-[10px] text-zinc-400">
                <button
                  type="button"
                  disabled={safePage <= 0}
                  onClick={() => setCatalogPage((p) => Math.max(0, p - 1))}
                  className="px-2 py-1 border border-white/15 rounded disabled:opacity-40"
                >
                  Prev
                </button>
                <span>
                  Page {safePage + 1} / {catalogPageCount}
                </span>
                <button
                  type="button"
                  disabled={safePage >= catalogPageCount - 1}
                  onClick={() => setCatalogPage((p) => p + 1)}
                  className="px-2 py-1 border border-white/15 rounded disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: ACTIVE DETAILED PROFILE VIEW (5/12) */}
        <div className="lg:col-span-5 flex flex-col gap-5">
          
          {selectedCorp ? (
            <div className="bg-gradient-to-br from-[#040816]/98 to-neutral-950 border border-white/15 rounded-3xl p-6 flex flex-col gap-6 text-left relative overflow-hidden shadow-2xl h-full justify-between">
              
              <div className="space-y-5">
                {/* Micro header indicators */}
                <div className="flex items-center justify-between border-b border-white/10 pb-3.5">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 bg-[#00D9FF] rounded-full animate-ping" />
                    <span className="font-mono text-xs text-[#00D9FF] font-black uppercase tracking-[0.15em]">CORE DEEP ARCHIVE BLUEPRINT</span>
                  </div>
                  <span className="font-mono text-xs text-zinc-400 font-black">EXCHANGE: {selectedCorp.exchange}</span>
                </div>

                {/* Company title header */}
                <div className="flex flex-col gap-2">
                  <div className="flex items-baseline gap-3 flex-wrap">
                    <h2 className="text-white text-2xl lg:text-3xl font-black uppercase tracking-tight font-sans leading-none">
                      {selectedCorp.companyName}
                    </h2>
                    <span className="px-2.5 py-1 bg-cyan-400/10 text-cyan-400 border border-cyan-400/25 font-mono text-xs font-black rounded-md">
                      {selectedCorp.ticker}
                    </span>
                  </div>

                  <span className="font-mono text-sm text-purple-400 font-bold block">
                    {selectedCorp.industry}
                  </span>
                </div>

                {/* Grid stats */}
                <div className="grid grid-cols-2 gap-4 font-mono text-xs sm:text-sm bg-black/40 p-4 rounded-xl border border-white/10">
                  <div>
                    <span className="text-zinc-450 block text-[9px] sm:text-[10px] uppercase">Market Cap Tier</span>
                    <span className="text-white font-black mt-1 block text-sm sm:text-base">DATA UNAVAILABLE</span>
                  </div>
                  <div>
                    <span className="text-zinc-450 block text-[9px] sm:text-[10px] uppercase">Cap Position</span>
                    <span className="text-cyan-400 font-black mt-1 block text-sm sm:text-base">Educational listing</span>
                  </div>
                  <div className="pt-2.5 border-t border-white/10">
                    <span className="text-zinc-450 block text-[9px] sm:text-[10px] uppercase">Founded Year</span>
                    <span className="text-zinc-200 font-bold mt-1 block text-sm">{selectedCorp.founded}</span>
                  </div>
                  <div className="pt-2.5 border-t border-white/10">
                    <span className="text-zinc-450 block text-[9px] sm:text-[10px] uppercase">IPO System Date</span>
                    <span className="text-zinc-200 font-bold mt-1 block text-sm">{selectedCorp.ipoYear}</span>
                  </div>
                </div>

                {/* Scrolling Details - ensuring clean scrollbar for deep informational panels */}
                <div className="overflow-y-auto max-h-[340px] pr-2 custom-scrollbar flex flex-col gap-5 text-sm font-sans">
                  
                  {/* Founders block */}
                  <div className="space-y-2 bg-white/[0.015] p-4 border border-white/10 rounded-xl leading-relaxed">
                    <span className="text-xs uppercase font-mono tracking-wider text-zinc-400 font-extrabold flex items-center gap-2">
                      <Award className="w-4 h-4 text-[#00D9FF]" /> Founders Base
                    </span>
                    <p className="text-zinc-200 text-sm font-bold font-sans">
                      {selectedCorp.founders.join(', ')}
                    </p>
                  </div>

                  {/* Company Overview */}
                  <div className="space-y-2 bg-white/[0.015] p-4 border border-white/10 rounded-xl leading-relaxed">
                    <span className="text-xs uppercase font-mono tracking-wider text-zinc-400 font-extrabold block">Company Overview</span>
                    <p className="text-zinc-300 text-sm leading-relaxed font-sans">{selectedCorp.overview}</p>
                  </div>

                  {/* History */}
                  <div className="space-y-2 bg-white/[0.015] p-4 border border-white/10 rounded-xl leading-relaxed">
                    <span className="text-xs uppercase font-mono tracking-wider text-zinc-400 font-extrabold block">Historical Background</span>
                    <p className="text-zinc-300 text-sm leading-relaxed font-sans">{selectedCorp.history}</p>
                  </div>

                  {/* Educational Context */}
                  <div className="space-y-2 bg-white/[0.015] p-4 border border-[#00D9FF]/20 rounded-xl leading-relaxed shadow-[0_0_15px_rgba(0,217,255,0.02)]">
                    <span className="text-xs uppercase font-mono tracking-wider text-cyan-400 font-extrabold block">Educational Syllabus Case Study</span>
                    <p className="text-zinc-200 text-sm leading-relaxed font-sans font-medium">{selectedCorp.educationalContext}</p>
                  </div>

                  {/* Products */}
                  <div className="space-y-2 bg-white/[0.015] p-4 border border-white/10 rounded-xl leading-relaxed">
                    <span className="text-xs uppercase font-mono tracking-wider text-purple-400 font-extrabold block mb-1.5">Key Corporate Outputs</span>
                    <div className="flex flex-wrap gap-2">
                      {selectedCorp.products.map((p, idx) => (
                        <span key={idx} className="bg-white/10 border border-white/15 px-3 py-1 rounded text-xs text-zinc-200 uppercase font-mono font-semibold">
                          {p}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Market Drivers */}
                  <div className="space-y-2 bg-white/[0.015] p-4 border border-white/10 rounded-xl leading-relaxed">
                    <span className="text-xs uppercase font-mono tracking-wider text-[#FF00C8] font-extrabold block mb-1.5">Valuation Transmission Channels</span>
                    <ul className="list-disc pl-5 text-zinc-300 text-sm flex flex-col gap-2 font-sans">
                      {selectedCorp.keyMoves.map((m, idx) => (
                        <li key={idx}>{m}</li>
                      ))}
                    </ul>
                  </div>

                </div>
              </div>

              {/* Action buttons redirects */}
              <div className="pt-4 border-t border-white/10 flex gap-3 mt-4">
                <button
                  onClick={() => selectFileNode(`encyclopedia/stocks/${selectedCorp.id === 'aapl' ? 'apple' : selectedCorp.id === 'tsla' ? 'tesla' : selectedCorp.id === 'nvda' ? 'nvidia' : selectedCorp.id === 'msft' ? 'microsoft' : selectedCorp.id === 'amzn' ? 'amazon' : selectedCorp.id}.html`)}
                  className="flex-1 py-3 bg-gradient-to-r from-[#00D9FF] to-blue-600 hover:opacity-90 text-black font-black font-mono text-xs sm:text-sm uppercase tracking-wider rounded-xl cursor-pointer transition-all active:scale-[0.98] shadow-[0_4px_20px_rgba(0,217,255,0.25)] text-center flex items-center justify-center gap-2"
                >
                  LAUNCH PROFILE ENVIRONMENT <ArrowRight className="w-4 h-4 stroke-[3px]" />
                </button>
              </div>

            </div>
          ) : (
            <div className="bg-[#040816]/98 border border-white/15 rounded-3xl p-6 flex flex-col justify-center items-center gap-3.5 text-center h-full min-h-[400px]">
              <Building2 className="w-14 h-14 text-zinc-650 animate-pulse" />
              <span className="font-mono text-xs sm:text-sm text-zinc-400 uppercase tracking-widest">Select registered corporation</span>
              <p className="text-zinc-500 text-xs max-w-xs leading-relaxed">Click any corporate record on the register left panel to inspect blueprints data.</p>
            </div>
          )}

        </div>

      </div>

      {/* FOOTER MATRIX INDEX: exchanges listed stats */}
      <div className="p-6 bg-black/60 border border-white/10 rounded-3xl">
        <h3 className="font-mono text-[#00D9FF] text-xs sm:text-sm font-black uppercase tracking-widest mb-4">
          CONNECTED EXCHANGES INTEGRATION
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {SIMULATED_EXCHANGE_INDEX.map((exc) => (
            <div key={exc.name} className="p-4 bg-[#02050c] border border-white/10 rounded-xl hover:border-cyan-500/30 transition-all font-mono leading-relaxed">
              <span className="text-zinc-400 text-[10px] block uppercase">{exc.country}</span>
              <span className="text-white font-black text-sm block mt-1">{exc.name}</span>
              <span className="text-zinc-300 text-xs mt-1 block">Listed: {exc.listed}</span>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
