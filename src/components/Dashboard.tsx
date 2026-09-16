import React, { useState, useEffect, useRef, Suspense, lazy, useMemo } from 'react';
import { 
  Home, 
  Newspaper, 
  MapPin, 
  FileText, 
  Image as ImageIcon, 
  Search, 
  MessageSquare, 
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
  Trophy,
  Briefcase,
  Grid,
  ShoppingCart,
  Globe,
  Calendar,
  Map,
  Landmark,
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
import ThemeSelector from './ThemeSelector';
import { chartThemes } from '../config/chartThemes';
import { AnalysisEvent } from '../types';

import { ClearNav } from './nav/ClearNav';
import { getDefaultDashboardTab } from '../lib/platform/defaultTab';
import { BackToDashboard } from './nav/BackToDashboard';
import { getClearState, subscribeToClearState } from '../lib/trading/clearState';
import { isFounderSession } from '../lib/founder';
import { auth } from '../firebase';
import { navigateToDesk } from '../lib/traderDesks';

import BreakingNewsTicker from './BreakingNewsTicker';
import SystemIntelligencePanel from './SystemIntelligencePanel';
import FeatureGate from './FeatureGate';
import SectionGuideOffer from './sectionGuides/SectionGuideOffer';
import { useMembership } from '../hooks/useMembership';
import { useAppShell } from '../contexts/AppShellContext';
import { isAppShell as detectAppShell } from '../lib/appShell';
import { EducationDeskBar } from '../education/EducationDeskBar';
import { isEducationFamilyTab } from '../education/educationDesks';

// Lazy load heavy tabs / panels to keep the main Dashboard chunk smaller
const InteractiveChart = lazy(() =>
  import('./charts/InteractiveChart').then((m) => ({ default: m.InteractiveChart }))
);
const MeetTheBoard = lazy(() => import('./MeetTheBoard'));
const ProfileHub = lazy(() =>
  import('./ProfileHub').then((m) => ({ default: m.ProfileHub }))
);
const AffiliateDashboard = lazy(() => import('./profile/AffiliateDashboard'));
const YoursPage = lazy(() => import('./yours/YoursPage'));
const MembershipTab = lazy(() => import('./MembershipTab'));
const NewsPanel = lazy(() => import('./NewsPanel'));
const DiscoveryFeed = lazy(() => import('./DiscoveryFeed'));
const ClearPathChatroom = lazy(() => import('./chat/ClearPathChatroom'));
const KillZones = lazy(() => import('./KillZones'));
const GoogleDesk = lazy(() => import('./GoogleDesk'));
const LegalFooter = lazy(() => import('./LegalFooter'));
const AdditionalTermsOfService = lazy(() => import('./AdditionalTermsOfService'));
const CeoDashboard = lazy(() => import('./CeoDashboard'));
const TodoList = lazy(() => import('./TodoList'));
const MarketTicker = lazy(() => import('./MarketTicker'));
const GetVerified = lazy(() => import('./GetVerified'));
const ShareQRCode = lazy(() => import('./ShareQRCode'));
const LightweightMarketUI = lazy(() => import('./markets/LightweightMarketUI').then(m => ({ default: m.LightweightMarketUI })));
const StandardMarketUI = lazy(() => import('./markets/StandardMarketUI').then(m => ({ default: m.StandardMarketUI })));
const MacroDashboard = lazy(() => import('./MacroDashboard'));
const EconomicCalendar = lazy(() => import('./EconomicCalendar'));
const FundamentalsPanel = lazy(() => import('./FundamentalsPanel'));
const GeographicMap = lazy(() => import('./GeographicMap'));
const AlertsCenter = lazy(() => import('./AlertsCenter'));
const PortfolioTracker = lazy(() => import('./PortfolioTracker'));
const StrategyMarket = lazy(() => import('./StrategyMarket'));
const CpmsApk = lazy(() => import('./CpmsApk'));
const EncyclopediaOfIndicators = lazy(() => import('./EncyclopediaOfIndicators'));
const EncyclopediaLayout = lazy(() => import('./encyclopedia/EncyclopediaLayout'));
const RiverWorkstation = lazy(() => import('./RiverWorkstation'));
const ClearPathEducationPage = lazy(() => import('../education/ClearPathEducation'));
const LiteracyOSPage = lazy(() => import('../literacy/LiteracyOSPage'));

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

const RETIRED_TABS: Record<string, string> = {
  Screener: 'StrictlyCharts',
  Heatmap: 'StrictlyCharts',
  Journal: 'StrictlyCharts',
  // Copycat / fabricated market surfaces — retired; keep News + Economic News
  CapitalFlow: 'News',
  Scanner: 'News',
  Intelligence: 'News',
  Leaderboard: 'News',
  ReferralDesk: 'Yours',
  // Broken PIN gate removed from the site — old links land on Memberships.
  Founders: 'Membership',
};

function normalizeTabId(tabId: string): string {
  return RETIRED_TABS[tabId] ?? tabId;
}

const ThemeTerminalTab = ({ chartTheme, setChartTheme, profile, onProfileChange }: { chartTheme: any, setChartTheme: (t: any) => void, profile: any, onProfileChange: (p: any) => void }) => {
  const [userTier, setUserTier] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('clearpath_user_tier');
      if (saved) return saved;
    } catch (e) {}
    return "PLATINUM";
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

          {/* ROW 4 — classic trading candles */}
          <ProfileButton id="standard_red_green" label="STANDARD_RED_GREEN" active={profile.id} />

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
            { id: "BASIC", label: "BASIC", count: "Vendor max 5,000 candles", color: "#FFaa00", desc: "Sheet: 7 year history" },
            { id: "SILVER", label: "SILVER", count: "Vendor max 5,000 candles", color: "#C0C0C0", desc: "Sheet: unlimited history" },
            { id: "GOLD", label: "GOLD", count: "Vendor max 5,000 candles", color: "#FFD700", desc: "Same Twelve Data cap" },
            { id: "PLATINUM", label: "PLATINUM", count: "Vendor max 5,000 candles", color: "#00D9FF", desc: "Same Twelve Data cap" }
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
        <Suspense fallback={<TabLoading />}>
          <InteractiveChart title="BTCUSD" profileId={profile.id} theme={chartTheme} userTier={userTier} />
          <InteractiveChart title="ETHUSD" profileId={profile.id} theme={chartTheme} userTier={userTier} />
          <InteractiveChart title="AAPL" profileId={profile.id} theme={chartTheme} userTier={userTier} />
          <InteractiveChart title="SPY" profileId={profile.id} theme={chartTheme} userTier={userTier} />
        </Suspense>
      </div>
    </div>
  );
};

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
  isFounder,
  selectedLightweightSymbol,
  setSelectedLightweightSymbol,
}: { 
  activeTab: string, 
  setActiveTab: (t: string) => void, 
  profile: any, 
  chartTheme: any, 
  setChartTheme: (t: any) => void, 
  onBack: () => void, 
  onProfileChange: (p: any) => void, 
  isAdmin: boolean,
  isFounder: boolean,
  selectedLightweightSymbol: string,
  setSelectedLightweightSymbol: (s: string) => void,
}) => {
  // Membership tier gating (founders bypass all gates)
  const { tierRank, loading: membershipLoading, hasFeature } = useMembership(profile);
  const gate = (
    feature: Parameters<typeof hasFeature>[0],
    requiredTier: 'silver' | 'gold' | 'platinum',
    featureTitle: string,
    perks: string[],
    node: React.ReactNode
  ) => (
    <FeatureGate
      allowed={isFounder || hasFeature(feature)}
      loading={membershipLoading}
      requiredTier={requiredTier}
      featureTitle={featureTitle}
      perks={perks}
      onUpgrade={() => setActiveTab('Membership')}
    >
      {node}
    </FeatureGate>
  );

  const content = useMemo(() => {
    switch (activeTab) {
      case 'Discovery': return (
        <DiscoveryFeed 
          onTabChange={setActiveTab} 
          profile={profile} 
        />
      );
      case 'Market': return <StandardMarketUI profile={profile} onBack={onBack} />;
      case 'StrictlyCharts': return (
        <LightweightMarketUI
          profile={profile}
          onBack={onBack}
          chartTheme={chartTheme}
          selectedMarketSymbol={selectedLightweightSymbol}
          onSelectMarketSymbol={setSelectedLightweightSymbol}
          onProfileChange={onProfileChange}
        />
      );
      case 'ThemeTerminal': return gate(
        'multiChart', 'silver', 'Multi-Chart Theme Terminal',
        ['4-chart synced layouts', 'Theme-matched terminals', 'Vendor-capped candle history'],
        <ThemeTerminalTab chartTheme={chartTheme} setChartTheme={setChartTheme} profile={profile} onProfileChange={onProfileChange} />
      );
      case 'Macro': return gate(
        'premiumDashboards', 'silver', 'Macro Dashboard',
        ['Global macro indicators', 'Rates, inflation & growth', 'Premium dashboards'],
        <MacroDashboard />
      );
      case 'Fundamentals': return gate(
        'premiumDashboards', 'silver', 'Fundamentals Panel',
        ['Company fundamentals', 'Financial statements', 'Valuation metrics'],
        <FundamentalsPanel />
      );
      case 'News': return <NewsPanel />;
      case 'Biography': return <ProfileHub user={profile} onNavigate={setActiveTab} />;
      case 'AffiliateNetwork': return gate(
        'affiliate', 'silver', 'Affiliate Network',
        ['Share codes', 'Silver sheet affiliate links', 'Honest residual credits'],
        <AffiliateDashboard profile={profile} onBack={() => setActiveTab('Biography')} />
      );
      case 'Yours': return <YoursPage />;
      case 'Membership': return <MembershipTab onNavigate={setActiveTab} />;
      case 'Workspace': return gate(
        'workspace', 'platinum', 'Workspace Desk',
        ['Bots / automation desk', 'Platinum sheet tools', 'Future features first'],
        <Suspense fallback={<TabLoading />}>
          <GoogleDesk />
        </Suspense>
      );
      case 'TheRiver': return gate(
        'indaCreator', 'gold', 'INDACREATOR Studio',
        ['Build custom indicators', 'Gold-sheet IndaCreator', 'River scripting'],
        <Suspense fallback={<TabLoading />}>
          <RiverWorkstation />
        </Suspense>
      );
      case 'CpmsApk': return <CpmsApk />;
      // Sentinel removed from nav; #Sentinel hash redirects to Discovery. Component kept for future re-enable.

      case 'EncyclopediaOfIndicators': return gate(
        'encyclopedia', 'silver', 'Encyclopedia of Indicators',
        ['Indicator reference', 'Silver sheet encyclopedia', 'Study tools, not advice'],
        <Suspense fallback={<TabLoading />}>
          <EncyclopediaOfIndicators />
        </Suspense>
      );
      case 'Encyclopedia': return gate(
        'encyclopedia', 'silver', 'Encyclopedia of Finance',
        ['Finance encyclopedia', 'Silver sheet research', 'Educational only'],
        <Suspense fallback={<TabLoading />}>
          <EncyclopediaLayout />
        </Suspense>
      );
      case 'Portfolio': return gate(
        'premiumDashboards', 'silver', 'Portfolio Tracker',
        ['Track positions & P/L', 'Performance analytics', 'Custom dashboard'],
        <PortfolioTracker />
      );
      case 'Calendar': return <EconomicCalendar />;
      case 'Geomap': return gate(
        'institutional', 'gold', 'Geographic Intelligence Map',
        ['Global market heat map', 'Gold-sheet views', 'Regional session intel'],
        <GeographicMap />
      );
      case 'StrategyMarket': return gate(
        'expandedAi', 'gold', 'Strategy Market',
        ['Community strategies', 'Gold-sheet tooling', 'Advanced setups'],
        <StrategyMarket />
      );
      case 'Alerts': return <AlertsCenter />;
      case 'Tasks': return <TodoList profile={profile} />;
      case 'GetVerified': return <GetVerified profile={profile} onBack={onBack} />;
      case 'ShareQR': return <ShareQRCode />;
      case 'CeoDashboard': return <CeoDashboard />;
      case 'MeetTheBoard': return <MeetTheBoard />;
      case 'GlobalSessions': return gate(
        'institutional', 'gold', 'Global Trading Sessions',
        ['Session kill zones', 'Institutional timing windows', 'Liquidity maps'],
        <div className="max-w-4xl mx-auto" id="view_global_trading_sessions">
          <h1 className="text-white text-2xl font-black uppercase tracking-wide mb-6">
            Global Trading Sessions
          </h1>
          <KillZones />
        </div>
      );
      case 'ClearPathEducation': return gate(
        'education', 'silver', 'Education',
        ['ClearPath education path', 'Silver sheet education', 'Not financial advice'],
        <Suspense fallback={<TabLoading />}>
          <ClearPathEducationPage onNavigate={setActiveTab} />
        </Suspense>
      );
      case 'LiteracyOS': return (
        <Suspense fallback={<TabLoading />}>
          <LiteracyOSPage onNavigate={setActiveTab} onProfileChange={onProfileChange} />
        </Suspense>
      );
      case 'TrainingBoard': return (
        <div className="min-h-screen bg-[#0a0a1a] flex flex-col items-center justify-center p-4 rounded-3xl border border-[#00FFFF]/10" id="view_training_board">
          <div className="w-full max-w-5xl">
            <h1 className="text-[#FF4500] text-2xl font-bold text-center mb-8 tracking-widest uppercase" id="training_board_main_title">
              Clear Path Trader: Training Board
            </h1>
            <p className="text-center text-white/40 text-sm font-mono">
              Open <strong className="text-[#00D9FF]">MARKETS</strong> or <strong className="text-[#00D9FF]">CHARTS</strong> from the nav bar — the Pattern Scanner panel appears on live charts.
            </p>
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
    isFounder,
    selectedLightweightSymbol,
    setSelectedLightweightSymbol,
    tierRank,
    membershipLoading,
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
  const { isAppShell } = useAppShell();
  const profile = initialProfile || advancedProfiles.calm_focus as any; // Cast as any temporarily to avoid type errors since initialProfile is still typed loosely in some places
  const { 
    user: authUser, 
    userProfile, 
    userRole,
    loading: authLoading,
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
  const [chatDockOpen, setChatDockOpen] = useState(false);
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
        if (
          path === '/indicators' ||
          path === '/encyclopedia-of-indicators' ||
          path.startsWith('/indicators/')
        ) {
          return 'EncyclopediaOfIndicators';
        }
        if (path === '/education' || path === '/clearpath-education') {
          return 'ClearPathEducation';
        }
        if (path === '/literacy' || path === '/literacy-os') {
          return 'LiteracyOS';
        }
        if (path === '/ceo' || path === '/ceo-dashboard') {
          return 'CeoDashboard';
        }
      } catch (e) {
        console.error('Failed to parse pathname for activeTab initial state:', e);
      }
    }
    if (typeof localStorage !== 'undefined') {
      try {
        const savedTab = localStorage.getItem('clearpath_active_tab');
        if (savedTab) return normalizeTabId(savedTab);
      } catch (e) {
        console.error('Failed to load activeTab from localStorage:', e);
      }
    }
    if (typeof window !== 'undefined') {
      try {
        const params = new URLSearchParams(window.location.search);
        const urlTab = params.get('tab');
        if (urlTab) return normalizeTabId(urlTab);
        
        const hash = window.location.hash.replace('#', '');
        if (hash) return normalizeTabId(hash);
      } catch (e) {
        console.error('Failed to parse activeTab initial URL:', e);
      }
    }
    return getDefaultDashboardTab();
  });
  const [showTicker, setShowTicker] = useState(() => {
    if (detectAppShell()) return false;
    return localStorage.getItem('cp_show_ticker') !== 'false';
  });
  const [layoutDensity, setLayoutDensity] = useState<'compact' | 'balanced' | 'cozy'>(() => (localStorage.getItem('cp_layout_density') as any) || 'balanced');
  const [showTerminalMatrixNoise, setShowTerminalMatrixNoise] = useState(() => localStorage.getItem('cp_terminal_ambient_overlay') === 'true');

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


  const [showAdditionalTerms, setShowAdditionalTerms] = useState(false);
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

  const [globalSearchQuery, setGlobalSearchQuery] = useState('');
  const [activeMarketAssets, setActiveMarketAssets] = useState([
    'GOLD', 'OIL', 'US10Y', 'BTCUSDT'
  ]);
  const [introForm, setIntroForm] = useState({
    bio: '',
    location: '',
    company: ''
  });
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
          'insights': 'Insights',
          'market': 'StrictlyCharts',
          'markets': 'StrictlyCharts',
          'exchange command center': 'StrictlyCharts',
          'standard': 'Standard',
          'news': 'News',
          'photos': 'Photos',
          'settings': 'Settings',
          'biography': 'Biography',
          'affiliate': 'AffiliateNetwork',
          'strictlycharts': 'StrictlyCharts',
          'charts': 'StrictlyCharts'
        };
        const mappedTarget = normalizeTabId(targetMap[target.toLowerCase()] || target);
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

  const isAdmin = () =>
    userRole?.role === 'admin' ||
    isFounderSession(authUser?.email, userProfile?.email, auth.currentUser?.email) ||
    authUser?.email === 'creator@clearpatcharge.com';
  /** CEO Dashboard — private session, profile, or live Google founder email. */
  const isFounder = () =>
    isFounderSession(authUser?.email, userProfile?.email, auth.currentUser?.email);
  const isVerified = () => requireVerified();

  const menuItems = useMemo(() => {
    const allMenuItems = [
      { id: 'Yours', icon: User, label: 'YOURS' },
      { id: 'TheRiver', icon: Cpu, label: 'INDACREATOR' },
      { id: 'Membership', icon: Crown, label: 'MEMBERSHIP' },
      { id: 'StrictlyCharts', icon: BarChart3, label: 'MARKETS' },
      { id: 'ClearPathEducation', icon: Book, label: 'CLEARPATH EDUCATION' },
      { id: 'Encyclopedia', icon: Book, label: 'FINANCIAL ENCYCLOPEDIA' },
      { id: 'Fundamentals', icon: Landmark, label: 'FUNDAMENTAL' },
      { id: 'News', icon: Newspaper, label: 'LIVE NEWS' },
      { id: 'Calendar', icon: Calendar, label: 'ECONOMIC NEWS' },
      { id: 'ThemeTerminal', icon: Terminal, label: 'THEMES / PROFILES' },
      { id: 'MeetTheBoard', icon: Shield, label: 'MEET THE BOARD' },
      { id: 'CeoDashboard', icon: Shield, label: 'CEO DASHBOARD' }, 
      { id: 'Logout', icon: LogOut, label: 'LOGOUT' },
    ];

    return allMenuItems.filter((item: any) => {
      if (item.id === 'CeoDashboard') return isFounder();
      if (item.verified) return isVerified() || isAdmin();
      return true;
    });
  }, [userRole?.role, authUser?.email, userProfile?.email, profile?.vipStatus]);

  useEffect(() => {
    if (authLoading) return;
    if (activeTab === 'CeoDashboard' && !isFounder()) {
      setActiveTab('StrictlyCharts');
      if (typeof window !== 'undefined') {
        try {
          const path = window.location.pathname.toLowerCase();
          if (path === '/ceo' || path === '/ceo-dashboard') {
            window.history.replaceState({ tabId: 'StrictlyCharts' }, '', '/?tab=StrictlyCharts');
          }
        } catch {
          /* ignore */
        }
      }
      return;
    }
    if (!isFounder()) return;
    if (typeof window === 'undefined') return;
    const path = window.location.pathname.toLowerCase().replace(/\/$/, '') || '/';
    const params = new URLSearchParams(window.location.search);
    const hash = window.location.hash.replace('#', '');
    const otherTab = params.get('tab') || (hash && hash !== 'CeoDashboard' ? hash : '');
    if (path === '/ceo' || path === '/ceo-dashboard' || (path === '/' && !otherTab)) {
      setActiveTab('CeoDashboard');
      try {
        localStorage.setItem('clearpath_active_tab', 'CeoDashboard');
      } catch {
        /* ignore */
      }
    }
  }, [authLoading, authUser?.email, userProfile?.email]);

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
    const nextTab = normalizeTabId(tabId);
    // CEO Dashboard is founder-only (Diagnostics removed — it probed vendor APIs)
    if (nextTab === 'CeoDashboard' && authLoading) {
      return;
    }
    if (nextTab === 'CeoDashboard' && !isFounder()) {
      setActiveTab('StrictlyCharts');
      if (typeof window !== 'undefined') {
        try {
          window.history.replaceState({ tabId: 'StrictlyCharts' }, '', '/?tab=StrictlyCharts');
        } catch {
          /* ignore */
        }
      }
      return;
    }
    if (nextTab === 'Diagnostics') {
      setActiveTab('StrictlyCharts');
      return;
    }
    if (nextTab === 'Fundamentals') {
      navigateToDesk('fundamental');
      return;
    }
    setActiveTab(nextTab);
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem('clearpath_active_tab', nextTab);
      } catch (e) {
        console.error('Failed to save activeTab to localStorage:', e);
      }
    }
    if (typeof window !== 'undefined') {
      try {
        if (nextTab === 'EncyclopediaOfIndicators') {
          const path = window.location.pathname.toLowerCase();
          const target = path.startsWith('/indicators/') ? window.location.pathname : '/indicators';
          window.history.pushState({ tabId: nextTab }, '', target);
        } else if (nextTab === 'Encyclopedia') {
          const path = window.location.pathname.toLowerCase();
          const keep =
            path === '/encyclopedia' ||
            path.startsWith('/stocks') ||
            path.startsWith('/crypto') ||
            path.startsWith('/forex') ||
            path.startsWith('/commodities') ||
            path.startsWith('/companies') ||
            path.startsWith('/economy');
          window.history.pushState({ tabId: nextTab }, '', keep ? window.location.pathname : '/encyclopedia');
        } else if (nextTab === 'Fundamentals') {
          window.history.pushState({ tabId: nextTab }, '', '/desk/fundamental');
        } else if (nextTab === 'CeoDashboard') {
          window.history.pushState({ tabId: nextTab }, '', '/ceo');
        } else {
          const params = new URLSearchParams(window.location.search);
          params.set('tab', nextTab);
          const path =
            window.location.pathname.toLowerCase() === '/desk/fundamental' ||
            window.location.pathname.toLowerCase() === '/ceo' ||
            window.location.pathname.toLowerCase() === '/ceo-dashboard'
              ? '/'
              : window.location.pathname;
          const newUrl = `${path}?${params.toString()}#${nextTab}`;
          window.history.pushState({ tabId: nextTab }, '', newUrl);
        }
      } catch (e) {
        console.error('Failed to push tab status state:', e);
      }
    }
  };

  useEffect(() => {
    const onSetTab = (event: Event) => {
      const detail = (event as CustomEvent).detail;
      if (typeof detail === 'string' && detail.trim()) {
        handleTabChange(detail);
      }
    };
    window.addEventListener('clearpath-set-tab', onSetTab as EventListener);
    return () => window.removeEventListener('clearpath-set-tab', onSetTab as EventListener);
  }, []);

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
        if (
          path === '/indicators' ||
          path === '/encyclopedia-of-indicators' ||
          path.startsWith('/indicators/')
        ) {
          setActiveTab('EncyclopediaOfIndicators');
          return;
        }
        if (path === '/education' || path === '/clearpath-education') {
          setActiveTab('ClearPathEducation');
          return;
        }
        if (path === '/desk/fundamental' || path.startsWith('/desk/fundamental/')) {
          setActiveTab('Fundamentals');
          return;
        }
        if (path === '/ceo' || path === '/ceo-dashboard') {
          if (isFounder()) {
            setActiveTab('CeoDashboard');
          } else {
            setActiveTab('StrictlyCharts');
            window.history.replaceState({ tabId: 'StrictlyCharts' }, '', '/?tab=StrictlyCharts');
          }
          return;
        }
      }

      if (event.state && event.state.tabId) {
        const nextTabId = normalizeTabId(event.state.tabId);
        setActiveTab(nextTabId);
      } else {
        const params = new URLSearchParams(window.location.search);
        const urlTab = params.get('tab');
        if (urlTab) {
          setActiveTab(normalizeTabId(urlTab));
        } else {
          const hash = window.location.hash.replace('#', '');
          if (hash) setActiveTab(normalizeTabId(hash));
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
    } else if (
      path === '/indicators' ||
      path === '/encyclopedia-of-indicators' ||
      path.startsWith('/indicators/')
    ) {
      setActiveTab('EncyclopediaOfIndicators');
    } else if (path === '/desk/fundamental' || path.startsWith('/desk/fundamental/')) {
      setActiveTab('Fundamentals');
    } else if (path === '/ceo' || path === '/ceo-dashboard') {
      setActiveTab(isFounder() ? 'CeoDashboard' : 'StrictlyCharts');
      if (!isFounder()) {
        window.history.replaceState({ tabId: 'StrictlyCharts' }, '', '/?tab=StrictlyCharts');
      }
    } else if (path === '/education' || path === '/clearpath-education') {
      setActiveTab('ClearPathEducation');
    } else {
      const params = new URLSearchParams(window.location.search);
      const urlTab = params.get('tab');
      if (urlTab) {
        setActiveTab(normalizeTabId(urlTab));
      } else {
        const hash = window.location.hash.replace('#', '');
        const retiredTabs = new Set(['Screener', 'Journal', 'Sentinel', 'CapitalFlow', 'Scanner', 'Intelligence', 'Leaderboard', 'ReferralDesk', 'Founders']);
        if (retiredTabs.has(hash)) {
          setActiveTab(normalizeTabId(hash) === hash ? 'News' : normalizeTabId(hash));
        } else {
        const validHash = menuItems.find(m => m.id === hash) || 
          hash === 'TheRiver' || 
          hash === 'CeoDashboard' || 
          hash === 'ThemeTerminal' || 
          hash === 'Market' || 
          hash === 'StrictlyCharts' || 
          hash === 'Fundamentals' || 
          hash === 'Portfolio' || 
          hash === 'News' || 
          hash === 'Calendar' ||
          hash === 'Biography' || 
          hash === 'MeetTheBoard' || 
          hash === 'Yours' || 
          hash === 'CpmsApk' || 
          hash === 'AffiliateNetwork' || 
          hash === 'Encyclopedia' || 
          hash === 'EncyclopediaOfIndicators' || 
          hash === 'ClearPathEducation' ||
          hash === 'LiteracyOS' ||
          hash === 'ApiMonitor';
        if (validHash) {
          const next = normalizeTabId(hash);
          setActiveTab(next);
        }
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
  }, [menuItems, authUser, authLoading, userProfile?.email]);

  return (
    <div 
      className="relative min-h-[100dvh] flex flex-col w-full text-[#ccc8db] font-sans selection:bg-indigo-500 transition-colors duration-1000 overflow-visible"
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
      {/* Main Content */}
      <div 
        className="flex-1 flex flex-col w-full relative transition-all duration-300" 
        style={{ background: profile.bgTop }}
      >
        {/* TOP PERSISTENT BREAKING NEWS HOIST */}
        {!isAppShell && <BreakingNewsTicker />}

        {/* PERSISTENT Clear NAV */}
        <ClearNav activeTab={activeTab} onNavigate={handleTabChange} isAdmin={isAdmin()} isFounder={isFounder()} onLogout={handleLogout} lean={isAppShell} />

        {/* TOP MARKET TICKER */}
        {showTicker && !isAppShell && activeTab !== 'StrictlyCharts' && (
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
                  type="button"
                  onClick={() => setChatDockOpen((v) => !v)}
                  aria-label={chatDockOpen ? 'Close chat' : 'Open chat'}
                  aria-expanded={chatDockOpen}
                  className="p-3 transition-colors rounded-full shadow-lg z-[60] border border-[#ff4500]/50"
                  style={{
                    background: 'linear-gradient(135deg, #ff0000 0%, #ff4500 52%, #ff8c00 100%)',
                    color: '#000',
                    boxShadow: '0 0 18px rgba(255, 69, 0, 0.55)',
                  }}
                >
                  <MessageSquare size={22} />
                </button>
              </div>
            </div>
          </>
        )}

        {/* Content Container -- ONE SCROLLBAR RULE: this box never has its own
            private scrollbar on any screen size. Content flows into the page,
            so the page is the one and only scrollbar, top to footer. */}
        <div 
          className={`flex-1 overflow-visible ${
            activeTab === 'Insights' 
              ? 'p-0 pb-32 md:pb-5' 
              : activeTab === 'StrictlyCharts' || activeTab === 'Fundamentals'
                ? 'p-0 pb-20 md:pb-0'
              : layoutDensity === 'compact'
                ? 'p-1.5 md:p-2.5 pb-20'
                : layoutDensity === 'cozy'
                  ? 'p-6 md:p-8 pb-40 md:pb-16'
                  : 'p-3 md:p-5 pb-32 md:pb-10'
          }`} 
          style={{ background: profile.bgTop }}
        >
          {/* Hero/cover banner removed per ZERO HERO IMAGES rule --
              content starts immediately and flows top-to-bottom. */}
          {/* Ingress Monitor is founder-only — never show market-key posture to the public. */}
          {isFounder() &&
            activeTab !== 'Insights' &&
            activeTab !== 'StrictlyCharts' &&
            activeTab !== 'Fundamentals' &&
            activeTab !== 'ThemeTerminal' &&
            activeTab !== 'Encyclopedia' &&
            activeTab !== 'EncyclopediaOfIndicators' &&
            !isAppShell && <SystemIntelligencePanel />}

          {/* Content Views */}
          <div className="flex-1 flex flex-col w-full relative min-h-full">
            <AnimatePresence mode="wait">
                <div
                  key={`${activeTab}:${selectedLightweightSymbol}`}
                  className="flex flex-col flex-1 h-full w-full min-h-[400px]"
                >
                  <div className={`flex-1 flex flex-col ${
                    activeTab === 'StrictlyCharts' || activeTab === 'Fundamentals'
                      ? 'p-0 min-h-0'
                      : 'px-6 lg:px-12 pb-16 pt-8 min-h-[50vh]'
                  }`}>
                    {activeTab !== 'CeoDashboard' && activeTab !== 'Fundamentals' && (
                      <div className={activeTab === 'StrictlyCharts' ? 'px-3 pt-2 shrink-0' : undefined}>
                        <SectionGuideOffer tabId={activeTab} disabled={isAppShell} />
                      </div>
                    )}
                    {isEducationFamilyTab(activeTab) && (
                      <EducationDeskBar activeTab={activeTab} onNavigate={handleTabChange} />
                    )}
                    {activeTab !== 'StrictlyCharts' && activeTab !== 'Fundamentals' && activeTab !== 'CeoDashboard' && activeTab !== 'AffiliateNetwork' && !isEducationFamilyTab(activeTab) && (
                      <div className="mb-6">
                        <BackToDashboard onBack={() => handleTabChange(isFounder() ? 'CeoDashboard' : 'StrictlyCharts')} color={profile.text} />
                      </div>
                    )}
                    <Suspense fallback={<TabLoading />}>
                      <TabContent 
                        activeTab={activeTab} 
                        setActiveTab={handleTabChange}
                        profile={profile} 
                        chartTheme={chartTheme} 
                        setChartTheme={handleSetChartTheme}
                        onBack={() => handleTabChange(isFounder() ? 'CeoDashboard' : 'StrictlyCharts')} 
                        onProfileChange={onProfileChange}
                        isAdmin={isAdmin()}
                        isFounder={isFounder()}
                        selectedLightweightSymbol={selectedLightweightSymbol}
                        setSelectedLightweightSymbol={setSelectedLightweightSymbol}
                      />
                    </Suspense>
                  </div>
                </div>
            </AnimatePresence>
          </div>

          <div className="w-full mt-auto mb-0 bg-transparent flex flex-col">
            <LegalFooter profile={profile} onShowTerms={() => setShowAdditionalTerms(true)} />
            {!isAppShell && <BreakingNewsTicker />}
          </div>
        </div>
      </div>

      {/* Compact lava-orange chat dock — closed on login; no fake faces */}
      <AnimatePresence>
        {chatDockOpen && (
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.96 }}
            transition={{ type: 'spring', damping: 22, stiffness: 220 }}
            className="fixed bottom-3 right-3 z-[90] w-[min(100vw-1rem,min(42rem,92vw))] h-[min(92dvh,900px)] flex flex-col rounded-2xl overflow-hidden border-2 border-[#ff4500] shadow-[0_0_40px_rgba(255,69,0,0.45)]"
          >
            <Suspense fallback={<TabLoading />}>
              <ClearPathChatroom
                variant="panel"
                initialRoomId="lobby"
                title="ClearPath Chat"
                subtitle="Live lobby"
                showRoomSidebar={false}
                accentColor="#FF4500"
                onClose={() => setChatDockOpen(false)}
                className="rounded-none h-full border-0 cp-chatroom-lava"
                heightClass="h-full"
              />
            </Suspense>
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
            className="scrollbar-panel fixed inset-0 z-[9999] bg-[#050314] overflow-y-auto"
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

      
      {/* Ambient Monitor Scanlines & CRT Noise Filter */}
      {showTerminalMatrixNoise && (
        <div className="fixed inset-0 pointer-events-none z-[999] opacity-[0.035] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[size:100%_4px,3px_100%] animate-[pulse_6s_infinite]" />
      )}
    </div>
  );
}
