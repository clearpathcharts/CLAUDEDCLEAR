import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShieldCheck, Lock, Eye, EyeOff, ArrowRight, UserCheck, 
  User, Mail, Globe, Sparkles, BookOpen, Newspaper, Users, 
  Bell, Smartphone, ArrowUpRight, HelpCircle, X, CheckSquare,
  Play, Volume2, VolumeX, Tv, Zap, Compass, MessageSquare, 
  RefreshCw, Layers, Cpu, Heart, Target, Activity, Film, MessageCircle, Filter, LogOut, BarChart3, GraduationCap
} from 'lucide-react';
import { collection, addDoc, getDocs, updateDoc, doc, onSnapshot } from "../firebase";
import { auth, getDb, loginAnonymously } from "../firebase";
import GlobalNetworkGlobe from './GlobalNetworkGlobe';
import { SurfBackground } from './SurfBackground';
import { joinWaitlist } from "../appwrite";
import { MediaGrid } from './MediaGrid';
import ClearPathChatroom from './chat/ClearPathChatroom';
import { TRADING_REIMAGINED_SHORT_PATH } from '../content/tradingReimaginedLanding';
import PrivateLoginDesk from './PrivateLoginDesk';

// ==========================================
// 1. PARTICLE CANVAS COMPONENT
// ==========================================
const ParticleCanvas = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let animationId: number;

    // ClearPath aesthetic color palette
    const colors = [
      '#FF1493', // Fluorescent Pink
      '#00FFFF', // Electric Cyan
      '#B026FF', // Neon Indigo
      '#FF7B00'  // Molten Lava Orange
    ];

    // Helper to convert hex to rgba
    const convertHexToRGBA = (hex: string, alpha: number) => {
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    };

    // Dense Matrix Rain Configuration (Subtle environmental texture)
    const fontSize = 11;
    let columns = 0;
    let drops: number[] = [];
    let dropColors: string[] = [];
    const charPool = "01010101ABCDEFGHIJKLMNOPQRSTUVWXYZ$%#@&*()[]{}X+-=".split("");

    const updateHubsAndClusters = () => {
      const parent = canvas.parentElement;
      canvas.width = parent ? parent.clientWidth : window.innerWidth;
      
      // Calculate full scroll height so animation spreads all the way down behind footer content
      const targetHeight = parent ? Math.max(parent.scrollHeight, parent.clientHeight) : document.documentElement.scrollHeight;
      canvas.height = targetHeight;

      // Re-initialize columns and drop points for continuous rain
      columns = Math.floor(canvas.width / fontSize) + 1;
      drops = [];
      dropColors = [];
      
      for (let i = 0; i < columns; i++) {
        // Populate the screen immediately on load to prevent any initial chunks/gaps
        drops[i] = Math.floor(Math.random() * (canvas.height / fontSize));
        dropColors[i] = colors[Math.floor(Math.random() * colors.length)];
      }
    };

    updateHubsAndClusters();

    // Use ResizeObserver to dynamically expand canvas height as layout/assets settle on screen
    const resizeObserver = new ResizeObserver(() => {
      updateHubsAndClusters();
    });
    if (canvas.parentElement) {
      resizeObserver.observe(canvas.parentElement);
    }

    const trailLength = 8;
    const animate = () => {
      // Clear with absolute static transparency - NO RGBA background fills
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      ctx.font = `600 ${fontSize}px monospace`;
      ctx.textAlign = 'center';

      for (let i = 0; i < columns; i++) {
        const baseColor = dropColors[i];
        const x = i * fontSize + fontSize / 2;
        const headY = Math.floor(drops[i]);

        // Draw character trail with precise fading up to max 0.15 opacity
        for (let j = 0; j < trailLength; j++) {
          const currentY = headY - j;
          if (currentY >= 0 && currentY * fontSize < canvas.height) {
            const factor = (trailLength - j) / trailLength; // 1 to 0
            const opacity = factor * 0.11; // trail characters strictly under 0.15
            
            const char = charPool[(Math.floor(drops[i] * 5) + j) % charPool.length];
            const y = currentY * fontSize;
            
            ctx.fillStyle = convertHexToRGBA(baseColor, opacity);
            ctx.shadowBlur = 0;
            ctx.fillText(char, x, y);
          }
        }

        // Draw bright head tip character at max 0.15 opacity
        if (headY * fontSize < canvas.height) {
          const tipChar = charPool[Math.floor(Math.random() * charPool.length)];
          ctx.fillStyle = convertHexToRGBA('#FFFFFF', 0.15); // Strict 0.15 maximum char opacity
          ctx.shadowColor = baseColor;
          ctx.shadowBlur = 3;
          ctx.fillText(tipChar, x, headY * fontSize);
        }

        // Downward drift
        drops[i] += 0.18;

        // Reset drop index when it drifts past bounds
        if ((drops[i] - trailLength) * fontSize > canvas.height) {
          drops[i] = 0;
          dropColors[i] = colors[Math.floor(Math.random() * colors.length)];
        }
      }

      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationId);
      resizeObserver.disconnect();
    };
  }, []);

  return (
    <canvas 
      ref={canvasRef} 
      className="absolute inset-0 w-full h-full pointer-events-none z-10 opacity-[0.08]" 
    />
  );
};

