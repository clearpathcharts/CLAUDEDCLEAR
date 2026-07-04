import React, { useState, useEffect, useRef, Suspense, lazy, useMemo } from 'react';
import { 
  Home, 
  Newspaper, 
  MapPin, 
  FileText, 
  Image as ImageIcon, 
  Search, 
  MessageSquare, 
  Bell, 
  Mail, 
  Plus, 
  Heart, 
  Share2, 
  MoreHorizontal,
  ChevronDown,
  ArrowLeft,
  User,
  CheckCircle2,
  Clock,
  LayoutDashboard,
  TrendingUp,
  Navigation,
  Brain,
  Activity,
  Compass,
  BookOpen,
  Building2,
  BarChart3,
  Shield,
  AlertTriangle,
  LogOut,
  Zap,
  Edit3,
  Link as LinkIcon,
  Book,
  Layout,
  Terminal,
  Cpu,
  X,
  Users,
  Trophy,
  Briefcase,
  Grid,
  ShoppingCart,
  Globe,
  Calendar,
  Map,
  Landmark,
  SlidersHorizontal,
  ShieldAlert,
  Crown
} from 'lucide-react';
import { getFriendlyLocation } from '../services/locationService';
import { motion, AnimatePresence } from 'motion/react';
import { AdvancedProfile } from '../lib/advanced/profiles';
import { UserProfile } from '../types';

interface DashboardProps {
  profile: AdvancedProfile;
  onProfileChange: (profileId: string) => void;
}

import { advancedProfiles } from '../lib/advanced/profiles';
import { useAuth } from '../contexts/FirebaseContext';
import { setClearState } from '../lib/trading/clearState';

import SEO from './SEO';
import { ChartFrame } from './charts/ChartFrame';
import { InteractiveChart } from './charts/InteractiveChart';
import { LightweightCandles } from './charts/LightweightCandles';
import ThemeSelector from './ThemeSelector';
import MeetTheBoard from './MeetTheBoard';
import { ProfileHub } from './ProfileHub';
import AffiliateDashboard from './profile/AffiliateDashboard';
import YoursPage from './yours/YoursPage';
import MembershipTab from './MembershipTab';
import PatternOverlay from './PatternOverlay';
import { isVideoUrl, isAudioUrl } from '../lib/utils';
import { chartThemes } from '../config/chartThemes';
import { AnalysisEvent } from '../types';

import { ClearNav } from './nav/ClearNav';
import { BackToDashboard } from './nav/BackToDashboard';
import { getClearState, subscribeToClearState } from '../lib/trading/clearState';

import TradingJournal from './TradingJournal';
import BreakingNewsTicker from './BreakingNewsTicker';
import SystemIntelligencePanel from './SystemIntelligencePanel';

// Lazy load sub-components
const GoogleDesk = lazy(() => import('./GoogleDesk'));
const LegalFooter = lazy(() => import('./LegalFooter'));
const AdditionalTermsOfService = lazy(() => import('./AdditionalTermsOfService'));
const LiveChart = lazy(() => import('./LiveChart'));
const CeoDashboard = lazy(() => import('./CeoDashboard'));
const TodoList = lazy(() => import('./TodoList'));
const MarketTicker = lazy(() => import('./MarketTicker'));
const GetVerified = lazy(() => import('./GetVerified'));
const ShareQRCode = lazy(() => import('./ShareQRCode'));
const LightweightMarketUI = lazy(() => import('./markets/LightweightMarketUI').then(m => ({ default: m.LightweightMarketUI })));
const StandardMarketUI = lazy(() => import('./markets/StandardMarketUI').then(m => ({ default: m.StandardMarketUI })));
const MarketScanner = lazy(() => import('./MarketScanner'));
const MarketHeatmap = lazy(() => import('./MarketHeatmap'));
const MacroDashboard = lazy(() => import('./MacroDashboard'));
const EconomicCalendar = lazy(() => import('./EconomicCalendar'));
const FundamentalsPanel = lazy(() => import('./FundamentalsPanel'));
const GeographicMap = lazy(() => import('./GeographicMap'));
const AdvancedScreener = lazy(() => import('./AdvancedScreener'));
const CapitalFlowMap = lazy(() => import('./CapitalFlowMap'));
const AlertsCenter = lazy(() => import('./AlertsCenter'));
const PortfolioTracker = lazy(() => import('./PortfolioTracker'));
const StrategyMarket = lazy(() => import('./StrategyMarket'));
const Leaderboard = lazy(() => import('./Leaderboard'));
const CpmsApk = lazy(() => import('./CpmsApk'));
const ClearPathSentinel = lazy(() => import('./ClearPathSentinel'));
const MarketDiagnostics = lazy(() => import('./MarketDiagnostics'));
import EncyclopediaOfIndicators from './EncyclopediaOfIndicators';
import EncyclopediaLayout from './encyclopedia/EncyclopediaLayout';
const RiverWorkstation = lazy(() => import('./RiverWorkstation'));
const ClearPathEducationPage = lazy(() => import('../education/ClearPathEducation'));

function TabLoading() {
  return (
    <div className="w-full h-full flex items-center justify-center p-12 bg-zinc-950/20">
      <div className="w-16 h-16 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
    </div>
  );
}

const CustomNavIcon = ({ size = 16, className = '', style = {} }: { size?: number, className?: string, style?: any }) => (
  <Activity size={size} className={className} style={{ ...style, filter: style.color ? `drop-shadow(0 0 5px ${style.color})` : 'none' }} />
);


import NewsPanel from './NewsPanel';
import DiscoveryFeed from './DiscoveryFeed';
import FoundersPortal from './FoundersPortal';
import KillZones from './KillZones';

const ThemeTerminalTab = ({ chartTheme, setChartTheme, profile, onProfileChange }: { chartTheme: any, setChartTheme: (t: any) => void, profile: any, onProfileChange: (p: any) => void }) => {
  const [userTier, setUserTier] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('clearpath_user_tier');
      if (saved) return saved;
    } catch (e) {}
    return "VIP";
  });

  const handleSetUserTier = (tier: string) => {
    setUserTier(tier);
    try {
      localStorage.setItem('clearpath_user_tier', tier);
    } catch (e) {}
  };

  const ProfileButton = ({ id, label, active }: { id: string, label: string, active: string }) => {
    return (
      <button
        onClick={() => {
          const profileData = Object.values(advancedProfiles).find(p => p.id === id);
          if (profileData) onProfileChange(profileData.id);
        }}
        className={`px-3 py-3 rounded-xl border transition-all text-[10px] font-bold uppercase tracking-wide leading-tight break-words whitespace-normal text-center min-h-[64px] flex items-center justify-center shadow-[0_0_10px_rgba(127,0,255,0.15)]
          ${active === id 
            ? 'border-[#7F00FF] bg-[#7F00FF]/10 text-white shadow-[0_0_20px_rgba(127,0,255,0.5)]' 
            : 'border-[#7F00FF]/30 bg-black/40 text-[#64677a] hover:border-[#7F00FF]/60 hover:text-white hover:shadow-[0_0_15px_rgba(127,0,255,0.3)]'}`}
      >
        {label}
      </button>
    );
  };

  return (
    <div className="space-y-8 flex flex-col">
      {/* SYSTEM INTERFACE PROFILE - NEURO-ADAPTIVE RECOVERY BLOCK */}
      <div className="mt-8 px-6">
        <h3 className="text-xs font-bold uppercase tracking-wider mb-4 text-zinc-300">
          Personal Preferences
        </h3>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {/* ROW 1 */}
          <ProfileButton id="calm_focus" label="CALM_FOCUS" active={profile.id} />
          <ProfileButton id="low_stim_emergency" label="LOW_STIM_EMERGENCY" active={profile.id} />
          <ProfileButton id="dyslexia_readable" label="DYSLEXIA_READABLE" active={profile.id} />
          <ProfileButton id="dyscalculia_numeric_relief" label="DYSCALCULIA_NUMERIC_RELIEF" active={profile.id} />
          
          {/* ROW 2 */}
          <ProfileButton id="visual_processing_safe" label="VISUAL_PROCESSING_SAFE" active={profile.id} />
          <ProfileButton id="apd_assist" label="APD_ASSIST" active={profile.id} />
          <ProfileButton id="executive_function_support" label="EXECUTIVE_FUNCTION_SUPPORT" active={profile.id} />
          <ProfileButton id="motor_friendly" label="MOTOR_FRIENDLY" active={profile.id} />
          
          {/* ROW 3 */}
          <ProfileButton id="adhd_dopamine_balanced" label="ADHD_DOPAMINE_BALANCED" active={profile.id} />
          <ProfileButton id="adhd_hyperfocus" label="ADHD_HYPERFOCUS" active={profile.id} />
          <ProfileButton id="autism_predictable" label="AUTISM_PREDICTABLE" active={profile.id} />
          <ProfileButton id="tourette_tic_friendly" label="TOURETTE_TIC_FRIENDLY" active={profile.id} />
          

        </div>
      </div>
      
      {/* SOVEREIGN USER TIER CONNECTION ENGINE CONTROLLER */}
      <div className="mt-8 px-6">
        <h3 className="text-xs font-bold uppercase tracking-wider mb-4 text-zinc-300">
          Data Depth Options
        </h3>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-black/40 p-4 rounded-2xl border border-zinc-900 shadow-xl relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-[#00D9FF]/5 to-[#FF00C8]/5 pointer-events-none opacity-40 blur-lg" />
          
          {[
            { id: "BRONZE", label: "BRONZE CORE", count: "5,000 Candles", color: "#FFaa00", desc: "Standard Retails Pool" },
            { id: "SILVER", label: "SILVER EXPANDED", count: "10,000 Candles", color: "#C0C0C0", desc: "Advanced Signal Loop" },
            { id: "GOLD", label: "GOLD INSTITUTIONAL", count: "20,000 Candles", color: "#FFD700", desc: "Depth Analytical Cluster" },
            { id: "VIP", label: "VIP COMMANDER (40K)", count: "40,000 Candles", color: "#FF00C8", desc: "Full Sovereign Latency" }
          ].map((item) => {
            const isSelected = userTier === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleSetUserTier(item.id)}
                className={`group px-4 py-3.5 rounded-xl border text-left transition-all relative overflow-hidden cursor-pointer ${
                  isSelected 
                    ? 'border-transparent text-white shadow-[0_0_20px_rgba(255,0,200,0.15)]' 
                    : 'border-zinc-800 bg-[#060611] text-zinc-400 hover:border-zinc-750 hover:text-white'
                }`}
                style={{
                  background: isSelected ? 'linear-gradient(135deg, rgba(3, 1, 11, 0.95) 0%, rgba(20, 10, 45, 0.9) 100%)' : undefined,
                  borderImage: isSelected ? `linear-gradient(135deg, ${item.color}, #7A3BFF, #00D9FF) 1` : undefined,
                  borderLeft: isSelected ? `4px solid ${item.color}` : '1px solid rgba(255, 255, 255, 0.05)'
                }}
              >
                {/* Active neon pointer line */}
                {isSelected && (
                  <div className="absolute top-0 right-0 w-1.5 h-1.5 rounded-bl bg-[#00D9FF] animate-ping" />
                )}
                
                <div className="flex items-center justify-between pointer-events-none">
                  <span className="text-[10px] font-mono tracking-widest font-black uppercase" style={{ color: isSelected ? item.color : '#64677a' }}>
                    {item.label}
                  </span>
                  {isSelected && <Zap size={10} className="text-[#00D9FF] animate-pulse shrink-0" />}
                </div>
                
                <p className="font-bold text-sm tracking-wide mt-1.5 group-hover:text-white transition-colors">
                  {item.count}
                </p>
                <p className="text-[8px] font-mono text-zinc-500 mt-1 uppercase">
                  {item.desc}
                </p>
              </button>
            )
          })}
        </div>
      </div>

      <div className="flex flex-col space-y-3 mt-6">
        <ThemeSelector />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 min-h-[800px] mt-4">
        <InteractiveChart title="BTCUSD" profileId={profile.id} theme={chartTheme} userTier={userTier} />
        <InteractiveChart title="ETHUSD" profileId={profile.id} theme={chartTheme} userTier={userTier} />
        <InteractiveChart title="AAPL" profileId={profile.id} theme={chartTheme} userTier={userTier} />
        <InteractiveChart title="SPY" profileId={profile.id} theme={chartTheme} userTier={userTier} />
      </div>
    </div>
  );
};

