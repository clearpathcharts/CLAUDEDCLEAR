import React, { useState, useEffect, useRef, Suspense, lazy } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShieldCheck, Lock, Eye, EyeOff, UserCheck, 
  Sparkles, BookOpen, Users, X, GraduationCap
} from 'lucide-react';
import { loginAnonymously } from "../firebase";
import { verifyBoardAccess } from "../api/privateAuth";
import { TRADING_REIMAGINED_SHORT_PATH } from '../content/tradingReimaginedLanding';
import PrivateLoginDesk from './PrivateLoginDesk';
import GovernmentFinanceLinks from './GovernmentFinanceLinks';
import ChooseYourPath from './ChooseYourPath';
import { useAccessibleDialog } from '../hooks/useAccessibleDialog';
import type { AdvancedProfileId } from '../lib/advanced/profiles';
import { NEURODIVERGENT_BANNER, PATH_CARDS } from '../content/chooseYourPath';
import { navigateToDesk, type TraderDeskId } from '../lib/traderDesks';

const PublicLiveChart = lazy(() => import('./PublicLiveChart'));

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
  const boardVerifyingRef = useRef(false);
  const passcodeRef = useRef<HTMLInputElement>(null);
  const [privateLoginOpen, setPrivateLoginOpen] = useState(false);
  const [privateLoginMode, setPrivateLoginMode] = useState<'login' | 'register'>('login');
  const [activationEmail, setActivationEmail] = useState('');

  const openPrivateLogin = (mode: 'login' | 'register' = 'login') => {
    setPrivateLoginMode(mode);
    setPrivateLoginOpen(true);
  };

  const rememberPath = (profileId: AdvancedProfileId) => {
    try {
      localStorage.setItem('clearpath_current_profile_id', profileId);
    } catch {
      /* ignore quota / private mode */
    }
  };

  const enterChosenPath = (deskId: TraderDeskId) => {
    const card = PATH_CARDS.find((c) => c.id === deskId);
    rememberPath(card?.profileId ?? NEURODIVERGENT_BANNER.profileId);
    navigateToDesk(deskId);
  };

  // Activation links: /activate (or ?login=1) auto-opens the member login,
  // optionally prefilling the email (?email=member@example.com). /join opens register.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const path = window.location.pathname.toLowerCase();
      const params = new URLSearchParams(window.location.search);
      const emailParam = String(params.get('email') || '').trim();
      if (emailParam && emailParam.includes('@')) setActivationEmail(emailParam);
      const hash = window.location.hash.toLowerCase();
      if (path === '/activate' || path === '/login' || params.get('login') === '1' || hash === '#private-login') {
        openPrivateLogin('login');
      } else if (path === '/join' || params.get('register') === '1') {
        openPrivateLogin('register');
      }
    } catch {
      /* ignore malformed URLs */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Demo presentation state
  const [demoOpen, setDemoOpen] = useState(false);

  // Floating live alerts for cinematic immersive feel
  const [announcements] = useState<string[]>([
    "Private Login open — create your account with email + password.",
    "Quantitative nodes linked for real-time market data ingestion.",
    "Macroeconomic intelligence data clusters verified."
  ]);
  const [curAnnIdx, setCurAnnIdx] = useState(0);

  // Accordion state for FAQs
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  // Cycle system announcements
  useEffect(() => {
    const cycle = setInterval(() => {
      setCurAnnIdx((prev) => (prev + 1) % announcements.length);
    }, 5000);
    return () => clearInterval(cycle);
  }, [announcements.length]);

  const boardDialogRef = useRef<HTMLDivElement>(null);
  const demoDialogRef = useRef<HTMLDivElement>(null);
  const anyModalOpen =
    boardModalOpen || demoOpen || privateLoginOpen;

  useAccessibleDialog(boardDialogRef, {
    open: boardModalOpen,
    onClose: () => setBoardModalOpen(false),
    initialFocusRef: passcodeRef,
  });
  useAccessibleDialog(demoDialogRef, {
    open: demoOpen,
    onClose: () => setDemoOpen(false),
  });

  // Board passcode — verify via server (timing-safe); auto-submit at 6 digits
  useEffect(() => {
    if (passcode.length === 6) {
      void handleBoardLoginSubmit();
    } else {
      setBoardError('');
    }
  }, [passcode]);

  // Board Member credentials verification handler
  const handleBoardLoginSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (boardVerifyingRef.current || boardSuccess) return;
    setBoardError('');
    if (passcode.length < 6) {
      setBoardError('BOARD ACCESS CODE REJECTED. UNAUTHORIZED CREDENTIAL IDENTIFIER.');
      return;
    }
    boardVerifyingRef.current = true;
    try {
      await verifyBoardAccess(passcode);
      setBoardSuccess(true);
      loginAnonymously().catch((err) => {
        console.warn('Silent firebase sync lock failed, continuing with board session:', err);
      });
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (err: any) {
      console.error('Board verify error:', err);
      setBoardError(err?.message || 'BOARD ACCESS CODE REJECTED. UNAUTHORIZED CREDENTIAL IDENTIFIER.');
      boardVerifyingRef.current = false;
    }
  };

  const faqs = [
    {
      q: "What is ClearPath Trader?",
      a: "ClearPath Trader is an elite macroeconomic intelligence system built specifically to help ordinary retail users understand and navigate complex market environments. It pairs academic-level training structured on inflation, liquidity, and asset values with premium visual interfaces and autonomous tools."
    },
    {
      q: "How do I get access?",
      a: "Use Private Login on this page: enter your email and password to create your account, or sign in if you already have one. That email + password is your real access — not a waitlist activation key. Optional email updates are separate and are never a login password."
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
    <div className="relative min-h-[100dvh] w-full bg-transparent text-[#FFFFFF] font-sans selection:bg-[#FF1493] selection:text-white overflow-y-auto block">
      <a href="#main-content" className="cp-skip-link">
        Skip to main content
      </a>

      {/* GLOBAL HELPER COLOR STYLE INJECTIONS */}
      <style>{`
        :root {
          --cpt-black: #050505;
          --cpt-cyan: #00FFFF;
          --cpt-purple: #B026FF;
          --cpt-white: #FFFFFF;
          /* --cpt-pink / --cpt-orange owned by a11y prefs (High Contrast toggle) */
        }
        .text-neon-glow {
          text-shadow: 
            0 0 10px var(--cpt-pink),
            0 0 20px var(--cpt-pink),
            0 0 40px #B026FF,
            0 0 70px #00FFFF;
        }
        .border-neon {
          border-color: color-mix(in srgb, var(--cpt-pink) 30%, transparent);
          box-shadow: 0 0 15px color-mix(in srgb, var(--cpt-pink) 10%, transparent);
        }
        .border-neon:hover {
          border-color: #00FFFF;
          box-shadow: 0 0 20px rgba(0, 255, 255, 0.25);
        }
        .gradient-bg {
          background: linear-gradient(135deg, var(--cpt-pink) 0%, #B026FF 50%, #00FFFF 100%);
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
          Site links: enlarge all; lava gradient on plain tabs; Trading×AI / Encyclopedia / Education / UI Modes keep original colors.
          ========================================== */}
      <style>{`
        @keyframes authNavLavaFlow {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        /* Shared enlarge for ALL header tabs (ADHD/TBI readability) */
        .auth-nav-tab-label {
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          font-size: 15px;
          line-height: 1.25;
          white-space: nowrap;
        }
        @media (min-width: 640px) {
          .auth-nav-tab-label { font-size: 16px; letter-spacing: 0.08em; }
        }
        @media (min-width: 1024px) {
          .auth-nav-tab-label { font-size: 17px; }
        }
        /* Lava gradient — plain text tabs only (NOT Trading×AI / Encyclopedia / Education / UI Modes) */
        .auth-nav-lava-text {
          background: linear-gradient(
            105deg,
            #FF2A00 0%,
            #FF6A00 22%,
            #FF8C1A 38%,
            #FF1493 58%,
            #FF00A8 78%,
            #FF4D00 100%
          );
          background-size: 220% 100%;
          animation: authNavLavaFlow 4.5s ease-in-out infinite;
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
          color: transparent;
        }
        a.auth-nav-lava-text:hover {
          filter: brightness(1.18) saturate(1.1);
        }
        .auth-nav-tabs-row {
          display: flex;
          flex-wrap: nowrap;
          align-items: center;
          gap: 0.85rem 1.1rem;
          padding-bottom: 0.2rem;
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
          scrollbar-width: thin;
          scrollbar-color: rgba(255, 90, 0, 0.45) transparent;
          max-width: 100%;
        }
        @media (min-width: 1024px) {
          .auth-nav-tabs-row {
            flex-wrap: wrap;
            overflow-x: visible;
          }
        }
      `}</style>
      <header className="sticky top-0 z-40" aria-hidden={anyModalOpen || undefined}>
      <nav
        aria-label="Primary"
        className="bg-[#050505]/80 backdrop-blur-md border-b border-zinc-900/80 px-4 sm:px-8 py-3 flex flex-col gap-2.5"
      >
        <div className="flex items-center justify-between gap-3 min-w-0">
          <div className="flex items-center gap-2 min-w-0 shrink">
            {/* Logo element matches specified clearpath branding icon */}
            <div className="w-8 h-8 rounded-lg gradient-bg flex items-center justify-center shadow-[0_0_10px_rgba(255,20,147,0.4)] shrink-0" aria-hidden="true">
              <ShieldCheck className="text-white w-5 h-5" />
            </div>
            <span className="font-sans font-black tracking-widest text-[#FFFFFF] text-base sm:text-lg uppercase truncate">
              CLEARPATH <span className="text-[#00FFFF]">TRADER</span>
            </span>
          </div>

          {/* Sole primary CTA — pinned top-right so the link parade can never clip it */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => openPrivateLogin('login')}
              className="px-3.5 py-1.5 sm:px-5 sm:py-2 rounded-xl gradient-bg text-white text-xs font-black uppercase tracking-wider hover:shadow-[0_0_15px_rgba(255,20,147,0.45)] transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
            >
              <Lock size={12} aria-hidden="true" />
              Private Login
            </button>
          </div>
        </div>

        {/* Secondary link row — enlarge all; lava on plain tabs only; 4 featured keep cyan/magenta/indigo pills */}
        <div className="auth-nav-tabs-row" role="navigation" aria-label="Site sections">
          <a
            href={TRADING_REIMAGINED_SHORT_PATH}
            className="auth-nav-tab-label shrink-0 text-[#FF1493] hover:text-[#00FFFF] transition-colors border border-[#FF1493]/30 bg-[#FF1493]/10 px-2.5 py-1 rounded-lg"
          >
            Trading × AI
          </a>
          <a href="/about" className="auth-nav-tab-label auth-nav-lava-text shrink-0">About</a>
          <a href="/press" className="auth-nav-tab-label auth-nav-lava-text shrink-0">Press</a>
          <a href="#home" className="auth-nav-tab-label auth-nav-lava-text shrink-0">Home</a>
          <a href="#choose-path" className="auth-nav-tab-label auth-nav-lava-text shrink-0">Choose Path</a>
          <a href="#public-chart" className="auth-nav-tab-label auth-nav-lava-text shrink-0">Live Chart</a>
          <a href="/about" className="auth-nav-tab-label auth-nav-lava-text shrink-0">Why ClearPath</a>
          <a
            href="/encyclopedia"
            onClick={(e) => { e.preventDefault(); window.location.assign('/encyclopedia'); }}
            className="auth-nav-tab-label shrink-0 text-[#00FFFF] hover:text-[#FF1493] transition-colors flex items-center gap-1.5 font-sans border border-[#00FFFF]/20 bg-[#00FFFF]/5 px-2.5 py-1 rounded-lg"
          >
            <BookOpen size={15} className="text-[#00FFFF]" aria-hidden="true" /> Encyclopedia of Finance
          </a>
          <a
            href="/education"
            onClick={(e) => { e.preventDefault(); window.location.assign('/education'); }}
            className="auth-nav-tab-label shrink-0 text-[#B026FF] hover:text-[#00FFFF] transition-colors flex items-center gap-1.5 font-sans border border-[#B026FF]/20 bg-[#B026FF]/5 px-2.5 py-1 rounded-lg"
          >
            <GraduationCap size={15} className="text-[#B026FF]" aria-hidden="true" /> ClearPath Education
          </a>
          <a
            href="/ui"
            className="auth-nav-tab-label shrink-0 text-[#B026FF] hover:text-[#00FFFF] transition-colors flex items-center gap-1.5 font-sans border border-[#B026FF]/20 bg-[#B026FF]/5 px-2.5 py-1 rounded-lg"
          >
            UI Modes
          </a>
          <a href="/learn" className="auth-nav-tab-label auth-nav-lava-text shrink-0">Learn</a>
          <a href="/guides" className="auth-nav-tab-label auth-nav-lava-text shrink-0">Guides</a>
          <a href="/faq" className="auth-nav-tab-label auth-nav-lava-text shrink-0">FAQ</a>
        </div>
      </nav>
      </header>

      <main
        id="main-content"
        tabIndex={-1}
        aria-hidden={anyModalOpen || undefined}
        className="relative outline-none"
      >

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
          <div className="hidden md:flex items-center gap-6 shrink-0 font-mono text-zinc-500 text-[9px] font-bold tracking-widest uppercase">
            <span>DXY INDEX: <strong className="text-zinc-300">104.82</strong></span>
            <span>BTC/USD: <strong className="text-zinc-300">$77,979.87</strong></span>
            <span>USD/JPY: <strong className="text-zinc-300">156.42</strong></span>
          </div>
        </div>
      </div>

      <ChooseYourPath onEnter={enterChosenPath} />

      <Suspense
        fallback={
          <section
            id="public-chart"
            className="relative w-full min-h-[85vh] px-2 sm:px-4 pb-10 z-20"
            aria-label="Loading live chart"
          />
        }
      >
        <PublicLiveChart />
      </Suspense>

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

        {/* Brand hero — visual title only. Document <h1> lives in index.html for Bing (one H1 rule). */}
        <p className="hero-title text-[40px] sm:text-[64px] md:text-[84px] font-black tracking-tighter text-white leading-none uppercase max-w-5xl select-none text-neon-glow font-sans mt-2">
          CLEARPATH TRADER
        </p>

        {/* Glassmorphic Subheadline Header */}
        <h2 className="hero-subtitle text-lg sm:text-2xl text-[#00FFFF] font-mono tracking-widest uppercase mt-6 mb-4 max-w-3xl text-neon-glow leading-normal font-bold">
          THERE IS NO SUCH THING AS ONE CHART FOR EVERY MIND.
        </h2>

        {/* Interactive Buttons Container */}
        <div className="flex flex-col md:flex-row items-center gap-4 mt-10 w-full max-w-3xl mx-auto justify-center z-30">
          <button
            type="button"
            onClick={() => openPrivateLogin('register')}
            className="cpt-cta-gradient w-full md:w-auto px-6 py-4 text-xs font-black uppercase tracking-widest rounded-2xl shadow-[0_0_20px_rgba(176,38,255,0.4)] hover:shadow-[0_0_30px_rgba(176,38,255,0.6)] hover:scale-[1.02] transition-colors cursor-pointer text-center whitespace-nowrap"
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
              PRIVATE LOGIN — EMAIL + PASSWORD
            </div>
            <p className="text-[10px] text-[#FF1493] font-bold uppercase tracking-wider mt-1">
              Create your account · unlock your own terminal
            </p>
          </div>
        </motion.div>

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
                  id={`faq-trigger-${i}`}
                  aria-expanded={openFaq === i}
                  aria-controls={`faq-panel-${i}`}
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full py-5 px-6 flex items-center justify-between text-left hover:bg-neutral-900/20 cursor-pointer focus-visible:bg-neutral-900/30"
                >
                  <span className="text-sm font-bold text-[#FF4500] uppercase tracking-wide text-shadow-[0_0_8px_rgba(255,69,0,0.5)]">
                    {f.q}
                  </span>
                  <span className="text-[#FF4500] text-lg font-bold" aria-hidden="true">
                    {openFaq === i ? '−' : '+'}
                  </span>
                </button>
                <AnimatePresence>
                  {openFaq === i && (
                    <motion.div
                      id={`faq-panel-${i}`}
                      role="region"
                      aria-labelledby={`faq-trigger-${i}`}
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

      </main>

      {/* ==========================================
          11. LEGAL DISCLAIMER FOOTER
          ========================================== */}
      <footer
        className="relative bg-transparent border-t border-zinc-900/40 py-12 px-4 sm:px-8 z-20 text-center"
        aria-hidden={anyModalOpen || undefined}
      >
        <div className="max-w-5xl mx-auto space-y-6">
          <div className="flex items-center justify-center gap-2">
            <span className="font-sans font-black tracking-widest text-[#FFFFFF] text-sm uppercase">
              CLEARPATH <span className="text-[#00FFFF]">TRADER</span>
            </span>
          </div>
          <nav
            className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[10px] font-mono uppercase tracking-widest mb-2"
            aria-label="Site and accessibility links"
          >
            <a
              href="/accessibility"
              className="text-[#00FFFF] hover:text-white transition-colors font-bold"
            >
              Accessibility · WCAG
            </a>
            <a href="/ui" className="text-zinc-300 hover:text-[#B026FF] transition-colors">
              Accessible UI Modes
            </a>
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
            <a href="/education" className="text-zinc-400 hover:text-[#B026FF] transition-colors">
              Education
            </a>
            <a href="/tools/position-size" className="text-zinc-400 hover:text-[#00FFFF] transition-colors">
              Position Size
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
          <GovernmentFinanceLinks />
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
              aria-hidden="true"
            />

            <motion.div
              ref={boardDialogRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby="board-dialog-title"
              tabIndex={-1}
              initial={{ scale: 0.95, y: 15, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 15, opacity: 0 }}
              className="bg-neutral-950 border border-zinc-800 rounded-[2.5rem] p-6 sm:p-8 w-full max-w-md relative z-10 shadow-2xl space-y-6 outline-none"
            >
              {/* Close Button Trigger */}
              <button
                type="button"
                onClick={() => setBoardModalOpen(false)}
                aria-label="Close board verification"
                className="absolute top-5 right-5 text-zinc-500 hover:text-white transition-colors cursor-pointer"
              >
                <X size={18} aria-hidden="true" />
              </button>

              <div className="text-center space-y-2">
                <span className="font-mono text-[9px] text-[#B026FF] font-black uppercase tracking-[0.2em] bg-[#B026FF]/5 px-3 py-1 rounded-full border border-[#B026FF]/15 inline-block">
                  BOARD CREDENTIAL AUDIT
                </span>
                <h3 id="board-dialog-title" className="text-xl font-black text-white uppercase tracking-wide">
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
                      aria-label={showPasscode ? 'Hide passcode' : 'Show passcode'}
                      aria-pressed={showPasscode}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-zinc-400 transition-colors cursor-pointer"
                    >
                      {showPasscode ? <EyeOff size={16} aria-hidden="true" /> : <Eye size={16} aria-hidden="true" />}
                    </button>
                  </div>
                </div>

                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={boardSuccess}
                    className="cpt-cta-gradient w-full py-4 font-black uppercase tracking-widest text-xs rounded-xl shadow-lg cursor-pointer"
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
              aria-hidden="true"
            />

            <motion.div
              ref={demoDialogRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby="demo-dialog-title"
              tabIndex={-1}
              initial={{ scale: 0.95, y: 15, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 15, opacity: 0 }}
              className="bg-neutral-950 border border-zinc-800 rounded-[2.5rem] p-6 sm:p-8 w-full max-w-2xl relative z-10 shadow-2xl space-y-6 outline-none"
            >
              <button
                type="button"
                onClick={() => setDemoOpen(false)}
                aria-label="Close showcase"
                className="absolute top-5 right-5 text-zinc-500 hover:text-white cursor-pointer"
              >
                <X size={18} aria-hidden="true" />
              </button>

              <div className="space-y-1">
                <span className="font-mono text-[9px] text-[#00FFFF] font-black uppercase tracking-[0.2em] bg-[#00FFFF]/5 px-3 py-1 rounded-full border border-[#00FFFF]/15 inline-block">
                  ACADEMIC PREVIEW DECK
                </span>
                <h3 id="demo-dialog-title" className="text-xl font-black text-white uppercase tracking-wider">
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
                  className="cpt-cta-gradient px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all hover:scale-[1.01] cursor-pointer"
                >
                  Create Private Account
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <PrivateLoginDesk
        open={privateLoginOpen}
        initialMode={privateLoginMode}
        initialEmail={activationEmail}
        onClose={() => setPrivateLoginOpen(false)}
      />

    </div>
  );
}