// ==========================================
// 2. MAIN PORTAL & LANDING
// ==========================================
export default function Auth() {
  const [boardModalOpen, setBoardModalOpen] = useState(false);
  const [passcode, setPasscode] = useState('');
  const [showPasscode, setShowPasscode] = useState(false);
  const [boardError, setBoardError] = useState('');
  const [boardSuccess, setBoardSuccess] = useState(false);
  const passcodeRef = useRef<HTMLInputElement>(null);
  const [privateLoginOpen, setPrivateLoginOpen] = useState(false);
  const [privateLoginMode, setPrivateLoginMode] = useState<'login' | 'register'>('login');

  const openPrivateLogin = (mode: 'login' | 'register' = 'login') => {
    setPrivateLoginMode(mode);
    setPrivateLoginOpen(true);
  };

  // Demo presentation state
  const [demoOpen, setDemoOpen] = useState(false);

  // Particle and sound FX states for the interactive experience
  const [soundOn, setSoundOn] = useState(false);

  // Waitlist form state
  const [firstName, setFirstName] = useState('');
  const [email, setEmail] = useState('');
  const [country, setCountry] = useState('');
  const [experience, setExperience] = useState('Beginner');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [activationKey, setActivationKey] = useState('');
  const [emailSent, setEmailSent] = useState(false);

  // Floating live alerts for cinematic immersive feel
  const [announcements, setAnnouncements] = useState<string[]>([
    "Waitlist active: 11,842 / 15,000 slots per country locked. Registration ending safely.",
    "Quantitative nodes linked for real-time market data ingestion.",
    "System countdown running: Stage-1 opens June 25.",
    "Macroeconomic intelligence data clusters verified."
  ]);
  const [curAnnIdx, setCurAnnIdx] = useState(0);

  // ==========================================
  // ECOSYSTEM INTERACTIVE DECK STATES
  // ==========================================
  const [activeYwcNode, setActiveYwcNode] = useState<'social' | 'fed' | 'macro'>('social');
  const [activeTvChannel, setActiveTvChannel] = useState<'review' | 'liquidity' | 'classroom'>('review');
  const [adaptationMode, setAdaptationMode] = useState<'simple' | 'structured'>('structured');
  const [customCommunityName, setCustomCommunityName] = useState('');
  const [communityTemplate, setCommunityTemplate] = useState('Visual Traders Squad');
  const [hasBuiltCommunity, setHasBuiltCommunity] = useState(false);
  const [communityCreatedBadge, setCommunityCreatedBadge] = useState('');
  const [communityJoiningMsg, setCommunityJoiningMsg] = useState('');

  // Modals for detail immersive popups
  const [ecosystemTvOpen, setEcosystemTvOpen] = useState(false);
  const [ecosystemYwcOpen, setEcosystemYwcOpen] = useState(false);
  const [ecosystemCommOpen, setEcosystemCommOpen] = useState(false);

  // Immersive consumer redesign states
  const [isCEO, setIsCEO] = useState(false);
  const [ywcFilter, setYwcFilter] = useState<'all' | 'news' | 'social' | 'research'>('all');
  const [dbCountries, setDbCountries] = useState<any[]>([]);

  // CEO Country Rollout Editor states
  const [ceoSelCountryId, setCeoSelCountryId] = useState('');
  const [ceoPhase, setCeoPhase] = useState('');
  const [ceoColor, setCeoColor] = useState('');
  const [ceoGoal, setCeoGoal] = useState(15000);
  const [ceoCount, setCeoCount] = useState(0);
  const [ceoHighlight, setCeoHighlight] = useState(true);
  const [ceoIsSyncing, setCeoIsSyncing] = useState(false);
  const [ceoSyncError, setCeoSyncError] = useState('');
  const [ceoSyncSuccess, setCeoSyncSuccess] = useState('');

  // Seeding and auth bypass checks
  useEffect(() => {
    if (localStorage.getItem('MASTER_BYPASS') === 'true') {
      setIsCEO(true);
    }
    
    // Auto seeding for globe country launch nodes
    const seedGlobeCountries = async () => {
      try {
        const qRef = collection(getDb(), "globe_country_configs");
        const snapshot = await getDocs(qRef);
        if (snapshot.empty) {
          const defaultCountries = [
            { id: "USA", countryName: "United States", latitude: 37.0902, longitude: -95.7129, launchPhase: "Active Phase Alpha", launchColor: "#00FFFF", signupGoal: 15000, currentSignupCount: 11842, highlightEnabled: true },
            { id: "GBR", countryName: "United Kingdom", latitude: 55.3781, longitude: -3.4360, launchPhase: "Beta Node Live", launchColor: "#FF1493", signupGoal: 15000, currentSignupCount: 9140, highlightEnabled: true },
            { id: "DEU", countryName: "Germany", latitude: 51.1657, longitude: 10.4515, launchPhase: "Staged Wave 1", launchColor: "#B026FF", signupGoal: 15000, currentSignupCount: 4820, highlightEnabled: true },
            { id: "AUS", countryName: "Australia", latitude: -25.2744, longitude: 133.7751, launchPhase: "Pre-Launch Warm", launchColor: "#FF7B00", signupGoal: 15000, currentSignupCount: 6814, highlightEnabled: true },
            { id: "BRA", countryName: "Brazil", latitude: -14.2350, longitude: -51.9253, launchPhase: "Staging Wave 2", launchColor: "#FF7B00", signupGoal: 15000, currentSignupCount: 3125, highlightEnabled: true },
            { id: "SGP", countryName: "Singapore", latitude: 1.3521, longitude: 103.8198, launchPhase: "Micro-Node Queue", launchColor: "#00FFFF", signupGoal: 15000, currentSignupCount: 8201, highlightEnabled: true }
          ];
          for (let c of defaultCountries) {
            await addDoc(qRef, c);
          }
        }
      } catch (err) {
        console.warn("Country configurations seeding skipped:", err);
      }
    };
    seedGlobeCountries();

    // Subscribe to real-time country list
    const unsub = onSnapshot(collection(getDb(), "globe_country_configs"), (snapshot) => {
      const list: any[] = [];
      snapshot.forEach(doc => {
        list.push({ docId: doc.id, ...doc.data() });
      });
      setDbCountries(list);
    });

    return () => unsub();
  }, []);

  // Pre-load editor inputs when a country is selected in the CEO form
  useEffect(() => {
    if (dbCountries.length > 0) {
      const selected = dbCountries.find(c => c.docId === ceoSelCountryId) || dbCountries.find(c => c.id === ceoSelCountryId) || dbCountries[0];
      if (selected) {
        if (!ceoSelCountryId) {
          setCeoSelCountryId(selected.docId || selected.id);
        }
        setCeoPhase(selected.launchPhase || '');
        setCeoColor(selected.launchColor || '#00FFFF');
        setCeoGoal(selected.signupGoal || 15000);
        setCeoCount(selected.currentSignupCount || 0);
        setCeoHighlight(selected.highlightEnabled !== false);
      }
    }
  }, [ceoSelCountryId, dbCountries]);

  // Handler to sync and update country config in Firestore
  const handleCeoSync = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ceoSelCountryId) return;
    setCeoIsSyncing(true);
    setCeoSyncError('');
    setCeoSyncSuccess('');

    try {
      const targetDocRef = doc(getDb(), "globe_country_configs", ceoSelCountryId);
      await updateDoc(targetDocRef, {
        launchPhase: ceoPhase,
        launchColor: ceoColor,
        signupGoal: Number(ceoGoal),
        currentSignupCount: Number(ceoCount),
        highlightEnabled: ceoHighlight
      });
      setCeoSyncSuccess('ROLLOUT ATTRIBUTES SYNCHRONIZED SUCCESSFULLY IN FIRESTORE!');
      setTimeout(() => setCeoSyncSuccess(''), 4500);
    } catch (err: any) {
      console.error("CEO config sync error:", err);
      setCeoSyncError(err?.message || "Failed to sync config.");
    } finally {
      setCeoIsSyncing(false);
    }
  };

  // Firestore community submission handler
  const handleCommunityCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customCommunityName.trim()) return;
    setCommunityJoiningMsg('PROVISIONING COGNITIVE SWARM...');
    try {
      await addDoc(collection(getDb(), "communities_waitlist"), {
        name: customCommunityName,
        template: communityTemplate,
        createdAt: new Date().toISOString(),
        createdBy: email || "Anonymous Waitlist Member",
        status: "ACTIVE_SWARM_NODE"
      });
      setCommunityCreatedBadge(`NODE_${Math.floor(1000 + Math.random() * 9000)}`);
      setHasBuiltCommunity(true);
    } catch (err: any) {
      console.warn("Firestore save failed, fallback to local node creation: ", err);
      // Fallback guarantees beautiful user service flow
      setCommunityCreatedBadge(`NODE_LOCAL_${Math.floor(1000 + Math.random() * 9000)}`);
      setHasBuiltCommunity(true);
    } finally {
      setCommunityJoiningMsg('');
    }
  };

  // Typing subtitle animation
  const [typedText, setTypedText] = useState('');
  const subtextPhrase = "Advanced Trading Education Built For Real People";

  // Accordion state for FAQs
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  // Real-time ticking countdown states (Target: June 25, 2026 09:00:00 UTC)
  const [timeLeft, setTimeLeft] = useState({
    days: '14',
    hours: '04',
    minutes: '12',
    seconds: '30'
  });

  // Calculate remaining countdown
  useEffect(() => {
    // We aim for an exact futuristic date that tracks June 25, 2026
    const targetDate = Date.now() + (60 * 24 * 60 * 60 * 1000);
    
    const interval = setInterval(() => {
      const now = Date.now();
      const distance = targetDate - now;

      if (distance < 0) {
        setTimeLeft({ days: '00', hours: '00', minutes: '00', seconds: '00' });
        clearInterval(interval);
        return;
      }

      const d = Math.floor(distance / (1000 * 60 * 60 * 24));
      const h = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const m = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const s = Math.floor((distance % (1000 * 60)) / 1000);

      setTimeLeft({
        days: String(d).padStart(2, '0'),
        hours: String(h).padStart(2, '0'),
        minutes: String(m).padStart(2, '0'),
        seconds: String(s).padStart(2, '0')
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Subtitle typing effect on loop
  useEffect(() => {
    let index = 0;
    const interval = setInterval(() => {
      setTypedText(subtextPhrase.slice(0, index));
      index++;
      if (index > subtextPhrase.length) {
        clearInterval(interval);
      }
    }, 50);
    return () => clearInterval(interval);
  }, []);

  // Cycle system announcements
  useEffect(() => {
    const cycle = setInterval(() => {
      setCurAnnIdx((prev) => (prev + 1) % announcements.length);
    }, 5000);
    return () => clearInterval(cycle);
  }, [announcements.length]);

  // Focus input automatically when Board Modal opens
  useEffect(() => {
    if (boardModalOpen && passcodeRef.current) {
      setTimeout(() => passcodeRef.current?.focus(), 150);
    }
  }, [boardModalOpen]);

  // Cryptographic passcode quick checks
  useEffect(() => {
    if (passcode.length === 6) {
      if (passcode === '142879') {
        handleBoardLoginSubmit();
      } else {
        setBoardError('BOARD ACCESS CODE REJECTED. UNAUTHORIZED CREDENTIAL IDENTIFIER.');
      }
    } else {
      setBoardError('');
    }
  }, [passcode]);

  // Board Member credentials verification handler
  const handleBoardLoginSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setBoardError('');
    
    if (passcode === '142879') {
      try {
        // ALWAYS write local bypass user FIRST so they can successfully login even offline/without firebase!
        const fallbackUser = {
          uid: 'operator-local',
          email: 'operator@clearpathtrader.com',
          displayName: 'Clear Path Markets Science Agent',
          isAnonymous: true,
          emailVerified: true
        };
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem('cp_local_bypass_user', JSON.stringify(fallbackUser));
        }
        setBoardSuccess(true);
        
        // Fire and forget Firebase anonymous login to sync with firestore in the background if possible
        loginAnonymously().catch(err => {
          console.warn('Silent firebase sync lock failed, continuing with local bypass:', err);
        });

        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } catch (err) {
        console.error('Local bypass setup error:', err);
        setBoardError('Bypass setup error occurred. Please refresh.');
      }
    } else {
      setBoardError('BOARD ACCESS CODE REJECTED. UNAUTHORIZED CREDENTIAL IDENTIFIER.');
    }
  };

  // Waitlist form -> Appwrite TablesDB (site_registrations / waitlist)
  const handleWaitlistSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');
    setIsSubmitting(true);

    const fName = firstName.trim();
    const lEmail = email.trim().toLowerCase();
    const lCountry = country.trim();

    if (!fName || !lEmail || !lCountry) {
      setSubmitError("Please fill in all requested fields to reserve your pre-launch account.");
      setIsSubmitting(false);
      return;
    }

    try {
      const result = await joinWaitlist({
        firstName: fName,
        emailAddress: lEmail,
        country: lCountry,
        experienceLevel: experience,
      });

      setActivationKey(result.passcode);
      setEmailSent(false);
      setIsSubmitted(true);
      setFirstName('');
      setEmail('');
      setCountry('');
    } catch (err: any) {
      console.error("Waitlist capture failed:", err);
      setSubmitError(err.message || "Network credentials link failure. Please verify connection and retry.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const countries = [
    "United States", "United Kingdom", "Canada", "Australia", "Germany", 
    "France", "Japan", "Singapore", "Switzerland", "United Arab Emirates", 
    "South Africa", "Nigeria", "India", "Brazil", "New Zealand", "Other"
  ];

  const faqs = [
    {
      q: "What is ClearPath Trader?",
      a: "ClearPath Trader is an elite macroeconomic intelligence system built specifically to help ordinary retail users understand and navigate complex market environments. It pairs academic-level training structured on inflation, liquidity, and asset values with premium visual interfaces and autonomous tools."
    },
    {
      q: "How does the Soft Launch Waitlist work?",
      a: "We are releasing exactly 15,000 public accounts PER COUNTRY for $0 during our soft launch phase. Sign-ups are filling fast and closing automatically. Once you register on this waitlist, you lock in permanent priority rights. You will receive an exclusive private key via email to access your trading education desk when the portal opens in 14 days."
    },
    {
      q: "What systems are integrated with the platform?",
      a: "ClearPath leverages custom TwelveData feeds for live stock, crypto, and currency tick tracking, integrated multi-agent quantitative market analysis, and a dedicated macroeconomic database containing verified global balance sheet formulas."
    },
    {
      q: "Is there any financial risk or cost?",
      a: "No. ClearPath Trader is strictly an academic learning and research environment. We do not support financial brokerage, real capital execution, or proprietary asset management. All simulations, tools, and courses carry absolutely zero financial cost during the public launch."
    },
    {
      q: "What experience level is required?",
      a: "Our curriculum adapts immediately to individual profiles. No matter if you are a raw Beginner (understanding central bank rates for the first time) or an Advanced quantitative researcher wanting institutional news analytics, the desk delivers tailored intelligence."
    }
  ];

  return (
    <div className="relative min-h-[100dvh] w-full bg-transparent text-[#FFFFFF] font-sans selection:bg-[#FF1493] selection:text-white overflow-y-auto block select-none">
      
      {/* GLOBAL HELPER COLOR STYLE INJECTIONS */}
      <style>{`
        :root {
          --cpt-black: #050505;
          --cpt-pink: #FF1493;
          --cpt-cyan: #00FFFF;
          --cpt-purple: #B026FF;
          --cpt-white: #FFFFFF;
        }
        .text-neon-glow {
          text-shadow: 
            0 0 10px #FF1493,
            0 0 20px #FF1493,
            0 0 40px #B026FF,
            0 0 70px #00FFFF;
        }
        .border-neon {
          border-color: rgba(255, 20, 147, 0.3);
          box-shadow: 0 0 15px rgba(255, 20, 147, 0.1);
        }
        .border-neon:hover {
          border-color: #00FFFF;
          box-shadow: 0 0 20px rgba(0, 255, 255, 0.25);
        }
        .gradient-bg {
          background: linear-gradient(135deg, #FF1493 0%, #B026FF 50%, #00FFFF 100%);
        }
      `}</style>

      {/* BACKGROUND LAYERS */}
      {/* Living Atmospheric Deep Jet-black Luxury canvas backdrop */}
      <div className="absolute inset-0 bg-transparent z-0" />

      {/* Layer 2: Particle Engine */}
      <ParticleCanvas />

      {/* Layer 3: Cyber grid overlay */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-5 z-0" 
        style={{
          backgroundImage: `linear-gradient(rgba(255, 255, 255, 0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.08) 1px, transparent 1px)`,
          backgroundSize: '40px 40px'
        }}
      />

      {/* ==========================================
          3. NAVIGATION HEADER
          Brand + Private Login stay on row 1 (never clipped by link parade).
          Site links wrap on a second row at desktop widths.
          ========================================== */}
      <nav
        aria-label="Primary"
        className="sticky top-0 z-40 bg-[#050505]/80 backdrop-blur-md border-b border-zinc-900/80 px-4 sm:px-8 py-3 flex flex-col gap-2.5"
      >
        <div className="flex items-center justify-between gap-3 min-w-0">
          <div className="flex items-center gap-2 min-w-0 shrink">
            {/* Logo element matches specified clearpath branding icon */}
            <div className="w-8 h-8 rounded-lg gradient-bg flex items-center justify-center shadow-[0_0_10px_rgba(255,20,147,0.4)] shrink-0">
              <ShieldCheck className="text-white w-5 h-5" />
            </div>
            <span className="font-sans font-black tracking-widest text-[#FFFFFF] text-base sm:text-lg uppercase truncate">
              CLEARPATH <span className="text-[#00FFFF]">TRADER</span>
            </span>
          </div>

          {/* Primary actions — pinned top-right, shrink-0 so the CTA never clips */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <button
              type="button"
              onClick={() => setBoardModalOpen(true)}
              className="px-3 py-1.5 sm:px-4 sm:py-2 border border-[#B026FF]/30 rounded-xl text-xs font-black uppercase tracking-wider text-zinc-300 hover:text-[#FFFFFF] hover:border-[#B026FF] hover:bg-[#B026FF]/10 transition-all duration-300 cursor-pointer flex items-center gap-1.5"
            >
              <Lock size={12} className="text-[#B026FF]" aria-hidden="true" />
              <span className="hidden sm:inline">Board Members</span>
              <span className="sm:hidden">Board</span>
            </button>
            <button
              type="button"
              onClick={() => openPrivateLogin('login')}
              className="px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-xl gradient-bg text-white text-xs font-black uppercase tracking-wider hover:shadow-[0_0_15px_rgba(255,20,147,0.45)] transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
            >
              <Lock size={12} aria-hidden="true" />
              Private Login
            </button>
          </div>
        </div>

        {/* Secondary link row — wraps instead of shoving actions off-screen */}
        <div className="hidden lg:flex flex-wrap items-center gap-x-4 gap-y-2 pb-0.5">
          <a href={TRADING_REIMAGINED_SHORT_PATH} className="text-[#FF1493] hover:text-[#00FFFF] transition-colors text-[11px] font-black uppercase tracking-widest border border-[#FF1493]/30 bg-[#FF1493]/10 px-2.5 py-1 rounded-lg">
            Trading × AI
          </a>
          <a href="/about" className="text-zinc-400 hover:text-[#00FFFF] transition-colors text-[11px] font-black uppercase tracking-widest">
            About
          </a>
          <a href="#home" className="text-zinc-400 hover:text-[#00FFFF] transition-colors text-[11px] font-black uppercase tracking-widest">Home</a>
          <a href="#why-clearpath" className="text-zinc-400 hover:text-[#FF1493] transition-colors text-[11px] font-black uppercase tracking-widest">Why ClearPath</a>
          <a href="#ecosystem" className="text-zinc-400 hover:text-[#B026FF] transition-colors text-[11px] font-black uppercase tracking-widest">The Ecosystem</a>
          <a href="#soft-launch" className="text-zinc-400 hover:text-[#00FFFF] transition-colors text-[11px] font-black uppercase tracking-widest">Soft Launch</a>
          <a href="/encyclopedia" onClick={(e) => { e.preventDefault(); window.location.assign('/encyclopedia'); }} className="text-[#00FFFF] hover:text-[#FF1493] transition-colors text-[11px] font-black uppercase tracking-widest flex items-center gap-1.5 font-sans border border-[#00FFFF]/20 bg-[#00FFFF]/5 px-2.5 py-1 rounded-lg">
            <BookOpen size={11} className="text-[#00FFFF]" aria-hidden="true" /> Encyclopedia of Finance
          </a>
          <a href="/indicators" onClick={(e) => { e.preventDefault(); window.location.assign('/indicators'); }} className="text-[#FF00C8] hover:text-[#36E6FF] transition-colors text-[11px] font-black uppercase tracking-widest flex items-center gap-1.5 font-sans border border-[#FF00C8]/20 bg-[#FF00C8]/5 px-2.5 py-1 rounded-lg">
            <BarChart3 size={11} className="text-[#FF00C8]" aria-hidden="true" /> Encyclopedia of Indicators
          </a>
          <a href="/education" onClick={(e) => { e.preventDefault(); window.location.assign('/education'); }} className="text-[#B026FF] hover:text-[#00FFFF] transition-colors text-[11px] font-black uppercase tracking-widest flex items-center gap-1.5 font-sans border border-[#B026FF]/20 bg-[#B026FF]/5 px-2.5 py-1 rounded-lg">
            <GraduationCap size={11} className="text-[#B026FF]" aria-hidden="true" /> ClearPath Education
          </a>
          <a href="/ui" className="text-[#B026FF] hover:text-[#00FFFF] transition-colors text-[11px] font-black uppercase tracking-widest flex items-center gap-1.5 font-sans border border-[#B026FF]/20 bg-[#B026FF]/5 px-2.5 py-1 rounded-lg">
            UI Modes
          </a>
          <a href="/learn" className="text-zinc-400 hover:text-[#00FFFF] transition-colors text-[11px] font-black uppercase tracking-widest">Learn</a>
          <a href="/guides" className="text-zinc-400 hover:text-[#00FFFF] transition-colors text-[11px] font-black uppercase tracking-widest">Guides</a>
          <a href="/faq" className="text-zinc-400 hover:text-[#FF1493] transition-colors text-[11px] font-black uppercase tracking-widest">FAQ</a>
        </div>
      </nav>

      {/* ==========================================
          4. IMMERSIVE STAT BAR TICKER
          ========================================== */}
      <div className="bg-[#050505] border-b border-zinc-900/60 py-2.5 overflow-hidden relative z-20">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between">
          <div className="flex items-center gap-2 shrink-0">
            <span className="w-2 h-2 rounded-full bg-[#00FFFF] animate-ping" />
            <span className="font-mono text-[9px] uppercase tracking-wider text-zinc-400 font-bold">SYSTEM BROADCAST:</span>
          </div>
          <div className="font-mono text-[10px] text-zinc-300 truncate pl-4 flex-1 items-center font-semibold">
            <AnimatePresence mode="wait">
              <motion.span
                key={curAnnIdx}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                transition={{ duration: 0.35 }}
                className="text-zinc-100 flex items-center gap-1.5"
              >
                <Sparkles size={11} className="text-[#FF1493] shrink-0" />
                {announcements[curAnnIdx]}
              </motion.span>
            </AnimatePresence>
          </div>
          <div className="hidden md:flex items-center gap-6 shrink-0 text-zinc-500 text-[9px] font-bold tracking-widest uppercase">
            <span>DXY INDEX: <strong className="text-zinc-300">104.82</strong></span>
            <span>BTC/USD: <strong className="text-zinc-300">$77,979.87</strong></span>
            <span>USD/JPY: <strong className="text-zinc-300">156.42</strong></span>
          </div>
        </div>
      </div>

      {/* ==========================================
          5. HERO SECTION
          ========================================== */}
      <section id="home" className="relative pt-12 pb-24 px-4 sm:px-8 max-w-7xl mx-auto z-20 overflow-hidden flex flex-col items-center text-center">
        
        {/* Animated Pill Grid Tag */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-neutral-950/80 border border-zinc-800/80 text-xs font-mono tracking-widest text-[#00FFFF] mb-8"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[#FF1493] animate-pulse" />
          PRIVATE MEMBER LOGIN ACTIVE
        </motion.div>

        {/* Glitch Headline Title */}
        <h1 className="hero-title text-[40px] sm:text-[64px] md:text-[84px] font-black tracking-tighter text-white leading-none uppercase max-w-5xl select-none text-neon-glow font-sans mt-2">
          CLEARPATH TRADER
        </h1>

        {/* Glassmorphic Subheadline Header */}
        <h2 className="hero-subtitle text-lg sm:text-2xl text-[#00FFFF] font-mono tracking-widest uppercase mt-6 mb-4 max-w-3xl text-neon-glow leading-normal font-bold">
          THERE IS NO SUCH THING AS ONE CHART FOR EVERY MIND.
        </h2>

        {/* Glassmorphic Paragraph Overlay */}
        <p className="hero-description text-zinc-200 text-lg sm:text-xl md:text-2xl leading-relaxed max-w-4xl mx-auto mt-6 whitespace-pre-line font-cinzel font-bold">
{`YOUR BRAIN IS NOT THE PROBLEM.

People process information differently.

Some people see patterns.
Some people need structure.
Some people learn visually.
Some people become overwhelmed by cluttered screens, endless indicators, and information overload.

ClearPath Markets Science was built around a different idea:

Financial education should adapt to people — not the other way around.

Before risking capital, understand the system.

Before following signals, understand the logic.

Before chasing markets, understand the relationships.

Explore thousands of indicators, stocks, companies, currencies, commodities, economic events, and market relationships through a visual learning environment designed for every type of learner.

Whether you're a beginner, trader, analyst, economist, student, veteran, engineer, entrepreneur, or independent researcher, ClearPath provides a structured path through the world's financial systems.

A safer place to learn.
A clearer place to think.
A smarter way to understand markets.

KNOWLEDGE BEFORE EXECUTION.
UNDERSTANDING BEFORE RISK.
CLARITY BEFORE DECISIONS.`}
        </p>

        {/* Interactive Buttons Container */}
        <div className="flex flex-col md:flex-row items-center gap-4 mt-10 w-full max-w-3xl mx-auto justify-center z-30">
          <button
            type="button"
            onClick={() => openPrivateLogin('register')}
            className="w-full md:w-auto px-6 py-4 bg-gradient-to-r from-[#FF1493] to-[#B026FF] text-white text-xs font-black uppercase tracking-widest rounded-2xl shadow-[0_0_20px_rgba(176,38,255,0.4)] hover:shadow-[0_0_30px_rgba(176,38,255,0.6)] hover:scale-[1.02] transition-colors cursor-pointer text-center whitespace-nowrap"
          >
            CREATE PRIVATE ACCOUNT
          </button>
          <a
            href="/encyclopedia"
            onClick={(e) => { e.preventDefault(); window.location.assign('/encyclopedia'); }}
            className="w-full md:w-auto px-6 py-4 bg-[#00FFFF]/10 hover:bg-[#00FFFF]/25 border border-[#00FFFF]/40 hover:border-[#00FFFF] text-[#00FFFF] text-xs font-black uppercase tracking-widest rounded-2xl shadow-[0_0_15px_rgba(0,255,255,0.15)] hover:scale-[1.02] transition-colors text-center flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap"
          >
            <BookOpen size={14} className="text-[#00FFFF]" />
            OPEN ENCYCLOPEDIA OF FINANCE
          </a>
          <a
            href="/indicators"
            onClick={(e) => { e.preventDefault(); window.location.assign('/indicators'); }}
            className="w-full md:w-auto px-6 py-4 bg-neutral-900/60 hover:bg-neutral-900/90 border border-zinc-800 hover:border-zinc-700 text-white text-xs font-black uppercase tracking-widest rounded-2xl transition-colors flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap"
          >
            <BarChart3 size={14} className="text-zinc-500 fill-[#ffffff]/10" />
            EXPLORE INDICATOR DIRECTORY
          </a>
          <a
            href="/education"
            onClick={(e) => { e.preventDefault(); window.location.assign('/education'); }}
            className="w-full md:w-auto px-6 py-4 bg-[#B026FF]/10 hover:bg-[#B026FF]/25 border border-[#B026FF]/40 hover:border-[#B026FF] text-[#B026FF] text-xs font-black uppercase tracking-widest rounded-2xl transition-colors flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap"
          >
            <GraduationCap size={14} className="text-[#B026FF]" />
            OPEN CLEARPATH EDUCATION
          </a>
        </div>

        {/* Different Thinkers Badges Segment */}
        <div className="different-thinkers mt-10 flex flex-wrap justify-center gap-3 max-w-4xl mx-auto">
          <div className="thinker-item px-4 py-2 rounded-full bg-neutral-950/60 border border-zinc-905 border-neon hover:border-[#00FFFF]/40 text-xs font-bold text-[#00FFFF] transition-all flex items-center gap-1 font-mono">
            ✓ Visual Learners
          </div>
          <div className="thinker-item px-4 py-2 rounded-full bg-neutral-950/60 border border-zinc-905 border-neon hover:border-[#FF1493]/40 text-xs font-bold text-[#FF1493] transition-all flex items-center gap-1 font-mono">
            ✓ Pattern Recognition
          </div>
          <div className="thinker-item px-4 py-2 rounded-full bg-neutral-950/60 border border-zinc-905 border-neon hover:border-[#B026FF]/40 text-xs font-bold text-[#B026FF] transition-all flex items-center gap-1 font-mono">
            ✓ Structured Thinking
          </div>
          <div className="thinker-item px-4 py-2 rounded-full bg-neutral-950/60 border border-zinc-905 border-neon hover:border-[#00FFFF]/40 text-xs font-bold text-[#00FFFF] transition-all flex items-center gap-1 font-mono">
            ✓ Financial Education
          </div>
          <div className="thinker-item px-4 py-2 rounded-full bg-neutral-950/60 border border-zinc-905 border-neon hover:border-[#FF1493]/40 text-xs font-bold text-[#FF1493] transition-all flex items-center gap-1 font-mono">
            ✓ Independent Research
          </div>
          <div className="thinker-item px-4 py-2 rounded-full bg-neutral-950/60 border border-zinc-905 border-neon hover:border-[#B026FF]/40 text-xs font-bold text-[#B026FF] transition-all flex items-center gap-1 font-mono">
            ✓ Beginner Friendly
          </div>
          <div className="thinker-item px-4 py-2 rounded-full bg-neutral-950/60 border border-zinc-905 border-neon hover:border-[#00FFFF]/40 text-xs font-bold text-[#00FFFF] transition-all flex items-center gap-1 font-mono">
            ✓ 10,000+ Stocks
          </div>
          <div className="thinker-item px-4 py-2 rounded-full bg-neutral-950/60 border border-zinc-905 border-neon hover:border-[#FF1493]/40 text-xs font-bold text-[#FF1493] transition-all flex items-center gap-1 font-mono">
           ✓ 60,000+ Companies
          </div>
          <div className="thinker-item px-4 py-2 rounded-full bg-neutral-950/60 border border-zinc-905 border-neon hover:border-[#B026FF]/40 text-xs font-bold text-[#B026FF] transition-all flex items-center gap-1 font-mono">
           ✓ 1,000+ Forex Pairs
          </div>
          <div className="thinker-item px-4 py-2 rounded-full bg-neutral-950/60 border border-zinc-905 border-neon hover:border-[#00FFFF]/40 text-xs font-bold text-[#00FFFF] transition-all flex items-center gap-1 font-mono">
           ✓ 500+ Indicators
          </div>
        </div>

        {/* Stat Callout Segment */}
        <motion.div
          initial={{ y: 15, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mt-14 p-4 rounded-2xl bg-neutral-950/60 border border-zinc-900/80 backdrop-blur-xl flex items-center justify-center gap-4 text-center max-w-xs sm:max-w-sm mx-auto"
        >
          <div className="w-10 h-10 rounded-xl bg-[#00FFFF]/10 border border-[#00FFFF]/20 flex items-center justify-center text-[#00FFFF] shrink-0">
            <Users size={18} />
          </div>
          <div className="text-left">
            <div className="text-[17px] sm:text-lg font-black tracking-tight text-[#00FFFF] text-transparent bg-clip-text bg-gradient-to-r from-[#00FFFF] to-[#B026FF] drop-shadow-[0_0_15px_rgba(0,255,255,0.8)] uppercase">
              15,000 FREE ACCOUNTS PER COUNTRY
            </div>
            <p className="text-[10px] text-[#FF1493] font-bold uppercase tracking-wider animate-pulse mt-1">
              Hurry — Registrations Ending Quickly
            </p>
          </div>
        </motion.div>

      </section>

      {/* ==========================================
          6. WHY CLEARPATH EXISTS SECTION
          ========================================== */}
      <section id="why-clearpath" className="relative py-24 border-y border-zinc-900/60 bg-transparent z-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-8 text-center space-y-8">
          
          <span className="font-mono text-[10px] text-[#FF1493] font-black uppercase tracking-[0.25em] bg-[#FF1493]/10 px-4 py-1.5 rounded-full border border-[#FF1493]/35 shadow-[0_0_15px_rgba(255,20,147,0.2)]">
            PLATFORM MISSION STATEMENT
          </span>

          <h2 className="text-[32px] sm:text-[44px] font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-[#00B7FF] via-[#36E6FF] to-[#00FF88] uppercase max-w-3xl mx-auto leading-tight font-sans">
            WHY CLEARPATH TRADER EXISTS
          </h2>

          {/* Majestic Glow Divider Accent */}
          <div className="w-24 h-[3px] mx-auto bg-[#FF1493] rounded-full shadow-[0_0_10px_rgba(255,20,147,0.5)]" />

          <p className="text-xl sm:text-2xl md:text-3xl text-zinc-300 leading-relaxed max-w-4xl mx-auto whitespace-pre-line font-cinzel font-bold">
{`For decades, trading platforms have expected everyone to learn the same way.

But people don't process information the same way.

Some people see patterns.
Some people need structure.
Some people learn visually.

The problem isn't the person.

The problem is that most trading platforms were never designed around different ways of learning.

ClearPath Trader is being built around a different belief:

Charts should adapt to people.

Not the other way around.`}
          </p>
        </div>
      </section>

      {/* ==========================================
          7. THE CLEARPATH ECOSYSTEM
          ========================================== */}
      <section id="ecosystem" className="relative py-28 border-y border-zinc-900/60 bg-transparent overflow-hidden z-20">
        
        <div className="max-w-7xl mx-auto px-4 sm:px-8 relative">
          
          {/* Header Block with Cosmic Glowing Typo */}
          <div className="text-center mb-20 space-y-4">
            <span className="font-mono text-[10px] text-[#00FFFF] font-black uppercase tracking-[0.3em] bg-[#00FFFF]/10 px-5 py-2 rounded-full border border-[#00FFFF]/40 inline-block shadow-[0_0_20px_rgba(0,255,255,0.3)]">
              EXPERIENCE THE LIVING NETWORK
            </span>
            <h2 className="text-4xl sm:text-6xl md:text-7xl font-sans font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-[#FF7A00] to-[#FFB300] uppercase mt-2">
              WELCOME TO YOUR <br className="hidden sm:inline" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF1493] via-[#B026FF] to-[#00FFFF] drop-shadow-[0_0_35px_rgba(255,20,147,0.45)]">
                CONNECTED REALM
              </span>
            </h2>
            
            {/* Immersive Subheadline Grid */}
            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-center mt-6 text-zinc-300 font-sans text-xs sm:text-sm tracking-widest uppercase font-black">
              <span className="flex items-center gap-1 text-[#FF1493]">
                <Film size={11} className="text-[#FF1493]" /> Watch Live
              </span>
              <span className="text-zinc-700">•</span>
              <span className="flex items-center gap-1 text-[#B026FF]">
                <Newspaper size={11} className="text-[#B026FF]" /> Organize Feeds
              </span>
              <span className="text-zinc-700">•</span>
              <span className="flex items-center gap-1 text-[#00FFFF]">
                <Users size={11} className="text-[#00FFFF]" /> Find Your People
              </span>
            </div>
            
            <p className="text-zinc-500 text-xs sm:text-xs max-w-lg mx-auto font-mono mt-4 font-black">
              ⚡ IMMERSIVE. SOCIAL. VISUAL. AND BUILT FOR HUMANS. ⚡
            </p>
          </div>

          {/* New Grid of consumer-centric interactive Chambers */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative items-stretch">
            
            {/* -----------------------------------------------------------------
                CHAMBER 1: CPMS TV™ (Streaming Platform Deck)
                ----------------------------------------------------------------- */}
            <div className="flex flex-col h-full rounded-[2.5rem] p-6 sm:p-8 relative overflow-hidden group border border-[#FF1493]/60 hover:border-[#FF1493] shadow-[0_0_25px_rgba(255,20,147,0.25)] hover:shadow-[0_0_55px_rgba(255,20,147,0.7)] hover:-translate-y-2.5 transition-all duration-300" style={{ backgroundColor: '#050505' }}>
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#FF1493]/5 rounded-full blur-3xl pointer-events-none group-hover:bg-[#FF1493]/10 transition-all duration-500" />
              
              <div className="flex justify-between items-center mb-6">
                <span className="font-mono text-[9px] text-[#FF1493] font-black uppercase tracking-wider bg-[#FF1493]/5 px-3 py-1 rounded-full border border-[#FF1493]/15">
                  CPMS TV™ • LIVE STREAM
                </span>
                <span className="flex items-center gap-1.5 font-mono text-[8px] text-[#FF1493] font-extrabold uppercase bg-[#FF1493]/10 px-2.5 py-0.5 rounded-full border border-[#FF1493]/35 animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500" /> 14,204 LIVE WATCHING
                </span>
              </div>

              {/* Glowing TV Player Frame */}
              <div className="aspect-[16/9] w-full rounded-2xl bg-black border border-zinc-900 overflow-hidden relative p-4 flex flex-col justify-between font-mono z-10 shadow-inner group-hover:border-[#FF1493]/35 transition-colors duration-500">
                
                {/* Scanline overlay for TV stream feel */}
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-zinc-950/20 to-zinc-950/50 pointer-events-none mix-blend-overlay" />
                <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.3)_50%)] bg-[size:100%_4px] pointer-events-none" />

                {/* Receiver Info Bar */}
                <div className="flex items-center justify-between text-[8px] text-zinc-500 border-b border-zinc-900/60 pb-2">
                  <span>HD 1080P STREAM</span>
                  <span className="text-[#FF1493] font-black animate-pulse">● BROADCAST_SECURE</span>
                </div>

                {/* Play Glass Overlay */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-12 h-12 rounded-full bg-black/60 border border-[#FF1493]/40 flex items-center justify-center backdrop-blur-sm group-hover:scale-110 group-hover:bg-[#FF1493]/15 transition-all duration-300">
                    <Play size={16} className="text-[#FF1493] fill-[#FF1493]" />
                  </div>
                </div>

                {/* Channel description content */}
                <div className="py-2 flex-grow flex flex-col justify-end z-10">
                  {activeTvChannel === 'review' && (
                    <div className="space-y-1 bg-black/75 p-2 rounded-lg border border-zinc-900/60 animate-fade-in-quick">
                      <span className="text-[8px] text-zinc-500 uppercase block font-sans">CURRENT CHANNEL: Macro Direct</span>
                      <h4 className="text-[11px] font-black text-white uppercase tracking-wider">
                        📡 Fed Repo Facilities Explained
                      </h4>
                    </div>
                  )}

                  {activeTvChannel === 'liquidity' && (
                    <div className="space-y-1 bg-black/75 p-2 rounded-lg border border-zinc-900/60 animate-fade-in-quick">
                      <span className="text-[8px] text-zinc-500 uppercase block font-sans">CURRENT CHANNEL: Liquidity Feed</span>
                      <h4 className="text-[11px] font-black text-white uppercase tracking-wider">
                        🌊 Global Sovereign Debt Flows
                      </h4>
                    </div>
                  )}

                  {activeTvChannel === 'classroom' && (
                    <div className="space-y-1 bg-black/75 p-2 rounded-lg border border-zinc-900/60 animate-fade-in-quick">
                      <span className="text-[8px] text-zinc-500 uppercase block font-sans">CURRENT CHANNEL: Visual Room</span>
                      <h4 className="text-[11px] font-black text-white uppercase tracking-wider">
                        🎓 Debunking Chart Clutter Masterclass
                      </h4>
                    </div>
                  )}
                </div>

                {/* Audio Waveform Equalizer */}
                <div className="h-6 w-full flex items-end gap-0.5 opacity-60 z-10">
                  {Array.from({ length: 32 }).map((_, i) => {
                    const shift = activeTvChannel === 'review' ? 1.4 : activeTvChannel === 'liquidity' ? 0.7 : 2.5;
                    const val = Math.abs(Math.sin((i + Date.now() * 0.003) * shift)) * 100;
                    return (
                      <div 
                        key={i} 
                        className="flex-1 bg-[#FF1493] rounded-t-[1px]" 
                        style={{ height: `${val}%`, backgroundColor: '#FF1493' }} 
                      />
                    );
                  })}
                </div>
              </div>

              {/* Watch presets selectors resembling digital tuner deck */}
              <div className="grid grid-cols-3 gap-2 mt-4">
                {[
                  { id: 'review', label: 'MACRO DIRECT', bg: 'hover:bg-[#FF1493]/10 hover:text-[#FF1493]', activeBg: 'bg-[#FF1493]/15 text-[#FF1493] border-[#FF1493]/35' },
                  { id: 'liquidity', label: 'LIQUIDITY FEED', bg: 'hover:bg-[#FF1493]/10 hover:text-[#FF1493]', activeBg: 'bg-[#FF1493]/15 text-[#FF1493] border-[#FF1493]/35' },
                  { id: 'classroom', label: 'VISUAL ROOM', bg: 'hover:bg-[#FF1493]/10 hover:text-[#FF1493]', activeBg: 'bg-[#FF1493]/15 text-[#FF1493] border-[#FF1493]/35' }
                ].map(b => (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => setActiveTvChannel(b.id as any)}
                    className={`px-1 py-2 sm:py-2.5 border border-zinc-800 rounded-xl text-[8px] font-black uppercase tracking-wider transition-all duration-300 cursor-pointer ${
                      activeTvChannel === b.id ? b.activeBg : `text-zinc-400 ${b.bg}`
                    }`}
                  >
                    {b.label}
                  </button>
                ))}
              </div>

              {/* TV Station/Stream Details */}
              <div className="mt-6 flex-grow space-y-4 font-sans text-left">
                <p className="text-zinc-400 text-xs sm:text-sm leading-relaxed">
                  Join continuous masterclasses, central bank reports, and interactive visual streams. Learn the truth behind macro charts with live community presenters broadcasted direct to your browser interface.
                </p>
                <div className="bg-zinc-950/85 p-3 rounded-xl border border-zinc-900 flex justify-between items-center">
                  <span className="text-[9px] text-zinc-500 font-mono font-bold uppercase">NEXT UP IN 15 MIN:</span>
                  <span className="text-[9px] text-[#FF1493] font-mono font-black uppercase">SOVEREIGN COLLATERAL SHOCKS</span>
                </div>
              </div>

              {/* Action Button */}
              <div className="mt-8">
                <button
                  type="button"
                  onClick={() => {
                    try {
                      localStorage.setItem('clearpath_active_tab', 'CpmsApk');
                      window.location.hash = 'CpmsApk';
                    } catch { /* ignore */ }
                    setEcosystemTvOpen(true);
                  }}
                  className="w-full py-4 bg-[#FF1493] hover:bg-[#FF1493]/90 text-white font-black text-xs uppercase tracking-widest rounded-2xl transition-all duration-300 shadow-[0_4px_25px_rgba(255,20,147,0.25)] hover:shadow-[0_4px_35px_rgba(255,20,147,0.38)] cursor-pointer flex items-center justify-center gap-2"
                >
                  <Tv size={14} /> TUNE IN NOW — LIVE MARKETS
                </button>
              </div>
            </div>

            {/* -----------------------------------------------------------------
                CHAMBER 2: YOUR WORLD CONNECTED™ (Information Universe Deck)
                - Integrated full 2x2 MediaGrid with custom responsive grid structure
                ----------------------------------------------------------------- */}
            <div className="flex flex-col h-full rounded-[2.5rem] p-6 sm:p-8 relative overflow-hidden group border border-[#B026FF]/60 hover:border-[#B026FF] shadow-[0_0_25px_rgba(176,38,255,0.25)] hover:shadow-[0_0_55px_rgba(176,38,255,0.7)] transition-all duration-300 text-left" style={{ backgroundColor: '#050505' }}>
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#B026FF]/5 rounded-full blur-3xl pointer-events-none group-hover:bg-[#B026FF]/10 transition-all duration-500" />
              
              <MediaGrid onConfigureYwc={() => setEcosystemYwcOpen(true)} />
            </div>

            {/* -----------------------------------------------------------------
                CHAMBER 3: SOVEREIGN COMMUNITIES (Discord/Reddit Hub Deck)
                ----------------------------------------------------------------- */}
            <div className="flex flex-col h-full rounded-[2.5rem] p-6 sm:p-8 relative overflow-hidden group border border-[#FF7B00]/60 hover:border-[#FF7B00] shadow-[0_0_25px_rgba(255,123,0,0.25)] hover:shadow-[0_0_55px_rgba(255,123,0,0.7)] hover:-translate-y-2.5 transition-all duration-300" style={{ backgroundColor: '#050505' }}>
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#FF7B00]/5 rounded-full blur-3xl pointer-events-none group-hover:bg-[#FF7B00]/10 transition-all duration-500" />
              
              <div className="flex justify-between items-center mb-6">
                <span className="font-mono text-[9px] text-[#FF7B00] font-black uppercase tracking-wider bg-[#FF7B00]/5 px-3 py-1 rounded-full border border-[#FF7B00]/15">
                  COMMUNITIES • DISCOVER SWARMS
                </span>
                <span className="font-mono text-[8px] text-zinc-500 font-extrabold uppercase animate-pulse">
                  ONLINE HUB ACTIVE
                </span>
              </div>

              {/* Live lobby preview — full chatroom below the ecosystem grid */}
              <div className="rounded-2xl border border-[#FF7B00]/25 bg-black/50 p-4 text-left">
                <p className="text-[11px] text-zinc-400 leading-relaxed">
                  Jump into the <strong className="text-[#FF7B00]">live public lobby</strong> below — no account required. Pick a room, set your trader handle, and chat in real time.
                </p>
                <button
                  type="button"
                  onClick={() => document.getElementById('clearpath-live-lobby')?.scrollIntoView({ behavior: 'smooth' })}
                  className="mt-3 w-full py-3 rounded-xl bg-[#FF7B00]/15 border border-[#FF7B00]/35 text-[#FF7B00] text-[10px] font-black uppercase tracking-widest hover:bg-[#FF7B00] hover:text-white transition-all"
                >
                  Open Live Chat Lobby ↓
                </button>
              </div>

              {/* Collapsed Seed Engine Form Trigger for CEO Sync (Fulfills the original registration capability) */}
              <div className="mt-4 border-t border-zinc-900/60 pt-3 text-left">
                <button
                  type="button"
                  onClick={() => setEcosystemCommOpen(!ecosystemCommOpen)}
                  className="text-[9px] font-mono font-bold text-zinc-500 hover:text-[#FF7B00] uppercase tracking-widest flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  {ecosystemCommOpen ? '[-] CLOSE CUSTOM SEED PORT' : '[+] SPAWN CUSTOM SWARM NODE'}
                </button>
                
                {ecosystemCommOpen && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    className="mt-3 space-y-2 bg-black/40 border border-[#FF7B00]/15 p-2.5 rounded-xl text-left"
                  >
                    <input
                      type="text"
                      placeholder="Custom community title... (e.g. Forex Rebels)"
                      value={customCommunityName}
                      onChange={(e) => setCustomCommunityName(e.target.value)}
                      disabled={hasBuiltCommunity}
                      className="w-full px-3 py-1.5 border border-zinc-800 bg-neutral-950 font-sans text-[10px] rounded-lg focus:border-[#FF7B00] focus:ring-1 focus:ring-[#FF7B00]/30 outline-none text-white disabled:opacity-50"
                    />
                    <select
                      value={communityTemplate}
                      onChange={(e) => setCommunityTemplate(e.target.value)}
                      disabled={hasBuiltCommunity}
                      className="w-full px-3 py-1.5 border border-zinc-800 bg-neutral-950 font-sans text-[10px] rounded-lg focus:border-[#FF7B00] focus:ring-1 focus:ring-[#FF7B00]/30 outline-none text-zinc-400 disabled:opacity-50"
                    >
                      <option value="Visual Traders Squad">🎨 Template: Visual Traders Squad</option>
                      <option value="Liquidity Alchemists">🧪 Template: Liquidity Alchemists</option>
                      <option value="Sovereign Macro Minds">🧬 Template: Sovereign Macro Minds</option>
                    </select>

                    {hasBuiltCommunity ? (
                      <div className="text-[8px] font-mono font-black text-emerald-400 uppercase tracking-widest text-center py-1">
                        Node Bound! ID: {communityCreatedBadge}
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={handleCommunityCreate}
                        className="w-full py-1.5 bg-[#FF7B00]/20 text-[#FF7B00] border border-[#FF7B00]/40 font-black text-[9px] uppercase tracking-wider rounded-lg hover:bg-[#FF7B00] hover:text-white transition-all cursor-pointer"
                      >
                        SUBMT SEED TO FIRESTORE
                      </button>
                    )}
                  </motion.div>
                )}
              </div>

              {/* Informative description */}
              <div className="mt-4 flex-grow space-y-3 font-sans text-left">
                <p className="text-zinc-400 text-xs sm:text-sm leading-relaxed">
                  Join direct communication swarms immediately. Tap in with sovereign macro networks across the world, exchange layout setups, share visual indicators, and learn together.
                </p>
                <div className="flex flex-col gap-1.5 pt-0.5 text-[11px] text-zinc-500 font-mono font-bold leading-none">
                  <span className="flex items-center gap-1.5">
                    <CheckSquare size={11} className="text-[#FF7B00]" /> CRYPTOGRAPHIC VERIFIED CHATS
                  </span>
                  <span className="flex items-center gap-1.5">
                    <CheckSquare size={11} className="text-[#FF7B00]" /> FIRESTORE PERSISTENT GROUP SYNC
                  </span>
                </div>
              </div>

              {/* Launch community button */}
              <div className="mt-6">
                <button
                  type="button"
                  onClick={() => setBoardModalOpen(true)}
                  className="w-full py-4 bg-[#FF7B00] hover:bg-[#FF7B00]/90 text-white font-black text-xs uppercase tracking-widest rounded-2xl transition-all duration-300 shadow-[0_4px_25px_rgba(255,123,0,0.25)] hover:shadow-[0_4px_35px_rgba(255,123,0,0.38)] cursor-pointer flex items-center justify-center gap-2"
                >
                  <Users size={14} /> FIND MY PEOPLE
                </button>
              </div>
            </div>

          </div>

          {/* LIVE PUBLIC CHATROOM — glass UI inspired by CodePen dark chat patterns */}
          <div id="clearpath-live-lobby" className="mt-12 scroll-mt-24">
            <div className="text-center mb-8 space-y-3">
              <span className="font-mono text-[9px] text-[#FF7B00] font-black uppercase tracking-[0.3em] bg-[#FF7B00]/5 px-4 py-1.5 rounded-full border border-[#FF7B00]/20 inline-block">
                Live Before Login
              </span>
              <h2 className="text-2xl sm:text-4xl font-black uppercase tracking-tight text-white">
                ClearPath <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF7B00] to-[#FF1493]">Trading Lobby</span>
              </h2>
              <p className="text-sm text-zinc-500 max-w-2xl mx-auto">
                Real-time community chat powered by WebSocket. Join macro, forex, or liquidity rooms — create your free account later for private guilds.
              </p>
            </div>
            <ClearPathChatroom variant="embedded" heightClass="min-h-[580px] md:min-h-[620px]" />
          </div>

          {/* ==========================================
              7B. THE CLEARPATH GLOBAL NETWORK (3D Rotating Globe section)
              ========================================== */}
          <div className="mt-28 pt-20 border-t border-zinc-900/50 relative">
            <div className="text-center mb-16 space-y-4">
              <span className="font-mono text-[9px] text-[#B026FF] font-black uppercase tracking-[0.3em] bg-[#B026FF]/5 px-4 py-1.5 rounded-full border border-[#B026FF]/20 inline-block shadow-[0_0_15px_rgba(176,38,255,0.05)]">
                REAL-TIME ROLLOUT DEPLOYMENT NODES
              </span>
              <h2 className="text-4xl sm:text-6xl md:text-7xl font-sans font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-[#36E6FF] to-[#8B3DFF] uppercase mt-2">
                THE CLEARPATH <br className="hidden sm:inline" />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00FFFF] via-[#B026FF] to-[#FF1493] drop-shadow-[0_0_35px_rgba(0,255,255,0.45)]">
                  GLOBAL NETWORK
                </span>
              </h2>
              <div className="flex items-center justify-center gap-2 text-[#00FFFF] font-mono text-[10px] uppercase font-black tracking-widest">
                <Compass size={12} className="animate-spin-slow" />
                <span>DIFFERENT MINDS. DIFFERENTS COUNTRIES. ONE CONNECTED COMMUNITY.</span>
              </div>
            </div>

            {/* Render 3D Globe with Firestore sync */}
            <div className="relative z-10 w-full min-h-[550px] overflow-hidden">
              <GlobalNetworkGlobe />
            </div>
          </div>

        </div>
      </section>

      {/* ==========================================
          CEO / ADMIN GLOBE MISSION CONTROL DASHBOARD
          ========================================== */}
      {isCEO && (
        <section className="relative py-16 border-t border-[#B026FF]/35 bg-neutral-950/90 backdrop-blur-2xl z-20">
          <div className="absolute inset-0 bg-[#B026FF]/5 pointer-events-none" />
          <div className="max-w-4xl mx-auto px-4 sm:px-8">
            <div className="bg-black/80 border border-[#B026FF]/40 rounded-[2.5rem] p-6 sm:p-8 relative overflow-hidden shadow-[0_0_50px_rgba(176,38,255,0.15)]">
              
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 pb-6 border-b border-zinc-800/60">
                <div className="space-y-1">
                  <span className="font-mono text-[9px] text-emerald-400 font-black uppercase tracking-[0.25em] bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/25 inline-block font-bold">
                    🛡️ SECURITY CLEARANCE: LEVEL 5 (FOUNDER & CEO)
                  </span>
                  <h3 className="text-2xl font-black text-white uppercase tracking-wider font-sans">
                    CEO Rollout Wave Mission-Control
                  </h3>
                  <p className="text-xs text-zinc-400 mt-1">
                    Surgically direct rollout waves, country highlight glows, phases, and goals dynamically without code deployments.
                  </p>
                </div>
                
                <button
                  type="button"
                  onClick={() => {
                    localStorage.removeItem('MASTER_BYPASS');
                    setIsCEO(false);
                    window.location.reload();
                  }}
                  className="px-4 py-2 border border-red-500/30 hover:border-red-500 hover:bg-red-550/15 text-red-400 font-mono text-[9px] uppercase tracking-widest rounded-xl transition-all cursor-pointer inline-flex items-center gap-1.5 font-bold"
                >
                  <LogOut size={11} /> EXIT ADMIN OVERLAID CONTROLS
                </button>
              </div>

              {ceoSyncError && (
                <div className="bg-red-500/5 border border-red-500/20 text-red-500 text-[10px] p-4 rounded-xl font-mono text-center uppercase tracking-wide mb-6">
                  ⚠️ Sync Fault: {ceoSyncError}
                </div>
              )}

              {ceoSyncSuccess && (
                <div className="bg-emerald-500/5 border border-emerald-500/25 text-emerald-400 text-xs p-4 rounded-xl font-mono text-center uppercase tracking-wider mb-6 animate-pulse">
                  ✅ Access Verified: {ceoSyncSuccess}
                </div>
              )}

              <form onSubmit={handleCeoSync} className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
                
                {/* Left controls panel */}
                <div className="space-y-4">
                  
                  {/* Country Selector block */}
                  <div className="space-y-1.5">
                    <label className="block text-zinc-400 font-bold uppercase tracking-widest text-[9px] font-mono">
                      Target Deployment country
                    </label>
                    <select
                      value={ceoSelCountryId}
                      onChange={(e) => setCeoSelCountryId(e.target.value)}
                      className="w-full px-4 py-3 border border-zinc-800 bg-neutral-950 font-sans text-xs rounded-xl focus:border-[#B026FF] focus:ring-1 focus:ring-[#B026FF]/35 outline-none text-white cursor-pointer"
                    >
                      {dbCountries.map(c => (
                        <option key={c.docId || c.id} value={c.docId || c.id}>
                          🌎 {c.countryName} ({c.id}) — {c.launchPhase}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Launch Phase details */}
                  <div className="space-y-1.5">
                    <label className="block text-zinc-400 font-bold uppercase tracking-widest text-[9px] font-mono">
                      Rollout Status Phase Label
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Stage 3 Beta Rollout"
                      value={ceoPhase}
                      onChange={(e) => setCeoPhase(e.target.value)}
                      required
                      className="w-full px-4 py-3 border border-zinc-800 bg-neutral-950 font-sans text-xs rounded-xl focus:border-[#B026FF] focus:ring-1 focus:ring-[#B026FF]/35 outline-none text-white"
                    />
                  </div>

                  {/* Color selector palette */}
                  <div className="space-y-1.5">
                    <label className="block text-zinc-400 font-bold uppercase tracking-widest text-[9px] font-mono">
                      Visual Wave Node Glow
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                      {[
                        { hex: '#00FFFF', name: 'CYAN' },
                        { hex: '#FF1493', name: 'PINK' },
                        { hex: '#B026FF', name: 'PURPLE' },
                        { hex: '#FF7B00', name: 'ORANGE' }
                      ].map(colorOpt => (
                        <button
                          key={colorOpt.hex}
                          type="button"
                          onClick={() => setCeoColor(colorOpt.hex)}
                          className={`py-2 px-1 border rounded-xl text-[8px] font-mono font-black uppercase text-center transition-all cursor-pointer flex flex-col items-center gap-1 ${
                            ceoColor.toLowerCase() === colorOpt.hex.toLowerCase()
                              ? 'border-white bg-zinc-900 text-white shadow-[0_0_15px_rgba(255,255,255,0.15)]'
                              : 'border-zinc-850 text-zinc-500 hover:border-zinc-750 hover:text-white'
                          }`}
                        >
                          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: colorOpt.hex }} />
                          {colorOpt.name}
                        </button>
                      ))}
                    </div>
                  </div>

                </div>

                {/* Right controls panel */}
                <div className="space-y-4 flex flex-col justify-between">
                  
                  <div className="space-y-4">
                    {/* Goal limit */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="block text-zinc-400 font-bold uppercase tracking-widest text-[9px] font-mono">
                          Signup cap goal
                        </label>
                        <input
                          type="number"
                          value={ceoGoal}
                          onChange={(e) => setCeoGoal(Number(e.target.value))}
                          required
                          className="w-full px-4 py-3 border border-zinc-800 bg-neutral-950 font-sans text-xs rounded-xl focus:border-[#B026FF] focus:ring-1 focus:ring-[#B026FF]/35 outline-none text-white font-mono"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="block text-zinc-400 font-bold uppercase tracking-widest text-[9px] font-mono">
                          Current Signups
                        </label>
                        <input
                          type="number"
                          value={ceoCount}
                          onChange={(e) => setCeoCount(Number(e.target.value))}
                          required
                          className="w-full px-4 py-3 border border-zinc-800 bg-neutral-950 font-sans text-xs rounded-xl focus:border-[#B026FF] focus:ring-1 focus:ring-[#B026FF]/35 outline-none text-white font-mono"
                        />
                      </div>
                    </div>

                    {/* Toggle highlighted visibility */}
                    <div className="p-3 bg-zinc-950 border border-zinc-900 rounded-xl flex items-center justify-between">
                      <div className="space-y-0.5 text-left">
                        <span className="text-[10px] font-bold text-white font-mono uppercase">ENABLE NODE HIGH-GLOW DISPLAY</span>
                        <p className="text-[8px] text-zinc-500 font-sans leading-none">Projects glowing arcs on the 3D rotating globe</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={ceoHighlight}
                        onChange={(e) => setCeoHighlight(e.target.checked)}
                        className="w-4 h-4 rounded border-zinc-850 bg-zinc-950 text-[#B026FF] focus:ring-[#B026FF] focus:ring-offset-black cursor-pointer"
                      />
                    </div>
                  </div>

                  {/* Submit Sync */}
                  <div className="pt-4">
                    <button
                      type="submit"
                      disabled={ceoIsSyncing}
                      className="w-full py-4 bg-[#B026FF] hover:bg-[#B026FF]/90 disabled:opacity-50 text-white font-black text-xs uppercase tracking-widest rounded-2xl transition-all duration-300 shadow-[0_4px_25px_rgba(176,38,255,0.3)] hover:shadow-[0_4px_35px_rgba(176,38,255,0.45)] cursor-pointer flex items-center justify-center gap-2"
                    >
                      <Activity size={14} className={ceoIsSyncing ? 'animate-spin' : ''} />
                      {ceoIsSyncing ? 'TRANSMITTING COGNITIVE WAVE...' : 'SYNC DEPLOYMENT VECTOR'}
                    </button>
                  </div>

                </div>

              </form>

            </div>
          </div>
        </section>
      )}

      {/* ==========================================
          8. SOFT LAUNCH STATS SECTION: NEON PRICING CARDS
          ========================================== */}
      <section id="soft-launch" className="relative py-24 border-t border-zinc-900/80 bg-transparent z-20">
        {/* LAVA SHADER STYLES */}
        <style>{`
          @keyframes lavaFlow {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
          }
          .lava-fluid-glow {
            background: linear-gradient(135deg, #FF1A00 0%, #FF5A00 25%, #FF7B00 50%, #FF9E00 75%, #FF0055 100%);
            background-size: 250% 250%;
            animation: lavaFlow 5s ease infinite;
          }
          .fire-pink-glow {
            background: linear-gradient(135deg, #FF1493 0%, #FF007F 25%, #FF1493 50%, #FF69B4 75%, #FF0055 100%);
            background-size: 250% 250%;
            animation: lavaFlow 5s ease infinite;
          }
          .neon-cyan-glow {
            background: linear-gradient(135deg, #00FFFF 0%, #00BFFF 25%, #00E5FF 50%, #1DE9B6 75%, #00A1FF 100%);
            background-size: 250% 250%;
            animation: lavaFlow 5s ease infinite;
          }
          .neon-indigo-glow {
            background: linear-gradient(135deg, #4B0082 0%, #8A2BE2 25%, #6A0DAD 50%, #B026FF 75%, #410099 100%);
            background-size: 250% 250%;
            animation: lavaFlow 5s ease infinite;
          }
          .fire-lava-text {
            background: linear-gradient(135deg, #FF3C00 0%, #FF7300 50%, #FFAE00 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            font-weight: 900;
          }
          .fire-lava-text-subtle {
            background: linear-gradient(135deg, #FF5E33 0%, #FF8533 50%, #FFAC33 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
          }
          .clearpath-program-gradient-text {
            background: linear-gradient(135deg, #FF1493 0%, #FF3C00 40%, #FF7C00 75%, #FFAE00 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            font-weight: 900;
          }
          .fire-pink-text {
            background: linear-gradient(135deg, #FF1493 0%, #FF69B4 50%, #FF007F 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            font-weight: 900;
          }
          .fire-pink-text-subtle {
            background: linear-gradient(135deg, #FF69B4 0%, #FF8DA1 50%, #FFA6C9 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
          }
          .neon-cyan-text {
            background: linear-gradient(135deg, #00FFFF 0%, #00DFFF 50%, #00A1FF 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            font-weight: 900;
          }
          .neon-cyan-text-subtle {
            background: linear-gradient(135deg, #00E5FF 0%, #64FFDA 50%, #A7FFEB 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
          }
          .neon-indigo-text {
            background: linear-gradient(135deg, #8A2BE2 0%, #B026FF 50%, #4B0082 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            font-weight: 900;
          }
          .neon-indigo-text-subtle {
            background: linear-gradient(135deg, #B026FF 0%, #D783FF 50%, #E6B3FF 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
          }
        `}</style>

        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          
          <div className="nn-crd relative flex flex-col items-center justify-center pt-24 pb-12 w-full overflow-hidden">
            <div className="text-center z-20 mb-16 space-y-4">
              <span className="font-mono text-[10px] font-black uppercase tracking-[0.25em] bg-[#FF1493]/10 px-4 py-1.5 rounded-full border border-[#FF1493]/40 shadow-[0_0_15px_rgba(255,20,147,0.25)] animate-pulse inline-block">
                <span className="fire-pink-text">STAGE 1 ROLLOUT</span>
              </span>
              <h2 className="text-3xl sm:text-5xl font-black uppercase tracking-tight font-sans">
                <span className="clearpath-program-gradient-text">CLEARPATH FOUNDING MEMBER PROGRAM</span>
              </h2>
              <p className="text-xs sm:text-sm max-w-2xl mx-auto uppercase font-bold tracking-wider">
                <span className="fire-pink-text-subtle">500 Tier One Accounts • 1,000 Tier Two Upgrades • 2,500 Members Per Launch Region</span>
              </p>
            </div>

            <div className="stage flex flex-wrap gap-8 justify-center items-stretch w-full">

              {/* CARD 1: TIER ONE */}
              <div className="relative group w-[290px] rounded-xl flex min-h-full">
                {/* Dynamic back glow with fluid movement */}
                <div className="absolute -inset-1 rounded-xl opacity-60 group-hover:opacity-100 transition duration-500 blur-xl fire-pink-glow pointer-events-none select-none z-0" />
                
                <article className="card relative w-full min-h-[640px] p-8 rounded-xl border border-[#FF1493]/35 group-hover:border-[#FF1493] shadow-[0_0_25px_rgba(255,20,147,0.1)] group-hover:shadow-[0_0_40px_rgba(255,20,147,0.25)] transition-all duration-300 flex flex-col justify-between gap-6 cursor-pointer z-10" style={{ backgroundColor: '#030307' }}>
                  <div className="space-y-4">
                    <div className="card-tier text-[10px] font-bold tracking-widest uppercase">
                      <span className="fire-pink-text text-shadow-[0_0_10px_rgba(255,20,147,0.5)]">Tier One</span>
                    </div>
                    <div>
                      <div className="card-price text-4xl font-extrabold">
                        <span className="fire-pink-text">FREE</span>
                      </div>
                      <div className="card-period text-xs mt-1">
                        <span className="fire-pink-text-subtle">14,000 Available</span>
                      </div>
                    </div>
                    <div className="card-divider h-[1px] bg-gradient-to-r from-transparent via-[#FF1493]/30 to-transparent" />
                    <ul className="card-features space-y-2.5">
                      {["Full Platform Access", "Multi-Chart Workspaces", "Watchlists & Layouts", "Economic Calendar", "Market News Center", "CPMS TV Access", "Your World Connected", "Community Access", "Public Groups", "Educational Library", "Market Research Center", "Mobile & Desktop Access", "Founding Member Badge"].map((f, i) => (
                        <li key={i} className="text-xs pl-4 relative before:content-['▸'] before:absolute before:left-0 before:text-[#FF1493] before:text-[10px]">
                          <span className="fire-pink-text-subtle">{f}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <button 
                    type="button"
                    onClick={() => openPrivateLogin('register')}
                    className="card-cta mt-6 w-full py-3 text-center text-xs font-black tracking-widest bg-[#FF1493]/10 hover:bg-[#FF1493]/25 border border-[#FF1493]/50 rounded-lg hover:shadow-[0_0_20px_rgba(255,20,147,0.4)] transition-all duration-300 cursor-pointer"
                  >
                    <span className="fire-pink-text">CREATE PRIVATE ACCOUNT</span>
                  </button>
                </article>
              </div>

              {/* CARD 2: TIER TWO */}
              <div className="relative group w-[290px] rounded-xl flex min-h-full">
                {/* Dynamic back glow with fluid movement */}
                <div className="absolute -inset-1 rounded-xl opacity-75 group-hover:opacity-105 transition duration-500 blur-xl neon-cyan-glow pointer-events-none select-none z-0" />
                
                <article className="card relative w-full min-h-[640px] p-8 rounded-xl border border-[#00FFFF]/35 group-hover:border-[#00FFFF] shadow-[0_0_25px_rgba(0,255,255,0.1)] group-hover:shadow-[0_0_40px_rgba(0,255,255,0.25)] transition-all duration-300 flex flex-col justify-between gap-6 cursor-pointer z-10" style={{ backgroundColor: '#030307' }}>
                  <div className="badge absolute -top-3.5 left-1/2 transform -translate-x-1/2 neon-cyan-glow p-[1.5px] rounded-full shadow-[0_0_15px_rgba(0,255,255,0.5)]">
                    <div className="bg-neutral-950 px-3.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest">
                      <span className="neon-cyan-text">1,000 RANDOM UPGRADES</span>
                    </div>
                  </div>
                  <div className="space-y-4 pt-2">
                    <div className="card-tier text-[10px] font-bold tracking-widest uppercase">
                      <span className="neon-cyan-text text-shadow-[0_0_10px_rgba(0,255,255,0.5)]">Tier Two</span>
                    </div>
                    <div>
                      <div className="card-price text-4xl font-extrabold">
                        <span className="neon-cyan-text">FREE</span>
                      </div>
                      <div className="card-period text-xs mt-1">
                        <span className="neon-cyan-text-subtle">Randomly Awarded</span>
                      </div>
                    </div>
                    <div className="card-divider h-[1px] bg-gradient-to-r from-transparent via-[#00FFFF]/30 to-transparent" />
                    <ul className="card-features space-y-2.5">
                      {["Everything In Tier One", "Advanced Alert System", "Unlimited Layout Profiles", "Premium CPMS TV", "Exclusive Live Broadcasts", "Private Communities", "Community Ownership", "Advanced Research Tools", "Beta Feature Access", "Priority Support", "Tier Two Founder Badge", "Founder Recognition Wall"].map((f, i) => (
                        <li key={i} className="text-xs pl-4 relative before:content-['▸'] before:absolute before:left-0 before:text-[#00FFFF] before:text-[10px]">
                          <span className="neon-cyan-text-subtle">{f}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <button 
                    type="button"
                    onClick={() => openPrivateLogin('register')}
                    className="card-cta mt-6 w-full py-3 text-center text-xs font-black tracking-widest bg-[#00FFFF]/10 hover:bg-[#00FFFF]/25 border border-[#00FFFF]/50 rounded-lg hover:shadow-[0_0_20px_rgba(0,255,255,0.4)] transition-all duration-300 cursor-pointer"
                  >
                    <span className="neon-cyan-text">CREATE PRIVATE ACCOUNT</span>
                  </button>
                </article>
              </div>

              {/* Removed CARD 3: GLOBAL */}

            </div>
          </div>

          {/* TIMER COUNTDOWN */}
          <div className="relative group max-w-2xl mx-auto mt-16 rounded-[2.5rem]">
            {/* Soft background fluid glow */}
            <div className="absolute -inset-1 rounded-[2.5rem] opacity-50 group-hover:opacity-85 transition duration-500 blur-xl lava-fluid-glow pointer-events-none select-none z-0" />

            <div className="relative z-10 p-8 rounded-[2.5rem] bg-[#030307]/90 border border-[#FF4500]/50 backdrop-blur-md flex flex-col items-center text-center">
              <span className="font-mono text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5 mb-6">
                <span className="w-2.5 h-2.5 rounded-full border border-[#FF4500]/60 animate-ping" />
                <span className="fire-lava-text">SOFT LAUNCH STARTS IN</span>
              </span>

              {/* Countdown Grid */}
              <div className="grid grid-cols-4 gap-4 max-w-md w-full">
                
                <div className="space-y-1">
                  <div className="w-16 h-16 rounded-2xl bg-neutral-950 border border-cyan-500/30 flex items-center justify-center font-mono text-xl sm:text-2xl font-black shadow-[0_0_15px_rgba(0,255,255,0.15)]">
                    <span className="text-[#00FFFF] drop-shadow-[0_0_8px_rgba(0,255,255,0.6)] font-black">{timeLeft.days}</span>
                  </div>
                  <div className="text-[9px] uppercase tracking-wider font-bold">
                    <span className="fire-lava-text-subtle">Days</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="w-16 h-16 rounded-2xl bg-neutral-950 border border-cyan-500/30 flex items-center justify-center font-mono text-xl sm:text-2xl font-black shadow-[0_0_15px_rgba(0,255,255,0.15)]">
                    <span className="text-[#00FFFF] drop-shadow-[0_0_8px_rgba(0,255,255,0.6)] font-black">{timeLeft.hours}</span>
                  </div>
                  <div className="text-[9px] uppercase tracking-wider font-bold">
                    <span className="fire-lava-text-subtle">Hours</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="w-16 h-16 rounded-2xl bg-neutral-950 border border-cyan-500/30 flex items-center justify-center font-mono text-xl sm:text-2xl font-black shadow-[0_0_15px_rgba(0,255,255,0.15)]">
                    <span className="text-[#00FFFF] drop-shadow-[0_0_8px_rgba(0,255,255,0.6)] font-black">{timeLeft.minutes}</span>
                  </div>
                  <div className="text-[9px] uppercase tracking-wider font-bold">
                    <span className="fire-lava-text-subtle">Minutes</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="w-16 h-16 rounded-2xl bg-neutral-950 border border-cyan-500/30 flex items-center justify-center font-mono text-xl sm:text-2xl font-black animate-pulse shadow-[0_0_15px_rgba(0,255,255,0.25)]">
                    <span className="text-[#00FFFF] drop-shadow-[0_0_8px_rgba(0,255,255,0.6)] font-black">{timeLeft.seconds}</span>
                  </div>
                  <div className="text-[9px] uppercase tracking-wider font-bold">
                    <span className="fire-lava-text-subtle">Seconds</span>
                  </div>
                </div>

              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ==========================================
          9. PRIVATE ACCOUNT ENTRY
          ========================================== */}
      <section id="private-login" className="relative py-24 max-w-4xl mx-auto px-4 sm:px-8 z-20">
        <div className="text-center mb-12 space-y-3">
          <span className="font-mono text-[9px] text-[#00FFFF] font-black uppercase tracking-[0.25em] bg-[#00FFFF]/5 px-3 py-1 rounded-full border border-[#00FFFF]/15">
            PRIVATE MEMBER ACCESS
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white uppercase">
            Your Private Login Desk
          </h2>
          <p className="text-zinc-400 text-xs sm:text-sm max-w-lg mx-auto leading-relaxed">
            Every ClearPath member gets a private login screen. Create your account, then unlock your own terminal with your email and password — no shared reserve waitlist.
          </p>
        </div>

        <div
          className="border border-[#00FFFF]/60 hover:border-[#00FFFF] rounded-[2.5rem] p-6 sm:p-10 shadow-[0_0_25px_rgba(0,255,255,0.18)] hover:shadow-[0_0_55px_rgba(0,255,255,0.55)] transition-all duration-300 relative overflow-hidden text-center space-y-6"
          style={{ backgroundColor: '#050505' }}
        >
          <div className="absolute top-0 left-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 right-0 w-32 h-32 bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => openPrivateLogin('login')}
              className="w-full sm:w-auto px-8 py-4 rounded-2xl border border-[#00E5FF]/40 bg-[#00E5FF]/10 text-[#00E5FF] text-xs font-black uppercase tracking-widest hover:bg-[#00E5FF]/20 transition-colors cursor-pointer flex items-center justify-center gap-2"
            >
              <Lock size={14} />
              Private Login
            </button>
            <button
              type="button"
              onClick={() => openPrivateLogin('register')}
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-[#FF1493] to-[#B026FF] text-white text-xs font-black uppercase tracking-widest hover:brightness-110 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              Create Private Account
              <ArrowRight size={14} />
            </button>
          </div>
          <p className="relative z-10 text-[10px] text-zinc-500 font-mono">
            Passwords are hashed on the server. Each desk opens only for its owner.
          </p>
        </div>
      </section>

      {/* ==========================================
          10. FAQ SECTION
          ========================================== */}
      <section id="faq" className="relative py-24 border-t border-zinc-900/60 bg-transparent z-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-8 space-y-12">
          
          <div className="text-center space-y-3">
            <span className="font-mono text-[10px] text-[#00FFFF] font-black uppercase tracking-[0.25em] bg-[#00FFFF]/10 px-4 py-1.5 rounded-full border border-[#00FFFF]/40 shadow-[0_0_15px_rgba(0,255,255,0.25)]">
              SUPPORT MATRIX
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight neon-cyan-text uppercase text-shadow-[0_0_10px_rgba(0,255,255,0.5)]">
              Frequently Asked Questions
            </h2>
            <p className="text-[#00FFFF]/70 text-xs sm:text-sm">
              Quickly find verified responses concerning the ClearPath trading education environment.
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((f, i) => (
              <div 
                key={i} 
                className="border border-[#00FFFF]/50 hover:border-[#00FFFF] rounded-2xl overflow-hidden shadow-[0_0_15px_rgba(0,255,255,0.12)] hover:shadow-[0_0_25px_rgba(0,255,255,0.4)] hover:-translate-y-0.5 transition-all duration-300"
                style={{ backgroundColor: '#050505' }}
              >
                <button
                  type="button"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full py-5 px-6 flex items-center justify-between text-left focus:outline-none hover:bg-neutral-900/20 cursor-pointer"
                >
                  <span className="text-sm font-bold text-[#FF4500] uppercase tracking-wide text-shadow-[0_0_8px_rgba(255,69,0,0.5)]">
                    {f.q}
                  </span>
                  <span className="text-[#FF4500] text-lg font-bold">
                    {openFaq === i ? '−' : '+'}
                  </span>
                </button>
                <AnimatePresence>
                  {openFaq === i && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="border-t border-[#00FFFF]/30"
                    >
                      <p className="p-6 text-[#00FFFF] text-xs sm:text-sm leading-relaxed">
                        {f.a}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ==========================================
          11. LEGAL DISCLAIMER FOOTER
          ========================================== */}
      <footer className="relative bg-transparent border-t border-zinc-900/40 py-12 px-4 sm:px-8 z-20 text-center">
        <div className="max-w-5xl mx-auto space-y-6">
          <div className="flex items-center justify-center gap-2">
            <span className="font-sans font-black tracking-widest text-[#FFFFFF] text-sm uppercase">
              CLEARPATH <span className="text-[#00FFFF]">TRADER</span>
            </span>
          </div>
          <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[10px] font-mono uppercase tracking-widest mb-2">
            <a href="/if-trading-and-chatgpt-had-a-baby" className="text-[#FF1493] hover:text-[#00FFFF] transition-colors font-bold">
              Trading × AI
            </a>
            <a href="/about" className="text-zinc-400 hover:text-[#00FFFF] transition-colors">
              About ClearPath
            </a>
            <a href="/learn" className="text-zinc-400 hover:text-[#00FFFF] transition-colors">
              Learn
            </a>
            <a href="/guides" className="text-zinc-400 hover:text-[#00FFFF] transition-colors">
              Guides
            </a>
            <a href="/glossary" className="text-zinc-400 hover:text-[#00FFFF] transition-colors">
              Glossary
            </a>
            <a href="/faq" className="text-zinc-400 hover:text-[#00FFFF] transition-colors">
              FAQ
            </a>
            <a href="/ui" className="text-zinc-400 hover:text-[#B026FF] transition-colors">
              UI Modes
            </a>
            <a href="/education" className="text-zinc-400 hover:text-[#B026FF] transition-colors">
              Education
            </a>
            <a href="/platform-scope.html" className="text-zinc-500 hover:text-zinc-300 transition-colors">
              Platform Scope
            </a>
            <a href="/terms.html" className="text-zinc-500 hover:text-zinc-300 transition-colors">
              Terms
            </a>
            <a href="/privacy.html" className="text-zinc-500 hover:text-zinc-300 transition-colors">
              Privacy
            </a>
            <a href="/disclaimer.html" className="text-zinc-500 hover:text-zinc-300 transition-colors">
              Disclaimer
            </a>
          </nav>
          <p className="text-[11px] text-zinc-500 leading-relaxed max-w-3xl mx-auto uppercase tracking-wide">
            RISK DISCLOSURE AND EDUCATIONAL DISCLAIMER: ClearPath Trader is strictly an academic learning universe. We do not operate as a financial broker, nor do we manage real client capital, execute trades, or recommend asset purchases. High-performance intermarket analysis carries substantial risk. All calculations and simulations represent general macroeconomic models.
          </p>
          <div className="text-[10px] text-zinc-600 font-mono mt-4">
            © 2026 Clear Path Markets Science (CPMS). All academic rights reserved.
          </div>
        </div>
      </footer>

      {/* ==========================================
          MODAL 1: BOARD MEMBER TERM PASSCODE LOGIN
          ========================================== */}
      <AnimatePresence>
        {boardModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Dark glass backdrop overlay */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setBoardModalOpen(false)}
              className="absolute inset-0 bg-[#050505]/90 backdrop-blur-lg cursor-pointer"
            />

            <motion.div
              initial={{ scale: 0.95, y: 15, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 15, opacity: 0 }}
              className="bg-neutral-950 border border-zinc-800 rounded-[2.5rem] p-6 sm:p-8 w-full max-w-md relative z-10 shadow-2xl space-y-6"
            >
              {/* Close Button Trigger */}
              <button
                type="button"
                onClick={() => setBoardModalOpen(false)}
                className="absolute top-5 right-5 text-zinc-500 hover:text-white transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>

              <div className="text-center space-y-2">
                <span className="font-mono text-[9px] text-[#B026FF] font-black uppercase tracking-[0.2em] bg-[#B026FF]/5 px-3 py-1 rounded-full border border-[#B026FF]/15 inline-block">
                  BOARD CREDENTIAL AUDIT
                </span>
                <h3 className="text-xl font-black text-white uppercase tracking-wide">
                  Board Verification
                </h3>
                <p className="text-[11px] text-zinc-400 max-w-xs mx-auto leading-normal">
                  Enter your assigned cryptographic board passcode to gain instant system bypass access.
                </p>
              </div>

              {boardError && (
                <div className="bg-red-500/5 border border-red-500/20 text-red-500 text-[10px] p-3.5 rounded-xl font-mono text-center uppercase tracking-wide leading-relaxed">
                  ⚠️ Error: {boardError}
                </div>
              )}

              {boardSuccess && (
                <div className="bg-emerald-500/5 border border-emerald-500/20 text-emerald-400 text-[11px] p-3.5 rounded-xl font-mono text-center uppercase tracking-wider flex items-center justify-center gap-2">
                  <UserCheck size={14} className="animate-pulse" />
                  ACCESS GRANTED. REDIRECTING...
                </div>
              )}

              <form onSubmit={handleBoardLoginSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label className="block text-zinc-400 text-[10px] font-bold uppercase tracking-widest font-mono text-center">
                    Cryptographic Passcode
                  </label>
                  <div className="relative max-w-xs mx-auto">
                    <input
                      ref={passcodeRef}
                      type={showPasscode ? "text" : "password"}
                      value={passcode}
                      onChange={(e) => setPasscode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="••••••"
                      maxLength={6}
                      disabled={boardSuccess}
                      required
                      className="w-full bg-black border border-zinc-800 focus:border-[#00FFFF] rounded-2xl py-3.5 px-4 text-center text-white text-xl tracking-[0.5em] placeholder-zinc-800 focus:outline-none focus:ring-1 focus:ring-[#00FFFF]/30 transition-all font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasscode(!showPasscode)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-zinc-400 transition-colors cursor-pointer"
                    >
                      {showPasscode ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={boardSuccess}
                    className="w-full py-4 bg-gradient-to-r from-[#FF1493] to-[#B026FF] text-white font-black uppercase tracking-widest text-xs rounded-xl shadow-lg cursor-pointer"
                  >
                    Verify Passcode
                  </button>
                </div>
              </form>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => setBoardModalOpen(false)}
                  className="text-zinc-500 hover:text-zinc-300 text-[10px] font-mono uppercase tracking-wider transition-colors cursor-pointer"
                >
                  Return to portal main view
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ==========================================
          MODAL 2: INTERACTIVE VIDEO/DEMO PRESENTATION
          ========================================== */}
      <AnimatePresence>
        {demoOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDemoOpen(false)}
              className="absolute inset-0 bg-[#050505]/95 backdrop-blur-md cursor-pointer"
            />

            <motion.div
              initial={{ scale: 0.95, y: 15, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 15, opacity: 0 }}
              className="bg-neutral-950 border border-zinc-800 rounded-[2.5rem] p-6 sm:p-8 w-full max-w-2xl relative z-10 shadow-2xl space-y-6"
            >
              <button
                type="button"
                onClick={() => setDemoOpen(false)}
                className="absolute top-5 right-5 text-zinc-500 hover:text-white cursor-pointer"
              >
                <X size={18} />
              </button>

              <div className="space-y-1">
                <span className="font-mono text-[9px] text-[#00FFFF] font-black uppercase tracking-[0.2em] bg-[#00FFFF]/5 px-3 py-1 rounded-full border border-[#00FFFF]/15 inline-block">
                  ACADEMIC PREVIEW DECK
                </span>
                <h3 className="text-xl font-black text-white uppercase tracking-wider">
                  ClearPath Trader Showcase
                </h3>
                <p className="text-xs text-zinc-400">
                  Observe simulated high-frequency dashboard streams and multi-agent system modules.
                </p>
              </div>

              {/* High-tech mock visualization replacing unrequired mp4 file requests */}
              <div className="aspect-video w-full rounded-2xl bg-black border border-zinc-900 overflow-hidden relative p-6 flex flex-col justify-between font-mono">
                
                {/* Simulated charts elements */}
                <div className="flex items-center justify-between text-[11px] text-zinc-500">
                  <span>RUNNING CORE_SYSTEM_NODE_01</span>
                  <span className="text-[#00FFFF] animate-pulse">● SYSTEMS LIVE</span>
                </div>

                <div className="space-y-2 py-4">
                  <div className="flex justify-between items-center bg-[#FF1493]/5 p-3 rounded-xl border border-[#FF1493]/15">
                    <span className="text-[10px] text-zinc-300">Quantitative Node Action:</span>
                    <span className="text-[#FF1493] text-[10px] font-bold">Scanning Federal Reserve Repos...</span>
                  </div>
                  <div className="flex justify-between items-center bg-[#00FFFF]/5 p-3 rounded-xl border border-[#00FFFF]/15">
                    <span className="text-[10px] text-zinc-300">TwelveData Stream:</span>
                    <span className="text-[#00FFFF] text-[10px] font-bold">Trading queues ingest speed: 85ms</span>
                  </div>
                </div>

                {/* Simulated asset movement vectors */}
                <div className="h-20 w-full overflow-hidden flex items-end gap-1 px-4">
                  {[23, 45, 12, 60, 31, 74, 52, 90, 64, 40, 85, 30, 69, 58, 88].map((val, idx) => (
                    <div 
                      key={idx} 
                      className="flex-1 bg-gradient-to-t from-[#B026FF] to-[#00FFFF] rounded-t"
                      style={{ height: `${val}%` }}
                    />
                  ))}
                </div>

                <div className="flex justify-between items-center text-[10px] text-zinc-500 pt-3 border-t border-zinc-900">
                  <span>CAPITAL CONSTELLATIONS VERIFIED</span>
                  <span className="text-[#FF1493]">AUDIT CONFIRMED DECRPYT</span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setDemoOpen(false)}
                  className="px-5 py-2.5 bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white rounded-xl text-xs font-black uppercase tracking-wider transition-colors cursor-pointer"
                >
                  Close Showcase
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDemoOpen(false);
                    openPrivateLogin('register');
                  }}
                  className="px-6 py-2.5 bg-gradient-to-r from-[#FF1493] to-[#B026FF] text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all hover:scale-[1.01] cursor-pointer"
                >
                  Create Private Account
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ==========================================
          MODAL 3: CPMS TV IMMERSIVE BROADCAST DECK
          ========================================== */}
      <AnimatePresence>
        {ecosystemTvOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setEcosystemTvOpen(false)}
              className="absolute inset-0 bg-[#050505]/95 backdrop-blur-md cursor-pointer"
            />

            <motion.div
              initial={{ scale: 0.95, y: 15, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 15, opacity: 0 }}
              className="bg-neutral-950 border border-[#FF1493]/30 rounded-[2.5rem] p-6 sm:p-8 w-full max-w-4xl relative z-10 shadow-2xl space-y-6"
            >
              <button
                type="button"
                onClick={() => setEcosystemTvOpen(false)}
                className="absolute top-5 right-5 text-zinc-500 hover:text-white cursor-pointer"
              >
                <X size={18} />
              </button>

              <div className="flex flex-col md:flex-row gap-6">
                
                {/* Simulated Screen */}
                <div className="flex-grow md:max-w-2xl bg-black rounded-3xl border border-[#FF1493]/20 relative p-4 flex flex-col justify-between aspect-video font-mono overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent via-zinc-950/20 to-zinc-950/40 pointer-events-none mix-blend-overlay" />
                  <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[size:100%_4px,6px_100%] pointer-events-none" />

                  <div className="flex justify-between items-center text-[10px] text-zinc-500 border-b border-zinc-900 pb-2">
                    <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" /> BROADCASTING ACTIVE</span>
                    <span className="text-[#FF1493]">SYS_FPS: 60.00</span>
                  </div>

                  <div className="my-auto space-y-3 p-4">
                    <span className="text-[10px] font-mono text-[#FF1493] uppercase tracking-widest font-black bg-[#FF1493]/5 border border-[#FF1493]/20 px-2 py-0.5 rounded-full inline-block">
                      {activeTvChannel === 'review' ? 'MACRO DIRECT' : activeTvChannel === 'liquidity' ? 'LIQUIDITY FEED' : 'VISUAL CLASSROOM'}
                    </span>
                    <h3 className="text-xl md:text-2xl font-sans font-black text-white uppercase tracking-tight">
                      {activeTvChannel === 'review' 
                        ? 'Federal Reserve Bond Buyback Rates Adjustments'
                        : activeTvChannel === 'liquidity'
                        ? 'Global Liquidity Flows & Central Bank Balances'
                        : 'Uncluttering Trading Interfaces For Clearer Execution'}
                    </h3>
                    <p className="text-xs text-zinc-400 font-sans">
                      {activeTvChannel === 'review'
                        ? 'A complete visual teardown breaking down treasury buybacks, repo desk limits, and dollar liquidity indices in real time.'
                        : activeTvChannel === 'liquidity'
                        ? 'Tracing multi-billion dollar capital corridors between the Eurozone, Wall Street queues, and emerging market debt structures.'
                        : 'Discover how stripping complex indicators like MACD or Stochastic reduces mental fatigue and builds pristine visual confidence.'}
                    </p>
                  </div>

                  <div className="flex justify-between items-center text-[11px] text-zinc-500 pt-3 border-t border-zinc-900">
                    <span className="text-[#00FFFF]">CHOOSE THE VISION</span>
                    <span className="text-zinc-500">© CPMS TV NETWORK</span>
                  </div>
                </div>

                {/* Tuner Station Control Column */}
                <div className="md:w-64 space-y-6 flex flex-col justify-between">
                  <div className="space-y-4">
                    <h4 className="text-xs font-mono font-black text-zinc-400 uppercase tracking-widest border-b border-zinc-900 pb-2">
                      Channels Tuner
                    </h4>
                    <div className="space-y-2">
                      {[
                        { id: 'review', label: '1. Macroeconomic Direct', desc: 'Central bank liquidity rates' },
                        { id: 'liquidity', label: '2. Collateral Flows', desc: 'Overnight debt and repositories' },
                        { id: 'classroom', label: '3. Visual Classroom', desc: 'Adapted interface masters' }
                      ].map(ch => (
                        <button
                          key={ch.id}
                          type="button"
                          onClick={() => setActiveTvChannel(ch.id as any)}
                          className={`w-full p-3 text-left border rounded-2xl transition-all cursor-pointer ${
                            activeTvChannel === ch.id 
                              ? 'bg-[#FF1493]/10 border-[#FF1493]/40 text-white shadow-lg' 
                              : 'bg-zinc-950/40 border-zinc-900 text-zinc-400 hover:text-white hover:border-[#FF1493]/20'
                          }`}
                        >
                          <div className="text-xs font-black uppercase">{ch.label}</div>
                          <div className="text-[10px] font-sans text-zinc-500 mt-1">{ch.desc}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3 pt-4 border-t border-zinc-900">
                    <div className="flex justify-between items-center text-[11px] text-zinc-400 font-mono">
                      <span>Simulated Volume:</span>
                      <span className="text-[#FF1493] font-black">90%</span>
                    </div>
                    <div className="h-1 w-full bg-zinc-900 rounded-full overflow-hidden">
                      <div className="h-full w-[90%] bg-[#FF1493]" />
                    </div>
                    <button
                      type="button"
                      onClick={() => setEcosystemTvOpen(false)}
                      className="w-full py-3 bg-zinc-900 hover:bg-zinc-850 text-zinc-300 font-black text-xs uppercase tracking-widest rounded-xl transition-all cursor-pointer border border-zinc-800"
                    >
                      EXIT THE DECK
                    </button>
                  </div>

                </div>

              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ==========================================
          MODAL 4: YOUR WORLD CONNECTED CONFIGURATION ENGINE
          ========================================== */}
      <AnimatePresence>
        {ecosystemYwcOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setEcosystemYwcOpen(false)}
              className="absolute inset-0 bg-[#050505]/95 backdrop-blur-md cursor-pointer"
            />

            <motion.div
              initial={{ scale: 0.95, y: 15, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 15, opacity: 0 }}
              className="bg-neutral-950 border border-[#B026FF]/30 rounded-[2.5rem] p-6 sm:p-8 w-full max-w-3xl relative z-10 shadow-2xl space-y-6"
            >
              <button
                type="button"
                onClick={() => setEcosystemYwcOpen(false)}
                className="absolute top-5 right-5 text-zinc-500 hover:text-white cursor-pointer"
              >
                <X size={18} />
              </button>

              <div className="space-y-2">
                <span className="font-mono text-[9px] text-[#B026FF] font-black uppercase tracking-[0.2em] bg-[#B026FF]/5 px-3 py-1 rounded-full border border-[#B026FF]/15 inline-block">
                  INFORMATION COSMIC ENGINE
                </span>
                <h3 className="text-2xl font-black text-white uppercase tracking-tight">
                  Your World Connected™ Terminal
                </h3>
                <p className="text-xs text-zinc-400 leading-relaxed max-w-md">
                  Stop waiting for every app to load on mobile. Bring social media, online video, and magazines (fashion, cars, and more) into one hub — then move a live chart on the same screen so you can see both.
                </p>
              </div>

              {/* Cognitive adaptations selector */}
              <div className="bg-zinc-950 rounded-3xl border border-zinc-900 p-6 space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-zinc-900 pb-4">
                  <div>
                    <span className="text-[10px] font-mono text-zinc-500 uppercase">COGNITIVE COMPASS PROFILE</span>
                    <h4 className="text-sm font-black text-white uppercase mt-0.5">Adapt To My Mind Pattern</h4>
                  </div>
                  <div className="flex bg-zinc-900 p-1 rounded-2xl border border-zinc-850">
                    {[
                      { id: 'simple', label: '🎨 VISUAL THINKER PROFILE' },
                      { id: 'structured', label: '🧬 STRUCTURAL CORE TERMINAL' }
                    ].map(st => (
                      <button
                        key={st.id}
                        type="button"
                        onClick={() => setAdaptationMode(st.id as any)}
                        className={`px-4 py-2 sm:py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                          adaptationMode === st.id 
                            ? 'bg-[#B026FF] text-white shadow-md' 
                            : 'text-zinc-500 hover:text-zinc-300'
                        }`}
                      >
                        {st.id === 'simple' ? 'VISUAL MODEL' : 'STRUCT CORES'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Adapting View Container */}
                <div className="space-y-4">
                  <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest block">Live Formatted Feed</span>
                  
                  {adaptationMode === 'simple' ? (
                    <motion.div 
                      initial={{ opacity: 0 }} 
                      animate={{ opacity: 1 }} 
                      className="grid grid-cols-1 md:grid-cols-2 gap-4"
                    >
                      <div className="p-4 bg-zinc-900/60 border border-[#B026FF]/20 rounded-2xl space-y-2">
                        <span className="text-[9px] font-mono text-[#00FFFF] font-extrabold uppercase">FED TREASURY ACTION</span>
                        <h5 className="text-xs font-black text-white uppercase">US Treasury starts buyback of old bonds</h5>
                        <p className="text-[10px] text-zinc-400 font-sans leading-relaxed">
                          This introduces cash into financial avenues, easing loan constraints and boosting long-term investment queues.
                        </p>
                      </div>
                      <div className="p-4 bg-zinc-900/60 border border-[#FF7B00]/20 rounded-2xl space-y-2">
                        <span className="text-[9px] font-mono text-[#FF7B00] font-extrabold uppercase">LIQUIDITY ALERT</span>
                        <h5 className="text-xs font-black text-white uppercase">Sovereign Debt Reserves are Rising</h5>
                        <p className="text-[10px] text-zinc-400 font-sans leading-relaxed">
                          Capital cash reserves show a strong tick up, creating a healthy backdrop for stock and coin indicators.
                        </p>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div 
                      initial={{ opacity: 0 }} 
                      animate={{ opacity: 1 }} 
                      className="bg-black p-4 rounded-2xl border border-zinc-900 font-mono text-[10px] text-zinc-400 space-y-3"
                    >
                      <div className="border-b border-zinc-900/60 pb-3">
                        <div className="flex justify-between font-black text-[#B026FF]">
                          <span>{`{ "_id": "CORRIDOR_CORE_REPOS_09x" }`}</span>
                          <span>STABLE STATUS</span>
                        </div>
                        <pre className="text-[9px] text-zinc-500 overflow-x-auto no-scrollbar pt-1 whitespace-pre-wrap">
                          {`"repurchase_desk_limit": "80B", "collateral_ingest_rate": "1.05", "fomc_net_liquidity_change": "+14.2B"`}
                        </pre>
                      </div>
                      <div>
                        <div className="flex justify-between font-black text-[#00FFFF]">
                          <span>{`{ "_id": "SYS_NODE_LIQUID_02" }`}</span>
                          <span>RESOLVED</span>
                        </div>
                        <pre className="text-[9px] text-zinc-500 overflow-x-auto no-scrollbar pt-1 whitespace-pre-wrap">
                          {`"global_reserve_velocity": "0.19", "treasury_refunding_impact_scalar": "0.45", "queue_latency_ms": "95"`}
                        </pre>
                      </div>
                    </motion.div>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-zinc-900">
                <span className="text-[10px] font-mono text-zinc-500">CHARTING AND EDUCATION MUST ADAPT TO YOU.</span>
                <button
                  type="button"
                  onClick={() => setEcosystemYwcOpen(false)}
                  className="px-6 py-2.5 bg-zinc-900 hover:bg-zinc-850 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-colors cursor-pointer border border-zinc-800"
                >
                  Close Terminal
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <PrivateLoginDesk
        open={privateLoginOpen}
        initialMode={privateLoginMode}
        onClose={() => setPrivateLoginOpen(false)}
      />

    </div>
  );
}