const DATA_ONLY_MARKETS = [
  { label: 'EUR/USD', value: 'EURUSD' },
  { label: 'GBP/USD', value: 'GBPUSD' },
  { label: 'USD/JPY', value: 'USDJPY' },
  { label: 'AUD/USD', value: 'AUDUSD' },
  { label: 'USD/CAD', value: 'USDCAD' },
  { label: 'NZD/USD', value: 'NZDUSD' },
  { label: 'XAU/USD', value: 'XAUUSD' },
  { label: 'XAG/USD', value: 'XAGUSD' },
  { label: 'BTC/USD', value: 'BTCUSD' },
  { label: 'ETH/USD', value: 'ETHUSD' },
  { label: 'SOL/USD', value: 'SOLUSD' },
  { label: 'SPX', value: 'SPX' }
];

// Helper Component for Tab Switching Optimization
const TabContent = ({ 
  activeTab, 
  setActiveTab, 
  profile, 
  chartTheme, 
  setChartTheme, 
  onBack, 
  onProfileChange, 
  isAdmin,
  selectedLightweightSymbol,
  setSelectedLightweightSymbol,
  isBannerCollapsed,
  setIsBannerCollapsed,
  leftSide,
  setLeftSide,
  rightSide,
  setRightSide,
  showTicker,
  setShowTicker,
  layoutDensity,
  setLayoutDensity,
  showTerminalMatrixNoise,
  setShowTerminalMatrixNoise,
  activeChat,
  setActiveChat,
  showHomepageContacts,
  handleSetShowHomepageContacts
}: { 
  activeTab: string, 
  setActiveTab: (t: string) => void, 
  profile: any, 
  chartTheme: any, 
  setChartTheme: (t: any) => void, 
  onBack: () => void, 
  onProfileChange: (p: any) => void, 
  isAdmin: boolean,
  selectedLightweightSymbol: string,
  setSelectedLightweightSymbol: (s: string) => void,
  isBannerCollapsed: boolean,
  setIsBannerCollapsed: (v: boolean) => void,
  leftSide: boolean,
  setLeftSide: (v: boolean) => void,
  rightSide: boolean,
  setRightSide: (v: boolean) => void,
  showTicker: boolean,
  setShowTicker: (v: boolean) => void,
  layoutDensity: 'compact' | 'balanced' | 'cozy',
  setLayoutDensity: (v: 'compact' | 'balanced' | 'cozy') => void,
  showTerminalMatrixNoise: boolean,
  setShowTerminalMatrixNoise: (v: boolean) => void,
  activeChat: any,
  setActiveChat: (v: any) => void,
  showHomepageContacts: boolean,
  handleSetShowHomepageContacts: (v: boolean) => void
}) => {
  const content = useMemo(() => {
    switch (activeTab) {
      case 'Discovery': return (
        <DiscoveryFeed 
          onTabChange={setActiveTab} 
          profile={profile} 
          showHomepageContacts={showHomepageContacts}
          showTerminalMatrixNoise={showTerminalMatrixNoise}
          onSelectContact={(contact) => {
            setActiveChat(contact);
            setRightSide(true);
          }}
        />
      );
      case 'CapitalFlow': return <CapitalFlowMap />;
      case 'Screener': return <AdvancedScreener />;
      case 'Market': return <StandardMarketUI profile={profile} onBack={onBack} />;
      case 'StrictlyCharts': return <LightweightMarketUI profile={profile} onBack={onBack} chartTheme={chartTheme} selectedMarketSymbol={selectedLightweightSymbol} onSelectMarketSymbol={setSelectedLightweightSymbol} />;
      case 'ThemeTerminal': return <ThemeTerminalTab chartTheme={chartTheme} setChartTheme={setChartTheme} profile={profile} onProfileChange={onProfileChange} />;
      case 'Macro': return <MacroDashboard />;
      case 'Fundamentals': return <FundamentalsPanel />;
      case 'Journal': return <TradingJournal />;
      case 'News': return <NewsPanel />;
      case 'Founders': return <FoundersPortal />;
      case 'Intelligence': return <MarketScanner />;
      case 'Biography': return <ProfileHub user={profile} onNavigate={setActiveTab} />;
      case 'AffiliateNetwork': return <AffiliateDashboard profile={profile} onBack={() => setActiveTab('Biography')} />;
      case 'Yours': return <YoursPage />;
      case 'Membership': return <MembershipTab />;
      case 'Workspace': return (
        <Suspense fallback={<TabLoading />}>
          <GoogleDesk />
        </Suspense>
      );
      case 'TheRiver': return (
        <Suspense fallback={<TabLoading />}>
          <RiverWorkstation />
        </Suspense>
      );
      case 'CpmsApk': return <CpmsApk />;
      case 'Sentinel': return <ClearPathSentinel onClose={() => setActiveTab(isAdmin ? 'CeoDashboard' : 'StrictlyCharts')} />;
      case 'Diagnostics': return isAdmin ? <MarketDiagnostics /> : <YoursPage />;
      case 'EncyclopediaOfIndicators': return (
        <Suspense fallback={<TabLoading />}>
          <EncyclopediaOfIndicators />
        </Suspense>
      );
      case 'Encyclopedia': return (
        <Suspense fallback={<TabLoading />}>
          <EncyclopediaLayout />
        </Suspense>
      );
      case 'Portfolio': return <PortfolioTracker />;
      case 'Scanner': return <MarketScanner />;
      case 'Heatmap': return <MarketHeatmap />;
      case 'Calendar': return <EconomicCalendar />;
      case 'Geomap': return <GeographicMap />;
      case 'Leaderboard': return <Leaderboard />;
      case 'StrategyMarket': return <StrategyMarket />;
      case 'Alerts': return <AlertsCenter />;
      case 'Tasks': return <TodoList profile={profile} />;
      case 'GetVerified': return <GetVerified profile={profile} onBack={onBack} />;
      case 'ShareQR': return <ShareQRCode />;
      case 'CeoDashboard': return <CeoDashboard />;
      case 'MeetTheBoard': return <MeetTheBoard />;
      case 'GlobalSessions': return (
        <div className="max-w-4xl mx-auto" id="view_global_trading_sessions">
          <h1 className="text-white text-2xl font-black uppercase tracking-wide mb-6">
            Global Trading Sessions
          </h1>
          <KillZones />
        </div>
      );
      case 'ClearPathEducation': return (
        <Suspense fallback={<TabLoading />}>
          <ClearPathEducationPage onNavigate={setActiveTab} />
        </Suspense>
      );
      case 'TrainingBoard': return (
        <div className="min-h-screen bg-[#0a0a1a] flex flex-col items-center justify-center p-4 rounded-3xl border border-[#00FFFF]/10" id="view_training_board">
          <div className="w-full max-w-5xl">
            <h1 className="text-[#FF4500] text-2xl font-bold text-center mb-8 tracking-widest uppercase" id="training_board_main_title">
              Clear Path Trader: Training Board
            </h1>
            <PatternOverlay />
          </div>
        </div>
      );
      default: return null;
    }
  }, [
    activeTab, 
    setActiveTab, 
    profile, 
    chartTheme, 
    setChartTheme, 
    onBack, 
    onProfileChange, 
    isAdmin, 
    isBannerCollapsed, 
    setIsBannerCollapsed, 
    leftSide, 
    setLeftSide, 
    rightSide, 
    setRightSide, 
    showTicker, 
    setShowTicker, 
    layoutDensity, 
    setLayoutDensity, 
    showTerminalMatrixNoise, 
    setShowTerminalMatrixNoise,
    showHomepageContacts,
    handleSetShowHomepageContacts
  ]);

  if (!content) return null;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }} 
      animate={{ opacity: 1, y: 0 }} 
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3 }}
      className={activeTab === 'ThemeTerminal' ? "flex flex-col flex-1 pb-16 rounded-[3.5rem] border border-white/10" : "flex flex-col flex-1"}
    >
      {content}
    </motion.div>
  );
};

