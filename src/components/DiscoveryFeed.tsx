import React, { useState, useMemo } from 'react';
import KillZones from './KillZones';
import ClearPathLiveTicker from './ClearPathLiveTicker';
import { 
  Compass, 
  Activity, 
  BarChart3, 
  Globe, 
  Cpu, 
  BookOpen, 
  Newspaper, 
  User, 
  Shield, 
  Terminal, 
  Bell, 
  Search, 
  Layers, 
  RotateCw, 
  Sparkles, 
  Flame, 
  Clock, 
  Send, 
  Check, 
  MessageSquare, 
  Calendar, 
  ShieldCheck, 
  X, 
  Settings, 
  XCircle,
  HelpCircle,
  ArrowRight,
  ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface DiscoveryFeedProps {
  onTabChange: (tabId: string) => void;
  profile: {
    id: string;
    name: string;
    avatar?: string;
    avatarUrl?: string;
    text?: string;
    border?: string;
    bg?: string;
  };
  showHomepageContacts?: boolean;
  onSelectContact?: (contact: any) => void;
  showTerminalMatrixNoise?: boolean;
}

interface Comment {
  id: string;
  author: string;
  avatar: string;
  text: string;
  time: string;
  isResolved?: boolean;
  replies?: string[];
}

interface Article {
  id: string;
  title: string;
  author: string;
  avatar: string;
  date: string;
  category: 'macro' | 'crypto' | 'forex' | 'equity';
  desk: string;
  content: string[];
  highlightedText: string;
  tooltipText: string;
  isApproved: boolean;
  comments: Comment[];
}

export default function DiscoveryFeed({ 
  onTabChange, 
  profile,
  showHomepageContacts = false,
  onSelectContact,
  showTerminalMatrixNoise = false
}: DiscoveryFeedProps) {
  // Navigation & View Toggles
  const [activeSegment, setActiveSegment] = useState<'modules' | 'newsroom'>('modules');
  const [selectedSector, setSelectedSector] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const contacts = [
    { id: 1, name: 'Andrei Mashrin', status: 'online', img: '' },
    { id: 2, name: 'Aryn Jacobssen', status: 'offline', img: '' },
    { id: 3, name: 'Carole Landu', status: 'offline', img: '' },
    { id: 4, name: 'Chineze Afa', status: 'online', img: '' },
    { id: 5, name: 'Mok Kwang', status: 'online', img: '' },
    { id: 6, name: 'Naomi Yepes', status: 'online', img: '' },
  ];

  const getAvatar = (authorName: string, avatarUrlOfAuthor: string) => {
    if (authorName === 'Clear Path Trader' || authorName === 'Clear Path Creator' || authorName === 'Dan' || authorName === 'Gordon') {
      return profile?.avatarUrl || profile?.avatar || 'https://i.postimg.cc/Vshdgqvt/83dd53f6-dc2e-475f-854a-b1cfe4b7e8d7.png';
    }
    return avatarUrlOfAuthor;
  };
  
  // Custom Modals / Interactive States
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [importSettings, setImportSettings] = useState(true);
  const [removeOldVersions, setRemoveOldVersions] = useState(false);
  const [updatingEngine, setUpdatingEngine] = useState(false);
  const [updatePercent, setUpdatePercent] = useState(0);
  const [engineStatus, setEngineStatus] = useState<'pending_update' | 'fully_updated'>('pending_update');
  const [hasAcceptedClearance, setHasAcceptedClearance] = useState(false);
  
  // Premium background calibration
  const [visualSpeed, setVisualSpeed] = useState<'slow' | 'fast' | 'frozen'>('slow');

  // Selected Exchange state under "Primary Pipelines"
  const [selectedExchange, setSelectedExchange] = useState<string>('USA');

  // Quant Signal Broadcast Flash Confirmation
  const [showSignalFlash, setShowSignalFlash] = useState(false);
  const [flashedTitle, setFlashedTitle] = useState('');
  const [isDispatchPipelinesCollapsed, setIsDispatchPipelinesCollapsed] = useState(() => localStorage.getItem('cp_dispatch_collapsed') === 'true');

  // CodePen 1: Editorial Desk Articles & Inline comment replies State
  const [articles, setArticles] = useState<Article[]>([
    {
      id: 'art-1',
      title: 'Federal Reserve Signals Extended Pause on Interest Rates as Wholesale Core CPI Cools Down',
      author: 'Richard Anthony',
      avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=120&auto=format&fit=crop&q=80',
      date: '05/29/2026',
      category: 'macro',
      desk: 'Wall Street Desks',
      content: [
        'A comprehensive review of secondary debt auctions and capital reserve mandates suggests that the Federal Reserve will defer further tightening cycles through the autumn quarter, citing a structural flattening in core consumer expenditure indices.',
        'Sovereign dealers noted an immediate stabilization across benchmark ten-year bond placements, leading to widespread liquidation of short-term hedge portfolios that have held bearish macro outlooks since the mid-quarter volatility spike.',
        'Market participants are heavily anchoring their portfolios around the belief that liquidity injections will carry defensive equities to pre-correction levels, although raw agricultural indices remain highly volatile under supply disruptions.'
      ],
      highlightedText: 'Hayley was bad at failing because she had never had to. Sound familiar? In modern trading desks, junior macro analysts face the exact same cognitive paralysis under unexpected rate adjustments.',
      tooltipText: 'Is this macro valuation matrix calibrated properly, or does it dangerously underweight sovereign central capital drain in emerging markets?',
      isApproved: false,
      comments: [
        {
          id: 'comment-1',
          author: 'Clear Path Trader',
          avatar: 'https://i.postimg.cc/Vshdgqvt/83dd53f6-dc2e-475f-854a-b1cfe4b7e8d7.png',
          text: 'Does this commentary add concrete value to quantitative trading desks outrunning central intervention, or is it overly speculative?',
          time: '2 hours ago',
          isResolved: false,
          replies: ['We should cross-reference this with the Tokyo regional swaps catalog before releasing.']
        }
      ]
    },
    {
      id: 'art-2',
      title: 'Stress-Testing Decentralized Protocol Networks Under Automated Market Maker Liquidity Shocks',
      author: 'Bryan Weber',
      avatar: 'https://i.postimg.cc/Qtp6XQt4/WEBER3.png',
      date: '05/28/2026',
      category: 'crypto',
      desk: 'Digital Asset Desk',
      content: [
        'A simulated flash-drain event targeting standard automated market makers (AMMs) has revealed extreme vulnerabilities in regional validator latency metrics, indicating systemic risk during peak leveraged unwinding cascades.',
        'By modeling cross-layer consensus drifts, security architects demonstrated that regional slippage overrides were completely bypassed during the simulated gas tariff anomalies, resulting in severe local price deviations.'
      ],
      highlightedText: 'Validator latency drifts triggered an immediate validation collapse, forcing several nodes onto speculative forks.',
      tooltipText: 'Wait, did the transaction queues actually fail due to gas surges or due to validator collusion? Let\'s make sure we separate these variables in the publication.',
      isApproved: false,
      comments: [
        {
          id: 'comment-2',
          author: 'Brent Miller',
          avatar: 'https://i.postimg.cc/D0TMsCDP/Chat-GPT-Image-May-2-2026-10-41-02-AM.png',
          text: 'Excellent breakdown. Let\'s verify the regional protocol latency maps against our internal Tokyo cloud servers before pushing to general feed.',
          time: 'Yesterday',
          isResolved: false,
          replies: []
        }
      ]
    }
  ]);

  const [activeArticleId, setActiveArticleId] = useState<string>('art-1');
  const [replyText, setReplyText] = useState('');

  const activeArticle = useMemo(() => {
    return articles.find(a => a.id === activeArticleId) || articles[0];
  }, [articles, activeArticleId]);

  // Reply back to inline comments
  const handleAddReply = (commentId: string) => {
    if (!replyText.trim()) return;
    setArticles(prev => prev.map(art => {
      if (art.id === activeArticleId) {
        return {
          ...art,
          comments: art.comments.map(comm => {
            if (comm.id === commentId) {
              return {
                ...comm,
                replies: [...(comm.replies || []), replyText]
              };
            }
            return comm;
          })
        };
      }
      return art;
    }));
    setReplyText('');
  };

  const handleResolveComment = (commentId: string) => {
    setArticles(prev => prev.map(art => {
      if (art.id === activeArticleId) {
        return {
          ...art,
          comments: art.comments.map(comm => {
            if (comm.id === commentId) {
              return { ...comm, isResolved: !comm.isResolved };
            }
            return comm;
          })
        };
      }
      return art;
    }));
  };

  const triggerSignalRelease = (art: Article) => {
    setFlashedTitle(art.title);
    setShowSignalFlash(true);
    setArticles(prev => prev.map(a => {
      if (a.id === art.id) {
        return { ...a, isApproved: true };
      }
      return a;
    }));
    setTimeout(() => {
      setShowSignalFlash(false);
    }, 3500);
  };

  const handleRevokeRelease = (artId: string) => {
    setArticles(prev => prev.map(a => {
      if (a.id === artId) {
        return { ...a, isApproved: false };
      }
      return a;
    }));
  };

  // Big Sur interactive core calibrator modal logic
  const handleStartUpdateSequence = () => {
    setUpdatingEngine(true);
    setUpdatePercent(0);
    const interval = setInterval(() => {
      setUpdatePercent(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setUpdatingEngine(false);
          setIsUpdateModalOpen(false);
          setEngineStatus('fully_updated');
          return 100;
        }
        return prev + 10;
      });
    }, 150);
  };

  // Clean layout filtering
  const filteredArticles = useMemo(() => {
    return articles.filter(art => {
      const matchDesk = selectedSector === 'all' || art.category === selectedSector;
      const matchSearch = art.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          art.author.toLowerCase().includes(searchQuery.toLowerCase());
      return matchDesk && matchSearch;
    });
  }, [articles, selectedSector, searchQuery]);

  return (
    <div className="w-full text-white font-sans rounded-3xl min-h-[90vh] flex flex-col items-center justify-start relative overflow-visible p-3 md:p-6" id="super_comb_homepage_root">
      
      {/* BACKGROUND GRAPHIC OR REAL-TIME COMPUTER SCIENCE PARALLAX EFFECT */}
      <div className="absolute inset-0 z-0 pointer-events-none" id="glass_canvas_ambient_backing_nodes">
        <div className="absolute inset-0 bg-radial-gradient from-zinc-950 via-zinc-950 to-black opacity-95" />
        
        {/* Animated neon circles reflecting live market heat */}
        <motion.div 
          animate={{
            scale: visualSpeed === 'frozen' ? 1 : [1, 1.15, 1],
            opacity: visualSpeed === 'frozen' ? 0.25 : [0.25, 0.45, 0.25],
            rotate: visualSpeed === 'frozen' ? 0 : [0, 360]
          }}
          transition={{
            duration: visualSpeed === 'fast' ? 10 : 25,
            repeat: Infinity,
            ease: "linear"
          }}
          className="absolute -top-[25%] -left-[10%] w-[60%] h-[65%] rounded-full bg-gradient-to-tr from-[#FF00C8]/25 via-[#7A3BFF]/10 to-[#00D9FF]/5 blur-[120px]" 
        />
        <motion.div 
          animate={{
            scale: visualSpeed === 'frozen' ? 1 : [1, 1.2, 1],
            opacity: visualSpeed === 'frozen' ? 0.15 : [0.15, 0.35, 0.15],
            rotate: visualSpeed === 'frozen' ? 0 : [360, 0]
          }}
          transition={{
            duration: visualSpeed === 'fast' ? 12 : 30,
            repeat: Infinity,
            ease: "linear"
          }}
          className="absolute -bottom-[30%] -right-[15%] w-[70%] h-[75%] rounded-full bg-gradient-to-br from-[#00FFFF]/10 via-[#FF00AA]/5 to-[#7A3BFF]/5 blur-[140px]" 
        />

        {/* Binary grid vector background overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:24px_24px] opacity-65" />
      </div>

      {/* FLASH SUCCESS RELEASE DEPLOYED BROADCAST OVERLAY */}
      <AnimatePresence>
        {showSignalFlash && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md"
            id="signal_broadcast_flash_banner"
          >
            <div className="max-w-2xl bg-zinc-950 border border-pink-500/40 p-8 rounded-3xl text-center relative shadow-[0_0_80px_rgba(255,0,200,0.30)]">
              <div className="absolute top-4 right-4 text-zinc-500">
                <ShieldCheck size={28} className="text-[#FF00C8] animate-bounce" />
              </div>
              <div className="w-16 h-16 bg-[#FF00C8]/10 border border-[#FF00C8]/35 rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_20px_rgba(255,0,200,0.2)]">
                <Flame size={32} className="text-[#FF00C8] animate-pulse" />
              </div>
              <span className="text-xs tracking-[0.4em] font-mono text-[#00D9FF] uppercase font-black block mb-2">
                ⚡ SECURE TRANSMISSION COMPLETED
              </span>
              <h2 className="text-2xl md:text-3xl font-cinzel font-black uppercase text-white tracking-tight leading-snug mb-3">
                Analytics Report Transmitted Successfully
              </h2>
              <p className="text-sm text-zinc-300 font-mono italic max-w-lg mx-auto mb-6 bg-zinc-900 border border-zinc-800 p-4 rounded-xl leading-relaxed">
                "{flashedTitle}"
              </p>
              <div className="text-xs text-zinc-400 font-mono tracking-wide leading-relaxed">
                Dispatched into unified brokerage indexes, live analytical chart buffers, and regional TradingView widget matrix clusters across institutional departments.
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CORE COMBINED GLASSMORPHISM MAIN BOX CONTAINER (CodePen 2 base layout architecture) */}
      <div 
        className="w-full max-w-[1280px] bg-white/5 border border-white/10 rounded-[2.5rem] backdrop-blur-[35px] shadow-[0_24px_80px_rgba(0,0,0,0.65)] flex flex-col lg:overflow-hidden overflow-visible z-10"
        id="glassmorphic_big_sur_inner_shell"
      >
        
        {/* TOP GLOW BAR (Window header style from CodePen 2) */}
        <div className="h-14 border-b border-white/10 px-6 md:px-8 flex items-center justify-between shrink-0 bg-[#080816]/75" id="big_sur_header_bar">
          <div className="flex items-center gap-2">
            
            {/* Clear Path custom badge replacing obsolete Apple dots */}
            <div className="flex items-center gap-2.5 mr-6 select-none bg-black/50 border border-[#7A3BFF]/40 px-3.5 py-1.5 rounded-xl shadow-[0_0_15px_rgba(122,59,255,0.15)]">
              <span className="w-2.5 h-2.5 rounded-full bg-[#FF00C8] animate-pulse shadow-[0_0_10px_rgba(255,0,200,0.8)]" />
              <span className="text-xs font-mono tracking-[0.25em] font-black text-[#00D9FF]">CPMS CORE</span>
            </div>

            {/* Quick Segment switch button for top selector */}
            <div className="flex bg-black/40 p-1 rounded-xl border border-zinc-800 text-xs font-mono ml-2" id="segmented_control_panel">
              <button
                onClick={() => setActiveSegment('modules')}
                style={activeSegment === 'modules' ? { background: 'linear-gradient(90deg, #FF00C8 0%, #7A3BFF 50%, #00D9FF 100%)' } : {}}
                className={`px-4 py-1.5 rounded-lg font-black font-cinzel tracking-wider transition-all flex items-center gap-1.5 cursor-pointer uppercase ${activeSegment === 'modules' ? 'text-white shadow-lg' : 'text-zinc-400 hover:text-white'}`}
              >
                <Layers size={13} />
                CPMS Launcher
              </button>
              <button
                onClick={() => setActiveSegment('newsroom')}
                style={activeSegment === 'newsroom' ? { background: 'linear-gradient(90deg, #FF00C8 0%, #7A3BFF 50%, #00D9FF 100%)' } : {}}
                className={`px-4 py-1.5 rounded-lg font-black font-cinzel tracking-wider transition-all flex items-center gap-1.5 cursor-pointer uppercase ${activeSegment === 'newsroom' ? 'text-white shadow-lg' : 'text-zinc-400 hover:text-white'}`}
              >
                <Newspaper size={13} />
                CPMS Financial Newsroom
              </button>
            </div>
          </div>

          {/* Quick calibration indicators */}
          <div className="flex items-center gap-4">
            {/* Speed controller */}
            <div className="hidden md:flex items-center gap-1 bg-black/40 p-1 rounded-lg border border-zinc-800 text-xs font-mono">
              <span className="text-zinc-500 px-1.5">WAVE SPEED:</span>
              <button 
                onClick={() => setVisualSpeed('slow')} 
                className={`px-2 py-0.5 rounded font-bold ${visualSpeed === 'slow' ? 'bg-[#7A3BFF]/50 text-white' : 'text-zinc-400'}`}
              >
                1X
              </button>
              <button 
                onClick={() => setVisualSpeed('fast')} 
                className={`px-2 py-0.5 rounded font-bold ${visualSpeed === 'fast' ? 'bg-[#FF00C8]/50 text-white animate-pulse' : 'text-zinc-400'}`}
              >
                2X
              </button>
              <button 
                onClick={() => setVisualSpeed('frozen')} 
                className={`px-2 py-0.5 rounded font-bold ${visualSpeed === 'frozen' ? 'bg-zinc-800 text-red-500' : 'text-zinc-400'}`}
              >
                FREEZE
              </button>
            </div>

            {/* Alert bell count */}
            <div className="relative p-1 px-2.5 bg-zinc-900/60 border border-zinc-850 rounded-xl flex items-center gap-2">
              <Bell size={14} className="text-[#FF00C8] animate-pulse" />
              <span className="text-xs font-mono font-black text-white">3</span>
            </div>

            {/* User credentials */}
            <div className="flex items-center gap-2 bg-black/35 rounded-2xl p-1 pr-3 border border-zinc-800 text-left">
              <img 
                className="w-7 h-7 rounded-full object-cover border border-[#FF00C8]" 
                src={profile?.avatarUrl || profile?.avatar || "https://i.postimg.cc/Vshdgqvt/83dd53f6-dc2e-475f-854a-b1cfe4b7e8d7.png"} 
                alt="Dan" 
              />
              <div className="hidden lg:block leading-none text-xs">
                <p className="font-extrabold text-zinc-200">Clear Path Trader</p>
                <p className="text-[10px] text-[#00D9FF] font-mono tracking-wider">Chief Administrator, CEO, Creator & Founder</p>
              </div>
            </div>
          </div>
        </div>

        {/* LOWER WRAPPER: SIDEBAR + MAIN (Aysenur's structural framework layout) */}
        <div className="flex flex-col lg:flex-row min-h-[760px] lg:overflow-hidden overflow-visible" id="lower_main_shell">
          
          {/* 1. LEFT SIDE DECK RAIL (Glass Leftside Navigation sidebar) */}
          <aside className="w-full lg:w-60 bg-zinc-950/40 border-b lg:border-b-0 lg:border-r border-white/10 p-5 shrink-0 flex flex-col" id="big_sur_left_rail">
            
            {/* TITLE HEADER */}
            <div className="mb-6 pb-4 border-b border-white/5 select-none text-left">
              <span className="text-[10px] tracking-[0.3em] font-mono text-[#FF00C8] block mb-1 font-black">
                CORE SYSTEM DESK
              </span>
              <p className="text-base font-cinzel font-black uppercase text-zinc-100 tracking-widest">
                Clear Path Terminal
              </p>
            </div>            {/* DIRECTORIES SECTOR (Aysenur menu categories structure) */}
            <div className="space-y-6 flex-1 text-left select-none">
              
              <div>
                <span className="text-xs text-[#00D9FF] font-black uppercase tracking-[0.25em] block mb-3 font-mono">
                  Sector Streams
                </span>
                <div className="space-y-1.5">
                  <button
                    onClick={() => { setSelectedSector('all'); setActiveSegment('modules'); }}
                    className={`w-full py-3 px-3.5 rounded-xl flex items-center justify-start gap-3.5 text-sm font-black tracking-wide transition-all ${
                      selectedSector === 'all' && activeSegment === 'modules'
                        ? 'bg-[#FF00C8]/15 text-[#FF00C8] border border-[#FF00C8]/40 shadow-[0_0_15px_rgba(255,0,200,0.15)]'
                        : 'text-zinc-450 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <Compass size={16} className="text-[#FF00C8]" />
                    All Installed Modules
                  </button>
                  <button
                    onClick={() => { setSelectedSector('macro'); setActiveSegment('newsroom'); }}
                    className={`w-full py-3 px-3.5 rounded-xl flex items-center justify-start gap-3.5 text-sm font-black tracking-wide transition-all ${
                      selectedSector === 'macro' && activeSegment === 'newsroom'
                        ? 'bg-[#00D9FF]/15 text-[#00D9FF] border border-[#00D9FF]/40 shadow-[0_0_15px_rgba(0,217,255,0.15)]'
                        : 'text-zinc-450 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <Globe size={16} className="text-[#00D9FF]" />
                    Macro Desks
                    <span className="ml-auto text-xs font-mono font-bold bg-[#FF00C8] text-white px-2 py-0.5 rounded-full shadow-[0_0_8px_rgba(255,0,200,0.4)]">
                      1
                    </span>
                  </button>
                  <button
                    onClick={() => { setSelectedSector('crypto'); setActiveSegment('newsroom'); }}
                    className={`w-full py-3 px-3.5 rounded-xl flex items-center justify-start gap-3.5 text-sm font-black tracking-wide transition-all ${
                      selectedSector === 'crypto' && activeSegment === 'newsroom'
                        ? 'bg-[#7A3BFF]/15 text-[#7A3BFF] border border-[#7A3BFF]/40 shadow-[0_0_15px_rgba(122,59,255,0.15)]'
                        : 'text-zinc-450 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <Cpu size={16} className="text-purple-400" />
                    Digital Protocol Systems
                  </button>
                </div>
              </div>

              <div>
                <span className="text-xs text-zinc-400 font-black uppercase tracking-[0.25em] block mb-3 font-mono">
                  Primary Pipelines
                </span>
                <div className="space-y-1.5">
                  <button 
                    onClick={() => onTabChange('StrictlyCharts')}
                    className="w-full text-left py-3 px-3.5 rounded-xl flex items-center gap-3.5 text-sm text-zinc-300 hover:bg-white/5 hover:text-white transition-all font-bold"
                  >
                    <BarChart3 size={16} className="text-[#00FFFF]" />
                    Institutional Charting
                  </button>
                  <button 
                    onClick={() => onTabChange('CapitalFlow')}
                    className="w-full text-left py-3 px-3.5 rounded-xl flex items-center gap-3.5 text-sm text-zinc-300 hover:bg-white/5 hover:text-white transition-all font-bold"
                  >
                    <Sparkles size={16} className="text-emerald-400" />
                    Geographic Flow Analytics
                  </button>
                </div>

                {/* Exchanges dropdown container under Primary Pipelines */}
                <div 
                  className="mt-4 p-4 rounded-xl border bg-black/40 backdrop-blur-md transition-all duration-300"
                  style={{ borderColor: 'rgba(255, 255, 255, 0.08)' }}
                >
                  <label className="text-[9px] font-black tracking-[0.25em] text-zinc-500 uppercase block mb-2 font-mono">
                    Exchange Pipelines
                  </label>
                  
                  <div className="relative">
                    <select
                      value={selectedExchange}
                      onChange={(e) => setSelectedExchange(e.target.value)}
                      className="w-full bg-zinc-900 border text-[11px] font-black tracking-wider uppercase rounded-lg py-2.5 pl-3 pr-8 text-zinc-200 outline-none cursor-pointer hover:border-white/20 transition-all appearance-none"
                      style={{ 
                        borderColor: 'rgba(0, 217, 255, 0.25)',
                        color: '#00D9FF'
                      }}
                    >
                      <option value="USA" className="bg-zinc-950 text-white font-bold">USA — NYSE / NASDAQ</option>
                      <option value="UK" className="bg-zinc-950 text-white font-bold">UK — LSE</option>
                      <option value="Germany" className="bg-zinc-950 text-white font-bold">Germany — XETRA</option>
                      <option value="France" className="bg-zinc-950 text-white font-bold">France — Euronext Paris</option>
                      <option value="Spain" className="bg-zinc-950 text-white font-bold">Spain — BME</option>
                      <option value="Italy" className="bg-zinc-950 text-white font-bold">Italy — Borsa Italiana</option>
                      <option value="Switzerland" className="bg-zinc-950 text-white font-bold">Switzerland — SIX</option>
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-zinc-400">
                      <ChevronDown size={14} className="text-[#00D9FF]" />
                    </div>
                  </div>

                  {/* Operational diagnostics panel representing actual pipeline specs */}
                  <div className="mt-3 bg-zinc-950/70 rounded-lg p-2.5 border border-white/5 space-y-2 font-mono text-[9px] text-zinc-400">
                    <div className="flex justify-between items-center">
                      <span className="text-zinc-500 uppercase tracking-widest font-black">PIPELINE:</span>
                      <span className="text-emerald-400 font-extrabold flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse inline-block" />
                        SYNCHRONIZED
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-zinc-500 uppercase tracking-widest font-black">LATENCY:</span>
                      <span className="text-zinc-300 font-extrabold">
                        {selectedExchange === 'USA' && '12ms (Direct)'}
                        {selectedExchange === 'UK' && '28ms (London Rail)'}
                        {selectedExchange === 'Germany' && '32ms (Frankfurt)'}
                        {selectedExchange === 'France' && '35ms (Paris Tunnel)'}
                        {selectedExchange === 'Spain' && '41ms (BME Madrid)'}
                        {selectedExchange === 'Italy' && '44ms (Milan Hub)'}
                        {selectedExchange === 'Switzerland' && '31ms (SIX Zurich)'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-zinc-500 uppercase tracking-widest font-black">STATION ID:</span>
                      <span className="text-[#00D9FF] font-extrabold">
                        EP-{selectedExchange}-09X
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <span className="text-xs text-zinc-500 font-black uppercase tracking-[0.25em] block mb-3 font-mono">
                  Regulatory Links
                </span>
                <div className="space-y-1.5 text-sm text-zinc-400 font-bold">
                  <button 
                    onClick={() => onTabChange('MeetTheBoard')}
                    className="w-full text-left py-2 px-3 rounded-lg hover:text-zinc-200 hover:bg-white/5 transition-all flex items-center gap-2.5"
                  >
                    <Shield size={14} className="text-[#FF00AA]" />
                    Meet the Board Officers
                  </button>
                  <button 
                    onClick={() => onTabChange('TrainingBoard')}
                    className="w-full text-left py-2 px-3 rounded-lg hover:text-zinc-200 hover:bg-white/5 transition-all flex items-center gap-2.5"
                  >
                    <BookOpen size={14} className="text-[#00D9FF]" />
                    Active Training Board
                  </button>
                </div>
              </div>

            </div>

            {/* DEVELOPER CONNECTION LINK */}
            <div id="developer-connection-link-block" className="my-4 p-3 bg-zinc-950/90 border border-[#00FFFF]/30 rounded-xl text-left select-none shadow-[0_0_12px_rgba(0,255,255,0.05)]">
              <span id="dev-portal-label" className="text-[9px] text-[#00D9FF] font-black uppercase tracking-wider block mb-1">
                🔗 SYSTEM WORKSPACE
              </span>
              <a 
                id="dev-portal-link"
                href="https://aistudio.google.com/apps/f544fbce-0e7e-4a8b-b7e3-6356cb380f6b?showAssistant=true&project=gen-lang-client-0175638468&showPreview=true"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[10px] text-white hover:text-[#00ffff] font-mono break-all leading-normal flex items-center gap-1 hover:underline font-bold"
              >
                Project Developer Portal
              </a>
            </div>

            {/* FOOTER METRICS DECK */}
            <div className="mt-auto pt-4 border-t border-white/5 text-xs text-zinc-400 font-mono text-left select-none">
              <div className="flex justify-between items-center mb-1">
                <span>Core Temperature:</span>
                <span className="text-emerald-400 font-bold">STABLE</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Network Ping:</span>
                <span className="text-cyan-400 font-bold">12ms</span>
              </div>
            </div>
          </aside>

          {/* 2. DYNAMIC MAIN PORT PANEL (Renders Segment view custom combined) */}
          <main className="flex-1 overflow-y-auto custom-scrollbar bg-black/40 backdrop-blur-md flex flex-col" id="big_sur_viewport">
            
            {/* TAB VIEW 1: MODULES LAUNCHPAY LAUNCHPAD (CodePen 2 visual implementation) */}
            {activeSegment === 'modules' && (
              <div className="p-6 md:p-8 flex flex-col text-left space-y-6" id="modules_view_panel">
                
                {/* GLOBAL INTRO PROMOTIONAL CARD (Adobe banner theme but customized for CPMS) */}
                <div 
                  className="w-full rounded-2xl p-4 md:p-6 relative overflow-hidden flex flex-col md:flex-row justify-between items-center shadow-[0_10px_30px_rgba(255,0,200,0.12)] select-none"
                  style={{ background: 'linear-gradient(135deg, #FF00C8 0%, #7A3BFF 50%, #00D9FF 100%)' }}
                  id="promo_neon_gradient_header"
                >
                  {/* Subtle textures */}
                  <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 pointer-events-none" />
                  
                  {/* Left content block */}
                  <div className="max-w-xl text-white z-10 space-y-2.5">
                    <span className="text-[9px] tracking-[0.2em] font-mono bg-black/60 text-[#00D9FF] px-2.5 py-1 rounded-full uppercase font-black border border-[#00D9FF]/30 inline-block shadow-sm">
                      ⚡ CPMS SOVEREIGN BROADCAST HUB
                    </span>
                    <h2 className="text-xl md:text-2xl lg:text-3xl font-cinzel font-black uppercase leading-tight tracking-wide text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.4)]">
                      Access Secure Intelligence Channels
                    </h2>
                    <p className="text-xs md:text-sm text-zinc-100 leading-relaxed font-bold tracking-wide">
                      Establish rapid latency connection loops, analyze neural capital movements, and publish verified macroeconomic research analytics safely.
                    </p>
                    <div className="pt-2">
                      <button 
                        onClick={() => setActiveSegment('newsroom')}
                        className="bg-zinc-950 hover:bg-black text-white hover:text-[#00D9FF] border-2 border-white/20 hover:border-[#00D9FF]/40 transition-all font-mono text-xs uppercase tracking-wider font-extrabold px-4 py-2.5 rounded-xl flex items-center gap-2.5 cursor-pointer shadow-xl hover:scale-[1.02]"
                      >
                        Launch Editorial Wire <ArrowRight size={14} className="text-[#FF00C8] animate-pulse" />
                      </button>
                    </div>
                  </div>

                  {/* Right abstract visual illustration (Mikołaj style elegant overlay) */}
                  <div className="relative mt-4 md:mt-0 shrink-0 z-10" id="abstract_overlay_render">
                    <div className="w-28 h-28 rounded-2xl bg-black/50 backdrop-blur-md border border-white/20 flex items-center justify-center relative shadow-2xl overflow-hidden group">
                      <div className="absolute -inset-1 bg-gradient-to-r from-[#FF00C8] via-[#7A3BFF] to-[#00D9FF] blur opacity-40 group-hover:opacity-80 transition duration-1000 group-hover:duration-200" />
                      <div className="relative flex flex-col items-center">
                        <Terminal size={26} className="text-[#00FFFF] mb-1 animate-pulse" />
                        <span className="text-[10px] font-mono text-zinc-300 uppercase tracking-widest font-black">System Ready</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* PROPRIETARY INSTALLED ENGINES SECTION (Photoshop/Illustrator inspired cards) */}
                <div className="space-y-4" id="installed_engines_segment">
                  <div className="flex items-center justify-between border-b border-white/5 pb-2">
                    <span className="text-sm font-black text-zinc-300 uppercase tracking-wider font-mono">
                      Running Engine Cores
                    </span>
                    <span className="text-xs font-mono text-[#00D9FF] font-bold">SYSTEM ENCLOSURE v2.8</span>
                  </div>

                  <ul className="space-y-3" id="installed_engines_list_element">
                    
                    {/* Item 1: Photoshop Renamed & Instrumented with Dialog Popups CodePen style */}
                    <li className="bg-zinc-900/40 hover:bg-zinc-900/70 border border-white/5 transition-all p-5 rounded-2xl flex flex-wrap items-center justify-between gap-4 select-none">
                      <div className="flex items-center gap-4">
                        {/* Icon Badge */}
                        <div className="w-12 h-12 rounded-xl bg-[#FF00C8]/10 border border-[#FF00C8]/40 flex items-center justify-center shrink-0">
                          <Flame size={24} className="text-[#FF00C8]" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-base font-cinzel font-black uppercase tracking-wider text-white">Alpha Optimizer Engine</h4>
                            <span className="text-xs font-mono bg-[#FF00C8]/10 border border-[#FF00C8]/30 text-[#FF00C8] px-2 py-0.5 rounded">
                              v2.8
                            </span>
                          </div>
                          <p className="text-sm text-zinc-400 font-mono mt-0.5">Continuous quantitative alpha backtesting loop.</p>
                        </div>
                      </div>

                      {/* Status indicator alignment (CodePen 2 layout match) */}
                      <div className="flex items-center gap-4 ml-auto">
                        <span className="text-sm flex items-center gap-1.5 font-mono text-zinc-300">
                          {engineStatus === 'pending_update' ? (
                            <>
                              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
                              Update Recommended
                            </>
                          ) : (
                            <>
                              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                              Fully Calibrated ✓
                            </>
                          )}
                        </span>
                        
                        <button 
                          onClick={() => { setHasAcceptedClearance(false); setIsUpdateModalOpen(true); }}
                          className={`px-5 py-2.5 font-mono text-xs uppercase font-extrabold tracking-wide rounded-2xl border transition-all cursor-pointer ${
                            engineStatus === 'pending_update'
                              ? 'bg-orange-600 hover:bg-orange-500 text-white border-orange-500/30 shadow-[0_0_12px_rgba(255,69,0,0.2)]'
                              : 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:text-white'
                          }`}
                        >
                          {engineStatus === 'pending_update' ? "Calibrate Engine" : "Tweak Settings"}
                        </button>
                      </div>
                    </li>

                    {/* Item 2: Illustrator Renamed */}
                    <li className="bg-zinc-900/40 hover:bg-zinc-900/70 border border-white/5 transition-all p-[1.15rem] rounded-2xl flex flex-wrap items-center justify-between gap-4 select-none">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-purple-600/10 border border-purple-500/30 flex items-center justify-center shrink-0">
                          <Activity size={24} className="text-purple-450" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-base font-cinzel font-black uppercase tracking-wider text-white">Neural Arbitrage Decryptor</h4>
                            <span className="text-xs font-mono bg-[#00D9FF]/10 text-[#00D9FF] border border-[#00D9FF]/30 px-2 py-0.5 rounded">Active</span>
                          </div>
                          <p className="text-sm text-zinc-400 font-mono mt-0.5">Examines cross-orderbook pricing slippage on decentralized swaps.</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 ml-auto">
                        <span className="text-sm flex items-center gap-1.5 font-mono text-zinc-300">
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                          Running (Stable)
                        </span>
                        
                        <button 
                          onClick={() => onTabChange('StrictlyCharts')}
                          className="px-5 py-2.5 font-mono text-xs uppercase font-extrabold tracking-wide rounded-2xl bg-zinc-800 text-zinc-400 border border-zinc-700 hover:text-white transition-all cursor-pointer"
                        >
                          Inspect Charts
                        </button>
                      </div>
                    </li>

                  </ul>
                </div>

                {/* CPMS SYSTEM SPECIFICATION DIRECTORY - EXPLAINING CHARTING & GEOGRAPHIC FLOWS */}
                <div className="bg-zinc-950/85 border border-[#00FFFF]/20 rounded-3xl p-6 md:p-8 space-y-6 shadow-[0_0_30px_rgba(0,255,255,0.05)] text-left select-none relative overflow-hidden" id="system-specifications-deepdive">
                  {/* Neon Cyber Accents */}
                  <div className="absolute top-0 right-0 w-36 h-36 bg-[#00FFFF]/5 rounded-full blur-2xl pointer-events-none" />
                  <div className="absolute bottom-0 left-0 w-40 h-40 bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-white/10 pb-4 gap-4">
                    <div>
                      <span className="text-[9px] font-mono font-black text-[#00D9FF] tracking-[0.3em] uppercase block">
                        CPMS SYSTEM INTERFACE
                      </span>
                      <h3 className="text-xl md:text-2xl font-cinzel font-black uppercase tracking-wide text-white flex items-center gap-2.5 mt-1">
                        📚 FUTURE SOFTWARE DISPATCH PIPELINES
                      </h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const next = !isDispatchPipelinesCollapsed;
                        setIsDispatchPipelinesCollapsed(next);
                        localStorage.setItem('cp_dispatch_collapsed', String(next));
                      }}
                      className="px-4 py-2 border border-cyan-500/30 hover:border-cyan-400 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 text-xs font-mono font-extrabold uppercase tracking-widest rounded-xl transition-all cursor-pointer shadow-[0_0_10px_rgba(0,217,255,0.1)] select-none shrink-0"
                    >
                      {isDispatchPipelinesCollapsed ? "Expand [▲]" : "Collapse [▼]"}
                    </button>
                  </div>

                  {!isDispatchPipelinesCollapsed && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 font-sans font-semibold animate-fadeIn">
                      {/* Placeholder Card A */}
                      <div className="p-8 rounded-2xl bg-white/[0.01] border-2 border-dashed border-white/10 hover:border-[#00FFFF]/30 transition-all flex flex-col items-center justify-center min-h-[160px]">
                        <span className="text-zinc-500 font-mono text-[11px] uppercase tracking-[0.2em] font-extrabold mb-1">
                          [ MODULE PORT A // READY ]
                        </span>
                        <span className="text-zinc-600 font-mono text-[9px] uppercase font-bold tracking-widest">
                          Reserved for future clearing integration
                        </span>
                      </div>

                      {/* Placeholder Card B */}
                      <div className="p-8 rounded-2xl bg-white/[0.01] border-2 border-dashed border-white/10 hover:border-purple-500/30 transition-all flex flex-col items-center justify-center min-h-[160px]">
                        <span className="text-zinc-500 font-mono text-[11px] uppercase tracking-[0.2em] font-extrabold mb-1">
                          [ MODULE PORT B // READY ]
                        </span>
                        <span className="text-zinc-600 font-mono text-[9px] uppercase font-bold tracking-widest">
                          Reserved for macro-sentiment diagnostics
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* GLOBAL TRADING SESSIONS & KILL ZONES MATRIX */}
                <KillZones />

                {/* MY CONTACTS ON HOMEPAGE WIDGET */}
                {showHomepageContacts && (
                  <motion.div 
                    key={`contacts-widget-${showTerminalMatrixNoise}`}
                    initial={{ opacity: 0, y: 30, filter: "drop-shadow(0 0 0px rgba(255,0,200,0))" }}
                    animate={{ 
                      opacity: 1, 
                      y: 0,
                      filter: [
                        "drop-shadow(0 0 2px rgba(255,0,200,0))",
                        "drop-shadow(0 0 15px rgba(255,0,200,0.45))",
                        "drop-shadow(0 0 4px rgba(255,0,200,0.15))"
                      ]
                    }}
                    transition={{ type: "spring", stiffness: 80, damping: 14, duration: 0.8 }}
                    className="space-y-4 border border-[#FF00C8]/30 bg-zinc-950/40 p-6 rounded-2xl shadow-[0_0_20px_rgba(255,0,200,0.1)] select-none"
                  >
                    <div className="flex items-center justify-between border-b border-white/5 pb-2">
                      <span className="text-sm font-black text-[#FF00C8] uppercase tracking-wider font-mono flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-[#FF00C8] animate-ping" />
                        My Contacts Matrix
                      </span>
                      <span className="text-xs text-zinc-400 font-mono font-bold uppercase select-all">SECURE COMMUNICATION HUBS</span>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                      {contacts.map((contact) => (
                        <div 
                          key={contact.id} 
                          onClick={() => onSelectContact && onSelectContact(contact)}
                          className="flex flex-col items-center justify-center p-4 bg-zinc-900/10 hover:bg-zinc-900/50 border border-white/5 hover:border-[#FF00C8]/40 rounded-xl cursor-pointer transition-all hover:scale-[1.03] group"
                        >
                          {/* Profile shape frame matching premium cyber layout */}
                          <div className="surfboard-profile-outline border-2 group-hover:scale-105 transition-transform border-[#FF00C8]/40 group-hover:border-[#FF00C8]/80 shadow-[0_0_12px_rgba(255,0,200,0.15)] group-hover:shadow-[0_0_15px_rgba(255,0,200,0.30)] mb-3 overflow-hidden" style={{ width: '40px', height: '65px' }}>
                            <div className="surfboard-img bg-zinc-800 flex items-center justify-center text-xs font-black text-zinc-500">
                              {contact.name.split(' ').map(part => part[0]).join('')}
                            </div>
                          </div>
                          <span className="text-xs font-black uppercase tracking-tighter text-zinc-300 text-center truncate w-full group-hover:text-white transition-colors">{contact.name}</span>
                          <div className="flex items-center gap-1.5 mt-1.5">
                            <span className={`w-1.5 h-1.5 rounded-full ${contact.status === 'online' ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]' : 'bg-red-500/50'}`} />
                            <span className="text-[8px] font-mono uppercase tracking-wider text-zinc-500">{contact.status}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* PROPRIETARY STREAMING TICKERS SECTION */}
                <div className="space-y-4 border border-zinc-900 bg-zinc-950/20 p-6 rounded-2xl">
                  <div className="flex items-center justify-between border-b border-white/5 pb-2">
                    <span className="text-sm font-black text-[#00FFFF] uppercase tracking-wider font-mono flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                      Proprietary Finnhub Streaming Channels
                    </span>
                    <span className="text-xs text-zinc-400 font-mono font-bold uppercase">LIVE_RELAY_STREAM // SECURE API SHIELD</span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    <ClearPathLiveTicker symbol="AAPL" />
                    <ClearPathLiveTicker symbol="BTCUSD" />
                    <ClearPathLiveTicker symbol="MSFT" />
                  </div>
                </div>

                {/* SUB SYSTEM BENTO GRID CARDS CAROUSEL (Premiere, InDesign style mapping) */}
                <div className="space-y-4" id="grid_bento_carousel">
                  <div className="flex items-center justify-between border-b border-white/5 pb-2">
                    <span className="text-sm font-black text-zinc-300 uppercase tracking-wider font-mono">
                      Available Infrastructure Hubs (Direct Launch)
                    </span>
                    <span className="text-xs text-zinc-400 font-mono font-bold">AUTHORIZED SYSTEMS DIRECTORY</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-5xl" id="bento_systems_cards">
                    
                    {/* card 1 */}
                    <div 
                      onClick={() => onTabChange('StrictlyCharts')}
                      className="bg-zinc-900/30 hover:bg-zinc-900/60 border border-white/5 p-6 rounded-2xl flex flex-col justify-between align-start text-left cursor-pointer transition-all duration-300 hover:scale-[1.03] shadow-lg select-none hover:border-[#00D9FF]/40"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className="p-2.5 bg-[#00D9FF]/10 border border-[#00D9FF]/45 rounded-xl text-[#00D9FF] shadow-[0_0_12px_rgba(0,217,255,0.2)]">
                          <BarChart3 size={20} />
                        </div>
                        <span className="text-[10px] font-mono font-black text-[#00D9FF] bg-[#00D9FF]/5 border border-[#00D9FF]/20 px-2 py-0.5 rounded">STRICTLY_CHARTS</span>
                      </div>
                      <div>
                        <h4 className="text-base font-cinzel font-black text-white hover:text-[#00D9FF] transition-colors uppercase tracking-wider mb-2">Interactive Trading Terminal</h4>
                        <p className="text-sm text-zinc-400 leading-relaxed font-bold">
                          Instant high-performance rendering of live BTC, ETH, AAPL, SPY asset matrices.
                        </p>
                      </div>
                      <div className="mt-5 pt-4 border-t border-white/5 flex items-center justify-between text-xs font-mono text-zinc-300 font-black">
                        <span>LAUNCH WORKSPACE</span>
                        <ArrowRight size={14} className="text-[#00D9FF]" />
                      </div>
                    </div>

                    {/* card 2 */}
                    <div 
                      onClick={() => onTabChange('CapitalFlow')}
                      className="bg-zinc-900/30 hover:bg-zinc-900/60 border border-white/5 p-6 rounded-2xl flex flex-col justify-between align-start text-left cursor-pointer transition-all duration-300 hover:scale-[1.03] shadow-lg select-none hover:border-[#FF00C8]/40"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className="p-2.5 bg-[#FF00C8]/10 border border-[#FF00C8]/45 rounded-xl text-[#FF00C8] shadow-[0_0_12px_rgba(255,0,200,0.2)]">
                          <Globe size={20} />
                        </div>
                        <span className="text-[10px] font-mono font-black text-[#FF00C8] bg-[#FF00C8]/5 border border-[#FF00C8]/20 px-2 py-0.5 rounded">FLOW_MAPS</span>
                      </div>
                      <div>
                        <h4 className="text-base font-cinzel font-black text-white hover:text-[#FF00C8] transition-colors uppercase tracking-wider mb-2">Global Liquidity Realignment</h4>
                        <p className="text-sm text-zinc-400 leading-relaxed font-bold">
                          Track global currency reserve speeds and secondary transaction velocities geographically.
                        </p>
                      </div>
                      <div className="mt-5 pt-4 border-t border-white/5 flex items-center justify-between text-xs font-mono text-zinc-300 font-black">
                        <span>LAUNCH WORKSPACE</span>
                        <ArrowRight size={14} className="text-[#FF00C8]" />
                      </div>
                    </div>

                  </div>
                </div>

              </div>
            )}

            {/* TAB VIEW 2: CPMS WIRE RELEASE DESK (CodePen 1 visual implementation) */}
            {activeSegment === 'newsroom' && (
              <div className="h-full flex flex-col xl:flex-row xl:overflow-hidden overflow-visible" id="cpms_editorial_desk_wrapper">
                
                {/* MIDDLE SUB-ASIDE: JOURNAL ARTICLE DRAFT QUEUE LIST */}
                <div className="w-full xl:w-80 bg-zinc-950 border-r border-zinc-800 flex flex-col select-none" id="drafts_timeline_aside">
                  <div className="p-4 border-b border-zinc-800 bg-zinc-900/30 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-mono font-black text-[#FF00C8] uppercase tracking-widest block mb-0.5">Wire Stream</p>
                      <h4 className="text-base font-cinzel font-black uppercase text-white tracking-wide">Approval Queue</h4>
                    </div>
                    <BookOpen size={18} className="text-[#00D9FF]" />
                  </div>

                  <div className="p-3 border-b border-zinc-800">
                    <div className="relative">
                      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                      <input 
                        type="text" 
                        placeholder="Search system drafts..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-2 pl-9 pr-3 text-xs text-white focus:outline-none focus:border-[#FF00C8] font-mono"
                      />
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
                    {filteredArticles.length === 0 ? (
                      <div className="text-center py-12 text-xs text-zinc-650 font-mono">
                        No drafts found matching filters.
                      </div>
                    ) : (
                      filteredArticles.map(art => {
                        const isSelected = art.id === activeArticleId;
                        return (
                          <button
                            key={art.id}
                            onClick={() => { setActiveArticleId(art.id); }}
                            className={`w-full text-left p-4 rounded-2xl border transition-all relative flex flex-col gap-2.5 ${
                              isSelected 
                                ? 'bg-zinc-900/80 border-[#FF00C8]/40 shadow-[0_0_15px_rgba(255,0,200,0.12)]' 
                                : 'bg-zinc-900/20 border-zinc-850 hover:bg-zinc-900/30'
                            }`}
                          >
                            {isSelected && (
                              <div className="absolute left-0 top-3 bottom-3 w-1 bg-[#FF00C8] rounded-r-lg" />
                            )}
                            <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400">
                              <span className="uppercase font-black text-[#FF00C8] tracking-widest bg-[#FF00C8]/5 px-2 py-0.5 rounded border border-[#FF00C8]/10">{art.desk}</span>
                              <span className="flex items-center gap-1 font-bold">
                                <Clock size={10} /> {art.date}
                              </span>
                            </div>
                            <h5 className={`text-xs font-cinzel font-black tracking-wider uppercase leading-relaxed ${isSelected ? 'text-white' : 'text-zinc-400'}`}>
                              {art.title}
                            </h5>
                            <div className="flex items-center justify-between mt-1 pt-2.5 border-t border-zinc-800/45 text-[10px] text-zinc-400">
                              <span className="flex items-center gap-1.5 font-bold">
                                <img className="w-4 h-4 rounded-full object-cover" src={getAvatar(art.author, art.avatar)} alt="" />
                                {art.author}
                              </span>
                              <span>
                                {art.isApproved ? (
                                  <span className="text-[10px] text-[#00D9FF] bg-[#00D9FF]/15 px-2 py-0.5 rounded font-black border border-[#00D9FF]/25">RELEASED✓</span>
                                ) : (
                                  <span className="text-[10px] text-orange-400 bg-orange-500/15 px-2 py-0.5 rounded font-black border border-orange-500/20">REVIEWING</span>
                                )}
                              </span>
                            </div>
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* CENTRAL AREA: TYPOGRAPHIC DOCUMENT READER COLUMN */}
                <div className="flex-grow bg-slate-950 p-6 md:p-9 overflow-y-auto custom-scrollbar flex flex-col text-left" id="document_narrative_viewport">
                  
                  {/* Article main info block */}
                  <div className="border-b border-zinc-800 pb-6 mb-6 select-none">
                    <span className="text-[10px] font-mono font-black text-[#FF00C8] bg-[#FF00C8]/5 border border-[#FF00C8]/15 px-2.5 py-1 rounded inline-block mb-4 uppercase tracking-widest shadow-sm">
                      Research Analysis Report Draft
                    </span>
                    <h3 className="text-2xl md:text-3xl lg:text-4xl font-cinzel font-black uppercase text-white leading-tight mb-5 tracking-tight">
                      {activeArticle.title}
                    </h3>

                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <img className="w-9 h-9 rounded-full border border-zinc-750 object-cover" src={getAvatar(activeArticle.author, activeArticle.avatar)} alt="" />
                        <div>
                          <p className="text-sm font-black text-zinc-100">{activeArticle.author}</p>
                          <p className="text-[10px] text-zinc-500 font-mono">CPMS Macro Strategic Wire Division</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-xs font-mono text-zinc-300 bg-zinc-900 border border-zinc-800 px-3.5 py-1.5 rounded-xl">
                        <Calendar size={14} className="text-[#00D9FF]" />
                        <span>RELEASE DATED: {activeArticle.date}</span>
                      </div>
                    </div>
                  </div>

                  {/* ACTIVE APPROVAL BANNER STATUS PANEL */}
                  {activeArticle.isApproved ? (
                    <div className="mb-8 p-5 bg-[#00D9FF]/5 border border-[#00D9FF]/20 text-[#00D9FF] text-xs md:text-sm rounded-2xl flex flex-wrap gap-4 items-center justify-between shadow-[0_0_20px_rgba(0,217,255,0.12)]">
                      <div className="flex items-center gap-3">
                        <ShieldCheck size={20} className="text-[#00D9FF] shrink-0" />
                        <div>
                          <strong className="uppercase font-black block tracking-wide mb-0.5">🎉 RESEARCH DISPATCHED LIVE ON TELEMETRY BUS</strong>
                          Approved releases sync directly with real-time TradingView frames and trigger live notification banners globally.
                        </div>
                      </div>
                      <button 
                        onClick={() => handleRevokeRelease(activeArticle.id)}
                        className="px-4 py-2 bg-[#00D9FF]/10 hover:bg-[#00D9FF]/20 border border-[#00D9FF]/25 text-[#00D9FF] hover:text-white font-mono uppercase text-[10px] font-black rounded-xl cursor-pointer transition-all"
                      >
                        Revoke Broadcast
                      </button>
                    </div>
                  ) : (
                    <div className="mb-8 p-5 bg-orange-600/5 border border-orange-500/15 text-orange-400 text-xs md:text-sm rounded-2xl flex flex-wrap gap-4 items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Clock size={18} className="text-[#FF5E00] animate-pulse shrink-0" />
                        <div>
                          <strong className="uppercase font-black block tracking-wide mb-0.5">⚡ EDITORIAL CALIBRATION EN-ROUTE</strong>
                          Inline commentary annotated below must be evaluated and marked as resolved before initiating telemetry release vectors.
                        </div>
                      </div>
                      <button 
                        onClick={() => triggerSignalRelease(activeArticle)}
                        className="px-5 py-2.5 text-white font-mono uppercase text-xs font-black rounded-xl cursor-pointer transition-all shadow-[0_0_15px_rgba(255,94,0,0.25)] flex items-center gap-1.5"
                        style={{ background: 'linear-gradient(90deg, #FF5E00 0%, #FF00C8 100%)' }}
                      >
                        <ShieldCheck size={14} /> Approve / Deploy Wire
                      </button>
                    </div>
                  )}

                  {/* PARAGRAPH BLOCKS */}
                  <div className="space-y-5 text-zinc-300 text-sm md:text-base leading-relaxed tracking-wide font-medium flex-grow">
                    {activeArticle.content.map((p, idx) => (
                      <p key={idx}>{p}</p>
                    ))}

                    {/* INTERACTIVE COMMENTS BLOCK & HIGHLIGHT SPANS (CodePen 1 annotated bubble) */}
                    <div className="my-8 p-6 bg-zinc-900/60 border-l-4 border-[#FF00C8] rounded-r-2xl relative">
                      <span className={`text-sm md:text-base block mb-4 font-medium italic leading-relaxed ${activeArticle.comments[0]?.isResolved ? 'text-zinc-600 line-through decoration-zinc-800' : 'text-white'}`}>
                        "{activeArticle.highlightedText}"
                      </span>

                      {/* Comment bubble container */}
                      <div className="mt-5 border-t border-zinc-800/80 pt-5 flex flex-col md:flex-row gap-4 items-start bg-black/40 p-5 rounded-2xl border border-zinc-855">
                        <img className="w-9 h-9 rounded-full border border-[#FF00C8]/30 object-cover" src={getAvatar('Clear Path Trader', '')} alt="" />
                        
                        <div className="flex-grow text-xs md:text-sm text-left">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-bold text-zinc-250 text-sm">Clear Path Trader</span>
                            <span className="text-[10px] text-zinc-500 font-mono">Chief Administrator, CEO, Creator & Founder</span>
                          </div>
                          
                          <p className="text-zinc-400 font-medium italic mb-4 leading-relaxed bg-[#FF00C8]/5 p-3 rounded-xl border border-[#FF00C8]/10 text-xs md:text-sm">
                            "{activeArticle.tooltipText}"
                          </p>

                          <div className="flex flex-wrap gap-4 items-center">
                            <button 
                              onClick={() => handleResolveComment(activeArticle.comments[0]?.id || 'comment-1')}
                              className={`px-4 py-2 bg-[#FF00C8]/10 hover:bg-[#FF00C8]/20 text-[#FF00C8] border border-[#FF00C8]/20 rounded-xl text-xs tracking-wide uppercase font-black cursor-pointer transition-all flex items-center gap-1.5`}
                            >
                              <Check size={13} className="text-[#FF00C8]" />
                              {activeArticle.comments[0]?.isResolved ? "Mark Unresolved" : "Mark Resolved"}
                            </button>

                            <span className="text-xs font-mono font-black">
                              Status Index: {activeArticle.comments[0]?.isResolved ? (
                                <span className="text-[#00D9FF] font-black">RESOLVED ✓</span>
                              ) : (
                                <span className="text-[#FF00C8] font-black animate-pulse">ACTION REQUIRED ⚡</span>
                              )}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                </div>

                {/* RIGHT FLOATING COLUMN: GENERAL DISCUSSIONS ENGINE */}
                <aside className="w-full xl:w-80 bg-[#080816]/95 border-t xl:border-t-0 xl:border-l border-zinc-800 flex flex-col" id="general_discussions_feed">
                  
                  {/* Discussion Thread Logs */}
                  <div className="p-4 border-b border-zinc-800 bg-zinc-900/10 select-none">
                    <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest font-black block mb-1">Audit Desk Ledger</span>
                    <h4 className="text-xs font-black uppercase text-white tracking-wide flex items-center gap-1.5 font-cinzel text-base">
                      <MessageSquare size={14} className="text-[#00D9FF]" />
                      Active Discussion Logs
                    </h4>
                  </div>

                  <div className="p-4 flex-grow overflow-y-auto space-y-4 custom-scrollbar">
                    
                    {activeArticle.comments.map(comm => (
                      <div key={comm.id} className="p-4 bg-zinc-900/40 rounded-2xl border border-zinc-850 text-xs space-y-3">
                        <div className="flex items-center gap-2 select-none">
                          <img className="w-6 h-6 rounded-full border border-zinc-750 object-cover" src={getAvatar(comm.author, comm.avatar)} alt="" />
                          <div className="leading-none text-left">
                            <p className="font-extrabold text-zinc-200 text-xs">{comm.author}</p>
                            <p className="text-[9px] text-zinc-500 font-mono mt-0.5">{comm.time}</p>
                          </div>
                          <span className={`w-2 h-2 rounded-full ml-auto ${comm.isResolved ? 'bg-zinc-750' : 'bg-[#FF00C8] animate-pulse'}`} />
                        </div>

                        <p className="text-zinc-300 leading-relaxed font-semibold italic text-left text-xs md:text-sm">
                          "{comm.text}"
                        </p>

                        {/* Interactive discussion replies list */}
                        {comm.replies && comm.replies.length > 0 && (
                          <div className="space-y-2 pt-3 border-t border-zinc-800/60 text-left">
                            <span className="text-[10px] tracking-wider font-mono text-[#00D9FF] uppercase font-black select-none block mb-1">
                              Response Protocol logs:
                            </span>
                            {comm.replies.map((rep, idx) => (
                              <div key={idx} className="bg-black/30 p-2.5 rounded-xl border border-zinc-900 text-xs text-zinc-400 leading-relaxed">
                                <span className="font-bold text-[#FF00C8]">Master Auditor: </span>
                                "{rep}"
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Typing Reply input box */}
                        <div className="pt-2 flex gap-1.5">
                          <input 
                            type="text" 
                            placeholder="Type reply..." 
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            className="bg-black/40 border border-zinc-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-[#FF00C8] flex-grow"
                          />
                          <button 
                            onClick={() => handleAddReply(comm.id)}
                            className="p-2 px-3 bg-[#FF00C8] hover:bg-[#FF00C8]/90 text-white rounded-xl flex items-center justify-center cursor-pointer transition-colors"
                            title="Send Response Back"
                          >
                            <Send size={12} />
                          </button>
                        </div>
                      </div>
                    ))}

                  </div>

                  {/* Bottom submit triggers */}
                  <div className="p-4 bg-zinc-950/80 border-t border-zinc-800 select-none">
                    <p className="text-[10px] font-mono text-zinc-500 leading-relaxed uppercase font-black block mb-3 text-left">
                      Authorization Trigger Panel
                    </p>
                    
                    {activeArticle.isApproved ? (
                      <button
                        onClick={() => handleRevokeRelease(activeArticle.id)}
                        className="w-full py-3.5 rounded-xl bg-red-600/10 hover:bg-red-600/15 border border-red-500/20 text-red-400 hover:text-white font-extrabold uppercase text-xs tracking-wider transition-all cursor-pointer"
                      >
                        Withdraw Release Loop
                      </button>
                    ) : (
                      <button
                        onClick={() => triggerSignalRelease(activeArticle)}
                        className="w-full py-4 rounded-xl text-white font-black uppercase text-xs tracking-widest transition-all cursor-pointer shadow-[0_0_15px_rgba(255,0,200,0.25)] relative overflow-hidden"
                        style={{ background: 'linear-gradient(90deg, #FF5E00 0%, #FF00C8 100%)' }}
                      >
                        Deploy & Publish Research
                      </button>
                    )}
                  </div>
                </aside>

              </div>
            )}

          </main>

        </div>
        
      </div>

      {/* BIG SUR GLASSMORPHISM CORE CALIBRATOR POP-UP DIALOG (CodePen 2 pop-up logic) */}
      <AnimatePresence>
        {isUpdateModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md" id="glassmorphic_calibrator_modal">
            
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md bg-[#0e0e1a] border border-orange-500/35 p-6 rounded-3xl shadow-[0_0_50px_rgba(255,69,0,0.25)] text-left select-none"
            >
              
              {/* Header */}
              <div className="flex items-center justify-between border-b border-white/5 pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <Settings className="text-[#FF4500] animate-spin" size={18} />
                  <h4 className="text-sm font-black uppercase tracking-wider text-white">
                    Calibrate Alpha Optimizer
                  </h4>
                </div>
                <button 
                  onClick={() => setIsUpdateModalOpen(false)}
                  className="p-1 hover:bg-white/5 text-zinc-500 hover:text-white rounded-lg transition-colors cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

               {!hasAcceptedClearance ? (
                /* The Security Clearance / Consent Step */
                <div className="space-y-4" id="regulatory_optimization_clearance_step">
                  <div className="bg-orange-600/10 border border-orange-500/40 p-3.5 rounded-xl text-orange-400 font-mono text-[11px] leading-relaxed flex flex-col gap-2 shadow-[0_0_15px_rgba(255,69,0,0.1)]">
                    <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-orange-500">
                      <span>⚠️ COMPLIANCE RISK WARNING</span>
                    </div>
                    <p>
                      Calibrating or optimizing system parameters on a live client workstation requires explicit end-user security clearance and data protection consent.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <p className="text-white font-bold text-xs uppercase tracking-wider">
                      Do you agree to us optimizing your system?
                    </p>
                    
                    <p className="text-[11px] text-zinc-450 leading-relaxed font-semibold">
                      Under international institutional compliance rules, by granting this clearance you agree to allow the CPMS Alpha Optimizer Core to calibrate localized browser viewport parameters, adjust real-time canvas memory allocation, allocate GPU threads, and optimize local stream buffering variables.
                    </p>
                    
                    <p className="text-[11px] text-zinc-500 leading-relaxed font-semibold font-mono">
                      Security Protocol: All calibrations run securely in browser memory under active sandboxing guidelines. Personal files and account structures are untouched.
                    </p>
                  </div>

                  <div className="flex gap-2 pt-3 justify-end text-xs font-mono select-none">
                    <button 
                      onClick={() => setIsUpdateModalOpen(false)}
                      className="px-4 py-2 bg-zinc-900 hover:bg-zinc-850 text-zinc-400 border border-zinc-800 rounded-xl font-bold uppercase cursor-pointer transition-all"
                    >
                      Decline & Exit
                    </button>
                    <button 
                      onClick={() => setHasAcceptedClearance(true)}
                      className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white border border-orange-500/20 rounded-xl font-black uppercase tracking-wide cursor-pointer transition-all shadow-[0_0_12px_rgba(255,69,0,0.25)]"
                    >
                      Yes, Agree & Optimize
                    </button>
                  </div>
                </div>
              ) : updatingEngine ? (
                /* Calibration Sequence Loader bar */
                <div className="py-6 text-center space-y-4">
                  <div className="w-12 h-12 rounded-full border-4 border-orange-500/10 border-t-[#FF4500] animate-spin mx-auto" />
                  <div className="space-y-1">
                    <p className="text-xs font-mono font-extrabold text-orange-500 uppercase tracking-widest">
                      Calibrating parameters... {updatePercent}%
                    </p>
                    <p className="text-[10px] text-zinc-500 font-mono">Clearing historical buffer metrics and syncing indexes.</p>
                  </div>
                  {/* Progress bar */}
                  <div className="w-full h-1.5 bg-zinc-900 rounded-full overflow-hidden border border-zinc-850">
                    <div className="h-full bg-gradient-to-r from-orange-500 to-purple-600 transition-all duration-150" style={{ width: `${updatePercent}%` }} />
                  </div>
                </div>
              ) : (
                /* Interactive Checkboxes controls */
                <div className="space-y-4" id="update_modal_selections_dashboard">
                  <p className="text-xs text-zinc-400 leading-relaxed font-semibold">
                    Fine-tune backtesting attributes and latency calibrations for the high-frequency alpha optimizer core. Ensure indices are synchronized correctly.
                  </p>

                  <div className="space-y-2">
                    
                    {/* Checkbox 1 */}
                    <label 
                      onClick={() => setImportSettings(!importSettings)}
                      className="p-3 bg-zinc-900/60 hover:bg-zinc-900/90 border border-zinc-800/80 rounded-xl flex items-center justify-start gap-3 cursor-pointer transition-colors text-xs font-bold text-zinc-200"
                    >
                      <div className={`w-4 h-4 rounded flex items-center justify-center border transition-all shrink-0 ${importSettings ? 'bg-[#FF4500] border-orange-500' : 'border-zinc-700'}`}>
                        {importSettings && <Check size={11} className="text-white font-black" />}
                      </div>
                      Import previous neural weight matrices and preferences
                    </label>

                    {/* Checkbox 2 */}
                    <label 
                      onClick={() => setRemoveOldVersions(!removeOldVersions)}
                      className="p-3 bg-zinc-900/60 hover:bg-zinc-900/90 border border-zinc-800/80 rounded-xl flex items-center justify-start gap-3 cursor-pointer transition-colors text-xs font-bold text-zinc-200"
                    >
                      <div className={`w-4 h-4 rounded flex items-center justify-center border transition-all shrink-0 ${removeOldVersions ? 'bg-[#FF4500] border-orange-500' : 'border-zinc-700'}`}>
                        {removeOldVersions && <Check size={11} className="text-white font-black" />}
                      </div>
                      Purge legacy social media and personal accounts indices
                    </label>

                  </div>

                  <div className="flex gap-2 pt-2 justify-end text-xs font-mono select-none">
                    <button 
                      onClick={() => setIsUpdateModalOpen(false)}
                      className="px-4 py-2 bg-zinc-900 hover:bg-zinc-850 text-zinc-400 border border-zinc-800 rounded-xl font-bold uppercase cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={handleStartUpdateSequence}
                      className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white border border-orange-500/20 rounded-xl font-black uppercase tracking-wide cursor-pointer shadow-[0_0_12px_rgba(255,69,0,0.25)]"
                    >
                      Initiate Calibration
                    </button>
                  </div>
                </div>
              )}

            </motion.div>

          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
