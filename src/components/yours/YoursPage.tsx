"use client";
import React, { useState, useEffect, useRef } from 'react';
import { 
  Terminal, 
  Cpu, 
  Zap, 
  Server, 
  Wifi, 
  User, 
  Radio, 
  Globe, 
  Activity, 
  CheckCircle2, 
  AlertCircle, 
  Share2, 
  Send, 
  MessageSquare,
  Sparkles,
  RefreshCw,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Newspaper,
  Flame,
  Trophy,
  ChevronRight,
  Search,
  Lock,
  Unlock,
  TrendingUp,
  Plus
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import PoliticalHub from '../PoliticalHub';
import GlobalFinance from '../GlobalFinance';
import MagazineHub from '../MagazineHub';
import WorldHub from '../WorldHub';
import OptimisticInjusticeArticle from './OptimisticInjustice';
import { YwcLavaPanel, YwcSectionTitle } from './YwcLavaPanel';
import { CpmsMediaPantry } from './CpmsMediaPantry';
import { YwcChartSection, YwcChartWorkspace } from './YwcLiveChartBento';
import { useYwcDigest } from '../../hooks/useYwcDigest';
import { digestItemToNewsCard } from '../../lib/ywc/feedMappers';
import { YWC_FALLBACK_NEWS } from '../../data/ywcFeedFallback';

export default function YoursPageHub() {
  // Navigation / Filter control inside the YWC View
  const [selectedFeedCategory, setSelectedFeedCategory] = useState<'all' | 'sports' | 'news' | 'finance' | 'crypto' | 'politics' | 'tech' | 'magazine' | 'relief'>('all');
  
  // Custom states for simulations
  const [xmlPollingInterval, setXmlPollingInterval] = useState<6 | 12>(12);
  const [isSimulatingFetch, setIsSimulatingFetch] = useState(false);
  const [simulatedLogs, setSimulatedLogs] = useState<string[]>([]);
  const [fetchProgress, setFetchProgress] = useState(0);
  const [lastSyncTime, setLastSyncTime] = useState<string>(() => new Date().toLocaleTimeString());

  // Market watch state
  const [marketIndices, setMarketIndices] = useState([
    { name: 'S&P 500', ticker: 'SPX', value: 5418.25, change: 12.80, pct: 0.24, isPositive: true },
    { name: 'NASDAQ 100', ticker: 'NDX', value: 19124.50, change: -48.35, pct: -0.25, isPositive: false },
    { name: 'DOW JONES', ticker: 'DJI', value: 39605.10, change: 185.00, pct: 0.47, isPositive: true },
    { name: 'BTC / USD', ticker: 'BTC', value: 68420.00, change: 1240.00, pct: 1.85, isPositive: true },
    { name: 'GOLD (OZ)', ticker: 'XAU', value: 2364.80, change: 18.20, pct: 0.78, isPositive: true },
    { name: 'EUR / USD', ticker: 'EUR', value: 1.0824, change: -0.0016, pct: -0.15, isPositive: false }
  ]);

  // Social login OAuth Hub providers (15 platforms)
  const [socialPlatforms, setSocialPlatforms] = useState([
    { id: 'google', name: 'Google', color: 'hover:border-red-500/80 hover:text-red-400', connected: false, isConnecting: false, username: '' },
    { id: 'facebook', name: 'Facebook', color: 'hover:border-blue-700/80 hover:text-blue-500', connected: false, isConnecting: false, username: '' },
    { id: 'instagram', name: 'Instagram', color: 'hover:border-pink-600/80 hover:text-pink-400', connected: false, isConnecting: false, username: '' },
    { id: 'twitter', name: 'X / Twitter', color: 'hover:border-cyan-400/80 hover:text-cyan-400', connected: false, isConnecting: false, username: '' },
    { id: 'tiktok', name: 'TikTok', color: 'hover:border-neutral-200 hover:text-white', connected: false, isConnecting: false, username: '' },
    { id: 'youtube', name: 'YouTube', color: 'hover:border-red-600 hover:text-red-500', connected: false, isConnecting: false, username: '' },
    { id: 'linkedin', name: 'LinkedIn', color: 'hover:border-blue-600 hover:text-blue-400', connected: false, isConnecting: false, username: '' },
    { id: 'reddit', name: 'Reddit', color: 'hover:border-orange-500 hover:text-orange-400', connected: false, isConnecting: false, username: '' },
    { id: 'discord', name: 'Discord', color: 'hover:border-indigo-500 hover:text-indigo-400', connected: false, isConnecting: false, username: '' },
    { id: 'telegram', name: 'Telegram', color: 'hover:border-sky-400 hover:text-sky-300', connected: false, isConnecting: false, username: '' },
    { id: 'vk', name: 'VKontakte', color: 'hover:border-blue-500 hover:text-blue-400', connected: false, isConnecting: false, username: '' },
    { id: 'snapchat', name: 'Snapchat', color: 'hover:border-yellow-400 hover:text-yellow-300', connected: false, isConnecting: false, username: '' },
    { id: 'pinterest', name: 'Pinterest', color: 'hover:border-red-500 hover:text-red-400', connected: false, isConnecting: false, username: '' },
    { id: 'threads', name: 'Threads', color: 'hover:border-zinc-300 hover:text-zinc-200', connected: false, isConnecting: false, username: '' },
    { id: 'twitch', name: 'Twitch', color: 'hover:border-violet-500 hover:text-violet-400', connected: false, isConnecting: false, username: '' }
  ]);

  // Social feed aggregate simulation
  const [socialFeed, setSocialFeed] = useState<Array<{ id: string, platform: string, author: string, handle: string, content: string, time: string }>>([
    { id: 's1', platform: 'twitter', author: 'Markus Macro', handle: '@macro_markus', content: 'Aggregated yield spreads show critical resistance on standard OTC benches. CPMS live signals indicating near-term short covering.', time: '10m ago' },
    { id: 's2', platform: 'discord', author: 'GlowTrader', handle: '#cpms-alpha', content: 'Master patterns setup triggers perfect harmonic long signals on EUR/USD spot desk. Locked in +45 pips! Thanks CPMS intelligence!', time: '24m ago' },
    { id: 's3', platform: 'linkedin', author: 'Dr. Sarah Pierce', handle: 'Global Risk Officer', content: 'Sovereign liquidity metrics continue to suggest systematic core reserve contraction. Watching the federal auction logs strictly.', time: '1h ago' }
  ]);
  const [newPostText, setNewPostText] = useState('');

  // Reader modal story
  const [activeStoryDetails, setActiveStoryDetails] = useState<any | null>(null);

  // Ticker text
  const tickerItems = [
    "🔥 BREAKING: Federal Reserves maintain rate thresholds, citing stable employment indices & robust retail metrics...",
    "⚽ SPORTS: Verstappen secures breathtaking pole-position at Monaco Grand Prix after high-speed final sector duel...",
    "💹 MARKET WATCH: Bitcoin clears technical resistance at $68,400 as spot exchange volumes reach high threshold limits...",
    "⚡ TECH: Sub-3nm semiconductor production lines expand inside Arizona facilities to satisfy AI infrastructure demand...",
    "⚖️ POLITICS: Coordinated energy security package enters congressional debate, offering tax deductions for natural gas utility installations..."
  ];

  const [newsFeed, setNewsFeed] = useState(YWC_FALLBACK_NEWS);
  const { items: digestItems, refresh: refreshDigest, loading: digestLoading, error: digestError } = useYwcDigest(xmlPollingInterval);

  useEffect(() => {
    if (!digestItems.length) return;
    const liveCards = digestItems.map(digestItemToNewsCard);
    setNewsFeed(liveCards);
    setLastSyncTime(new Date().toLocaleTimeString());
  }, [digestItems]);

  const featuredStory = newsFeed[0] ?? YWC_FALLBACK_NEWS[0];

  const handleSimulateRSSFetch = async () => {
    setIsSimulatingFetch(true);
    setFetchProgress(10);
    setSimulatedLogs([`[0.0s] [CRON] Triggered live RSS digest refresh...`]);

    try {
      setFetchProgress(35);
      setSimulatedLogs((prev) => [...prev, `[0.3s] Fetching cached YWC digest from /api/ywc/digest...`]);
      const items = await refreshDigest(true);
      setFetchProgress(85);
      setSimulatedLogs((prev) => [
        ...prev,
        `[1.2s] Parsed ${items.length} live articles across sports, finance, relief, and world desks.`,
        `[1.6s] Images and timestamps synced from publisher RSS nodes.`,
      ]);

      if (items.length) {
        setNewsFeed(items.map(digestItemToNewsCard));
      }
      setFetchProgress(100);
      setLastSyncTime(new Date().toLocaleTimeString());
      setSimulatedLogs((prev) => [...prev, `[2.0s] React news grid updated with today's headlines.`]);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'RSS refresh failed';
      setSimulatedLogs((prev) => [...prev, `[ERROR] ${message}`]);
    } finally {
      setIsSimulatingFetch(false);
    }
  };

  // Social account simulation login triggering handshakes
  const handleTriggerSocialConnect = (id: string, name: string) => {
    setSocialPlatforms(prev => prev.map(p => {
      if (p.id === id) {
        if (p.connected) {
          // Disconnect
          return { ...p, connected: false, username: '' };
        } else {
          // Trigger connecting state
          return { ...p, isConnecting: true };
        }
      }
      return p;
    }));

    // If connecting, wait 1.5 seconds to simulate API websocket handshake
    const platform = socialPlatforms.find(p => p.id === id);
    if (platform && !platform.connected) {
      setTimeout(() => {
        const seedUsername = `@${name.toLowerCase().replace(/\s/g, '')}_cpms_node`;
        
        setSocialPlatforms(prev => prev.map(p => {
          if (p.id === id) {
            return {
              ...p,
              connected: true,
              isConnecting: false,
              username: seedUsername
            };
          }
          return p;
        }));

        // Add dummy broadcast signal log to feed
        const dummyPost = {
          id: 'sys_' + Date.now(),
          platform: id,
          author: `${name} Cloud Gateway`,
          handle: seedUsername,
          content: `⚡ Secure OAuth Handshake successful! WS Pipeline anchored verified on gateway broker node port 3000. Ready to stream data matrices.`,
          time: 'Just now'
        };
        setSocialFeed(prev => [dummyPost, ...prev]);

      }, 1500);
    }
  };

  const handlePublishPost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostText.trim()) return;

    // Get any connected platform to verify if user has active handshake
    const activePlatform = socialPlatforms.find(p => p.connected);
    const platformId = activePlatform ? activePlatform.id : 'twitter';
    const authorName = activePlatform ? activePlatform.name : 'Guest Reader';
    const authorHandle = activePlatform ? activePlatform.username : '@guest_cpms_reader';

    const newPost = {
      id: 'custom_' + Date.now(),
      platform: platformId,
      author: authorName,
      handle: authorHandle,
      content: newPostText.trim(),
      time: 'Just now'
    };

    setSocialFeed(prev => [newPost, ...prev]);
    setNewPostText('');
  };

  const activeConnectedCount = socialPlatforms.filter(p => p.connected).length;

  // Filtered news items
  const filteredFeed = selectedFeedCategory === 'all'
    ? newsFeed
    : newsFeed.filter(item => item.category === selectedFeedCategory);

  return (
    <YwcChartWorkspace>
    <div id="ywc-page-canvas" className="min-h-screen bg-[#030003] text-white font-sans selection:bg-[#ff0088] selection:text-white p-4 md:p-8 space-y-8 select-none relative overflow-x-hidden">
      
      {/* Lava / neon atmosphere */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,0,128,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,69,0,0.04)_1px,transparent_1px)] bg-[size:28px_28px] pointer-events-none" />
      <div className="absolute -top-32 left-1/4 w-[700px] h-[500px] bg-[#FF0080]/20 blur-[140px] rounded-full pointer-events-none animate-pulse" />
      <div className="absolute top-1/3 right-0 w-[500px] h-[500px] bg-[#FF4500]/25 blur-[120px] rounded-full pointer-events-none ywc-lava-drift" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[400px] bg-[#BF00FF]/15 blur-[130px] rounded-full pointer-events-none" />

      {/* TOP HEADER MODULE - BRAND PROVENANCE */}
      <YwcLavaPanel rounded="3xl" padding="p-6 md:p-8 pt-7">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-[9px] font-mono tracking-[0.3em] bg-gradient-to-r from-[#FF0080] via-[#FF4500] to-[#FF1493] text-black px-3 py-1 rounded-full font-black uppercase shadow-[0_0_20px_rgba(255,0,128,0.6)]">
                Y.W.C. CORE MODULE
              </span>
              <span className="flex items-center gap-1.5 text-[10px] font-mono text-[#00FF88] font-bold drop-shadow-[0_0_8px_rgba(0,255,136,0.5)]">
                <span className="w-2 h-2 bg-[#00FF88] rounded-full animate-pulse shadow-[0_0_10px_#00FF88]" />
                SYSTEM SECURE Handshake (Port 3000)
              </span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-black font-serif italic tracking-tight flex flex-wrap items-center gap-3 leading-[1.05]">
              <span className="text-white drop-shadow-[0_0_24px_rgba(255,255,255,0.35)]">CPMS</span>
              <span className="ywc-title-lava flex items-center gap-3">
                Your World Connected
                <Flame className="w-10 h-10 md:w-12 md:h-12 text-[#FF4500] fill-[#FF0080] animate-pulse drop-shadow-[0_0_20px_rgba(255,69,0,0.9)] shrink-0" />
              </span>
            </h1>
            
            <p className="text-sm md:text-base text-[#FFD4E8] font-sans max-w-2xl leading-relaxed drop-shadow-[0_0_12px_rgba(255,20,147,0.2)]">
              Welcome to the <span className="text-[#FF1493] font-bold">premium interactive terminal</span>. This workspace fuses elite editorial columns, sports streams, global indices, AI insight systems, live audio monitors, and a <span className="text-[#FF4500] font-bold">15-platform OAuth</span> social sync hub — built for maximum energy, not faded wallpaper.
            </p>
          </div>

          {/* Sync status & manual simulator trigger */}
          <div className="bg-black/70 rounded-2xl border-2 border-[#FF1493]/40 p-4 md:min-w-[280px] space-y-3 shadow-[0_0_24px_rgba(255,20,147,0.2)]">
            <div className="flex items-center justify-between text-[11px] font-mono text-[#FFB3D9]">
              <span>Automatic Chrono Sync:</span>
              <span className="text-[#00E5FF] font-bold drop-shadow-[0_0_6px_#00E5FF]">{xmlPollingInterval} hours</span>
            </div>
            
            <div className="flex items-center justify-between text-[11px] font-mono text-[#FFB3D9]">
              <span>Last Handshake (XML/RSS):</span>
              <span className="text-[#FF4500] font-bold drop-shadow-[0_0_6px_#FF4500]">{lastSyncTime}</span>
            </div>

            {/* Simulated cron rate changer */}
            <div className="flex items-center gap-2 pt-1 border-t border-[#FF1493]/30">
              <span className="text-[10px] font-mono text-[#FF69B4]">SET CRON RATE:</span>
              <button 
                onClick={() => setXmlPollingInterval(6)} 
                className={`px-2 py-0.5 rounded text-[9px] font-mono transition-all font-bold ${xmlPollingInterval === 6 ? 'bg-gradient-to-r from-[#FF0080] to-[#FF4500] text-white shadow-[0_0_12px_#FF4500]' : 'bg-zinc-900 text-zinc-400 hover:text-[#FF1493]'}`}
              >
                6 Hours
              </button>
              <button 
                onClick={() => setXmlPollingInterval(12)} 
                className={`px-2 py-0.5 rounded text-[9px] font-mono transition-all font-bold ${xmlPollingInterval === 12 ? 'bg-gradient-to-r from-[#FF0080] to-[#FF4500] text-white shadow-[0_0_12px_#FF4500]' : 'bg-zinc-900 text-zinc-400 hover:text-[#FF1493]'}`}
              >
                12 Hours
              </button>
            </div>
          </div>
        </div>
      </YwcLavaPanel>

      {/* AUTO UPDATE SIMULATION CONSOLE LOG (CRON, XML/RSS PIPELINE TO REACT) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Core Live Update & RSS Engine Simulator */}
        <YwcLavaPanel className="lg:col-span-8 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#FF1493]/25">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-[#FF4500]/15 text-[#FF4500] shadow-[0_0_12px_rgba(255,69,0,0.35)]">
                <RefreshCw size={19} className={isSimulatingFetch ? 'animate-spin' : ''} />
              </div>
              <div>
                <YwcSectionTitle className="text-sm font-sans">
                  RSS Fetch & Node Parser Simulator
                </YwcSectionTitle>
                <p className="text-[11px] text-zinc-500 font-mono">
                  Convert live streams (ESPN, Formula 1, AP, Reuters, CoinDesk) into reactive grid matrices
                </p>
              </div>
            </div>

            <button
              onClick={handleSimulateRSSFetch}
              disabled={isSimulatingFetch}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-300 flex items-center gap-2 cursor-pointer ${
                isSimulatingFetch 
                  ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed' 
                  : 'bg-gradient-to-r from-[#FF0080] via-[#FF4500] to-[#FF8C00] text-black hover:shadow-[0_0_24px_rgba(255,69,0,0.55)]'
              }`}
            >
              <span>{isSimulatingFetch ? 'PROCESSING FEED...' : 'FORCE RSS XML FETCH'}</span>
            </button>
          </div>

          {/* Logging console resembling standard terminal */}
          <div className="bg-black/95 rounded-xl border border-white/5 p-4 font-mono text-[11px] leading-relaxed relative min-h-[120px] max-h-[160px] overflow-y-auto space-y-1.5 custom-scrollbar">
            {simulatedLogs.length === 0 ? (
              <div className="text-zinc-500 italic text-center py-6">
                Console idle. Click "FORCE RSS XML FETCH" to inspect XML-to-JSON telemetry lifecycle...
              </div>
            ) : (
              simulatedLogs.map((log, idx) => (
                <div key={idx} className={idx === simulatedLogs.length - 1 ? "text-cyan-400 font-medium animate-pulse" : "text-zinc-400"}>
                  {log}
                </div>
              ))
            )}
          </div>

          {/* Progress bar */}
          {isSimulatingFetch && (
            <div className="space-y-1">
              <div className="flex justify-between text-[10px] font-mono text-zinc-400">
                <span>BUFFERING XML PACKS</span>
                <span>{fetchProgress}%</span>
              </div>
              <div className="h-1.5 w-full bg-zinc-950 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-[#ff0088] to-[#00f0ff] transition-all duration-300" style={{ width: `${fetchProgress}%` }} />
              </div>
            </div>
          )}
        </YwcLavaPanel>

        {/* Global Indices Quick View (MARKET WATCH PANEL) */}
        <YwcLavaPanel className="lg:col-span-4 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#FF1493]/25">
            <div className="flex items-center gap-2">
              <TrendingUp size={16} className="text-[#FF4500] drop-shadow-[0_0_8px_#FF4500]" />
              <YwcSectionTitle className="text-xs tracking-widest">
                MARKET WATCH (GLOBAL DESK)
              </YwcSectionTitle>
            </div>
            <span className="text-[10px] bg-zinc-900 border border-white/10 text-zinc-400 px-2 py-0.5 rounded font-mono">
              REAL PARITY
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3.5">
            {marketIndices.map((item, idx) => (
              <div 
                key={idx} 
                className="bg-black/40 border border-white/5 rounded-xl p-3 hover:border-[#ff0088]/20 transition-all duration-300 relative overflow-hidden"
              >
                <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500">
                  <span>{item.name}</span>
                  <span className="font-bold text-zinc-400">{item.ticker}</span>
                </div>
                
                <div className="mt-1.5 font-bold font-sans text-sm tracking-tight">
                  {item.value.toLocaleString(undefined, { minimumFractionDigits: item.name.includes('EUR') ? 4 : 2 })}
                </div>

                <div className={`mt-0.5 text-[10px] font-mono flex items-center gap-1 ${item.isPositive ? 'text-emerald-400' : 'text-rose-500'}`}>
                  {item.isPositive ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                  <span>{item.isPositive ? '+' : ''}{item.pct}%</span>
                </div>

                {/* Subtle side glowing line indicator */}
                <div className={`absolute left-0 top-0 bottom-0 w-[2px] ${item.isPositive ? 'bg-emerald-500' : 'bg-rose-500'}`} />
              </div>
            ))}
          </div>
        </YwcLavaPanel>

      </div>

      {/* CORE DIGITAL NEWSPAPER WIREFRAME (REACTIVE SECTIONS FEEDS) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Main Content Column (Sports, News, Finance, Crypto, etc.) */}
        <div className="lg:col-span-8 space-y-8">

          <YwcLavaPanel rounded="3xl" padding="p-4 md:p-5" className="space-y-0">
          {/* Main Filter categories row (Authentic newspaper navigation rhythm) */}
          <div className="flex items-center justify-between pb-4 border-b-2 border-[#FF4500]/30">
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
              <span className="text-sm font-black text-[#39ff14] uppercase tracking-wider shrink-0 pr-2 border-r border-white/10 hidden sm:inline">
                SECTIONS:
              </span>
              {[
                { id: 'all', label: 'ALL NEWS' },
                { id: 'sports', label: 'WORLD SPORTS' },
                { id: 'news', label: 'WORLD HUB' },
                { id: 'relief', label: 'RELIEF / HUMANITARIAN' },
                { id: 'finance', label: 'GLOBAL FINANCE' },
                { id: 'crypto', label: 'CRYPTO' },
                { id: 'politics', label: 'POLITICAL HUB' },
                { id: 'tech', label: 'TECH' },
                { id: 'magazine', label: 'MAGAZINE EDITS' }
              ].map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedFeedCategory(cat.id as any)}
                  className={`px-3 py-1 text-xs font-black uppercase tracking-wider rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                    selectedFeedCategory === cat.id 
                      ? 'bg-[#39ff14] text-black shadow-[0_0_15px_rgba(57,255,20,0.65)] font-extrabold' 
                      : 'text-zinc-400 hover:text-[#39ff14] hover:bg-zinc-900/50'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
            
            <div className="h-2 w-2 rounded-full bg-[#FF4500] animate-ping hidden lg:block shadow-[0_0_10px_#FF4500]" />
          </div>
          </YwcLavaPanel>

          {selectedFeedCategory === 'all' && (
            <YwcLavaPanel as="section" rounded="3xl" padding="p-6 md:p-10" className="min-h-[460px] flex flex-col justify-end animate-fade-in group">
              <img 
                src={featuredStory.image}
                alt={featuredStory.title}
                referrerPolicy="no-referrer"
                className="absolute inset-0 w-full h-full object-cover opacity-35 group-hover:scale-102 transition-transform duration-700 pointer-events-none"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent pointer-events-none" />
              
              <div className="relative z-10 space-y-4">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="bg-[#ff0088] text-white text-[9px] font-mono font-black tracking-widest px-3 py-1 rounded">
                    HERO TOP STORY
                  </span>
                  <span className="bg-[#00f0ff]/10 text-[#00f0ff] border border-[#00f0ff]/20 text-[9px] font-mono px-2.5 py-1 rounded">
                    {digestLoading ? 'SYNCING RSS…' : 'LIVE RSS'}
                  </span>
                  <span className="text-zinc-400 text-xs font-mono">{lastSyncTime}</span>
                </div>

                <h2
                  className="text-3xl md:text-5xl font-serif italic font-black leading-tight text-white max-w-3xl hover:text-cyan-400 transition-colors pointer-events-auto cursor-pointer"
                  onClick={() => setActiveStoryDetails(featuredStory)}
                >
                  {featuredStory.title}
                </h2>

                <p className="text-zinc-300 font-sans text-xs md:text-sm max-w-2xl leading-relaxed">
                  {featuredStory.desc}
                </p>

                <div className="flex items-center justify-between pt-4 border-t border-white/5">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#ff0088] to-[#00f0ff] flex items-center justify-center p-[1px]">
                      <div className="w-full h-full bg-zinc-950 rounded-full flex items-center justify-center text-[10px] font-bold text-white font-mono">
                        CP
                      </div>
                    </div>
                    <div>
                      <span className="text-[11px] font-bold text-zinc-300 block">{featuredStory.source}</span>
                      <span className="text-[9px] font-mono text-zinc-500">{featuredStory.time}</span>
                    </div>
                  </div>

                  <button 
                    onClick={() => setActiveStoryDetails(featuredStory)}
                    className="px-5 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white border border-white/10 hover:border-[#ff0088] rounded-xl text-xs font-black tracking-wider transition-all duration-300 cursor-pointer"
                  >
                    READ COVERAGE
                  </button>
                </div>
                {digestError && (
                  <p className="text-[10px] font-mono text-amber-400/90">Feed cache warming — showing fallback until RSS reconnects.</p>
                )}
              </div>
            </YwcLavaPanel>
          )}

          {selectedFeedCategory === 'politics' ? (
            <YwcLavaPanel rounded="3xl"><PoliticalHub /></YwcLavaPanel>
          ) : selectedFeedCategory === 'finance' ? (
            <YwcLavaPanel rounded="3xl"><GlobalFinance /></YwcLavaPanel>
          ) : selectedFeedCategory === 'magazine' ? (
            <YwcLavaPanel rounded="3xl"><MagazineHub /></YwcLavaPanel>
          ) : selectedFeedCategory === 'news' ? (
            <YwcLavaPanel rounded="3xl"><WorldHub /></YwcLavaPanel>
          ) : (
            <>
              {/* DYNAMIC STORIES GRID */}
              <YwcLavaPanel className="space-y-4">
                <YwcSectionTitle className="text-xs tracking-[0.2em]">
                  Online Newspaper — Live Editorial Grid
                </YwcSectionTitle>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <AnimatePresence mode="popLayout">
                  {filteredFeed.map((article) => (
                    <motion.article 
                      key={article.id}
                      layout
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="bg-zinc-950/80 border border-white/5 hover:border-[#ff0088]/20 rounded-2xl overflow-hidden hover:shadow-[0_8px_30px_rgba(255,0,136,0.04)] hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between"
                    >
                      <div className="relative h-48 w-full overflow-hidden">
                        <img 
                          src={article.image} 
                          alt={article.title} 
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                        />
                        <div className="absolute top-3 left-3 flex gap-2">
                          <span className="bg-[#ff0088]/90 text-white text-[8px] font-mono font-black tracking-widest px-2 py-0.5 rounded uppercase">
                            {article.subcategory}
                          </span>
                          {article.premium && (
                            <span className="bg-yellow-500 text-black text-[8px] font-mono font-black tracking-widest px-2 py-0.5 rounded">
                              PREMIUM
                            </span>
                          )}
                        </div>
                        <div className="absolute bottom-2 right-2 text-[10px] font-mono bg-zinc-950/85 text-zinc-400 px-2 py-0.5 rounded">
                          {article.time}
                        </div>
                      </div>

                      <div className="p-5 space-y-3 flex-1 flex flex-col justify-between">
                        <div className="space-y-2">
                          <div className="flex items-center gap-1.5 text-[9px] font-mono text-zinc-500 uppercase tracking-widest">
                            <span>{article.category}</span>
                            <span>•</span>
                            <span>{article.source}</span>
                          </div>

                          <h4 className="text-base font-serif font-black italic text-white hover:text-cyan-400 transition-colors line-clamp-2 cursor-pointer" onClick={() => setActiveStoryDetails(article)}>
                            {article.title}
                          </h4>

                          <p className="text-zinc-400 text-xs line-clamp-3 leading-relaxed">
                            {article.desc}
                          </p>
                        </div>

                        <div className="pt-3 border-t border-white/5 flex items-center justify-between">
                          <span className="text-[10px] font-mono text-zinc-500">
                            {article.source}
                          </span>
                          <button 
                            onClick={() => setActiveStoryDetails(article)}
                            className="text-xs text-[#00f0ff] font-bold tracking-widest hover:text-[#ff0088] transition-colors flex items-center gap-1"
                          >
                            <span>EXPAND</span>
                            <ChevronRight size={14} />
                          </button>
                        </div>
                      </div>
                    </motion.article>
                  ))}
                </AnimatePresence>
              </div>
              </YwcLavaPanel>

              {/* AI INSIGHTS & ANALYSES SECTION */}
              <YwcLavaPanel as="section" className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-[#FF1493]/25">
                  <div className="flex items-center gap-2">
                    <Sparkles className="text-[#FF4500] drop-shadow-[0_0_8px_#FF4500]" size={18} />
                    <YwcSectionTitle className="text-sm font-sans">
                      CPMS COGNITIVE AI INSIGHTS
                    </YwcSectionTitle>
                  </div>
                  <span className="text-[10px] bg-[#ff0088]/10 text-[#ff0088] border border-[#ff0088]/20 px-2 py-0.5 rounded font-mono font-bold">
                    GENERATIVE SUMMARY STACK
                  </span>
                </div>

                <p className="text-xs text-zinc-400 leading-relaxed font-sans">
                  AI scans thousands of global RSS XML feeds, indices data structures, and OTC desk volume spreads to formulate synthesized bullet intelligence maps:
                </p>

                <div className="space-y-3.5 pt-3">
                  <div className="bg-black/60 border border-white/5 rounded-xl p-4 space-y-2 relative overflow-hidden">
                    <div className="absolute top-0 left-0 bottom-0 w-[3px] bg-[#00f0ff]" />
                    <h4 className="text-xs font-black text-[#00f0ff] font-mono block">
                      TRENDING: SEMICONDUCTOR SOVEREIGNTY VECTORS
                    </h4>
                    <p className="text-[11px] text-zinc-300 leading-relaxed">
                      Sub-3nm hardware fabrication facilities face deep expansion bottlenecks due to power utility capacity limits in local sectors. Commodity desks bid up energy options anticipating long-term multi-processor loads.
                    </p>
                  </div>

                  <div className="bg-black/60 border border-white/5 rounded-xl p-4 space-y-2 relative overflow-hidden">
                    <div className="absolute top-0 left-0 bottom-0 w-[3px] bg-[#ff0088]" />
                    <h4 className="text-xs font-black text-[#ff0088] font-mono block">
                      MACRO: YIELD CONVERGENCE POLICIES
                    </h4>
                    <p className="text-[11px] text-zinc-300 leading-relaxed">
                      Bond pricing curves indicate aggressive short-covering triggers. International arbitrage trusts rotate capital out of zero-yield bill baskets into sovereign medium-duration debt instruments to secure peak rates.
                    </p>
                  </div>
                </div>
              </YwcLavaPanel>
            </>
          )}

        </div>

        {/* Sidebar Column (charts, live TV, social OAuth) */}
        <div className="lg:col-span-4 space-y-8 lg:sticky lg:top-6 lg:self-start">
          
          {/* Independent live charts — right rail beside editorial grid */}
          <YwcChartSection variant="sidebar" />

          {/* CPMS Media Pantry — radio, live TV embeds, podcast search */}
          <YwcLavaPanel className="space-y-4">
            <CpmsMediaPantry />
          </YwcLavaPanel>

          {/* SOCIAL MEDIA OAUTH HANDSHAKE PORTAL (15 PLATFORMS INTEGRATED) */}
          <YwcLavaPanel className="space-y-4">
            <div className="flex flex-col space-y-1.5 pb-3 border-b border-[#FF1493]/25">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Share2 size={17} className="text-[#FF1493] drop-shadow-[0_0_8px_#FF1493]" />
                  <YwcSectionTitle className="text-xs tracking-widest">
                    OATH SOCIAL SYNC HUB
                  </YwcSectionTitle>
                </div>
                <span className="text-[10px] font-mono bg-cyan-950/50 text-[#00f0ff] border border-[#00f0ff]/25 px-2 py-0.5 rounded font-black">
                  {activeConnectedCount} / 15 SYNCED
                </span>
              </div>
              <p className="text-[10px] text-zinc-500 font-sans leading-normal">
                Click any provider logo to establish simulated OAuth key verifying handshake, anchoring credentials into our WebSocket broadcast registry.
              </p>
            </div>

            {/* Integrated grid of 15 Social platforms */}
            <div className="grid grid-cols-3 gap-2">
              {socialPlatforms.map((platform) => {
                const isActive = platform.connected;
                const isConnecting = platform.isConnecting;
                return (
                  <button
                    key={platform.id}
                    onClick={() => handleTriggerSocialConnect(platform.id, platform.name)}
                    className={`p-2.5 rounded-xl border text-center flex flex-col items-center justify-center gap-1 transition-all active:scale-95 cursor-pointer relative overflow-hidden ${
                      isActive 
                        ? 'border-emerald-500/40 bg-emerald-950/10 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.1)]' 
                        : isConnecting 
                          ? 'border-yellow-500/40 bg-zinc-900 text-yellow-400 animate-pulse' 
                          : 'border-white/5 bg-zinc-950 text-zinc-400 ' + platform.color
                    }`}
                  >
                    <span className="text-[10px] font-mono font-bold tracking-tight block">
                      {platform.name}
                    </span>

                    <span className="text-[8px] font-mono text-zinc-650 opacity-70 block">
                      {isActive ? 'SYNCED' : isConnecting ? 'HANDSHAKE' : 'CONNECT'}
                    </span>

                    {/* Small visual dot marker */}
                    <div className={`absolute bottom-1.5 right-1.5 w-1 h-1 rounded-full ${isActive ? 'bg-emerald-500 shadow-[0_0_4px_#34d399]' : 'bg-transparent'}`} />
                  </button>
                );
              })}
            </div>

            {/* Active Social Broadcaster composing board */}
            <div className="bg-zinc-950 p-4 rounded-xl border border-white/5 space-y-3">
              <h4 className="text-[10px] font-mono tracking-widest text-zinc-400 uppercase font-black">
                WS INSTANT BROADCAST DESK
              </h4>

              <form onSubmit={handlePublishPost} className="space-y-2">
                <textarea
                  rows={2}
                  maxLength={160}
                  value={newPostText}
                  onChange={(e) => setNewPostText(e.target.value)}
                  placeholder={
                    activeConnectedCount > 0 
                      ? `Anchored on ${socialPlatforms.find(p => p.connected)?.name}. Type live broadcast...` 
                      : "Handshake at least one platform above to unlock visual broadcast stream..."
                  }
                  className="w-full bg-black border border-white/5 rounded-lg p-2 text-xs text-white focus:border-[#ff0088] outline-none font-sans leading-relaxed resize-none"
                />

                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-mono text-zinc-600">
                    Characters remaining: {160 - newPostText.length}
                  </span>
                  <button
                    type="submit"
                    disabled={!newPostText.trim()}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-mono font-black uppercase transition-all flex items-center gap-1 cursor-pointer ${
                      newPostText.trim() 
                        ? 'bg-[#ff0088] text-white hover:shadow-[0_0_10px_rgba(255,0,136,0.3)]' 
                        : 'bg-zinc-900 text-zinc-600 cursor-not-allowed'
                    }`}
                  >
                    <Send size={10} />
                    <span>TRANSMIT BROKER</span>
                  </button>
                </div>
              </form>
            </div>

            {/* Consolidated stream preview */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500 uppercase">
                <span>CONSOLIDATED FEED MONITOR</span>
                <span>Port 3000 broadcast</span>
              </div>

              <div className="space-y-2 max-h-[220px] overflow-y-auto no-scrollbar">
                {socialFeed.map((item) => (
                  <div key={item.id} className="bg-black/50 border border-white/5 rounded-xl p-3 space-y-1">
                    <div className="flex items-center justify-between text-[10px]">
                      <div className="flex items-center gap-1.5">
                        <span className="text-zinc-300 font-bold">{item.author}</span>
                        <span className="text-zinc-500 font-mono text-[9px]">{item.handle}</span>
                      </div>
                      <span className="text-zinc-600 font-mono text-[8.5px]">{item.time}</span>
                    </div>
                    <p className="text-[11px] text-zinc-400 font-sans leading-relaxed">
                      {item.content}
                    </p>
                  </div>
                ))}
              </div>
            </div>

          </YwcLavaPanel>

        </div>

      </div>

      {/* DETAILED COVERAGE READER modal */}
      <AnimatePresence>
        {activeStoryDetails && (
          <div className="fixed inset-0 z-[110] bg-black/90 flex items-center justify-center p-4 select-none">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className={`bg-[#0b0b0d] border border-[#ff0088]/40 rounded-3xl ${activeStoryDetails.id === 'optimistic-injustice' ? 'max-w-4xl' : 'max-w-2xl'} w-full text-left overflow-hidden shadow-[0_24px_50px_rgba(0,0,0,0.9)] flex flex-col justify-between max-h-[90vh]`}
            >
              <div className="p-6 md:p-8 overflow-y-auto custom-scrollbar space-y-6">
                
                {/* Header detail */}
                <div className="flex items-center justify-between pb-3 border-b border-white/10">
                  <div className="flex items-center gap-2">
                    <span className="bg-[#ff0088] text-white text-[9px] font-mono font-black tracking-widest px-2.5 py-0.5 rounded uppercase">
                      {activeStoryDetails.subcategory}
                    </span>
                    <span className="text-zinc-500 text-[10px] font-mono">
                      {activeStoryDetails.time} • {activeStoryDetails.source}
                    </span>
                  </div>
                  
                  <button 
                    onClick={() => setActiveStoryDetails(null)}
                    className="p-1 px-3 text-red-400 bg-red-950/25 border border-red-900/30 rounded-lg text-[10px] font-mono hover:text-white hover:bg-red-950 transition-all cursor-pointer"
                  >
                    CLOSE [ESC]
                  </button>
                </div>

                {activeStoryDetails.id === 'optimistic-injustice' ? (
                  <OptimisticInjusticeArticle />
                ) : (
                  <>
                    <h3 className="text-2xl md:text-3.5xl font-serif italic text-white font-black leading-tight">
                      {activeStoryDetails.title}
                    </h3>

                    <p className="text-zinc-400 text-sm leading-relaxed border-l-2 border-[#00f0ff] pl-4 italic">
                      {activeStoryDetails.desc}
                    </p>

                    <div className="text-zinc-300 text-xs md:text-sm font-sans leading-relaxed space-y-4">
                      <p>{activeStoryDetails.longText}</p>
                      <p>Our spot research desk expects these metrics will solidify near-term market parameters. Central registers show sudden arbitrage spikes which correlate perfectly with past historical patterns tracked inside the CPMS Economic Memory Matrix database structures.</p>
                    </div>
                  </>
                )}
              </div>

              {/* Modal footer credentials */}
              <div className="bg-zinc-950 px-6 py-4 border-t border-white/10 flex items-center justify-between text-zinc-500 font-mono text-[10px]">
                <span>PUBLICATION: CPMS DIGITAL PARITY INDEX</span>
                <span>SECURE Handshake VERIFIED</span>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* PERSISTENT SCROLLING TICKER FOOTER (14. REQUIRED TICKER) */}
      <YwcLavaPanel as="footer" padding="p-4" className="w-full flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 bg-[#ff0088]/10 text-[#ff0088] border border-[#ff0088]/20 px-3.5 py-1.5 rounded-xl shrink-0">
          <Radio size={14} className="animate-pulse" />
          <span className="text-[10px] font-mono font-black tracking-widest">
            CPMS REAL-TIME STREAM TICKER:
          </span>
        </div>

        {/* Scrolling text container */}
        <div className="flex-1 overflow-hidden h-6 relative bg-zinc-950/40 rounded border border-white/5 sm:mx-2">
          <div className="absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-zinc-950 to-transparent z-10 pointer-events-none" />
          <div className="absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-zinc-950 to-transparent z-10 pointer-events-none" />
          
          <div className="flex items-center gap-12 whitespace-nowrap animate-marquee absolute top-1/2 -translate-y-1/2 text-[12px] font-mono text-zinc-300">
            {tickerItems.map((item, idx) => {
              const isBreaking = item.startsWith("🔥");
              const displayText = isBreaking ? item.replace("🔥 BREAKING:", "") : item;
              return (
                <span key={idx} className="flex items-center gap-2.5">
                  <span className="text-[#00f0ff] font-bold">•</span>
                  {isBreaking ? (
                    <span className="flex items-center gap-1.5 shrink-0">
                      <Flame className="w-4 h-4 text-[#ff00c8] fill-[#ff00c8] animate-pulse drop-shadow-[0_0_8px_rgba(255,0,200,0.5)]" />
                      <span className="text-[#ff00c8] font-bold text-[12.5px] uppercase tracking-widest animate-pulse font-mono">BREAKING:</span>
                      <span className="text-[12px] font-sans font-semibold text-zinc-150">{displayText}</span>
                    </span>
                  ) : (
                    <span>{item}</span>
                  )}
                </span>
              );
            })}
          </div>
        </div>

        <div className="text-[9.5px] font-mono text-zinc-500 shrink-0 uppercase">
          © 2026 CPMS Media Group. ALL RIGHTS ANCHORED.
        </div>
      </YwcLavaPanel>

    </div>
    </YwcChartWorkspace>
  );
}