export default function Dashboard({ profile: initialProfile, onProfileChange }: DashboardProps) {
  const profile = initialProfile || advancedProfiles.calm_focus as any; // Cast as any temporarily to avoid type errors since initialProfile is still typed loosely in some places
  const { 
    user: authUser, 
    userProfile, 
    userRole,
    requireVerified,
    updateUserImages, 
    updateIntro, 
    createPost, 
    posts, 
    toggleLike, 
    quotaExceeded, 
    retryConnection,
    logout,
    purgeAuthCache
  } = useAuth();
  const [leftSide, setLeftSide] = useState(false);
  const [rightSide, setRightSide] = useState(false);
  const [activeTab, setActiveTab ] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      try {
        const path = window.location.pathname.toLowerCase().trim();
        if (
          path.startsWith('/stocks/') ||
          path.startsWith('/companies/') ||
          path.startsWith('/crypto/') ||
          path.startsWith('/forex/') ||
          path.startsWith('/commodities/') ||
          path.startsWith('/economy/') ||
          path === '/crypto' ||
          path === '/companies' ||
          path === '/companies/' ||
          path === '/forex' ||
          path === '/commodities' ||
          path === '/financial-encyclopedia' ||
          path === '/encyclopedia'
        ) {
          return 'Encyclopedia';
        }
      } catch (e) {
        console.error('Failed to parse pathname for activeTab initial state:', e);
      }
    }
    if (typeof localStorage !== 'undefined') {
      try {
        const savedTab = localStorage.getItem('clearpath_active_tab');
        if (savedTab) return savedTab;
      } catch (e) {
        console.error('Failed to load activeTab from localStorage:', e);
      }
    }
    if (typeof window !== 'undefined') {
      try {
        const params = new URLSearchParams(window.location.search);
        const urlTab = params.get('tab');
        if (urlTab) return urlTab;
        
        const hash = window.location.hash.replace('#', '');
        if (hash) return hash;
      } catch (e) {
        console.error('Failed to parse activeTab initial URL:', e);
      }
    }
    return 'TheRiver';
  });
  const [isBannerCollapsed, setIsBannerCollapsed] = useState(() => localStorage.getItem('cp_banner_collapsed') === 'true');
  const [showTicker, setShowTicker] = useState(() => localStorage.getItem('cp_show_ticker') !== 'false');
  const [layoutDensity, setLayoutDensity] = useState<'compact' | 'balanced' | 'cozy'>(() => (localStorage.getItem('cp_layout_density') as any) || 'balanced');
  const [showTerminalMatrixNoise, setShowTerminalMatrixNoise] = useState(() => localStorage.getItem('cp_terminal_ambient_overlay') === 'true');
  const [showHomepageContacts, setShowHomepageContacts] = useState(() => localStorage.getItem('cp_show_homepage_contacts') === 'true');

  const handleSetShowTicker = (val: boolean) => {
    setShowTicker(val);
    localStorage.setItem('cp_show_ticker', val ? 'true' : 'false');
  };

  const handleSetLayoutDensity = (val: 'compact' | 'balanced' | 'cozy') => {
    setLayoutDensity(val);
    localStorage.setItem('cp_layout_density', val);
  };

  const handleSetShowTerminalMatrixNoise = (val: boolean) => {
    setShowTerminalMatrixNoise(val);
    localStorage.setItem('cp_terminal_ambient_overlay', val ? 'true' : 'false');
  };

  const handleSetShowHomepageContacts = (val: boolean) => {
    setShowHomepageContacts(val);
    localStorage.setItem('cp_show_homepage_contacts', val ? 'true' : 'false');
  };

  // Removed showFoundersModal Escape hook listener

  const [showAdditionalTerms, setShowAdditionalTerms] = useState(false);
  const [isEditingIntro, setIsEditingIntro] = useState(false);
  const [statusText, setStatusText] = useState('');
  
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  
  const defaultAvatars = [
    { id: 'lion', url: 'https://images.unsplash.com/photo-1614027164847-1b28cfe1df60?w=400&q=80', label: 'Lion' },
    { id: 'eagle', url: 'https://images.unsplash.com/photo-1611689342806-0863700ce7e4?w=400&q=80', label: 'Eagle' },
    { id: 'wolf', url: 'https://images.unsplash.com/photo-1590424744257-f112e4f0dc7f?w=400&q=80', label: 'Wolf' },
    { id: 'owl', url: 'https://images.unsplash.com/photo-15ed38eb1eb9d-19cd1eb5dcdc?w=400&q=80', label: 'Owl' },
    { id: 'bear', url: 'https://images.unsplash.com/photo-1588392205575-10459aafaf38?w=400&q=80', label: 'Bear' }
  ];

  const [showAvatarPicker, setShowAvatarPicker] = useState(false);

  const [selectedLightweightSymbol, setSelectedLightweightSymbol] = useState<string>('XAUUSD');
  const [isMarketsDropdownOpen, setIsMarketsDropdownOpen] = useState(false);

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [showMarketPulse, setShowMarketPulse] = useState(true);
  const [globalSearchQuery, setGlobalSearchQuery] = useState('');
  const [activeMarketAssets, setActiveMarketAssets] = useState([
    'GOLD', 'OIL', 'US10Y', 'BTCUSDT'
  ]);
  const [introForm, setIntroForm] = useState({
    bio: '',
    location: '',
    company: ''
  });
  const [activeChat, setActiveChat] = useState<any>(null);
  const [activeStory, setActiveStory] = useState<any>(null);
  const [chartTheme, setChartTheme] = useState<any>(() => {
    try {
      const savedKey = localStorage.getItem('clearpath_selected_chart_theme_key');
      if (savedKey && savedKey in chartThemes) {
        return chartThemes[savedKey as keyof typeof chartThemes];
      }
    } catch (e) {
      console.warn(e);
    }
    return undefined;
  });

  const handleSetChartTheme = (theme: any) => {
    setChartTheme(theme);
    try {
      const key = Object.keys(chartThemes).find(
        (k) =>
          chartThemes[k as keyof typeof chartThemes] === theme ||
          JSON.stringify(chartThemes[k as keyof typeof chartThemes]) === JSON.stringify(theme)
      );
      if (key) {
        localStorage.setItem('clearpath_selected_chart_theme_key', key);
      }
    } catch (e) {
      console.warn(e);
    }
  };

  const handleGlobalSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!globalSearchQuery.trim()) return;
    
    // Convert to upper case and ensure no leading/trailing spaces
    const querySymbol = globalSearchQuery.toUpperCase().trim();
    
    // Check if it's social search or symbol search based on Context.
    setActiveMarketAssets(prev => [
      querySymbol,
      ...prev.filter(a => a !== querySymbol)
    ].slice(0, 6));
    
    setClearState({ selectedAsset: querySymbol });
    setSelectedLightweightSymbol(querySymbol);
    
    setGlobalSearchQuery('');
    setActiveTab('StrictlyCharts'); 
  };

  useEffect(() => {
    if (userProfile?.intro) {
      setIntroForm(userProfile.intro);
    }
  }, [userProfile]);

  useEffect(() => {
    const handleCommand = (e: any) => {
      const { action, target } = e.detail;
      if (action === 'navigate') {
        // Map common spoken words to tab IDs
        const targetMap: Record<string, string> = {
          'home': 'Discovery',
          'sentinel': 'Sentinel',
          'insights': 'Insights',
          'market': 'StrictlyCharts',
          'markets': 'StrictlyCharts',
          'exchange command center': 'StrictlyCharts',
          'standard': 'Standard',
          'journal': 'Journal',
          'news': 'News',
          'photos': 'Photos',
          'settings': 'Settings',
          'biography': 'Biography',
          'affiliate': 'AffiliateNetwork',
          'strictlycharts': 'StrictlyCharts',
          'charts': 'StrictlyCharts'
        };
        const mappedTarget = targetMap[target.toLowerCase()] || target;
        setActiveTab(mappedTarget);
      }
    };
    window.addEventListener('app-command', handleCommand);
    return () => window.removeEventListener('app-command', handleCommand);
  }, []);
  
  const user = {
    name: userProfile?.displayName || authUser?.displayName || 'Clear Path Markets Science Identifier',
    avatar: userProfile?.photoURL || authUser?.photoURL || '',
    cover: userProfile?.coverURL || '',
    email: authUser?.email,
    intro: userProfile?.intro || { bio: '', location: '', company: '' }
  };

  const handleLogout = async () => {
    await logout();
  };

  const compressImage = (base64: string, maxWidth = 1000, targetMaxBase64Len = 186 * 1024): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = base64;
      img.onload = () => {
        let quality = 0.92;
        let scaleWidth = maxWidth;
        
        const runComp = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          if (width > scaleWidth) {
            height = (scaleWidth / width) * height;
            width = scaleWidth;
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = "high";
            ctx.drawImage(img, 0, 0, width, height);
            const dataUrl = canvas.toDataURL('image/jpeg', quality);
            
            if (dataUrl.length > targetMaxBase64Len && quality > 0.2) {
              if (quality > 0.7) {
                quality -= 0.05;
              } else if (quality > 0.4) {
                quality -= 0.05;
                scaleWidth = Math.max(500, Math.round(scaleWidth * 0.85));
              } else {
                quality -= 0.05;
                scaleWidth = Math.max(350, Math.round(scaleWidth * 0.8));
              }
              runComp();
            } else {
              resolve(dataUrl);
            }
          } else {
            resolve(base64);
          }
        };
        runComp();
      };
      img.onerror = () => resolve(base64);
    });
  };

  const processFileBase64 = async (file: File, type: 'avatar' | 'cover') => {
    const reader = new FileReader();
    reader.onloadend = async () => {
      let base64 = reader.result as string;
      const isCover = type === 'cover';
      
      // CRITICAL PRESERVATION RULE: If original file size is under 100KB, bypass compression entirely.
      // Otherwise, compress image dynamically using our HD, smart recursive scaling/quality reduction.
      const maxAllowedBase64Len = isCover ? 480 * 1024 : 186 * 1024; // 480KB chars for banner, 186KB chars for avatar
      if (file.size > 100 * 1024 && file.type.startsWith('image/')) { 
        console.log('[Dashboard] Compress image to fit under target threshold maintaining HD video-game quality...');
        base64 = await compressImage(base64, isCover ? 1920 : 1000, maxAllowedBase64Len);
      }
      
      // Firestore document is limited to 1MB total for safety check.
      if (base64.length > 550 * 1024) {
        // Double check banner/avatar strict boundary to ensure document stays under 1MB combined
        if (isCover) {
          base64 = await compressImage(base64, 1200, 320 * 1024);
        } else {
          base64 = await compressImage(base64, 600, 120 * 1024);
        }
      }
      
      try {
        await updateUserImages({ [type]: base64 });
        alert("Upload successful.");
      } catch (err) {
        console.error("Failed to upload image/video:", err);
        alert("There was a problem saving your photo. Please try a different image.");
      }
    };
    reader.readAsDataURL(file);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'avatar' | 'cover') => {
    const file = e.target.files?.[0];
    // Clear the input value so selecting the exact same file again will trigger onChange again
    if (e.target) {
      e.target.value = '';
    }
    
    if (!file) return;

    if (file.type.startsWith('video/')) {
      const videoElement = document.createElement('video');
      videoElement.preload = 'metadata';
      
      let processed = false;
      
      const fallback = () => {
        if (processed) return;
        processed = true;
        processFileBase64(file, type);
      };

      videoElement.onloadedmetadata = () => {
        if (processed) return;
        processed = true;
        if (videoElement.duration > 11) { // small margin
          alert(`Video must be 10 seconds or less. This video is ${Math.round(videoElement.duration)} seconds.`);
          URL.revokeObjectURL(videoElement.src);
          if (fileInputRef.current) fileInputRef.current.value = '';
          return;
        }
        URL.revokeObjectURL(videoElement.src);
        processFileBase64(file, type);
      };

      videoElement.onerror = fallback;
      
      // Fallback after 2 seconds if metadata doesn't load properties
      setTimeout(fallback, 2000);

      videoElement.src = URL.createObjectURL(file);
      videoElement.load();
    } else {
      processFileBase64(file, type);
    }
  };



  const handleSaveIntro = async () => {
    await updateIntro(introForm);
    setIsEditingIntro(false);
  };

  const handleDetectLocation = async () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }

    navigator.geolocation.getCurrentPosition(async (position) => {
      const { latitude, longitude } = position.coords;
      const friendlyName = await getFriendlyLocation(latitude, longitude);
      setIntroForm(prev => ({ ...prev, location: friendlyName }));
    }, (error) => {
      console.error('Geolocation error:', error);
      alert('Could not detect location. Please check your permissions.');
    });
  };

  const handlePost = async () => {
    if (!statusText.trim()) return;
    await createPost(statusText, undefined, 'GLOBAL');
    setStatusText('');
  };

  const [hasRealProfilePhoto] = useState(() => {
    const isDefault = defaultAvatars.some(a => a.url === user.avatar);
    return user.avatar && !isDefault;
  });



  const fileInputRef = useRef<HTMLInputElement>(null);

  const isAdmin = () => userRole?.role === 'admin' || authUser?.email === 'forexanarchy@gmail.com' || authUser?.email === 'creator@clearpatcharge.com';
  const isVerified = () => requireVerified();

  const menuItems = useMemo(() => {
    const allMenuItems = [
      { id: 'Yours', icon: User, label: 'YOURS' },
      { id: 'TheRiver', icon: Cpu, label: 'THE RIVER' },
      { id: 'Membership', icon: Crown, label: 'MEMBERSHIP' },
      { id: 'StrictlyCharts', icon: BarChart3, label: 'MARKETS' },
      { id: 'Screener', icon: SlidersHorizontal, label: 'SCREENER' },
      { id: 'Journal', icon: BookOpen, label: 'TRADING JOURNAL', verified: true },
      { id: 'Encyclopedia', icon: Book, label: 'FINANCIAL ENCYCLOPEDIA' },
      { id: 'News', icon: Newspaper, label: 'LIVE NEWS' },
      { id: 'ThemeTerminal', icon: Terminal, label: 'THEMES / PROFILES' },
      { id: 'MeetTheBoard', icon: Shield, label: 'MEET THE BOARD' },
      { id: 'CeoDashboard', icon: Shield, label: 'ADMIN SETTINGS' }, 
      { id: 'Logout', icon: LogOut, label: 'LOGOUT' },
    ];

    return allMenuItems.filter((item: any) => {
      if (item.id === 'CeoDashboard') return isAdmin();
      if (item.verified) return isVerified() || isAdmin();
      return true;
    });
  }, [userRole?.role, authUser?.email, profile?.vipStatus]);

  const stories = [
    { id: 1, name: 'Lisandro Matos', time: '12 hours ago', img: '' },
    { id: 2, name: 'Gvozden Boskovsky', time: '29 minutes ago', img: '' },
    { id: 3, name: 'Hnek Fortuin', time: '3 hours ago', img: '' },
    { id: 4, name: 'Lubomir Dvorak', time: '18 hours ago', img: '' },
  ];

  const contacts = [
    { id: 1, name: 'Andrei Mashrin', status: 'online', img: '' },
    { id: 2, name: 'Aryn Jacobssen', status: 'offline', img: '' },
    { id: 3, name: 'Carole Landu', status: 'offline', img: '' },
    { id: 4, name: 'Chineze Afa', status: 'online', img: '' },
    { id: 5, name: 'Mok Kwang', status: 'online', img: '' },
    { id: 6, name: 'Naomi Yepes', status: 'online', img: '' },
  ];

  const getSeoData = () => {
    switch (activeTab) {
      case 'Market':
        return { title: 'Market Hub', description: 'Market market data terminal and live visualization charts.' };
      case 'Timeline':
        return { title: 'Clear Path Markets Science Stream', description: 'Market post feed and community market pulse.' };
      case 'Automations':
        return { title: 'Crew Automations', description: 'Autonomous market intelligence and content orchestration.' };
      default:
        return { title: activeTab };
    }
  };

  const seoData = getSeoData();

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem('clearpath_active_tab', tabId);
      } catch (e) {
        console.error('Failed to save activeTab to localStorage:', e);
      }
    }
    if (typeof window !== 'undefined') {
      try {
        const params = new URLSearchParams(window.location.search);
        params.set('tab', tabId);
        const newUrl = `${window.location.pathname}?${params.toString()}#${tabId}`;
        window.history.pushState({ tabId }, '', newUrl);
      } catch (e) {
        console.error('Failed to push tab status state:', e);
      }
    }
  };

  useEffect(() => {
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem('clearpath_active_tab', activeTab);
      } catch (e) {}
    }
  }, [activeTab]);

  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      if (typeof window !== 'undefined') {
        const path = window.location.pathname.toLowerCase().trim();
        if (
          path.startsWith('/stocks/') ||
          path.startsWith('/companies/') ||
          path.startsWith('/crypto/') ||
          path.startsWith('/forex/') ||
          path.startsWith('/commodities/') ||
          path.startsWith('/economy/') ||
          path === '/crypto' ||
          path === '/companies' ||
          path === '/companies/' ||
          path === '/forex' ||
          path === '/commodities' ||
          path === '/financial-encyclopedia' ||
          path === '/encyclopedia'
        ) {
          setActiveTab('Encyclopedia');
          return;
        }
      }

      if (event.state && event.state.tabId) {
        const nextTabId = event.state.tabId;
        setActiveTab(nextTabId);
      } else {
        const params = new URLSearchParams(window.location.search);
        const urlTab = params.get('tab');
        if (urlTab) {
          setActiveTab(urlTab);
        } else {
          const hash = window.location.hash.replace('#', '');
          if (hash) setActiveTab(hash);
        }
      }
    };
    window.addEventListener('popstate', handlePopState);
    
    // Check initial search, pathname & hash
    const path = typeof window !== 'undefined' ? window.location.pathname.toLowerCase().trim() : '';
    if (
      path.startsWith('/stocks/') ||
      path.startsWith('/companies/') ||
      path.startsWith('/crypto/') ||
      path.startsWith('/forex/') ||
      path.startsWith('/commodities/') ||
      path.startsWith('/economy/') ||
      path === '/crypto' ||
      path === '/companies' ||
      path === '/companies/' ||
      path === '/forex' ||
      path === '/commodities' ||
      path === '/financial-encyclopedia' ||
      path === '/encyclopedia'
    ) {
      setActiveTab('Encyclopedia');
    } else {
      const params = new URLSearchParams(window.location.search);
      const urlTab = params.get('tab');
      if (urlTab) {
        setActiveTab(urlTab);
      } else {
        const hash = window.location.hash.replace('#', '');
        const validHash = menuItems.find(m => m.id === hash) || 
          hash === 'TheRiver' || 
          hash === 'Founders' || 
          hash === 'CeoDashboard' || 
          hash === 'ThemeTerminal' || 
          hash === 'Market' || 
          hash === 'StrictlyCharts' || 
          hash === 'Fundamentals' || 
          hash === 'Screener' || 
          hash === 'Portfolio' || 
          hash === 'Journal' || 
          hash === 'News' || 
          hash === 'Biography' || 
          hash === 'CapitalFlow' || 
          hash === 'MeetTheBoard' || 
          hash === 'Yours' || 
          hash === 'CpmsApk' || 
          hash === 'AffiliateNetwork' || 
          hash === 'Encyclopedia' || 
          hash === 'EncyclopediaOfIndicators' || 
          hash === 'ApiMonitor' || 
          hash === 'Diagnostics' || 
          hash === 'Sentinel';
        if (validHash) {
          setActiveTab(hash);
        }
      }
    }

    const unsubscribe = subscribeToClearState((state) => {
      // Sync logic if needed
    });

    return () => {
      window.removeEventListener('popstate', handlePopState);
      unsubscribe();
    };
  }, [menuItems, authUser]);

  return (
    <div 
      className="relative min-h-[100dvh] flex flex-col lg:flex-row w-full text-[#ccc8db] font-sans selection:bg-indigo-500 transition-colors duration-1000 overflow-visible"
      style={{ background: profile.bgTop }}
    >
      {showAvatarPicker && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#111] border border-[#333] p-6 rounded-2xl w-full max-w-md shadow-[0_0_40px_rgba(0,0,0,0.8)]">
            <h3 className="text-xl font-bold text-white mb-4">Upload Profile Media</h3>
            
            <div className="space-y-6">
              <div>
                <p className="text-sm text-gray-400 mb-3 uppercase tracking-wider font-bold">Upload Your Profile Media</p>
                <div className="flex gap-3">
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full bg-blue-600 hover:bg-blue-500 text-white rounded-lg p-4 text-sm font-bold border border-blue-500 transition-colors"
                  >
                    Select File from Device (Image / MP4 / Audio)
                  </button>
                </div>
                <input 
                  type="file" 
                  accept="image/*,video/mp4,video/webm,audio/mp3,audio/mpeg" 
                  ref={fileInputRef} 
                  className="hidden" 
                  onChange={(e) => {
                    handleImageUpload(e, 'avatar');
                    setShowAvatarPicker(false);
                  }}
                />
              </div>
            </div>
            
            <button 
              onClick={() => setShowAvatarPicker(false)}
              className="mt-6 w-full text-gray-500 hover:text-white transition-colors uppercase tracking-wider font-bold text-sm"
            >
              Close
            </button>
          </div>
        </div>
      )}



      <SEO title={seoData.title} description={seoData.description} />
      {/* Mobile Sidebar Backdrop */}
      {leftSide && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden cursor-pointer"
          onClick={() => setLeftSide(false)}
        />
      )}

      {/* Left Sidebar */}
      <motion.div 
        initial={false}
        animate={{ width: leftSide ? 280 : 84 }}
        className={`
          fixed inset-y-0 left-0 z-50 border-r flex flex-col transition-all duration-300 glass overflow-hidden
          lg:relative lg:translate-x-0
          ${leftSide ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
        style={{ borderColor: `${profile.borderA}22` }}
      >
        <div 
          className="flex items-center px-6 h-[80px] border-b border-[#ffffff08] sticky top-0 z-10 cursor-pointer hover:bg-white/5 transition-all justify-between" 
          onClick={() => setLeftSide(!leftSide)}
        >
          <div className="flex items-center space-x-3 overflow-hidden">
            <div className="w-8 h-8 min-w-[32px] rounded-lg bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30 overflow-hidden">
              <Activity size={16} className="text-white" />
            </div>
            {leftSide && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="whitespace-nowrap">
                <div className="font-black tracking-tighter text-[18px] leading-tight uppercase italic bg-clip-text text-transparent" style={{ backgroundImage: 'linear-gradient(180deg, #ff0000 0%, #ff4500 50%, #FFA500 100%)', WebkitBackgroundClip: 'text', color: 'transparent', filter: 'drop-shadow(0 0 5px rgba(255,0,0,0.5))' }}>
                  C P M S
                </div>
                <div className="text-[7px] font-bold tracking-[0.3em] text-[#5c5e6e] uppercase mt-0.5">
                  MARKET SCIENCE
                </div>
              </motion.div>
            )}
          </div>
          {leftSide && <MoreHorizontal size={14} className="text-gray-500" />}
        </div>

        {/* Sidebar Toggle button removed per user request to avoid covering other buttons */}

        <div className="flex-1 overflow-y-auto custom-scrollbar px-4 pt-8 pb-32">
          <div className="text-[8px] font-black mb-6 uppercase tracking-[0.3em] px-4" style={{ color: '#E0115F' }}>
            Market Navigation
          </div>
          <nav className="flex flex-col space-y-2">
            {menuItems.map((item) => {
              const isTraining = item.id === 'TrainingBoard';
              const isDiscovery = item.id === 'Discovery';
              const isRiver = item.id === 'TheRiver';
              const isIndigo = item.id === 'MeetTheBoard' || isDiscovery;
              const isLogout = item.id === 'Logout';
              const baseColor = isTraining ? '#00FFFF' : (isRiver ? '#00e5ff' : (isIndigo ? '#4D00FF' : (isLogout ? '#ef4444' : '#FF5277'))); 
              const isActive = activeTab === item.id;
              
              const isLavaText = isDiscovery && isActive;
              const lavaClasses = isLavaText ? 'bg-clip-text text-transparent bg-gradient-to-br from-[#ff0000] via-[#ff4500] to-[#ff8c00] drop-shadow-[0_0_8px_rgba(255,0,0,0.8)]' : '';

              if (item.id === 'StrictlyCharts') {
                return (
                  <div key={item.id} className="flex flex-col">
                    <button 
                      onClick={() => { 
                        handleTabChange(item.id); 
                        setIsMarketsDropdownOpen(!isMarketsDropdownOpen);
                      }}
                      className={`flex items-center justify-between px-4 py-3 rounded-xl transition-all group relative overflow-hidden ${
                        isActive 
                          ? 'bg-white/10 text-white' 
                          : 'hover:bg-white/5 hover:brightness-125 text-[#FF5277]'
                      }`}
                    >
                      <div className="flex items-center">
                        {isActive && (
                          <motion.div 
                            layoutId="sidebar-accent"
                            className="absolute left-0 top-1/4 bottom-1/4 w-1 rounded-r-full"
                            style={{ backgroundColor: baseColor, boxShadow: `0 0 10px ${baseColor}` }}
                          />
                        )}
                        <item.icon size={16} className={`mr-4 transition-transform duration-300 group-hover:scale-110`} style={{ color: isActive ? baseColor : 'currentColor' }} />
                        <span className="text-[10px] font-black uppercase tracking-widest whitespace-nowrap">{item.label}</span>
                      </div>
                      <ChevronDown size={14} className={`transition-transform duration-300 ${isMarketsDropdownOpen ? 'rotate-180' : ''}`} style={{ color: isActive ? baseColor : 'currentColor' }} />
                    </button>
                    {(isMarketsDropdownOpen || isActive) && (
                      <div className="pl-8 pr-2 flex flex-col space-y-1 mt-1 border-l border-white/5 ml-6">
                        {DATA_ONLY_MARKETS.map((market) => (
                          <button
                            key={market.value}
                            onClick={() => {
                              setSelectedLightweightSymbol(market.value);
                              handleTabChange('StrictlyCharts');
                              setLeftSide(false);
                            }}
                            className={`text-left py-1.5 px-3 text-[9px] font-black tracking-widest uppercase rounded transition-all leading-tight ${
                              selectedLightweightSymbol === market.value
                                ? 'bg-indigo-500/20 text-white border-l border-indigo-500'
                                : 'text-zinc-500 hover:text-white hover:bg-white/5'
                            }`}
                          >
                            {market.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              }

              return (
              <button 
                key={item.id} 
                onClick={() => { 
                  if (item.id === 'Logout') {
                    handleLogout();
                  } else {
                    handleTabChange(item.id); 
                    setLeftSide(false); 
                  }
                }}
                className={`flex items-center px-4 py-3 rounded-xl transition-all group relative overflow-hidden ${
                  isActive 
                    ? 'bg-white/10' 
                    : 'hover:bg-white/5 hover:brightness-125'
                }`}
                style={{ color: isActive && !isLavaText ? '#ffffff' : (!isLavaText ? baseColor : undefined) }}
              >
                {isActive && (
                  <motion.div 
                    layoutId="sidebar-accent"
                    className="absolute left-0 top-1/4 bottom-1/4 w-1 rounded-r-full"
                    style={{ backgroundColor: baseColor, boxShadow: `0 0 10px ${baseColor}` }}
                  />
                )}
                <item.icon size={16} className={`mr-4 transition-transform duration-300 group-hover:scale-110`} style={{ color: isActive ? baseColor : 'currentColor' }} />
                <span className={`text-[10px] font-black uppercase tracking-widest whitespace-nowrap ${lavaClasses}`}>{item.label}</span>
              </button>
              );
            })}
          </nav>

          <div className="mt-auto pt-10">
            <div className="space-y-3">
              <button 
                onClick={() => setShowMarketPulse(!showMarketPulse)}
                className="w-full flex items-center justify-between px-4 py-3 rounded-lg border border-[#ffffff10] bg-[#ffffff05] hover:bg-[#ffffff08] group transition-all"
              >
                <div className="flex items-center">
                  <Activity size={12} className="mr-3 text-indigo-500" />
                  <span className="text-[8px] font-bold uppercase tracking-widest text-[#5c5e6e]">Refresh Rate</span>
                </div>
                <div className={`w-8 h-4 rounded-full border border-[#ffffff20] relative transition-colors duration-300 ${showMarketPulse ? 'bg-indigo-500/20' : 'bg-black'}`}>
                  <motion.div 
                    animate={{ x: showMarketPulse ? 16 : 0 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    className={`absolute left-1 top-1 w-2 h-2 rounded-full shadow-lg ${showMarketPulse ? 'bg-indigo-400 shadow-indigo-500/50' : 'bg-gray-600'}`} 
                  />
                </div>
              </button>

              <div className="px-4 py-6 space-y-2">
                <div className="flex justify-between items-center text-[7px] font-black uppercase tracking-[0.3em] text-[#5c5e6e]">
                  <span>Data Usage</span>
                  <span className="text-orange-500">67%</span>
                </div>
                <div className="h-1 bg-black rounded-full overflow-hidden border border-[#ffffff10]">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: '67%' }}
                    className="h-full bg-gradient-to-r from-orange-500 to-red-600 shadow-[0_0_10px_rgba(249,115,22,0.3)]"
                  />
                </div>
              </div>

              <div className="px-4 pb-4 space-y-3">
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center space-x-2 text-[6px] font-black uppercase tracking-[0.4em]">
                    <div className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-500 shadow-[0_0_5px_rgba(16,185,129,0.8)]' : 'bg-rose-500 shadow-[0_0_5px_rgba(244,63,94,0.8)]'}`} />
                    <span className={isOnline ? 'text-emerald-500/70' : 'text-rose-500/70'}>
                      {isOnline ? 'System Network Online' : 'System Offline (Using Local Cache)'}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2 text-[6px] font-black uppercase tracking-[0.4em] text-indigo-500/50">
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_5px_rgba(99,102,241,0.8)]" />
                    <span>Cloud DB Offline Safe Mode</span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    if (confirm('Verify and completely reset the application cache now? This clears Firestore offline sync database issues.')) {
                      purgeAuthCache();
                    }
                  }}
                  className="w-full text-[7px] font-black uppercase tracking-[0.2em] border border-white/5 hover:border-white/20 bg-white/5 hover:bg-white/10 text-white/50 hover:text-white px-2 py-1.5 rounded-lg transition-all"
                >
                  Force Purge Cache & Sync
                </button>
              </div>
            </div>
          </div>
        </div>

        <a href="#" className="flex items-center h-[52px] px-5 border-t border-[#ffffff08] text-[#9c9cab] text-sm relative group overflow-hidden">
          <div className="flex items-center transition-transform duration-300 group-hover:translate-y-full">
            <Share2 size={16} className="mr-2" />
            Clear Path Markets Science Protocol Access
          </div>
          <div className="absolute inset-0 bg-[#ffffff05] flex items-center px-5 translate-y-[-100%] group-hover:translate-y-0 transition-transform duration-300" style={{ color: profile.borderA }}>
            {userProfile?.photoURL || authUser?.photoURL ? (
              <img src={userProfile?.photoURL || authUser?.photoURL} referrerPolicy="no-referrer" className="w-[26px] h-[26px] rounded-full mr-2 object-cover border border-[#ffffff20]" />
            ) : (
              <div className="w-[26px] h-[26px] rounded-full mr-2 border border-[#ffffff20] bg-[#111] flex items-center justify-center shrink-0">
                <span className="text-[10px] text-white/40 font-bold">CP</span>
              </div>
            )}
            <span className="text-[10px] font-black uppercase tracking-widest text-[#FF00FF] shadow-[0_0_10px_rgba(255,0,255,0.4)]">
              {userProfile?.displayName || authUser?.displayName || 'Clear Path Markets Science Agent'}
            </span>
          </div>
        </a>
      </motion.div>

      {/* Main Content */}
      <div 
        className="flex-1 flex flex-col w-full relative transition-all duration-300" 
        style={{ background: profile.bgTop }}
      >
        {/* TOP PERSISTENT BREAKING NEWS HOIST */}
        <BreakingNewsTicker />

        {/* PERSISTENT Clear NAV */}
        <ClearNav activeTab={activeTab} onNavigate={handleTabChange} isAdmin={isAdmin()} onLogout={handleLogout} />
        
        {/* TOP MARKET TICKER */}
        {showTicker && (
          <div className="z-40">
            <Suspense fallback={<div className="h-10 bg-black/40  border-b border-white/5" />}>
              <MarketTicker profile={profile} />
            </Suspense>
          </div>
        )}

        {/* Search Bar */}
        {activeTab !== 'Insights' && activeTab !== 'StrictlyCharts' && activeTab !== 'Encyclopedia' && activeTab !== 'EncyclopediaOfIndicators' && (
          <>
            <div className="h-[60px] flex items-center px-6 relative z-30 border-b glass" style={{ borderColor: `${profile.borderA}11` }}>
              <div className="flex items-center space-x-4 mr-8">
              </div>
              
              <div className="relative flex-1 max-w-xl ml-4">
                <form onSubmit={handleGlobalSearch} className="w-full relative">
                  <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#5c5d71]" />
                  <input 
                    type="text" 
                    placeholder="Search Markets (e.g. GOLD, TSLA, US10Y)..." 
                    value={globalSearchQuery}
                    onChange={(e) => setGlobalSearchQuery(e.target.value)}
                    className="w-full h-10 bg-transparent border-none pl-12 pr-4 font-semibold placeholder:text-[#5c5d71] focus:outline-none"
                    style={{ color: profile.borderA }}
                  />
                  <button type="submit" className="hidden">Search</button>
                </form>
              </div>
              <div className="flex items-center space-x-4">
                <button 
                  onClick={() => setRightSide(!rightSide)}
                  className="lg:hidden p-3 transition-colors rounded-full shadow-lg z-[60]"
                  style={{ background: `${profile.borderA}ee`, color: '#000' }}
                >
                  <MessageSquare size={24} />
                </button>
              </div>
            </div>
          </>
        )}

        {/* Scrollable Container -- MOBILE FIX: on phones this box no longer has
            its own private scrollbar. Content flows into the page, so the page
            (the gray bar) is the ONE and only scrollbar. Desktop (lg and up)
            keeps the original inner scrolling exactly as before. */}
        <div 
          className={`flex-1 overflow-visible lg:overflow-y-auto custom-scrollbar ${
            activeTab === 'Insights' 
              ? 'p-0 pb-32 md:pb-5' 
              : layoutDensity === 'compact'
                ? 'p-1.5 md:p-2.5 pb-20'
                : layoutDensity === 'cozy'
                  ? 'p-6 md:p-8 pb-40 md:pb-16'
                  : 'p-3 md:p-5 pb-32 md:pb-10'
          }`} 
          style={{ background: profile.bgTop }}
        >
          {/* Profile Section */}
          {activeTab !== 'Insights' && activeTab !== 'StrictlyCharts' && activeTab !== 'ThemeTerminal' && activeTab !== 'Encyclopedia' && activeTab !== 'EncyclopediaOfIndicators' && (
            isBannerCollapsed ? (
              <div 
                onClick={(e) => {
                  e.stopPropagation();
                  setIsBannerCollapsed(false);
                  localStorage.setItem('cp_banner_collapsed', 'false');
                }}
                id="expand-dashboard-banner"
                className="p-3 bg-zinc-950/90 hover:bg-zinc-900 border border-cyan-500/30 rounded-xl flex items-center justify-between mb-5 cursor-pointer select-none transition-all group font-mono text-[10px] tracking-wider text-zinc-300"
              >
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-pulse" />
                  <span className="uppercase font-extrabold text-${profile.borderA}-400" style={{ color: profile.borderA }}>Workspace Banner:</span>
                  <span className="opacity-60 text-zinc-400">compact view enabled • charts maximum space</span>
                </div>
                <button 
                  type="button"
                  className="text-cyan-400 hover:text-white font-mono text-[10px] font-black flex items-center gap-1 uppercase bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 px-3 py-1 rounded transition-all"
                >
                  <span>Expand Workspace Banner</span>
                  <span>▲</span>
                </button>
              </div>
            ) : (
              <div className="relative h-[40vh] min-h-[250px] max-h-[350px] rounded-lg overflow-hidden mb-5 group cursor-pointer" onClick={() => handleTabChange('Biography')}>
                {user.cover ? (
                  <img 
                    src={user.cover} 
                    referrerPolicy="no-referrer"
                    className="absolute inset-0 w-full h-full object-cover"
                    alt="Cover"
                  />
                ) : (
                  <img 
                    src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80" 
                    referrerPolicy="no-referrer"
                    className="absolute inset-0 w-full h-full object-cover"
                    alt="Default Cover"
                  />
                )}
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />
                
                <div 
                  className="absolute bottom-6 left-12 flex items-end z-10"
                >
                  <div className="ml-0 mb-6 font-sans">
                    <h2 className="text-3xl md:text-5xl font-black tracking-tighter uppercase italic flex items-center gap-4 name-text text-white">
                      {user.name} <CheckCircle2 size={40} className="fill-indigo-500/20 text-indigo-500 drop-shadow-[0_0_10px_#6366f1]" />
                    </h2>
                    <p className="text-sm font-mono uppercase tracking-[0.5em] font-black" style={{ color: profile.borderA }}>
                      @{user.name.toLowerCase().replace(/\s+/g, '_')}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsBannerCollapsed(true);
                    localStorage.setItem('cp_banner_collapsed', 'true');
                  }}
                  id="collapse-dashboard-banner"
                  className="absolute top-4 right-4 z-20 bg-black/85 hover:bg-black border border-white/20 text-white font-mono text-[9px] tracking-widest font-black px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow-[0_0_15px_rgba(0,0,0,0.6)] transition-all uppercase"
                >
                  <span>Collapse Banner</span>
                  <span>▼</span>
                </button>
              </div>
            )
          )}

          {activeTab !== 'Insights' && activeTab !== 'StrictlyCharts' && activeTab !== 'ThemeTerminal' && activeTab !== 'Encyclopedia' && activeTab !== 'EncyclopediaOfIndicators' && (
            <SystemIntelligencePanel />
          )}

          {/* Content Views */}
          <div className="flex-1 flex flex-col w-full relative min-h-full">
            <AnimatePresence mode="wait">
                <div className="flex flex-col flex-1 h-full w-full min-h-[400px]">
                  <div className="px-6 lg:px-12 pb-16 pt-8 flex-1 flex flex-col min-h-[50vh]">
                    {activeTab !== 'StrictlyCharts' && activeTab !== 'CeoDashboard' && activeTab !== 'AffiliateNetwork' && (
                      <div className="mb-6">
                        <BackToDashboard onBack={() => handleTabChange(isAdmin() ? 'CeoDashboard' : 'StrictlyCharts')} color={profile.text} />
                      </div>
                    )}
                    <Suspense fallback={<TabLoading />}>
                      <TabContent 
                        activeTab={activeTab} 
                        setActiveTab={handleTabChange}
                        profile={profile} 
                        chartTheme={chartTheme} 
                        setChartTheme={handleSetChartTheme}
                        onBack={() => handleTabChange(isAdmin() ? 'CeoDashboard' : 'StrictlyCharts')} 
                        onProfileChange={onProfileChange}
                        isAdmin={isAdmin()}
                        selectedLightweightSymbol={selectedLightweightSymbol}
                        setSelectedLightweightSymbol={setSelectedLightweightSymbol}
                        isBannerCollapsed={isBannerCollapsed}
                        setIsBannerCollapsed={setIsBannerCollapsed}
                        leftSide={leftSide}
                        setLeftSide={setLeftSide}
                        rightSide={rightSide}
                        setRightSide={setRightSide}
                        showTicker={showTicker}
                        setShowTicker={handleSetShowTicker}
                        layoutDensity={layoutDensity}
                        setLayoutDensity={handleSetLayoutDensity}
                        showTerminalMatrixNoise={showTerminalMatrixNoise}
                        setShowTerminalMatrixNoise={handleSetShowTerminalMatrixNoise}
                        activeChat={activeChat}
                        setActiveChat={setActiveChat}
                        showHomepageContacts={showHomepageContacts}
                        handleSetShowHomepageContacts={handleSetShowHomepageContacts}
                      />
                    </Suspense>
                  </div>
                </div>
            </AnimatePresence>
          </div>

          <div className="w-full mt-auto mb-0 bg-transparent flex flex-col">
            <LegalFooter profile={profile} onShowTerms={() => setShowAdditionalTerms(true)} />
            <BreakingNewsTicker />
          </div>
        </div>
      </div>

      {/* Right Sidebar */}
      {activeTab !== 'StrictlyCharts' && (
      <div className={`
        fixed inset-y-0 right-0 z-50 w-[280px] border-l flex flex-col transition-all duration-300 glass
        xl:relative xl:translate-x-0
        ${rightSide ? 'translate-x-0' : 'translate-x-full xl:translate-x-0'}
      `}
      style={{ borderColor: `${profile.borderA}22` }}
      >
        <div className="h-[60px] flex items-center justify-around px-4 sticky top-0 z-10" style={{ background: profile.bgBottom }}>
          <button className="text-[#64677a] hover:text-white relative" style={{ color: `${profile.borderA}88` }}>
            <Mail size={20} />
            <div className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full border-2" style={{ background: profile.borderA, borderColor: profile.bgBottom }} />
          </button>
          <button className="text-[#64677a] hover:text-white relative" style={{ color: `${profile.borderA}88` }}>
            <Bell size={20} />
            <div className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full border-2" style={{ background: profile.borderA, borderColor: profile.bgBottom }} />
          </button>
          <div className="flex items-center text-[#64677a] font-semibold text-sm cursor-pointer hover:text-white transition-colors" onClick={() => setIsEditingIntro(true)}>
            <span className="name-text font-bold" style={{ color: profile.borderA }}>{user.name}</span>
            <div className="surfboard-profile-outline mx-3 border-2 border-[#FF4500] shadow-[0_0_15px_#FF4500] overflow-hidden" style={{ width: '28px', height: '46px' }}>
              {user.avatar ? (
                isVideoUrl(user.avatar) ? (
                  <video src={user.avatar} className="surfboard-img object-cover" autoPlay loop muted playsInline />
                ) : isAudioUrl(user.avatar) ? (
                  <div className="surfboard-img bg-[#111] flex items-center justify-center overflow-hidden">
                    <audio src={user.avatar} className="w-[300%] scale-[0.25] opacity-50" />
                  </div>
                ) : (
                  <img src={user.avatar} referrerPolicy="no-referrer" className="surfboard-img object-cover" />
                )
              ) : (
                <div className="surfboard-img bg-[#111]" />
              )}
            </div>
            <ChevronDown size={10} style={{ color: profile.borderA }} />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar pb-32 lg:pb-8">
          <div className="px-6 py-8 border-b" style={{ borderColor: `${profile.borderA}22` }}>
            <div className="text-[15px] font-black uppercase tracking-[0.2em] mb-6 text-transparent bg-clip-text bg-gradient-to-r from-[#FF1493] to-[#4D00FF]">Stories</div>
            <div className="space-y-6">
              {stories.map((story) => (
                <div key={story.id} onClick={() => setActiveStory(story)} className="flex items-center cursor-pointer group hover:bg-white/5 p-2 rounded-xl transition-all">
                  <div className="surfboard-profile-outline mr-4 group-hover:scale-110 transition-transform border-2 border-[#FF4500] shadow-[0_0_15px_#FF4500]" style={{ width: '36px', height: '60px' }}>
                    {story.img ? <img src={story.img} referrerPolicy="no-referrer" className="surfboard-img" /> : <div className="surfboard-img bg-[#111]" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[14px] font-black uppercase tracking-tighter name-text truncate text-transparent bg-clip-text bg-gradient-to-r from-[#FF1493] to-[#4D00FF]">{story.name}</div>
                    <div className="opacity-70 text-[10px] uppercase font-mono mt-1 text-transparent bg-clip-text bg-gradient-to-r from-[#FF1493] to-[#4D00FF]">{story.time}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="px-6 py-8">
            <div className="text-[15px] font-black uppercase tracking-[0.2em] mb-6 text-transparent bg-clip-text bg-gradient-to-r from-[#FF1493] to-[#4D00FF]">Contacts</div>
            <div className="space-y-6">
              {contacts.map((contact) => (
                <div key={contact.id} onClick={() => setActiveChat(contact)} className="flex items-center cursor-pointer group hover:bg-white/5 p-2 rounded-xl transition-all">
                  <div className="surfboard-profile-outline mr-4 group-hover:scale-110 transition-transform border-2 border-[#FF4500] shadow-[0_0_15px_#FF4500]" style={{ width: '36px', height: '60px' }}>
                    {contact.img ? <img src={contact.img} referrerPolicy="no-referrer" className="surfboard-img" /> : <div className="surfboard-img bg-[#111]" />}
                  </div>
                  <div className="flex-1 flex items-center justify-between">
                    <span className="text-[14px] font-black uppercase tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-[#FF1493] to-[#4D00FF]">{contact.name}</span>
                    <div className={`w-2 h-2 rounded-full ${contact.status === 'online' ? 'bg-gradient-to-r from-[#FF1493] to-[#4D00FF]' : 'bg-[#606a8d] opacity-30'}`} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="h-[60px] border-t flex items-center px-4 sticky bottom-0" style={{ background: profile.bgBottom, borderColor: `${profile.borderA}22` }}>
          <div className="relative flex-1">
            <input 
              type="text" 
              placeholder="Search" 
              className="w-full h-8 bg-transparent border-none pr-10 text-sm placeholder:text-[#5c5d71] focus:outline-none"
              style={{ color: profile.borderA }}
            />
            <div className="absolute right-0 top-1/2 -translate-y-1/2 flex space-x-3" style={{ color: profile.borderA }}>
              <button type="button" aria-label="Add" className="cursor-pointer hover:opacity-70"><Plus size={16} /></button>
              <button type="button" aria-label="More options" className="cursor-pointer hover:opacity-70"><MoreHorizontal size={16} /></button>
            </div>
          </div>
        </div>
      </div>
      )}

      {/* Overlay */}
      <AnimatePresence>
        {(leftSide || rightSide) && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => { setLeftSide(false); setRightSide(false); }}
            className="fixed inset-0 bg-black/60 z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Daily Legal Acknowledgment */}


      {/* Private Profile Build Modal */}
      <AnimatePresence>
        {isEditingIntro && null}
      </AnimatePresence>

      {/* Slide-out Mock Chat Panel */}
      <AnimatePresence>
        {activeChat && (
          <motion.div 
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 h-full w-[360px] bg-black/95 backdrop-blur-xl border-l z-[90] flex flex-col shadow-[-20px_0_40px_rgba(0,0,0,0.5)]"
            style={{ borderColor: `${profile.borderA}33` }}
          >
            <div className="p-4 border-b flex items-center justify-between" style={{ borderColor: `${profile.borderA}22`, background: `${profile.borderA}11` }}>
              <div className="flex items-center space-x-3">
                <div className="surfboard-profile-outline border-2" style={{ width: '30px', height: '50px', borderColor: profile.borderA }}>
                  {activeChat.img ? <img src={activeChat.img} referrerPolicy="no-referrer" className="surfboard-img" /> : <div className="surfboard-img bg-[#111]" />}
                </div>
                <div>
                  <div className="text-sm font-black uppercase tracking-widest" style={{ color: profile.borderA }}>{activeChat.name}</div>
                  <div className="text-[10px] uppercase font-mono opacity-50 flex items-center gap-1 text-transparent bg-clip-text bg-gradient-to-r from-[#FF1493] to-[#4D00FF]">
                    <div className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-[#FF1493] to-[#4D00FF]"></div> Encrypted Protocol
                  </div>
                </div>
              </div>
              <button aria-label="Close chat" onClick={() => setActiveChat(null)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                <X size={20} style={{ color: profile.borderA }} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
              <div className="text-center text-[10px] font-mono opacity-30 my-4 uppercase tracking-widest">
                End-to-End Encrypted Session Started
              </div>
              <div className="flex flex-col space-y-4">
                <div className="bg-white/5 p-3 rounded-tr-xl rounded-b-xl max-w-[85%] self-start border border-white/5">
                  <p className="text-sm">Signal is clear. Awaiting protocol override on the ETH levels.</p>
                  <span className="text-[10px] opacity-40 mt-1 block font-mono">08:42 AM</span>
                </div>
                <div className="p-3 rounded-tl-xl rounded-b-xl max-w-[85%] self-end shadow-[0_0_15px_rgba(99,102,241,0.2)]" style={{ background: `${profile.borderA}22`, border: `1px solid ${profile.borderA}44` }}>
                  <p className="text-sm text-white">Monitoring the 4H charts. Will send sequence shortly. Stand by.</p>
                  <span className="text-[10px] opacity-40 mt-1 block font-mono">08:45 AM</span>
                </div>
              </div>
            </div>

            <div className="p-4 border-t bg-black/50" style={{ borderColor: `${profile.borderA}22` }}>
              <div className="relative flex items-center">
                <input 
                  type="text" 
                  placeholder="Transmit securely..." 
                  className="w-full bg-white/5 border border-white/10 rounded-full pl-4 pr-12 py-2 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                />
                <button className="absolute right-2 p-1.5 bg-indigo-600 hover:bg-indigo-500 rounded-full text-white transition-colors shadow-[0_0_10px_#6366f1]">
                  <MessageSquare size={14} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Dark Popup for Stories */}
      <AnimatePresence>
        {activeStory && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black backdrop-blur-xl flex flex-col"
          >
            <div className="p-6 flex justify-between items-center z-10 absolute top-0 w-full" style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.8), transparent)' }}>
             <div className="flex items-center space-x-3">
                <div className="surfboard-profile-outline border-2 border-[#FF4500]" style={{ width: '40px', height: '65px' }}>
                  {activeStory.img ? <img src={activeStory.img} referrerPolicy="no-referrer" className="surfboard-img" /> : <div className="surfboard-img bg-[#111]" />}
                </div>
                <div>
                  <div className="text-white font-black uppercase tracking-widest text-lg">{activeStory.name}</div>
                  <div className="text-white/60 text-xs font-mono">{activeStory.time}</div>
                </div>
              </div>
              <button onClick={() => setActiveStory(null)} className="p-3 bg-white/10 hover:bg-white/20 rounded-full transition-colors backdrop-blur-md">
                <X size={24} className="text-white" />
              </button>
            </div>
            
            <div className="flex-1 flex items-center justify-center relative p-8">
               <div className="h-[60vh] w-full max-w-2xl bg-white/5 rounded-lg shadow-[0_0_50px_rgba(255,255,255,0.1)] border border-white/10" />
            </div>

            <div className="p-6 absolute bottom-0 w-full flex justify-center" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)' }}>
              <div className="w-full max-w-md relative">
                <input type="text" placeholder="Reply to story..." className="w-full bg-white/10 border border-[#FF00C8]/20 rounded-full px-6 py-3 text-white placeholder-white/50 backdrop-blur-md focus:outline-none focus:bg-white/20 transition-all font-semibold" />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Additional Terms of Service full-screen overlay */}
      <AnimatePresence>
        {showAdditionalTerms && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] bg-[#050314] overflow-y-auto"
          >
            <Suspense fallback={
              <div className="min-h-screen bg-[#050314] flex flex-col items-center justify-center space-y-4">
                <div className="w-12 h-12 border-4 border-[#FF00C8] border-t-transparent rounded-full animate-spin" />
                <div className="text-white font-mono text-xs uppercase tracking-widest">LOADING LEGAL COMPLIANCE NODE...</div>
              </div>
            }>
              <AdditionalTermsOfService onBack={() => setShowAdditionalTerms(false)} profile={profile} />
            </Suspense>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Removed static Founders Portal Modal, since it now renders in the main full screen view natively */}
      
      {/* Ambient Monitor Scanlines & CRT Noise Filter */}
      {showTerminalMatrixNoise && (
        <div className="fixed inset-0 pointer-events-none z-[999] opacity-[0.035] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[size:100%_4px,3px_100%] animate-[pulse_6s_infinite]" />
      )}
    </div>
  );
}
