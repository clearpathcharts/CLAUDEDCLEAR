import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Newspaper, 
  Search, 
  Sparkles, 
  Clock, 
  TrendingUp, 
  Check, 
  CheckCircle2, 
  AlertTriangle, 
  Globe, 
  Coins, 
  Calendar, 
  ChevronRight, 
  RefreshCw, 
  Play, 
  Pause, 
  Flame, 
  ShieldCheck, 
  Layers, 
  BookOpen, 
  Terminal, 
  Plus, 
  Bookmark,
  Activity,
  SlidersHorizontal
} from 'lucide-react';
import { useAuth } from '../contexts/FirebaseContext';
import categoriesData from '../data/categories.json';
import rssFeedsData from '../data/rss-feeds.json';
import calendarData from '../data/economic-calendar.json';
import initialAssetsData from '../data/market-assets.json';
import { CalendarBridgeWidget } from './CalendarBridgeWidget';
import { usePageAutoUpdate } from '../hooks/usePageAutoUpdate';

interface Source {
  name: string;
  url: string;
  date: string;
}

interface Article {
  id: string;
  title: string;
  description: string;
  sources: Source[];
  category: string;
  subcategory: string;
  asset: string;
  importance: 'High' | 'Medium' | 'Low';
  marketImpact: string;
  sentiment: 'Bullish' | 'Bearish' | 'Neutral';
  confidence: string;
  timestamp: string;
  bulletPoints: string[];
  content: string;
  isBookmarked?: boolean;
}

interface IngestionLog {
  time: string;
  type: 'incoming' | 'approved' | 'rejected_exact' | 'rejected_sim' | 'system';
  message: string;
}

