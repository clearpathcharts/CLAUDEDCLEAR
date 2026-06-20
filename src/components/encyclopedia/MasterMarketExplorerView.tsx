// /src/components/encyclopedia/MasterMarketExplorerView.tsx
import React, { useState, useMemo } from 'react';
import { 
  Search, 
  TrendingUp, 
  Coins, 
  DollarSign, 
  Boxes, 
  Cpu, 
  ChevronLeft, 
  ChevronRight, 
  Sparkles, 
  BookOpen, 
  AlertTriangle, 
  Activity, 
  ArrowUpRight, 
  ArrowDownRight,
  Calculator,
  RefreshCw,
  Info
} from 'lucide-react';
import { 
  getProceduralStocks, 
  getProceduralCrypto, 
  getProceduralForex, 
  getProceduralCommodities, 
  getProceduralGlossary 
} from '../../utils/searchEngine';
import StockCard from '../StockCard';
import DevilsAdvocatePanel, { getNarcissisticInterpretation } from './DevilsAdvocatePanel';

interface MasterMarketExplorerViewProps {
  explorerType: 'stocks' | 'crypto' | 'forex' | 'commodities' | 'glossary';
  selectFileNode: (path: string) => void;
  askAboutTerm?: (termObj: any) => void;
}

export default function MasterMarketExplorerView({ 
  explorerType, 
  selectFileNode, 
  askAboutTerm 
}: MasterMarketExplorerViewProps) {
  // Common interactive states
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [priceSimTrigger, setPriceSimTrigger] = useState(0);
  const [activeLetter, setActiveLetter] = useState('all');
  const [isNarcissistMode, setIsNarcissistMode] = useState(false);
  
  // Specific view detail popup cards
  const [selectedDetailItem, setSelectedDetailItem] = useState<any | null>(null);

  // Forex Calculator States
  const [forexBaseAmount, setForexBaseAmount] = useState('1000');
  const [forexCalcResult, setForexCalcResult] = useState<number | null>(null);

  const ITEMS_PER_PAGE = 24;

  // 1. STOCKS DATA BRAIN
  const stocksData = useMemo(() => {
    return getProceduralStocks();
  }, []);

  const stockSectors = useMemo(() => {
    return ['all', ...Array.from(new Set(stocksData.map(s => s.sector)))];
  }, [stocksData]);

  // Filters & Search for Stocks
  const filteredStocks = useMemo(() => {
    return stocksData.filter(stock => {
      const matchesSearch = stock.ticker.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            stock.company.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            stock.sector.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesSector = selectedFilter === 'all' || stock.sector === selectedFilter;
      return matchesSearch && matchesSector;
    });
  }, [stocksData, searchQuery, selectedFilter]);

  // 2. CRYPTO DATA BRAIN
  const cryptoData = useMemo(() => {
    return getProceduralCrypto();
  }, []);

  const cryptoCategories = useMemo(() => {
    return ['all', 'Store of Value', 'Smart Contract Platform', 'DeFi Protocol', 'Layer 1 Ledger', 'Metaverse Asset', 'Utility Engine Token'];
  }, []);

  const filteredCrypto = useMemo(() => {
    return cryptoData.filter(coin => {
      const matchesSearch = coin.symbol.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            coin.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedFilter === 'all' || coin.category === selectedFilter;
      const matchesLetter = activeLetter === 'all' || coin.name.toUpperCase().startsWith(activeLetter.toUpperCase());
      return matchesSearch && matchesCategory && matchesLetter;
    });
  }, [cryptoData, searchQuery, selectedFilter, activeLetter]);

  // 3. FOREX DATA BRAIN
  const forexData = useMemo(() => {
    return getProceduralForex();
  }, []);

  const forexTypes = useMemo(() => {
    return ['all', 'Major', 'Cross', 'Exotic'];
  }, []);

  const filteredForex = useMemo(() => {
    return forexData.filter(pair => {
      const matchesSearch = pair.pair.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = selectedFilter === 'all' || pair.type === selectedFilter;
      return matchesSearch && matchesType;
    });
  }, [forexData, searchQuery, selectedFilter]);

  // 4. COMMODITIES DATA BRAIN
  const commoditiesData = useMemo(() => {
    return getProceduralCommodities();
  }, []);

  const commodityCategories = useMemo(() => {
    return ['all', 'Energy', 'Metals', 'Agriculture', 'Livestock'];
  }, []);

  const filteredCommodities = useMemo(() => {
    return commoditiesData.filter(comm => {
      const matchesSearch = comm.symbol.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            comm.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedFilter === 'all' || comm.category === selectedFilter;
      return matchesSearch && matchesCategory;
    });
  }, [commoditiesData, searchQuery, selectedFilter]);

  // 5. GLOSSARY DATA BRAIN
  const glossaryData = useMemo(() => {
    return getProceduralGlossary();
  }, []);

  const filteredGlossary = useMemo(() => {
    return glossaryData.filter(item => {
      const matchesSearch = item.term.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            item.definition.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesLetter = activeLetter === 'all' || item.term.toUpperCase().startsWith(activeLetter.toUpperCase());
      return matchesSearch && matchesLetter;
    });
  }, [glossaryData, searchQuery, activeLetter]);

  // Reset page whenever search or filters shift
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedFilter, activeLetter, explorerType]);

  // Pagination bounds
  const activeDatasetSize = {
    stocks: filteredStocks.length,
    crypto: filteredCrypto.length,
    forex: filteredForex.length,
    commodities: filteredCommodities.length,
    glossary: filteredGlossary.length,
  }[explorerType];

  const totalPages = Math.max(1, Math.ceil(activeDatasetSize / ITEMS_PER_PAGE));

  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    if (explorerType === 'stocks') return filteredStocks.slice(start, end);
    if (explorerType === 'crypto') return filteredCrypto.slice(start, end);
    if (explorerType === 'forex') return filteredForex.slice(start, end);
    if (explorerType === 'commodities') return filteredCommodities.slice(start, end);
    return filteredGlossary.slice(start, end);
  }, [explorerType, filteredStocks, filteredCrypto, filteredForex, filteredCommodities, filteredGlossary, currentPage]);

  // Fast randomized prices generator based on ticker hash to simulate visual reality
  const getSimulatedPriceAndChange = (symbol: string) => {
    let hash = 0;
    for (let i = 0; i < symbol.length; i++) {
      hash = symbol.charCodeAt(i) + ((hash << 5) - hash);
    }
    const seedVal = Math.sin(hash + priceSimTrigger);
    const priceVal = Math.abs(seedVal * 1500 + 4.5).toFixed(2);
    const changeVal = (seedVal * 8.5).toFixed(2);
    const isUp = parseFloat(changeVal) >= 0;
    return { price: priceVal, change: changeVal, isUp };
  };

  const handleForexCalculate = (exchangeRate: number) => {
    const parsed = parseFloat(forexBaseAmount);
    if (!isNaN(parsed)) {
      setForexCalcResult(parsed * exchangeRate);
    }
  };

  return (
    <div className="flex flex-col gap-6 font-sans select-none animate-fadeIn">
      {/* HEADER HERO SEGMENT */}
      <div className="p-8 bg-gradient-to-r from-neutral-950/85 via-[#030612]/95 to-transparent border border-[#00D9FF]/20 rounded-3xl relative overflow-hidden shadow-2xl">
        <div className="absolute inset-0 bg-[#FF007F]/[0.015] pointer-events-none" />
        <div className="absolute top-0 right-0 p-4 opacity-10">
          {explorerType === 'stocks' && <TrendingUp className="w-24 h-24 text-[#00D9FF]" />}
          {explorerType === 'crypto' && <Coins className="w-24 h-24 text-[#FF007F]" />}
          {explorerType === 'forex' && <DollarSign className="w-24 h-24 text-[#8B00FF]" />}
          {explorerType === 'commodities' && <Boxes className="w-24 h-24 text-[#FF6A00]" />}
          {explorerType === 'glossary' && <BookOpen className="w-24 h-24 text-[#00ffe1]" />}
        </div>

        <span className="font-mono text-[9px] uppercase tracking-[0.25em] text-[#00D9FF] font-black block mb-2">
          CLEARPATH ENGINE LABS • SYSTEMIC MATRIX MODULE
        </span>

        <h2 className="text-white font-black text-2xl tracking-tight uppercase flex items-center gap-2">
          {explorerType === 'stocks' && <>Equities Observatory <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 font-mono font-bold">10,000+ STOCKS AT SCALE</span></>}
          {explorerType === 'crypto' && <><span className="text-[#ff5a1f] drop-shadow-[0_0_8px_rgba(255,90,31,0.5)]">Crypto Ledger Observatory</span> <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-[#ff5a1f]/10 border border-[#ff5a1f]/20 text-[#ff5a1f] font-mono font-bold">20,000+ TOKENS AT SCALE</span></>}
          {explorerType === 'forex' && <>Foreign Exchange Matrix <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 font-mono font-bold">1,000+ BILLATERAL PAIRS</span></>}
          {explorerType === 'commodities' && <>Commodities Logistics Matrix <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 font-mono font-bold">100+ MACRO ENERGY & METALS</span></>}
          {explorerType === 'glossary' && <>Financial Science Lexicon <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-cyan-500/10 border border-[#00ffe1]/20 text-cyan-300 font-mono font-bold">12,000+ SYSTEMIC TERMS</span></>}
        </h2>

        <p className="text-zinc-405 text-xs mt-3 max-w-3xl leading-relaxed">
          {explorerType === 'stocks' && 'Our clearing engine maps 10,000+ public securities deterministically with active tracking filters, real-time looking book fluctuations, corporate profile triggers, interest sensitivity metrics and physical chain flows.'}
          {explorerType === 'crypto' && 'Deep blockchain architecture network monitoring. Search and trace sovereign proof-of-work protocols, layer-2 smart pools, decentralized flash clearing ledgers, and token assets.'}
          {explorerType === 'forex' && 'Bilateral fiat exchange swap rates mapping the global credit systems. Access bilateral rate calculators, inflation risk filters, central bank rate policies, and interbank liquidity sheets.'}
          {explorerType === 'commodities' && 'Continuous global baseline ledger tracking precious metal bullion reserves, global crude oil benchmarks, baseload energy pipelines, soft grains, and industrial farming raw materials.'}
          {explorerType === 'glossary' && 'Full academic dictionary indices covering macroeconomics, algorithmic arbitrage, quantitative pricing calculus, central bank discount models, bond physics, and options volatility skew structures.'}
        </p>

        {/* METRICS ROW */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-5 border-t border-white/5 font-mono text-[10.5px]">
          <div className="p-3 bg-white/[0.01] border border-white/5 rounded-xl">
            <span className="text-zinc-550 block">METRIC RECORD COUNT</span>
            <span className="text-white font-black text-sm block mt-1">
              {explorerType === 'stocks' && '10,052 Public Listings'}
              {explorerType === 'crypto' && '20,112 Active Ledgers'}
              {explorerType === 'forex' && '1,200 Currency Pipes'}
              {explorerType === 'commodities' && '102 Bulk Pipelines'}
              {explorerType === 'glossary' && '12,052 Dictionary Term Node'}
            </span>
          </div>
          <div className="p-3 bg-white/[0.01] border border-white/5 rounded-xl">
            <span className="text-zinc-550 block">ENGINEERING SOURCE TYPE</span>
            <span className="text-[#00ffff] font-black text-xs block mt-1">SEED-DETERMINISTIC SCALE</span>
          </div>
          <div className="p-3 bg-white/[0.01] border border-white/5 rounded-xl">
            <span className="text-zinc-550 block">SYSTEM STATUS</span>
            <span className="text-emerald-400 font-black text-xs block mt-1 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              ONLINE / FULL INGRESS
            </span>
          </div>
          <div className="p-3 bg-white/[0.01] border border-white/5 rounded-xl flex items-center justify-between">
            <div>
              <span className="text-zinc-550 block">SIMULATION SEED</span>
              <span className="text-zinc-400 font-bold block mt-0.5">MATRIX_V4_CLEAR</span>
            </div>
            <button 
              onClick={() => setPriceSimTrigger(prev => prev + 1)}
              className="p-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-white transition-all border border-white/5 cursor-pointer flex items-center gap-1 text-[8.5px]"
              title="Trigger real-time simulated update sweeps"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              SWEEP
            </button>
          </div>
        </div>
      </div>

      {/* FILTER & SEARCH CONTROL MATRIX BAR */}
      {explorerType !== 'glossary' ? (
        <div className="flex flex-col gap-3 w-full">
          <div className="p-4 bg-black/60 border border-white/5 rounded-2xl flex flex-col md:flex-row gap-4 items-center">
            {/* Search Input */}
            <div className="flex bg-neutral-900 border border-white/10 focus-within:border-[#00D9FF] rounded-xl p-2 px-3 items-center gap-2 flex-1 w-full font-sans text-xs">
              <Search className="w-4 h-4 text-zinc-500" />
              <input 
                type="text" 
                placeholder={`Search across all records by symbol, company, category, tags...`}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="bg-transparent border-none text-white outline-none w-full"
              />
            </div>

            {/* Dynamic Dropdown Filters */}
            <div className="flex items-center gap-2 shrink-0 w-full md:w-auto overflow-x-auto">
              <span className="text-[10px] font-mono text-zinc-500 font-bold uppercase tracking-wider hidden lg:inline">FILTER SECTOR:</span>
              <select
                value={selectedFilter}
                onChange={e => setSelectedFilter(e.target.value)}
                className="p-2.5 pr-8 bg-neutral-900/90 border border-white/10 text-white rounded-xl text-xs outline-none focus:border-[#00D9FF] cursor-pointer"
              >
                {explorerType === 'stocks' && stockSectors.map(sec => (
                  <option key={sec} value={sec}>{sec.toUpperCase()}</option>
                ))}
                {explorerType === 'crypto' && cryptoCategories.map(cat => (
                  <option key={cat} value={cat}>{cat.toUpperCase()}</option>
                ))}
                {explorerType === 'forex' && forexTypes.map(ft => (
                  <option key={ft} value={ft}>{ft.toUpperCase()}</option>
                ))}
                {explorerType === 'commodities' && commodityCategories.map(cc => (
                  <option key={cc} value={cc}>{cc.toUpperCase()}</option>
                ))}
              </select>
            </div>
          </div>

          {explorerType === 'crypto' && (
            <div className="flex flex-col gap-2">
              <span className="text-[9px] font-mono text-zinc-500 font-black uppercase tracking-widest pl-1">Alphabetical Glossary Index (A-Z networks):</span>
              <div className="flex flex-wrap gap-1 bg-[#040815]/60 p-2.5 rounded-2xl border border-white/5 font-mono text-[9px] overflow-x-auto">
                <button
                  onClick={() => setActiveLetter('all')}
                  className={`px-3 py-1.5 rounded-lg transition-all font-black cursor-pointer uppercase ${activeLetter === 'all' ? 'bg-[#00D9FF] text-black shadow-[0_0_8px_rgba(0,217,255,0.4)]' : 'text-zinc-400 hover:text-white'}`}
                >
                  ALL TOKENS
                </button>
                {Array.from('ABCDEFGHIJKLMNOPQRSTUVWXYZ').map(char => (
                  <button
                    key={char}
                    onClick={() => setActiveLetter(char)}
                    className={`px-2.5 py-1.5 rounded-lg transition-all font-extrabold cursor-pointer ${activeLetter === char ? 'bg-[#FF007F] text-white shadow-[0_0_8px_rgba(255,0,127,0.4)]' : 'text-zinc-400 hover:text-zinc-100 hover:bg-white/5'}`}
                  >
                    {char}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* GLOSSARY SPECFIC ALPHA-PANEL FILTERS */
        <div className="flex flex-col gap-4">
          <div className="p-4 bg-gradient-to-r from-cyan-950/20 to-neutral-950/80 border border-cyan-500/20 rounded-2xl flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex bg-neutral-900 border border-white/10 focus-within:border-cyan-400 p-2.5 rounded-xl w-full md:flex-1 font-sans text-xs items-center gap-3">
              <Search className="w-4 h-4 text-zinc-500" />
              <input
                type="text"
                placeholder="Search over 12,000+ advanced dynamic financial dictionary terms..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent border-none text-white outline-none w-full"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-1 bg-[#040815]/60 p-2.5 rounded-2xl border border-white/5 font-mono text-[9px] overflow-x-auto">
            <button
              onClick={() => setActiveLetter('all')}
              className={`px-3 py-1.5 rounded-lg transition-all font-black cursor-pointer uppercase ${activeLetter === 'all' ? 'bg-[#00D9FF] text-black shadow-[0_0_8px_rgba(0,217,255,0.4)]' : 'text-zinc-400 hover:text-white'}`}
            >
              SHOW ALL
            </button>
            {Array.from('ABCDEFGHIJKLMNOPQRSTUVWXYZ').map(char => (
              <button
                key={char}
                onClick={() => setActiveLetter(char)}
                className={`px-2.5 py-1.5 rounded-lg transition-all font-extrabold cursor-pointer ${activeLetter === char ? 'bg-[#FF007F] text-white shadow-[0_0_8px_rgba(255,0,127,0.4)]' : 'text-zinc-400 hover:text-zinc-100 hover:bg-white/5'}`}
              >
                {char}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* CORE GRID DATA LISTINGS */}
      <div className="mt-2 text-left">
        {activeDatasetSize === 0 ? (
          <div className="p-16 border border-dashed border-white/10 rounded-3xl text-center flex flex-col items-center justify-center gap-4">
            <AlertTriangle className="w-10 h-10 text-zinc-650 animate-pulse" />
            <div>
              <h3 className="text-white font-bold uppercase text-sm">NO DATA DETECTED IN INGRESS BUFFER</h3>
              <p className="text-zinc-500 text-xs mt-1">Modify your search filter terms to synchronize with active indicators.</p>
            </div>
          </div>
        ) : (
          <div>
            {/* RENDER STOCKS */}
            {explorerType === 'stocks' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {paginatedItems.map((stock: any, i: number) => {
                  // Standard specific navigation triggers for Apple & Tesla
                  const isSpecificStock = stock.ticker === 'AAPL' || stock.ticker === 'TSLA';
                  const glowColorType = i % 3 === 0 ? 'purple' : i % 3 === 1 ? 'pink' : 'orange';

                  return (
                    <div 
                      key={stock.ticker} 
                      onClick={() => {
                        if (isSpecificStock) {
                          selectFileNode(`encyclopedia/stocks/${stock.ticker.toLowerCase()}.html`);
                        } else {
                          setSelectedDetailItem(stock);
                        }
                      }}
                    >
                      <StockCard 
                        ticker={stock.ticker}
                        company={stock.company}
                        sector={stock.sector}
                        marketCap={stock.marketCap}
                        glowType={glowColorType}
                      />
                    </div>
                  );
                })}
              </div>
            )}

            {/* RENDER CRYPTO */}
            {explorerType === 'crypto' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {paginatedItems.map((coin: any, i: number) => {
                  const simulated = getSimulatedPriceAndChange(coin.symbol);
                  const glowClass = i % 3 === 0 ? 'border-purple-500/20 hover:shadow-[0_0_15px_#8B00FF,_0_0_20px_#5B00FF]' : i % 3 === 1 ? 'border-pink-500/20 hover:shadow-[0_0_15px_#FF007F,_0_0_20px_#FF1493]' : 'border-orange-500/20 hover:shadow-[0_0_15px_#FF6A00,_0_0_20px_#FFC400]';

                  return (
                    <div 
                      key={coin.symbol}
                      onClick={() => {
                        setSelectedDetailItem(coin);
                        window.history.pushState({}, '', `/crypto/${coin.symbol.toLowerCase()}`);
                      }}
                      className={`p-5 bg-black/65 border rounded-2xl cursor-pointer hover:bg-neutral-950/40 transition-all duration-300 flex flex-col justify-between h-44 ${glowClass}`}
                    >
                      <div className="flex justify-between items-start">
                        <span className="p-1 px-2 bg-neutral-900 border border-white/10 rounded-lg text-[10px] text-zinc-350 font-mono font-bold">
                          {coin.symbol}
                        </span>
                        <div className="flex items-center gap-1 text-[10px] font-mono">
                          <span className={simulated.isUp ? 'text-emerald-400' : 'text-red-400'}>
                            {simulated.isUp ? <ArrowUpRight className="w-3 h-3 inline" /> : <ArrowDownRight className="w-3 h-3 inline" />} 
                            {simulated.change}%
                          </span>
                        </div>
                      </div>

                      <div className="mt-3">
                        <h4 className="text-[#ff5a1f] font-black text-sm uppercase truncate leading-none mb-1 drop-shadow-[0_0_4px_rgba(255,90,31,0.4)]">{coin.name}</h4>
                        <span className="text-[9px] text-[#00D9FF] font-mono tracking-wider font-extrabold uppercase bg-cyan-950/20 border border-cyan-800/30 px-1.5 py-0.5 rounded-md">
                          {coin.category}
                        </span>
                      </div>

                      <div className="w-full h-px bg-white/5 my-2.5" />

                      <div className="flex justify-between items-center text-[10px] font-mono">
                        <span className="text-zinc-500 uppercase tracking-wide">ESTIMATE RATE:</span>
                        <span className="text-white font-black">${simulated.price}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* RENDER FOREX */}
            {explorerType === 'forex' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {paginatedItems.map((pair: any, i: number) => {
                  const simulated = getSimulatedPriceAndChange(pair.pair.replace('/', ''));
                  const currentRate = parseFloat(simulated.price) / 100 + 0.15; // Realistic exchange decimals
                  const glowClass = i % 3 === 0 ? 'border-purple-500/20 hover:shadow-[0_0_15px_#8B00FF,_0_0_20px_#5B00FF]' : i % 3 === 1 ? 'border-pink-500/20 hover:shadow-[0_0_15px_#FF007F,_0_0_20px_#FF1493]' : 'border-orange-500/20 hover:shadow-[0_0_15px_#FF6A00,_0_0_20px_#FFC400]';

                  return (
                    <div 
                      key={pair.pair}
                      onClick={() => {
                        setSelectedDetailItem({ ...pair, currentRate });
                        window.history.pushState({}, '', `/forex/${pair.pair.toLowerCase().replace('/', '')}`);
                      }}
                      className={`p-5 bg-black/65 border rounded-2xl cursor-pointer hover:bg-neutral-950/40 transition-all duration-300 flex flex-col justify-between h-44 ${glowClass}`}
                    >
                      <div className="flex justify-between items-center bg-white/[0.02] p-1.5 px-2.5 rounded-xl border border-white/5">
                        <span className="text-white font-black text-xs font-mono tracking-tight">{pair.pair}</span>
                        <span className="text-[8px] px-1.5 py-0.5 rounded bg-zinc-800 font-mono text-zinc-400 font-extrabold uppercase">{pair.type}</span>
                      </div>

                      <div className="my-2 select-none">
                        <p className="text-zinc-405 text-[10.5px] leading-relaxed line-clamp-2 mt-1">{pair.description}</p>
                      </div>

                      <div className="w-full h-px bg-white/5 my-1" />

                      <div className="flex justify-between items-center text-[10px] font-mono">
                        <span className="text-zinc-550 italic uppercase font-extrabold">INTERBANK FX BID:</span>
                        <span className="text-[#00ffe1] font-black">{currentRate.toFixed(4)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* RENDER COMMODITIES */}
            {explorerType === 'commodities' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {paginatedItems.map((comm: any, i: number) => {
                  const simulated = getSimulatedPriceAndChange(comm.symbol);
                  const currentRate = parseFloat(simulated.price) + 2.5;
                  const isUp = simulated.isUp;
                  const changePercent = simulated.change;
                  const glowClass = i % 3 === 0 ? 'border-purple-500/20 hover:shadow-[0_0_15px_#8B00FF,_0_0_20px_#5B00FF]' : i % 3 === 1 ? 'border-pink-500/20 hover:shadow-[0_0_15px_#FF007F,_0_0_20px_#FF1493]' : 'border-orange-500/20 hover:shadow-[0_0_15px_#FF6A00,_0_0_20px_#FFC400]';

                  return (
                    <div 
                      key={comm.symbol}
                      onClick={() => setSelectedDetailItem({ ...comm, currentRate, changePercent, isUp })}
                      className={`p-5 bg-black/65 border rounded-2xl cursor-pointer hover:bg-neutral-950/40 transition-all duration-300 flex flex-col justify-between h-44 ${glowClass}`}
                    >
                      <div className="flex justify-between items-start">
                        <span className="text-white font-black font-mono text-xs p-1 px-2 bg-[#FF6A00]/10 border border-[#FF6A00]/25 rounded-lg text-[#FF6A00]">
                          {comm.symbol}
                        </span>
                        <span className="text-[8px] bg-white/5 border border-white/5 p-1 rounded font-mono text-zinc-550 uppercase font-black tracking-widest">{comm.category}</span>
                      </div>

                      <div className="mt-3">
                        <h4 className="text-zinc-200 font-extrabold text-sm">{comm.name}</h4>
                        <div className="text-[10.5px] text-zinc-500 font-mono truncate">{comm.description}</div>
                      </div>

                      <div className="w-full h-px bg-white/5 my-1" />

                      <div className="flex justify-between items-center text-[10px] font-mono">
                        <span className="text-zinc-550 uppercase">SPOT BID:</span>
                        <div className="flex items-center gap-1.5 font-black">
                          <span className="text-white">${currentRate.toFixed(2)}</span>
                          <span className={isUp ? 'text-emerald-400' : 'text-red-400'}>{isUp ? '▲' : '▼'}{Math.abs(parseFloat(changePercent))}%</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* RENDER GLOSSARY */}
            {explorerType === 'glossary' && (
              <div className="flex flex-col gap-6 w-full">
                <DevilsAdvocatePanel 
                  isNarcissistMode={isNarcissistMode}
                  setIsNarcissistMode={setIsNarcissistMode}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {paginatedItems.map((g: any, i: number) => {
                    const glowClass = i % 3 === 0 ? 'border-[#8B00FF]/20 hover:shadow-[0_0_15px_#8B00FF,_0_0_20px_#5B00FF]' : i % 3 === 1 ? 'border-[#FF007F]/20 hover:shadow-[0_0_15px_#FF007F,_0_0_20px_#FF1493]' : 'border-[#FF6A00]/20 hover:shadow-[0_0_15px_#FF6A00,_0_0_20px_#FFC400]';

                    const displayDefinition = isNarcissistMode 
                      ? getNarcissisticInterpretation(g.term, g.definition, g.category)
                      : g.definition;

                    return (
                      <div 
                        key={g.term} 
                        className={`p-5 bg-gradient-to-br from-neutral-950/95 to-[#02040c] border rounded-2xl relative overflow-hidden flex flex-col justify-between h-56 transition-all duration-300 ${glowClass}`}
                      >
                        <div>
                          <div className="flex justify-between items-center border-b border-white/5 pb-2 mb-3">
                            <span className="font-mono text-[#00D9FF] font-black text-[10.5px] uppercase tracking-wide">{g.term[0]} // INDEX</span>
                            <span className="text-[8px] bg-indigo-500/10 border border-indigo-500/25 px-1.5 py-0.5 rounded text-indigo-400 uppercase font-mono font-bold shrink-0">{g.category || 'General'}</span>
                          </div>
                          <h4 className="text-white font-black text-sm uppercase tracking-tight truncate leading-tight mb-2" title={g.term}>{g.term}</h4>
                          <p className="text-zinc-400 text-xs leading-relaxed line-clamp-3 mb-4 select-text">{displayDefinition}</p>
                        </div>

                        <div className="flex gap-2 font-sans">
                          <button 
                            onClick={() => {
                              if (askAboutTerm) askAboutTerm(g);
                            }}
                            className="flex-1 py-2 border border-cyan-500/20 text-[#00f2ff] hover:bg-[#00f2ff]/10 text-[10px] font-bold tracking-widest uppercase rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                            neural Study
                          </button>
                          <button 
                            onClick={() => setSelectedDetailItem(g)}
                            className="px-3 border border-white/5 text-zinc-400 hover:text-white hover:bg-white/5 text-[9px] font-black uppercase rounded-xl transition-all cursor-pointer"
                          >
                            INFO
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* HIGH-AESTHETIC PAGINATION SYSTEM */}
            <div className="mt-8 pt-5 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4 text-xs font-mono select-none">
              <span className="text-zinc-500 font-extrabold uppercase">
                BUFFERING ENTRIES <b className="text-[#00D9FF]">{(currentPage - 1) * ITEMS_PER_PAGE + 1} - {Math.min(currentPage * ITEMS_PER_PAGE, activeDatasetSize)}</b> OF <b className="text-white">{activeDatasetSize.toLocaleString()}</b> MATCHED
              </span>

              <div className="flex items-center gap-2">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  className="p-2 px-4.5 bg-neutral-900 border border-white/10 rounded-xl font-bold cursor-pointer hover:bg-neutral-800 disabled:opacity-20 disabled:cursor-not-allowed text-white transition-all"
                >
                  PREVIOUS
                </button>
                <div className="px-4 py-2 bg-[#00D9FF]/10 border border-[#00D9FF]/20 rounded-xl text-[#00D9FF] font-black">
                  PAGE {currentPage} / {totalPages}
                </div>
                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  className="p-2 px-4.5 bg-neutral-900 border border-white/10 rounded-xl font-bold cursor-pointer hover:bg-neutral-800 disabled:opacity-20 disabled:cursor-not-allowed text-white transition-all"
                >
                  NEXT
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* DETAIL MODAL OVERLAY SHEET */}
      {selectedDetailItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md select-none animate-fadeIn">
          <div className="w-full max-w-xl p-8 bg-[#040815] border border-cyan-500/25 rounded-3xl relative overflow-hidden shadow-2xl flex flex-col gap-5 text-left">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#8B00FF] via-[#FF007F] to-[#FF6A00]" />
            <div className="absolute top-4 right-4">
              <button 
                onClick={() => {
                  setSelectedDetailItem(null); 
                  setForexCalcResult(null);
                  window.history.pushState({}, '', `/financial-encyclopedia`);
                }}
                className="close text-[10px] text-zinc-500 hover:text-white uppercase font-black tracking-widest cursor-pointer font-mono p-1 px-3 bg-white/5 rounded-lg border border-white/5"
              >
                CLOSE [X]
              </button>
            </div>

            {/* STOCKS DETAIL CARD */}
            {explorerType === 'stocks' && (
              <div className="flex flex-col gap-4 font-sans select-text">
                <div>
                  <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#00D9FF] font-black block mb-1">DETAILED DATABASE RECORD</span>
                  <h3 className="text-white font-black text-xl uppercase tracking-tight leading-none mb-1">{selectedDetailItem.company}</h3>
                  <div className="flex flex-wrap gap-2 mt-2 items-center">
                    <span className="text-[10px] uppercase font-bold font-mono text-[#00D9FF] bg-[#00D9FF]/10 px-2 py-0.5 border border-[#00D9FF]/25 rounded-md">TICKER: {selectedDetailItem.ticker}</span>
                    <span className="text-[10px] uppercase font-bold font-mono text-zinc-400 bg-neutral-900 px-2 border border-white/5 py-0.5 rounded-md">{selectedDetailItem.exchange}</span>
                    <span className="text-[10px] font-semibold text-emerald-400 font-mono">VALUE: {selectedDetailItem.marketCap}</span>
                  </div>
                </div>

                <div className="w-full h-px bg-white/5" />

                <div className="flex flex-col gap-2">
                  <h4 className="text-zinc-550 font-mono text-[9.5px] uppercase tracking-wider leading-none">Business Summary</h4>
                  <p className="text-zinc-300 text-xs leading-relaxed">{selectedDetailItem.description}</p>
                </div>

                <div className="grid grid-cols-2 gap-4 font-mono text-[10px] bg-white/[0.01] p-4 rounded-xl border border-white/5">
                  <div>
                    <span className="text-zinc-500 uppercase block">SECTOR SELECTION</span>
                    <span className="text-zinc-200 font-bold block mt-0.5">{selectedDetailItem.sector}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 uppercase block">INDUSTRY SEGMENT</span>
                    <span className="text-zinc-200 font-bold block mt-0.5">{selectedDetailItem.industry}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 uppercase block">FOUNDING YEAR</span>
                    <span className="text-zinc-200 font-bold block mt-0.5">{selectedDetailItem.founded}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 uppercase block">HEADQUARTERS</span>
                    <span className="text-[#00D9FF] font-black block mt-0.5 text-xs tracking-tight truncate">{selectedDetailItem.headquarters}</span>
                  </div>
                </div>

                <div className="flex flex-col gap-2.5">
                  <h4 className="text-zinc-550 font-mono text-[9.5px] uppercase tracking-wider leading-none">Macro Transmission Indicators</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedDetailItem.tags.map((tag: string) => (
                      <span key={tag} className="text-[9.5px] font-bold text-cyan-400 bg-cyan-950/20 border border-cyan-800/20 px-2 py-0.5 rounded-full uppercase font-mono">{tag}</span>
                    ))}
                  </div>
                  <div className="bg-[#0c0303]/40 border border-red-500/10 p-3 rounded-lg text-[10.5px]">
                    <span className="text-red-400 font-mono font-bold uppercase tracking-wider block mb-1">WHAT MOVES THE PRICE DIRECTLY //</span>
                    <ul className="list-disc pl-4 text-zinc-400 flex flex-col gap-1 font-mono">
                      {selectedDetailItem.whatMoves.map((m: string) => (
                        <li key={m}>{m}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* CRYPTO DETAIL CARD */}
            {explorerType === 'crypto' && (
              <div className="flex flex-col gap-4 font-sans select-text">
                <div>
                  <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#FF007F] font-black block mb-1">DLT LEDGER ANALYSIS PROTOCOL</span>
                  <h3 className="text-[#ff5a1f] font-black text-xl uppercase tracking-tight leading-none mb-1 drop-shadow-[0_0_8px_rgba(255,90,31,0.5)]">{selectedDetailItem.name}</h3>
                  <div className="flex gap-2 mt-2 items-center font-mono text-[10px]">
                    <span className="text-pink-400 bg-pink-950/20 border border-pink-800/30 px-2 py-0.5 rounded-md uppercase font-black">{selectedDetailItem.symbol}</span>
                    <span className="text-zinc-450 bg-neutral-900 border border-white/5 px-2 py-0.5 rounded-md uppercase font-bold">{selectedDetailItem.category}</span>
                    {selectedDetailItem.founded && <span className="text-zinc-450">GENESIS: {selectedDetailItem.founded}</span>}
                  </div>
                </div>

                <div className="w-full h-px bg-white/5" />

                <div className="flex flex-col gap-2">
                  <h4 className="text-zinc-550 font-mono text-[9.5px] uppercase tracking-wider leading-none">Consensus & Operation Narrative</h4>
                  <p className="text-zinc-300 text-xs leading-relaxed">{selectedDetailItem.description}</p>
                </div>

                {selectedDetailItem.creator && (
                  <div className="p-3 bg-neutral-900/60 border border-white/5 rounded-xl font-mono text-[10.5px] flex justify-between items-center">
                    <span className="text-zinc-500 uppercase font-extrabold uppercase">IDENTIFIED GENESIS CREATOR:</span>
                    <span className="text-[#00ffff] font-black tracking-widest">{selectedDetailItem.creator}</span>
                  </div>
                )}

                <div className="bg-[#0b040f]/60 p-4 border border-purple-500/10 rounded-xl font-mono text-[10.5px]">
                  <span className="text-purple-400 font-extrabold block mb-1 uppercase tracking-wider">AGGREGATE PRICE DRIVERS:</span>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {selectedDetailItem.whatMoves.map((m: string) => (
                      <span key={m} className="p-1 px-2.5 bg-zinc-900 border border-white/5 rounded text-zinc-350 text-[10px]">{m}</span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* FOREX DETAIL CARD */}
            {explorerType === 'forex' && (
              <div className="flex flex-col gap-4 font-sans select-text">
                <div>
                  <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#8B00FF] font-black block mb-1">SOVEREIGN FX EXCHANGE INDICATORS</span>
                  <h3 className="text-white font-black text-xl uppercase tracking-tight leading-none mb-1">{selectedDetailItem.pair} Swap Node</h3>
                  <div className="flex gap-2 mt-2 items-center font-mono text-[10.5px]">
                    <span className="text-purple-400 bg-purple-950/20 border border-purple-800/30 px-2 py-0.5 rounded-md uppercase font-black">{selectedDetailItem.type} Pair</span>
                    <span className="text-white font-bold bg-zinc-900 border border-white/5 px-2 py-0.5 rounded-md">SPOT RATE: {selectedDetailItem.currentRate.toFixed(4)}</span>
                  </div>
                </div>

                <div className="w-full h-px bg-white/5" />

                <div className="flex flex-col gap-2">
                  <h4 className="text-zinc-550 font-mono text-[9.5px] uppercase tracking-wider leading-none">Bilateral Country Operations</h4>
                  <p className="text-zinc-300 text-xs leading-relaxed">{selectedDetailItem.description}</p>
                </div>

                {/* INTERACTIVE VALUE CALCULATOR */}
                <div className="p-4.5 bg-neutral-900/60 border border-[#8B00FF]/20 rounded-2xl flex flex-col gap-3 font-sans">
                  <span className="text-[#8B00FF] font-mono text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 leading-none">
                    <Calculator className="w-4 h-4" />
                    Bilateral Swift Swap Simulator
                  </span>
                  
                  <div className="flex gap-2 items-center mt-1">
                    <div className="flex bg-black border border-white/10 rounded-xl p-2 items-center flex-1 font-mono text-xs text-white">
                      <span className="text-zinc-500 mr-2 uppercase font-black text-[9.5px] shrink-0">{selectedDetailItem.pair.split('/')[0]} IN:</span>
                      <input 
                        type="number" 
                        value={forexBaseAmount}
                        onChange={e => {
                          setForexBaseAmount(e.target.value);
                          setForexCalcResult(null);
                        }}
                        className="bg-transparent border-none text-white outline-none w-full font-bold focus:ring-0 p-0"
                      />
                    </div>
                    <button
                      onClick={() => handleForexCalculate(selectedDetailItem.currentRate)}
                      className="py-1.5 px-4 bg-gradient-to-r from-[#8B00FF] to-[#5B00FF] text-white font-mono text-[10.5px] font-black rounded-xl cursor-pointer hover:opacity-90 transition-all select-none"
                    >
                      CALCULATE
                    </button>
                  </div>

                  {forexCalcResult !== null && (
                    <div className="mt-1 pt-3.5 border-t border-white/5 flex justify-between items-center font-mono">
                      <span className="text-zinc-500 text-[10px] uppercase font-bold">SIMULATED OUTFLOW:</span>
                      <span className="text-[#00ffff] font-black text-xs">
                        {forexCalcResult.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })} {selectedDetailItem.pair.split('/')[1]}
                      </span>
                    </div>
                  )}
                </div>

                <div className="p-4.5 bg-[#030612] border border-cyan-500/10 rounded-xl font-mono text-[10.5px]">
                  <span className="text-cyan-400 font-extrabold uppercase leading-none block border-b border-cyan-500/10 pb-1.5 mb-2.5">PRIMARY SOVEREIGN TRANSMISSION TRIGGERS:</span>
                  <div className="flex flex-col gap-2 text-zinc-350">
                    <div className="flex justify-between items-center">
                      <span>Affected Core Parameters:</span>
                      <span className="text-white font-bold">{selectedDetailItem.affectedBy.join(' • ')}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* COMMODITIES DETAIL CARD */}
            {explorerType === 'commodities' && (
              <div className="flex flex-col gap-4 font-sans select-text">
                <div>
                  <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#FF6A00] font-black block mb-1">BULK RESOURCE LOGISTICS INDEX</span>
                  <h3 className="text-white font-black text-xl uppercase tracking-tight leading-none mb-1">{selectedDetailItem.name} ({selectedDetailItem.symbol})</h3>
                  <div className="flex gap-2 mt-2 items-center font-mono text-[10.5px]">
                    <span className="text-orange-400 bg-orange-950/20 border border-orange-850/30 px-2 py-0.5 rounded-md uppercase font-black">{selectedDetailItem.category} Spot</span>
                    <span className="text-white font-bold bg-zinc-900 border border-white/5 px-2 py-0.5 rounded-md">SPOT PRICING: ${selectedDetailItem.currentRate.toFixed(2)}</span>
                  </div>
                </div>

                <div className="w-full h-px bg-white/5" />

                <div className="flex flex-col gap-2">
                  <h4 className="text-zinc-550 font-mono text-[9.5px] uppercase tracking-wider leading-none">Logistical Description & Pipelines</h4>
                  <p className="text-zinc-300 text-xs leading-relaxed">{selectedDetailItem.description}</p>
                </div>

                <div className="p-4 bg-neutral-900/60 border border-[#FF6A00]/20 rounded-xl font-mono text-[10.5px]">
                  <span className="text-[#FF6A00] font-extrabold block mb-2 uppercase tracking-wider">AGGREGATE TRANSMISSION HURDLES:</span>
                  <ul className="list-disc pl-4 text-zinc-350 flex flex-col gap-1.5">
                    {selectedDetailItem.affectedBy.map((item: string) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* GLOSSARY DETAIL CARD */}
            {explorerType === 'glossary' && (
              <div className="flex flex-col gap-4 font-sans select-text">
                <div>
                  <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#00ffe1] font-black block mb-1">FINANCIAL LEXICON DEFINITION</span>
                  <h3 className="text-white font-black text-xl uppercase tracking-tight leading-none mb-1">{selectedDetailItem.term}</h3>
                  <span className="text-[#00ffe1] bg-cyan-950/20 border border-[#00ffe1]/20 px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-wide font-extrabold inline-block mt-2">{selectedDetailItem.category}</span>
                  {isNarcissistMode && (
                    <span className="ml-2 text-[#FF007F] bg-[#FF007F]/15 border border-[#FF007F]/25 px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-wide font-extrabold inline-block mt-2">NARCISSIST INTERPRETATION ACTIVE</span>
                  )}
                </div>

                <div className="w-full h-px bg-white/5" />

                <div className="flex flex-col gap-2">
                  <h4 className="text-zinc-550 font-mono text-[9.5px] uppercase tracking-wider leading-none">
                    {isNarcissistMode ? "Brutal Elite Outlook" : "Systemic Definition"}
                  </h4>
                  <p className="text-zinc-200 text-xs leading-relaxed font-sans">
                    {isNarcissistMode 
                      ? getNarcissisticInterpretation(selectedDetailItem.term, selectedDetailItem.definition, selectedDetailItem.category)
                      : selectedDetailItem.definition}
                  </p>
                </div>

                {selectedDetailItem.related && selectedDetailItem.related.length > 0 && (
                  <div className="p-4.5 bg-neutral-900/60 border border-white/5 rounded-2xl flex flex-col gap-2.5 font-sans">
                    <span className="text-indigo-400 font-mono text-[10px] font-extrabold uppercase tracking-wide flex items-center gap-1.5">
                      <BookOpen className="w-4 h-4" />
                      Interconnected Secondary Terminology Nodes
                    </span>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {selectedDetailItem.related.map((rel: string) => (
                        <span key={rel} className="p-1 px-2.5 bg-zinc-900 border border-white/10 rounded-xl text-zinc-350 text-[10px] font-mono tracking-tight font-medium uppercase">{rel}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