export default function NewsPanel() {
  const { user, userProfile } = useAuth();

  // Primary Workspace tab switcher
  const [activeWorkspaceTab, setActiveWorkspaceTab] = useState<'hub' | 'pipeline' | 'grounding' | 'calendar'>('hub');
  
  // Selection states
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeArticleId, setActiveArticleId] = useState<string>('art-1');
  const [isDetailModalOpen, setIsDetailModalOpen] = useState<boolean>(false);
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set());

  // Grounding Engine state (preserved & leveled up)
  const [liveSearchQuery, setLiveSearchQuery] = useState<string>('Federal Reserve interest rates');
  const [inputVal, setInputVal] = useState<string>('');
  const [searchLoading, setSearchLoading] = useState<boolean>(false);
  const [searchData, setSearchData] = useState<any>(null);
  const [searchError, setSearchError] = useState<string | null>(null);

  // Asset prices live simulator state
  const [assets, setAssets] = useState(initialAssetsData);

  // Ingestion Simulator States
  const [isPipelineLive, setIsPipelineLive] = useState<boolean>(true);
  const [ingestionLogs, setIngestionLogs] = useState<IngestionLog[]>([
    { time: '04:15:02', type: 'system', message: 'ClearPath Ingest Pipeline version 4.2.1 initialized.' },
    { time: '04:15:15', type: 'system', message: 'Active feed directories compiled: 12 live wires connected.' },
    { time: '04:16:00', type: 'approved', message: 'SEC Form 10-K Ingestion: NVIDIA filings analyzed. Deduplication integrity: Clear.' },
    { time: '04:16:45', type: 'incoming', message: 'Receiving background packet from Bloomberg wire...' }
  ]);

  // Simulated live articles feed representing different sectors and duplicate clusters
  const [articles, setArticles] = useState<Article[]>([
    {
      id: 'art-1',
      title: 'Federal Reserve Signals Extended Pause as Wholesale Core CPI Collapses',
      description: 'A comprehensive review of debt auctions suggests central bankers will hold rates through November, citing dramatic cooling of core consumer indices.',
      sources: [
        { name: 'FRB Press', url: 'https://www.federalreserve.gov', date: 'Just now' },
        { name: 'ECB Press', url: '#', date: '3 min ago' },
        { name: 'Bloomberg', url: '#', date: '5 min ago' }
      ],
      category: 'Central Banks',
      subcategory: 'Federal Reserve',
      asset: 'USD',
      importance: 'High',
      marketImpact: 'Bullish USD 🇺🇸',
      sentiment: 'Bullish',
      confidence: '98%',
      timestamp: 'Today at 04:15 AM',
      bulletPoints: [
        'Treasury dealers noted solid stabilization across 10-year placements.',
        'Immediate liquidation of short-term hedge portfolios with bearish biases.',
        'Consumer expectations show persistent convergence to long-range targets.'
      ],
      content: 'A comprehensive review of secondary debt auctions and capital reserve mandates suggests that the Federal Reserve will defer further rate action through autumn. Sovereigns noted an immediate stabilization across benchmark ten-year bond placements, leading to a massive unwinding of bearish positions. The aggregate index remains highly receptive'
    },
    {
      id: 'art-2',
      title: 'Bitcoin Hash Rate Reaches Direct Historical All-Time High Amid Regulatory Pivot',
      description: 'Global miners deploy next-generation extreme-efficiency ASIC models to key North American centers, boosting network security to absolute records.',
      sources: [
        { name: 'CoinDesk', url: '#', date: '12 min ago' },
        { name: 'CoinTelegraph', url: '#', date: '14 min ago' }
      ],
      category: 'Crypto',
      subcategory: 'Bitcoin',
      asset: 'BTC',
      importance: 'Medium',
      marketImpact: 'Bullish BTC 🪙',
      sentiment: 'Bullish',
      confidence: '95%',
      timestamp: 'Today at 03:42 AM',
      bulletPoints: [
        'Network computational security reaches unprecedented 640 EH/s threshold.',
        'Energy recycling programs in Texas and Norway improve ESG ratings.',
        'Liquidation thresholds remain thin below sixty-five thousand.'
      ],
      content: 'Decentralized mining cooperatives have reported record energy-to-hash conversions as next-generation ASIC integration peaks. Despite elevated global difficulty, validator margins have stabilized on the back of institutional spot storage inflows. Slippage metrics across sovereign automated market pools remain within normal distributions.'
    },
    {
      id: 'art-3',
      title: 'Eurozone Yield Gaps Explode Over Potential ECB Collateral Rebalancing',
      description: 'Central bank governors design an off-record tender purchase mechanism to cushion spread imbalances among peripheral debt markets.',
      sources: [
        { name: 'ECB Bulletin', url: '#', date: '24 min ago' },
        { name: 'Euronews', url: '#', date: '30 min ago' }
      ],
      category: 'Central Banks',
      subcategory: 'ECB',
      asset: 'EUR',
      importance: 'High',
      marketImpact: 'Bearish EUR 🇪🇺',
      sentiment: 'Bearish',
      confidence: '92%',
      timestamp: 'Today at 03:10 AM',
      bulletPoints: [
        'Bond spreads between French and German debt widen to four-year apex.',
        'Proposed liquidity cushions spark fierce internal compliance arguments.',
        'Spot euro experiences sharp resistance against primary FX carry-baskets.'
      ],
      content: 'Peripheral sovereign debt realignments have forced the European Central Bank to coordinate exceptional collateral swaps. Chief economists warning of localized inflation distortions from prolonged secondary asset expansion look increasingly verified as debt ratios climb.'
    },
    {
      id: 'art-4',
      title: 'Gold Spot Climbs Back to Key Overbought Territory Amid Global Credit Fears',
      description: 'Central banks buy sovereign bullion blocks in response to systemic banking liquidity alarms and fiscal balance deficits.',
      sources: [
        { name: 'LBMA News', url: '#', date: '1 hour ago' },
        { name: 'Kitco News', url: '#', date: '1.2h ago' },
        { name: 'MarketWatch', url: '#', date: '2h ago' }
      ],
      category: 'Commodities',
      subcategory: 'Gold',
      asset: 'XAU',
      importance: 'Medium',
      marketImpact: 'Bullish Gold 🟡',
      sentiment: 'Bullish',
      confidence: '89%',
      timestamp: 'Today at 02:05 AM',
      bulletPoints: [
        'Official central repository imports hit thirty-two billion valuation mark.',
        'Physical premiums at major Asian trading hubs expand over spot benchmarks.',
        'Safe-haven capital reallocation shows strong structural momentum.'
      ],
      content: 'Persistent sovereign credit stress and multi-national trade disruptions have prompted extensive capital reallocation toward physical bullion reserves. High premium indexes across leading physical markets are reflecting tight physical supply despite futures market leverage adjustments.'
    },
    {
      id: 'art-5',
      title: 'WTI Crude Under Pressure Sp spurred by Elevated US Strategic Reserve Buildup',
      description: 'Raw agricultural commodities and energy indices drift lower under increased shale yield outputs and structural demand flattening.',
      sources: [
        { name: 'EIA Report', url: '#', date: '2 hours ago' }
      ],
      category: 'Energy',
      subcategory: 'WTI',
      asset: 'USO',
      importance: 'Low',
      marketImpact: 'Bearish Crude 🛢️',
      sentiment: 'Bearish',
      confidence: '84%',
      timestamp: 'Yesterday at 11:30 PM',
      bulletPoints: [
        'EIA inventory increases by hefty four point two million barrels weekly.',
        'Refinery throughput levels drop slightly over scheduled service intervals.',
        'Global marine shipping lanes report normalized transit velocities.'
      ],
      content: 'Strategic crude supply buffers have offset recent geopolitical friction vectors. Energy market desks remain defensive, citing continued surplus capacity from non-OPEC producers which caps speculative risk parameters for the third fiscal period.'
    }
  ]);

  // Sandbox Test States
  const [pipelineTestTitle, setPipelineTestTitle] = useState<string>('');
  const [pipelineTestCategory, setPipelineTestCategory] = useState<string>('Forex');
  const [testResultFeedback, setTestResultFeedback] = useState<string | null>(null);

  // Auto Tick Simulated background prices (demo-only; paused while tab hidden)
  usePageAutoUpdate(() => {
    setAssets(prev => prev.map(a => {
      const factor = Math.random() > 0.48 ? 1 : -1;
      const changeVal = (Math.random() * (parseFloat(a.price) * 0.0008)) * factor;
      const newPrice = (parseFloat(a.price) + changeVal).toFixed(a.id.includes('USD') || a.id.includes('GC') ? 4 : 2);
      const originalPrice = parseFloat(initialAssetsData.find(ia => ia.id === a.id)?.price || '0');
      const calculatedChange = (parseFloat(newPrice) - originalPrice);
      const calculatedPct = ((calculatedChange / originalPrice) * 100).toFixed(2);
      
      return {
        ...a,
        price: newPrice,
        change: (calculatedChange >= 0 ? '+' : '') + calculatedChange.toFixed(a.id.includes('USD') ? 4 : 2),
        pct: (calculatedChange >= 0 ? '+' : '') + calculatedPct + '%',
        direction: calculatedChange >= 0 ? 'up' : 'down'
      };
    }));
  }, { intervalMs: 4_500, immediate: false });

  // Continuous background simulated news flow
  usePageAutoUpdate(() => {
    const pipelineStoriesToIngest = [
      {
        title: "Federal Reserve hints at July rate cuts",
        source: "Bloomberg Feed",
        duplicateType: "near", 
        targetId: "art-1", 
        logMsg: "Incoming Headline: 'Federal Reserve hints at July rate cuts' (via Bloomberg Wire)"
      },
      {
        title: "Federal Reserve Signals Extended Pause as Wholesale Core CPI Collapses",
        source: "ECB Press",
        duplicateType: "exact",
        logMsg: "Incoming Headline: 'Federal Reserve Signals Extended Pause as Wholesale Core CPI Collapses' (via ECB)"
      },
      {
        title: "ECB may coordinate unexpected collateral restrictions to squeeze spreads",
        source: "Euronews Global",
        duplicateType: "none",
        category: "Central Banks",
        subcategory: "ECB",
        asset: "EUR",
        marketImpact: "Bearish EUR 🇪🇺",
        sentiment: "Bearish" as const,
        description: "Fresh policy updates inside the Eurosystem hint at tighter capital requirements to preserve collateral balance sheets."
      },
      {
        title: "Gold bullion physical reserves drop in major London vaults",
        source: "LBMA Wire",
        duplicateType: "none",
        category: "Commodities",
        subcategory: "Gold",
        asset: "XAU",
        marketImpact: "Bullish Gold 🟡",
        sentiment: "Bullish" as const,
        description: "Strategic storage metrics indicate deep bullion draws across sovereign repositories as central banks hold physical deliveries."
      }
    ];

    const story = pipelineStoriesToIngest[Math.floor(Math.random() * pipelineStoriesToIngest.length)];
    const currentTime = new Date().toTimeString().split(' ')[0];

    if (story.duplicateType === 'exact') {
      const exactHash = Math.abs(story.title.split("").reduce((a,b)=>{a=((a<<5)-a)+b.charCodeAt(0);return a&a},0)).toString(16);
      setIngestionLogs(prev => [
        { time: currentTime, type: 'incoming', message: `Scanning source wire feed: [${story.source}]` },
        { time: currentTime, type: 'rejected_exact', message: `❌ DUPLICATE BLOCKED - Hash [SHA256-${exactHash}] exists. Rejected Article: "${story.title}"` },
        ...prev.slice(0, 40)
      ]);
    } else if (story.duplicateType === 'near') {
      const simScore = (88 + Math.random() * 8).toFixed(1);
      setIngestionLogs(prev => [
        { time: currentTime, type: 'incoming', message: `Scanning source wire: "${story.title}"` },
        { time: currentTime, type: 'rejected_sim', message: `⚠️ NEAR DUPLICATE (Cosine Similarity: ${simScore}% with Federal Reserve Signal) block-cached! Clustered references to existing card [art-1].` },
        ...prev.slice(0, 40)
      ]);

      // Append to sources of active card 1
      setArticles(prev => prev.map(art => {
        if (art.id === 'art-1') {
          const hasSource = art.sources.some(s => s.name === story.source);
          if (hasSource) return art;
          return {
            ...art,
            sources: [...art.sources, { name: story.source, url: '#', date: 'Just now' }]
          };
        }
        return art;
      }));
    } else {
      // Unique clean new article
      const newId = `art-${Date.now()}`;
      const newArt: Article = {
        id: newId,
        title: story.title as string,
        description: story.description as string,
        sources: [{ name: story.source, url: '#', date: 'Just now' }],
        category: story.category as string,
        subcategory: story.subcategory as string,
        asset: story.asset as string,
        importance: 'Medium',
        marketImpact: story.marketImpact as string,
        sentiment: story.sentiment as any,
        confidence: '96%',
        timestamp: 'Just now',
        bulletPoints: ['Decentralized compliance verification passed.', 'Calculated overall sentiment score vectors.', 'Integrated into active subscriber feed.'],
        content: `${story.description} Analytical data models indicate immediate portfolio relevance score of ${(Math.random() * 10 + 90).toFixed(1)}% with extremely fast local execution times.`
      };

      setIngestionLogs(prev => [
        { time: currentTime, type: 'approved', message: `✅ CLEAN WIRE COMPLIANT - Deployed to subcategory [${story.subcategory}]. Article published.` },
        ...prev.slice(0, 40)
      ]);

      setArticles(prev => {
        if (prev.some(a => a.title === story.title)) return prev;
        return [newArt, ...prev];
      });
    }
  }, { intervalMs: 18_000, enabled: isPipelineLive, immediate: false });

  // Handle custom user manual sandbox test article ingestion simulation
  const handleTestIngestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pipelineTestTitle.trim()) return;

    const textToMatch = pipelineTestTitle.toLowerCase().trim();
    const exactMatch = articles.find(a => a.title.toLowerCase().trim() === textToMatch);
    
    // Check near duplicates using word-overlap ratio as a simulated cosine similarity
    let bestSimilarity = 0;
    let matchingArt: Article | null = null;
    
    const userWords = textToMatch.split(/\s+/);
    articles.forEach(art => {
      const artWords = art.title.toLowerCase().split(/\s+/);
      const intersect = userWords.filter(w => artWords.includes(w));
      const union = Array.from(new Set([...userWords, ...artWords]));
      const similarity = (intersect.length / union.length) * 100;
      if (similarity > bestSimilarity) {
        bestSimilarity = similarity;
        matchingArt = art;
      }
    });

    const currentTime = new Date().toTimeString().split(' ')[0];

    if (exactMatch) {
      setTestResultFeedback(`Rejection Code: EXACT_DUPLICATE_BLOCK (sha256 matching 100%). Dropped!`);
      setIngestionLogs(prev => [
        { time: currentTime, type: 'rejected_exact', message: `❌ [SANDBOX TRIGGER] Blocked exact duplicate. Title matched "${exactMatch.title}"` },
        ...prev
      ]);
    } else if (bestSimilarity > 50) { // If overlap > 50%, treat as near-duplicate (>90% trigger mockup)
      setTestResultFeedback(`Rejection Code: NEAR_DUPLICATE_GROUPED. Cluster confidence: ${bestSimilarity.toFixed(1)}%. Appended to sources of [${matchingArt?.title}]`);
      setIngestionLogs(prev => [
        { time: currentTime, type: 'rejected_sim', message: `⚠️ [SANDBOX TRIGGER] Near-duplicate blocked (${bestSimilarity.toFixed(1)}% Cosine Overlap index with art ID: ${matchingArt?.id}). Clustered sources.` },
        ...prev
      ]);

      // Add source
      setArticles(prev => prev.map(art => {
        if (art.id === matchingArt?.id) {
          return {
            ...art,
            sources: [...art.sources, { name: 'Sandbox Wire', url: '#', date: 'Just now' }]
          };
        }
        return art;
      }));
    } else {
      // Create and ingest
      const newId = `art-${Date.now()}`;
      const newArt: Article = {
        id: newId,
        title: pipelineTestTitle,
        description: 'Manual pipeline injected article with verified structural data validation vectors.',
        sources: [{ name: 'Sandbox Wire Feed', url: '#', date: 'Just now' }],
        category: pipelineTestCategory,
        subcategory: 'Testing Desk',
        asset: 'SANDBOX',
        importance: 'Medium',
        marketImpact: `Bullish SEC 🔴`,
        sentiment: 'Neutral',
        confidence: '95%',
        timestamp: 'Just now',
        bulletPoints: ['Manually tested via active dashboard inputs', 'Compliance bypass integrity approved'],
        content: 'Sandbox environment triggered execution indices. Re-calibrated near-duplicate calculations verify strict transaction throughput bounds.'
      };

      setArticles(prev => [newArt, ...prev]);
      setActiveArticleId(newId);
      setTestResultFeedback(`Ingest Code: PIPELINE_COMPLIANT. Ingested successfully into the database as a pristine article!`);
      setIngestionLogs(prev => [
        { time: currentTime, type: 'approved', message: `✅ [SANDBOX TRIGGER] Unique wire accepted. Story deployed as ID: ${newId}.` },
        ...prev
      ]);
    }

    setPipelineTestTitle('');
  };

  // Grounding Engine execution proxy
  const handlePerformLiveSearch = async (queryToRun: string) => {
    if (!queryToRun.trim()) return;
    setSearchLoading(true);
    setSearchError(null);
    setLiveSearchQuery(queryToRun);
    try {
      const response = await fetch(`/api/news/search?q=${encodeURIComponent(queryToRun)}`);
      if (!response.ok) {
        throw new Error(`Terminal search interface returned status ${response.status}`);
      }
      const data = await response.json();
      setSearchData(data);
    } catch (err: any) {
      console.error('[Client News Search Error]', err);
      setSearchError(err.message || 'An error occurred during search grounding.');
    } finally {
      setSearchLoading(false);
    }
  };

  // Run initial search query on transition of tab
  useEffect(() => {
    if (activeWorkspaceTab === 'grounding' && !searchData && !searchLoading) {
      handlePerformLiveSearch('Federal Reserve interest rates');
    }
  }, [activeWorkspaceTab]);

  // Bookmarking handler
  const toggleBookmark = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setBookmarkedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Hierarchical dynamic subcategories matching categoriesData
  const activeSubcategoryList = useMemo(() => {
    if (selectedCategory === 'All') return [];
    return (categoriesData as any)[selectedCategory] || [];
  }, [selectedCategory]);

  // Reset subcategory if parent category alters
  useEffect(() => {
    setSelectedSubcategory('All');
  }, [selectedCategory]);

  // Filtering calculations
  const filteredArticlesList = useMemo(() => {
    return articles.filter(art => {
      const matchesCategory = selectedCategory === 'All' || art.category === selectedCategory;
      const matchesSubcategory = selectedSubcategory === 'All' || art.subcategory === selectedSubcategory;
      
      const matchSearch = searchQuery.trim() === '' || 
        art.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        art.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        art.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        art.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        art.subcategory.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesCategory && matchesSubcategory && matchSearch;
    });
  }, [articles, selectedCategory, selectedSubcategory, searchQuery]);

  const activeArticle = useMemo(() => {
    return articles.find(a => a.id === activeArticleId) || filteredArticlesList[0] || articles[0];
  }, [articles, activeArticleId, filteredArticlesList]);

  return (
    <div className="w-full text-zinc-100 font-sans flex flex-col h-full overflow-hidden select-none relative" id="news-portal-root" style={{ background: '#030309' }}>
      
      {/* Dynamic Ambient Color Balance Backdrops (Pre-balanced: ~45% Fire Pink, ~35% Neon Indigo, ~20% Neon Cyan) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none select-none z-0" id="neon-premium-bg">
        {/* Fire Hot Pink Spotlight - ~45% presence */}
        <div className="absolute top-[5%] right-[20%] w-[500px] h-[500px] rounded-full bg-[#ff007f]/12 blur-[130px] mix-blend-screen animate-pulse" style={{ animationDuration: '9s' }} />
        
        {/* Neon Indigo Spotlight - ~35% presence */}
        <div className="absolute bottom-[15%] left-[5%] w-[420px] h-[420px] rounded-full bg-[#5d00ff]/10 blur-[110px] mix-blend-screen animate-pulse" style={{ animationDuration: '13s' }} />
        
        {/* Neon Cyan Spotlight - ~20% presence */}
        <div className="absolute top-[50%] left-[45%] w-[280px] h-[280px] rounded-full bg-[#00f0ff]/7 blur-[90px] mix-blend-screen animate-pulse" style={{ animationDuration: '16s' }} />
      </div>

      {/* 1. TOP LIVE SCROLLING TICKER */}
      <div className="w-full h-11 bg-black/65 backdrop-blur-md border-b border-white/[0.06] flex items-center overflow-hidden shrink-0 relative z-10" id="ticker-frame">
        <div className="absolute left-0 top-0 bottom-0 px-4 bg-[#ff007f]/10 border-r border-[#ff007f]/20 flex items-center gap-2 z-20 select-none shrink-0" id="ticker-title">
          <span className="w-2 h-2 rounded-full bg-[#ff007f] animate-ping" />
          <span className="text-[10px] font-mono font-black tracking-widest text-[#ff007f] uppercase">CPMS NEON TICKER</span>
        </div>
        
        <div className="flex-1 overflow-x-auto whitespace-nowrap scrollbar-none py-1 flex items-center pr-10 pl-48" id="ticker-scroller">
          <div className="flex items-center gap-10 animate-[marquee_50s_linear_infinite]" style={{ minWidth: 'max-content' }}>
            {assets.concat(assets).map((asset, idx) => (
              <div key={`${asset.id}-${idx}`} className="inline-flex items-center gap-2 rounded-lg bg-black/50 backdrop-blur-md border border-white/[0.06] px-3 py-1 text-xs select-none shadow-[inset_0_1px_1px_rgba(255,255,255,0.02)]">
                <span className="font-mono text-zinc-400 font-bold uppercase">{asset.symbol}</span>
                <span className="font-mono text-zinc-100 font-black">{asset.price}</span>
                <span className={`font-mono text-[11px] font-black ${asset.direction === 'up' ? 'text-[#00f0ff]' : 'text-[#ff007f]'}`}>
                  {asset.change} ({asset.pct})
                </span>
                <span className={`w-1.5 h-1.5 rounded-full ${asset.direction === 'up' ? 'bg-[#00f0ff]' : 'bg-[#ff007f]'}`} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 2. SUB-PORTAL MAIN HEADER WITH DOUBLE GLASS STYLE */}
      <header className="border-b border-white/[0.08] bg-[#060613]/40 backdrop-blur-xl px-6 py-5 shrink-0 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5 relative z-10 shadow-[0_8px_32px_rgba(0,0,0,0.37)]" id="news-sub-header">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-[#ff007f]/30 via-[#5d00ff]/20 to-[#00f0ff]/30 p-[1px] shadow-[0_0_24px_rgba(255,0,127,0.22)] flex items-center justify-center">
            <div className="w-full h-full bg-[#060614]/90 rounded-[11px] flex items-center justify-center">
              <Newspaper className="text-[#ff007f] w-5 h-5 animate-pulse" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-[10px] uppercase tracking-[0.25em] font-mono text-zinc-400 font-extrabold flex items-center gap-1.5">
                <Globe className="w-3 h-3 text-[#00f0ff] animate-spin" style={{ animationDuration: '6s' }} /> 
                ClearPath Editorial Network
              </span>
            </div>
            <h1 className="text-2xl font-black uppercase tracking-wider italic text-white flex items-center gap-2 bg-clip-text text-transparent bg-gradient-to-r from-[#ff007f] via-[#5d00ff] to-[#00f0ff]">
              ClearPathTrader News Publication
            </h1>
          </div>
        </div>

        {/* WORKSPACE MODE TABS (Double Glass Finish Frame) */}
        <div className="flex flex-wrap items-center bg-black/40 backdrop-blur-md p-1 rounded-xl border border-white/[0.08] gap-1 select-none shadow-[2px_4px_16px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.05)]" id="workspace-mode-selector">
          <button
            onClick={() => setActiveWorkspaceTab('hub')}
            aria-label="Switch to News Hub"
            className={`px-4 py-2 rounded-lg font-mono font-bold uppercase transition-all text-xs tracking-wider flex items-center gap-2 cursor-pointer border
              ${activeWorkspaceTab === 'hub' 
                ? 'bg-[#ff007f]/10 text-[#ff007f] border-[#ff007f]/25 shadow-[0_0_14px_rgba(255,0,127,0.18)]' 
                : 'border-transparent text-zinc-400 hover:text-white hover:bg-white/[0.03]'}`}
          >
            <Newspaper className="w-3.5 h-3.5 text-[#ff007f]" />
            ClearPath News Hub
          </button>

          <button
            onClick={() => setActiveWorkspaceTab('pipeline')}
            aria-label="Switch to Pipeline"
            className={`px-4 py-2 rounded-lg font-mono font-bold uppercase transition-all text-xs tracking-wider flex items-center gap-2 cursor-pointer border
              ${activeWorkspaceTab === 'pipeline' 
                ? 'bg-[#5d00ff]/10 text-indigo-400 border-[#5d00ff]/25 shadow-[0_0_14px_rgba(93,0,255,0.18)]' 
                : 'border-transparent text-zinc-400 hover:text-white hover:bg-white/[0.03]'}`}
          >
            <Terminal className="w-3.5 h-3.5 text-indigo-400" />
            Ingestion & Duplicate Radar
          </button>

          <button
            onClick={() => setActiveWorkspaceTab('grounding')}
            aria-label="Switch to AI Grounding"
            className={`px-4 py-2 rounded-lg font-mono font-bold uppercase transition-all text-xs tracking-wider flex items-center gap-2 cursor-pointer border
              ${activeWorkspaceTab === 'grounding' 
                ? 'bg-[#00f0ff]/10 text-[#00f0ff] border-[#00f0ff]/25 shadow-[0_0_14px_rgba(0,240,255,0.18)]' 
                : 'border-transparent text-zinc-400 hover:text-white hover:bg-white/[0.03]'}`}
          >
            <Sparkles className="w-3.5 h-3.5 text-[#00f0ff] animate-pulse" />
            AI Grounding Search
          </button>

          <button
            onClick={() => setActiveWorkspaceTab('calendar')}
            aria-label="Switch to Economic Calendar"
            className={`px-4 py-2 rounded-lg font-mono font-bold uppercase transition-all text-xs tracking-wider flex items-center gap-2 cursor-pointer border
              ${activeWorkspaceTab === 'calendar' 
                ? 'bg-[#ff007f]/10 text-pink-400 border-pink-500/25 shadow-[0_0_14px_rgba(255,0,127,0.15)]' 
                : 'border-transparent text-zinc-400 hover:text-white hover:bg-white/[0.03]'}`}
          >
            <Calendar className="w-3.5 h-3.5 text-[#00f0ff]" />
            Economic Desk Calendar
          </button>
        </div>
      </header>

      {/* 3. DYNAMIC WORKSPACE ROUTING */}
      <div className="flex-1 overflow-hidden" id="news-portal-body">
        
        {/* TAB 1: CLEARPATH NEWS HUB - DYNAMIC HOMEPAGE */}
        {activeWorkspaceTab === 'hub' && (
          <div className="h-full flex flex-col md:flex-row overflow-hidden relative z-10" id="clearpath-news-hub-interface">
            
            {/* SIDEBAR: SECTOR COMPASS & SEARCH WITH DOUBLE GLASS STYLE */}
            <aside className="w-full md:w-80 bg-black/40 backdrop-blur-xl border-b md:border-b-0 md:border-r border-white/[0.08] flex flex-col overflow-y-auto shrink-0 select-none p-5 relative shadow-[4px_0_24px_rgba(0,0,0,0.5),inset_-1px_0_0_rgba(255,255,255,0.02)]" id="news-categories-selector-panel">
              <div className="space-y-4 mb-6">
                <span className="text-[11px] font-mono font-black text-[#ff007f] uppercase tracking-[0.25em] block">
                  Search & Filters
                </span>
                
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#00f0ff] w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Filter publications..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-black/55 border border-white/[0.08] backdrop-blur-md rounded-xl py-2.5 pl-10 pr-3 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#ff007f]/50 focus:ring-1 focus:ring-[#ff007f]/20 transition-all font-medium font-mono"
                  />
                </div>
              </div>

              {/* CALENDAR BRIDGE MODULE CONTAINER */}
              <div className="mb-6 shrink-0">
                <CalendarBridgeWidget />
              </div>

              {/* CATEGORIES MAP */}
              <div className="space-y-4 flex-1">
                <span className="text-[11px] font-mono font-black text-[#ff007f] uppercase tracking-[0.25em] block">
                  Publication Sectors
                </span>

                <div className="space-y-1.5">
                  <button
                    onClick={() => setSelectedCategory('All')}
                    className={`w-full text-left px-3.5 py-3 rounded-xl flex items-center justify-between text-xs font-mono font-bold transition-all border
                      ${selectedCategory === 'All' 
                        ? 'bg-[#ff007f]/10 text-[#ff007f] border-[#ff007f]/30 shadow-[0_0_12px_rgba(255,0,127,0.12)]' 
                        : 'border-white/[0.04] bg-white/[0.01] text-zinc-400 hover:text-white hover:bg-white/[0.03] hover:border-white/[0.08]'}`}
                  >
                    <span className="flex items-center gap-3">
                      <span className="w-2 h-2 rounded-full bg-[#ff007f] animate-ping" />
                      COMPREHENSIVE STREAM
                    </span>
                    <span className="text-[10px] bg-black/40 px-2 py-0.5 rounded border border-white/[0.06] text-zinc-400 font-bold">
                      {articles.length}
                    </span>
                  </button>

                  {Object.keys(categoriesData).map((catName) => {
                    const count = articles.filter(a => a.category === catName).length;
                    return (
                      <button
                        key={catName}
                        onClick={() => setSelectedCategory(catName)}
                        className={`w-full text-left px-3.5 py-3 rounded-xl flex items-center justify-between text-xs font-mono font-bold transition-all border
                          ${selectedCategory === catName 
                            ? 'bg-[#5d00ff]/10 text-indigo-400 border-[#5d00ff]/30 shadow-[0_0_12px_rgba(93,0,255,0.12)]' 
                            : 'border-white/[0.04] bg-white/[0.01] text-zinc-400 hover:text-white hover:bg-white/[0.03] hover:border-white/[0.08]'}`}
                      >
                        <span className="flex items-center gap-3">
                          {catName === 'Forex' && <Globe className="w-3.5 h-3.5 text-[#00f0ff]" />}
                          {catName === 'Commodities' && <TrendingUp className="w-3.5 h-3.5 text-orange-400" />}
                          {catName === 'Crypto' && <Coins className="w-3.5 h-3.5 text-purple-405" />}
                          {catName === 'Central Banks' && <ShieldCheck className="w-3.5 h-3.5 text-yellow-500" />}
                          {catName === 'Economics' && <Calendar className="w-3.5 h-3.5 text-[#00f0ff]" />}
                          {!['Forex', 'Commodities', 'Crypto', 'Central Banks', 'Economics'].includes(catName) && <Layers className="w-3.5 h-3.5 text-zinc-400" />}
                          {catName.toUpperCase()}
                        </span>
                        <span className="text-[10px] bg-black/40 px-2 py-0.5 rounded border border-white/[0.06] text-zinc-400 font-bold">
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* REPORTERS & BROADCAST INFOGRAPH */}
              <div className="mt-8 pt-6 border-t border-white/[0.06] space-y-4">
                <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400">
                  <span>NETWORK BROADCAST</span>
                  <span className="text-[#00f0ff] font-extrabold animate-pulse">● ONLINE 24H</span>
                </div>
                
                <div className="p-3 bg-black/50 border border-white/[0.06] rounded-xl space-y-2.5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.02)]">
                  <p className="text-[11px] text-zinc-400 font-mono">Simulators: 240+ institutional nodes connected.</p>
                  <div className="flex -space-x-2 overflow-hidden">
                    <img className="inline-block h-6 w-6 rounded-full ring-2 ring-zinc-800 object-cover" src="https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=120&auto=format&fit=crop&q=80" alt="Richard" />
                    <img className="inline-block h-6 w-6 rounded-full ring-2 ring-zinc-800 object-cover" src="https://i.postimg.cc/D0TMsCDP/Chat-GPT-Image-May-2-2026-10-41-02-AM.png" alt="Brent" />
                    <img className="inline-block h-6 w-6 rounded-full ring-2 ring-zinc-800 object-cover" src="https://i.postimg.cc/Qtp6XQt4/WEBER3.png" alt="Bryan" />
                  </div>
                </div>
              </div>
            </aside>

            {/* MAIN PORTAL STREAM GRID */}
            <main className="flex-1 overflow-y-auto custom-scrollbar p-6 flex flex-col lg:flex-row gap-6 relative" id="hub-main-stream">
              
              {/* PRIMARY FEED CARDS LIST */}
              <div className="flex-1 space-y-4 min-w-0" id="hub-article-left-panel">
                
                {/* SUB-CATEGORY CHIPS (If parent selected) */}
                {selectedCategory !== 'All' && activeSubcategoryList.length > 0 && (
                  <div className="pb-2 flex items-center gap-1.5 overflow-x-auto scrollbar-none border-b border-zinc-800/85 mb-4" id="subcategory-chips">
                    <span className="text-[10px] text-zinc-400 font-mono font-black uppercase shrink-0">Subsectors:</span>
                    <button
                      onClick={() => setSelectedSubcategory('All')}
                      className={`px-3 py-1 rounded-full text-xs font-mono font-bold transition-all border shrink-0 cursor-pointer
                        ${selectedSubcategory === 'All'
                          ? 'bg-orange-500/10 text-orange-400 border-orange-500/40 shadow-xs'
                          : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-white'}`}
                    >
                      ALL SUBS ({articles.filter(a => a.category === selectedCategory).length})
                    </button>
                    {activeSubcategoryList.map((sub: string) => {
                      const count = articles.filter(a => a.subcategory === sub).length;
                      return (
                        <button
                          key={sub}
                                            className={`px-3 py-1.5 rounded-full text-xs font-mono font-bold transition-all border shrink-0 cursor-pointer
                            ${selectedSubcategory === sub
                              ? 'bg-[#ff007f]/15 text-[#ff007f] border-[#ff007f]/40 shadow-sm'
                              : 'bg-black/40 border-white/[0.06] text-zinc-400 hover:text-white'}`}
                        >
                          {sub.toUpperCase()} ({count})
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* ACTIVE FILTER HEADER STATUS */}
                <div className="flex items-center justify-between text-xs font-mono bg-black/40 backdrop-blur-md px-4 py-3.5 rounded-xl border border-white/[0.08] shadow-[inset_0_1px_1px_rgba(255,255,255,0.03)]">
                  <div className="flex items-center gap-2">
                    <SlidersHorizontal className="w-3.5 h-3.5 text-[#ff007f]" />
                    <span>SECTOR TARGET: <strong className="text-[#00f0ff]">{selectedCategory.toUpperCase()}</strong></span>
                    {selectedSubcategory !== 'All' && (
                      <>
                        <ChevronRight className="w-3 h-3 text-zinc-500" />
                        <span>SUB-SECTOR: <strong className="text-pink-400">{selectedSubcategory.toUpperCase()}</strong></span>
                      </>
                    )}
                  </div>
                  <span className="text-zinc-400 font-bold">{filteredArticlesList.length} PUBLICATIONS LOCATED</span>
                </div>

                {/* RENDER DYNAMIC ARTICLE CARDS */}
                {filteredArticlesList.length === 0 ? (
                  <div className="p-12 text-center bg-black/40 backdrop-blur-md rounded-2xl border border-white/[0.08]">
                    <AlertTriangle className="w-10 h-10 text-[#ff007f] mx-auto mb-3 animate-bounce" />
                    <h3 className="text-base font-bold text-zinc-350">No matching publications found</h3>
                    <p className="text-xs text-zinc-500 max-w-sm mx-auto mt-1 leading-relaxed">
                      Please broaden your parameters, search strings, or check the Deduplication Pipeline simulator to feed additional data.
                    </p>
                  </div>
                ) : (
                  filteredArticlesList.map(item => {
                    const isSelected = item.id === activeArticleId;
                    const isBookmarked = bookmarkedIds.has(item.id);
                    return (
                      <div
                        key={item.id}
                        onClick={() => {
                          setActiveArticleId(item.id);
                          setIsDetailModalOpen(true);
                        }}
                        className={`w-full p-5 rounded-2xl border transition-all cursor-pointer relative text-left select-none flex flex-col gap-3.5 backdrop-blur-md pb-6
                          ${isSelected 
                            ? 'bg-black/55 border-white/[0.15] shadow-[0_4px_24px_rgba(255,0,127,0.1),inset_0_1px_1px_rgba(255,255,255,0.07)] ring-1 ring-[#ff007f]/30' 
                            : 'bg-black/25 border-white/[0.05] hover:bg-black/45 hover:border-white/[0.1] shadow-md'}`}
                      >
                        {/* Dynamic Double-Glass Gradient indicator strip representing Balanced proportions (~45% Fire Pink, ~35% Indigo, ~20% Cyan) */}
                        {isSelected && (
                          <div className="absolute left-0 top-4 bottom-4 w-1 bg-gradient-to-b from-[#ff007f] via-[#5d00ff] to-[#00f0ff] rounded-r-lg shadow-[0_0_12px_rgba(255,0,127,0.7)]" />
                        )}

                        <div className="flex items-center justify-between text-[11px] font-mono">
                          <div className="flex items-center gap-2">
                            <span className="bg-[#ff007f]/10 text-pink-400 px-2.5 py-0.5 rounded font-black tracking-wide uppercase border border-[#ff007f]/20">
                              {item.category}
                            </span>
                            <span className="text-white/20">•</span>
                            <span className="text-zinc-400 font-bold uppercase">{item.subcategory}</span>
                          </div>

                          <div className="flex items-center gap-3">
                            <span className={`w-2 h-2 rounded-full ${item.importance === 'High' ? 'bg-[#ff007f] shadow-[0_0_8px_#ff007f]' : item.importance === 'Medium' ? 'bg-[#5d00ff] shadow-[0_0_8px_#ec4899]' : 'bg-[#00f0ff]'}`} />
                            <span className="text-zinc-400 font-bold uppercase shrink-0 flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5 text-[#00f0ff]" />
                              {item.timestamp}
                            </span>
                            
                            <button
                              onClick={(e) => toggleBookmark(item.id, e)}
                              className="text-zinc-550 hover:text-[#ff007f] transition-colors p-1"
                              aria-label={isBookmarked ? 'Remove bookmark' : 'Bookmark publication'}
                            >
                              <Bookmark className={`w-3.5 h-3.5 ${isBookmarked ? 'fill-[#ff007f] text-[#ff007f]' : ''}`} />
                            </button>
                          </div>
                        </div>

                        <div>
                          <h3 className="text-base font-black text-white hover:text-[#ff007f] transition-colors tracking-wide leading-snug uppercase mb-1">
                            {item.title}
                          </h3>
                          <p className="text-xs text-zinc-300 leading-relaxed font-sans font-semibold line-clamp-2">
                            {item.description}
                          </p>
                        </div>

                        {/* CLUSTERED SOURCES COMPONENT (Request-specific story clustering) */}
                        <div className="bg-black/40 hover:bg-black/55 p-3 rounded-xl border border-white/[0.06] flex flex-wrap gap-2.5 items-center justify-between text-xs transition-colors shadow-[inset_0_1px_1px_rgba(255,255,255,0.01)]">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[10px] text-[#00f0ff] font-mono uppercase tracking-wider font-bold">Story Cluster ({item.sources.length} sources):</span>
                            {item.sources.map((src, i) => (
                              <span key={i} className="bg-[#12122d]/60 border border-white/[0.05] px-2 py-0.5 rounded font-mono text-[10px] text-pink-400 font-bold">
                                {src.name} • <span className="text-zinc-400 font-normal">{src.date}</span>
                              </span>
                            ))}
                          </div>
                          
                          {/* AI impact prediction tags */}
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-zinc-500 font-mono font-bold">AI SCORE:</span>
                            <span className={`px-2 py-0.5 rounded font-mono text-[10px] font-black border uppercase 
                              ${item.sentiment === 'Bullish' 
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                                : item.sentiment === 'Bearish'
                                ? 'bg-[#ff007f]/10 text-pink-400 border-[#ff007f]/20'
                                : 'bg-white/10 text-zinc-300 border-white/20'}`}>
                              {item.marketImpact} (Conf: {item.confidence})
                            </span>
                          </div>
                        </div>

                      </div>
                    );
                  })
                )}

              </div>

              {/* RIGHT SECTOR: COMPREHENSIVE TEXT READER & DETAILED RATINGS */}
              <aside className="w-full lg:w-[420px] shrink-0 flex flex-col gap-4 select-none" id="hub-article-reader-panel">
                
                {/* ACTIVE DETAILED BRIEF (Premium Double Glass Finish Layout) */}
                <div className="rounded-2xl p-[1px] bg-gradient-to-tr from-white/10 via-transparent to-[#ff007f]/25 shadow-[0_12px_40px_rgba(0,0,0,0.5)]" id="hub-reader-box">
                  <div className="bg-black/50 backdrop-blur-xl p-5 rounded-[15px] flex flex-col gap-4 text-left" id="hub-reader-inner">
                  <div className="border-b border-white/[0.08] pb-3 flex items-center justify-between">
                    <div>
                      <span className="text-[9px] font-mono font-black uppercase text-[#ff007f] tracking-widest block mb-0.5">PUBLIC RELATIONS WIRE</span>
                      <h4 className="text-xs font-black uppercase text-white tracking-widest">Active Analysis Panel</h4>
                    </div>
                    <span className="text-[10px] bg-black/40 border border-white/[0.08] text-zinc-350 px-2 py-0.5 rounded font-mono font-black font-semibold shadow-[0_2px_8px_rgba(0,0,0,0.3)]">
                      ID: {activeArticle.id.toUpperCase()}
                    </span>
                  </div>

                  <div className="relative h-44 w-full rounded-xl overflow-hidden border border-zinc-850 shadow-inner select-none bg-black">
                    <img 
                      src="https://i.postimg.cc/T2s48mn8/Gemini-Generated-Image-bztme2bztme2bztm.jpg" 
                      alt="ClearPath Premium Editorial Highlight" 
                      className="w-full h-full object-cover opacity-85 hover:opacity-100 transition-opacity duration-300"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                    <div className="absolute top-2.5 left-2.5 bg-black/75 px-2 py-0.5 rounded text-[9px] font-mono text-[#ff007f] border border-[#ff007f]/30 font-black tracking-widest uppercase">
                      Editorial Spotlight Image
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] font-mono font-bold uppercase text-zinc-400">Title Headline</span>
                    <h2 className="text-base font-black leading-snug text-white uppercase tracking-wide mt-1">
                      {activeArticle.title}
                    </h2>
                  </div>

                  {/* AI INSIGHT METADATA BOX (Directly aligns with AI auto-categorization requirements) */}
                  <div className="bg-black/55 p-4 rounded-xl border border-white/[0.06] space-y-3 font-mono text-[11px] shadow-[inset_0_1px_1px_rgba(255,255,255,0.01)]">
                    <div className="flex items-center gap-1.5 text-xs font-black text-[#00f0ff] border-b border-white/[0.06] pb-2 mb-2">
                      <Sparkles className="w-4 h-4 text-[#ff007f] animate-pulse" />
                      <span>COGNITIVE AUTO-CLASSIFICATION LOG</span>
                    </div>

                    <div className="grid grid-cols-2 gap-y-2">
                      <div className="text-zinc-500 font-bold">CATEGORY VALUE:</div>
                      <div className="text-zinc-200 font-bold text-right">{activeArticle.category}</div>

                      <div className="text-zinc-500 font-bold">ASSET TICKER:</div>
                      <div className="text-zinc-200 font-bold text-right">{activeArticle.asset}</div>

                      <div className="text-zinc-500 font-bold">WIRE SIGNIFICANCE:</div>
                      <div className="text-zinc-200 font-bold text-right">{activeArticle.importance.toUpperCase()}</div>

                      <div className="text-zinc-500 font-bold">COGNITIVE CONFID:</div>
                      <div className="text-[#ff007f] font-black text-right">{activeArticle.confidence}</div>

                      <div className="text-zinc-500 font-bold">MARKET IMPACT:</div>
                      <div className="text-right">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-black ${activeArticle.sentiment === 'Bullish' ? 'bg-[#00f0ff]/10 text-[#00f0ff]' : activeArticle.sentiment === 'Bearish' ? 'bg-[#ff007f]/10 text-pink-400 border border-[#ff007f]/20' : 'bg-white/10 text-zinc-300'}`}>
                          {activeArticle.marketImpact}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* KEY TAKEAWAYS BULLETS */}
                  <div className="space-y-2.5">
                    <span className="text-[10px] font-mono font-black uppercase text-[#ff007f] tracking-wider flex items-center gap-2">
                      <Activity className="w-4 h-4 text-[#00f0ff] animate-pulse" /> 
                      Key Market Impact Takeaways:
                    </span>
                    <ul className="space-y-2 text-xs text-zinc-300 leading-relaxed font-semibold">
                      {activeArticle.bulletPoints.map((bp, i) => (
                        <li key={i} className="flex gap-2 items-start">
                          <span className="text-[#ff007f] font-black font-mono shrink-0">[{i+1}]</span>
                          <span>{bp}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* READ FULL TEXT PREVIEW */}
                  <div className="border-t border-white/[0.08] pt-3.5 space-y-2">
                    <span className="text-[10px] font-mono font-black uppercase text-zinc-500 block">Publication Body Details</span>
                    <p className="text-xs text-zinc-400 leading-relaxed font-sans font-semibold">
                      {activeArticle.content}
                    </p>
                  </div>

                  <a
                    href="#"
                    onClick={(e) => { e.preventDefault(); alert("Continuous updates enabled. Full transmission archived inside secure network storage."); }}
                    className="w-full py-2.5 bg-gradient-to-r from-[#ff007f] via-[#5d00ff] to-[#00f0ff] hover:from-[#ff1a8c] hover:via-[#6d1aff] hover:to-[#1af0ff] text-white font-mono font-black text-xs uppercase tracking-widest rounded-xl text-center shadow-[0_4px_16px_rgba(255,0,127,0.25)] select-none mt-2 flex items-center justify-center gap-1.5 transition-all duration-300"
                  >
                    View Original Archive Source <Globe className="w-3.5 h-3.5 text-white" />
                  </a>
                </div>
              </div>

                {/* HISTORICAL RECENT ALERTS */}
                <div className="bg-black/30 backdrop-blur-md p-4.5 border border-white/[0.06] rounded-2xl space-y-3.5 shadow-sm">
                  <div className="flex items-center justify-between text-xs font-mono font-bold">
                    <span className="text-[#ff007f] uppercase tracking-widest flex items-center gap-2">
                      <Flame className="w-3.5 h-3.5 text-[#ff007f] animate-pulse" /> Breaking Bulletins
                    </span>
                    <span className="text-[10px] text-zinc-500 font-normal">Updated minute-by-minute</span>
                  </div>

                  <div className="space-y-2 font-mono text-[11px] text-left">
                    <div className="p-3 bg-black/40 border border-[#ff007f]/20 rounded-xl flex gap-2.5 shadow-[inset_0_1px_1px_rgba(255,,255,0.01)]">
                      <span className="text-[#ff007f] font-black shrink-0">[ALERT]</span>
                      <p className="text-zinc-300 leading-normal font-sans font-bold">China PBOC cuts offshore sovereign reference rate by five basis points.</p>
                    </div>
                    <div className="p-3 bg-black/40 border border-[#00f0ff]/20 rounded-xl flex gap-2.5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.01)]">
                      <span className="text-[#00f0ff] font-black shrink-0">[INDICATOR]</span>
                      <p className="text-zinc-300 leading-normal font-sans font-bold">Weekly US initial jobless claims actual 224K vs 220K projection.</p>
                    </div>
                  </div>
                </div>

              </aside>

            </main>
          </div>
        )}

        {/* TAB 2: INGESTION PIPELINE & DEDUPLICAITON ENGINE SIMULATOR */}
        {activeWorkspaceTab === 'pipeline' && (
          <div className="h-full flex flex-col lg:flex-row overflow-hidden p-6 gap-6 text-left select-none" id="crawler-pipeline" style={{ background: '#050512' }}>
            
            {/* COLUMN 1: DEDUPLICATOR SCHEMATIC DIAGRAM AND PIPELINE CONTROLS */}
            <aside className="w-full lg:w-[440px] flex flex-col gap-5 shrink-0" id="deduplicator-schematic-sidebar">
              
              {/* SYSTEM CONTROLS SUMMARY */}
              <div className="bg-[#070717] border-2 border-zinc-800 p-5 rounded-2xl flex flex-col gap-4">
                <div className="border-b border-zinc-800 pb-3 flex items-center justify-between">
                  <div>
                    <span className="text-[9px] font-mono font-black uppercase text-orange-400 tracking-widest block">24-HOUR CRAWLER ENGINE</span>
                    <h3 className="text-sm font-black uppercase text-white tracking-widest">Pipeline Controller</h3>
                  </div>
                  
                  <button
                    onClick={() => setIsPipelineLive(!isPipelineLive)}
                    className={`px-3 py-1.5 rounded-lg font-mono text-[10px] font-black uppercase transition-all flex items-center gap-1.5 cursor-pointer border
                      ${isPipelineLive 
                        ? 'bg-emerald-550/10 text-emerald-400 border-emerald-500/40 shadow-xs' 
                        : 'bg-zinc-800 text-zinc-400 border-zinc-700'}`}
                  >
                    {isPipelineLive ? (
                      <>
                        <RefreshCw className="w-3 h-3 animate-spin" /> Ingest active
                      </>
                    ) : (
                      <>
                        <Pause className="w-3 h-3" /> Paused
                      </>
                    )}
                  </button>
                </div>

                <p className="text-xs text-zinc-300 leading-relaxed font-sans font-semibold">
                  The ClearPath News platform runs continuous multi-layer ingestion. Content is consolidated from 300+ institutional RSS feeds, filtered through strict deduplication matrices, and auto-categorized via cognitive intelligence parameters.
                </p>

                {/* SCHEMATIC FLOW CHART */}
                <div className="bg-black/60 p-4 rounded-xl border border-zinc-800 space-y-3 font-mono text-[11px] select-none text-zinc-400">
                  <div className="text-[#fa521c] font-black text-xs border-b border-zinc-850 pb-1 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5" /> AGENT COGNITIVE SCANNERS
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="w-2 pb-2 mr-1 text-center font-bold">1</span>
                      <div className="flex-1 bg-zinc-900 border border-zinc-800 px-2.5 py-1.5 rounded text-zinc-300 text-[10px] font-bold">
                        GLOBAL HARVESTER - Normalized RSS/SEC/BLS inputs
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="w-2 pb-2 mr-1 text-center font-bold">2</span>
                      <div className="flex-1 bg-zinc-900 border border-zinc-800 px-2.5 py-1.5 rounded text-zinc-300 text-[10px] font-bold">
                        EXACT EQUAL SCANNER - sha256(Title + Feed) collision block
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="w-2 pb-2 mr-1 text-center font-bold">3</span>
                      <div className="flex-1 bg-zinc-900 border border-zinc-800 px-2.5 py-1.5 rounded text-zinc-300 text-[10px] font-bold text-orange-455">
                        SEMANTIC SIMILARITY CHECK - Cosine Overlap index {`>`} 90% rejections
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="w-2 pb-2 mr-1 text-center font-bold">4</span>
                      <div className="flex-1 bg-zinc-900 border border-zinc-800 px-2.5 py-1.5 rounded text-zinc-300 text-[10px] font-bold text-emerald-455">
                        AUTO-ROUTER - Sentiment ratings & market impact scoring
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2.5 text-center font-mono text-[10px] text-zinc-450 border-t border-zinc-855 pt-3.5">
                  <div className="bg-[#101026] p-2 rounded border border-zinc-800/80">
                    <div className="text-zinc-500">Exact Checked</div>
                    <div className="text-[#fa521c] font-black text-sm mt-1">100%</div>
                  </div>
                  <div className="bg-[#101026] p-2 rounded border border-zinc-800/80">
                    <div className="text-zinc-500">Cosine Matrix</div>
                    <div className="text-white font-black text-sm mt-1">90.0%</div>
                  </div>
                  <div className="bg-[#101026] p-2 rounded border border-zinc-800/80">
                    <div className="text-zinc-500">Sim Queue</div>
                    <div className="text-emerald-450 font-black text-xs mt-1">SIM ACTIVE</div>
                  </div>
                </div>

              </div>

              {/* INTERACTIVE COMPLIANCE SANDBOX (Pipeline simulation) */}
              <div className="bg-[#070717] border border-zinc-800 p-5 rounded-2xl flex flex-col gap-4">
                <div>
                  <span className="text-[10px] font-mono font-bold text-[#fa521c] uppercase block mb-0.5">DEDUPLICATION COMPLIANCE SANDBOX</span>
                  <h3 className="text-sm font-black uppercase text-white tracking-widest">Test Pipeline Ingestion</h3>
                </div>

                <p className="text-xs text-zinc-400 font-sans font-semibold leading-relaxed">
                  Test the pipeline scanner of duplicate prevention in action! Enter a headline title. If it is similar or exact to our database items, you will watch the deduplicator block it or auto-cluster it!
                </p>

                <form onSubmit={handleTestIngestion} className="space-y-3.5">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono font-black uppercase text-zinc-500 block">Headline Title String</label>
                    <input
                      type="text"
                      required
                      placeholder="Try writing: Fed Signals Pause Core CPI decreases..."
                      value={pipelineTestTitle}
                      onChange={(e) => setPipelineTestTitle(e.target.value)}
                      className="w-full bg-[#0a0a20] border border-zinc-700 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-orange-550 placeholder-zinc-600"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-mono font-black uppercase text-zinc-500 block">Category Route</label>
                      <select
                        value={pipelineTestCategory}
                        onChange={(e) => setPipelineTestCategory(e.target.value)}
                        className="w-full bg-[#0a0a20] border border-zinc-700 rounded-xl py-2 px-2 text-xs text-white focus:outline-none focus:border-orange-550"
                      >
                        <option value="Forex">Forex</option>
                        <option value="Commodities">Commodities</option>
                        <option value="Crypto">Crypto</option>
                        <option value="Central Banks">Central Banks</option>
                        <option value="Economics">Economics</option>
                      </select>
                    </div>

                    <button
                      type="submit"
                      className="bg-orange-650 hover:bg-orange-600 self-end text-white font-mono font-black tracking-wider text-xs py-2 px-3 rounded-xl uppercase transition-all shadow-md cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <Plus className="w-4 h-4" /> Trigger Parser
                    </button>
                  </div>
                </form>

                {testResultFeedback && (
                  <div className="p-3 bg-zinc-950 border border-zinc-800 rounded-xl font-mono text-[11px] text-zinc-300">
                    <div className="text-orange-400 font-bold mb-1">[SCANNER COMPLETED]</div>
                    <p className="font-sans font-semibold text-xs text-white">{testResultFeedback}</p>
                    <button
                      onClick={() => setTestResultFeedback(null)}
                      className="text-[9px] hover:underline text-[#fa521c] block mt-1.5 uppercase font-bold"
                    >
                      Clear scanner logs
                    </button>
                  </div>
                )}
              </div>

            </aside>

            {/* COLUMN 2: LIVE INGESSION SCROLLING STREAM LOGS */}
            <main className="flex-1 bg-black border border-zinc-800 rounded-2xl flex flex-col overflow-hidden min-h-[400px]" id="crawler-pipeline-visual-terminal">
              
              {/* TERMINAL HEADER */}
              <div className="bg-[#0b0b1c] border-b border-zinc-800 px-5 py-4.5 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <div className="flex gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-rose-500/80 inline-block" />
                    <span className="w-3 h-3 rounded-full bg-yellow-500/80 inline-block" />
                    <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block" />
                  </div>
                  <span className="text-xs font-mono font-black text-zinc-300 tracking-wider">CPMS_INGESTION_CRAWLER_DAEMON.sh</span>
                </div>
                
                <div className="flex items-center gap-3 text-[10px] font-mono text-zinc-500 font-bold">
                  <span>DEDUPLICATION STATUS:</span>
                  <span className="text-emerald-400 font-extrabold animate-pulse">100% SECURE</span>
                </div>
              </div>

              {/* TERMINAL VIEWPORT SCREEN */}
              <div className="flex-1 overflow-y-auto p-5 font-mono text-xs space-y-3.5 custom-scrollbar bg-black/95 select-text" id="pipeline-stream-viewport">
                
                {ingestionLogs.map((log, index) => (
                  <div key={index} className="flex gap-4 items-start leading-snug text-left select-text">
                    <span className="text-zinc-650 shrink-0 select-none">[{log.time}]</span>
                    
                    {log.type === 'incoming' && (
                      <span className="text-blue-400 font-extrabold shrink-0 select-none">[INWARD_WIRE]</span>
                    )}
                    {log.type === 'approved' && (
                      <span className="text-emerald-400 font-extrabold shrink-0 select-none">[COMPLIANT]</span>
                    )}
                    {log.type === 'rejected_exact' && (
                      <span className="text-rose-500 font-extrabold shrink-0 select-none">[DUP_EXACT_BLOCK]</span>
                    )}
                    {log.type === 'rejected_sim' && (
                      <span className="text-orange-400 font-extrabold shrink-0 select-none">[DUP_NEAR_CLUSTER]</span>
                    )}
                    {log.type === 'system' && (
                      <span className="text-zinc-500 font-extrabold shrink-0 select-none">[SYSTEM_NET]</span>
                    )}

                    <p className={`flex-1 font-semibold ${
                      log.type === 'rejected_exact' 
                        ? 'text-rose-350 bg-rose-950/15 border-l-2 border-rose-600 pl-2' 
                        : log.type === 'rejected_sim' 
                        ? 'text-orange-350 bg-orange-950/15 border-l-2 border-orange-500 pl-2'
                        : log.type === 'approved'
                        ? 'text-emerald-350'
                        : 'text-zinc-300'
                    }`}>
                      {log.message}
                    </p>
                  </div>
                ))}

              </div>

              {/* PORTAL CRAWLER STATISTICS STATUS BAR */}
              <footer className="bg-[#0b0b1c] border-t border-zinc-800 px-5 py-3.5 text-[10px] font-mono text-zinc-500 flex justify-between shrink-0">
                <div className="flex items-center gap-4">
                  <span>ACTIVE FEED DIRECTORIES: <strong className="text-white">12 Connected</strong></span>
                  <span>TOTAL PUBLISHED IN STREAM: <strong className="text-white">{articles.length} Cards</strong></span>
                </div>
                <span>DAEMON PROCESS: TCP_3000_INGRES</span>
              </footer>

            </main>
          </div>
        )}

        {/* TAB 3: AI GROUNDED SEARCH SYSTEM (GEMINI INTEGRATED) */}
        {activeWorkspaceTab === 'grounding' && (
          <div className="h-full flex flex-col lg:flex-row overflow-hidden bg-[#050512]" id="ai-search-viewport">
            
            {/* SEARCH PARAMETERS SIDEBAR */}
            <aside className="w-full lg:w-80 bg-[#060613] border-b lg:border-b-0 lg:border-r border-zinc-800/80 flex flex-col shrink-0 p-5 overflow-y-auto select-none" id="ai-search-sidebar">
              <div className="mb-6">
                <span className="text-[11px] font-mono font-black text-orange-400 uppercase tracking-[0.25em] block mb-2">
                  Cognitive Grounding
                </span>
                <h2 className="text-base font-black text-white uppercase tracking-wider mb-2">Grounded Search Engine</h2>
                <p className="text-xs text-zinc-400 leading-relaxed font-sans font-semibold">
                  Leverages modern full-stack Google grounding with active web indexes to automatically extract citations, sentiment metrics, and market impact scoremaps.
                </p>
              </div>

              {/* SEARCH INPUT */}
              <div className="space-y-4 mb-6">
                <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-orange-405 w-4 h-4" />
                  <input 
                    type="text" 
                    placeholder="Search any query, topic, index..." 
                    value={inputVal}
                    onChange={(e) => setInputVal(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handlePerformLiveSearch(inputVal);
                    }}
                    className="w-full bg-[#0a0a20] border border-zinc-700/80 rounded-xl py-3 pl-10 pr-3 text-xs text-white placeholder-zinc-550 focus:outline-none focus:border-orange-550/80 focus:ring-2 focus:ring-orange-550/15"
                  />
                </div>
                
                <button
                  onClick={() => handlePerformLiveSearch(inputVal)}
                  disabled={searchLoading}
                  className="w-full bg-gradient-to-r from-orange-650 to-rose-650 hover:from-orange-600 hover:to-rose-600 text-white font-mono font-black text-xs py-3 rounded-xl border border-orange-500/20 transition-all uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
                >
                  {searchLoading ? (
                    <span className="flex items-center gap-2 text-xs">
                      <span className="w-3.5 h-3.5 border-2 border-white/35 border-t-white rounded-full animate-spin" />
                      GROUNDING LIVE EXTRACTIONS...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2 text-xs font-black tracking-widest">
                      <Search size={14} /> RUN LIVE GROUNDED QUERY
                    </span>
                  )}
                </button>
              </div>

              {/* PRE-DEFINED QUICK COGNITIVE PROMPTS */}
              <div className="space-y-3.5 flex-1 select-none">
                <span className="text-[11px] font-mono font-black text-orange-400 uppercase tracking-[0.2em] block">
                  Institutional Quick Queries
                </span>
                <div className="flex flex-col gap-2 font-mono text-xs">
                  {[
                    "Federal Reserve interest rates",
                    "Bitcoin market sentiment",
                    "Eurozone inflation outlook",
                    "AI semiconductor stock market impact",
                    "NVIDIA GPU shipments news",
                    "Electoral policy global market shifts"
                  ].map((rec) => (
                    <button
                      key={rec}
                      onClick={() => {
                        setInputVal(rec);
                        handlePerformLiveSearch(rec);
                      }}
                      className={`w-full text-left p-3 rounded-xl text-xs transition-all border font-bold cursor-pointer
                        ${liveSearchQuery === rec && !searchError
                          ? 'bg-orange-500/10 text-orange-400 border-orange-500/40 shadow-sm' 
                          : 'bg-[#0f0f2a]/45 border-zinc-800/80 text-zinc-400 hover:bg-zinc-900/60 hover:text-white'
                        }`}
                    >
                      # {rec.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              {/* TELEMETRY FOOTER */}
              <div className="mt-auto pt-6 border-t border-zinc-800 text-[10px] text-zinc-500 font-mono flex flex-col gap-1 select-none">
                <div className="flex items-center justify-between">
                  <span>GROUNDING API:</span>
                  <span className="text-emerald-400 font-extrabold font-mono text-[9px] bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/15">ACTIVE</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>COGNITIVE CORE:</span>
                  <span className="text-white font-bold">gemini-3.5-flash</span>
                </div>
              </div>
            </aside>

            {/* MAIN AI GROUNDED DATA PANEL */}
            <main className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-8 flex flex-col text-left" id="ai-search-report">
              {searchLoading ? (
                <div className="flex-1 flex flex-col items-center justify-center py-20 text-center select-none">
                  <div className="relative w-16 h-16 mb-5 mx-auto">
                    <div className="absolute inset-0 border-4 border-orange-500/20 rounded-full" />
                    <div className="absolute inset-0 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
                    <Search size={22} className="absolute left-1/2 top-1/2 -translate-y-1/2 -translate-x-1/2 text-orange-400 animate-pulse" />
                  </div>
                  <h3 className="text-base font-mono font-black uppercase tracking-wider text-white mb-1.5">Reconciling Google News Grounding</h3>
                  <p className="text-xs text-zinc-400 max-w-sm leading-relaxed mx-auto font-sans font-semibold">
                    Running live web requests against secure news databases and resolving duplicates for: <span className="text-orange-400 font-mono">"{liveSearchQuery}"</span>.
                  </p>
                </div>
              ) : searchError ? (
                <div className="flex-1 flex flex-col items-center justify-center py-16 text-center select-none p-6 bg-rose-950/10 border border-rose-500/25 rounded-2xl max-w-lg mx-auto m-5 text-left">
                  <div className="w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/35 flex items-center justify-center mb-4 text-rose-450 mx-auto">
                    <AlertTriangle size={24} />
                  </div>
                  <h3 className="text-base font-mono font-black text-rose-400 uppercase tracking-widest text-center mb-1.5">Grounded extraction interrupted</h3>
                  <p className="text-xs text-zinc-300 leading-relaxed mb-4 text-center font-sans font-semibold">
                    {searchError}
                  </p>
                  <button 
                    onClick={() => handlePerformLiveSearch(liveSearchQuery)}
                    className="px-4 py-2 bg-rose-500/10 hover:bg-rose-500/25 text-rose-400 font-mono font-black border border-rose-500/30 rounded-xl text-xs transition-all uppercase tracking-wider cursor-pointer mx-auto block"
                  >
                    Retry GROUNDED SCANNER Thread
                  </button>
                </div>
              ) : searchData ? (
                /* ACTUAL RENDERED SEARCH RESULTS SYSTEM */
                <div className="space-y-6">
                  
                  {/* Headline Title summary */}
                  <div className="border-b border-zinc-800 pb-5 flex flex-col md:flex-row md:items-center justify-between gap-5 text-left">
                    <div>
                      <div className="flex items-center gap-2 mb-1.5 font-mono text-[10px] font-black text-orange-400 tracking-[0.25em]">
                        <span className="w-2 h-2 rounded-full bg-orange-400 animate-pulse" />
                        SEGMENT GROUNDED INSIGHTS COGNITIVE BRIEF
                      </div>
                      <h2 className="text-2xl font-black text-white uppercase tracking-wide">
                        {liveSearchQuery}
                      </h2>
                    </div>

                    {/* Overall sentiment score dials / meters */}
                    <div className="bg-[#0b0b1c] border border-zinc-800 rounded-xl p-4 flex items-center gap-5 shrink-0 shadow-sm min-w-[280px]">
                      <div className="text-center select-none">
                        <p className="text-[9px] text-zinc-400 uppercase tracking-wider font-mono font-bold mb-1">Sentiment Meter</p>
                        <span className={`text-sm font-black uppercase px-2 py-0.5 rounded-lg font-mono border block ${
                          searchData.overallSentiment === 'Bullish' 
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                            : searchData.overallSentiment === 'Bearish'
                            ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                            : 'bg-zinc-800 text-zinc-300 border-zinc-700'
                        }`}>
                          {searchData.overallSentiment || 'Neutral'}
                        </span>
                      </div>
                      <div className="flex-1 w-32">
                        <div className="flex justify-between text-[9px] text-zinc-500 font-mono mb-1 font-bold">
                          <span>Bearish</span>
                          <span>Neutral</span>
                          <span>Bullish</span>
                        </div>
                        {/* Interactive gauge tracker */}
                        <div className="w-full h-1.5 bg-gradient-to-r from-rose-600 via-amber-500 to-emerald-500 rounded-full relative">
                          <div 
                            className="absolute -top-1 w-3 h-3 bg-white border border-black rounded-full shadow-sm" 
                            style={{ left: `${searchData.sentimentScore ?? 50}%`, transform: 'translateX(-50%)' }}
                          />
                        </div>
                        <div className="flex justify-between text-[10px] text-zinc-300 font-mono mt-1 font-bold">
                          <span>Score</span>
                          <span>{searchData.sentimentScore ?? 50} / 100</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Operational Summary */}
                  <div className="bg-[#090918] border-2 border-orange-500/15 p-4.5 rounded-2xl relative shadow-md">
                    <div className="absolute right-4 top-4 text-orange-550/10 font-black text-3xl uppercase tracking-widest font-mono">
                      INTEL
                    </div>
                    <span className="text-[10px] font-mono font-black text-orange-400 uppercase tracking-widest block mb-1.5">
                       Analytical Cognitive Summary
                    </span>
                    <p className="text-zinc-100 text-sm leading-relaxed font-sans font-semibold">
                      {searchData.summary}
                    </p>
                  </div>

                  {/* Fallback sandbox warning */}
                  {searchData.demo && (
                    <div className="p-4 bg-[#14120a] border border-amber-500/25 rounded-2xl flex items-center gap-3 text-xs text-amber-300">
                      <AlertTriangle className="shrink-0 text-amber-500 w-5.5 h-5.5 animate-pulse" />
                      <div>
                        <span className="font-bold underline block mb-0.5 uppercase tracking-wide">Cognitive API Falling back</span>
                        Demo routing active. Setup your real <strong>GEMINI_API_KEY</strong> inside <strong>Settings &gt; Secrets</strong> to authenticate live multi-layer web scraping immediately.
                      </div>
                    </div>
                  )}

                  {/* Grounded Headlines feed */}
                  <div className="space-y-4">
                    <h3 className="text-[11px] font-mono font-black uppercase text-orange-400 tracking-wider">
                      Compliance Scanner Wire Outputs ({searchData.headlines?.length || 0})
                    </h3>

                    <div className="grid gap-4">
                      {searchData.headlines && searchData.headlines.length > 0 ? (
                        searchData.headlines.map((item: any, idx: number) => (
                          <div key={idx} className="bg-zinc-950 hover:bg-[#070717]/80 border border-zinc-850 hover:border-orange-500/35 p-5 rounded-2xl transition-all flex flex-col md:flex-row md:items-start gap-4">
                            <div className="shrink-0 flex md:flex-col items-start gap-2 justify-between md:justify-start">
                              <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-lg font-mono border ${
                                item.sentiment === 'Bullish' 
                                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                                  : item.sentiment === 'Bearish'
                                  ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                                  : 'bg-zinc-800 text-zinc-350 border-zinc-700'
                              }`}>
                                {item.sentiment}
                              </span>
                              <span className="text-[9px] text-zinc-450 font-mono md:mt-1 font-bold">
                                Confidence: {item.sentimentScore}%
                              </span>
                            </div>

                            <div className="flex-1 space-y-1.5 text-left">
                              <h4 className="text-sm font-black text-white leading-snug uppercase tracking-wide">
                                {item.title}
                              </h4>
                              <p className="text-xs text-zinc-300 leading-relaxed font-sans font-semibold">
                                {item.description}
                              </p>
                              
                              <div className="flex items-center gap-3 text-[10px] text-zinc-400 font-mono pt-1">
                                <span className="bg-[#0b0b1c] border border-zinc-800 px-2 py-0.5 rounded text-orange-405 font-bold">
                                  {item.sourceName || "Institutional Source"}
                                </span>
                                <span>•</span>
                                <span>{item.date || "Just now"}</span>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-8 text-xs text-zinc-500 font-mono">
                          No news indicators crawled yet.
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Real Search Citations / Source URLs */}
                  <div className="border-t border-zinc-850 pt-5 space-y-3">
                    <span className="text-[11px] font-mono font-black text-orange-400 uppercase tracking-widest block">
                      Google search grounding compliance citations
                    </span>
                    <p className="text-xs text-zinc-400 max-w-xl font-sans font-semibold">
                      This cognitive digest resolved and cross-verified content directly against the following live financial publications:
                    </p>

                    <div className="flex flex-wrap gap-2.5 pt-1">
                      {searchData.citations && searchData.citations.length > 0 ? (
                        searchData.citations.map((cite: any, idx: number) => (
                          <a
                            key={idx}
                            href={cite.uri}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-[#070717] hover:bg-zinc-950 border border-zinc-800 hover:border-orange-500/40 px-3 py-2 rounded-xl text-xs font-bold text-zinc-300 hover:text-[#fa521c] transition-all flex items-center gap-2 shrink-0"
                          >
                            <Globe size={11} className="text-orange-400" />
                            <span className="truncate max-w-[280px] font-mono font-bold text-[10px] uppercase">{cite.title}</span>
                          </a>
                        ))
                      ) : (
                        <span className="text-[10px] text-zinc-600 font-mono">No real citations generated.</span>
                      )}
                    </div>
                  </div>

                </div>
              ) : (
                /* INITIAL NOTIFICATION ON BOARDING */
                <div className="flex-1 flex flex-col items-center justify-center py-20 text-center select-none">
                  <BookOpen className="w-10 h-10 text-zinc-650 mb-3 animate-bounce" />
                  <h3 className="text-sm font-mono font-black text-zinc-400 uppercase tracking-widest mb-1">Pre-parse Grounding Console</h3>
                  <p className="text-xs text-zinc-550 max-w-sm leading-relaxed mb-4 font-sans font-bold">
                    Choose one of the quick parameters on the left sidebar folder to pre-populate analysis or run custom grounding searches.
                  </p>
                </div>
              )}
            </main>
          </div>
        )}

        {/* TAB 4: ECONOMIC DESK CALENDAR */}
        {activeWorkspaceTab === 'calendar' && (
          <div className="h-full p-6 overflow-y-auto custom-scrollbar bg-[#04040c]" id="calendar-view">
            <div className="max-w-6xl mx-auto space-y-6">
              
              <div className="bg-[#070717] border border-zinc-800 p-5 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-left select-none shadow-sm">
                <div>
                  <span className="text-[9px] font-mono font-black uppercase text-orange-400 tracking-[0.25em] block mb-0.5 animate-pulse">WORLD SCHEDULE FEED</span>
                  <h2 className="text-xl font-black text-white uppercase tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-amber-400 to-rose-550">
                    SOCIALLY RESOLVED MACROECONOMIC EVENT AGENDA
                  </h2>
                  <p className="text-xs text-zinc-400 leading-relaxed font-sans font-semibold mt-1">
                    Displays structured records of indicators derived from the BEA, BLS, and central banks across leading currency markets.
                  </p>
                </div>
                
                <span className="text-xs font-mono font-black text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/15">
                  TIMEZONE: GMT -04:00 (EDT)
                </span>
              </div>

              {/* CALENDAR TARGET TABLE */}
              <div className="bg-zinc-950 border border-zinc-850 rounded-2xl overflow-hidden shadow-md">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse font-sans">
                    <thead>
                      <tr className="bg-[#0b0b1c] border-b border-zinc-800 text-[10px] font-mono font-black text-orange-400 uppercase tracking-widest">
                        <th className="py-4 px-5">Release Time</th>
                        <th className="py-4 px-5">Currency</th>
                        <th className="py-4 px-5">Macroeconomic Indicator</th>
                        <th className="py-4 px-5">Significance</th>
                        <th className="py-4 px-5 text-right">Actual</th>
                        <th className="py-4 px-5 text-right">Consensus</th>
                        <th className="py-4 px-5 text-right">Prior</th>
                        <th className="py-4 px-5 text-right">Auto Impact</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-850/80 text-xs font-medium">
                      {calendarData.map((event: any) => (
                        <tr key={event.id} className="hover:bg-[#070718] transition-colors">
                          <td className="py-4 px-5 font-mono text-zinc-300 font-bold">{event.time}</td>
                          <td className="py-4 px-5">
                            <span className="bg-[#12122b] border border-zinc-800 px-2 py-0.5 rounded font-mono text-[10px] text-zinc-200 font-black">
                              {event.currency}
                            </span>
                          </td>
                          <td className="py-4 px-5 text-white font-extrabold">{event.event}</td>
                          <td className="py-4 px-5">
                            <span className={`px-2 py-0.5 rounded-[4px] font-mono text-[9px] font-black border uppercase
                              ${event.importance === 'High' 
                                ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' 
                                : 'bg-amber-500/10 text-amber-400 border-amber-500/20'}`}>
                              {event.importance}
                            </span>
                          </td>
                          <td className="py-4 px-5 text-right font-mono text-zinc-200 font-bold">{event.actual}</td>
                          <td className="py-4 px-5 text-right font-mono text-zinc-450">{event.forecast}</td>
                          <td className="py-4 px-5 text-right font-mono text-zinc-450">{event.previous}</td>
                          <td className="py-4 px-5 text-right">
                            <span className={`px-2 py-0.5 rounded font-mono text-[9px] font-black uppercase
                              ${event.impact === 'Bullish USD'
                                ? 'bg-emerald-500/10 text-emerald-400'
                                : event.impact === 'Bearish EUR'
                                ? 'bg-rose-500/10 text-rose-450'
                                : 'bg-zinc-800 text-zinc-350'}`}>
                              {event.impact}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          </div>
        )}

      </div>

      {/* FULL ARTICLE DETAILED INSIGHT OVERLAY MODAL */}
      {isDetailModalOpen && activeArticle && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md transition-all duration-300">
          <div className="bg-[#0b0c16] border border-white/10 rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto custom-scrollbar shadow-2xl flex flex-col">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.08] bg-black/40 backdrop-blur-md sticky top-0 z-10 shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-black uppercase tracking-widest text-[#ff007f] bg-[#ff007f]/10 px-2.5 py-1 rounded border border-[#ff007f]/20">
                  {activeArticle.category}
                </span>
                <span className="text-[10px] font-mono text-zinc-400 font-bold uppercase tracking-widest">
                  {activeArticle.subcategory}
                </span>
              </div>
              <button
                onClick={() => setIsDetailModalOpen(false)}
                className="p-1 px-3 rounded hover:bg-white/5 text-zinc-400 hover:text-white transition-colors text-xs font-mono font-black border border-white/10"
                aria-label="Close dialog"
              >
                CLOSE [X]
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 md:p-8 space-y-6 text-left">
              
              {/* Title */}
              <div>
                <div className="flex items-center gap-2 text-zinc-500 font-mono text-[10px] font-bold mb-2">
                  <span>PUBLISHED: {activeArticle.timestamp}</span>
                  <span>•</span>
                  <span>IMPORTANCE: {activeArticle.importance.toUpperCase()}</span>
                </div>
                <h1 className="text-xl md:text-2xl font-black text-white leading-snug uppercase tracking-wide">
                  {activeArticle.title}
                </h1>
              </div>

              {/* Subtitle / Description */}
              <div className="p-4 rounded-xl bg-white/[0.02] border-l-2 border-[#ff007f] text-sm text-zinc-300 font-sans font-semibold italic">
                {activeArticle.description}
              </div>

              {/* Cognitive categorization banner widget */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-black/40 border border-white/[0.06] font-mono text-[11px]">
                <div>
                  <div className="text-zinc-500 font-bold uppercase">Ticker Asset</div>
                  <div className="text-white font-extrabold mt-1 text-xs">{activeArticle.asset || 'N/A'}</div>
                </div>
                <div>
                  <div className="text-zinc-500 font-bold uppercase">Confidence Score</div>
                  <div className="text-[#ff007f] font-black mt-1 text-xs">{activeArticle.confidence}</div>
                </div>
                <div>
                  <div className="text-zinc-500 font-bold uppercase">Market sentiment</div>
                  <div className="text-emerald-400 font-bold mt-1 text-xs">{activeArticle.sentiment}</div>
                </div>
                <div>
                  <div className="text-zinc-500 font-bold uppercase">Expected Impact</div>
                  <div className="text-rose-450 font-black mt-1 text-xs">{activeArticle.marketImpact}</div>
                </div>
              </div>

              {/* Article Image Spotlight */}
              <div className="w-full relative h-56 rounded-xl overflow-hidden border border-white/5">
                <img 
                  src="https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?auto=format&fit=crop&w=800&q=80" 
                  alt="Article Editorial" 
                  className="w-full h-full object-cover opacity-90"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />
              </div>

              {/* Article Detailed Content */}
              <div className="space-y-4">
                <span className="text-[10px] font-mono font-black uppercase text-zinc-500 tracking-wider block border-b border-white/[0.06] pb-1.5">FULL UNABRIDGED TRANSMISSION</span>
                <p className="text-sm text-zinc-350 leading-relaxed font-sans font-medium whitespace-pre-line">
                  {activeArticle.content}
                </p>
              </div>

              {/* Key Takeaways */}
              {activeArticle.bulletPoints && activeArticle.bulletPoints.length > 0 && (
                <div className="p-5 rounded-2xl bg-[#ff007f]/5 border border-[#ff007f]/10 space-y-3">
                  <h3 className="text-xs font-mono font-black uppercase text-[#ff007f] tracking-widest flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#ff007f] shadow-[0_0_8px_#ff007f]" />
                    Executive Impact Bulletins
                  </h3>
                  <ul className="space-y-3 text-xs text-zinc-300 font-semibold leading-relaxed">
                    {activeArticle.bulletPoints.map((bp, idx) => (
                      <li key={idx} className="flex gap-2.5 items-start">
                        <span className="text-[#00ffff] font-mono font-black">[{idx + 1}]</span>
                        <span>{bp}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Sources Verification */}
              <div className="p-4 rounded-xl bg-white/[0.01] border border-white/[0.05] space-y-2">
                <span className="text-[9px] font-mono font-bold uppercase text-zinc-500 block">Verified Source Cluster</span>
                <div className="flex flex-wrap gap-2">
                  {activeArticle.sources && activeArticle.sources.map((src, i) => (
                    <span key={i} className="bg-[#12122d] border border-white/[0.06] px-2.5 py-1 rounded font-mono text-[10px] text-zinc-400">
                      📡 {src.name} • <span className="text-pink-400 font-bold">{src.date}</span>
                    </span>
                  ))}
                </div>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-white/[0.08] bg-black/40 flex items-center justify-end z-10 shrink-0">
              <button
                onClick={() => setIsDetailModalOpen(false)}
                className="px-6 py-2.5 bg-gradient-to-r from-[#ff007f] to-[#5d00ff] text-white font-mono font-black text-xs uppercase tracking-widest rounded-xl text-center hover:opacity-90 active:scale-95 transition-all shadow-[0_4px_12px_rgba(255,0,127,0.25)]"
              >
                DISMISS DOCUMENT
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
